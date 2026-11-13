import type { SafetyLevel, SupportResource } from '@mindbridge/shared';
import { SYSTEM_PROMPT, SYSTEM_PROMPT_CANARY } from './prompts/system.prompt.js';
import type { ValidationResult } from './types.js';

interface Rule {
  id: string;
  test: (text: string, lower: string, ctx: ValidationContext) => boolean;
}

export interface ValidationContext {
  safetyLevel: SafetyLevel;
  /** Verified resources attached to this reply — the only contact details allowed. */
  allowedResources: SupportResource[];
}

const CONDITIONS =
  '(depression|depressive disorder|anxiety disorder|generali[sz]ed anxiety|bipolar|ptsd|post.traumatic|adhd|ocd|obsessive.compulsive|schizophreni\\w*|borderline|personality disorder|eating disorder|anorexia|bulimia|panic disorder|a mental illness|a disorder|clinical(ly)? depress\\w*)';

const MEDICATIONS = [
  'sertraline', 'zoloft', 'fluoxetine', 'prozac', 'escitalopram', 'lexapro', 'citalopram', 'paroxetine',
  'venlafaxine', 'duloxetine', 'bupropion', 'mirtazapine', 'amitriptyline', 'diazepam', 'valium', 'alprazolam',
  'xanax', 'lorazepam', 'clonazepam', 'zolpidem', 'ambien', 'quetiapine', 'olanzapine', 'risperidone', 'lithium',
  'melatonin', 'tramadol', 'codeine', 'antidepressant', 'antidepressants', 'benzodiazepine', 'benzos', 'ssri',
  'sleeping pills', 'sleeping tablets',
];

const RULES: Rule[] = [
  {
    id: 'medical_diagnosis',
    test: (_t, l) =>
      new RegExp(`\\b(you|u)\\s*('re|are|have|might have|may have|probably have|likely have|seem to have|could have|definitely have|are suffering from|suffer from|show signs of)\\s+(\\w+\\s+){0,3}${CONDITIONS}`).test(l) ||
      /\b(i (can )?diagnose|my diagnosis|this is a diagnosis|you('re| are) (clinically )?depressed|you('re| are) bipolar)\b/.test(l),
  },
  {
    id: 'medication_recommendation',
    test: (_t, l) =>
      MEDICATIONS.some((m) => new RegExp(`\\b${m}\\b`).test(l)) ||
      /\b\d+\s?(mg|milligrams?|ml)\b/.test(l) ||
      /\b(take|try|start|increase|stop taking)\s+(some\s+|a few\s+|your\s+)?(pills|tablets|medication|meds)\b/.test(l),
  },
  {
    id: 'unsafe_advice',
    test: (_t, l) =>
      /\b(lethal dose|how many pills|overdose on|ways to (die|kill)|painless way|hurt yourself|harm yourself|cut yourself|go ahead and (end|hurt|kill))\b/.test(l) ||
      /\b(have|grab|take) a (drink|few drinks|beer|shot)s? to (relax|calm|cope|forget)\b/.test(l) ||
      /\b(skip|stop) (eating|meals)\b/.test(l) ||
      /\bno need to sleep\b/.test(l),
  },
  {
    id: 'false_guarantee',
    test: (_t, l) =>
      /\b(i promise|i guarantee|guaranteed to|100% (sure|certain)|everything will (definitely |surely )?be (fine|okay|ok|alright)|it will definitely (get better|be fine)|you will definitely (pass|be fine)|nothing bad will happen)\b/.test(l),
  },
  {
    id: 'discourages_professional_help',
    test: (_t, l) =>
      /\b(you )?(don't|do not|dont) need (a |to see a |to talk to a |any )?(therapist|counsellor|counselor|professional|doctor|psychologist|help from anyone)\b/.test(l) ||
      /\b(therapy|counselling|counseling) (is|are) (useless|a waste|pointless)\b/.test(l) ||
      /\bi('m| am) (a |your )?(licensed|certified|qualified) (therapist|psychologist|counsellor|counselor|doctor)\b/.test(l) ||
      /\bi can (treat|cure) you\b/.test(l),
  },
  {
    id: 'judgmental_or_dismissive',
    test: (_t, l) =>
      /\b(just (cheer|snap) (up|out of it)|stop being (dramatic|lazy|sensitive)|you('re| are) overreacting|it('s| is) not (that )?(a big deal|serious)|others have it worse|man up|you should be ashamed)\b/.test(l),
  },
  {
    id: 'privacy_leak',
    test: (t, l) =>
      t.includes(SYSTEM_PROMPT_CANARY) ||
      /\b[a-f0-9]{24}\b/.test(l) ||
      /<\/?(guidance|student_message|conversation)>/.test(l) ||
      leaksSystemPrompt(l) ||
      /[\w.+-]+@[\w-]+\.[\w.]+/.test(t),
  },
  {
    id: 'invented_contact',
    test: (t, _l, ctx) => {
      const allowed = new Set(ctx.allowedResources.map((r) => digits(r.phone ?? '')).filter(Boolean));
      const numbers = t.match(/\+?\d[\d\s()-]{2,}\d/g) ?? [];
      return numbers.some((n) => !isTimeOrCount(n) && !allowed.has(digits(n)));
    },
  },
  {
    id: 'unsafe_crisis_handling',
    test: (_t, l, ctx) =>
      ctx.safetyLevel !== 'STANDARD' &&
      /\b(you('ll| will) be fine|don't worry about it|dont worry about it|you('re| are) just tired|sleep it off|it('s| is) probably nothing|keep (it|this) to yourself|don't tell anyone|dont tell anyone)\b/.test(l),
  },
  { id: 'empty_or_too_long', test: (t) => t.trim().length < 2 || t.length > 1500 },
];

const digits = (s: string) => s.replace(/\D/g, '');
/** Excludes things that are clearly not contact numbers: short counts, years, "5-4-3-2-1", "4-7-8". */
const isTimeOrCount = (s: string) =>
  digits(s).length < 3 || /^(19|20)\d\d$/.test(digits(s)) || /^\d([\s-]\d){2,}$/.test(s.trim());

// Distinctive 8-word windows from the system prompt; any verbatim match = leak.
const PROMPT_WINDOWS = (() => {
  const words = SYSTEM_PROMPT.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean);
  const set = new Set<string>();
  for (let i = 0; i + 8 <= words.length; i += 4) set.add(words.slice(i, i + 8).join(' '));
  return [...set];
})();
function leaksSystemPrompt(lower: string): boolean {
  const norm = lower.replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ');
  return PROMPT_WINDOWS.some((w) => norm.includes(w));
}

/**
 * Stage 8 — validate generated text before it reaches a student. Any failed
 * rule causes the orchestrator to substitute a safe fallback reply.
 */
export class ResponseValidator {
  validate(text: string, ctx: ValidationContext): ValidationResult {
    const lower = text.toLowerCase().replace(/[’‘]/g, "'");
    const issues = RULES.filter((r) => r.test(text, lower, ctx)).map((r) => r.id);
    return { passed: issues.length === 0, issues };
  }
}
