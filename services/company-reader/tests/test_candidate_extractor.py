"""JT3 deterministic candidate/evidence tests."""

from __future__ import annotations

import hashlib
import sys
import unittest
from pathlib import Path


SERVICE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SERVICE_ROOT))

from company_reader.candidate_extractor import CompanyCandidateExtractor  # noqa: E402
from company_reader.candidate_models import CandidateBundleStatus, CandidateField  # noqa: E402
from company_reader.extraction_models import ExtractedDocument, ExtractionStatus  # noqa: E402
from company_reader.extractor import TrafilaturaExtractor  # noqa: E402
from company_reader.models import FetchEvidence, FetchStatus  # noqa: E402


def document(
    text: str | None,
    *,
    title: str | None = None,
    description: str | None = None,
    status: ExtractionStatus = ExtractionStatus.OK,
) -> ExtractedDocument:
    digest = hashlib.sha256((text or "").encode()).hexdigest() if text is not None else None
    return ExtractedDocument(
        source_url="https://example.com/company",
        fetch_sha256="a" * 64,
        status=status,
        extractor="trafilatura",
        extractor_version="2.2.0",
        title=title,
        description=description,
        main_text=text,
        text_sha256=digest,
        char_count=len(text or ""),
        word_count=len((text or "").split()),
    )


def values(bundle, field: CandidateField) -> list[str]:
    return [item.normalized_value for item in bundle.candidates if item.field == field]


