"""Production ASGI entrypoint with explicit Redis connectivity validation."""

from __future__ import annotations

import os
from dataclasses import replace
from urllib.parse import urlsplit

from .api import CompanyReaderASGI
from .app import create_app_from_env


def _valid_redis_url(value: str) -> bool:
    try:
        parsed = urlsplit(value)
    except ValueError:
        return False
    return parsed.scheme in {"redis", "rediss"} and bool(parsed.hostname)


def create_production_app(environment: dict[str, str] | None = None) -> CompanyReaderASGI:
    env = environment if environment is not None else dict(os.environ)
    redis_url = env.get("REDIS_URL", "").strip()
    if not _valid_redis_url(redis_url):
        app = create_app_from_env(env)
        return replace(app, configuration_error="INVALID_REDIS_URL")

    try:
        import redis

        client = redis.Redis.from_url(
            redis_url,
            socket_connect_timeout=3.0,
            socket_timeout=3.0,
            health_check_interval=30,
            decode_responses=False,
        )
        client.ping()
    except Exception:
        app = create_app_from_env(env)
        return replace(app, configuration_error="REDIS_UNAVAILABLE")
    return create_app_from_env(env, client)


app = create_production_app()
