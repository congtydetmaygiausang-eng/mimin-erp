"""JT8 in-process cache, rate limiting, circuit breaker and safe metrics."""

from __future__ import annotations

import hashlib
import threading
import time
from collections import OrderedDict
from collections.abc import Callable
from contextlib import contextmanager
from dataclasses import dataclass, replace
from typing import Generic, Iterator, Protocol, TypeVar

from .jina_models import JinaReadEvidence, JinaReadStatus
from .jina_reader import JinaReaderClient
from .url_policy import UrlPolicyError


Clock = Callable[[], float]
T = TypeVar("T")


class JinaReader(Protocol):
    max_content_chars: int

    def read(self, raw_url: str) -> JinaReadEvidence: ...


@dataclass(frozen=True, slots=True)
class RateLimitDecision:
    allowed: bool
    remaining: int
    retry_after_seconds: float


class MemoryTTLCache(Generic[T]):
    """Bounded thread-safe LRU cache; keys must already be non-sensitive hashes."""

    def __init__(self, max_entries: int = 1_000, clock: Clock = time.monotonic) -> None:
        if max_entries < 1:
            raise ValueError("max_entries must be positive")
        self.max_entries = max_entries
        self.clock = clock
        self._items: OrderedDict[str, tuple[float, T]] = OrderedDict()
        self._lock = threading.RLock()

    def get(self, key: str) -> T | None:
        now = self.clock()
        with self._lock:
            item = self._items.get(key)
            if item is None:
                return None
            expires_at, value = item
            if expires_at <= now:
                self._items.pop(key, None)
                return None
            self._items.move_to_end(key)
            return value

    def set(self, key: str, value: T, ttl_seconds: float) -> None:
        if ttl_seconds <= 0:
            return
        with self._lock:
            self._items[key] = (self.clock() + ttl_seconds, value)
            self._items.move_to_end(key)
            while len(self._items) > self.max_entries:
                self._items.popitem(last=False)

    def __len__(self) -> int:
        with self._lock:
            return len(self._items)


class FixedWindowRateLimiter:
    def __init__(
        self,
        requests_per_window: int = 20,
        window_seconds: float = 60.0,
        max_callers: int = 10_000,
        clock: Clock = time.monotonic,
    ) -> None:
        if requests_per_window < 1 or window_seconds <= 0 or max_callers < 1:
            raise ValueError("rate limit configuration must be positive")
        self.limit = requests_per_window
        self.window_seconds = window_seconds
        self.max_callers = max_callers
        self.clock = clock
        self._windows: OrderedDict[str, tuple[float, int]] = OrderedDict()
        self._lock = threading.Lock()

    def acquire(self, caller_key: str) -> RateLimitDecision:
        now = self.clock()
        with self._lock:
            start, count = self._windows.get(caller_key, (now, 0))
            if now - start >= self.window_seconds:
                start, count = now, 0
            if count >= self.limit:
                self._windows.move_to_end(caller_key)
                return RateLimitDecision(False, 0, max(0.0, self.window_seconds - (now - start)))
            count += 1
            self._windows[caller_key] = (start, count)
            self._windows.move_to_end(caller_key)
            while len(self._windows) > self.max_callers:
                self._windows.popitem(last=False)
            return RateLimitDecision(True, self.limit - count, 0.0)


class CircuitBreaker:
    def __init__(
        self,
        failure_threshold: int = 3,
        cooldown_seconds: float = 60.0,
        clock: Clock = time.monotonic,
    ) -> None:
        if failure_threshold < 1 or cooldown_seconds <= 0:
            raise ValueError("circuit breaker configuration must be positive")
        self.failure_threshold = failure_threshold
        self.cooldown_seconds = cooldown_seconds
        self.clock = clock
        self._failures = 0
        self._opened_at: float | None = None
        self._lock = threading.Lock()

    def allow(self) -> tuple[bool, float]:
        now = self.clock()
        with self._lock:
            if self._opened_at is None:
                return True, 0.0
            elapsed = now - self._opened_at
            if elapsed >= self.cooldown_seconds:
                self._opened_at = None
                self._failures = 0
                return True, 0.0
            return False, self.cooldown_seconds - elapsed

    def success(self) -> None:
        with self._lock:
            self._failures = 0
            self._opened_at = None

    def failure(self) -> None:
        with self._lock:
            self._failures += 1
            if self._failures >= self.failure_threshold and self._opened_at is None:
                self._opened_at = self.clock()


class ReaderMetrics:
    """Low-cardinality counters only; never records URL, caller or API key."""

    ALLOWED_COUNTERS = frozenset({
        "cache_hit", "cache_miss", "provider_call", "rate_limited",
        "circuit_open", "unsafe_url", "result_ok", "result_error",
    })

    def __init__(self) -> None:
        self._counters = {name: 0 for name in self.ALLOWED_COUNTERS}
        self._lock = threading.Lock()

    def increment(self, name: str) -> None:
        if name not in self.ALLOWED_COUNTERS:
            raise ValueError("metric name is not allowlisted")
        with self._lock:
            self._counters[name] += 1

    def snapshot(self) -> dict[str, int]:
        with self._lock:
            return dict(sorted(self._counters.items()))


