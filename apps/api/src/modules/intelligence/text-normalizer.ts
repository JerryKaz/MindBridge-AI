/**
 * Normalises free text for deterministic matching: lowercases, strips accents
 * and zero-width characters, undoes simple leetspeak and squeezes letters
 * repeated 3+ times ("diiiie" -> "die"). Keeps word boundaries.
 */
const LEET: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '@': 'a', $: 's', '5': 's', '7': 't' };

export function normalizeText(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[​-‍﻿]/g, '')
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/\b[\w@$]+\b/g, (word) => (/[a-z]/.test(word) ? word.replace(/[0134@$57]/g, (c) => LEET[c] ?? c) : word))
    .replace(/([a-z])\1{2,}/g, '$1')
    .replace(/[^a-z0-9'\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** True when `term` (already normalised) appears in `text` at word boundaries. */
export function containsTerm(text: string, term: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  return new RegExp(`(^|\\s)${escaped}(?=\\s|$)`).test(text);
}

const NEGATORS = ['not', "don't", 'dont', 'never', "isn't", 'isnt', "wasn't", 'no longer', "i'm not", 'im not', 'not really'];

/** Returns true when a negator appears within the 3 words before `term`. */
export function isNegated(text: string, term: string): boolean {
  const idx = text.indexOf(term);
  if (idx < 0) return false;
  const before = text.slice(0, idx).split(' ').filter(Boolean).slice(-3).join(' ');
  return NEGATORS.some((n) => containsTerm(before, n));
}
