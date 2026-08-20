from __future__ import annotations

import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from company_reader.canonical_selector import CanonicalFieldSelector  # noqa: E402
from company_reader.entity_resolver import CompanyEntityResolver  # noqa: E402
from company_reader.service import CompanyReaderPipeline  # noqa: E402
from company_reader.service_models import SourceProcessingStatus  # noqa: E402


class FailingFetcher:
    def fetch(self, raw_url: str) -> object:
        raise TimeoutError(f"private detail must not escape: {raw_url}")


class CompanyReaderPipelineTests(unittest.TestCase):
    def test_source_failure_is_isolated_and_does_not_leak_exception_detail(self) -> None:
        pipeline = CompanyReaderPipeline(
            fetcher=FailingFetcher(),  # type: ignore[arg-type]
            extractor=None,  # type: ignore[arg-type]
            fallback=None,  # type: ignore[arg-type]
            candidate_extractor=None,  # type: ignore[arg-type]
            segmenter=None,  # type: ignore[arg-type]
            resolver=CompanyEntityResolver(),
            selector=CanonicalFieldSelector(),
        )
        result = pipeline.read("request_123", ("https://example.com/private",))
        self.assertEqual(result.profiles, ())
        self.assertEqual(result.sources[0].status, SourceProcessingStatus.FAILED)
        self.assertEqual(result.sources[0].error_code, "UNEXPECTED_TIMEOUTERROR")
        self.assertNotIn("private detail", str(result.to_dict()))
        self.assertEqual(result.warnings, ("PARTIAL_SOURCE_FAILURE",))


if __name__ == "__main__":
    unittest.main()
