import { LinearGradient } from "expo-linear-gradient";
import { createElement } from "react";
import { StyleSheet, View, type TextStyle, type StyleProp } from "react-native";

import { useTheme } from "@/src/theme";

// Web foil text via CSS background-clip, so it renders on the preview/browser.
export function GradientText({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  tabular?: boolean;
}) {
  const { colors } = useTheme();
  const f = (StyleSheet.flatten(style) ?? {}) as TextStyle;
  const [a, b, c, d] = colors.tealFoil;
  return createElement(
    "span",
    {
      style: {
        backgroundImage: `linear-gradient(135deg, ${a}, ${b}, ${c}, ${d})`,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        WebkitTextFillColor: "transparent",
        color: "transparent",
        fontFamily: f.fontFamily,
        fontSize: f.fontSize,
        fontWeight: f.fontWeight as any,
        letterSpacing: typeof f.letterSpacing === "number" ? `${f.letterSpacing}px` : f.letterSpacing,
        lineHeight: typeof f.lineHeight === "number" ? `${f.lineHeight}px` : (f.lineHeight as any),
        fontVariantNumeric: "tabular-nums",
        display: "inline-block",
        whiteSpace: "nowrap",
        maxWidth: "100%",
        overflowWrap: "anywhere",
      },
    },
    children,
  );
}

export function GoldFill({
  children,
  style,
}: {
  children?: React.ReactNode;
  style?: StyleProp<any>;
}) {
  const { colors } = useTheme();
  return (
    <View style={style}>
      <LinearGradient
        colors={colors.tealFoil}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}
