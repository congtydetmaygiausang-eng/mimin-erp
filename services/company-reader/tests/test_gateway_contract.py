from __future__ import annotations

import re
import unittest
from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
RENDER_BLUEPRINT = REPOSITORY_ROOT / "services" / "company-reader" / "render.yaml"
SUPABASE_GATEWAY = REPOSITORY_ROOT / "supabase" / "functions" / "company-reader-gateway" / "index.ts"


class CompanyReaderGatewayContractTests(unittest.TestCase):
    def test_render_exposes_authenticated_https_service_to_supabase_edge(self) -> None:
        blueprint = RENDER_BLUEPRINT.read_text(encoding="utf-8")
        service_name = blueprint.index("name: mimin-company-reader\n")
        service_type = blueprint.rfind("- type:", 0, service_name)
        self.assertGreaterEqual(service_type, 0, "Blueprint must define the Company Reader service")
        self.assertEqual(blueprint[service_type:service_name].splitlines()[0].strip(), "- type: web", "Supabase Edge cannot reach a Render private service")
        self.assertIn("healthCheckPath: /readyz", blueprint)
        self.assertEqual(blueprint.count("plan: free"), 2, "Shadow trial must not provision paid Render resources")

    def test_render_allowlist_accepts_supabase_gateway_client(self) -> None:
        blueprint = RENDER_BLUEPRINT.read_text(encoding="utf-8")
        gateway = SUPABASE_GATEWAY.read_text(encoding="utf-8")

        allowed_match = re.search(
            r"key:\s*COMPANY_READER_ALLOWED_CLIENTS\s+value:\s*([^\s#]+)",
            blueprint,
        )
        client_match = re.search(r'"X-Mimin-Client":\s*"([^"]+)"', gateway)

        self.assertIsNotNone(allowed_match, "Render Blueprint must define the Company Reader client allowlist")
        self.assertIsNotNone(client_match, "Supabase gateway must send the Company Reader client header")
        self.assertEqual(
            allowed_match.group(1),
            client_match.group(1),
            "Render allowlist and Supabase gateway client ID must remain identical",
        )
        self.assertIn('key: COMPANY_READER_REQUIRE_SIGNATURE\n        value: "true"', blueprint)
        self.assertIn('"X-Mimin-Signature": signature', gateway)
        self.assertIn('"X-Mimin-Timestamp": timestamp', gateway)


if __name__ == "__main__":
    unittest.main()
