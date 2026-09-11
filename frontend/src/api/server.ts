// The real API, implementing the same six functions as ./mock so screens do
// not know which one they are talking to.

import { request } from "./client";
import type { Account, Referral, Txn, Voucher, WalletProvider } from "./data";

// --- Session --------------------------------------------------------------
export type OtpSent = {
  sent: boolean;
  expiresIn: number;
  resendIn: number;
  // Present only while the server runs with EXPOSE_DEV_OTP on, which powers the
  // prototype's on-screen code. Never sent by a production deployment.
  devCode?: string | null;
};

export type SessionResult = {
  token: string;
  account: Account;
  isNewMember: boolean;
  referralApplied: boolean;
};

export function requestOtp(mobile: string): Promise<OtpSent> {
  return request<OtpSent>("/api/auth/request-otp", {
    method: "POST",
    body: { mobile },
    auth: false,
  });
}

export function verifyOtp(
  mobile: string,
  code: string,
  referralCode?: string | null,
): Promise<SessionResult> {
  return request<SessionResult>("/api/auth/verify-otp", {
    method: "POST",
    body: { mobile, code, referralCode: referralCode ?? undefined },
    auth: false,
  });
}

// --- Member data ----------------------------------------------------------
export function loadAccount(): Promise<Account> {
  return request<Account>("/api/me/account");
}

export function loadVouchers(): Promise<Voucher[]> {
  return request<Voucher[]>("/api/me/vouchers");
}

export function loadActivity(): Promise<Txn[]> {
  return request<Txn[]>("/api/me/activity");
}

export function loadReferrals(): Promise<Referral[]> {
  return request<Referral[]>("/api/me/referrals");
}

export function updateAccount(changes: Partial<
  Pick<Account, "firstName" | "lastName" | "email" | "dateOfBirth" | "address" | "postcode" | "homeBranchId">
>): Promise<Account> {
  return request<Account>("/api/me/account", { method: "PATCH", body: changes });
}

// --- Vouchers -------------------------------------------------------------
export async function markVoucherUsed(id: string, branchId: string): Promise<Voucher> {
  // The server returns the refreshed account alongside; the query cache
  // refetches it, so only the voucher is handed back here.
  const result = await request<{ voucher: Voucher; account: Account }>(
    `/api/me/vouchers/${encodeURIComponent(id)}/redeem`,
    { method: "POST", body: { branchId } },
  );
  return result.voucher;
}

export function markVoucherInWallet(id: string, provider: WalletProvider): Promise<Voucher> {
  return request<Voucher>(`/api/me/vouchers/${encodeURIComponent(id)}/wallet`, {
    method: "POST",
    body: { provider },
  });
}
