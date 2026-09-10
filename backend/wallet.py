"""Apple Wallet (.pkpass) and Google Wallet (save link) generation for reward vouchers.

Signing material never leaves the server. When the certificates / service account
are not configured, /wallet/status reports what is missing and the pass endpoints
return 503 — the app then falls back to its prototype pass preview.

Env (backend/.env) — see WALLET_SETUP.md:
  APPLE_PASS_TYPE_ID, APPLE_TEAM_ID, APPLE_WWDR_PATH (.cer or .pem)
  either APPLE_P12_PATH (+ APPLE_P12_PASSWORD)  — the raw export from Keychain Access
  or     APPLE_CERT_PATH + APPLE_KEY_PATH (+ APPLE_KEY_PASSWORD)
  GOOGLE_SERVICE_ACCOUNT_JSON (file path or the JSON itself), GOOGLE_ISSUER_ID
  PUBLIC_ORIGIN (comma-separated origins allowed to host the Google save button)
"""

import hashlib
import io
import json
import os
import time
import zipfile
from datetime import datetime
from pathlib import Path

import jwt
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.serialization import Encoding, pkcs7
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response
from PIL import Image, ImageDraw, ImageFont

router = APIRouter(prefix="/wallet", tags=["wallet"])

ASSETS = Path(__file__).parent / "wallet_assets"

ORG = "Surrey Opticians"
INK = (12, 36, 25)
CREAM = (244, 241, 233)
GOLD = (201, 162, 39)

APPLE_IDS = ("APPLE_PASS_TYPE_ID", "APPLE_TEAM_ID")
APPLE_PEM = ("APPLE_CERT_PATH", "APPLE_KEY_PATH")
GOOGLE_VARS = ("GOOGLE_SERVICE_ACCOUNT_JSON", "GOOGLE_ISSUER_ID")


def _env(name: str) -> str:
    return os.environ.get(name, "").strip()


def _file(var: str) -> Path:
    """Env paths may be relative to the backend directory (e.g. secrets/apple_pass.p12)."""
    p = Path(_env(var))
    return p if p.is_absolute() else Path(__file__).parent / p


def _path_ok(var: str) -> bool:
    return bool(_env(var)) and _file(var).exists()


def apple_missing() -> list[str]:
    """Human-readable list of what still needs supplying for Apple Wallet."""
    missing = [v for v in APPLE_IDS if not _env(v)]
    has_p12 = _path_ok("APPLE_P12_PATH")
    has_pem = all(_path_ok(v) for v in APPLE_PEM)
    if not (has_p12 or has_pem):
        missing.append("APPLE_P12_PATH (or APPLE_CERT_PATH + APPLE_KEY_PATH)")
    if not _path_ok("APPLE_WWDR_PATH"):
        missing.append("APPLE_WWDR_PATH")
    return missing


def google_missing() -> list[str]:
    missing = [v for v in GOOGLE_VARS if not _env(v)]
    sa = _env("GOOGLE_SERVICE_ACCOUNT_JSON")
    if sa and not (sa.startswith("{") or _file("GOOGLE_SERVICE_ACCOUNT_JSON").exists()):
        missing.append("GOOGLE_SERVICE_ACCOUNT_JSON (file not found)")
    return missing


def apple_ready() -> bool:
    return not apple_missing()


def google_ready() -> bool:
    return not google_missing()


def _apple_identity():
    """Certificate + private key, from a .p12 export or PEM pair."""
    if _path_ok("APPLE_P12_PATH"):
        from cryptography.hazmat.primitives.serialization import pkcs12

        pw = _env("APPLE_P12_PASSWORD").encode() or None
        key, cert, _extra = pkcs12.load_key_and_certificates(_file("APPLE_P12_PATH").read_bytes(), pw)
        return cert, key
    cert = x509.load_pem_x509_certificate(_file("APPLE_CERT_PATH").read_bytes())
    pw = _env("APPLE_KEY_PASSWORD").encode() or None
    key = serialization.load_pem_private_key(_file("APPLE_KEY_PATH").read_bytes(), password=pw)
    return cert, key


