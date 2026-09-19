"""Database layer tests: models, repository, seed.

These run against an in-memory Mongo (mongomock_motor), so they need no live
database and no MONGO_URL. Tests are synchronous and drive the async code with
asyncio.run, which avoids adding an async pytest plugin to the pinned config.
"""

import asyncio
from datetime import date

import pytest
from mongomock_motor import AsyncMongoMockClient
from pydantic import ValidationError

import db as dbmod
import repo
import seed as seedmod
from models import Account, Branch, Txn, Voucher


def fresh_db():
    """A clean in-memory database per test."""
    return AsyncMongoMockClient()["surrey_test"]


def seeded():
    """A database with branches and the demo member in place."""
    d = fresh_db()
    asyncio.run(seedmod.seed(d))
    return d


DEMO = seedmod.DEMO_ACCOUNT_ID


class TestModels:
    """Documents key on `_id` but present as `id` to the app."""

    def test_to_doc_keys_on_underscore_id(self):
        b = Branch(
            id="coulsdon",
            name="Coulsdon",
            address=["128 Chipstead Valley Road"],
            phone="+441737550132",
            phoneDisplay="01737 550132",
            hours=[{"days": "Monday – Friday", "time": "9:00 – 17:30"}],
            mapQuery="Surrey Opticians, Coulsdon",
        )
        doc = b.to_doc()
        assert doc["_id"] == "coulsdon"
        assert "id" not in doc

    def test_to_api_keys_on_id(self):
        b = Branch(
            id="banstead",
            name="Banstead",
            address=["15 High Street"],
            phone="+441737362240",
            phoneDisplay="01737 362240",
            hours=[{"days": "Sunday", "time": "Closed"}],
            mapQuery="Surrey Opticians, Banstead",
        )
        api = b.to_api()
        assert api["id"] == "banstead"
        assert "_id" not in api

    def test_parses_a_mongo_document_straight_back(self):
        v = Voucher(
            id="v-1",
            accountId=DEMO,
            code="SO-0001-0001",
            value=10,
            issued="2026-01-01",
            expires="2027-07-01",
        )
        assert Voucher(**v.to_doc()) == v

    def test_optional_fields_are_omitted_not_null(self):
        """A never-redeemed voucher stores no usedAt/usedBranchId/wallet keys."""
        v = Voucher(
            id="v-2",
            accountId=DEMO,
            code="SO-0002-0002",
            value=10,
            issued="2026-01-01",
            expires="2027-07-01",
        )
        doc = v.to_doc()
        assert "usedAt" not in doc and "usedBranchId" not in doc and "wallet" not in doc

    @pytest.mark.parametrize(
        "bad", ["2026-1-1", "01/01/2026", "2026-01-01T00:00:00Z", ""]
    )
    def test_rejects_non_iso_dates(self, bad):
        with pytest.raises(ValidationError):
            Txn(
                id="t-1",
                accountId=DEMO,
                date=bad,
                branchId="coulsdon",
                kind="spend",
                title="Frames",
                total=100,
                points=10,
            )

    def test_rejects_unknown_status(self):
        with pytest.raises(ValidationError):
            Voucher(
                id="v-3",
                accountId=DEMO,
                code="SO-0003-0003",
                value=10,
                issued="2026-01-01",
                expires="2027-07-01",
                status="redeemed",  # the schema says available | used
            )

    def test_rejects_a_misspelled_field(self):
        """extra=forbid stops a typo silently creating a junk column."""
        with pytest.raises(ValidationError):
            Account(
                id=DEMO,
                mobile=DEMO,
                mobileDisplay="+44 7712 045589",
                firstName="Sarah",
                lastName="Whitfield",
                email="sarah@example.com",
                homeBranchId="coulsdon",
                memberSince="2026-01-01",
                points=8,
                totalEarned=88,
                referralCode="SARAH-5589",
                homeBranch="coulsdon",  # not a field
            )

    def test_rejects_negative_points(self):
        with pytest.raises(ValidationError):
            Txn(
                id="t-2",
                accountId=DEMO,
                date="2026-01-01",
                branchId="coulsdon",
                kind="spend",
                title="Frames",
                total=100,
                points=-1,
            )


