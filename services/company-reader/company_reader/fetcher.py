"""Bounded HTML fetcher used before all future Jina/Trafilatura extraction."""

from __future__ import annotations

import hashlib
import socket
import urllib.error
import urllib.request
from collections.abc import Callable
from dataclasses import dataclass
from datetime import UTC, datetime
from email.message import Message
from typing import Protocol
from urllib.parse import urljoin

from .models import FetchEvidence, FetchStatus
from .url_policy import UrlPolicy, UrlPolicyError


class ResponseLike(Protocol):
    status: int
    headers: Message

    def read(self, amount: int = -1) -> bytes: ...
    def close(self) -> None: ...


OpenUrl = Callable[[urllib.request.Request, float], ResponseLike]
Clock = Callable[[], datetime]

ALLOWED_CONTENT_TYPES = frozenset(
    {"text/html", "application/xhtml+xml", "text/plain"}
)
AUDIT_HEADERS = frozenset(
    {"content-type", "content-length", "etag", "last-modified", "cache-control"}
)
REDIRECT_STATUSES = frozenset({301, 302, 303, 307, 308})


class NoRedirectHandler(urllib.request.HTTPRedirectHandler):
    """Disable implicit redirects so every hop passes URL/DNS validation."""

    def redirect_request(self, request, file_pointer, code, message, headers, new_url):
        return None


def default_open(request: urllib.request.Request, timeout: float) -> ResponseLike:
    opener = urllib.request.build_opener(NoRedirectHandler())
    return opener.open(request, timeout=timeout)


@dataclass(frozen=True, slots=True)
class SafeFetcher:
    policy: UrlPolicy
    opener: OpenUrl = default_open
    clock: Clock = lambda: datetime.now(UTC)
    timeout_seconds: float = 12.0
    max_bytes: int = 2_000_000
    max_redirects: int = 3
    user_agent: str = "MIMIN-CompanyReader/1.0 (+https://mimin-erp.vercel.app)"

    def fetch(self, raw_url: str) -> FetchEvidence:
        requested_url = raw_url
        redirects: list[str] = []
        current_url = raw_url

        for redirect_index in range(self.max_redirects + 1):
            try:
                safe_url = self.policy.validate(current_url)
            except (UrlPolicyError, OSError) as error:
                return self._failure(
                    requested_url,
                    FetchStatus.BLOCKED,
                    redirects,
                    getattr(error, "code", "DNS_ERROR"),
                    str(error),
                )

            request = urllib.request.Request(
                safe_url,
                headers={
                    "User-Agent": self.user_agent,
                    "Accept": "text/html,application/xhtml+xml,text/plain;q=0.8",
                    "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.5",
                    "Accept-Encoding": "identity",
                },
                method="GET",
            )
            try:
                response = self.opener(request, self.timeout_seconds)
            except urllib.error.HTTPError as error:
                if error.code in REDIRECT_STATUSES:
                    location = error.headers.get("Location")
                    if not location:
                        return self._failure(
                            requested_url, FetchStatus.HTTP_ERROR, redirects,
                            "REDIRECT_WITHOUT_LOCATION", "Redirect không có Location", error.code,
                        )
                    if redirect_index >= self.max_redirects:
                        return self._failure(
                            requested_url, FetchStatus.BLOCKED, redirects,
                            "TOO_MANY_REDIRECTS", "Vượt quá số redirect cho phép", error.code,
                        )
                    current_url = urljoin(safe_url, location)
                    redirects.append(current_url)
                    continue
                return self._failure(
                    requested_url, FetchStatus.HTTP_ERROR, redirects,
                    f"HTTP_{error.code}", "Nguồn trả lỗi HTTP", error.code,
                )
            except (TimeoutError, socket.timeout) as error:
                return self._failure(
                    requested_url, FetchStatus.TIMEOUT, redirects,
                    "FETCH_TIMEOUT", str(error) or "Nguồn phản hồi quá thời gian",
                )
            except (urllib.error.URLError, OSError) as error:
                return self._failure(
                    requested_url, FetchStatus.NETWORK_ERROR, redirects,
                    "NETWORK_ERROR", str(error),
                )

            try:
                status = int(response.status)
                headers = self._audit_headers(response.headers)
                content_type, charset = self._content_metadata(response.headers)
                if content_type not in ALLOWED_CONTENT_TYPES:
                    return self._failure(
                        requested_url, FetchStatus.UNSUPPORTED_CONTENT, redirects,
                        "UNSUPPORTED_CONTENT_TYPE", content_type or "missing", status,
                        final_url=safe_url, headers=headers,
                    )
                declared_length = self._declared_length(response.headers)
                if declared_length is not None and declared_length > self.max_bytes:
                    return self._failure(
                        requested_url, FetchStatus.TOO_LARGE, redirects,
                        "CONTENT_LENGTH_LIMIT", "Content-Length vượt giới hạn", status,
                        final_url=safe_url, headers=headers,
                    )
                body = response.read(self.max_bytes + 1)
                if len(body) > self.max_bytes:
                    return self._failure(
                        requested_url, FetchStatus.TOO_LARGE, redirects,
                        "BODY_LIMIT", "Nội dung thực tế vượt giới hạn", status,
                        final_url=safe_url, headers=headers,
                    )
                effective_charset = charset or "utf-8"
                try:
                    text = body.decode(effective_charset, errors="replace")
                except LookupError:
                    effective_charset = "utf-8"
                    text = body.decode(effective_charset, errors="replace")
                return FetchEvidence(
                    requested_url=requested_url,
                    final_url=safe_url,
                    status=FetchStatus.OK,
                    http_status=status,
                    content_type=content_type,
                    charset=effective_charset,
                    body_text=text,
                    body_sha256=hashlib.sha256(body).hexdigest(),
                    bytes_read=len(body),
                    fetched_at=self.clock().isoformat(),
                    redirect_chain=tuple(redirects),
                    response_headers=headers,
                )
            finally:
                response.close()

        return self._failure(
            requested_url, FetchStatus.BLOCKED, redirects,
            "TOO_MANY_REDIRECTS", "Vượt quá số redirect cho phép",
        )

    def _failure(
        self,
        requested_url: str,
        status: FetchStatus,
        redirects: list[str],
        code: str,
        detail: str,
        http_status: int | None = None,
        *,
        final_url: str | None = None,
        headers: dict[str, str] | None = None,
    ) -> FetchEvidence:
        return FetchEvidence(
            requested_url=requested_url,
            final_url=final_url,
            status=status,
            http_status=http_status,
            fetched_at=self.clock().isoformat(),
            redirect_chain=tuple(redirects),
            response_headers=headers or {},
            error_code=code,
            error_detail=detail[:300],
        )

    @staticmethod
    def _content_metadata(headers: Message) -> tuple[str | None, str | None]:
        content_type = headers.get_content_type().lower() if headers.get("Content-Type") else None
        charset = headers.get_content_charset()
        return content_type, charset

    @staticmethod
    def _declared_length(headers: Message) -> int | None:
        value = headers.get("Content-Length")
        if value is None:
            return None
        try:
            result = int(value)
        except ValueError:
            return None
        return result if result >= 0 else None

    @staticmethod
    def _audit_headers(headers: Message) -> dict[str, str]:
        return {
            key.lower(): value[:500]
            for key, value in headers.items()
            if key.lower() in AUDIT_HEADERS
        }

