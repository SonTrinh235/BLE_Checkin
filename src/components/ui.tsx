import { ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import Icon, { IconName } from './Icon';
import { colors, radius, spacing, Tone, toneColors, typography } from '../theme';

/* ------------------------------------------------------------------ */
/* Screen + Header                                                     */
/* ------------------------------------------------------------------ */

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  /** Pinned to the bottom (primary actions), above the safe area. */
  footer?: ReactNode;
  /** Fixed bar above the content (use <Header />). */
  header?: ReactNode;
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
  /** Use for screens with text fields so the keyboard doesn't cover them. */
  keyboard?: boolean;
};

export function Screen({
  children,
  scroll = false,
  footer,
  header,
  edges = ['top', 'bottom'],
  contentStyle,
  keyboard = false,
}: ScreenProps) {
  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.screenContent, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, styles.screenContent, contentStyle]}>{children}</View>
  );

  const inner = (
    <>
      {header}
      {body}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </>
  );

  return (
    <SafeAreaView style={styles.screen} edges={edges}>
      {keyboard ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {inner}
        </KeyboardAvoidingView>
      ) : (
        inner
      )}
    </SafeAreaView>
  );
}

export function Header({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          style={styles.headerBack}
        >
          <Icon name="back" size={22} color={colors.primary} />
        </Pressable>
      ) : null}
      <Text style={styles.headerTitle} numberOfLines={1}>
        {title}
      </Text>
      {right}
    </View>
  );
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.pageTitle}>
      <Text style={styles.display}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

/* ------------------------------------------------------------------ */
/* Button                                                              */
/* ------------------------------------------------------------------ */

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  icon?: IconName;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
}: ButtonProps) {
  const inactive = disabled || loading;
  const palette = {
    primary: { bg: colors.primary, fg: '#FFFFFF' },
    secondary: { bg: colors.accentLight, fg: colors.primary },
    danger: { bg: colors.error, fg: '#FFFFFF' },
    ghost: { bg: 'transparent', fg: colors.primary },
  }[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={inactive}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={[
        styles.button,
        { backgroundColor: inactive && variant !== 'ghost' ? colors.disabled : palette.bg },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={18} color={inactive ? colors.muted : palette.fg} /> : null}
          <Text style={[styles.buttonText, { color: inactive ? colors.muted : palette.fg }]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

/* ------------------------------------------------------------------ */
/* TextField                                                           */
/* ------------------------------------------------------------------ */

type TextFieldProps = TextInputProps & { label: string; error?: string | null; hint?: string };

export function TextField({ label, error, hint, style, ...rest }: TextFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        accessibilityLabel={label}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...rest}
      />
      {error ? (
        <Text style={[styles.fieldHint, { color: colors.error }]}>{error}</Text>
      ) : hint ? (
        <Text style={styles.fieldHint}>{hint}</Text>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Cards, badges, status                                               */
/* ------------------------------------------------------------------ */

export function Card({
  children,
  onPress,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        style={[styles.card, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const t = toneColors[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Text style={[styles.badgeText, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

/** Tinted card with a title and a one-line explanation — the design's status pattern. */
export function StatusCard({
  tone,
  title,
  subtitle,
  icon,
  busy,
}: {
  tone: Tone;
  title: string;
  subtitle?: string;
  icon?: IconName;
  busy?: boolean;
}) {
  const t = toneColors[tone];
  return (
    <View
      style={[styles.statusCard, { backgroundColor: t.bg }]}
      accessibilityRole="summary"
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
    >
      {busy ? (
        <ActivityIndicator color={t.fg} />
      ) : icon ? (
        <Icon name={icon} size={22} color={t.fg} />
      ) : null}
      <View style={styles.flex}>
        <Text style={[styles.statusTitle, { color: tone === 'neutral' ? colors.text : t.fg }]}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.statusSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

/** Large centered state used for full-screen feedback (success, errors, empty). */
export function HeroState({
  tone,
  icon,
  title,
  subtitle,
  busy,
  children,
}: {
  tone: Tone;
  icon: IconName;
  title: string;
  subtitle?: string;
  busy?: boolean;
  children?: ReactNode;
}) {
  const t = toneColors[tone];
  return (
    <View style={styles.hero}>
      <View style={[styles.heroIcon, { backgroundColor: t.bg }]}>
        {busy ? (
          <ActivityIndicator size="large" color={t.fg} />
        ) : (
          <Icon name={icon} size={36} color={t.fg} />
        )}
      </View>
      <Text style={styles.heroTitle}>{title}</Text>
      {subtitle ? <Text style={styles.heroSubtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.empty}>
      <Icon name={icon} size={28} color={colors.muted} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.accentLight,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: colors.primary, fontWeight: '700', fontSize: size * 0.36 }}>
        {initials || '?'}
      </Text>
    </View>
  );
}

export function Loading() {
  return (
    <View style={[styles.flex, { alignItems: 'center', justifyContent: 'center' }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.background },
  screenContent: { padding: spacing.lg, gap: spacing.md },
  footer: {
    padding: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBack: { padding: 2 },
  headerTitle: { ...typography.section, color: colors.text, flex: 1 },
  pageTitle: { gap: spacing.xs, marginBottom: spacing.sm },
  display: { ...typography.display, color: colors.primary },
  subtitle: { ...typography.body, color: colors.muted },
  sectionTitle: { ...typography.section, color: colors.text, marginTop: spacing.sm },

  button: {
    minHeight: 48,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  buttonText: { ...typography.button },

  field: { gap: 6 },
  fieldLabel: { ...typography.small, color: colors.text, fontWeight: '600' },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 15,
  },
  inputError: { borderColor: colors.error, backgroundColor: colors.errorLight },
  fieldHint: { ...typography.caption, color: colors.muted },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  badgeText: { ...typography.caption, fontWeight: '600' },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
  },
  statusTitle: { ...typography.section },
  statusSubtitle: { ...typography.small, color: colors.muted, marginTop: 2 },

  hero: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl },
  heroIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { ...typography.title, color: colors.text, textAlign: 'center' },
  heroSubtitle: { ...typography.body, color: colors.muted, textAlign: 'center', maxWidth: 300 },

  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl },
  emptyTitle: { ...typography.section, color: colors.text },
  emptySubtitle: { ...typography.small, color: colors.muted, textAlign: 'center' },
});
