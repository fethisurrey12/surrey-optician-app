"""Runtime configuration, read once from the environment.

Every tunable the practice might change lives here so no other module reads
os.environ directly. Defaults are development-safe: the app boots with nothing
configured, and the parts that need real credentials report themselves as
unconfigured rather than failing at import time.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")


def _int(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, default))
    except ValueError:
        return default


def _bool(name: str, default: bool = False) -> bool:
    raw = os.environ.get(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


# --- Database -------------------------------------------------------------
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "surrey_opticians")
MONGO_TIMEOUT_MS = _int("MONGO_TIMEOUT_MS", 5000)

# --- Auth -----------------------------------------------------------------
# A generated fallback keeps local development working, but it changes on every
# boot (invalidating tokens), which is the nudge to set a real one in prod.
JWT_SECRET = os.environ.get("JWT_SECRET") or os.urandom(32).hex()
JWT_ALGORITHM = "HS256"
JWT_TTL_DAYS = _int("JWT_TTL_DAYS", 30)

OTP_LENGTH = 6
OTP_TTL_SECONDS = _int("OTP_TTL_SECONDS", 300)
OTP_MAX_ATTEMPTS = _int("OTP_MAX_ATTEMPTS", 5)
OTP_RESEND_COOLDOWN_SECONDS = _int("OTP_RESEND_COOLDOWN_SECONDS", 30)
OTP_MAX_PER_HOUR = _int("OTP_MAX_PER_HOUR", 5)

# Returns the OTP in the API response and shows it on screen. Must be off in
# production — it is the difference between a demo and an open door.
EXPOSE_DEV_OTP = _bool("EXPOSE_DEV_OTP", True)

# --- SMS ------------------------------------------------------------------
SMS_PROVIDER = os.environ.get("SMS_PROVIDER", "console").strip().lower()
SMS_SENDER = os.environ.get("SMS_SENDER", "SurreyOpt")
TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN", "")
TWILIO_FROM = os.environ.get("TWILIO_FROM", "")

# --- Loyalty scheme -------------------------------------------------------
SPEND_PER_POINT_PENCE = _int("SPEND_PER_POINT_PENCE", 1000)   # £10 -> 1 point
POINTS_PER_REWARD = _int("POINTS_PER_REWARD", 10)             # 10 points -> voucher
VOUCHER_VALUE_PENCE = _int("VOUCHER_VALUE_PENCE", 1000)       # £10
VOUCHER_TTL_MONTHS = _int("VOUCHER_TTL_MONTHS", 18)
REFERRAL_BONUS_POINTS = _int("REFERRAL_BONUS_POINTS", 1)

# --- Staff / till ---------------------------------------------------------
# Shared secret the in-practice till software presents to record purchases and
# redeem vouchers. Unset means the staff endpoints are closed.
STAFF_API_KEY = os.environ.get("STAFF_API_KEY", "")

# --- CORS -----------------------------------------------------------------
# Comma-separated origins. "*" is the development default; set real origins in
# production, where credentials are allowed and "*" would be unsafe.
CORS_ORIGINS = [o.strip() for o in os.environ.get("CORS_ORIGINS", "*").split(",") if o.strip()]

# --- Seeding --------------------------------------------------------------
SEED_DEMO_DATA = _bool("SEED_DEMO_DATA", True)
DEMO_MOBILE = os.environ.get("DEMO_MOBILE", "+447712045589")
