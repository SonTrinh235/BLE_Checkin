import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon, { IconName } from './Icon';
import { Button, CloseButton } from './ui';
import { Palette, radius, spacing, Tone, toneColorsFor, typography } from '../theme';
import { useColors } from '../theme/useTheme';
import { haptics } from '../ui/haptics';

export type DialogOptions = {
  title: string;
  message?: string;
  /** Defaults to 'error' for destructive dialogs, otherwise 'info'. */
  tone?: Tone;
  icon?: IconName;
  confirmLabel?: string;
  /** Pass null to hide the cancel button (used by `alert`). */
  cancelLabel?: string | null;
  /** Red confirm button + a warning buzz. */
  destructive?: boolean;
};

type DialogApi = {
  /** Resolves true when the user confirms, false when they cancel or dismiss. */
  confirm: (options: DialogOptions) => Promise<boolean>;
  /** One-button notice; resolves when dismissed. */
  alert: (options: DialogOptions) => Promise<void>;
};

const DialogContext = createContext<DialogApi>({
  confirm: async () => false,
  alert: async () => undefined,
});

type Item = { options: DialogOptions; resolve: (value: boolean) => void };

const EXIT_MS = 180;

// App-wide replacement for the system Alert: an animated bottom sheet that
// matches the design system (and the dark theme) instead of the stock
// Android/iOS dialog. Requests made while one is showing are queued.
export function DialogProvider({ children }: { children: ReactNode }) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const [current, setCurrent] = useState<Item | null>(null);
  const [open, setOpen] = useState(false);
  const activeRef = useRef<Item | null>(null);
  const queueRef = useRef<Item[]>([]);
  const closingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const present = useCallback((item: Item) => {
    activeRef.current = item;
    setCurrent(item);
    setOpen(true);
    if (item.options.destructive) haptics.warning();
  }, []);

  const show = useCallback(
    (options: DialogOptions) =>
      new Promise<boolean>((resolve) => {
        const item: Item = { options, resolve };
        if (activeRef.current) queueRef.current.push(item);
        else present(item);
      }),
    [present]
  );

  const finish = useCallback(
    (result: boolean) => {
      const item = activeRef.current;
      if (!item || closingRef.current) return;
      closingRef.current = true;
      setOpen(false); // plays the exit animation
      item.resolve(result);
      timerRef.current = setTimeout(() => {
        closingRef.current = false;
        activeRef.current = null;
        const next = queueRef.current.shift();
        if (next) present(next);
        else setCurrent(null); // unmounts the Modal after the exit animation
      }, EXIT_MS);
    },
    [present]
  );

  const api = useMemo<DialogApi>(
    () => ({
      confirm: (options) => show(options),
      alert: async (options) => {
        await show({ ...options, cancelLabel: null, confirmLabel: options.confirmLabel ?? 'Đã hiểu' });
      },
    }),
    [show]
  );

  const opts = current?.options;
  const tone: Tone = opts?.tone ?? (opts?.destructive ? 'error' : 'info');
  const t = toneColorsFor(colors)[tone];
  const icon: IconName = opts?.icon ?? (tone === 'success' ? 'check' : 'alert');

  return (
    <DialogContext.Provider value={api}>
      {children}
      <Modal
        visible={current !== null}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => finish(false)}
      >
        {open && opts ? (
          <View style={styles.root}>
            <Animated.View
              entering={FadeIn.duration(160)}
              exiting={FadeOut.duration(EXIT_MS)}
              style={StyleSheet.absoluteFill}
            >
              <Pressable
                style={styles.backdrop}
                onPress={() => finish(false)}
                accessibilityLabel="Đóng hộp thoại"
              />
            </Animated.View>

            <Animated.View
              entering={SlideInDown.springify().damping(20).stiffness(220)}
              exiting={SlideOutDown.duration(EXIT_MS)}
              style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}
              accessibilityViewIsModal
            >
              <CloseButton onPress={() => finish(false)} />
              <View style={styles.handle} />
              <View style={[styles.iconWrap, { backgroundColor: t.bg }]}>
                <Icon name={icon} size={30} color={t.fg} />
              </View>
              <Text style={styles.title}>{opts.title}</Text>
              {opts.message ? <Text style={styles.message}>{opts.message}</Text> : null}
              <View style={styles.actions}>
                <Button
                  title={opts.confirmLabel ?? 'Đồng ý'}
                  variant={opts.destructive ? 'danger' : 'primary'}
                  onPress={() => finish(true)}
                />
                {opts.cancelLabel === null ? null : (
                  <Button
                    title={opts.cancelLabel ?? 'Huỷ'}
                    variant="secondary"
                    onPress={() => finish(false)}
                  />
                )}
              </View>
            </Animated.View>
          </View>
        ) : null}
      </Modal>
    </DialogContext.Provider>
  );
}

export function useDialog(): DialogApi {
  return useContext(DialogContext);
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    root: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
      alignItems: 'stretch',
      gap: spacing.md,
    },
    handle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: radius.pill,
      backgroundColor: colors.border,
      marginBottom: spacing.sm,
    },
    iconWrap: {
      alignSelf: 'center',
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: { ...typography.title, color: colors.text, textAlign: 'center' },
    message: { ...typography.body, color: colors.muted, textAlign: 'center' },
    actions: { gap: spacing.sm, marginTop: spacing.sm },
  });
