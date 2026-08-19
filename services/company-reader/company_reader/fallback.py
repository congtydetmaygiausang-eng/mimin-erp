"""JT6 policy deciding when a Jina Reader fallback is allowed."""

from __future__ import annotations

import hashlib
from dataclasses import dataclass

from .extraction_models import ExtractedDocument, ExtractionStatus
from .jina_models import FallbackDecision, FallbackOutcome, JinaReadStatus
from .runtime_guardrails import JinaReader
from .models import FetchEvidence, FetchStatus


ALLOWED_FETCH_FAILURES = frozenset({
    FetchStatus.HTTP_ERROR,
    FetchStatus.TIMEOUT,
    FetchStatus.NETWORK_ERROR,
})
ALLOWED_EXTRACTION_FAILURES = frozenset({
    ExtractionStatus.EMPTY,
    ExtractionStatus.EXTRACTION_ERROR,
    ExtractionStatus.DEPENDENCY_MISSING,
})


@dataclass(frozen=True, slots=True)
class JinaFallbackCoordinator:
    client: JinaReader
    min_primary_chars: int = 120
    min_jina_chars: int = 80

    def recover(
        self,
        raw_url: str,
        primary_fetch: FetchEvidence,
        primary_document: ExtractedDocument,
    ) -> FallbackOutcome:
        if self._primary_is_good(primary_document):
            return FallbackOutcome(FallbackDecision.PRIMARY_ACCEPTED, primary_document, reason="PRIMARY_CONTENT_SUFFICIENT")
        allowed, reason = self._fallback_allowed(primary_fetch, primary_document)
        if not allowed:
            return FallbackOutcome(FallbackDecision.FALLBACK_NOT_ALLOWED, primary_document, reason=reason)
        evidence = self.client.read(raw_url)
        if evidence.status is not JinaReadStatus.OK or not evidence.content:
            return FallbackOutcome(FallbackDecision.JINA_FAILED, primary_document, evidence, evidence.error_code)
        if len(evidence.content) < self.min_jina_chars:
            return FallbackOutcome(FallbackDecision.JINA_FAILED, primary_document, evidence, "JINA_CONTENT_BELOW_MINIMUM")
        document = ExtractedDocument(
            source_url=evidence.normalized_target_url,
            fetch_sha256=evidence.content_sha256,
            status=ExtractionStatus.OK,
            extractor="jina-reader",
            extractor_version="api-v1",
            title=evidence.title,
            description=evidence.description,
            main_text=evidence.content,
            text_sha256=hashlib.sha256(evidence.content.encode("utf-8")).hexdigest(),
            char_count=len(evidence.content),
            word_count=len(evidence.content.split()),
            truncated=evidence.content_truncated,
            metadata={"fallback_reason": reason},
        )
        return FallbackOutcome(FallbackDecision.JINA_ACCEPTED, document, evidence, reason)

    def _primary_is_good(self, document: ExtractedDocument) -> bool:
        return bool(
            document.status is ExtractionStatus.OK
            and document.main_text
            and document.char_count >= self.min_primary_chars
        )

    @staticmethod
    def _fallback_allowed(fetch: FetchEvidence, document: ExtractedDocument) -> tuple[bool, str]:
        if fetch.status in ALLOWED_FETCH_FAILURES:
            return True, f"FETCH_{fetch.status.value}"
        if fetch.status is FetchStatus.OK and document.status in ALLOWED_EXTRACTION_FAILURES:
            return True, f"EXTRACTION_{document.status.value}"
        if fetch.status is FetchStatus.OK and document.status is ExtractionStatus.OK:
            return True, "PRIMARY_CONTENT_BELOW_MINIMUM"
        return False, f"BLOCKED_BY_POLICY:{fetch.status.value}:{document.status.value}"
