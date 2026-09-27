import { View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { G, Path } from "react-native-svg";

import { useTheme } from "@/src/theme";

// A cat-eye frame front, drawn in the practice's turquoise.
//
// Decoration, not an icon: it fills the quiet places — an empty rewards list,
// the sign-in screen — where a bare paragraph would look unfinished. Every
// colour comes from the palette.
//
// The front only: two lenses and the bridge, no temples. It is how a frame is
// photographed on a display board, and without arms running off to the edges
// the drawing fills its space instead of floating in the middle of it. The
// viewBox is wrapped tight around the outline for the same reason.

export type ArtTone = "brand" | "soft" | "paper";

const LENSES = [
  "M56 19 C 46 13, 31 10, 19 10 C 19 16, 20 21, 23 27 C 27 34, 34 38, 41 38 C 50 38, 56 32, 56 25 Z",
  "M76 19 C 86 13, 101 10, 113 10 C 113 16, 112 21, 109 27 C 105 34, 98 38, 91 38 C 82 38, 76 32, 76 25 Z",
];
const BRIDGE = "M56 21 C 60 18, 72 18, 76 21";
const BOX = [17, 8, 98, 32] as const;
const [, , BOX_W, BOX_H] = BOX;

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
  const height = Math.round((width * BOX_H) / BOX_W);

  const stroke =
    tone === "paper"
      ? colors.paper
      : tone === "soft"
        ? colors.brandTertiary
        : colors.lightTeal;
  // Only the full-strength pair carries a tinted lens; a watermark stays open.
  const lens = tone === "brand" ? colors.brandTertiary : "none";
  // The weight we want on screen: 3px reads correctly from about 90px wide up,
  // below that it needs a little more or it dissolves into a hairline.
  const onScreen = width >= 90 ? 3 : width >= 56 ? 3.4 : 3.9;
  // The box is narrower than the width it is drawn at, so convert.
  const strokeWidth = (onScreen * BOX_W) / width;

  return (
    <View style={style} pointerEvents="none">
      <Svg width={width} height={height} viewBox={BOX.join(" ")}>
        <G
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {LENSES.map((d) => (
            <Path key={d} d={d} fill={lens} />
          ))}
          <Path d={BRIDGE} />
        </G>
      </Svg>
    </View>
  );
}
