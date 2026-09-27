import { View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { G, Path } from "react-native-svg";

import { useTheme } from "@/src/theme";

// A pair of frames, drawn in the practice's turquoise.
//
// Decoration, not an icon: it fills the quiet places — an empty rewards list,
// the sign-in screen — where a bare paragraph would look unfinished. Every
// colour comes from the palette, and the stroke thickens a little at small
// sizes so the frames stay visible rather than dissolving into hairlines.
//
// Four shapes, because a dispensary sells four: a soft rectangle is what most
// people walk out with, so it is the default. The showcase passes the shape
// that matches the frame it is drawing — a round one should not be sold under
// a square picture.
const W = 132;
const H = 46;
export const SPECTACLES_ASPECT = W / H;

export type ArtTone = "brand" | "soft" | "paper";
export type FrameShape = "square" | "round" | "panto" | "cateye";

// Each shape is two lens outlines (filled when the tone calls for it) and the
// open lines — bridge first, then the two temples. Drawn on a 132 × 46 canvas
// with the lenses between x 21–55 and x 77–111, so every shape sits on the
// same baseline and swapping one for another does not shift the layout.
const SHAPES: Record<
  FrameShape,
  { lenses: [string, string]; lines: string[] }
> = {
  square: {
    lenses: [
      "M29 13 H47 A8 8 0 0 1 55 21 V31 A8 8 0 0 1 47 39 H29 A8 8 0 0 1 21 31 V21 A8 8 0 0 1 29 13 Z",
      "M85 13 H103 A8 8 0 0 1 111 21 V31 A8 8 0 0 1 103 39 H85 A8 8 0 0 1 77 31 V21 A8 8 0 0 1 85 13 Z",
    ],
    lines: [
      "M55 20 C 60 17, 72 17, 77 20",
      "M21.2 19.5 C 16 17, 11 14.5, 6 12.5",
      "M110.8 19.5 C 116 17, 121 14.5, 126 12.5",
    ],
  },
  round: {
    lenses: [
      "M23 26 a15 15 0 1 0 30 0 a15 15 0 1 0 -30 0 Z",
      "M79 26 a15 15 0 1 0 30 0 a15 15 0 1 0 -30 0 Z",
    ],
    lines: [
      "M53 23 C 59 18, 73 18, 79 23",
      "M23.5 19 C 18 16, 12 13, 6 11",
      "M108.5 19 C 114 16, 120 13, 126 11",
    ],
  },
  panto: {
    lenses: [
      "M21 22 C 21 14, 28 12, 38 12 C 48 12, 55 14, 55 22 C 55 31, 47 39, 38 39 C 29 39, 21 31, 21 22 Z",
      "M77 22 C 77 14, 84 12, 94 12 C 104 12, 111 14, 111 22 C 111 31, 103 39, 94 39 C 85 39, 77 31, 77 22 Z",
    ],
    lines: [
      "M55 19 C 60 16, 72 16, 77 19",
      "M21.5 18 C 16 15, 11 13, 6 11",
      "M110.5 18 C 116 15, 121 13, 126 11",
    ],
  },
  cateye: {
    lenses: [
      "M55 18 C 44 14, 30 12, 20 12 C 20 18, 21 22, 23 27 C 26 35, 32 39, 39 39 C 48 39, 54 32, 55 24 Z",
      "M77 18 C 88 14, 102 12, 112 12 C 112 18, 111 22, 109 27 C 106 35, 100 39, 93 39 C 84 39, 78 32, 77 24 Z",
    ],
    lines: [
      "M55 20 C 60 17, 72 17, 77 20",
      "M19.5 12.5 C 15 12, 10 11.5, 6 11",
      "M112.5 12.5 C 117 12, 122 11.5, 126 11",
    ],
  },
};

export function Spectacles({
  width = 120,
  tone = "brand",
  shape = "square",
  style,
}: {
  width?: number;
  /** brand: turquoise on a tinted lens. soft: a watermark. paper: reversed. */
  tone?: ArtTone;
  shape?: FrameShape;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const height = Math.round((width * H) / W);
  const { lenses, lines } = SHAPES[shape];

  const stroke =
    tone === "paper"
      ? colors.paper
      : tone === "soft"
        ? colors.brandTertiary
        : colors.lightTeal;
  // Only the full-strength pair carries a tinted lens; a watermark stays open.
  const lens = tone === "brand" ? colors.brandTertiary : "none";
  // 3 units reads correctly from about 90px up; below that it needs weight.
  const strokeWidth = width >= 90 ? 3 : width >= 56 ? 3.4 : 3.9;

  return (
    <View style={style} pointerEvents="none">
      <Svg width={width} height={height} viewBox={`0 0 ${W} ${H}`}>
        <G
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {lenses.map((d) => (
            <Path key={d} d={d} fill={lens} />
          ))}
          {lines.map((d) => (
            <Path key={d} d={d} />
          ))}
        </G>
      </Svg>
    </View>
  );
}
