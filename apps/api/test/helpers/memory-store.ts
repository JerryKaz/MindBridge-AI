import type { SupportResource } from '@mindbridge/shared';
import type {
  ContextMessage,
  ConversationStore,
  InteractionRecord,
  SaveExchangeInput,
  StoredConversation,
} from '../../src/modules/intelligence/types.js';

/** In-memory ConversationStore for pipeline tests (no database needed). */
export class MemoryStore implements ConversationStore {
  conversations = new Map<string, StoredConversation & { studentId: string }>();
  messages = new Map<string, ContextMessage[]>();
  memories: string[] = [];
  resources: SupportResource[] = [];
  safetyEvents: Array<{ level: string; sources: string[] }> = [];
  interactions: InteractionRecord[] = [];
  saved: SaveExchangeInput[] = [];
  private seq = 0;

  addConversation(id: string, studentId: string, partial: Partial<StoredConversation> = {}) {
    this.conversations.set(id, {
      id,
      studentId,
      recentTopics: [],
      highestSafetyLevel: 'STANDARD',
      messageCount: 0,
      ...partial,
    });
    this.messages.set(id, []);
  }

  async getOwnedConversation(conversationId: string, studentId: string) {
    const c = this.conversations.get(conversationId);
    return c && c.studentId === studentId ? c : null;
  }
  async getRecentMessages(conversationId: string, limit: number) {
    return (this.messages.get(conversationId) ?? []).slice(-limit);
  }
  async getApprovedMemories() {
    return this.memories;
  }
  async getVerifiedResources(_studentId: string, categories: string[]) {
    return this.resources.filter((r) => categories.includes(r.category) && r.verificationStatus === 'VERIFIED');
  }
  async saveExchange(input: SaveExchangeInput) {
    this.saved.push(input);
    const list = this.messages.get(input.conversationId)!;
    list.push({ role: 'student', content: input.studentContent });
    list.push({ role: 'assistant', content: input.replyContent, strategy: input.strategy });
    const c = this.conversations.get(input.conversationId)!;
    c.recentTopics = [...c.recentTopics, input.intent];
    if (input.safetyLevel !== 'STANDARD') c.highestSafetyLevel = input.safetyLevel;
    const now = new Date();
    return { studentMessage: { id: `m${++this.seq}`, createdAt: now }, reply: { id: `m${++this.seq}`, createdAt: now } };
  }
  async recordSafetyEvent(e: { level: string; sources: string[] }) {
    this.safetyEvents.push(e);
  }
  async recordInteraction(r: InteractionRecord) {
    this.interactions.push(r);
  }
}

export const verifiedResource = (overrides: Partial<SupportResource> = {}): SupportResource => ({
  id: 'r1',
  name: 'Campus Counselling Centre (test fixture)',
  category: 'UNIVERSITY_COUNSELLING',
  description: 'Synthetic resource used only in automated tests.',
  university: null,
  phone: '+233 00 000 0000',
  email: null,
  website: null,
  location: null,
  region: null,
  availability: null,
  isFree: true,
  verificationStatus: 'VERIFIED',
  verifiedAt: new Date().toISOString(),
  published: true,
  ...overrides,
});
