import { Ionicons } from '@expo/vector-icons';
import type { SupportResource } from '@mindbridge/shared';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { AppText, Card } from './ui';

const CATEGORY_LABEL: Record<SupportResource['category'], string> = {
  UNIVERSITY_COUNSELLING: 'Campus counselling',
  MENTAL_HEALTH_PROFESSIONAL: 'Mental health professional',
  SUPPORT_ORGANIZATION: 'Support organisation',
  EMERGENCY: 'Emergency',
  CRISIS_LINE: 'Crisis line',
};

function Action({ icon, label, onPress }: { icon: 'call' | 'mail' | 'globe-outline'; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="link" accessibilityLabel={label} onPress={onPress} style={styles.action}>
      <Ionicons name={icon} size={16} color={colors.primaryDark} />
      <AppText variant="label" style={{ color: colors.primaryDark }}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function ResourceCard({ resource, compact }: { resource: SupportResource; compact?: boolean }) {
  const urgent = resource.category === 'EMERGENCY' || resource.category === 'CRISIS_LINE';
  return (
    <Card tone={urgent ? 'danger' : 'default'}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }}>
        <AppText variant="subheading" style={{ flex: 1 }}>
          {resource.name}
        </AppText>
        <View style={styles.verified} accessibilityLabel="Verified resource">
          <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
          <AppText variant="caption" style={{ color: colors.primary }}>
            Verified
          </AppText>
        </View>
      </View>
      <AppText variant="caption">
        {CATEGORY_LABEL[resource.category]}
        {resource.university ? ` · ${resource.university.name}` : ''}
        {resource.isFree ? ' · Free' : ''}
      </AppText>
      {!compact && <AppText>{resource.description}</AppText>}
      {resource.availability && <AppText variant="caption">🕑 {resource.availability}</AppText>}
      {!compact && resource.location && <AppText variant="caption">📍 {resource.location}</AppText>}
      <View style={styles.actions}>
        {resource.phone && <Action icon="call" label={`Call ${resource.phone}`} onPress={() => Linking.openURL(`tel:${resource.phone!.replace(/[^\d+]/g, '')}`)} />}
        {resource.email && <Action icon="mail" label="Email" onPress={() => Linking.openURL(`mailto:${resource.email}`)} />}
        {resource.website && <Action icon="globe-outline" label="Website" onPress={() => Linking.openURL(resource.website!)} />}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  verified: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    minHeight: 40,
  },
});
