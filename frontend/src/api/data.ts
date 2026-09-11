// Sample data for the prototype. Shapes match what a real API would return so
// the four async functions in ./mock.ts can later point at a server untouched.

export type Branch = {
  id: string;
  name: string;
  address: string[];
  phone: string;
  phoneDisplay: string;
  hours: { days: string; time: string }[];
  mapQuery: string;
};

export type Account = {
  id: string; // the mobile number is the account key at the till
  mobile: string;
  mobileDisplay: string;
  firstName: string;
  lastName: string;
  email: string;
  homeBranchId: string;
  memberSince: string; // ISO
  points: number; // balance toward the next reward (0–9 after conversions)
  totalEarned: number; // lifetime points
  referralCode: string; // quoted by a friend at their first visit
  memberCode: string; // behind the QR the desk scans to check the patient in
};

// A friend the member has invited. Both earn one bonus point when the friend
// makes their first private purchase.
export type Referral = {
  id: string;
  friendName: string;
  invited: string; // ISO
  status: "invited" | "joined" | "rewarded";
  rewardedAt?: string; // ISO
};

export type VoucherKind = "reward" | "signup";

export type Voucher = {
  id: string;
  code: string;
  // A reward voucher is worth a fixed amount; the welcome voucher a member
  // gets when they first sign up takes a percentage off instead.
  kind: VoucherKind;
  value?: number; // £, on reward vouchers
  percentOff?: number; // %, if an offer is ever a percentage
  // "any", or a category the voucher is restricted to, such as "glasses".
  appliesTo?: string;
  issued: string; // ISO
  expires: string; // ISO (one year from issue)
  // "expired" is derived by the server from the date — a voucher past its
  // term is never offered as ready to use.
  status: "available" | "used" | "expired";
  usedAt?: string; // ISO
  usedBranchId?: string;
  wallet?: WalletProvider; // set once the member has added it to their phone wallet
};

export type WalletProvider = "apple" | "google";

export type Txn = {
  id: string;
  date: string; // ISO
  branchId: string;
  kind: "spend" | "reward";
  category?: "exam" | "lenses"; // drives the eye-test and contact-lens reorder nudges
  supplyMonths?: number; // for lenses: how long the purchased supply lasts
  title: string;
  detail?: string;
  total: number; // £ paid at the till
  nhs?: number; // £ funded by NHS (earns nothing)
  points: number; // points earned (rewards use 0)
};

// Opening hours are the one thing the brand book does not state; these are the
// prototype's and still need confirming with the practice.
const HOURS = [
  { days: "Monday – Friday", time: "9:00 – 17:30" },
  { days: "Saturday", time: "9:00 – 16:00" },
  { days: "Sunday", time: "Closed" },
];

export const BRANCHES: Branch[] = [
  {
    id: "coulsdon",
    name: "Coulsdon",
    address: ["141 Brighton Road", "Coulsdon", "CR5 2NJ"],
    phone: "+442086607343",
    phoneDisplay: "020 8660 7343",
    hours: HOURS,
    mapQuery: "Surrey Opticians, 141 Brighton Road, Coulsdon CR5 2NJ",
  },
  {
    id: "wallington",
    name: "Wallington",
    address: ["116 Woodcote Road", "Wallington", "SM6 0LY"],
    phone: "+442086473644",
    phoneDisplay: "020 8647 3644",
    hours: HOURS,
    mapQuery: "Surrey Opticians, 116 Woodcote Road, Wallington SM6 0LY",
  },
  {
    id: "wallington-green",
    name: "Wallington Green",
    address: ["381 Croydon Road", "Wallington Green", "SM6 7NY"],
    phone: "+442086478992",
    phoneDisplay: "020 8647 8992",
    hours: HOURS,
    mapQuery: "Surrey Opticians, 381 Croydon Road, Wallington SM6 7NY",
  },
  {
    id: "banstead",
    name: "Banstead",
    address: ["157 High Street", "Banstead", "SM7 2NT"],
    phone: "+441737850349",
    phoneDisplay: "01737 850349",
    hours: HOURS,
    mapQuery: "Surrey Opticians, 157 High Street, Banstead SM7 2NT",
  },
];

export const PRACTICE_EMAIL = "info@surreyopticians.com";

// One sample voucher sits inside the 60-day expiry window whatever today's date
// is, so the reminder flow is always visible in the prototype. One-year term.
function iso(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}
const today = new Date();
const soonExpires = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 41);
const soonIssued = new Date(soonExpires.getFullYear() - 1, soonExpires.getMonth(), soonExpires.getDate());
const DEMO_EXPIRING = { issued: iso(soonIssued), expires: iso(soonExpires) };
// The sample eye examination was bought just under two years ago, so the
// recall nudge (due in 20 days) is always visible in the prototype.
const DEMO_EXAM_DATE = iso(new Date(today.getFullYear() - 2, today.getMonth(), today.getDate() + 20));
// The sample three-month lens supply runs out in 10 days.
const DEMO_LENS_DATE = iso(new Date(today.getFullYear(), today.getMonth() - 3, today.getDate() + 10));

