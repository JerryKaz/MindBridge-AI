import type { Intent, ResponseStrategy } from '@mindbridge/shared';
import type { AIAnalysis, AIResponse, ConversationContext } from '../types.js';
import type { AIProvider } from './ai-provider.interface.js';

/**
 * Offline provider: deterministic, template-based replies selected by strategy
 * and topic. Used for local development, automated tests and as a resilience
 * fallback when no LLM is configured. It is intentionally simple and honest —
 * it never pretends to understand more than the pipeline detected.
 */
const OPENERS: Partial<Record<Intent, string[]>> = {
  ACADEMIC_STRESS: [
    'It sounds like the academic pressure is really piling up right now.',
    'Exams and deadlines can make everything feel urgent at once.',
    "That's a lot of school pressure to be carrying.",
  ],
  ANXIETY: [
    'It sounds like your mind has been racing and it is hard to settle.',
    'Feeling that anxious is exhausting, and it makes sense you want some relief.',
  ],
  LONELINESS: [
    'Feeling alone, especially on a busy campus, can really hurt.',
    "It's hard when it feels like there's no one around who really gets it.",
  ],
  RELATIONSHIP_ISSUE: [
    'Things with people we care about can weigh on us more than almost anything else.',
    'It sounds like this situation with someone close to you has been painful.',
  ],
  MOTIVATION: [
    "Losing motivation happens to a lot of students, and it doesn't mean you're lazy.",
    'Feeling stuck can be really frustrating, especially when you want to get going.',
  ],
  SELF_REFLECTION: [
    "It takes courage to look at yourself honestly like this.",
    "It sounds like you've been thinking deeply about yourself lately.",
  ],
  GENERAL_WELLNESS: ["It's great that you're thinking about looking after yourself."],
  EMOTIONAL_SUPPORT: [
    "I'm really glad you reached out. It sounds like things have been heavy.",
    'Thank you for sharing that with me. That sounds hard.',
  ],
};
const GENERIC_OPENERS = ["Thank you for telling me that.", "I'm here and I'm listening."];

const BODIES: Record<ResponseStrategy, string[]> = {
  EMPATHETIC_LISTENING: [
    'What has been weighing on you the most?',
    'Would you like to tell me a bit more about what happened?',
    'How has this been affecting you day to day?',
  ],
  EMOTIONAL_VALIDATION: [
    'Anyone in your position could feel this way — your feelings make sense. What feels heaviest right now?',
    "It's okay to feel like this; it doesn't mean you're failing. Which part is hardest at the moment?",
  ],
  GENTLE_CLARIFICATION: [
    "I'd like to understand better — could you tell me a little more about what's going on?",
    "I'm here. What's been on your mind?",
  ],
  GUIDED_REFLECTION: [
    'When you have felt a bit like this before, what helped even slightly?',
    'If a good friend were in your shoes, what might you gently tell them?',
    'What would one small step that feels manageable look like for you today?',
  ],
  COPING_EXERCISE: [
    "Let's try something together: breathe in slowly through your nose for 4 counts, then breathe out gently for 6. Let's do that five times. How do you feel afterwards?",
    "Let's try grounding: notice 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell and 1 you can taste. Take your time — what did you notice?",
  ],
  PRACTICAL_GUIDANCE: [
    "A few ideas that often help:\n• Break the work into small 25-minute blocks with short breaks.\n• Pick the one task with the nearest deadline and start there.\n• Protect your sleep — tired brains find everything harder.\nWhich of these feels doable for you?",
    "Some things that may help:\n• Write everything down so it stops circling in your head.\n• Choose one small next step, not the whole mountain.\n• Talk to a lecturer or course mate if something is unclear.\nWhat do you think you'll try first?",
  ],
  HUMAN_SUPPORT_REFERRAL: [
    "What you're feeling matters, and you don't have to carry it alone. It could really help to talk with someone you trust or a counsellor — I've listed some support options below. How are you feeling right now?",
    "I'm glad you told me. This sounds like a lot to hold by yourself, and talking to a trained person can make a real difference. The support options below are there for you. Is there someone you trust you could reach out to today?",
  ],
  CRISIS_RESPONSE: [''],
};

export class RuleBasedProvider implements AIProvider {
  readonly name = 'rule-based';

  async analyze(): Promise<AIAnalysis | null> {
    return null; // no model-based classification offline; deterministic detectors handle it
  }

  async generateResponse(ctx: ConversationContext, strategy: ResponseStrategy): Promise<AIResponse> {
    const previous = new Set(ctx.recentMessages.filter((m) => m.role === 'assistant').map((m) => m.content));
    const openers = OPENERS[ctx.intent.label] ?? GENERIC_OPENERS;
    const pick = (options: string[], seed: number) => {
      const fresh = options.filter((o) => ![...previous].some((p) => p.includes(o)));
      const pool = fresh.length ? fresh : options;
      return pool[seed % pool.length]!;
    };
    const seed = ctx.recentMessages.length + ctx.currentMessage.length;
    const opener = strategy === 'GENTLE_CLARIFICATION' ? '' : pick(openers, seed);
    const body = pick(BODIES[strategy], seed);
    return { text: [opener, body].filter(Boolean).join(' ') };
  }
}
