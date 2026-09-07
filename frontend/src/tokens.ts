// Non-colour design tokens: spacing, radius, type and motion timing.
// Colours live in src/theme.ts.

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  huge: 40,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  pill: 999,
} as const;

// Font families registered in app/_layout.tsx via expo-font.
export const font = {
  serifThin: "Fraunces-Thin", // ~200, huge numerals
  serifLight: "Fraunces-Light", // ~300, headings + wordmark
  serif: "Fraunces-Regular",
  serifSemi: "Fraunces-SemiBold",
  light: "Inter-Light",
  regular: "Inter-Regular",
  medium: "Inter-Medium",
  semibold: "Inter-SemiBold",
  bold: "Inter-Bold",
} as const;

// Tabular figures so balances never jitter.
export const tnum = { fontVariant: ["tabular-nums" as const] };

export const MAX_WIDTH = 480;

// Visual height of the custom blurred tab bar (excludes the safe-area inset,
// which the bar adds on top).
export const TAB_BAR_HEIGHT = 60;

export const DURATION = {
  ring: 1400,
  stagger: 70,
  screen: 420,
  sweep: 2600,
  sweepGap: 3400,
} as const;
