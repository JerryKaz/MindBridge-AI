import { z } from 'zod';
import { ACCOUNT_STATUSES, CONSENT_TYPES } from '../enums.js';

export const updateConsentsSchema = z.object({
  consents: z
    .array(z.object({ type: z.enum(CONSENT_TYPES), granted: z.boolean() }))
    .min(1)
    .max(CONSENT_TYPES.length),
});
export type UpdateConsentsInput = z.infer<typeof updateConsentsSchema>;

export const accountDeletionSchema = z.object({
  password: z.string().min(1).max(128),
  confirm: z.literal('DELETE'),
});
export type AccountDeletionInput = z.infer<typeof accountDeletionSchema>;

export const createMemorySchema = z.object({
  content: z.string().trim().min(3).max(300),
});
export type CreateMemoryInput = z.infer<typeof createMemorySchema>;

export const adminUpdateUserSchema = z.object({ status: z.enum(ACCOUNT_STATUSES) });
