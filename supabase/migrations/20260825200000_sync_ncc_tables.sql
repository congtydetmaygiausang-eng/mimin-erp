-- Đồng bộ bảng NCC cũ `ncc` với bảng chuẩn `nha_cung_cap`.
-- `nha_cung_cap` là nguồn chính của ứng dụng; giữ `ncc` để tương thích dữ liệu cũ.

BEGIN;

-- Bắt đầu kỳ công nợ mới ở cả hai bảng.
UPDATE public.nha_cung_cap
SET cong_no = 0
WHERE loai IS DISTINCT FROM 'doi_tac_gia_cong';

UPDATE public.ncc SET cong_no = 0;

-- Đồng bộ toàn bộ NCC hiện tại từ bảng chuẩn sang bảng cũ.
INSERT INTO public.ncc (
  stt, ten, vai_tro, sdt, mail, dia_chi, ma_so_thue, cong_no, rating, ghi_chu
)
SELECT
  COALESCE(n.stt, NULLIF(regexp_replace(n.ma_ncc, '\D', '', 'g'), '')::integer),
  n.ten_ncc,
  COALESCE(n.chuyen_mon, n.loai, 'Khác'),
  n.sdt,
  n.email,
  n.dia_chi,
  n.ma_so_thue,
  0,
  COALESCE(n.rating, 4),
  n.ghi_chu
FROM public.nha_cung_cap n
WHERE n.loai IS DISTINCT FROM 'doi_tac_gia_cong'
  AND COALESCE(n.stt, NULLIF(regexp_replace(n.ma_ncc, '\D', '', 'g'), '')::integer) IS NOT NULL
ON CONFLICT (stt) DO UPDATE SET
  ten = EXCLUDED.ten,
  vai_tro = EXCLUDED.vai_tro,
  sdt = EXCLUDED.sdt,
  mail = EXCLUDED.mail,
  dia_chi = EXCLUDED.dia_chi,
  ma_so_thue = EXCLUDED.ma_so_thue,
  cong_no = EXCLUDED.cong_no,
  rating = EXCLUDED.rating,
  ghi_chu = EXCLUDED.ghi_chu;

CREATE OR REPLACE FUNCTION public.sync_nha_cung_cap_to_ncc()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_stt integer;
BEGIN
  IF pg_trigger_depth() > 1 OR NEW.loai = 'doi_tac_gia_cong' THEN
    RETURN NEW;
  END IF;

  target_stt := COALESCE(
    NEW.stt,
    NULLIF(regexp_replace(NEW.ma_ncc, '\D', '', 'g'), '')::integer
  );
  IF target_stt IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.ncc (
    stt, ten, vai_tro, sdt, mail, dia_chi, ma_so_thue, cong_no, rating, ghi_chu
  ) VALUES (
    target_stt, NEW.ten_ncc, COALESCE(NEW.chuyen_mon, NEW.loai, 'Khác'),
    NEW.sdt, NEW.email, NEW.dia_chi, NEW.ma_so_thue,
    COALESCE(NEW.cong_no, 0), COALESCE(NEW.rating, 4), NEW.ghi_chu
  )
  ON CONFLICT (stt) DO UPDATE SET
    ten = EXCLUDED.ten,
    vai_tro = EXCLUDED.vai_tro,
    sdt = EXCLUDED.sdt,
    mail = EXCLUDED.mail,
    dia_chi = EXCLUDED.dia_chi,
    ma_so_thue = EXCLUDED.ma_so_thue,
    cong_no = EXCLUDED.cong_no,
    rating = EXCLUDED.rating,
    ghi_chu = EXCLUDED.ghi_chu;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_ncc_to_nha_cung_cap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_code text := 'NCC-' || lpad(NEW.stt::text, 3, '0');
BEGIN
  IF pg_trigger_depth() > 1 THEN RETURN NEW; END IF;

  INSERT INTO public.nha_cung_cap (
    stt, ma_ncc, ten_ncc, loai, chuyen_mon, sdt, email, dia_chi,
    ma_so_thue, cong_no, rating, ghi_chu, trang_thai
  ) VALUES (
    NEW.stt, target_code, NEW.ten, COALESCE(NEW.vai_tro, 'Khác'),
    COALESCE(NEW.vai_tro, 'Khác'), NEW.sdt, NEW.mail, NEW.dia_chi,
    NEW.ma_so_thue, COALESCE(NEW.cong_no, 0), COALESCE(NEW.rating, 4),
    NEW.ghi_chu, 'Đang hợp tác'
  )
  ON CONFLICT (ma_ncc) DO UPDATE SET
    stt = EXCLUDED.stt,
    ten_ncc = EXCLUDED.ten_ncc,
    loai = EXCLUDED.loai,
    chuyen_mon = EXCLUDED.chuyen_mon,
    sdt = EXCLUDED.sdt,
    email = EXCLUDED.email,
    dia_chi = EXCLUDED.dia_chi,
    ma_so_thue = EXCLUDED.ma_so_thue,
    cong_no = EXCLUDED.cong_no,
    rating = EXCLUDED.rating,
    ghi_chu = EXCLUDED.ghi_chu;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_nha_cung_cap_to_ncc ON public.nha_cung_cap;
CREATE TRIGGER trg_sync_nha_cung_cap_to_ncc
AFTER INSERT OR UPDATE ON public.nha_cung_cap
FOR EACH ROW EXECUTE FUNCTION public.sync_nha_cung_cap_to_ncc();

DROP TRIGGER IF EXISTS trg_sync_ncc_to_nha_cung_cap ON public.ncc;
CREATE TRIGGER trg_sync_ncc_to_nha_cung_cap
AFTER INSERT OR UPDATE ON public.ncc
FOR EACH ROW EXECUTE FUNCTION public.sync_ncc_to_nha_cung_cap();

NOTIFY pgrst, 'reload schema';
COMMIT;
