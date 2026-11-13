import type { ResponseStrategy } from '@mindbridge/shared';
import type { AIAnalysis, AIResponse, ConversationContext } from '../types.js';

/**
 * Replaceable model provider. The orchestrator depends only on this interface,
 * so swapping vendors (or running fully offline) needs no pipeline changes.
 */
export interface AIProvider {
  readonly name: string;
  /** Optional structured classification pass. Return null when unsupported/unavailable. */
  analyze(message: string): Promise<AIAnalysis | null>;
  generateResponse(context: ConversationContext, strategy: ResponseStrategy): Promise<AIResponse>;
}

export class ProviderError extends Error {
  constructor(message: string, public override readonly cause?: unknown) {
    super(message);
    this.name = 'ProviderError';
  }
}
