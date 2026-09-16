import { View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";

import { WORDMARK_ASPECT, WORDMARK_PATH, WORDMARK_VIEWBOX } from "@/src/ui/wordmarkPath";
import { useTheme } from "@/src/theme";

// The practice's wordmark, drawn from their own outlines rather than set in a
// stand-in typeface — see src/ui/wordmarkPath.ts for where the letterforms come
// from. Single colour, as the brand book uses it.
const HEIGHTS = { sm: 12, md: 15, lg: 18 } as const;

export function Wordmark({
  size = "md",
  align = "center",
  onDark = false,
  style,
}: {
  size?: "sm" | "md" | "lg";
  align?: "left" | "center";
  /** On a navy or turquoise field the wordmark reverses to white. */
  onDark?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const height = HEIGHTS[size];
  const width = Math.round(height * WORDMARK_ASPECT);

  return (
    <View
      style={[{ alignItems: align === "center" ? "center" : "flex-start" }, style]}
      accessible
      accessibilityRole="image"
      accessibilityLabel="Surrey Opticians"
    >
      <Svg width={width} height={height} viewBox={WORDMARK_VIEWBOX}>
        <Path d={WORDMARK_PATH} fill={onDark ? colors.paper : colors.ink} />
      </Svg>
    </View>
  );
}
