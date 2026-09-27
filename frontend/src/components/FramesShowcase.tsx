import { View } from "react-native";

import { type Frame } from "@/src/api/frames";
import { money } from "@/src/lib/points";
import { radius, spacing } from "@/src/tokens";
import { makeStyles } from "@/src/theme";
import { Card } from "@/src/ui/Card";
import { PressScale } from "@/src/ui/PressScale";
import { Spectacles } from "@/src/ui/art/Spectacles";
import { Txt } from "@/src/ui/Txt";

// A two-up showcase of frames, sitting between the reminders and the ledger.
//
// It is here because the scheme rewards private spend, and frames are most of
// what that is — but it stays a shop window, not a shop: nothing is bought in
// the app, so each card ends at "Book a fitting", which is a real appointment
// on the practice's own page.
export function FramesShowcase({
  frames,
  onPressFrame,
}: {
  frames: Frame[];
  onPressFrame: (frame: Frame) => void;
}) {
  const styles = useStyles();
  return (
    <View style={styles.grid}>
      {frames.map((frame) => (
        <FrameCard key={frame.id} frame={frame} onPress={() => onPressFrame(frame)} />
      ))}
    </View>
  );
}

function FrameCard({ frame, onPress }: { frame: Frame; onPress: () => void }) {
  const styles = useStyles();

  return (
    <PressScale
      onPress={onPress}
      style={styles.cell}
      accessibilityLabel={`${frame.name}, ${frame.type}, ${money(frame.price)}. Book a fitting.`}
      testID={`frame-${frame.id}`}
    >
      <Card contentStyle={styles.card}>
        <View style={styles.tagRow}>
          {frame.tag ? (
            <View style={styles.tag}>
              <Txt variant="caption" tone="teal" style={styles.tagText}>
                {frame.tag}
              </Txt>
            </View>
          ) : null}
        </View>

        <View style={styles.plate}>
          <Spectacles width={104} />
        </View>

        <View style={styles.info}>
          <Txt variant="title" numberOfLines={1}>
            {frame.name}
          </Txt>
          <Txt variant="caption" numberOfLines={1}>
            {frame.type}
          </Txt>
        </View>

        <View style={styles.foot}>
          <Txt variant="bodyStrong" tone="teal" tabular>
            {money(frame.price)}
          </Txt>
          <View style={styles.cta}>
            <Txt variant="caption" tone="paper" style={styles.ctaText}>
              Book a fitting
            </Txt>
          </View>
        </View>
      </Card>
    </PressScale>
  );
}

const useStyles = makeStyles((colors) => ({
  grid: { flexDirection: "row", gap: spacing.md },
  cell: { flex: 1 },
  card: { padding: spacing.base, gap: spacing.sm },
  // Reserves the tag's line whether or not this frame carries one, so two
  // cards side by side keep their spectacles on the same line.
  tagRow: { minHeight: 22, justifyContent: "center" },
  tag: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.accentWash,
    borderWidth: 1,
    borderColor: colors.accentBorderSoft,
  },
  tagText: { fontSize: 11, lineHeight: 16 },
  plate: {
    height: 84,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { gap: 1 },
  foot: { gap: spacing.sm, marginTop: spacing.xs },
  cta: {
    backgroundColor: colors.teal,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  ctaText: { color: colors.paper, fontSize: 12.5 },
}));
