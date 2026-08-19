"""JT0 corpus validator. Chỉ dùng Python standard library, không gọi mạng."""

from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parent
FIXTURE = ROOT / "fixtures" / "golden-cases.json"
ALLOWED_CATEGORIES = {
    "REGISTRY_PROFILE",
    "OFFICIAL_WEBSITE",
    "MULTI_COMPANY_SOURCE",
    "NOISE_OR_BLOCKED",
    "CONFLICT_OR_PARTIAL",
    "FETCH_LIMITED",
}
ALLOWED_OUTCOMES = {"COMPANY", "SOURCE_ONLY", "REJECT", "FETCH_LIMITED"}
ALLOWED_REVIEW = {"APPROVED", "PENDING_REVIEW"}
ALLOWED_STRONG_KEYS = {"TAX_CODE", "OFFICIAL_DOMAIN", "PHONE", None}
TAX_CODE = re.compile(r"^\d{10}(?:-\d{3})?$")
CASE_ID = re.compile(r"^JT0-[A-Z]+-\d{3}$")
PLACEHOLDER = re.compile(r"(?:TODO|TBD|CHUA DIEN|PLACEHOLDER)", re.IGNORECASE)


def fail(errors: list[str], case_id: str, message: str) -> None:
    errors.append(f"{case_id}: {message}")


def validate_case(case: object, errors: list[str]) -> None:
    if not isinstance(case, dict):
        errors.append("Fixture chứa phần tử không phải object")
        return
    case_id = str(case.get("id", "<missing-id>"))
    required = {
        "id", "category", "url", "expectedOutcome", "reviewStatus",
        "expected", "mustNotContain", "reviewedAt", "reviewedBy", "reviewNote",
    }
    missing = sorted(required - case.keys())
    if missing:
        fail(errors, case_id, f"thiếu trường {', '.join(missing)}")
        return
    if not CASE_ID.fullmatch(case_id):
        fail(errors, case_id, "ID không đúng định dạng")
    if case["category"] not in ALLOWED_CATEGORIES:
        fail(errors, case_id, "category không hợp lệ")
    if case["expectedOutcome"] not in ALLOWED_OUTCOMES:
        fail(errors, case_id, "expectedOutcome không hợp lệ")
    if case["reviewStatus"] not in ALLOWED_REVIEW:
        fail(errors, case_id, "reviewStatus không hợp lệ")
    parsed = urlparse(str(case["url"]))
    if (
        parsed.scheme != "https"
        or not parsed.hostname
        or any(character.isspace() for character in str(case["url"]))
    ):
        fail(errors, case_id, "URL phải là HTTPS tuyệt đối")
    expected = case["expected"]
    if not isinstance(expected, dict):
        fail(errors, case_id, "expected phải là object")
        return
    tax_code = expected.get("taxCode")
    if tax_code is not None and not TAX_CODE.fullmatch(str(tax_code)):
        fail(errors, case_id, "MST kỳ vọng không hợp lệ")
    if expected.get("strongKey") not in ALLOWED_STRONG_KEYS:
        fail(errors, case_id, "strongKey không hợp lệ")
    if case["expectedOutcome"] == "COMPANY" and not expected.get("strongKey"):
        fail(errors, case_id, "COMPANY phải có khóa mạnh")
    if case["expectedOutcome"] != "COMPANY" and expected.get("strongKey"):
        fail(errors, case_id, "ca không phải COMPANY không được đánh dấu khóa mạnh")
    if case["reviewStatus"] == "APPROVED":
        if not case["reviewedAt"] or not case["reviewedBy"]:
            fail(errors, case_id, "APPROVED phải có người và ngày duyệt")
        serialized = json.dumps(case, ensure_ascii=False)
        if PLACEHOLDER.search(serialized):
            fail(errors, case_id, "APPROVED còn placeholder")
    if not isinstance(case["mustNotContain"], list):
        fail(errors, case_id, "mustNotContain phải là array")
    if len(str(case["reviewNote"]).strip()) < 5:
        fail(errors, case_id, "reviewNote quá ngắn")


def main() -> int:
    # Windows CI/local shells may default to cp1252; keep Vietnamese diagnostics stable.
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    errors: list[str] = []
    data = json.loads(FIXTURE.read_text(encoding="utf-8"))
    if not isinstance(data, dict) or not isinstance(data.get("cases"), list):
        print("Fixture phải có object gốc và cases[]", file=sys.stderr)
        return 1
    cases = data["cases"]
    if len(cases) != 50:
        errors.append(f"Corpus phải có đúng 50 ca, hiện có {len(cases)}")
    ids = [case.get("id") for case in cases if isinstance(case, dict)]
    duplicates = [key for key, count in Counter(ids).items() if count > 1]
    if duplicates:
        errors.append(f"ID trùng: {duplicates}")
    for case in cases:
        validate_case(case, errors)
    category_counts = Counter(
        case.get("category") for case in cases if isinstance(case, dict)
    )
    expected_counts = {
        "REGISTRY_PROFILE": 10,
        "OFFICIAL_WEBSITE": 10,
        "MULTI_COMPANY_SOURCE": 5,
        "NOISE_OR_BLOCKED": 10,
        "CONFLICT_OR_PARTIAL": 10,
        "FETCH_LIMITED": 5,
    }
    if dict(category_counts) != expected_counts:
        errors.append(
            f"Phân bố category sai: {dict(category_counts)}; cần {expected_counts}"
        )
    if errors:
        print("JT0 golden corpus: FAIL", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1
    approved = sum(case["reviewStatus"] == "APPROVED" for case in cases)
    print(f"JT0 golden corpus: PASS | cases=50 | approved={approved}")
    print("Phân bố:", dict(category_counts))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
