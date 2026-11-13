import { z } from 'zod';
import {
  CONTENT_REVIEW_STATUSES,
  SUPPORT_CATEGORIES,
  VERIFICATION_STATUSES,
  WELLNESS_CATEGORIES,
} from '../enums.js';
import { objectIdSchema } from './student.js';

export const wellnessActivitySchema = z.object({
  title: z.string().trim().min(3).max(100),
  description: z.string().trim().min(10).max(500),
  category: z.enum(WELLNESS_CATEGORIES),
  durationMinutes: z.number().int().min(1).max(120),
  instructions: z.array(z.string().trim().min(3).max(500)).min(1).max(20),
  reviewStatus: z.enum(CONTENT_REVIEW_STATUSES).default('DRAFT'),
  reviewedBy: z.string().trim().max(120).optional(),
  published: z.boolean().default(false),
});
export type WellnessActivityInput = z.infer<typeof wellnessActivitySchema>;
export const wellnessActivityUpdateSchema = wellnessActivitySchema.partial();

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9 ()-]{3,20}$/, 'Enter a valid phone number');

export const supportResourceSchema = z.object({
  name: z.string().trim().min(2).max(150),
  category: z.enum(SUPPORT_CATEGORIES),
  description: z.string().trim().min(10).max(1000),
  universityId: objectIdSchema.nullable().optional(),
  phone: phoneSchema.optional(),
  email: z.email().optional(),
  website: z.url().optional(),
  location: z.string().trim().max(200).optional(),
  region: z.string().trim().max(80).optional(),
  availability: z.string().trim().max(200).optional(),
  isFree: z.boolean().optional(),
  verificationStatus: z.enum(VERIFICATION_STATUSES).default('PENDING'),
  verificationSource: z.string().trim().max(300).optional(),
  published: z.boolean().default(false),
});
export type SupportResourceInput = z.infer<typeof supportResourceSchema>;
export const supportResourceUpdateSchema = supportResourceSchema.partial();

export const supportQuerySchema = z.object({
  category: z.enum(SUPPORT_CATEGORIES).optional(),
  universityId: objectIdSchema.optional(),
});
