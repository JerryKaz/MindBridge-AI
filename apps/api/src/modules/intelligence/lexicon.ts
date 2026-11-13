import type { EmotionalSignal, Intent } from '@mindbridge/shared';

/**
 * Weighted keyword lexicons. Terms are matched on normalised text at word
 * boundaries. These are transparent, testable heuristics — the optional LLM
 * analysis pass is ensembled on top, never relied on alone.
 */
export const INTENT_LEXICON: Record<Exclude<Intent, 'OTHER'>, Array<[string, number]>> = {
  ACADEMIC_STRESS: [
    ['exam', 3], ['exams', 3], ['test', 1.5], ['assignment', 3], ['assignments', 3], ['deadline', 3],
    ['deadlines', 3], ['lecture', 2], ['lecturer', 2], ['lecturers', 2], ['gpa', 3], ['cwa', 3], ['grades', 2.5],
    ['grade', 2], ['fail', 2], ['failing', 2.5], ['resit', 3], ['project work', 3], ['thesis', 3], ['dissertation', 3],
    ['study', 1.5], ['studying', 2], ['semester', 1.5], ['course', 1.5], ['courses', 1.5], ['quiz', 2],
    ['presentation', 1.5], ['supervisor', 2], ['school work', 2.5], ['schoolwork', 2.5], ['revision', 2],
    ['mid sem', 3], ['midsem', 3], ['finals', 3], ['academic', 2.5], ['class', 1], ['classes', 1.5], ['fees', 1.5],
  ],
  ANXIETY: [
    ['anxious', 3], ['anxiety', 3], ['panic', 3], ['panicking', 3], ['nervous', 2.5], ['worried', 2.5],
    ['worry', 2], ['worrying', 2.5], ['overthinking', 2.5], ['scared', 2], ['afraid', 2], ['heart racing', 3],
    ['cant breathe', 2.5], ["can't breathe", 2.5], ['on edge', 2.5], ['restless', 1.5], ['dread', 2.5], ['fear', 1.5],
  ],
  LONELINESS: [
    ['lonely', 3.5], ['alone', 2.5], ['isolated', 3], ['no friends', 3.5], ['no one to talk', 3.5],
    ['nobody to talk', 3.5], ['left out', 2.5], ['homesick', 3], ['miss home', 3], ['miss my family', 3],
    ['nobody cares', 2.5], ['no one cares', 2.5], ['by myself', 1.5], ['dont fit in', 3], ["don't fit in", 3],
  ],
  RELATIONSHIP_ISSUE: [
    ['boyfriend', 3], ['girlfriend', 3], ['partner', 2], ['breakup', 3.5], ['broke up', 3.5], ['relationship', 3],
    ['roommate', 2.5], ['roommates', 2.5], ['parents', 2], ['my mum', 2], ['my mom', 2], ['my dad', 2], ['family', 1.5],
    ['friend', 1.5], ['friends', 1.5], ['argument', 2.5], ['fight', 2], ['fought', 2], ['cheated', 3], ['betrayed', 2.5],
  ],
  MOTIVATION: [
    ['motivation', 3.5], ['motivated', 3], ['unmotivated', 3.5], ['procrastinate', 3.5], ['procrastinating', 3.5],
    ['procrastination', 3.5], ['lazy', 2.5], ['cant focus', 3], ["can't focus", 3], ['focus', 1.5],
    ['no energy', 2.5], ['stuck', 2], ['productive', 2], ['discipline', 2.5], ['goals', 2], ['get started', 2],
  ],
  SELF_REFLECTION: [
    ['who i am', 3], ['myself', 1], ['reflect', 3], ['reflecting', 3], ['purpose', 2.5], ['confidence', 2.5],
    ['self esteem', 3], ['not good enough', 3], ['imposter', 3], ['impostor', 3], ['compare myself', 3],
    ['comparing myself', 3], ['grow', 1.5], ['growth', 2], ['my values', 3], ['journal', 1.5], ['insecure', 2.5],
    ['believe in myself', 3], ['doubt myself', 3],
  ],
  GENERAL_WELLNESS: [
    ['sleep', 3], ['sleeping', 2.5], ['insomnia', 2.5], ['tired', 2], ['exhausted', 2], ['exercise', 3], ['eat', 1.5],
    ['eating', 1.5], ['diet', 2], ['routine', 3], ['habits', 3], ['healthy', 2.5], ['wellbeing', 3], ['well being', 3],
    ['wellness', 3], ['relax', 2.5], ['meditation', 3], ['mindfulness', 3], ['self care', 3], ['selfcare', 3], ['tips', 1.5],
  ],
  EMOTIONAL_SUPPORT: [
    ['sad', 2.5], ['upset', 2.5], ['cry', 2.5], ['crying', 3], ['hurt', 2], ['feel bad', 2.5], ['down', 1.5],
    ['depressed', 2.5], ['miserable', 2.5], ['heartbroken', 2.5], ['angry', 2], ['frustrated', 2], ['struggling', 2.5],
    ['overwhelmed', 2.5], ['need to talk', 3], ['vent', 3], ['bad day', 3], ['rough day', 3], ['feel', 0.5], ['feeling', 0.5],
  ],
  CRISIS_RELATED: [
    ['suicide', 4], ['suicidal', 4], ['self harm', 4], ['selfharm', 4], ['kill myself', 5], ['end my life', 5],
    ['want to die', 5], ['hurt myself', 4], ['overdose', 4], ['crisis', 2.5], ['emergency', 2.5], ['unalive', 4],
  ],
};

