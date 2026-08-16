-- @codex Giai đoạn 2: năng lực, vị trí và bộ lọc bán kính cho Mạng lưới sản xuất.
-- Chỉ mở rộng bảng production_partners; không tham chiếu hay thay đổi danh mục ERP cũ.

alter table public.production_partners
  add column if not exists capabilities text[] not null default '{}',
  add column if not exists capacity_per_month integer,
  add column if not exists minimum_order_quantity integer,
  add column if not exists lead_time_days integer,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists service_radius_km integer,
  add column if not exists quality_score smallint,
  add column if not exists reliability_score smallint;

alter table public.production_partners
  drop constraint if exists production_partners_capacity_nonnegative,
  add constraint production_partners_capacity_nonnegative
    check (capacity_per_month is null or capacity_per_month >= 0),
  drop constraint if exists production_partners_moq_nonnegative,
  add constraint production_partners_moq_nonnegative
    check (minimum_order_quantity is null or minimum_order_quantity >= 0),
  drop constraint if exists production_partners_lead_time_nonnegative,
  add constraint production_partners_lead_time_nonnegative
    check (lead_time_days is null or lead_time_days >= 0),
  drop constraint if exists production_partners_latitude_range,
  add constraint production_partners_latitude_range
    check (latitude is null or latitude between -90 and 90),
  drop constraint if exists production_partners_longitude_range,
  add constraint production_partners_longitude_range
    check (longitude is null or longitude between -180 and 180),
  drop constraint if exists production_partners_coordinates_pair,
  add constraint production_partners_coordinates_pair
    check ((latitude is null) = (longitude is null)),
  drop constraint if exists production_partners_service_radius_nonnegative,
  add constraint production_partners_service_radius_nonnegative
    check (service_radius_km is null or service_radius_km >= 0),
  drop constraint if exists production_partners_quality_score_range,
  add constraint production_partners_quality_score_range
    check (quality_score is null or quality_score between 0 and 100),
  drop constraint if exists production_partners_reliability_score_range,
  add constraint production_partners_reliability_score_range
    check (reliability_score is null or reliability_score between 0 and 100);

create index if not exists production_partners_org_location_idx
  on public.production_partners (organization_id, latitude, longitude)
  where latitude is not null and longitude is not null;

create index if not exists production_partners_capabilities_gin_idx
  on public.production_partners using gin (capabilities);

drop function if exists public.save_production_partner(
  uuid, text, text, text, text, text, text, text, text, text, text,
  text, text, text, text[]
);

create function public.save_production_partner(
  p_id uuid,
  p_partner_code text,
  p_legal_name text,
  p_tax_code text,
  p_phone text,
  p_email text,
  p_website text,
  p_contact_name text,
  p_address text,
  p_province text,
  p_district text,
  p_status text,
  p_verification_status text,
  p_notes text,
  p_roles text[],
  p_capabilities text[],
  p_capacity_per_month integer,
  p_minimum_order_quantity integer,
  p_lead_time_days integer,
  p_latitude double precision,
  p_longitude double precision,
  p_service_radius_km integer,
  p_quality_score smallint,
  p_reliability_score smallint
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  saved_id uuid;
  invalid_role text;
begin
  if coalesce(array_length(p_roles, 1), 0) = 0 then
    raise exception 'Đối tác phải có ít nhất một vai trò';
  end if;

  select role_name into invalid_role
  from unnest(p_roles) as role_name
  where role_name not in (
    'CUSTOMER', 'SATELLITE_PROCESSOR', 'MATERIAL_SUPPLIER', 'PACKAGING_FINISHER'
  )
  limit 1;

  if invalid_role is not null then
    raise exception 'Vai trò không hợp lệ: %', invalid_role;
  end if;

  if (p_latitude is null) <> (p_longitude is null) then
    raise exception 'Vĩ độ và kinh độ phải được nhập cùng nhau';
  end if;

  if p_id is null then
    insert into public.production_partners (
      organization_id, partner_code, legal_name, tax_code, phone, email,
      website, contact_name, address, province, district, status,
      verification_status, notes, capabilities, capacity_per_month,
      minimum_order_quantity, lead_time_days, latitude, longitude,
      service_radius_km, quality_score, reliability_score, created_by, updated_by
    ) values (
      'mimin', trim(p_partner_code), trim(p_legal_name), nullif(trim(p_tax_code), ''),
      nullif(trim(p_phone), ''), nullif(trim(p_email), ''), nullif(trim(p_website), ''),
      nullif(trim(p_contact_name), ''), nullif(trim(p_address), ''),
      nullif(trim(p_province), ''), nullif(trim(p_district), ''), p_status,
      p_verification_status, nullif(trim(p_notes), ''), coalesce(p_capabilities, '{}'),
      p_capacity_per_month, p_minimum_order_quantity, p_lead_time_days,
      p_latitude, p_longitude, p_service_radius_km, p_quality_score,
      p_reliability_score, (select auth.uid()), (select auth.uid())
    ) returning id into saved_id;
  else
    update public.production_partners
    set partner_code = trim(p_partner_code), legal_name = trim(p_legal_name),
        tax_code = nullif(trim(p_tax_code), ''), phone = nullif(trim(p_phone), ''),
        email = nullif(trim(p_email), ''), website = nullif(trim(p_website), ''),
        contact_name = nullif(trim(p_contact_name), ''), address = nullif(trim(p_address), ''),
        province = nullif(trim(p_province), ''), district = nullif(trim(p_district), ''),
        status = p_status, verification_status = p_verification_status,
        notes = nullif(trim(p_notes), ''), capabilities = coalesce(p_capabilities, '{}'),
        capacity_per_month = p_capacity_per_month,
        minimum_order_quantity = p_minimum_order_quantity,
        lead_time_days = p_lead_time_days, latitude = p_latitude, longitude = p_longitude,
        service_radius_km = p_service_radius_km, quality_score = p_quality_score,
        reliability_score = p_reliability_score
    where id = p_id and organization_id = 'mimin'
    returning id into saved_id;

    if saved_id is null then
      raise exception 'Không tìm thấy đối tác hoặc không có quyền cập nhật';
    end if;
  end if;

  delete from public.production_partner_roles
  where partner_id = saved_id and organization_id = 'mimin';

  insert into public.production_partner_roles (organization_id, partner_id, role)
  select 'mimin', saved_id, role_name
  from (select distinct unnest(p_roles) as role_name) selected_roles;

  return saved_id;
end;
$$;

revoke all on function public.save_production_partner(
  uuid, text, text, text, text, text, text, text, text, text, text,
  text, text, text, text[], text[], integer, integer, integer,
  double precision, double precision, integer, smallint, smallint
) from public, anon;
grant execute on function public.save_production_partner(
  uuid, text, text, text, text, text, text, text, text, text, text,
  text, text, text, text[], text[], integer, integer, integer,
  double precision, double precision, integer, smallint, smallint
) to authenticated;

comment on column public.production_partners.capabilities is
  'Năng lực/sản phẩm/dịch vụ được chuẩn hóa dưới dạng danh sách.';
comment on column public.production_partners.latitude is
  'Vĩ độ WGS84 dùng tính khoảng cách tại giao diện.';
comment on column public.production_partners.longitude is
  'Kinh độ WGS84 dùng tính khoảng cách tại giao diện.';
