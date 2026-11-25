import { ReactNode, Ref, useEffect, useRef, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  DimensionValue,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  interpolateColor,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import AnimatedCheck from './AnimatedCheck';
import Icon, { IconName } from './Icon';
import { radius, spacing, Tone, typography, toneColorsFor, Palette } from '../theme';
import { useColors, useTheme } from '../theme/useTheme';
import { GestureDetector } from 'react-native-gesture-handler';
import { haptics } from '../ui/haptics';
import { useSlidingBubble } from '../ui/useSlidingBubble';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Springy press feedback that runs on the UI thread.
function usePressScale(to: number) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return {
    style,
    onPressIn: () => {
      scale.value = withTiming(to, { duration: 90 });
    },
    onPressOut: () => {
      scale.value = withTiming(1, { duration: 150 });
    },
  };
}

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
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
          <Icon name="back" size={22} color={colors.link} />
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
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.pageTitle}>
      <Text style={styles.display}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function SectionTitle({ children }: { children: string }) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const inactive = disabled || loading;
  const palette = {
    primary: { bg: colors.primary, fg: '#FFFFFF' },
    secondary: { bg: colors.accentLight, fg: colors.link },
    danger: { bg: colors.error, fg: '#FFFFFF' },
    ghost: { bg: 'transparent', fg: colors.link },
  }[variant];

  const press = usePressScale(0.97);

  return (
    <AnimatedPressable
      onPress={() => {
        if (variant === 'primary' || variant === 'danger') haptics.light();
        onPress();
      }}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={[
        styles.button,
        { backgroundColor: inactive && variant !== 'ghost' ? colors.disabled : palette.bg },
        press.style,
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
    </AnimatedPressable>
  );
}

/* ------------------------------------------------------------------ */
/* TextField                                                           */
/* ------------------------------------------------------------------ */

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string | null;
  hint?: string;
  /** React 19 passes `ref` as a normal prop; forwarded to the TextInput (focus chaining). */
  ref?: Ref<TextInput>;
};

export function TextField({
  label,
  error,
  hint,
  style,
  secureTextEntry,
  onFocus,
  onBlur,
  ...rest
}: TextFieldProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { isDark } = useTheme();
  const [hidden, setHidden] = useState(true);
  const isPassword = !!secureTextEntry;

  // The border eases to the brand colour while the field has focus.
  const focus = useSharedValue(0);
  const borderStyle = useAnimatedStyle(() => ({
    borderColor: error ? colors.error : interpolateColor(focus.value, [0, 1], [colors.border, colors.link]),
  }), [error, colors]);

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Animated.View style={[styles.inputWrap, error ? styles.inputWrapError : null, borderStyle]}>
        <TextInput
          placeholderTextColor={colors.muted}
          keyboardAppearance={isDark ? 'dark' : 'light'}
          accessibilityLabel={label}
          secureTextEntry={isPassword && hidden}
          style={[styles.inputInner, isPassword ? styles.inputWithToggle : null, style]}
          onFocus={(e) => {
            focus.value = withTiming(1, { duration: 160 });
            onFocus?.(e);
          }}
          onBlur={(e) => {
            focus.value = withTiming(0, { duration: 160 });
            onBlur?.(e);
          }}
          {...rest}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Hiện mật khẩu' : 'Ẩn mật khẩu'}
            style={styles.inputToggle}
          >
            <Text style={styles.inputToggleText}>{hidden ? 'Hiện' : 'Ẩn'}</Text>
          </Pressable>
        ) : null}
      </Animated.View>
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
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const press = usePressScale(0.985);
  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        accessibilityRole="button"
        style={[styles.card, style, press.style]}
      >
        {children}
      </AnimatedPressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const t = toneColorsFor(colors)[tone];
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
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const t = toneColorsFor(colors)[tone];
  return (
    <Animated.View
      entering={FadeIn.duration(220)}
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
    </Animated.View>
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
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const t = toneColorsFor(colors)[tone];
  // Success + check gets the pen-stroke animation instead of the static icon.
  const drawnCheck = !busy && tone === 'success' && icon === 'check';

  // Haptics: a success tap lands as the tick finishes drawing (~1s); problems
  // buzz right away.
  useEffect(() => {
    if (busy) return;
    if (drawnCheck) {
      const id = setTimeout(haptics.success, 1030);
      return () => clearTimeout(id);
    }
    if (tone === 'error' || tone === 'warning') haptics.warning();
  }, [busy, drawnCheck, tone]);

  return (
    <Animated.View entering={FadeInDown.duration(320)} style={styles.hero}>
      {drawnCheck ? (
        <View style={styles.checkWrap}>
          <AnimatedCheck />
          <SuccessBurst />
        </View>
      ) : (
        <View style={[styles.heroIcon, { backgroundColor: t.bg }]}>
          {busy ? (
            <ActivityIndicator size="large" color={t.fg} />
          ) : (
            <Icon name={icon} size={36} color={t.fg} />
          )}
        </View>
      )}
      <Text style={styles.heroTitle}>{title}</Text>
      {subtitle ? <Text style={styles.heroSubtitle}>{subtitle}</Text> : null}
      {children}
    </Animated.View>
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
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.empty}>
      <Icon name={icon} size={28} color={colors.muted} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const colors = useColors();
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
      <Text style={{ color: colors.link, fontWeight: '700', fontSize: size * 0.36 }}>
        {initials || '?'}
      </Text>
    </View>
  );
}

