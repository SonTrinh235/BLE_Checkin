import { TextStyle } from 'react-native';

// Design tokens taken from the Figma "BLE / Design system" frame.
// Navy for actions, cyan/accent for connectivity, status always labelled.
export const lightColors = {
  primary: '#1E3A8A', // fills: buttons, hero blocks (white text on top)
  primaryVariant: '#1D4ED8',
  link: '#1E3A8A', // brand colour for text/icons that sit on a surface
  accent: '#0369A1',
  accentLight: '#F0F9FF',
  accentBorder: '#BAE6FD',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  text: '#171717',
  muted: '#525252',
  border: '#E5E5E5',
  success: '#15803D',
  successLight: '#F0FDF4',
  warning: '#854D0E',
  warningLight: '#FEFCE8',
  warningBorder: '#FDE68A',
  error: '#B91C1C',
  errorLight: '#FEF2F2',
  disabled: '#D4D4D4',
};

export type Palette = { [K in keyof typeof lightColors]: string };

// Dark palette: deep navy surfaces, same hues. `primary` stays a saturated
// fill (white text on it passes AA) while `link` is a lighter blue so brand
// text and icons stay readable on dark surfaces.
export const darkColors: Palette = {
  primary: '#2D5BE3',
  primaryVariant: '#4F83F1',
  link: '#8AB4FF',
  accent: '#38BDF8',
  accentLight: '#0E2A3D',
  accentBorder: '#164E63',
  background: '#0B1120',
  surface: '#121A2C',
  text: '#F1F5F9',
  muted: '#9AA7BC',
  border: '#25314A',
  success: '#4ADE80',
  successLight: '#0F2A1D',
  warning: '#FACC15',
  warningLight: '#2B2511',
  warningBorder: '#5B4A12',
  error: '#F87171',
  errorLight: '#2E1519',
  disabled: '#2A3550',
};

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

export function toneColorsFor(colors: Palette): Record<Tone, { bg: string; fg: string }> {
  return {
    neutral: { bg: colors.background, fg: colors.muted },
    info: { bg: colors.accentLight, fg: colors.accent },
    success: { bg: colors.successLight, fg: colors.success },
    warning: { bg: colors.warningLight, fg: colors.warning },
    error: { bg: colors.errorLight, fg: colors.error },
  };
}
