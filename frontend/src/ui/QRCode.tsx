import { View } from "react-native";
import Svg, { Rect } from "react-native-svg";

import { codeMatrix, QR_SIZE } from "@/src/lib/qr";
import { radius } from "@/src/tokens";
import { useTheme } from "@/src/theme";

// Renders the placeholder module matrix on a cream tile. Swap codeMatrix for a
// real encoder at build time — this component takes any boolean matrix.
export function QRCode({ code, size = 200 }: { code: string; size?: number }) {
  const { colors } = useTheme();
  const quiet = 2; // modules of margin
  const total = QR_SIZE + quiet * 2;
  const cell = size / total;
  const matrix = codeMatrix(code);

  const rects: React.ReactNode[] = [];
  for (let r = 0; r < QR_SIZE; r++) {
    for (let c = 0; c < QR_SIZE; c++) {
      if (!matrix[r][c]) continue;
      rects.push(
        <Rect
          key={`${r}-${c}`}
          x={(c + quiet) * cell}
          y={(r + quiet) * cell}
          width={cell}
          height={cell}
          rx={cell * 0.18}
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
    >
      <Svg width={size} height={size}>
        {rects}
      </Svg>
    </View>
  );
}
