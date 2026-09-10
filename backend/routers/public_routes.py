"""Unauthenticated endpoints: branches, health."""

from __future__ import annotations

from fastapi import APIRouter

from branches import BRANCHES, PRACTICE_EMAIL

router = APIRouter(tags=["public"])


@router.get("/branches")
async def branches():
    return {"branches": BRANCHES, "practiceEmail": PRACTICE_EMAIL}


@router.get("/health")
async def health():
    from db import get_db

    try:
        await get_db().command("ping")
        database = "up"
    except Exception:
        database = "down"
    return {"status": "ok", "database": database}
