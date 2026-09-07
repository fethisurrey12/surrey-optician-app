import { View } from "react-native";

import { type Voucher } from "@/src/api/data";
import { daysUntil } from "@/src/lib/points";
import { radius, spacing } from "@/src/tokens";
import { makeStyles, useTheme } from "@/src/theme";
import { Icon } from "@/src/ui/Icon";
import { PressScale } from "@/src/ui/PressScale";
import { Txt } from "@/src/ui/Txt";

// A calm, single-line reminder shown on Home when a voucher is inside the
// 60-day expiry window. Tapping it opens the Rewards wallet.
export function ExpiryNudge({ vouchers, onPress }: { vouchers: Voucher[]; onPress: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  if (vouchers.length === 0) return null;

  const soonest = vouchers.reduce((a, b) => (daysUntil(a.expires) <= daysUntil(b.expires) ? a : b));
  const days = daysUntil(soonest.expires);
  const when = days <= 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
  const title =
    vouchers.length > 1
      ? `${vouchers.length} £10 vouchers expire soon`
      : `Your £10 voucher expires ${when}`;

  return (
    <PressScale onPress={onPress} testID="expiry-nudge" accessibilityLabel={title}>
      <View style={styles.wrap}>
        <View style={styles.icon}>
          <Icon name="clock" size={18} color={colors.lightGold} />
        </View>
        <View style={styles.texts}>
          <Txt variant="bodyStrong" tone="cream">
            {title}
          </Txt>
          <Txt variant="caption" tone="sage">
            Use it at any branch — it’s worth £10 off your next private purchase.
          </Txt>
        </View>
        <Icon name="chevronRight" size={18} color={colors.dimSage} />
      </View>
    </PressScale>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.base,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(201,162,39,0.35)",
    backgroundColor: "rgba(201,162,39,0.08)",
  },
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
}));
