"""Wallet endpoints, in process.

Signing material is not configured here, so the pass endpoints must refuse
cleanly and /status must report exactly what is missing.
"""

import pytest

pytestmark = pytest.mark.anyio


async def test_status_reports_what_is_missing(client):
    r = await client.get("/api/wallet/status")
    assert r.status_code == 200

    body = r.json()
    assert set(body) >= {"apple", "google", "missing"}
    assert body["apple"] is False
    assert body["google"] is False
    assert body["missing"], "unconfigured wallet should name the missing material"


async def test_pass_endpoints_refuse_while_unconfigured(client):
    params = {"value": 10, "expires": "2027-12-15", "member": "Sarah Whitfield", "branch": "Coulsdon"}
    apple = await client.get("/api/wallet/apple/SO-7F3K-92QX.pkpass", params=params)
    google = await client.get("/api/wallet/google/SO-7F3K-92QX", params=params)
    assert apple.status_code == 503
    assert google.status_code == 503


async def test_pass_endpoints_validate_their_input(client):
    # `expires` carries the pass's own expiry date, so it is not optional.
    r = await client.get("/api/wallet/apple/SO-7F3K-92QX.pkpass")
    assert r.status_code == 422
