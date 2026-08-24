import sys
import re
import json

COMPANY_MARKER = re.compile(
    r"\b(?:c[oô]ng\s*ty|cty|tnhh|tr[aá]ch nhiệm hữu hạn|cổ phần|doanh nghiệp|"
    r"nh[aà]\s*m[aá]y|xưởng|hộ kinh doanh|cửa hàng)\b",
    re.IGNORECASE,
)

def _identity_key(text: str) -> str:
    import unicodedata
    normalized = unicodedata.normalize("NFD", text.lower())
    stripped = "".join(char for char in normalized if not unicodedata.combining(char))
    return stripped.replace("đ", "d")

def _clean_legal_name(value: str) -> str:
    text = " ".join(value.strip().split())
    if len(text.split()) > 24 or not COMPANY_MARKER.search(text):
        return ""
    identity_tail = re.sub(
        r"\b(?:cong ty|cty|tnhh|cp|co phan|trach nhiem huu han|mot thanh vien)\b",
        " ",
        _identity_key(text),
    )
    if not re.search(r"[a-z0-9]{2,}", identity_tail):
        return ""
    return text

text = "Cửa hàng vải Tâm - chuyên cung cấp vải giá tốt tại HCM."
cleaned = _clean_legal_name(text)

with open("test_out.json", "w", encoding="utf-8") as f:
    json.dump({
        "cleaned": cleaned
    }, f, ensure_ascii=False)
