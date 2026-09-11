import { type StyleProp, View, type ViewStyle } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

// The practice's logo tile, drawn as vector so it stays sharp at any size.
//
// A trace of their own Surrey Opticians Logo-01.png: the S is one continuous
// stroked centreline rather than stacked arcs, which is what lets it read as a
// letter. The same paths live in assets/logo-mark.svg, which the store icon
// and splash are rendered from — edit both together, or replace them with the
// practice's artwork when it is to hand.
const W = 1032;
const H = 400;
export const LOGO_ASPECT = W / H;

const TURQUOISE = "#009DB1";
const MARK = "#FFFFFF";

export function LogoMark({
  height = 34,
  style,
}: {
  /** Width follows from the tile's proportions. */
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const width = Math.round(height * LOGO_ASPECT);
  return (
    <View style={style} accessible accessibilityRole="image" accessibilityLabel="Surrey Opticians">
      <Svg width={width} height={height} viewBox={`0 0 ${W} ${H}`}>
        <Rect width={W} height={H} fill={TURQUOISE} />
        <Circle cx={356} cy={162} r={142} fill="none" stroke={MARK} strokeWidth={32} />
        <Path
          d="M -14 122 C 34 62 118 44 158 92 C 190 130 170 168 138 186 C 96 208 84 258 112 292 C 142 328 208 326 228 288 C 246 254 222 214 184 202"
          fill="none"
          stroke={MARK}
          strokeWidth={32}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}
