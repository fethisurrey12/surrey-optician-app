import { View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Circle, G, Path } from "react-native-svg";

import { useTheme } from "@/src/theme";

// A pair of round frames, drawn in the practice's turquoise.
//
// Decoration, not an icon: it fills the quiet places — an empty rewards list,
// the sign-in screen — where a bare paragraph would look unfinished. Every
// colour comes from the palette, and the stroke thickens a little at small
// sizes so the frames stay visible rather than dissolving into hairlines.
const W = 132;
const H = 46;
export const SPECTACLES_ASPECT = W / H;

export type ArtTone = "brand" | "soft" | "paper";

export function Spectacles({
  width = 120,
  tone = "brand",
  style,
}: {
  width?: number;
  /** brand: turquoise on a tinted lens. soft: a watermark. paper: reversed. */
  tone?: ArtTone;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const height = Math.round((width * H) / W);

  const stroke =
    tone === "paper" ? colors.paper : tone === "soft" ? colors.brandTertiary : colors.lightTeal;
  // Only the full-strength pair carries a tinted lens; a watermark stays open.
  const lens = tone === "brand" ? colors.brandTertiary : "none";
  // 3 units reads correctly from about 90px up; below that it needs weight.
  const strokeWidth = width >= 90 ? 3 : width >= 56 ? 3.4 : 3.9;

  return (
    <View style={style} pointerEvents="none">
      <Svg width={width} height={height} viewBox={`0 0 ${W} ${H}`}>
        <G fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round">
          <Circle cx={38} cy={27} r={16} fill={lens} />
          <Circle cx={94} cy={27} r={16} fill={lens} />
          <Path d="M54 24 C 60 18, 72 18, 78 24" />
          <Path d="M23.5 21 C 18 18, 12 15, 6 13" />
          <Path d="M108.5 21 C 114 18, 120 15, 126 13" />
        </G>
      </Svg>
    </View>
  );
}
