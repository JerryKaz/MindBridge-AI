import { pino } from 'pino';

/**
 * Structured logger. Message content, journal text, tokens and passwords are
 * redacted defensively — they must never reach log storage.
 */
export const logger = pino({
  level: process.env.NODE_ENV === 'test' ? 'silent' : process.env.LOG_LEVEL ?? 'info',
  redact: {
    paths: [
      'req.headers.authorization',
      'password',
      '*.password',
      'content',
      '*.content',
      'journal',
      '*.journal',
      'refreshToken',
      '*.refreshToken',
      'token',
    ],
    censor: '[redacted]',
  },
});
