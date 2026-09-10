import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { REFERRAL_BONUS_POINTS } from "@/src/api/data";
import { useApp } from "@/src/context/AppContext";
import { tapWarn } from "@/src/lib/haptics";
import { inviterName, normaliseReferralCode, validReferralCode } from "@/src/lib/referral";
import { radius, spacing } from "@/src/tokens";
import { makeStyles, useTheme } from "@/src/theme";
import { Card } from "@/src/ui/Card";
import { Field } from "@/src/ui/Field";
import { GhostButton } from "@/src/ui/GhostButton";
import { BrandButton } from "@/src/ui/BrandButton";
import { Icon } from "@/src/ui/Icon";
import { Screen } from "@/src/ui/Screen";
import { StaggerItem } from "@/src/ui/Stagger";
import { Txt } from "@/src/ui/Txt";
import { Wordmark } from "@/src/ui/Wordmark";

// Landing page for an invite link (/join?ref=SARAH-5589). Pre-fills the
// friend's code, then hands over to the normal mobile-number sign-in.
export default function Join() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const { ref } = useLocalSearchParams<{ ref?: string }>();
  const { setPendingReferral } = useApp();
  const [code, setCode] = useState(normaliseReferralCode(ref ?? ""));
  const [error, setError] = useState<string | null>(null);

  const friend = inviterName(code);
  const bonus = REFERRAL_BONUS_POINTS === 1 ? "a bonus point" : `${REFERRAL_BONUS_POINTS} bonus points`;

  const onContinue = () => {
    if (!validReferralCode(code)) {
      setError("Codes look like NAME-1234.");
      tapWarn();
      return;
    }
    setPendingReferral(code);
    router.push("/(auth)/phone");
  };

  const onSkip = () => {
    setPendingReferral(null);
    router.replace("/(auth)/welcome");
  };

  return (
    <Screen keyboardAware bottomOffset={90} testID="join-screen">
      <View style={styles.body}>
        <StaggerItem index={0} style={styles.brand}>
          <Wordmark size="sm" align="left" />
        </StaggerItem>

        <StaggerItem index={1}>
          <Card contentStyle={styles.hero} testID="join-hero">
            <View style={styles.heroIcon}>
              <Icon name="gift" size={22} color={colors.teal} />
            </View>
            <Txt variant="h1">{friend ? `${friend} has invited you` : "You’ve been invited"}</Txt>
            <Txt variant="body">
              Join the Surrey Opticians loyalty scheme. Earn a point for every £10 you spend
              privately, and ten points become a £10 voucher. Quote this code at your first visit
              and you’ll both earn {bonus}.
            </Txt>
          </Card>
        </StaggerItem>

        <StaggerItem index={2}>
          <Field
            label="Invite code"
            value={code}
            onChangeText={(t) => {
              setCode(normaliseReferralCode(t));
              if (error) setError(null);
            }}
            autoCapitalize="characters"
            placeholder="NAME-1234"
            testID="join-code-input"
            note={error ?? "Pre-filled from your link — you can change it if needed."}
          />
          {error ? (
            <Txt variant="caption" tone="error" style={styles.error}>
              {error}
            </Txt>
          ) : null}
        </StaggerItem>

        <StaggerItem index={3} style={styles.steps}>
          {[
            "Sign in with your mobile number — it’s how we find your points at the till.",
            "Visit any branch: Coulsdon, Wallington or Banstead.",
            `Your bonus point lands with your first private purchase${friend ? `, and so does ${friend}’s` : ""}.`,
          ].map((t, i) => (
            <View key={i} style={styles.step}>
              <View style={styles.stepNum}>
                <Txt variant="label" tone="paper">
                  {i + 1}
                </Txt>
              </View>
              <Txt variant="body" style={styles.stepText}>
                {t}
              </Txt>
            </View>
          ))}
        </StaggerItem>

        <StaggerItem index={4} style={styles.actions}>
          <BrandButton label="Continue with my mobile" onPress={onContinue} testID="join-continue-button" />
          <GhostButton label="I already have an account" onPress={onSkip} tone="sage" testID="join-skip-button" />
        </StaggerItem>
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  body: { gap: spacing.xl, paddingTop: spacing.sm },
  brand: { paddingTop: spacing.sm },
  hero: { gap: spacing.md, padding: spacing.lg },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  error: { marginTop: -spacing.xs },
  steps: { gap: spacing.md },
  step: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.teal,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  stepText: { flex: 1 },
  actions: { gap: spacing.md },
}));
