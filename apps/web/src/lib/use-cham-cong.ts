"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseEnabled } from "@/lib/supabase/client";
import { camelToSnake, useSupabaseRealtime } from "@/lib/supabase/sync-helper";
import {
  chamCongRecordKey,
  mergeChamCongRecords,
  normalizeChamCongFromDB,
  upsertChamCongList,
  type ChamCongRecord,
} from "@/lib/cham-cong";

const STORAGE_KEY = "mimin_cham_cong_v1";
const PENDING_STORAGE_KEY = "mimin_cham_cong_pending_v1";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ChamCongSaveResult = {
  ok: boolean;
  synced: boolean;
  reason?: "OFFLINE" | "NO_SESSION" | "DB_ERROR";
  error?: string;
};

function isUuid(value?: string): value is string {
  return Boolean(value && UUID_RE.test(value));
}

function loadLocal(): ChamCongRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ChamCongRecord[]) : [];
  } catch {
    return [];
  }
}

function saveLocal(rows: ChamCongRecord[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  } catch {}
}

function loadPendingMap(): Record<string, ChamCongRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PENDING_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, ChamCongRecord>)
      : {};
  } catch {
    return {};
  }
}

function savePendingMap(map: Record<string, ChamCongRecord>) {
  if (typeof window === "undefined") return;
  try {
    if (Object.keys(map).length === 0) {
      localStorage.removeItem(PENDING_STORAGE_KEY);
    } else {
      localStorage.setItem(PENDING_STORAGE_KEY, JSON.stringify(map));
    }
  } catch {}
}

