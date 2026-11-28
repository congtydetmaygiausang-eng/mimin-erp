-- =========================================================================
-- MIMIN ERP - Chuẩn hóa RLS, Realtime cho public.cham_cong & backfill quyền
-- 2026-11-12
-- - Hỗ trợ nhận diện role admin / quan_tri & mã NV từ cả JWT và public.users
-- - Chỉ Admin (admin / quan_tri) được sửa tay toàn bảng lưới và xóa dữ liệu
-- - Toàn bộ nhân viên nội bộ được xem bảng chấm công & tự bấm Vào làm / Kết thúc
-- - Bật Supabase Realtime cho public.cham_cong để mọi thiết bị tự cập nhật
-- - Backfill permission_settings ('global') mở quyền "cham-cong": "rcu" cho role nội bộ
-- =========================================================================

begin;

-- 1. Hàm helper RLS: xác định Admin từ app_metadata hoặc bảng public.users (u.id = auth.uid()::text)
create or replace function public.is_cham_cong_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')) in ('admin', 'quan_tri')
    or exists (
      select 1
      from public.users u
      where (
        u.id = auth.uid()::text
        or (
          coalesce(auth.jwt() ->> 'email', '') <> ''
          and lower(coalesce(u.email, '')) = lower(auth.jwt() ->> 'email')
        )
      )
      and coalesce(u."isActive", true) = true
      and lower(coalesce(u.role, '')) in ('admin', 'quan_tri')
    );
$$;

-- 2. Hàm helper RLS: xác định người dùng nội bộ (loại trừ đối tác / khách hàng ngoài hệ thống)
create or replace function public.is_cham_cong_internal_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    auth.uid() is not null
    and lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')) not in (
      'partner', 'supplier', 'workshop_customer', 'buyer_customer'
    )
    and not exists (
      select 1
      from public.users u
      where (
        u.id = auth.uid()::text
        or (
          coalesce(auth.jwt() ->> 'email', '') <> ''
          and lower(coalesce(u.email, '')) = lower(auth.jwt() ->> 'email')
        )
      )
      and (
        coalesce(u."isActive", true) = false
        or lower(coalesce(u.role, '')) in (
          'partner', 'supplier', 'workshop_customer', 'buyer_customer'
        )
      )
    );
$$;

