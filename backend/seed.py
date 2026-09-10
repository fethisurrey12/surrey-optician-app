"""Demo data for the sample account.

Mirrors the fixtures the prototype shipped with (frontend/src/api/data.ts) so
the app looks the same against a real database, and the three Home nudges —
voucher expiry, eye test due, lens reorder — all have something to show.

Runs only when SEED_DEMO_DATA is on, and never touches a member that already
has transactions, so it cannot overwrite real practice data.
"""

from __future__ import annotations

import logging
from datetime import date, timedelta

from config import DEMO_MOBILE
from db import get_db
from scheme import add_months, iso_date
from store import create_member, find_member, record_purchase

log = logging.getLogger(__name__)


def _ago(days: int = 0, months: int = 0) -> str:
    d = date.today() - timedelta(days=days)
    if months:
        d = add_months(d, -months)
    return iso_date(d)


async def seed_demo_member() -> None:
    db = get_db()
    member = await find_member(DEMO_MOBILE)

    if member:
        existing = await db.transactions.count_documents({"memberId": member["_id"]})
        if existing:
            return  # Already seeded, or in real use — leave it alone.
    else:
        member = await create_member(DEMO_MOBILE, "Sarah", "Whitfield", "coulsdon")
        await db.members.update_one(
            {"_id": member["_id"]},
            {"$set": {"email": "sarah.whitfield@gmail.com", "memberSince": _ago(days=507)}},
        )

    today = date.today()
    # Dated so the nudges always have something to show: the eye test falls due
    # in 20 days, and the three-month lens supply runs out in 10.
    exam_date = iso_date(add_months(today + timedelta(days=20), -24))
    lens_date = iso_date(add_months(today + timedelta(days=10), -3))

    # 507 days back is 18 months minus about six weeks, so the vouchers those
    # purchases unlock sit inside the 60-day expiry window and the Home nudge
    # always has something to show.
    purchases = [
        (_ago(days=507), "coulsdon", "Varifocal lenses", "Premium extra-wide field", 190, 0, None, None),
        (_ago(days=507), "coulsdon", "Titanium frames", "Lightweight, hypoallergenic", 145, 0, None, None),
        (_ago(days=400), "wallington", "Anti-reflection coating", "Premium clarity finish", 60, 0, None, None),
        (lens_date, "banstead", "Contact lenses", "Three-month supply of monthlies", 54, 0, "lenses", 3),
        (exam_date, "coulsdon", "Eye examination", "Part-funded by an NHS optical voucher", 95, 39.10, "exam", None),
        (_ago(days=87), "wallington", "Prescription sunglasses", "Polarised, gradient tint", 160, 0, None, None),
        (_ago(days=39), "banstead", "Blue-light lens coating", "Applied to existing lenses", 45, 0, None, None),
    ]

    for when, branch, title, detail, total, nhs, category, months in purchases:
        await record_purchase(
            mobile=DEMO_MOBILE,
            branch_id=branch,
            title=title,
            total_pounds=total,
            nhs_pounds=nhs,
            detail=detail,
            category=category,
            supply_months=months,
            on_date=when,
            idempotency_key=f"seed:{DEMO_MOBILE}:{when}:{title}",
        )

    fresh = await find_member(DEMO_MOBILE)
    vouchers = await db.vouchers.count_documents({"memberId": fresh["_id"]})
    log.info(
        "seeded demo member %s — %s points lifetime, %s vouchers",
        DEMO_MOBILE, fresh.get("totalEarned"), vouchers,
    )
