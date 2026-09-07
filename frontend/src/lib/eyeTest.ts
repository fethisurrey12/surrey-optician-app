// Eye-test recall, derived purely from the loyalty ledger: the most recent
// "Eye examination" purchase. The app holds no clinical records, so this is a
// reminder about a purchase date, not a clinical recall.
import { type Txn } from "@/src/api/data";
import { daysUntil } from "@/src/lib/points";

export const EYE_TEST_INTERVAL_MONTHS = 24; // NHS guidance for most adults
export const EYE_TEST_NUDGE_DAYS = 60; // start nudging this far before due

export type EyeTestStatus = {
  last: string; // ISO date of the last examination purchase
  due: string; // ISO date two years on
  days: number; // days until due (negative once overdue)
};

function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const out = new Date(y, m - 1 + months, d);
  const mm = String(out.getMonth() + 1).padStart(2, "0");
  const dd = String(out.getDate()).padStart(2, "0");
  return `${out.getFullYear()}-${mm}-${dd}`;
}

// Null when there is no exam on record or it is not yet time to nudge.
export function eyeTestStatus(txns: Txn[]): EyeTestStatus | null {
  const exams = txns.filter((t) => t.category === "exam").map((t) => t.date).sort();
  const last = exams[exams.length - 1];
  if (!last) return null;
  const due = addMonths(last, EYE_TEST_INTERVAL_MONTHS);
  const days = daysUntil(due);
  return days <= EYE_TEST_NUDGE_DAYS ? { last, due, days } : null;
}
