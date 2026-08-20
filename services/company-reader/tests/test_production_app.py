from __future__ import annotations

import sys
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from company_reader.production_app import _valid_redis_url, create_production_app  # noqa: E402


class ProductionAppTests(unittest.TestCase):
    def test_redis_url_validation_is_fail_closed(self) -> None:
        self.assertTrue(_valid_redis_url("redis://cache.internal:6379"))
        self.assertTrue(_valid_redis_url("rediss://user:secret@cache.example:6380"))
        self.assertFalse(_valid_redis_url(""))
        self.assertFalse(_valid_redis_url("https://cache.example"))
        self.assertFalse(_valid_redis_url("redis:///missing-host"))

    def test_missing_redis_never_creates_ready_production_app(self) -> None:
        app = create_production_app({
            "COMPANY_READER_ENABLED": "true",
            "COMPANY_READER_DEPLOYMENT": "production",
            "COMPANY_READER_GUARDRAIL_MODE": "redis",
            "COMPANY_READER_SERVICE_TOKEN": "t" * 40,
            "COMPANY_READER_ALLOWED_CLIENTS": "mimin-render-gateway",
        })
        self.assertEqual(app.configuration_error, "INVALID_REDIS_URL")

    def test_reachable_redis_creates_ready_shadow_app(self) -> None:
        class FakeRedisClient:
            def ping(self) -> bool:
                return True

        redis_factory = SimpleNamespace(
            from_url=lambda *_args, **_kwargs: FakeRedisClient(),
        )
        fake_redis_module = SimpleNamespace(Redis=redis_factory)
        environment = {
            "REDIS_URL": "rediss://cache.internal:6379/0",
            "COMPANY_READER_ENABLED": "true",
            "COMPANY_READER_DEPLOYMENT": "production",
            "COMPANY_READER_GUARDRAIL_MODE": "redis",
            "COMPANY_READER_SERVICE_TOKEN": "t" * 40,
            "COMPANY_READER_ALLOWED_CLIENTS": "mimin-render-gateway",
            "COMPANY_READER_ROLLOUT_MODE": "shadow",
            "COMPANY_READER_CANARY_PERCENT": "0",
        }

        with patch.dict(sys.modules, {"redis": fake_redis_module}):
            app = create_production_app(environment)

        self.assertTrue(app.enabled)
        self.assertIsNone(app.configuration_error)
        self.assertEqual(app.rollout.mode.value, "shadow")


if __name__ == "__main__":
    unittest.main()
