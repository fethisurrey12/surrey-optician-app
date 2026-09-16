import { ActivityIndicator, View } from "react-native";

import { spacing } from "@/src/tokens";
import { useTheme } from "@/src/theme";
import { Screen } from "@/src/ui/Screen";
import { LogoMark } from "@/src/ui/LogoMark";

// Entry route. The route guard in _layout redirects to the right flow; this is
// the branded holding screen shown while state resolves.
export default function Index() {
  const { colors } = useTheme();
  return (
    <Screen scroll={false} center testID="splash-screen">
      <View style={{ alignItems: "center", gap: spacing.xxl }}>
        <LogoMark height={64} />
        <ActivityIndicator color={colors.teal} />
      </View>
    </Screen>
  );
}
