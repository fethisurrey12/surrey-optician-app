import { View } from "react-native";

import { BRANCHES } from "@/src/api/data";
import { makeStyles } from "@/src/theme";
import { radius, spacing } from "@/src/tokens";
import { PressScale } from "@/src/ui/PressScale";
import { Txt } from "@/src/ui/Txt";

// Which of the four practices this is. Shown as chips rather than a picker so
// the choice is always visible: everything the desk records is attributed to it.
export function BranchChips({
  value,
  onChange,
  testID,
}: {
  value: string;
  onChange: (id: string) => void;
  testID?: string;
}) {
  const styles = useStyles();
  return (
    <View style={styles.row} testID={testID}>
      {BRANCHES.map((b) => {
        const on = b.id === value;
        return (
          <PressScale
            key={b.id}
            onPress={() => onChange(b.id)}
            accessibilityLabel={b.name}
            testID={`branch-chip-${b.id}`}
          >
            <View style={[styles.chip, on && styles.chipOn]}>
              <Txt variant="bodyStrong" tone={on ? "paper" : "sage"}>
                {b.name}
              </Txt>
            </View>
          </PressScale>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceTertiary,
  },
  chipOn: { backgroundColor: colors.teal, borderColor: colors.teal },
}));
