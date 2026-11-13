import { MOOD_LABELS, type Mood, type MoodHistory } from '@mindbridge/shared';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { ApiRequestError } from '@/api/client';
import { useCreateMood, useDeleteMood, useMoodHistory } from '@/api/hooks';
import { MoodChart } from '@/components/MoodChart';
import { MoodPicker } from '@/components/MoodPicker';
import { AppText, Button, Card, Chip, EmptyState, ErrorState, LoadingState, Screen, SectionHeader, TextField } from '@/components/ui';
import { colors, spacing } from '@/theme';

const RANGES: Array<{ key: MoodHistory['range']; label: string }> = [
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'quarter', label: '3 months' },
];

export default function MoodScreen() {
  const [mood, setMood] = useState<Mood | null>(null);
  const [intensity, setIntensity] = useState<number | null>(null);
  const [journal, setJournal] = useState('');
  const [saved, setSaved] = useState(false);
  const [range, setRange] = useState<MoodHistory['range']>('week');
  const history = useMoodHistory(range);
  const create = useCreateMood();
  const remove = useDeleteMood();

  const save = () => {
    if (!mood) return;
    create.mutate(
      { mood, ...(intensity ? { intensity } : {}), ...(journal.trim() ? { journal: journal.trim() } : {}) },
      {
        onSuccess: () => {
          setMood(null);
          setIntensity(null);
          setJournal('');
          setSaved(true);
        },
        onError: (e) => Alert.alert('Could not save', e instanceof ApiRequestError ? e.message : 'Please try again'),
      },
    );
  };

  return (
    <Screen>
      <SectionHeader title="Check in" />
      {saved && !mood ? (
        <Card tone="soft">
          <AppText variant="subheading">Thanks for checking in 💚</AppText>
          <AppText variant="caption">Noticing how you feel is a skill — you're building it.</AppText>
          <Button title="Add another" variant="ghost" onPress={() => setSaved(false)} />
        </Card>
      ) : (
        <Card>
          <AppText variant="subheading">How are you feeling right now?</AppText>
          <MoodPicker value={mood} onChange={setMood} />
          {mood && (
            <>
              <AppText variant="label">How strong is it? (optional)</AppText>
              <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Chip key={n} label={`${n}`} selected={intensity === n} onPress={() => setIntensity(intensity === n ? null : n)} />
                ))}
              </View>
              <TextField
                label="Journal (optional, private)"
                placeholder="What's behind this feeling?"
                multiline
                maxLength={5000}
                value={journal}
                onChangeText={setJournal}
                hint="Encrypted and visible only to you."
              />
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <Button title="Save check-in" onPress={save} loading={create.isPending} style={{ flex: 1 }} />
                <Button title="Skip" variant="ghost" onPress={() => setMood(null)} />
              </View>
            </>
          )}
        </Card>
      )}

      <SectionHeader title="Your trends" />
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {RANGES.map((r) => (
          <Chip key={r.key} label={r.label} selected={range === r.key} onPress={() => setRange(r.key)} />
        ))}
      </View>
      {history.isPending ? (
        <LoadingState />
      ) : history.isError ? (
        <ErrorState message={history.error.message} onRetry={() => history.refetch()} />
      ) : (
        <>
          <Card>
            <MoodChart history={history.data} />
            {history.data.insights.map((i) => (
              <AppText key={i} variant="caption">
                • {i}
              </AppText>
            ))}
            <AppText variant="caption" style={{ fontStyle: 'italic' }}>
              Trends are for your own reflection — they are not a diagnosis.
            </AppText>
          </Card>
          {history.data.entries.length === 0 ? (
            <EmptyState icon="happy-outline" title="No check-ins yet" message="Your check-ins will appear here." />
          ) : (
            history.data.entries.slice(0, 20).map((e) => (
              <Card key={e.id}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <AppText variant="subheading">
                    {MOOD_LABELS[e.mood].emoji} {MOOD_LABELS[e.mood].label}
                    {e.intensity ? ` · ${e.intensity}/5` : ''}
                  </AppText>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Delete check-in"
                    onPress={() =>
                      Alert.alert('Delete check-in?', undefined, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => remove.mutate(e.id) },
                      ])
                    }
                  >
                    <AppText variant="caption" style={{ color: colors.danger }}>
                      Delete
                    </AppText>
                  </Pressable>
                </View>
                <AppText variant="caption">{new Date(e.recordedAt).toLocaleString()}</AppText>
                {e.journal && <AppText>{e.journal}</AppText>}
              </Card>
            ))
          )}
        </>
      )}
    </Screen>
  );
}
