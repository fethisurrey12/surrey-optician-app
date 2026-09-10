"""Domain operations: members, purchases, vouchers, referrals.

The routes stay thin; the rules live here. Two invariants this module owns:

* `points` is always `totalEarned % POINTS_PER_REWARD` — the balance shown on
  the ring is derived from lifetime earnings, never accumulated separately, so
  it cannot drift out of step with the vouchers actually issued.
* A voucher is issued exactly once per reward threshold crossed, and only ever
  by `record_purchase`.
"""

from __future__ import annotations

import logging
import uuid
from datetime import date, datetime, timezone
from typing import Optional

from fastapi import HTTPException, status
from pymongo.errors import DuplicateKeyError

from config import (
    POINTS_PER_REWARD,
    REFERRAL_BONUS_POINTS,
    SIGNUP_VOUCHER_ENABLED,
    SIGNUP_VOUCHER_PERCENT,
    SIGNUP_VOUCHER_TTL_MONTHS,
    VOUCHER_VALUE_PENCE,
)
from db import get_db
from phone import last_four
from scheme import (
    add_months,
    iso_date,
    member_code,
    points_for_spend,
    pounds_to_pence,
    private_pence,
    referral_code,
    rewards_earned,
    voucher_code,
    voucher_expiry,
)

log = logging.getLogger(__name__)


def _uid(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:10]}"


def _today() -> str:
    return iso_date(datetime.now(timezone.utc).date())


# --- Members --------------------------------------------------------------
async def find_member(mobile: str) -> Optional[dict]:
    return await get_db().members.find_one({"mobile": mobile})


async def unique_referral_code(first_name: str, mobile: str) -> str:
    """NAME-DDDD, with a numeric suffix if that pair is already taken."""
    db = get_db()
    base = referral_code(first_name, mobile)
    if not await db.members.find_one({"referralCode": base}):
        return base
    for n in range(2, 100):
        candidate = f"{base}{n}"
        if not await db.members.find_one({"referralCode": candidate}):
            return candidate
    return f"{base}{uuid.uuid4().hex[:4].upper()}"


async def create_member(mobile: str, first_name: str = "", last_name: str = "",
                        home_branch_id: str = "coulsdon") -> dict:
    db = get_db()
    doc = {
        "_id": _uid("m"),
        "mobile": mobile,
        "firstName": first_name,
        "lastName": last_name,
        "email": "",
        "homeBranchId": home_branch_id,
        "memberSince": _today(),
        "points": 0,
        "totalEarned": 0,
        "referralCode": await unique_referral_code(first_name or f"M{last_four(mobile)}", mobile),
        # A member who signs up before giving their name gets a placeholder code.
        # It is reissued once they tell us their name — see update_member — because
        # the join page reads the inviter's name back out of the code.
        "referralCodeAuto": not bool(first_name),
        "memberCode": member_code(),
        "createdAt": datetime.now(timezone.utc),
    }
    try:
        await db.members.insert_one(doc)
    except DuplicateKeyError:
        # Two requests raced on first sign-in; the other one won.
        existing = await find_member(mobile)
        if existing:
            return existing
        raise
    return doc


async def get_or_create_member(mobile: str) -> tuple[dict, bool]:
    existing = await find_member(mobile)
    if existing:
        return existing, False
    return await create_member(mobile), True


async def ensure_member_code(member_id: str) -> dict:
    """Give an older member record a code the first time it is needed."""
    db = get_db()
    doc = await db.members.find_one({"_id": member_id})
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Account not found")
    if doc.get("memberCode"):
        return doc

    for _ in range(5):
        try:
            await db.members.update_one(
                {"_id": member_id}, {"$set": {"memberCode": member_code()}}
            )
            return await db.members.find_one({"_id": member_id})
        except DuplicateKeyError:
            continue
    raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Could not allocate a member code")


