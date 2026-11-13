import { env } from '../../config/env.js';
import { Schema, model, type InferSchemaType } from 'mongoose';
import { SAFETY_LEVELS } from '@mindbridge/shared';

/**
 * Minimal record that the safety pathway activated. Deliberately stores NO
 * message text — only the level, which detectors fired and the action taken.
 * Auto-expires after SAFETY_EVENT_RETENTION_DAYS.
 */
const safetyEventSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    level: { type: String, enum: SAFETY_LEVELS, required: true },
    sources: { type: [String], default: [] },
    actionTaken: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

safetyEventSchema.index({ student: 1, createdAt: -1 });
safetyEventSchema.index({ level: 1, createdAt: -1 });
// Data minimisation: records expire automatically.
safetyEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: env.SAFETY_EVENT_RETENTION_DAYS * 86400 });

export type SafetyEvent = InferSchemaType<typeof safetyEventSchema>;
export const SafetyEventModel = model('SafetyEvent', safetyEventSchema, 'safetyEvents');