class TestJsDate:
    """seed.js_date must match JavaScript's Date overflow, which data.ts relies on."""

    def test_plain_date(self):
        assert seedmod.js_date(2026, 0, 15) == "2026-01-15"

    def test_day_overflow_rolls_into_next_month(self):
        # new Date(2026, 0, 32) -> 1 February 2026
        assert seedmod.js_date(2026, 0, 32) == "2026-02-01"

    def test_negative_month_rolls_back_a_year(self):
        # new Date(2026, -3, 1) -> 1 October 2025
        assert seedmod.js_date(2026, -3, 1) == "2025-10-01"

    def test_month_overflow_rolls_forward_a_year(self):
        # new Date(2026, 12, 1) -> 1 January 2027
        assert seedmod.js_date(2026, 12, 1) == "2027-01-01"

    def test_leap_day_overflow(self):
        # new Date(2027, 1, 29) -> 1 March 2027 (2027 is not a leap year)
        assert seedmod.js_date(2027, 1, 29) == "2027-03-01"


class TestSeed:
    def test_writes_every_collection(self):
        d = fresh_db()
        counts = asyncio.run(seedmod.seed(d))
        assert counts == {
            "branches": 3,
            "accounts": 1,
            "vouchers": 3,
            "txns": 11,
            "referrals": 3,
        }

    def test_is_idempotent(self):
        """A second run must not duplicate or overwrite the member."""
        d = seeded()
        counts = asyncio.run(seedmod.seed(d))
        assert counts["accounts"] == 0
        assert counts["vouchers"] == 0
        assert counts["txns"] == 0
        assert counts["referrals"] == 0
        assert asyncio.run(d["txns"].count_documents({})) == 11

    def test_plain_rerun_preserves_a_redemption(self):
        d = seeded()
        asyncio.run(repo.mark_voucher_used(DEMO, "v-7f3k92qx", "banstead", d))
        asyncio.run(seedmod.seed(d))
        v = asyncio.run(d["vouchers"].find_one({"_id": "v-7f3k92qx"}))
        assert v["status"] == "used"

    def test_reset_restores_the_demo_member(self):
        d = seeded()
        asyncio.run(repo.mark_voucher_used(DEMO, "v-7f3k92qx", "banstead", d))
        asyncio.run(seedmod.seed(d, reset=True))
        v = asyncio.run(d["vouchers"].find_one({"_id": "v-7f3k92qx"}))
        assert v["status"] == "available"
        assert asyncio.run(d["vouchers"].count_documents({})) == 3

    def test_every_seeded_document_validates(self):
        d = seeded()
        asyncio.run(repo.list_branches(d))
        asyncio.run(repo.get_account(DEMO, d))
        asyncio.run(repo.list_vouchers(DEMO, d))
        asyncio.run(repo.list_activity(DEMO, d))
        asyncio.run(repo.list_referrals(DEMO, d))

    def test_ensure_indexes_runs_clean(self):
        d = fresh_db()
        asyncio.run(dbmod.ensure_indexes(d))
        asyncio.run(dbmod.ensure_indexes(d))  # no-op the second time


class TestInjectedDatabase:
    """use_database lets callers run without MONGO_URL — the repo picks it up
    when no database is passed explicitly."""

    def test_repo_uses_the_injected_database(self):
        d = seeded()
        dbmod.use_database(d)
        try:
            assert asyncio.run(repo.get_account(DEMO)).firstName == "Sarah"
            assert len(asyncio.run(repo.list_branches())) == 3
        finally:
            dbmod.use_database(None)

    def test_restoring_the_default_does_not_leak(self):
        d = seeded()
        dbmod.use_database(d)
        dbmod.use_database(None)
        assert dbmod._db is None


class TestSeededNudgeWindows:
    """The demo dates exist to make the three date-driven cards visible. If these
    drift, the seeded database stops showing what the prototype showed."""

    def test_one_voucher_expires_inside_the_60_day_warning(self):
        d = seeded()
        vouchers = asyncio.run(repo.list_vouchers(DEMO, d))
        days = [
            (date.fromisoformat(v.expires) - date.today()).days
            for v in vouchers
            if v.status == "available"
        ]
        assert any(0 <= n <= 60 for n in days), days

    def test_eye_test_falls_due_in_20_days(self):
        d = seeded()
        txns = asyncio.run(repo.list_activity(DEMO, d))
        exams = [t for t in txns if t.category == "exam"]
        assert len(exams) == 1
        last = date.fromisoformat(exams[0].date)
        due = seedmod.js_date(last.year + 2, last.month - 1, last.day)
        assert (date.fromisoformat(due) - date.today()).days == 20

    def test_lens_supply_runs_out_in_10_days(self):
        d = seeded()
        txns = asyncio.run(repo.list_activity(DEMO, d))
        lenses = [t for t in txns if t.category == "lenses"]
        assert len(lenses) == 1
        bought = date.fromisoformat(lenses[0].date)
        assert lenses[0].supplyMonths == 3
        runs_out = seedmod.js_date(
            bought.year, bought.month - 1 + lenses[0].supplyMonths, bought.day
        )
        assert (date.fromisoformat(runs_out) - date.today()).days == 10


