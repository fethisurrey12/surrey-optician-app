import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { useAccount, useActivity, useVouchers } from "@/src/api/hooks";
import { RewardReadyCard } from "@/src/components/RewardReadyCard";
import { TxnRow } from "@/src/components/TxnRow";
import { ringProgress, pointsToNextReward } from "@/src/lib/points";
import { font, spacing } from "@/src/tokens";
import { makeStyles, useTheme } from "@/src/theme";
import { Divider } from "@/src/ui/Divider";
import { GradientText } from "@/src/ui/GradientText";
import { PointsRing } from "@/src/ui/PointsRing";
import { Screen } from "@/src/ui/Screen";
import { SectionHeader } from "@/src/ui/SectionHeader";
import { StaggerItem } from "@/src/ui/Stagger";
import { Tile } from "@/src/ui/Tile";
import { Txt } from "@/src/ui/Txt";
import { Wordmark } from "@/src/ui/Wordmark";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function Home() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const account = useAccount();
  const vouchers = useVouchers();
  const activity = useActivity();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([account.refetch(), vouchers.refetch(), activity.refetch()]);
    setRefreshing(false);
  };

  if (!account.data) {
    return (
      <Screen tabBar scroll={false} center testID="home-screen">
        <ActivityIndicator color={colors.gold} />
      </Screen>
    );
  }

  const a = account.data;
  const waiting = (vouchers.data ?? []).filter((v) => v.status === "available");
  const toNext = pointsToNextReward(a.points);
  const recent = (activity.data ?? []).slice(0, 3);

  return (
    <Screen
      tabBar
      testID="home-screen"
      onRefresh={onRefresh}
      refreshing={refreshing}
      header={
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Txt variant="caption" tone="sage">
              {greeting()}
            </Txt>
            <Txt variant="h2">{a.firstName}</Txt>
          </View>
          <Wordmark size="sm" align="left" />
        </View>
      }
    >
      <StaggerItem index={0} style={styles.ringBlock}>
        <PointsRing size={224} strokeWidth={14} progress={ringProgress(a.points)}>
          <View style={styles.ringCenter}>
            <GradientText style={styles.ringNumber} tabular>
              {String(a.points)}
            </GradientText>
            <Txt variant="label" tone="sage">
              of 10 points
            </Txt>
          </View>
        </PointsRing>
        <Txt variant="body" tone="cream" style={styles.toNext}>
          {toNext} {toNext === 1 ? "point" : "points"} to your next £10 reward
        </Txt>
        <Txt variant="caption" style={styles.scheme}>
          You earn on the private amount you pay. NHS-funded care earns nothing.
        </Txt>
      </StaggerItem>

      {waiting.length > 0 ? (
        <StaggerItem index={1} style={styles.block}>
          <RewardReadyCard onOpen={() => router.push("/(tabs)/rewards")} />
        </StaggerItem>
      ) : null}

      <StaggerItem index={2} style={styles.tiles}>
        <Tile
          icon="sparkle"
          label="Points earned"
          value={String(a.totalEarned)}
          caption="Since you joined"
          style={styles.tile}
        />
        <Tile
          icon="gift"
          label="Rewards"
          value={String(waiting.length)}
          caption={waiting.length === 1 ? "Ready to use" : "Ready to use"}
          foil={waiting.length > 0}
          style={styles.tile}
        />
      </StaggerItem>

      <StaggerItem index={3} style={styles.block}>
        <SectionHeader
          title="Recent activity"
          actionLabel="See all"
          onAction={() => router.push("/(tabs)/activity")}
          testID="home-see-all"
        />
        <View>
          {recent.map((t, i) => (
            <View key={t.id}>
              <TxnRow txn={t} />
              {i < recent.length - 1 ? <Divider /> : null}
            </View>
          ))}
        </View>
      </StaggerItem>
    </Screen>
  );
}

const useStyles = makeStyles(() => ({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerLeft: { gap: 2 },
  ringBlock: { alignItems: "center", gap: spacing.base, paddingVertical: spacing.lg },
  ringCenter: { alignItems: "center", gap: spacing.xs },
  ringNumber: { fontFamily: font.serifThin, fontSize: 76, lineHeight: 80, letterSpacing: -3 },
  toNext: { textAlign: "center" },
  scheme: { textAlign: "center", maxWidth: 300 },
  block: { marginTop: spacing.xl },
  tiles: { flexDirection: "row", gap: spacing.md, marginTop: spacing.xl },
  tile: { flex: 1 },
}));
