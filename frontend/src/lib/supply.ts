// Contact-lens reorder prompt, derived purely from the loyalty ledger: the most
// recent lens purchase plus the months of supply it covered. No clinical data.
import { type Txn } from "@/src/api/data";
import { daysUntil } from "@/src/lib/points";

export const LENS_NUDGE_DAYS = 14; // start prompting this far before the supply runs out
export const LENS_NUDGE_GRACE_DAYS = 60; // stop prompting this long after (they've reordered elsewhere)

export type LensSupplyStatus = {
  last: string; // ISO date of the purchase
  runsOut: string; // ISO date the supply is expected to run out
  days: number; // days until then (negative once run out)
  months: number; // supply length
  branchId: string; // where it was bought — the natural place to reorder
};

function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const out = new Date(y, m - 1 + months, d);
  const mm = String(out.getMonth() + 1).padStart(2, "0");
  const dd = String(out.getDate()).padStart(2, "0");
  return `${out.getFullYear()}-${mm}-${dd}`;
}

export function lensSupplyStatus(txns: Txn[]): LensSupplyStatus | null {
  const lenses = txns
    .filter((t) => t.category === "lenses" && t.supplyMonths)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const last = lenses[0];
  if (!last) return null;
  const runsOut = addMonths(last.date, last.supplyMonths!);
  const days = daysUntil(runsOut);
  if (days > LENS_NUDGE_DAYS || days < -LENS_NUDGE_GRACE_DAYS) return null;
  return { last: last.date, runsOut, days, months: last.supplyMonths!, branchId: last.branchId };
}
