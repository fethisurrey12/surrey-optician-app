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
