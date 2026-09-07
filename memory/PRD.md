# Surrey Opticians — Loyalty App (PRD)

## Original problem statement
Polished, production-quality mobile-first customer loyalty app for Surrey Opticians, an
independent UK optometry practice with three branches (Coulsdon, Wallington, Banstead).
Real commercial product, App-Store-review quality. No backend yet — mock the API layer
behind four async functions so it can point at a real server later without touching screens.

## Architecture / decisions
- **Expo React Native** app (renders on web preview via react-native-web; App-Store/Play
  shippable through the Emergent Publish flow). WebAuthn from the brief maps to real native
  biometrics (`expo-local-authentication`); CSS keyframes → Reanimated; inline-CSS gold foil
  → MaskedView on native + CSS `background-clip` on web; Capacitor → Expo/EAS.
- **State**: React-only, in-memory. Mock API in `src/api/mock.ts` (`loadAccount`,
  `loadVouchers`, `loadActivity`, `markVoucherUsed`) surfaced via React Query hooks
  (`src/api/hooks.ts`). No localStorage/AsyncStorage persistence (per brief).
- **Design tokens** in `src/theme.ts` (single dark palette + gold-foil gradient tuples) and
  `src/tokens.ts` (spacing/radius/type/motion). Fonts: Fraunces (Thin/Light/Regular/SemiBold)
  + Inter, loaded via expo-font. Tabular figures on all numbers.
- **Navigation**: expo-router. Route guard in `app/_layout.tsx` gates signedOut→auth,
  locked→lock, biometric prompt→/biometric, else→tabs. Custom blurred foil tab bar with gold
  indicator + Rewards foil badge.

## Scheme rules (implemented in src/lib/points.ts)
1 point per whole £10 of **private** spend (NHS-funded amounts earn nothing), rounded down.
10 points → auto £10 voucher, unique code, 18-month expiry. Redemption is manual (till);
the app never self-redeems — a "Simulate the till scan" control stands in for the colleague.

## Implemented (2026-06 / build 1.0.0)
- Welcome, Phone (+44, validation), Verify (6-box auto-advance/backspace, resend countdown,
  on-screen prototype code), Biometric opt-in.
- Lock screen (scanning / failed / text-code fallback; native biometrics, simulated on web).
- Home (animated points ring drawing over 1.4s, distance to reward, NHS note, reward-ready
  card with light sweep, two tiles, three recent transactions).
- Rewards wallet (available voucher cards with QR, full-screen voucher sheet, simulate till
  scan → toast + moves to Used, greyed used vouchers, empty state with points remaining).
- Activity (month-grouped history, All/Points earned/Rewards filters, NHS labels).
- Account (membership card, links, "loyalty data only — no clinical data" statement).
- Your details (editable name/email/home branch; read-only mobile with till note).
- Branches and contact (3 branches: address, hours, tap-to-call, directions, email practice).
- Settings (biometric toggle, Lock now, notification toggles, scheme terms + privacy sheets,
  version, sign out).
- Motion: staggered entrances, ring draw, single reward-card sweep; all gated by
  prefers-reduced-motion. QR is a deterministic hash placeholder (comment to swap a real
  encoder at build time).

## Personas
- **Member (Sarah Whitfield)**: collects points in shop, checks balance/vouchers one-handed,
  shows a QR at the till.
- **Colleague (till)**: scans the code, applies £10 in the practice system, marks it used.

## Backlog (not built)
- P1: real backend wiring (swap mock.ts bodies for fetch), real SMS gateway, real QR encoder.
- P2: Apple/Google Wallet pass, points expiry reminders, referral/share.
