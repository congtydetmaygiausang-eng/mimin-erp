from __future__ import annotations

import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from company_reader.rollout import RolloutMode, RolloutPolicy  # noqa: E402


class RolloutPolicyTests(unittest.TestCase):
    def test_shadow_executes_without_exposing_profiles(self) -> None:
        decision = RolloutPolicy(RolloutMode.SHADOW).decide("request_123")
        self.assertTrue(decision.selected)
        self.assertFalse(decision.expose_profiles)

    def test_canary_is_deterministic_and_respects_edges(self) -> None:
        zero = RolloutPolicy(RolloutMode.CANARY, 0)
        full = RolloutPolicy(RolloutMode.CANARY, 100)
        self.assertFalse(zero.decide("request_123").selected)
        first = full.decide("request_123")
        second = full.decide("request_123")
        self.assertEqual(first, second)
        self.assertTrue(first.expose_profiles)

    def test_invalid_percentage_is_rejected(self) -> None:
        with self.assertRaises(ValueError):
            RolloutPolicy(RolloutMode.CANARY, 101)


if __name__ == "__main__":
    unittest.main()
