-- Bắt đầu kỳ công nợ nhà cung cấp mới từ 2026-08-25.
-- Giữ nguyên hồ sơ NCC và không tác động công nợ đối tác gia công.
UPDATE public.nha_cung_cap
SET cong_no = 0
WHERE loai IS DISTINCT FROM 'doi_tac_gia_cong';
