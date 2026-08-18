-- ============================================
-- MIMIN ERP - Bo sung cot cho kho_thanh_pham (bien the theo mau)
-- Chay SAU khi da apply APPLY-KHO-THANH-PHAM.sql
-- 2026-08-18 - Mavis
-- ============================================
-- Vao: https://supabase.com/dashboard/project/ejcuqyaiwabfygyesvxj/sql/new
-- Paste toan bo -> bam "Run"
-- ============================================

ALTER TABLE kho_thanh_pham
  ADD COLUMN IF NOT EXISTS gia_ban_le NUMERIC,
  ADD COLUMN IF NOT EXISTS gia_ban_si NUMERIC,
  ADD COLUMN IF NOT EXISTS hinh_anh JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS video TEXT,
  ADD COLUMN IF NOT EXISTS chi_tiet_size JSONB DEFAULT '[]'::jsonb;

-- ============================================
-- HOAN THANH
-- ============================================
