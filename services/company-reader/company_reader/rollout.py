"""Deterministic JT10 rollout policy with an immediate off switch."""

from __future__ import annotations

import hashlib
from dataclasses import dataclass
from enum import StrEnum


class RolloutMode(StrEnum):
    SHADOW = "shadow"
    CANARY = "canary"
    LIVE = "live"


@dataclass(frozen=True, slots=True)
class RolloutDecision:
    selected: bool
    expose_profiles: bool
    bucket: int


@dataclass(frozen=True, slots=True)
class RolloutPolicy:
    mode: RolloutMode = RolloutMode.SHADOW
    canary_percent: int = 0
    salt: str = "mimin-company-reader-jt10"

    def __post_init__(self) -> None:
        if not 0 <= self.canary_percent <= 100:
            raise ValueError("canary_percent must be between 0 and 100")
        if not self.salt or len(self.salt) > 128:
            raise ValueError("rollout salt is required and bounded")

    def decide(self, request_id: str) -> RolloutDecision:
        digest = hashlib.sha256(f"{self.salt}:{request_id}".encode("utf-8")).digest()
        bucket = int.from_bytes(digest[:4], "big") % 100
        if self.mode is RolloutMode.SHADOW:
            return RolloutDecision(True, False, bucket)
        if self.mode is RolloutMode.CANARY:
            selected = bucket < self.canary_percent
            return RolloutDecision(selected, selected, bucket)
        return RolloutDecision(True, True, bucket)
