"""Minimal dependency-free ASGI boundary for JT9 dark launch."""

from __future__ import annotations

import asyncio
import hmac
import json
import re
from dataclasses import dataclass
from typing import Awaitable, Callable, Protocol

from .service_models import CompanyReadResponse


REQUEST_ID = re.compile(r"^[A-Za-z0-9_-]{8,64}$")
MAX_BODY_BYTES = 16_384
MAX_URLS = 5


class Pipeline(Protocol):
    def read(self, request_id: str, urls: tuple[str, ...]) -> CompanyReadResponse: ...


Receive = Callable[[], Awaitable[dict[str, object]]]
Send = Callable[[dict[str, object]], Awaitable[None]]


@dataclass(frozen=True, slots=True)
class CompanyReaderASGI:
    pipeline: Pipeline
    service_token: str
    enabled: bool = False
    configuration_error: str | None = None

    async def __call__(self, scope: dict[str, object], receive: Receive, send: Send) -> None:
        if scope.get("type") != "http":
            return
        path = str(scope.get("path", ""))
        method = str(scope.get("method", "GET")).upper()
        if path == "/healthz" and method == "GET":
            await self._json(send, 200, {"status": "ok", "enabled": self.enabled, "configured": self.configuration_error is None, "version": "JT9"})
            return
        if path != "/v1/company-reader/read":
            await self._json(send, 404, {"error": "NOT_FOUND"})
            return
        if method != "POST":
            await self._json(send, 405, {"error": "METHOD_NOT_ALLOWED"}, ((b"allow", b"POST"),))
            return
        if not self.enabled:
            await self._json(send, 503, {"error": "FEATURE_DISABLED"})
            return
        if self.configuration_error:
            await self._json(send, 503, {"error": "SERVICE_NOT_CONFIGURED"})
            return
        headers = self._headers(scope)
        expected = f"Bearer {self.service_token}"
        if not hmac.compare_digest(headers.get("authorization", ""), expected):
            await self._json(send, 401, {"error": "UNAUTHORIZED"})
            return
        if headers.get("content-type", "").split(";", 1)[0].strip().lower() != "application/json":
            await self._json(send, 415, {"error": "JSON_REQUIRED"})
            return
        body = await self._body(receive)
        if body is None:
            await self._json(send, 413, {"error": "PAYLOAD_TOO_LARGE"})
            return
        request = self._request(body)
        if isinstance(request, str):
            await self._json(send, 400, {"error": request})
            return
        request_id, urls = request
        # Fetch/extraction are synchronous by design; keep the ASGI event loop responsive.
        result = await asyncio.to_thread(self.pipeline.read, request_id, urls)
        await self._json(send, 200, result.to_dict())

    @staticmethod
    def _headers(scope: dict[str, object]) -> dict[str, str]:
        result = {}
        for key, value in scope.get("headers", []):
            result[bytes(key).decode("latin-1").lower()] = bytes(value).decode("latin-1")
        return result

    @staticmethod
    async def _body(receive: Receive) -> bytes | None:
        chunks = bytearray()
        while True:
            message = await receive()
            if message.get("type") == "http.disconnect":
                return b""
            if message.get("type") != "http.request":
                continue
            chunk = message.get("body", b"")
            if isinstance(chunk, bytes):
                chunks.extend(chunk)
            if len(chunks) > MAX_BODY_BYTES:
                return None
            if not message.get("more_body", False):
                return bytes(chunks)

    @staticmethod
    def _request(body: bytes) -> tuple[str, tuple[str, ...]] | str:
        try:
            payload = json.loads(body.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            return "INVALID_JSON"
        if not isinstance(payload, dict) or set(payload) != {"request_id", "urls"}:
            return "INVALID_REQUEST_SHAPE"
        request_id, urls = payload.get("request_id"), payload.get("urls")
        if not isinstance(request_id, str) or not REQUEST_ID.fullmatch(request_id):
            return "INVALID_REQUEST_ID"
        if not isinstance(urls, list) or not 1 <= len(urls) <= MAX_URLS or any(not isinstance(url, str) for url in urls):
            return "INVALID_URL_LIST"
        unique_urls = tuple(dict.fromkeys(url.strip() for url in urls if url.strip()))
        if not unique_urls or len(unique_urls) != len(urls):
            return "EMPTY_OR_DUPLICATE_URL"
        return request_id, unique_urls

    @staticmethod
    async def _json(
        send: Send,
        status: int,
        payload: object,
        extra_headers: tuple[tuple[bytes, bytes], ...] = (),
    ) -> None:
        body = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        headers = (
            (b"content-type", b"application/json; charset=utf-8"),
            (b"content-length", str(len(body)).encode()),
            (b"cache-control", b"no-store"),
            (b"x-content-type-options", b"nosniff"),
            *extra_headers,
        )
        await send({"type": "http.response.start", "status": status, "headers": headers})
        await send({"type": "http.response.body", "body": body})
