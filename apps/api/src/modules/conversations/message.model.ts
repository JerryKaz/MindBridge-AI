import { Schema, model, type InferSchemaType } from 'mongoose';
import { RESPONSE_STRATEGIES, SAFETY_LEVELS } from '@mindbridge/shared';

const messageSchema = new Schema(
  {
    conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['student', 'assistant'], required: true },
    /** AES-256-GCM encrypted message text. */
    contentEnc: { type: String, required: true },
    safetyLevel: { type: String, enum: SAFETY_LEVELS, default: 'STANDARD' },
    /** Resource ids shown with a crisis/referral reply (verified resources only). */
    resourceIds: [{ type: Schema.Types.ObjectId, ref: 'SupportResource' }],
    suggestions: { type: [String], default: undefined },
    /** Strategy used for assistant messages — lets the selector avoid repetition. */
    strategy: { type: String, enum: RESPONSE_STRATEGIES, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

messageSchema.index({ conversation: 1, createdAt: 1 });
messageSchema.index({ student: 1, createdAt: -1 });

export type Message = InferSchemaType<typeof messageSchema>;
export const MessageModel = model('Message', messageSchema, 'messages');
