import { maxSafetyLevel, type SafetyLevel } from '@mindbridge/shared';
import { containsTerm, normalizeText } from './text-normalizer.js';
import type { AIAnalysis, ContextMessage, SafetyAssessment, StoredConversation } from './types.js';

/**
 * Stage 4 — independent safety assessment.
 *
 * Combines four independent detectors and takes the MOST severe result:
 *   1. deterministic rules (explicit self-harm / harm-to-others statements)
 *   2. risk-pattern detection (passive ideation, hopelessness, plan/means/time)
 *   3. a dedicated classifier (LLM safety pass, when configured) — can only RAISE
 *   4. contextual assessment (escalation within the conversation)
 *
 * Nothing downstream (emotion scores, intent, the LLM reply) can lower the level.
 * The engine is tuned for recall: false positives route to supportive referral,
 * which is a far cheaper error than a missed crisis.
 */

// ---- 1. Deterministic rules ------------------------------------------------
const EXPLICIT_SELF_HARM = [
  'kill myself', 'killing myself', 'kms', 'end my life', 'ending my life', 'take my own life', 'taking my own life',
  'want to die', 'wanna die', 'going to die tonight', 'suicide', 'suicidal', 'commit suicide', 'unalive myself',
  'unalive', 'hurt myself', 'hurting myself', 'harm myself', 'self harm', 'selfharm', 'cut myself', 'cutting myself',
  'overdose', 'od on', 'hang myself', 'jump off', 'jump in front of', 'not wake up', "don't want to wake up",
  'dont want to wake up', "don't want to live", 'dont want to live', 'do not want to live', 'better off dead',
  'end it all', 'ending it all', 'end everything', 'my last day', 'say goodbye forever', 'final goodbye',
];

const HARM_TO_OTHERS = [
  'kill him', 'kill her', 'kill them', 'kill someone', 'hurt someone', 'hurt him', 'hurt her', 'hurt them',
  'shoot up', 'stab him', 'stab her', 'stab someone', 'make them pay',
];

const CURRENT_DANGER = [
  'being abused', 'he hits me', 'she hits me', 'they hit me', 'not safe at home', 'unsafe at home',
  'someone is hurting me', 'being followed', 'threatened to kill me', 'raped', 'sexually assaulted',
];

/** Non-literal idioms that would otherwise trip a rule. Removed before rule matching. */
const IDIOMS = [
  'dying to', 'die of embarrassment', 'died of embarrassment', 'killing it', 'killed it', 'kill it', 'to die for',
  'kill time', 'killing time', 'my phone died', 'phone is dead', 'battery died', 'dead tired', 'laughing to death',
  'bored to death', 'scared to death', 'kill for a', 'this exam will kill me', 'this course is killing me',
];

// ---- 2. Risk patterns -------------------------------------------------------
const PASSIVE_IDEATION = [
  'better off without me', 'no reason to live', 'nothing to live for', 'wish i was dead', 'wish i were dead',
  "wish i wasn't here", 'wish i wasnt here', 'wish i could disappear', 'just disappear', 'want to disappear', 'disappear forever',
  "can't go on", 'cant go on', "can't do this anymore", 'cant do this anymore', 'no way out', 'tired of living',
  "what's the point of living", 'whats the point of living', 'point of living', "don't want to be here",
  'dont want to be here', 'everyone would be better', 'burden to everyone', 'i am a burden', "i'm a burden",
  'im a burden', 'never wake up', 'sleep forever', 'give up on life', 'giving up on life',
];

const HOPELESSNESS = [
  'hopeless', 'no hope', 'no point', 'pointless', 'nothing matters', 'no future', 'never get better',
  "won't get better", 'wont get better', 'worthless', 'empty inside',
];

