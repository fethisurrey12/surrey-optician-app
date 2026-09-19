// Sample data behind the desk view, for when no backend is configured.
//
// It follows the same rules as the server — the same search matching, the same
// point arithmetic, the same one-year voucher term — so what a colleague sees
// while trying the prototype is what they will see in the practice.

import { ApiError } from "./client";
import { ACCOUNT, TXNS, VOUCHERS, type Account, type Txn, type Voucher } from "./data";
import { POINTS_PER_REWARD, pointsForSpend } from "@/src/lib/points";
import type {
  PurchaseInput,
  PurchaseResult,
  StaffMemberDetail,
  StaffMemberRow,
} from "./staff";

type Record_ = {
  id: string;
  account: Account;
  vouchers: Voucher[];
  activity: Txn[];
};

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

const today = () => iso(new Date());

function inAYear(from: string): string {
  const [y, m, d] = from.split("-").map(Number);
  return iso(new Date(y + 1, m - 1, d));
}

function person(
  id: string,
  firstName: string,
  lastName: string,
  mobile: string,
  email: string,
  homeBranchId: string,
  points: number,
  totalEarned: number,
  memberSince: string,
): Record_ {
  return {
    id,
    account: {
      id: mobile,
      mobile,
      mobileDisplay: mobile.replace(/^\+44(\d{4})(\d+)$/, "+44 $1 $2"),
      firstName,
      lastName,
      email,
      homeBranchId,
      memberSince,
      points,
      totalEarned,
      referralCode: `${firstName.toUpperCase()}-${mobile.slice(-4)}`,
    },
    vouchers: [],
    activity: [],
  };
}

// Sarah is the account the patient-facing screens show, so the desk and the app
// are looking at the same person.
const sarah: Record_ = {
  id: "m-sarah",
  account: { ...ACCOUNT },
  vouchers: VOUCHERS.map((v) => ({ ...v })),
  activity: TXNS.map((t) => ({ ...t })),
};

const directory: Record_[] = [
  sarah,
  person(
    "m-daniel",
    "Daniel",
    "Okafor",
    "+447700900311",
    "d.okafor@example.com",
    "wallington",
    3,
    23,
    "2025-02-11",
  ),
  person(
    "m-priya",
    "Priya",
    "Nair",
    "+447700900412",
    "priya.nair@example.com",
    "banstead",
    0,
    0,
    "2026-05-28",
  ),
  person(
    "m-margaret",
    "Margaret",
    "Hall",
    "+447700900523",
    "m.hall@example.com",
    "wallington-green",
    9,
    49,
    "2024-09-02",
  ),
];

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function digitsOf(query: string): string {
  let digits = query.replace(/\D/g, "");
  if (digits.startsWith("44")) digits = digits.slice(2);
  return digits.replace(/^0+/, "");
}

function matches(record: Record_, query: string): boolean {
  const a = record.account;
  const words = query.trim().split(/\s+/).filter(Boolean);
  const lower = (s: string) => s.toLowerCase();

  const digits = digitsOf(query);
  if (digits.length >= 3 && a.mobile.endsWith(digits)) return true;

  if (!words.length) return false;
  const first = lower(words[0]);
  const startsWith = (field: string) => !!field && lower(field).startsWith(first);

  if (words.length > 1) {
    if (startsWith(a.firstName) && lower(a.lastName).startsWith(lower(words[1]))) return true;
  }
  return startsWith(a.firstName) || startsWith(a.lastName) || startsWith(a.email);
}

function row(record: Record_): StaffMemberRow {
  const a = record.account;
  return {
    id: record.id,
    firstName: a.firstName,
    lastName: a.lastName,
    mobileDisplay: a.mobileDisplay,
    homeBranchId: a.homeBranchId,
    memberSince: a.memberSince,
    points: a.points,
    totalEarned: a.totalEarned,
  };
}

export async function searchMembers(q: string): Promise<StaffMemberRow[]> {
  await delay(180);
  const query = q.trim();
  if (query.length < 2) return [];
  return directory
    .filter((r) => matches(r, query))
    .sort((x, y) => x.account.firstName.localeCompare(y.account.firstName))
    .map(row);
}

export async function memberDetail(id: string): Promise<StaffMemberDetail> {
  await delay(220);
  const found = directory.find((r) => r.id === id);
  if (!found) throw new ApiError(404, "Account not found");
  return {
    account: { ...found.account },
    vouchers: found.vouchers.map((v) => ({ ...v })),
    activity: found.activity.map((t) => ({ ...t })),
  };
}

export async function recordPurchase(input: PurchaseInput): Promise<PurchaseResult> {
  await delay(420);
  const record = directory.find((r) => r.account.mobile === input.mobile);
  if (!record) throw new ApiError(404, "Account not found");

  const nhs = input.nhs ?? 0;
  if (nhs > input.total) {
    throw new ApiError(422, "The NHS contribution cannot be more than the total");
  }

  const points = pointsForSpend(Math.max(0, input.total - nhs));
  const previousTotal = record.account.totalEarned;
  const newTotal = previousTotal + points;
  const date = today();

  const txn: Txn = {
    id: `t-${Math.random().toString(36).slice(2, 10)}`,
    date,
    branchId: input.branchId,
    kind: "spend",
    category: input.category,
    supplyMonths: input.supplyMonths,
    title: input.title,
    detail: input.detail,
    total: input.total,
    nhs: nhs || undefined,
    points,
  };
  record.activity = [txn, ...record.activity];

  // One voucher per reward threshold this purchase crossed — the same rule the
  // server applies, so a £200 spend cannot quietly drop a reward.
  const crossed =
    Math.floor(newTotal / POINTS_PER_REWARD) - Math.floor(previousTotal / POINTS_PER_REWARD);
  const issued: Voucher[] = [];
  for (let i = 0; i < crossed; i += 1) {
    const voucher: Voucher = {
      id: `v-${Math.random().toString(36).slice(2, 10)}`,
      code: `SO-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random()
        .toString(36)
        .slice(2, 6)
        .toUpperCase()}`,
      kind: "reward",
      value: 10,
      appliesTo: "any",
      issued: date,
      expires: inAYear(date),
      status: "available",
    };
    issued.push(voucher);
    record.vouchers = [voucher, ...record.vouchers];
    record.activity = [
      {
        id: `t-${Math.random().toString(36).slice(2, 10)}`,
        date,
        branchId: input.branchId,
        kind: "reward",
        title: "£10 reward unlocked",
        detail: "Added to their wallet",
        total: 0,
        points: 0,
      },
      ...record.activity,
    ];
  }

  record.account = {
    ...record.account,
    totalEarned: newTotal,
    // The balance is derived from lifetime earnings, never accumulated
    // separately, so it cannot drift out of step with the vouchers issued.
    points: newTotal % POINTS_PER_REWARD,
  };

  return {
    transaction: txn,
    account: { ...record.account },
    vouchersIssued: issued,
  };
}
