from __future__ import annotations

import io
import json
import sys
import unittest
from pathlib import Path
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from company_reader.shadow_probe import _local_service_url, send_shadow_probe  # noqa: E402


class FakeResponse:
    status = 202

    def __enter__(self) -> FakeResponse:
        return self

    def __exit__(self, *_args: object) -> None:
        return None

    def read(self, _limit: int) -> bytes:
        return json.dumps({"status": "SHADOW_PROCESSED", "profile_count": 1}).encode()


class ShadowProbeTests(unittest.TestCase):
    def test_service_url_is_restricted_to_loopback(self) -> None:
        self.assertEqual(_local_service_url("http://127.0.0.1:8765/"), "http://127.0.0.1:8765")
        for value in (
            "https://127.0.0.1:8765",
            "http://example.com:8765",
            "http://127.0.0.1",
            "http://user:pass@127.0.0.1:8765",
        ):
            with self.subTest(value=value), self.assertRaises(ValueError):
                _local_service_url(value)

    def test_probe_uses_service_auth_without_printing_token(self) -> None:
        token = "s" * 40
        captured_request = None

        def fake_open(request: object, timeout: float) -> FakeResponse:
            nonlocal captured_request
            captured_request = request
            self.assertEqual(timeout, 30.0)
            return FakeResponse()

        with patch("urllib.request.urlopen", side_effect=fake_open):
            result = send_shadow_probe(
                service_url="http://localhost:8765",
                service_token=token,
                request_id="local_shadow_001",
                urls=("https://example.com",),
            )

        self.assertEqual(result.status_code, 202)
        self.assertEqual(result.payload["status"], "SHADOW_PROCESSED")
        self.assertIsNotNone(captured_request)
        self.assertEqual(captured_request.get_header("Authorization"), f"Bearer {token}")
        self.assertNotIn(token, io.StringIO().getvalue())
