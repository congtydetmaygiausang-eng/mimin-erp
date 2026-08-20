"""Bounded local shadow quality-gate runner."""

from __future__ import annotations

import argparse
import json
import os
import statistics
import sys
import time
from dataclasses import dataclass

from .shadow_probe import send_shadow_probe


@dataclass(frozen=True, slots=True)
class ShadowBatchSummary:
    requested_runs: int
    successful_runs: int
    failed_runs: int
    source_count: int
    profile_count: int
    warning_count: int
    p50_latency_ms: int
    p95_latency_ms: int

    def to_dict(self) -> dict[str, int]:
        return {
            "requested_runs": self.requested_runs,
            "successful_runs": self.successful_runs,
            "failed_runs": self.failed_runs,
            "source_count": self.source_count,
            "profile_count": self.profile_count,
            "warning_count": self.warning_count,
            "p50_latency_ms": self.p50_latency_ms,
            "p95_latency_ms": self.p95_latency_ms,
        }


def _percentile(values: list[float], percentile: float) -> int:
    if not values:
        return 0
    ordered = sorted(values)
    index = min(len(ordered) - 1, max(0, int((len(ordered) - 1) * percentile)))
    return round(ordered[index])


def run_shadow_batch(
    *,
    service_url: str,
    service_token: str,
    urls: tuple[str, ...],
    runs: int,
) -> ShadowBatchSummary:
    if not 1 <= runs <= 10:
        raise ValueError("runs must be between one and ten")
    latencies = []
    successful = failed = sources = profiles = warnings = 0
    stamp = int(time.time())
    for index in range(runs):
        started = time.perf_counter()
        result = send_shadow_probe(
            service_url=service_url,
            service_token=service_token,
            request_id=f"shadow_{stamp}_{index:02d}",
            urls=urls,
            timeout_seconds=30.0,
        )
        latencies.append((time.perf_counter() - started) * 1_000)
        if result.status_code == 202 and result.payload.get("status") == "SHADOW_PROCESSED":
            successful += 1
        else:
            failed += 1
        sources += int(result.payload.get("source_count", 0))
        profiles += int(result.payload.get("profile_count", 0))
        warnings += int(result.payload.get("warning_count", 0))
    return ShadowBatchSummary(
        requested_runs=runs,
        successful_runs=successful,
        failed_runs=failed,
        source_count=sources,
        profile_count=profiles,
        warning_count=warnings,
        p50_latency_ms=round(statistics.median(latencies)) if latencies else 0,
        p95_latency_ms=_percentile(latencies, 0.95),
    )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Run a bounded local Company Reader shadow batch")
    parser.add_argument("urls", nargs="+", help="One to five public HTTP(S) URLs")
    parser.add_argument("--runs", type=int, default=3)
    parser.add_argument("--service-url", default="http://127.0.0.1:8765")
    args = parser.parse_args(argv)
    try:
        summary = run_shadow_batch(
            service_url=args.service_url,
            service_token=os.environ.get("COMPANY_READER_SERVICE_TOKEN", ""),
            urls=tuple(args.urls),
            runs=args.runs,
        )
    except (OSError, ValueError, RuntimeError, json.JSONDecodeError) as error:
        print(f"Shadow batch failed: {error}", file=sys.stderr)
        return 1
    print(json.dumps(summary.to_dict(), ensure_ascii=False, indent=2))
    return 0 if summary.failed_runs == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
