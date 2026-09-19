"""Put the backend package directory on sys.path.

The backend modules import each other flatly (`import db`, `from wallet import
router`), matching how uvicorn runs the app from that directory. Without this,
pytest only adds `tests/` and those imports fail.
"""

import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))
