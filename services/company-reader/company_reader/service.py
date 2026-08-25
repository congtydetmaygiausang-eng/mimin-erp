"""JT9 isolated orchestration of JT1-JT8 for a bounded source batch."""

from __future__ import annotations

from dataclasses import dataclass

from .candidate_extractor import CompanyCandidateExtractor
from .canonical_selector import CanonicalFieldSelector
from .entity_resolver import CompanyEntityResolver
from .entity_segmenter import CompanyEntitySegmenter
from .extraction_models import ExtractionStatus
from .extractor import TrafilaturaExtractor
from .fallback import JinaFallbackCoordinator
from .fetcher import SafeFetcher
from .candidate_models import CandidateField, CompanyCandidateBundle
from .service_models import (
    CompanyReadResponse,
    SourceContactSnapshot,
    SourceProcessingReport,
    SourceProcessingStatus,
)

MAX_RESPONSE_PROFILES = 25


@dataclass(frozen=True, slots=True)
class CompanyReaderPipeline:
    fetcher: SafeFetcher
    extractor: TrafilaturaExtractor
    fallback: JinaFallbackCoordinator
    candidate_extractor: CompanyCandidateExtractor
    segmenter: CompanyEntitySegmenter
    resolver: CompanyEntityResolver
    selector: CanonicalFieldSelector

    @staticmethod
    def _contact_snapshot(bundle: CompanyCandidateBundle) -> SourceContactSnapshot | None:
        def values(field: CandidateField) -> tuple[str, ...]:
            return tuple(dict.fromkeys(
                item.normalized_value
                for item in bundle.candidates
                if item.field is field and item.normalized_value
            ))

        snapshot = SourceContactSnapshot(
            legal_names=tuple(dict.fromkeys(
                item.value for item in bundle.candidates
                if item.field is CandidateField.LEGAL_NAME and item.value
            )),
            addresses=tuple(dict.fromkeys(
                item.value for item in bundle.candidates
                if item.field is CandidateField.ADDRESS and item.value
            )),
            phones=values(CandidateField.PHONE),
            emails=values(CandidateField.EMAIL),
            websites=values(CandidateField.WEBSITE),
            identity_safe=(
                not bundle.multi_entity
                and bundle.distinct_legal_names <= 1
                and bundle.distinct_tax_codes <= 1
            ),
            distinct_legal_names=bundle.distinct_legal_names,
            distinct_tax_codes=bundle.distinct_tax_codes,
        )
        return snapshot if any((snapshot.addresses, snapshot.phones, snapshot.emails, snapshot.websites)) else None

    def read(self, request_id: str, urls: tuple[str, ...]) -> CompanyReadResponse:
        segmentations = []
        reports: list[SourceProcessingReport] = []
        
        import threading
        trafilatura_lock = threading.Lock()

        def process_url(url: str):
            contact_snapshot = None
            try:
                jina_exception = None
                try:
                    jina_outcome = self.fallback.read_primary(url)
                except Exception as error:
                    # Jina is an enrichment provider, never a single point of failure.
                    # Provider/SDK errors (including AttributeError) must fall through
                    # to the local extractor for the same URL.
                    jina_exception = type(error).__name__.upper()
                    jina_outcome = None

                jina_document = jina_outcome.selected_document if jina_outcome is not None else None
                jina_document_usable = (
                    jina_document is not None
                    and jina_document.status in {ExtractionStatus.OK}
                    and bool((jina_document.main_text or "").strip())
                )
                if jina_outcome is not None and jina_outcome.decision.name == "JINA_ACCEPTED" and jina_document_usable:
                    selected = jina_outcome.selected_document
                    fallback_decision = "JINA_PRIMARY"
                    fetch_status = "JINA_OK"
                    extraction_status = "JINA_OK"
                    error_code = None
                else:
                    with trafilatura_lock:
                        fetched = self.fetcher.fetch(url)
                        primary = self.extractor.extract(fetched)
                    selected = primary
                    jina_reason = (
                        f"EXCEPTION_{jina_exception}"
                        if jina_exception
                        else (jina_outcome.decision.name if jina_outcome is not None else "NO_OUTCOME")
                    )
                    fallback_decision = f"JINA_FAILED_TRAFILATURA_USED({jina_reason})"
                    fetch_status = fetched.status.name
                    extraction_status = primary.status.name
                    error_code = primary.error_code

                bundle = self.candidate_extractor.extract(selected)
                contact_snapshot = self._contact_snapshot(bundle)
                if selected.status.name in {"OK", "TRUNCATED"}:
                    status = SourceProcessingStatus.PROCESSED
                    segmentation = self.segmenter.segment(selected, bundle)
                    if not segmentation.entities:
                        status = SourceProcessingStatus.NO_ENTITY
                        error_code = segmentation.warnings[0] if segmentation.warnings else None
                else:
                    status = SourceProcessingStatus.FAILED
                    error_code = selected.error_code
                    from .segmentation_models import EntitySegmentationResult, SegmentationStatus
                    segmentation = EntitySegmentationResult(
                        source_url=url, text_sha256="", status=SegmentationStatus.SKIPPED_CANDIDATE_ERROR
                    )
                    
                report = SourceProcessingReport(
                    source_url=url,
                    status=status,
                    fetch_status=fetch_status,
                    extraction_status=extraction_status,
                    fallback_decision=fallback_decision,
                    entity_count=len(segmentation.entities),
                    error_code=error_code,
                    contact_snapshot=contact_snapshot,
                )
                return segmentation, report
            except Exception as error:
                report = SourceProcessingReport(
                    source_url=url,
                    status=SourceProcessingStatus.FAILED,
                    fetch_status="INTERNAL_ERROR",
                    extraction_status="INTERNAL_ERROR",
                    fallback_decision="NOT_RUN",
                    # Keep the provider response safe but actionable. Contacts already
                    # extracted before a later segmentation failure remain available.
                    error_code=f"PIPELINE_{type(error).__name__.upper()}",
                    contact_snapshot=contact_snapshot,
                )
                from .segmentation_models import EntitySegmentationResult, SegmentationStatus
                seg = EntitySegmentationResult(
                    source_url=url, 
                    text_sha256="", 
                    status=SegmentationStatus.SKIPPED_CANDIDATE_ERROR,
                    warnings=("INTERNAL_ERROR",)
                )
                return seg, report

        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor(max_workers=min(len(urls), 5) or 1) as executor:
            futures = [executor.submit(process_url, url) for url in urls]
            for future in concurrent.futures.as_completed(futures):
                seg, rep = future.result()
                segmentations.append(seg)
                reports.append(rep)

        resolution = self.resolver.resolve(tuple(segmentations))
        profiles = tuple(
            self.selector.select(group)
            for group in resolution.groups[:MAX_RESPONSE_PROFILES]
        )
        warnings = set(resolution.warnings)
        if len(resolution.groups) > MAX_RESPONSE_PROFILES:
            warnings.add("PROFILE_LIMIT_REACHED")
        if any(item.status is SourceProcessingStatus.FAILED for item in reports):
            warnings.add("PARTIAL_SOURCE_FAILURE")
        return CompanyReadResponse(request_id, profiles, tuple(reports), tuple(sorted(warnings)))
