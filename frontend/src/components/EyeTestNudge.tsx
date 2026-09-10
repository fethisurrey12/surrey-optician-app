import { View } from "react-native";

import { branchName } from "@/src/api/data";
import { type EyeTestStatus } from "@/src/lib/eyeTest";
import { dayMonthYear, monthYear } from "@/src/lib/points";
import { radius, spacing } from "@/src/tokens";
import { makeStyles, useTheme } from "@/src/theme";
import { Card } from "@/src/ui/Card";
import { BrandButton } from "@/src/ui/BrandButton";
import { Icon } from "@/src/ui/Icon";
import { PressScale } from "@/src/ui/PressScale";
import { Txt } from "@/src/ui/Txt";

// A calm recall card: last examination, when the next is due, one action to
// reach the branch, and a quiet way to put it away.
export function EyeTestNudge({
  status,
  homeBranchId,
  onBook,
  onDismiss,
}: {
  status: EyeTestStatus;
  homeBranchId: string;
  onBook: () => void;
  onDismiss: () => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const overdue = status.days < 0;
  const when =
    status.days < 0
      ? `was due ${dayMonthYear(status.due)}`
      : status.days === 0
        ? "is due today"
        : `is due ${dayMonthYear(status.due)}`;

  return (
    <Card contentStyle={styles.content} testID="eye-test-nudge">
      <View style={styles.head}>
        <View style={styles.icon}>
          <Icon name="eye" size={20} color={colors.teal} />
        </View>
        <View style={styles.texts}>
          <Txt variant="title">{overdue ? "Your eye test is overdue" : "Time for your eye test"}</Txt>
          <Txt variant="caption" tone="sage">
            Last examination {monthYear(status.last)} · next {when}
          </Txt>
        </View>
        <PressScale
          onPress={onDismiss}
          hitSlop={10}
          style={styles.dismiss}
          testID="eye-test-dismiss"
          accessibilityLabel="Not now"
        >
          <Icon name="close" size={16} color={colors.dimSage} />
        </PressScale>
      </View>

      <Txt variant="body">
        Most adults are advised to have an eye examination every two years. Book at{" "}
        {branchName(homeBranchId)} or any branch — it takes about half an hour.
      </Txt>

      <BrandButton label="Book an eye test" icon="phone" onPress={onBook} testID="eye-test-book-button" />

      <Txt variant="caption" tone="dimSage">
        Based on the date of your last eye examination purchase in this app. We hold no clinical
        records.
      </Txt>
    </Card>
  );
}

const useStyles = makeStyles((colors) => ({
  content: { gap: spacing.md, padding: spacing.lg },
  head: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  texts: { flex: 1, gap: 2 },
  dismiss: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
}));
