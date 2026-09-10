"""Points, vouchers and referrals — the scheme end to end over HTTP."""

import pytest

from tests.conftest import sign_in

pytestmark = pytest.mark.anyio

STAFF = {"X-Staff-Key": "test-staff-key"}
MOBILE = "+447700900123"


async def purchase(client, mobile=MOBILE, total=100, nhs=0, **extra):
    body = {
        "mobile": mobile,
        "branchId": extra.pop("branchId", "coulsdon"),
        "title": extra.pop("title", "Frames"),
        "total": total,
        "nhs": nhs,
        **extra,
    }
    return await client.post("/api/staff/purchases", json=body, headers=STAFF)


# --- Staff guard ----------------------------------------------------------
async def test_till_endpoints_need_the_staff_key(client):
    r = await client.post("/api/staff/purchases", json={"mobile": MOBILE, "branchId": "coulsdon",
                                                        "title": "Frames", "total": 10})
    assert r.status_code == 401

    r = await client.post("/api/staff/purchases",
                          json={"mobile": MOBILE, "branchId": "coulsdon", "title": "Frames", "total": 10},
                          headers={"X-Staff-Key": "wrong"})
    assert r.status_code == 401


async def test_unknown_branch_is_rejected(client):
    r = await purchase(client, branchId="brighton")
    assert r.status_code == 422


# --- Earning --------------------------------------------------------------
async def test_purchase_awards_one_point_per_ten_pounds(client):
    r = await purchase(client, total=45)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["transaction"]["points"] == 4
    assert body["account"]["totalEarned"] == 4
    assert body["account"]["points"] == 4
    assert body["vouchersIssued"] == []


async def test_nhs_funded_portion_earns_nothing(client):
    r = await purchase(client, total=95, nhs=39.10, title="Eye examination", category="exam")
    body = r.json()
    assert body["transaction"]["points"] == 5
    assert body["transaction"]["total"] == 95
    assert body["transaction"]["nhs"] == 39.1


async def test_nhs_more_than_total_is_rejected(client):
    r = await purchase(client, total=20, nhs=50)
    assert r.status_code == 422


async def test_ten_points_issues_a_voucher(client):
    r = await purchase(client, total=100)
    body = r.json()
    assert len(body["vouchersIssued"]) == 1

    voucher = body["vouchersIssued"][0]
    assert voucher["value"] == 10
    assert voucher["status"] == "available"
    assert voucher["code"].startswith("SO-")
    # The ring shows the balance toward the *next* reward, not the lifetime total.
    assert body["account"]["totalEarned"] == 10
    assert body["account"]["points"] == 0


async def test_one_large_purchase_issues_every_reward_it_earns(client):
    r = await purchase(client, total=210)
    body = r.json()
    assert body["transaction"]["points"] == 21
    assert len(body["vouchersIssued"]) == 2
    assert body["account"]["points"] == 1


async def test_points_carry_across_purchases(client):
    await purchase(client, total=60)   # 6
    r = await purchase(client, total=50)  # 5 -> 11 lifetime, crosses 10
    body = r.json()
    assert body["account"]["totalEarned"] == 11
    assert body["account"]["points"] == 1
    assert len(body["vouchersIssued"]) == 1


async def test_a_reward_row_appears_in_activity(client):
    await purchase(client, total=100)
    headers, _ = await sign_in(client, MOBILE)
    rows = (await client.get("/api/me/activity", headers=headers)).json()

    kinds = [r["kind"] for r in rows]
    assert "reward" in kinds and "spend" in kinds
    reward = next(r for r in rows if r["kind"] == "reward")
    assert reward["title"] == "£10 reward unlocked"
    assert reward["points"] == 0


async def test_a_retried_till_post_does_not_award_twice(client):
    first = await purchase(client, total=100, idempotencyKey="till-abc-123")
    second = await purchase(client, total=100, idempotencyKey="till-abc-123")
    assert first.status_code == second.status_code == 200
    assert second.json()["account"]["totalEarned"] == 10

    headers, _ = await sign_in(client, MOBILE)
    vouchers = (await client.get("/api/me/vouchers", headers=headers)).json()
    rewards = [v for v in vouchers if v["kind"] == "reward"]
    assert len(rewards) == 1


