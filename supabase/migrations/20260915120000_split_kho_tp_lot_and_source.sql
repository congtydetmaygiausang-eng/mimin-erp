-- Kho thành phẩm luôn có mã lô tồn kho riêng (LTK-*).
-- Mã lệnh cắt chỉ là nguồn truy xuất, không dùng làm mã tồn kho.
alter table public.kho_thanh_pham
  add column if not exists ma_lenh_cat text;

update public.kho_thanh_pham
set
  ma_lenh_cat = case
    when upper(lsx) like 'LC-%' then upper(lsx)
    when upper(lsx) ~ '^LSX-[0-9]{4}-[0-9]+$' then
      'LC-' || split_part(upper(lsx), '-', 2) || '-' || lpad(split_part(upper(lsx), '-', 3), 4, '0')
    else ma_lenh_cat
  end,
  lsx = 'LTK-' || replace(coalesce(nullif(ngay_nhap::text, ''), current_date::text), '-', '') || '-' ||
    lpad(right(regexp_replace(upper(id::text), '[^A-Z0-9]', '', 'g'), 6), 6, '0')
where upper(coalesce(lsx, '')) like 'LC-%'
   or upper(coalesce(lsx, '')) like 'LSX-%';

create index if not exists idx_kho_thanh_pham_ma_lenh_cat
  on public.kho_thanh_pham (ma_lenh_cat);
