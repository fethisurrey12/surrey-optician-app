import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Linking,
  Platform,
  ScrollView,
  View,
  useWindowDimensions,
} from "react-native";
import { setStatusBarStyle } from "expo-status-bar";

import { BRANCHES } from "@/src/api/data";
import { useAccount, useActivity, useVouchers } from "@/src/api/hooks";
import { ExpiryNudge } from "@/src/components/ExpiryNudge";
import { EyeTestNudge } from "@/src/components/EyeTestNudge";
import { openBooking } from "@/src/lib/booking";
import { LensReorderNudge } from "@/src/components/LensReorderNudge";
import { ReferCard } from "@/src/components/ReferCard";
import { RewardReadyCard } from "@/src/components/RewardReadyCard";
import { TxnRow } from "@/src/components/TxnRow";
import { useApp } from "@/src/context/AppContext";
import { eyeTestStatus } from "@/src/lib/eyeTest";
import { useGreeting } from "@/src/lib/greeting";
import {
  expiresSoon,
  ringProgress,
  pointsToNextReward,
} from "@/src/lib/points";
import { lensSupplyStatus } from "@/src/lib/supply";
import { font, spacing } from "@/src/tokens";
import { makeStyles } from "@/src/theme";
import { Divider } from "@/src/ui/Divider";
import { GradientText } from "@/src/ui/GradientText";
import { PointsRing } from "@/src/ui/PointsRing";
import { GreetingHeader } from "@/src/ui/GreetingHeader";
import { Screen } from "@/src/ui/Screen";
import { SECTION_GAP, Section } from "@/src/ui/Section";
import { Skeleton, SkeletonCard } from "@/src/ui/Skeleton";
import { StaggerItem } from "@/src/ui/Stagger";
import { Txt } from "@/src/ui/Txt";

