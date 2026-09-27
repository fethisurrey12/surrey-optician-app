import { View } from "react-native";

import { radius, spacing } from "@/src/tokens";
import { makeStyles } from "@/src/theme";
import { Txt } from "@/src/ui/Txt";

// A state, said once and said plainly: Active, Used, Expired.
//
// Colour alone would not carry it — a filled turquoise pill and a grey one are
// the same shape to someone who cannot separate them — so each pill says its
// own word, and the colour only reinforces it.
export type PillTone = "active" | "quiet" | "warning";

export function StatusPill({
  label,
  tone = "quiet",
  testID,
}: {
  label: string;
  tone?: PillTone;
  testID?: string;
}) {
  const styles = useStyles();
  return (
    <View style={[styles.pill, styles[tone]]} testID={testID}>
      <Txt variant="label" tone={tone === "active" ? "paper" : tone === "warning" ? "warning" : "sage"}>
        {label}
      </Txt>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  pill: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  active: { backgroundColor: colors.teal, borderColor: colors.teal },
  quiet: { backgroundColor: colors.surfaceTertiary, borderColor: colors.border },
  warning: { backgroundColor: "rgba(138,97,0,0.10)", borderColor: "rgba(138,97,0,0.28)" },
}));
