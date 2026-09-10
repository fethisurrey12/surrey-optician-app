import { View } from "react-native";

import { type Voucher, branchName } from "@/src/api/data";
import { Card } from "@/src/ui/Card";
import { GradientText } from "@/src/ui/GradientText";
import { Icon } from "@/src/ui/Icon";
import { PressScale } from "@/src/ui/PressScale";
import { QRCode } from "@/src/ui/QRCode";
import { Txt } from "@/src/ui/Txt";
import {
  dayMonthYear,
  expiresInText,
  expiresSoon,
  voucherLabel,
  voucherRestriction,
} from "@/src/lib/points";
import { font, spacing } from "@/src/tokens";
import { makeStyles, useTheme } from "@/src/theme";

// A wallet voucher. Available vouchers show a QR thumbnail and open the
// full-screen sheet; used and expired vouchers are shown greyed and inert.
export function VoucherCard({ voucher, onPress }: { voucher: Voucher; onPress?: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const spent = voucher.status === "used";
  const expired = voucher.status === "expired";
  // Both are inert: greyed, no QR, nothing to present at the till.
  const used = spent || expired;

  const inner = (
    <Card contentStyle={[styles.content, used && styles.contentUsed]}>
      <View style={styles.left}>
        <Txt variant="label" tone={used ? "dimSage" : "teal"}>
          {expired ? "Expired" : spent ? "Used" : voucher.kind === "signup" ? "Welcome offer" : "Reward voucher"}
        </Txt>
        {used ? (
          <Txt style={styles.figureUsed}>{voucherLabel(voucher)}</Txt>
        ) : (
          <GradientText style={styles.figure}>{voucherLabel(voucher)}</GradientText>
        )}
        <Txt variant="caption" tabular tone={used ? "dimSage" : "sage"} style={styles.code}>
          {voucher.code}
        </Txt>
        {voucherRestriction(voucher) ? (
          <Txt variant="caption" tone={used ? "dimSage" : "teal"}>
            {voucherRestriction(voucher)}
          </Txt>
        ) : null}
        {expired ? (
          <Txt variant="caption">Expired {dayMonthYear(voucher.expires)}</Txt>
        ) : spent ? (
          <Txt variant="caption">
            {branchName(voucher.usedBranchId)} · {dayMonthYear(voucher.usedAt ?? voucher.issued)}
          </Txt>
        ) : expiresSoon(voucher.expires) ? (
          <View style={styles.soon} testID={`voucher-${voucher.id}-expiring`}>
            <Icon name="clock" size={13} color={colors.warning} />
            <Txt variant="caption" tone="warning">
              {expiresInText(voucher.expires).replace(/^e/, "E")} · {dayMonthYear(voucher.expires)}
            </Txt>
          </View>
        ) : (
          <Txt variant="caption">Expires {dayMonthYear(voucher.expires)}</Txt>
        )}
        {!used && voucher.wallet ? (
          <View style={styles.walletChip} testID={`voucher-${voucher.id}-wallet-chip`}>
            <Icon name="wallet" size={13} color={colors.teal} />
            <Txt variant="caption" tone="teal">
              In {voucher.wallet === "apple" ? "Apple" : "Google"} Wallet
            </Txt>
          </View>
        ) : null}
      </View>

      {used ? (
        <View style={styles.usedMark}>
          {/* A tick would read as "redeemed"; an expired voucher was not. */}
          <Icon name={expired ? "clock" : "check"} size={22} color={colors.dimSage} strokeWidth={2} />
        </View>
      ) : (
        <View style={styles.qr}>
          <QRCode code={voucher.code} size={78} />
          <Txt variant="caption" tone="teal" style={styles.tap}>
            Tap to show
          </Txt>
        </View>
      )}
    </Card>
  );

  if (used || !onPress) return <View style={used ? styles.dim : undefined}>{inner}</View>;
  return (
    <PressScale onPress={onPress} testID={`voucher-${voucher.id}`} accessibilityLabel="Show voucher">
      {inner}
    </PressScale>
  );
}

const useStyles = makeStyles((colors) => ({
  dim: { opacity: 0.55 },
  content: { flexDirection: "row", alignItems: "center", gap: spacing.base, padding: spacing.lg },
  contentUsed: {},
  left: { flex: 1, gap: spacing.xs },
  figure: { fontFamily: font.serifLight, fontSize: 46, letterSpacing: -1.5, lineHeight: 50 },
  figureUsed: { fontFamily: font.serifLight, fontSize: 46, letterSpacing: -1.5, lineHeight: 50, color: colors.dimSage },
  code: { letterSpacing: 1, marginTop: 2 },
  soon: { flexDirection: "row", alignItems: "center", gap: 5 },
  walletChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceTertiary,
  },
  qr: { alignItems: "center", gap: spacing.xs },
  tap: {},
  usedMark: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
}));
