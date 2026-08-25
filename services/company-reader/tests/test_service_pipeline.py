from __future__ import annotations

import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from company_reader.canonical_selector import CanonicalFieldSelector  # noqa: E402
from company_reader.candidate_models import (  # noqa: E402
    CandidateBundleStatus,
    CandidateField,
    CompanyCandidateBundle,
    EvidenceOrigin,
    FieldCandidate,
)
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
        self.assertEqual(result.sources[0].error_code, "PIPELINE_TIMEOUTERROR")
        self.assertNotIn("private detail", str(result.to_dict()))
        self.assertEqual(result.warnings, ("PARTIAL_SOURCE_FAILURE",))

    def test_contact_snapshot_keeps_address_and_phone_without_identity(self) -> None:
        def candidate(field: CandidateField, value: str, normalized: str) -> FieldCandidate:
            return FieldCandidate(
                field=field, value=value, normalized_value=normalized, confidence=0.9,
                origin=EvidenceOrigin.MAIN_TEXT, source_url="https://example.com/contact",
                text_sha256="sha", excerpt=value, start=0, end=len(value),
            )

        bundle = CompanyCandidateBundle(
            source_url="https://example.com/contact", text_sha256="sha",
            status=CandidateBundleStatus.NO_IDENTITY,
            candidates=(
                candidate(CandidateField.ADDRESS, "12 Nguyễn Trãi, TP.HCM", "12 Nguyễn Trãi, TP.HCM"),
                candidate(CandidateField.PHONE, "0901 234 567", "0901234567"),
                candidate(CandidateField.PHONE, "0901 234 567", "0901234567"),
            ),
        )

        snapshot = CompanyReaderPipeline._contact_snapshot(bundle)
        self.assertIsNotNone(snapshot)
        assert snapshot is not None
        self.assertEqual(snapshot.addresses, ("12 Nguyễn Trãi, TP.HCM",))
        self.assertEqual(snapshot.phones, ("0901234567",))


if __name__ == "__main__":
    unittest.main()
