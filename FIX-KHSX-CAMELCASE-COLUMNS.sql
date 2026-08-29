ALTER TABLE khsx 
ADD COLUMN IF NOT EXISTS "maSP" TEXT,
ADD COLUMN IF NOT EXISTS "tenSP" TEXT,
ADD COLUMN IF NOT EXISTS "loaiSP" TEXT,
ADD COLUMN IF NOT EXISTS "tiLeSize" TEXT,
ADD COLUMN IF NOT EXISTS "dsMau" JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS "lenhCatId" TEXT;

-- Drop policy cũ nếu có (bởi vì policy cũ có thể check cột snake_case)
DROP POLICY IF EXISTS khsx_insert_all ON public.khsx;
DROP POLICY IF EXISTS khsx_update_all ON public.khsx;

-- Tạo lại policy bảo mật sử dụng cột camelCase
CREATE POLICY khsx_insert_all ON public.khsx FOR INSERT TO anon, authenticated WITH CHECK (char_length("maKHSX") between 1 and 100 and "soLuong" >= 0);
CREATE POLICY khsx_update_all ON public.khsx FOR UPDATE TO anon, authenticated USING (true) WITH CHECK ("soLuong" >= 0);

-- Phân quyền lại cho chắc chắn
GRANT SELECT, INSERT, UPDATE, DELETE ON public.khsx TO anon, authenticated;
NOTIFY pgrst, 'reload schema';
