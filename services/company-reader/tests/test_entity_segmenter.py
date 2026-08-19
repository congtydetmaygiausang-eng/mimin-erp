"""JT4 deterministic entity segmentation tests."""

from __future__ import annotations

import hashlib
import sys
import unittest
from dataclasses import replace
from pathlib import Path


SERVICE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SERVICE_ROOT))

from company_reader.candidate_extractor import CompanyCandidateExtractor  # noqa: E402
from company_reader.candidate_models import (  # noqa: E402
    CandidateField,
    EvidenceOrigin,
    FieldCandidate,
)
from company_reader.entity_segmenter import CompanyEntitySegmenter  # noqa: E402
from company_reader.extraction_models import ExtractedDocument, ExtractionStatus  # noqa: E402
from company_reader.segmentation_models import (  # noqa: E402
    EntitySegmentStatus,
    SegmentationStatus,
)


def document(text: str, *, title: str | None = None) -> ExtractedDocument:
    return ExtractedDocument(
        source_url="https://example.com/danh-ba",
        fetch_sha256="a" * 64,
        status=ExtractionStatus.OK,
        extractor="trafilatura",
        extractor_version="2.2.0",
        title=title,
        main_text=text,
        text_sha256=hashlib.sha256(text.encode()).hexdigest(),
        char_count=len(text),
        word_count=len(text.split()),
    )


class CompanyEntitySegmenterTests(unittest.TestCase):
    def setUp(self) -> None:
        self.candidates = CompanyCandidateExtractor()
        self.segmenter = CompanyEntitySegmenter()

    def segment(self, text: str, *, title: str | None = None):
        source = document(text, title=title)
        return self.segmenter.segment(source, self.candidates.extract(source))

    def test_single_company_groups_identity_and_contacts(self) -> None:
        result = self.segment("""CÔNG TY TNHH DỆT MAY MIMIN
Mã số thuế: 0316936282
Địa chỉ: 281 Phú Thọ Hoà, Phường Phú Thọ Hoà, Quận Tân Phú, Thành phố Hồ Chí Minh
Điện thoại: 0903 491 255
Email: lienhe@mimin.vn""")
        self.assertEqual(result.status, SegmentationStatus.SINGLE_ENTITY)
        self.assertEqual(result.entities[0].status, EntitySegmentStatus.STRONG_IDENTITY)
        self.assertEqual(result.entities[0].strong_keys, ("TAX_CODE:0316936282",))
        self.assertFalse(result.unresolved_candidates)

    def test_two_company_sections_do_not_cross_assign_contacts(self) -> None:
        result = self.segment("""CÔNG TY TNHH VẢI A
Mã số thuế: 0311111111
Điện thoại: 0901 111 111
Địa chỉ: 10 Đường A, Phường 1, Quận 5, Thành phố Hồ Chí Minh
CÔNG TY TNHH VẢI B
Mã số thuế: 0312222222
Điện thoại: 0902 222 222
Địa chỉ: 20 Đường B, Phường 2, Quận 6, Thành phố Hồ Chí Minh""")
        self.assertEqual(result.status, SegmentationStatus.MULTI_ENTITY)
        self.assertEqual(len(result.entities), 2)
        phones = [
            {item.normalized_value for item in entity.candidates if item.field is CandidateField.PHONE}
            for entity in result.entities
        ]
        self.assertEqual(phones, [{"0901111111"}, {"0902222222"}])

    def test_distinct_nearby_legal_names_always_split(self) -> None:
        result = self.segment("CÔNG TY TNHH VẢI A\nĐối tác: CÔNG TY TNHH VẢI B")
        self.assertEqual(result.status, SegmentationStatus.MULTI_ENTITY)
        self.assertEqual(len(result.entities), 2)

    def test_unpositioned_matching_title_is_assigned_only_by_exact_identity(self) -> None:
        source = document(
            "CÔNG TY TNHH VẢI A\nMã số thuế: 0311111111\nCÔNG TY TNHH VẢI B\nMã số thuế: 0312222222"
        )
        bundle = self.candidates.extract(source)
        metadata = FieldCandidate(
            field=CandidateField.LEGAL_NAME,
            value="CÔNG TY TNHH VẢI A",
            normalized_value="cong ty tnhh vai a",
            confidence=0.5,
            origin=EvidenceOrigin.METADATA_TITLE,
            source_url=source.source_url,
            text_sha256=source.text_sha256,
            excerpt="CÔNG TY TNHH VẢI A",
            start=None,
            end=None,
            warnings=("UNVERIFIED_METADATA",),
        )
        result = self.segmenter.segment(
            source,
            replace(bundle, candidates=(*bundle.candidates, metadata)),
        )
        metadata_names = [
            item
            for item in result.entities[0].candidates
            if item.field is CandidateField.LEGAL_NAME and item.start is None
        ]
        self.assertEqual(len(metadata_names), 1)

    def test_provenance_mismatch_fails_closed(self) -> None:
        source = document("CÔNG TY TNHH MIMIN\nMã số thuế: 0316936282")
        bundle = self.candidates.extract(source)
        changed = document("CÔNG TY TNHH KHÁC\nMã số thuế: 0319999999")
        result = self.segmenter.segment(changed, bundle)
        self.assertEqual(result.status, SegmentationStatus.INPUT_MISMATCH)
        self.assertEqual(len(result.unresolved_candidates), len(bundle.candidates))

    def test_candidate_conservation_and_deterministic_ids(self) -> None:
        source = document("""CÔNG TY TNHH VẢI A
Mã số thuế: 0311111111
Điện thoại: 0901 111 111
CÔNG TY TNHH VẢI B
Mã số thuế: 0312222222
Email: b@example.com""")
        bundle = self.candidates.extract(source)
        first = self.segmenter.segment(source, bundle)
        second = self.segmenter.segment(source, bundle)
        self.assertEqual(
            first.input_candidate_count,
            first.assigned_candidate_count + len(first.unresolved_candidates),
        )
        self.assertEqual(
            [entity.entity_id for entity in first.entities],
            [entity.entity_id for entity in second.entities],
        )

    def test_no_identity_anchor_produces_no_segments(self) -> None:
        result = self.segment("Điện thoại: 0903 491 255\nEmail: lienhe@example.com")
        self.assertEqual(result.status, SegmentationStatus.NO_SEGMENTS)
        self.assertFalse(result.entities)


if __name__ == "__main__":
    unittest.main()
