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
        <Circle cx={368} cy={150} r={152} fill="none" stroke={MARK} strokeWidth={40} />
        <Path
          d="M 221 113 C 221 76 188 56 152 56 C 109 56 76 83 76 124 C 76 162 111 183 161 196 C 214 209 249 233 249 275 C 249 319 207 344 163 344 C 117 344 76 321 65 282"
          fill="none"
          stroke={MARK}
          strokeWidth={40}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}
