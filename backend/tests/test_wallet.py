"""Backend tests for Surrey Opticians wallet endpoints.

Signing keys are intentionally not configured in this environment, so the
pass endpoints must return 503 while /status must still resolve to 200
with a `missing` inventory.
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://surrey-opticians.preview.emergentagent.com").rstrip("/")


def _server_reachable() -> bool:
    """These are integration tests against a running deployment.

    They are skipped when no server answers at BASE_URL, so the suite stays
    green offline; test_wallet_api.py covers the same endpoints in process.
    """
    try:
        requests.get(f"{BASE_URL}/api/wallet/status", timeout=5)
        return True
    except Exception:
        return False


pytestmark = pytest.mark.skipif(
    not _server_reachable(), reason=f"no server reachable at {BASE_URL}"
)


@pytest.fixture(scope="module")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


class TestWalletStatus:
    """GET /api/wallet/status — 200 with apple/google/missing"""

    def test_status_200_shape(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/wallet/status", timeout=15)
        assert r.status_code == 200, r.text
        body = r.json()
        assert set(body.keys()) >= {"apple", "google", "missing"}
        assert isinstance(body["apple"], bool)
        assert isinstance(body["google"], bool)
        assert isinstance(body["missing"], dict)
        assert "apple" in body["missing"] and "google" in body["missing"]
        assert isinstance(body["missing"]["apple"], list)
        assert isinstance(body["missing"]["google"], list)

    def test_status_reports_keys_missing(self, api_client):
        """In this env neither Apple nor Google is configured."""
        body = api_client.get(f"{BASE_URL}/api/wallet/status", timeout=15).json()
        assert body["apple"] is False
        assert body["google"] is False
        assert len(body["missing"]["apple"]) > 0
        assert len(body["missing"]["google"]) > 0


class TestApplePass:
    """GET /api/wallet/apple/{code}.pkpass"""

    CODE = "SO-7F3K-92QX"

    def test_apple_returns_503_when_unconfigured(self, api_client):
        r = api_client.get(
            f"{BASE_URL}/api/wallet/apple/{self.CODE}.pkpass",
            params={"expires": "2027-12-15"},
            timeout=15,
        )
        assert r.status_code == 503, f"Expected 503, got {r.status_code}: {r.text}"

    def test_apple_missing_expires_returns_422(self, api_client):
        r = api_client.get(
            f"{BASE_URL}/api/wallet/apple/{self.CODE}.pkpass",
            timeout=15,
        )
        assert r.status_code == 422, f"Expected 422 for missing expires, got {r.status_code}"


class TestGooglePass:
    """GET /api/wallet/google/{code}"""

    CODE = "SO-7F3K-92QX"

    def test_google_returns_503_when_unconfigured(self, api_client):
        r = api_client.get(
            f"{BASE_URL}/api/wallet/google/{self.CODE}",
            params={"expires": "2027-12-15"},
            timeout=15,
        )
        assert r.status_code == 503, f"Expected 503, got {r.status_code}: {r.text}"

    def test_google_missing_expires_returns_422(self, api_client):
        r = api_client.get(
            f"{BASE_URL}/api/wallet/google/{self.CODE}",
            timeout=15,
        )
        assert r.status_code == 422, f"Expected 422 for missing expires, got {r.status_code}"
