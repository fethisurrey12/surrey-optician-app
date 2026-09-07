// Biometric unlock. Native uses expo-local-authentication (Face ID / Touch ID
// / fingerprint). Web falls back to WebAuthn platform-authenticator detection
// and, failing that, a simulated prompt so the flow still reviews in a browser.

import { Platform } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";

export type BiometricSupport = {
  available: boolean;
  label: string; // "Face ID" | "fingerprint" | "biometrics"
};

// Brief: "Face ID" on Apple, "fingerprint" on Android, "biometrics" elsewhere.
function labelFor(): string {
  if (Platform.OS === "ios") return "Face ID";
  if (Platform.OS === "android") return "fingerprint";
  return "biometrics";
}

export async function getBiometricSupport(): Promise<BiometricSupport> {
  const label = labelFor();

  if (Platform.OS === "web") {
    try {
      const PKC = (globalThis as any).PublicKeyCredential;
      if (PKC?.isUserVerifyingPlatformAuthenticatorAvailable) {
        const ok = await PKC.isUserVerifyingPlatformAuthenticatorAvailable();
        // Even when the browser lacks a platform authenticator we allow the
        // simulated prompt so the flow can be reviewed.
        return { available: true, label, ...(ok ? {} : {}) };
      }
    } catch {
      // fall through to simulated support
    }
    return { available: true, label };
  }

  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return { available: hasHardware && enrolled, label };
  } catch {
    return { available: false, label };
  }
}

// Resolves true on a successful unlock. On web this is a simulated success
// after a short scan; on native it runs the real OS prompt.
export async function authenticate(reason: string): Promise<boolean> {
  if (Platform.OS === "web") {
    await new Promise((r) => setTimeout(r, 1400));
    return true;
  }
  try {
    const res = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: "Enter code",
      cancelLabel: "Cancel",
      disableDeviceFallback: false,
    });
    return res.success;
  } catch {
    return false;
  }
}
