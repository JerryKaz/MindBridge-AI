import { decryptField } from '../../common/crypto.js';
import { unauthorized } from '../../common/errors.js';
import { RefreshTokenModel } from '../auth/refresh-token.model.js';
import { verifyPassword } from '../auth/password.js';
import { logger } from '../../common/logger.js';
import { ConversationModel } from '../conversations/conversation.model.js';
import { MessageModel } from '../conversations/message.model.js';
import { AiInteractionModel } from '../intelligence/ai-interaction.model.js';
import { SafetyEventModel } from '../intelligence/safety-event.model.js';
import { MoodEntryModel } from '../moods/mood-entry.model.js';
import { UserModel } from '../students/user.model.js';
import { getConsents } from './consent.service.js';
import { ConsentModel } from './consent.model.js';
import { listMemories } from './memories.service.js';
import { StudentMemoryModel } from './student-memory.model.js';

/** Right of access: everything we hold about the student, decrypted, as JSON. */
export async function exportData(studentId: string) {
  const [user, conversations, messages, moods, memories, consents] = await Promise.all([
    UserModel.findById(studentId).populate('university', 'name').lean(),
    ConversationModel.find({ student: studentId }).sort({ createdAt: 1 }).lean(),
    MessageModel.find({ student: studentId }).sort({ createdAt: 1 }).lean(),
    MoodEntryModel.find({ student: studentId }).sort({ recordedAt: 1 }).lean(),
    listMemories(studentId),
    getConsents(studentId),
  ]);
  if (!user) throw unauthorized();
  return {
    exportedAt: new Date().toISOString(),
    account: {
      email: user.email,
      displayName: user.displayName,
      university: user.university && 'name' in user.university ? user.university.name : null,
      yearOfStudy: user.yearOfStudy ?? null,
      createdAt: user.createdAt,
    },
    consents,
    memories,
    moodEntries: moods.map((m) => ({
      mood: m.mood,
      intensity: m.intensity,
      journal: m.journalEnc ? decryptField(m.journalEnc) : null,
      recordedAt: m.recordedAt,
    })),
    conversations: conversations.map((c) => ({
      title: c.title,
      createdAt: c.createdAt,
      messages: messages
        .filter((m) => m.conversation.equals(c._id))
        .map((m) => ({ role: m.role, content: decryptField(m.contentEnc), at: m.createdAt })),
    })),
  };
}

/** Deletes a conversation and every record derived from it. */
export async function purgeConversation(conversationId: string): Promise<void> {
  await Promise.all([
    MessageModel.deleteMany({ conversation: conversationId }),
    AiInteractionModel.deleteMany({ conversation: conversationId }),
    SafetyEventModel.deleteMany({ conversation: conversationId }),
  ]);
  await ConversationModel.deleteOne({ _id: conversationId });
}

/** Right to erasure: hard-deletes the account and all personal data. */
export async function deleteAccount(studentId: string, password: string, ip: string | null): Promise<void> {
  const user = await UserModel.findById(studentId).select('+passwordHash');
  if (!user || !(await verifyPassword(user.passwordHash, password))) throw unauthorized('Password is incorrect');

  const conversations = await ConversationModel.find({ student: studentId }, { _id: 1 }).lean();
  for (const c of conversations) await purgeConversation(c._id.toString());
  await Promise.all([
    MoodEntryModel.deleteMany({ student: studentId }),
    StudentMemoryModel.deleteMany({ student: studentId }),
    ConsentModel.deleteMany({ student: studentId }),
    SafetyEventModel.deleteMany({ student: studentId }),
    RefreshTokenModel.deleteMany({ user: studentId }),
  ]);
  await UserModel.deleteOne({ _id: studentId });
  // The log line keeps no personal data — only that an erasure happened.
  logger.info({ event: 'ACCOUNT_SELF_DELETED' }, 'Student account erased');
}
