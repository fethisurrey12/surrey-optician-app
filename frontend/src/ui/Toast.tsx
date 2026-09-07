import { BlurView } from "expo-blur";
import { View } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/src/context/AppContext";
import { Icon } from "@/src/ui/Icon";
import { Txt } from "@/src/ui/Txt";
import { radius, spacing, TAB_BAR_HEIGHT } from "@/src/tokens";
import { makeStyles, useTheme } from "@/src/theme";

// Global toast, mounted once above navigation.
export function Toast() {
  const { toastState, status } = useApp();
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  if (!toastState) return null;

  const bottom = (status === "signedIn" ? TAB_BAR_HEIGHT : 0) + insets.bottom + spacing.base;

  return (
    <View pointerEvents="none" style={[styles.wrap, { bottom }]}>
      <Animated.View
        key={toastState.id}
        entering={FadeInDown.duration(240)}
        exiting={FadeOutDown.duration(200)}
        style={styles.toast}
      >
        <BlurView intensity={30} tint="dark" style={styles.blur}>
          <View style={styles.dot}>
            <Icon name="check" size={14} color={colors.ink} strokeWidth={2.4} />
          </View>
          <Txt variant="bodyStrong" tone="cream" style={styles.text}>
            {toastState.message}
          </Txt>
        </BlurView>
      </Animated.View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  toast: {
    borderRadius: radius.pill,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderStrong,
    maxWidth: 440,
  },
  blur: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingLeft: spacing.md,
    paddingRight: spacing.lg,
    backgroundColor: colors.glass,
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { flexShrink: 1 },
}));
