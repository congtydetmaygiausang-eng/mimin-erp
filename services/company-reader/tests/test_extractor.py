"""JT2 extraction tests; all HTML is local and no URL is fetched."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import sys
import unittest
from pathlib import Path


SERVICE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SERVICE_ROOT))

from company_reader.extraction_models import ExtractionStatus  # noqa: E402
from company_reader.extractor import TrafilaturaExtractor  # noqa: E402
from company_reader.models import FetchEvidence, FetchStatus  # noqa: E402


def fetch_evidence(
    body: str | None,
    *,
    status: FetchStatus = FetchStatus.OK,
    content_type: str = "text/html",
) -> FetchEvidence:
    body_hash = hashlib.sha256((body or "").encode()).hexdigest() if body is not None else None
    return FetchEvidence(
        requested_url="https://example.com/company",
        final_url="https://example.com/company",
        status=status,
        http_status=200 if status == FetchStatus.OK else None,
        content_type=content_type,
        body_text=body,
        body_sha256=body_hash,
        bytes_read=len((body or "").encode()),
    )


class TrafilaturaExtractorTests(unittest.TestCase):
    def test_maps_text_and_bounded_metadata(self) -> None:
        payload = {
            "text": "Giới thiệu\nCông ty chuyên sản xuất vải cotton chất lượng cao tại Việt Nam.",
            "title": "  Công ty   MIMIN  ",
            "author": "Phòng truyền thông",
            "excerpt": "Nhà sản xuất vải",
            "date": "2026-08-19",
            "hostname": "example.com",
            "language": "vi",
            "pagetype": "organization",
            "raw_text": "không đưa vào output",
        }
        extractor = TrafilaturaExtractor(
            loader=lambda: (lambda _html, **_options: json.dumps(payload), "2.2.0")
        )
        result = extractor.extract(fetch_evidence("<html>source</html>"))

        self.assertEqual(result.status, ExtractionStatus.OK)
        self.assertEqual(result.title, "Công ty MIMIN")
        self.assertEqual(result.extractor_version, "2.2.0")
        self.assertEqual(result.hostname, "example.com")
        self.assertIn("pagetype", result.metadata)
        self.assertNotIn("raw_text", result.metadata)
        self.assertEqual(result.char_count, len(result.main_text or ""))
        self.assertEqual(len(result.text_sha256 or ""), 64)

    def test_skips_failed_fetch_without_loading_dependency(self) -> None:
        calls = 0

        def loader():
            nonlocal calls
            calls += 1
            raise AssertionError("loader must not run")

        result = TrafilaturaExtractor(loader=loader).extract(
            fetch_evidence(None, status=FetchStatus.HTTP_ERROR)
        )
        self.assertEqual(result.status, ExtractionStatus.SKIPPED_FETCH_ERROR)
        self.assertEqual(calls, 0)

    def test_reports_missing_dependency(self) -> None:
        def missing_loader():
            raise ImportError("trafilatura not installed")

        result = TrafilaturaExtractor(loader=missing_loader).extract(
            fetch_evidence("<html><body>valid source body</body></html>")
        )
        self.assertEqual(result.status, ExtractionStatus.DEPENDENCY_MISSING)
        self.assertEqual(result.error_code, "TRAFILATURA_UNAVAILABLE")

    def test_reports_empty_and_malformed_results(self) -> None:
        cases = (
            (lambda _html, **_options: None, ExtractionStatus.EMPTY),
            (lambda _html, **_options: "not-json", ExtractionStatus.EXTRACTION_ERROR),
            (lambda _html, **_options: json.dumps({"text": "short"}), ExtractionStatus.EMPTY),
        )
        for function, expected_status in cases:
            with self.subTest(expected_status=expected_status):
                result = TrafilaturaExtractor(
                    loader=lambda function=function: (function, "2.2.0")
                ).extract(fetch_evidence("<html>source</html>"))
                self.assertEqual(result.status, expected_status)
                self.assertIsNone(result.main_text)

    def test_retries_with_recall_when_precision_returns_no_content(self) -> None:
        calls: list[dict[str, object]] = []

        def extract(_html: str, **options: object) -> str | None:
            calls.append(options)
            if options.get("favor_precision") is True:
                return None
            return json.dumps({
                "text": "Công ty MIMIN\nĐịa chỉ: Hóc Môn, TP.HCM\nĐiện thoại: 0901234567",
                "title": "Công ty MIMIN",
            })

        result = TrafilaturaExtractor(
            loader=lambda: (extract, "2.2.0"), min_content_chars=20
        ).extract(fetch_evidence("<html>contact card</html>"))

        self.assertEqual(result.status, ExtractionStatus.OK)
        self.assertEqual(len(calls), 2)
        self.assertTrue(calls[0].get("favor_precision"))
        self.assertTrue(calls[1].get("favor_recall"))
        self.assertIn("0901234567", result.main_text or "")

    def test_normalizes_and_truncates_plain_text_without_trafilatura(self) -> None:
        body = "  Công ty   MIMIN  \n\n chuyên sản xuất vải cotton chất lượng cao.  "
        result = TrafilaturaExtractor(max_output_chars=32, min_content_chars=10).extract(
            fetch_evidence(body, content_type="text/plain")
        )
        self.assertEqual(result.status, ExtractionStatus.OK)
        self.assertEqual(result.extractor, "plain-text")
        self.assertTrue(result.truncated)
        self.assertEqual(result.char_count, 32)

    def test_to_dict_has_stable_string_status(self) -> None:
        payload = {"text": "Công ty sản xuất vải cotton với thông tin liên hệ công khai."}
        result = TrafilaturaExtractor(
            loader=lambda: (lambda _html, **_options: json.dumps(payload), "2.2.0")
        ).extract(fetch_evidence("<html>source</html>"))
        self.assertEqual(result.to_dict()["status"], "OK")

    @unittest.skipUnless(
        importlib.util.find_spec("trafilatura") is not None,
        "Trafilatura dependency is not installed",
    )
    def test_real_trafilatura_220_removes_navigation_noise(self) -> None:
        html = """
        <html><head><title>Công ty Dệt MIMIN</title></head><body>
          <nav>Trang chủ | Tin tức | Tuyển dụng</nav>
          <main><h1>Giới thiệu doanh nghiệp</h1>
          <p>Công ty Dệt MIMIN chuyên sản xuất và cung cấp vải cotton cho ngành may mặc Việt Nam.</p>
          <p>Nhà máy áp dụng quy trình kiểm soát chất lượng và công khai thông tin liên hệ.</p>
          </main><footer>Bản quyền và menu lặp lại</footer>
        </body></html>
        """
        result = TrafilaturaExtractor(min_content_chars=20).extract(fetch_evidence(html))
        self.assertEqual(result.status, ExtractionStatus.OK)
        self.assertEqual(result.extractor_version, "2.2.0")
        self.assertIn("sản xuất", result.main_text or "")


if __name__ == "__main__":
    unittest.main()

