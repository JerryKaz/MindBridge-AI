import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@mindbridge/shared';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { login } from '@/api/auth';
import { ApiRequestError } from '@/api/client';
import { AppText, Button, Card, Screen, TextField } from '@/components/ui';
import { colors } from '@/theme';

export default function Login() {
  const [error, setError] = useState<string | null>(null);
  const { control, handleSubmit, formState } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await login(values);
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : 'Something went wrong');
    }
  });

  return (
    <Screen>
      <AppText variant="title">Welcome back</AppText>
      <AppText style={{ color: colors.textMuted }}>Sign in to continue.</AppText>
      {error && (
        <Card tone="danger">
          <AppText>{error}</AppText>
        </Card>
      )}
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <TextField label="Email" autoCapitalize="none" autoComplete="email" keyboardType="email-address" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field, fieldState }) => (
          <TextField label="Password" secureTextEntry autoComplete="current-password" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} onSubmitEditing={() => void onSubmit()} />
        )}
      />
      <Button title="Sign in" onPress={() => void onSubmit()} loading={formState.isSubmitting} />
      <Link href="/forgot-password" style={{ color: colors.primaryDark, fontWeight: '600', textAlign: 'center' }}>
        Forgot your password?
      </Link>
    </Screen>
  );
}
