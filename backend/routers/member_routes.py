"""Everything the signed-in member's own screens read."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from auth import current_member
from branches import valid_branch
from models import (
    Account,
    RedeemResult,
    RedeemVoucherIn,
    Referral,
    Txn,
    UpdateAccountIn,
    Voucher,
    WalletIn,
)
from store import (
    list_activity,
    list_referrals,
    list_vouchers,
    redeem_voucher,
    set_voucher_wallet,
    update_member,
)

router = APIRouter(prefix="/me", tags=["member"])


@router.get("/account", response_model=Account)
async def account(member: dict = Depends(current_member)):
    return Account.from_doc(member)


@router.patch("/account", response_model=Account)
async def edit_account(body: UpdateAccountIn, member: dict = Depends(current_member)):
    if body.homeBranchId is not None and not valid_branch(body.homeBranchId):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Unknown branch")

    changes = body.model_dump(exclude_unset=True)
    if "email" in changes and changes["email"] is not None:
        changes["email"] = str(changes["email"])

    return Account.from_doc(await update_member(member["_id"], changes))


@router.get("/vouchers", response_model=list[Voucher])
async def vouchers(member: dict = Depends(current_member)):
    return [Voucher.from_doc(v) for v in await list_vouchers(member["_id"])]


@router.get("/activity", response_model=list[Txn])
async def activity(member: dict = Depends(current_member)):
    return [Txn.from_doc(t) for t in await list_activity(member["_id"])]


@router.get("/referrals", response_model=list[Referral])
async def referrals(member: dict = Depends(current_member)):
    return [Referral.from_doc(r) for r in await list_referrals(member["_id"])]


@router.post("/vouchers/{voucher_id}/redeem", response_model=RedeemResult)
async def redeem(voucher_id: str, body: RedeemVoucherIn, member: dict = Depends(current_member)):
    """Stands in for the colleague marking the voucher used at the till.

    In the practice this is driven by the till (see the staff endpoint); the
    app keeps it so the prototype's "simulate the till scan" control works.
    """
    if not valid_branch(body.branchId):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Unknown branch")

    voucher = await redeem_voucher(member["_id"], voucher_id, body.branchId)
    from db import get_db

    fresh = await get_db().members.find_one({"_id": member["_id"]})
    return RedeemResult(voucher=Voucher.from_doc(voucher), account=Account.from_doc(fresh))


@router.post("/vouchers/{voucher_id}/wallet", response_model=Voucher)
async def wallet(voucher_id: str, body: WalletIn, member: dict = Depends(current_member)):
    return Voucher.from_doc(await set_voucher_wallet(member["_id"], voucher_id, body.provider))
