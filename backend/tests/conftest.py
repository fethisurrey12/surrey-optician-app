"""Test fixtures: an in-memory Mongo and an HTTP client bound to the app."""

import os
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

# Settings must be in place before config is imported by anything else.
os.environ.setdefault("JWT_SECRET", "test-secret-not-for-production-min-32-bytes")
os.environ.setdefault("STAFF_API_KEY", "test-staff-key")
os.environ.setdefault("SEED_DEMO_DATA", "false")
os.environ.setdefault("EXPOSE_DEV_OTP", "true")
os.environ.setdefault("OTP_RESEND_COOLDOWN_SECONDS", "0")

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from mongomock_motor import AsyncMongoMockClient

import db as db_module


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest_asyncio.fixture
async def database():
    mock = AsyncMongoMockClient()["surrey_test"]
    db_module.set_db(mock)
    await db_module.ensure_indexes()
    yield mock
    db_module.set_db(None)


class CapturingSms:
    """Stands in for the gateway so tests can read the code that was sent."""

    name = "capture"

    def __init__(self):
        self.sent = []

    async def send(self, to, body):
        self.sent.append((to, body))
        return True


@pytest_asyncio.fixture
async def sms():
    import sms as sms_module

    sender = CapturingSms()
    sms_module.set_sender(sender)
    yield sender
    sms_module.set_sender(None)


@pytest_asyncio.fixture
async def client(database, sms):
    from server import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


async def sign_in(client, mobile="+447700900123", referral=None):
    """Full OTP round trip. Returns (auth headers, session payload)."""
    r = await client.post("/api/auth/request-otp", json={"mobile": mobile})
    assert r.status_code == 200, r.text
    code = r.json()["devCode"]

    body = {"mobile": mobile, "code": code}
    if referral:
        body["referralCode"] = referral
    r = await client.post("/api/auth/verify-otp", json=body)
    assert r.status_code == 200, r.text
    data = r.json()
    return {"Authorization": f"Bearer {data['token']}"}, data
