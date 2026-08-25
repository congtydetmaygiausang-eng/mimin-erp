begin;

create table if not exists public.bang_size (
  id text primary key,
  ten_bang text not null,
  gia_tri text not null,
  sizes text[] not null,
  ratios integer[] not null,
  ri_so integer not null,
  ghi_chu text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bang_size_id_format check (id ~ '^custom-[0-9]+$'),
  constraint bang_size_ten_length check (char_length(ten_bang) between 1 and 200),
  constraint bang_size_arrays_match check (cardinality(sizes) = cardinality(ratios)),
  constraint bang_size_count_valid check (cardinality(sizes) between 1 and 20),
  constraint bang_size_ri_so_valid check (ri_so > 0)
);

alter table public.bang_size enable row level security;

drop policy if exists bang_size_read_all on public.bang_size;
create policy bang_size_read_all on public.bang_size
for select to anon, authenticated using (true);

drop policy if exists bang_size_insert_anon on public.bang_size;
create policy bang_size_insert_anon on public.bang_size
for insert to anon
with check (
  id ~ '^custom-[0-9]+$'
  and char_length(ten_bang) between 1 and 200
  and cardinality(sizes) = cardinality(ratios)
  and cardinality(sizes) between 1 and 20
  and ri_so > 0
);

drop policy if exists bang_size_authenticated_write on public.bang_size;
create policy bang_size_authenticated_write on public.bang_size
for all to authenticated using (true) with check (true);

grant select, insert on public.bang_size to anon;
grant select, insert, update, delete on public.bang_size to authenticated;

notify pgrst, 'reload schema';
commit;
