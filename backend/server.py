"""Surrey Opticians loyalty API.

Every route lives under /api so a single origin can serve the app and the API
behind one proxy. Routers are grouped by who calls them: the member's own app,
the practice's till, and the unauthenticated lookups.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware

from config import CORS_ORIGINS, SEED_DEMO_DATA
from db import close_db, ensure_indexes

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
log = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await ensure_indexes()
    except Exception:
        # A database that is not up yet must not stop the process from booting;
        # /api/health reports the real state.
        log.exception("could not ensure indexes at startup")

    if SEED_DEMO_DATA:
        try:
            from seed import seed_demo_member

            await seed_demo_member()
        except Exception:
            log.exception("demo seed failed")

    yield
    await close_db()


app = FastAPI(
    title="Surrey Opticians Loyalty API",
    version="1.0.0",
    lifespan=lifespan,
)

# Credentials with a wildcard origin is rejected by browsers and unsafe besides,
# so the two settings are kept consistent with each other.
allow_all = CORS_ORIGINS == ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=not allow_all,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Staff-Key"],
)
if allow_all:
    log.warning("CORS is open to all origins — set CORS_ORIGINS before going live")

from routers.auth_routes import router as auth_router          # noqa: E402
from routers.member_routes import router as member_router      # noqa: E402
from routers.public_routes import router as public_router      # noqa: E402
from routers.staff_routes import router as staff_router        # noqa: E402
from wallet import router as wallet_router                     # noqa: E402

from fastapi import APIRouter                                   # noqa: E402

api = APIRouter(prefix="/api")
api.include_router(public_router)
api.include_router(auth_router)
api.include_router(member_router)
api.include_router(staff_router)
api.include_router(wallet_router)
app.include_router(api)


@app.get("/api")
async def root():
    return {"service": "Surrey Opticians Loyalty API", "version": app.version}


@app.exception_handler(500)
async def internal_error(request, exc):
    log.exception("unhandled error on %s", request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Something went wrong. Please try again."},
    )
