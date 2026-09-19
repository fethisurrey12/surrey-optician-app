import Svg, { Circle, Path } from "react-native-svg";

import { useTheme } from "@/src/theme";

// A thin line-art pair of spectacles, drawn in the palette rather than in any
// new colour: cream frame, a sage inner ring for lens depth. Used as a quiet
// brand motif — the welcome emblem and the activity empty state — so it stays
// deliberately sparse: two rings, a bridge, two temples, nothing else.
//
// The 160x64 viewBox keeps the geometry readable: lenses of r=24 on a shared
// centre line, temples leaving the frame at 150 degrees so they flow off the
// rim instead of crossing it.
const RATIO = 64 / 160;

export function Spectacles({
  width = 120,
  color,
  innerColor,
  strokeWidth = 1.2,
  inner = true,
  opacity = 1,
}: {
  width?: number;
  color?: string;
  innerColor?: string;
  strokeWidth?: number;
  inner?: boolean;
  opacity?: number;
}) {
  const { colors } = useTheme();
  const frame = color ?? colors.cream;
  const lens = innerColor ?? colors.sage;

  return (
    <Svg
      width={width}
      height={width * RATIO}
      viewBox="0 0 160 64"
      fill="none"
      opacity={opacity}
    >
      <Circle cx={44} cy={34} r={24} stroke={frame} strokeWidth={strokeWidth} />
      <Circle cx={116} cy={34} r={24} stroke={frame} strokeWidth={strokeWidth} />
      {inner
        ? [44, 116].map((cx) => (
            <Circle
              key={cx}
              cx={cx}
              cy={34}
              r={17.5}
              stroke={lens}
              strokeWidth={strokeWidth * 0.75}
              opacity={0.34}
            />
          ))
        : null}
      <Path
        d="M68 30.5C73 25 87 25 92 30.5"
        stroke={frame}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M23.2 22C17 17.5 10 14 3 12"
        stroke={frame}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M136.8 22C143 17.5 150 14 157 12"
        stroke={frame}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}
