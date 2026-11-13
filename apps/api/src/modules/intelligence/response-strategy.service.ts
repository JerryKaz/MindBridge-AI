import type { ResponseStrategy } from '@mindbridge/shared';
import { containsTerm, normalizeText } from './text-normalizer.js';
import type { ConversationContext, StrategyDecision } from './types.js';

const ASKS_FOR_HELP = [
  'how do i', 'how can i', 'what should i', 'what can i', 'any tips', 'tips', 'advice', 'help me', 'what do i do',
  'how to', 'ways to', 'suggest', 'recommend', 'any ideas',
];
const WANTS_CALMING = ['calm down', 'calm', 'breathe', 'breathing', 'panic', 'panicking', 'relax', 'heart racing', 'ground'];
const ADVICE_STRATEGIES: ResponseStrategy[] = ['PRACTICAL_GUIDANCE', 'COPING_EXERCISE'];

/**
 * Stage 6 — choose HOW to respond. The safety state is applied first and
 * cannot be overridden by any later rule.
 */
export class ResponseStrategySelector {
  select(ctx: ConversationContext): StrategyDecision {
    const { safety, intent, emotions } = ctx;
    if (safety.level === 'POTENTIAL_IMMEDIATE_DANGER') {
      return { strategy: 'CRISIS_RESPONSE', rationale: 'Safety engine flagged potential immediate danger' };
    }
    if (safety.level === 'ELEVATED_CONCERN') {
      return { strategy: 'HUMAN_SUPPORT_REFERRAL', rationale: 'Elevated concern: validate and connect to human support' };
    }
    if (intent.label === 'CRISIS_RELATED') {
      return { strategy: 'HUMAN_SUPPORT_REFERRAL', rationale: 'Crisis-related topic without personal risk indicators' };
    }

    const text = normalizeText(ctx.currentMessage);
    const words = text.split(' ').filter(Boolean).length;
    const asksForHelp = ASKS_FOR_HELP.some((t) => containsTerm(text, t));
    const wantsCalming = WANTS_CALMING.some((t) => containsTerm(text, t));
    const lastStrategies = ctx.recentMessages
      .filter((m) => m.role === 'assistant' && m.strategy)
      .slice(-2)
      .map((m) => m.strategy);
    const justAdvised = lastStrategies.some((s) => s && ADVICE_STRATEGIES.includes(s));
    const top = emotions.signals[0]?.signal;

    if (words <= 4 && (intent.label === 'OTHER' || intent.confidence < 0.5) && emotions.signals.length === 0 && !asksForHelp) {
      return { strategy: 'GENTLE_CLARIFICATION', rationale: 'Short, ambiguous message — invite the student to say more' };
    }
    if (wantsCalming && (top === 'ANXIETY' || top === 'STRESS' || top === 'FEAR' || intent.label === 'ANXIETY')) {
      return { strategy: 'COPING_EXERCISE', rationale: 'Acute anxiety/stress with a request to calm down' };
    }
    if (asksForHelp && !justAdvised) {
      return { strategy: 'PRACTICAL_GUIDANCE', rationale: 'Student explicitly asked for guidance' };
    }
    if (asksForHelp && justAdvised) {
      return { strategy: 'GUIDED_REFLECTION', rationale: 'Advice already given — help the student apply it to their situation' };
    }
    const listeningTopics = ['LONELINESS', 'EMOTIONAL_SUPPORT', 'RELATIONSHIP_ISSUE'];
    if (emotions.negativeIntensity >= 0.85 && !listeningTopics.includes(intent.label)) {
      return { strategy: 'EMOTIONAL_VALIDATION', rationale: 'Strong negative emotion — validate before anything else' };
    }
    switch (intent.label) {
      case 'LONELINESS':
      case 'EMOTIONAL_SUPPORT':
      case 'RELATIONSHIP_ISSUE':
        return { strategy: 'EMPATHETIC_LISTENING', rationale: `Listening first for ${intent.label.toLowerCase()}` };
      case 'SELF_REFLECTION':
      case 'MOTIVATION':
        return { strategy: 'GUIDED_REFLECTION', rationale: 'Support the student to reflect and find their own next step' };
      case 'ANXIETY':
      case 'ACADEMIC_STRESS':
        return { strategy: 'EMOTIONAL_VALIDATION', rationale: 'Acknowledge the pressure before problem-solving' };
      case 'GENERAL_WELLNESS':
        return { strategy: 'PRACTICAL_GUIDANCE', rationale: 'General wellness question' };
      default:
        return { strategy: 'EMPATHETIC_LISTENING', rationale: 'Default: listen and understand' };
    }
  }
}
