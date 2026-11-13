import type { TextStyle } from 'react-native';

/** Calm, accessible palette. Text colours meet WCAG AA on `background`/`surface`. */
export const colors = {
  background: '#F5F8F7',
  surface: '#FFFFFF',
  surfaceMuted: '#EAF2EF',
  primary: '#2F7D6D',
  primaryDark: '#1F5E52',
  primarySoft: '#D7EBE5',
  accent: '#7A6FB0',
  accentSoft: '#ECE9F7',
  text: '#1D2B28',
  textMuted: '#55635F',
  border: '#D8E2DF',
  danger: '#B3261E',
  dangerSoft: '#FBE9E7',
  warning: '#8A5A00',
  warningSoft: '#FFF4DC',
  white: '#FFFFFF',
  studentBubble: '#2F7D6D',
  assistantBubble: '#FFFFFF',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 14, lg: 20, pill: 999 } as const;

export const typography: Record<'title' | 'heading' | 'subheading' | 'body' | 'caption' | 'label', TextStyle> = {
  title: { fontSize: 28, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  heading: { fontSize: 20, fontWeight: '700', color: colors.text },
  subheading: { fontSize: 16, fontWeight: '600', color: colors.text },
  body: { fontSize: 16, lineHeight: 23, color: colors.text },
  caption: { fontSize: 13, lineHeight: 18, color: colors.textMuted },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
};

export const shadow = {
  shadowColor: '#1D2B28',
  shadowOpacity: 0.06,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
  elevation: 2,
} as const;
