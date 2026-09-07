import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { GradientText } from "@/src/ui/GradientText";
import { GoldButton } from "@/src/ui/GoldButton";
import { Icon } from "@/src/ui/Icon";
import { Txt } from "@/src/ui/Txt";
import { useReduceMotion } from "@/src/lib/motion";
import { DURATION, font, radius, spacing } from "@/src/tokens";
import { makeStyles, useTheme } from "@/src/theme";

// The prominent "reward ready" card. One light sweep passes across it every
// few seconds; nothing else animates on its own.
export function RewardReadyCard({ onOpen }: { onOpen: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const reduce = useReduceMotion();
  const [width, setWidth] = useState(0);
  const x = useSharedValue(0);

  useEffect(() => {
    if (reduce || width === 0) return;
    x.value = 0;
    x.value = withRepeat(
      withDelay(
        DURATION.sweepGap,
        withTiming(1, { duration: DURATION.sweep, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [reduce, width, x]);

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -140 + x.value * (width + 280) }, { skewX: "-18deg" }],
  }));

  return (
    <View style={styles.shadow} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <LinearGradient colors={colors.cardGradient} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={styles.surface}>
        <View pointerEvents="none" style={styles.hairline} />

        {!reduce ? (
          <Animated.View pointerEvents="none" style={[styles.sweepWrap, sweepStyle]}>
            <LinearGradient colors={colors.sheen} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.sweep} />
          </Animated.View>
        ) : null}

        <View style={styles.head}>
          <View style={styles.dot}>
            <Icon name="sparkle" size={15} color={colors.ink} strokeWidth={1.6} />
          </View>
          <Txt variant="label" tone="gold">
            Reward ready
          </Txt>
        </View>

        <View style={styles.figureRow}>
          <GradientText style={styles.figure}>£10</GradientText>
          <Txt variant="body" style={styles.off}>
            off your next visit
          </Txt>
        </View>

        <Txt variant="body" style={styles.body}>
          Show it at the till and a colleague applies it for you.
        </Txt>

        <GoldButton label="Open wallet" icon="wallet" onPress={onOpen} testID="reward-open-wallet-button" />
      </LinearGradient>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  shadow: {
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    shadowColor: colors.gold,
    shadowOpacity: 0.28,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
  surface: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(201,162,39,0.35)",
    overflow: "hidden",
    padding: spacing.lg,
    gap: spacing.md,
  },
  hairline: { position: "absolute", top: 1, left: 14, right: 14, height: 1, backgroundColor: colors.hairline },
  sweepWrap: { position: "absolute", top: -20, bottom: -20, width: 120 },
  sweep: { flex: 1 },
  head: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  figureRow: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm },
  figure: { fontFamily: font.serifThin, fontSize: 56, letterSpacing: -2, lineHeight: 58 },
  off: { marginBottom: spacing.sm },
  body: { maxWidth: 300 },
}));
