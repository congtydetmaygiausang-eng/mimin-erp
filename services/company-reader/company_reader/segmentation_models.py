"""Typed JT4 company-entity segmentation contracts."""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import StrEnum
from typing import Any

from .candidate_models import FieldCandidate


class SegmentationStatus(StrEnum):
    SINGLE_ENTITY = "SINGLE_ENTITY"
    MULTI_ENTITY = "MULTI_ENTITY"
    NO_SEGMENTS = "NO_SEGMENTS"
    INPUT_MISMATCH = "INPUT_MISMATCH"
    SKIPPED_CANDIDATE_ERROR = "SKIPPED_CANDIDATE_ERROR"


class EntitySegmentStatus(StrEnum):
    STRONG_IDENTITY = "STRONG_IDENTITY"
    WEAK_IDENTITY = "WEAK_IDENTITY"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"


@dataclass(frozen=True, slots=True)
class EntitySegment:
    entity_id: str
    start: int
    end: int
    status: EntitySegmentStatus
    candidates: tuple[FieldCandidate, ...] = field(default_factory=tuple)
    legal_names: tuple[str, ...] = field(default_factory=tuple)
    tax_codes: tuple[str, ...] = field(default_factory=tuple)
    strong_keys: tuple[str, ...] = field(default_factory=tuple)
    warnings: tuple[str, ...] = field(default_factory=tuple)

    def to_dict(self) -> dict[str, Any]:
        return {
            "entity_id": self.entity_id,
            "start": self.start,
            "end": self.end,
            "status": self.status.value,
            "candidates": [candidate.to_dict() for candidate in self.candidates],
            "legal_names": list(self.legal_names),
            "tax_codes": list(self.tax_codes),
            "strong_keys": list(self.strong_keys),
            "warnings": list(self.warnings),
        }


@dataclass(frozen=True, slots=True)
class EntitySegmentationResult:
    source_url: str | None
    text_sha256: str | None
    status: SegmentationStatus
    entities: tuple[EntitySegment, ...] = field(default_factory=tuple)
    unresolved_candidates: tuple[FieldCandidate, ...] = field(default_factory=tuple)
    input_candidate_count: int = 0
    assigned_candidate_count: int = 0
    warnings: tuple[str, ...] = field(default_factory=tuple)

    def to_dict(self) -> dict[str, Any]:
        return {
            "source_url": self.source_url,
            "text_sha256": self.text_sha256,
            "status": self.status.value,
            "entities": [entity.to_dict() for entity in self.entities],
            "unresolved_candidates": [
                candidate.to_dict() for candidate in self.unresolved_candidates
            ],
            "input_candidate_count": self.input_candidate_count,
            "assigned_candidate_count": self.assigned_candidate_count,
            "warnings": list(self.warnings),
        }
