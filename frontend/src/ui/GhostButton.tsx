import { View } from "react-native";

import { Icon, type IconName } from "@/src/ui/Icon";
import { PressScale } from "@/src/ui/PressScale";
import { Txt } from "@/src/ui/Txt";
import { radius, spacing } from "@/src/tokens";
import { makeStyles, useTheme } from "@/src/theme";

// Secondary action: hairline outline, cream label.
export function GhostButton({
  label,
  onPress,
  icon,
  disabled,
  testID,
  tone = "cream",
  style,
}: {
  label: string;
  onPress?: () => void;
  icon?: IconName;
  disabled?: boolean;
  testID?: string;
  tone?: "cream" | "sage";
  style?: any;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <PressScale
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityLabel={label}
      style={style}
    >
      <View style={styles.btn}>
        {icon ? <Icon name={icon} size={18} color={colors[tone]} /> : null}
        <Txt variant="bodyStrong" tone={tone}>
          {label}
        </Txt>
      </View>
    </PressScale>
  );
}

const useStyles = makeStyles((colors) => ({
  btn: {
    height: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.surfaceTertiary,
  },
}));
