import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetInfo } from '@react-native-community/netinfo';
import Icon from './Icon';
import { radius, spacing, typography, Palette } from '../theme';
import { useColors } from '../theme/useTheme';

// Small floating pill shown only while the device is offline, so people know
// a check-in is saved locally and will sync later. Never blocks touches.
export default function OfflineBanner() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { isConnected } = useNetInfo();
  const insets = useSafeAreaInsets();
  if (isConnected !== false) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      pointerEvents="none"
      style={[styles.wrap, { top: insets.top + 6 }]}
      accessibilityRole="alert"
    >
      <View style={styles.pill}>
        <Icon name="wifi-off" size={14} color={colors.warning} />
        <Text style={styles.text}>Đang offline · điểm danh sẽ tự đồng bộ</Text>
      </View>
    </Animated.View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 100 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.warningLight,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  text: { ...typography.caption, fontWeight: '600', color: colors.warning },
});
