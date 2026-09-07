import { View, type StyleProp, type ViewStyle } from "react-native";

import { GradientText } from "@/src/ui/GradientText";
import { Txt } from "@/src/ui/Txt";
import { font } from "@/src/tokens";

// SURREY in the serif with wide letter-spacing, OPTICIANS beneath it in gold,
// smaller and wider still.
export function Wordmark({
  size = "md",
  align = "center",
  style,
}: {
  size?: "sm" | "md" | "lg";
  align?: "left" | "center";
  style?: StyleProp<ViewStyle>;
}) {
  const s = SIZES[size];
  return (
    <View style={[{ alignItems: align === "center" ? "center" : "flex-start" }, style]}>
      <Txt
        style={{
          fontFamily: font.serifLight,
          fontSize: s.top,
          letterSpacing: s.topSpace,
          lineHeight: s.top * 1.05,
        }}
      >
        SURREY
      </Txt>
      <GradientText
        style={{
          fontFamily: font.medium,
          fontSize: s.sub,
          letterSpacing: s.subSpace,
          lineHeight: s.sub * 1.2,
        }}
      >
        OPTICIANS
      </GradientText>
    </View>
  );
}

const SIZES = {
  sm: { top: 22, topSpace: 6, sub: 10, subSpace: 8 },
  md: { top: 32, topSpace: 9, sub: 12.5, subSpace: 11 },
  lg: { top: 44, topSpace: 12, sub: 16, subSpace: 15 },
};
