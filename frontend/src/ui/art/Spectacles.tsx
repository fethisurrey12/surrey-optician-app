import { View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Circle, G, Path, Rect } from "react-native-svg";

import { useTheme } from "@/src/theme";

// A frame outline, drawn in the practice's turquoise.
//
// Decoration, not an icon: it fills the quiet places — an empty rewards list,
// the sign-in screen — where a bare paragraph would look unfinished.
//
// The two shapes and their paths are the practice's own drawings, kept as
// given: a thin open outline, no tinted lens, with the short flick of a
// temple at each side. Drawn on their 24-unit canvas and cropped to the
// outline, so the frame fills its space rather than floating in the middle.

export type ArtTone = "brand" | "soft" | "paper";
export type FrameShape = "round" | "square";

// [x, y, width, height] — wrapped tight around each outline, stroke included.
const BOX: Record<FrameShape, [number, number, number, number]> = {
  round: [1.3, 7.8, 21.4, 8.4],
  square: [0.8, 6.3, 22.4, 8.3],
};

export function Spectacles({
  width = 120,
  tone = "brand",
  shape = "round",
  style,
}: {
  width?: number;
  /** brand: turquoise. soft: a watermark. paper: reversed. */
  tone?: ArtTone;
  shape?: FrameShape;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const box = BOX[shape];
  const [, , boxWidth, boxHeight] = box;
  const height = Math.round((width * boxHeight) / boxWidth);

  const stroke =
    tone === "paper"
      ? colors.paper
      : tone === "brand"
        ? colors.teal
        : colors.lightTeal;
  // A watermark is the same line, just faint — at this thinness a pale colour
  // washes out altogether, where the brand turquoise held back does not.
  const strokeOpacity = tone === "soft" ? 0.3 : 1;
  // The weight we want on screen. The outline is thin by design, so it needs a
  // little more below about 90px or it disappears.
  const onScreen = width >= 90 ? 2 : 2.4;
  // The box is narrower than the width it is drawn at, so convert.
  const strokeWidth = (onScreen * boxWidth) / width;

  return (
    <View style={style} pointerEvents="none">
      <Svg width={width} height={height} viewBox={box.join(" ")}>
        <G
          fill="none"
          stroke={stroke}
          strokeOpacity={strokeOpacity}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        >
          {shape === "round" ? (
            <>
              <Circle cx={7} cy={12} r={3.5} />
              <Circle cx={17} cy={12} r={3.5} />
              <Path d="M10.5 12h3M3.5 12C3.5 9 2 9 2 9M20.5 12c0-3 1.5-3 1.5-3" />
            </>
          ) : (
            <>
              <Rect x={3} y={8} width={7} height={6} rx={2} />
              <Rect x={14} y={8} width={7} height={6} rx={2} />
              <Path d="M10 11h4M3 9C2.5 7 1.5 7 1.5 7M21 9c.5-2 1.5-2 1.5-2" />
            </>
          )}
        </G>
      </Svg>
    </View>
  );
}
