"""JT7 evidence-first canonical field selection; never auto-publishes."""

from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import urlsplit

from .candidate_models import CandidateField, EvidenceOrigin, FieldCandidate
from .canonical_models import (
    CanonicalCompanyProfile,
    CanonicalFieldDecision,
    CanonicalFieldStatus,
    CanonicalProfileStatus,
)
from .resolution_models import ResolvedCompanyGroup


IDENTITY_FIELDS = frozenset({
    CandidateField.LEGAL_NAME,
    CandidateField.TAX_CODE,
    CandidateField.ADDRESS,
})
MULTI_VALUE_FIELDS = frozenset({
    CandidateField.PHONE,
    CandidateField.EMAIL,
    CandidateField.WEBSITE,
})
FIELD_ORDER = tuple(CandidateField)
MINIMUM_CONFIDENCE = {
    CandidateField.LEGAL_NAME: 0.75,
    CandidateField.TAX_CODE: 0.90,
    CandidateField.ADDRESS: 0.75,
    CandidateField.PHONE: 0.80,
    CandidateField.EMAIL: 0.75,
    CandidateField.WEBSITE: 0.75,
    CandidateField.INTRODUCTION: 0.75,
}


@dataclass(frozen=True, slots=True)
class _RankedValue:
    normalized: str
    evidence: tuple[FieldCandidate, ...]
    source_count: int
    score: float


