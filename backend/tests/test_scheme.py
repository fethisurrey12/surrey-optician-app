"""The loyalty maths — the rules the practice's money depends on."""

from datetime import date

import pytest

from scheme import (
    add_months,
    pence_to_pounds,
    points_for_spend,
    points_to_next_reward,
    pounds_to_pence,
    private_pence,
    referral_code,
    rewards_earned,
    voucher_code,
    voucher_expiry,
)


@pytest.mark.parametrize(
    "pence,expected",
    [(0, 0), (999, 0), (1000, 1), (1999, 1), (4500, 4), (21000, 21), (19000, 19)],
)
def test_one_point_per_whole_ten_pounds(pence, expected):
    assert points_for_spend(pence) == expected


def test_nhs_funded_amounts_earn_nothing():
    # The sample eye examination: £95 total, £39.10 NHS -> £55.90 private -> 5.
    eligible = private_pence(9500, 3910)
    assert eligible == 5590
    assert points_for_spend(eligible) == 5


def test_nhs_cannot_push_eligible_spend_negative():
    assert private_pence(2000, 5000) == 0
    assert points_for_spend(private_pence(2000, 5000)) == 0


@pytest.mark.parametrize(
    "before,after,expected",
    [(0, 9, 0), (0, 10, 1), (8, 10, 1), (8, 29, 2), (9, 11, 1), (0, 21, 2), (10, 19, 0)],
)
def test_rewards_issue_once_per_threshold(before, after, expected):
    assert rewards_earned(before, after) == expected


def test_points_to_next_reward():
    assert points_to_next_reward(8) == 2
    assert points_to_next_reward(0) == 10
    assert points_to_next_reward(10) == 10


def test_voucher_term_is_one_year():
    assert voucher_expiry(date(2026, 6, 15)) == date(2027, 6, 15)


def test_a_voucher_never_outlives_a_year():
    # The practice's rule: nothing stays valid longer than twelve months.
    for issued in (date(2026, 1, 1), date(2026, 2, 29 - 1), date(2026, 6, 15), date(2026, 12, 31)):
        assert (voucher_expiry(issued) - issued).days <= 366


def test_a_leap_day_issue_still_lands_on_a_real_date():
    assert voucher_expiry(date(2028, 2, 29)) == date(2029, 2, 28)


def test_month_arithmetic_clamps_to_short_months():
    assert add_months(date(2026, 1, 31), 1) == date(2026, 2, 28)
    assert add_months(date(2028, 1, 31), 1) == date(2028, 2, 29)  # leap year


def test_voucher_codes_avoid_ambiguous_characters():
    # The "SO-" prefix is fixed brand, so only the random blocks need to be
    # unambiguous when a code is read aloud at the till or typed off a screen.
    for _ in range(200):
        code = voucher_code()
        assert code.startswith("SO-")
        assert len(code) == 12
        random_part = code[3:].replace("-", "")
        assert not set(random_part) & set("01IO")


def test_voucher_codes_are_not_repeated():
    assert len({voucher_code() for _ in range(2000)}) == 2000


def test_money_round_trips_without_float_drift():
    assert pounds_to_pence(39.10) == 3910
    assert pence_to_pounds(3910) == 39.1
    assert pence_to_pounds(4500) == 45
    assert isinstance(pence_to_pounds(4500), int)


def test_referral_code_matches_the_frontend_format():
    assert referral_code("Sarah", "+447712045589") == "SARAH-5589"