class GuardedJinaReaderClient:
    """Operational wrapper around JT6 with no production wiring."""

    TRANSIENT_FAILURES = frozenset({
        JinaReadStatus.HTTP_ERROR,
        JinaReadStatus.TIMEOUT,
        JinaReadStatus.NETWORK_ERROR,
        JinaReadStatus.INVALID_RESPONSE,
    })

    def __init__(
        self,
        base: JinaReaderClient,
        *,
        caller_id: str,
        cache: MemoryTTLCache[JinaReadEvidence] | None = None,
        limiter: FixedWindowRateLimiter | None = None,
        breaker: CircuitBreaker | None = None,
        metrics: ReaderMetrics | None = None,
        success_ttl_seconds: float = 86_400.0,
        failure_ttl_seconds: float = 60.0,
    ) -> None:
        normalized_caller = caller_id.strip()
        if not normalized_caller or len(normalized_caller) > 200:
            raise ValueError("caller_id is required and bounded")
        self.base = base
        self.max_content_chars = base.max_content_chars
        self.cache = cache if cache is not None else MemoryTTLCache()
        self.limiter = limiter or FixedWindowRateLimiter()
        self.breaker = breaker or CircuitBreaker()
        self.metrics = metrics or ReaderMetrics()
        self.success_ttl_seconds = success_ttl_seconds
        self.failure_ttl_seconds = failure_ttl_seconds
        self._caller_key = hashlib.sha256(normalized_caller.encode("utf-8")).hexdigest()
        self._key_locks: dict[str, tuple[threading.Lock, int]] = {}
        self._key_locks_guard = threading.Lock()

    def read(self, raw_url: str) -> JinaReadEvidence:
        try:
            normalized_url = self.base.policy.validate(raw_url)
        except (UrlPolicyError, OSError):
            self.metrics.increment("unsafe_url")
            return self.base.read(raw_url)
        cache_key = hashlib.sha256(normalized_url.encode("utf-8")).hexdigest()
        cached = self.cache.get(cache_key)
        if cached is not None:
            self.metrics.increment("cache_hit")
            return replace(cached, requested_url=raw_url)
        self.metrics.increment("cache_miss")

        with self._key_lock(cache_key):
            cached = self.cache.get(cache_key)
            if cached is not None:
                self.metrics.increment("cache_hit")
                return replace(cached, requested_url=raw_url)
            allowed, retry_after = self.breaker.allow()
            if not allowed:
                self.metrics.increment("circuit_open")
                return self._guard_failure(raw_url, normalized_url, JinaReadStatus.CIRCUIT_OPEN, "JINA_CIRCUIT_OPEN", retry_after)
            rate = self.limiter.acquire(self._caller_key)
            if not rate.allowed:
                self.metrics.increment("rate_limited")
                return self._guard_failure(raw_url, normalized_url, JinaReadStatus.RATE_LIMITED, "LOCAL_RATE_LIMIT", rate.retry_after_seconds)
            self.metrics.increment("provider_call")
            result = self.base.read(normalized_url)
            if result.status is JinaReadStatus.OK:
                self.breaker.success()
                self.metrics.increment("result_ok")
                self.cache.set(cache_key, result, self.success_ttl_seconds)
            else:
                self.metrics.increment("result_error")
                if result.status in self.TRANSIENT_FAILURES:
                    self.breaker.failure()
                    self.cache.set(cache_key, result, self.failure_ttl_seconds)
            return replace(result, requested_url=raw_url)

    @contextmanager
    def _key_lock(self, key: str) -> Iterator[None]:
        with self._key_locks_guard:
            entry = self._key_locks.get(key)
            lock, waiters = entry if entry is not None else (threading.Lock(), 0)
            self._key_locks[key] = (lock, waiters + 1)
        lock.acquire()
        try:
            yield
        finally:
            lock.release()
            with self._key_locks_guard:
                current_lock, current_waiters = self._key_locks[key]
                if current_waiters <= 1:
                    self._key_locks.pop(key, None)
                else:
                    self._key_locks[key] = (current_lock, current_waiters - 1)

    @staticmethod
    def _guard_failure(
        raw_url: str,
        normalized_url: str,
        status: JinaReadStatus,
        code: str,
        retry_after: float,
    ) -> JinaReadEvidence:
        return JinaReadEvidence(
            requested_url=raw_url,
            normalized_target_url=normalized_url,
            status=status,
            error_code=code,
            error_detail=f"retry_after_seconds={retry_after:.3f}",
        )
