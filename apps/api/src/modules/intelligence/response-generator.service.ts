import type { ResponseStrategy } from '@mindbridge/shared';
import type { AIProvider } from './providers/ai-provider.interface.js';
import type { AIResponse, ConversationContext } from './types.js';

/**
 * Stage 7 — response generation. Thin by design: prompt construction lives in
 * the provider (vendor-specific), safety decisions live upstream. Strips
 * formatting artefacts some models add.
 */
export class ResponseGenerator {
  constructor(private readonly provider: AIProvider) {}

  async generate(ctx: ConversationContext, strategy: ResponseStrategy): Promise<AIResponse> {
    if (strategy === 'CRISIS_RESPONSE') {
      throw new Error('Crisis responses must use the deterministic safety pathway');
    }
    const { text } = await this.provider.generateResponse(ctx, strategy);
    return {
      text: text
        .replace(/^(assistant|mindbridge( ai)?)\s*:\s*/i, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim(),
    };
  }
}
