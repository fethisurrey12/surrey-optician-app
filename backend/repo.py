"""Data access for the loyalty scheme.

One function per thing a screen needs, mirroring the six calls in
`frontend/src/api/mock.ts` so the mock layer can be swapped for HTTP without a
screen changing. Functions return models; serialising them is the route
layer's job.
"""

from datetime import date
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument

import db as dbmod
from models import Account, Branch, Referral, Txn, Voucher, WalletProvider


class NotFound(Exception):
    """No such document for this member."""


class AlreadyRedeemed(Exception):
    """The voucher exists but has already been marked used."""


def today() -> str:
    return date.today().isoformat()


def _db(db: Optional[AsyncIOMotorDatabase]) -> AsyncIOMotorDatabase:
    return db if db is not None else dbmod.get_db()


async def list_branches(db: Optional[AsyncIOMotorDatabase] = None) -> list[Branch]:
    cur = _db(db)[dbmod.BRANCHES].find().sort("name", 1)
    return [Branch(**doc) async for doc in cur]


async def get_account(
    account_id: str, db: Optional[AsyncIOMotorDatabase] = None
) -> Account:
    doc = await _db(db)[dbmod.ACCOUNTS].find_one({"_id": account_id})
    if doc is None:
        raise NotFound(f"No account {account_id}")
    return Account(**doc)


async def find_account_by_mobile(
    mobile: str, db: Optional[AsyncIOMotorDatabase] = None
) -> Optional[Account]:
    """Sign-in lookup. None rather than raising — an unknown number is a normal
    outcome at the phone step, not an error."""
    doc = await _db(db)[dbmod.ACCOUNTS].find_one({"mobile": mobile})
    return Account(**doc) if doc else None


async def find_account_by_referral_code(
    code: str, db: Optional[AsyncIOMotorDatabase] = None
) -> Optional[Account]:
    """Resolves the inviter when a friend quotes a code at their first visit."""
    doc = await _db(db)[dbmod.ACCOUNTS].find_one({"referralCode": code})
    return Account(**doc) if doc else None


async def list_vouchers(
    account_id: str, db: Optional[AsyncIOMotorDatabase] = None
) -> list[Voucher]:
    cur = _db(db)[dbmod.VOUCHERS].find({"accountId": account_id}).sort("issued", -1)
    return [Voucher(**doc) async for doc in cur]


async def list_activity(
    account_id: str, db: Optional[AsyncIOMotorDatabase] = None
) -> list[Txn]:
    """Newest first, matching the order the activity tab renders."""
    cur = _db(db)[dbmod.TXNS].find({"accountId": account_id}).sort("date", -1)
    return [Txn(**doc) async for doc in cur]


async def list_referrals(
    account_id: str, db: Optional[AsyncIOMotorDatabase] = None
) -> list[Referral]:
    cur = _db(db)[dbmod.REFERRALS].find({"accountId": account_id}).sort("invited", -1)
    return [Referral(**doc) async for doc in cur]


async def mark_voucher_used(
    account_id: str,
    voucher_id: str,
    branch_id: str,
    db: Optional[AsyncIOMotorDatabase] = None,
) -> Voucher:
    """Redeem at the till. A colleague triggers this after applying the £10 in
    the practice system — the app never self-redeems.

    The status guard is part of the filter, so two tills scanning the same
    voucher cannot both succeed: the second update matches nothing.
    """
    d = _db(db)
    doc = await d[dbmod.VOUCHERS].find_one_and_update(
        {"_id": voucher_id, "accountId": account_id, "status": "available"},
        {
            "$set": {
                "status": "used",
                "usedAt": today(),
                "usedBranchId": branch_id,
            }
        },
        return_document=ReturnDocument.AFTER,
    )
    if doc is not None:
        return Voucher(**doc)

    # Nothing matched — say which of the two reasons it was.
    existing = await d[dbmod.VOUCHERS].find_one(
        {"_id": voucher_id, "accountId": account_id}
    )
    if existing is None:
        raise NotFound(f"No voucher {voucher_id} for {account_id}")
    raise AlreadyRedeemed(f"Voucher {voucher_id} was used on {existing.get('usedAt')}")


async def mark_voucher_in_wallet(
    account_id: str,
    voucher_id: str,
    provider: WalletProvider,
    db: Optional[AsyncIOMotorDatabase] = None,
) -> Voucher:
    """Record that the member added the pass to Apple or Google Wallet. The pass
    itself is produced by `wallet.py`; this only drives the app's in-wallet state."""
    doc = await _db(db)[dbmod.VOUCHERS].find_one_and_update(
        {"_id": voucher_id, "accountId": account_id},
        {"$set": {"wallet": provider}},
        return_document=ReturnDocument.AFTER,
    )
    if doc is None:
        raise NotFound(f"No voucher {voucher_id} for {account_id}")
    return Voucher(**doc)