# --- Redemption -----------------------------------------------------------
async def test_redeeming_marks_the_voucher_used(client):
    await purchase(client, total=100)
    headers, _ = await sign_in(client, MOBILE)

    voucher = (await client.get("/api/me/vouchers", headers=headers)).json()[0]
    r = await client.post(f"/api/me/vouchers/{voucher['id']}/redeem",
                          json={"branchId": "banstead"}, headers=headers)
    assert r.status_code == 200

    used = r.json()["voucher"]
    assert used["status"] == "used"
    assert used["usedBranchId"] == "banstead"
    assert used["usedAt"]


async def test_a_voucher_cannot_be_redeemed_twice(client):
    await purchase(client, total=100)
    headers, _ = await sign_in(client, MOBILE)
    voucher = (await client.get("/api/me/vouchers", headers=headers)).json()[0]

    first = await client.post(f"/api/me/vouchers/{voucher['id']}/redeem",
                              json={"branchId": "coulsdon"}, headers=headers)
    second = await client.post(f"/api/me/vouchers/{voucher['id']}/redeem",
                               json={"branchId": "coulsdon"}, headers=headers)
    assert first.status_code == 200
    assert second.status_code == 409


async def test_a_member_cannot_redeem_someone_elses_voucher(client):
    await purchase(client, mobile=MOBILE, total=100)
    owner, _ = await sign_in(client, MOBILE)
    voucher = (await client.get("/api/me/vouchers", headers=owner)).json()[0]

    stranger, _ = await sign_in(client, "+447700900999")
    r = await client.post(f"/api/me/vouchers/{voucher['id']}/redeem",
                          json={"branchId": "coulsdon"}, headers=stranger)
    assert r.status_code == 404


async def test_wallet_state_is_recorded(client):
    await purchase(client, total=100)
    headers, _ = await sign_in(client, MOBILE)
    voucher = (await client.get("/api/me/vouchers", headers=headers)).json()[0]

    r = await client.post(f"/api/me/vouchers/{voucher['id']}/wallet",
                          json={"provider": "apple"}, headers=headers)
    assert r.status_code == 200
    assert r.json()["wallet"] == "apple"


# --- Account --------------------------------------------------------------
async def test_member_can_edit_their_details(client):
    headers, _ = await sign_in(client, MOBILE)
    r = await client.patch("/api/me/account",
                           json={"firstName": "Sarah", "lastName": "Whitfield",
                                 "email": "sarah@example.com", "homeBranchId": "wallington"},
                           headers=headers)
    assert r.status_code == 200
    body = r.json()
    assert body["firstName"] == "Sarah"
    assert body["homeBranchId"] == "wallington"
    assert body["email"] == "sarah@example.com"


async def test_a_bad_email_is_rejected(client):
    headers, _ = await sign_in(client, MOBILE)
    r = await client.patch("/api/me/account", json={"email": "not-an-email"}, headers=headers)
    assert r.status_code == 422


async def test_the_mobile_cannot_be_edited(client):
    headers, session = await sign_in(client, MOBILE)
    await client.patch("/api/me/account", json={"mobile": "+447700900555"}, headers=headers)
    after = (await client.get("/api/me/account", headers=headers)).json()
    assert after["mobile"] == session["account"]["mobile"]


# --- Referrals ------------------------------------------------------------
async def test_referral_pays_both_parties_on_the_first_purchase(client):
    inviter_headers, inviter = await sign_in(client, MOBILE)
    await client.patch("/api/me/account", json={"firstName": "Sarah"}, headers=inviter_headers)
    code = (await client.get("/api/me/account", headers=inviter_headers)).json()["referralCode"]
    assert code == "SARAH-0123"

    friend_headers, friend = await sign_in(client, "+447700900456", referral=code)
    assert friend["referralApplied"] is True

    # Nothing is paid until the friend actually spends.
    assert (await client.get("/api/me/account", headers=inviter_headers)).json()["totalEarned"] == 0

    await purchase(client, mobile="+447700900456", total=50)

    assert (await client.get("/api/me/account", headers=inviter_headers)).json()["totalEarned"] == 1
    friend_account = (await client.get("/api/me/account", headers=friend_headers)).json()
    assert friend_account["totalEarned"] == 6  # 5 for the spend + 1 bonus

    invites = (await client.get("/api/me/referrals", headers=inviter_headers)).json()
    assert len(invites) == 1
    assert invites[0]["status"] == "rewarded"


