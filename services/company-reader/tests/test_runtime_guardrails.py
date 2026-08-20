"""JT8 deterministic cache/rate/circuit/metrics tests."""

from __future__ import annotations

import json
import sys
import threading
import time
import unittest
import urllib.error
from pathlib import Path


SERVICE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SERVICE_ROOT))

from company_reader.jina_models import JinaReadEvidence, JinaReadStatus  # noqa: E402
from company_reader.jina_reader import JinaReaderClient  # noqa: E402
from company_reader.runtime_guardrails import (  # noqa: E402
    CircuitBreaker,
    FixedWindowRateLimiter,
    GuardedJinaReaderClient,
    MemoryTTLCache,
    ReaderMetrics,
)
from company_reader.url_policy import UrlPolicy  # noqa: E402


def public_resolver(_hostname: str, _port: int) -> tuple[str, ...]:
    return ("93.184.216.34",)


class ManualClock:
    def __init__(self) -> None:
        self.value = 0.0

    def __call__(self) -> float:
        return self.value

    def advance(self, seconds: float) -> None:
        self.value += seconds


class FakeResponse:
    status = 200

    def __init__(self, url: str, content: str = "Nội dung doanh nghiệp đủ dài " * 5) -> None:
        self.body = json.dumps({"data": {"url": url, "content": content}}).encode()

    def read(self, amount: int = -1) -> bytes:
        return self.body if amount < 0 else self.body[:amount]

    def close(self) -> None:
        pass


def client(opener) -> JinaReaderClient:
    return JinaReaderClient(policy=UrlPolicy(resolver=public_resolver), opener=opener)


class MemoryTTLCacheTests(unittest.TestCase):
    def test_ttl_and_lru_bound_are_deterministic(self) -> None:
        clock = ManualClock()
        cache: MemoryTTLCache[str] = MemoryTTLCache(max_entries=2, clock=clock)
        cache.set("a", "A", 10)
        cache.set("b", "B", 10)
        self.assertEqual(cache.get("a"), "A")
        cache.set("c", "C", 10)
        self.assertIsNone(cache.get("b"))
        self.assertEqual(len(cache), 2)
        clock.advance(10)
        self.assertIsNone(cache.get("a"))


