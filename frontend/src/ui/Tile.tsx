import { View, type StyleProp, type ViewStyle } from "react-native";

import { Card } from "@/src/ui/Card";
import { GradientText } from "@/src/ui/GradientText";
import { Icon, type IconName } from "@/src/ui/Icon";
import { Txt } from "@/src/ui/Txt";
import { font, spacing } from "@/src/tokens";
import { makeStyles, useTheme } from "@/src/theme";

// A compact summary tile. The headline value can be foil (for £/points).
export function Tile({
  icon,
  label,
  value,
  caption,
  foil,
  style,
}: {
  icon?: IconName;
  label: string;
  value: string;
  caption?: string;
  foil?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Card style={style} contentStyle={styles.content}>
      <View style={styles.head}>
        {icon ? <Icon name={icon} size={17} color={colors.sage} /> : null}
        <Txt variant="label" tone="sage">
          {label}
        </Txt>
      </View>
      {foil ? (
        <GradientText style={styles.value} tabular>
          {value}
        </GradientText>
      ) : (
        <Txt tabular style={styles.valuePlain}>
          {value}
        </Txt>
      )}
      {caption ? <Txt variant="caption">{caption}</Txt> : null}
    </Card>
  );
}

const useStyles = makeStyles((colors) => ({
  content: { padding: spacing.lg, gap: spacing.md, justifyContent: "space-between" },
  head: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" },
  value: { fontFamily: font.serifLight, fontSize: 34, letterSpacing: -0.8, lineHeight: 38 },
  valuePlain: { fontFamily: font.serifLight, fontSize: 34, letterSpacing: -0.8, lineHeight: 38, color: colors.cream },
}));
