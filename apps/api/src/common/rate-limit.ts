import { rateLimit } from 'express-rate-limit';

const isTest = process.env.NODE_ENV === 'test';
const json = (message: string) => ({ error: { code: 'RATE_LIMITED', message } });

/** Baseline for all API routes. */
export const globalLimiter = rateLimit({
  windowMs: 60_000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => isTest,
  message: json('Too many requests. Please slow down.'),
});

/** Brute-force protection for credential endpoints, keyed by IP. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => isTest,
  message: json('Too many attempts. Please wait a few minutes and try again.'),
});

/** AI messages are expensive; keyed per authenticated student. */
export const messageLimiter = rateLimit({
  windowMs: 60_000,
  limit: 15,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => isTest,
  keyGenerator: (req) => req.auth?.userId ?? req.ip ?? 'anonymous',
  message: json("You're sending messages quickly. Take a breath — you can continue in a moment."),
});
