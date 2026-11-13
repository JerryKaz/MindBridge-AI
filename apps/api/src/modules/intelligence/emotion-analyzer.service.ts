import { EMOTIONAL_SIGNALS, type EmotionalSignal } from '@mindbridge/shared';
import { SIGNAL_LEXICON } from './lexicon.js';
import { containsTerm, isNegated, normalizeText } from './text-normalizer.js';
import type { AIAnalysis, EmotionResult, SignalScore } from './types.js';

const INTENSIFIERS = ['so', 'very', 'really', 'extremely', 'super', 'too', 'completely', 'totally'];
const NEGATIVE: EmotionalSignal[] = ['FRUSTRATION', 'ANXIETY', 'SADNESS', 'LONELINESS', 'FEAR', 'STRESS', 'SELF_DOUBT', 'HOPELESSNESS'];

/**
 * Stage 3 — emotional signal analysis. Produces contextual indicators with
 * 0..1 scores. These are NOT diagnoses and are never shown as such.
 */
export class EmotionAnalyzer {
  analyze(message: string, analysis?: AIAnalysis | null): EmotionResult {
    const text = normalizeText(message);
    const scores = new Map<EmotionalSignal, number>();

    for (const signal of EMOTIONAL_SIGNALS) {
      let score = 0;
      for (const [term, weight] of SIGNAL_LEXICON[signal]) {
        if (!containsTerm(text, term) || isNegated(text, term)) continue;
        const boosted = INTENSIFIERS.some((i) => containsTerm(text, `${i} ${term}`)) ? weight * 1.25 : weight;
        score = Math.max(score, boosted) + (score > 0 ? 0.1 : 0);
      }
      if (score > 0) scores.set(signal, Math.min(1, score));
    }

    // Exclamation/caps intensity is a weak amplifier for negative signals only.
    const shouting = message.length > 12 && message === message.toUpperCase() && /[A-Z]/.test(message);
    if (shouting) for (const s of NEGATIVE) if (scores.has(s)) scores.set(s, Math.min(1, scores.get(s)! + 0.1));

    for (const { signal, score } of analysis?.signals ?? []) {
      scores.set(signal, Math.min(1, Math.max(scores.get(signal) ?? 0, score)));
    }

    const signals: SignalScore[] = [...scores.entries()]
      .map(([signal, score]) => ({ signal, score: Math.round(score * 100) / 100 }))
      .sort((a, b) => b.score - a.score);
    const negativeIntensity = Math.max(0, ...signals.filter((s) => NEGATIVE.includes(s.signal)).map((s) => s.score));
    return { signals, negativeIntensity };
  }
}
