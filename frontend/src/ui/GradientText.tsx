import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { Text, type TextStyle, type StyleProp, View } from "react-native";

import { useTheme } from "@/src/theme";
import { tnum } from "@/src/tokens";

// Gold foil clipped to the type itself, for large numerals and the wordmark.
export function GradientText({
  children,
  style,
  tabular,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  tabular?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <MaskedView
      maskElement={
        <Text style={[style, tabular ? tnum : null, { backgroundColor: "transparent" }]}>
          {children}
        </Text>
      }
    >
      <LinearGradient
        colors={colors.goldFoil}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={[style, tabular ? tnum : null, { opacity: 0 }]}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

// Non-text gold foil fill for arbitrary areas.
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
        colors={colors.goldFoil}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ ...StyleSheetAbsolute }}
      />
      {children}
    </View>
  );
}

const StyleSheetAbsolute = {
  position: "absolute" as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};
