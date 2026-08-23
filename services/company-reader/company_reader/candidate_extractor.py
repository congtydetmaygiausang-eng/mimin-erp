"""Deterministic JT3 candidate extraction with source-bound evidence."""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from urllib.parse import urlsplit, urlunsplit

from .candidate_models import (
    CandidateBundleStatus,
    CandidateField,
    CompanyCandidateBundle,
    EvidenceOrigin,
    FieldCandidate,
)
from .extraction_models import ExtractedDocument, ExtractionStatus


COMPANY_MARKER = re.compile(
    r"\b(?:c[oô]ng\s*ty|cty|tnhh|tr[aá]ch nhiệm hữu hạn|cổ phần|doanh nghiệp|"
    r"nh[aà]\s*m[aá]y|xưởng|hộ kinh doanh|cửa hàng)\b",
    re.IGNORECASE,
)
ARTICLE_TITLE = re.compile(
    r"\b(?:danh sách|top\s*\d+|là gì|ở đâu|bảng giá|giá sỉ|hướng dẫn|quy trình|"
    r"tuyển dụng|tìm việc|các công ty|các cửa hàng|"
    r"công ty.+(?:tại|ở)\s+(?:tp\.?|thành phố|quận|huyện))\b",
    re.IGNORECASE,
)
LEGAL_LABEL = re.compile(
    r"(?:tên pháp lý|tên công ty|tên doanh nghiệp|tên xưởng|tên cửa hàng|tên đại lý|tên nhà máy)\s*(?:[:#-]|\|)\s*([^\n|]{3,220})",
    re.IGNORECASE,
)
LEGAL_INLINE = re.compile(
    r"\b((?:C[Ôô]NG\s+TY|CTY|XƯỞNG|CỬA\s+HÀNG|NHÀ\s+MÁY|DOANH\s+NGHIỆP|HỘ\s+KINH\s+DOANH|ĐẠI\s+LÝ|TỔNG\s+KHO|KHO)\s+(?:(?:TNHH|CP|CỔ\s+PHẦN|TRÁCH\s+NHIỆM\s+HỮU\s+HẠN|"
    r"MỘT\s+THÀNH\s+VIÊN)\s+)?[^\n|;]{2,180})",
    re.IGNORECASE,
)
TAX_CODE = re.compile(
    r"(?:mã số thuế|mã\s*thuế|mst|tax\s*code)\s*(?:[:#-]|\|)?\s*(\d{10}(?:[-\s]?\d{3})?)",
    re.IGNORECASE,
)
PHONE_LABEL = re.compile(
    r"(?:điện thoại|hotline|phone|telephone|tel|liên hệ|call|sđt|sdt|zalo|di động|mobile)\s*(?:[:#-]|\|)?\s*([^\n|<>]{8,120})",
    re.IGNORECASE,
)
PHONE = re.compile(r"(?<!\d)(?:\+?84|0)(?:[\s().-]*\d){8,10}(?!\d)")
EMAIL = re.compile(r"(?<![\w.+-])([\w.+-]+@[\w.-]+\.[A-Za-z]{2,24})(?![\w.-])")
WEBSITE_LABEL = re.compile(
    r"(?:website|trang web)\s*[:#-]?\s*((?:https?://|www\.)[^\s|<>]+)",
    re.IGNORECASE,
)
ADDRESS_LABEL = re.compile(
    r"(?:địa chỉ(?: thuế)?|trụ sở(?: chính)?|văn phòng|nhà máy|xưởng)\s*(?:[:#-]|\|)\s*([^\n|]{8,320})",
    re.IGNORECASE,
)
INTRO_LABEL = re.compile(
    r"(?:giới thiệu(?: công ty| doanh nghiệp)?|về chúng tôi|tổng quan)\s*[:#-]?\s*([^\n]{30,1200})",
    re.IGNORECASE,
)
ADMIN_MARKER = re.compile(
    r"\b(?:phường|xã|quận|huyện|thành phố|tỉnh|thị xã|thị trấn|tp\.?\s*hcm)\b",
    re.IGNORECASE,
)
ROUTE_MARKER = re.compile(
    r"\b(?:đường|phố|ấp|thôn|khu phố|khu công nghiệp|kcn|cụm công nghiệp|lô|tổ)\b",
    re.IGNORECASE,
)
ADDRESS_PROSE = re.compile(
    r"\b(?:cập nhật gần nhất|ngành\s*:|tình trạng|là một trong|sản phẩm|giá thành|"
    r"ưu điểm|nhược điểm|quy trình|chuyên sản xuất|chuyên nhập khẩu|hàng đầu|"
    r"thuế cơ sở|cơ quan thuế|quản lý bởi)\b",
    re.IGNORECASE,
)
STOP_LABEL = re.compile(
    r"\s+(?:tình trạng|tên quốc tế|người đại diện|điện thoại|hotline|email|website|"
    r"facebook|mã số thuế|mst|ngành nghề)\s*[:#-]?",
    re.IGNORECASE,
)
GENERIC_LEGAL_TYPE = re.compile(
    r"^(?:cong ty )?(?:tnhh|trach nhiem huu han|co phan|doanh nghiep tu nhan)"
    r"(?: mot thanh vien)?(?: ngoai nn|ngoai nha nuoc|nha nuoc|tu nhan)?$",
    re.IGNORECASE,
)
TABLE_CELL = re.compile(r"(?:(?<=\|)|^)\s*([^|\n]+?)\s*(?=\||$)")


