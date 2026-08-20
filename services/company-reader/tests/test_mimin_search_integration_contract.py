from __future__ import annotations

import unittest
from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
SEARCH_ROUTE = REPOSITORY_ROOT / "apps" / "web" / "src" / "app" / "api" / "v1" / "sourcing" / "search" / "route.ts"


class MiminSearchIntegrationContractTests(unittest.TestCase):
    def setUp(self) -> None:
        self.route = SEARCH_ROUTE.read_text(encoding="utf-8")

    def test_live_rollout_is_required_before_profiles_are_consumed(self) -> None:
        self.assertIn('process.env.COMPANY_READER_ENRICHMENT_MODE!=="LIVE"', self.route)
        self.assertIn('profile.status!=="READY_FOR_REVIEW"', self.route)
        self.assertIn('COMPANY_READER_ACCEPTED_FIELD_STATUS.has', self.route)

    def test_gateway_request_is_abortable_and_fail_open(self) -> None:
        self.assertIn("const controller=new AbortController()", self.route)
        self.assertIn("signal:controller.signal", self.route)
        self.assertIn('status:"ERROR",count:0', self.route)

    def test_reader_evidence_is_added_before_normalization_and_filtering(self) -> None:
        reader = self.route.index("const companyReader = await enrichSourcesWithCompanyReader")
        normalization = self.route.index("const normalizedCandidates = await normalizeWithDeepSeek", reader)
        exact_filter = self.route.index("const exactCandidates =", normalization)
        self.assertLess(reader, normalization)
        self.assertLess(normalization, exact_filter)


if __name__ == "__main__":
    unittest.main()
