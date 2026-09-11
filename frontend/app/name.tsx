import { useState } from "react";
import { View } from "react-native";

import { BRANCHES } from "@/src/api/data";
import { useUpdateAccount } from "@/src/api/hooks";
import { useApp } from "@/src/context/AppContext";
import { makeStyles } from "@/src/theme";
import { radius, spacing } from "@/src/tokens";
import { BrandButton } from "@/src/ui/BrandButton";
import { DateField, digitsToIso } from "@/src/ui/DateField";
import { Field } from "@/src/ui/Field";
import { GhostButton } from "@/src/ui/GhostButton";
import { PressScale } from "@/src/ui/PressScale";
import { Screen } from "@/src/ui/Screen";
import { StaggerItem } from "@/src/ui/Stagger";
import { Txt } from "@/src/ui/Txt";

// Shown once, after a member signs in without a name on their record — either
// they have just joined, or the till created it before they opened the app.
// Without this their membership card is blank and their referral code has no
// name in it for a friend to recognise.
export default function NameStep() {
  const styles = useStyles();
  const { finishNameStep, toast } = useApp();
  const save = useUpdateAccount();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [postcode, setPostcode] = useState("");
  const [branch, setBranch] = useState("coulsdon");

  // Only the name is required; the rest can be filled in later under Account,
  // so nobody is stopped at the door for want of a postcode.
  const ready = firstName.trim().length > 1 && (dob.length === 0 || digitsToIso(dob) !== "");

  const onSave = async () => {
    try {
      await save.mutateAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
        dateOfBirth: digitsToIso(dob) || undefined,
        postcode: postcode.trim() || undefined,
        homeBranchId: branch,
      });
      finishNameStep();
    } catch (e) {
      toast(e instanceof Error ? e.message : "We could not save that. Please try again.");
    }
  };

  return (
    <Screen keyboardAware bottomOffset={90} testID="name-screen">
      <View style={styles.body}>
        <StaggerItem index={0}>
          <Txt variant="h1">Welcome to the scheme</Txt>
          <Txt variant="body" style={styles.lead}>
            The same details the practice asks for in branch. Only your name is needed now —
            the rest can wait.
          </Txt>
        </StaggerItem>

        <StaggerItem index={1}>
          <Field
            label="First name"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
            testID="name-first"
          />
          <Field
            label="Last name"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
            testID="name-last"
          />
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholder="you@example.com"
            testID="name-email"
          />
          <DateField
            digits={dob}
            onChangeDigits={setDob}
            note="So the practice can size frames and wish you a happy birthday."
            testID="name-dob"
          />
          <Field
            label="Postcode"
            value={postcode}
            onChangeText={setPostcode}
            autoCapitalize="characters"
            placeholder="CR5 2NJ"
            maxLength={12}
            testID="name-postcode"
          />
        </StaggerItem>

        <StaggerItem index={2}>
          <View style={styles.branchBlock}>
            <Txt variant="label">Home branch</Txt>
            <View style={styles.branchRow}>
              {BRANCHES.map((b) => {
                const on = b.id === branch;
                return (
                  <PressScale
                    key={b.id}
                    onPress={() => setBranch(b.id)}
                    style={[styles.chip, on && styles.chipOn]}
                    testID={`name-branch-${b.id}`}
                  >
                    <Txt variant="label" tone={on ? "paper" : "sage"}>
                      {b.name}
                    </Txt>
                  </PressScale>
                );
              })}
            </View>
          </View>
        </StaggerItem>
      </View>

      <StaggerItem index={3} style={styles.actions}>
        <BrandButton
          label={save.isPending ? "Saving…" : "Continue"}
          onPress={onSave}
          disabled={!ready || save.isPending}
          testID="name-continue"
        />
        <GhostButton label="Skip for now" onPress={finishNameStep} testID="name-skip" />
      </StaggerItem>
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  body: { gap: spacing.lg, paddingTop: spacing.xl },
  lead: { marginTop: spacing.sm, maxWidth: 340 },
  branchBlock: { gap: spacing.sm },
  branchRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceTertiary,
  },
  chipOn: { backgroundColor: colors.teal, borderColor: colors.teal },
  actions: { gap: spacing.sm, paddingBottom: spacing.sm },
}));
