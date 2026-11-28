-- =========================================================================
-- MIMIN ERP - Bổ sung RLS cho bucket employee-documents (Storage)
-- 2026-11-13
-- - Cho phép người dùng nội bộ đã xác thực (authenticated) upload và xem ảnh hồ sơ / CCCD
-- =========================================================================

begin;

-- Policy upload / insert vào bucket employee-documents
create policy "authenticated_upload_employee_documents"
on storage.objects for insert to authenticated
with check (bucket_id = 'employee-documents');

-- Policy update file trong bucket employee-documents
create policy "authenticated_update_employee_documents"
on storage.objects for update to authenticated
using (bucket_id = 'employee-documents')
with check (bucket_id = 'employee-documents');

-- Policy đọc / select file trong bucket employee-documents
create policy "authenticated_select_employee_documents"
on storage.objects for select to authenticated
using (bucket_id = 'employee-documents');

commit;

