"""One-time codes and session tokens.

Codes are stored as bcrypt hashes, never in plain text: a leaked database dump
must not hand over live login codes. Verification is single-use and rate
limited in three directions — attempts per code, resend cooldown, and codes per
hour per number — so the endpoint cannot be used to brute-force a member's
account or to run up an SMS bill.
"""

from __future__ import annotations

import asyncio
import logging
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from config import (
    JWT_ALGORITHM,
    JWT_SECRET,
    JWT_TTL_DAYS,
    OTP_LENGTH,
    OTP_MAX_ATTEMPTS,
    OTP_MAX_PER_HOUR,
    OTP_RESEND_COOLDOWN_SECONDS,
    OTP_TTL_SECONDS,
)
from db import get_db

log = logging.getLogger(__name__)
bearer = HTTPBearer(auto_error=False)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def generate_code() -> str:
    """A uniformly random numeric code, zero-padded (leading zeros allowed)."""
    upper = 10 ** OTP_LENGTH
    return str(secrets.randbelow(upper)).zfill(OTP_LENGTH)


async def _hash(code: str) -> str:
    # bcrypt is deliberately slow; keep it off the event loop.
    return (
        await asyncio.to_thread(bcrypt.hashpw, code.encode(), bcrypt.gensalt())
    ).decode()


async def _verify_hash(code: str, hashed: str) -> bool:
    return await asyncio.to_thread(bcrypt.checkpw, code.encode(), hashed.encode())


async def issue_otp(mobile: str) -> tuple[str, int]:
    """Create and store a code for this number. Returns (code, resend_in_seconds)."""
    db = get_db()
    now = _now()

    latest = await db.otps.find_one({"mobile": mobile}, sort=[("createdAt", -1)])
    if latest:
        age = (now - _aware(latest["createdAt"])).total_seconds()
        if age < OTP_RESEND_COOLDOWN_SECONDS:
            raise HTTPException(
                status.HTTP_429_TOO_MANY_REQUESTS,
                f"Please wait {int(OTP_RESEND_COOLDOWN_SECONDS - age)} seconds before asking for another code",
            )

    hour_ago = now - timedelta(hours=1)
    recent = await db.otps.count_documents({"mobile": mobile, "createdAt": {"$gte": hour_ago}})
    if recent >= OTP_MAX_PER_HOUR:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            "Too many codes requested. Please try again later.",
        )

    code = generate_code()
    # Any earlier code for this number stops working the moment a new one is
    # sent. They are marked spent rather than deleted: the hourly rate limit
    # counts these rows, and deleting them would let a caller reset their own
    # budget simply by asking for another code. The TTL index sweeps them.
    await db.otps.update_many(
        {"mobile": mobile, "consumed": False}, {"$set": {"consumed": True}}
    )
    await db.otps.insert_one(
        {
            "_id": str(uuid.uuid4()),
            "mobile": mobile,
            "codeHash": await _hash(code),
            "createdAt": now,
            "expiresAt": now + timedelta(seconds=OTP_TTL_SECONDS),
            "attempts": 0,
            "consumed": False,
        }
    )
    return code, OTP_RESEND_COOLDOWN_SECONDS


async def verify_otp(mobile: str, code: str) -> bool:
    """Check a code and burn it. False for wrong, expired, or already used."""
    db = get_db()
    now = _now()

    record = await db.otps.find_one({"mobile": mobile, "consumed": False}, sort=[("createdAt", -1)])
    if not record:
        return False

    if _aware(record["expiresAt"]) < now:
        await db.otps.update_one({"_id": record["_id"]}, {"$set": {"consumed": True}})
        raise HTTPException(status.HTTP_410_GONE, "That code has expired. Ask for a new one.")

    if record["attempts"] >= OTP_MAX_ATTEMPTS:
        await db.otps.update_one({"_id": record["_id"]}, {"$set": {"consumed": True}})
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            "Too many incorrect attempts. Ask for a new code.",
        )

    if not await _verify_hash(code, record["codeHash"]):
        await db.otps.update_one({"_id": record["_id"]}, {"$inc": {"attempts": 1}})
        return False

    # Single use: consume before returning so a replay cannot land.
    consumed = await db.otps.update_one(
        {"_id": record["_id"], "consumed": False}, {"$set": {"consumed": True}}
    )
    return consumed.modified_count == 1


def _aware(value: datetime) -> datetime:
    """Mongo hands back naive UTC datetimes; comparisons need them aware."""
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


def make_token(member_id: str, mobile: str) -> str:
    now = _now()
    return jwt.encode(
        {
            "sub": member_id,
            "mobile": mobile,
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(days=JWT_TTL_DAYS)).timestamp()),
        },
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )


def read_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Your session has expired. Please sign in again.")
    except jwt.PyJWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not signed in")


async def current_member(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
) -> dict:
    """FastAPI dependency: resolves the bearer token to a member document."""
    if creds is None or not creds.credentials:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not signed in")

    payload = read_token(creds.credentials)
    member = await get_db().members.find_one({"_id": payload.get("sub")})
    if not member:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Account not found")
    return member
