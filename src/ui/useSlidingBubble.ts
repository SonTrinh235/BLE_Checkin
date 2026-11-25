import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { haptics } from './haptics';

const GLIDE = { duration: 240, easing: Easing.out(Easing.cubic) };

type Options = {
  /** Number of equal-width cells in the row. */
  count: number;
  /** Currently selected cell. */
  index: number;
  /** Horizontal padding inside the measured row (before the first cell). */
  padding?: number;
  /** Gap kept between the bubble and its cell's edges. */
  inset?: number;
  /** Called when the finger lifts over a different cell than `index`. */
  onSelect: (index: number) => void;
};

// Shared behaviour of a sliding "bubble" highlight over a row of equal cells
// (bottom tab bar, segmented controls): it glides to the selected cell, and
// can be dragged sideways — lifting the finger selects the nearest cell.
//
// The drag runs entirely on the UI thread (react-native-gesture-handler +
// Reanimated worklets), so the bubble follows the finger without waiting for
// JavaScript. Only the haptic tick and the final selection hop to JS.
//
// Usage: wrap the row in <GestureDetector gesture={gesture}> and give the row
// `onLayout`. Taps still reach the cells: the pan only activates after the
// finger has clearly moved sideways.
export function useSlidingBubble({ count, index, padding = 0, inset = 0, onSelect }: Options) {
  const [width, setWidth] = useState(0);
  const cellWidth = width > 0 ? (width - padding * 2) / count : 0;
  const minX = padding + inset;

  // Bubble's left edge (row coordinates) and a 0..1 "being dragged" amount.
  const x = useSharedValue(0);
  const lift = useSharedValue(0);

  // Mirrors of React state that the gesture worklets need to read.
  const cellSV = useSharedValue(0);
  const indexSV = useSharedValue(index);
  const hoverSV = useSharedValue(-1); // cell under the bubble while dragging, -1 = idle
  const startX = useSharedValue(0);

  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const selectJS = useCallback((i: number) => onSelectRef.current(i), []);
  const tickJS = useCallback(() => haptics.light(), []);

  const placed = useRef(false);
  useEffect(() => {
    cellSV.value = cellWidth;
    indexSV.value = index;
    if (cellWidth === 0 || hoverSV.value !== -1) return; // not measured yet / finger steering
    const target = minX + index * cellWidth;
    if (!placed.current) {
      placed.current = true;
      x.value = target; // first layout: appear in place instead of sliding in
    } else {
      x.value = withTiming(target, GLIDE);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, cellWidth]);

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-8, 8])
        .failOffsetY([-14, 14])
        .onStart(() => {
          'worklet';
          startX.value = x.value;
          hoverSV.value = indexSV.value;
          lift.value = withTiming(1, { duration: 140 });
        })
        .onUpdate((e) => {
          'worklet';
          const c = cellSV.value;
          if (c === 0) return;
          const hi = minX + (count - 1) * c;
          const nx = Math.min(hi, Math.max(minX, startX.value + e.translationX));
          x.value = nx;
          const idx = Math.round((nx - minX) / c);
          if (idx !== hoverSV.value) {
            hoverSV.value = idx;
            scheduleOnRN(tickJS);
          }
        })
        .onFinalize(() => {
          'worklet';
          if (hoverSV.value === -1) return; // never activated (a plain tap)
          const idx = hoverSV.value;
          hoverSV.value = -1;
          lift.value = withTiming(0, { duration: 160 });
          x.value = withTiming(minX + idx * cellSV.value, GLIDE);
          if (idx !== indexSV.value) scheduleOnRN(selectJS, idx);
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count, minX]
  );

  const bubbleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { scale: 1 + lift.value * 0.06 }],
  }));

  return {
    /** Pass to <GestureDetector gesture={...}> around the row. */
    gesture,
    /** Attach to the row that contains the cells. */
    onLayout: (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width),
    bubbleStyle,
    bubbleWidth: Math.max(0, cellWidth - inset * 2),
    ready: cellWidth > 0,
    /** Raw animated left edge of the bubble (row coordinates) and drag-lift 0..1, for custom bubbles. */
    x,
    lift,
    /** Measured width of the row. */
    rowWidth: width,
  };
}
