// One door to the data layer.
//
// With EXPO_PUBLIC_BACKEND_URL set the app talks to the loyalty API; without
// it, it falls back to the bundled sample data so every screen can still be
// demonstrated offline. Screens and hooks import from here and never need to
// know which is in play.

import { hasBackend } from "./client";
import * as mock from "./mock";
import * as server from "./server";

export { ApiError, hasBackend } from "./client";
export type { OtpSent, SessionResult } from "./server";

const api = hasBackend ? server : mock;

export const loadAccount = api.loadAccount;
export const loadVouchers = api.loadVouchers;
export const loadActivity = api.loadActivity;
export const loadReferrals = api.loadReferrals;
export const markVoucherUsed = api.markVoucherUsed;
export const markVoucherInWallet = api.markVoucherInWallet;

// Editing details has no offline equivalent — the sample account is read-only,
// so the mock simply echoes the change back for the prototype.
export const updateAccount = hasBackend ? server.updateAccount : mock.updateAccount;
