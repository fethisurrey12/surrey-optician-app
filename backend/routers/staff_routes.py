"""Endpoints the in-practice till calls.

Guarded by a shared secret in the X-Staff-Key header. With STAFF_API_KEY unset
the whole router refuses every request, so a misconfigured deployment fails
closed rather than exposing the points ledger.
"""

from __future__ import annotations

import hmac

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status

from branches import valid_branch
from config import STAFF_API_KEY
from models import (
    Account,
    PurchaseResult,
    RecordPurchaseIn,
    StaffMemberDetail,
    StaffMemberRow,
    Txn,
    Voucher,
)
from store import (
    get_member,
    list_activity,
    list_vouchers,
    record_purchase,
    search_members,
)

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

@router.get("/session", dependencies=[Depends(staff_key)])
async def staff_session():
    """Confirms the key is good, so the desk can be told before it searches."""
    return {"ok": True}


@router.get("/members", response_model=list[StaffMemberRow], dependencies=[Depends(staff_key)])
async def find_members(q: str = Query(default="", max_length=80)):
    """Search the membership by name, number or email."""
    docs = await search_members(q, limit=25)
    return [StaffMemberRow.from_doc(d) for d in docs]


@router.get(
    "/members/{member_id}",
    response_model=StaffMemberDetail,
    dependencies=[Depends(staff_key)],
)
async def member_detail(member_id: str):
    """The patient's record as the desk needs it: who they are, what they have."""
    member = await get_member(member_id)
    vouchers = await list_vouchers(member["_id"])
    activity = await list_activity(member["_id"], limit=50)

    return StaffMemberDetail(
        account=Account.from_doc(member),
        vouchers=[Voucher.from_doc(v) for v in vouchers],
        activity=[Txn.from_doc(t) for t in activity],
    )