async def check_in(code: str, branch_id: str) -> tuple[dict, dict]:
    """Record a patient arriving at the desk. Returns (member, check-in).

    The desk scans the patient's membership QR; this says who they are and
    notes the arrival. It does not touch points — checking in is not a purchase.
    """
    db = get_db()
    code = (code or "").strip().upper()

    member = await db.members.find_one({"memberCode": code})
    if not member:
        # A colleague scanning the wrong QR is the likeliest mistake, so say so.
        if code.startswith("SO-"):
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                "That is a reward voucher, not a membership code. Ask for the check-in QR.",
            )
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No member found for that code")

    now = datetime.now(timezone.utc)
    doc = {
        "_id": _uid("c"),
        "memberId": member["_id"],
        "branchId": branch_id,
        "at": now,
        "date": iso_date(now.date()),
    }
    await db.checkins.insert_one(doc)
    return member, doc


async def recent_check_in(member_id: str, within_minutes: int = 60) -> Optional[dict]:
    """The member's latest arrival, if it is recent enough to still be the one."""
    db = get_db()
    doc = await get_db().checkins.find_one({"memberId": member_id}, sort=[("at", -1)])
    if not doc:
        return None
    at = doc["at"] if doc["at"].tzinfo else doc["at"].replace(tzinfo=timezone.utc)
    if (datetime.now(timezone.utc) - at).total_seconds() > within_minutes * 60:
        return None
    return doc


async def update_member(member_id: str, changes: dict) -> dict:
    db = get_db()
    changes = {k: v for k, v in changes.items() if v is not None}

    current = await db.members.find_one({"_id": member_id})
    if not current:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Account not found")

    # Upgrade a placeholder referral code the first time we learn a real name.
    # Only ever a placeholder: a code the member may already have shared with a
    # friend must keep working.
    new_name = (changes.get("firstName") or "").strip()
    if new_name and current.get("referralCodeAuto"):
        changes["referralCode"] = await unique_referral_code(new_name, current["mobile"])
        changes["referralCodeAuto"] = False

    if changes:
        changes["updatedAt"] = datetime.now(timezone.utc)
        await db.members.update_one({"_id": member_id}, {"$set": changes})
    doc = await db.members.find_one({"_id": member_id})
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Account not found")
    return doc


# --- Vouchers -------------------------------------------------------------
async def issue_voucher(
    member_id: str,
    issued: Optional[str] = None,
    *,
    kind: str = "reward",
    percent_off: Optional[int] = None,
    value_pence: Optional[int] = VOUCHER_VALUE_PENCE,
    ttl_months: Optional[int] = None,
) -> dict:
    """Mint one voucher. Retries on the astronomically unlikely code clash.

    A "reward" voucher is worth a fixed amount; a "signup" voucher takes a
    percentage off instead, so exactly one of value_pence and percent_off is
    set on the document.
    """
    db = get_db()
    issued_date = date.fromisoformat(issued) if issued else datetime.now(timezone.utc).date()
    expires = (
        add_months(issued_date, ttl_months) if ttl_months is not None
        else voucher_expiry(issued_date)
    )
    for _ in range(5):
        doc = {
            "_id": _uid("v"),
            "memberId": member_id,
            "code": voucher_code(),
            "kind": kind,
            "valuePence": None if percent_off else value_pence,
            "percentOff": percent_off,
            "issued": iso_date(issued_date),
            "expires": iso_date(expires),
            "status": "available",
            "createdAt": datetime.now(timezone.utc),
        }
        try:
            await db.vouchers.insert_one(doc)
            return doc
        except DuplicateKeyError:
            continue
    raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Could not allocate a voucher code")


async def issue_signup_voucher(member_id: str) -> Optional[dict]:
    """The welcome offer — one per member, ever.

    Issued when a patient first signs in to the app, not when the till first
    creates their record: a long-standing customer who has been buying in
    branch for years still gets their welcome voucher the day they sign up.

    Guarded by a lookup rather than a flag on the member, so the rule holds
    even if two sign-ins race each other.
    """
    if not SIGNUP_VOUCHER_ENABLED or SIGNUP_VOUCHER_PERCENT <= 0:
        return None

    db = get_db()
    if await db.vouchers.find_one({"memberId": member_id, "kind": "signup"}):
        return None

    return await issue_voucher(
        member_id,
        kind="signup",
        percent_off=SIGNUP_VOUCHER_PERCENT,
        value_pence=None,
        ttl_months=SIGNUP_VOUCHER_TTL_MONTHS,
    )


