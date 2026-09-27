import { View } from "react-native";

import { type Voucher, branchName } from "@/src/api/data";
import { Card } from "@/src/ui/Card";
import { GradientText } from "@/src/ui/GradientText";
import { Icon } from "@/src/ui/Icon";
import { PressScale } from "@/src/ui/PressScale";
import { QRCode } from "@/src/ui/QRCode";
import { StatusPill } from "@/src/ui/StatusPill";
import { Txt } from "@/src/ui/Txt";
import {
  dayMonthYear,
  expiresInText,
  expiresSoon,
  voucherLabel,
  voucherRestriction,
} from "@/src/lib/points";
import { font, radius, spacing } from "@/src/tokens";
import { makeStyles, useTheme } from "@/src/theme";

// A wallet voucher, drawn as a ticket: the value on the left, the code the
// till scans on the right, and a perforation between them. Available vouchers
// show a QR thumbnail and open the full-screen sheet; used and expired ones are
// greyed and inert.
//
// The perforation is two notches bitten out of the card's own edges — a circle
// in the page's colour, half of it clipped away by the card. It costs nothing
// and it is what makes the thing read as something you hand over.
export function VoucherCard({ voucher, onPress }: { voucher: Voucher; onPress?: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const spent = voucher.status === "used";
  const expired = voucher.status === "expired";
  // Both are inert: greyed, no QR, nothing to present at the till.
  const used = spent || expired;
  const soon = !used && expiresSoon(voucher.expires);

  const inner = (
    <Card contentStyle={styles.content}>
      <View style={styles.left}>
        <Txt variant="label" tone={used ? "dimSage" : "teal"}>
          {voucher.kind === "signup" ? "Welcome offer" : "Reward voucher"}
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
        ) : soon ? (
          <View style={styles.soon} testID={`voucher-${voucher.id}-expiring`}>
            <Icon name="clock" size={13} color={colors.warning} />
            <Txt variant="caption" tone="warning">
              {expiresInText(voucher.expires).replace(/^e/, "E")}
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

      <View style={styles.perforation}>
        <View style={[styles.notch, styles.notchTop]} />
        <View style={styles.dashes}>
          {Array.from({ length: DASHES }).map((_, i) => (
            <View key={i} style={styles.dash} />
          ))}
        </View>
        <View style={[styles.notch, styles.notchBottom]} />
      </View>

      <View style={styles.stub}>
        <StatusPill
          label={expired ? "Expired" : spent ? "Used" : "Active"}
          tone={expired ? "warning" : spent ? "quiet" : "active"}
          testID={`voucher-${voucher.id}-status`}
        />
        {used ? (
          <View style={styles.usedMark}>
            {/* A tick would read as "redeemed"; an expired voucher was not. */}
            <Icon name={expired ? "clock" : "check"} size={22} color={colors.dimSage} strokeWidth={2} />
          </View>
        ) : (
          <>
            <QRCode code={voucher.code} size={78} />
            <Txt variant="caption" tone="teal">
              Tap to show
            </Txt>
          </>
        )}
      </View>
    </Card>
  );

  if (used || !onPress) return <View style={used ? styles.dim : undefined}>{inner}</View>;
  return (
    <PressScale onPress={onPress} testID={`voucher-${voucher.id}`} accessibilityLabel="Show voucher">
      {inner}
    </PressScale>
  );
}

// Enough dashes to span a tall card; the column clips whatever it does not need.
const DASHES = 14;
const NOTCH = 22;

const useStyles = makeStyles((colors) => ({
  dim: { opacity: 0.55 },
  content: { flexDirection: "row", alignItems: "center", gap: spacing.base, padding: spacing.xl },
  left: { flex: 1, gap: spacing.xs },
  figure: { fontFamily: font.bold, fontSize: 42, letterSpacing: -1.4, lineHeight: 48 },
  figureUsed: {
    fontFamily: font.bold,
    fontSize: 42,
    letterSpacing: -1.4,
    lineHeight: 48,
    color: colors.dimSage,
  },
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
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceTertiary,
  },
  perforation: { alignSelf: "stretch", width: NOTCH, alignItems: "center", justifyContent: "center" },
  dashes: { flex: 1, justifyContent: "space-evenly", alignItems: "center", paddingVertical: 2 },
  dash: { width: 1.5, height: 5, borderRadius: 1, backgroundColor: colors.borderStrong },
  notch: {
    position: "absolute",
    width: NOTCH,
    height: NOTCH,
    borderRadius: NOTCH / 2,
    // A bite out of the card. On a near-white page a hole the colour of the
    // page would be invisible, so it takes the deeper tint instead.
    backgroundColor: colors.haze,
  },
  notchTop: { top: -(NOTCH / 2 + spacing.xl) },
  notchBottom: { bottom: -(NOTCH / 2 + spacing.xl) },
  stub: { alignItems: "center", gap: spacing.sm },
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
