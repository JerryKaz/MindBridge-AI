import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@mindbridge/shared';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { forgotPassword } from '@/api/auth';
import { ApiRequestError } from '@/api/client';
import { AppText, Button, Card, Screen, TextField } from '@/components/ui';
import { colors } from '@/theme';

export default function ForgotPassword() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { control, handleSubmit, formState } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async ({ email }) => {
    setError(null);
    try {
      setMessage((await forgotPassword(email)).message);
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : 'Something went wrong');
    }
  });

  return (
    <Screen>
      <AppText variant="title">Reset your password</AppText>
      <AppText style={{ color: colors.textMuted }}>Enter your email and we'll send you a link to choose a new password.</AppText>
      {message && (
        <Card tone="soft">
          <AppText>{message}</AppText>
        </Card>
      )}
      {error && (
        <Card tone="danger">
          <AppText>{error}</AppText>
        </Card>
      )}
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <TextField label="Email" autoCapitalize="none" keyboardType="email-address" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />
        )}
      />
      <Button title="Send reset link" onPress={() => void onSubmit()} loading={formState.isSubmitting} />
    </Screen>
  );
}
