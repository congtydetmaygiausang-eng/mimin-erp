-- ==============================================================================
-- Cập nhật ngày: 2026-08-24
-- Chức năng: Trigger tự động thêm bản ghi vào bảng nhan_su khi tạo user mới
-- trên Supabase Authentication. 
-- Điều này giải quyết lỗi "Không có quyền truy cập" hoặc không hiển thị 
-- trên giao diện "Quản lý tài khoản" khi tạo tài khoản trực tiếp qua Dashboard.
-- ==============================================================================

-- 1. Xóa hàm và trigger cũ nếu có để tránh lỗi trùng lặp
DROP TRIGGER IF EXISTS trg_auto_insert_nhan_su ON auth.users;
DROP FUNCTION IF EXISTS public.auto_insert_nhan_su_after_auth_user_created();

-- 2. Tạo Function để xử lý dữ liệu tự động
CREATE OR REPLACE FUNCTION public.auto_insert_nhan_su_after_auth_user_created()
RETURNS TRIGGER AS $$
DECLARE
  v_stt integer;
  v_ma_nv text;
  v_ho_ten text;
BEGIN
  -- Tính toán số thứ tự (stt) mới nhất + 1 để tránh lỗi trùng lặp khoá chính
  SELECT COALESCE(MAX(stt), 0) + 1 INTO v_stt FROM public.nhan_su;
  
  -- Tạo Mã NV ngẫu nhiên dựa trên UUID (ví dụ: NV-1a2b3c) 
  -- để đảm bảo luôn Unique (duy nhất) như yêu cầu của bảng nhan_su
  v_ma_nv := 'NV-' || UPPER(SUBSTRING(NEW.id::text FROM 1 FOR 6));
  
  -- Lấy tên từ email nếu có (trước chữ @), nếu không có thì để mặc định
  IF NEW.email IS NOT NULL THEN
    v_ho_ten := SPLIT_PART(NEW.email, '@', 1);
  ELSE
    v_ho_ten := 'User Mới';
  END IF;

  -- Insert dữ liệu vào bảng nhan_su
  INSERT INTO public.nhan_su (
    stt, 
    user_id, 
    ma_nv, 
    ho_ten, 
    email, 
    chuc_vu, 
    bo_phan, 
    role, 
    trang_thai, 
    created_at
  )
  VALUES (
    v_stt, 
    NEW.id, 
    v_ma_nv, 
    v_ho_ten, 
    NEW.email, 
    'Nhân viên mới (Cần cập nhật)', 
    'ban-hanh-chinh', 
    'user', -- Role mặc định
    'dang_lam', 
    NOW()
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Bắt lỗi để không làm hỏng tiến trình tạo user của Supabase (nếu có lỗi insert vào nhan_su)
  RAISE WARNING 'Lỗi khi auto-insert vào nhan_su: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Gắn Trigger vào bảng auth.users
CREATE TRIGGER trg_auto_insert_nhan_su
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_insert_nhan_su_after_auth_user_created();
