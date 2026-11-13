import { WELLNESS_CATEGORIES, type WellnessCategory } from '@mindbridge/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView } from 'react-native';
import { useWellness } from '@/api/hooks';
import { CATEGORY_LABELS } from '@/lib/labels';
import { AppText, Card, Chip, EmptyState, ErrorState, LoadingState, Screen, SectionHeader } from '@/components/ui';
import { spacing } from '@/theme';


export default function Wellness() {
  const [category, setCategory] = useState<WellnessCategory | null>(null);
  const activities = useWellness();
  const list = activities.data?.filter((a) => !category || a.category === category) ?? [];

  return (
    <Screen>
      <SectionHeader title="Wellness" />
      <AppText variant="caption">Short, practical activities you can do anywhere — between lectures, before an exam, or at night.</AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
        <Chip label="All" selected={!category} onPress={() => setCategory(null)} />
        {WELLNESS_CATEGORIES.map((c) => (
          <Chip key={c} label={CATEGORY_LABELS[c]} selected={category === c} onPress={() => setCategory(c)} />
        ))}
      </ScrollView>
      {activities.isPending ? (
        <LoadingState />
      ) : activities.isError ? (
        <ErrorState message={activities.error.message} onRetry={() => activities.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState icon="leaf-outline" title="Nothing here yet" message="New activities are added by the MindBridge team." />
      ) : (
        list.map((a) => (
          <Pressable key={a.id} onPress={() => router.push(`/wellness/${a.id}`)} accessibilityRole="button">
            <Card>
              <AppText variant="subheading">{a.title}</AppText>
              <AppText variant="caption">
                {CATEGORY_LABELS[a.category]} · {a.durationMinutes} min
              </AppText>
              <AppText>{a.description}</AppText>
            </Card>
          </Pressable>
        ))
      )}
    </Screen>
  );
}
