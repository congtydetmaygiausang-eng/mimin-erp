"""Typed JT9 service response contracts."""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import StrEnum
from typing import Any

from .canonical_models import CanonicalCompanyProfile


class SourceProcessingStatus(StrEnum):
    PROCESSED = "PROCESSED"
    NO_ENTITY = "NO_ENTITY"
    FAILED = "FAILED"


@dataclass(frozen=True, slots=True)
class SourceProcessingReport:
    source_url: str
    status: SourceProcessingStatus
    fetch_status: str
    extraction_status: str
    fallback_decision: str
    entity_count: int = 0
    error_code: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "source_url": self.source_url,
            "status": self.status.value,
            "fetch_status": self.fetch_status,
            "extraction_status": self.extraction_status,
            "fallback_decision": self.fallback_decision,
            "entity_count": self.entity_count,
            "error_code": self.error_code,
        }


@dataclass(frozen=True, slots=True)
class CompanyReadResponse:
    request_id: str
    profiles: tuple[CanonicalCompanyProfile, ...]
    sources: tuple[SourceProcessingReport, ...]
    warnings: tuple[str, ...] = field(default_factory=tuple)

    def to_dict(self) -> dict[str, Any]:
        return {
            "request_id": self.request_id,
            "profiles": [profile.to_dict() for profile in self.profiles],
            "sources": [source.to_dict() for source in self.sources],
            "warnings": list(self.warnings),
        }
