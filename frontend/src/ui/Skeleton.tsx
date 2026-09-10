import { useEffect } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { useReduceMotion } from "@/src/lib/motion";
import { radius, spacing } from "@/src/tokens";
import { makeStyles } from "@/src/theme";

// Soft pulsing placeholder blocks shaped like the content they stand in for,
// so screens keep their layout while data loads instead of jumping.
export function Skeleton({
  width = "100%",
  height = 16,
  round,
  style,
}: {
  width?: number | `${number}%`;
  height?: number;
  round?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useStyles();
  const reduce = useReduceMotion();
  const pulse = useSharedValue(0.55);

  useEffect(() => {
    if (reduce) return;
    pulse.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [reduce, pulse]);

  const anim = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View
      style={[
        styles.block,
        { width, height, borderRadius: round ? height / 2 : radius.sm },
        anim,
        style,
      ]}
    />
  );
}

// A card-shaped skeleton with a few text lines.
export function SkeletonCard({ lines = 2, style }: { lines?: number; style?: StyleProp<ViewStyle> }) {
  const styles = useStyles();
  return (
    <View style={[styles.card, style]} testID="skeleton-card">
      <Skeleton width={120} height={12} />
      <Skeleton width="60%" height={28} style={styles.gap} />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? "70%" : "100%"} height={12} style={styles.gapSm} />
      ))}
    </View>
  );
}

export function SkeletonRow() {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <Skeleton width={40} height={40} round />
      <View style={styles.rowTexts}>
        <Skeleton width="65%" height={13} />
        <Skeleton width="40%" height={11} style={styles.gapXs} />
      </View>
      <Skeleton width={48} height={13} />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  block: { backgroundColor: colors.surfaceTertiary },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: spacing.lg,
  },
  gap: { marginTop: spacing.md },
  gapSm: { marginTop: spacing.sm },
  gapXs: { marginTop: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.md },
  rowTexts: { flex: 1 },
}));
