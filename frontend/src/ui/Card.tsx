import { LinearGradient } from "expo-linear-gradient";
import { View, type StyleProp, type ViewStyle } from "react-native";

import { radius, spacing } from "@/src/tokens";
import { makeStyles, useTheme } from "@/src/theme";

// Three-stop tinted gradient over an ambient shadow. No drawn edge beyond the
// faintest hairline border: the card is separated from the page by light, not
// by a line. 16px radius, 24px of internal padding.
export function Card({
  children,
  style,
  contentStyle,
  testID,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={[styles.shadow, style]} testID={testID}>
      <LinearGradient
        colors={colors.cardGradient}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.surface}
      >
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
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  surface: {
    flexGrow: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    // Barely there: enough to separate two stacked cards, not a drawn outline.
    borderColor: colors.divider,
    overflow: "hidden",
  },
  content: {
    padding: spacing.xl,
  },
}));