export const ACCOUNT: Account = {
  id: "+447712045589",
  mobile: "+447712045589",
  mobileDisplay: "+44 7712 045589",
  firstName: "Sarah",
  lastName: "Whitfield",
  email: "sarah.whitfield@gmail.com",
  homeBranchId: "coulsdon",
  memberSince: DEMO_EXPIRING.issued,
  points: 8,
  totalEarned: 88,
  referralCode: "SARAH-5589",
  memberCode: "SM-4H7P-2QXD",
};

export const REFERRAL_BONUS_POINTS = 1;
// The invite link opens the app's own /join page with the code pre-filled.
export const REFERRAL_LINK_BASE = `${process.env.EXPO_PUBLIC_BACKEND_URL ?? "https://surreyopticians.co.uk"}/join`;

export const REFERRALS: Referral[] = [
  {
    id: "r-01",
    friendName: "Tom Whitfield",
    invited: "2026-03-12",
    status: "rewarded",
    rewardedAt: "2026-04-03",
  },
  { id: "r-02", friendName: "Priya Nair", invited: "2026-05-28", status: "joined" },
  { id: "r-03", friendName: "Invite sent", invited: "2026-06-20", status: "invited" },
];

export const VOUCHERS: Voucher[] = [
  {
    // The welcome voucher, issued when the member first signed in.
    id: "v-w1elc0me",
    code: "SO-4KD2-8NQV",
    kind: "signup",
    value: 25,
    appliesTo: "glasses",
    issued: DEMO_EXPIRING.issued,
    expires: DEMO_EXPIRING.expires,
    status: "available",
  },
  {
    id: "v-7f3k92qx",
    code: "SO-7F3K-92QX",
    kind: "reward",
    value: 10,
    appliesTo: "any",
    issued: "2026-06-15",
    expires: "2027-06-15",
    status: "available",
  },
  {
    id: "v-9k2t08mw",
    code: "SO-9K2T-08MW",
    kind: "reward",
    value: 10,
    appliesTo: "any",
    issued: DEMO_EXPIRING.issued,
    expires: DEMO_EXPIRING.expires,
    status: "available",
  },
  {
    id: "v-2m8d41lp",
    code: "SO-2M8D-41LP",
    kind: "reward",
    value: 10,
    appliesTo: "any",
    issued: "2025-11-04",
    expires: "2026-11-04",
    status: "used",
    usedAt: "2025-12-02",
    usedBranchId: "coulsdon",
  },
];

export const TXNS: Txn[] = ([
  {
    id: "t-09",
    date: "2026-08-02",
    branchId: "banstead",
    kind: "spend",
    title: "Blue-light lens coating",
    detail: "Applied to existing lenses",
    total: 45,
    points: 4,
  },
  {
    id: "t-08",
    date: "2026-06-15",
    branchId: "wallington",
    kind: "reward",
    title: "£10 reward unlocked",
    detail: "Added to your wallet",
    total: 0,
    points: 0,
  },
  {
    id: "t-07",
    date: "2026-06-15",
    branchId: "wallington",
    kind: "spend",
    title: "Prescription sunglasses",
    detail: "Polarised, gradient tint",
    total: 160,
    points: 16,
  },
  {
    id: "t-06",
    date: DEMO_EXAM_DATE,
    branchId: "coulsdon",
    kind: "spend",
    category: "exam",
    title: "Eye examination",
    detail: "Part-funded by an NHS optical voucher",
    total: 95,
    nhs: 39.1,
    points: 5,
  },
  {
    id: "t-05",
    date: DEMO_LENS_DATE,
    branchId: "banstead",
    kind: "spend",
    category: "lenses",
    supplyMonths: 3,
    title: "Contact lenses",
    detail: "Three-month supply of monthlies",
    total: 54,
    points: 5,
  },
  {
    id: "t-04",
    date: "2026-01-18",
    branchId: "wallington",
    kind: "spend",
    title: "Anti-reflection coating",
    detail: "Premium clarity finish",
    total: 60,
    points: 6,
  },
  {
    id: "t-03",
    date: "2025-11-04",
    branchId: "coulsdon",
    kind: "reward",
    title: "£10 reward unlocked",
    detail: "Added to your wallet",
    total: 0,
    points: 0,
  },
  {
    id: "t-02",
    date: "2025-11-04",
    branchId: "coulsdon",
    kind: "spend",
    title: "Titanium frames",
    detail: "Lightweight, hypoallergenic",
    total: 145,
    points: 14,
  },
  {
    id: "t-01",
    date: "2025-11-04",
    branchId: "coulsdon",
    kind: "spend",
    title: "Varifocal lenses",
    detail: "Premium extra-wide field",
    total: 190,
    points: 19,
  },
  {
    id: "t-00b",
    date: DEMO_EXPIRING.issued,
    branchId: "banstead",
    kind: "reward",
    title: "£10 reward unlocked",
    detail: "Added to your wallet",
    total: 0,
    points: 0,
  },
  {
    id: "t-00a",
    date: DEMO_EXPIRING.issued,
    branchId: "banstead",
    kind: "spend",
    title: "Designer frames and lenses",
    detail: "Thin-index lenses",
    total: 210,
    points: 21,
  },
] as Txn[]).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

export function branchName(id: string | undefined): string {
  return BRANCHES.find((b) => b.id === id)?.name ?? "";
}
