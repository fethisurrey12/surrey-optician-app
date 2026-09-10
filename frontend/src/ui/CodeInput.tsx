import { useRef, useState } from "react";
import {
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
  TextInput,
  View,
} from "react-native";

import { font, radius, spacing } from "@/src/tokens";
import { makeStyles, useTheme } from "@/src/theme";

const LEN = 6;

// Six separate digit boxes with auto-advance and backspace navigation.
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
  const [digits, setDigits] = useState<string[]>(Array(LEN).fill(""));
  const [focused, setFocused] = useState(0);
  const refs = useRef<(TextInput | null)[]>([]);

  const commit = (next: string[]) => {
    setDigits(next);
    const code = next.join("");
    onChange?.(code);
    if (code.length === LEN && next.every((d) => d !== "")) onComplete?.(code);
  };

  const handleChange = (i: number, text: string) => {
    const clean = text.replace(/\D/g, "");
    if (clean.length > 1) {
      // Pasted / fast typed — distribute across boxes.
      const next = [...digits];
      for (let k = 0; k < clean.length && i + k < LEN; k++) next[i + k] = clean[k];
      commit(next);
      const last = Math.min(i + clean.length, LEN - 1);
      refs.current[last]?.focus();
      return;
    }
    const next = [...digits];
    next[i] = clean;
    commit(next);
    if (clean && i < LEN - 1) refs.current[i + 1]?.focus();
  };

  const handleKey = (i: number, e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.nativeEvent.key === "Backspace" && !digits[i] && i > 0) {
      const next = [...digits];
      next[i - 1] = "";
      commit(next);
      refs.current[i - 1]?.focus();
    }
  };

  return (
    <View style={styles.row}>
      {digits.map((d, i) => (
        <TextInput
          key={i}
          testID={`${testID}-box-${i}`}
          ref={(r) => {
            refs.current[i] = r;
          }}
          value={d}
          onChangeText={(t) => handleChange(i, t)}
          onKeyPress={(e) => handleKey(i, e)}
          onFocus={() => setFocused(i)}
          keyboardType="number-pad"
          keyboardAppearance="dark"
          maxLength={i === 0 ? LEN : 1}
          autoFocus={autoFocus && i === 0}
          selectionColor={colors.teal}
          style={[styles.box, focused === i && styles.boxActive, d ? styles.boxFilled : null]}
        />
      ))}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  row: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  box: {
    flex: 1,
    height: 62,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceTertiary,
    color: colors.ink,
    fontFamily: font.serifLight,
    fontSize: 26,
    textAlign: "center",
  },
  boxActive: { borderColor: colors.teal, backgroundColor: colors.card },
  boxFilled: { borderColor: colors.borderStrong },
}));
