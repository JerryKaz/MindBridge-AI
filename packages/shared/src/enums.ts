/**
 * Canonical enumerations shared by the API, mobile app and admin dashboard.
 * Arrays are `as const` so they can drive both Zod schemas and TS union types.
 */

export const USER_ROLES = ['STUDENT', 'ADMIN', 'SUPER_ADMIN'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ACCOUNT_STATUSES = ['ACTIVE', 'DEACTIVATED'] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export const INTENTS = [
  'EMOTIONAL_SUPPORT',
  'ACADEMIC_STRESS',
  'ANXIETY',
  'LONELINESS',
  'RELATIONSHIP_ISSUE',
  'MOTIVATION',
  'SELF_REFLECTION',
  'GENERAL_WELLNESS',
  'CRISIS_RELATED',
  'OTHER',
] as const;
export type Intent = (typeof INTENTS)[number];

export const EMOTIONAL_SIGNALS = [
  'FRUSTRATION',
  'ANXIETY',
  'SADNESS',
  'LONELINESS',
  'FEAR',
  'STRESS',
  'SELF_DOUBT',
  'HOPELESSNESS',
  'POSITIVE',
] as const;
export type EmotionalSignal = (typeof EMOTIONAL_SIGNALS)[number];

/** Ordered from least to most severe — the index is used for comparisons. */
export const SAFETY_LEVELS = ['STANDARD', 'ELEVATED_CONCERN', 'POTENTIAL_IMMEDIATE_DANGER'] as const;
export type SafetyLevel = (typeof SAFETY_LEVELS)[number];

export const safetySeverity = (level: SafetyLevel): number => SAFETY_LEVELS.indexOf(level);
export const maxSafetyLevel = (...levels: SafetyLevel[]): SafetyLevel =>
  levels.reduce<SafetyLevel>((a, b) => (safetySeverity(b) > safetySeverity(a) ? b : a), 'STANDARD');

export const RESPONSE_STRATEGIES = [
  'EMPATHETIC_LISTENING',
  'EMOTIONAL_VALIDATION',
  'GENTLE_CLARIFICATION',
  'GUIDED_REFLECTION',
  'COPING_EXERCISE',
  'PRACTICAL_GUIDANCE',
  'HUMAN_SUPPORT_REFERRAL',
  'CRISIS_RESPONSE',
] as const;
export type ResponseStrategy = (typeof RESPONSE_STRATEGIES)[number];

export const MOODS = [
  'HAPPY',
  'CALM',
  'MOTIVATED',
  'NEUTRAL',
  'STRESSED',
  'ANXIOUS',
  'SAD',
  'OVERWHELMED',
  'FRUSTRATED',
] as const;
export type Mood = (typeof MOODS)[number];

export const MOOD_LABELS: Record<Mood, { label: string; emoji: string }> = {
  HAPPY: { label: 'Happy', emoji: '😊' },
  CALM: { label: 'Calm', emoji: '😌' },
  MOTIVATED: { label: 'Motivated', emoji: '💪' },
  NEUTRAL: { label: 'Neutral', emoji: '😐' },
  STRESSED: { label: 'Stressed', emoji: '😣' },
  ANXIOUS: { label: 'Anxious', emoji: '😟' },
  SAD: { label: 'Sad', emoji: '😢' },
  OVERWHELMED: { label: 'Overwhelmed', emoji: '😵' },
  FRUSTRATED: { label: 'Frustrated', emoji: '😤' },
};

export const WELLNESS_CATEGORIES = [
  'BREATHING',
  'GROUNDING',
  'MINDFULNESS',
  'STUDY_BREAK',
  'STRESS_MANAGEMENT',
  'SLEEP_ROUTINE',
  'POSITIVE_REFLECTION',
] as const;
export type WellnessCategory = (typeof WELLNESS_CATEGORIES)[number];

export const CONTENT_REVIEW_STATUSES = ['DRAFT', 'PENDING_PROFESSIONAL_REVIEW', 'PROFESSIONALLY_REVIEWED'] as const;
export type ContentReviewStatus = (typeof CONTENT_REVIEW_STATUSES)[number];

export const SUPPORT_CATEGORIES = [
  'UNIVERSITY_COUNSELLING',
  'MENTAL_HEALTH_PROFESSIONAL',
  'SUPPORT_ORGANIZATION',
  'EMERGENCY',
  'CRISIS_LINE',
] as const;
export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];

export const VERIFICATION_STATUSES = ['PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED'] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const CONSENT_TYPES = [
  'TERMS_AND_PRIVACY',
  'AI_PROCESSING',
  'CONVERSATION_MEMORY',
  'ANONYMOUS_ANALYTICS',
] as const;
export type ConsentType = (typeof CONSENT_TYPES)[number];
