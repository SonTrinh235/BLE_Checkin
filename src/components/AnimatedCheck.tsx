import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

// Geometry on a 96x96 grid.
const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const TICK_PATH = 'M30 50 L43 63 L68 36';
const TICK_LENGTH = 60; // real length is ~55; the extra keeps the cap round

// A pen-stroke success mark: the ring is drawn first, then the tick.
// Honors the system "reduce motion" setting by showing the finished mark.
export default function AnimatedCheck({
  size = 96,
  color = colors.success,
}: {
  size?: number;
  color?: string;
}) {
  const wash = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;
  const tick = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    let animation: Animated.CompositeAnimation | null = null;

    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) return;
      if (reduce) {
        wash.setValue(1);
        ring.setValue(1);
        tick.setValue(1);
        return;
      }
      animation = Animated.sequence([
        Animated.parallel([
          Animated.timing(wash, { toValue: 1, duration: 500, useNativeDriver: false }),
          Animated.timing(ring, {
            toValue: 1,
            duration: 650,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
        ]),
        Animated.timing(tick, {
          toValue: 1,
          duration: 380,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
      ]);
      animation.start();
    });

    return () => {
      cancelled = true;
      animation?.stop();
    };
  }, [wash, ring, tick]);

  const ringOffset = ring.interpolate({ inputRange: [0, 1], outputRange: [CIRCUMFERENCE, 0] });
  const tickOffset = tick.interpolate({ inputRange: [0, 1], outputRange: [TICK_LENGTH, 0] });

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      <AnimatedCircle cx={48} cy={48} r={RADIUS} fill={colors.successLight} fillOpacity={wash} />
      <AnimatedCircle
        cx={48}
        cy={48}
        r={RADIUS}
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={[CIRCUMFERENCE, CIRCUMFERENCE]}
        strokeDashoffset={ringOffset}
        rotation={-90}
        origin="48, 48"
      />
      <AnimatedPath
        d={TICK_PATH}
        stroke={color}
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={[TICK_LENGTH, TICK_LENGTH]}
        strokeDashoffset={tickOffset}
      />
    </Svg>
  );
}
