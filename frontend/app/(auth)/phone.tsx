import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { useApp } from "@/src/context/AppContext";
import { tapWarn } from "@/src/lib/haptics";
import { spacing } from "@/src/tokens";
import { makeStyles } from "@/src/theme";
import { Field } from "@/src/ui/Field";
import { GoldButton } from "@/src/ui/GoldButton";
import { HeaderBar } from "@/src/ui/HeaderBar";
import { Screen } from "@/src/ui/Screen";
import { StaggerItem } from "@/src/ui/Stagger";
import { Txt } from "@/src/ui/Txt";

export default function Phone() {
  const styles = useStyles();
  const router = useRouter();
  const { startSignIn } = useApp();
  const [digits, setDigits] = useState("");
  const [error, setError] = useState<string | null>(null);

  const valid = /^7\d{9}$/.test(digits);

  const onContinue = () => {
    if (!valid) {
      setError("Enter a UK mobile number, starting 7.");
      tapWarn();
      return;
    }
    setError(null);
    startSignIn(`+44${digits}`);
    router.push("/(auth)/verify");
  };

  return (
    <Screen header={<HeaderBar title="Sign in" />} keyboardAware bottomOffset={90} testID="phone-screen">
      <View style={styles.body}>
        <StaggerItem index={0}>
          <Txt variant="h1">Your mobile number</Txt>
          <Txt variant="body" style={styles.lead}>
            This is how the practice finds your points at the till, so use the number you gave in
            branch.
          </Txt>
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
          <GoldButton label="Continue" onPress={onContinue} disabled={!valid} testID="phone-continue-button" />
        </StaggerItem>
      </View>
    </Screen>
  );
}

const useStyles = makeStyles(() => ({
  body: { gap: spacing.xl, paddingTop: spacing.sm },
  lead: { marginTop: spacing.sm, maxWidth: 360 },
  error: { marginTop: -spacing.xs },
  actions: { marginTop: spacing.sm },
}));
