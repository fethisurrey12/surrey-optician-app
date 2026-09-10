import { View } from "react-native";

import { spacing } from "@/src/tokens";
import { makeStyles, useTheme } from "@/src/theme";
import { Card } from "@/src/ui/Card";
import { GhostButton } from "@/src/ui/GhostButton";
import { Icon, type IconName } from "@/src/ui/Icon";
import { Txt } from "@/src/ui/Txt";

// One calm empty/error state: an icon in a soft circle, a short heading,
// a sentence of support, and an optional single action.
export function EmptyState({
  icon,
  title,
  body,
  actionLabel,
  onAction,
  testID,
}: {
  icon: IconName;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Card contentStyle={styles.content} testID={testID}>
      <View style={styles.icon}>
        <Icon name={icon} size={24} color={colors.sage} />
      </View>
      <Txt variant="h3" style={styles.center}>
        {title}
      </Txt>
      <Txt variant="body" style={styles.center}>
        {body}
      </Txt>
      {actionLabel && onAction ? (
        <GhostButton label={actionLabel} onPress={onAction} style={styles.action} testID={`${testID ?? "empty"}-action`} />
      ) : null}
    </Card>
  );
}

const useStyles = makeStyles((colors) => ({
  content: { alignItems: "center", gap: spacing.md, padding: spacing.xl },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  center: { textAlign: "center" },
  action: { marginTop: spacing.sm, alignSelf: "stretch" },
}));