class TestRepoReads:
    def test_branches_sorted_by_name(self):
        d = seeded()
        names = [b.name for b in asyncio.run(repo.list_branches(d))]
        assert names == ["Banstead", "Coulsdon", "Wallington"]

    def test_get_account(self):
        d = seeded()
        a = asyncio.run(repo.get_account(DEMO, d))
        assert a.firstName == "Sarah"
        assert a.referralCode == "SARAH-5589"
        assert a.points == 8

    def test_get_account_unknown_raises(self):
        d = seeded()
        with pytest.raises(repo.NotFound):
            asyncio.run(repo.get_account("+447000000000", d))

    def test_find_by_mobile(self):
        d = seeded()
        assert asyncio.run(repo.find_account_by_mobile(DEMO, d)).firstName == "Sarah"

    def test_find_by_mobile_unknown_returns_none(self):
        """An unrecognised number at the phone step is not an error."""
        d = seeded()
        assert asyncio.run(repo.find_account_by_mobile("+447000000000", d)) is None

    def test_find_by_referral_code(self):
        d = seeded()
        a = asyncio.run(repo.find_account_by_referral_code("SARAH-5589", d))
        assert a.id == DEMO

    def test_activity_is_newest_first(self):
        d = seeded()
        dates = [t.date for t in asyncio.run(repo.list_activity(DEMO, d))]
        assert dates == sorted(dates, reverse=True)

    def test_lists_are_scoped_to_the_member(self):
        d = seeded()
        assert asyncio.run(repo.list_vouchers("+447000000000", d)) == []
        assert asyncio.run(repo.list_activity("+447000000000", d)) == []
        assert asyncio.run(repo.list_referrals("+447000000000", d)) == []


class TestRedemption:
    def test_marks_used_with_branch_and_date(self):
        d = seeded()
        v = asyncio.run(repo.mark_voucher_used(DEMO, "v-7f3k92qx", "wallington", d))
        assert v.status == "used"
        assert v.usedBranchId == "wallington"
        assert v.usedAt == date.today().isoformat()

    def test_second_redemption_is_refused(self):
        """Two tills scanning the same code must not both succeed."""
        d = seeded()
        asyncio.run(repo.mark_voucher_used(DEMO, "v-7f3k92qx", "wallington", d))
        with pytest.raises(repo.AlreadyRedeemed):
            asyncio.run(repo.mark_voucher_used(DEMO, "v-7f3k92qx", "coulsdon", d))

    def test_already_used_seed_voucher_is_refused(self):
        d = seeded()
        with pytest.raises(repo.AlreadyRedeemed):
            asyncio.run(repo.mark_voucher_used(DEMO, "v-2m8d41lp", "coulsdon", d))

    def test_unknown_voucher_raises_not_found(self):
        d = seeded()
        with pytest.raises(repo.NotFound):
            asyncio.run(repo.mark_voucher_used(DEMO, "v-nope", "coulsdon", d))

    def test_cannot_redeem_another_members_voucher(self):
        d = seeded()
        with pytest.raises(repo.NotFound):
            asyncio.run(
                repo.mark_voucher_used("+447000000000", "v-7f3k92qx", "coulsdon", d)
            )
        still = asyncio.run(d["vouchers"].find_one({"_id": "v-7f3k92qx"}))
        assert still["status"] == "available"

    def test_marks_voucher_in_wallet(self):
        d = seeded()
        v = asyncio.run(repo.mark_voucher_in_wallet(DEMO, "v-7f3k92qx", "apple", d))
        assert v.wallet == "apple"

    def test_wallet_flag_unknown_voucher_raises(self):
        d = seeded()
        with pytest.raises(repo.NotFound):
            asyncio.run(repo.mark_voucher_in_wallet(DEMO, "v-nope", "google", d))
