// Which branch the desk device is standing in.
//
// A purchase and an arrival both have to be attributed to a branch, and the
// till does not move, so the choice is made once on the device and remembered
// rather than asked for on every transaction.

import { useCallback, useEffect, useState } from "react";

import { BRANCHES } from "@/src/api/data";
import { storage } from "@/src/utils/storage";

export const DESK_BRANCH_KEY = "surrey.staff.branch";

export function useDeskBranch() {
  const [branchId, setBranch] = useState(BRANCHES[0].id);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const saved = await storage.getItem<string>(DESK_BRANCH_KEY, "");
      if (!alive) return;
      if (saved && BRANCHES.some((b) => b.id === saved)) setBranch(saved);
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const setBranchId = useCallback((id: string) => {
    setBranch(id);
    storage.setItem(DESK_BRANCH_KEY, id);
  }, []);

  return { branchId, setBranchId, ready };
}
