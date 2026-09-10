import { useRef, useState } from "react";
import { TextInput, View } from "react-native";

import { font, radius, spacing } from "@/src/tokens";
import { makeStyles, useTheme } from "@/src/theme";

const LEN = 6;

// One box for the whole code. A single field is easier to fill from an SMS
// autofill or a paste than six separate ones, and it cannot be pushed off a
// narrow screen. The digits are spaced out so the code still reads in pairs.
export function CodeInput({
  onComplete,
  onChange,
  autoFocus = true,
  testID = "code",
}: {
  onComplete?: (code: string) => void;
  onChange?: (code: string) => void;
  autoFocus?: boolean;
  testID?: string;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [code, setCode] = useState("");
  const [focused, setFocused] = useState(false);
  const submitted = useRef(false);

  const handleChange = (text: string) => {
    const clean = text.replace(/\D/g, "").slice(0, LEN);
    setCode(clean);
    onChange?.(clean);

    // Submit once the code is complete, but only once per code: re-rendering
    // must not fire the check again.
    if (clean.length === LEN) {
      if (!submitted.current) {
        submitted.current = true;
        onComplete?.(clean);
      }
    } else {
      submitted.current = false;
    }
  };

  return (
    <View style={styles.wrap}>
      <TextInput
        testID={`${testID}-box-0`}
        value={code}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        keyboardAppearance="light"
        // Lets iOS and Android offer the code straight from the text message.
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={LEN}
        autoFocus={autoFocus}
        selectionColor={colors.teal}
        placeholder="––––––"
        placeholderTextColor={colors.dimSage}
        accessibilityLabel="Six-digit code"
        style={[styles.box, focused && styles.boxActive, code.length === LEN && styles.boxFilled]}
      />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: { width: "100%" },
  box: {
    width: "100%",
    minWidth: 0,
    height: 68,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceTertiary,
    color: colors.ink,
    fontFamily: font.serifLight,
    fontSize: 32,
    // Wide tracking so six digits read in groups rather than as one number.
    letterSpacing: 10,
    textAlign: "center",
    paddingHorizontal: spacing.sm,
  },
  boxActive: { borderColor: colors.teal, backgroundColor: colors.card },
  boxFilled: { borderColor: colors.borderStrong },
}));
