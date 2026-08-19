"""Typed JT5 cross-source company resolution contracts."""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import StrEnum
from typing import Any

from .candidate_models import FieldCandidate


class ResolutionDecision(StrEnum):
    AUTO_MERGED = "AUTO_MERGED"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    CONFLICT_BLOCKED = "CONFLICT_BLOCKED"
    STANDALONE = "STANDALONE"


class MatchKeyType(StrEnum):
    TAX_CODE = "TAX_CODE"
    OFFICIAL_DOMAIN = "OFFICIAL_DOMAIN"
    PHONE = "PHONE"
    LEGAL_NAME = "LEGAL_NAME"
    ADDRESS = "ADDRESS"


@dataclass(frozen=True, slots=True)
class EntityReference:
    entity_id: str
    source_url: str | None
    text_sha256: str | None
    legal_names: tuple[str, ...] = field(default_factory=tuple)
    tax_codes: tuple[str, ...] = field(default_factory=tuple)
    official_domains: tuple[str, ...] = field(default_factory=tuple)
    phones: tuple[str, ...] = field(default_factory=tuple)
    addresses: tuple[str, ...] = field(default_factory=tuple)

    def to_dict(self) -> dict[str, Any]:
        return {
            "entity_id": self.entity_id,
            "source_url": self.source_url,
            "text_sha256": self.text_sha256,
            "legal_names": list(self.legal_names),
            "tax_codes": list(self.tax_codes),
            "official_domains": list(self.official_domains),
            "phones": list(self.phones),
            "addresses": list(self.addresses),
        }


@dataclass(frozen=True, slots=True)
class PairResolution:
    left_entity_id: str
    right_entity_id: str
    decision: ResolutionDecision
    matched_keys: tuple[str, ...] = field(default_factory=tuple)
    conflicts: tuple[str, ...] = field(default_factory=tuple)
    reasons: tuple[str, ...] = field(default_factory=tuple)

    def to_dict(self) -> dict[str, Any]:
        return {
            "left_entity_id": self.left_entity_id,
            "right_entity_id": self.right_entity_id,
            "decision": self.decision.value,
            "matched_keys": list(self.matched_keys),
            "conflicts": list(self.conflicts),
            "reasons": list(self.reasons),
        }


@dataclass(frozen=True, slots=True)
class ResolvedCompanyGroup:
    group_id: str
    decision: ResolutionDecision
    members: tuple[EntityReference, ...]
    strong_keys: tuple[str, ...] = field(default_factory=tuple)
    conflicts: tuple[str, ...] = field(default_factory=tuple)

    def to_dict(self) -> dict[str, Any]:
        return {
            "group_id": self.group_id,
            "decision": self.decision.value,
            "members": [member.to_dict() for member in self.members],
            "strong_keys": list(self.strong_keys),
            "conflicts": list(self.conflicts),
        }


@dataclass(frozen=True, slots=True)
class CompanyResolutionResult:
    groups: tuple[ResolvedCompanyGroup, ...]
    pair_resolutions: tuple[PairResolution, ...]
    unresolved_candidates: tuple[FieldCandidate, ...] = field(default_factory=tuple)
    input_entity_count: int = 0
    output_member_count: int = 0
    warnings: tuple[str, ...] = field(default_factory=tuple)

    def to_dict(self) -> dict[str, Any]:
        return {
            "groups": [group.to_dict() for group in self.groups],
            "pair_resolutions": [pair.to_dict() for pair in self.pair_resolutions],
            "unresolved_candidates": [item.to_dict() for item in self.unresolved_candidates],
            "input_entity_count": self.input_entity_count,
            "output_member_count": self.output_member_count,
            "warnings": list(self.warnings),
        }
