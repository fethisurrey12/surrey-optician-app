"""Sign-in: request a code, verify it, get a session."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status

from auth import current_member, issue_otp, make_token, verify_otp
from config import EXPOSE_DEV_OTP, OTP_TTL_SECONDS
from models import Account, OtpSent, RequestOtpIn, Session, VerifyOtpIn
from sms import send_otp
from store import attach_referral, ensure_member_code, get_or_create_member, issue_signup_voucher

log = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/request-otp", response_model=OtpSent)
async def request_otp(body: RequestOtpIn):
    code, resend_in = await issue_otp(body.mobile)
    delivered = await send_otp(body.mobile, code)

    if not delivered and not EXPOSE_DEV_OTP:
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            "We could not send your code. Please try again.",
        )

    return OtpSent(
        sent=True,
        expiresIn=OTP_TTL_SECONDS,
        resendIn=resend_in,
        devCode=code if EXPOSE_DEV_OTP else None,
    )


@router.post("/verify-otp", response_model=Session)
async def verify(body: VerifyOtpIn):
    if not await verify_otp(body.mobile, body.code):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "That code is not right. Please check and try again.")

    member, is_new = await get_or_create_member(body.mobile)

    # The welcome offer lands on the first sign-in, whether or not the till had
    # already created a record for this patient. It is a no-op after that.
    await issue_signup_voucher(member["_id"])
    member = await ensure_member_code(member["_id"])

    referral_applied = False
    if is_new and body.referralCode:
        referral_applied = await attach_referral(member["_id"], body.referralCode)

    return Session(
        token=make_token(member["_id"], member["mobile"]),
        account=Account.from_doc(member),
        isNewMember=is_new,
        referralApplied=referral_applied,
    )


@router.get("/me", response_model=Account)
async def me(member: dict = Depends(current_member)):
    return Account.from_doc(member)
