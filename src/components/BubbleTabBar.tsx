import { useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon, { IconName } from './Icon';
import { Palette, spacing, typography } from '../theme';
import { useColors } from '../theme/useTheme';
import { haptics } from '../ui/haptics';
import { useSlidingBubble } from '../ui/useSlidingBubble';

export type TabMeta = { name: string; title: string; icon: IconName };

const BAR_PADDING = spacing.sm;
const BAR_HEIGHT = 64;
const BUBBLE_HEIGHT = 50;
const BUBBLE_INSET = 4;
const BUBBLE_TOP = (BAR_HEIGHT - BUBBLE_HEIGHT) / 2;

// Bottom navigation. One pill-shaped bubble glides to the active tab; drag it
// (or swipe along the bar) to scrub between pages, and lifting your finger
// switches to the nearest tab. No ripple, so no white blob on touch.
//
// The bubble works like a lens: icons and labels are drawn twice — grey ones
// underneath, blue ones inside the bubble. The bubble clips the blue copy and
// the copy moves the opposite way, so whatever part of an icon or label the
// bubble covers turns blue, even if it only overlaps half of it.
export default function BubbleTabBar({
  state,
  navigation,
  tabs,
}: BottomTabBarProps & { tabs: TabMeta[] }) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const goTo = (i: number) => {
    const route = state.routes[i];
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (i !== state.index && !event.defaultPrevented) {
      navigation.navigate(route.name, route.params);
    }
  };
  const goToRef = useRef(goTo);
  goToRef.current = goTo;

  const bubble = useSlidingBubble({
    count: state.routes.length,
    index: state.index,
    padding: BAR_PADDING,
    inset: BUBBLE_INSET,
    onSelect: (i) => goToRef.current(i),
  });

  const x = bubble.x;
  const bubbleShift = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const contentShift = useAnimatedStyle(() => ({ transform: [{ translateX: -x.value }] }));

  const metaOf = (name: string) => tabs.find((t) => t.name === name);

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      <GestureDetector gesture={bubble.gesture}>
      <View style={styles.row} onLayout={bubble.onLayout}>
        {/* Bottom layer: grey, tappable. */}
        {state.routes.map((route, i) => {
          const meta = metaOf(route.name);
          return (
            <Pressable
              key={route.key}
              onPress={() => {
                haptics.light();
                goTo(i);
              }}
              accessibilityRole="tab"
              accessibilityLabel={meta?.title ?? route.name}
              accessibilityState={{ selected: i === state.index }}
              style={styles.cell}
            >
              <Icon name={meta?.icon ?? 'bluetooth'} size={22} color={colors.muted} />
              <Text style={[styles.label, { color: colors.muted }]} numberOfLines={1}>
                {meta?.title ?? route.name}
              </Text>
            </Pressable>
          );
        })}

        {bubble.ready ? (
          <>
            {/* The lens: pale fill that clips a blue copy of the row. */}
            <Animated.View
              pointerEvents="none"
              accessible={false}
              importantForAccessibility="no-hide-descendants"
              style={[styles.bubble, { width: bubble.bubbleWidth }, bubbleShift]}
            >
              <Animated.View style={[styles.lens, { width: bubble.rowWidth }, contentShift]}>
                {state.routes.map((route) => {
                  const meta = metaOf(route.name);
                  return (
                    <View key={route.key} style={styles.cell}>
                      <Icon name={meta?.icon ?? 'bluetooth'} size={22} color={colors.link} />
                      <Text style={[styles.label, { color: colors.link }]} numberOfLines={1}>
                        {meta?.title ?? route.name}
                      </Text>
                    </View>
                  );
                })}
              </Animated.View>
            </Animated.View>

            {/* Outline drawn above the lens so the clipped copy lines up exactly. */}
            <Animated.View
              pointerEvents="none"
              accessible={false}
              style={[styles.bubbleRing, { width: bubble.bubbleWidth }, bubbleShift]}
            />
          </>
        ) : null}
      </View>
      </GestureDetector>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    bar: {
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      height: BAR_HEIGHT,
      paddingHorizontal: BAR_PADDING,
    },
    cell: {
      flex: 1,
      height: BAR_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    label: { ...typography.caption, fontWeight: '600' },
    bubble: {
      position: 'absolute',
      left: 0,
      top: BUBBLE_TOP,
      height: BUBBLE_HEIGHT,
      borderRadius: BUBBLE_HEIGHT / 2,
      backgroundColor: colors.accentLight,
      overflow: 'hidden',
    },
    // Same padding as the row, shifted up by the bubble's top offset so its
    // cells sit exactly over the grey ones underneath.
    lens: {
      position: 'absolute',
      left: 0,
      top: -BUBBLE_TOP,
      height: BAR_HEIGHT,
      flexDirection: 'row',
      paddingHorizontal: BAR_PADDING,
    },
    bubbleRing: {
      position: 'absolute',
      left: 0,
      top: BUBBLE_TOP,
      height: BUBBLE_HEIGHT,
      borderRadius: BUBBLE_HEIGHT / 2,
      borderWidth: 1,
      borderColor: colors.accentBorder,
    },
  });
