import { useRouter } from "expo-router";
import { useState } from "react";
import { Linking, Platform, View, useWindowDimensions } from "react-native";

import { BRANCHES } from "@/src/api/data";
import { useAccount, useActivity, useVouchers } from "@/src/api/hooks";
import { ExpiryNudge } from "@/src/components/ExpiryNudge";
import { EyeTestNudge } from "@/src/components/EyeTestNudge";
import { LensReorderNudge } from "@/src/components/LensReorderNudge";
import { ReferCard } from "@/src/components/ReferCard";
import { RewardReadyCard } from "@/src/components/RewardReadyCard";
import { TxnRow } from "@/src/components/TxnRow";
import { useApp } from "@/src/context/AppContext";
import { eyeTestStatus } from "@/src/lib/eyeTest";
import { expiresSoon, ringProgress, pointsToNextReward } from "@/src/lib/points";
import { lensSupplyStatus } from "@/src/lib/supply";
import { font, spacing } from "@/src/tokens";
import { makeStyles } from "@/src/theme";
import { Divider } from "@/src/ui/Divider";
import { GradientText } from "@/src/ui/GradientText";
import { PointsRing } from "@/src/ui/PointsRing";
import { Screen } from "@/src/ui/Screen";
import { Skeleton, SkeletonCard } from "@/src/ui/Skeleton";
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
  const router = useRouter();
  const { width } = useWindowDimensions();
  // Ring shrinks on narrow phones; summary tiles stack below ~360px.
  const ringSize = Math.max(160, Math.min(224, width - spacing.lg * 2 - 56));
  const stackTiles = width < 360;
  const { eyeTestDismissed, dismissEyeTestNudge, lensReorderDismissed, dismissLensReorderNudge, prefs, toast } =
    useApp();
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
      <Screen tabBar testID="home-screen" header={<View style={styles.header}><Skeleton width={120} height={28} /><Skeleton width={90} height={28} /></View>}>
        <View style={styles.ringBlock}>
          <Skeleton width={ringSize} height={ringSize} round />
          <Skeleton width={220} height={14} />
        </View>
        <SkeletonCard lines={2} style={styles.block} />
        <View style={styles.tiles}>
          <SkeletonCard lines={1} style={styles.tile} />
          <SkeletonCard lines={1} style={styles.tile} />
        </View>
      </Screen>
    );
  }

  const a = account.data;
  const waiting = (vouchers.data ?? []).filter((v) => v.status === "available");
  const toNext = pointsToNextReward(a.points);
  const recent = (activity.data ?? []).slice(0, 3);
  const expiring = waiting.filter((v) => expiresSoon(v.expires));
  const eyeTest = eyeTestDismissed || !prefs.remindEyeTest ? null : eyeTestStatus(activity.data ?? []);
  const lenses = lensReorderDismissed || !prefs.remindLenses ? null : lensSupplyStatus(activity.data ?? []);

  // Reordering is a phone call to the branch the lenses came from; the web
  // preview can't dial, so it shows the branch details instead.
  const onReorder = () => {
    const branch = BRANCHES.find((b) => b.id === lenses?.branchId);
    if (Platform.OS !== "web" && branch) Linking.openURL(`tel:${branch.phone}`);
    else router.push("/branches");
  };

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
        <View style={[styles.glow, { width: ringSize, height: ringSize, borderRadius: ringSize / 2 }]} />
        <PointsRing size={ringSize} strokeWidth={ringSize < 200 ? 12 : 14} progress={ringProgress(a.points)}>
          <View style={styles.ringCenter}>
            <GradientText style={[styles.ringNumber, ringSize < 200 && styles.ringNumberSmall]} tabular>
              {String(a.points)}
            </GradientText>
            <Txt variant="label" tone="sage">
              of 10 points
            </Txt>
          </View>
        </PointsRing>
        <Txt variant="body" tone="ink" style={styles.toNext}>
          {toNext} {toNext === 1 ? "point" : "points"} to your next £10 reward
        </Txt>
        <Txt variant="caption" style={styles.scheme}>
          You earn on the private amount you pay. NHS-funded care earns nothing.
        </Txt>
      </StaggerItem>

      {expiring.length > 0 ? (
        <StaggerItem index={1} style={styles.nudge}>
          <ExpiryNudge vouchers={expiring} onPress={() => router.push("/(tabs)/rewards")} />
        </StaggerItem>
      ) : null}

      {lenses ? (
        <StaggerItem index={1} style={styles.nudge}>
          <LensReorderNudge
            status={lenses}
            onReorder={onReorder}
            onDismiss={() => {
              dismissLensReorderNudge();
              toast("We’ll remind you next time");
            }}
          />
        </StaggerItem>
      ) : null}

      {waiting.length > 0 ? (
        <StaggerItem index={1} style={styles.block}>
          <RewardReadyCard onOpen={() => router.push("/(tabs)/rewards")} />
        </StaggerItem>
      ) : null}

      <StaggerItem index={2} style={[styles.tiles, stackTiles && styles.tilesStacked]}>
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

      <StaggerItem index={3} style={styles.referBlock}>
        <ReferCard onPress={() => router.push("/refer")} />
      </StaggerItem>

      {eyeTest ? (
        <StaggerItem index={3} style={styles.block}>
          <EyeTestNudge
            status={eyeTest}
            homeBranchId={a.homeBranchId}
            onBook={() => router.push("/branches")}
            onDismiss={() => {
              dismissEyeTestNudge();
              toast("We’ll remind you next time");
            }}
          />
        </StaggerItem>
      ) : null}

      <StaggerItem index={4} style={styles.block}>
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

const useStyles = makeStyles((colors) => ({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  headerLeft: { gap: 2, flex: 1, minWidth: 0 },
  ringBlock: { alignItems: "center", gap: spacing.base, paddingVertical: spacing.lg },
  ringCenter: { alignItems: "center", gap: spacing.xs },
  glow: {
    position: "absolute",
    top: spacing.lg,
    backgroundColor: colors.accentWash,
    shadowColor: colors.teal,
    shadowOpacity: 0.28,
    shadowRadius: 48,
    shadowOffset: { width: 0, height: 0 },
  },
  ringNumber: { fontFamily: font.serifLight, fontSize: 76, lineHeight: 80, letterSpacing: -3 },
  ringNumberSmall: { fontSize: 60, lineHeight: 64 },
  toNext: { textAlign: "center" },
  scheme: { textAlign: "center", maxWidth: 320 },
  block: { marginTop: spacing.xl },
  nudge: { marginTop: spacing.sm },
  referBlock: { marginTop: spacing.md },
  tiles: { flexDirection: "row", gap: spacing.md, marginTop: spacing.xl },
  tilesStacked: { flexDirection: "column" },
  tile: { flex: 1 },
}));
