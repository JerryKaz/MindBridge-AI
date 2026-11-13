import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@mindbridge/shared';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { register } from '@/api/auth';
import { ApiRequestError } from '@/api/client';
import { AppText, Button, Card, Screen, TextField } from '@/components/ui';
import { colors, spacing } from '@/theme';

export default function Register() {
  const [error, setError] = useState<string | null>(null);
  const { control, handleSubmit, formState } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', displayName: '', acceptedTerms: false as unknown as true },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await register(values);
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : 'Something went wrong');
    }
  });

  return (
    <Screen>
      <AppText variant="title">Create your space</AppText>
      <AppText style={{ color: colors.textMuted }}>
        We only ask for what we need. You can use a nickname — your real name isn't required.
      </AppText>
      {error && (
        <Card tone="danger">
          <AppText>{error}</AppText>
        </Card>
      )}
      <Controller
        control={control}
        name="displayName"
        render={({ field, fieldState }) => (
          <TextField label="What should we call you?" placeholder="A first name or nickname" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />
        )}
      />
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <TextField label="Email" autoCapitalize="none" keyboardType="email-address" autoComplete="email" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field, fieldState }) => (
          <TextField label="Password" secureTextEntry autoComplete="new-password" hint="At least 10 characters with a letter and a number" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />
        )}
      />
      <Controller
        control={control}
        name="acceptedTerms"
        render={({ field, fieldState }) => (
          <View style={{ gap: spacing.xs }}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: !!field.value }}
              onPress={() => field.onChange(!field.value)}
              style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}
            >
              <Ionicons name={field.value ? 'checkbox' : 'square-outline'} size={24} color={colors.primary} />
              <AppText style={{ flex: 1 }}>
                I've read the privacy notice and terms. I understand MindBridge AI is a support companion, not a therapist or an
                emergency service.
              </AppText>
            </Pressable>
            {fieldState.error && (
              <AppText variant="caption" style={{ color: colors.danger }}>
                {fieldState.error.message}
              </AppText>
            )}
          </View>
        )}
      />
      <Button title="Create account" onPress={() => void onSubmit()} loading={formState.isSubmitting} />
    </Screen>
  );
}
