// Referral code helpers. Codes are NAME-DDDD (inviter's first name + last four
// digits of their mobile), e.g. SARAH-5589.

export function normaliseReferralCode(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 24);
}

export function validReferralCode(code: string): boolean {
  return /^[A-Z]{2,15}-\d{4}$/.test(code);
}

// "SARAH-5589" -> "Sarah"; empty when the code is not in the expected shape.
export function inviterName(code: string): string {
  const m = /^([A-Z]{2,15})-\d{4}$/.exec(code);
  if (!m) return "";
  const n = m[1];
  return n[0] + n.slice(1).toLowerCase();
}
