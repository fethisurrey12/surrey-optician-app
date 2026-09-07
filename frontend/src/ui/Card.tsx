import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { radius } from "@/src/tokens";
import { makeStyles, useTheme } from "@/src/theme";

// Three-stop green gradient, a 1px hairline highlight inset along the top edge,
// and a deep soft shadow beneath. 20px radius.
export function Card({
  children,
  style,
  contentStyle,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={[styles.shadow, style]}>
      <LinearGradient
        colors={colors.cardGradient}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.surface}
      >
        <View pointerEvents="none" style={styles.hairline} />
        <View style={[styles.content, contentStyle]}>{children}</View>
      </LinearGradient>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  shadow: {
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    shadowColor: colors.shadow,
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 12,
  },
  surface: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  hairline: {
    position: "absolute",
    top: 1,
    left: 14,
    right: 14,
    height: StyleSheet.hairlineWidth * 2,
    backgroundColor: colors.hairline,
    borderRadius: 1,
  },
  content: {
    padding: 18,
  },
}));
