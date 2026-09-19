"""Document models for the loyalty database.

Field names deliberately mirror `frontend/src/api/data.ts` in camelCase, so a
document round-trips to the app's TypeScript types with no renaming layer. The
domain id doubles as Mongo's `_id` (the mobile number for an account, the slug
for a branch), which keeps lookups on the primary key and avoids a second
unique index per collection.

Dates are ISO `YYYY-MM-DD` strings rather than BSON dates. The app compares and
sorts them as strings throughout (see `lib/points.ts`, `lib/eyeTest.ts`), and
ISO dates sort lexicographically, so storing strings keeps the round trip exact
and the sorts correct.

The one shape difference from the frontend: vouchers, transactions and
referrals carry an `accountId`. The mock API is single-member and has no need
of it; a real collection does.
"""

from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

ISO_DATE = r"^\d{4}-\d{2}-\d{2}$"

VoucherStatus = Literal["available", "used"]
WalletProvider = Literal["apple", "google"]
ReferralStatus = Literal["invited", "joined", "rewarded"]
TxnKind = Literal["spend", "reward"]
TxnCategory = Literal["exam", "lenses"]


class Doc(BaseModel):
    """Base for anything stored: `id` in Python, `_id` in Mongo."""

    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    id: str = Field(alias="_id", min_length=1)

    def to_doc(self) -> dict:
        """A dict ready for insert — keyed by `_id`."""
        return self.model_dump(by_alias=True, exclude_none=True)

    def to_api(self) -> dict:
        """A dict shaped like the frontend type — keyed by `id`."""
        return self.model_dump(by_alias=False, exclude_none=True)


class BranchHours(BaseModel):
    model_config = ConfigDict(extra="forbid")

    days: str
    time: str


class Branch(Doc):
    """A practice. Reference data — seeded, never written by the app."""

    name: str
    address: list[str]
    phone: str
    phoneDisplay: str
    hours: list[BranchHours]
    mapQuery: str


class Account(Doc):
    """A member. `id` is the mobile number, which is the key used at the till."""

    mobile: str
    mobileDisplay: str
    firstName: str
    lastName: str
    email: str
    homeBranchId: str
    memberSince: str = Field(pattern=ISO_DATE)
    points: int = Field(ge=0)
    totalEarned: int = Field(ge=0)
    referralCode: str


class Voucher(Doc):
    """A £10 reward. Issued automatically when points cross a multiple of ten."""

    accountId: str
    code: str
    value: int = Field(gt=0)
    issued: str = Field(pattern=ISO_DATE)
    expires: str = Field(pattern=ISO_DATE)
    status: VoucherStatus = "available"
    usedAt: Optional[str] = Field(default=None, pattern=ISO_DATE)
    usedBranchId: Optional[str] = None
    wallet: Optional[WalletProvider] = None


class Txn(Doc):
    """A line in the points ledger — a purchase, or a reward conversion."""

    accountId: str
    date: str = Field(pattern=ISO_DATE)
    branchId: str
    kind: TxnKind
    category: Optional[TxnCategory] = None
    supplyMonths: Optional[int] = Field(default=None, gt=0)
    title: str
    detail: Optional[str] = None
    total: float = Field(ge=0)
    nhs: Optional[float] = Field(default=None, ge=0)
    points: int = Field(ge=0)


class Referral(Doc):
    """An invited friend. Both parties earn a point on the friend's first visit."""

    accountId: str
    friendName: str
    invited: str = Field(pattern=ISO_DATE)
    status: ReferralStatus
    rewardedAt: Optional[str] = Field(default=None, pattern=ISO_DATE)
