import { useState } from "react";
import { ScrollView, Switch, View } from "react-native";

import { useApp } from "@/src/context/AppContext";
import { spacing } from "@/src/tokens";
import { makeStyles, useTheme } from "@/src/theme";
import { Card } from "@/src/ui/Card";
import { Divider } from "@/src/ui/Divider";
import { HeaderBar } from "@/src/ui/HeaderBar";
import { Icon, type IconName } from "@/src/ui/Icon";
import { PressScale } from "@/src/ui/PressScale";
import { Row } from "@/src/ui/Row";
import { Screen } from "@/src/ui/Screen";
import { Sheet } from "@/src/ui/Sheet";
import { StaggerItem } from "@/src/ui/Stagger";
import { Txt } from "@/src/ui/Txt";

function ToggleRow({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
  disabled,
  testID,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
  testID?: string;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={[styles.toggleRow, disabled && styles.disabled]}>
      <View style={styles.iconWrap}>
        <Icon name={icon} size={19} color={colors.sage} />
      </View>
      <View style={styles.toggleText}>
        <Txt variant="bodyStrong" tone="ink">
          {title}
        </Txt>
        {subtitle ? <Txt variant="caption">{subtitle}</Txt> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.mist, true: colors.teal }}
        thumbColor={colors.paper}
        ios_backgroundColor={colors.mist}
        testID={testID}
      />
    </View>
  );
}

export default function Settings() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { biometricEnrolled, setBiometricEnrolled, biometricSupport, prefs, setPref, signOut, lock } = useApp();
  const label = biometricSupport?.label ?? "biometrics";
  const [sheet, setSheet] = useState<null | "terms" | "privacy">(null);

  return (
    <Screen header={<HeaderBar title="Settings" />} testID="settings-screen">
      <View style={styles.body}>
        <StaggerItem index={0} style={styles.group}>
          <Txt variant="label" tone="sage" style={styles.groupLabel}>
            Unlock
          </Txt>
          <Card contentStyle={styles.card}>
            <ToggleRow
              icon="faceid"
              title={`Unlock with ${label}`}
              subtitle="Your biometric never leaves this device."
              value={biometricEnrolled}
              onValueChange={setBiometricEnrolled}
              testID="settings-biometric-toggle"
            />
            {biometricEnrolled ? (
              <>
                <Divider inset={54} />
                <Row icon="lock" title="Lock now" subtitle="Test the unlock screen" onPress={lock} testID="settings-lock-now" />
              </>
            ) : null}
          </Card>
        </StaggerItem>

        <StaggerItem index={1} style={styles.group}>
          <Txt variant="label" tone="sage" style={styles.groupLabel}>
            Reminders on Home
          </Txt>
          <Card contentStyle={styles.card}>
            <ToggleRow
              icon="eye"
              title="Eye test due"
              subtitle="A card when two years have nearly passed since your last examination."
              value={prefs.remindEyeTest}
              onValueChange={(v) => setPref("remindEyeTest", v)}
              testID="settings-remind-eye-test"
            />
            <Divider inset={54} />
            <ToggleRow
              icon="lens"
              title="Contact lens reorder"
              subtitle="A prompt when your last supply is about to run out."
              value={prefs.remindLenses}
              onValueChange={(v) => setPref("remindLenses", v)}
              testID="settings-remind-lenses"
            />
          </Card>
          <Txt variant="caption" tone="dimSage" style={styles.groupNote}>
            Both are worked out from your purchase history in this app. We hold no clinical records.
          </Txt>
        </StaggerItem>

        <StaggerItem index={2} style={styles.group}>
          <Txt variant="label" tone="sage" style={styles.groupLabel}>
            Notifications
          </Txt>
          <Card contentStyle={styles.card}>
            <ToggleRow
              icon="gift"
              title="Reward ready"
              subtitle="When a £10 voucher lands in your wallet."
              value={prefs.notifyRewards}
              onValueChange={(v) => setPref("notifyRewards", v)}
              testID="settings-notify-rewards"
            />
            <Divider inset={54} />
            <ToggleRow
              icon="clock"
              title="Eye test reminders"
              subtitle="A nudge when your next test is due."
              value={prefs.notifyReminders}
              onValueChange={(v) => setPref("notifyReminders", v)}
              testID="settings-notify-reminders"
            />
            <Divider inset={54} />
            <ToggleRow
              icon="mail"
              title="Offers"
              subtitle="Occasional news from the practice."
              value={prefs.notifyOffers}
              onValueChange={(v) => setPref("notifyOffers", v)}
              testID="settings-notify-offers"
            />
          </Card>
        </StaggerItem>

        <StaggerItem index={3} style={styles.group}>
          <Txt variant="label" tone="sage" style={styles.groupLabel}>
            About
          </Txt>
          <Card contentStyle={styles.cardLinks}>
            <Row icon="info" title="Scheme terms" onPress={() => setSheet("terms")} testID="settings-terms" />
            <Divider inset={54} />
            <Row icon="shield" title="Privacy notice" onPress={() => setSheet("privacy")} testID="settings-privacy" />
            <Divider inset={54} />
            <Row icon="card" title="Version" value="1.0.0" chevron={false} />
          </Card>
        </StaggerItem>

        <StaggerItem index={4}>
          <PressScale onPress={signOut} style={styles.signOut} testID="settings-signout">
            <Icon name="logout" size={19} color={colors.error} />
            <Txt variant="bodyStrong" tone="error">
              Sign out
            </Txt>
          </PressScale>
        </StaggerItem>
      </View>

      <Sheet visible={sheet !== null} onClose={() => setSheet(null)} testID="settings-sheet">
        <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
          <Txt variant="h2" style={styles.sheetTitle}>
            {sheet === "terms" ? "Scheme terms" : "Privacy notice"}
          </Txt>
          {(sheet === "terms" ? TERMS : PRIVACY).map((p, i) => (
            <Txt key={i} variant="body" style={styles.para}>
              {p}
            </Txt>
          ))}
        </ScrollView>
      </Sheet>
    </Screen>
  );
}

