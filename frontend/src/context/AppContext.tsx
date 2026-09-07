// Session, biometric enrolment, preferences and the toast queue. Held in React
// memory only (no localStorage), matching the prototype brief.

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

type Status = "signedOut" | "signedIn";

type Prefs = {
  notifyRewards: boolean;
  notifyReminders: boolean;
  notifyOffers: boolean;
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

  startSignIn: (mobile: string) => string;
  verify: (code: string) => boolean;
  resendCode: () => string;
  enrollBiometric: () => void;
  dismissBiometricPrompt: () => void;
  setBiometricEnrolled: (v: boolean) => void;
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
  const [prefs, setPrefs] = useState<Prefs>({
    notifyRewards: true,
    notifyReminders: true,
    notifyOffers: false,
  });
  const [toastState, setToastState] = useState<ToastState>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getBiometricSupport().then(setBiometricSupport);
  }, []);

  // Lock on background once biometric is enrolled.
  const enrolledRef = useRef(biometricEnrolled);
  enrolledRef.current = biometricEnrolled;
  const statusRef = useRef(status);
  statusRef.current = status;
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "background" && enrolledRef.current && statusRef.current === "signedIn") {
        setLocked(true);
      }
    });
    return () => sub.remove();
  }, []);

  const startSignIn = (mobile: string) => {
    const code = sixDigits();
    setPendingMobile(mobile);
    setDemoCode(code);
    return code;
  };

  const resendCode = () => {
    const code = sixDigits();
    setDemoCode(code);
    return code;
  };

  const verify = (code: string) => {
    if (code === demoCode && code.length === 6) {
      setStatus("signedIn");
      setLocked(false);
      const offerBiometric = !!biometricSupport?.available && !biometricEnrolled;
      setNeedsBiometricPrompt(offerBiometric);
      return true;
    }
    return false;
  };

  const dismissBiometricPrompt = () => setNeedsBiometricPrompt(false);

  const enrollBiometric = () => {
    setBiometricEnrolled(true);
    setNeedsBiometricPrompt(false);
  };
  const lock = () => setLocked(true);
  const unlock = () => setLocked(false);

  const signOut = () => {
    setStatus("signedOut");
    setLocked(false);
    setBiometricEnrolled(false);
    setPendingMobile("");
    setDemoCode("");
    setNeedsBiometricPrompt(false);
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
      ready: biometricSupport !== null,
      status,
      locked,
      biometricEnrolled,
      biometricSupport,
      pendingMobile,
      demoCode,
      needsBiometricPrompt,
      prefs,
      startSignIn,
      verify,
      resendCode,
      enrollBiometric,
      dismissBiometricPrompt,
      setBiometricEnrolled,
      lock,
      unlock,
      signOut,
      setPref,
      toast,
      toastState,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [status, locked, biometricEnrolled, biometricSupport, pendingMobile, demoCode, needsBiometricPrompt, prefs, toastState],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
