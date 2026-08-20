from __future__ import annotations

import re
import unittest
from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
RENDER_BLUEPRINT = REPOSITORY_ROOT / "services" / "company-reader" / "render.yaml"
SUPABASE_GATEWAY = REPOSITORY_ROOT / "supabase" / "functions" / "company-reader-gateway" / "index.ts"


class CompanyReaderGatewayContractTests(unittest.TestCase):
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


if __name__ == "__main__":
    unittest.main()
