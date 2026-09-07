// Wallet pass endpoints. Passes are signed on the server; the app only ever
// receives a .pkpass download URL (Apple) or a Save-to-Google-Wallet link.
import { type Account, type Voucher, branchName } from "./data";

const BASE = `${process.env.EXPO_PUBLIC_BACKEND_URL ?? ""}/api/wallet`;

export type WalletStatus = { apple: boolean; google: boolean };

export async function walletStatus(): Promise<WalletStatus> {
  const r = await fetch(`${BASE}/status`);
  if (!r.ok) throw new Error("Wallet service unavailable");
  return r.json();
}

function passQuery(voucher: Voucher, account: Account): string {
  return new URLSearchParams({
    value: String(voucher.value),
    expires: voucher.expires,
    member: `${account.firstName} ${account.lastName}`,
    branch: branchName(account.homeBranchId),
  }).toString();
}

// iOS opens this in Safari, which hands the .pkpass to Wallet.
export function appleWalletUrl(voucher: Voucher, account: Account): string {
  return `${BASE}/apple/${encodeURIComponent(voucher.code)}.pkpass?${passQuery(voucher, account)}`;
}

export async function googleWalletUrl(voucher: Voucher, account: Account): Promise<string> {
  const r = await fetch(`${BASE}/google/${encodeURIComponent(voucher.code)}?${passQuery(voucher, account)}`);
  if (!r.ok) throw new Error("Google Wallet unavailable");
  const { url } = (await r.json()) as { url: string };
  return url;
}