async def test_the_bonus_is_paid_only_once(client):
    inviter_headers, _ = await sign_in(client, MOBILE)
    await client.patch("/api/me/account", json={"firstName": "Sarah"}, headers=inviter_headers)
    code = (await client.get("/api/me/account", headers=inviter_headers)).json()["referralCode"]

    await sign_in(client, "+447700900456", referral=code)
    await purchase(client, mobile="+447700900456", total=50)
    await purchase(client, mobile="+447700900456", total=50)

    assert (await client.get("/api/me/account", headers=inviter_headers)).json()["totalEarned"] == 1


async def test_a_member_cannot_refer_themselves(client):
    headers, _ = await sign_in(client, MOBILE)
    code = (await client.get("/api/me/account", headers=headers)).json()["referralCode"]

    # Signing in again with one's own code must not attach a referral.
    r = await client.post("/api/auth/request-otp", json={"mobile": MOBILE})
    verify = await client.post("/api/auth/verify-otp",
                               json={"mobile": MOBILE, "code": r.json()["devCode"], "referralCode": code})
    assert verify.json()["referralApplied"] is False


async def test_an_unknown_referral_code_is_ignored_not_fatal(client):
    _, session = await sign_in(client, MOBILE, referral="NOBODY-9999")
    assert session["referralApplied"] is False
    assert session["account"]["mobile"] == MOBILE


# --- Public ---------------------------------------------------------------
async def test_branches_are_public(client):
    r = await client.get("/api/branches")
    assert r.status_code == 200
    body = r.json()
    assert [b["id"] for b in body["branches"]] == ["coulsdon", "wallington", "banstead"]
    assert body["practiceEmail"] == "hello@surreyopticians.co.uk"
    assert all(len(b["hours"]) == 3 for b in body["branches"])


async def test_referral_code_upgrades_from_placeholder_then_stays_put(client):
    headers, _ = await sign_in(client, MOBILE)

    # Before a name is given the code is a placeholder.
    assert (await client.get("/api/me/account", headers=headers)).json()["referralCode"] == "M-0123"

    await client.patch("/api/me/account", json={"firstName": "Sarah"}, headers=headers)
    assert (await client.get("/api/me/account", headers=headers)).json()["referralCode"] == "SARAH-0123"

    # Renaming later must not invalidate a code the member has already shared.
    await client.patch("/api/me/account", json={"firstName": "Sarah-Jane"}, headers=headers)
    assert (await client.get("/api/me/account", headers=headers)).json()["referralCode"] == "SARAH-0123"


async def test_two_members_with_the_same_name_and_ending_get_distinct_codes(client):
    a, _ = await sign_in(client, "+447700900123")
    await client.patch("/api/me/account", json={"firstName": "Sarah"}, headers=a)
    code_a = (await client.get("/api/me/account", headers=a)).json()["referralCode"]

    b, _ = await sign_in(client, "+447701900123")  # same last four digits
    await client.patch("/api/me/account", json={"firstName": "Sarah"}, headers=b)
    code_b = (await client.get("/api/me/account", headers=b)).json()["referralCode"]

    assert code_a == "SARAH-0123"
    assert code_b != code_a


# --- Expiry -----------------------------------------------------------------
async def test_a_new_voucher_runs_for_a_year(client):
    from datetime import date

    r = await purchase(client, total=100)
    voucher = r.json()["vouchersIssued"][0]
    issued = date.fromisoformat(voucher["issued"])
    expires = date.fromisoformat(voucher["expires"])
    assert (expires - issued).days <= 366


async def test_an_out_of_term_voucher_reads_as_expired(client, database):
    await purchase(client, total=100)
    headers, _ = await sign_in(client, MOBILE)
    voucher = (await client.get("/api/me/vouchers", headers=headers)).json()[0]

    # Wind its expiry back past today, as the clock would.
    await database.vouchers.update_one({"_id": voucher["id"]}, {"$set": {"expires": "2020-01-01"}})

    after = (await client.get("/api/me/vouchers", headers=headers)).json()[0]
    assert after["status"] == "expired"


