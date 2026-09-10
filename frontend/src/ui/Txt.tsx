import { StyleSheet, Text, type TextProps, type TextStyle } from "react-native";

import { font, tnum } from "@/src/tokens";
import { useTheme, type ThemeColors } from "@/src/theme";

type Variant =
  | "display"
  | "h1"
  | "h2"
  | "h3"
  | "title"
  | "body"
  | "bodyStrong"
  | "caption"
  | "label";

type Tone = keyof Pick<
  ThemeColors,
  | "ink"
  | "sage"
  | "dimSage"
  | "teal"
  | "lightTeal"
  | "paper"
  | "warning"
  | "muted"
  | "success"
  | "error"
  | "onSurface"
>;

const VARIANTS: Record<Variant, TextStyle> = {
  display: { fontFamily: font.serifLight, fontSize: 60, lineHeight: 66, letterSpacing: -1.5 },
  h1: { fontFamily: font.serif, fontSize: 30, lineHeight: 36, letterSpacing: -0.5 },
  h2: { fontFamily: font.serif, fontSize: 24, lineHeight: 30, letterSpacing: -0.4 },
  h3: { fontFamily: font.serif, fontSize: 20, lineHeight: 26, letterSpacing: -0.2 },
  title: { fontFamily: font.semibold, fontSize: 16, lineHeight: 22, letterSpacing: -0.1 },
  body: { fontFamily: font.regular, fontSize: 15, lineHeight: 24 },
  bodyStrong: { fontFamily: font.medium, fontSize: 15, lineHeight: 24 },
  caption: { fontFamily: font.regular, fontSize: 13, lineHeight: 19 },
  label: { fontFamily: font.medium, fontSize: 12.5, lineHeight: 18, letterSpacing: 0.4, textTransform: "uppercase" },
};

const DEFAULT_TONE: Record<Variant, Tone> = {
  display: "ink",
  h1: "ink",
  h2: "ink",
  h3: "ink",
  title: "ink",
  body: "sage",
  bodyStrong: "ink",
  caption: "muted",
  label: "sage",
};

export function Txt({
  variant = "body",
  tone,
  tabular,
  style,
  children,
  ...rest
}: TextProps & {
  variant?: Variant;
  tone?: Tone;
  tabular?: boolean;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  const color = colors[tone ?? DEFAULT_TONE[variant]];
  return (
    <Text
      {...rest}
      style={[VARIANTS[variant], { color }, styles.base, tabular ? tnum : null, style]}
    >
      {children}
    </Text>
  );
}

// Text may shrink inside rows so it wraps within its container instead of
// pushing siblings off-screen (RN's default flexShrink for Text is 0).
const styles = StyleSheet.create({ base: { flexShrink: 1, maxWidth: "100%" } });
