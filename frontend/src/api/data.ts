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

export const ACCOUNT: Account = {
  id: "+447712045589",
  mobile: "+447712045589",
  mobileDisplay: "+44 7712 045589",
  firstName: "Sarah",
  lastName: "Whitfield",
  email: "sarah.whitfield@gmail.com",
  homeBranchId: "coulsdon",
  memberSince: "2025-11-04",
  points: 8,
  totalEarned: 46,
};

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

export const TXNS: Txn[] = [
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
];

export function branchName(id: string | undefined): string {
  return BRANCHES.find((b) => b.id === id)?.name ?? "";
}
