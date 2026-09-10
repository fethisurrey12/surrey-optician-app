import { View } from "react-native";

import { PressScale } from "@/src/ui/PressScale";
import { Txt } from "@/src/ui/Txt";
import { spacing } from "@/src/tokens";
import { makeStyles } from "@/src/theme";

export function SectionHeader({
  title,
  actionLabel,
  onAction,
  testID,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
}) {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <Txt variant="h3">{title}</Txt>
      {actionLabel && onAction ? (
        <PressScale onPress={onAction} hitSlop={10} testID={testID}>
          <Txt variant="bodyStrong" tone="gold">
            {actionLabel}
          </Txt>
        </PressScale>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles(() => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.base,
    gap: spacing.md,
  },
}));
