import { TextStyle } from 'react-native';

// Design tokens taken from the Figma "BLE / Design system" frame.
// Navy for actions, cyan/accent for connectivity, status always labelled.
export const colors = {
  primary: '#1E3A8A',
  primaryVariant: '#1D4ED8',
  accent: '#0369A1',
  accentLight: '#F0F9FF',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  text: '#171717',
  muted: '#525252',
  border: '#E5E5E5',
  success: '#15803D',
  successLight: '#F0FDF4',
  warning: '#854D0E',
  warningLight: '#FEFCE8',
  error: '#B91C1C',
  errorLight: '#FEF2F2',
  disabled: '#D4D4D4',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;

export const typography = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  section: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  small: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  caption: { fontSize: 11, lineHeight: 14, fontWeight: '400' },
  button: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
} satisfies Record<string, TextStyle>;

export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'error';

export const toneColors: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: colors.background, fg: colors.muted },
  info: { bg: colors.accentLight, fg: colors.accent },
  success: { bg: colors.successLight, fg: colors.success },
  warning: { bg: colors.warningLight, fg: colors.warning },
  error: { bg: colors.errorLight, fg: colors.error },
};
