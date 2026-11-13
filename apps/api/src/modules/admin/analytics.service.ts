import type { AdminAnalytics, Mood } from '@mindbridge/shared';
import { ConversationModel } from '../conversations/conversation.model.js';
import { MessageModel } from '../conversations/message.model.js';
import { AiInteractionModel } from '../intelligence/ai-interaction.model.js';
import { SafetyEventModel } from '../intelligence/safety-event.model.js';
import { MoodEntryModel } from '../moods/mood-entry.model.js';
import { UserModel } from '../students/user.model.js';
import { SupportResourceModel } from '../support/support-resource.model.js';
import { WellnessActivityModel } from '../wellness/wellness-activity.model.js';

/** k-anonymity threshold: categorical buckets smaller than this are suppressed. */
export const MIN_COHORT_SIZE = 5;
const DAY = 86_400_000;

export const suppressSmall = <T extends { count: number }>(rows: T[]): T[] => rows.filter((r) => r.count >= MIN_COHORT_SIZE);

/**
 * Aggregate, de-identified analytics. No query here returns per-student rows,
 * message text, journal text or safety-event details.
 */
export async function getAnalytics(): Promise<AdminAnalytics> {
  const now = Date.now();
  const since30 = new Date(now - 30 * DAY);
  const since84 = new Date(now - 84 * DAY);
  const dayFmt = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };

  const [
    students,
    active7,
    active30,
    conversations,
    moodCheckIns,
    wellnessPublished,
    verifiedResources,
    moodDist,
    checkIns,
    messages,
    safetyWeekly,
    byUniversity,
    perf,
  ] = await Promise.all([
    UserModel.countDocuments({ role: 'STUDENT' }),
    UserModel.countDocuments({ role: 'STUDENT', lastActiveAt: { $gte: new Date(now - 7 * DAY) } }),
    UserModel.countDocuments({ role: 'STUDENT', lastActiveAt: { $gte: since30 } }),
    ConversationModel.estimatedDocumentCount(),
    MoodEntryModel.estimatedDocumentCount(),
    WellnessActivityModel.countDocuments({ published: true }),
    SupportResourceModel.countDocuments({ verificationStatus: 'VERIFIED', published: true }),
    MoodEntryModel.aggregate<{ _id: Mood; count: number }>([
      { $match: { recordedAt: { $gte: since30 } } },
      { $group: { _id: '$mood', count: { $sum: 1 } } },
    ]),
    MoodEntryModel.aggregate<{ _id: string; count: number }>([
      { $match: { createdAt: { $gte: since30 } } },
      { $group: { _id: dayFmt, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    MessageModel.aggregate<{ _id: string; count: number }>([
      { $match: { createdAt: { $gte: since30 }, role: 'student' } },
      { $group: { _id: dayFmt, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    SafetyEventModel.aggregate<{ _id: { week: string; level: string }; count: number }>([
      { $match: { createdAt: { $gte: since84 } } },
      {
        $group: {
          _id: { week: { $dateToString: { format: '%G-W%V', date: '$createdAt' } }, level: '$level' },
          count: { $sum: 1 },
        },
      },
    ]),
    UserModel.aggregate<{ _id: string | null; count: number }>([
      { $match: { role: 'STUDENT' } },
      { $lookup: { from: 'universities', localField: 'university', foreignField: '_id', as: 'u' } },
      { $group: { _id: { $ifNull: [{ $first: '$u.shortName' }, 'Not specified'] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    AiInteractionModel.aggregate<{ avg: number; p95: number[]; fallback: number; n: number }>([
      { $match: { createdAt: { $gte: since30 } } },
      {
        $group: {
          _id: null,
          avg: { $avg: '$latencyMs' },
          p95: { $percentile: { input: '$latencyMs', p: [0.95], method: 'approximate' } },
          fallback: { $avg: { $cond: ['$usedFallback', 1, 0] } },
          n: { $sum: 1 },
        },
      },
    ]),
  ]);

  const weeks = new Map<string, { week: string; standard: number; elevated: number; immediate: number }>();
  for (const row of safetyWeekly) {
    const w = weeks.get(row._id.week) ?? { week: row._id.week, standard: 0, elevated: 0, immediate: 0 };
    if (row._id.level === 'ELEVATED_CONCERN') w.elevated += row.count;
    else if (row._id.level === 'POTENTIAL_IMMEDIATE_DANGER') w.immediate += row.count;
    else w.standard += row.count;
    weeks.set(row._id.week, w);
  }
  const p = perf[0];

  return {
    generatedAt: new Date().toISOString(),
    minCohortSize: MIN_COHORT_SIZE,
    totals: {
      students,
      activeLast7Days: active7,
      activeLast30Days: active30,
      conversations,
      moodCheckIns,
      wellnessActivitiesPublished: wellnessPublished,
      verifiedSupportResources: verifiedResources,
    },
    moodDistribution: suppressSmall(moodDist.map((m) => ({ mood: m._id, count: m.count }))),
    checkInsByDay: checkIns.map((d) => ({ date: d._id, count: d.count })),
    messagesByDay: messages.map((d) => ({ date: d._id, count: d.count })),
    safetyLevelsByWeek: [...weeks.values()].sort((a, b) => a.week.localeCompare(b.week)),
    registrationsByUniversity: suppressSmall(byUniversity.map((u) => ({ university: u._id ?? 'Not specified', count: u.count }))),
    aiPerformance: {
      avgLatencyMs: Math.round(p?.avg ?? 0),
      p95LatencyMs: Math.round(p?.p95?.[0] ?? 0),
      fallbackRate: Math.round((p?.fallback ?? 0) * 1000) / 1000,
      interactions: p?.n ?? 0,
    },
  };
}
