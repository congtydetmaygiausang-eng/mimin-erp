-- ==============================================================================
-- Cập nhật ngày: 2026-08-24
-- Chức năng: Trigger tự động thêm bản ghi vào bảng public.users khi tạo user mới
-- trên Supabase Authentication. 
-- Bảng public.users mới chính là bảng hiển thị trên màn hình "Quản lý tài khoản"
-- ==============================================================================

-- 1. Xóa hàm và trigger cũ nếu có để tránh lỗi trùng lặp
DROP TRIGGER IF EXISTS trg_auto_insert_public_users ON auth.users;
DROP FUNCTION IF EXISTS public.auto_insert_public_users_after_auth_user_created();

-- 2. Tạo Function để xử lý dữ liệu tự động
CREATE OR REPLACE FUNCTION public.auto_insert_public_users_after_auth_user_created()
RETURNS TRIGGER AS $$
DECLARE
  v_name text;
BEGIN
  -- Lấy tên từ email nếu có (trước chữ @), nếu không có thì để mặc định
  IF NEW.email IS NOT NULL THEN
    v_name := SPLIT_PART(NEW.email, '@', 1);
  ELSE
    v_name := 'User Mới';
  END IF;

  -- Insert dữ liệu vào bảng public.users
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
  VALUES (
    NEW.id::text, 
    NEW.email, 
    v_name, 
    'user', -- Role mặc định
    'Nhân viên mới (Cần cập nhật)', 
    'ban-hanh-chinh', 
    true, 
    NOW()
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Bắt lỗi để không làm hỏng tiến trình tạo user của Supabase (nếu có lỗi insert)
  RAISE WARNING 'Lỗi khi auto-insert vào public.users: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Gắn Trigger vào bảng auth.users
CREATE TRIGGER trg_auto_insert_public_users
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_insert_public_users_after_auth_user_created();
