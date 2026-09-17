create table if not exists public.hop_dong_ncc (
  id text primary key,
  ma_ncc text not null,
  ten_doi_tac text not null,
  doi_tuong text not null,
  so_hop_dong text not null unique,
  ten_hop_dong text not null,
  loai_hop_dong text not null,
  ngay_ky date not null,
  ngay_hieu_luc date not null,
  ngay_het_han date,
  gia_tri numeric(18, 2) not null default 0,
  tien_te text not null default 'VND',
  dieu_khoan_thanh_toan text not null default '',
  noi_dung text not null default '',
  dai_dien_ben_a text not null,
  chuc_vu_ben_a text not null,
  dai_dien_ben_b text not null,
  chuc_vu_ben_b text not null default '',
  nguoi_phu_trach text not null,
  trang_thai text not null default 'Nháp',
  ghi_chu text not null default '',
  created_at timestamptz not null default now(),
  constraint hop_dong_ncc_doi_tuong_check
    check (doi_tuong in ('NCC', 'Gia công', 'Nhân sự', 'Khách hàng')),
  constraint hop_dong_ncc_tien_te_check
    check (tien_te in ('VND', 'USD')),
  constraint hop_dong_ncc_trang_thai_check
    check (trang_thai in ('Nháp', 'Đang hiệu lực', 'Hết hạn')),
  constraint hop_dong_ncc_gia_tri_check check (gia_tri >= 0),
  constraint hop_dong_ncc_thoi_han_check
    check (ngay_het_han is null or ngay_het_han >= ngay_hieu_luc)
);

alter table public.hop_dong_ncc enable row level security;

drop policy if exists "Authenticated users can read supplier contracts" on public.hop_dong_ncc;
create policy "Authenticated users can read supplier contracts"
  on public.hop_dong_ncc for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can create supplier contracts" on public.hop_dong_ncc;
create policy "Authenticated users can create supplier contracts"
  on public.hop_dong_ncc for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated users can update supplier contracts" on public.hop_dong_ncc;
create policy "Authenticated users can update supplier contracts"
  on public.hop_dong_ncc for update
  to authenticated
  using (true)
  with check (true);

create index if not exists hop_dong_ncc_ma_ncc_idx on public.hop_dong_ncc (ma_ncc);
create index if not exists hop_dong_ncc_ngay_het_han_idx on public.hop_dong_ncc (ngay_het_han);
