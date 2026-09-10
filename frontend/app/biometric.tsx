import { View } from "react-native";

import { useApp } from "@/src/context/AppContext";
import { tapSuccess } from "@/src/lib/haptics";
import { spacing } from "@/src/tokens";
import { makeStyles, useTheme } from "@/src/theme";
import { GhostButton } from "@/src/ui/GhostButton";
import { BrandButton } from "@/src/ui/BrandButton";
import { Icon } from "@/src/ui/Icon";
import { Screen } from "@/src/ui/Screen";
import { StaggerItem } from "@/src/ui/Stagger";
import { Txt } from "@/src/ui/Txt";

export default function Biometric() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { biometricSupport, enrollBiometric, dismissBiometricPrompt } = useApp();
  const label = biometricSupport?.label ?? "biometrics";

  const enable = () => {
    tapSuccess();
    enrollBiometric();
  };

  return (
    <Screen scroll={false} testID="biometric-screen">
      <View style={styles.body}>
        <StaggerItem index={0} style={styles.hero}>
          <View style={styles.ring}>
            <Icon name="faceid" size={54} color={colors.teal} strokeWidth={1.4} />
          </View>
        </StaggerItem>

        <View style={styles.copy}>
          <StaggerItem index={1}>
            <Txt variant="h1">Faster next time</Txt>
          </StaggerItem>
          <StaggerItem index={2}>
            <Txt variant="body" style={styles.lead}>
              Unlock with {label} when you come back, instead of waiting for another code.
            </Txt>
          </StaggerItem>
          <StaggerItem index={3}>
            <View style={styles.privacy}>
              <Icon name="shield" size={18} color={colors.sage} />
              <Txt variant="caption" tone="sage" style={styles.privacyText}>
                Your {label} never leaves this device.
              </Txt>
            </View>
          </StaggerItem>
        </View>
      </View>

      <StaggerItem index={4} style={styles.actions}>
        <BrandButton label={`Turn on ${label}`} onPress={enable} testID="biometric-enable-button" />
        <GhostButton label="Not now" onPress={dismissBiometricPrompt} testID="biometric-skip-button" />
      </StaggerItem>
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  body: { flex: 1, justifyContent: "center", gap: spacing.huge },
  hero: { alignItems: "center" },
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
  copy: { gap: spacing.md },
  lead: { maxWidth: 340 },
  privacy: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.xs },
  privacyText: { flexShrink: 1 },
  actions: { gap: spacing.md, paddingBottom: spacing.sm },
}));
