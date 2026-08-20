"""Local-only caller used to exercise Company Reader without touching MIMIN ERP."""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.request
from dataclasses import dataclass
from urllib.parse import urlsplit


LOCAL_HOSTS = frozenset({"127.0.0.1", "localhost", "::1"})
REQUEST_ID = re.compile(r"^[A-Za-z0-9_-]{8,64}$")


@dataclass(frozen=True, slots=True)
class ShadowProbeResult:
    status_code: int
    payload: dict[str, object]


def _local_service_url(value: str) -> str:
    parsed = urlsplit(value.strip())
    if parsed.scheme != "http" or parsed.hostname not in LOCAL_HOSTS or not parsed.port:
        raise ValueError("service URL must be an explicit local HTTP endpoint")
    if parsed.username or parsed.password or parsed.query or parsed.fragment:
        raise ValueError("service URL must not contain credentials, query, or fragment")
    return value.rstrip("/")


def send_shadow_probe(
    *,
    service_url: str,
    service_token: str,
    request_id: str,
    urls: tuple[str, ...],
    timeout_seconds: float = 30.0,
) -> ShadowProbeResult:
    base_url = _local_service_url(service_url)
    if len(service_token) < 32:
        raise ValueError("service token must contain at least 32 characters")
    if not REQUEST_ID.fullmatch(request_id):
        raise ValueError("invalid request ID")
    if not 1 <= len(urls) <= 5:
        raise ValueError("provide between one and five URLs")

    request = urllib.request.Request(
        f"{base_url}/v1/company-reader/read",
        data=json.dumps({"request_id": request_id, "urls": list(urls)}).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {service_token}",
            "Content-Type": "application/json",
            "X-Mimin-Client": "mimin-local-smoke",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
            status_code = int(response.status)
            body = response.read(65_536)
    except urllib.error.HTTPError as error:
        status_code = int(error.code)
        body = error.read(65_536)
    payload = json.loads(body.decode("utf-8"))
    if not isinstance(payload, dict):
        raise RuntimeError("Company Reader returned an invalid response")
    return ShadowProbeResult(status_code, payload)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Send URLs to local Company Reader shadow mode")
    parser.add_argument("urls", nargs="+", help="One to five public HTTP(S) URLs")
    parser.add_argument("--request-id", default="local_shadow_manual_001")
    parser.add_argument("--service-url", default="http://127.0.0.1:8765")
    args = parser.parse_args(argv)
    token = os.environ.get("COMPANY_READER_SERVICE_TOKEN", "")
    try:
        result = send_shadow_probe(
            service_url=args.service_url,
            service_token=token,
            request_id=args.request_id,
            urls=tuple(args.urls),
        )
    except (OSError, ValueError, RuntimeError, json.JSONDecodeError) as error:
        print(f"Shadow probe failed: {error}", file=sys.stderr)
        return 1
    print(json.dumps(result.payload, ensure_ascii=False, indent=2))
    return 0 if result.status_code in {200, 202, 425} else 1


if __name__ == "__main__":
    raise SystemExit(main())
