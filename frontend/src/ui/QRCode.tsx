import { View } from "react-native";
import Svg, { Rect } from "react-native-svg";

import { codeMatrix } from "@/src/lib/qr";
import { radius } from "@/src/tokens";
import { useTheme } from "@/src/theme";

// Renders a genuine, scannable QR symbol on a cream tile. Modules are drawn as
// crisp squares with a 4-module quiet zone, as the QR spec requires for readers.
export function QRCode({ code, size = 200 }: { code: string; size?: number }) {
  const { colors } = useTheme();
  const matrix = codeMatrix(code);
  const n = matrix.length;
  const quiet = 4;
  const total = n + quiet * 2;
  const cell = size / total;

  const rects: React.ReactNode[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!matrix[r][c]) continue;
      rects.push(
        <Rect
          key={`${r}-${c}`}
          x={(c + quiet) * cell}
          y={(r + quiet) * cell}
          width={cell}
          height={cell}
          fill={colors.ink}
        />,
      );
    }
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.md,
        backgroundColor: colors.cream,
        overflow: "hidden",
      }}
      accessibilityLabel={`QR code ${code}`}
    >
      <Svg width={size} height={size}>
        {rects}
      </Svg>
    </View>
  );
}
