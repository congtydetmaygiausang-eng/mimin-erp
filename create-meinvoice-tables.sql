-- ============================================================
-- MeInvoice Integration - Schema + RLS
-- 2026-08-09 - Mavis (for sep Sang - POLOMIMIN/MIMIN ERP)
-- Tao 3 bang de tich hop Hoa don dien tu Misa meInvoice:
--   1. meinvoice_config  - luu credentials (app_id, MST, user, pass)
--   2. hoa_don_dien_tu   - luu hoa don da phat hanh
--   3. hoa_don_log       - audit trail cac lan goi API
-- ============================================================

-- ============================================================
-- 1. meinvoice_config
-- ============================================================
CREATE TABLE IF NOT EXISTS public.meinvoice_config (
  id text PRIMARY KEY DEFAULT 'default',
  -- Misa MeInvoice credentials
  app_id text NOT NULL,                              -- AppID do MISA cấp
  tax_code text NOT NULL,                            -- MST cua doanh nghiep (0318507560)
  username text NOT NULL,                            -- Email/SDT dang nhap MeInvoice
  password_enc text NOT NULL,                        -- Password (nen ma hoa, hien tam luu plain)
  env text NOT NULL DEFAULT 'test' CHECK (env IN ('test', 'live')),  -- test | live
  -- Token cache
  last_token text,                                   -- Token OAuth2 (14 ngay)
  token_expires_at timestamptz,                      -- Thoi diem het han token
  -- UI/UX
  sign_type int NOT NULL DEFAULT 2,                  -- 2 = co CKS, 5 = khong CKS
  default_template text,                             -- InvSeries mac dinh (1C25MMA, 2C25G...)
  -- Audit
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text                                    -- User email da cap nhat
);

COMMENT ON TABLE public.meinvoice_config IS 'MeInvoice credentials + cached token (1 row only)';
COMMENT ON COLUMN public.meinvoice_config.password_enc IS 'MeInvoice password (TODO: encrypt in production)';

-- Insert default row (sparse - user fills in via UI)
INSERT INTO public.meinvoice_config (id, app_id, tax_code, username, password_enc, env)
VALUES ('default', 'PENDING_APP_ID', '0318507560', 'PENDING_USERNAME', 'PENDING_PASSWORD', 'test')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. hoa_don_dien_tu
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hoa_don_dien_tu (
  id text PRIMARY KEY,                               -- UUID tu Misa
  -- Misa MeInvoice identifiers
  transaction_id text UNIQUE,                        -- TransactionID (RefID noi bo)
  ref_id text UNIQUE NOT NULL,                       -- RefID (UUID noi bo de tracking)
  inv_no text,                                       -- So hoa don (1, 2, 3...)
  inv_series text NOT NULL,                          -- Ky hieu mau (1C25MMA...)
  inv_date date,                                     -- Ngay phat hanh
  -- Buyer info
  buyer_legal_name text NOT NULL,                    -- Ten cong ty/ca nhan mua
  buyer_tax_code text,                               -- MST nguoi mua
  buyer_address text,                                -- Dia chi
  buyer_phone text,
  buyer_email text,
  -- Money
  total_amount numeric(18,2) NOT NULL DEFAULT 0,     -- Tong tien (chua VAT)
  vat_amount numeric(18,2) NOT NULL DEFAULT 0,      -- Tong VAT
  total_with_vat numeric(18,2) NOT NULL DEFAULT 0,  -- Tong thanh toan
  currency text NOT NULL DEFAULT 'VND',
  -- Status
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'cancelled', 'adjusted', 'replaced')),
  publish_status int,                                -- PublishStatus tu Misa (1 = thanh cong)
  -- Data
  einvoice_data jsonb,                               -- Toan bo response tu Misa
  original_invoice_detail jsonb,                     -- Danh sach hang hoa
  -- Lien ket voi MIMIN ERP
  ref_id_don_hang text,                              -- Ma don hang noi bo (DH-001)
  ref_id_khach_hang text,                            -- Ma KH noi bo (KH-001)
  nguoi_tao text,                                    -- User email da tao
  -- File
  pdf_url text,                                      -- URL download PDF (neu co)
  xml_url text,                                      -- URL download XML
  -- Audit
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  issued_at timestamptz,
  cancelled_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_hddt_inv_date ON public.hoa_don_dien_tu (inv_date DESC);
