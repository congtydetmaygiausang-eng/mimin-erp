"""JT1 bounded fetcher tests using deterministic in-memory responses."""

from __future__ import annotations

import sys
import socket
import unittest
import urllib.error
from datetime import UTC, datetime
from email.message import Message
from pathlib import Path


SERVICE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SERVICE_ROOT))

from company_reader.fetcher import SafeFetcher  # noqa: E402
from company_reader.models import FetchStatus  # noqa: E402
from company_reader.url_policy import UrlPolicy  # noqa: E402


FIXED_TIME = datetime(2026, 8, 19, 12, 0, tzinfo=UTC)


class FakeResponse:
    def __init__(self, body: bytes, content_type: str = "text/html; charset=utf-8") -> None:
        self.status = 200
        self.headers = Message()
        self.headers["Content-Type"] = content_type
        self.headers["Content-Length"] = str(len(body))
        self.headers["X-Secret"] = "must-not-leak"
        self._body = body
        self.closed = False

    def read(self, amount: int = -1) -> bytes:
        return self._body if amount < 0 else self._body[:amount]

    def close(self) -> None:
        self.closed = True


def public_resolver(_hostname: str, _port: int) -> tuple[str, ...]:
    return ("93.184.216.34",)


class SafeFetcherTests(unittest.TestCase):
    def make_fetcher(self, opener, **overrides) -> SafeFetcher:
        return SafeFetcher(
            policy=UrlPolicy(resolver=public_resolver),
            opener=opener,
            clock=lambda: FIXED_TIME,
            **overrides,
        )

    def test_success_returns_hash_text_and_allowlisted_headers(self) -> None:
        response = FakeResponse("Công ty MIMIN".encode())
        fetcher = self.make_fetcher(lambda _request, _timeout: response)
        result = fetcher.fetch("https://example.com/contact#map")

        self.assertEqual(result.status, FetchStatus.OK)
        self.assertEqual(result.final_url, "https://example.com/contact")
        self.assertEqual(result.body_text, "Công ty MIMIN")
        self.assertEqual(result.bytes_read, len("Công ty MIMIN".encode()))
        self.assertEqual(len(result.body_sha256 or ""), 64)
        self.assertNotIn("x-secret", result.response_headers)
        self.assertTrue(response.closed)

    def test_blocks_private_url_without_calling_opener(self) -> None:
        calls = 0

        def opener(_request, _timeout):
            nonlocal calls
            calls += 1
            return FakeResponse(b"never")

        result = self.make_fetcher(opener).fetch("https://127.0.0.1/admin")
        self.assertEqual(result.status, FetchStatus.BLOCKED)
        self.assertEqual(calls, 0)

    def test_rejects_oversized_body_even_when_header_is_missing(self) -> None:
        response = FakeResponse(b"x" * 11)
        del response.headers["Content-Length"]
        result = self.make_fetcher(
            lambda _request, _timeout: response, max_bytes=10
        ).fetch("https://example.com/")
        self.assertEqual(result.status, FetchStatus.TOO_LARGE)
        self.assertEqual(result.error_code, "BODY_LIMIT")

    def test_rejects_declared_content_length_before_reading_body(self) -> None:
        response = FakeResponse(b"small")
        response.headers.replace_header("Content-Length", "999")
        result = self.make_fetcher(
            lambda _request, _timeout: response, max_bytes=10
        ).fetch("https://example.com/")
        self.assertEqual(result.status, FetchStatus.TOO_LARGE)
        self.assertEqual(result.error_code, "CONTENT_LENGTH_LIMIT")

    def test_rejects_unsupported_content_type(self) -> None:
        response = FakeResponse(b"%PDF", "application/pdf")
        result = self.make_fetcher(lambda _request, _timeout: response).fetch(
            "https://example.com/document.pdf"
        )
        self.assertEqual(result.status, FetchStatus.UNSUPPORTED_CONTENT)
        self.assertIsNone(result.body_text)

    def test_validates_every_redirect_hop(self) -> None:
        headers = Message()
        headers["Location"] = "https://127.0.0.1/private"
        redirect = urllib.error.HTTPError(
            "https://example.com/", 302, "Found", headers, None
        )

        def opener(_request, _timeout):
            raise redirect

        result = self.make_fetcher(opener).fetch("https://example.com/")
        self.assertEqual(result.status, FetchStatus.BLOCKED)
        self.assertEqual(result.error_code, "PRIVATE_IP")
        self.assertEqual(result.redirect_chain, ("https://127.0.0.1/private",))

    def test_follows_a_safe_relative_redirect(self) -> None:
        headers = Message()
        headers["Location"] = "/company/contact"
        redirect = urllib.error.HTTPError(
            "https://example.com/", 302, "Found", headers, None
        )
        response = FakeResponse(b"contact")
        calls = 0

        def opener(_request, _timeout):
            nonlocal calls
            calls += 1
            if calls == 1:
                raise redirect
            return response

        result = self.make_fetcher(opener).fetch("https://example.com/")
        self.assertEqual(result.status, FetchStatus.OK)
        self.assertEqual(result.final_url, "https://example.com/company/contact")
        self.assertEqual(result.redirect_chain, ("https://example.com/company/contact",))
        self.assertEqual(calls, 2)

    def test_stops_after_redirect_limit(self) -> None:
        calls = 0

        def opener(request, _timeout):
            nonlocal calls
            calls += 1
            headers = Message()
            headers["Location"] = f"/hop-{calls}"
            raise urllib.error.HTTPError(
                request.full_url, 302, "Found", headers, None
            )

        result = self.make_fetcher(opener, max_redirects=2).fetch(
            "https://example.com/"
        )
        self.assertEqual(result.status, FetchStatus.BLOCKED)
        self.assertEqual(result.error_code, "TOO_MANY_REDIRECTS")
        self.assertEqual(calls, 3)

    def test_maps_socket_timeout(self) -> None:
        def opener(_request, _timeout):
            raise socket.timeout("timed out")

        result = self.make_fetcher(opener).fetch("https://example.com/")
        self.assertEqual(result.status, FetchStatus.TIMEOUT)
        self.assertEqual(result.error_code, "FETCH_TIMEOUT")

    def test_maps_http_error_without_reading_error_body(self) -> None:
        headers = Message()
        error = urllib.error.HTTPError(
            "https://example.com/", 403, "Forbidden", headers, None
        )

        def opener(_request, _timeout):
            raise error

        result = self.make_fetcher(opener).fetch("https://example.com/")
        self.assertEqual(result.status, FetchStatus.HTTP_ERROR)
        self.assertEqual(result.http_status, 403)
        self.assertEqual(result.error_code, "HTTP_403")


if __name__ == "__main__":
    unittest.main()
