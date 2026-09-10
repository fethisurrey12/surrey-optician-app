"""The demo seed must produce a state where every Home nudge has something to show."""

from datetime import date

import pytest

from config import DEMO_MOBILE

pytestmark = pytest.mark.anyio


def _days_until(iso: str) -> int:
    return (date.fromisoformat(iso) - date.today()).days


async def test_seed_builds_the_sample_account(client, database):
    from seed import seed_demo_member

    await seed_demo_member()

    member = await database.members.find_one({"mobile": DEMO_MOBILE})
    assert member["firstName"] == "Sarah"
    assert member["referralCode"] == "SARAH-5589"
    # Lifetime earnings and the ring balance must agree.
    assert member["points"] == member["totalEarned"] % 10
    assert member["totalEarned"] == 69
    assert member["points"] == 9


async def test_seed_is_idempotent(client, database):
    from seed import seed_demo_member

    await seed_demo_member()
    first = await database.transactions.count_documents({})
    await seed_demo_member()
    assert await database.transactions.count_documents({}) == first


async def test_a_voucher_sits_inside_the_expiry_window(client, database):
    from config import DEMO_MOBILE as mob
    from seed import seed_demo_member

    await seed_demo_member()
    member = await database.members.find_one({"mobile": mob})
    vouchers = await database.vouchers.find({"memberId": member["_id"]}).to_list(50)

    assert vouchers, "the sample account should hold vouchers"
    soon = [v for v in vouchers if 0 <= _days_until(v["expires"]) <= 60]
    assert soon, "no voucher inside the 60-day window — the expiry nudge would never show"


async def test_the_eye_test_and_lens_nudges_have_source_transactions(client, database):
    from seed import seed_demo_member

    await seed_demo_member()

    exam = await database.transactions.find_one({"category": "exam"})
    assert exam, "no exam purchase — the eye-test recall nudge has nothing to read"
    # Due at 24 months; the nudge shows from 60 days before.
    months_ago = (date.today() - date.fromisoformat(exam["date"])).days / 30.44
    assert 22 <= months_ago <= 24

    lenses = await database.transactions.find_one({"category": "lenses"})
    assert lenses and lenses["supplyMonths"] == 3
