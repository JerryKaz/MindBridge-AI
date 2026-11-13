import type { ChatMessage, PipelineTrace, SupportResource } from '@mindbridge/shared';
import { notFound } from '../../common/errors.js';
import { logger } from '../../common/logger.js';
import { ContextManager } from './context-manager.service.js';
import { EmotionAnalyzer } from './emotion-analyzer.service.js';
import { IntentClassifier } from './intent-classifier.service.js';
import type { AIProvider } from './providers/ai-provider.interface.js';
import { ResponseGenerator } from './response-generator.service.js';
import { ResponseStrategySelector } from './response-strategy.service.js';
import { ResponseValidator } from './response-validator.service.js';
import { SafetyEngine } from './safety-engine.service.js';
import {
  CRISIS_RESOURCE_CATEGORIES,
  CRISIS_SUGGESTIONS,
  REFERRAL_RESOURCE_CATEGORIES,
  SUGGESTIONS,
  crisisReply,
  needsResources,
  safeFallback,
} from './safety-pathway.js';
import type { ConversationContext, ConversationStore, MessageInput } from './types.js';
import { MESSAGE_MAX_LENGTH } from '@mindbridge/shared';

export interface ProcessResult {
  studentMessage: ChatMessage;
  reply: ChatMessage;
  trace: PipelineTrace;
}

export interface OrchestratorDeps {
  provider: AIProvider;
  store: ConversationStore;
  intentClassifier?: IntentClassifier;
  emotionAnalyzer?: EmotionAnalyzer;
  safetyEngine?: SafetyEngine;
  strategySelector?: ResponseStrategySelector;
  validator?: ResponseValidator;
  now?: () => number;
}

/**
 * Coordinates the 9-stage pipeline. Each stage is its own class so it can be
 * unit-tested and replaced independently; the orchestrator holds no
 * intelligence of its own, only ordering and the safety invariants:
 *
 *  - the safety engine runs on every message, independently of generation;
 *  - POTENTIAL_IMMEDIATE_DANGER bypasses the LLM entirely (deterministic pathway);
 *  - every generated reply is validated; failures are replaced by safe fallbacks;
 *  - provider outages degrade to safe fallbacks, never to an error for a student in distress.
 */
export class AIOrchestrator {
  private readonly intentClassifier: IntentClassifier;
  private readonly emotionAnalyzer: EmotionAnalyzer;
  private readonly safetyEngine: SafetyEngine;
  private readonly strategySelector: ResponseStrategySelector;
  private readonly validator: ResponseValidator;
  private readonly contextManager: ContextManager;
  private readonly generator: ResponseGenerator;
  private readonly now: () => number;

  constructor(private readonly deps: OrchestratorDeps) {
    this.intentClassifier = deps.intentClassifier ?? new IntentClassifier();
    this.emotionAnalyzer = deps.emotionAnalyzer ?? new EmotionAnalyzer();
    this.safetyEngine = deps.safetyEngine ?? new SafetyEngine();
    this.strategySelector = deps.strategySelector ?? new ResponseStrategySelector();
    this.validator = deps.validator ?? new ResponseValidator();
    this.contextManager = new ContextManager(deps.store);
    this.generator = new ResponseGenerator(deps.provider);
    this.now = deps.now ?? Date.now;
  }

