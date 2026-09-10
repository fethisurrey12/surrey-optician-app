import { useRouter } from "expo-router";
import { View } from "react-native";

import { Icon } from "@/src/ui/Icon";
import { PressScale } from "@/src/ui/PressScale";
import { Txt } from "@/src/ui/Txt";
import { spacing } from "@/src/tokens";
import { makeStyles, useTheme } from "@/src/theme";

// Sticky top bar for pushed screens: back control + title.
export function HeaderBar({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View style={styles.row}>
      <PressScale
        onPress={onBack ?? (() => router.back())}
        style={styles.back}
        testID="header-back"
        accessibilityLabel="Go back"
        hitSlop={12}
      >
        <Icon name="back" size={20} color={colors.ink} />
      </PressScale>
      <Txt variant="h3" numberOfLines={1} style={styles.title}>
        {title}
      </Txt>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  back: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { flex: 1 },
  right: { minWidth: 42, alignItems: "flex-end" },
}));