async def list_vouchers(member_id: str) -> list[dict]:
    cursor = get_db().vouchers.find({"memberId": member_id}).sort("issued", -1)
    return await cursor.to_list(500)


async def redeem_voucher(member_id: str, voucher_id: str, branch_id: str) -> dict:
    """Mark a voucher used at the till.

    The status guard in the filter makes this idempotent under concurrency: a
    second request for the same voucher matches nothing and is rejected, so a
    GBP 10 credit cannot be applied twice.
    """
    db = get_db()

    # Checked before the update so an out-of-term voucher is refused with a
    # reason, rather than being silently redeemable because the stored status
    # still reads "available".
    existing = await db.vouchers.find_one({"_id": voucher_id, "memberId": member_id})
    if existing and existing["status"] == "available" and existing["expires"] < _today():
        raise HTTPException(
            status.HTTP_410_GONE,
            f"That voucher expired on {existing['expires']}",
        )

    result = await db.vouchers.find_one_and_update(
        {"_id": voucher_id, "memberId": member_id, "status": "available"},
        {
            "$set": {
                "status": "used",
                "usedAt": _today(),
                "usedBranchId": branch_id,
            }
        },
        return_document=True,
    )
    if not result:
        current = await db.vouchers.find_one({"_id": voucher_id, "memberId": member_id})
        if current is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Voucher not found")
        raise HTTPException(status.HTTP_409_CONFLICT, "That voucher has already been used")

    await db.transactions.insert_one(
        {
            "_id": _uid("t"),
            "memberId": member_id,
            "date": _today(),
            "branchId": branch_id,
            "kind": "reward",
            "title": "£10 reward redeemed",
            "detail": "Applied at the till",
            "totalPence": 0,
            "points": 0,
            "createdAt": datetime.now(timezone.utc),
        }
    )
    return result


async def set_voucher_wallet(member_id: str, voucher_id: str, provider: str) -> dict:
    db = get_db()
    doc = await db.vouchers.find_one_and_update(
        {"_id": voucher_id, "memberId": member_id},
        {"$set": {"wallet": provider}},
        return_document=True,
    )
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Voucher not found")
    return doc


# --- Activity -------------------------------------------------------------
async def list_activity(member_id: str, limit: int = 500) -> list[dict]:
    cursor = get_db().transactions.find({"memberId": member_id}).sort(
        [("date", -1), ("createdAt", -1)]
    )
    return await cursor.to_list(limit)


