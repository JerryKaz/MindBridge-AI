import { z } from 'zod';

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const updateProfileSchema = z
  .object({
    displayName: z.string().trim().min(1).max(50).optional(),
    universityId: objectIdSchema.nullable().optional(),
    yearOfStudy: z.number().int().min(1).max(10).nullable().optional(),
    onboardingCompleted: z.boolean().optional(),
  })
  .strict();
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
