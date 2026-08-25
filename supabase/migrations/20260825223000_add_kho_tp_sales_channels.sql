BEGIN;

ALTER TABLE public.kho_thanh_pham
  ADD COLUMN IF NOT EXISTS kenh_ban text[] NOT NULL DEFAULT ARRAY['ban-le']::text[],
  ADD COLUMN IF NOT EXISTS gia_tiktok numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gia_shopee numeric NOT NULL DEFAULT 0;

UPDATE public.kho_thanh_pham
SET kenh_ban = ARRAY['ban-le']::text[]
WHERE kenh_ban IS NULL OR cardinality(kenh_ban) = 0;

ALTER TABLE public.kho_thanh_pham
  DROP CONSTRAINT IF EXISTS kho_thanh_pham_kenh_ban_check;

ALTER TABLE public.kho_thanh_pham
  ADD CONSTRAINT kho_thanh_pham_kenh_ban_check CHECK (
    cardinality(kenh_ban) > 0
    AND kenh_ban <@ ARRAY['ban-le', 'ban-si', 'ban-lo', 'tiktok', 'shopee']::text[]
  );

NOTIFY pgrst, 'reload schema';
COMMIT;
