import { View } from "react-native";

import { REFERRAL_BONUS_POINTS } from "@/src/api/data";
import { spacing } from "@/src/tokens";
import { makeStyles, useTheme } from "@/src/theme";
import { Card } from "@/src/ui/Card";
import { Icon } from "@/src/ui/Icon";
import { PressScale } from "@/src/ui/PressScale";
import { Txt } from "@/src/ui/Txt";

// Home entry point for referrals.
export function ReferCard({ onPress }: { onPress: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const pts = REFERRAL_BONUS_POINTS === 1 ? "a bonus point" : `${REFERRAL_BONUS_POINTS} bonus points`;
  return (
    <PressScale onPress={onPress} testID="home-refer-card" accessibilityLabel="Refer a friend">
      <Card contentStyle={styles.content}>
        <View style={styles.icon}>
          <Icon name="users" size={20} color={colors.gold} />
        </View>
        <View style={styles.texts}>
          <Txt variant="title">Refer a friend</Txt>
          <Txt variant="caption">You both earn {pts} on their first visit.</Txt>
        </View>
        <Icon name="chevronRight" size={18} color={colors.dimSage} />
      </Card>
    </PressScale>
  );
}

const useStyles = makeStyles((colors) => ({
  content: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.base },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  texts: { flex: 1, gap: 2 },
}));
