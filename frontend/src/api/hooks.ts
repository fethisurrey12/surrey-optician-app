// React Query hooks over the mock API. Screens use these; the query keys let a
// redemption refresh every dependent view.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { loadAccount, loadActivity, loadVouchers, markVoucherUsed } from "./mock";

export const keys = {
  account: ["account"] as const,
  vouchers: ["vouchers"] as const,
  activity: ["activity"] as const,
};

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