@dataclass(frozen=True, slots=True)
class CompanyCandidateExtractor:
    max_per_field: int = 10
    excerpt_radius: int = 140

    def extract(self, document: ExtractedDocument) -> CompanyCandidateBundle:
        if document.status != ExtractionStatus.OK or not document.main_text:
            return CompanyCandidateBundle(
                source_url=document.source_url,
                text_sha256=document.text_sha256,
                status=CandidateBundleStatus.SKIPPED_EXTRACTION_ERROR,
                warnings=(f"JT2 status={document.status.value}",),
            )

        text = document.main_text
        candidates: list[FieldCandidate] = []
        candidates.extend(self._legal_names(document, text))
        tax_codes = self._tax_codes(document, text)
        candidates.extend(tax_codes)
        candidates.extend(self._addresses(document, text))
        candidates.extend(self._phones(document, text, {item.normalized_value for item in tax_codes}))
        candidates.extend(self._emails(document, text))
        candidates.extend(self._websites(document, text))
        candidates.extend(self._introductions(document, text))
        candidates = self._deduplicate(candidates)

        legal_names = {
            item.normalized_value
            for item in candidates
            if item.field == CandidateField.LEGAL_NAME
        }
        distinct_tax_codes = {
            item.normalized_value
            for item in candidates
            if item.field == CandidateField.TAX_CODE
        }
        list_like_title = bool(document.title and ARTICLE_TITLE.search(document.title))
        multi_entity = (
            len(distinct_tax_codes) >= 2
            or len(legal_names) >= 2
            or (list_like_title and len(legal_names) >= 1)
        )
        has_identity = bool(legal_names or distinct_tax_codes)
        if multi_entity:
            status = CandidateBundleStatus.MULTI_ENTITY_REVIEW
            warnings = ("MULTIPLE_COMPANY_IDENTITIES", "DO_NOT_MERGE_FIELDS_AUTOMATICALLY")
        elif has_identity:
            status = CandidateBundleStatus.OK
            warnings = ()
        else:
            status = CandidateBundleStatus.NO_IDENTITY
            warnings = ("NO_STRONG_COMPANY_IDENTITY",)
        return CompanyCandidateBundle(
            source_url=document.source_url,
            text_sha256=document.text_sha256,
            status=status,
            candidates=tuple(candidates),
            distinct_legal_names=len(legal_names),
            distinct_tax_codes=len(distinct_tax_codes),
            multi_entity=multi_entity,
            warnings=warnings,
        )

    def _legal_names(self, document: ExtractedDocument, text: str) -> list[FieldCandidate]:
        result: list[FieldCandidate] = []
        for pattern, confidence, label in (
            (LEGAL_LABEL, 0.97, "EXPLICIT_LEGAL_NAME_LABEL"),
            (LEGAL_INLINE, 0.84, "BUSINESS_NAME_PATTERN"),
        ):
            for match in pattern.finditer(text):
                value = self._clean_legal_name(match.group(1))
                if value:
                    result.append(self._candidate(
                        document, CandidateField.LEGAL_NAME, value,
                        self._identity_key(value), confidence, EvidenceOrigin.MAIN_TEXT,
                        text, match.start(1), match.end(1), (label,),
                    ))
        title = self._clean_legal_name(document.title or "")
        if title:
            result.append(self._candidate(
                document, CandidateField.LEGAL_NAME, title, self._identity_key(title),
                0.72, EvidenceOrigin.METADATA_TITLE, document.title or title,
                None, None, ("METADATA_TITLE",), ("UNVERIFIED_METADATA",),
            ))
        return result

    def _tax_codes(self, document: ExtractedDocument, text: str) -> list[FieldCandidate]:
        result = [
            self._candidate(
                document, CandidateField.TAX_CODE, match.group(1),
                self._normalize_tax_code(match.group(1)), 0.99,
                EvidenceOrigin.MAIN_TEXT, text, match.start(1), match.end(1),
                ("EXPLICIT_TAX_CODE_LABEL",),
            )
            for match in TAX_CODE.finditer(text)
        ]
        url_tax_code = self._tax_code_from_url(document.source_url)
        if url_tax_code:
            for match in re.finditer(rf"(?<!\d){re.escape(url_tax_code)}(?!\d)", text):
                result.append(self._candidate(
                    document, CandidateField.TAX_CODE, match.group(0), url_tax_code,
                    0.98, EvidenceOrigin.MAIN_TEXT, text, match.start(), match.end(),
                    ("SOURCE_URL_TAX_CODE_MATCH", "STANDALONE_IDENTITY_VALUE"),
                ))
        return result

    def _addresses(self, document: ExtractedDocument, text: str) -> list[FieldCandidate]:
        result: list[FieldCandidate] = []
        for match in ADDRESS_LABEL.finditer(text):
            value = self._clean_address(match.group(1))
            if not self._is_postal_address(value):
                continue
            start = match.start(1)
            end = start + len(value)
            result.append(self._candidate(
                document, CandidateField.ADDRESS, value, self._address_key(value),
                0.91, EvidenceOrigin.MAIN_TEXT, text, start, end,
                ("EXPLICIT_ADDRESS_LABEL", "POSTAL_STRUCTURE"),
            ))
        for value, start, end in self._table_cells(text):
            cleaned = self._clean_address(value)
            if not self._is_postal_address(cleaned):
                continue
            result.append(self._candidate(
                document, CandidateField.ADDRESS, cleaned, self._address_key(cleaned),
                0.82, EvidenceOrigin.MAIN_TEXT, text, start, start + len(cleaned),
                ("TABLE_CELL_VALUE", "POSTAL_STRUCTURE"),
            ))
        return result

    def _phones(
        self,
        document: ExtractedDocument,
        text: str,
        tax_codes: set[str],
    ) -> list[FieldCandidate]:
        result: list[FieldCandidate] = []
        tax_digits = {value.replace("-", "") for value in tax_codes}
        for segment in PHONE_LABEL.finditer(text):
            for match in PHONE.finditer(segment.group(1)):
                normalized = self._normalize_vietnam_phone(match.group(0))
                if not normalized or normalized in tax_digits:
                    continue
                start = segment.start(1) + match.start()
                end = segment.start(1) + match.end()
                result.append(self._candidate(
                    document, CandidateField.PHONE, match.group(0).strip(), normalized,
                    0.94, EvidenceOrigin.MAIN_TEXT, text, start, end,
                    ("EXPLICIT_CONTACT_LABEL", "VALID_VN_PHONE"),
                ))
        for value, start, end in self._table_cells(text):
            compact = re.sub(r"\s+", "", value)
            if not PHONE.fullmatch(compact):
                continue
            normalized = self._normalize_vietnam_phone(compact)
            if not normalized or normalized in tax_digits:
                continue
            result.append(self._candidate(
                document, CandidateField.PHONE, value.strip(), normalized,
                0.78, EvidenceOrigin.MAIN_TEXT, text, start, end,
                ("TABLE_CELL_VALUE", "VALID_VN_PHONE"),
            ))
        return result

    def _emails(self, document: ExtractedDocument, text: str) -> list[FieldCandidate]:
        return [
            self._candidate(
                document, CandidateField.EMAIL, match.group(1), match.group(1).lower(),
                0.90, EvidenceOrigin.MAIN_TEXT, text, match.start(1), match.end(1),
                ("EMAIL_SYNTAX",),
            )
            for match in EMAIL.finditer(text)
        ]

    def _websites(self, document: ExtractedDocument, text: str) -> list[FieldCandidate]:
        result: list[FieldCandidate] = []
        for match in WEBSITE_LABEL.finditer(text):
            normalized = self._normalize_website(match.group(1))
            if not normalized:
                continue
            result.append(self._candidate(
                document, CandidateField.WEBSITE, match.group(1).rstrip(".,;)") , normalized,
                0.88, EvidenceOrigin.MAIN_TEXT, text, match.start(1), match.end(1),
                ("EXPLICIT_WEBSITE_LABEL",),
            ))
        return result

    def _introductions(self, document: ExtractedDocument, text: str) -> list[FieldCandidate]:
        result: list[FieldCandidate] = []
        for match in INTRO_LABEL.finditer(text):
            value = self._compact(match.group(1), 1_000)
            result.append(self._candidate(
                document, CandidateField.INTRODUCTION, value, value,
                0.80, EvidenceOrigin.MAIN_TEXT, text, match.start(1), match.start(1) + len(value),
                ("INTRODUCTION_LABEL",),
            ))
        if not result and document.description and len(document.description) >= 30:
            value = self._compact(document.description, 1_000)
            result.append(self._candidate(
                document, CandidateField.INTRODUCTION, value, value, 0.62,
                EvidenceOrigin.METADATA_DESCRIPTION, document.description,
                None, None, ("METADATA_DESCRIPTION",), ("UNVERIFIED_METADATA",),
            ))
        return result

    def _candidate(
        self,
        document: ExtractedDocument,
        field: CandidateField,
        value: str,
        normalized: str,
        confidence: float,
        origin: EvidenceOrigin,
        source_text: str,
        start: int | None,
        end: int | None,
        labels: tuple[str, ...],
        warnings: tuple[str, ...] = (),
    ) -> FieldCandidate:
        if start is None or end is None:
            excerpt = self._compact(source_text, 500)
        else:
            excerpt_start = max(0, start - self.excerpt_radius)
            excerpt_end = min(len(source_text), end + self.excerpt_radius)
            excerpt = self._compact(source_text[excerpt_start:excerpt_end], 500)
        return FieldCandidate(
            field=field,
            value=value,
            normalized_value=normalized,
            confidence=round(confidence, 2),
            origin=origin,
            source_url=document.source_url,
            text_sha256=document.text_sha256,
            excerpt=excerpt,
            start=start,
            end=end,
            labels=labels,
            warnings=warnings,
        )

    def _deduplicate(self, candidates: list[FieldCandidate]) -> list[FieldCandidate]:
        best: dict[tuple[CandidateField, str], FieldCandidate] = {}
        for candidate in candidates:
            key = (candidate.field, candidate.normalized_value)
            previous = best.get(key)
            if previous is None or candidate.confidence > previous.confidence:
                best[key] = candidate
        counts: dict[CandidateField, int] = {}
        result: list[FieldCandidate] = []
        for candidate in sorted(
            best.values(),
            key=lambda item: (-item.confidence, item.start if item.start is not None else 10**9),
        ):
            count = counts.get(candidate.field, 0)
            if count >= self.max_per_field:
                continue
            counts[candidate.field] = count + 1
            result.append(candidate)
        return result

    @classmethod
    def _clean_legal_name(cls, value: str) -> str:
        text = cls._compact(value, 220)
        text = re.sub(r"^\d{10}(?:-\d{3})?\s*[-–—|:]\s*", "", text)
        # Lowercase prose after a displayed name is not part of the legal entity.
        text = re.split(
            r"\s+(?:chuyên|cung cấp|hoạt động|là đơn vị|có trụ sở)\s+",
            text,
            maxsplit=1,
        )[0]
        text = re.split(
            r"\s+(?:ngành|địa chỉ|mã số thuế|mst|điện thoại|hotline|website)\s*[:#-]",
            text,
            maxsplit=1,
            flags=re.IGNORECASE,
        )[0]
        text = cls._compact(text, 200)
        if not text or len(text) < 3 or ARTICLE_TITLE.search(text):
            return ""
        if len(text.split()) > 24 or not COMPANY_MARKER.search(text):
            return ""
        identity_tail = re.sub(
            r"\b(?:cong ty|cty|tnhh|cp|co phan|trach nhiem huu han|mot thanh vien)\b",
            " ",
            cls._identity_key(text),
        )
        if not re.search(r"[a-z0-9]{2,}", identity_tail):
            return ""
        if GENERIC_LEGAL_TYPE.fullmatch(cls._identity_key(text)):
            return ""
        return text

    @classmethod
    def _table_cells(cls, text: str) -> list[tuple[str, int, int]]:
        cells: list[tuple[str, int, int]] = []
        for match in TABLE_CELL.finditer(text):
            value = cls._compact(match.group(1), 320)
            if not value or re.fullmatch(r"[-: ]+", value):
                continue
            cells.append((value, match.start(1), match.end(1)))
        return cells

    @staticmethod
    def _tax_code_from_url(source_url: str) -> str:
        match = re.search(r"(?:^|/)(\d{10})(?:[-/?#]|$)", source_url)
        return match.group(1) if match else ""

    @classmethod
    def _clean_address(cls, value: str) -> str:
        text = STOP_LABEL.split(value, maxsplit=1)[0]
        return cls._compact(text, 260)

    @staticmethod
    def _is_postal_address(value: str) -> bool:
        if not value or ADDRESS_PROSE.search(value):
            return False
        has_number = bool(re.search(r"(?:^|[\s,])(?:số\s*)?\d{1,5}(?:[/-][A-Za-z0-9]+)*", value))
        admin_count = len(ADMIN_MARKER.findall(value))
        return has_number and (admin_count >= 2 or (admin_count >= 1 and bool(ROUTE_MARKER.search(value))))

    @staticmethod
    def _normalize_tax_code(value: str) -> str:
        digits = re.sub(r"\D", "", value)
        return f"{digits[:10]}-{digits[10:]}" if len(digits) == 13 else digits

    @staticmethod
    def _normalize_vietnam_phone(value: str) -> str:
        digits = re.sub(r"\D", "", value)
        if digits.startswith("84") and len(digits) >= 11:
            digits = f"0{digits[2:]}"
        if re.fullmatch(r"(?:03|05|07|08|09)\d{8}", digits):
            return digits
        if re.fullmatch(r"02\d{8,9}", digits):
            return digits
        if re.fullmatch(r"(?:1800|1900)\d{4,6}", digits):
            return digits
        return ""

    @staticmethod
    def _normalize_website(value: str) -> str:
        cleaned = value.strip().rstrip(".,;)")
        if cleaned.lower().startswith("www."):
            cleaned = f"https://{cleaned}"
        parsed = urlsplit(cleaned)
        if (
            parsed.scheme.lower() not in {"http", "https"}
            or not parsed.hostname
            or parsed.username is not None
            or parsed.password is not None
        ):
            return ""
        hostname = parsed.hostname.lower().rstrip(".")
        netloc = hostname
        try:
            if parsed.port:
                netloc = f"{hostname}:{parsed.port}"
        except ValueError:
            return ""
        return urlunsplit((parsed.scheme.lower(), netloc, parsed.path or "/", parsed.query, ""))

    @staticmethod
    def _identity_key(value: str) -> str:
        normalized = unicodedata.normalize("NFD", value.casefold())
        without_marks = "".join(character for character in normalized if unicodedata.category(character) != "Mn")
        without_marks = without_marks.replace("đ", "d")
        return re.sub(r"[^a-z0-9]+", " ", without_marks).strip()

    @classmethod
    def _address_key(cls, value: str) -> str:
        normalized = cls._identity_key(value)
        normalized = re.sub(r"\btp\s*(?:hcm|ho chi minh)\b", "thanh pho ho chi minh", normalized)
        return re.sub(r"\s+", " ", normalized).strip()

    @staticmethod
    def _compact(value: str, maximum: int) -> str:
        return re.sub(r"\s+", " ", value).strip(" \t\r\n,;:|-–—")[:maximum]
