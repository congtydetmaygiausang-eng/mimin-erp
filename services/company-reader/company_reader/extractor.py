"""Precision-oriented JT2 adapter around Trafilatura."""

from __future__ import annotations

import hashlib
import importlib
import json
import re
from collections.abc import Callable
from dataclasses import dataclass
from typing import Protocol

from .extraction_models import ExtractedDocument, ExtractionStatus
from .models import FetchEvidence, FetchStatus


class ExtractFunction(Protocol):
    def __call__(self, filecontent: str, **options: object) -> str | None: ...


Loader = Callable[[], tuple[ExtractFunction, str]]
WHITESPACE = re.compile(r"[\t\r\f\v ]+")
BLANK_LINES = re.compile(r"\n{3,}")
METADATA_KEYS = frozenset({"pagetype", "license", "categories", "tags"})


def load_trafilatura() -> tuple[ExtractFunction, str]:
    """Lazy import keeps the service inspectable when optional deps are absent."""
    module = importlib.import_module("trafilatura")
    extract = getattr(module, "extract")
    version = str(getattr(module, "__version__", "unknown"))
    return extract, version


@dataclass(frozen=True, slots=True)
class TrafilaturaExtractor:
    loader: Loader = load_trafilatura
    max_output_chars: int = 200_000
    min_content_chars: int = 40

    def extract(self, evidence: FetchEvidence) -> ExtractedDocument:
        if evidence.status != FetchStatus.OK or evidence.body_text is None:
            return self._failure(
                evidence,
                ExtractionStatus.SKIPPED_FETCH_ERROR,
                "FETCH_NOT_OK",
                f"JT1 status={evidence.status.value}",
            )

        if evidence.content_type == "text/plain":
            text = self._normalize_text(evidence.body_text)
            return self._from_text(evidence, text, "plain-text", "1")

        try:
            extract_function, version = self.loader()
        except (ImportError, AttributeError) as error:
            return self._failure(
                evidence,
                ExtractionStatus.DEPENDENCY_MISSING,
                "TRAFILATURA_UNAVAILABLE",
                str(error),
            )

        try:
            raw_result = extract_function(
                evidence.body_text,
                url=evidence.final_url,
                output_format="json",
                with_metadata=True,
                include_comments=False,
                include_tables=True,
                include_images=False,
                include_links=False,
                deduplicate=True,
                favor_precision=True,
            )
            if raw_result is None:
                return self._empty(evidence, version, "NO_MAIN_CONTENT")
            payload = json.loads(raw_result)
            if not isinstance(payload, dict):
                raise ValueError("Trafilatura output is not an object")
            text = self._normalize_text(self._string(payload.get("text")) or "")
            if len(text) < self.min_content_chars:
                return self._empty(evidence, version, "CONTENT_BELOW_MINIMUM")
            truncated = len(text) > self.max_output_chars
            bounded_text = text[: self.max_output_chars] if truncated else text
            return ExtractedDocument(
                source_url=evidence.final_url,
                fetch_sha256=evidence.body_sha256,
                status=ExtractionStatus.OK,
                extractor="trafilatura",
                extractor_version=version,
                title=self._bounded(payload.get("title"), 500),
                author=self._bounded(payload.get("author"), 300),
                description=self._bounded(payload.get("excerpt"), 1_000),
                published_date=self._bounded(payload.get("date"), 50),
                hostname=self._bounded(
                    payload.get("hostname") or payload.get("source-hostname"), 255
                ),
                language=self._bounded(payload.get("language"), 30),
                main_text=bounded_text,
                text_sha256=self._sha256(bounded_text),
                char_count=len(bounded_text),
                word_count=len(bounded_text.split()),
                truncated=truncated,
                metadata=self._metadata(payload),
            )
        except Exception as error:  # Trafilatura/lxml expose several parser exceptions.
            return self._failure(
                evidence,
                ExtractionStatus.EXTRACTION_ERROR,
                "TRAFILATURA_ERROR",
                str(error),
                version=version,
            )

    def _from_text(
        self,
        evidence: FetchEvidence,
        text: str,
        extractor: str,
        version: str,
    ) -> ExtractedDocument:
        if len(text) < self.min_content_chars:
            return self._empty(evidence, version, "CONTENT_BELOW_MINIMUM", extractor)
        truncated = len(text) > self.max_output_chars
        bounded_text = text[: self.max_output_chars] if truncated else text
        return ExtractedDocument(
            source_url=evidence.final_url,
            fetch_sha256=evidence.body_sha256,
            status=ExtractionStatus.OK,
            extractor=extractor,
            extractor_version=version,
            main_text=bounded_text,
            text_sha256=self._sha256(bounded_text),
            char_count=len(bounded_text),
            word_count=len(bounded_text.split()),
            truncated=truncated,
        )

    def _empty(
        self,
        evidence: FetchEvidence,
        version: str,
        code: str,
        extractor: str = "trafilatura",
    ) -> ExtractedDocument:
        return self._failure(
            evidence,
            ExtractionStatus.EMPTY,
            code,
            "Không tìm thấy nội dung chính đủ dài",
            extractor=extractor,
            version=version,
        )

    @staticmethod
    def _failure(
        evidence: FetchEvidence,
        status: ExtractionStatus,
        code: str,
        detail: str,
        *,
        extractor: str = "trafilatura",
        version: str = "unavailable",
    ) -> ExtractedDocument:
        return ExtractedDocument(
            source_url=evidence.final_url,
            fetch_sha256=evidence.body_sha256,
            status=status,
            extractor=extractor,
            extractor_version=version,
            error_code=code,
            error_detail=detail[:300],
        )

    @staticmethod
    def _normalize_text(value: str) -> str:
        lines = [WHITESPACE.sub(" ", line).strip() for line in value.splitlines()]
        return BLANK_LINES.sub("\n\n", "\n".join(line for line in lines if line)).strip()

    @classmethod
    def _bounded(cls, value: object, maximum: int) -> str | None:
        normalized = cls._normalize_text(cls._string(value) or "")
        return normalized[:maximum] or None

    @staticmethod
    def _string(value: object) -> str | None:
        return value if isinstance(value, str) else None

    @classmethod
    def _metadata(cls, payload: dict[object, object]) -> dict[str, str]:
        result: dict[str, str] = {}
        for key in METADATA_KEYS:
            value = cls._bounded(payload.get(key), 500)
            if value:
                result[key] = value
        return result

    @staticmethod
    def _sha256(text: str) -> str:
        return hashlib.sha256(text.encode("utf-8")).hexdigest()
