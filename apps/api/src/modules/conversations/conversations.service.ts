import type { ChatMessage, ConversationDetail, ConversationSummary, SafetyLevel } from '@mindbridge/shared';
import { Types } from 'mongoose';
import { decryptField } from '../../common/crypto.js';
import { notFound } from '../../common/errors.js';
import { toSupportResource } from '../../common/serializers.js';
import type { AIOrchestrator, ProcessResult } from '../intelligence/ai-orchestrator.service.js';
import { requireConsent } from '../privacy/consent.service.js';
import { purgeConversation } from '../privacy/privacy.service.js';
import { touchActivity } from '../students/students.service.js';
import { SupportResourceModel } from '../support/support-resource.model.js';
import { ConversationModel } from './conversation.model.js';
import { MessageModel } from './message.model.js';

const MAX_MESSAGES_RETURNED = 200;

type ConvLean = {
  _id: Types.ObjectId;
  title: string;
  lastMessagePreviewEnc?: string | null;
  messageCount: number;
  updatedAt: Date;
  createdAt: Date;
};

const toSummary = (c: ConvLean): ConversationSummary => ({
  id: c._id.toString(),
  title: c.title,
  lastMessagePreview: c.lastMessagePreviewEnc ? decryptField(c.lastMessagePreviewEnc) : null,
  messageCount: c.messageCount,
  updatedAt: c.updatedAt.toISOString(),
  createdAt: c.createdAt.toISOString(),
});

/** Ownership is enforced in the query itself; a foreign id is indistinguishable from a missing one. */
async function findOwned(studentId: string, id: string) {
  if (!Types.ObjectId.isValid(id)) throw notFound('Conversation');
  const c = await ConversationModel.findOne({ _id: id, student: studentId }).lean();
  if (!c) throw notFound('Conversation');
  return c;
}

export async function create(studentId: string, title?: string): Promise<ConversationSummary> {
  const c = await ConversationModel.create({ student: studentId, ...(title ? { title } : {}) });
  return toSummary(c);
}

export async function list(studentId: string): Promise<ConversationSummary[]> {
  const docs = await ConversationModel.find({ student: studentId }).sort({ updatedAt: -1 }).limit(100).lean();
  return docs.map(toSummary);
}

export async function get(studentId: string, id: string): Promise<ConversationDetail> {
  const c = await findOwned(studentId, id);
  const docs = await MessageModel.find({ conversation: c._id })
    .sort({ createdAt: -1, _id: -1 }) // _id breaks same-millisecond ties
    .limit(MAX_MESSAGES_RETURNED)
    .lean();
  docs.reverse();

  const resourceIds = [...new Set(docs.flatMap((m) => (m.resourceIds ?? []).map((r) => r.toString())))];
  const resources = resourceIds.length
    ? (await SupportResourceModel.find({ _id: { $in: resourceIds }, verificationStatus: 'VERIFIED', published: true })
        .populate('university', 'name')
        .lean()).map(toSupportResource)
    : [];

  const messages: ChatMessage[] = docs.map((m) => {
    const attached = resources.filter((r) => (m.resourceIds ?? []).some((x) => x.toString() === r.id));
    const level = (m.safetyLevel ?? 'STANDARD') as SafetyLevel;
    return {
      id: m._id.toString(),
      role: m.role,
      content: decryptField(m.contentEnc),
      createdAt: m.createdAt.toISOString(),
      ...(m.role === 'assistant' && (level !== 'STANDARD' || attached.length) ? { safety: { level, resources: attached } } : {}),
      ...(m.suggestions?.length ? { suggestions: m.suggestions } : {}),
    };
  });
  return { ...toSummary(c), messages };
}

export async function remove(studentId: string, id: string): Promise<void> {
  const c = await findOwned(studentId, id);
  await purgeConversation(c._id.toString());
}

export async function sendMessage(
  orchestrator: AIOrchestrator,
  studentId: string,
  conversationId: string,
  content: string,
): Promise<ProcessResult> {
  await requireConsent(studentId, 'AI_PROCESSING', 'Please allow AI processing in your privacy settings to chat with MindBridge');
  const result = await orchestrator.processMessage({ studentId, conversationId, content });
  await touchActivity(studentId);
  return result;
}