async function upsertRecordToSupabase(record: ChamCongRecord): Promise<{
  synced: boolean;
  reason?: "OFFLINE" | "NO_SESSION" | "DB_ERROR";
  error?: string;
}> {
  if (!isSupabaseEnabled || !supabase) {
    return { synced: false, reason: "OFFLINE" };
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const sessionUserId = sessionData.session?.user?.id;
    if (!sessionUserId) {
      return {
        synced: false,
        reason: "NO_SESSION",
        error: "Phiên Supabase chưa đăng nhập hoặc đã hết hạn.",
      };
    }

    const sanitized: ChamCongRecord = {
      ...record,
      authUserId: isUuid(record.authUserId) ? record.authUserId : sessionUserId,
    };
    const payload = camelToSnake(sanitized);

    const { error } = await supabase
      .from("cham_cong")
      .upsert(payload, { onConflict: "ma_nv,ngay" });

    if (error) {
      console.error("[cham-cong] upsert fail:", error.message, error.details);
      return { synced: false, reason: "DB_ERROR", error: error.message };
    }

    return { synced: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { synced: false, reason: "DB_ERROR", error: message };
  }
}

export function useChamCong() {
  const [records, setRecords] = useState<ChamCongRecord[]>(() =>
    mergeChamCongRecords(loadLocal(), Object.values(loadPendingMap()))
  );
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"local" | "supabase">("local");
  const [pendingCount, setPendingCount] = useState<number>(
    () => Object.keys(loadPendingMap()).length
  );

  const flushPending = useCallback(async (remoteHint?: ChamCongRecord[]) => {
    const pendingMap = loadPendingMap();
    const entries = Object.entries(pendingMap);
    if (entries.length === 0) {
      setPendingCount(0);
      return 0;
    }

    const remoteByKey = new Map(
      (remoteHint || []).map((r) => [chamCongRecordKey(r.maNV, r.ngay), r])
    );
    const nextPending: Record<string, ChamCongRecord> = { ...pendingMap };
    let syncedAny = false;

    for (const [key, pendingRecord] of entries) {
      const remoteRow = remoteByKey.get(key);
      const candidate: ChamCongRecord = remoteRow
        ? {
            ...pendingRecord,
            id: remoteRow.id || pendingRecord.id,
            authUserId: remoteRow.authUserId || pendingRecord.authUserId,
          }
        : pendingRecord;

      const res = await upsertRecordToSupabase(candidate);
      if (res.synced) {
        delete nextPending[key];
        syncedAny = true;
      }
    }

    savePendingMap(nextPending);
    const remaining = Object.keys(nextPending).length;
    setPendingCount(remaining);
    if (syncedAny && remoteHint) {
      const merged = mergeChamCongRecords(remoteHint, Object.values(nextPending));
      setRecords(merged);
      saveLocal(merged);
    }
    return entries.length - remaining;
  }, []);

  useEffect(() => {
    let active = true;

    const fetchRecords = async () => {
      const localPending = Object.values(loadPendingMap());
      setPendingCount(localPending.length);

      if (!isSupabaseEnabled || !supabase) {
        if (active) setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("cham_cong")
        .select("*")
        .order("ngay", { ascending: false });

      if (!active) return;

      if (!error) {
        const remote = (data || []).map((row) =>
          normalizeChamCongFromDB(row as Record<string, unknown>)
        );
        const merged = mergeChamCongRecords(remote, Object.values(loadPendingMap()));
        setRecords(merged);
        saveLocal(merged);
        setSource("supabase");
        if (Object.keys(loadPendingMap()).length > 0) {
          void flushPending(remote);
        }
      } else {
        console.warn("[cham-cong] Lỗi Supabase, giữ local:", error.message);
      }

      if (active) setLoading(false);
    };

    void fetchRecords();

    const handleOnline = () => {
      void flushPending();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
    }

    return () => {
      active = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
      }
    };
  }, [flushPending]);

  // Đăng ký realtime updates từ Supabase
  useSupabaseRealtime<ChamCongRecord>("cham_cong", setRecords, {
    mapIn: (row: unknown) => normalizeChamCongFromDB(row as Record<string, unknown>),
    primaryKey: "id",
    localStorageKey: STORAGE_KEY,
  });

  const saveRecord = useCallback(async (record: ChamCongRecord): Promise<ChamCongSaveResult> => {
    const key = chamCongRecordKey(record.maNV, record.ngay);

    // 1. Lưu ngay vào state + localStorage (chống mất dữ liệu nếu rớt mạng / F5)
    setRecords((current) => {
      const next = upsertChamCongList(current, record);
      saveLocal(next);
      return next;
    });

    const pendingMap = loadPendingMap();
    pendingMap[key] = record;
    savePendingMap(pendingMap);
    setPendingCount(Object.keys(pendingMap).length);

    // 2. Đồng bộ lên Supabase
    const syncRes = await upsertRecordToSupabase(record);
    if (syncRes.synced) {
      const latestPending = loadPendingMap();
      delete latestPending[key];
      savePendingMap(latestPending);
      setPendingCount(Object.keys(latestPending).length);
      return { ok: true, synced: true };
    }

    return {
      ok: true,
      synced: false,
      reason: syncRes.reason,
      error: syncRes.error,
    };
  }, []);

  const clearRecords = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    if (isSupabaseEnabled && supabase) {
      const { error } = await supabase.from("cham_cong").delete().neq("id", "none");
      if (error) {
        console.warn("[cham-cong] Lỗi xóa dữ liệu:", error.message);
        return { ok: false, error: error.message };
      }
    }
    setRecords([]);
    saveLocal([]);
    savePendingMap({});
    setPendingCount(0);
    return { ok: true };
  }, []);

  const deleteRecord = useCallback(async (
    record: ChamCongRecord,
    user: unknown
  ): Promise<{ ok: boolean; error?: string }> => {
    const key = chamCongRecordKey(record.maNV, record.ngay);
    const pendingMap = loadPendingMap();
    const isLocalOnly = Boolean(pendingMap[key]) && !isSupabaseEnabled;

    if (isSupabaseEnabled && supabase && !isLocalOnly) {
      const { error } = await supabase.from("cham_cong").delete().eq("id", record.id);
      if (error) {
        console.warn("[cham-cong] Lỗi xóa bản ghi:", error.message);
        return { ok: false, error: error.message };
      }
    }

    delete pendingMap[key];
    savePendingMap(pendingMap);
    setPendingCount(Object.keys(pendingMap).length);

    setRecords((current) => {
      const next = current.filter(
        (item) => item.id !== record.id && chamCongRecordKey(item.maNV, item.ngay) !== key
      );
      saveLocal(next);
      return next;
    });

    if (user) {
      const { logCRUD } = await import("@/lib/audit-log");
      logCRUD(
        user as Parameters<typeof logCRUD>[0],
        "cham-cong",
        "delete",
        `Chấm công NV ${record.maNV} ngày ${record.ngay}`,
        record.id,
        { oldValue: record }
      );
    }

    return { ok: true };
  }, []);

  return {
    records,
    saveRecord,
    deleteRecord,
    clearRecords,
    flushPending,
    pendingCount,
    loading,
    source,
  };
}
