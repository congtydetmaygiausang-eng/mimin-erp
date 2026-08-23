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
from .service_models import CompanyReadResponse, SourceProcessingReport, SourceProcessingStatus

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

    def read(self, request_id: str, urls: tuple[str, ...]) -> CompanyReadResponse:
        segmentations = []
        reports = []
        
        def process_url(url: str):
            try:
                jina_outcome = self.fallback.read_primary(url)
                
                if jina_outcome.decision.name == "JINA_ACCEPTED":
                    selected = jina_outcome.selected_document
                    fetch_status = "OK"
                    extraction_status = selected.status.value
                    fallback_decision = "JINA_PRIMARY"
                else:
                    fetched = self.fetcher.fetch(url)
                    primary = self.extractor.extract(fetched)
                    selected = primary
                    fetch_status = fetched.status.value
                    extraction_status = selected.status.value
                    fallback_decision = f"JINA_FAILED_TRAFILATURA_USED({jina_outcome.decision.name})"

                bundle = self.candidate_extractor.extract(selected)
                segmentation = self.segmenter.segment(selected, bundle)
                
                if segmentation.entities:
                    status = SourceProcessingStatus.PROCESSED
                    error_code = None
                elif selected.status is ExtractionStatus.OK:
                    status = SourceProcessingStatus.NO_ENTITY
                    error_code = segmentation.warnings[0] if segmentation.warnings else None
                else:
                    status = SourceProcessingStatus.FAILED
                    error_code = selected.error_code
                    
                report = SourceProcessingReport(
                    source_url=url,
                    status=status,
                    fetch_status=fetch_status,
                    extraction_status=extraction_status,
                    fallback_decision=fallback_decision,
                    entity_count=len(segmentation.entities),
                    error_code=error_code,
                )
                return segmentation, report
            except Exception as error:
                report = SourceProcessingReport(
                    source_url=url,
                    status=SourceProcessingStatus.FAILED,
                    fetch_status="INTERNAL_ERROR",
                    extraction_status="INTERNAL_ERROR",
                    fallback_decision="NOT_RUN",
                    error_code=f"UNEXPECTED_{type(error).__name__.upper()}",
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
        with concurrent.futures.ThreadPoolExecutor(max_workers=min(len(urls), 2) or 1) as executor:
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
