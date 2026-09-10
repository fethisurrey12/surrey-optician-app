"""Sign-in: the OTP round trip and the limits that protect it."""

import pytest

from tests.conftest import sign_in

pytestmark = pytest.mark.anyio

MOBILE = "+447700900123"


async def test_request_and_verify_signs_a_member_in(client, sms):
    r = await client.post("/api/auth/request-otp", json={"mobile": MOBILE})
    assert r.status_code == 200
    assert len(sms.sent) == 1
    assert sms.sent[0][0] == MOBILE

    code = r.json()["devCode"]
    r = await client.post("/api/auth/verify-otp", json={"mobile": MOBILE, "code": code})
    assert r.status_code == 200

    body = r.json()
    assert body["isNewMember"] is True
    assert body["account"]["mobile"] == MOBILE
    assert body["account"]["mobileDisplay"] == "+44 7700 900123"
    assert body["token"]


async def test_any_uk_mobile_format_reaches_the_same_account(client):
    headers, first = await sign_in(client, "07700900123")
    _, second = await sign_in(client, "+44 7700 900123")
    assert first["account"]["id"] == second["account"]["id"]
    assert second["isNewMember"] is False


async def test_non_uk_mobile_is_rejected(client):
    r = await client.post("/api/auth/request-otp", json={"mobile": "12345"})
    assert r.status_code == 422


async def test_wrong_code_is_refused(client):
    r = await client.post("/api/auth/request-otp", json={"mobile": MOBILE})
    wrong = "000000" if r.json()["devCode"] != "000000" else "111111"
    r = await client.post("/api/auth/verify-otp", json={"mobile": MOBILE, "code": wrong})
    assert r.status_code == 401


async def test_a_code_cannot_be_used_twice(client):
    r = await client.post("/api/auth/request-otp", json={"mobile": MOBILE})
    code = r.json()["devCode"]

    assert (await client.post("/api/auth/verify-otp", json={"mobile": MOBILE, "code": code})).status_code == 200
    replay = await client.post("/api/auth/verify-otp", json={"mobile": MOBILE, "code": code})
    assert replay.status_code == 401


async def test_requesting_a_new_code_invalidates_the_old_one(client):
    first = (await client.post("/api/auth/request-otp", json={"mobile": MOBILE})).json()["devCode"]
    second = (await client.post("/api/auth/request-otp", json={"mobile": MOBILE})).json()["devCode"]
    if first == second:
        pytest.skip("the two random codes collided")

    stale = await client.post("/api/auth/verify-otp", json={"mobile": MOBILE, "code": first})
    assert stale.status_code == 401
    assert (await client.post("/api/auth/verify-otp", json={"mobile": MOBILE, "code": second})).status_code == 200


async def test_codes_are_never_stored_in_plain_text(client, database):
    r = await client.post("/api/auth/request-otp", json={"mobile": MOBILE})
    code = r.json()["devCode"]
    record = await database.otps.find_one({"mobile": MOBILE})
    assert "code" not in record
    assert record["codeHash"] != code
    assert record["codeHash"].startswith("$2b$")


async def test_brute_force_is_cut_off(client):
    from config import OTP_MAX_ATTEMPTS

    r = await client.post("/api/auth/request-otp", json={"mobile": MOBILE})
    real = r.json()["devCode"]
    wrong = "000000" if real != "000000" else "111111"

    for _ in range(OTP_MAX_ATTEMPTS):
        await client.post("/api/auth/verify-otp", json={"mobile": MOBILE, "code": wrong})

    # Even the correct code is refused once the attempt budget is spent.
    blocked = await client.post("/api/auth/verify-otp", json={"mobile": MOBILE, "code": real})
    assert blocked.status_code == 429


async def test_too_many_codes_per_hour_is_refused(client):
    from config import OTP_MAX_PER_HOUR

    for _ in range(OTP_MAX_PER_HOUR):
        assert (await client.post("/api/auth/request-otp", json={"mobile": MOBILE})).status_code == 200

    over = await client.post("/api/auth/request-otp", json={"mobile": MOBILE})
    assert over.status_code == 429


async def test_protected_routes_need_a_token(client):
    assert (await client.get("/api/me/account")).status_code == 401
    assert (await client.get("/api/me/vouchers")).status_code == 401
    bad = await client.get("/api/me/account", headers={"Authorization": "Bearer nonsense"})
    assert bad.status_code == 401


async def test_me_returns_the_signed_in_member(client):
    headers, session = await sign_in(client)
    r = await client.get("/api/auth/me", headers=headers)
    assert r.status_code == 200
    assert r.json()["id"] == session["account"]["id"]
