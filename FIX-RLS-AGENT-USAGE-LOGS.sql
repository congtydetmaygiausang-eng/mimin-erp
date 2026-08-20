-- ============================================
-- FIX: RLS chặn ghi log sử dụng agent (agent_usage_logs)
-- 2026-08-20
-- ============================================
-- Bối cảnh: mỗi lần 1 agent (Mavis/Minh/Lan/Hà/Vy/MIMIN Help) trả lời xong,
-- code gọi trackUsage() insert 1 dòng vào bảng agent_usage_logs để trang
-- /agents (Dashboard) hiển thị số liệu thật (calls/ngày, cost/ngày, latency...).
-- Log dev server cho thấy MỌI lần insert đều bị chặn:
--   [trackUsage] Supabase error: new row violates row-level security policy
--   for table "agent_usage_logs"
-- => Dashboard Agent luôn hiện "0 calls/ngày" dù agent đã trả lời thật nhiều
-- lần - không phải do agent không hoạt động, mà do không ghi log được.
--
-- Đây là bảng log/thống kê nội bộ, không chứa dữ liệu nhạy cảm của khách hàng
-- hay tài chính công ty - áp policy cho phép đọc/ghi giống các bảng khác
-- trong schema.sql (VD don_hang, phan_cong) đang dùng.
--
-- An toàn chạy lại nhiều lần.

BEGIN;

ALTER TABLE IF EXISTS agent_usage_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for agent_usage_logs" ON agent_usage_logs;
CREATE POLICY "Allow all for agent_usage_logs" ON agent_usage_logs FOR ALL USING (true) WITH CHECK (true);

COMMIT;

-- ============================================
-- KIỂM TRA SAU KHI CHẠY:
-- SELECT count(*) FROM agent_usage_logs; -- phải chạy được không lỗi RLS
-- ============================================
