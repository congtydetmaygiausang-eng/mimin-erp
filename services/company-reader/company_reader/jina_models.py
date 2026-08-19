"""Typed JT6 Jina Reader fallback evidence and decision contracts."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from enum import StrEnum
from typing import Any

from .extraction_models import ExtractedDocument


class JinaReadStatus(StrEnum):
    OK = "OK"
    NOT_CONFIGURED = "NOT_CONFIGURED"
    BLOCKED = "BLOCKED"
    HTTP_ERROR = "HTTP_ERROR"
    TIMEOUT = "TIMEOUT"
    TOO_LARGE = "TOO_LARGE"
    INVALID_RESPONSE = "INVALID_RESPONSE"
    NETWORK_ERROR = "NETWORK_ERROR"
    RATE_LIMITED = "RATE_LIMITED"
    CIRCUIT_OPEN = "CIRCUIT_OPEN"


@dataclass(frozen=True, slots=True)
class JinaReadEvidence:
    requested_url: str
    normalized_target_url: str | None
    status: JinaReadStatus
    provider: str = "jina-reader"
    http_status: int | None = None
    title: str | None = None
    description: str | None = None
    content: str | None = None
    content_sha256: str | None = None
    bytes_read: int = 0
    content_truncated: bool = False
    error_code: str | None = None
    error_detail: str | None = None

    def to_dict(self) -> dict[str, Any]:
        result = asdict(self)
        result["status"] = self.status.value
        return result


class FallbackDecision(StrEnum):
    PRIMARY_ACCEPTED = "PRIMARY_ACCEPTED"
    JINA_ACCEPTED = "JINA_ACCEPTED"
    JINA_FAILED = "JINA_FAILED"
    FALLBACK_NOT_ALLOWED = "FALLBACK_NOT_ALLOWED"


@dataclass(frozen=True, slots=True)
class FallbackOutcome:
    decision: FallbackDecision
    selected_document: ExtractedDocument
    jina_evidence: JinaReadEvidence | None = None
    reason: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "decision": self.decision.value,
            "selected_document": self.selected_document.to_dict(),
            "jina_evidence": self.jina_evidence.to_dict() if self.jina_evidence else None,
            "reason": self.reason,
        }
