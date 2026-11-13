import { INTENTS, type Intent } from '@mindbridge/shared';
import { INTENT_LEXICON } from './lexicon.js';
import { containsTerm, normalizeText } from './text-normalizer.js';
import type { AIAnalysis, IntentResult } from './types.js';

/**
 * Stage 2 — intent classification.
 * Lexicon scoring produces a distribution over intents; when an LLM analysis
 * is available it is ensembled (weighted average), so the classifier still
 * works — transparently — with no provider at all.
 */
export class IntentClassifier {
  constructor(private readonly llmWeight = 0.5) {}

  classify(message: string, analysis?: AIAnalysis | null): IntentResult {
    const text = normalizeText(message);
    const raw: Partial<Record<Intent, number>> = {};
    for (const [intent, terms] of Object.entries(INTENT_LEXICON) as Array<[Intent, Array<[string, number]>]>) {
      let score = 0;
      for (const [term, weight] of terms) if (containsTerm(text, term)) score += weight;
      if (score > 0) raw[intent] = score;
    }

    const total = Object.values(raw).reduce((a, b) => a + b, 0);
    // Evidence below ~2 weight units is weak: keep mass on OTHER so confidence stays honest.
    const otherMass = total === 0 ? 1 : Math.max(0, 2 - total) / 4;
    const denom = total + otherMass * (total || 1);
    const scores: Partial<Record<Intent, number>> = {};
    for (const intent of INTENTS) {
      const v = intent === 'OTHER' ? (otherMass * (total || 1)) / denom : (raw[intent] ?? 0) / denom;
      if (v > 0) scores[intent] = round(v);
    }

    let source: IntentResult['source'] = 'lexicon';
    if (analysis?.intent) {
      source = 'ensemble';
      const { label, confidence } = analysis.intent;
      // With no lexical evidence at all, lean on the model's judgement.
      const w = total === 0 ? 0.8 : this.llmWeight;
      for (const intent of INTENTS) {
        const lex = scores[intent] ?? 0;
        const llm = intent === label ? confidence : (1 - confidence) / (INTENTS.length - 1);
        const merged = round(lex * (1 - w) + llm * w);
        if (merged > 0) scores[intent] = merged;
      }
    }

    // Crisis vocabulary always wins the label when present — safety is assessed separately,
    // but the label must not hide crisis content behind e.g. ACADEMIC_STRESS.
    const ranked = (Object.entries(scores) as Array<[Intent, number]>).sort((a, b) => b[1] - a[1]);
    let [label, confidence] = ranked[0] ?? ['OTHER', 1];
    if ((raw.CRISIS_RELATED ?? 0) >= 4 && label !== 'CRISIS_RELATED') {
      label = 'CRISIS_RELATED';
      confidence = scores.CRISIS_RELATED ?? confidence;
    }
    return { label, confidence: round(confidence), scores, source };
  }
}

const round = (n: number) => Math.round(n * 1000) / 1000;
