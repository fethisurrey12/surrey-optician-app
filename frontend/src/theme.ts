// Design tokens for Surrey Opticians — the practice's own turquoise and navy.
//
// The app ships one scheme only, so `light` holds it and the device setting is
// forced to it. Every colour in the app comes from here; nothing else in the
// codebase should hold a literal colour except the Apple and Google Wallet
// badges, which are fixed by those platforms' brand rules.
//
// Semantic keys (surface/onSurface/brand...) satisfy the shared infra; the
// named palette (paper, ink, teal, sage...) and the gradient tuples are what
// the screens actually reach for.
//
// Taken from the practice's own Surrey Opticians Lookbook (2019), not guessed
// from a screenshot: primary turquoise #009db1, dark grey #3b3c43 and dark
// blue #282460 are the brand's own values.
//
// The brand turquoise is only 3.2:1 on white, so it carries the identity —
// the ring, badges, icon fills — while `teal`, a deeper mix of it, is used
// wherever type or a small icon has to stay legible.
//
// Contrast against paper, to WCAG AA: ink 10.5:1, navy 12.9:1, sage 5.0:1,
// dimSage 4.6:1, teal 5.8:1, and paper on teal 5.8:1. Anything added here
// should be checked the same way — this is read one-handed in a shop.

import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

// Raw palette --------------------------------------------------------------
const paper = "#FFFFFF";      // the page, and type sitting on the brand
const mist = "#F0FAFB";       // quiet surface, a breath of turquoise
const haze = "#DBF2F5";       // deeper tint for gradients and wells
const card = "#FFFFFF";       // cards sit above the page on shadow, not tone
const cardTop = "#FBFEFF";
const ink = "#3B3C43";        // brand Dark Grey — the primary type colour
const navy = "#282460";       // brand Dark Blue
const sage = "#6B6D77";       // secondary type
const dimSage = "#71737D";    // tertiary type and labels
const teal = "#00707E";       // the brand turquoise, deepened so type reads
const lightTeal = "#009DB1";  // brand Turquoise — fills, the ring, highlights
const deepTeal = "#005560";   // gradient depth, pressed states

const light = {
  // Surfaces
  surface: paper,
  onSurface: ink,
  surfaceSecondary: card,
  onSurfaceSecondary: ink,
  surfaceTertiary: mist,
  onSurfaceTertiary: sage,
  surfaceInverse: navy,
  onSurfaceInverse: paper,
  muted: dimSage,

  // Brand (teal)
  brand: teal,
  onBrand: paper,
  brandPrimary: teal,
  onBrandPrimary: paper,
  brandSecondary: mist,
  onBrandSecondary: ink,
  brandTertiary: haze,
  onBrandTertiary: ink,

  // Status — darkened from the usual web values so they read on white.
  success: "#0F7A52",
  onSuccess: paper,
  warning: "#8A6100",
  onWarning: paper,
  error: "#B3261E",
  onError: paper,
  info: teal,
  onInfo: paper,

  // Lines
  border: "rgba(59,60,67,0.14)",
  borderStrong: "rgba(59,60,67,0.24)",
  divider: "rgba(59,60,67,0.09)",

  // Named optician palette
  paper,
  mist,
  haze,
  card,
  cardTop,
  ink,
  navy,
  sage,
  dimSage,
  teal,
  lightTeal,
  deepTeal,

  // Accent tints — the washes and hairlines that mark a card as branded.
  // Named so no screen has to spell out an rgba of the brand colour.
  accentBorder: "rgba(0,157,177,0.42)",
  accentBorderSoft: "rgba(0,157,177,0.24)",
  accentWash: "rgba(0,157,177,0.08)",
  errorBorder: "rgba(179,38,30,0.35)",

  // Effects
  hairline: "rgba(59,60,67,0.11)",
  shadow: "#0A2C31",
  overlay: "rgba(20,22,30,0.45)",
  glass: "rgba(255,255,255,0.86)",

  // Gradients (tuples so expo-linear-gradient is happy)
  tealFoil: [deepTeal, teal, "#00808F", deepTeal] as [string, string, string, string],
  tealFoilSoft: [
    "rgba(0,85,96,0.92)",
    "rgba(0,112,126,0.96)",
    "rgba(0,157,177,1)",
    "rgba(0,85,96,0.92)",
  ] as [string, string, string, string],
  cardGradient: [cardTop, card, mist] as [string, string, string],
  screenGradient: [paper, mist] as [string, string],
  // Sweeps across teal surfaces, so the highlight is white.
  sheen: ["rgba(255,255,255,0)", "rgba(255,255,255,0.42)", "rgba(255,255,255,0)"] as [string, string, string],
};

export type ThemeColors = typeof light;

export const defaultScheme = "light" satisfies ColorScheme;

export const themes: { light: ThemeColors; dark?: ThemeColors } = { light };

// React Native spells "follow the device" as "unspecified", not null.
export function setColorScheme(scheme: ColorScheme | "unspecified") {
  Appearance.setColorScheme?.(scheme);
}

// The app ships one palette, so it pins the scheme rather than following the
// device. Adding a `dark` entry to `themes` is all it takes to hand control back.
setColorScheme?.(themes.dark ? "unspecified" : defaultScheme);

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme =
    system !== "unspecified" && themes[system] ? system : defaultScheme;
  return { scheme, colors: themes[scheme] ?? themes.light };
}

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}