async def test_an_expired_voucher_cannot_be_redeemed(client, database):
    await purchase(client, total=100)
    headers, _ = await sign_in(client, MOBILE)
    voucher = (await client.get("/api/me/vouchers", headers=headers)).json()[0]
    await database.vouchers.update_one({"_id": voucher["id"]}, {"$set": {"expires": "2020-01-01"}})

    r = await client.post(f"/api/me/vouchers/{voucher['id']}/redeem",
                          json={"branchId": "coulsdon"}, headers=headers)
    assert r.status_code == 410
    assert "expired" in r.json()["detail"].lower()


async def test_a_voucher_expiring_today_is_still_good(client, database):
    from datetime import date

    await purchase(client, total=100)
    headers, _ = await sign_in(client, MOBILE)
    voucher = (await client.get("/api/me/vouchers", headers=headers)).json()[0]
    await database.vouchers.update_one(
        {"_id": voucher["id"]}, {"$set": {"expires": date.today().isoformat()}}
    )

    still = (await client.get("/api/me/vouchers", headers=headers)).json()[0]
    assert still["status"] == "available", "the last day of the term still counts"

    r = await client.post(f"/api/me/vouchers/{voucher['id']}/redeem",
                          json={"branchId": "coulsdon"}, headers=headers)
    assert r.status_code == 200


# --- Welcome voucher --------------------------------------------------------
async def test_a_new_member_gets_one_welcome_voucher(client):
    headers, _ = await sign_in(client, MOBILE)
    vouchers = (await client.get("/api/me/vouchers", headers=headers)).json()

    welcome = [v for v in vouchers if v["kind"] == "signup"]
    assert len(welcome) == 1
    assert welcome[0]["value"] == 25
    assert welcome[0]["percentOff"] is None
    assert welcome[0]["appliesTo"] == "glasses"
    assert welcome[0]["status"] == "available"


async def test_the_welcome_voucher_is_issued_only_once(client):
    await sign_in(client, MOBILE)
    await sign_in(client, MOBILE)
    headers, _ = await sign_in(client, MOBILE)

    vouchers = (await client.get("/api/me/vouchers", headers=headers)).json()
    assert len([v for v in vouchers if v["kind"] == "signup"]) == 1


async def test_the_welcome_voucher_runs_for_no_more_than_a_year(client):
    from datetime import date

    headers, _ = await sign_in(client, MOBILE)
    welcome = [v for v in (await client.get("/api/me/vouchers", headers=headers)).json()
               if v["kind"] == "signup"][0]
    term = date.fromisoformat(welcome["expires"]) - date.fromisoformat(welcome["issued"])
    assert term.days <= 366


async def test_a_long_standing_customer_still_gets_one_on_first_sign_in(client):
    # The till knows this patient already; they have never opened the app.
    await purchase(client, total=50)
    headers, session = await sign_in(client, MOBILE)
    assert session["isNewMember"] is False

    vouchers = (await client.get("/api/me/vouchers", headers=headers)).json()
    assert len([v for v in vouchers if v["kind"] == "signup"]) == 1


async def test_the_till_alone_does_not_mint_a_welcome_voucher(client, database):
    await purchase(client, total=50)
    member = await database.members.find_one({"mobile": MOBILE})
    assert await database.vouchers.count_documents(
        {"memberId": member["_id"], "kind": "signup"}
    ) == 0


async def test_the_welcome_voucher_can_be_redeemed(client):
    headers, _ = await sign_in(client, MOBILE)
    welcome = [v for v in (await client.get("/api/me/vouchers", headers=headers)).json()
               if v["kind"] == "signup"][0]

    r = await client.post(f"/api/me/vouchers/{welcome['id']}/redeem",
                          json={"branchId": "coulsdon"}, headers=headers)
    assert r.status_code == 200
    assert r.json()["voucher"]["status"] == "used"


