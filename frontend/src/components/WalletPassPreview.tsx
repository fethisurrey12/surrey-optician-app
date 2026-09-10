import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";

import { type Account, type Voucher, type WalletProvider, branchName } from "@/src/api/data";
import { dayMonthYear } from "@/src/lib/points";
import { font, radius, spacing } from "@/src/tokens";
import { makeStyles, useTheme } from "@/src/theme";
import { GradientText } from "@/src/ui/GradientText";
import { QRCode } from "@/src/ui/QRCode";
import { Txt } from "@/src/ui/Txt";

// A faithful rendering of the pass the server signs — same fields, same
// colours — so members can see exactly what lands on their lock screen.
export function WalletPassPreview({
  provider,
  voucher,
  account,
}: {
  provider: WalletProvider;
  voucher: Voucher;
  account: Account;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const member = `${account.firstName} ${account.lastName}`;

  return (
    <View style={styles.pass} testID="wallet-pass-preview">
      <LinearGradient colors={colors.cardGradient} style={styles.fill} />

      {provider === "google" ? (
        <View style={styles.gHeader}>
          <View style={styles.gLogo}>
            <Txt style={styles.gLogoText}>SO</Txt>
          </View>
          <Txt variant="bodyStrong" tone="ink">
            Surrey Opticians
          </Txt>
        </View>
      ) : (
        <View style={styles.aHeader}>
          <Txt style={styles.wordmark}>Surrey Opticians</Txt>
          <View>
            <Txt variant="label" tone="teal">
              Reward
            </Txt>
            <Txt variant="bodyStrong" tone="ink">
              £{voucher.value} off
            </Txt>
          </View>
        </View>
      )}

      <View style={styles.primary}>
        {provider === "google" ? (
          <Txt variant="h3" tone="ink">
            £{voucher.value} reward voucher
          </Txt>
        ) : (
          <GradientText style={styles.figure}>£{voucher.value}</GradientText>
        )}
        <Txt variant="caption" tone="sage">
          {member}
        </Txt>
      </View>

      <View style={styles.fields}>
        <View style={styles.field}>
          <Txt variant="label" tone="teal">
            Voucher code
          </Txt>
          <Txt variant="bodyStrong" tabular tone="ink">
            {voucher.code}
          </Txt>
        </View>
        <View style={styles.field}>
          <Txt variant="label" tone="teal">
            Expires
          </Txt>
          <Txt variant="bodyStrong" tone="ink">
            {dayMonthYear(voucher.expires)}
          </Txt>
        </View>
        <View style={styles.field}>
          <Txt variant="label" tone="teal">
            Home branch
          </Txt>
          <Txt variant="bodyStrong" tone="ink">
            {branchName(account.homeBranchId)}
          </Txt>
        </View>
      </View>

      <View style={styles.barcode}>
        <View style={styles.qrPlate}>
          <QRCode code={voucher.code} size={132} />
        </View>
        <Txt variant="caption" tabular tone="dimSage" style={styles.alt}>
          {voucher.code}
        </Txt>
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  pass: {
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: spacing.lg,
    gap: spacing.lg,
    shadowColor: colors.shadow,
    shadowOpacity: 0.45,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
  fill: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  aHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  wordmark: { fontFamily: font.serifLight, fontSize: 20, color: colors.ink },
  gHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  gLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  gLogoText: { fontFamily: font.serifSemi, fontSize: 12, color: colors.teal },
  primary: { gap: 2 },
  figure: { fontFamily: font.serifLight, fontSize: 56, letterSpacing: -2, lineHeight: 58 },
  fields: { flexDirection: "row", flexWrap: "wrap", gap: spacing.base },
  field: { minWidth: 120, gap: 2 },
  barcode: { alignItems: "center", gap: spacing.sm, paddingTop: spacing.sm },
  qrPlate: { padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.paper },
  alt: { letterSpacing: 2 },
}));
