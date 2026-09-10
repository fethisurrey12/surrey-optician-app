"""UK mobile number handling.

The mobile is the account key — it is what a colleague types at the till — so
every entry point normalises to one canonical E.164 form. "07712 045589",
"+44 7712 045589" and "447712045589" must all resolve to the same member.
"""

from __future__ import annotations

from fastapi import HTTPException, status


class InvalidMobile(ValueError):
    pass


def normalise_uk_mobile(raw: str) -> str:
    """Return +447XXXXXXXXX, or raise a 422 for anything that is not a UK mobile."""
    if not raw:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Enter a mobile number")

    digits = "".join(c for c in str(raw) if c.isdigit())

    if digits.startswith("0044"):
        digits = digits[4:]
    elif digits.startswith("44"):
        digits = digits[2:]
    elif digits.startswith("0"):
        digits = digits[1:]

    # UK mobiles are 7 followed by nine more digits.
    if len(digits) != 10 or not digits.startswith("7"):
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "Enter a UK mobile number, starting 07 or +447",
        )

    return f"+44{digits}"


def display_uk_mobile(e164: str) -> str:
    """+447712045589 -> '+44 7712 045589' (the form the app already shows)."""
    if not e164.startswith("+44") or len(e164) != 13:
        return e164
    national = e164[3:]
    return f"+44 {national[:4]} {national[4:]}"


def last_four(e164: str) -> str:
    digits = "".join(c for c in e164 if c.isdigit())
    return digits[-4:]
