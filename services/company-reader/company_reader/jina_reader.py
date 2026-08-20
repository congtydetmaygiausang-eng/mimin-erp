"""Bounded JT6 adapter for Jina Reader's JSON response."""

from __future__ import annotations

import hashlib
import json
import socket
import urllib.error
import urllib.request
from collections.abc import Callable
from dataclasses import dataclass
from typing import Protocol

from .jina_models import JinaReadEvidence, JinaReadStatus
from .url_policy import UrlPolicy, UrlPolicyError


class ResponseLike(Protocol):
    status: int

    def read(self, amount: int = -1) -> bytes: ...
    def close(self) -> None: ...


OpenUrl = Callable[[urllib.request.Request, float], ResponseLike]


def default_open(request: urllib.request.Request, timeout: float) -> ResponseLike:
    return urllib.request.urlopen(request, timeout=timeout)


@dataclass(frozen=True, slots=True)
class JinaReaderClient:
    policy: UrlPolicy
    api_key: str | None = None
    opener: OpenUrl = default_open
    timeout_seconds: float = 20.0
    max_response_bytes: int = 2_000_000
    max_content_chars: int = 200_000

    def read(self, raw_url: str) -> JinaReadEvidence:
        try:
            target_url = self.policy.validate(raw_url)
        except (UrlPolicyError, OSError) as error:
            return self._failure(raw_url, None, JinaReadStatus.BLOCKED, getattr(error, "code", "DNS_ERROR"), str(error))

        headers = {
            "Accept": "application/json",
            "X-Return-Format": "markdown",
            "X-With-Generated-Alt": "false",
            "User-Agent": "MIMIN-CompanyReader/1.0 (+https://mimin-erp.vercel.app)",
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        request = urllib.request.Request(
            f"https://r.jina.ai/{target_url}",
            headers=headers,
            method="GET",
        )
        try:
            response = self.opener(request, self.timeout_seconds)
        except urllib.error.HTTPError as error:
            return self._failure(raw_url, target_url, JinaReadStatus.HTTP_ERROR, f"HTTP_{error.code}", "Jina Reader trả lỗi HTTP", error.code)
        except (TimeoutError, socket.timeout) as error:
            return self._failure(raw_url, target_url, JinaReadStatus.TIMEOUT, "JINA_TIMEOUT", str(error) or "Jina Reader quá thời gian")
        except (urllib.error.URLError, OSError) as error:
            return self._failure(raw_url, target_url, JinaReadStatus.NETWORK_ERROR, "JINA_NETWORK_ERROR", str(error))

        try:
            body = response.read(self.max_response_bytes + 1)
            if len(body) > self.max_response_bytes:
                return self._failure(raw_url, target_url, JinaReadStatus.TOO_LARGE, "JINA_RESPONSE_LIMIT", "Phản hồi Jina vượt giới hạn", int(response.status), len(body))
            try:
                payload = json.loads(body.decode("utf-8"))
            except (UnicodeDecodeError, json.JSONDecodeError) as error:
                return self._failure(raw_url, target_url, JinaReadStatus.INVALID_RESPONSE, "JINA_INVALID_JSON", str(error), int(response.status), len(body))
            parsed = self._parse_payload(payload)
            if parsed is None:
                return self._failure(raw_url, target_url, JinaReadStatus.INVALID_RESPONSE, "JINA_INVALID_SHAPE", "Thiếu data.content hoặc data.url", int(response.status), len(body))
            returned_url, title, description, content = parsed
            try:
                normalized_returned = self.policy.validate(returned_url)
            except (UrlPolicyError, OSError) as error:
                return self._failure(raw_url, target_url, JinaReadStatus.BLOCKED, "JINA_RETURNED_UNSAFE_URL", str(error), int(response.status), len(body))
            if normalized_returned != target_url:
                return self._failure(raw_url, target_url, JinaReadStatus.INVALID_RESPONSE, "JINA_TARGET_MISMATCH", "URL Jina trả về không khớp URL đã duyệt", int(response.status), len(body))
            normalized_content = self._normalize(content)
            if not normalized_content:
                return self._failure(raw_url, target_url, JinaReadStatus.INVALID_RESPONSE, "JINA_EMPTY_CONTENT", "Jina không trả nội dung", int(response.status), len(body))
            bounded = normalized_content[: self.max_content_chars]
            return JinaReadEvidence(
                requested_url=raw_url,
                normalized_target_url=target_url,
                status=JinaReadStatus.OK,
                http_status=int(response.status),
                title=self._bounded(title, 500),
                description=self._bounded(description, 1_000),
                content=bounded,
                content_sha256=hashlib.sha256(bounded.encode("utf-8")).hexdigest(),
                bytes_read=len(body),
                content_truncated=len(normalized_content) > self.max_content_chars,
            )
        finally:
            response.close()

    @staticmethod
    def _parse_payload(payload: object) -> tuple[str, str | None, str | None, str] | None:
        if not isinstance(payload, dict):
            return None
        data = payload.get("data")
        if not isinstance(data, dict):
            return None
        url, content = data.get("url"), data.get("content")
        if not isinstance(url, str) or not isinstance(content, str):
            return None
        title = data.get("title") if isinstance(data.get("title"), str) else None
        description = data.get("description") if isinstance(data.get("description"), str) else None
        return url, title, description, content

    @staticmethod
    def _normalize(value: str) -> str:
        return "\n".join(line.rstrip() for line in value.replace("\r\n", "\n").replace("\r", "\n").splitlines()).strip()

    @classmethod
    def _bounded(cls, value: str | None, maximum: int) -> str | None:
        normalized = cls._normalize(value or "")
        return normalized[:maximum] or None

    @staticmethod
    def _failure(
        requested_url: str,
        target_url: str | None,
        status: JinaReadStatus,
        code: str,
        detail: str,
        http_status: int | None = None,
        bytes_read: int = 0,
    ) -> JinaReadEvidence:
        return JinaReadEvidence(
            requested_url=requested_url,
            normalized_target_url=target_url,
            status=status,
            http_status=http_status,
            bytes_read=bytes_read,
            error_code=code,
            error_detail=detail[:300],
        )
