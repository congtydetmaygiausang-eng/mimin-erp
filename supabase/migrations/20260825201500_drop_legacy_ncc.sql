-- Xóa bảng NCC cũ; ứng dụng chỉ dùng public.nha_cung_cap.
BEGIN;

DROP TRIGGER IF EXISTS trg_sync_nha_cung_cap_to_ncc ON public.nha_cung_cap;
DO $$
BEGIN
  IF to_regclass('public.ncc') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_sync_ncc_to_nha_cung_cap ON public.ncc;
  END IF;
END;
$$;

DROP FUNCTION IF EXISTS public.sync_nha_cung_cap_to_ncc();
DROP FUNCTION IF EXISTS public.sync_ncc_to_nha_cung_cap();

DROP TABLE IF EXISTS public.ncc;

NOTIFY pgrst, 'reload schema';
COMMIT;
