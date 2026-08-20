"""Loopback-only browser gateway for local MIMIN ERP shadow testing."""

from __future__ import annotations

import asyncio
import json
import os
import re
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Awaitable, Callable


REQUEST_ID = re.compile(r"^[A-Za-z0-9_-]{8,64}$")
ALLOWED_ORIGINS = frozenset({"http://localhost:3000", "http://127.0.0.1:3000"})
Receive = Callable[[], Awaitable[dict[str, object]]]
Send = Callable[[dict[str, object]], Awaitable[None]]


@dataclass(frozen=True, slots=True)
class LocalCompanyReaderGateway:
    upstream_url: str
    service_token: str

    async def __call__(self, scope: dict[str, object], receive: Receive, send: Send) -> None:
        if scope.get("type") != "http":
            return
        method = str(scope.get("method", "GET")).upper()
        path = str(scope.get("path", ""))
        headers = self._headers(scope)
        origin = headers.get("origin", "")
        if origin and origin not in ALLOWED_ORIGINS:
            await self._json(send, 403, {"error": "ORIGIN_NOT_ALLOWED"})
            return
        if method == "OPTIONS":
            await self._json(send, 204, {}, origin)
            return
        if path == "/healthz" and method == "GET":
            await self._json(send, 200, {"status": "ok", "mode": "local-shadow"}, origin)
            return
        if path != "/v1/company-reader/shadow" or method != "POST":
            await self._json(send, 404, {"error": "NOT_FOUND"}, origin)
            return
        body = await self._body(receive)
        request = self._validate(body)
        if isinstance(request, str):
            await self._json(send, 400, {"error": request}, origin)
            return
        try:
            status, payload = await asyncio.to_thread(self._forward, request)
        except Exception:
            await self._json(send, 502, {"error": "COMPANY_READER_UNAVAILABLE"}, origin)
            return
        await self._json(send, status, payload, origin)

    def _forward(self, payload: dict[str, object]) -> tuple[int, object]:
        request = urllib.request.Request(
            f"{self.upstream_url.rstrip('/')}/v1/company-reader/read",
            data=json.dumps(payload).encode("utf-8"),
            method="POST",
            headers={
                "Authorization": f"Bearer {self.service_token}",
                "Content-Type": "application/json",
                "X-Mimin-Client": "mimin-local-smoke",
            },
        )
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return response.status, json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as error:
            return error.code, json.loads(error.read().decode("utf-8"))

    @staticmethod
    def _validate(body: bytes) -> dict[str, object] | str:
        try:
            payload = json.loads(body.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            return "INVALID_JSON"
        if not isinstance(payload, dict) or set(payload) != {"request_id", "urls"}:
            return "INVALID_REQUEST"
        request_id, urls = payload.get("request_id"), payload.get("urls")
        if not isinstance(request_id, str) or not REQUEST_ID.fullmatch(request_id):
            return "INVALID_REQUEST_ID"
        if not isinstance(urls, list) or not 1 <= len(urls) <= 5 or any(not isinstance(url, str) or not url.startswith("https://") for url in urls):
            return "INVALID_URLS"
        if len(set(urls)) != len(urls):
            return "DUPLICATE_URLS"
        return {"request_id": request_id, "urls": urls}

    @staticmethod
    def _headers(scope: dict[str, object]) -> dict[str, str]:
        return {bytes(key).decode("latin-1").lower(): bytes(value).decode("latin-1") for key, value in scope.get("headers", [])}

    @staticmethod
    async def _body(receive: Receive) -> bytes:
        chunks = bytearray()
        while True:
            message = await receive()
            chunks.extend(message.get("body", b""))
            if len(chunks) > 16_384 or not message.get("more_body", False):
                return bytes(chunks[:16_385])

    @staticmethod
    async def _json(send: Send, status: int, payload: object, origin: str = "") -> None:
        body = b"" if status == 204 else json.dumps(payload, separators=(",", ":")).encode("utf-8")
        cors_origin = origin if origin in ALLOWED_ORIGINS else "http://localhost:3000"
        headers = [
            (b"content-type", b"application/json"),
            (b"cache-control", b"no-store"),
            (b"access-control-allow-origin", cors_origin.encode()),
            (b"access-control-allow-methods", b"POST, OPTIONS"),
            (b"access-control-allow-headers", b"content-type"),
            (b"vary", b"Origin"),
        ]
        await send({"type": "http.response.start", "status": status, "headers": headers})
        await send({"type": "http.response.body", "body": body})


def create_local_gateway() -> LocalCompanyReaderGateway:
    if os.environ.get("COMPANY_READER_LOCAL_GATEWAY_ACKNOWLEDGED", "false").lower() != "true":
        raise RuntimeError("Local gateway must be explicitly acknowledged")
    token = os.environ.get("COMPANY_READER_SERVICE_TOKEN", "")
    if len(token) < 32:
        raise RuntimeError("Missing local Company Reader service token")
    return LocalCompanyReaderGateway(os.environ.get("COMPANY_READER_UPSTREAM_URL", "http://127.0.0.1:8765"), token)


app = create_local_gateway()
