-- ============================================================
-- Add facebook_url column for contact channels
-- 2026-08-08 - Mavis (for sep Sang)
-- Mục đích: thêm link Facebook cho công nhân gia công + KH + NCC + xưởng
-- ============================================================

-- 1. Bảng công nhân gia công (P0 - sep đang xem modal Trần Liên)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='cong_nhan_gia_cong') THEN
    ALTER TABLE public.cong_nhan_gia_cong
      ADD COLUMN IF NOT EXISTS facebook_url text;
    RAISE NOTICE 'Added facebook_url to cong_nhan_gia_cong';
  END IF;
END $$;

-- 2. Bảng đối tác gia công (P1)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='doi_tac_gia_cong') THEN
    ALTER TABLE public.doi_tac_gia_cong
      ADD COLUMN IF NOT EXISTS facebook_url text;
    RAISE NOTICE 'Added facebook_url to doi_tac_gia_cong';
  ELSE
    RAISE NOTICE 'Skipped doi_tac_gia_cong (table not found)';
  END IF;
END $$;

-- 3. Bảng khách hàng (P1)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='khach_hang') THEN
    ALTER TABLE public.khach_hang
      ADD COLUMN IF NOT EXISTS facebook_url text;
    RAISE NOTICE 'Added facebook_url to khach_hang';
  ELSE
    RAISE NOTICE 'Skipped khach_hang (table not found)';
  END IF;
END $$;

-- 4. Bảng nhà cung cấp (P1)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='nha_cung_cap') THEN
    ALTER TABLE public.nha_cung_cap
      ADD COLUMN IF NOT EXISTS facebook_url text;
    RAISE NOTICE 'Added facebook_url to nha_cung_cap';
  ELSE
    RAISE NOTICE 'Skipped nha_cung_cap (table not found)';
  END IF;
END $$;

-- 5. Bảng nhân sự (P1)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='nhan_su') THEN
    ALTER TABLE public.nhan_su
      ADD COLUMN IF NOT EXISTS facebook_url text;
    RAISE NOTICE 'Added facebook_url to nhan_su';
  ELSE
    RAISE NOTICE 'Skipped nhan_su (table not found)';
  END IF;
END $$;

-- 6. Kiểm tra các bảng đã thêm
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'facebook_url'
ORDER BY table_name;
