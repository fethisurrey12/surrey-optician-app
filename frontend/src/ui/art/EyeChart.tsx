import { View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { G, Path, Rect } from "react-native-svg";

import type { ArtTone } from "@/src/ui/art/Spectacles";
import { useTheme } from "@/src/theme";

// A test chart: the big E over rows that shrink away down the card. Used where
// the app is waiting for something to have happened — an activity list with
// nothing on it yet.
const W = 72;
const H = 76;
export const EYE_CHART_ASPECT = W / H;

export function EyeChart({
  width = 72,
  tone = "brand",
  style,
}: {
  width?: number;
  tone?: ArtTone;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const height = Math.round((width * H) / W);

  const stroke =
    tone === "paper" ? colors.paper : tone === "soft" ? colors.brandTertiary : colors.lightTeal;
  const card = tone === "brand" ? colors.brandTertiary : "none";
  const heavy = width >= 72 ? 3 : 3.4;

  return (
    <View style={style} pointerEvents="none">
      <Svg width={width} height={height} viewBox={`0 0 ${W} ${H}`}>
        <G fill="none" stroke={stroke} strokeLinecap="round" strokeLinejoin="round">
          <Rect x={8} y={6} width={56} height={64} rx={9} fill={card} strokeWidth={heavy} />
          <Path d="M27 18 H45 M27 18 V32 M27 25 H39 M27 32 H45" strokeWidth={heavy} />
          {/* The rows thin as they go, the way a chart's lines get harder to read. */}
          <Path d="M28 44 H44" strokeWidth={heavy * 0.82} />
          <Path d="M30 53 H42" strokeWidth={heavy * 0.68} />
          <Path d="M32 61 H40" strokeWidth={heavy * 0.55} />
        </G>
      </Svg>
    </View>
  );
}
