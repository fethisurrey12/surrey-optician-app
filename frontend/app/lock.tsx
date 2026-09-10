import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { useApp } from "@/src/context/AppContext";
import { authenticate } from "@/src/lib/biometric";
import { tapSuccess, tapWarn } from "@/src/lib/haptics";
import { useReduceMotion } from "@/src/lib/motion";
import { spacing } from "@/src/tokens";
import { makeStyles, useTheme } from "@/src/theme";
import { CodeInput } from "@/src/ui/CodeInput";
import { GhostButton } from "@/src/ui/GhostButton";
import { BrandButton } from "@/src/ui/BrandButton";
import { Icon } from "@/src/ui/Icon";
import { PressScale } from "@/src/ui/PressScale";
import { Screen } from "@/src/ui/Screen";
import { Txt } from "@/src/ui/Txt";
import { Wordmark } from "@/src/ui/Wordmark";

type Mode = "scanning" | "failed" | "code";

export default function Lock() {
  const styles = useStyles();
  const { colors } = useTheme();
  const reduce = useReduceMotion();
  const { biometricSupport, demoCode, unlock } = useApp();
  const label = biometricSupport?.label ?? "biometrics";

  const [mode, setMode] = useState<Mode>("scanning");
  const [error, setError] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);

  const pulse = useSharedValue(1);
  useEffect(() => {
    if (reduce) return;
    pulse.set(withRepeat(withTiming(1.18, { duration: 1100, easing: Easing.inOut(Easing.ease) }), -1, true));
  }, [reduce, pulse]);
  const ringStyle = useAnimatedStyle(() => {
    const p = pulse.get();
    return { transform: [{ scale: p }], opacity: 2 - p };
  });

  const runAuth = useCallback(async () => {
    const ok = await authenticate(`Unlock Surrey Opticians with ${label}`);
    if (ok) {
      tapSuccess();
      unlock();
    } else {
      tapWarn();
      setMode("failed");
    }
  }, [label, unlock]);

  useEffect(() => {
    // Raise the biometric prompt as soon as the lock screen appears. `mode`
    // already starts as "scanning", and runAuth touches state only after
    // `await authenticate(...)` resolves — a callback from an external system,
    // not a synchronous update. The rule cannot see through the await.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void runAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retryAuth = useCallback(() => {
    setMode("scanning");
    void runAuth();
  }, [runAuth]);

  const onCode = (code: string) => {
    if (code === demoCode || (!demoCode && code.length === 6)) {
      tapSuccess();
      unlock();
      return;
    }
    setError("That code did not match.");
    tapWarn();
    setResetKey((k) => k + 1);
  };

  return (
    <Screen scroll={false} testID="lock-screen">
      <View style={styles.top}>
        <Wordmark size="sm" />
      </View>

      <View style={styles.body}>
        {mode === "code" ? (
          <View style={styles.codeWrap}>
            <Txt variant="h2" style={styles.center}>
              Enter your code
            </Txt>
            <CodeInput key={resetKey} onComplete={onCode} onChange={() => error && setError(null)} />
            {error ? (
              <Txt variant="caption" tone="error" style={styles.center}>
                {error}
              </Txt>
            ) : null}
            {demoCode ? (
              <Txt variant="caption" style={styles.center}>
                Prototype code: {demoCode}
              </Txt>
            ) : null}
            <PressScale onPress={retryAuth} hitSlop={12} testID="lock-use-biometric">
              <Txt variant="bodyStrong" tone="teal" style={styles.center}>
                Use {label} instead
              </Txt>
            </PressScale>
          </View>
        ) : (
          <View style={styles.center}>
            <View style={styles.ringWrap}>
              {mode === "scanning" && !reduce ? (
                <Animated.View style={[styles.pulseRing, ringStyle]} />
              ) : null}
              <View style={[styles.ring, mode === "failed" && styles.ringFailed]}>
                <Icon
                  name="faceid"
                  size={56}
                  color={mode === "failed" ? colors.error : colors.teal}
                  strokeWidth={1.4}
                />
              </View>
            </View>

            <Txt variant="h2" style={styles.title}>
              {mode === "scanning" ? "Welcome back" : "Could not verify"}
            </Txt>
            <Txt variant="body" style={styles.center}>
              {mode === "scanning"
                ? `Looking for your ${label}…`
                : `We could not confirm your ${label}.`}
            </Txt>
          </View>
        )}
      </View>

      {mode === "failed" ? (
        <View style={styles.actions}>
          <BrandButton label="Try again" icon="faceid" onPress={retryAuth} testID="lock-retry-button" />
          <GhostButton label="Enter code instead" onPress={() => setMode("code")} testID="lock-code-button" />
        </View>
      ) : null}
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  top: { alignItems: "center", paddingTop: spacing.lg },
  body: { flex: 1, justifyContent: "center" },
  center: { alignItems: "center", textAlign: "center", gap: spacing.md },
  ringWrap: { alignItems: "center", justifyContent: "center", marginBottom: spacing.xl },
  pulseRing: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
  ring: {
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  ringFailed: { borderColor: colors.errorBorder },
  title: { marginBottom: spacing.sm },
  codeWrap: { gap: spacing.lg },
  actions: { gap: spacing.md, paddingBottom: spacing.sm },
}));
