import { Schema, model, type InferSchemaType } from 'mongoose';

/**
 * Facts the student explicitly asked MindBridge to remember (e.g. "I study
 * nursing at UCC"). Only used when CONVERSATION_MEMORY consent is granted.
 */
const studentMemorySchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    contentEnc: { type: String, required: true },
  },
  { timestamps: true },
);

studentMemorySchema.index({ student: 1, createdAt: -1 });

export type StudentMemory = InferSchemaType<typeof studentMemorySchema>;
export const StudentMemoryModel = model('StudentMemory', studentMemorySchema, 'studentMemories');