export function Loading() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={[styles.flex, { alignItems: 'center', justifyContent: 'center' }]}>
      <ActivityIndicator size="large" color={colors.link} />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Skeleton loading + segmented control                                */
/* ------------------------------------------------------------------ */

/** Pulsing placeholder block shown while data loads. */
export function Skeleton({
  height = 14,
  width = '100%',
  style,
}: {
  height?: number;
  width?: DimensionValue;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useColors();
  const opacity = useSharedValue(0.45);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 750 }), -1, true);
  }, [opacity]);
  const pulse = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      accessible={false}
      style={[{ height, width, borderRadius: radius.sm, backgroundColor: colors.border }, pulse, style]}
    />
  );
}

/** Card-shaped skeletons for list screens (replaces a bare spinner). */
export function ListSkeleton({ count = 3 }: { count?: number }) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.skeletonList} accessibilityRole="progressbar" accessibilityLabel="Đang tải">
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={styles.skeletonCard}>
          <Skeleton height={16} width="55%" />
          <Skeleton height={12} width="80%" />
          <Skeleton height={12} width="35%" />
        </View>
      ))}
    </View>
  );
}

/** Round "X" pinned to the top-right corner of a dialog/sheet. Place it as the sheet's first child. */
export function CloseButton({ onPress, disabled = false }: { onPress: () => void; disabled?: boolean }) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Đóng"
      style={({ pressed }) => [styles.closeButton, pressed ? styles.closeButtonPressed : null, disabled ? { opacity: 0.4 } : null]}
    >
      <Icon name="close" size={18} color={colors.muted} />
    </Pressable>
  );
}

/** Fades a block in with a small upward slide; stagger siblings with `index`. */
export function Reveal({ children, index = 0 }: { children: ReactNode; index?: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 60).duration(300)}>
      {children}
    </Animated.View>
  );
}

/** Number that eases from its previous value to the new one (e.g. a live attendee count). */
export function CountUp({
  value,
  style,
  suffix = '',
  duration = 650,
}: {
  value: number;
  style?: StyleProp<TextStyle>;
  suffix?: string;
  duration?: number;
}) {
  const [shown, setShown] = useState(0);
  const fromRef = useRef(0);
  useEffect(() => {
    const from = fromRef.current;
    if (from === value) {
      setShown(value);
      return;
    }
    const start = Date.now();
    let raf = 0;
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = Math.round(from + (value - from) * eased);
      fromRef.current = v;
      setShown(v);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return (
    <Text style={style} accessibilityLabel={`${value}${suffix}`}>
      {shown}
      {suffix}
    </Text>
  );
}

/** Green dot with a soft expanding ring: "this is live right now". */
export function LiveDot({ color }: { color?: string }) {
  const colors = useColors();
  const c = color ?? colors.success;
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1300 }), -1, false);
  }, [pulse]);
  const ring = useAnimatedStyle(() => ({
    opacity: 0.55 * (1 - pulse.value),
    transform: [{ scale: 1 + pulse.value * 1.7 }],
  }));
  return (
    <View style={{ width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }} accessible={false}>
      <Animated.View style={[{ position: 'absolute', width: 9, height: 9, borderRadius: 5, backgroundColor: c }, ring]} />
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c }} />
    </View>
  );
}

