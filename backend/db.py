"""Mongo connection and index setup.

One client for the process, created lazily so importing this module never
blocks on a database that may not be up yet. Tests swap `_client` for an
in-memory double before anything touches it.
"""

from __future__ import annotations

import logging

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING

from config import DB_NAME, MONGO_TIMEOUT_MS, MONGO_URL, OTP_TTL_SECONDS

log = logging.getLogger(__name__)

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


def get_db() -> AsyncIOMotorDatabase:
    global _client, _db
    if _db is None:
        # Without a short selection timeout the driver waits 30s before
        # admitting the database is unreachable, which stalls startup and makes
        # every request hang instead of returning promptly.
        _client = AsyncIOMotorClient(
            MONGO_URL,
            uuidRepresentation="standard",
            serverSelectionTimeoutMS=MONGO_TIMEOUT_MS,
            connectTimeoutMS=MONGO_TIMEOUT_MS,
        )
        _db = _client[DB_NAME]
    return _db


def set_db(database: AsyncIOMotorDatabase) -> None:
    """Point the module at a supplied database — used by the test suite."""
    global _db
    _db = database


async def close_db() -> None:
    global _client, _db
    if _client is not None:
        _client.close()
    _client, _db = None, None


async def ensure_indexes() -> None:
    """Create the indexes the queries and invariants depend on.

    Uniqueness on mobile and voucher code is enforced here rather than in
    application code, so a race between two requests cannot create a duplicate
    member or issue the same voucher code twice.
    """
    db = get_db()

    await db.members.create_index([("mobile", ASCENDING)], unique=True, name="member_mobile")
    await db.members.create_index([("referralCode", ASCENDING)], unique=True, name="member_referral")
    await db.members.create_index(
        [("memberCode", ASCENDING)], unique=True, sparse=True, name="member_code"
    )

    await db.checkins.create_index(
        [("memberId", ASCENDING), ("at", DESCENDING)], name="checkin_member_at"
    )

    await db.transactions.create_index(
        [("memberId", ASCENDING), ("date", DESCENDING)], name="txn_member_date"
    )
    await db.transactions.create_index([("idempotencyKey", ASCENDING)],
                                       unique=True, sparse=True, name="txn_idempotency")

    await db.vouchers.create_index([("code", ASCENDING)], unique=True, name="voucher_code")
    await db.vouchers.create_index(
        [("memberId", ASCENDING), ("status", ASCENDING)], name="voucher_member_status"
    )

    await db.referrals.create_index([("inviterId", ASCENDING)], name="referral_inviter")
    await db.referrals.create_index([("inviteeId", ASCENDING)], sparse=True, name="referral_invitee")

    # Mongo evicts expired one-time codes for us; nothing sweeps them by hand.
    await db.otps.create_index([("mobile", ASCENDING)], name="otp_mobile")
    await db.otps.create_index(
        [("createdAt", ASCENDING)],
        expireAfterSeconds=OTP_TTL_SECONDS * 4,
        name="otp_ttl",
    )
    log.info("indexes ensured on %s", DB_NAME)
