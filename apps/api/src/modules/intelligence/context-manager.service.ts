import type { ContextMessage, ConversationStore, StoredConversation } from './types.js';

export interface PermittedContext {
  recentMessages: ContextMessage[];
  sessionTopics: StoredConversation['recentTopics'];
  memories: string[];
}

/**
 * Stage 5 — context management. Sends the model only what it needs: a short
 * window of recent turns (each truncated), the privacy-preserving topic summary
 * of the session, and memories the student explicitly approved.
 */
export class ContextManager {
  constructor(
    private readonly store: ConversationStore,
    private readonly windowSize = 8,
    private readonly maxCharsPerMessage = 600,
  ) {}

  async getRecent(conversationId: string): Promise<ContextMessage[]> {
    const messages = await this.store.getRecentMessages(conversationId, this.windowSize);
    return messages.map((m) => ({
      ...m,
      content: m.content.length > this.maxCharsPerMessage ? `${m.content.slice(0, this.maxCharsPerMessage)}…` : m.content,
    }));
  }

  async build(conversation: StoredConversation, studentId: string, recentMessages: ContextMessage[]): Promise<PermittedContext> {
    // getApprovedMemories returns [] unless CONVERSATION_MEMORY consent is granted.
    const memories = await this.store.getApprovedMemories(studentId);
    return {
      recentMessages,
      sessionTopics: [...new Set(conversation.recentTopics)].slice(-5),
      memories: memories.slice(0, 10),
    };
  }
}
