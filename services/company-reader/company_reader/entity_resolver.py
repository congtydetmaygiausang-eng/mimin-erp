"""JT5 deterministic cross-source entity resolution with fail-closed conflicts."""

from __future__ import annotations

from hashlib import sha256
from urllib.parse import urlsplit

from .candidate_models import CandidateField
from .resolution_models import (
    CompanyResolutionResult,
    EntityReference,
    PairResolution,
    ResolutionDecision,
    ResolvedCompanyGroup,
)
from .segmentation_models import EntitySegmentationResult, EntitySegment


UNTRUSTED_IDENTITY_HOSTS = frozenset({
    "facebook.com", "instagram.com", "linkedin.com", "masothue.com",
    "tratencongty.com", "yellowpages.vn", "trangvangvietnam.com",
    "youtube.com", "zalo.me",
})


class CompanyEntityResolver:
    """Resolve JT4 entities without inventing or selecting final field values."""

    def resolve(
        self,
        inputs: tuple[EntitySegmentationResult, ...],
    ) -> CompanyResolutionResult:
        references: list[EntityReference] = []
        unresolved = []
        warnings: list[str] = []
        seen_ids: set[str] = set()
        for result in inputs:
            unresolved.extend(result.unresolved_candidates)
            for entity in result.entities:
                entity_id = entity.entity_id
                if entity_id in seen_ids:
                    warnings.append(f"DUPLICATE_ENTITY_ID:{entity_id}")
                    entity_id = self._derived_duplicate_id(entity_id, result.source_url, len(references))
                seen_ids.add(entity_id)
                references.append(self._reference(entity_id, result.source_url, result.text_sha256, entity))

        parents = list(range(len(references)))

        def root(index: int) -> int:
            while parents[index] != index:
                parents[index] = parents[parents[index]]
                index = parents[index]
            return index

        def members(index: int) -> list[int]:
            target = root(index)
            return [item for item in range(len(references)) if root(item) == target]

        pair_resolutions: list[PairResolution] = []
        for left in range(len(references)):
            for right in range(left + 1, len(references)):
                decision = self._compare(references[left], references[right])
                if decision.decision is ResolutionDecision.AUTO_MERGED:
                    left_members = members(left)
                    right_members = members(right)
                    tax_conflict = self._group_tax_conflict(references, left_members, right_members)
                    if tax_conflict:
                        decision = PairResolution(
                            references[left].entity_id,
                            references[right].entity_id,
                            ResolutionDecision.CONFLICT_BLOCKED,
                            decision.matched_keys,
                            (tax_conflict,),
                            ("TRANSITIVE_TAX_CODE_CONFLICT_BLOCKS_MERGE",),
                        )
                    else:
                        left_root, right_root = root(left), root(right)
                        if left_root != right_root:
                            parents[right_root] = left_root
                pair_resolutions.append(decision)

        grouped: dict[int, list[EntityReference]] = {}
        for index, reference in enumerate(references):
            grouped.setdefault(root(index), []).append(reference)
        groups = tuple(self._group(items) for _, items in sorted(grouped.items()))
        return CompanyResolutionResult(
            groups=groups,
            pair_resolutions=tuple(pair_resolutions),
            unresolved_candidates=tuple(unresolved),
            input_entity_count=len(references),
            output_member_count=sum(len(group.members) for group in groups),
            warnings=tuple(sorted(set(warnings))),
        )

    def _reference(
        self,
        entity_id: str,
        source_url: str | None,
        text_sha256: str | None,
        entity: EntitySegment,
    ) -> EntityReference:
        values = lambda field: tuple(sorted({
            candidate.normalized_value
            for candidate in entity.candidates
            if candidate.field is field
        }))
        source_host = self._host(source_url)
        domains = {
            host
            for candidate in entity.candidates
            if candidate.field is CandidateField.WEBSITE
            for host in [self._host(candidate.normalized_value)]
            if host and host == source_host and not self._untrusted_host(host)
        }
        return EntityReference(
            entity_id=entity_id,
            source_url=source_url,
            text_sha256=text_sha256,
            legal_names=entity.legal_names,
            tax_codes=entity.tax_codes,
            official_domains=tuple(sorted(domains)),
            phones=values(CandidateField.PHONE),
            addresses=values(CandidateField.ADDRESS),
        )

    def _compare(self, left: EntityReference, right: EntityReference) -> PairResolution:
        left_tax, right_tax = set(left.tax_codes), set(right.tax_codes)
        tax_matches = left_tax & right_tax
        tax_conflict = bool(left_tax and right_tax and not tax_matches)
        domain_matches = set(left.official_domains) & set(right.official_domains)
        phone_matches = set(left.phones) & set(right.phones)
        name_matches = set(left.legal_names) & set(right.legal_names)
        address_matches = set(left.addresses) & set(right.addresses)
        matched = tuple(sorted(
            [*(f"TAX_CODE:{value}" for value in tax_matches),
             *(f"OFFICIAL_DOMAIN:{value}" for value in domain_matches),
             *(f"PHONE:{value}" for value in phone_matches),
             *(f"LEGAL_NAME:{value}" for value in name_matches),
             *(f"ADDRESS:{value}" for value in address_matches)]
        ))
        if tax_conflict:
            conflict = f"TAX_CODE:{','.join(sorted(left_tax))}!={','.join(sorted(right_tax))}"
            return PairResolution(left.entity_id, right.entity_id, ResolutionDecision.CONFLICT_BLOCKED, matched, (conflict,), ("DISTINCT_TAX_CODES_NEVER_MERGE",))
        if tax_matches:
            return PairResolution(left.entity_id, right.entity_id, ResolutionDecision.AUTO_MERGED, matched, reasons=("EXACT_TAX_CODE_MATCH",))
        if domain_matches:
            return PairResolution(left.entity_id, right.entity_id, ResolutionDecision.AUTO_MERGED, matched, reasons=("EXACT_OFFICIAL_DOMAIN_MATCH",))
        if phone_matches and (name_matches or address_matches):
            return PairResolution(left.entity_id, right.entity_id, ResolutionDecision.REVIEW_REQUIRED, matched, reasons=("PHONE_REQUIRES_SECONDARY_IDENTITY_REVIEW",))
        return PairResolution(left.entity_id, right.entity_id, ResolutionDecision.STANDALONE, matched, reasons=("NO_STRONG_SHARED_KEY",))

    @staticmethod
    def _group_tax_conflict(
        references: list[EntityReference],
        left_members: list[int],
        right_members: list[int],
    ) -> str | None:
        left = {tax for index in left_members for tax in references[index].tax_codes}
        right = {tax for index in right_members for tax in references[index].tax_codes}
        if left and right and not left & right:
            return f"TAX_CODE:{','.join(sorted(left))}!={','.join(sorted(right))}"
        return None

    @staticmethod
    def _group(members: list[EntityReference]) -> ResolvedCompanyGroup:
        ordered = tuple(sorted(members, key=lambda item: item.entity_id))
        keys = sorted({
            *(f"TAX_CODE:{value}" for member in ordered for value in member.tax_codes),
            *(f"OFFICIAL_DOMAIN:{value}" for member in ordered for value in member.official_domains),
        })
        identity = "|".join(member.entity_id for member in ordered)
        return ResolvedCompanyGroup(
            group_id=f"GRP-{sha256(identity.encode('utf-8')).hexdigest()[:16]}",
            decision=(ResolutionDecision.AUTO_MERGED if len(ordered) > 1 else ResolutionDecision.STANDALONE),
            members=ordered,
            strong_keys=tuple(keys),
        )

    @staticmethod
    def _host(value: str | None) -> str | None:
        if not value:
            return None
        candidate = value if "://" in value else f"https://{value}"
        try:
            host = (urlsplit(candidate).hostname or "").lower().rstrip(".")
        except ValueError:
            return None
        return host.removeprefix("www.") or None

    @staticmethod
    def _untrusted_host(host: str) -> bool:
        return any(host == blocked or host.endswith(f".{blocked}") for blocked in UNTRUSTED_IDENTITY_HOSTS)

    @staticmethod
    def _derived_duplicate_id(entity_id: str, source_url: str | None, position: int) -> str:
        value = f"{entity_id}|{source_url or ''}|{position}"
        return f"ENT-{sha256(value.encode('utf-8')).hexdigest()[:16]}"
