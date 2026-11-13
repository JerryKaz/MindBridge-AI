import { describe, expect, it } from 'vitest';
import type { MoodEntry } from '@mindbridge/shared';
import { summarise } from './moods.service.js';

const now = new Date('2026-11-10T12:00:00Z');
const entry = (mood: MoodEntry['mood'], daysAgo: number): MoodEntry => ({
  id: `${mood}${daysAgo}`,
  mood,
  intensity: null,
  journal: null,
  recordedAt: new Date(now.getTime() - daysAgo * 86_400_000).toISOString(),
});

describe('mood summary', () => {
  it('builds a daily series and distribution', () => {
    const s = summarise([entry('CALM', 0), entry('STRESSED', 1), entry('STRESSED', 1)], 'week', now);
    expect(s.daily).toHaveLength(7);
    expect(s.daily.at(-2)).toMatchObject({ count: 2, dominantMood: 'STRESSED' });
    expect(s.distribution).toEqual([
      { mood: 'CALM', count: 1 },
      { mood: 'STRESSED', count: 2 },
    ]);
  });

  it('gives gentle, non-clinical observations', () => {
    const s = summarise(['SAD', 'ANXIOUS', 'STRESSED', 'SAD', 'CALM'].map((m, i) => entry(m as MoodEntry['mood'], i)), 'week', now);
    const text = s.insights.join(' ').toLowerCase();
    expect(text).toContain('harder side');
    expect(text).not.toMatch(/depress|disorder|diagnos/);
  });

  it('handles empty periods', () => {
    expect(summarise([], 'month', now).insights[0]).toMatch(/no check-ins/i);
  });
});
