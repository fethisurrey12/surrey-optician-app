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

from datetime import date

from scheme import iso_date, pence_to_pounds

VoucherStatus = Literal["available", "used", "expired"]
WalletProvider = Literal["apple", "google"]
VoucherKind = Literal["reward", "signup"]
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


class CheckInIn(BaseModel):
    """What the desk sends after scanning a patient's membership QR."""

    code: str
    branchId: str


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
    # The code behind the membership QR the desk scans to check the patient in.
    memberCode: str

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
            memberCode=doc.get("memberCode", ""),
        )


class Voucher(BaseModel):
    id: str
    code: str
    kind: VoucherKind = "reward"
    # A reward voucher is worth a fixed amount; the welcome voucher takes a
    # percentage off instead. Exactly one of the two is set.
    value: Optional[float] = None
    percentOff: Optional[int] = None
    # "any", or a category the voucher is restricted to, such as "glasses".
    appliesTo: str = "any"
    issued: str
    expires: str
    status: VoucherStatus
    usedAt: Optional[str] = None
    usedBranchId: Optional[str] = None
    wallet: Optional[WalletProvider] = None

    @staticmethod
    def from_doc(doc: dict) -> "Voucher":
        # Expiry is derived on read rather than written by a nightly job, so a
        # voucher stops being offered the moment its term is up, with nothing
        # to schedule and no stored state that can fall behind the clock.
        status = doc["status"]
        if status == "available" and doc["expires"] < iso_date(date.today()):
            status = "expired"

        value_pence = doc.get("valuePence")
        return Voucher(
            id=doc["_id"],
            code=doc["code"],
            kind=doc.get("kind", "reward"),
            value=pence_to_pounds(value_pence) if value_pence is not None else None,
            percentOff=doc.get("percentOff"),
            appliesTo=doc.get("appliesTo", "any"),
            issued=doc["issued"],
            expires=doc["expires"],
            status=status,
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


class CheckIn(BaseModel):
    id: str
    at: str
    branchId: str


class CheckInResult(BaseModel):
    """Shown to the colleague at the desk: who has arrived, and when."""

    checkIn: CheckIn
    firstName: str
    lastName: str
    mobileDisplay: str
    memberCode: str
    homeBranchId: str
    # So the desk can mention a waiting reward while the patient is there.
    vouchersAvailable: int


class RedeemResult(BaseModel):
    voucher: Voucher
    account: Account


class PurchaseResult(BaseModel):
    transaction: Txn
    account: Account
    vouchersIssued: list[Voucher]
