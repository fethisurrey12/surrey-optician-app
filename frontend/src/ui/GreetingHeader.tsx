import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useReduceMotion } from "@/src/lib/motion";
import { radius, spacing } from "@/src/tokens";
import { makeStyles, useTheme } from "@/src/theme";
import { Icon } from "@/src/ui/Icon";
import { PressScale } from "@/src/ui/PressScale";
import { Txt } from "@/src/ui/Txt";

// The dashboard's header: a deep turquoise band, curved along its lower edge,
// carrying the greeting on one side and the bell on the other.
//
// The band runs to the top of the screen, under the status bar, so the colour
// starts at the very edge of the glass — Screen's `headerBleed` is what lets it
// out of the page margins, and this component takes the safe-area inset itself.
//
// The dot on the bell means something: it is lit only while there is a reminder
// waiting, and the bell takes you to them. A light that is always on tells the
// patient nothing.
export function GreetingHeader({
  eyebrow,
  name,
  unread = false,
  onBell,
}: {
  eyebrow: string;
  name: string;
  /** Lights the dot. Pass whether anything is actually waiting. */
  unread?: boolean;
  onBell?: () => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const reduce = useReduceMotion();
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (!unread || reduce) {
      pulse.set(1);
      return;
    }
    pulse.set(
      withRepeat(
        withSequence(
          withTiming(0.45, { duration: 900, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      ),
    );
  }, [unread, reduce, pulse]);

  const dotStyle = useAnimatedStyle(() => ({ opacity: pulse.get() }));

  return (
    <LinearGradient
      colors={colors.tealFoil}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.band, { paddingTop: insets.top + spacing.base }]}
    >
      <View style={styles.row}>
        <View style={styles.texts}>
          <Txt variant="label" style={styles.eyebrow}>
            {eyebrow}
          </Txt>
          <Txt variant="h2" tone="paper" numberOfLines={1} style={styles.name}>
            Hello, {name}
          </Txt>
        </View>

        <PressScale
          onPress={onBell}
          style={styles.bell}
          testID="home-bell"
          accessibilityLabel={unread ? "Reminders waiting" : "Reminders"}
          hitSlop={12}
        >
          <Icon name="bell" size={22} color={colors.paper} strokeWidth={1.8} />
          {unread ? <Animated.View style={[styles.dot, dotStyle]} testID="home-bell-dot" /> : null}
        </PressScale>
      </View>
    </LinearGradient>
  );
}

const useStyles = makeStyles((colors) => ({
  band: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: colors.shadow,
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.base },
  texts: { flex: 1, minWidth: 0, gap: 4 },
  // Lighter than the white heading, so the two lines sit in a hierarchy.
  eyebrow: { color: colors.haze, letterSpacing: 1.4 },
  name: { color: colors.paper },
  bell: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },
  dot: {
    position: "absolute",
    top: 11,
    right: 12,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.haze,
    borderWidth: 1.5,
    borderColor: colors.deepTeal,
  },
}));
