"""JT6 Jina Reader fallback tests without Internet access."""

from __future__ import annotations

import json
import socket
import sys
import unittest
import urllib.error
from pathlib import Path


SERVICE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SERVICE_ROOT))

from company_reader.extraction_models import ExtractedDocument, ExtractionStatus  # noqa: E402
from company_reader.fallback import JinaFallbackCoordinator  # noqa: E402
from company_reader.jina_models import FallbackDecision, JinaReadStatus  # noqa: E402
from company_reader.jina_reader import JinaReaderClient  # noqa: E402
from company_reader.models import FetchEvidence, FetchStatus  # noqa: E402
from company_reader.url_policy import UrlPolicy  # noqa: E402


def public_resolver(_hostname: str, _port: int) -> tuple[str, ...]:
    return ("93.184.216.34",)


class FakeResponse:
    def __init__(self, payload: object, *, raw: bytes | None = None) -> None:
        self.status = 200
        self.body = raw if raw is not None else json.dumps(payload).encode()
        self.closed = False

    def read(self, amount: int = -1) -> bytes:
        return self.body if amount < 0 else self.body[:amount]

    def close(self) -> None:
        self.closed = True


def payload(content: str, url: str = "https://example.com/company") -> dict[str, object]:
    return {
        "code": 200,
        "data": {
            "url": url,
            "title": "CÔNG TY TNHH MIMIN",
            "description": "Nhà sản xuất vải cotton",
            "content": content,
        },
    }


def fetch(status: FetchStatus) -> FetchEvidence:
    return FetchEvidence(
        requested_url="https://example.com/company",
        final_url=("https://example.com/company" if status is FetchStatus.OK else None),
        status=status,
        body_text=("weak" if status is FetchStatus.OK else None),
        body_sha256=("a" * 64 if status is FetchStatus.OK else None),
    )


def document(status: ExtractionStatus, text: str | None = None) -> ExtractedDocument:
    return ExtractedDocument(
        source_url="https://example.com/company",
        fetch_sha256="a" * 64,
        status=status,
        extractor="trafilatura",
        extractor_version="2.2.0",
        main_text=text,
        text_sha256=("b" * 64 if text else None),
        char_count=len(text or ""),
        word_count=len((text or "").split()),
    )


class JinaReaderClientTests(unittest.TestCase):
    def make_client(self, opener, **overrides) -> JinaReaderClient:
        return JinaReaderClient(
            policy=UrlPolicy(resolver=public_resolver),
            opener=opener,
            **overrides,
        )

    def test_valid_json_is_bounded_hashed_and_preserves_target(self) -> None:
        response = FakeResponse(payload("Tên pháp lý: CÔNG TY TNHH MIMIN\nMã số thuế: 0316936282"))
        result = self.make_client(lambda _request, _timeout: response).read("https://example.com/company#intro")
        self.assertEqual(result.status, JinaReadStatus.OK)
        self.assertEqual(result.normalized_target_url, "https://example.com/company")
        self.assertEqual(len(result.content_sha256 or ""), 64)
        self.assertTrue(response.closed)

    def test_authorization_is_sent_but_never_serialized(self) -> None:
        captured = []

        def opener(request, _timeout):
            captured.append(request)
            return FakeResponse(payload("x" * 100))

        client = self.make_client(opener, api_key="jina_secret")
        result = client.read("https://example.com/company")
        self.assertEqual(captured[0].get_header("Authorization"), "Bearer jina_secret")
        self.assertNotIn("jina_secret", json.dumps(result.to_dict()))

    def test_unsafe_target_is_blocked_before_provider_call(self) -> None:
        calls = 0

        def opener(_request, _timeout):
            nonlocal calls
            calls += 1
            return FakeResponse(payload("never"))

        result = self.make_client(opener).read("https://127.0.0.1/admin")
        self.assertEqual(result.status, JinaReadStatus.BLOCKED)
        self.assertEqual(calls, 0)

    def test_target_mismatch_is_rejected(self) -> None:
        result = self.make_client(
            lambda _request, _timeout: FakeResponse(payload("x" * 100, "https://other.example/company"))
        ).read("https://example.com/company")
        self.assertEqual(result.status, JinaReadStatus.INVALID_RESPONSE)
        self.assertEqual(result.error_code, "JINA_TARGET_MISMATCH")

    def test_response_limit_and_timeout_are_explicit(self) -> None:
        too_large = self.make_client(
            lambda _request, _timeout: FakeResponse({}, raw=b"x" * 101),
            max_response_bytes=100,
        ).read("https://example.com/company")
        self.assertEqual(too_large.status, JinaReadStatus.TOO_LARGE)

        def timeout(_request, _seconds):
            raise socket.timeout("late")

        timed_out = self.make_client(timeout).read("https://example.com/company")
        self.assertEqual(timed_out.status, JinaReadStatus.TIMEOUT)


