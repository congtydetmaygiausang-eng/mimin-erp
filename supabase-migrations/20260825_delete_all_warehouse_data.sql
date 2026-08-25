-- MIMIN ERP - XÓA VĨNH VIỄN TOÀN BỘ DỮ LIỆU KHO
-- Phạm vi: Kho vải, Kho phụ liệu, Kho thành phẩm và lịch sử/phiếu kho.
-- Không xóa đơn hàng, lệnh cắt, khách hàng hoặc danh mục sản phẩm san_pham.
BEGIN;

CREATE TEMP TABLE material_skus_to_delete ON COMMIT DROP AS
SELECT sku
FROM public.kho
WHERE loai = 'Vai';

CREATE TEMP TABLE lenh_cat_ids_to_delete (
  id TEXT PRIMARY KEY
) ON COMMIT DROP;

DO $$
DECLARE
  fk RECORD;
BEGIN
  -- Chỉ xoá Lệnh cắt có dsMau tham chiếu mã vải thực sự đang bị xoá.
  IF to_regclass('public.lenh_cat') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'lenh_cat' AND column_name = 'dsMau'
    ) THEN
      EXECUTE $sql$
        INSERT INTO lenh_cat_ids_to_delete(id)
        SELECT lc.id
        FROM public.lenh_cat lc
        WHERE EXISTS (
          SELECT 1
          FROM jsonb_array_elements(COALESCE(lc."dsMau", '[]'::jsonb)) mau
          JOIN material_skus_to_delete sku
            ON sku.sku IN (mau->>'maVai', mau->>'maVaiQuan', mau->>'ma_vai', mau->>'ma_vai_quan')
        )
        ON CONFLICT (id) DO NOTHING
      $sql$;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'lenh_cat' AND column_name = 'ds_mau'
    ) THEN
      EXECUTE $sql$
        INSERT INTO lenh_cat_ids_to_delete(id)
        SELECT lc.id
        FROM public.lenh_cat lc
        WHERE EXISTS (
          SELECT 1
          FROM jsonb_array_elements(COALESCE(lc.ds_mau, '[]'::jsonb)) mau
          JOIN material_skus_to_delete sku
            ON sku.sku IN (mau->>'maVai', mau->>'maVaiQuan', mau->>'ma_vai', mau->>'ma_vai_quan')
        )
        ON CONFLICT (id) DO NOTHING
      $sql$;
    END IF;

    -- Xoá bản ghi con có khóa ngoại trực tiếp tới lenh_cat trước.
    FOR fk IN
      SELECT child_ns.nspname AS schema_name,
             child.relname AS table_name,
             child_col.attname AS column_name
      FROM pg_constraint con
      JOIN pg_class child ON child.oid = con.conrelid
      JOIN pg_namespace child_ns ON child_ns.oid = child.relnamespace
      JOIN pg_attribute child_col
        ON child_col.attrelid = con.conrelid
       AND child_col.attnum = con.conkey[1]
      WHERE con.contype = 'f'
        AND con.confrelid = 'public.lenh_cat'::regclass
        AND array_length(con.conkey, 1) = 1
    LOOP
      EXECUTE format(
        'DELETE FROM %I.%I WHERE %I IN (SELECT id FROM lenh_cat_ids_to_delete)',
        fk.schema_name,
        fk.table_name,
        fk.column_name
      );
    END LOOP;

    DELETE FROM public.lenh_cat
    WHERE id IN (SELECT id FROM lenh_cat_ids_to_delete);
  END IF;

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

-- Tất cả kết quả phải bằng 0.
SELECT
  (SELECT COUNT(*) FROM public.kho) AS kho_vai_phu_lieu,
  (SELECT COUNT(*) FROM public.giao_dich_kho) AS giao_dich_kho,
  (SELECT COUNT(*) FROM public.kho_mobile) AS kho_mobile,
  (SELECT COUNT(*) FROM public.kho_thanh_pham) AS kho_thanh_pham,
  (SELECT COUNT(*) FROM lenh_cat_ids_to_delete) AS lenh_cat_da_xoa;

COMMIT;
