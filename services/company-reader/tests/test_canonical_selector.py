"""JT7 evidence-first canonical selection tests."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path


SERVICE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SERVICE_ROOT))

from company_reader.candidate_models import (  # noqa: E402
    CandidateField,
    EvidenceOrigin,
    FieldCandidate,
)
from company_reader.canonical_models import (  # noqa: E402
    CanonicalFieldStatus,
    CanonicalProfileStatus,
)
from company_reader.canonical_selector import CanonicalFieldSelector  # noqa: E402
from company_reader.resolution_models import (  # noqa: E402
    EntityReference,
    ResolutionDecision,
    ResolvedCompanyGroup,
)


def evidence(
    field: CandidateField,
    value: str,
    normalized: str,
    source: str,
    confidence: float = 0.9,
    *,
    origin: EvidenceOrigin = EvidenceOrigin.MAIN_TEXT,
    warnings: tuple[str, ...] = (),
) -> FieldCandidate:
    return FieldCandidate(
        field=field,
        value=value,
        normalized_value=normalized,
        confidence=confidence,
        origin=origin,
        source_url=source,
        text_sha256="a" * 64,
        excerpt=value,
        start=(0 if origin is EvidenceOrigin.MAIN_TEXT else None),
        end=(len(value) if origin is EvidenceOrigin.MAIN_TEXT else None),
        warnings=warnings,
    )


def member(entity_id: str, source: str, *items: FieldCandidate) -> EntityReference:
    return EntityReference(
        entity_id=entity_id,
        source_url=source,
        text_sha256="a" * 64,
        legal_names=tuple(item.normalized_value for item in items if item.field is CandidateField.LEGAL_NAME),
        tax_codes=tuple(item.normalized_value for item in items if item.field is CandidateField.TAX_CODE),
        addresses=tuple(item.normalized_value for item in items if item.field is CandidateField.ADDRESS),
        candidates=items,
    )


def group(*members: EntityReference, strong_keys: tuple[str, ...] = ("TAX_CODE:0316936282",)) -> ResolvedCompanyGroup:
    return ResolvedCompanyGroup(
        group_id="GRP-test",
        decision=(ResolutionDecision.AUTO_MERGED if len(members) > 1 else ResolutionDecision.STANDALONE),
        members=members,
        strong_keys=strong_keys,
    )


class CanonicalFieldSelectorTests(unittest.TestCase):
    def setUp(self) -> None:
        self.selector = CanonicalFieldSelector()

    def base(self, source: str) -> tuple[FieldCandidate, ...]:
        return (
            evidence(CandidateField.LEGAL_NAME, "CÔNG TY TNHH MIMIN", "cong ty tnhh mimin", source),
            evidence(CandidateField.TAX_CODE, "0316936282", "0316936282", source, 0.95),
            evidence(CandidateField.ADDRESS, "281 Phú Thọ Hoà, Tân Phú, TP.HCM", "281 phu tho hoa tan phu tphcm", source, 0.91),
        )

    def test_exact_value_from_two_domains_is_consensus(self) -> None:
        left, right = self.base("https://a.vn/company"), self.base("https://b.vn/profile")
        profile = self.selector.select(group(member("ENT-a", "https://a.vn/company", *left), member("ENT-b", "https://b.vn/profile", *right)))
        legal = profile.field(CandidateField.LEGAL_NAME)
        self.assertEqual(legal.status, CanonicalFieldStatus.CONSENSUS)
        self.assertEqual(legal.independent_source_count, 2)
        self.assertEqual(profile.status, CanonicalProfileStatus.READY_FOR_REVIEW)

    def test_two_pages_on_same_domain_count_as_one_source(self) -> None:
        left, right = self.base("https://mimin.vn/a"), self.base("https://mimin.vn/b")
        profile = self.selector.select(group(member("ENT-a", "https://mimin.vn/a", *left), member("ENT-b", "https://mimin.vn/b", *right)))
        self.assertEqual(profile.field(CandidateField.LEGAL_NAME).independent_source_count, 1)
        self.assertEqual(profile.field(CandidateField.LEGAL_NAME).status, CanonicalFieldStatus.SINGLE_SOURCE)

    def test_conflicting_tax_codes_block_profile_without_selecting_winner(self) -> None:
        source = "https://a.vn/company"
        items = (*self.base(source), evidence(CandidateField.TAX_CODE, "0319999999", "0319999999", source, 0.96))
        profile = self.selector.select(group(member("ENT-a", source, *items)))
        tax = profile.field(CandidateField.TAX_CODE)
        self.assertEqual(tax.status, CanonicalFieldStatus.CONFLICT)
        self.assertIsNone(tax.selected_value)
        self.assertEqual(profile.status, CanonicalProfileStatus.BLOCKED)

    def test_multiple_phones_keep_primary_and_alternatives_for_review(self) -> None:
        source = "https://a.vn/company"
        items = (
            *self.base(source),
            evidence(CandidateField.PHONE, "0903 491 255", "0903491255", source, 0.94),
            evidence(CandidateField.PHONE, "028 1234 5678", "02812345678", source, 0.90),
        )
        phone = self.selector.select(group(member("ENT-a", source, *items))).field(CandidateField.PHONE)
        self.assertEqual(phone.status, CanonicalFieldStatus.REVIEW_REQUIRED)
        self.assertEqual(phone.selected_value, "0903 491 255")
        self.assertEqual(phone.alternatives, ("028 1234 5678",))

    def test_unverified_metadata_below_threshold_is_not_selected(self) -> None:
        source = "https://a.vn/company"
        metadata = evidence(
            CandidateField.INTRODUCTION,
            "Nội dung quảng cáo chưa kiểm chứng",
            "Nội dung quảng cáo chưa kiểm chứng",
            source,
            0.62,
            origin=EvidenceOrigin.METADATA_DESCRIPTION,
            warnings=("UNVERIFIED_METADATA",),
        )
        decision = self.selector.select(group(member("ENT-a", source, *self.base(source), metadata))).field(CandidateField.INTRODUCTION)
        self.assertEqual(decision.status, CanonicalFieldStatus.REVIEW_REQUIRED)
        self.assertIsNone(decision.selected_value)

    def test_introduction_is_never_auto_verified(self) -> None:
        source = "https://a.vn/company"
        intro = evidence(CandidateField.INTRODUCTION, "Công ty chuyên sản xuất vải cotton.", "Công ty chuyên sản xuất vải cotton.", source, 0.90)
        decision = self.selector.select(group(member("ENT-a", source, *self.base(source), intro))).field(CandidateField.INTRODUCTION)
        self.assertEqual(decision.status, CanonicalFieldStatus.REVIEW_REQUIRED)
        self.assertEqual(decision.selected_value, intro.value)

    def test_missing_strong_identity_needs_review(self) -> None:
        source = "https://a.vn/company"
        name = evidence(CandidateField.LEGAL_NAME, "CÔNG TY TNHH MIMIN", "cong ty tnhh mimin", source)
        profile = self.selector.select(group(member("ENT-a", source, name), strong_keys=()))
        self.assertEqual(profile.status, CanonicalProfileStatus.NEEDS_REVIEW)
        self.assertIn("MISSING_STRONG_IDENTITY", profile.warnings)

    def test_evidence_and_provenance_are_preserved_in_output(self) -> None:
        source = "https://a.vn/company"
        items = self.base(source)
        item = items[0]
        profile = self.selector.select(group(member("ENT-a", source, *items)))
        selected = profile.field(CandidateField.LEGAL_NAME)
        self.assertIs(selected.evidence[0], item)
        self.assertEqual(selected.to_dict()["evidence"][0]["source_url"], source)


if __name__ == "__main__":
    unittest.main()
