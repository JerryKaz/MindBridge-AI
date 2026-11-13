import { passwordSchema } from '@mindbridge/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { resetPassword } from '@/api/auth';
import { ApiRequestError } from '@/api/client';
import { AppText, Button, Card, Screen, TextField } from '@/components/ui';

/** Opened from the emailed deep link: mindbridge://reset-password?token=... */
export default function ResetPassword() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? 'Invalid password');
    if (!token) return setError('This link is missing its reset code. Please request a new one.');
    setBusy(true);
    setError(null);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <AppText variant="title">Choose a new password</AppText>
      {done ? (
        <>
          <Card tone="soft">
            <AppText>Your password has been updated. You can sign in now.</AppText>
          </Card>
          <Button title="Go to sign in" onPress={() => router.replace('/login')} />
        </>
      ) : (
        <>
          {error && (
            <Card tone="danger">
              <AppText>{error}</AppText>
            </Card>
          )}
          <TextField label="New password" secureTextEntry value={password} onChangeText={setPassword} hint="At least 10 characters with a letter and a number" />
          <Button title="Update password" onPress={submit} loading={busy} />
        </>
      )}
    </Screen>
  );
}
