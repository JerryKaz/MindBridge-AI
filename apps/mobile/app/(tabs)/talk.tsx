import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, Pressable, View } from 'react-native';
import { useConversations, useCreateConversation, useDeleteConversation } from '@/api/hooks';
import { AppText, Button, Card, EmptyState, ErrorState, LoadingState, Screen, SectionHeader } from '@/components/ui';
import { colors, spacing } from '@/theme';

export default function Talk() {
  const conversations = useConversations();
  const create = useCreateConversation();
  const remove = useDeleteConversation();

  const start = async () => {
    const c = await create.mutateAsync();
    router.push(`/chat/${c.id}`);
  };

  const confirmDelete = (id: string) =>
    Alert.alert('Delete conversation?', 'This permanently deletes the conversation and everything derived from it.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove.mutate(id) },
    ]);

  return (
    <Screen>
      <SectionHeader title="Conversations" />
      <Button title="New conversation" icon="add" onPress={start} loading={create.isPending} />
      {conversations.isPending ? (
        <LoadingState />
      ) : conversations.isError ? (
        <ErrorState message={conversations.error.message} onRetry={() => conversations.refetch()} />
      ) : conversations.data.length === 0 ? (
        <EmptyState icon="chatbubbles-outline" title="No conversations yet" message="Start one whenever you're ready. Everything you share stays private to you." />
      ) : (
        conversations.data.map((c) => (
          <Pressable key={c.id} onPress={() => router.push(`/chat/${c.id}`)} accessibilityRole="button" accessibilityLabel={`Open ${c.title}`}>
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText variant="subheading">{c.title}</AppText>
                  {c.lastMessagePreview && (
                    <AppText variant="caption" numberOfLines={1}>
                      {c.lastMessagePreview}
                    </AppText>
                  )}
                  <AppText variant="caption">{new Date(c.updatedAt).toLocaleString()}</AppText>
                </View>
                <Pressable onPress={() => confirmDelete(c.id)} accessibilityRole="button" accessibilityLabel={`Delete ${c.title}`} hitSlop={12}>
                  <Ionicons name="trash-outline" size={20} color={colors.textMuted} />
                </Pressable>
              </View>
            </Card>
          </Pressable>
        ))
      )}
    </Screen>
  );
}
