"""Typed JT3 field candidates and source evidence."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from enum import StrEnum
from typing import Any


class CandidateField(StrEnum):
    LEGAL_NAME = "LEGAL_NAME"
    TAX_CODE = "TAX_CODE"
    ADDRESS = "ADDRESS"
    PHONE = "PHONE"
    EMAIL = "EMAIL"
    WEBSITE = "WEBSITE"
    INTRODUCTION = "INTRODUCTION"


class EvidenceOrigin(StrEnum):
    MAIN_TEXT = "MAIN_TEXT"
    METADATA_TITLE = "METADATA_TITLE"
    METADATA_DESCRIPTION = "METADATA_DESCRIPTION"


class CandidateBundleStatus(StrEnum):
    OK = "OK"
    MULTI_ENTITY_REVIEW = "MULTI_ENTITY_REVIEW"
    NO_IDENTITY = "NO_IDENTITY"
    SKIPPED_EXTRACTION_ERROR = "SKIPPED_EXTRACTION_ERROR"


@dataclass(frozen=True, slots=True)
class FieldCandidate:
    field: CandidateField
    value: str
    normalized_value: str
    confidence: float
    origin: EvidenceOrigin
    source_url: str | None
    text_sha256: str | None
    excerpt: str
    start: int | None
    end: int | None
    labels: tuple[str, ...] = field(default_factory=tuple)
    warnings: tuple[str, ...] = field(default_factory=tuple)

    def to_dict(self) -> dict[str, Any]:
        result = asdict(self)
        result["field"] = self.field.value
        result["origin"] = self.origin.value
        result["labels"] = list(self.labels)
        result["warnings"] = list(self.warnings)
        return result


@dataclass(frozen=True, slots=True)
class CompanyCandidateBundle:
    source_url: str | None
    text_sha256: str | None
    status: CandidateBundleStatus
    candidates: tuple[FieldCandidate, ...] = field(default_factory=tuple)
    distinct_legal_names: int = 0
    distinct_tax_codes: int = 0
    multi_entity: bool = False
    warnings: tuple[str, ...] = field(default_factory=tuple)

    def to_dict(self) -> dict[str, Any]:
        return {
            "source_url": self.source_url,
            "text_sha256": self.text_sha256,
            "status": self.status.value,
            "candidates": [candidate.to_dict() for candidate in self.candidates],
            "distinct_legal_names": self.distinct_legal_names,
            "distinct_tax_codes": self.distinct_tax_codes,
            "multi_entity": self.multi_entity,
            "warnings": list(self.warnings),
        }

