import { View } from "react-native";

import { type Txn, branchName } from "@/src/api/data";
import { GradientText } from "@/src/ui/GradientText";
import { Icon } from "@/src/ui/Icon";
import { Txt } from "@/src/ui/Txt";
import { money, shortDate } from "@/src/lib/points";
import { font, spacing } from "@/src/tokens";
import { makeStyles, useTheme } from "@/src/theme";

// A single transaction line. Rewards read as a foil £10; spend shows the
// points earned and the amount paid. NHS-part-funded visits are labelled.
export function TxnRow({ txn }: { txn: Txn }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const isReward = txn.kind === "reward";

  return (
    <View style={styles.row} testID={`txn-${txn.id}`}>
      <View style={[styles.iconWrap, isReward && styles.iconReward]}>
        <Icon name={isReward ? "gift" : "card"} size={18} color={isReward ? colors.gold : colors.sage} />
      </View>

      <View style={styles.middle}>
        <Txt variant="bodyStrong" tone="cream" numberOfLines={1}>
          {txn.title}
        </Txt>
        <Txt variant="caption" numberOfLines={1}>
          {branchName(txn.branchId)} · {shortDate(txn.date)}
        </Txt>
        {txn.nhs ? (
          <View style={styles.nhsPill}>
            <Txt style={styles.nhsText}>NHS part-funded</Txt>
          </View>
        ) : null}
      </View>

      <View style={styles.right}>
        {isReward ? (
          <GradientText style={styles.reward}>£10</GradientText>
        ) : (
          <>
            <Txt variant="bodyStrong" tone={txn.points > 0 ? "sage" : "dimSage"} tabular>
              {txn.points > 0 ? `+${txn.points} pts` : "0 pts"}
            </Txt>
            <Txt variant="caption" tabular>
              {money(txn.total)}
            </Txt>
          </>
        )}
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.md },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  iconReward: { borderColor: "rgba(201,162,39,0.4)" },
  middle: { flex: 1, gap: 3 },
  nhsPill: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginTop: 2,
  },
  nhsText: { color: colors.sage, fontFamily: font.medium, fontSize: 11, lineHeight: 14 },
  right: { alignItems: "flex-end", gap: 2 },
  reward: { fontFamily: font.serifLight, fontSize: 20, letterSpacing: -0.4 },
}));
