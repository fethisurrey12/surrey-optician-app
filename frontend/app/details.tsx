import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { type Account } from "@/src/api/data";
import { BRANCHES } from "@/src/api/data";
import { useAccount, useUpdateAccount } from "@/src/api/hooks";
import { useApp } from "@/src/context/AppContext";
import { radius, spacing } from "@/src/tokens";
import { makeStyles } from "@/src/theme";
import { DateField, digitsToIso } from "@/src/ui/DateField";
import { Field } from "@/src/ui/Field";
import { BrandButton } from "@/src/ui/BrandButton";
import { HeaderBar } from "@/src/ui/HeaderBar";
import { PressScale } from "@/src/ui/PressScale";
import { Screen } from "@/src/ui/Screen";
import { Skeleton } from "@/src/ui/Skeleton";
import { Txt } from "@/src/ui/Txt";

/** "1984-07-19" -> "19071984", so a saved date shows in the field. */
function isoToDigits(iso: string | null | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? "");
  return m ? `${m[3]}${m[2]}${m[1]}` : "";
}

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
  const [dob, setDob] = useState(isoToDigits(a.dateOfBirth));
  const [address, setAddress] = useState(a.address ?? "");
  const [postcode, setPostcode] = useState(a.postcode ?? "");
  const [branch, setBranch] = useState(a.homeBranchId);

  const dobOk = dob.length === 0 || digitsToIso(dob) !== "";

  const onSave = async () => {
    try {
      await save.mutateAsync({
        firstName,
        lastName,
        email,
        dateOfBirth: digitsToIso(dob) || undefined,
        address,
        postcode,
        homeBranchId: branch,
      });
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

        <DateField
          digits={dob}
          onChangeDigits={setDob}
          note="Used to size frames and to wish you a happy birthday."
          testID="details-dob"
        />
        <Field
          label="Address"
          value={address}
          onChangeText={setAddress}
          autoCapitalize="words"
          placeholder="House and street"
          testID="details-address"
        />
        <Field
          label="Postcode"
          value={postcode}
          onChangeText={setPostcode}
          autoCapitalize="characters"
          placeholder="CR5 2NJ"
          maxLength={12}
          testID="details-postcode"
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

        <BrandButton
          label={save.isPending ? "Saving…" : "Save changes"}
          onPress={onSave}
          disabled={save.isPending || !dobOk}
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
  branchChipOn: { backgroundColor: colors.teal, borderColor: colors.teal },
  save: { marginTop: spacing.sm },
}));
