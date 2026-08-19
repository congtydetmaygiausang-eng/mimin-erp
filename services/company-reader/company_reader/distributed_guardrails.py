"""JT9 Redis-compatible adapters injected without importing a Redis library."""

from __future__ import annotations

import json
import re
from typing import Protocol

from .jina_models import JinaReadEvidence, JinaReadStatus
from .runtime_guardrails import RateLimitDecision


class RedisLike(Protocol):
    def get(self, key: str) -> bytes | str | None: ...
    def set(self, key: str, value: str, *, ex: int) -> object: ...
    def eval(self, script: str, numkeys: int, *values: object) -> object: ...


RATE_LIMIT_LUA = """
local current = redis.call('INCR', KEYS[1])
if current == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
local ttl = redis.call('PTTL', KEYS[1])
local remaining = tonumber(ARGV[2]) - current
if remaining < 0 then remaining = 0 end
if current > tonumber(ARGV[2]) then return {0, remaining, ttl} end
return {1, remaining, ttl}
""".strip()
OPAQUE_KEY = re.compile(r"^[a-f0-9]{64}$")


class RedisEvidenceCache:
    def __init__(self, client: RedisLike, namespace: str = "mimin:company-reader:jina") -> None:
        self.client = client
        self.namespace = namespace.strip(":")

    def get(self, key: str) -> JinaReadEvidence | None:
        raw = self.client.get(self._key(key))
        if raw is None:
            return None
        try:
            payload = json.loads(raw.decode("utf-8") if isinstance(raw, bytes) else raw)
            if not isinstance(payload, dict):
                return None
            payload["status"] = JinaReadStatus(str(payload["status"]))
            return JinaReadEvidence(**payload)
        except (KeyError, TypeError, ValueError, json.JSONDecodeError):
            return None

    def set(self, key: str, value: JinaReadEvidence, ttl_seconds: float) -> None:
        ttl = max(1, int(ttl_seconds))
        self.client.set(
            self._key(key),
            json.dumps(value.to_dict(), ensure_ascii=False, separators=(",", ":")),
            ex=ttl,
        )

    def _key(self, key: str) -> str:
        if not OPAQUE_KEY.fullmatch(key):
            raise ValueError("distributed cache key must be a SHA-256 digest")
        return f"{self.namespace}:cache:{key}"


class RedisFixedWindowRateLimiter:
    def __init__(
        self,
        client: RedisLike,
        requests_per_window: int = 20,
        window_seconds: float = 60.0,
        namespace: str = "mimin:company-reader:jina",
    ) -> None:
        if requests_per_window < 1 or window_seconds <= 0:
            raise ValueError("rate limit configuration must be positive")
        self.client = client
        self.limit = requests_per_window
        self.window_milliseconds = max(1, int(window_seconds * 1_000))
        self.namespace = namespace.strip(":")

    def acquire(self, caller_key: str) -> RateLimitDecision:
        if not OPAQUE_KEY.fullmatch(caller_key):
            raise ValueError("distributed caller key must be a SHA-256 digest")
        result = self.client.eval(
            RATE_LIMIT_LUA,
            1,
            f"{self.namespace}:rate:{caller_key}",
            self.window_milliseconds,
            self.limit,
        )
        if not isinstance(result, (list, tuple)) or len(result) != 3:
            raise RuntimeError("Redis rate limiter returned an invalid response")
        allowed, remaining, ttl_ms = (int(item) for item in result)
        return RateLimitDecision(bool(allowed), max(0, remaining), max(0.0, ttl_ms / 1_000))
