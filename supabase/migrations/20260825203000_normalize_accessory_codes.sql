-- Chuẩn hóa các mã phụ liệu cũ sang PL-001, PL-002... và giữ nguyên tồn kho/lịch sử.
BEGIN;

CREATE TEMP TABLE accessory_code_map (
  old_sku text PRIMARY KEY,
  new_sku text UNIQUE NOT NULL
) ON COMMIT DROP;

WITH current_max AS (
  SELECT COALESCE(MAX(NULLIF(regexp_replace(sku, '^PL-', ''), '')::integer), 0) AS value
  FROM public.kho
  WHERE loai = 'Phu lieu' AND sku ~ '^PL-[0-9]+$'
), old_codes AS (
  SELECT
    sku,
    row_number() OVER (ORDER BY created_at NULLS LAST, sku) AS sequence
  FROM public.kho
  WHERE loai = 'Phu lieu' AND sku !~ '^PL-[0-9]+$'
)
INSERT INTO accessory_code_map (old_sku, new_sku)
SELECT
  old_codes.sku,
  'PL-' || lpad((current_max.value + old_codes.sequence)::text, 3, '0')
FROM old_codes CROSS JOIN current_max;

-- Lịch sử giao dịch phải dùng cùng mã mới với danh mục kho.
DO $$
BEGIN
  IF to_regclass('public.giao_dich_kho') IS NOT NULL THEN
    UPDATE public.giao_dich_kho gd
    SET ma_vt = map.new_sku
    FROM accessory_code_map map
    WHERE gd.ma_vt = map.old_sku
      AND gd.loai_kho = 'phu-lieu';
  END IF;
END;
$$;

-- Đổi qua mã tạm trước để không va chạm unique khi chuẩn hóa nhiều dòng.
UPDATE public.kho k
SET sku = '__PL_TMP__' || encode(convert_to(map.old_sku, 'UTF8'), 'hex')
FROM accessory_code_map map
WHERE k.sku = map.old_sku;

UPDATE public.kho k
SET sku = map.new_sku,
    updated_at = now()
FROM accessory_code_map map
WHERE k.sku = '__PL_TMP__' || encode(convert_to(map.old_sku, 'UTF8'), 'hex');

NOTIFY pgrst, 'reload schema';
COMMIT;