class CanonicalFieldSelector:
    """Select display candidates while retaining every competing value."""

    def select(self, group: ResolvedCompanyGroup) -> CanonicalCompanyProfile:
        candidates = tuple(candidate for member in group.members for candidate in member.candidates)
        official_domains = {
            domain for member in group.members for domain in member.official_domains
        }
        decisions = tuple(
            self._select_field(field, candidates, official_domains)
            for field in FIELD_ORDER
        )
        tax = self._decision(decisions, CandidateField.TAX_CODE)
        legal_name = self._decision(decisions, CandidateField.LEGAL_NAME)
        address = self._decision(decisions, CandidateField.ADDRESS)
        critical_conflict = tax.status is CanonicalFieldStatus.CONFLICT
        needs_review = any(
            item.status in (CanonicalFieldStatus.CONFLICT, CanonicalFieldStatus.REVIEW_REQUIRED)
            for item in decisions
        )
        has_identity = bool(
            legal_name.selected_value
            and (tax.selected_value or any(key.startswith("OFFICIAL_DOMAIN:") for key in group.strong_keys))
        )
        if critical_conflict:
            status = CanonicalProfileStatus.BLOCKED
        elif not has_identity or needs_review or address.status is CanonicalFieldStatus.MISSING:
            status = CanonicalProfileStatus.NEEDS_REVIEW
        else:
            status = CanonicalProfileStatus.READY_FOR_REVIEW
        warnings = []
        if not has_identity:
            warnings.append("MISSING_STRONG_IDENTITY")
        if needs_review:
            warnings.append("FIELD_REVIEW_REQUIRED")
        return CanonicalCompanyProfile(
            group_id=group.group_id,
            status=status,
            fields=decisions,
            source_count=len({self._source_key(member.source_url) for member in group.members}),
            strong_keys=group.strong_keys,
            warnings=tuple(warnings),
        )

    def _select_field(
        self,
        field: CandidateField,
        candidates: tuple[FieldCandidate, ...],
        official_domains: set[str],
    ) -> CanonicalFieldDecision:
        relevant = tuple(item for item in candidates if item.field is field)
        if not relevant:
            return CanonicalFieldDecision(field, CanonicalFieldStatus.MISSING, None, None, 0.0, 0, reasons=("NO_EVIDENCE",))
        ranked = self._rank(relevant, official_domains)
        qualified = tuple(item for item in ranked if item.score >= MINIMUM_CONFIDENCE[field])
        if not qualified:
            return CanonicalFieldDecision(
                field, CanonicalFieldStatus.REVIEW_REQUIRED, None, None,
                ranked[0].score, ranked[0].source_count, ranked[0].evidence,
                tuple(item.evidence[0].value for item in ranked),
                ("ALL_VALUES_BELOW_CONFIDENCE_THRESHOLD",),
            )
        if field in IDENTITY_FIELDS and len(qualified) > 1:
            all_evidence = tuple(item for value in qualified for item in value.evidence)
            return CanonicalFieldDecision(
                field, CanonicalFieldStatus.CONFLICT, None, None,
                qualified[0].score, qualified[0].source_count, all_evidence,
                tuple(item.evidence[0].value for item in qualified),
                ("MULTIPLE_QUALIFIED_IDENTITY_VALUES",),
            )
        best = qualified[0]
        alternatives = tuple(item.evidence[0].value for item in ranked[1:])
        if field is CandidateField.INTRODUCTION:
            status = CanonicalFieldStatus.REVIEW_REQUIRED
            reasons = ("INTRODUCTION_REQUIRES_HUMAN_REVIEW",)
        elif field in MULTI_VALUE_FIELDS and alternatives:
            status = CanonicalFieldStatus.REVIEW_REQUIRED
            reasons = ("PRIMARY_SELECTED_ALTERNATIVES_RETAINED",)
        elif best.source_count >= 2:
            status = CanonicalFieldStatus.CONSENSUS
            reasons = ("INDEPENDENT_SOURCE_CONSENSUS",)
        else:
            status = CanonicalFieldStatus.SINGLE_SOURCE
            reasons = ("SINGLE_INDEPENDENT_SOURCE",)
        return CanonicalFieldDecision(
            field=field,
            status=status,
            selected_value=best.evidence[0].value,
            normalized_value=best.normalized,
            confidence=best.score,
            independent_source_count=best.source_count,
            evidence=best.evidence,
            alternatives=alternatives,
            reasons=reasons,
        )

    def _rank(
        self,
        candidates: tuple[FieldCandidate, ...],
        official_domains: set[str],
    ) -> tuple[_RankedValue, ...]:
        grouped: dict[str, list[FieldCandidate]] = {}
        for candidate in candidates:
            grouped.setdefault(candidate.normalized_value, []).append(candidate)
        ranked = []
        for normalized, evidence in grouped.items():
            ordered = tuple(sorted(evidence, key=self._evidence_sort_key, reverse=True))
            sources = {self._source_key(item.source_url) for item in ordered}
            best = max(item.confidence for item in ordered)
            source_bonus = min(0.12, max(0, len(sources) - 1) * 0.04)
            main_bonus = 0.03 if any(item.origin is EvidenceOrigin.MAIN_TEXT for item in ordered) else 0.0
            official_bonus = 0.05 if any(self._host(item.source_url) in official_domains for item in ordered) else 0.0
            warning_penalty = 0.15 if all(item.warnings for item in ordered) else 0.0
            ranked.append(_RankedValue(normalized, ordered, len(sources), round(max(0.0, min(1.0, best + source_bonus + main_bonus + official_bonus - warning_penalty)), 4)))
        return tuple(sorted(ranked, key=lambda item: (-item.score, -item.source_count, item.normalized)))

    @staticmethod
    def _evidence_sort_key(candidate: FieldCandidate) -> tuple[float, int, int, str]:
        return (
            candidate.confidence,
            1 if candidate.origin is EvidenceOrigin.MAIN_TEXT else 0,
            -len(candidate.warnings),
            candidate.value,
        )

    @staticmethod
    def _decision(
        decisions: tuple[CanonicalFieldDecision, ...],
        field: CandidateField,
    ) -> CanonicalFieldDecision:
        return next(item for item in decisions if item.field is field)

    @classmethod
    def _source_key(cls, value: str | None) -> str:
        return cls._host(value) or "UNKNOWN_SOURCE"

    @staticmethod
    def _host(value: str | None) -> str | None:
        if not value:
            return None
        candidate = value if "://" in value else f"https://{value}"
        try:
            return (urlsplit(candidate).hostname or "").lower().removeprefix("www.") or None
        except ValueError:
            return None
