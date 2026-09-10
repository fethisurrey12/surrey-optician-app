import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, View } from "react-native";

import { Icon, type IconName } from "@/src/ui/Icon";
import { PressScale } from "@/src/ui/PressScale";
import { Txt } from "@/src/ui/Txt";
import { radius, spacing } from "@/src/tokens";
import { makeStyles, useTheme } from "@/src/theme";

// Primary action: gold diagonal foil, ink label.
export function BrandButton({
  label,
  onPress,
  icon,
  loading,
  disabled,
  testID,
  style,
}: {
  label: string;
  onPress?: () => void;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
  style?: any;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <PressScale
      onPress={onPress}
      disabled={disabled || loading}
      testID={testID}
      accessibilityLabel={label}
      style={style}
    >
      <LinearGradient
        colors={colors.tealFoil}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.btn}
      >
        {loading ? (
          <ActivityIndicator color={colors.paper} />
        ) : (
          <View style={styles.row}>
            {icon ? <Icon name={icon} size={19} color={colors.paper} strokeWidth={2} /> : null}
            <Txt variant="title" tone="paper" style={styles.label}>
              {label}
            </Txt>
          </View>
        )}
      </LinearGradient>
    </PressScale>
  );
}

const useStyles = makeStyles((colors) => ({
  btn: {
    minHeight: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    shadowColor: colors.teal,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm },
  label: { color: colors.paper, textAlign: "center" },
}));
