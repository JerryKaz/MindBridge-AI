import { Ionicons } from '@expo/vector-icons';
import type { PipelineTrace } from '@mindbridge/shared';
import { MESSAGE_MAX_LENGTH } from '@mindbridge/shared';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiRequestError } from '@/api/client';
import { useConversation, useDeleteConversation, useSendMessage } from '@/api/hooks';
import { MessageBubble, TypingIndicator } from '@/components/chat';
import { AppText, Button, Chip, EmptyState, ErrorState, LoadingState } from '@/components/ui';
import { useAuth } from '@/store/auth';
import { colors, radius, spacing } from '@/theme';

const STARTERS = ["I'm stressed about exams", 'I feel lonely lately', "I can't get motivated", 'I just need to vent'];

export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversation = useConversation(id);
  const [traces, setTraces] = useState<Record<string, PipelineTrace>>({});
  const send = useSendMessage(id, (messageId, trace) => setTraces((t) => ({ ...t, [messageId]: trace })));
  const remove = useDeleteConversation();
  const showInsights = useAuth((s) => s.showInsights);
  const [text, setText] = useState('');
  const list = useRef<FlatList>(null);

  const messages = conversation.data?.messages ?? [];
  const last = messages[messages.length - 1];
  const suggestions = !send.isPending && last?.role === 'assistant' ? last.suggestions ?? [] : [];

  useEffect(() => {
    if (messages.length) setTimeout(() => list.current?.scrollToEnd({ animated: true }), 50);
  }, [messages.length, send.isPending]);

  const submit = (content = text) => {
    const trimmed = content.trim();
    if (!trimmed || send.isPending) return;
    setText('');
    send.mutate(trimmed, {
      onError: (e) => {
        setText(trimmed);
        if (e instanceof ApiRequestError && e.code === 'CONSENT_REQUIRED') {
          Alert.alert('AI conversations are off', e.message, [
            { text: 'Not now', style: 'cancel' },
            { text: 'Open settings', onPress: () => router.push('/settings') },
          ]);
        } else {
          Alert.alert("Message didn't send", e.message);
        }
      },
    });
  };

  const confirmDelete = () =>
    Alert.alert('Delete conversation?', 'This permanently deletes this conversation.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove.mutate(id, { onSuccess: () => router.back() }) },
    ]);

  if (conversation.isPending) return <LoadingState />;
  if (conversation.isError) return <ErrorState message={conversation.error.message} onRetry={() => conversation.refetch()} />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: conversation.data.title,
          headerRight: () => (
            <Pressable onPress={confirmDelete} accessibilityRole="button" accessibilityLabel="Delete conversation" hitSlop={12}>
              <Ionicons name="trash-outline" size={20} color={colors.textMuted} />
            </Pressable>
          ),
        }}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <FlatList
          ref={list}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, flexGrow: 1 }}
          renderItem={({ item }) => <MessageBubble message={item} trace={showInsights ? traces[item.id] : undefined} />}
          ListEmptyComponent={
            <EmptyState
              icon="chatbubble-ellipses-outline"
              title="What's on your mind?"
              message="You can write as much or as little as you like. MindBridge is here to listen."
              action={
                <View style={styles.starters}>
                  {STARTERS.map((s) => (
                    <Chip key={s} label={s} onPress={() => submit(s)} />
                  ))}
                </View>
              }
            />
          }
          ListFooterComponent={send.isPending ? <TypingIndicator /> : undefined}
        />
        {suggestions.length > 0 && (
          <View style={[styles.starters, { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }]}>
            {suggestions.map((s) => (
              <Chip key={s} label={s} onPress={() => (s === 'Show me support options' ? router.push('/support') : submit(s))} />
            ))}
          </View>
        )}
        <View style={styles.composer}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Type how you're feeling…"
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={MESSAGE_MAX_LENGTH}
            style={styles.input}
            accessibilityLabel="Message"
          />
          <Button title="Send" onPress={() => submit()} disabled={!text.trim()} loading={send.isPending} style={{ paddingHorizontal: spacing.lg }} />
        </View>
        <AppText variant="caption" style={{ textAlign: 'center', paddingBottom: spacing.xs }}>
          MindBridge is AI and can make mistakes. In an emergency, contact emergency services.
        </AppText>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  starters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 44,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.text,
  },
});
