import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { type Account } from "@/src/api/data";
import { BRANCHES } from "@/src/api/data";
import { useAccount, useUpdateAccount } from "@/src/api/hooks";
import { useApp } from "@/src/context/AppContext";
import { radius, spacing } from "@/src/tokens";
import { makeStyles } from "@/src/theme";
import { Field } from "@/src/ui/Field";
import { GoldButton } from "@/src/ui/GoldButton";
import { HeaderBar } from "@/src/ui/HeaderBar";
import { PressScale } from "@/src/ui/PressScale";
import { Screen } from "@/src/ui/Screen";
import { Skeleton } from "@/src/ui/Skeleton";
import { Txt } from "@/src/ui/Txt";

export default function Details() {
  const { data: account } = useAccount();

  // The form seeds its fields from the account, so it is only mounted once the
  // account is there. Rendering it early would leave every field blank and let
  // a save overwrite the member's real details with nothing.
  if (!account) {
    return (
      <Screen header={<HeaderBar title="Your details" />} testID="details-screen">
        <View style={detailsLoadingStyle}>
          <Skeleton height={64} />
          <Skeleton height={64} />
          <Skeleton height={64} />
        </View>
      </Screen>
    );
  }
  return <DetailsForm account={account} />;
}

const detailsLoadingStyle = { gap: spacing.md, paddingTop: spacing.md } as const;

function DetailsForm({ account: a }: { account: Account }) {
  const styles = useStyles();
  const router = useRouter();
  const { toast } = useApp();
  const save = useUpdateAccount();

  const [firstName, setFirstName] = useState(a.firstName);
  const [lastName, setLastName] = useState(a.lastName);
  const [email, setEmail] = useState(a.email);
  const [branch, setBranch] = useState(a.homeBranchId);

  const onSave = async () => {
    try {
      await save.mutateAsync({ firstName, lastName, email, homeBranchId: branch });
      toast("Your details are saved");
      router.back();
    } catch (e) {
      toast(e instanceof Error ? e.message : "We could not save your details.");
    }
  };

  return (
    <Screen header={<HeaderBar title="Your details" />} keyboardAware bottomOffset={90} testID="details-screen">
      <View style={styles.body}>
        <Field label="First name" value={firstName} onChangeText={setFirstName} autoCapitalize="words" testID="details-first-name" />
        <Field label="Last name" value={lastName} onChangeText={setLastName} autoCapitalize="words" testID="details-last-name" />
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          placeholder="you@example.com"
          testID="details-email"
        />

        <View style={styles.branchBlock}>
          <Txt variant="label">Home branch</Txt>
          <View style={styles.branchRow}>
            {BRANCHES.map((b) => {
              const on = b.id === branch;
              return (
                <PressScale
                  key={b.id}
                  onPress={() => setBranch(b.id)}
                  style={[styles.branchChip, on && styles.branchChipOn]}
                  testID={`branch-option-${b.id}`}
                >
                  <Txt variant="label" tone={on ? "ink" : "sage"}>
                    {b.name}
                  </Txt>
                </PressScale>
              );
            })}
          </View>
        </View>

        <Field
          label="Mobile number"
          value={a.mobileDisplay}
          editable={false}
          note="Your mobile changes in branch with ID. It is the key used to find your points at the till."
          testID="details-mobile"
        />

        <GoldButton
          label={save.isPending ? "Saving…" : "Save changes"}
          onPress={onSave}
          disabled={save.isPending}
          testID="details-save-button"
          style={styles.save}
        />
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  body: { gap: spacing.lg, paddingTop: spacing.sm },
  branchBlock: { gap: spacing.sm },
  branchRow: { flexDirection: "row", gap: spacing.sm },
  branchChip: {
    flex: 1,
    height: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  branchChipOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  save: { marginTop: spacing.sm },
}));