async def record_purchase(
    mobile: str,
    branch_id: str,
    title: str,
    total_pounds: float,
    nhs_pounds: float = 0,
    detail: Optional[str] = None,
    category: Optional[str] = None,
    supply_months: Optional[int] = None,
    on_date: Optional[str] = None,
    idempotency_key: Optional[str] = None,
) -> tuple[dict, dict, list[dict]]:
    """Record a till purchase, award points, and issue any rewards it unlocks.

    Returns (transaction, updated member, vouchers issued).
    """
    db = get_db()
    member, _ = await get_or_create_member(mobile)

    if idempotency_key:
        seen = await db.transactions.find_one({"idempotencyKey": idempotency_key})
        if seen:
            fresh = await db.members.find_one({"_id": seen["memberId"]})
            issued = await db.vouchers.find({"_id": {"$in": seen.get("vouchersIssued", [])}}).to_list(20)
            return seen, fresh, issued

    total_p = pounds_to_pence(total_pounds)
    nhs_p = pounds_to_pence(nhs_pounds or 0)
    if nhs_p > total_p:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "The NHS contribution cannot be more than the total",
        )

    eligible = private_pence(total_p, nhs_p)
    points = points_for_spend(eligible)

    previous_total = member.get("totalEarned", 0)
    new_total = previous_total + points

    txn_date = on_date or _today()
    txn = {
        "_id": _uid("t"),
        "memberId": member["_id"],
        "date": txn_date,
        "branchId": branch_id,
        "kind": "spend",
        "title": title,
        "detail": detail,
        "category": category,
        "supplyMonths": supply_months,
        "totalPence": total_p,
        "nhsPence": nhs_p or None,
        "privatePence": eligible,
        "points": points,
        "createdAt": datetime.now(timezone.utc),
    }
    if idempotency_key:
        txn["idempotencyKey"] = idempotency_key

    try:
        await db.transactions.insert_one(txn)
    except DuplicateKeyError:
        seen = await db.transactions.find_one({"idempotencyKey": idempotency_key})
        fresh = await db.members.find_one({"_id": member["_id"]})
        return seen, fresh, []

    # Issue a voucher for every reward threshold this purchase crossed.
    issued: list[dict] = []
    for _ in range(rewards_earned(previous_total, new_total)):
        voucher = await issue_voucher(member["_id"], txn_date)
        issued.append(voucher)
        await db.transactions.insert_one(
            {
                "_id": _uid("t"),
                "memberId": member["_id"],
                "date": txn_date,
                "branchId": branch_id,
                "kind": "reward",
                "title": "£10 reward unlocked",
                "detail": "Added to your wallet",
                "totalPence": 0,
                "points": 0,
                "voucherId": voucher["_id"],
                "createdAt": datetime.now(timezone.utc),
            }
        )

    if issued:
        await db.transactions.update_one(
            {"_id": txn["_id"]}, {"$set": {"vouchersIssued": [v["_id"] for v in issued]}}
        )

    updated = await _apply_points(member["_id"], new_total)
    await _settle_referral_on_first_purchase(member["_id"])
    return txn, updated, issued


async def _apply_points(member_id: str, new_total: int) -> dict:
    """Set lifetime total and derive the displayed balance from it."""
    db = get_db()
    await db.members.update_one(
        {"_id": member_id},
        {"$set": {"totalEarned": new_total, "points": new_total % POINTS_PER_REWARD}},
    )
    return await db.members.find_one({"_id": member_id})


# --- Referrals ------------------------------------------------------------
async def attach_referral(invitee_id: str, code: str) -> bool:
    """Link a new member to their inviter. Returns False if the code is unusable."""
    db = get_db()
    code = (code or "").strip().upper()
    if not code:
        return False

    inviter = await db.members.find_one({"referralCode": code})
    if not inviter or inviter["_id"] == invitee_id:
        return False

    invitee = await db.members.find_one({"_id": invitee_id})
    if not invitee or invitee.get("referredBy"):
        return False

    await db.members.update_one({"_id": invitee_id}, {"$set": {"referredBy": inviter["_id"]}})
    await db.referrals.insert_one(
        {
            "_id": _uid("r"),
            "inviterId": inviter["_id"],
            "inviteeId": invitee_id,
            "friendName": (invitee.get("firstName") or "").strip() or "New member",
            "invited": _today(),
            "status": "joined",
            "createdAt": datetime.now(timezone.utc),
        }
    )
    return True


async def _settle_referral_on_first_purchase(member_id: str) -> None:
    """Both parties get their bonus point on the invitee's first private spend."""
    db = get_db()
    referral = await db.referrals.find_one({"inviteeId": member_id, "status": "joined"})
    if not referral:
        return

    spends = await db.transactions.count_documents({"memberId": member_id, "kind": "spend"})
    if spends < 1:
        return

    for party in (referral["inviterId"], member_id):
        doc = await db.members.find_one({"_id": party})
        if doc:
            await _apply_points(party, doc.get("totalEarned", 0) + REFERRAL_BONUS_POINTS)

    await db.referrals.update_one(
        {"_id": referral["_id"], "status": "joined"},
        {"$set": {"status": "rewarded", "rewardedAt": _today()}},
    )


async def list_referrals(member_id: str) -> list[dict]:
    cursor = get_db().referrals.find({"inviterId": member_id}).sort("invited", -1)
    return await cursor.to_list(200)