export default function Home() {
  const styles = useStyles();
  const greeting = useGreeting();
  const router = useRouter();
  const { width } = useWindowDimensions();
  // The ring shrinks on narrow phones.
  const ringSize = Math.max(160, Math.min(224, width - spacing.lg * 2 - 56));
  const {
    eyeTestDismissed,
    dismissEyeTestNudge,
    lensReorderDismissed,
    dismissLensReorderNudge,
    prefs,
    toast,
  } = useApp();
  const account = useAccount();
  const vouchers = useVouchers();
  const activity = useActivity();
  const [refreshing, setRefreshing] = useState(false);
  // The bell scrolls to the reminders, so the screen keeps a handle on its own
  // scroller and remembers where that section starts.
  const scrollRef = useRef<ScrollView | null>(null);
  const remindersY = useRef(0);

  // The header band runs under the status bar, so its glyphs go light while
  // this screen is the one on show, and back to dark when it is not.
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle("light");
      return () => setStatusBarStyle("dark");
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      account.refetch(),
      vouchers.refetch(),
      activity.refetch(),
    ]);
    setRefreshing(false);
  };

  if (!account.data) {
    return (
      <Screen
        tabBar
        testID="home-screen"
        headerBleed
        header={<GreetingHeader eyebrow={greeting} name="" />}
      >
        <View style={styles.stack}>
          <View style={styles.ringBlock}>
            <Skeleton width={ringSize} height={ringSize} round />
            <Skeleton width={220} height={14} />
          </View>
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
        </View>
      </Screen>
    );
  }

  const a = account.data;
  const waiting = (vouchers.data ?? []).filter((v) => v.status === "available");
  const toNext = pointsToNextReward(a.points);
  const recent = (activity.data ?? []).slice(0, 3);
  const expiring = waiting.filter((v) => expiresSoon(v.expires));
  const eyeTest =
    eyeTestDismissed || !prefs.remindEyeTest
      ? null
      : eyeTestStatus(activity.data ?? []);
  const lenses =
    lensReorderDismissed || !prefs.remindLenses
      ? null
      : lensSupplyStatus(activity.data ?? []);
  const hasReminders =
    waiting.length > 0 || expiring.length > 0 || !!lenses || !!eyeTest;

  // The bell takes them to what is waiting, and says so plainly when nothing is.
  const onBell = () => {
    if (!hasReminders) {
      toast("Nothing needs your attention just now");
      return;
    }
    scrollRef.current?.scrollTo({
      y: Math.max(0, remindersY.current - 12),
      animated: true,
    });
  };

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
      headerBleed
      scrollRef={scrollRef}
      header={
        <GreetingHeader
          eyebrow={greeting}
          name={a.firstName}
          unread={hasReminders}
          onBell={onBell}
        />
      }
    >
      <View style={styles.stack}>
        {/* Where they stand. The ring, what it takes to reach the next reward,
            and the two running totals, held in one container so the whole
            standing reads as a single thing rather than four loose blocks. */}
        <StaggerItem index={0}>
          <Section panel gap={spacing.base} testID="home-standing">
            <View style={styles.ringBlock}>
              <View
                style={[
                  styles.glow,
                  {
                    width: ringSize,
                    height: ringSize,
                    borderRadius: ringSize / 2,
                  },
                ]}
              />
              <PointsRing
                size={ringSize}
                strokeWidth={ringSize < 200 ? 12 : 14}
                progress={ringProgress(a.points)}
              >
                <View style={styles.ringCenter}>
                  <GradientText
                    style={[
                      styles.ringNumber,
                      ringSize < 200 && styles.ringNumberSmall,
                    ]}
                    tabular
                  >
                    {String(a.points)}
                  </GradientText>
                  <Txt variant="label" tone="sage">
                    of 10 points
                  </Txt>
                </View>
              </PointsRing>
              <Txt variant="body" tone="ink" style={styles.toNext}>
                {toNext} {toNext === 1 ? "point" : "points"} to your next £10
                reward
              </Txt>
              <Txt variant="caption" style={styles.scheme}>
                You earn on the private amount you pay. NHS-funded care earns
                nothing.
              </Txt>
            </View>

            <Divider />

            <View style={styles.stats}>
              <View style={styles.stat}>
                <Txt variant="label" tone="sage">
                  Points earned
                </Txt>
                <Txt style={styles.statValue} tabular>
                  {a.totalEarned}
                </Txt>
                <Txt variant="caption">Since you joined</Txt>
              </View>
              <View style={styles.statRule} />
              <View style={styles.stat}>
                <Txt variant="label" tone="sage">
                  Rewards
                </Txt>
                <Txt
                  style={[
                    styles.statValue,
                    waiting.length > 0 && styles.statValueLive,
                  ]}
                  tabular
                >
                  {waiting.length}
                </Txt>
                <Txt variant="caption">Ready to use</Txt>
              </View>
            </View>
          </Section>
        </StaggerItem>

        {/* Everything that wants their attention, gathered under one heading
            instead of scattered down the page. */}
        {hasReminders ? (
          <View onLayout={(e) => (remindersY.current = e.nativeEvent.layout.y)}>
            <StaggerItem index={1}>
              <Section title="For you" gap={spacing.md} testID="home-reminders">
                {waiting.length > 0 ? (
                  <RewardReadyCard
                    onOpen={() => router.push("/(tabs)/rewards")}
                  />
                ) : null}
                {expiring.length > 0 ? (
                  <ExpiryNudge
                    vouchers={expiring}
                    onPress={() => router.push("/(tabs)/rewards")}
                  />
                ) : null}
                {lenses ? (
                  <LensReorderNudge
                    status={lenses}
                    onReorder={onReorder}
                    onDismiss={() => {
                      dismissLensReorderNudge();
                      toast("We’ll remind you next time");
                    }}
                  />
                ) : null}
                {eyeTest ? (
                  <EyeTestNudge
                    status={eyeTest}
                    onBook={() => void openBooking()}
                    onDismiss={() => {
                      dismissEyeTestNudge();
                      toast("We’ll remind you next time");
                    }}
                  />
                ) : null}
              </Section>
            </StaggerItem>
          </View>
        ) : null}

        <StaggerItem index={2}>
          <Section
            title="Recent activity"
            actionLabel="See all"
            onAction={() => router.push("/(tabs)/activity")}
            actionTestID="home-see-all"
            panel
            gap={0}
          >
            <View>
              {recent.map((t, i) => (
                <View key={t.id}>
                  <TxnRow txn={t} />
                  {i < recent.length - 1 ? <Divider /> : null}
                </View>
              ))}
            </View>
          </Section>
        </StaggerItem>

        <StaggerItem index={3}>
          <Section>
            <ReferCard onPress={() => router.push("/refer")} />
          </Section>
        </StaggerItem>
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  headerLeft: { gap: 2, flex: 1, minWidth: 0 },
  ringBlock: {
    alignItems: "center",
    gap: spacing.base,
    paddingVertical: spacing.sm,
  },
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
  ringNumber: {
    fontFamily: font.light,
    fontSize: 72,
    lineHeight: 80,
    letterSpacing: -2.4,
  },
  ringNumberSmall: { fontSize: 60, lineHeight: 64 },
  toNext: { textAlign: "center" },
  scheme: { textAlign: "center", maxWidth: 320 },
  stack: { gap: SECTION_GAP },
  stats: { flexDirection: "row", alignItems: "flex-start" },
  stat: { flex: 1, gap: 2, paddingHorizontal: spacing.xs },
  statRule: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: colors.divider,
    marginHorizontal: spacing.md,
  },
  statValue: {
    fontFamily: font.bold,
    fontSize: 30,
    lineHeight: 38,
    letterSpacing: -0.6,
    color: colors.ink,
  },
  statValueLive: { color: colors.teal },
}));
