import { Schema, model, type InferSchemaType } from 'mongoose';
import { MOODS } from '@mindbridge/shared';

const moodEntrySchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    mood: { type: String, enum: MOODS, required: true },
    intensity: { type: Number, min: 1, max: 5, default: null },
    /** Encrypted optional journal text. */
    journalEnc: { type: String, default: null },
    recordedAt: { type: Date, required: true, default: () => new Date() },
  },
  { timestamps: true },
);

moodEntrySchema.index({ student: 1, recordedAt: -1 });
// Aggregate analytics (no student key) — distribution by day.
moodEntrySchema.index({ recordedAt: -1, mood: 1 });

export type MoodEntry = InferSchemaType<typeof moodEntrySchema>;
export const MoodEntryModel = model('MoodEntry', moodEntrySchema, 'moodEntries');
