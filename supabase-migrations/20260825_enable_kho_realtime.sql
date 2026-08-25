-- MIMIN ERP - Bật đồng bộ Kho vải giữa các tài khoản/thiết bị.
BEGIN;

ALTER TABLE public.kho ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.kho TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.kho TO authenticated;

DROP POLICY IF EXISTS "anon_read_kho" ON public.kho;
DROP POLICY IF EXISTS "auth_write_kho" ON public.kho;

CREATE POLICY "anon_read_kho" ON public.kho
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "auth_write_kho" ON public.kho
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'kho'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.kho;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
COMMIT;
