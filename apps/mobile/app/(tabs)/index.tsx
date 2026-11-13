import { Ionicons } from '@expo/vector-icons';
import { MOOD_LABELS } from '@mindbridge/shared';
import { Link, router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useConversations, useCreateConversation, useMoodHistory, useWellness } from '@/api/hooks';
import { AppText, Button, Card, SectionHeader, Screen } from '@/components/ui';
import { useAuth } from '@/store/auth';
import { colors, spacing } from '@/theme';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export default function Home() {
  const user = useAuth((s) => s.user);
  const moods = useMoodHistory('week');
  const conversations = useConversations();
  const wellness = useWellness();
  const create = useCreateConversation();

  const today = new Date().toISOString().slice(0, 10);
  const checkedInToday = moods.data?.daily.some((d) => d.date === today && d.count > 0);
  const latest = moods.data?.entries[0];
  const suggested = wellness.data?.find((a) =>
    latest && ['STRESSED', 'ANXIOUS', 'OVERWHELMED'].includes(latest.mood) ? a.category === 'BREATHING' : a.category === 'POSITIVE_REFLECTION',
  ) ?? wellness.data?.[0];

  const talk = async () => {
    const c = await create.mutateAsync();
    router.push(`/chat/${c.id}`);
  };

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <AppText variant="caption">{greeting()}</AppText>
          <AppText variant="title">Hello{user ? `, ${user.displayName}` : ''}!</AppText>
        </View>
        <Link href="/settings" accessibilityLabel="Profile and privacy settings">
          <Ionicons name="person-circle-outline" size={34} color={colors.primaryDark} />
        </Link>
      </View>

      <Card tone="soft">
        <AppText variant="heading">How are you feeling today?</AppText>
        {checkedInToday && latest ? (
          <AppText>
            You checked in feeling {MOOD_LABELS[latest.mood].emoji} {MOOD_LABELS[latest.mood].label.toLowerCase()}. Thanks for
            looking after yourself.
          </AppText>
        ) : (
          <AppText style={{ color: colors.textMuted }}>A 10-second check-in helps you notice patterns over time.</AppText>
        )}
        <Button title={checkedInToday ? 'Add another check-in' : 'Check in now'} variant="secondary" icon="happy-outline" onPress={() => router.push('/mood')} />
      </Card>

      <Card>
        <AppText variant="heading">Talk to MindBridge</AppText>
        <AppText style={{ color: colors.textMuted }}>Say whatever's on your mind. No judgement, at your own pace.</AppText>
        <Button title="Talk to MindBridge" icon="chatbubble-ellipses-outline" onPress={talk} loading={create.isPending} />
      </Card>

      {suggested && (
        <>
          <SectionHeader title="Suggested for you" />
          <Pressable onPress={() => router.push(`/wellness/${suggested.id}`)} accessibilityRole="button">
            <Card tone="accent">
              <AppText variant="subheading">{suggested.title}</AppText>
              <AppText variant="caption">
                {suggested.durationMinutes} min · {suggested.description}
              </AppText>
            </Card>
          </Pressable>
        </>
      )}

      {conversations.data && conversations.data.length > 0 && (
        <>
          <SectionHeader title="Recent conversations" />
          {conversations.data.slice(0, 2).map((c) => (
            <Pressable key={c.id} onPress={() => router.push(`/chat/${c.id}`)} accessibilityRole="button">
              <Card>
                <AppText variant="subheading">{c.title}</AppText>
                {c.lastMessagePreview && (
                  <AppText variant="caption" numberOfLines={1}>
                    {c.lastMessagePreview}
                  </AppText>
                )}
              </Card>
            </Pressable>
          ))}
        </>
      )}

      <Pressable onPress={() => router.push('/support')} accessibilityRole="button">
        <Card tone="danger">
          <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
            <Ionicons name="heart-outline" size={20} color={colors.danger} />
            <AppText variant="subheading" style={{ flex: 1 }}>
              Need to talk to a person?
            </AppText>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </View>
          <AppText variant="caption">See verified counselling and support services.</AppText>
        </Card>
      </Pressable>
    </Screen>
  );
}
