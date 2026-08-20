"""Typed contracts for JT2 clean-content extraction."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from enum import StrEnum
from typing import Any


class ExtractionStatus(StrEnum):
    OK = "OK"
    EMPTY = "EMPTY"
    SKIPPED_FETCH_ERROR = "SKIPPED_FETCH_ERROR"
    DEPENDENCY_MISSING = "DEPENDENCY_MISSING"
    EXTRACTION_ERROR = "EXTRACTION_ERROR"


@dataclass(frozen=True, slots=True)
class ExtractedDocument:
    source_url: str | None
    fetch_sha256: str | None
    status: ExtractionStatus
    extractor: str
    extractor_version: str
    title: str | None = None
    author: str | None = None
    description: str | None = None
    published_date: str | None = None
    hostname: str | None = None
    language: str | None = None
    main_text: str | None = None
    text_sha256: str | None = None
    char_count: int = 0
    word_count: int = 0
    truncated: bool = False
    metadata: dict[str, str] = field(default_factory=dict)
    error_code: str | None = None
    error_detail: str | None = None

    def to_dict(self) -> dict[str, Any]:
        result = asdict(self)
        result["status"] = self.status.value
        return result

