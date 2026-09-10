// Session, biometric enrolment, preferences and the toast queue.
//
// Sign-in talks to the loyalty API: a code is sent by SMS, verified server
// side, and the returned bearer token is kept in secure storage so a member
// stays signed in across restarts. With no backend configured (no
// EXPO_PUBLIC_BACKEND_URL) the original prototype behaviour stands in — a
// locally generated code shown on screen — so every screen can still be
// demonstrated offline.

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";

import { getBiometricSupport, type BiometricSupport } from "@/src/lib/biometric";
import { ApiError, hasBackend } from "@/src/api";
import { loadToken, setToken } from "@/src/api/client";
import { requestOtp, verifyOtp } from "@/src/api/server";

type Status = "signedOut" | "signedIn";

type Prefs = {
  notifyRewards: boolean;
  notifyReminders: boolean;
  notifyOffers: boolean;
  remindEyeTest: boolean; // Home nudge when an eye test is due
  remindLenses: boolean; // Home nudge when a lens supply is running out
};

type ToastState = { id: number; message: string } | null;

type AppValue = {
  ready: boolean;
  status: Status;
  locked: boolean;
  biometricEnrolled: boolean;
  biometricSupport: BiometricSupport | null;
  pendingMobile: string;
  demoCode: string;
  needsBiometricPrompt: boolean;
  prefs: Prefs;
  pendingReferral: string | null; // invite code carried from /join into sign-in
  authBusy: boolean; // a sign-in request is in flight
  eyeTestDismissed: boolean; // "Not now" on the recall nudge, for this session
  lensReorderDismissed: boolean;

  startSignIn: (mobile: string) => Promise<string>;
  verify: (code: string) => Promise<boolean>;
  resendCode: () => Promise<string>;
  enrollBiometric: () => void;
  dismissBiometricPrompt: () => void;
  setBiometricEnrolled: (v: boolean) => void;
  setPendingReferral: (code: string | null) => void;
  dismissEyeTestNudge: () => void;
  dismissLensReorderNudge: () => void;
  lock: () => void;
  unlock: () => void;
  signOut: () => void;
  setPref: (key: keyof Prefs, value: boolean) => void;
  toast: (message: string) => void;

  toastState: ToastState;
};

const AppContext = createContext<AppValue | null>(null);

