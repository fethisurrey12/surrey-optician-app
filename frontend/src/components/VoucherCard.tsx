import { View } from "react-native";

import { type Voucher, branchName } from "@/src/api/data";
import { Card } from "@/src/ui/Card";
import { GradientText } from "@/src/ui/GradientText";
import { Icon } from "@/src/ui/Icon";
import { PressScale } from "@/src/ui/PressScale";
import { QRCode } from "@/src/ui/QRCode";
import { Txt } from "@/src/ui/Txt";
import { dayMonthYear } from "@/src/lib/points";
import { font, spacing } from "@/src/tokens";
import { makeStyles, useTheme } from "@/src/theme";

// A wallet voucher. Available vouchers show a QR thumbnail and open the
// full-screen sheet; used vouchers are shown greyed and inert.
export function VoucherCard({ voucher, onPress }: { voucher: Voucher; onPress?: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const used = voucher.status === "used";

  const inner = (
    <Card contentStyle={[styles.content, used && styles.contentUsed]}>
      <View style={styles.left}>
        <Txt variant="label" tone={used ? "dimSage" : "gold"}>
          {used ? "Used" : "Reward voucher"}
        </Txt>
        {used ? (
          <Txt style={styles.figureUsed}>£10</Txt>
        ) : (
          <GradientText style={styles.figure}>£10</GradientText>
        )}
        <Txt variant="caption" tabular tone={used ? "dimSage" : "sage"} style={styles.code}>
          {voucher.code}
        </Txt>
        {used ? (
          <Txt variant="caption">
            {branchName(voucher.usedBranchId)} · {dayMonthYear(voucher.usedAt ?? voucher.issued)}
          </Txt>
        ) : (
          <Txt variant="caption">Expires {dayMonthYear(voucher.expires)}</Txt>
        )}
      </View>

      {used ? (
        <View style={styles.usedMark}>
          <Icon name="check" size={22} color={colors.dimSage} strokeWidth={2} />
        </View>
      ) : (
        <View style={styles.qr}>
          <QRCode code={voucher.code} size={78} />
          <Txt variant="caption" tone="gold" style={styles.tap}>
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
  figure: { fontFamily: font.serifThin, fontSize: 46, letterSpacing: -1.5, lineHeight: 50 },
  figureUsed: { fontFamily: font.serifThin, fontSize: 46, letterSpacing: -1.5, lineHeight: 50, color: colors.dimSage },
  code: { letterSpacing: 1, marginTop: 2 },
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
