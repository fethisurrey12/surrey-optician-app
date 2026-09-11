import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { LogBox, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider } from "@tanstack/react-query";

import { ErrorBoundary } from "@/src/components/error-boundary";
import { AppProvider, useApp } from "@/src/context/AppContext";
import { queryClient } from "@/src/query-client";
import { themes } from "@/src/theme";
import { GrainOverlay } from "@/src/ui/GrainOverlay";
import { Toast } from "@/src/ui/Toast";

LogBox.ignoreAllLogs(true);
SplashScreen.preventAutoHideAsync().catch(() => {});

// Redirects the user to the right flow: signed out -> auth, locked -> lock,
// otherwise -> tabs. One place, driven by session state.
function useRouteGuard() {
  const { ready, status, locked, needsBiometricPrompt, needsName } = useApp();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    const root = segments[0];
    // The desk is the practice's own screen, not a patient's. It carries the
    // practice key instead of a session, so none of these redirects apply.
    if (root === "staff") return;
    const inAuth = root === "(auth)";
    const onLock = root === "lock";
    const onBiometric = root === "biometric";
    const onName = root === "name";

    if (status === "signedOut") {
      if (!inAuth) router.replace("/(auth)/welcome");
    } else if (locked) {
      if (!onLock) router.replace("/lock");
    } else if (needsName) {
      if (!onName) router.replace("/name");
    } else if (needsBiometricPrompt) {
      if (!onBiometric) router.replace("/biometric");
    } else if (inAuth || onLock || onBiometric || onName || root === undefined) {
      router.replace("/(tabs)");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, status, locked, needsName, needsBiometricPrompt, segments]);
}

function Navigator() {
  useRouteGuard();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        contentStyle: { backgroundColor: themes.light.paper },
      }}
    />
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    "Fraunces-Thin": require("../assets/fonts/Fraunces-Thin.ttf"),
    "Fraunces-Light": require("../assets/fonts/Fraunces-Light.ttf"),
    "Fraunces-Regular": require("../assets/fonts/Fraunces-Regular.ttf"),
    "Fraunces-SemiBold": require("../assets/fonts/Fraunces-SemiBold.ttf"),
    "Inter-Light": require("../assets/fonts/Inter-Light.ttf"),
    "Inter-Regular": require("../assets/fonts/Inter-Regular.ttf"),
    "Inter-Medium": require("../assets/fonts/Inter-Medium.ttf"),
    "Inter-SemiBold": require("../assets/fonts/Inter-SemiBold.ttf"),
    "Inter-Bold": require("../assets/fonts/Inter-Bold.ttf"),
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: themes.light.paper }}>
      <KeyboardProvider>
        <SafeAreaProvider>
          <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
              <AppProvider>
                <View style={{ flex: 1, backgroundColor: themes.light.paper }}>
                  <Navigator />
                  <GrainOverlay />
                  <Toast />
                </View>
                <StatusBar style="dark" />
              </AppProvider>
            </QueryClientProvider>
          </ErrorBoundary>
        </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