const BURST_COUNT = 12;

function BurstParticle({ index, progress, color }: { index: number; progress: { value: number }; color: string }) {
  const angle = (index / BURST_COUNT) * Math.PI * 2;
  const dist = 56 + (index % 3) * 14;
  const size = index % 2 ? 8 : 6;
  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [
      { translateX: Math.cos(angle) * dist * progress.value },
      { translateY: Math.sin(angle) * dist * progress.value },
      { scale: 1 - progress.value * 0.4 },
    ],
  }));
  return (
    <Animated.View
      style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: color }, style]}
    />
  );
}

/** Small confetti burst that fires as the success tick finishes drawing. */
export function SuccessBurst() {
  const colors = useColors();
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(1000, withTiming(1, { duration: 850, easing: Easing.out(Easing.cubic) }));
  }, [progress]);
  const palette = [colors.success, colors.accent, colors.warning, colors.link];
  return (
    <View
      pointerEvents="none"
      accessible={false}
      style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}
    >
      {Array.from({ length: BURST_COUNT }, (_, i) => (
        <BurstParticle key={i} index={i} progress={progress} color={palette[i % palette.length]} />
      ))}
    </View>
  );
}

/**
 * Pill-style single-choice control (e.g. theme: system / light / dark). The
 * blue bubble works like a lens: whatever part of a label it covers turns
 * white, even if it only overlaps half the word. Drag it, or tap an option.
 *
 * Two copies of the labels are drawn: grey ones underneath, white ones inside
 * the bubble. The bubble clips the white copy, which is shifted the opposite
 * way so each letter stays exactly over its grey twin.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const selected = Math.max(0, options.findIndex((o) => o.value === value));
  const bubble = useSlidingBubble({
    count: options.length,
    index: selected,
    onSelect: (i) => onChange(options[i].value),
  });

  const x = bubble.x;
  const bubbleShift = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const labelShift = useAnimatedStyle(() => ({ transform: [{ translateX: -x.value }] }));

  return (
    <View style={styles.segmented} accessibilityRole="radiogroup">
      <GestureDetector gesture={bubble.gesture}>
      <View style={styles.segmentRow} onLayout={bubble.onLayout}>
        {options.map((o) => (
          <Pressable
            key={o.value}
            onPress={() => {
              if (o.value !== value) haptics.light();
              onChange(o.value);
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected: o.value === value }}
            style={styles.segment}
          >
            <Text style={styles.segmentText}>{o.label}</Text>
          </Pressable>
        ))}

        {bubble.ready ? (
          <Animated.View
            pointerEvents="none"
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            style={[styles.segmentBubble, { width: bubble.bubbleWidth }, bubbleShift]}
          >
            <Animated.View style={[styles.segmentLens, { width: bubble.rowWidth }, labelShift]}>
              {options.map((o) => (
                <View key={o.value} style={styles.segment}>
                  <Text style={styles.segmentTextOn}>{o.label}</Text>
                </View>
              ))}
            </Animated.View>
          </Animated.View>
        ) : null}
      </View>
      </GestureDetector>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
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
  display: { ...typography.display, color: colors.link },
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
  inputWrap: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  inputWrapError: { backgroundColor: colors.errorLight },
  inputInner: {
    minHeight: 46,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: 15,
  },
  inputWithToggle: { paddingRight: 64 },
  inputToggle: {
    position: 'absolute',
    right: spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  inputToggleText: { ...typography.small, fontWeight: '600', color: colors.link },
  fieldHint: { ...typography.caption, color: colors.muted },

  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    zIndex: 10,
  },
  closeButtonPressed: { backgroundColor: colors.border },
  checkWrap: { alignItems: 'center', justifyContent: 'center' },
  skeletonList: { gap: spacing.md },
  skeletonCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: 10,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
  },
  segmentRow: { flex: 1, flexDirection: 'row', height: 40 },
  segmentBubble: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    overflow: 'hidden',
  },
  segmentLens: { position: 'absolute', left: 0, top: 0, height: 40, flexDirection: 'row' },
  segment: { flex: 1, height: 40, alignItems: 'center', justifyContent: 'center' },
  segmentText: { ...typography.small, fontWeight: '600', color: colors.muted },
  segmentTextOn: { ...typography.small, fontWeight: '600', color: '#FFFFFF' },
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
