import { Text, type TextProps, type TextStyle } from "react-native";

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
  "cream" | "sage" | "dimSage" | "gold" | "muted" | "ink" | "success" | "error" | "onSurface"
>;

const VARIANTS: Record<Variant, TextStyle> = {
  display: { fontFamily: font.serifThin, fontSize: 60, lineHeight: 64, letterSpacing: -1.5 },
  h1: { fontFamily: font.serifLight, fontSize: 30, lineHeight: 36, letterSpacing: -0.6 },
  h2: { fontFamily: font.serifLight, fontSize: 24, lineHeight: 30, letterSpacing: -0.5 },
  h3: { fontFamily: font.serifLight, fontSize: 20, lineHeight: 26, letterSpacing: -0.3 },
  title: { fontFamily: font.semibold, fontSize: 16, lineHeight: 22, letterSpacing: -0.1 },
  body: { fontFamily: font.regular, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: font.medium, fontSize: 15, lineHeight: 22 },
  caption: { fontFamily: font.regular, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: font.medium, fontSize: 13, lineHeight: 18, letterSpacing: 0.1 },
};

const DEFAULT_TONE: Record<Variant, Tone> = {
  display: "cream",
  h1: "cream",
  h2: "cream",
  h3: "cream",
  title: "cream",
  body: "sage",
  bodyStrong: "cream",
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
      style={[VARIANTS[variant], { color }, tabular ? tnum : null, style]}
    >
      {children}
    </Text>
  );
}
