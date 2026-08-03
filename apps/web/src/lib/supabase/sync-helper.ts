"use client";

// Supabase Sync Helper - Tự động sync localStorage ↔ Supabase
// 2026-08-03 - Mavis
//
// QUAN TRỌNG: App dùng camelCase (loaiLenh, maSP, tenSP, tongSL...)
//            Supabase dùng snake_case (loai_lenh, ma_sp, ten_sp, tong_sl...)
//            Helpers tự động convert qua lại
//
// Cách dùng:
//   const { data, setData, loading, error } = useSupabaseSync<LenhCat>(
//     "mimin_lenh_cat_v2",
//     "lenh_cat"
//   );
//
// Hoặc dùng trực tiếp:
//   await supabaseFetchAll("lenh_cat")
//   await supabaseUpsert("lenh_cat", data)

import { useEffect, useState, useCallback } from "react";
import { supabase, isSupabaseEnabled } from "./client";

/**
 * Convert camelCase → snake_case
 * VD: loaiLenh → loai_lenh, maSP → ma_sp, bangCOGS → bang_cogs, ngayTao → ngay_tao
 */
export function camelToSnakeKey(key: string): string {
  return key
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2") // COGS + Foo => COGS_Foo
    .replace(/([a-z\d])([A-Z])/g, "$1_$2")       // aFoo => a_Foo
    .toLowerCase();
}

/**
 * Convert snake_case → camelCase
 * VD: loai_lenh → loaiLenh, ma_sp → maSP, bang_cogs → bangCOGS, ngay_tao → ngayTao
 *
 * Lưu ý: snake_case cần đồng nhất - nếu DB lưu `bang_cogs` thì convert thành `bangCogs` (không phải `bangCOGS`)
 * Nếu muốn giữ acronym (COGS, SP, SL), cần config riêng
 */
export function snakeToCamelKey(key: string): string {
  return key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

/**
 * Deep convert object keys
 */
function convertKeys(obj: any, converter: (k: string) => string): any {
  if (Array.isArray(obj)) return obj.map((item) => convertKeys(item, converter));
  if (obj !== null && typeof obj === "object" && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [converter(k), convertKeys(v, converter)])
    );
  }
  return obj;
}

export function camelToSnake<T = any>(obj: T): T {
  return convertKeys(obj, camelToSnakeKey) as T;
}

export function snakeToCamel<T = any>(obj: T): T {
  return convertKeys(obj, snakeToCamelKey) as T;
}

/**
 * Check Supabase có sẵn sàng không
 */
export function checkSupabase(): boolean {
  return isSupabaseEnabled && supabase !== null;
}

/**
 * Fetch tất cả rows từ 1 bảng
 * Tự động convert snake_case → camelCase cho khớp với app code
 */
export async function supabaseFetchAll<T = any>(
  table: string,
  orderBy: string = "created_at",
  ascending: boolean = false
): Promise<T[]> {
  if (!checkSupabase()) return [];
  const { data, error } = await supabase!
    .from(table)
    .select("*")
    .order(orderBy, { ascending });
  if (error) {
    console.error(`[Supabase] fetchAll(${table}) error:`, error);
    return [];
  }
  return (data || []).map((row) => snakeToCamel(row)) as T[];
}

/**
 * Insert hoặc update 1 row
 * Tự động convert camelCase → snake_case để khớp với schema Supabase
 */
export async function supabaseUpsert<T extends { id: string }>(
  table: string,
  row: T
): Promise<T | null> {
  if (!checkSupabase()) return null;
  const snakeRow = camelToSnake(row);
  const { data, error } = await supabase!
    .from(table)
    .upsert(snakeRow, { onConflict: "id" })
    .select()
    .single();
  if (error) {
    console.error(`[Supabase] upsert(${table}) error:`, error.message, error.details);
    return null;
  }
  return data ? (snakeToCamel(data) as T) : null;
}

/**
 * Xoá 1 row theo id
 */
