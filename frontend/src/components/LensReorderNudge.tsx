import { View } from "react-native";

import { branchName } from "@/src/api/data";
import { type LensSupplyStatus } from "@/src/lib/supply";
import { dayMonthYear } from "@/src/lib/points";
import { radius, spacing } from "@/src/tokens";
import { makeStyles, useTheme } from "@/src/theme";
import { Icon } from "@/src/ui/Icon";
import { PressScale } from "@/src/ui/PressScale";
import { Txt } from "@/src/ui/Txt";

// A compact reorder banner: "your lenses run out in N days", one tap to reorder
// at the branch they came from, and a quiet way to put it away.
export function LensReorderNudge({
  status,
  onReorder,
  onDismiss,
}: {
  status: LensSupplyStatus;
  onReorder: () => void;
  onDismiss: () => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const title =
    status.days < 0
      ? "Your contact lenses have run out"
      : status.days === 0
        ? "Your contact lenses run out today"
        : status.days === 1
          ? "Your contact lenses run out tomorrow"
          : `Your contact lenses run out in ${status.days} days`;

  return (
    <View style={styles.wrap} testID="lens-reorder-nudge">
      <View style={styles.mainWrap}>
        <PressScale onPress={onReorder} style={styles.main} testID="lens-reorder-button" accessibilityLabel={title}>
          <View style={styles.icon}>
            <Icon name="lens" size={18} color={colors.lightGold} />
          </View>
          <View style={styles.texts}>
            <Txt variant="bodyStrong" tone="cream">
              {title}
            </Txt>
            <Txt variant="caption" tone="sage">
              {status.months}-month supply from {dayMonthYear(status.last)} · reorder at{" "}
              {branchName(status.branchId)} and earn points on it
            </Txt>
          </View>
          <Icon name="chevronRight" size={18} color={colors.dimSage} />
        </PressScale>
      </View>
      <PressScale
        onPress={onDismiss}
        hitSlop={10}
        style={styles.dismiss}
        testID="lens-reorder-dismiss"
        accessibilityLabel="Not now"
      >
        <Icon name="close" size={14} color={colors.dimSage} />
      </PressScale>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.base,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(201,162,39,0.35)",
    backgroundColor: "rgba(201,162,39,0.08)",
  },
  mainWrap: { flex: 1 },
  main: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  texts: { flex: 1, gap: 2 },
  dismiss: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
}));
