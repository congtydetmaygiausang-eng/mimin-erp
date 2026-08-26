"""Typed JT9 service response contracts."""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import StrEnum
from typing import Any

from .canonical_models import CanonicalCompanyProfile


@dataclass(frozen=True, slots=True)
class SourceContactSnapshot:
    """Contact facts found on one URL, even when no legal-name anchor exists."""

    legal_names: tuple[str, ...] = ()
    addresses: tuple[str, ...] = ()
    phones: tuple[str, ...] = ()
    emails: tuple[str, ...] = ()
    websites: tuple[str, ...] = ()
    identity_safe: bool = True
    distinct_legal_names: int = 0
    distinct_tax_codes: int = 0

    def to_dict(self) -> dict[str, Any]:
        return {
            "legal_names": list(self.legal_names),
            "addresses": list(self.addresses),
            "phones": list(self.phones),
            "emails": list(self.emails),
            "websites": list(self.websites),
            "identity_safe": self.identity_safe,
            "distinct_legal_names": self.distinct_legal_names,
            "distinct_tax_codes": self.distinct_tax_codes,
        }


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
    contact_snapshot: SourceContactSnapshot | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "source_url": self.source_url,
            "status": self.status.value,
            "fetch_status": self.fetch_status,
            "extraction_status": self.extraction_status,
            "fallback_decision": self.fallback_decision,
            "entity_count": self.entity_count,
            "error_code": self.error_code,
            "contact_snapshot": (
                self.contact_snapshot.to_dict() if self.contact_snapshot else None
            ),
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
