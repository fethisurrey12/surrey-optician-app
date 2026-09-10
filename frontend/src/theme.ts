// Design tokens for Surrey Opticians — teal and white, with black type.
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
// Contrast against paper, to WCAG AA: ink 16.9:1, sage 5.6:1, dimSage 4.5:1,
// teal 5.3:1. Paper on teal is 5.3:1. Anything added here should be checked
// the same way — this is a health product read one-handed in a shop.

import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

// Raw palette --------------------------------------------------------------
const paper = "#FFFFFF";      // the page, and type sitting on teal
const mist = "#F2F7F7";       // quiet surface, a breath of teal
const haze = "#E4EFF0";       // deeper tint for gradients and wells
const card = "#FFFFFF";       // cards sit above the page on shadow, not tone
const cardTop = "#FBFEFE";
const ink = "#0E1618";        // primary type — the black in "black writing"
const sage = "#54686B";       // secondary type
const dimSage = "#66797D";    // tertiary type and labels
const teal = "#0B6E75";       // the brand
const lightTeal = "#3FA9B0";  // highlights within teal gradients
const deepTeal = "#064E54";   // gradient depth, pressed states

const light = {
  // Surfaces
  surface: paper,
  onSurface: ink,
  surfaceSecondary: card,
  onSurfaceSecondary: ink,
  surfaceTertiary: mist,
  onSurfaceTertiary: sage,
  surfaceInverse: ink,
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
  border: "rgba(14,22,24,0.12)",
  borderStrong: "rgba(14,22,24,0.22)",
  divider: "rgba(14,22,24,0.08)",

  // Named optician palette
  paper,
  mist,
  haze,
  card,
  cardTop,
  ink,
  sage,
  dimSage,
  teal,
  lightTeal,
  deepTeal,

  // Accent tints — the washes and hairlines that mark a card as branded.
  // Named so no screen has to spell out an rgba of the brand colour.
  accentBorder: "rgba(11,110,117,0.34)",
  accentBorderSoft: "rgba(11,110,117,0.18)",
  accentWash: "rgba(11,110,117,0.06)",
  errorBorder: "rgba(179,38,30,0.35)",

  // Effects
  hairline: "rgba(14,22,24,0.10)",
  shadow: "#0B1F21",
  overlay: "rgba(10,20,21,0.45)",
  glass: "rgba(255,255,255,0.86)",

  // Gradients (tuples so expo-linear-gradient is happy)
  tealFoil: [deepTeal, teal, lightTeal, deepTeal] as [string, string, string, string],
  tealFoilSoft: [
    "rgba(6,78,84,0.92)",
    "rgba(11,110,117,0.96)",
    "rgba(63,169,176,1)",
    "rgba(6,78,84,0.92)",
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
