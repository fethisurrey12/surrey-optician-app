"""The desk's own view: finding a patient and reading their record."""

import pytest

from tests.conftest import sign_in

pytestmark = pytest.mark.anyio

STAFF = {"X-Staff-Key": "test-staff-key"}


async def a_member(client, mobile, first, last, email=None):
    headers, _ = await sign_in(client, mobile=mobile)
    changes = {"firstName": first, "lastName": last}
    if email:
        changes["email"] = email
    r = await client.patch("/api/me/account", json=changes, headers=headers)
    assert r.status_code == 200, r.text
    return headers, r.json()


async def find(client, q, key=STAFF):
    return await client.get("/api/staff/members", params={"q": q}, headers=key)


# --- The guard ------------------------------------------------------------
async def test_desk_endpoints_need_the_staff_key(client):
    assert (await client.get("/api/staff/members", params={"q": "sarah"})).status_code == 401
    assert (await find(client, "sarah", {"X-Staff-Key": "wrong"})).status_code == 401
    assert (await client.get("/api/staff/session", headers=STAFF)).status_code == 200


# --- Searching ------------------------------------------------------------
async def test_finds_a_patient_by_first_name(client):
    await a_member(client, "+447700900123", "Sarah", "Jones")
    r = await find(client, "sar")
    assert r.status_code == 200
    assert [m["lastName"] for m in r.json()] == ["Jones"]


async def test_finds_a_patient_by_surname(client):
    await a_member(client, "+447700900123", "Sarah", "Jones")
    assert [m["firstName"] for m in (await find(client, "jones")).json()] == ["Sarah"]


async def test_first_and_surname_must_match_the_same_record(client):
    await a_member(client, "+447700900123", "Sarah", "Jones")
    await a_member(client, "+447700900124", "Mark", "Smith")

    found = (await find(client, "sarah j")).json()
    assert [m["lastName"] for m in found] == ["Jones"]


async def test_finds_a_patient_by_the_number_they_read_out(client):
    await a_member(client, "+447700900123", "Sarah", "Jones")

    # However the colleague types it: local form, spaced, or the tail only.
    for typed in ("07700900123", "07700 900123", "900123", "+447700900123"):
        found = (await find(client, typed)).json()
        assert [m["firstName"] for m in found] == ["Sarah"], typed


async def test_finds_a_patient_by_membership_code(client):
    _, account = await a_member(client, "+447700900123", "Sarah", "Jones")
    found = (await find(client, account["memberCode"].lower())).json()
    assert [m["firstName"] for m in found] == ["Sarah"]


async def test_two_letters_of_the_code_prefix_is_not_a_search(client):
    await a_member(client, "+447700900123", "Sarah", "Jones")
    # Every code starts SM-, so "sm" must not list the whole membership.
    assert (await find(client, "sm")).json() == []


async def test_a_single_character_finds_nothing(client):
    await a_member(client, "+447700900123", "Sarah", "Jones")
    assert (await find(client, "s")).json() == []


async def test_a_patient_with_no_name_yet_is_not_matched_by_a_name(client):
    await sign_in(client, mobile="+447700900199")
    assert (await find(client, "sarah")).json() == []


async def test_search_does_not_take_a_regular_expression(client):
    await a_member(client, "+447700900123", "Sarah", "Jones")
    # A full stop is a literal here, not "any character".
    assert (await find(client, ".arah")).json() == []


# --- The record -----------------------------------------------------------
async def test_the_record_shows_points_vouchers_visits_and_arrivals(client):
    _, account = await a_member(client, "+447700900123", "Sarah", "Jones", "sarah@example.com")
    member_id = (await find(client, "sarah")).json()[0]["id"]

    r = await client.post(
        "/api/staff/purchases",
        json={"mobile": "+447700900123", "branchId": "coulsdon", "title": "Frames", "total": 120},
        headers=STAFF,
    )
    assert r.status_code == 200, r.text

    r = await client.post(
        "/api/staff/check-in",
        json={"code": account["memberCode"], "branchId": "wallington"},
        headers=STAFF,
    )
    assert r.status_code == 200, r.text
    # The scan hands back the record to open, not just a name to read out.
    assert r.json()["memberId"] == member_id

    r = await client.get(f"/api/staff/members/{member_id}", headers=STAFF)
    assert r.status_code == 200, r.text
    detail = r.json()

    assert detail["account"]["email"] == "sarah@example.com"
    assert detail["account"]["points"] == 2
    assert detail["account"]["totalEarned"] == 12
    # The welcome voucher, plus the £10 reward the £120 unlocked.
    assert sorted(v["kind"] for v in detail["vouchers"]) == ["reward", "signup"]
    assert any(t["title"] == "Frames" for t in detail["activity"])
    assert [c["branchId"] for c in detail["checkIns"]] == ["wallington"]


async def test_an_unknown_record_is_a_404(client):
    r = await client.get("/api/staff/members/m-nobody", headers=STAFF)
    assert r.status_code == 404
