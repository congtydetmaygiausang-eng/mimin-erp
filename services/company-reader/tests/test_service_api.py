from __future__ import annotations

import asyncio
import json
import os
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from company_reader.api import CompanyReaderASGI, MAX_BODY_BYTES  # noqa: E402
from company_reader.app import create_app_from_env  # noqa: E402
from company_reader.service_models import CompanyReadResponse  # noqa: E402


class FakePipeline:
    def __init__(self) -> None:
        self.calls: list[tuple[str, tuple[str, ...]]] = []

    def read(self, request_id: str, urls: tuple[str, ...]) -> CompanyReadResponse:
        self.calls.append((request_id, urls))
        return CompanyReadResponse(request_id, (), ())


async def invoke(
    app: CompanyReaderASGI,
    *,
    path: str = "/v1/company-reader/read",
    method: str = "POST",
    body: bytes = b"",
    headers: tuple[tuple[bytes, bytes], ...] = (),
) -> tuple[int, dict[str, str], dict[str, object]]:
    sent: list[dict[str, object]] = []
    received = False

    async def receive() -> dict[str, object]:
        nonlocal received
        if received:
            return {"type": "http.disconnect"}
        received = True
        return {"type": "http.request", "body": body, "more_body": False}

    async def send(message: dict[str, object]) -> None:
        sent.append(message)

    await app(
        {"type": "http", "path": path, "method": method, "headers": headers},
        receive,
        send,
    )
    start, response = sent
    response_headers = {
        bytes(key).decode("latin-1"): bytes(value).decode("latin-1")
        for key, value in start["headers"]  # type: ignore[union-attr]
    }
    payload = json.loads(bytes(response["body"]).decode("utf-8"))
    return int(start["status"]), response_headers, payload


class CompanyReaderASGITests(unittest.TestCase):
    token = "t" * 40

    def test_health_reports_dark_launch_state(self) -> None:
        status, headers, payload = asyncio.run(
            invoke(CompanyReaderASGI(FakePipeline(), "", False), path="/healthz", method="GET")
        )
        self.assertEqual(status, 200)
        self.assertFalse(payload["enabled"])
        self.assertEqual(headers["cache-control"], "no-store")

    def test_read_is_disabled_by_default(self) -> None:
        status, _, payload = asyncio.run(invoke(CompanyReaderASGI(FakePipeline(), "", False)))
        self.assertEqual(status, 503)
        self.assertEqual(payload["error"], "FEATURE_DISABLED")

    def test_authorized_request_is_bounded_and_forwarded(self) -> None:
        pipeline = FakePipeline()
        app = CompanyReaderASGI(pipeline, self.token, True)
        body = json.dumps({"request_id": "request_123", "urls": ["https://example.com/a"]}).encode()
        status, _, payload = asyncio.run(invoke(
            app,
            body=body,
            headers=((b"authorization", f"Bearer {self.token}".encode()), (b"content-type", b"application/json")),
        ))
        self.assertEqual(status, 200)
        self.assertEqual(payload["request_id"], "request_123")
        self.assertEqual(pipeline.calls, [("request_123", ("https://example.com/a",))])

    def test_rejects_unauthorized_duplicate_and_oversized_requests(self) -> None:
        app = CompanyReaderASGI(FakePipeline(), self.token, True)
        status, _, _ = asyncio.run(invoke(app))
        self.assertEqual(status, 401)
        headers = ((b"authorization", f"Bearer {self.token}".encode()), (b"content-type", b"application/json"))
        duplicate = json.dumps({"request_id": "request_123", "urls": ["https://a.test", "https://a.test"]}).encode()
        status, _, payload = asyncio.run(invoke(app, body=duplicate, headers=headers))
        self.assertEqual((status, payload["error"]), (400, "EMPTY_OR_DUPLICATE_URL"))
        status, _, payload = asyncio.run(invoke(app, body=b"x" * (MAX_BODY_BYTES + 1), headers=headers))
        self.assertEqual((status, payload["error"]), (413, "PAYLOAD_TOO_LARGE"))

    def test_environment_factory_requires_explicit_safe_enablement(self) -> None:
        disabled = create_app_from_env({})
        self.assertFalse(disabled.enabled)
        missing_token = create_app_from_env({"COMPANY_READER_ENABLED": "true"})
        self.assertEqual(missing_token.configuration_error, "MISSING_SERVICE_TOKEN")
        missing_ack = create_app_from_env({
            "COMPANY_READER_ENABLED": "true",
            "COMPANY_READER_SERVICE_TOKEN": self.token,
        })
        self.assertEqual(missing_ack.configuration_error, "MEMORY_GUARDRAILS_NOT_ACKNOWLEDGED")
        enabled = create_app_from_env({
            "COMPANY_READER_ENABLED": "true",
            "COMPANY_READER_SERVICE_TOKEN": self.token,
            "COMPANY_READER_ALLOW_MEMORY_GUARDRAILS": "true",
        })
        self.assertIsNone(enabled.configuration_error)


if __name__ == "__main__":
    unittest.main()
