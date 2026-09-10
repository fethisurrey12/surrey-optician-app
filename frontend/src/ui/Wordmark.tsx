import { View, type StyleProp, type ViewStyle } from "react-native";

import { Txt } from "@/src/ui/Txt";
import { font } from "@/src/tokens";
import { useTheme } from "@/src/theme";

// The practice's wordmark: "surrey" and "opticians" set as one lowercase word,
// navy then turquoise, as it appears on surreyopticians.co.uk.
//
// Their artwork uses a rounded geometric sans; Inter stands in for it here.
// Swapping in the real face is a change to `family` below plus the font files.
export function Wordmark({
  size = "md",
  align = "center",
  onDark = false,
  style,
}: {
  size?: "sm" | "md" | "lg";
  align?: "left" | "center";
  /** On a navy or turquoise field the whole wordmark reverses to white. */
  onDark?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const s = SIZES[size];
  const family = font.regular;

  const type = {
    fontFamily: family,
    fontSize: s.size,
    letterSpacing: s.tracking,
    lineHeight: s.size * 1.16,
  };

  return (
    <View
      style={[
        { flexDirection: "row", alignItems: "baseline" },
        { justifyContent: align === "center" ? "center" : "flex-start" },
        style,
      ]}
    >
      <Txt style={[type, { color: onDark ? colors.paper : colors.ink }]}>surrey</Txt>
      <Txt style={[type, { color: onDark ? colors.paper : colors.lightTeal }]}>opticians</Txt>
    </View>
  );
}

const SIZES = {
  sm: { size: 19, tracking: -0.2 },
  md: { size: 27, tracking: -0.4 },
  lg: { size: 37, tracking: -0.6 },
};
