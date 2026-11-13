import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useActivity, useCompleteActivity } from '@/api/hooks';
import { AppText, Button, Card, ErrorState, LoadingState, Screen } from '@/components/ui';
import { colors, spacing } from '@/theme';

export default function ActivityScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const activity = useActivity(id);
  const complete = useCompleteActivity();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  if (activity.isPending) return <LoadingState />;
  if (activity.isError) return <ErrorState message={activity.error.message} onRetry={() => activity.refetch()} />;
  const a = activity.data;
  const last = step === a.instructions.length - 1;

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: a.title }} />
      <AppText variant="title">{a.title}</AppText>
      <AppText variant="caption">About {a.durationMinutes} min</AppText>
      <AppText>{a.description}</AppText>
      {a.reviewStatus !== 'PROFESSIONALLY_REVIEWED' && (
        <AppText variant="caption" style={{ fontStyle: 'italic' }}>
          General wellbeing guidance. Stop if anything feels uncomfortable.
        </AppText>
      )}
      {done ? (
        <Card tone="soft">
          <AppText variant="subheading">Nicely done 🌿</AppText>
          <AppText>Take a moment to notice how you feel now.</AppText>
          <Button title="Back to activities" variant="secondary" onPress={() => router.back()} />
        </Card>
      ) : (
        <Card>
          <AppText variant="caption">
            Step {step + 1} of {a.instructions.length}
          </AppText>
          <AppText variant="heading" style={{ lineHeight: 28 }}>
            {a.instructions[step]}
          </AppText>
          <View style={{ flexDirection: 'row', gap: 6, marginVertical: spacing.sm }}>
            {a.instructions.map((_, i) => (
              <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= step ? colors.primary : colors.border }} />
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {step > 0 && <Button title="Back" variant="secondary" onPress={() => setStep(step - 1)} />}
            <Button
              title={last ? 'Finish' : 'Next'}
              style={{ flex: 1 }}
              onPress={() => {
                if (!last) return setStep(step + 1);
                complete.mutate(a.id);
                setDone(true);
              }}
            />
          </View>
        </Card>
      )}
    </Screen>
  );
}