CREATE INDEX IF NOT EXISTS idx_hddt_status ON public.hoa_don_dien_tu (status);
CREATE INDEX IF NOT EXISTS idx_hddt_buyer ON public.hoa_don_dien_tu (buyer_tax_code);
CREATE INDEX IF NOT EXISTS idx_hddt_don_hang ON public.hoa_don_dien_tu (ref_id_don_hang);

COMMENT ON TABLE public.hoa_don_dien_tu IS 'Misa meInvoice hoa don dien tu da phat hanh';

-- ============================================================
-- 3. hoa_don_log (audit trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hoa_don_log (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  hoa_don_id text REFERENCES public.hoa_don_dien_tu (id) ON DELETE CASCADE,
  -- Action
  action text NOT NULL,                              -- 'auth' | 'create' | 'publish' | 'download' | 'sendemail' | 'cancel' | 'status'
  -- Request/Response
  endpoint text,                                     -- URL goi
  request_body jsonb,                                -- Body gui di
  response_status int,                               -- HTTP status
  response_body jsonb,                               -- Response nhan ve
  error_msg text,                                    -- Error message neu co
  -- Meta
  duration_ms int,                                   -- Thoi gian xu ly
  user_email text,                                   -- User da goi
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_log_hddt ON public.hoa_don_log (hoa_don_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_log_action ON public.hoa_don_log (action, created_at DESC);

COMMENT ON TABLE public.hoa_don_log IS 'Audit trail cac lan goi MeInvoice API';

-- ============================================================
-- RLS Policies (mo cho service_role + admin qua supabase)
-- ============================================================

ALTER TABLE public.meinvoice_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hoa_don_dien_tu ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hoa_don_log ENABLE ROW LEVEL SECURITY;

-- Grant cho authenticated + anon (PostgREST se filter qua RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meinvoice_config TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hoa_don_dien_tu TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hoa_don_log TO authenticated, anon;

-- Service role full access (bo qua RLS)
-- Note: service_role key tu dong bypass RLS nen khong can policy

-- Authenticated user: read meinvoice_config (chi admin) + full CRUD hoa_don
-- Don gian hoa: cho authenticated full access (se refine sau khi co permission matrix)
DROP POLICY IF EXISTS "Authenticated full access meinvoice_config" ON public.meinvoice_config;
CREATE POLICY "Authenticated full access meinvoice_config" ON public.meinvoice_config
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated full access hddt" ON public.hoa_don_dien_tu;
CREATE POLICY "Authenticated full access hddt" ON public.hoa_don_dien_tu
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated full access log" ON public.hoa_don_log;
CREATE POLICY "Authenticated full access log" ON public.hoa_don_log
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Anon (chua dang nhap): read-only de tranh loi UI
DROP POLICY IF EXISTS "Anon read hddt" ON public.hoa_don_dien_tu;
CREATE POLICY "Anon read hddt" ON public.hoa_don_dien_tu
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Anon read config" ON public.meinvoice_config;
CREATE POLICY "Anon read config" ON public.meinvoice_config
  FOR SELECT TO anon USING (true);

-- ============================================================
-- Verify
-- ============================================================
SELECT 'meinvoice_config' AS tbl, count(*) AS rows FROM public.meinvoice_config
UNION ALL
SELECT 'hoa_don_dien_tu' AS tbl, count(*) AS rows FROM public.hoa_don_dien_tu
UNION ALL
SELECT 'hoa_don_log' AS tbl, count(*) AS rows FROM public.hoa_don_log;
