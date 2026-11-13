/**
 * Offline evaluation of the deterministic safety and intent components on a
 * labelled synthetic dataset. Prints recall/false-positive rates so changes to
 * the lexicons can be measured. Run: pnpm --filter @mindbridge/api eval:safety
 */
process.env.NODE_ENV ??= 'test';
const { SafetyEngine } = await import('../modules/intelligence/safety-engine.service.js');
const { IntentClassifier } = await import('../modules/intelligence/intent-classifier.service.js');
const { SAFETY_DATASET, INTENT_DATASET } = await import('./evaluation-dataset.js');

const engine = new SafetyEngine();
const classifier = new IntentClassifier();

let tp = 0, fn = 0, fp = 0, tn = 0, exact = 0;
const misses: string[] = [];
for (const { text, expected } of SAFETY_DATASET) {
  const level = engine.assess({ message: text, recentMessages: [], conversation: { highestSafetyLevel: 'STANDARD' } }).level;
  const risky = expected !== 'STANDARD';
  const flagged = level !== 'STANDARD';
  if (level === expected) exact++;
  if (risky && flagged) tp++;
  else if (risky && !flagged) { fn++; misses.push(`MISSED  [${expected}] ${text}`); }
  else if (!risky && flagged) { fp++; misses.push(`FALSE+  [${level}] ${text}`); }
  else tn++;
  if (expected === 'POTENTIAL_IMMEDIATE_DANGER' && level !== expected) misses.push(`UNDER   [${level}] ${text}`);
}

let intentCorrect = 0;
for (const { text, expected } of INTENT_DATASET) if (classifier.classify(text).label === expected) intentCorrect++;

const pct = (n: number, d: number) => (d ? `${((n / d) * 100).toFixed(1)}%` : 'n/a');
console.log('Safety detection (synthetic set)');
console.log(`  cases: ${SAFETY_DATASET.length}`);
console.log(`  recall (any risk flagged):  ${pct(tp, tp + fn)}`);
console.log(`  false-positive rate:        ${pct(fp, fp + tn)}`);
console.log(`  exact level agreement:      ${pct(exact, SAFETY_DATASET.length)}`);
console.log(`Intent classification accuracy: ${pct(intentCorrect, INTENT_DATASET.length)} (${INTENT_DATASET.length} cases)`);
if (misses.length) console.log(`\nReview:\n  ${misses.join('\n  ')}`);
