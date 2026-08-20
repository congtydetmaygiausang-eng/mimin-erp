"""Typed JT7 canonical company field-selection contracts."""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import StrEnum
from typing import Any

from .candidate_models import CandidateField, FieldCandidate


class CanonicalFieldStatus(StrEnum):
    CONSENSUS = "CONSENSUS"
    SINGLE_SOURCE = "SINGLE_SOURCE"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    CONFLICT = "CONFLICT"
    MISSING = "MISSING"


class CanonicalProfileStatus(StrEnum):
    READY_FOR_REVIEW = "READY_FOR_REVIEW"
    NEEDS_REVIEW = "NEEDS_REVIEW"
    BLOCKED = "BLOCKED"


@dataclass(frozen=True, slots=True)
class CanonicalFieldDecision:
    field: CandidateField
    status: CanonicalFieldStatus
    selected_value: str | None
    normalized_value: str | None
    confidence: float
    independent_source_count: int
    evidence: tuple[FieldCandidate, ...] = field(default_factory=tuple)
    alternatives: tuple[str, ...] = field(default_factory=tuple)
    reasons: tuple[str, ...] = field(default_factory=tuple)

    def to_dict(self) -> dict[str, Any]:
        return {
            "field": self.field.value,
            "status": self.status.value,
            "selected_value": self.selected_value,
            "normalized_value": self.normalized_value,
            "confidence": self.confidence,
            "independent_source_count": self.independent_source_count,
            "evidence": [item.to_dict() for item in self.evidence],
            "alternatives": list(self.alternatives),
            "reasons": list(self.reasons),
        }


@dataclass(frozen=True, slots=True)
class CanonicalCompanyProfile:
    group_id: str
    status: CanonicalProfileStatus
    fields: tuple[CanonicalFieldDecision, ...]
    source_count: int
    strong_keys: tuple[str, ...] = field(default_factory=tuple)
    warnings: tuple[str, ...] = field(default_factory=tuple)

    def field(self, name: CandidateField) -> CanonicalFieldDecision:
        return next(item for item in self.fields if item.field is name)

    def to_dict(self) -> dict[str, Any]:
        return {
            "group_id": self.group_id,
            "status": self.status.value,
            "fields": [item.to_dict() for item in self.fields],
            "source_count": self.source_count,
            "strong_keys": list(self.strong_keys),
            "warnings": list(self.warnings),
        }
