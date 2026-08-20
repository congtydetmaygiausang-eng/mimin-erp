from __future__ import annotations

import sys
import unittest
from pathlib import Path
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from company_reader.shadow_batch import _percentile, run_shadow_batch  # noqa: E402
from company_reader.shadow_probe import ShadowProbeResult  # noqa: E402


class ShadowBatchTests(unittest.TestCase):
    def test_percentile_is_bounded_and_deterministic(self) -> None:
        self.assertEqual(_percentile([], 0.95), 0)
        self.assertEqual(_percentile([30.0, 10.0, 20.0], 0.95), 20)

    def test_batch_aggregates_only_shadow_metadata(self) -> None:
        result = ShadowProbeResult(202, {
            "status": "SHADOW_PROCESSED",
            "source_count": 1,
            "profile_count": 2,
            "warning_count": 0,
        })
        with patch("company_reader.shadow_batch.send_shadow_probe", return_value=result):
            summary = run_shadow_batch(
                service_url="http://127.0.0.1:8765",
                service_token="s" * 40,
                urls=("https://example.com",),
                runs=3,
            )
        self.assertEqual(summary.successful_runs, 3)
        self.assertEqual(summary.failed_runs, 0)
        self.assertEqual(summary.source_count, 3)
        self.assertEqual(summary.profile_count, 6)
        self.assertEqual(summary.warning_count, 0)

    def test_batch_is_bounded(self) -> None:
        with self.assertRaises(ValueError):
            run_shadow_batch(
                service_url="http://127.0.0.1:8765",
                service_token="s" * 40,
                urls=("https://example.com",),
                runs=11,
            )
