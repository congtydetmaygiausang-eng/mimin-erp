"""JT5 cross-source strong-key resolution tests."""

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
from company_reader.entity_resolver import CompanyEntityResolver  # noqa: E402
from company_reader.resolution_models import ResolutionDecision  # noqa: E402
from company_reader.segmentation_models import (  # noqa: E402
    EntitySegmentationResult,
    EntitySegment,
    EntitySegmentStatus,
    SegmentationStatus,
)


def candidate(field: CandidateField, value: str) -> FieldCandidate:
    return FieldCandidate(
        field=field,
        value=value,
        normalized_value=value.lower(),
        confidence=0.9,
        origin=EvidenceOrigin.MAIN_TEXT,
        source_url=None,
        text_sha256="a" * 64,
        excerpt=value,
        start=0,
        end=len(value),
    )


def segmentation(
    entity_id: str,
    *,
    source_url: str,
    tax: str | None = None,
    name: str = "cong ty mimin",
    phone: str | None = None,
    address: str | None = None,
    website: str | None = None,
    unresolved: tuple[FieldCandidate, ...] = (),
) -> EntitySegmentationResult:
    items = [candidate(CandidateField.LEGAL_NAME, name)]
    if tax:
        items.append(candidate(CandidateField.TAX_CODE, tax))
    if phone:
        items.append(candidate(CandidateField.PHONE, phone))
    if address:
        items.append(candidate(CandidateField.ADDRESS, address))
    if website:
        items.append(candidate(CandidateField.WEBSITE, website))
    segment = EntitySegment(
        entity_id=entity_id,
        start=0,
        end=100,
        status=(EntitySegmentStatus.STRONG_IDENTITY if tax else EntitySegmentStatus.WEAK_IDENTITY),
        candidates=tuple(items),
        legal_names=(name,),
        tax_codes=((tax,) if tax else ()),
        strong_keys=((f"TAX_CODE:{tax}",) if tax else ()),
    )
    return EntitySegmentationResult(
        source_url=source_url,
        text_sha256="a" * 64,
        status=SegmentationStatus.SINGLE_ENTITY,
        entities=(segment,),
        unresolved_candidates=unresolved,
        input_candidate_count=len(items) + len(unresolved),
        assigned_candidate_count=len(items),
    )


class CompanyEntityResolverTests(unittest.TestCase):
    def setUp(self) -> None:
        self.resolver = CompanyEntityResolver()

    def test_exact_tax_code_auto_merges_across_sources(self) -> None:
        result = self.resolver.resolve((
            segmentation("ENT-a", source_url="https://source-a.vn/a", tax="0316936282"),
            segmentation("ENT-b", source_url="https://source-b.vn/b", tax="0316936282"),
        ))
        self.assertEqual(len(result.groups), 1)
        self.assertEqual(result.groups[0].decision, ResolutionDecision.AUTO_MERGED)
        self.assertIn("TAX_CODE:0316936282", result.groups[0].strong_keys)

    def test_distinct_tax_codes_block_even_same_official_domain(self) -> None:
        result = self.resolver.resolve((
            segmentation("ENT-a", source_url="https://mimin.vn/a", tax="0311111111", website="https://mimin.vn"),
            segmentation("ENT-b", source_url="https://mimin.vn/b", tax="0312222222", website="https://mimin.vn"),
        ))
        self.assertEqual(len(result.groups), 2)
        self.assertEqual(result.pair_resolutions[0].decision, ResolutionDecision.CONFLICT_BLOCKED)

    def test_exact_official_domain_merges_without_tax_conflict(self) -> None:
        result = self.resolver.resolve((
            segmentation("ENT-a", source_url="https://mimin.vn/a", website="https://www.mimin.vn/gioi-thieu"),
            segmentation("ENT-b", source_url="https://www.mimin.vn/b", website="mimin.vn/lien-he"),
        ))
        self.assertEqual(len(result.groups), 1)
        self.assertIn("OFFICIAL_DOMAIN:mimin.vn", result.groups[0].strong_keys)

    def test_directory_domain_is_never_an_official_identity_key(self) -> None:
        result = self.resolver.resolve((
            segmentation("ENT-a", source_url="https://masothue.com/a", website="https://masothue.com/a"),
            segmentation("ENT-b", source_url="https://masothue.com/b", website="https://masothue.com/b"),
        ))
        self.assertEqual(len(result.groups), 2)
        self.assertEqual(result.pair_resolutions[0].decision, ResolutionDecision.STANDALONE)

    def test_phone_and_name_require_review_and_do_not_auto_merge(self) -> None:
        result = self.resolver.resolve((
            segmentation("ENT-a", source_url="https://a.vn", phone="0903491255"),
            segmentation("ENT-b", source_url="https://b.vn", phone="0903491255"),
        ))
        self.assertEqual(len(result.groups), 2)
        self.assertEqual(result.pair_resolutions[0].decision, ResolutionDecision.REVIEW_REQUIRED)

    def test_transitive_merge_cannot_bridge_conflicting_tax_codes(self) -> None:
        result = self.resolver.resolve((
            segmentation("ENT-a", source_url="https://mimin.vn/a", tax="0311111111", website="https://mimin.vn"),
            segmentation("ENT-b", source_url="https://mimin.vn/b", website="https://mimin.vn"),
            segmentation("ENT-c", source_url="https://mimin.vn/c", tax="0312222222", website="https://mimin.vn"),
        ))
        self.assertEqual(sorted(len(group.members) for group in result.groups), [1, 2])
        blocked = [pair for pair in result.pair_resolutions if pair.decision is ResolutionDecision.CONFLICT_BLOCKED]
        self.assertEqual(len(blocked), 2)

    def test_entities_and_unresolved_candidates_are_conserved(self) -> None:
        orphan = candidate(CandidateField.EMAIL, "unknown@example.com")
        result = self.resolver.resolve((
            segmentation("ENT-a", source_url="https://a.vn", unresolved=(orphan,)),
            segmentation("ENT-b", source_url="https://b.vn"),
        ))
        self.assertEqual(result.input_entity_count, result.output_member_count)
        self.assertEqual(result.unresolved_candidates, (orphan,))

    def test_group_ids_are_deterministic(self) -> None:
        inputs = (
            segmentation("ENT-a", source_url="https://a.vn", tax="0316936282"),
            segmentation("ENT-b", source_url="https://b.vn", tax="0316936282"),
        )
        first = self.resolver.resolve(inputs)
        second = self.resolver.resolve(inputs)
        self.assertEqual(first.groups[0].group_id, second.groups[0].group_id)


if __name__ == "__main__":
    unittest.main()
