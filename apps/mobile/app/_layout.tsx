import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { restoreSession } from '@/api/auth';
import { ApiRequestError } from '@/api/client';
import { LoadingState } from '@/components/ui';
import { useAuth } from '@/store/auth';
import { colors } from '@/theme';

function AuthGate() {
  const { status, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    void restoreSession();
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    const first = segments[0] as string | undefined;
    const inAuth = first === '(auth)';
    const publicRoute = inAuth || first === 'reset-password';
    if (status === 'signedOut' && !publicRoute) router.replace('/welcome');
    else if (status === 'signedIn' && user && !user.onboardingCompleted && first !== 'onboarding') router.replace('/onboarding');
    else if (status === 'signedIn' && user?.onboardingCompleted && (inAuth || first === 'onboarding' || !first)) router.replace('/(tabs)');
  }, [status, user, segments, router]);

  if (status === 'loading') return <LoadingState label="Getting things ready…" />;

  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primaryDark,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="chat/[id]" options={{ title: 'MindBridge' }} />
      <Stack.Screen name="wellness/[id]" options={{ title: 'Activity' }} />
      <Stack.Screen name="settings" options={{ title: 'Profile & privacy' }} />
      <Stack.Screen name="reset-password" options={{ title: 'Reset password' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: (count, err) => !(err instanceof ApiRequestError && err.status >= 400 && err.status < 500) && count < 2,
            staleTime: 30_000,
          },
        },
      }),
  );
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <AuthGate />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
