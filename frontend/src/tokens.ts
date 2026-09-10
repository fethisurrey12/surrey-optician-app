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

// Responsive content width: full width on phones (with page padding), a
// comfortable centred column on tablet and desktop.
export const BREAKPOINT = { tablet: 768, desktop: 1024, wide: 1440 } as const;

export function contentMaxWidth(width: number): number {
  if (width >= BREAKPOINT.wide) return 1080;
  if (width >= BREAKPOINT.desktop) return 960;
  if (width >= BREAKPOINT.tablet) return 720;
  return width;
}

export function pagePadding(width: number): number {
  if (width >= BREAKPOINT.tablet) return 32;
  if (width >= 375) return 20;
  return 16;
}

// Two-column layouts (Home hero beside its cards, voucher grid) from here up.
export const TWO_COLUMN_MIN = 900;

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