class JinaFallbackCoordinatorTests(unittest.TestCase):
    def coordinator(self, opener) -> JinaFallbackCoordinator:
        return JinaFallbackCoordinator(
            JinaReaderClient(policy=UrlPolicy(resolver=public_resolver), opener=opener)
        )

    def test_good_primary_never_calls_jina(self) -> None:
        calls = 0

        def opener(_request, _timeout):
            nonlocal calls
            calls += 1
            return FakeResponse(payload("never"))

        primary = "Nội dung doanh nghiệp đã đủ bằng chứng. " * 10
        result = self.coordinator(opener).recover(
            "https://example.com/company", fetch(FetchStatus.OK), document(ExtractionStatus.OK, primary)
        )
        self.assertEqual(result.decision, FallbackDecision.PRIMARY_ACCEPTED)
        self.assertEqual(calls, 0)

    def test_security_and_size_failures_never_fallback(self) -> None:
        calls = 0

        def opener(_request, _timeout):
            nonlocal calls
            calls += 1
            return FakeResponse(payload("never"))

        for status in (FetchStatus.BLOCKED, FetchStatus.TOO_LARGE, FetchStatus.UNSUPPORTED_CONTENT):
            result = self.coordinator(opener).recover(
                "https://example.com/company", fetch(status), document(ExtractionStatus.SKIPPED_FETCH_ERROR)
            )
            self.assertEqual(result.decision, FallbackDecision.FALLBACK_NOT_ALLOWED)
        self.assertEqual(calls, 0)

    def test_allowed_failure_uses_jina_and_returns_normal_document(self) -> None:
        content = "Tên pháp lý: CÔNG TY TNHH MIMIN\nMã số thuế: 0316936282\n" + "Giới thiệu doanh nghiệp. " * 5
        result = self.coordinator(
            lambda _request, _timeout: FakeResponse(payload(content))
        ).recover(
            "https://example.com/company",
            fetch(FetchStatus.TIMEOUT),
            document(ExtractionStatus.SKIPPED_FETCH_ERROR),
        )
        self.assertEqual(result.decision, FallbackDecision.JINA_ACCEPTED)
        self.assertEqual(result.selected_document.status, ExtractionStatus.OK)
        self.assertEqual(result.selected_document.extractor, "jina-reader")
        self.assertEqual(result.selected_document.source_url, "https://example.com/company")

    def test_jina_failure_retains_primary_failure(self) -> None:
        def opener(request, _timeout):
            raise urllib.error.HTTPError(request.full_url, 429, "rate", {}, None)

        primary = document(ExtractionStatus.EMPTY)
        result = self.coordinator(opener).recover(
            "https://example.com/company", fetch(FetchStatus.OK), primary
        )
        self.assertEqual(result.decision, FallbackDecision.JINA_FAILED)
        self.assertIs(result.selected_document, primary)
        self.assertEqual(result.jina_evidence.status, JinaReadStatus.HTTP_ERROR)


if __name__ == "__main__":
    unittest.main()
