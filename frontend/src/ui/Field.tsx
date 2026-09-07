import { forwardRef } from "react";
import { TextInput, View, type KeyboardTypeOptions, type TextInputProps } from "react-native";

import { Txt } from "@/src/ui/Txt";
import { font, radius, spacing } from "@/src/tokens";
import { makeStyles, useTheme } from "@/src/theme";

type Props = {
  label: string;
  value: string;
  onChangeText?: (t: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: TextInputProps["autoCapitalize"];
  editable?: boolean;
  note?: string;
  prefix?: string;
  maxLength?: number;
  testID?: string;
  returnKeyType?: TextInputProps["returnKeyType"];
  onSubmitEditing?: () => void;
  autoFocus?: boolean;
  keyboardAppearance?: TextInputProps["keyboardAppearance"];
};

export const Field = forwardRef<TextInput, Props>(function Field(
  {
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType,
    autoCapitalize = "none",
    editable = true,
    note,
    prefix,
    maxLength,
    testID,
    returnKeyType,
    onSubmitEditing,
    autoFocus,
    keyboardAppearance,
  },
  ref,
) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <Txt variant="label">{label}</Txt>
      <View style={[styles.field, !editable && styles.disabled]}>
        {prefix ? (
          <Txt variant="bodyStrong" tone="sage" style={styles.prefix}>
            {prefix}
          </Txt>
        ) : null}
        <TextInput
          ref={ref}
          testID={testID}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.dimSage}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
          maxLength={maxLength}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          autoFocus={autoFocus}
          keyboardAppearance={keyboardAppearance ?? "dark"}
          selectionColor={colors.gold}
        />
      </View>
      {note ? (
        <Txt variant="caption" style={styles.note}>
          {note}
        </Txt>
      ) : null}
    </View>
  );
});

const useStyles = makeStyles((colors) => ({
  wrap: { gap: spacing.sm },
  field: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 54,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceTertiary,
    paddingHorizontal: spacing.base,
  },
  disabled: { opacity: 0.7 },
  prefix: { marginRight: spacing.sm },
  input: {
    flex: 1,
    color: colors.cream,
    fontFamily: font.regular,
    fontSize: 16,
    paddingVertical: spacing.md,
  },
  note: { marginTop: 2 },
}));
