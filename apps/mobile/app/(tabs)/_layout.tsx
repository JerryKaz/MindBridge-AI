import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';
import { colors } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];
const icon = (name: IconName) => ({ color, size }: { color: ColorValue; size: number }) => <Ionicons name={name} color={color as string} size={size} />;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('home-outline') }} />
      <Tabs.Screen name="talk" options={{ title: 'Talk', tabBarIcon: icon('chatbubbles-outline') }} />
      <Tabs.Screen name="mood" options={{ title: 'Mood', tabBarIcon: icon('happy-outline') }} />
      <Tabs.Screen name="wellness" options={{ title: 'Wellness', tabBarIcon: icon('leaf-outline') }} />
      <Tabs.Screen name="support" options={{ title: 'Support', tabBarIcon: icon('people-outline') }} />
    </Tabs>
  );
}
