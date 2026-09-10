"""API schemas.

The response models mirror the TypeScript types in frontend/src/api/data.ts
field for field, so the app's screens need no changes when the mock layer is
swapped for these endpoints. Where the app expects pounds, the serialiser
converts from the pence held in Mongo.

Stored documents keep money as integer pence and dates as ISO date strings;
the conversion happens in the `from_doc` builders, so no route hand-rolls it.
"""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

from scheme import pence_to_pounds

VoucherStatus = Literal["available", "used"]
WalletProvider = Literal["apple", "google"]
TxnKind = Literal["spend", "reward"]
TxnCategory = Literal["exam", "lenses"]
ReferralStatus = Literal["invited", "joined", "rewarded"]


# --- Requests -------------------------------------------------------------
class RequestOtpIn(BaseModel):
    mobile: str

    @field_validator("mobile")
    @classmethod
    def _normalise(cls, v: str) -> str:
        from phone import normalise_uk_mobile

        return normalise_uk_mobile(v)


class VerifyOtpIn(BaseModel):
    mobile: str
    code: str
    referralCode: Optional[str] = None

    @field_validator("mobile")
    @classmethod
    def _normalise(cls, v: str) -> str:
        from phone import normalise_uk_mobile

        return normalise_uk_mobile(v)

    @field_validator("code")
    @classmethod
    def _digits(cls, v: str) -> str:
        return "".join(c for c in v if c.isdigit())


class UpdateAccountIn(BaseModel):
    firstName: Optional[str] = Field(default=None, max_length=60)
    lastName: Optional[str] = Field(default=None, max_length=60)
    email: Optional[EmailStr] = None
    homeBranchId: Optional[str] = None


class RedeemVoucherIn(BaseModel):
    branchId: str


class WalletIn(BaseModel):
    provider: WalletProvider


class RecordPurchaseIn(BaseModel):
    """A till posting a purchase. Amounts in pounds, as the till states them."""

    mobile: str
    branchId: str
    title: str
    detail: Optional[str] = None
    total: float = Field(ge=0)
    nhs: float = Field(default=0, ge=0)
    category: Optional[TxnCategory] = None
    supplyMonths: Optional[int] = Field(default=None, ge=1, le=24)
    date: Optional[str] = None
    # Lets a till retry a timed-out request without charging points twice.
    idempotencyKey: Optional[str] = None

    @field_validator("mobile")
    @classmethod
    def _normalise(cls, v: str) -> str:
        from phone import normalise_uk_mobile

        return normalise_uk_mobile(v)


# --- Responses ------------------------------------------------------------
class Account(BaseModel):
    id: str
    mobile: str
    mobileDisplay: str
    firstName: str
    lastName: str
    email: str
    homeBranchId: str
    memberSince: str
    points: int
    totalEarned: int
    referralCode: str

    @staticmethod
    def from_doc(doc: dict) -> "Account":
        from phone import display_uk_mobile

        return Account(
            id=doc["mobile"],
            mobile=doc["mobile"],
            mobileDisplay=display_uk_mobile(doc["mobile"]),
            firstName=doc.get("firstName", ""),
            lastName=doc.get("lastName", ""),
            email=doc.get("email", ""),
            homeBranchId=doc.get("homeBranchId", ""),
            memberSince=doc["memberSince"],
            points=doc.get("points", 0),
            totalEarned=doc.get("totalEarned", 0),
            referralCode=doc["referralCode"],
        )


class Voucher(BaseModel):
    id: str
    code: str
    value: float
    issued: str
    expires: str
    status: VoucherStatus
    usedAt: Optional[str] = None
    usedBranchId: Optional[str] = None
    wallet: Optional[WalletProvider] = None

    @staticmethod
    def from_doc(doc: dict) -> "Voucher":
        return Voucher(
            id=doc["_id"],
            code=doc["code"],
            value=pence_to_pounds(doc["valuePence"]),
            issued=doc["issued"],
            expires=doc["expires"],
            status=doc["status"],
            usedAt=doc.get("usedAt"),
            usedBranchId=doc.get("usedBranchId"),
            wallet=doc.get("wallet"),
        )


class Txn(BaseModel):
    id: str
    date: str
    branchId: str
    kind: TxnKind
    category: Optional[TxnCategory] = None
    supplyMonths: Optional[int] = None
    title: str
    detail: Optional[str] = None
    total: float
    nhs: Optional[float] = None
    points: int

    @staticmethod
    def from_doc(doc: dict) -> "Txn":
        nhs_pence = doc.get("nhsPence") or 0
        return Txn(
            id=doc["_id"],
            date=doc["date"],
            branchId=doc["branchId"],
            kind=doc["kind"],
            category=doc.get("category"),
            supplyMonths=doc.get("supplyMonths"),
            title=doc["title"],
            detail=doc.get("detail"),
            total=pence_to_pounds(doc.get("totalPence", 0)),
            nhs=pence_to_pounds(nhs_pence) if nhs_pence else None,
            points=doc.get("points", 0),
        )


class Referral(BaseModel):
    id: str
    friendName: str
    invited: str
    status: ReferralStatus
    rewardedAt: Optional[str] = None

    @staticmethod
    def from_doc(doc: dict) -> "Referral":
        return Referral(
            id=doc["_id"],
            friendName=doc.get("friendName") or "Invite sent",
            invited=doc["invited"],
            status=doc["status"],
            rewardedAt=doc.get("rewardedAt"),
        )


class Session(BaseModel):
    token: str
    account: Account
    isNewMember: bool
    referralApplied: bool = False


class OtpSent(BaseModel):
    sent: bool
    expiresIn: int
    resendIn: int
    # Populated only when EXPOSE_DEV_OTP is on, for the prototype's on-screen code.
    devCode: Optional[str] = None


class RedeemResult(BaseModel):
    voucher: Voucher
    account: Account


class PurchaseResult(BaseModel):
    transaction: Txn
    account: Account
    vouchersIssued: list[Voucher]
