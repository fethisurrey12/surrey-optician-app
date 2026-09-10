import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";

import { type Txn } from "@/src/api/data";
import { useActivity } from "@/src/api/hooks";
import { TxnRow } from "@/src/components/TxnRow";
import { groupByMonth } from "@/src/lib/points";
import { radius, spacing } from "@/src/tokens";
import { makeStyles } from "@/src/theme";
import { Card } from "@/src/ui/Card";
import { EmptyState } from "@/src/ui/EmptyState";
import { Skeleton, SkeletonRow } from "@/src/ui/Skeleton";
import { Divider } from "@/src/ui/Divider";
import { PressScale } from "@/src/ui/PressScale";
import { Screen } from "@/src/ui/Screen";
import { StaggerItem } from "@/src/ui/Stagger";
import { Txt } from "@/src/ui/Txt";

type Filter = "all" | "earned" | "rewards";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "earned", label: "Points earned" },
  { key: "rewards", label: "Rewards" },
];

export default function Activity() {
  const styles = useStyles();
  const { data } = useActivity();
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    const all = data ?? [];
    if (filter === "earned") return all.filter((t: Txn) => t.kind === "spend");
    if (filter === "rewards") return all.filter((t: Txn) => t.kind === "reward");
    return all;
  }, [data, filter]);

  const sections = useMemo(() => groupByMonth(filtered), [filtered]);

  return (
    <Screen
      tabBar
      padHorizontal={0}
      testID="activity-screen"
      header={
        <View style={styles.header}>
          <Txt variant="h1" style={styles.title}>
            Activity
          </Txt>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {FILTERS.map((f) => {
              const on = f.key === filter;
              return (
                <PressScale
                  key={f.key}
                  onPress={() => setFilter(f.key)}
                  style={[styles.chip, on && styles.chipOn]}
                  testID={`activity-filter-${f.key}`}
                  accessibilityLabel={f.label}
                >
                  <Txt variant="label" tone={on ? "ink" : "sage"} style={styles.chipText}>
                    {f.label}
                  </Txt>
                </PressScale>
              );
            })}
          </ScrollView>
        </View>
      }
    >
      <View style={styles.body}>
        {!data ? (
          <View style={styles.section}>
            <Skeleton width={110} height={12} style={styles.month} />
            <View style={styles.skelCard}>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </View>
          </View>
        ) : sections.length === 0 ? (
          <EmptyState
            icon="activity"
            title="Nothing here yet"
            body="Visits and rewards appear here as soon as they happen at the till."
            testID="activity-empty"
          />
        ) : (
          sections.map((section, si) => (
            <StaggerItem key={section.key} index={si} style={styles.section}>
              <Txt variant="label" tone="sage" style={styles.month}>
                {section.label}
              </Txt>
              <Card contentStyle={styles.card}>
                {section.items.map((t, i) => (
                  <View key={t.id}>
                    <TxnRow txn={t} />
                    {i < section.items.length - 1 ? <Divider inset={56} /> : null}
                  </View>
                ))}
              </Card>
            </StaggerItem>
          ))
        )}
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  header: { gap: spacing.base },
  title: { paddingHorizontal: spacing.lg },
  chipRow: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingRight: spacing.xl },
  chip: {
    flexShrink: 0,
    height: 36,
    paddingHorizontal: spacing.base,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  chipOn: { backgroundColor: colors.teal, borderColor: colors.teal },
  chipText: {},
  body: { paddingHorizontal: spacing.lg, gap: spacing.lg },
  loading: { paddingVertical: spacing.huge, alignItems: "center" },
  skelCard: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, paddingHorizontal: spacing.lg },
  section: { gap: spacing.sm },
  month: { marginLeft: spacing.xs },
  card: { paddingVertical: spacing.xs, paddingHorizontal: spacing.base },
}));
