from __future__ import annotations

import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from company_reader.distributed_guardrails import (  # noqa: E402
    RedisEvidenceCache,
    RedisFixedWindowRateLimiter,
)
from company_reader.jina_models import JinaReadEvidence, JinaReadStatus  # noqa: E402


class FakeRedis:
    def __init__(self) -> None:
        self.values: dict[str, str] = {}
        self.expiries: dict[str, int] = {}
        self.eval_result: object = [1, 4, 30_000]
        self.eval_args: tuple[object, ...] = ()

    def get(self, key: str) -> str | None:
        return self.values.get(key)

    def set(self, key: str, value: str, *, ex: int) -> object:
        self.values[key] = value
        self.expiries[key] = ex
        return True

    def eval(self, script: str, numkeys: int, *values: object) -> object:
        self.eval_args = (script, numkeys, *values)
        return self.eval_result


class DistributedGuardrailTests(unittest.TestCase):
    digest = "a" * 64

    def test_evidence_cache_round_trip_uses_ttl_and_opaque_key(self) -> None:
        redis = FakeRedis()
        cache = RedisEvidenceCache(redis)
        evidence = JinaReadEvidence(
            requested_url="https://example.com",
            normalized_target_url="https://example.com/",
            status=JinaReadStatus.OK,
            content="company evidence",
            content_sha256="b" * 64,
            http_status=200,
        )
        cache.set(self.digest, evidence, 90.9)
        restored = cache.get(self.digest)
        key = f"mimin:company-reader:jina:cache:{self.digest}"
        self.assertEqual(restored, evidence)
        self.assertEqual(redis.expiries[key], 90)
        self.assertNotIn("example.com", key)

    def test_cache_rejects_non_digest_keys_and_corrupt_values(self) -> None:
        redis = FakeRedis()
        cache = RedisEvidenceCache(redis)
        with self.assertRaises(ValueError):
            cache.get("customer@example.com")
        redis.values[f"mimin:company-reader:jina:cache:{self.digest}"] = "not-json"
        self.assertIsNone(cache.get(self.digest))

    def test_rate_limiter_maps_atomic_redis_result(self) -> None:
        redis = FakeRedis()
        limiter = RedisFixedWindowRateLimiter(redis, requests_per_window=5, window_seconds=30)
        decision = limiter.acquire(self.digest)
        self.assertTrue(decision.allowed)
        self.assertEqual(decision.remaining, 4)
        self.assertEqual(decision.retry_after_seconds, 30.0)
        self.assertEqual(redis.eval_args[1], 1)

    def test_rate_limiter_rejects_plain_caller_identifier(self) -> None:
        with self.assertRaises(ValueError):
            RedisFixedWindowRateLimiter(FakeRedis()).acquire("browser-user")


if __name__ == "__main__":
    unittest.main()
