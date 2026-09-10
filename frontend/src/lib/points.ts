// Loyalty scheme maths and formatting helpers. One job each.

export const POINTS_PER_REWARD = 10;
export const SPEND_PER_POINT = 10; // £10 of eligible private spend = 1 point

// 1 point per whole £10 of the private balance the customer actually pays.
// NHS-funded amounts earn nothing. Round down.
export function pointsForSpend(privatePaid: number): number {
  return Math.floor(privatePaid / SPEND_PER_POINT);
}

// Points still needed before the next £10 reward converts automatically.
export function pointsToNextReward(points: number): number {
  const within = points % POINTS_PER_REWARD;
  return within === 0 ? POINTS_PER_REWARD : POINTS_PER_REWARD - within;
}

export function ringProgress(points: number): number {
  const within = points % POINTS_PER_REWARD;
  return within / POINTS_PER_REWARD;
}

// Vouchers within this many days of expiry get a gentle nudge.
export const EXPIRY_WARN_DAYS = 60;

// Whole days from today until the calendar date (negative once passed).
export function daysUntil(iso: string): number {
  const target = parse(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function expiresSoon(iso: string): boolean {
  const d = daysUntil(iso);
  return d >= 0 && d <= EXPIRY_WARN_DAYS;
}

// "expires in 41 days" / "expires tomorrow" / "expires today"
export function expiresInText(iso: string): string {
  const d = daysUntil(iso);
  if (d <= 0) return "expires today";
  if (d === 1) return "expires tomorrow";
  return `expires in ${d} days`;
}

// £ formatting — no pence when whole, two places otherwise.
export function money(n: number): string {
  return Number.isInteger(n) ? `£${n}` : `£${n.toFixed(2)}`;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function parse(iso: string): Date {
  // Treat as a plain calendar date to avoid timezone drift.
  const [y, m, d] = iso.split("T")[0].split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function dayMonthYear(iso: string): string {
  const d = parse(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function shortDate(iso: string): string {
  const d = parse(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}

export function monthYear(iso: string): string {
  const d = parse(iso);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// Group by month, newest first (input assumed sorted newest-first).
export function groupByMonth<T extends { date: string }>(
  items: T[],
): { key: string; label: string; items: T[] }[] {
  const out: { key: string; label: string; items: T[] }[] = [];
  for (const item of items) {
    const label = monthYear(item.date);
    const last = out[out.length - 1];
    if (last && last.label === label) last.items.push(item);
    else out.push({ key: label, label, items: [item] });
  }
  return out;
}


// How a voucher is written wherever it appears: "£10" for a reward, "20% off"
// for the welcome voucher a member gets when they first sign up. One helper so
// the two kinds cannot drift apart across the screens.
export function voucherLabel(v: { value?: number; percentOff?: number }): string {
  if (v.percentOff) return `${v.percentOff}% off`;
  return money(v.value ?? 0);
}

// The longer form, for headings and sheets.
export function voucherHeadline(v: { value?: number; percentOff?: number }): string {
  if (v.percentOff) return `${v.percentOff}% off`;
  return `${money(v.value ?? 0)} reward`;
}


// "Towards glasses" for a restricted voucher, empty for one that can be spent
// on anything. Kept beside voucherLabel so the wording stays in one place.
export function voucherRestriction(v: { appliesTo?: string }): string {
  const to = (v.appliesTo ?? "any").toLowerCase();
  if (!to || to === "any") return "";
  return `Towards ${to}`;
}
