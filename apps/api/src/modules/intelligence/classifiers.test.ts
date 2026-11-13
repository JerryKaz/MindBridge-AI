import { describe, expect, it } from 'vitest';
import { EmotionAnalyzer } from './emotion-analyzer.service.js';
import { IntentClassifier } from './intent-classifier.service.js';
import { ResponseStrategySelector } from './response-strategy.service.js';
import type { ConversationContext } from './types.js';

const classifier = new IntentClassifier();
const analyzer = new EmotionAnalyzer();
const selector = new ResponseStrategySelector();

describe('IntentClassifier', () => {
  it.each([
    ['I have three exams and an assignment deadline on Friday', 'ACADEMIC_STRESS'],
    ['I feel so lonely, I have no friends here', 'LONELINESS'],
    ["I keep doubting myself, I'm not good enough and I compare myself to everyone", 'SELF_REFLECTION'],
    ['Any tips for better sleep and a healthy routine?', 'GENERAL_WELLNESS'],
    ['I broke up with my boyfriend', 'RELATIONSHIP_ISSUE'],
    ["I can't stop procrastinating, I have zero motivation", 'MOTIVATION'],
    ['My heart is racing and I feel anxious all the time', 'ANXIETY'],
  ])('%s -> %s', (msg, expected) => {
    const r = classifier.classify(msg);
    expect(r.label).toBe(expected);
    expect(r.confidence).toBeGreaterThan(0.3);
  });

  it('returns OTHER with high confidence for content-free messages', () => {
    const r = classifier.classify('hello there');
    expect(r.label).toBe('OTHER');
  });

  it('labels crisis content CRISIS_RELATED even when mixed with academic words', () => {
    expect(classifier.classify('my exams are bad and I want to kill myself').label).toBe('CRISIS_RELATED');
  });

  it('ensembles an LLM analysis when available', () => {
    const r = classifier.classify('hmm not sure', { intent: { label: 'SELF_REFLECTION', confidence: 0.9 }, signals: [], risk: null });
    expect(r.source).toBe('ensemble');
    expect(r.label).toBe('SELF_REFLECTION');
  });
});

describe('EmotionAnalyzer', () => {
  it('detects multiple signals with scores', () => {
    const r = analyzer.analyze("I'm so stressed and anxious, I feel like a failure");
    const names = r.signals.map((s) => s.signal);
    expect(names).toEqual(expect.arrayContaining(['STRESS', 'ANXIETY', 'SELF_DOUBT']));
    expect(r.negativeIntensity).toBeGreaterThan(0.8);
  });

  it('respects negation', () => {
    const r = analyzer.analyze("I'm not stressed anymore, actually feeling hopeful");
    expect(r.signals.map((s) => s.signal)).not.toContain('STRESS');
    expect(r.signals[0]?.signal).toBe('POSITIVE');
  });
});

const ctx = (msg: string, overrides: Partial<ConversationContext> = {}): ConversationContext => ({
  currentMessage: msg,
  recentMessages: [],
  sessionTopics: [],
  memories: [],
  intent: classifier.classify(msg),
  emotions: analyzer.analyze(msg),
  safety: { level: 'STANDARD', sources: [], promptInjectionSuspected: false },
  ...overrides,
});

describe('ResponseStrategySelector', () => {
  it('always uses CRISIS_RESPONSE for immediate danger, whatever the intent', () => {
    const c = ctx('tips for exams', { safety: { level: 'POTENTIAL_IMMEDIATE_DANGER', sources: [], promptInjectionSuspected: false } });
    expect(selector.select(c).strategy).toBe('CRISIS_RESPONSE');
  });
  it('refers to human support for elevated concern', () => {
    const c = ctx('I feel hopeless', { safety: { level: 'ELEVATED_CONCERN', sources: [], promptInjectionSuspected: false } });
    expect(selector.select(c).strategy).toBe('HUMAN_SUPPORT_REFERRAL');
  });
  it('offers a coping exercise for acute anxiety with a request to calm down', () => {
    expect(selector.select(ctx("I'm panicking and anxious, help me calm down")).strategy).toBe('COPING_EXERCISE');
  });
  it('gives practical guidance when asked, but not twice in a row', () => {
    expect(selector.select(ctx('How do I manage my exam stress?')).strategy).toBe('PRACTICAL_GUIDANCE');
    const after = ctx('What should I do next?', {
      recentMessages: [{ role: 'assistant', content: 'some tips', strategy: 'PRACTICAL_GUIDANCE' }],
    });
    expect(selector.select(after).strategy).toBe('GUIDED_REFLECTION');
  });
  it('listens for loneliness and clarifies short ambiguous messages', () => {
    expect(selector.select(ctx('I feel lonely here')).strategy).toBe('EMPATHETIC_LISTENING');
    expect(selector.select(ctx('meh')).strategy).toBe('GENTLE_CLARIFICATION');
  });
});
