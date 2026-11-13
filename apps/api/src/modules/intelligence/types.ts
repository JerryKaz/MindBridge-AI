import type {
  EmotionalSignal,
  Intent,
  ResponseStrategy,
  SafetyLevel,
  SupportCategory,
  SupportResource,
} from '@mindbridge/shared';

export interface MessageInput {
  studentId: string;
  conversationId: string;
  content: string;
}

export interface IntentResult {
  label: Intent;
  confidence: number;
  scores: Partial<Record<Intent, number>>;
  source: 'lexicon' | 'ensemble';
}

export interface SignalScore {
  signal: EmotionalSignal;
  score: number;
}

export interface EmotionResult {
  signals: SignalScore[];
  /** Overall negative-affect intensity 0..1 */
  negativeIntensity: number;
}

export interface SafetyAssessment {
  level: SafetyLevel;
  /** Which detectors fired, e.g. "rule:explicit_self_harm", "classifier:llm". No message text. */
  sources: string[];
  promptInjectionSuspected: boolean;
}

/** Structured output of an LLM-backed analysis pass (optional, provider-dependent). */
export interface AIAnalysis {
  intent: { label: Intent; confidence: number } | null;
  signals: SignalScore[];
  risk: SafetyLevel | null;
}

export interface ContextMessage {
  role: 'student' | 'assistant';
  content: string;
  strategy?: ResponseStrategy | null;
}

export interface ConversationContext {
  currentMessage: string;
  recentMessages: ContextMessage[];
  /** Topic labels discussed earlier in this session (summary, not raw text). */
  sessionTopics: Intent[];
  /** Student-approved memories, only when consent is granted. */
  memories: string[];
  intent: IntentResult;
  emotions: EmotionResult;
  safety: SafetyAssessment;
}

export interface StrategyDecision {
  strategy: ResponseStrategy;
  rationale: string;
}

export interface AIResponse {
  text: string;
}

export interface ValidationResult {
  passed: boolean;
  issues: string[];
}

export interface StoredConversation {
  id: string;
  recentTopics: Intent[];
  highestSafetyLevel: SafetyLevel;
  messageCount: number;
}

/**
 * Persistence port used by the orchestrator. The Mongo implementation lives in
 * conversations/conversation.store.ts; tests use an in-memory implementation.
 */
export interface ConversationStore {
  getOwnedConversation(conversationId: string, studentId: string): Promise<StoredConversation | null>;
  getRecentMessages(conversationId: string, limit: number): Promise<ContextMessage[]>;
  getApprovedMemories(studentId: string): Promise<string[]>;
  getVerifiedResources(studentId: string, categories: SupportCategory[]): Promise<SupportResource[]>;
  saveExchange(input: SaveExchangeInput): Promise<SavedExchange>;
  recordSafetyEvent(input: {
    studentId: string;
    conversationId: string;
    level: SafetyLevel;
    sources: string[];
    actionTaken: string;
  }): Promise<void>;
  recordInteraction(input: InteractionRecord): Promise<void>;
}

export interface SaveExchangeInput {
  studentId: string;
  conversationId: string;
  studentContent: string;
  replyContent: string;
  safetyLevel: SafetyLevel;
  strategy: ResponseStrategy;
  intent: Intent;
  resourceIds: string[];
  suggestions: string[];
}

export interface SavedExchange {
  studentMessage: { id: string; createdAt: Date };
  reply: { id: string; createdAt: Date };
}

export interface InteractionRecord {
  conversationId: string;
  intent: Intent;
  intentConfidence: number;
  signals: EmotionalSignal[];
  safetyLevel: SafetyLevel;
  strategy: ResponseStrategy;
  provider: string;
  validationPassed: boolean;
  validationIssues: string[];
  usedFallback: boolean;
  latencyMs: number;
}
