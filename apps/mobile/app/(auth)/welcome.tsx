import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { View } from 'react-native';
import { AppText, Button, Screen } from '@/components/ui';
import { colors, spacing } from '@/theme';

export default function Welcome() {
  return (
    <Screen scroll={false} edges={['top', 'bottom']}>
      <View style={{ flex: 1, justifyContent: 'center', gap: spacing.lg }}>
        <View
          style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="leaf-outline" size={36} color={colors.primary} />
        </View>
        <AppText variant="title">MindBridge AI</AppText>
        <AppText variant="subheading" style={{ color: colors.primaryDark }}>
          Your wellbeing. Your space. Your support.
        </AppText>
        <AppText style={{ color: colors.textMuted }}>
          A private place to talk through how you're feeling, check in with yourself, and find support when you need it — made
          for students in Ghana.
        </AppText>
      </View>
      <View style={{ gap: spacing.md }}>
        <Button title="Create an account" onPress={() => router.push('/register')} />
        <Button title="I already have an account" variant="secondary" onPress={() => router.push('/login')} />
        <AppText variant="caption" style={{ textAlign: 'center' }}>
          MindBridge is not an emergency service. If you are in danger, contact emergency services right away.
        </AppText>
      </View>
    </Screen>
  );
}
