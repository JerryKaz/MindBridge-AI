import { MOOD_LABELS, MOODS, type Mood } from '@mindbridge/shared';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';

export function MoodPicker({ value, onChange }: { value: Mood | null; onChange: (m: Mood) => void }) {
  return (
    <View style={styles.grid} accessibilityRole="radiogroup">
      {MOODS.map((m) => {
        const selected = value === m;
        return (
          <Pressable
            key={m}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={MOOD_LABELS[m].label}
            onPress={() => onChange(m)}
            style={[styles.item, selected && styles.selected]}
          >
            <Text style={{ fontSize: 26 }}>{MOOD_LABELS[m].emoji}</Text>
            <Text style={[styles.label, selected && { color: colors.primaryDark }]}>{MOOD_LABELS[m].label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  item: {
    width: '31%',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 2,
  },
  selected: { borderColor: colors.primary, backgroundColor: colors.primarySoft, borderWidth: 2 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text },
});
