import type { Env } from '../../../config/env.js';
import type { AIProvider } from './ai-provider.interface.js';
import { AnthropicProvider, OpenAICompatibleProvider } from './llm.provider.js';
import { RuleBasedProvider } from './rule-based.provider.js';

export function createAIProvider(env: Pick<Env, 'AI_PROVIDER' | 'AI_API_KEY' | 'AI_MODEL' | 'AI_BASE_URL' | 'AI_TIMEOUT_MS'>): AIProvider {
  switch (env.AI_PROVIDER) {
    case 'anthropic':
      return new AnthropicProvider(env.AI_API_KEY!, env.AI_MODEL!, env.AI_TIMEOUT_MS);
    case 'openai-compatible':
      return new OpenAICompatibleProvider(env.AI_API_KEY!, env.AI_MODEL!, env.AI_BASE_URL, env.AI_TIMEOUT_MS);
    default:
      return new RuleBasedProvider();
  }
}