export const SIGNAL_LEXICON: Record<EmotionalSignal, Array<[string, number]>> = {
  FRUSTRATION: [
    ['frustrated', 1], ['frustrating', 0.9], ['annoyed', 0.8], ['angry', 0.9], ['irritated', 0.8], ['fed up', 1],
    ['sick of', 0.8], ['tired of', 0.7], ['pissed', 0.9], ['unfair', 0.7],
  ],
  ANXIETY: [
    ['anxious', 1], ['anxiety', 1], ['panic', 1], ['nervous', 0.8], ['worried', 0.8], ['worry', 0.7],
    ['overthinking', 0.8], ['on edge', 0.8], ['tense', 0.6], ['restless', 0.6],
  ],
  SADNESS: [
    ['sad', 1], ['crying', 1], ['cry', 0.8], ['depressed', 1], ['down', 0.6], ['unhappy', 0.9], ['miserable', 1],
    ['heartbroken', 1], ['empty', 0.8], ['numb', 0.8], ['upset', 0.8], ['low', 0.5],
  ],
  LONELINESS: [
    ['lonely', 1], ['alone', 0.8], ['isolated', 1], ['no friends', 1], ['left out', 0.8], ['homesick', 0.9],
    ['nobody cares', 1], ['no one cares', 1], ['invisible', 0.8],
  ],
  FEAR: [['scared', 1], ['afraid', 1], ['terrified', 1], ['frightened', 1], ['fear', 0.8], ['unsafe', 0.9], ['dread', 0.8]],
  STRESS: [
    ['stressed', 1], ['stress', 0.9], ['stressful', 0.9], ['pressure', 0.8], ['overwhelmed', 1], ['too much', 0.7],
    ['burnt out', 1], ['burned out', 1], ['burnout', 1], ['exhausted', 0.7], ['swamped', 0.8], ['deadline', 0.5],
  ],
  SELF_DOUBT: [
    ['not good enough', 1], ['failure', 0.9], ['useless', 0.9], ['stupid', 0.8], ['worthless', 1], ['imposter', 0.9],
    ['impostor', 0.9], ['doubt myself', 1], ['cant do anything right', 1], ["can't do anything right", 1],
    ['disappointment', 0.8], ['incompetent', 0.9], ['not smart enough', 1],
  ],
  HOPELESSNESS: [
    ['hopeless', 1], ['no point', 1], ['pointless', 0.9], ['give up', 0.8], ['giving up', 0.8], ['cant go on', 1],
    ["can't go on", 1], ['nothing matters', 1], ['no future', 1], ['never get better', 1], ['what is the point', 1],
    ["what's the point", 1], ['whats the point', 1], ['trapped', 0.8], ['no way out', 1],
  ],
  POSITIVE: [
    ['happy', 1], ['grateful', 1], ['thankful', 1], ['excited', 1], ['proud', 1], ['better', 0.6], ['good', 0.5],
    ['great', 0.8], ['relieved', 0.9], ['calm', 0.7], ['hopeful', 1], ['motivated', 0.8], ['glad', 0.9], ['thanks', 0.5],
  ],
};
