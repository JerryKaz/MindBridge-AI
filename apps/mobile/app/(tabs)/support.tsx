import type { SupportCategory } from '@mindbridge/shared';
import { useState } from 'react';
import { ScrollView } from 'react-native';
import { useSupportResources } from '@/api/hooks';
import { ResourceCard } from '@/components/ResourceCard';
import { AppText, Card, Chip, EmptyState, ErrorState, LoadingState, Screen, SectionHeader } from '@/components/ui';
import { spacing } from '@/theme';

const FILTERS: Array<{ key: SupportCategory | null; label: string }> = [
  { key: null, label: 'All' },
  { key: 'UNIVERSITY_COUNSELLING', label: 'Campus counselling' },
  { key: 'MENTAL_HEALTH_PROFESSIONAL', label: 'Professionals' },
  { key: 'SUPPORT_ORGANIZATION', label: 'Organisations' },
  { key: 'CRISIS_LINE', label: 'Crisis lines' },
  { key: 'EMERGENCY', label: 'Emergency' },
];

export default function Support() {
  const [category, setCategory] = useState<SupportCategory | null>(null);
  const resources = useSupportResources(category ?? undefined);

  return (
    <Screen>
      <SectionHeader title="Find support" />
      <Card tone="danger">
        <AppText variant="subheading">In immediate danger?</AppText>
        <AppText>Contact emergency services or go to the nearest hospital emergency department now.</AppText>
      </Card>
      <AppText variant="caption">
        Every service listed here has been verified by the MindBridge team. You never need to share your conversations to use them.
      </AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
        {FILTERS.map((f) => (
          <Chip key={f.label} label={f.label} selected={category === f.key} onPress={() => setCategory(f.key)} />
        ))}
      </ScrollView>
      {resources.isPending ? (
        <LoadingState />
      ) : resources.isError ? (
        <ErrorState message={resources.error.message} onRetry={() => resources.refetch()} />
      ) : resources.data.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="No verified services listed yet"
          message="We only show services we have verified. In the meantime, your university's student affairs office can connect you with counselling."
        />
      ) : (
        resources.data.map((r) => <ResourceCard key={r.id} resource={r} />)
      )}
    </Screen>
  );
}
