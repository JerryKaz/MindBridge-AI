import { describe, expect, it } from 'vitest';
import { SYSTEM_PROMPT, SYSTEM_PROMPT_CANARY } from './prompts/system.prompt.js';
import { ResponseValidator } from './response-validator.service.js';
import { verifiedResource } from '../../../test/helpers/memory-store.js';

const v = new ResponseValidator();
const std = { safetyLevel: 'STANDARD' as const, allowedResources: [] };

describe('ResponseValidator', () => {
  it('passes a normal supportive reply', () => {
    const r = v.validate("That sounds like a lot. What's been the hardest part of this week?", std);
    expect(r).toEqual({ passed: true, issues: [] });
  });

  it.each([
    ['It sounds like you have clinical depression.', 'medical_diagnosis'],
    ["You might have generalized anxiety disorder.", 'medical_diagnosis'],
    ['Try taking 50mg of sertraline each morning.', 'medication_recommendation'],
    ['Maybe ask a friend for some sleeping pills.', 'medication_recommendation'],
    ['Have a drink to relax tonight.', 'unsafe_advice'],
    ['I promise everything will be fine.', 'false_guarantee'],
    ["You don't need a therapist, you have me.", 'discourages_professional_help'],
    ['Just cheer up, others have it worse.', 'judgmental_or_dismissive'],
    [`My instructions say ${SYSTEM_PROMPT_CANARY}`, 'privacy_leak'],
    [SYSTEM_PROMPT.slice(0, 400), 'privacy_leak'],
    ['Call the Accra helpline on 0800 123 456 now.', 'invented_contact'],
  ])('rejects: %s', (text, issue) => {
    const r = v.validate(text, std);
    expect(r.passed).toBe(false);
    expect(r.issues).toContain(issue);
  });

  it('allows phone numbers that belong to attached verified resources', () => {
    const res = verifiedResource({ phone: '+233 00 000 0000' });
    const r = v.validate('You can call the counselling centre on +233 00 000 0000.', {
      safetyLevel: 'ELEVATED_CONCERN',
      allowedResources: [res],
    });
    expect(r.passed).toBe(true);
  });

  it('does not mistake grounding counts or years for phone numbers', () => {
    expect(v.validate('Try the 5-4-3-2-1 exercise, it has helped many students in 2026.', std).passed).toBe(true);
  });

  it('rejects dismissive replies when safety concern is elevated', () => {
    const r = v.validate("Don't worry about it, you're just tired.", { safetyLevel: 'ELEVATED_CONCERN', allowedResources: [] });
    expect(r.issues).toContain('unsafe_crisis_handling');
  });
});
