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
// Taken from surreyopticians.co.uk: the turquoise of the logo mark, the navy
// of the "Book Appointment" button, white pages and near-black type.
//
// The brand turquoise (#4BA6BC, here `lightTeal`) is only 2.8:1 on white, so
// it carries the identity — the ring, badges, icon fills — while `teal` is the
// deeper shade used wherever type or a small icon has to stay legible.
//
// Contrast against paper, to WCAG AA: ink 15.9:1, navy 11.4:1, sage 5.2:1,
// dimSage 4.6:1, teal 4.9:1, and paper on teal 4.9:1. Anything added here
// should be checked the same way — this is read one-handed in a shop.

import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

// Raw palette --------------------------------------------------------------
const paper = "#FFFFFF";      // the page, and type sitting on the brand
const mist = "#F1FAFB";       // quiet surface, a breath of turquoise
const haze = "#DFF3F6";       // deeper tint for gradients and wells
const card = "#FFFFFF";       // cards sit above the page on shadow, not tone
const cardTop = "#FBFEFF";
const ink = "#171733";        // primary type — the navy-black of "surrey"
const navy = "#2E2C66";       // the practice's second brand colour
const sage = "#55607A";       // secondary type
const dimSage = "#646E8A";    // tertiary type and labels
const teal = "#2A7B90";       // the brand, deepened so type on white is legible
const lightTeal = "#4BA6BC";  // the logo tile's turquoise — fills and highlights
const deepTeal = "#1E5C6D";   // gradient depth, pressed states

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
  border: "rgba(23,23,51,0.12)",
  borderStrong: "rgba(23,23,51,0.22)",
  divider: "rgba(23,23,51,0.08)",

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
  accentBorder: "rgba(75,166,188,0.45)",
  accentBorderSoft: "rgba(75,166,188,0.26)",
  accentWash: "rgba(75,166,188,0.09)",
  errorBorder: "rgba(179,38,30,0.35)",

  // Effects
  hairline: "rgba(23,23,51,0.10)",
  shadow: "#0D2A30",
  overlay: "rgba(15,20,40,0.45)",
  glass: "rgba(255,255,255,0.86)",

  // Gradients (tuples so expo-linear-gradient is happy)
  tealFoil: [deepTeal, teal, "#35899F", deepTeal] as [string, string, string, string],
  tealFoilSoft: [
    "rgba(30,92,109,0.92)",
    "rgba(42,123,144,0.96)",
    "rgba(75,166,188,1)",
    "rgba(30,92,109,0.92)",
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
