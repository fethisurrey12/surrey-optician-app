import { View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { G, Path } from "react-native-svg";

import { useTheme } from "@/src/theme";

// A frame front, drawn in the practice's turquoise.
//
// Decoration, not an icon: it fills the quiet places — an empty rewards list,
// the sign-in screen — where a bare paragraph would look unfinished. Every
// colour comes from the palette.
//
// The front only: two lenses and the bridge, no temples. It is how a frame is
// photographed on a display board, and without arms running off to the edges
// the drawing fills its space instead of floating in the middle of it.
//
// Four shapes, because a dispensary sells four. Cat-eye is the default; the
// showcase passes the shape that matches the frame it is drawing, so a round
// one is not sold under a square picture.

export type ArtTone = "brand" | "soft" | "paper";
export type FrameShape = "cateye" | "square" | "round" | "panto";

type Geometry = {
  /** The two lens outlines, filled when the tone calls for it. */
  lenses: [string, string];
  /** The bridge, drawn open. */
  bridge: string;
  /** viewBox, wrapped tight around the front so it fills the canvas. */
  box: [number, number, number, number];
};

// Every shape is drawn in one 132-unit-wide coordinate space and then cropped
// by its own box, so the paths stay comparable while each front still fills
// the frame it is given.
const SHAPES: Record<FrameShape, Geometry> = {
  cateye: {
    lenses: [
      "M56 19 C 46 13, 31 10, 19 10 C 19 16, 20 21, 23 27 C 27 34, 34 38, 41 38 C 50 38, 56 32, 56 25 Z",
      "M76 19 C 86 13, 101 10, 113 10 C 113 16, 112 21, 109 27 C 105 34, 98 38, 91 38 C 82 38, 76 32, 76 25 Z",
    ],
    bridge: "M56 21 C 60 18, 72 18, 76 21",
    box: [17, 8, 98, 32],
  },
  square: {
    lenses: [
      "M29 13 H47 A8 8 0 0 1 55 21 V31 A8 8 0 0 1 47 39 H29 A8 8 0 0 1 21 31 V21 A8 8 0 0 1 29 13 Z",
      "M85 13 H103 A8 8 0 0 1 111 21 V31 A8 8 0 0 1 103 39 H85 A8 8 0 0 1 77 31 V21 A8 8 0 0 1 85 13 Z",
    ],
    bridge: "M55 20 C 60 17, 72 17, 77 20",
    box: [19, 11, 94, 30],
  },
  round: {
    lenses: [
      "M23 26 a15 15 0 1 0 30 0 a15 15 0 1 0 -30 0 Z",
      "M79 26 a15 15 0 1 0 30 0 a15 15 0 1 0 -30 0 Z",
    ],
    bridge: "M53 23 C 59 18, 73 18, 79 23",
    box: [21, 9, 90, 34],
  },
  panto: {
    lenses: [
      "M21 22 C 21 14, 28 12, 38 12 C 48 12, 55 14, 55 22 C 55 31, 47 39, 38 39 C 29 39, 21 31, 21 22 Z",
      "M77 22 C 77 14, 84 12, 94 12 C 104 12, 111 14, 111 22 C 111 31, 103 39, 94 39 C 85 39, 77 31, 77 22 Z",
    ],
    bridge: "M55 19 C 60 16, 72 16, 77 19",
    box: [19, 10, 94, 31],
  },
};

export function Spectacles({
  width = 120,
  tone = "brand",
  shape = "cateye",
  style,
}: {
  width?: number;
  /** brand: turquoise on a tinted lens. soft: a watermark. paper: reversed. */
  tone?: ArtTone;
  shape?: FrameShape;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const { lenses, bridge, box } = SHAPES[shape];
  const [, , boxWidth, boxHeight] = box;
  const height = Math.round((width * boxHeight) / boxWidth);

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
  // Each shape crops to a different box, so convert to canvas units or the
  // stroke would thicken and thin as the shape changes.
  const strokeWidth = (onScreen * boxWidth) / width;

  return (
    <View style={style} pointerEvents="none">
      <Svg width={width} height={height} viewBox={box.join(" ")}>
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
          <Path d={bridge} />
        </G>
      </Svg>
    </View>
  );
}