function sixDigits(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("signedOut");
  const [locked, setLocked] = useState(false);
  const [biometricEnrolled, setBiometricEnrolled] = useState(false);
  const [biometricSupport, setBiometricSupport] = useState<BiometricSupport | null>(null);
  const [pendingMobile, setPendingMobile] = useState("");
  const [demoCode, setDemoCode] = useState("");
  const [needsBiometricPrompt, setNeedsBiometricPrompt] = useState(false);
  const [pendingReferral, setPendingReferral] = useState<string | null>(null);
  const [eyeTestDismissed, setEyeTestDismissed] = useState(false);
  const [lensReorderDismissed, setLensReorderDismissed] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>({
    notifyRewards: true,
    notifyReminders: true,
    notifyOffers: false,
    remindEyeTest: true,
    remindLenses: true,
  });
  const [toastState, setToastState] = useState<ToastState>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getBiometricSupport().then(setBiometricSupport);
  }, []);

  // Restore a previous session before the router decides where to send us,
  // so a signed-in member does not flash the welcome screen on launch.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (hasBackend) {
        const existing = await loadToken();
        if (!cancelled && existing) setStatus("signedIn");
      }
      if (!cancelled) setSessionChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Lock on background once biometric is enrolled. The listener is registered
  // once, so it reads the latest values through refs rather than closing over
  // the render that installed it. The refs are updated in an effect: assigning
  // them during render is a side effect React does not permit.
  const enrolledRef = useRef(biometricEnrolled);
  const statusRef = useRef(status);
  useEffect(() => {
    enrolledRef.current = biometricEnrolled;
    statusRef.current = status;
  }, [biometricEnrolled, status]);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "background" && enrolledRef.current && statusRef.current === "signedIn") {
        setLocked(true);
      }
    });
    return () => sub.remove();
  }, []);

  // Asks the server to text a code. Returns the code itself only while the
  // server is running in prototype mode; production returns an empty string and
  // the verify screen shows no on-screen code.
  const sendCode = async (mobile: string): Promise<string> => {
    if (!hasBackend) {
      const code = sixDigits();
      setDemoCode(code);
      return code;
    }
    setAuthBusy(true);
    try {
      const sent = await requestOtp(mobile);
      const code = sent.devCode ?? "";
      setDemoCode(code);
      return code;
    } finally {
      setAuthBusy(false);
    }
  };

  const startSignIn = async (mobile: string) => {
    setPendingMobile(mobile);
    return sendCode(mobile);
  };

  const resendCode = async () => sendCode(pendingMobile);

  const finishSignIn = () => {
    setStatus("signedIn");
    setLocked(false);
    setNeedsBiometricPrompt(!!biometricSupport?.available && !biometricEnrolled);
  };

  const verify = async (code: string): Promise<boolean> => {
    if (!hasBackend) {
      if (code !== demoCode || code.length !== 6) return false;
      finishSignIn();
      if (pendingReferral) {
        toast(`Invite code ${pendingReferral} applied — bonus point after your first purchase`);
        setPendingReferral(null);
      }
      return true;
    }

    setAuthBusy(true);
    try {
      const session = await verifyOtp(pendingMobile, code, pendingReferral);
      await setToken(session.token);
      finishSignIn();
      if (session.referralApplied && pendingReferral) {
        toast(`Invite code ${pendingReferral} applied — bonus point after your first purchase`);
      }
      setPendingReferral(null);
      return true;
    } catch (e) {
      // A wrong code is an ordinary outcome and the screen shows its own
      // message; anything else (rate limited, expired, offline) is worth saying.
      if (e instanceof ApiError && e.status !== 401) toast(e.message);
      return false;
    } finally {
      setAuthBusy(false);
    }
  };

  const dismissBiometricPrompt = () => setNeedsBiometricPrompt(false);

  const enrollBiometric = () => {
    setBiometricEnrolled(true);
    setNeedsBiometricPrompt(false);
  };
  const lock = () => setLocked(true);
  const unlock = () => setLocked(false);

  const signOut = () => {
    void setToken(null);
    setStatus("signedOut");
    setLocked(false);
    setBiometricEnrolled(false);
    setPendingMobile("");
    setDemoCode("");
    setNeedsBiometricPrompt(false);
    setPendingReferral(null);
    setEyeTestDismissed(false);
    setLensReorderDismissed(false);
  };

  const setPref = (key: keyof Prefs, value: boolean) =>
    setPrefs((p) => ({ ...p, [key]: value }));

  const toast = (message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastState({ id: Date.now(), message });
    toastTimer.current = setTimeout(() => setToastState(null), 2600);
  };

  const value = useMemo<AppValue>(
    () => ({
      ready: biometricSupport !== null && sessionChecked,
      status,
      locked,
      biometricEnrolled,
      biometricSupport,
      pendingMobile,
      demoCode,
      needsBiometricPrompt,
      prefs,
      pendingReferral,
      authBusy,
      eyeTestDismissed,
      lensReorderDismissed,
      startSignIn,
      verify,
      resendCode,
      enrollBiometric,
      dismissBiometricPrompt,
      setBiometricEnrolled,
      setPendingReferral,
      dismissEyeTestNudge: () => setEyeTestDismissed(true),
      dismissLensReorderNudge: () => setLensReorderDismissed(true),
      lock,
      unlock,
      signOut,
      setPref,
      toast,
      toastState,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [status, locked, biometricEnrolled, biometricSupport, pendingMobile, demoCode, needsBiometricPrompt, prefs, toastState, pendingReferral, authBusy, sessionChecked, eyeTestDismissed, lensReorderDismissed],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