const MEANS = [
  'pills', 'tablets', 'rope', 'knife', 'blade', 'razor', 'bridge', 'rooftop', 'poison', 'gun', 'stockpiling',
  'saving up pills',
];
const PLAN_OR_TIME = [
  'tonight', 'today', 'right now', 'this weekend', 'wrote a note', 'written a note', 'goodbye letter',
  'said goodbye', 'have a plan', 'made a plan', 'the plan', 'gave away my', 'giving away my',
];

const PROMPT_INJECTION = [
  'ignore previous instructions', 'ignore all previous', 'ignore your instructions', 'disregard your instructions',
  'disregard previous', 'system prompt', 'you are now', 'developer mode', 'jailbreak', 'act as dan', 'pretend you are',
  'reveal your prompt', 'print your instructions', 'new instructions', 'override your', 'forget your rules',
];

export interface SafetyEngineInput {
  message: string;
  analysis?: AIAnalysis | null;
  recentMessages: ContextMessage[];
  conversation: Pick<StoredConversation, 'highestSafetyLevel'>;
}

export class SafetyEngine {
  assess({ message, analysis, recentMessages, conversation }: SafetyEngineInput): SafetyAssessment {
    const text = normalizeText(message);
    const stripped = IDIOMS.reduce((t, idiom) => t.split(idiom).join(' '), text);
    const sources: string[] = [];
    const levels: SafetyLevel[] = ['STANDARD'];
    const has = (terms: string[], t = stripped) => terms.some((term) => containsTerm(t, term));

    // 1. Deterministic rules
    if (has(EXPLICIT_SELF_HARM)) {
      levels.push('POTENTIAL_IMMEDIATE_DANGER');
      sources.push('rule:explicit_self_harm');
    }
    if (has(HARM_TO_OTHERS)) {
      levels.push('POTENTIAL_IMMEDIATE_DANGER');
      sources.push('rule:harm_to_others');
    }
    if (has(CURRENT_DANGER)) {
      levels.push('POTENTIAL_IMMEDIATE_DANGER');
      sources.push('rule:current_danger');
    }

    // 2. Risk patterns
    const passive = has(PASSIVE_IDEATION);
    const hopeless = has(HOPELESSNESS);
    const means = has(MEANS);
    const meansOrTime = means || has(PLAN_OR_TIME);
    if (passive) {
      levels.push('ELEVATED_CONCERN');
      sources.push('pattern:passive_ideation');
    }
    if (hopeless) {
      levels.push('ELEVATED_CONCERN');
      sources.push('pattern:hopelessness');
    }
    // Passive ideation + any plan/means/timing, or hopelessness + concrete means.
    if ((passive && meansOrTime) || (hopeless && means)) {
      levels.push('POTENTIAL_IMMEDIATE_DANGER');
      sources.push('pattern:ideation_with_plan_or_means');
    }

    // 3. Dedicated classifier (optional LLM safety pass) — may raise, never lower.
    if (analysis?.risk && analysis.risk !== 'STANDARD') {
      levels.push(analysis.risk);
      sources.push('classifier:llm');
    }

    // 4. Contextual assessment
    const priorStudentText = recentMessages
      .filter((m) => m.role === 'student')
      .slice(-4)
      .map((m) => normalizeText(m.content))
      .join(' ');
    const priorConcern = has(PASSIVE_IDEATION, priorStudentText) || has(EXPLICIT_SELF_HARM, priorStudentText);
    if (priorConcern && meansOrTime) {
      levels.push('POTENTIAL_IMMEDIATE_DANGER');
      sources.push('context:plan_after_prior_ideation');
    }
    if (conversation.highestSafetyLevel !== 'STANDARD') {
      // After any concern in this conversation, keep at least ELEVATED so the
      // student keeps seeing support options rather than snapping back to small talk.
      levels.push('ELEVATED_CONCERN');
      sources.push('context:prior_concern_in_conversation');
    }

    return {
      level: maxSafetyLevel(...levels),
      sources: [...new Set(sources)],
      promptInjectionSuspected: has(PROMPT_INJECTION, text),
    };
  }
}
