// The desk's side of the counter.
//
// These endpoints authenticate with the practice's own key in an X-Staff-Key
// header, not with a patient's bearer token, so a colleague can look someone up
// without that patient being signed in on the device. The key is held in secure
// storage on the desk's device and never travels through a patient screen.
//
// With no backend configured everything here falls back to ./staffDemo so the
// desk view can still be shown and tried on sample data.

import type { Account, Txn, Voucher } from "./data";
import { hasBackend, request } from "./client";
import * as demo from "./staffDemo";
import { storage } from "@/src/utils/storage";

export const STAFF_KEY = "surrey.staff.key";

export type StaffMemberRow = {
  id: string;
  firstName: string;
  lastName: string;
  mobileDisplay: string;
  memberCode: string;
  homeBranchId: string;
  memberSince: string;
  points: number;
  totalEarned: number;
};

export type StaffCheckIn = { id: string; at: string; branchId: string };

export type StaffMemberDetail = {
  account: Account;
  vouchers: Voucher[];
  activity: Txn[];
  checkIns: StaffCheckIn[];
};

export type CheckInResult = {
  checkIn: StaffCheckIn;
  // So the desk can open the record straight after scanning them in.
  memberId: string;
  firstName: string;
  lastName: string;
  mobileDisplay: string;
  memberCode: string;
  homeBranchId: string;
  vouchersAvailable: number;
};

export type PurchaseResult = {
  transaction: Txn;
  account: Account;
  vouchersIssued: Voucher[];
};

export type PurchaseInput = {
  mobile: string;
  branchId: string;
  title: string;
  total: number;
  nhs?: number;
  detail?: string;
  category?: "exam" | "lenses";
  supplyMonths?: number;
  idempotencyKey?: string;
};

// Without a server there is no key to check, so the desk opens straight onto
// sample data and says so on screen.
export const staffKeyRequired = hasBackend;

let key: string | null = null;
let loaded = false;

export async function loadStaffKey(): Promise<string | null> {
  if (!loaded) {
    key = await storage.secureGet<string | null>(STAFF_KEY, null);
    loaded = true;
  }
  return key;
}

export async function setStaffKey(next: string | null): Promise<void> {
  key = next;
  loaded = true;
  if (next) await storage.secureSet(STAFF_KEY, next);
  else await storage.secureRemove(STAFF_KEY);
}

async function headers(): Promise<Record<string, string>> {
  return { "X-Staff-Key": (await loadStaffKey()) ?? "" };
}

async function deskRequest<T>(path: string, options: { method?: "GET" | "POST"; body?: unknown } = {}) {
  return request<T>(path, { ...options, auth: false, headers: await headers() });
}

/** True if the key opens the desk. Called once, on the key screen. */
export async function checkStaffKey(candidate: string): Promise<boolean> {
  if (!hasBackend) return true;
  try {
    await request<{ ok: boolean }>("/api/staff/session", {
      auth: false,
      headers: { "X-Staff-Key": candidate },
    });
    return true;
  } catch {
    return false;
  }
}

export async function searchMembers(q: string): Promise<StaffMemberRow[]> {
  if (!hasBackend) return demo.searchMembers(q);
  const query = encodeURIComponent(q.trim());
  return deskRequest<StaffMemberRow[]>(`/api/staff/members?q=${query}`);
}

export async function memberDetail(id: string): Promise<StaffMemberDetail> {
  if (!hasBackend) return demo.memberDetail(id);
  return deskRequest<StaffMemberDetail>(`/api/staff/members/${encodeURIComponent(id)}`);
}

export async function recordPurchase(input: PurchaseInput): Promise<PurchaseResult> {
  if (!hasBackend) return demo.recordPurchase(input);
  return deskRequest<PurchaseResult>("/api/staff/purchases", { method: "POST", body: input });
}

export async function deskCheckIn(code: string, branchId: string): Promise<CheckInResult> {
  if (!hasBackend) return demo.deskCheckIn(code, branchId);
  return deskRequest<CheckInResult>("/api/staff/check-in", {
    method: "POST",
    body: { code, branchId },
  });
}
