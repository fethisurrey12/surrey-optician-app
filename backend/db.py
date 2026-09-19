"""MongoDB connection and index setup.

The client is created lazily on first use rather than at import, so the module
can be imported (and the models exercised) without MONGO_URL being set — tests
inject an in-memory database through `use_database` instead.
"""

import os
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

BRANCHES = "branches"
ACCOUNTS = "accounts"
VOUCHERS = "vouchers"
TXNS = "txns"
REFERRALS = "referrals"

_client: Optional[AsyncIOMotorClient] = None
_db: Optional[AsyncIOMotorDatabase] = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    return _client


def get_db() -> AsyncIOMotorDatabase:
    """The loyalty database. Honours an injected database if one is set."""
    global _db
    if _db is None:
        _db = get_client()[os.environ["DB_NAME"]]
    return _db


def use_database(db: Optional[AsyncIOMotorDatabase]) -> None:
    """Point the module at a specific database. Passing None restores the default."""
    global _db
    _db = db


def close() -> None:
    global _client, _db
    if _client is not None:
        _client.close()
    _client, _db = None, None


async def ensure_indexes(db: Optional[AsyncIOMotorDatabase] = None) -> None:
    """Create the indexes the app's queries rely on. Safe to call repeatedly.

    Every collection is keyed by `_id`, so these cover only the secondary
    lookups: a member signing in by mobile, a friend quoting a referral code, a
    colleague scanning a voucher code at the till, and the per-member lists
    behind the rewards and activity tabs.
    """
    d = db if db is not None else get_db()

    # Sign-in and referral redemption both look a member up by a non-_id field.
    # mobile duplicates _id today, but indexing it keeps the query honest if an
    # account key ever stops being the mobile number.
    await d[ACCOUNTS].create_index("mobile", unique=True, name="mobile_unique")
    await d[ACCOUNTS].create_index(
        "referralCode", unique=True, name="referralCode_unique"
    )

    # The till scans a voucher code; the rewards tab lists a member's vouchers
    # newest first, split by status.
    await d[VOUCHERS].create_index("code", unique=True, name="code_unique")
    await d[VOUCHERS].create_index(
        [("accountId", 1), ("status", 1), ("issued", -1)], name="account_status_issued"
    )

    # The activity tab and both nudges read a member's ledger newest first.
    await d[TXNS].create_index([("accountId", 1), ("date", -1)], name="account_date")
    # The eye-test recall and lens-reorder nudges filter that ledger by category.
    await d[TXNS].create_index(
        [("accountId", 1), ("category", 1), ("date", -1)], name="account_category_date"
    )

    await d[REFERRALS].create_index(
        [("accountId", 1), ("invited", -1)], name="account_invited"
    )