const TERMS = [
  "You earn one point for every whole £10 of eligible private spend at any Surrey Opticians branch. Amounts are rounded down.",
  "NHS-funded amounts earn nothing. Points are worked out on the private balance you actually pay.",
  "Ten points convert automatically into a £10 reward voucher, which appears in your wallet with a unique code and is valid for one year.",
  "Vouchers are applied by a colleague at the till. Show the code and they apply £10 in the practice system. The app never applies the discount itself.",
  "Points and vouchers work the same across Coulsdon, Wallington and Banstead. They have no cash value and cannot be transferred.",
];

const PRIVACY = [
  "This app holds loyalty data only: your name, mobile number, email, points balance and notification preferences.",
  "It cannot see your prescription, appointments or any clinical records. Those stay in the practice systems.",
  "Your mobile number is the key used to find your points at the till, so it can only be changed in branch with ID.",
  "If you enable biometric unlock, the biometric stays on your device and is never shared with the practice.",
];

const useStyles = makeStyles((colors) => ({
  body: { gap: spacing.xl, paddingTop: spacing.sm },
  group: { gap: spacing.sm },
  groupLabel: { marginLeft: spacing.xs },
  groupNote: { marginLeft: spacing.xs, marginTop: spacing.sm },
  card: { padding: spacing.base },
  cardLinks: { paddingVertical: 0, paddingHorizontal: spacing.base },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.md },
  disabled: { opacity: 0.5 },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleText: { flex: 1, gap: 2 },
  signOut: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    backgroundColor: colors.surfaceTertiary,
  },
  sheetScroll: { maxHeight: 460 },
  sheetTitle: { marginBottom: spacing.base },
  para: { marginBottom: spacing.md },
}));
