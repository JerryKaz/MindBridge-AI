import type {
  AccountStatus,
  ConsentType,
  ContentReviewStatus,
  EmotionalSignal,
  Intent,
  Mood,
  ResponseStrategy,
  SafetyLevel,
  SupportCategory,
  VerificationStatus,
  WellnessCategory,
} from './enums.js';

/** API response DTOs. Dates are ISO strings on the wire. */

export interface ApiError {
  error: { code: string; message: string; details?: unknown };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface StudentProfile {
  id: string;
  email: string;
  displayName: string;
  status: AccountStatus;
  university: { id: string; name: string } | null;
  yearOfStudy: number | null;
  onboardingCompleted: boolean;
  createdAt: string;
}

export interface AuthResponse {
  user: StudentProfile;
  tokens: AuthTokens;
}

export interface University {
  id: string;
  name: string;
  shortName: string;
  city: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  lastMessagePreview: string | null;
  messageCount: number;
  updatedAt: string;
  createdAt: string;
}

export type MessageRole = 'student' | 'assistant';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  /** Only present on assistant messages produced by the safety pathway. */
  safety?: { level: SafetyLevel; resources: SupportResource[] };
  suggestions?: string[];
}

export interface ConversationDetail extends ConversationSummary {
  messages: ChatMessage[];
}

/**
 * Explainable view of how a reply was produced. Returned to the student app
 * (for transparency/demo) — contains no raw model output or identifiers.
 */
export interface PipelineTrace {
  intent: { label: Intent; confidence: number };
  signals: Array<{ signal: EmotionalSignal; score: number }>;
  safety: { level: SafetyLevel; sources: string[] };
  strategy: ResponseStrategy;
  validation: { passed: boolean; issues: string[]; usedFallback: boolean };
  provider: string;
  latencyMs: number;
}

export interface SendMessageResponse {
  studentMessage: ChatMessage;
  reply: ChatMessage;
  trace: PipelineTrace;
}

export interface MoodEntry {
  id: string;
  mood: Mood;
  intensity: number | null;
  journal: string | null;
  recordedAt: string;
}

export interface MoodHistory {
  range: 'week' | 'month' | 'quarter';
  entries: MoodEntry[];
  distribution: Array<{ mood: Mood; count: number }>;
  daily: Array<{ date: string; count: number; dominantMood: Mood | null }>;
  /** Gentle, non-clinical observations. */
  insights: string[];
}

export interface WellnessActivity {
  id: string;
  title: string;
  description: string;
  category: WellnessCategory;
  durationMinutes: number;
  instructions: string[];
  reviewStatus: ContentReviewStatus;
  reviewedBy: string | null;
  published: boolean;
}

export interface SupportResource {
  id: string;
  name: string;
  category: SupportCategory;
  description: string;
  university: { id: string; name: string } | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  location: string | null;
  region: string | null;
  availability: string | null;
  isFree: boolean | null;
  verificationStatus: VerificationStatus;
  verifiedAt: string | null;
  published: boolean;
}

export interface ConsentRecord {
  type: ConsentType;
  granted: boolean;
  updatedAt: string | null;
}

export interface StudentMemory {
  id: string;
  content: string;
  createdAt: string;
}
