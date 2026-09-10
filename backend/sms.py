"""SMS delivery, behind one small interface.

The practice has not chosen a gateway yet, so the default adapter logs the
message and the app shows the code on screen. Adding a real provider is one
class plus two environment variables — no route or auth code changes.
"""

from __future__ import annotations

import logging
from typing import Protocol

from config import (
    SMS_PROVIDER,
    SMS_SENDER,
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_FROM,
)

log = logging.getLogger(__name__)


class SmsSender(Protocol):
    name: str

    async def send(self, to: str, body: str) -> bool: ...


class ConsoleSms:
    """Development adapter — writes the message to the server log."""

    name = "console"

    async def send(self, to: str, body: str) -> bool:
        log.info("[sms:console] to=%s body=%s", to, body)
        return True


class TwilioSms:
    """Twilio adapter. Posts the message with the account's REST credentials."""

    name = "twilio"

    def __init__(self) -> None:
        missing = [
            n
            for n, v in (
                ("TWILIO_ACCOUNT_SID", TWILIO_ACCOUNT_SID),
                ("TWILIO_AUTH_TOKEN", TWILIO_AUTH_TOKEN),
                ("TWILIO_FROM", TWILIO_FROM),
            )
            if not v
        ]
        if missing:
            raise RuntimeError(f"SMS_PROVIDER=twilio needs {', '.join(missing)}")

    async def send(self, to: str, body: str) -> bool:
        import httpx

        url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json"
        async with httpx.AsyncClient(timeout=10) as http:
            resp = await http.post(
                url,
                auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN),
                data={"To": to, "From": TWILIO_FROM, "Body": body},
            )
        if resp.status_code >= 300:
            log.error("[sms:twilio] %s %s", resp.status_code, resp.text[:400])
            return False
        return True


_sender: SmsSender | None = None


def get_sender() -> SmsSender:
    global _sender
    if _sender is None:
        if SMS_PROVIDER == "twilio":
            _sender = TwilioSms()
        else:
            if SMS_PROVIDER != "console":
                log.warning("unknown SMS_PROVIDER %r — falling back to console", SMS_PROVIDER)
            _sender = ConsoleSms()
    return _sender


def set_sender(sender: SmsSender) -> None:
    """Used by tests to capture messages instead of sending them."""
    global _sender
    _sender = sender


async def send_otp(mobile: str, code: str) -> bool:
    body = f"{code} is your Surrey Opticians code. It expires in 5 minutes."
    if SMS_SENDER:
        body = f"{body}\n\n{SMS_SENDER}"
    return await get_sender().send(mobile, body)
