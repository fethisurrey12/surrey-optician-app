"""Loyalty scheme maths — the server-side authority.

Ported from frontend/src/lib/points.ts, which keeps its copy for display. The
rule that matters: 1 point per whole GBP 10 of *private* spend. NHS-funded
amounts earn nothing, and part-points are rounded down.

Money is pence (int) everywhere in this module. Floats never touch a balance.
"""

from __future__ import annotations

import secrets
from datetime import date, datetime, timedelta, timezone

from config import (
    POINTS_PER_REWARD,
    SPEND_PER_POINT_PENCE,
    VOUCHER_TTL_MONTHS,
)

# Ambiguous characters (0/O, 1/I) are left out so a code read aloud at the till
# or typed off a phone screen cannot be misheard.
CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"


def now() -> datetime:
    return datetime.now(timezone.utc)


def private_pence(total_pence: int, nhs_pence: int = 0) -> int:
    """What the customer actually paid, after any NHS contribution."""
    return max(0, total_pence - max(0, nhs_pence))


def points_for_spend(private_paid_pence: int) -> int:
    """1 point per whole GBP 10 of private spend, rounded down."""
    if private_paid_pence <= 0:
        return 0
    return private_paid_pence // SPEND_PER_POINT_PENCE


def points_to_next_reward(points: int) -> int:
    within = points % POINTS_PER_REWARD
    return POINTS_PER_REWARD if within == 0 else POINTS_PER_REWARD - within


def rewards_earned(previous_total: int, new_total: int) -> int:
    """How many whole rewards the balance crossed with this transaction.

    Driven by lifetime total rather than the running balance so that a single
    large purchase issues every voucher it earns (GBP 210 -> 21 points -> 2
    vouchers), and so replaying history can never double-issue.
    """
    return (new_total // POINTS_PER_REWARD) - (previous_total // POINTS_PER_REWARD)


def voucher_code() -> str:
    """SO-XXXX-XXXX, drawn from the unambiguous alphabet."""
    block = lambda: "".join(secrets.choice(CODE_ALPHABET) for _ in range(4))
    return f"SO-{block()}-{block()}"


def add_months(d: date, months: int) -> date:
    """Calendar-safe month arithmetic, clamping to the end of short months."""
    month_index = d.month - 1 + months
    year = d.year + month_index // 12
    month = month_index % 12 + 1
    # 31 January + 1 month is 28/29 February, not 3 March.
    last_day = [31, 29 if _leap(year) else 28, 31, 30, 31, 30,
                31, 31, 30, 31, 30, 31][month - 1]
    return date(year, month, min(d.day, last_day))


def _leap(year: int) -> bool:
    return year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)


def voucher_expiry(issued: date) -> date:
    return add_months(issued, VOUCHER_TTL_MONTHS)


def referral_code(first_name: str, mobile: str) -> str:
    """NAME-DDDD — first name plus the last four digits of the mobile.

    Matches frontend/src/lib/referral.ts, which parses the name back out of the
    code to greet the invitee on the join page.
    """
    name = "".join(c for c in first_name.upper() if c.isalpha())[:15] or "MEMBER"
    digits = "".join(c for c in mobile if c.isdigit())[-4:].rjust(4, "0")
    return f"{name}-{digits}"


def pence_to_pounds(pence: int) -> float:
    """Pence to the pounds figure the app displays.

    Whole pounds come back as int-valued floats so JSON carries `45` not
    `45.0`; the frontend's money() helper formats from there.
    """
    pounds = pence / 100
    return int(pounds) if pence % 100 == 0 else round(pounds, 2)


def pounds_to_pence(pounds: float) -> int:
    return int(round(float(pounds) * 100))


def iso_date(d: date | datetime) -> str:
    if isinstance(d, datetime):
        d = d.date()
    return d.isoformat()
