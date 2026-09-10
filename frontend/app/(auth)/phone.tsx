import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { useApp } from "@/src/context/AppContext";
import { tapWarn } from "@/src/lib/haptics";
import { inviterName } from "@/src/lib/referral";
import { radius, spacing } from "@/src/tokens";
import { makeStyles, useTheme } from "@/src/theme";
import { Field } from "@/src/ui/Field";
import { BrandButton } from "@/src/ui/BrandButton";
import { HeaderBar } from "@/src/ui/HeaderBar";
import { Icon } from "@/src/ui/Icon";
import { Screen } from "@/src/ui/Screen";
import { StaggerItem } from "@/src/ui/Stagger";
import { Txt } from "@/src/ui/Txt";

export default function Phone() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const { startSignIn, pendingReferral, authBusy } = useApp();
  const inviter = pendingReferral ? inviterName(pendingReferral) : "";
  const [digits, setDigits] = useState("");
  const [error, setError] = useState<string | null>(null);

  const valid = /^7\d{9}$/.test(digits);

  const onContinue = async () => {
    if (!valid) {
      setError("Enter a UK mobile number, starting 7.");
      tapWarn();
      return;
    }
    setError(null);
    try {
      await startSignIn(`+44${digits}`);
      router.push("/(auth)/verify");
    } catch (e) {
      // Rate limited, offline, or the gateway refused — stay put and say why,
      // rather than sending the member to a code screen with no code coming.
      setError(e instanceof Error ? e.message : "We could not send your code. Please try again.");
      tapWarn();
    }
  };

  return (
    <Screen
      header={<HeaderBar title="Sign in" />}
      keyboardAware
      bottomOffset={90}
      testID="phone-screen"
    >
      <View style={styles.body}>
        <StaggerItem index={0}>
          <Txt variant="h1">Your mobile number</Txt>
          <Txt variant="body" style={styles.lead}>
            This is how the practice finds your points at the till, so use the number you gave in
            branch.
          </Txt>
          {pendingReferral ? (
            <View style={styles.inviteChip} testID="phone-invite-chip">
              <Icon name="users" size={15} color={colors.teal} />
              <Txt variant="caption" tone="teal">
                {inviter ? `Invited by ${inviter} · ` : "Invite code "}
                {pendingReferral}
              </Txt>
            </View>
          ) : null}
        </StaggerItem>

        <StaggerItem index={1}>
          <Field
            label="Mobile number"
            prefix="+44"
            value={digits}
            onChangeText={(t) => {
              setDigits(t.replace(/\D/g, "").slice(0, 10));
              if (error) setError(null);
            }}
            placeholder="7123 456789"
            keyboardType="number-pad"
            maxLength={10}
            testID="phone-input"
            note={error ?? "We text you a six-digit code to confirm it is you."}
            returnKeyType="done"
            onSubmitEditing={onContinue}
            autoFocus
          />
          {error ? (
            <Txt variant="caption" tone="error" style={styles.error}>
              {error}
            </Txt>
          ) : null}
        </StaggerItem>

        <StaggerItem index={2} style={styles.actions}>
          <BrandButton
            label={authBusy ? "Sending…" : "Continue"}
            onPress={onContinue}
            disabled={!valid || authBusy}
            testID="phone-continue-button"
          />
        </StaggerItem>
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  body: { gap: spacing.xl, paddingTop: spacing.sm },
  lead: { marginTop: spacing.sm, maxWidth: 360 },
  inviteChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    alignSelf: "flex-start",
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceTertiary,
  },
  error: { marginTop: -spacing.xs },
  actions: { marginTop: spacing.sm },
}));
