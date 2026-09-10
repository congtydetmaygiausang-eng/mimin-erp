"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseEnabled } from "@/lib/supabase/client";
import { camelToSnake, snakeToCamel } from "@/lib/supabase/sync-helper";
import type { ChamCongRecord } from "@/lib/cham-cong";

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

/** Merge: Supabase là source of truth, nhưng giữ lại records local chưa sync lên */
function mergeRecords(remote: ChamCongRecord[], local: ChamCongRecord[]): ChamCongRecord[] {
  const map = new Map<string, ChamCongRecord>();
  // Local trước (thấp hơn priority)
  local.forEach((r) => map.set(r.id, r));
  // Remote ghi đè lên (cao hơn priority)
  remote.forEach((r) => map.set(r.id, r));
  return Array.from(map.values());
}

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
        const remote = (data || []).map((row) => snakeToCamel(row) as ChamCongRecord);
        // Merge: giữ records local chưa sync, nhưng ưu tiên remote
        const local = loadLocal();
        const merged = mergeRecords(remote, local);
        setRecords(merged);
        saveLocal(merged);
        setSource("supabase");
        console.log(`[cham-cong] Đã sync: ${remote.length} remote + ${local.length} local → ${merged.length} merged`);
      } else {
        console.warn("[cham-cong] Lỗi Supabase, giữ local:", error.message);
        // Giữ nguyên localStorage, không ghi đè
      }
      if (active) setLoading(false);
    };
    void fetchRecords();
    return () => { active = false; };
  }, []);

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

  return { records, saveRecord, loading, source };
}
