import { env } from '../../config/env.js';
import { Schema, model, type InferSchemaType } from 'mongoose';
import { INTENTS, RESPONSE_STRATEGIES, SAFETY_LEVELS } from '@mindbridge/shared';

/**
 * Pipeline metadata for quality/performance evaluation. No message text, no
 * student id (only the conversation id, removed on deletion). TTL-expired.
 */
const aiInteractionSchema = new Schema(
  {
    conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    intent: { type: String, enum: INTENTS, required: true },
    intentConfidence: { type: Number, required: true },
    signals: { type: [String], default: [] },
    safetyLevel: { type: String, enum: SAFETY_LEVELS, required: true },
    strategy: { type: String, enum: RESPONSE_STRATEGIES, required: true },
    provider: { type: String, required: true },
    validationPassed: { type: Boolean, required: true },
    validationIssues: { type: [String], default: [] },
    usedFallback: { type: Boolean, required: true },
    latencyMs: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

aiInteractionSchema.index({ conversation: 1 });
// Data minimisation: records expire automatically.
aiInteractionSchema.index({ createdAt: 1 }, { expireAfterSeconds: env.AI_INTERACTION_RETENTION_DAYS * 86400 });

export type AiInteraction = InferSchemaType<typeof aiInteractionSchema>;
export const AiInteractionModel = model('AiInteraction', aiInteractionSchema, 'aiInteractions');
