import { View, type StyleProp, type ViewStyle } from "react-native";

import { spacing } from "@/src/tokens";
import { makeStyles } from "@/src/theme";
import { Card } from "@/src/ui/Card";
import { SectionHeader } from "@/src/ui/SectionHeader";

// One band of a screen: an optional heading, then its content, optionally
// inside a container so the group is visible rather than implied.
//
// Screens set the rhythm between sections once, with SECTION_GAP on the stack
// that holds them, so no screen is adding margins to individual blocks and
// hoping they add up.
export const SECTION_GAP = spacing.xxl; // 32

export function Section({
  title,
  actionLabel,
  onAction,
  actionTestID,
  panel = false,
  gap = spacing.md,
  children,
  style,
  testID,
}: {
  title?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionTestID?: string;
  /** Draw the group as a card rather than letting it sit on the page. */
  panel?: boolean;
  /** Space between the items inside the section. */
  gap?: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const styles = useStyles();
  const body = panel ? (
    <Card contentStyle={[styles.panel, { gap }]}>{children}</Card>
  ) : (
    <View style={{ gap }}>{children}</View>
  );

  return (
    <View style={[styles.section, style]} testID={testID}>
      {title ? (
        <SectionHeader
          title={title}
          actionLabel={actionLabel}
          onAction={onAction}
          testID={actionTestID}
        />
      ) : null}
      {body}
    </View>
  );
}

const useStyles = makeStyles(() => ({
  section: { gap: spacing.md },
  panel: { alignItems: "stretch" },
}));
