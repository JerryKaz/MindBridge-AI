import { z } from 'zod';

export const MESSAGE_MAX_LENGTH = 2000;

export const createConversationSchema = z.object({
  title: z.string().trim().max(80).optional(),
});
export type CreateConversationInput = z.infer<typeof createConversationSchema>;

export const sendMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Message cannot be empty')
    .max(MESSAGE_MAX_LENGTH, `Messages are limited to ${MESSAGE_MAX_LENGTH} characters`),
});
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  before: z.iso.datetime().optional(),
});
