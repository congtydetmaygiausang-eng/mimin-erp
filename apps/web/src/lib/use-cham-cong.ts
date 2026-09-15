"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseEnabled } from "@/lib/supabase/client";
import { camelToSnake, useSupabaseRealtime } from "@/lib/supabase/sync-helper";
import type { ChamCongRecord } from "@/lib/cham-cong";

/**
 * Normalize 1 row từ Supabase (snake_case) → ChamCongRecord (camelCase chính xác).
 * KHÔNG dùng snakeToCamel chung vì nó convert "ma_nv" → "maNv" (sai)
 * thay vì "maNV" (đúng theo type định nghĩa).
 */
function normalizeFromDB(row: Record<string, unknown>): ChamCongRecord {
  return {
    id:           String(row.id ?? ""),
    maNV:         String(row.ma_nv ?? ""),          // ma_nv → maNV
    authUserId:   row.auth_user_id as string | undefined,
    boPhan:       row.bo_phan as string | undefined, // bo_phan → boPhan
    ngay:         String(row.ngay ?? ""),
    trangThai:    row.trang_thai as ChamCongRecord["trangThai"],
    gioVao:       row.gio_vao as string | undefined,
    gioRa:        row.gio_ra as string | undefined,
    soGioTangCa:  Number(row.so_gio_tang_ca ?? 0),
    ghiChu:       row.ghi_chu as string | undefined,
    createdAt:    String(row.created_at ?? row.createdAt ?? ""),
    updatedAt:    String(row.updated_at ?? row.updatedAt ?? ""),
  };
}

const STORAGE_KEY = "mimin_cham_cong_v1";

function loadLocal(): ChamCongRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as ChamCongRecord[] : [];
  } catch {
    return [];
  }
}

function saveLocal(rows: ChamCongRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

/** Lấy remote làm chuẩn, chỉ dùng local để load nhanh ban đầu hoặc khi offline */

export function useChamCong() {
  // Khởi tạo ngay từ localStorage → tránh mất data khi F5
  const [records, setRecords] = useState<ChamCongRecord[]>(() => loadLocal());
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"local" | "supabase">("local");

  useEffect(() => {
    let active = true;

    const fetchRecords = async () => {
      if (!isSupabaseEnabled || !supabase) {
        if (active) setLoading(false);
        return;
      }
      const { data, error } = await supabase.from("cham_cong").select("*").order("ngay", { ascending: false });
      if (!active) return;
      if (!error) {
        const remote = (data || []).map((row) => normalizeFromDB(row as Record<string, unknown>));
        // Lấy remote làm chuẩn tuyệt đối khi có kết nối
        setRecords(remote);
        saveLocal(remote);
        setSource("supabase");
        console.log(`[cham-cong] Đã sync: ${remote.length} remote`);
      } else {
        console.warn("[cham-cong] Lỗi Supabase, giữ local:", error.message);
        // Giữ nguyên localStorage, không ghi đè
      }
      if (active) setLoading(false);
    };
    void fetchRecords();
    return () => { active = false; };
  }, []);

  // Đăng ký realtime updates từ Supabase
  useSupabaseRealtime<ChamCongRecord>("cham_cong", setRecords, {
    mapIn: (row: any) => normalizeFromDB(row),
    primaryKey: "id",
    localStorageKey: STORAGE_KEY,
  });

  const saveRecord = useCallback(async (record: ChamCongRecord) => {
    // 1. Cập nhật state + localStorage ngay lập tức
    setRecords((current) => {
      const exists = current.some((item) => item.id === record.id);
      const next = exists ? current.map((item) => item.id === record.id ? record : item) : [...current, record];
      saveLocal(next);
      return next;
    });
    // 2. Sync Supabase bất đồng bộ
    if (isSupabaseEnabled && supabase) {
      const payload = camelToSnake(record);
      // Thử upsert theo (ma_nv, ngay) trước
      const { error } = await supabase.from("cham_cong").upsert(payload, { onConflict: "ma_nv,ngay" });
      if (error) {
        console.warn("[cham-cong] upsert (ma_nv,ngay) fail:", error.message, error.details);
        // Fallback: upsert theo id
        const { error: err2 } = await supabase.from("cham_cong").upsert(payload, { onConflict: "id" });
        if (err2) console.warn("[cham-cong] upsert (id) fail:", err2.message, err2.details);
        else console.log("[cham-cong] upsert (id) OK:", record.id);
      } else {
        console.log("[cham-cong] upsert OK:", record.id);
      }
    }
  }, []);

  const clearRecords = useCallback(async () => {
    setRecords([]);
    saveLocal([]);
    if (isSupabaseEnabled && supabase) {
      const { error } = await supabase.from("cham_cong").delete().neq("id", "none");
      if (error) {
        console.warn("[cham-cong] Lỗi xóa dữ liệu:", error.message);
      } else {
        console.log("[cham-cong] Đã xóa toàn bộ dữ liệu Supabase");
      }
    }
  }, []);

  const deleteRecord = useCallback(async (record: ChamCongRecord, user: any) => {
    setRecords((current) => {
      const next = current.filter((item) => item.id !== record.id);
      saveLocal(next);
      return next;
    });

    if (isSupabaseEnabled && supabase) {
      const { logCRUD } = await import("@/lib/audit-log");
      const { supabaseDelete } = await import("@/lib/supabase/sync-helper");
      
      if (user) {
        logCRUD(user, "cham-cong", "delete", `Chấm công NV ${record.maNV} ngày ${record.ngay}`, record.id, { oldValue: record });
      }
      await supabaseDelete("cham_cong", record.id);
    }
  }, []);

  return { records, saveRecord, deleteRecord, clearRecords, loading, source };
}
