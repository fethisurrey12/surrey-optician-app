// React Query hooks over the mock API. Screens use these; the query keys let a
// redemption refresh every dependent view.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { type WalletProvider } from "./data";
// Resolves to the real API when EXPO_PUBLIC_BACKEND_URL is set, and to the
// bundled sample data when it is not.
import {
  loadAccount,
  loadActivity,
  loadReferrals,
  loadVouchers,
  markVoucherInWallet,
  markVoucherUsed,
  updateAccount,
} from "./index";

export const keys = {
  account: ["account"] as const,
  vouchers: ["vouchers"] as const,
  activity: ["activity"] as const,
  referrals: ["referrals"] as const,
};

export function useReferrals() {
  return useQuery({ queryKey: keys.referrals, queryFn: loadReferrals });
}

export function useAccount() {
  return useQuery({ queryKey: keys.account, queryFn: loadAccount });
}

export function useVouchers() {
  return useQuery({ queryKey: keys.vouchers, queryFn: loadVouchers });
}

export function useActivity() {
  return useQuery({ queryKey: keys.activity, queryFn: loadActivity });
}

// Simulates the colleague marking a voucher used at the till.
export function useMarkVoucherUsed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, branchId }: { id: string; branchId: string }) =>
      markVoucherUsed(id, branchId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.vouchers });
      qc.invalidateQueries({ queryKey: keys.account });
    },
  });
}

export function useAddToWallet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, provider }: { id: string; provider: WalletProvider }) =>
      markVoucherInWallet(id, provider),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.vouchers }),
  });
}

// Saving the member's own details. The account query is invalidated so the
// membership card and greeting pick the change up immediately.
export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateAccount,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.account }),
  });
}
