import { MOOD_LABELS, type MoodHistory } from '@mindbridge/shared';
import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { AppText } from './ui';

/** Dependency-free bar chart of check-ins per day, labelled with the day's main mood. */
export function MoodChart({ history }: { history: MoodHistory }) {
  const days = history.range === 'week' ? history.daily : history.daily.slice(-14);
  const max = Math.max(1, ...days.map((d) => d.count));
  return (
    <View style={{ gap: spacing.sm }}>
      <View style={styles.chart} accessibilityLabel={`Check-ins over the last ${days.length} days`}>
        {days.map((d) => (
          <View key={d.date} style={styles.col}>
            <AppText style={{ fontSize: 14 }}>{d.dominantMood ? MOOD_LABELS[d.dominantMood].emoji : ' '}</AppText>
            <View style={styles.track}>
              <View style={[styles.bar, { height: `${(d.count / max) * 100}%` }]} />
            </View>
            <AppText variant="caption" style={{ fontSize: 10 }}>
              {new Date(`${d.date}T00:00:00Z`).toLocaleDateString(undefined, { weekday: 'narrow', timeZone: 'UTC' })}
            </AppText>
          </View>
        ))}
      </View>
      {history.distribution.length > 0 && (
        <View style={styles.legend}>
          {[...history.distribution]
            .sort((a, b) => b.count - a.count)
            .map((d) => (
              <AppText key={d.mood} variant="caption">
                {MOOD_LABELS[d.mood].emoji} {MOOD_LABELS[d.mood].label} × {d.count}
              </AppText>
            ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 140, gap: 4 },
  col: { flex: 1, alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' },
  track: { width: '70%', flex: 1, justifyContent: 'flex-end', backgroundColor: colors.surfaceMuted, borderRadius: radius.sm },
  bar: { width: '100%', backgroundColor: colors.primary, borderRadius: radius.sm, minHeight: 2 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
});
