import { Types } from 'mongoose';
import { INTENTS, maxSafetyLevel, type Intent, type SafetyLevel, type SupportCategory, type SupportResource } from '@mindbridge/shared';
import { decryptField, encryptField } from '../../common/crypto.js';
import { toSupportResource } from '../../common/serializers.js';
import { AiInteractionModel } from '../intelligence/ai-interaction.model.js';
import { SafetyEventModel } from '../intelligence/safety-event.model.js';
import type {
  ContextMessage,
  ConversationStore,
  InteractionRecord,
  SaveExchangeInput,
  SavedExchange,
  StoredConversation,
} from '../intelligence/types.js';
import { hasConsent } from '../privacy/consent.service.js';
import { StudentMemoryModel } from '../privacy/student-memory.model.js';
import { SupportResourceModel } from '../support/support-resource.model.js';
import { UserModel } from '../students/user.model.js';
import { ConversationModel } from './conversation.model.js';
import { MessageModel } from './message.model.js';

const TOPIC_TITLES: Record<Intent, string> = {
  EMOTIONAL_SUPPORT: 'Talking things through',
  ACADEMIC_STRESS: 'Academic pressure',
  ANXIETY: 'Feeling anxious',
  LONELINESS: 'Feeling alone',
  RELATIONSHIP_ISSUE: 'Relationships',
  MOTIVATION: 'Finding motivation',
  SELF_REFLECTION: 'Reflecting on myself',
  GENERAL_WELLNESS: 'Wellbeing habits',
  CRISIS_RELATED: 'Support conversation',
  OTHER: 'Check-in',
};
const preview = (s: string) => (s.length > 80 ? `${s.slice(0, 77)}…` : s);

/** MongoDB implementation of the orchestrator's persistence port. */
export class MongoConversationStore implements ConversationStore {
  async getOwnedConversation(conversationId: string, studentId: string): Promise<StoredConversation | null> {
    if (!Types.ObjectId.isValid(conversationId)) return null;
    const c = await ConversationModel.findOne({ _id: conversationId, student: studentId }).lean();
    if (!c) return null;
    return {
      id: c._id.toString(),
      recentTopics: (c.recentTopics ?? []).filter((t): t is Intent => (INTENTS as readonly string[]).includes(t)),
      highestSafetyLevel: (c.highestSafetyLevel ?? 'STANDARD') as SafetyLevel,
      messageCount: c.messageCount,
    };
  }

  async getRecentMessages(conversationId: string, limit: number): Promise<ContextMessage[]> {
    const docs = await MessageModel.find({ conversation: conversationId }).sort({ createdAt: -1, _id: -1 }).limit(limit).lean();
    return docs.reverse().map((m) => ({ role: m.role, content: decryptField(m.contentEnc), strategy: m.strategy ?? null }));
  }

  async getApprovedMemories(studentId: string): Promise<string[]> {
    if (!(await hasConsent(studentId, 'CONVERSATION_MEMORY'))) return [];
    const docs = await StudentMemoryModel.find({ student: studentId }).sort({ createdAt: -1 }).limit(10).lean();
    return docs.map((d) => decryptField(d.contentEnc));
  }

  async getVerifiedResources(studentId: string, categories: SupportCategory[]): Promise<SupportResource[]> {
    const user = await UserModel.findById(studentId, { university: 1 }).lean();
    const docs = await SupportResourceModel.find({
      verificationStatus: 'VERIFIED',
      published: true,
      category: { $in: categories },
      // Campus-specific resources only for students of that campus; national ones for everyone.
      $or: [{ university: null }, ...(user?.university ? [{ university: user.university }] : [])],
    })
      .populate('university', 'name')
      .lean();
    const rank = (r: (typeof docs)[number]) =>
      (r.university ? 0 : 1) * 10 + categories.indexOf(r.category as SupportCategory);
    return docs.sort((a, b) => rank(a) - rank(b)).slice(0, 4).map(toSupportResource);
  }

  async saveExchange(input: SaveExchangeInput): Promise<SavedExchange> {
    const [studentMsg] = await MessageModel.create([
      { conversation: input.conversationId, student: input.studentId, role: 'student', contentEnc: encryptField(input.studentContent), safetyLevel: input.safetyLevel },
    ]);
    const [replyMsg] = await MessageModel.create([
      {
        conversation: input.conversationId,
        student: input.studentId,
        role: 'assistant',
        contentEnc: encryptField(input.replyContent),
        safetyLevel: input.safetyLevel,
        strategy: input.strategy,
        resourceIds: input.resourceIds.filter((id) => Types.ObjectId.isValid(id)),
        suggestions: input.suggestions,
      },
    ]);
    const conv = await ConversationModel.findById(input.conversationId);
    if (conv) {
      if (conv.messageCount === 0 && conv.title === 'New conversation') conv.title = TOPIC_TITLES[input.intent];
      conv.messageCount += 2;
      conv.lastMessagePreviewEnc = encryptField(preview(input.replyContent));
      conv.recentTopics = [...(conv.recentTopics ?? []), input.intent].slice(-10);
      conv.highestSafetyLevel = maxSafetyLevel((conv.highestSafetyLevel ?? 'STANDARD') as SafetyLevel, input.safetyLevel);
      conv.lastMessageAt = new Date();
      await conv.save();
    }
    return {
      studentMessage: { id: studentMsg!.id, createdAt: studentMsg!.createdAt },
      reply: { id: replyMsg!.id, createdAt: replyMsg!.createdAt },
    };
  }

  async recordSafetyEvent(input: { studentId: string; conversationId: string; level: SafetyLevel; sources: string[]; actionTaken: string }): Promise<void> {
    await SafetyEventModel.create({
      student: input.studentId,
      conversation: input.conversationId,
      level: input.level,
      sources: input.sources,
      actionTaken: input.actionTaken,
    });
  }

  async recordInteraction(r: InteractionRecord): Promise<void> {
    await AiInteractionModel.create({ ...r, conversation: r.conversationId });
  }
}
