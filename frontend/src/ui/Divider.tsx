import { View } from "react-native";

import { useTheme } from "@/src/theme";

export function Divider({ inset = 0 }: { inset?: number }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        height: 1,
        backgroundColor: colors.divider,
        marginLeft: inset,
      }}
    />
  );
}
