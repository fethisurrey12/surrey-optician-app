import { LinearGradient } from "expo-linear-gradient";

import { Txt } from "@/src/ui/Txt";
import { useTheme } from "@/src/theme";

// A small foil badge showing a count, e.g. rewards waiting.
export function FoilBadge({ count, testID }: { count: number; testID?: string }) {
  const { colors } = useTheme();
  if (count <= 0) return null;
  return (
    <LinearGradient
      testID={testID}
      colors={colors.tealFoil}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        paddingHorizontal: 5,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Txt tabular style={{ fontSize: 11, lineHeight: 14, color: colors.paper, fontWeight: "700" }}>
        {count}
      </Txt>
    </LinearGradient>
  );
}