class CompanyCandidateExtractorTests(unittest.TestCase):
    def setUp(self) -> None:
        self.extractor = CompanyCandidateExtractor()

    def test_extracts_single_company_fields_with_evidence(self) -> None:
        text = """Tên pháp lý: CÔNG TY TNHH DỆT MAY MIMIN
Mã số thuế: 0316936282
Địa chỉ: 281 Phú Thọ Hoà, Phường Phú Thọ Hoà, Quận Tân Phú, Thành phố Hồ Chí Minh, Việt Nam
Điện thoại: 0903 491 255
Email: lienhe@mimin.vn
Website: https://mimin.vn/gioi-thieu
Giới thiệu: Công ty chuyên sản xuất và cung cấp vải cotton cho ngành may mặc Việt Nam với quy trình kiểm soát chất lượng."""
        result = self.extractor.extract(document(text, title="CÔNG TY TNHH DỆT MAY MIMIN"))

        self.assertEqual(result.status, CandidateBundleStatus.OK)
        self.assertFalse(result.multi_entity)
        self.assertIn("0316936282", values(result, CandidateField.TAX_CODE))
        self.assertIn("0903491255", values(result, CandidateField.PHONE))
        self.assertIn("lienhe@mimin.vn", values(result, CandidateField.EMAIL))
        self.assertEqual(len(values(result, CandidateField.ADDRESS)), 1)
        for candidate in result.candidates:
            self.assertTrue(candidate.excerpt)
            self.assertEqual(candidate.source_url, "https://example.com/company")
            self.assertEqual(len(candidate.text_sha256 or ""), 64)

    def test_tax_code_is_never_reused_as_phone(self) -> None:
        text = """CÔNG TY TNHH VẢI BÌNH MINH
Mã số thuế: 0318999043
Điện thoại: 0318999043
Hotline: 0938 486 606"""
        result = self.extractor.extract(document(text))
        self.assertEqual(values(result, CandidateField.PHONE), ["0938486606"])

    def test_phone_requires_contact_label_and_deduplicates_formatting(self) -> None:
        text = """CÔNG TY TNHH VẢI MIMIN
Trong bài có số 0901234567 nhưng không phải liên hệ.
Hotline: 0901 234 567 / +84 901 234 567"""
        result = self.extractor.extract(document(text))
        self.assertEqual(values(result, CandidateField.PHONE), ["0901234567"])

    def test_rejects_article_title_and_prose_address(self) -> None:
        text = """Danh sách Top 10 công ty vải cotton tại TP.HCM
Địa chỉ: Trên đây là quy trình dệt nhuộm vải tại quận Bình Tân TP.HCM
Email: editorial@example.com"""
        result = self.extractor.extract(document(text, title="Top 10 công ty vải cotton"))
        self.assertEqual(result.status, CandidateBundleStatus.NO_IDENTITY)
        self.assertEqual(values(result, CandidateField.LEGAL_NAME), [])
        self.assertEqual(values(result, CandidateField.ADDRESS), [])

    def test_marks_multiple_tax_codes_for_manual_segmentation(self) -> None:
        text = """CÔNG TY TNHH VẢI A
Mã số thuế: 0311111111
Địa chỉ: 10 Đường A, Phường 1, Quận 5, Thành phố Hồ Chí Minh
CÔNG TY TNHH VẢI B
Mã số thuế: 0312222222
Địa chỉ: 20 Đường B, Phường 2, Quận 6, Thành phố Hồ Chí Minh"""
        result = self.extractor.extract(document(text, title="Danh sách công ty vải"))
        self.assertEqual(result.status, CandidateBundleStatus.MULTI_ENTITY_REVIEW)
        self.assertTrue(result.multi_entity)
        self.assertEqual(result.distinct_tax_codes, 2)
        self.assertIn("DO_NOT_MERGE_FIELDS_AUTOMATICALLY", result.warnings)

    def test_two_distinct_company_names_are_never_auto_merged(self) -> None:
        text = """CÔNG TY TNHH VẢI A
Mã số thuế: 0311111111
Đối tác liên quan: CÔNG TY TNHH VẢI B"""
        result = self.extractor.extract(document(text))
        self.assertEqual(result.status, CandidateBundleStatus.MULTI_ENTITY_REVIEW)
        self.assertEqual(result.distinct_legal_names, 2)

    def test_metadata_candidates_are_explicitly_unverified(self) -> None:
        result = self.extractor.extract(document(
            "CÔNG TY TNHH MIMIN cung cấp vải cotton chất lượng cao cho ngành may mặc.",
            title="CÔNG TY TNHH MIMIN",
            description="Công ty sản xuất vải cotton, cung cấp theo yêu cầu cho khách hàng doanh nghiệp.",
        ))
        metadata = [item for item in result.candidates if item.start is None]
        self.assertTrue(metadata)
        self.assertTrue(all("UNVERIFIED_METADATA" in item.warnings for item in metadata))

    def test_skips_non_ok_jt2_document(self) -> None:
        result = self.extractor.extract(document(
            None,
            status=ExtractionStatus.EXTRACTION_ERROR,
        ))
        self.assertEqual(result.status, CandidateBundleStatus.SKIPPED_EXTRACTION_ERROR)
        self.assertEqual(result.candidates, ())

    def test_missing_fields_are_not_invented(self) -> None:
        result = self.extractor.extract(document(
            "CÔNG TY TNHH MIMIN chuyên sản xuất vải cotton chất lượng cao tại Việt Nam."
        ))
        self.assertEqual(values(result, CandidateField.TAX_CODE), [])
        self.assertEqual(values(result, CandidateField.PHONE), [])
        self.assertEqual(values(result, CandidateField.ADDRESS), [])

    def test_caps_each_field_and_serializes_stable_contract(self) -> None:
        phones = "\n".join(f"Hotline: 09012345{i:02d}" for i in range(20))
        result = CompanyCandidateExtractor(max_per_field=3).extract(
            document(f"CÔNG TY TNHH MIMIN\n{phones}")
        )
        self.assertLessEqual(len(values(result, CandidateField.PHONE)), 3)
        payload = result.to_dict()
        self.assertEqual(payload["status"], "OK")
        self.assertIsInstance(payload["candidates"], list)

    def test_jt2_markdown_table_flows_into_jt3_candidates(self) -> None:
        html = """<html><head><title>CÔNG TY TNHH DỆT MIMIN</title></head><body><main>
        <h1>CÔNG TY TNHH DỆT MIMIN</h1><table>
        <tr><th>Mã số thuế</th><td>0316936282</td></tr>
        <tr><th>Địa chỉ</th><td>281 Phú Thọ Hoà, Phường Phú Thọ Hoà, Quận Tân Phú, Thành phố Hồ Chí Minh</td></tr>
        <tr><th>Điện thoại</th><td>0903491255</td></tr></table>
        <p>Giới thiệu: Công ty chuyên sản xuất vải cotton chất lượng cao cho ngành may mặc Việt Nam.</p>
        </main></body></html>"""
        fetch = FetchEvidence(
            requested_url="https://example.com/company",
            final_url="https://example.com/company",
            status=FetchStatus.OK,
            http_status=200,
            content_type="text/html",
            body_text=html,
            body_sha256=hashlib.sha256(html.encode()).hexdigest(),
        )
        extracted = TrafilaturaExtractor(min_content_chars=10).extract(fetch)
        result = self.extractor.extract(extracted)
        self.assertEqual(result.status, CandidateBundleStatus.OK)
        self.assertEqual(values(result, CandidateField.TAX_CODE), ["0316936282"])
        self.assertEqual(values(result, CandidateField.PHONE), ["0903491255"])
        self.assertEqual(len(values(result, CandidateField.ADDRESS)), 1)


if __name__ == "__main__":
    unittest.main()
