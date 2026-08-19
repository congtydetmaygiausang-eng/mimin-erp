"""Typed contracts for JT1 fetch evidence."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from enum import StrEnum
from typing import Any


class FetchStatus(StrEnum):
    OK = "OK"
    BLOCKED = "BLOCKED"
    HTTP_ERROR = "HTTP_ERROR"
    TIMEOUT = "TIMEOUT"
    TOO_LARGE = "TOO_LARGE"
    UNSUPPORTED_CONTENT = "UNSUPPORTED_CONTENT"
    NETWORK_ERROR = "NETWORK_ERROR"


@dataclass(frozen=True, slots=True)
class FetchEvidence:
    requested_url: str
    final_url: str | None
    status: FetchStatus
    http_status: int | None = None
    content_type: str | None = None
    charset: str | None = None
    body_text: str | None = None
    body_sha256: str | None = None
    bytes_read: int = 0
    fetched_at: str | None = None
    redirect_chain: tuple[str, ...] = field(default_factory=tuple)
    response_headers: dict[str, str] = field(default_factory=dict)
    error_code: str | None = None
    error_detail: str | None = None

    def to_dict(self) -> dict[str, Any]:
        """Return a JSON-serializable audit payload."""
        result = asdict(self)
        result["status"] = self.status.value
        result["redirect_chain"] = list(self.redirect_chain)
        return result

