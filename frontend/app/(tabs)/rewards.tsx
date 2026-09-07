import { useState } from "react";
import { ActivityIndicator, Linking, Platform, ScrollView, View } from "react-native";

import { type Voucher, type WalletProvider } from "@/src/api/data";
import { useAccount, useAddToWallet, useMarkVoucherUsed, useVouchers } from "@/src/api/hooks";
import { appleWalletUrl, googleWalletUrl, walletStatus } from "@/src/api/wallet";
import { useApp } from "@/src/context/AppContext";
import { VoucherCard } from "@/src/components/VoucherCard";
import { WalletPassPreview } from "@/src/components/WalletPassPreview";
import { dayMonthYear, expiresInText, expiresSoon, pointsToNextReward } from "@/src/lib/points";
import { font, spacing } from "@/src/tokens";
import { makeStyles, useTheme } from "@/src/theme";
import { Card } from "@/src/ui/Card";
import { GhostButton } from "@/src/ui/GhostButton";
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
import { WalletBadge } from "@/src/ui/WalletBadge";

// Which wallet badges to offer: the device's own wallet on a phone, both on web.
const WALLET_PROVIDERS: WalletProvider[] =
  Platform.OS === "ios" ? ["apple"] : Platform.OS === "android" ? ["google"] : ["apple", "google"];

