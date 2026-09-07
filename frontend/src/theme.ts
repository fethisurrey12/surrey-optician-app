// Design tokens for Surrey Opticians — a single dark, calm, expensive palette.
// The app ships one scheme only, so `light` holds the dark palette and the
// device setting is forced to it. Every colour in the app comes from here.
//
// Semantic keys (surface/onSurface/brand...) satisfy the shared infra; the
// named optician palette (ink, forest, gold, sage...) and the gradient tuples
// are what the screens actually reach for.

import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

// Raw palette --------------------------------------------------------------
const ink = "#071510";
const deep = "#0C2419";
const forest = "#123527";
const card = "#14392A";
const cardTop = "#1A4633";
const sage = "#A3BCAE";
const dimSage = "#7C9689";
const cream = "#F4F1E9";
const gold = "#C9A227";
const lightGold = "#EBD489";
const deepGold = "#8F6F14";

const light = {
  // Surfaces
  surface: ink,
  onSurface: cream,
  surfaceSecondary: card,
  onSurfaceSecondary: cream,
  surfaceTertiary: forest,
  onSurfaceTertiary: sage,
  surfaceInverse: cream,
  onSurfaceInverse: ink,
  muted: dimSage,

  // Brand (gold)
  brand: gold,
  onBrand: ink,
  brandPrimary: gold,
  onBrandPrimary: ink,
  brandSecondary: forest,
  onBrandSecondary: cream,
  brandTertiary: cardTop,
  onBrandTertiary: cream,

  // Status
  success: "#7FC29B",
  onSuccess: ink,
  warning: lightGold,
  onWarning: ink,
  error: "#E0796B",
  onError: ink,
  info: sage,
  onInfo: ink,

  // Lines
  border: "rgba(163,188,174,0.14)",
  borderStrong: "rgba(163,188,174,0.28)",
  divider: "rgba(163,188,174,0.10)",

  // Named optician palette
  ink,
  deep,
  forest,
  card,
  cardTop,
  sage,
  dimSage,
  cream,
  gold,
  lightGold,
  deepGold,

  // Effects
  hairline: "rgba(244,241,233,0.14)",
  shadow: "#000000",
  overlay: "rgba(4,12,9,0.72)",
  glass: "rgba(9,24,18,0.72)",

  // Gradients (tuples so expo-linear-gradient is happy)
  goldFoil: [deepGold, gold, lightGold, deepGold] as [string, string, string, string],
  goldFoilSoft: [
    "rgba(143,111,20,0.9)",
    "rgba(201,162,39,0.95)",
    "rgba(235,212,137,1)",
    "rgba(143,111,20,0.9)",
  ] as [string, string, string, string],
  cardGradient: [cardTop, card, forest] as [string, string, string],
  screenGradient: [deep, ink] as [string, string],
  sheen: ["rgba(244,241,233,0)", "rgba(244,241,233,0.16)", "rgba(244,241,233,0)"] as [string, string, string],
};

export type ThemeColors = typeof light;

export const defaultScheme = "light" satisfies ColorScheme;

export const themes: { light: ThemeColors; dark?: ThemeColors } = { light };

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme);
}

setColorScheme?.(themes.dark ? null : defaultScheme);

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme = system && themes[system] ? system : defaultScheme;
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
