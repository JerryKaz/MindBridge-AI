import type { StudentMemory } from '@mindbridge/shared';
import { decryptField, encryptField } from '../../common/crypto.js';
import { AppError, notFound } from '../../common/errors.js';
import { requireConsent } from './consent.service.js';
import { StudentMemoryModel } from './student-memory.model.js';

const MAX_MEMORIES = 20;

export async function listMemories(studentId: string): Promise<StudentMemory[]> {
  const docs = await StudentMemoryModel.find({ student: studentId }).sort({ createdAt: -1 }).lean();
  return docs.map((d) => ({ id: d._id.toString(), content: decryptField(d.contentEnc), createdAt: d.createdAt.toISOString() }));
}

export async function addMemory(studentId: string, content: string): Promise<StudentMemory> {
  await requireConsent(studentId, 'CONVERSATION_MEMORY', 'Turn on conversation memory in Privacy settings first');
  if ((await StudentMemoryModel.countDocuments({ student: studentId })) >= MAX_MEMORIES) {
    throw new AppError(400, 'LIMIT_REACHED', `You can keep up to ${MAX_MEMORIES} memories. Remove one to add another.`);
  }
  const d = await StudentMemoryModel.create({ student: studentId, contentEnc: encryptField(content) });
  return { id: d.id, content, createdAt: d.createdAt.toISOString() };
}

export async function deleteMemory(studentId: string, id: string): Promise<void> {
  const r = await StudentMemoryModel.deleteOne({ _id: id, student: studentId });
  if (r.deletedCount === 0) throw notFound('Memory');
}