class GuardedJinaReaderClientTests(unittest.TestCase):
    def test_success_cache_uses_normalized_url_and_skips_provider(self) -> None:
        calls = 0

        def opener(request, _timeout):
            nonlocal calls
            calls += 1
            return FakeResponse("https://example.com/company")

        guarded = GuardedJinaReaderClient(client(opener), caller_id="company-reader")
        first = guarded.read("https://example.com/company#one")
        second = guarded.read("https://example.com/company#two")
        self.assertEqual(first.status, JinaReadStatus.OK)
        self.assertEqual(second.status, JinaReadStatus.OK)
        self.assertEqual(second.requested_url, "https://example.com/company#two")
        self.assertEqual(calls, 1)

    def test_rate_limit_applies_only_after_cache_miss(self) -> None:
        calls = 0

        def opener(request, _timeout):
            nonlocal calls
            calls += 1
            target = request.full_url.removeprefix("https://r.jina.ai/")
            return FakeResponse(target)

        limiter = FixedWindowRateLimiter(requests_per_window=1)
        guarded = GuardedJinaReaderClient(client(opener), caller_id="tenant-a", limiter=limiter)
        self.assertEqual(guarded.read("https://example.com/a").status, JinaReadStatus.OK)
        self.assertEqual(guarded.read("https://example.com/a").status, JinaReadStatus.OK)
        blocked = guarded.read("https://example.com/b")
        self.assertEqual(blocked.status, JinaReadStatus.RATE_LIMITED)
        self.assertEqual(calls, 1)

    def test_circuit_opens_and_recovers_after_cooldown(self) -> None:
        clock = ManualClock()
        calls = 0

        def opener(request, _timeout):
            nonlocal calls
            calls += 1
            if calls <= 2:
                raise urllib.error.URLError("provider unavailable")
            target = request.full_url.removeprefix("https://r.jina.ai/")
            return FakeResponse(target)

        guarded = GuardedJinaReaderClient(
            client(opener),
            caller_id="tenant-a",
            cache=MemoryTTLCache(clock=clock),
            limiter=FixedWindowRateLimiter(20, clock=clock),
            breaker=CircuitBreaker(2, 60, clock=clock),
            failure_ttl_seconds=0,
        )
        self.assertEqual(guarded.read("https://example.com/a").status, JinaReadStatus.NETWORK_ERROR)
        self.assertEqual(guarded.read("https://example.com/b").status, JinaReadStatus.NETWORK_ERROR)
        self.assertEqual(guarded.read("https://example.com/c").status, JinaReadStatus.CIRCUIT_OPEN)
        self.assertEqual(calls, 2)
        clock.advance(61)
        self.assertEqual(guarded.read("https://example.com/d").status, JinaReadStatus.OK)
        self.assertEqual(calls, 3)

    def test_transient_failure_is_short_cached(self) -> None:
        calls = 0

        def opener(_request, _timeout):
            nonlocal calls
            calls += 1
            raise urllib.error.URLError("down")

        guarded = GuardedJinaReaderClient(client(opener), caller_id="tenant-a")
        self.assertEqual(guarded.read("https://example.com/a").status, JinaReadStatus.NETWORK_ERROR)
        self.assertEqual(guarded.read("https://example.com/a").status, JinaReadStatus.NETWORK_ERROR)
        self.assertEqual(calls, 1)

    def test_unsafe_url_does_not_consume_local_rate_budget(self) -> None:
        calls = 0

        def opener(request, _timeout):
            nonlocal calls
            calls += 1
            target = request.full_url.removeprefix("https://r.jina.ai/")
            return FakeResponse(target)

        guarded = GuardedJinaReaderClient(
            client(opener), caller_id="tenant-a",
            limiter=FixedWindowRateLimiter(requests_per_window=1),
        )
        self.assertEqual(guarded.read("https://127.0.0.1/admin").status, JinaReadStatus.BLOCKED)
        self.assertEqual(guarded.read("https://example.com/a").status, JinaReadStatus.OK)
        self.assertEqual(calls, 1)

    def test_same_url_concurrency_is_collapsed_to_one_provider_call(self) -> None:
        calls = 0
        call_lock = threading.Lock()

        def opener(_request, _timeout):
            nonlocal calls
            with call_lock:
                calls += 1
            time.sleep(0.03)
            return FakeResponse("https://example.com/company")

        guarded = GuardedJinaReaderClient(client(opener), caller_id="tenant-a")
        results: list[JinaReadEvidence] = []
        threads = [threading.Thread(target=lambda: results.append(guarded.read("https://example.com/company"))) for _ in range(6)]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join()
        self.assertEqual(calls, 1)
        self.assertEqual(len(results), 6)
        self.assertTrue(all(item.status is JinaReadStatus.OK for item in results))
        self.assertFalse(guarded._key_locks)

    def test_rate_limiter_bounds_caller_bookkeeping(self) -> None:
        limiter = FixedWindowRateLimiter(requests_per_window=2, max_callers=2)
        limiter.acquire("a")
        limiter.acquire("b")
        limiter.acquire("c")
        self.assertEqual(len(limiter._windows), 2)
        self.assertNotIn("a", limiter._windows)

    def test_metrics_are_low_cardinality_and_contain_no_secrets(self) -> None:
        metrics = ReaderMetrics()
        guarded = GuardedJinaReaderClient(
            client(lambda _request, _timeout: FakeResponse("https://example.com/company")),
            caller_id="secret-tenant",
            metrics=metrics,
        )
        guarded.read("https://example.com/company?token=secret")
        serialized = json.dumps(metrics.snapshot())
        self.assertNotIn("example.com", serialized)
        self.assertNotIn("secret", serialized)
        self.assertEqual(metrics.snapshot()["provider_call"], 1)


if __name__ == "__main__":
    unittest.main()
