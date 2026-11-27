begin;

alter table public.kho_vai_me_nhuom
  add column if not exists ngay_nhuom date;

comment on column public.kho_vai_me_nhuom.ngay_nhuom is
  'Ngay nhuom thuc te tai xuong (co the khac ngay nhap kho).';

commit;
