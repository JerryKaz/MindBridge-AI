import { describe, expect, it } from 'vitest';
import { createMoodSchema, maxSafetyLevel, registerSchema, sendMessageSchema } from './index.js';

describe('shared schemas', () => {
  it('normalises email and enforces password rules on registration', () => {
    const ok = registerSchema.safeParse({
      email: '  Ama@Example.COM ',
      password: 'studyhard2026',
      displayName: 'Ama',
      acceptedTerms: true,
    });
    expect(ok.success).toBe(true);
    expect(ok.success && ok.data.email).toBe('ama@example.com');

    const weak = registerSchema.safeParse({
      email: 'ama@example.com',
      password: 'short',
      displayName: 'Ama',
      acceptedTerms: true,
    });
    expect(weak.success).toBe(false);
  });

  it('rejects empty and oversized chat messages', () => {
    expect(sendMessageSchema.safeParse({ content: '   ' }).success).toBe(false);
    expect(sendMessageSchema.safeParse({ content: 'x'.repeat(2001) }).success).toBe(false);
  });

  it('validates mood intensity bounds', () => {
    expect(createMoodSchema.safeParse({ mood: 'CALM', intensity: 6 }).success).toBe(false);
    expect(createMoodSchema.safeParse({ mood: 'CALM' }).success).toBe(true);
  });

  it('picks the most severe safety level', () => {
    expect(maxSafetyLevel('STANDARD', 'POTENTIAL_IMMEDIATE_DANGER', 'ELEVATED_CONCERN')).toBe(
      'POTENTIAL_IMMEDIATE_DANGER',
    );
  });
});
