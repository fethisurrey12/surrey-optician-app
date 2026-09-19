import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";

import { branchName } from "@/src/api/data";
import {
  checkStaffKey,
  loadStaffKey,
  searchMembers,
  setStaffKey,
  staffKeyRequired,
} from "@/src/api/staff";
import { BranchChips } from "@/src/components/BranchChips";
import { useDeskBranch } from "@/src/lib/desk";
import { makeStyles } from "@/src/theme";
import { spacing } from "@/src/tokens";
import { BrandButton } from "@/src/ui/BrandButton";
import { Card } from "@/src/ui/Card";
import { Divider } from "@/src/ui/Divider";
import { Field } from "@/src/ui/Field";
import { GhostButton } from "@/src/ui/GhostButton";
import { LogoMark } from "@/src/ui/LogoMark";
import { PressScale } from "@/src/ui/PressScale";
import { Screen } from "@/src/ui/Screen";
import { SectionHeader } from "@/src/ui/SectionHeader";
import { Skeleton } from "@/src/ui/Skeleton";
import { Txt } from "@/src/ui/Txt";

// The desk. A colleague checks a patient in from their QR and finds anyone's
// record; the patient does not need to be signed in on this device, and nothing
// here uses their session. Reached at /staff.
export default function Desk() {
  const styles = useStyles();
  const router = useRouter();
  const { branchId, setBranchId } = useDeskBranch();

  const [unlocked, setUnlocked] = useState(!staffKeyRequired);
  const [checking, setChecking] = useState(staffKeyRequired);

  useEffect(() => {
    if (!staffKeyRequired) return;
    (async () => {
      const saved = await loadStaffKey();
      setUnlocked(!!saved && (await checkStaffKey(saved)));
      setChecking(false);
    })();
  }, []);

  if (checking) {
    return (
      <Screen testID="desk-loading">
        <Skeleton height={120} />
      </Screen>
    );
  }

  if (!unlocked) return <KeyGate onUnlocked={() => setUnlocked(true)} />;

  return (
    <Screen
      keyboardAware
      testID="desk-screen"
      header={
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Txt variant="h3">Practice desk</Txt>
            <Txt variant="caption">Surrey People · {branchName(branchId)}</Txt>
          </View>
          <LogoMark height={30} />
        </View>
      }
    >
      <View style={styles.body}>
        <View style={styles.block}>
          <Txt variant="label">You are at</Txt>
          <BranchChips value={branchId} onChange={setBranchId} testID="desk-branches" />
        </View>

        <Search onOpen={(id) => router.push(`/staff/${id}`)} />

        {staffKeyRequired ? (
          <GhostButton
            label="Lock the desk"
            icon="lock"
            tone="sage"
            testID="desk-lock"
            onPress={async () => {
              await setStaffKey(null);
              setUnlocked(false);
            }}
          />
        ) : (
          <Txt variant="caption" style={styles.note}>
            Sample data — this device has no practice server configured, so nothing recorded here
            is real.
          </Txt>
        )}
      </View>
    </Screen>
  );
}

// --- The key ---------------------------------------------------------------
function KeyGate({ onUnlocked }: { onUnlocked: () => void }) {
  const styles = useStyles();
  const router = useRouter();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!value.trim() || busy) return;
    setBusy(true);
    setError("");
    const ok = await checkStaffKey(value.trim());
    if (ok) {
      await setStaffKey(value.trim());
      onUnlocked();
    } else {
      setError("That key was not recognised. Check it with the practice manager.");
    }
    setBusy(false);
  };

  return (
    <Screen keyboardAware center scroll={false} testID="desk-key-screen">
      <View style={styles.gate}>
        <LogoMark height={44} style={styles.gateLogo} />
        <Txt variant="h2" style={styles.center}>
          Practice desk
        </Txt>
        <Txt variant="body" style={styles.center}>
          This is the colleague&apos;s side of Surrey People. Enter the practice key to open it.
        </Txt>
        <Field
          label="Practice key"
          value={value}
          onChangeText={setValue}
          placeholder="•••••••••"
          testID="desk-key-field"
          returnKeyType="go"
          onSubmitEditing={submit}
          autoFocus
        />
        {error ? (
          <Txt variant="caption" tone="error" testID="desk-key-error">
            {error}
          </Txt>
        ) : null}
        <BrandButton label="Open the desk" icon="lock" onPress={submit} loading={busy} testID="desk-key-submit" />
        <GhostButton
          label="Back to the app"
          tone="sage"
          onPress={() => router.replace("/")}
          testID="desk-key-back"
        />
      </View>
    </Screen>
  );
}

// --- Finding a patient -----------------------------------------------------
function Search({ onOpen }: { onOpen: (id: string) => void }) {
  const styles = useStyles();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 220);
    return () => clearTimeout(t);
  }, [query]);

  const enabled = debounced.length >= 2;
  const results = useQuery({
    queryKey: ["staff", "search", debounced],
    queryFn: () => searchMembers(debounced),
    enabled,
  });

  const rows = useMemo(() => results.data ?? [], [results.data]);

  return (
    <Card testID="desk-search">
      <View style={styles.cardBody}>
        <SectionHeader title="Find a patient" />
        <Field
          label="Name, number or email"
          value={query}
          onChangeText={setQuery}
          placeholder="Sarah, Whitfield, 900123…"
          testID="desk-search-field"
        />

        {!enabled ? (
          <Txt variant="caption">Type at least two characters.</Txt>
        ) : results.isPending ? (
          <Skeleton height={60} />
        ) : rows.length === 0 ? (
          <Txt variant="caption" testID="desk-search-none">
            Nobody matches that. They may not have joined Surrey People yet — a record is created
            the first time a purchase is recorded against their number.
          </Txt>
        ) : (
          <View style={styles.results}>
            {rows.map((m, i) => (
              <View key={m.id}>
                {i > 0 ? <Divider /> : null}
                <PressScale
                  onPress={() => onOpen(m.id)}
                  accessibilityLabel={`${m.firstName} ${m.lastName}`}
                  testID={`desk-result-${m.id}`}
                  style={styles.result}
                >
                  <View style={styles.resultText}>
                    <Txt variant="bodyStrong" tone="ink">
                      {m.firstName || m.lastName ? `${m.firstName} ${m.lastName}`.trim() : "No name yet"}
                    </Txt>
                    <Txt variant="caption">
                      {m.mobileDisplay} · {branchName(m.homeBranchId)}
                    </Txt>
                  </View>
                  <Txt variant="caption" tone="teal" tabular>
                    {m.points} pts
                  </Txt>
                </PressScale>
              </View>
            ))}
          </View>
        )}
      </View>
    </Card>
  );
}

const useStyles = makeStyles((colors) => ({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  headerText: { gap: 2, flex: 1, minWidth: 0 },
  body: { gap: spacing.lg, paddingTop: spacing.sm },
  block: { gap: spacing.sm },
  cardBody: { gap: spacing.base },
  center: { textAlign: "center" },
  gate: { gap: spacing.base },
  gateLogo: { alignSelf: "center", marginBottom: spacing.sm },
  note: { textAlign: "center" },
  results: { gap: 0 },
  result: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.md },
  resultText: { flex: 1, gap: 2 },
}));