# --- Desk check-in ----------------------------------------------------------
async def test_the_desk_checks_a_patient_in_from_their_qr(client):
    headers, _ = await sign_in(client, MOBILE)
    await client.patch("/api/me/account", json={"firstName": "Sarah", "lastName": "Whitfield"},
                       headers=headers)
    account = (await client.get("/api/me/account", headers=headers)).json()

    code = account["memberCode"]
    assert code.startswith("SM-"), "a membership code must not look like a voucher"

    r = await client.post("/api/staff/check-in",
                          json={"code": code, "branchId": "coulsdon"}, headers=STAFF)
    assert r.status_code == 200

    body = r.json()
    assert body["firstName"] == "Sarah"
    assert body["lastName"] == "Whitfield"
    assert body["memberCode"] == code
    assert body["checkIn"]["branchId"] == "coulsdon"
    assert body["checkIn"]["at"]


async def test_checking_in_awards_no_points(client):
    headers, _ = await sign_in(client, MOBILE)
    code = (await client.get("/api/me/account", headers=headers)).json()["memberCode"]

    before = (await client.get("/api/me/account", headers=headers)).json()["totalEarned"]
    await client.post("/api/staff/check-in", json={"code": code, "branchId": "coulsdon"}, headers=STAFF)
    after = (await client.get("/api/me/account", headers=headers)).json()["totalEarned"]
    assert before == after == 0


async def test_a_patient_can_check_in_at_every_appointment(client, database):
    headers, _ = await sign_in(client, MOBILE)
    code = (await client.get("/api/me/account", headers=headers)).json()["memberCode"]

    for branch in ("coulsdon", "banstead", "coulsdon"):
        r = await client.post("/api/staff/check-in",
                              json={"code": code, "branchId": branch}, headers=STAFF)
        assert r.status_code == 200

    member = await database.members.find_one({"mobile": MOBILE})
    assert await database.checkins.count_documents({"memberId": member["_id"]}) == 3


async def test_scanning_a_voucher_at_the_desk_says_so(client):
    headers, _ = await sign_in(client, MOBILE)
    voucher = (await client.get("/api/me/vouchers", headers=headers)).json()[0]

    r = await client.post("/api/staff/check-in",
                          json={"code": voucher["code"], "branchId": "coulsdon"}, headers=STAFF)
    assert r.status_code == 422
    assert "voucher" in r.json()["detail"].lower()


async def test_an_unknown_code_is_refused(client):
    r = await client.post("/api/staff/check-in",
                          json={"code": "SM-ZZZZ-ZZZZ", "branchId": "coulsdon"}, headers=STAFF)
    assert r.status_code == 404


async def test_check_in_needs_the_staff_key(client):
    headers, _ = await sign_in(client, MOBILE)
    code = (await client.get("/api/me/account", headers=headers)).json()["memberCode"]
    r = await client.post("/api/staff/check-in", json={"code": code, "branchId": "coulsdon"})
    assert r.status_code == 401


async def test_the_welcome_voucher_is_restricted_to_glasses(client):
    headers, _ = await sign_in(client, MOBILE)
    vouchers = (await client.get("/api/me/vouchers", headers=headers)).json()

    welcome = next(v for v in vouchers if v["kind"] == "signup")
    assert welcome["appliesTo"] == "glasses"

    # An earned reward carries no such restriction.
    await purchase(client, total=100)
    vouchers = (await client.get("/api/me/vouchers", headers=headers)).json()
    reward = next(v for v in vouchers if v["kind"] == "reward")
    assert reward["appliesTo"] == "any"


async def test_the_desk_sees_a_waiting_reward(client):
    await purchase(client, total=100)
    headers, _ = await sign_in(client, MOBILE)
    code = (await client.get("/api/me/account", headers=headers)).json()["memberCode"]

    r = await client.post("/api/staff/check-in",
                          json={"code": code, "branchId": "coulsdon"}, headers=STAFF)
    # One earned reward plus the welcome voucher.
    assert r.json()["vouchersAvailable"] == 2


async def test_member_codes_are_distinct_per_member(client):
    a, _ = await sign_in(client, "+447700900123")
    b, _ = await sign_in(client, "+447700900456")
    code_a = (await client.get("/api/me/account", headers=a)).json()["memberCode"]
    code_b = (await client.get("/api/me/account", headers=b)).json()["memberCode"]
    assert code_a != code_b