  async processMessage(input: MessageInput): Promise<ProcessResult> {
    const started = this.now();
    const { store, provider } = this.deps;

    // 1. Input validation (schema + rate limit run in HTTP middleware; ownership here)
    const content = input.content.trim();
    if (!content || content.length > MESSAGE_MAX_LENGTH) throw new Error('Invalid message length');
    const conversation = await store.getOwnedConversation(input.conversationId, input.studentId);
    if (!conversation) throw notFound('Conversation');

    const recentMessages = await this.contextManager.getRecent(input.conversationId);

    // Optional model-based analysis pass (feeds stages 2–4; failures return null)
    const analysis = await provider.analyze(content);

    // 2. Intent classification
    const intent = this.intentClassifier.classify(content, analysis);
    // 3. Emotional signal analysis
    const emotions = this.emotionAnalyzer.analyze(content, analysis);
    // 4. Independent safety assessment
    const safety = this.safetyEngine.assess({ message: content, analysis, recentMessages, conversation });

    // 5. Context management (only permitted context)
    const permitted = await this.contextManager.build(conversation, input.studentId, recentMessages);
    const ctx: ConversationContext = { currentMessage: content, ...permitted, intent, emotions, safety };

    // 6. Strategy selection
    const { strategy } = this.strategySelector.select(ctx);

    // Resources for referral / crisis — VERIFIED only
    let resources: SupportResource[] = [];
    if (needsResources(safety.level, strategy)) {
      resources = await store.getVerifiedResources(
        input.studentId,
        safety.level === 'POTENTIAL_IMMEDIATE_DANGER' ? CRISIS_RESOURCE_CATEGORIES : REFERRAL_RESOURCE_CATEGORIES,
      );
    }

    // 7 + 8. Generation and validation
    let replyText: string;
    let validation = { passed: true, issues: [] as string[] };
    let usedFallback = false;
    let providerName = provider.name;

    if (strategy === 'CRISIS_RESPONSE') {
      replyText = crisisReply(resources);
      providerName = 'safety-pathway';
    } else {
      try {
        replyText = (await this.generator.generate(ctx, strategy)).text;
        validation = this.validator.validate(replyText, { safetyLevel: safety.level, allowedResources: resources });
        if (!validation.passed) {
          usedFallback = true;
          replyText = safeFallback(strategy);
          logger.warn({ issues: validation.issues, strategy }, 'AI response failed validation; using fallback');
        }
      } catch (err) {
        usedFallback = true;
        validation = { passed: false, issues: ['provider_error'] };
        replyText = safeFallback(strategy);
        logger.error({ err: err instanceof Error ? err.message : err }, 'AI provider failed; using fallback');
      }
    }

    const suggestions = strategy === 'CRISIS_RESPONSE' ? CRISIS_SUGGESTIONS : SUGGESTIONS[strategy] ?? [];

    // 9. Persistence and response
    const saved = await store.saveExchange({
      studentId: input.studentId,
      conversationId: input.conversationId,
      studentContent: content,
      replyContent: replyText,
      safetyLevel: safety.level,
      strategy,
      intent: intent.label,
      resourceIds: resources.map((r) => r.id),
      suggestions,
    });

    if (safety.level !== 'STANDARD') {
      await store.recordSafetyEvent({
        studentId: input.studentId,
        conversationId: input.conversationId,
        level: safety.level,
        sources: safety.sources,
        actionTaken: strategy === 'CRISIS_RESPONSE' ? 'crisis_pathway_with_resources' : 'referral_with_resources',
      });
    }

    const latencyMs = this.now() - started;
    const trace: PipelineTrace = {
      intent: { label: intent.label, confidence: intent.confidence },
      signals: emotions.signals.slice(0, 4).map((s) => ({ signal: s.signal, score: s.score })),
      safety: { level: safety.level, sources: safety.sources },
      strategy,
      validation: { passed: validation.passed, issues: validation.issues, usedFallback },
      provider: providerName,
      latencyMs,
    };

    // Metadata only; never blocks the student's reply.
    store
      .recordInteraction({
        conversationId: input.conversationId,
        intent: intent.label,
        intentConfidence: intent.confidence,
        signals: emotions.signals.map((s) => s.signal),
        safetyLevel: safety.level,
        strategy,
        provider: providerName,
        validationPassed: validation.passed,
        validationIssues: validation.issues,
        usedFallback,
        latencyMs,
      })
      .catch((err: unknown) => logger.error({ err }, 'Failed to record AI interaction'));

    return {
      studentMessage: { id: saved.studentMessage.id, role: 'student', content, createdAt: saved.studentMessage.createdAt.toISOString() },
      reply: {
        id: saved.reply.id,
        role: 'assistant',
        content: replyText,
        createdAt: saved.reply.createdAt.toISOString(),
        suggestions,
        ...(resources.length || safety.level !== 'STANDARD' ? { safety: { level: safety.level, resources } } : {}),
      },
      trace,
    };
  }
}
