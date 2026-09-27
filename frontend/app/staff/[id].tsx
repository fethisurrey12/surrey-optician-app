import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { branchName } from "@/src/api/data";
import { memberDetail, recordPurchase } from "@/src/api/staff";
import { BranchChips } from "@/src/components/BranchChips";
import { useApp } from "@/src/context/AppContext";
import { useDeskBranch } from "@/src/lib/desk";
import { dayMonthYear, money, pointsToNextReward, voucherLabel } from "@/src/lib/points";
import { makeStyles } from "@/src/theme";
import { spacing } from "@/src/tokens";
import { BrandButton } from "@/src/ui/BrandButton";
import { Card } from "@/src/ui/Card";
import { Divider } from "@/src/ui/Divider";
import { EmptyState } from "@/src/ui/EmptyState";
import { Field } from "@/src/ui/Field";
import { HeaderBar } from "@/src/ui/HeaderBar";
import { Screen } from "@/src/ui/Screen";
import { SectionHeader } from "@/src/ui/SectionHeader";
import { Skeleton, SkeletonCard } from "@/src/ui/Skeleton";
import { Txt } from "@/src/ui/Txt";

// One patient, as the desk needs them: who they are, what they have earned,
// and the two things a colleague does — record a purchase, see the visits.
export default function PatientRecord() {
  const styles = useStyles();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const memberId = String(id ?? "");

  const record = useQuery({
    queryKey: ["staff", "member", memberId],
    queryFn: () => memberDetail(memberId),
    enabled: !!memberId,
  });

  if (record.isPending) {
    return (
      <Screen header={<HeaderBar title="Patient record" />} testID="record-loading">
        <View style={styles.body}>
          <Skeleton height={110} />
          <SkeletonCard lines={3} />
        </View>
      </Screen>
    );
  }

  if (record.isError || !record.data) {
    return (
      <Screen header={<HeaderBar title="Patient record" />} testID="record-error">
        <EmptyState
          icon="info"
          title="We could not open that record"
          body="It may have been removed. Search for the patient again from the desk."
          actionLabel="Back to the desk"
          onAction={() => router.replace("/staff")}
        />
      </Screen>
    );
  }

  const { account: a, vouchers, activity, checkIns } = record.data;
  const available = vouchers.filter((v) => v.status === "available");
  const name = `${a.firstName} ${a.lastName}`.trim();

  return (
    <Screen
      keyboardAware
      header={<HeaderBar title={name || "Patient record"} />}
      testID="record-screen"
    >
      <View style={styles.body}>
        <Card testID="record-identity">
          <View style={styles.cardBody}>
            <View>
              <Txt variant="h2">{name || "No name yet"}</Txt>
              <Txt variant="caption">
                Member since {dayMonthYear(a.memberSince)} · {branchName(a.homeBranchId)}
              </Txt>
            </View>
            <Divider />
            <Detail label="Mobile" value={a.mobileDisplay} />
            <Detail label="Membership code" value={a.memberCode} tabular />
            <Detail label="Date of birth" value={a.dateOfBirth ? dayMonthYear(a.dateOfBirth) : "—"} />
            <Detail label="Email" value={a.email || "—"} />
            <Detail label="Address" value={[a.address, a.postcode].filter(Boolean).join("\n") || "—"} />
          </View>
        </Card>

        <Card testID="record-points">
          <View style={styles.cardBody}>
            <View style={styles.points}>
              <View style={styles.pointsBlock}>
                <Txt variant="h1" tabular>
                  {a.points}
                </Txt>
                <Txt variant="caption">{a.points === 1 ? "point now" : "points now"}</Txt>
              </View>
              <View style={styles.pointsBlock}>
                <Txt variant="h1" tabular>
                  {available.length}
                </Txt>
                <Txt variant="caption">
                  {available.length === 1 ? "reward waiting" : "rewards waiting"}
                </Txt>
              </View>
              <View style={styles.pointsBlock}>
                <Txt variant="h1" tabular>
                  {a.totalEarned}
                </Txt>
                <Txt variant="caption">earned in total</Txt>
              </View>
            </View>
            <Txt variant="caption">
              {pointsToNextReward(a.points) === 1
                ? "1 more point to their next £10 reward."
                : `${pointsToNextReward(a.points)} more points to their next £10 reward.`}
            </Txt>
          </View>
        </Card>

        <PurchaseForm mobile={a.mobile} memberId={memberId} />

        <Card testID="record-vouchers">
          <View style={styles.cardBody}>
            <SectionHeader title="Vouchers" />
            {vouchers.length === 0 ? (
              <Txt variant="caption">None yet.</Txt>
            ) : (
              vouchers.map((v, i) => (
                <View key={v.id}>
                  {i > 0 ? <Divider /> : null}
                  <View style={styles.line}>
                    <View style={styles.lineText}>
                      <Txt variant="bodyStrong" tone="ink">
                        {voucherLabel(v)}
                        {v.appliesTo && v.appliesTo !== "any" ? ` towards ${v.appliesTo}` : ""}
                      </Txt>
                      <Txt variant="caption" tabular>
                        {v.code} · expires {dayMonthYear(v.expires)}
                      </Txt>
                    </View>
                    <Txt
                      variant="caption"
                      tone={v.status === "available" ? "teal" : v.status === "used" ? "sage" : "warning"}
                    >
                      {v.status === "available"
                        ? "Ready"
                        : v.status === "used"
                          ? `Used ${v.usedAt ? dayMonthYear(v.usedAt) : ""}`.trim()
                          : "Expired"}
                    </Txt>
                  </View>
                </View>
              ))
            )}
          </View>
        </Card>

        <Card testID="record-activity">
          <View style={styles.cardBody}>
            <SectionHeader title="Visits" />
            {activity.length === 0 ? (
              <Txt variant="caption">Nothing recorded yet.</Txt>
            ) : (
              activity.slice(0, 12).map((t, i) => (
                <View key={t.id}>
                  {i > 0 ? <Divider /> : null}
                  <View style={styles.line}>
                    <View style={styles.lineText}>
                      <Txt variant="bodyStrong" tone="ink">
                        {t.title}
                      </Txt>
                      <Txt variant="caption">
                        {dayMonthYear(t.date)} · {branchName(t.branchId)}
                        {t.nhs ? ` · ${money(t.nhs)} NHS` : ""}
                      </Txt>
                    </View>
                    <View style={styles.lineRight}>
                      {t.kind === "spend" ? (
                        <Txt variant="bodyStrong" tone="ink" tabular>
                          {money(t.total)}
                        </Txt>
                      ) : null}
                      {t.points > 0 ? (
                        <Txt variant="caption" tone="teal" tabular>
                          +{t.points} pts
                        </Txt>
                      ) : null}
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </Card>

        <Card testID="record-arrivals">
          <View style={styles.cardBody}>
            <SectionHeader title="Arrivals" />
            {checkIns.length === 0 ? (
              <Txt variant="caption">They have not been checked in yet.</Txt>
            ) : (
              checkIns.map((c, i) => (
                <View key={c.id}>
                  {i > 0 ? <Divider /> : null}
                  <View style={styles.line}>
                    <Txt variant="bodyStrong" tone="ink" style={styles.lineText}>
                      {arrivalTime(c.at)}
                    </Txt>
                    <Txt variant="caption">{branchName(c.branchId)}</Txt>
                  </View>
                </View>
              ))
            )}
          </View>
        </Card>
      </View>
    </Screen>
  );
}

function Detail({ label, value, tabular }: { label: string; value: string; tabular?: boolean }) {
  const styles = useStyles();
  return (
    <View style={styles.detail}>
      <Txt variant="caption" style={styles.detailLabel}>
        {label}
      </Txt>
      <Txt variant="bodyStrong" tone="ink" tabular={tabular} style={styles.detailValue}>
        {value}
      </Txt>
    </View>
  );
}

// --- Recording what they bought -------------------------------------------
function PurchaseForm({ mobile, memberId }: { mobile: string; memberId: string }) {
  const styles = useStyles();
  const { toast } = useApp();
  const qc = useQueryClient();
  const { branchId, setBranchId } = useDeskBranch();

  const [title, setTitle] = useState("");
  const [total, setTotal] = useState("");
  const [nhs, setNhs] = useState("");
  const [error, setError] = useState("");

  const amount = Number(total.replace(/[^0-9.]/g, ""));
  const nhsAmount = nhs.trim() ? Number(nhs.replace(/[^0-9.]/g, "")) : 0;
  const ready = title.trim().length > 0 && amount > 0;
  const earns = Math.floor(Math.max(0, amount - nhsAmount) / 10);

  const save = useMutation({
    mutationFn: () =>
      recordPurchase({
        mobile,
        branchId,
        title: title.trim(),
        total: amount,
        nhs: nhsAmount || undefined,
        // One key per attempt, so a retry after a dropped connection cannot
        // award the same points twice.
        idempotencyKey: `desk-${memberId}-${Date.now()}`,
      }),
    onSuccess: (result) => {
      setTitle("");
      setTotal("");
      setNhs("");
      setError("");
      qc.invalidateQueries({ queryKey: ["staff", "member", memberId] });
      const earned = result.transaction.points;
      const rewards = result.vouchersIssued.length;
      const points = earned === 1 ? "1 point" : `${earned} points`;
      toast(
        rewards > 0
          ? `${points} — and ${rewards === 1 ? "a £10 reward is" : `${rewards} £10 rewards are`} ready`
          : earned > 0
            ? `${points} added`
            : "Recorded. No points: NHS-funded work does not earn.",
      );
    },
    onError: (e) => setError(e instanceof Error ? e.message : "That did not save. Try again."),
  });

  return (
    <Card testID="record-purchase">
      <View style={styles.cardBody}>
        <SectionHeader title="Record a purchase" />
        <Txt variant="caption">
          One point per whole £10 they pay themselves. Put anything the NHS funds in the second box
          so it is left out.
        </Txt>
        <Field
          label="What they bought"
          value={title}
          onChangeText={setTitle}
          placeholder="Frames and lenses"
          autoCapitalize="sentences"
          testID="purchase-title"
        />
        <View style={styles.amounts}>
          <View style={styles.amount}>
            <Field
              label="Total paid"
              value={total}
              onChangeText={setTotal}
              placeholder="0.00"
              prefix="£"
              keyboardType="decimal-pad"
              testID="purchase-total"
            />
          </View>
          <View style={styles.amount}>
            <Field
              label="Of which NHS"
              value={nhs}
              onChangeText={setNhs}
              placeholder="0.00"
              prefix="£"
              keyboardType="decimal-pad"
              testID="purchase-nhs"
            />
          </View>
        </View>
        <View style={styles.block}>
          <Txt variant="label">Branch</Txt>
          <BranchChips value={branchId} onChange={setBranchId} />
        </View>
        {ready ? (
          <Txt variant="caption" tone="teal" testID="purchase-preview">
            Earns {earns === 1 ? "1 point" : `${earns} points`}.
          </Txt>
        ) : null}
        {error ? (
          <Txt variant="caption" tone="error" testID="purchase-error">
            {error}
          </Txt>
        ) : null}
        <BrandButton
          label="Record purchase"
          icon="check"
          onPress={() => save.mutate()}
          disabled={!ready}
          loading={save.isPending}
          testID="purchase-submit"
        />
      </View>
    </Card>
  );
}

function arrivalTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${dayMonthYear(iso.slice(0, 10))}, ${time}`;
}

const useStyles = makeStyles(() => ({
  body: { gap: spacing.lg, paddingTop: spacing.sm },
  cardBody: { gap: spacing.base },
  block: { gap: spacing.sm },
  detail: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  detailLabel: { width: 130 },
  detailValue: { flex: 1 },
  points: { flexDirection: "row", gap: spacing.base },
  pointsBlock: { flex: 1, gap: 2 },
  line: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.md },
  lineText: { flex: 1, gap: 2 },
  lineRight: { alignItems: "flex-end", gap: 2 },
  amounts: { flexDirection: "row", gap: spacing.md },
  amount: { flex: 1 },
}));
