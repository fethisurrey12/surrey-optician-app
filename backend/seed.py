"""Seed the loyalty database.

Branches are reference data and always written. The demo member mirrors
`frontend/src/api/data.ts` so a database-backed app shows the same states the
prototype does — including the three date-driven nudges, which is why those
dates are computed relative to today rather than fixed.

    python seed.py            # insert anything missing, leave existing data alone
    python seed.py --reset    # overwrite the demo member back to its starting state

Run from the backend directory with MONGO_URL and DB_NAME set.
"""

import argparse
import asyncio
from datetime import date, timedelta
from pathlib import Path

from dotenv import load_dotenv

import db as dbmod
from models import Account, Branch, Referral, Txn, Voucher


def js_date(year: int, month_index: int, day: int) -> str:
    """`new Date(year, monthIndex, day)` as an ISO string.

    Replicates JavaScript's overflow rules — a month index outside 0-11 or a day
    outside the month rolls into the neighbouring month — so the demo dates land
    exactly where data.ts puts them.
    """
    year += month_index // 12
    month = month_index % 12
    return (date(year, month + 1, 1) + timedelta(days=day - 1)).isoformat()


def demo_dates() -> dict[str, str]:
    """The four relative dates data.ts derives from today."""
    t = date.today()
    # A voucher 41 days from expiry sits inside the 60-day warning window, so
    # the expiry nudge is always visible. 18-month voucher term.
    expires = js_date(t.year, t.month - 1, t.day + 41)
    e = date.fromisoformat(expires)
    return {
        "expiring_issued": js_date(e.year, e.month - 1 - 18, e.day),
        "expiring_expires": expires,
        # Bought just under two years ago: the eye-test recall is due in 20 days.
        "exam": js_date(t.year - 2, t.month - 1, t.day + 20),
        # A three-month lens supply that runs out in 10 days.
        "lenses": js_date(t.year, t.month - 1 - 3, t.day + 10),
    }


BRANCHES = [
    Branch(
        id="coulsdon",
        name="Coulsdon",
        address=["128 Chipstead Valley Road", "Coulsdon", "CR5 2RA"],
        phone="+441737550132",
        phoneDisplay="01737 550132",
        hours=[
            {"days": "Monday – Friday", "time": "9:00 – 17:30"},
            {"days": "Saturday", "time": "9:00 – 16:00"},
            {"days": "Sunday", "time": "Closed"},
        ],
        mapQuery="Surrey Opticians, Chipstead Valley Road, Coulsdon CR5 2RA",
    ),
    Branch(
        id="wallington",
        name="Wallington",
        address=["42 Woodcote Road", "Wallington", "SM6 0LY"],
        phone="+442086475521",
        phoneDisplay="020 8647 5521",
        hours=[
            {"days": "Monday – Friday", "time": "9:00 – 17:30"},
            {"days": "Saturday", "time": "9:00 – 16:00"},
            {"days": "Sunday", "time": "Closed"},
        ],
        mapQuery="Surrey Opticians, Woodcote Road, Wallington SM6 0LY",
    ),
    Branch(
        id="banstead",
        name="Banstead",
        address=["15 High Street", "Banstead", "SM7 2LJ"],
        phone="+441737362240",
        phoneDisplay="01737 362240",
        hours=[
            {"days": "Monday – Friday", "time": "9:00 – 17:30"},
            {"days": "Saturday", "time": "9:00 – 16:00"},
            {"days": "Sunday", "time": "Closed"},
        ],
        mapQuery="Surrey Opticians, High Street, Banstead SM7 2LJ",
    ),
]

DEMO_ACCOUNT_ID = "+447712045589"


