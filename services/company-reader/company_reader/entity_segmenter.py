"""JT4 deterministic company segmentation; never selects final field values."""

from __future__ import annotations

from dataclasses import dataclass, field
from hashlib import sha256

from .candidate_models import (
    CandidateBundleStatus,
    CandidateField,
    CompanyCandidateBundle,
    FieldCandidate,
)
from .extraction_models import ExtractedDocument, ExtractionStatus
from .segmentation_models import (
    EntitySegmentationResult,
    EntitySegment,
    EntitySegmentStatus,
    SegmentationStatus,
)


@dataclass(slots=True)
class _AnchorCluster:
    indices: list[int] = field(default_factory=list)
    start: int = 0
    last_end: int = 0
    legal_names: set[str] = field(default_factory=set)
    tax_codes: set[str] = field(default_factory=set)


class CompanyEntitySegmenter:
    """Separate JT3 candidates using positioned identity anchors.

    Legal name and tax code are identity anchors. A different value of the same
    anchor type always opens a new entity, even when the values are close.
    """

    def __init__(self, identity_merge_window: int = 1_200) -> None:
        if identity_merge_window < 0:
            raise ValueError("identity_merge_window must be non-negative")
        self.identity_merge_window = identity_merge_window

    def segment(
        self,
        document: ExtractedDocument,
        bundle: CompanyCandidateBundle,
    ) -> EntitySegmentationResult:
        candidates = bundle.candidates
        if bundle.status is CandidateBundleStatus.SKIPPED_EXTRACTION_ERROR:
            return self._empty(bundle, SegmentationStatus.SKIPPED_CANDIDATE_ERROR)
        if document.status is not ExtractionStatus.OK or not document.main_text:
            return self._empty(
                bundle,
                SegmentationStatus.SKIPPED_CANDIDATE_ERROR,
                ("JT4_REQUIRES_SUCCESSFUL_JT2_DOCUMENT",),
            )
        if (
            document.source_url != bundle.source_url
            or document.text_sha256 != bundle.text_sha256
        ):
            return self._empty(
                bundle,
                SegmentationStatus.INPUT_MISMATCH,
                ("JT2_JT3_PROVENANCE_MISMATCH",),
            )

        anchors = [
            (index, candidate)
            for index, candidate in enumerate(candidates)
            if candidate.start is not None
            and candidate.field in (CandidateField.LEGAL_NAME, CandidateField.TAX_CODE)
        ]
        anchors.sort(key=lambda item: (item[1].start or 0, item[1].end or 0, item[0]))
        if not anchors:
            return self._empty(
                bundle,
                SegmentationStatus.NO_SEGMENTS,
                ("NO_POSITIONED_IDENTITY_ANCHOR",),
            )

        clusters: list[_AnchorCluster] = []
        for index, candidate in anchors:
            start = candidate.start or 0
            end = candidate.end or start
            normalized = candidate.normalized_value
            current = clusters[-1] if clusters else None
            conflicts = bool(
                current
                and (
                    candidate.field is CandidateField.LEGAL_NAME
                    and current.legal_names
                    and normalized not in current.legal_names
                    or candidate.field is CandidateField.TAX_CODE
                    and current.tax_codes
                    and normalized not in current.tax_codes
                )
            )
            too_far = bool(current and start - current.last_end > self.identity_merge_window)
            if current is None or conflicts or too_far:
                current = _AnchorCluster(start=start, last_end=end)
                clusters.append(current)
            current.indices.append(index)
            current.last_end = max(current.last_end, end)
            if candidate.field is CandidateField.LEGAL_NAME:
                current.legal_names.add(normalized)
            else:
                current.tax_codes.add(normalized)

        assignments: list[list[int]] = [list(cluster.indices) for cluster in clusters]
        assigned = {index for group in assignments for index in group}
        unresolved: list[int] = []
        for index, candidate in enumerate(candidates):
            if index in assigned:
                continue
            target = self._target_cluster(candidate, clusters)
            if target is None:
                unresolved.append(index)
            else:
                assignments[target].append(index)
                assigned.add(index)

        entities = tuple(
            self._build_entity(
                bundle=bundle,
                cluster=cluster,
                indices=assignments[position],
                position=position,
                end=(clusters[position + 1].start if position + 1 < len(clusters) else len(document.main_text)),
            )
            for position, cluster in enumerate(clusters)
        )
        status = (
            SegmentationStatus.SINGLE_ENTITY
            if len(entities) == 1
            else SegmentationStatus.MULTI_ENTITY
        )
        return EntitySegmentationResult(
            source_url=bundle.source_url,
            text_sha256=bundle.text_sha256,
            status=status,
            entities=entities,
            unresolved_candidates=tuple(candidates[index] for index in unresolved),
            input_candidate_count=len(candidates),
            assigned_candidate_count=sum(len(entity.candidates) for entity in entities),
            warnings=(("UNRESOLVED_CANDIDATES_PRESENT",) if unresolved else ()),
        )

    def _target_cluster(
        self,
        candidate: FieldCandidate,
        clusters: list[_AnchorCluster],
    ) -> int | None:
        if candidate.start is not None:
            eligible = [index for index, cluster in enumerate(clusters) if cluster.start <= candidate.start]
            return eligible[-1] if eligible else None
        if len(clusters) == 1:
            return 0
        if candidate.field is CandidateField.LEGAL_NAME:
            matches = [
                index
                for index, cluster in enumerate(clusters)
                if candidate.normalized_value in cluster.legal_names
            ]
            return matches[0] if len(matches) == 1 else None
        return None

    def _build_entity(
        self,
        bundle: CompanyCandidateBundle,
        cluster: _AnchorCluster,
        indices: list[int],
        position: int,
        end: int,
    ) -> EntitySegment:
        ordered = sorted(
            (bundle.candidates[index] for index in indices),
            key=lambda item: (item.start is None, item.start or 0, item.field.value, -item.confidence),
        )
        names = tuple(sorted({item.normalized_value for item in ordered if item.field is CandidateField.LEGAL_NAME}))
        taxes = tuple(sorted({item.normalized_value for item in ordered if item.field is CandidateField.TAX_CODE}))
        if len(names) > 1 or len(taxes) > 1:
            segment_status = EntitySegmentStatus.REVIEW_REQUIRED
        elif len(taxes) == 1:
            segment_status = EntitySegmentStatus.STRONG_IDENTITY
        else:
            segment_status = EntitySegmentStatus.WEAK_IDENTITY
        identity = "|".join((bundle.source_url or "", bundle.text_sha256 or "", str(position), *names, *taxes))
        return EntitySegment(
            entity_id=f"ENT-{sha256(identity.encode('utf-8')).hexdigest()[:16]}",
            start=cluster.start,
            end=max(cluster.start, end),
            status=segment_status,
            candidates=tuple(ordered),
            legal_names=names,
            tax_codes=taxes,
            strong_keys=tuple(f"TAX_CODE:{tax}" for tax in taxes),
            warnings=(("IDENTITY_CONFLICT_INSIDE_SEGMENT",) if segment_status is EntitySegmentStatus.REVIEW_REQUIRED else ()),
        )

    @staticmethod
    def _empty(
        bundle: CompanyCandidateBundle,
        status: SegmentationStatus,
        warnings: tuple[str, ...] = (),
    ) -> EntitySegmentationResult:
        return EntitySegmentationResult(
            source_url=bundle.source_url,
            text_sha256=bundle.text_sha256,
            status=status,
            unresolved_candidates=bundle.candidates,
            input_candidate_count=len(bundle.candidates),
            assigned_candidate_count=0,
            warnings=warnings,
        )
