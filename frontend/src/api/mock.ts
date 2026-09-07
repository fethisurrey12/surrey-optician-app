// The mock API layer. Four async functions stand in for a real server. Swap
// the bodies for fetch() calls later without touching any screen component.
//
// State is held in module memory only — no browser localStorage, per brief.

import { ACCOUNT, Account, Txn, TXNS, Voucher, VOUCHERS, WalletProvider } from "./data";

// Mutable working copies so redemption persists for the session.
let vouchers: Voucher[] = VOUCHERS.map((v) => ({ ...v }));
const account: Account = { ...ACCOUNT };
const txns: Txn[] = TXNS.map((t) => ({ ...t }));

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function loadAccount(): Promise<Account> {
  await delay(260);
  return { ...account };
}

export async function loadVouchers(): Promise<Voucher[]> {
  await delay(320);
  return vouchers.map((v) => ({ ...v }));
}

export async function loadActivity(): Promise<Txn[]> {
  await delay(300);
  return txns.map((t) => ({ ...t }));
}

// Marks a voucher used. In production a colleague triggers this at the till
// after applying £10 in the practice system — the app never self-redeems.
export async function markVoucherUsed(
  id: string,
  branchId: string,
): Promise<Voucher> {
  await delay(700);
  vouchers = vouchers.map((v) =>
    v.id === id
      ? {
          ...v,
          status: "used" as const,
          usedAt: new Date().toISOString().slice(0, 10),
          usedBranchId: branchId,
        }
      : v,
  );
  const updated = vouchers.find((v) => v.id === id);
  if (!updated) throw new Error("Voucher not found");
  return { ...updated };
}

// Records that the member has added a voucher to Apple or Google Wallet so the
// app can show its "in wallet" state. The pass itself is produced server-side.
export async function markVoucherInWallet(id: string, provider: WalletProvider): Promise<Voucher> {
  await delay(500);
  vouchers = vouchers.map((v) => (v.id === id ? { ...v, wallet: provider } : v));
  const updated = vouchers.find((v) => v.id === id);
  if (!updated) throw new Error("Voucher not found");
  return { ...updated };
}