export default function Rewards() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { toast } = useApp();
  const account = useAccount();
  const vouchers = useVouchers();
  const markUsed = useMarkVoucherUsed();
  const addToWallet = useAddToWallet();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<"qr" | "pass">("qr");
  const [previewProvider, setPreviewProvider] = useState<WalletProvider>("apple");
  const [walletBusy, setWalletBusy] = useState<WalletProvider | null>(null);

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
  const selected: Voucher | null = vouchers.data.find((v) => v.id === selectedId) ?? null;

  const openVoucher = (v: Voucher) => {
    setMode("qr");
    setSelectedId(v.id);
  };
  const closeSheet = () => {
    setSelectedId(null);
    setMode("qr");
  };

  const onSimulate = () => {
    if (!selected) return;
    markUsed.mutate(
      { id: selected.id, branchId: account.data!.homeBranchId },
      {
        onSuccess: () => {
          closeSheet();
          toast("Voucher applied at the till");
        },
      },
    );
  };

  // Real pass when the server holds signing keys; otherwise show the preview so
  // the flow can still be reviewed end to end.
  const onWallet = async (provider: WalletProvider) => {
    if (!selected || walletBusy) return;
    setWalletBusy(provider);
    try {
      const status = await walletStatus();
      if (status[provider]) {
        const url =
          provider === "apple"
            ? appleWalletUrl(selected, account.data!)
            : await googleWalletUrl(selected, account.data!);
        await Linking.openURL(url);
        addToWallet.mutate({ id: selected.id, provider });
        toast(provider === "apple" ? "Opening Apple Wallet" : "Opening Google Wallet");
      } else {
        setPreviewProvider(provider);
        setMode("pass");
      }
    } catch {
      toast("Couldn’t reach the wallet service");
    } finally {
      setWalletBusy(null);
    }
  };

  const onSimulateWallet = () => {
    if (!selected) return;
    addToWallet.mutate(
      { id: selected.id, provider: previewProvider },
      {
        onSuccess: () => {
          setMode("qr");
          toast(`Added to ${previewProvider === "apple" ? "Apple" : "Google"} Wallet`);
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
              <VoucherCard key={v.id} voucher={v} onPress={() => openVoucher(v)} />
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

      <Sheet visible={!!selected} onClose={closeSheet} fullScreen testID="voucher-sheet">
        {selected && mode === "pass" ? (
          <View style={styles.sheet}>
            <View style={styles.sheetTopRow}>
              <PressScale
                onPress={() => setMode("qr")}
                style={styles.close}
                testID="wallet-preview-back"
                accessibilityLabel="Back to voucher"
                hitSlop={12}
              >
                <Icon name="back" size={20} color={colors.cream} />
              </PressScale>
              <PressScale
                onPress={closeSheet}
                style={styles.close}
                testID="voucher-close"
                accessibilityLabel="Close"
                hitSlop={12}
              >
                <Icon name="close" size={20} color={colors.cream} />
              </PressScale>
            </View>

            <ScrollView
              style={styles.previewScroll}
              contentContainerStyle={styles.previewBody}
              showsVerticalScrollIndicator={false}
            >
              <Txt variant="label" tone="gold" style={styles.center}>
                {previewProvider === "apple" ? "Apple Wallet pass" : "Google Wallet pass"}
              </Txt>
              <Txt variant="body" style={styles.center}>
                This is what lands on your lock screen — ready at the till without opening the app.
              </Txt>
              <WalletPassPreview provider={previewProvider} voucher={selected} account={account.data} />
            </ScrollView>

            <View style={styles.sheetFoot}>
              <Txt variant="caption" style={styles.center}>
                The practice’s wallet signing keys aren’t connected yet, so the pass can’t be issued
                for real from this preview.
              </Txt>
              <GoldButton
                label={`Simulate adding to ${previewProvider === "apple" ? "Apple" : "Google"} Wallet`}
                icon="wallet"
                loading={addToWallet.isPending}
                onPress={onSimulateWallet}
                testID="simulate-wallet-button"
              />
              <Txt variant="caption" tone="dimSage" style={styles.center}>
                Prototype control — stands in for the phone’s wallet.
              </Txt>
            </View>
          </View>
        ) : selected ? (
          <View style={styles.sheet}>
            <View style={styles.sheetTop}>
              <PressScale
                onPress={closeSheet}
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
                <QRCode code={selected.code} size={220} />
              </View>
              <Txt variant="h3" tabular tone="cream" style={styles.sheetCode}>
                {selected.code}
              </Txt>
              <View style={styles.figureRow}>
                <GradientText style={styles.figure}>£10</GradientText>
                <Txt
                  variant="body"
                  tone={expiresSoon(selected.expires) ? "lightGold" : undefined}
                  style={styles.figureNote}
                >
                  reward ·{" "}
                  {expiresSoon(selected.expires)
                    ? expiresInText(selected.expires)
                    : `expires ${dayMonthYear(selected.expires)}`}
                </Txt>
              </View>
              {expiresSoon(selected.expires) ? (
                <Txt variant="caption" tone="sage" style={styles.center} testID="voucher-sheet-expiry-note">
                  Use it before {dayMonthYear(selected.expires)} — after that it lapses.
                </Txt>
              ) : null}
            </View>

            <View style={styles.sheetFoot}>
              <View style={styles.walletRow}>
                {WALLET_PROVIDERS.map((p) => (
                  <WalletBadge
                    key={p}
                    provider={p}
                    added={selected.wallet === p}
                    loading={walletBusy === p}
                    onPress={() => onWallet(p)}
                    testID={`add-to-${p}-wallet`}
                  />
                ))}
                <Txt variant="caption" tone="dimSage" style={styles.center}>
                  Keep it on your lock screen so it’s ready at the till.
                </Txt>
              </View>
              <Txt variant="caption" style={styles.center}>
                The app never applies the discount itself. A colleague scans this, applies £10 in
                the practice system, and marks it used.
              </Txt>
              <GhostButton
                label="Simulate the till scan"
                icon="scan"
                onPress={onSimulate}
                disabled={markUsed.isPending}
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
  sheetTopRow: { flexDirection: "row", justifyContent: "space-between" },
  previewScroll: { flex: 1, marginVertical: spacing.base },
  previewBody: { gap: spacing.base, paddingBottom: spacing.base },
  walletRow: { gap: spacing.sm, marginBottom: spacing.xs },
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
  sheetFoot: { gap: spacing.md },
}));
