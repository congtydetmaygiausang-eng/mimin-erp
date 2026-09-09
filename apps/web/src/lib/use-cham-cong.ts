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

export function useChamCong() {
  const [records, setRecords] = useState<ChamCongRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"local" | "supabase">("local");

  useEffect(() => {
    let active = true;
    const local = loadLocal();
    setRecords(local);

    const fetchRecords = async () => {
      if (!isSupabaseEnabled || !supabase) {
        if (active) setLoading(false);
        return;
      }
      const { data, error } = await supabase.from("cham_cong").select("*").order("ngay", { ascending: false });
      if (!active) return;
      if (!error) {
        const remote = (data || []).map((row) => snakeToCamel(row) as ChamCongRecord);
        setRecords(remote);
        saveLocal(remote);
        setSource("supabase");
      } else {
        console.warn("[cham-cong] Dùng dữ liệu local:", error.message);
      }
      setLoading(false);
    };
    void fetchRecords();
    return () => { active = false; };
  }, []);

  const saveRecord = useCallback(async (record: ChamCongRecord) => {
    setRecords((current) => {
      const exists = current.some((item) => item.id === record.id);
      const next = exists ? current.map((item) => item.id === record.id ? record : item) : [...current, record];
      saveLocal(next);
      return next;
    });
    if (isSupabaseEnabled && supabase) {
      const { error } = await supabase.from("cham_cong").upsert(camelToSnake(record), { onConflict: "ma_nv,ngay" });
      if (error) console.warn("[cham-cong] Chưa đồng bộ được Supabase:", error.message);
    }
  }, []);

  return { records, saveRecord, loading, source };
}