def _load_wwdr():
    raw = _file("APPLE_WWDR_PATH").read_bytes()
    try:
        return x509.load_pem_x509_certificate(raw)
    except ValueError:  # Apple ships the intermediate as DER (.cer)
        return x509.load_der_x509_certificate(raw)


def _google_service_account() -> dict:
    sa = _env("GOOGLE_SERVICE_ACCOUNT_JSON")
    return json.loads(sa if sa.startswith("{") else _file("GOOGLE_SERVICE_ACCOUNT_JSON").read_text())


# ---------------------------------------------------------------- assets ----
def _font(size: int):
    try:
        return ImageFont.load_default(size=size)
    except TypeError:  # very old Pillow
        return ImageFont.load_default()


def _ensure_assets() -> dict[str, bytes]:
    """Generate the branded PNGs Apple expects (icon + logo, 1x/2x/3x) once."""
    ASSETS.mkdir(exist_ok=True)
    specs = {
        "icon.png": (29, 29),
        "icon@2x.png": (58, 58),
        "icon@3x.png": (87, 87),
        "logo.png": (160, 50),
        "logo@2x.png": (320, 100),
        "logo@3x.png": (480, 150),
    }
    out: dict[str, bytes] = {}
    for name, (w, h) in specs.items():
        file = ASSETS / name
        if not file.exists():
            img = Image.new("RGBA", (w, h), INK + (255,) if name.startswith("icon") else (0, 0, 0, 0))
            d = ImageDraw.Draw(img)
            if name.startswith("icon"):
                r = w * 0.34
                d.ellipse((w / 2 - r, h / 2 - r, w / 2 + r, h / 2 + r), outline=GOLD, width=max(1, w // 14))
            else:
                d.text((0, h * 0.18), ORG, fill=CREAM, font=_font(int(h * 0.5)))
            img.save(file, "PNG")
        out[name] = file.read_bytes()
    return out


# ------------------------------------------------------------------ apple ----
def build_pkpass(code: str, value: int, expires: str, member: str, branch: str) -> bytes:
    files = _ensure_assets()
    pass_json = {
        "formatVersion": 1,
        "passTypeIdentifier": os.environ["APPLE_PASS_TYPE_ID"],
        "serialNumber": code,
        "teamIdentifier": os.environ["APPLE_TEAM_ID"],
        "organizationName": ORG,
        "description": f"{ORG} £{value} reward voucher",
        "logoText": ORG,
        "backgroundColor": "rgb(%d,%d,%d)" % INK,
        "foregroundColor": "rgb(%d,%d,%d)" % CREAM,
        "labelColor": "rgb(%d,%d,%d)" % GOLD,
        "expirationDate": f"{expires}T23:59:59Z",
        "coupon": {
            "primaryFields": [{"key": "value", "label": "REWARD", "value": f"£{value} off"}],
            "secondaryFields": [
                {"key": "member", "label": "MEMBER", "value": member},
                {"key": "expires", "label": "EXPIRES", "value": _pretty_date(expires)},
            ],
            "auxiliaryFields": [
                {"key": "code", "label": "VOUCHER CODE", "value": code},
                {"key": "branch", "label": "HOME BRANCH", "value": branch},
            ],
            "backFields": [
                {
                    "key": "how",
                    "label": "How to use",
                    "value": "Show this pass at the till in any Surrey Opticians branch. A colleague scans it, "
                    f"applies £{value} to your private purchase and marks it used.",
                },
                {"key": "terms", "label": "Terms", "value": "One voucher per transaction. Not valid against NHS-funded amounts. Expires one year after issue."},
                {"key": "branches", "label": "Branches", "value": "Coulsdon · Wallington · Banstead"},
            ],
        },
        "barcodes": [{"format": "PKBarcodeFormatQR", "message": code, "messageEncoding": "iso-8859-1", "altText": code}],
    }
    files["pass.json"] = json.dumps(pass_json, ensure_ascii=False, separators=(",", ":")).encode("utf-8")

    manifest = {name: hashlib.sha1(data).hexdigest() for name, data in files.items()}
    manifest_bytes = json.dumps(manifest, separators=(",", ":")).encode()

    cert, key = _apple_identity()
    wwdr = _load_wwdr()
    signature = (
        pkcs7.PKCS7SignatureBuilder()
        .set_data(manifest_bytes)
        .add_signer(cert, key, hashes.SHA256())
        .add_certificate(wwdr)
        .sign(Encoding.DER, [pkcs7.PKCS7Options.DetachedSignature, pkcs7.PKCS7Options.Binary])
    )

    files["manifest.json"] = manifest_bytes
    files["signature"] = signature
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        for name, data in files.items():
            z.writestr(name, data)
    return buf.getvalue()


# ----------------------------------------------------------------- google ----
def build_google_save_url(code: str, value: int, expires: str, member: str, branch: str) -> str:
    service = _google_service_account()
    issuer = os.environ["GOOGLE_ISSUER_ID"]
    class_id = f"{issuer}.surrey_opticians_reward"
    object_id = f"{issuer}.{code.replace('-', '_')}"

    generic_class = {"id": class_id}
    generic_object = {
        "id": object_id,
        "classId": class_id,
        "state": "ACTIVE",
        "hexBackgroundColor": "#%02x%02x%02x" % INK,
        "cardTitle": {"defaultValue": {"language": "en-GB", "value": ORG}},
        "header": {"defaultValue": {"language": "en-GB", "value": f"£{value} reward voucher"}},
        "subheader": {"defaultValue": {"language": "en-GB", "value": member}},
        "barcode": {"type": "QR_CODE", "value": code, "alternateText": code},
        "textModulesData": [
            {"id": "code", "header": "Voucher code", "body": code},
            {"id": "expires", "header": "Expires", "body": _pretty_date(expires)},
            {"id": "branch", "header": "Home branch", "body": branch},
            {"id": "how", "header": "How to use", "body": f"Show at the till in any Surrey Opticians branch. A colleague scans it and applies £{value} to your private purchase."},
        ],
        "validTimeInterval": {"end": {"date": f"{expires}T23:59:59Z"}},
    }
    claims = {
        "iss": service["client_email"],
        "aud": "google",
        "typ": "savetowallet",
        "iat": int(time.time()),
        "origins": [o for o in os.environ.get("PUBLIC_ORIGIN", "").split(",") if o],
        "payload": {"genericClasses": [generic_class], "genericObjects": [generic_object]},
    }
    token = jwt.encode(claims, service["private_key"], algorithm="RS256")
    return "https://pay.google.com/gp/v/save/" + token


def _pretty_date(iso: str) -> str:
    try:
        return datetime.strptime(iso, "%Y-%m-%d").strftime("%-d %b %Y")
    except ValueError:
        return iso


# ----------------------------------------------------------------- routes ----
@router.get("/status")
async def wallet_status():
    """Configuration state. `missing` tells whoever is wiring the keys exactly what's left."""
    return {
        "apple": apple_ready(),
        "google": google_ready(),
        "missing": {"apple": apple_missing(), "google": google_missing()},
    }


@router.get("/apple/{code}.pkpass")
async def apple_pass(
    code: str,
    value: int = Query(10, ge=1),
    expires: str = Query(...),
    member: str = Query("Member"),
    branch: str = Query(""),
):
    if not apple_ready():
        raise HTTPException(503, "Apple Wallet signing certificate not configured")
    data = build_pkpass(code, value, expires, member, branch)
    return Response(
        content=data,
        media_type="application/vnd.apple.pkpass",
        headers={"Content-Disposition": f'attachment; filename="{code}.pkpass"', "Cache-Control": "no-store"},
    )


@router.get("/google/{code}")
async def google_pass(
    code: str,
    value: int = Query(10, ge=1),
    expires: str = Query(...),
    member: str = Query("Member"),
    branch: str = Query(""),
):
    if not google_ready():
        raise HTTPException(503, "Google Wallet issuer not configured")
    return {"url": build_google_save_url(code, value, expires, member, branch)}
