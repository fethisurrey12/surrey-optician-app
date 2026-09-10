"""Run the API against an in-memory database.

Development only. It lets the whole app be driven — sign in, earn points,
redeem a voucher — on a machine with no MongoDB installed. Nothing is written
to disk, so every restart begins from the freshly seeded sample account.

    python devserver.py            # http://127.0.0.1:8000

For anything real, run `uvicorn server:app` against a proper MONGO_URL.
"""

from __future__ import annotations

import asyncio
import os
import sys

os.environ.setdefault("SEED_DEMO_DATA", "false")  # seeded explicitly below
os.environ.setdefault("EXPOSE_DEV_OTP", "true")
os.environ.setdefault("STAFF_API_KEY", "dev-staff-key")
os.environ.setdefault("JWT_SECRET", "dev-only-secret-not-for-production-use")


def main() -> None:
    try:
        from mongomock_motor import AsyncMongoMockClient
    except ImportError:
        sys.exit("pip install mongomock_motor to use the in-memory dev server")

    import uvicorn

    import db as db_module

    db_module.set_db(AsyncMongoMockClient()["surrey_dev"])

    async def prepare() -> None:
        from seed import seed_demo_member

        await db_module.ensure_indexes()
        await seed_demo_member()

    asyncio.get_event_loop_policy().new_event_loop().run_until_complete(prepare())

    from server import app

    # The app's own lifespan would reach for a real Mongo; the database is
    # already prepared, so it is replaced with a no-op.
    app.router.lifespan_context = _noop_lifespan

    print("Surrey Opticians API (in-memory) — http://127.0.0.1:8000/api")
    print("Sample account: +447712045589   staff key: dev-staff-key")
    uvicorn.run(app, host="127.0.0.1", port=int(os.environ.get("PORT", 8000)))


from contextlib import asynccontextmanager  # noqa: E402


@asynccontextmanager
async def _noop_lifespan(app):
    yield


if __name__ == "__main__":
    main()
