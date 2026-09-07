import { useEffect, useState } from "react";
import { View } from "react-native";

import { useApp } from "@/src/context/AppContext";
import { tapWarn } from "@/src/lib/haptics";
import { spacing } from "@/src/tokens";
import { makeStyles } from "@/src/theme";
import { CodeInput } from "@/src/ui/CodeInput";
import { HeaderBar } from "@/src/ui/HeaderBar";
import { PressScale } from "@/src/ui/PressScale";
import { Screen } from "@/src/ui/Screen";
import { StaggerItem } from "@/src/ui/Stagger";
import { Txt } from "@/src/ui/Txt";

function formatMobile(m: string): string {
  // +447123456789 -> +44 7123 456789
  if (m.startsWith("+44") && m.length === 13) {
    return `+44 ${m.slice(3, 7)} ${m.slice(7)}`;
  }
  return m;
}

export default function Verify() {
  const styles = useStyles();
  const { pendingMobile, demoCode, verify, resendCode } = useApp();
  const [error, setError] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [seconds, setSeconds] = useState(30);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const onComplete = (code: string) => {
    if (verify(code)) return; // guard redirects onward
    setError("That code did not match. Try again.");
    tapWarn();
    setResetKey((k) => k + 1);
  };

  const onResend = () => {
    resendCode();
    setSeconds(30);
    setError(null);
    setResetKey((k) => k + 1);
  };

  return (
    <Screen header={<HeaderBar title="Verify" />} keyboardAware bottomOffset={40} testID="verify-screen">
      <View style={styles.body}>
        <StaggerItem index={0}>
          <Txt variant="h1">Enter your code</Txt>
          <Txt variant="body" style={styles.lead}>
            We texted a six-digit code to {formatMobile(pendingMobile)}.
          </Txt>
        </StaggerItem>

        <StaggerItem index={1}>
          <CodeInput key={resetKey} onComplete={onComplete} onChange={() => error && setError(null)} />
          {error ? (
            <Txt variant="caption" tone="error" style={styles.error}>
              {error}
            </Txt>
          ) : null}
        </StaggerItem>

        <StaggerItem index={2}>
          <View style={styles.resend}>
            {seconds > 0 ? (
              <Txt variant="caption">Resend code in 0:{String(seconds).padStart(2, "0")}</Txt>
            ) : (
              <PressScale onPress={onResend} testID="verify-resend" hitSlop={12}>
                <Txt variant="bodyStrong" tone="gold">
                  Resend code
                </Txt>
              </PressScale>
            )}
          </View>
        </StaggerItem>

        <StaggerItem index={3}>
          <View style={styles.protoCard} testID="verify-demo-code">
            <Txt variant="label" tone="dimSage">
              Prototype — no SMS gateway
            </Txt>
            <Txt variant="h3" tabular tone="cream" style={styles.protoCode}>
              {demoCode}
            </Txt>
            <Txt variant="caption">Use this code to sign in.</Txt>
          </View>
        </StaggerItem>
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  body: { gap: spacing.xl, paddingTop: spacing.sm },
  lead: { marginTop: spacing.sm, maxWidth: 360 },
  error: { marginTop: spacing.sm },
  resend: { alignItems: "flex-start" },
  protoCard: {
    marginTop: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceTertiary,
    padding: spacing.base,
    gap: spacing.xs,
  },
  protoCode: { letterSpacing: 6 },
}));
