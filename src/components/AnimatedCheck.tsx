import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { useColors } from '../theme/useTheme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

// Geometry on a 96x96 grid.
const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const TICK_PATH = 'M30 50 L43 63 L68 36';
const TICK_LENGTH = 60; // real length is ~55; the extra keeps the cap round

const RING_MS = 650;
const TICK_MS = 380;

// A pen-stroke success mark: the ring is drawn first, then the tick, then a
// small settle bounce. Runs on the UI thread (Reanimated), so it stays smooth
// even when the JS thread is busy. With the system "reduce motion" setting on,
// Reanimated jumps straight to the finished mark.
export default function AnimatedCheck({
  size = 96,
  color,
}: {
  size?: number;
  color?: string;
}) {
  const colors = useColors();
  const stroke = color ?? colors.success;
  const wash = useSharedValue(0);
  const ring = useSharedValue(0);
  const tick = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    wash.value = withTiming(1, { duration: 500 });
    ring.value = withTiming(1, { duration: RING_MS, easing: Easing.out(Easing.cubic) });
    tick.value = withDelay(RING_MS, withTiming(1, { duration: TICK_MS, easing: Easing.out(Easing.quad) }));
    scale.value = withDelay(
      RING_MS + TICK_MS,
      withSequence(
        withTiming(1.08, { duration: 120, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 180, easing: Easing.inOut(Easing.quad) })
      )
    );
  }, [wash, ring, tick, scale]);

  const washProps = useAnimatedProps(() => ({ fillOpacity: wash.value }));
  const ringProps = useAnimatedProps(() => ({ strokeDashoffset: CIRCUMFERENCE * (1 - ring.value) }));
  const tickProps = useAnimatedProps(() => ({ strokeDashoffset: TICK_LENGTH * (1 - tick.value) }));
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      style={[{ width: size, height: size }, popStyle]}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width={size} height={size} viewBox="0 0 96 96" fill="none">
        <AnimatedCircle
          cx={48}
          cy={48}
          r={RADIUS}
          fill={colors.successLight}
          animatedProps={washProps}
        />
        <AnimatedCircle
          cx={48}
          cy={48}
          r={RADIUS}
          stroke={stroke}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={[CIRCUMFERENCE, CIRCUMFERENCE]}
          rotation={-90}
          origin="48, 48"
          animatedProps={ringProps}
        />
        <AnimatedPath
          d={TICK_PATH}
          stroke={stroke}
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={[TICK_LENGTH, TICK_LENGTH]}
          animatedProps={tickProps}
        />
      </Svg>
    </Animated.View>
  );
}
