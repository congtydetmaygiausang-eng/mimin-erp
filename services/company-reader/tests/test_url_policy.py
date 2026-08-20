"""JT1 URL policy tests. No test performs a network request."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path


SERVICE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SERVICE_ROOT))

from company_reader.url_policy import UrlPolicy, UrlPolicyError  # noqa: E402


def public_resolver(_hostname: str, _port: int) -> tuple[str, ...]:
    return ("93.184.216.34",)


class UrlPolicyTests(unittest.TestCase):
    def setUp(self) -> None:
        self.policy = UrlPolicy(resolver=public_resolver)

    def test_normalizes_safe_https_url_and_removes_fragment(self) -> None:
        result = self.policy.validate("https://Example.COM/company?id=7#contact")
        self.assertEqual(result, "https://example.com/company?id=7")

    def test_rejects_http_credentials_and_unapproved_port(self) -> None:
        blocked = (
            "http://example.com",
            "https://user:secret@example.com",
            "https://example.com:8443",
        )
        for url in blocked:
            with self.subTest(url=url), self.assertRaises(UrlPolicyError):
                self.policy.validate(url)

    def test_rejects_local_and_private_targets(self) -> None:
        policies = (
            (self.policy, "https://localhost/admin"),
            (self.policy, "https://127.0.0.1/"),
            (self.policy, "https://169.254.169.254/latest/meta-data"),
            (UrlPolicy(resolver=lambda _host, _port: ("10.1.2.3",)), "https://example.com/"),
        )
        for policy, url in policies:
            with self.subTest(url=url), self.assertRaises(UrlPolicyError):
                policy.validate(url)

    def test_rejects_mixed_public_private_dns_answer(self) -> None:
        policy = UrlPolicy(
            resolver=lambda _host, _port: ("93.184.216.34", "192.168.1.10")
        )
        with self.assertRaises(UrlPolicyError) as context:
            policy.validate("https://example.com/")
        self.assertEqual(context.exception.code, "PRIVATE_IP")

    def test_rejects_whitespace_and_local_suffix(self) -> None:
        for url in (
            "https://exa mple.com",
            "https://printer.local/",
            f"https://example.com/{'x' * 2030}",
        ):
            with self.subTest(url=url), self.assertRaises(UrlPolicyError):
                self.policy.validate(url)


if __name__ == "__main__":
    unittest.main()
