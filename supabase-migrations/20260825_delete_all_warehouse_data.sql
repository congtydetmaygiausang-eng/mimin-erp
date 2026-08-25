-- MIMIN ERP - XÓA VĨNH VIỄN TOÀN BỘ DỮ LIỆU KHO
-- Phạm vi: Kho vải, Kho phụ liệu, Kho thành phẩm và lịch sử/phiếu kho.
-- Không xóa đơn hàng, lệnh cắt, khách hàng hoặc danh mục sản phẩm san_pham.
BEGIN;

DO $$
BEGIN
  IF to_regclass('public.giao_dich_kho') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.giao_dich_kho';
  END IF;

  IF to_regclass('public.kho_mobile') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.kho_mobile';
  END IF;

  IF to_regclass('public.kho_thanh_pham') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.kho_thanh_pham';
  END IF;

  IF to_regclass('public.kho') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.kho';
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
COMMIT;

-- Tất cả kết quả phải bằng 0.
SELECT
  (SELECT COUNT(*) FROM public.kho) AS kho_vai_phu_lieu,
  (SELECT COUNT(*) FROM public.giao_dich_kho) AS giao_dich_kho,
  (SELECT COUNT(*) FROM public.kho_mobile) AS kho_mobile,
  (SELECT COUNT(*) FROM public.kho_thanh_pham) AS kho_thanh_pham;