def demo_member() -> tuple[Account, list[Voucher], list[Txn], list[Referral]]:
    d = demo_dates()
    a = DEMO_ACCOUNT_ID

    account = Account(
        id=a,
        mobile=a,
        mobileDisplay="+44 7712 045589",
        firstName="Sarah",
        lastName="Whitfield",
        email="sarah.whitfield@gmail.com",
        homeBranchId="coulsdon",
        memberSince=d["expiring_issued"],
        points=8,
        totalEarned=88,
        referralCode="SARAH-5589",
    )

    vouchers = [
        Voucher(
            id="v-7f3k92qx",
            accountId=a,
            code="SO-7F3K-92QX",
            value=10,
            issued="2026-06-15",
            expires="2027-12-15",
            status="available",
        ),
        Voucher(
            id="v-9k2t08mw",
            accountId=a,
            code="SO-9K2T-08MW",
            value=10,
            issued=d["expiring_issued"],
            expires=d["expiring_expires"],
            status="available",
        ),
        Voucher(
            id="v-2m8d41lp",
            accountId=a,
            code="SO-2M8D-41LP",
            value=10,
            issued="2025-11-04",
            expires="2027-05-04",
            status="used",
            usedAt="2025-12-02",
            usedBranchId="coulsdon",
        ),
    ]

    txns = [
        Txn(
            id="t-09",
            accountId=a,
            date="2026-08-02",
            branchId="banstead",
            kind="spend",
            title="Blue-light lens coating",
            detail="Applied to existing lenses",
            total=45,
            points=4,
        ),
        Txn(
            id="t-08",
            accountId=a,
            date="2026-06-15",
            branchId="wallington",
            kind="reward",
            title="£10 reward unlocked",
            detail="Added to your wallet",
            total=0,
            points=0,
        ),
        Txn(
            id="t-07",
            accountId=a,
            date="2026-06-15",
            branchId="wallington",
            kind="spend",
            title="Prescription sunglasses",
            detail="Polarised, gradient tint",
            total=160,
            points=16,
        ),
        Txn(
            id="t-06",
            accountId=a,
            date=d["exam"],
            branchId="coulsdon",
            kind="spend",
            category="exam",
            title="Eye examination",
            detail="Part-funded by an NHS optical voucher",
            total=95,
            nhs=39.1,
            points=5,
        ),
        Txn(
            id="t-05",
            accountId=a,
            date=d["lenses"],
            branchId="banstead",
            kind="spend",
            category="lenses",
            supplyMonths=3,
            title="Contact lenses",
            detail="Three-month supply of monthlies",
            total=54,
            points=5,
        ),
        Txn(
            id="t-04",
            accountId=a,
            date="2026-01-18",
            branchId="wallington",
            kind="spend",
            title="Anti-reflection coating",
            detail="Premium clarity finish",
            total=60,
            points=6,
        ),
        Txn(
            id="t-03",
            accountId=a,
            date="2025-11-04",
            branchId="coulsdon",
            kind="reward",
            title="£10 reward unlocked",
            detail="Added to your wallet",
            total=0,
            points=0,
        ),
        Txn(
            id="t-02",
            accountId=a,
            date="2025-11-04",
            branchId="coulsdon",
            kind="spend",
            title="Titanium frames",
            detail="Lightweight, hypoallergenic",
            total=145,
            points=14,
        ),
        Txn(
            id="t-01",
            accountId=a,
            date="2025-11-04",
            branchId="coulsdon",
            kind="spend",
            title="Varifocal lenses",
            detail="Premium extra-wide field",
            total=190,
            points=19,
        ),
        Txn(
            id="t-00b",
            accountId=a,
            date=d["expiring_issued"],
            branchId="banstead",
            kind="reward",
            title="£10 reward unlocked",
            detail="Added to your wallet",
            total=0,
            points=0,
        ),
        Txn(
            id="t-00a",
            accountId=a,
            date=d["expiring_issued"],
            branchId="banstead",
            kind="spend",
            title="Designer frames and lenses",
            detail="Thin-index lenses",
            total=210,
            points=21,
        ),
    ]

    referrals = [
        Referral(
            id="r-01",
            accountId=a,
            friendName="Tom Whitfield",
            invited="2026-03-12",
            status="rewarded",
            rewardedAt="2026-04-03",
        ),
        Referral(
            id="r-02",
            accountId=a,
            friendName="Priya Nair",
            invited="2026-05-28",
            status="joined",
        ),
        Referral(
            id="r-03",
            accountId=a,
            friendName="Invite sent",
            invited="2026-06-20",
            status="invited",
        ),
    ]

    return account, vouchers, txns, referrals


async def _write(coll, docs, reset: bool) -> int:
    """Upsert when resetting, otherwise only fill in what is missing."""
    written = 0
    for m in docs:
        doc = m.to_doc()
        if reset:
            await coll.replace_one({"_id": m.id}, doc, upsert=True)
            written += 1
        else:
            res = await coll.update_one(
                {"_id": m.id}, {"$setOnInsert": doc}, upsert=True
            )
            written += 1 if res.upserted_id is not None else 0
    return written


async def seed(db=None, reset: bool = False) -> dict[str, int]:
    """Returns a count of documents written per collection."""
    d = db if db is not None else dbmod.get_db()
    await dbmod.ensure_indexes(d)

    account, vouchers, txns, referrals = demo_member()
    return {
        dbmod.BRANCHES: await _write(d[dbmod.BRANCHES], BRANCHES, reset=True),
        dbmod.ACCOUNTS: await _write(d[dbmod.ACCOUNTS], [account], reset),
        dbmod.VOUCHERS: await _write(d[dbmod.VOUCHERS], vouchers, reset),
        dbmod.TXNS: await _write(d[dbmod.TXNS], txns, reset),
        dbmod.REFERRALS: await _write(d[dbmod.REFERRALS], referrals, reset),
    }


async def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--reset",
        action="store_true",
        help="overwrite the demo member, discarding any redemptions made against it",
    )
    args = ap.parse_args()
    # Read backend/.env the same way server.py does, so the script works from
    # the same configuration rather than needing the vars exported by hand.
    load_dotenv(Path(__file__).parent / ".env")
    try:
        counts = await seed(reset=args.reset)
        for name, n in counts.items():
            print(f"{name}: {n} written")
    finally:
        dbmod.close()


if __name__ == "__main__":
    asyncio.run(main())
