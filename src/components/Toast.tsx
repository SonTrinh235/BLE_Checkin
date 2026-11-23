import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon, { IconName } from './Icon';
import { radius, spacing, typography } from '../theme';
import { haptics } from '../ui/haptics';

export type ToastTone = 'success' | 'info' | 'warning' | 'error';

type ToastApi = { show: (message: string, tone?: ToastTone) => void };

const ToastContext = createContext<ToastApi>({ show: () => undefined });

const DURATION_MS = 2600;

// Fixed tints that read well on the always-dark toast surface.
const TINT: Record<ToastTone, string> = {
  success: '#4ADE80',
  info: '#8AB4FF',
  warning: '#FACC15',
  error: '#F87171',
};
const ICON: Record<ToastTone, IconName> = {
  success: 'check',
  info: 'alert',
  warning: 'alert',
  error: 'alert',
};

type ToastItem = { id: number; message: string; tone: ToastTone };

// Short, non-blocking confirmation ("Đã lưu mã sinh viên"). Floats above the
// tab bar, ignores touches, and replaces the previous toast if a new one
// arrives.
export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastItem | null>(null);
  const idRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const show = useCallback((message: string, tone: ToastTone = 'success') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    idRef.current += 1;
    setToast({ id: idRef.current, message, tone });
    if (tone === 'success') haptics.light();
    else if (tone === 'error' || tone === 'warning') haptics.warning();
    timerRef.current = setTimeout(() => setToast(null), DURATION_MS);
  }, []);

  const api = useMemo<ToastApi>(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toast ? (
        <Animated.View
          key={toast.id}
          entering={FadeInDown.duration(220)}
          exiting={FadeOutDown.duration(180)}
          pointerEvents="none"
          style={[styles.wrap, { bottom: insets.bottom + 76 }]}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          <View style={styles.pill}>
            <Icon name={ICON[toast.tone]} size={18} color={TINT[toast.tone]} />
            <Text style={styles.text}>{toast.message}</Text>
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: spacing.lg, right: spacing.lg, alignItems: 'center', zIndex: 200 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    maxWidth: '100%',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: '#1F2937',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  text: { ...typography.small, fontWeight: '600', color: '#FFFFFF', flexShrink: 1 },
});
