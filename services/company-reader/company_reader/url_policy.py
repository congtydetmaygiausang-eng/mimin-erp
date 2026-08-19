"""URL and DNS policy preventing SSRF before every outbound request."""

from __future__ import annotations

import ipaddress
import socket
from collections.abc import Callable, Iterable
from dataclasses import dataclass
from urllib.parse import SplitResult, urlsplit, urlunsplit


class UrlPolicyError(ValueError):
    """Raised when a URL is unsafe for the public-web reader."""

    def __init__(self, code: str, detail: str) -> None:
        super().__init__(detail)
        self.code = code
        self.detail = detail


Resolver = Callable[[str, int], Iterable[str]]


def resolve_public_addresses(hostname: str, port: int) -> tuple[str, ...]:
    """Resolve all addresses; callers must reject the URL if any address is unsafe."""
    records = socket.getaddrinfo(hostname, port, type=socket.SOCK_STREAM)
    return tuple(sorted({record[4][0] for record in records}))


@dataclass(frozen=True, slots=True)
class UrlPolicy:
    resolver: Resolver = resolve_public_addresses
    allowed_ports: tuple[int, ...] = (443,)

    def validate(self, raw_url: str) -> str:
        value = raw_url.strip()
        if (
            not value
            or len(value) > 2048
            or any(character.isspace() for character in value)
        ):
            raise UrlPolicyError("INVALID_URL", "URL trống hoặc chứa khoảng trắng")

        parsed = urlsplit(value)
        self._validate_structure(parsed)
        hostname = parsed.hostname
        if hostname is None:
            raise UrlPolicyError("INVALID_HOST", "URL không có hostname")

        normalized_host = hostname.rstrip(".").lower()
        if self._is_local_hostname(normalized_host):
            raise UrlPolicyError("PRIVATE_HOST", "Không cho phép hostname nội bộ")

        port = parsed.port or 443
        try:
            literal_ip = ipaddress.ip_address(normalized_host.strip("[]"))
        except ValueError:
            literal_ip = None

        addresses = (str(literal_ip),) if literal_ip is not None else tuple(
            self.resolver(normalized_host, port)
        )
        if not addresses:
            raise UrlPolicyError("DNS_EMPTY", "Hostname không có bản ghi IP")
        for address in addresses:
            self._require_public_ip(address)

        netloc = normalized_host
        if ":" in normalized_host:
            netloc = f"[{normalized_host}]"
        if parsed.port is not None:
            netloc = f"{netloc}:{parsed.port}"
        path = parsed.path or "/"
        return urlunsplit(("https", netloc, path, parsed.query, ""))

    def _validate_structure(self, parsed: SplitResult) -> None:
        if parsed.scheme.lower() != "https":
            raise UrlPolicyError("HTTPS_REQUIRED", "Chỉ cho phép HTTPS")
        if not parsed.netloc or parsed.username is not None or parsed.password is not None:
            raise UrlPolicyError("INVALID_AUTHORITY", "URL không hợp lệ hoặc chứa credentials")
        try:
            port = parsed.port or 443
        except ValueError as error:
            raise UrlPolicyError("INVALID_PORT", "Port không hợp lệ") from error
        if port not in self.allowed_ports:
            raise UrlPolicyError("PORT_BLOCKED", "Port không nằm trong allowlist")

    @staticmethod
    def _is_local_hostname(hostname: str) -> bool:
        return hostname == "localhost" or hostname.endswith(
            (".localhost", ".local", ".internal", ".home", ".lan")
        )

    @staticmethod
    def _require_public_ip(address: str) -> None:
        try:
            parsed = ipaddress.ip_address(address)
        except ValueError as error:
            raise UrlPolicyError("DNS_INVALID", "DNS trả về địa chỉ không hợp lệ") from error
        if not parsed.is_global:
            raise UrlPolicyError("PRIVATE_IP", "DNS/IP trỏ vào mạng không công khai")
