import { MOODS, MOOD_LABELS, type CreateMoodInput, type Mood, type MoodEntry, type MoodHistory } from '@mindbridge/shared';
import { decryptField, encryptField } from '../../common/crypto.js';
import { badRequest, notFound } from '../../common/errors.js';
import { MoodEntryModel } from './mood-entry.model.js';

const RANGE_DAYS = { week: 7, month: 30, quarter: 90 } as const;
const DIFFICULT: Mood[] = ['STRESSED', 'ANXIOUS', 'SAD', 'OVERWHELMED', 'FRUSTRATED'];

type Lean = { _id: { toString(): string }; mood: string; intensity?: number | null; journalEnc?: string | null; recordedAt: Date };
const toEntry = (d: Lean): MoodEntry => ({
  id: d._id.toString(),
  mood: d.mood as Mood,
  intensity: d.intensity ?? null,
  journal: d.journalEnc ? decryptField(d.journalEnc) : null,
  recordedAt: d.recordedAt.toISOString(),
});

export async function create(studentId: string, input: CreateMoodInput): Promise<MoodEntry> {
  const recordedAt = input.recordedAt ? new Date(input.recordedAt) : new Date();
  if (recordedAt.getTime() > Date.now() + 5 * 60_000) throw badRequest('Check-ins cannot be in the future');
  const doc = await MoodEntryModel.create({
    student: studentId,
    mood: input.mood,
    intensity: input.intensity ?? null,
    journalEnc: input.journal ? encryptField(input.journal) : null,
    recordedAt,
  });
  return toEntry(doc);
}

export async function remove(studentId: string, id: string): Promise<void> {
  const r = await MoodEntryModel.deleteOne({ _id: id, student: studentId });
  if (r.deletedCount === 0) throw notFound('Check-in');
}

/** Pure summary logic, exported for unit tests. Observations are gentle and non-clinical. */
export function summarise(entries: MoodEntry[], range: MoodHistory['range'], now = new Date()): Omit<MoodHistory, 'entries' | 'range'> {
  const days = RANGE_DAYS[range];
  const counts = new Map<Mood, number>();
  for (const e of entries) counts.set(e.mood, (counts.get(e.mood) ?? 0) + 1);
  const distribution = MOODS.filter((m) => counts.has(m)).map((mood) => ({ mood, count: counts.get(mood)! }));

  const daily: MoodHistory['daily'] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    const sameDay = entries.filter((e) => e.recordedAt.slice(0, 10) === key);
    const c = new Map<Mood, number>();
    for (const e of sameDay) c.set(e.mood, (c.get(e.mood) ?? 0) + 1);
    const dominant = [...c.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    daily.push({ date: key, count: sameDay.length, dominantMood: dominant });
  }

  const insights: string[] = [];
  if (entries.length === 0) {
    insights.push('No check-ins yet for this period. A quick check-in only takes a few seconds.');
  } else {
    const activeDays = daily.filter((d) => d.count > 0).length;
    insights.push(`You checked in on ${activeDays} of the last ${days} days.`);
    const top = [...distribution].sort((a, b) => b.count - a.count)[0];
    if (top && entries.length >= 3) {
      insights.push(`"${MOOD_LABELS[top.mood].label}" came up most often.`);
    }
    const difficult = entries.filter((e) => DIFFICULT.includes(e.mood)).length;
    if (entries.length >= 4 && difficult / entries.length >= 0.6) {
      insights.push(
        'Many of your recent check-ins were on the harder side. Be kind to yourself — a wellness activity or talking to someone you trust might help.',
      );
    }
  }
  return { distribution, daily, insights };
}

export async function history(studentId: string, range: MoodHistory['range']): Promise<MoodHistory> {
  const since = new Date(Date.now() - RANGE_DAYS[range] * 86_400_000);
  const docs = await MoodEntryModel.find({ student: studentId, recordedAt: { $gte: since } })
    .sort({ recordedAt: -1 })
    .limit(500)
    .lean();
  const entries = docs.map(toEntry);
  return { range, entries, ...summarise(entries, range) };
}
