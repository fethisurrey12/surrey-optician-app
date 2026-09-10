"""Endpoints the in-practice till calls.

Guarded by a shared secret in the X-Staff-Key header. With STAFF_API_KEY unset
the whole router refuses every request, so a misconfigured deployment fails
closed rather than exposing the points ledger.
"""

from __future__ import annotations

import hmac

from fastapi import APIRouter, Depends, Header, HTTPException, status

from branches import valid_branch
from config import STAFF_API_KEY
from models import (
    Account,
    CheckIn,
    CheckInIn,
    CheckInResult,
    PurchaseResult,
    RecordPurchaseIn,
    Txn,
    Voucher,
)
from phone import display_uk_mobile
from store import check_in, list_vouchers, record_purchase

router = APIRouter(prefix="/staff", tags=["staff"])


async def staff_key(x_staff_key: str = Header(default="")) -> None:
    if not STAFF_API_KEY:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Staff API is not configured")
    if not hmac.compare_digest(x_staff_key, STAFF_API_KEY):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid staff key")


@router.post("/purchases", response_model=PurchaseResult, dependencies=[Depends(staff_key)])
async def purchase(body: RecordPurchaseIn):
    """Record a purchase, award points, issue any rewards it unlocks."""
    if not valid_branch(body.branchId):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Unknown branch")

    txn, member, issued = await record_purchase(
        mobile=body.mobile,
        branch_id=body.branchId,
        title=body.title,
        total_pounds=body.total,
        nhs_pounds=body.nhs,
        detail=body.detail,
        category=body.category,
        supply_months=body.supplyMonths,
        on_date=body.date,
        idempotency_key=body.idempotencyKey,
    )
    return PurchaseResult(
        transaction=Txn.from_doc(txn),
        account=Account.from_doc(member),
        vouchersIssued=[Voucher.from_doc(v) for v in issued],
    )


@router.post("/check-in", response_model=CheckInResult, dependencies=[Depends(staff_key)])
async def desk_check_in(body: CheckInIn):
    """Check a patient in from their membership QR.

    Scanned at the desk when they arrive for an appointment. It records the
    arrival and tells the colleague who is in front of them; it awards no
    points, because arriving is not a purchase.
    """
    if not valid_branch(body.branchId):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Unknown branch")

    member, record = await check_in(body.code, body.branchId)

    vouchers = await list_vouchers(member["_id"])
    ready = sum(1 for v in vouchers if Voucher.from_doc(v).status == "available")

    return CheckInResult(
        checkIn=CheckIn(
            id=record["_id"],
            at=record["at"].isoformat(),
            branchId=record["branchId"],
        ),
        firstName=member.get("firstName", ""),
        lastName=member.get("lastName", ""),
        mobileDisplay=display_uk_mobile(member["mobile"]),
        memberCode=member.get("memberCode", ""),
        homeBranchId=member.get("homeBranchId", ""),
        vouchersAvailable=ready,
    )
