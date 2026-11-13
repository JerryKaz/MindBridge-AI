import { z } from 'zod';
import { MOODS } from '../enums.js';

export const createMoodSchema = z.object({
  mood: z.enum(MOODS),
  intensity: z.number().int().min(1).max(5).optional(),
  journal: z.string().trim().max(5000).optional(),
  recordedAt: z.iso.datetime().optional(),
});
export type CreateMoodInput = z.infer<typeof createMoodSchema>;

export const moodHistoryQuerySchema = z.object({
  range: z.enum(['week', 'month', 'quarter']).default('week'),
});
export type MoodHistoryQuery = z.infer<typeof moodHistoryQuerySchema>;