export async function supabaseDelete(table: string, id: string): Promise<boolean> {
  if (!checkSupabase()) return false;
  const { error } = await supabase!
    .from(table)
    .delete()
    .eq("id", id);
  if (error) {
    console.error(`[Supabase] delete(${table}, ${id}) error:`, error);
    return false;
  }
  return true;
}

/**
 * Hook tự động sync localStorage ↔ Supabase
 * - Lần đầu: đọc từ localStorage → nếu có thì ghi lên Supabase
 * - Lần đầu: đọc từ Supabase → nếu có thì ghi xuống localStorage
 * - Khi user thêm/sửa: ghi cả 2 nơi
 */
export function useSupabaseSync<T extends { id: string }>(
  localStorageKey: string,
  table: string,
  initialData: T[] = []
) {
  const [data, setDataState] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"local" | "supabase" | "merged">("local");
  const [error, setError] = useState<string | null>(null);

  // Helper: lưu localStorage
  const saveLocal = useCallback((rows: T[]) => {
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(rows));
    } catch (err) {
      console.error(`[LocalStorage] save error:`, err);
    }
  }, [localStorageKey]);

  // Helper: đọc localStorage
  const loadLocal = useCallback((): T[] => {
    try {
      const raw = localStorage.getItem(localStorageKey);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  }, [localStorageKey]);

  // Init: thử Supabase trước → fallback localStorage
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (checkSupabase()) {
          const remote = await supabaseFetchAll<T>(table);
          if (!cancelled) {
            if (remote.length > 0) {
              setDataState(remote);
              saveLocal(remote); // sync xuống local
              setSource("supabase");
              console.log(`[useSupabaseSync] ${table}: ${remote.length} rows from Supabase`);
            } else {
              // Supabase rỗng → lấy từ localStorage và push lên
              const local = loadLocal();
              setDataState(local);
              if (local.length > 0) {
                console.log(`[useSupabaseSync] ${table}: pushing ${local.length} rows to Supabase`);
                for (const row of local) {
                  await supabaseUpsert(table, row);
                }
                setSource("merged");
              }
            }
          }
        } else {
          // Supabase tắt → chỉ dùng localStorage
          if (!cancelled) {
            const local = loadLocal();
            setDataState(local);
            setSource("local");
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || String(err));
          // Fallback localStorage
          const local = loadLocal();
          setDataState(local);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [table, localStorageKey, loadLocal, saveLocal]);

  // Subscribe realtime updates từ Supabase
  useEffect(() => {
    if (!checkSupabase()) return;
    const channel = supabase!
      .channel(`${table}-changes`)
      .on("postgres_changes",
        { event: "*", schema: "public", table },
        (payload) => {
          console.log(`[Realtime] ${table}:`, payload.eventType);
          setDataState((prev) => {
            let next = [...prev];
            if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
              const newRow = payload.new as T;
              const idx = next.findIndex((r) => r.id === newRow.id);
              if (idx >= 0) next[idx] = newRow;
              else next = [newRow, ...next];
            } else if (payload.eventType === "DELETE") {
              const oldId = (payload.old as any).id;
              next = next.filter((r) => r.id !== oldId);
            }
            saveLocal(next);
            return next;
          });
        }
      )
      .subscribe();
    return () => { supabase!.removeChannel(channel); };
  }, [table, saveLocal]);

  // setData: ghi cả 2 nơi
  const setData = useCallback(async (updater: T[] | ((prev: T[]) => T[])) => {
    setDataState((prev) => {
      const next = typeof updater === "function" ? (updater as (p: T[]) => T[])(prev) : updater;
      saveLocal(next);
      // Ghi Supabase async (không block UI)
      if (checkSupabase()) {
        // Xoá rows không còn
        const oldIds = prev.map((r) => r.id);
        const newIds = next.map((r) => r.id);
        const deletedIds = oldIds.filter((id) => !newIds.includes(id));
        Promise.all([
          ...next.map((row) => supabaseUpsert(table, row)),
          ...deletedIds.map((id) => supabaseDelete(table, id)),
        ]).catch((err) => console.error(`[Sync] ${table} setData error:`, err));
      }
      return next;
    });
  }, [table, saveLocal]);

  return { data, setData, loading, error, source };
}
