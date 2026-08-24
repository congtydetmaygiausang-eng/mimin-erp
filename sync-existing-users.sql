-- ==============================================================================
-- Cập nhật ngày: 2026-08-24
-- Chức năng: Kéo toàn bộ user cũ đang có bên Supabase (auth.users) 
-- mà bị thiếu bên web (bảng public.users) sang web.
-- Điều này giúp tất cả các user đã lỡ tạo trước đây đều hiện lên trên 
-- mục "Phân quyền tùy chỉnh => Gán user cho role".
-- ==============================================================================

INSERT INTO public.users (
  id, 
  email, 
  name, 
  role, 
  "chucVu", 
  "phongBan", 
  "isActive", 
  created_at
)
SELECT 
  au.id::text, 
  au.email, 
  COALESCE(SPLIT_PART(au.email, '@', 1), 'User Cũ'), 
  'user', -- Để tạm role trống để admin tự gán sau
  'Nhân viên (Cần cập nhật)', 
  'ban-hanh-chinh', 
  true, 
  NOW()
FROM auth.users au
WHERE au.id::text NOT IN (SELECT id FROM public.users)
  AND au.email NOT IN (SELECT email FROM public.users)
ON CONFLICT (id) DO NOTHING;
