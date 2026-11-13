import type { ConsentType } from '@mindbridge/shared';
import { useState } from 'react';
import { Alert, Pressable, Share, Switch, View } from 'react-native';
import { logout } from '@/api/auth';
import { ApiRequestError } from '@/api/client';
import { deleteMyAccount, exportMyData, useAddMemory, useConsents, useDeleteMemory, useMemories, useUpdateConsents } from '@/api/hooks';
import { AppText, Button, Card, Screen, SectionHeader, TextField } from '@/components/ui';
import { useAuth } from '@/store/auth';
import { colors, spacing } from '@/theme';

const LABELS: Partial<Record<ConsentType, { title: string; body: string }>> = {
  AI_PROCESSING: { title: 'AI conversations', body: 'Needed to chat with MindBridge.' },
  CONVERSATION_MEMORY: { title: 'Use my saved notes', body: 'Let MindBridge use notes you save below to personalise replies.' },
  ANONYMOUS_ANALYTICS: { title: 'Anonymous analytics', body: 'Contribute to aggregated, de-identified statistics.' },
};

export default function Settings() {
  const { user, showInsights, setShowInsights } = useAuth();
  const consents = useConsents();
  const updateConsents = useUpdateConsents();
  const memoryOn = consents.data?.find((c) => c.type === 'CONVERSATION_MEMORY')?.granted ?? false;
  const memories = useMemories(memoryOn);
  const addMemory = useAddMemory();
  const deleteMemory = useDeleteMemory();
  const [note, setNote] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<'export' | 'delete' | null>(null);

  const toggle = (type: ConsentType, granted: boolean) =>
    updateConsents.mutate([{ type, granted }], {
      onError: (e) => Alert.alert('Could not update', e.message),
    });

  const doExport = async () => {
    setBusy('export');
    try {
      const data = await exportMyData();
      await Share.share({ title: 'My MindBridge data', message: JSON.stringify(data, null, 2) });
    } catch (e) {
      Alert.alert('Export failed', e instanceof ApiRequestError ? e.message : 'Please try again');
    } finally {
      setBusy(null);
    }
  };

  const doDelete = () =>
    Alert.alert('Delete your account?', 'This permanently deletes your account, conversations, check-ins and notes. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete everything',
        style: 'destructive',
        onPress: async () => {
          setBusy('delete');
          try {
            await deleteMyAccount(password);
            await useAuth.getState().clear();
          } catch (e) {
            Alert.alert('Could not delete', e instanceof ApiRequestError ? e.message : 'Please try again');
          } finally {
            setBusy(null);
          }
        },
      },
    ]);

  return (
    <Screen edges={[]}>
      <Card>
        <AppText variant="heading">{user?.displayName}</AppText>
        <AppText variant="caption">{user?.email}</AppText>
        {user?.university && <AppText variant="caption">{user.university.name}</AppText>}
      </Card>

      <SectionHeader title="Privacy choices" />
      {consents.data
        ?.filter((c) => LABELS[c.type])
        .map((c) => (
          <Card key={c.type}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <AppText variant="subheading">{LABELS[c.type]!.title}</AppText>
                <AppText variant="caption">{LABELS[c.type]!.body}</AppText>
              </View>
              <Switch accessibilityLabel={LABELS[c.type]!.title} value={c.granted} onValueChange={(v) => toggle(c.type, v)} trackColor={{ true: colors.primary, false: colors.border }} />
            </View>
          </Card>
        ))}

      {memoryOn && (
        <>
          <SectionHeader title="Notes MindBridge can use" />
          <Card>
            <AppText variant="caption">Only what you add here is remembered. e.g. "I'm a level 300 nursing student".</AppText>
            {memories.data?.map((m) => (
              <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <AppText style={{ flex: 1 }}>• {m.content}</AppText>
                <Pressable onPress={() => deleteMemory.mutate(m.id)} accessibilityRole="button" accessibilityLabel="Remove note">
                  <AppText variant="caption" style={{ color: colors.danger }}>
                    Remove
                  </AppText>
                </Pressable>
              </View>
            ))}
            <TextField label="Add a note" value={note} onChangeText={setNote} maxLength={300} />
            <Button
              title="Save note"
              variant="secondary"
              disabled={note.trim().length < 3}
              loading={addMemory.isPending}
              onPress={() => addMemory.mutate(note.trim(), { onSuccess: () => setNote(''), onError: (e) => Alert.alert('Could not save', e.message) })}
            />
          </Card>
        </>
      )}

      <SectionHeader title="Transparency" />
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <AppText variant="subheading">Show AI insights</AppText>
            <AppText variant="caption">See how MindBridge understood each message (topic, safety check, approach).</AppText>
          </View>
          <Switch accessibilityLabel="Show AI insights" value={showInsights} onValueChange={setShowInsights} trackColor={{ true: colors.primary, false: colors.border }} />
        </View>
      </Card>

      <SectionHeader title="Your data" />
      <Card>
        <Button title="Export my data" variant="secondary" icon="download-outline" onPress={doExport} loading={busy === 'export'} />
      </Card>
      <Card tone="danger">
        <AppText variant="subheading">Delete account</AppText>
        <TextField label="Confirm with your password" secureTextEntry value={password} onChangeText={setPassword} />
        <Button title="Delete my account" variant="danger" disabled={!password} loading={busy === 'delete'} onPress={doDelete} />
      </Card>

      <Button title="Sign out" variant="ghost" icon="log-out-outline" onPress={() => void logout()} />
    </Screen>
  );
}
