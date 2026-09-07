import { useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { type Voucher } from "@/src/api/data";
import { useAccount, useMarkVoucherUsed, useVouchers } from "@/src/api/hooks";
import { useApp } from "@/src/context/AppContext";
import { VoucherCard } from "@/src/components/VoucherCard";
import { dayMonthYear, pointsToNextReward } from "@/src/lib/points";
import { font, spacing } from "@/src/tokens";
import { makeStyles, useTheme } from "@/src/theme";
import { Card } from "@/src/ui/Card";
import { GoldButton } from "@/src/ui/GoldButton";
import { GradientText } from "@/src/ui/GradientText";
import { Icon } from "@/src/ui/Icon";
import { PressScale } from "@/src/ui/PressScale";
import { QRCode } from "@/src/ui/QRCode";
import { Screen } from "@/src/ui/Screen";
import { SectionHeader } from "@/src/ui/SectionHeader";
import { Sheet } from "@/src/ui/Sheet";
import { StaggerItem } from "@/src/ui/Stagger";
import { Txt } from "@/src/ui/Txt";

export default function Rewards() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { toast } = useApp();
  const account = useAccount();
  const vouchers = useVouchers();
  const markUsed = useMarkVoucherUsed();
  const [selected, setSelected] = useState<Voucher | null>(null);

  if (!vouchers.data || !account.data) {
    return (
      <Screen tabBar scroll={false} center testID="rewards-screen">
        <ActivityIndicator color={colors.gold} />
      </Screen>
    );
  }

  const available = vouchers.data.filter((v) => v.status === "available");
  const used = vouchers.data.filter((v) => v.status === "used");
  const toNext = pointsToNextReward(account.data.points);

  const onSimulate = () => {
    if (!selected) return;
    markUsed.mutate(
      { id: selected.id, branchId: account.data!.homeBranchId },
      {
        onSuccess: () => {
          setSelected(null);
          toast("Voucher applied at the till");
        },
      },
    );
  };

  return (
    <Screen
      tabBar
      testID="rewards-screen"
      header={
        <View>
          <Txt variant="h1">Rewards</Txt>
          <Txt variant="body" style={styles.sub}>
            {available.length > 0
              ? `${available.length} voucher${available.length > 1 ? "s" : ""} ready to use`
              : "Your vouchers live here"}
          </Txt>
        </View>
      }
    >
      {available.length > 0 ? (
        <StaggerItem index={0}>
          <SectionHeader title="Available" />
          <View style={styles.list}>
            {available.map((v) => (
              <VoucherCard key={v.id} voucher={v} onPress={() => setSelected(v)} />
            ))}
          </View>
        </StaggerItem>
      ) : (
        <StaggerItem index={0}>
          <Card contentStyle={styles.empty}>
            <View style={styles.emptyIcon}>
              <Icon name="gift" size={24} color={colors.sage} />
            </View>
            <Txt variant="h3" style={styles.center}>
              No rewards waiting yet
            </Txt>
            <Txt variant="body" style={styles.center}>
              You are {toNext} {toNext === 1 ? "point" : "points"} from your next £10 reward. It
              lands here the moment you reach ten.
            </Txt>
          </Card>
        </StaggerItem>
      )}

      {used.length > 0 ? (
        <StaggerItem index={1} style={styles.usedBlock}>
          <SectionHeader title="Used" />
          <View style={styles.list}>
            {used.map((v) => (
              <VoucherCard key={v.id} voucher={v} />
            ))}
          </View>
        </StaggerItem>
      ) : null}

      <Sheet visible={!!selected} onClose={() => setSelected(null)} fullScreen testID="voucher-sheet">
        {selected ? (
          <View style={styles.sheet}>
            <View style={styles.sheetTop}>
              <PressScale
                onPress={() => setSelected(null)}
                style={styles.close}
                testID="voucher-close"
                accessibilityLabel="Close"
                hitSlop={12}
              >
                <Icon name="close" size={20} color={colors.cream} />
              </PressScale>
            </View>

            <View style={styles.sheetBody}>
              <Txt variant="label" tone="gold" style={styles.center}>
                Show this at the till
              </Txt>
              <View style={styles.qrWrap}>
                <QRCode code={selected.code} size={236} />
              </View>
              <Txt variant="h3" tabular tone="cream" style={styles.sheetCode}>
                {selected.code}
              </Txt>
              <View style={styles.figureRow}>
                <GradientText style={styles.figure}>£10</GradientText>
                <Txt variant="body" style={styles.figureNote}>
                  reward · expires {dayMonthYear(selected.expires)}
                </Txt>
              </View>
            </View>

            <View style={styles.sheetFoot}>
              <Txt variant="caption" style={styles.center}>
                The app never applies the discount itself. A colleague scans this, applies £10 in
                the practice system, and marks it used.
              </Txt>
              <GoldButton
                label="Simulate the till scan"
                icon="scan"
                loading={markUsed.isPending}
                onPress={onSimulate}
                testID="simulate-till-scan-button"
              />
              <Txt variant="caption" tone="dimSage" style={styles.center}>
                Prototype control — stands in for the colleague’s action.
              </Txt>
            </View>
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  sub: { marginTop: 4 },
  list: { gap: spacing.base },
  usedBlock: { marginTop: spacing.xxl },
  center: { textAlign: "center" },
  empty: { alignItems: "center", gap: spacing.md, padding: spacing.xl },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  sheet: { flex: 1, justifyContent: "space-between" },
  sheetTop: { flexDirection: "row", justifyContent: "flex-end" },
  close: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetBody: { alignItems: "center", gap: spacing.base },
  qrWrap: {
    padding: spacing.base,
    borderRadius: 24,
    backgroundColor: colors.cream,
    shadowColor: colors.shadow,
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  sheetCode: { letterSpacing: 4 },
  figureRow: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm },
  figure: { fontFamily: font.serifThin, fontSize: 52, letterSpacing: -2, lineHeight: 54 },
  figureNote: { marginBottom: spacing.sm },
  sheetFoot: { gap: spacing.base },
}));
