"""Environment factory for the disabled-by-default JT9 ASGI app."""

from __future__ import annotations

import os

from .api import CompanyReaderASGI
from .candidate_extractor import CompanyCandidateExtractor
from .canonical_selector import CanonicalFieldSelector
from .entity_resolver import CompanyEntityResolver
from .entity_segmenter import CompanyEntitySegmenter
from .extractor import TrafilaturaExtractor
from .fallback import JinaFallbackCoordinator
from .fetcher import SafeFetcher
from .jina_reader import JinaReaderClient
from .runtime_guardrails import GuardedJinaReaderClient
from .service import CompanyReaderPipeline
from .url_policy import UrlPolicy


def create_app_from_env(environment: dict[str, str] | None = None) -> CompanyReaderASGI:
    env = environment if environment is not None else dict(os.environ)
    enabled = env.get("COMPANY_READER_ENABLED", "false").strip().lower() == "true"
    token = env.get("COMPANY_READER_SERVICE_TOKEN", "")
    allow_memory = env.get("COMPANY_READER_ALLOW_MEMORY_GUARDRAILS", "false").strip().lower() == "true"
    if enabled and len(token) < 32:
        configuration_error = "MISSING_SERVICE_TOKEN"
    elif enabled and not allow_memory:
        # JT9 intentionally has no implicit production Redis connection. An operator must
        # explicitly accept the single-instance dark-launch guardrails.
        configuration_error = "MEMORY_GUARDRAILS_NOT_ACKNOWLEDGED"
    else:
        configuration_error = None
    policy = UrlPolicy()
    jina = GuardedJinaReaderClient(
        JinaReaderClient(policy=policy, api_key=env.get("JINA_API_KEY") or None),
        caller_id="company-reader-service",
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
    return CompanyReaderASGI(pipeline, token, enabled, configuration_error)


app = create_app_from_env()