-- 3. Hàm helper RLS: kiểm tra target_ma_nv thuộc đúng nhân viên đang đăng nhập
create or replace function public.is_own_cham_cong_employee(target_ma_nv text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    target_ma_nv is not null
    and length(trim(target_ma_nv)) > 0
    and (
      upper(trim(coalesce(auth.jwt() -> 'user_metadata' ->> 'maNV', ''))) = upper(trim(target_ma_nv))
      or exists (
        select 1
        from public.users u
        where (
          u.id = auth.uid()::text
          or (
            coalesce(auth.jwt() ->> 'email', '') <> ''
            and lower(coalesce(u.email, '')) = lower(auth.jwt() ->> 'email')
          )
        )
        and coalesce(u."isActive", true) = true
        and upper(trim(coalesce(u."maNV", ''))) = upper(trim(target_ma_nv))
      )
    );
$$;

-- 4. Hàm helper RLS: kiểm tra quyền tự chấm công Vào làm / Kết thúc của nhân viên nội bộ
create or replace function public.can_self_punch_cham_cong(target_ma_nv text, target_auth_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    auth.uid() is not null
    and target_auth_user_id = auth.uid()
    and length(trim(coalesce(target_ma_nv, ''))) > 0
    and public.is_cham_cong_internal_user()
    and (
      public.is_own_cham_cong_employee(target_ma_nv)
      or (
        coalesce(trim(auth.jwt() -> 'user_metadata' ->> 'maNV'), '') = ''
        and not exists (
          select 1
          from public.users u
          where (
            u.id = auth.uid()::text
            or (
              coalesce(auth.jwt() ->> 'email', '') <> ''
              and lower(coalesce(u.email, '')) = lower(auth.jwt() ->> 'email')
            )
          )
          and coalesce(trim(u."maNV"), '') <> ''
        )
      )
    );
$$;

revoke all on function public.is_cham_cong_admin() from public, anon;
revoke all on function public.is_cham_cong_internal_user() from public, anon;
revoke all on function public.is_own_cham_cong_employee(text) from public, anon;
revoke all on function public.can_self_punch_cham_cong(text, uuid) from public, anon;

grant execute on function public.is_cham_cong_admin() to authenticated;
grant execute on function public.is_cham_cong_internal_user() to authenticated;
grant execute on function public.is_own_cham_cong_employee(text) to authenticated;
grant execute on function public.can_self_punch_cham_cong(text, uuid) to authenticated;

-- 5. Gỡ bỏ check cứng gio_ra >= gio_vao để không làm rớt dữ liệu giờ ra nếu đồng hồ thiết bị lệch giờ
alter table public.cham_cong drop constraint if exists cham_cong_gio_hop_le_check;

-- 6. Cập nhật toàn bộ RLS policies trên public.cham_cong
alter table public.cham_cong enable row level security;

drop policy if exists cham_cong_authenticated_select on public.cham_cong;
create policy cham_cong_authenticated_select on public.cham_cong
for select to authenticated
using (
  public.is_cham_cong_admin()
  or public.is_cham_cong_internal_user()
  or (select auth.uid()) = auth_user_id
);

drop policy if exists cham_cong_authenticated_insert on public.cham_cong;
create policy cham_cong_authenticated_insert on public.cham_cong
for insert to authenticated
with check (
  public.is_cham_cong_admin()
  or public.can_self_punch_cham_cong(ma_nv, auth_user_id)
);

drop policy if exists cham_cong_authenticated_update on public.cham_cong;
create policy cham_cong_authenticated_update on public.cham_cong
for update to authenticated
using (
  public.is_cham_cong_admin()
  or (
    public.is_cham_cong_internal_user()
    and (
      (select auth.uid()) = auth_user_id
      or public.is_own_cham_cong_employee(ma_nv)
    )
  )
)
with check (
  public.is_cham_cong_admin()
  or public.can_self_punch_cham_cong(ma_nv, auth_user_id)
  or (
    public.is_cham_cong_internal_user()
    and public.is_own_cham_cong_employee(ma_nv)
  )
);

drop policy if exists cham_cong_authenticated_delete on public.cham_cong;
create policy cham_cong_authenticated_delete on public.cham_cong
for delete to authenticated
using (public.is_cham_cong_admin());

-- 7. Bật Supabase Realtime cho bảng public.cham_cong (idempotent)
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'cham_cong'
  ) then
    alter publication supabase_realtime add table public.cham_cong;
  end if;
end $$;

-- 8. Backfill quyền "cham-cong": "rcu" cho các role nội bộ trong permission_settings ('global')
do $$
declare
  current_matrix jsonb;
  updated_matrix jsonb;
  r text;
  internal_roles text[] := array[
    'planner', 'warehouse', 'sewing', 'qc', 'finishing',
    'accountant', 'content', 'cutting', 'printing',
    'buttoning', 'ironing', 'packaging', 'attendance'
  ];
begin
  select matrix into current_matrix
  from public.permission_settings
  where id = 'global';

  if current_matrix is not null
     and jsonb_typeof(current_matrix) = 'object'
     and current_matrix <> '{}'::jsonb
     and (
       coalesce(current_matrix -> 'attendance' ->> 'cham-cong', '') = ''
       or coalesce(current_matrix -> 'cutting' ->> 'cham-cong', '') = ''
       or (
         coalesce(current_matrix -> 'warehouse' ->> 'cham-cong', '') = ''
         and coalesce(current_matrix -> 'qc' ->> 'cham-cong', '') = ''
         and coalesce(current_matrix -> 'content' ->> 'cham-cong', '') = ''
         and coalesce(current_matrix -> 'cutting' ->> 'cham-cong', '') = ''
       )
     )
  then
    updated_matrix := current_matrix;
    foreach r in array internal_roles loop
      if coalesce(updated_matrix -> r ->> 'cham-cong', '') = '' then
        updated_matrix := jsonb_set(
          updated_matrix,
          array[r, 'cham-cong'],
          '"rcu"'::jsonb,
          true
        );
      end if;
    end loop;

    update public.permission_settings
    set matrix = updated_matrix,
        updated_at = now()
    where id = 'global';
  end if;
end $$;

notify pgrst, 'reload schema';

commit;

