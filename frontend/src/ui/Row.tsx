import { View } from "react-native";

import { Icon, type IconName } from "@/src/ui/Icon";
import { PressScale } from "@/src/ui/PressScale";
import { Txt } from "@/src/ui/Txt";
import { spacing } from "@/src/tokens";
import { makeStyles, useTheme } from "@/src/theme";

// A tappable list row: leading icon, title + optional subtitle, trailing value
// or chevron. Used for account links, branches and settings.
export function Row({
  icon,
  title,
  subtitle,
  value,
  onPress,
  right,
  chevron = true,
  testID,
}: {
  icon?: IconName;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  chevron?: boolean;
  testID?: string;
}) {
  const styles = useStyles();
  const { colors } = useTheme();

  const body = (
    <View style={styles.row}>
      {icon ? (
        <View style={styles.iconWrap}>
          <Icon name={icon} size={19} color={colors.sage} />
        </View>
      ) : null}
      <View style={styles.texts}>
        <Txt variant="bodyStrong" tone="ink">
          {title}
        </Txt>
        {subtitle ? (
          <Txt variant="caption" style={styles.sub}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {right}
      {value ? (
        <Txt variant="body" tone="sage" style={styles.value}>
          {value}
        </Txt>
      ) : null}
      {chevron && onPress ? <Icon name="chevronRight" size={18} color={colors.dimSage} /> : null}
    </View>
  );

  if (!onPress) return <View style={styles.static}>{body}</View>;
  return (
    <PressScale onPress={onPress} testID={testID} style={styles.static} accessibilityLabel={title}>
      {body}
    </PressScale>
  );
}

const useStyles = makeStyles((colors) => ({
  static: { paddingVertical: spacing.base },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  texts: { flex: 1, gap: 2 },
  sub: {},
  value: {},
}));
