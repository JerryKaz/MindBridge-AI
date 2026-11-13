import type { ResponseStrategy, SafetyLevel, SupportCategory, SupportResource } from '@mindbridge/shared';

/**
 * Deterministic, reviewed copy for the safety pathway and validation fallbacks.
 * Crisis replies NEVER come from the LLM. Contact details only ever come from
 * VERIFIED support resources in the database — none are hard-coded here.
 */
export const CRISIS_RESOURCE_CATEGORIES: SupportCategory[] = ['EMERGENCY', 'CRISIS_LINE', 'UNIVERSITY_COUNSELLING'];
export const REFERRAL_RESOURCE_CATEGORIES: SupportCategory[] = ['UNIVERSITY_COUNSELLING', 'CRISIS_LINE', 'MENTAL_HEALTH_PROFESSIONAL', 'SUPPORT_ORGANIZATION'];

export function crisisReply(resources: SupportResource[]): string {
  const lines = [
    "I'm really glad you told me, and I'm taking what you said seriously. You deserve support right now, and you don't have to go through this alone.",
    'If you might act on these thoughts or you are in danger, please contact emergency services or go to the nearest hospital emergency department now.',
    'It can also help to reach out to someone you trust — a friend, family member, hall tutor or roommate — and let them know you need them to be with you.',
  ];
  lines.push(
    resources.length
      ? 'These verified services can help — you can tap to contact them:'
      : "I don't have a verified local contact to show you yet, so please reach out to your campus counselling service, a doctor, or someone close to you as soon as you can.",
  );
  lines.push('Are you somewhere safe right now?');
  return lines.join('\n\n');
}

export const CRISIS_SUGGESTIONS = ["I'm safe right now", "I'm not safe", 'Help me reach out to someone'];

const FALLBACKS: Record<ResponseStrategy, string> = {
  EMPATHETIC_LISTENING: "Thank you for sharing that with me. I'm here to listen — would you like to tell me more about what's been going on?",
  EMOTIONAL_VALIDATION: "That sounds really hard, and it makes sense that you feel this way. What feels heaviest for you right now?",
  GENTLE_CLARIFICATION: "I'd like to understand better. Could you tell me a little more about what's on your mind?",
  GUIDED_REFLECTION: 'What do you think would help you feel even a little bit better right now?',
  COPING_EXERCISE: "Let's slow things down together. Breathe in gently for 4 counts, then out for 6. Try that a few times, and let me know how you feel.",
  PRACTICAL_GUIDANCE: "Let's take this one step at a time. What's the one thing that feels most pressing right now?",
  HUMAN_SUPPORT_REFERRAL: "What you're going through matters, and you don't have to handle it alone. Talking to someone you trust or a counsellor can really help — the support options below are there for you. How are you feeling right now?",
  CRISIS_RESPONSE: crisisReply([]),
};

export const safeFallback = (strategy: ResponseStrategy): string => FALLBACKS[strategy];

export const SUGGESTIONS: Partial<Record<ResponseStrategy, string[]>> = {
  EMPATHETIC_LISTENING: ['Tell me more', 'I just need to vent'],
  EMOTIONAL_VALIDATION: ["It's mostly school", "It's something personal"],
  COPING_EXERCISE: ["Let's do it together", 'Try something else'],
  PRACTICAL_GUIDANCE: ['Help me plan my week', 'I need a study break idea'],
  GUIDED_REFLECTION: ["I'm not sure", 'Something that helped before'],
  HUMAN_SUPPORT_REFERRAL: ['Show me support options', "I'd like to keep talking"],
  GENTLE_CLARIFICATION: ["I'm stressed about school", "I'm feeling low"],
};

export const needsResources = (level: SafetyLevel, strategy: ResponseStrategy) =>
  level !== 'STANDARD' || strategy === 'HUMAN_SUPPORT_REFERRAL';
