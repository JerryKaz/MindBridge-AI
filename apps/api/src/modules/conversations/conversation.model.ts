import { Schema, model, type InferSchemaType } from 'mongoose';
import { INTENTS, SAFETY_LEVELS } from '@mindbridge/shared';

const conversationSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 80, default: 'New conversation' },
    /** Encrypted — short preview for the list screen. */
    lastMessagePreviewEnc: { type: String, default: null },
    messageCount: { type: Number, default: 0 },
    /**
     * Privacy-preserving session summary used by the context manager: the
     * topic labels (intents) discussed so far, most recent last — never raw text.
     */
    recentTopics: { type: [String], enum: INTENTS, default: [] },
    highestSafetyLevel: { type: String, enum: SAFETY_LEVELS, default: 'STANDARD' },
    lastMessageAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Main list query: a student's conversations, most recent first.
conversationSchema.index({ student: 1, updatedAt: -1 });

export type Conversation = InferSchemaType<typeof conversationSchema>;
export const ConversationModel = model('Conversation', conversationSchema, 'conversations');
