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

export type Voucher = {
  id: string;
  code: string;
  value: number; // £
  issued: string; // ISO
  expires: string; // ISO (18 months from issue)
  status: "available" | "used";
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
  title: string;
  detail?: string;
  total: number; // £ paid at the till
  nhs?: number; // £ funded by NHS (earns nothing)
  points: number; // points earned (rewards use 0)
};

export const BRANCHES: Branch[] = [
  {
    id: "coulsdon",
    name: "Coulsdon",
    address: ["128 Chipstead Valley Road", "Coulsdon", "CR5 2RA"],
    phone: "+441737550132",
    phoneDisplay: "01737 550132",
    hours: [
      { days: "Monday – Friday", time: "9:00 – 17:30" },
      { days: "Saturday", time: "9:00 – 16:00" },
      { days: "Sunday", time: "Closed" },
    ],
    mapQuery: "Surrey Opticians, Chipstead Valley Road, Coulsdon CR5 2RA",
  },
  {
    id: "wallington",
    name: "Wallington",
    address: ["42 Woodcote Road", "Wallington", "SM6 0LY"],
    phone: "+442086475521",
    phoneDisplay: "020 8647 5521",
    hours: [
      { days: "Monday – Friday", time: "9:00 – 17:30" },
      { days: "Saturday", time: "9:00 – 16:00" },
      { days: "Sunday", time: "Closed" },
    ],
    mapQuery: "Surrey Opticians, Woodcote Road, Wallington SM6 0LY",
  },
  {
    id: "banstead",
    name: "Banstead",
    address: ["15 High Street", "Banstead", "SM7 2LJ"],
    phone: "+441737362240",
    phoneDisplay: "01737 362240",
    hours: [
      { days: "Monday – Friday", time: "9:00 – 17:30" },
      { days: "Saturday", time: "9:00 – 16:00" },
      { days: "Sunday", time: "Closed" },
    ],
    mapQuery: "Surrey Opticians, High Street, Banstead SM7 2LJ",
  },
];

export const PRACTICE_EMAIL = "hello@surreyopticians.co.uk";

// One sample voucher sits inside the 60-day expiry window whatever today's date
// is, so the reminder flow is always visible in the prototype. 18-month term.
function iso(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}
const today = new Date();
const soonExpires = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 41);
const soonIssued = new Date(soonExpires.getFullYear(), soonExpires.getMonth() - 18, soonExpires.getDate());
const DEMO_EXPIRING = { issued: iso(soonIssued), expires: iso(soonExpires) };

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
    id: "v-7f3k92qx",
    code: "SO-7F3K-92QX",
    value: 10,
    issued: "2026-06-15",
    expires: "2027-12-15",
    status: "available",
  },
  {
    id: "v-9k2t08mw",
    code: "SO-9K2T-08MW",
    value: 10,
    issued: DEMO_EXPIRING.issued,
    expires: DEMO_EXPIRING.expires,
    status: "available",
  },
  {
    id: "v-2m8d41lp",
    code: "SO-2M8D-41LP",
    value: 10,
    issued: "2025-11-04",
    expires: "2027-05-04",
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
    date: "2026-04-22",
    branchId: "coulsdon",
    kind: "spend",
    title: "Eye examination",
    detail: "Part-funded by an NHS optical voucher",
    total: 95,
    nhs: 39.1,
    points: 5,
  },
  {
    id: "t-05",
    date: "2026-03-09",
    branchId: "banstead",
    kind: "spend",
    title: "Contact lens solution",
    detail: "Three month supply",
    total: 27,
    points: 2,
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
