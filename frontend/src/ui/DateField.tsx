import { Field } from "@/src/ui/Field";

// A date of birth, typed as DD MM YYYY and held as ISO yyyy-mm-dd.
//
// A wheel picker is a poor fit here: a member entering 1956 would spin through
// seventy years of it. Typing eight digits is quicker, and the separators are
// inserted as they go so the shape of the date stays obvious.

/** "19071984" -> "19 / 07 / 1984" */
function display(iso: string, draft: string): string {
  const digits = draft || isoToDigits(iso);
  const d = digits.slice(0, 2);
  const m = digits.slice(2, 4);
  const y = digits.slice(4, 8);
  return [d, m, y].filter(Boolean).join(" / ");
}

function isoToDigits(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}${m[2]}${m[1]}` : "";
}

/** Eight digits become an ISO date, but only if they describe a real one. */
export function digitsToIso(digits: string): string {
  if (digits.length !== 8) return "";
  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4, 8));
  if (month < 1 || month > 12 || day < 1) return "";

  // Rejects 31 April and 29 February in a common year.
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return "";
  }
  if (date.getTime() > Date.now()) return "";
  if (year < new Date().getUTCFullYear() - 120) return "";

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function DateField({
  label = "Date of birth",
  digits,
  onChangeDigits,
  note,
  testID,
}: {
  label?: string;
  /** Up to eight raw digits, DDMMYYYY. */
  digits: string;
  onChangeDigits: (digits: string) => void;
  note?: string;
  testID?: string;
}) {
  const complete = digits.length === 8;
  const valid = !complete || digitsToIso(digits) !== "";

  return (
    <Field
      label={label}
      value={display("", digits)}
      onChangeText={(t) => onChangeDigits(t.replace(/\D/g, "").slice(0, 8))}
      placeholder="DD / MM / YYYY"
      keyboardType="number-pad"
      maxLength={14}
      note={valid ? note : "Please check that date."}
      testID={testID}
    />
  );
}
