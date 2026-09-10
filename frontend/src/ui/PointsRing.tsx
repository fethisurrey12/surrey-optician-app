import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

import { useReduceMotion } from "@/src/lib/motion";
import { DURATION } from "@/src/tokens";
import { useTheme } from "@/src/theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Gold points ring that draws from empty on mount over ~1.4s.
export function PointsRing({
  size = 220,
  strokeWidth = 14,
  progress,
  children,
}: {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0..1
  children?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const reduce = useReduceMotion();
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const p = useSharedValue(0);

  useEffect(() => {
    const target = Math.max(0, Math.min(1, progress));
    if (reduce) {
      p.value = target;
    } else {
      p.value = 0;
      p.value = withTiming(target, { duration: DURATION.ring, easing: Easing.out(Easing.cubic) });
    }
  }, [progress, reduce, p]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circ * (1 - p.value),
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="foil" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.deepTeal} />
            <Stop offset="0.4" stopColor={colors.teal} />
            <Stop offset="0.75" stopColor={colors.lightTeal} />
            <Stop offset="1" stopColor={colors.deepTeal} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.mist}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#foil)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circ}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
        {children}
      </View>
    </View>
  );
}
