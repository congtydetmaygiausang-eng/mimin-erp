-- =========================================================================
-- MIMIN ERP - SỬA LỖI PHÂN QUYỀN: permission denied for table permission_settings
-- =========================================================================

-- 1. Đảm bảo bảng permission_settings tồn tại
CREATE TABLE IF NOT EXISTS public.permission_settings (
  id text PRIMARY KEY,
  matrix jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. CẤP QUYỀN TOÀN DIỆN CHO CÁC ROLE SUPABASE (SỬA LỖI 42501 permission denied)
GRANT ALL ON TABLE public.permission_settings TO authenticated;
GRANT ALL ON TABLE public.permission_settings TO service_role;
GRANT SELECT ON TABLE public.permission_settings TO anon;

-- 3. Cấp quyền trên sequences (nếu có)
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 4. Cấu hình Row Level Security (RLS)
ALTER TABLE public.permission_settings ENABLE ROW LEVEL SECURITY;

-- 4.1. Cho phép đọc công khai (để mọi máy đồng bộ quyền ngay khi mở app)
DROP POLICY IF EXISTS "authenticated_read_permission_settings" ON public.permission_settings;
DROP POLICY IF EXISTS "allow_read_permission_settings" ON public.permission_settings;
CREATE POLICY "allow_read_permission_settings"
  ON public.permission_settings FOR SELECT
  TO authenticated, anon
  USING (true);

-- 4.2. Cho phép ghi cho authenticated (Admin lưu ma trận phân quyền)
DROP POLICY IF EXISTS "admin_write_permission_settings" ON public.permission_settings;
DROP POLICY IF EXISTS "authenticated_write_permission_settings" ON public.permission_settings;
DROP POLICY IF EXISTS "allow_write_permission_settings" ON public.permission_settings;
CREATE POLICY "allow_write_permission_settings"
  ON public.permission_settings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5. Đảm bảo row 'global' luôn tồn tại sẵn
INSERT INTO public.permission_settings (id, matrix, updated_at)
VALUES ('global', '{}'::jsonb, now())
ON CONFLICT (id) DO UPDATE SET updated_at = now();

-- 6. Kích hoạt Supabase Realtime cho bảng permission_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'permission_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.permission_settings;
  END IF;
END $$;
