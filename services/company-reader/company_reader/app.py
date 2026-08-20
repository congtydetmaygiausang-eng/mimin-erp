"""Environment factory for the disabled-by-default JT9 ASGI app."""

from __future__ import annotations

import os
import re

from .api import CompanyReaderASGI
from .candidate_extractor import CompanyCandidateExtractor
from .canonical_selector import CanonicalFieldSelector
from .distributed_guardrails import RedisEvidenceCache, RedisFixedWindowRateLimiter, RedisLike
from .entity_resolver import CompanyEntityResolver
from .entity_segmenter import CompanyEntitySegmenter
from .extractor import TrafilaturaExtractor
from .fallback import JinaFallbackCoordinator
from .fetcher import SafeFetcher
from .jina_reader import JinaReaderClient
from .rollout import RolloutMode, RolloutPolicy
from .runtime_guardrails import GuardedJinaReaderClient
from .service import CompanyReaderPipeline
from .url_policy import UrlPolicy


CLIENT_ID = re.compile(r"^[a-z0-9][a-z0-9_-]{2,63}$")


def create_app_from_env(
    environment: dict[str, str] | None = None,
    redis_client: RedisLike | None = None,
) -> CompanyReaderASGI:
    env = environment if environment is not None else dict(os.environ)
    enabled = env.get("COMPANY_READER_ENABLED", "false").strip().lower() == "true"
    token = env.get("COMPANY_READER_SERVICE_TOKEN", "")
    allow_memory = env.get("COMPANY_READER_ALLOW_MEMORY_GUARDRAILS", "false").strip().lower() == "true"
    deployment = env.get("COMPANY_READER_DEPLOYMENT", "dark-launch").strip().lower()
    guardrail_mode = env.get("COMPANY_READER_GUARDRAIL_MODE", "memory").strip().lower()
    client_values = (value.strip() for value in env.get("COMPANY_READER_ALLOWED_CLIENTS", "").split(","))
    allowed_clients = frozenset(value for value in client_values if value)
    rollout_mode_raw = env.get("COMPANY_READER_ROLLOUT_MODE", "shadow").strip().lower()
    try:
        rollout_mode = RolloutMode(rollout_mode_raw)
        canary_percent = int(env.get("COMPANY_READER_CANARY_PERCENT", "0"))
        rollout = RolloutPolicy(rollout_mode, canary_percent)
    except (ValueError, TypeError):
        rollout = RolloutPolicy()
        rollout_error = "INVALID_ROLLOUT_CONFIGURATION"
    else:
        rollout_error = None
    if enabled and (len(token) < 32 or token.startswith("replace-with-")):
        configuration_error = "MISSING_SERVICE_TOKEN"
    elif enabled and not allowed_clients:
        configuration_error = "MISSING_ALLOWED_CLIENTS"
    elif enabled and any(not CLIENT_ID.fullmatch(value) for value in allowed_clients):
        configuration_error = "INVALID_ALLOWED_CLIENTS"
    elif enabled and rollout_error:
        configuration_error = rollout_error
    elif enabled and deployment not in {"dark-launch", "production"}:
        configuration_error = "INVALID_DEPLOYMENT_MODE"
    elif enabled and guardrail_mode not in {"memory", "redis"}:
        configuration_error = "INVALID_GUARDRAIL_MODE"
    elif enabled and deployment == "production" and guardrail_mode != "redis":
        configuration_error = "PRODUCTION_REQUIRES_REDIS"
    elif enabled and guardrail_mode == "redis" and redis_client is None:
        configuration_error = "MISSING_REDIS_CLIENT"
    elif enabled and guardrail_mode == "memory" and not allow_memory:
        # JT9 intentionally has no implicit production Redis connection. An operator must
        # explicitly accept the single-instance dark-launch guardrails.
        configuration_error = "MEMORY_GUARDRAILS_NOT_ACKNOWLEDGED"
    else:
        configuration_error = None
    policy = UrlPolicy()
    cache = RedisEvidenceCache(redis_client) if redis_client is not None and guardrail_mode == "redis" else None
    limiter = RedisFixedWindowRateLimiter(redis_client) if redis_client is not None and guardrail_mode == "redis" else None
    jina = GuardedJinaReaderClient(
        JinaReaderClient(policy=policy, api_key=env.get("JINA_API_KEY") or None),
        caller_id="company-reader-service",
        cache=cache,
        limiter=limiter,
    )
    pipeline = CompanyReaderPipeline(
        fetcher=SafeFetcher(policy=policy),
        extractor=TrafilaturaExtractor(),
        fallback=JinaFallbackCoordinator(jina),
        candidate_extractor=CompanyCandidateExtractor(),
        segmenter=CompanyEntitySegmenter(),
        resolver=CompanyEntityResolver(),
        selector=CanonicalFieldSelector(),
    )
    return CompanyReaderASGI(
        pipeline=pipeline,
        service_token=token,
        enabled=enabled,
        configuration_error=configuration_error,
        allowed_clients=allowed_clients,
        rollout=rollout,
    )


app = create_app_from_env()
