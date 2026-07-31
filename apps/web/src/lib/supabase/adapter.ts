/**
 * Supabase Adapter - thay thế localStorage
 * 
 * - Tự động dùng Supabase nếu có env vars
 * - Fallback về localStorage nếu không có
 * - Realtime subscription
 */

import { supabase, isSupabaseEnabled, DEMO_USERS } from "./client";
import { findUserByEmail as findSecureUser } from "../user-accounts-secure";

const STORAGE_PREFIX = "polomimin_";

// ============ HELPERS ============
function fromStorage<T>(key: string, defaultVal: T): T {
  if (typeof window === "undefined") return defaultVal;
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return defaultVal;
    const parsed = JSON.parse(raw);
    return (parsed === null || parsed === undefined) ? defaultVal : (parsed as T);
  } catch {
    return defaultVal;
  }
}

function toStorage(key: string, val: any) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(val));
  } catch {}
}

function mapTaskFromDB(t: any) {
  return {
    id: t.id,
    title: t.title,
    sp: t.sp,
    lsx: t.lsx,
    lsxCode: t.lsx_code,
    mau: t.mau,
    size: t.size,
    soLuongGiao: t.so_luong_giao,
    soLuongNhan: t.so_luong_nhan,
    soLuongDat: t.so_luong_dat,
    soLuongLoi: t.so_luong_loi,
    soLuongThieu: t.so_luong_thieu,
    soLuongSua: t.so_luong_sua,
    status: t.status,
    nhom: t.nhom,
    assignedTo: t.assigned_to,
    giaoBoi: t.giao_boi,
    deadline: t.deadline,
    ngayGiao: t.ngay_giao,
    ngayNhan: t.ngay_nhan,
    ngayHoanThanh: t.ngay_hoan_thanh,
    donGia: Number(t.don_gia || 0),
    thanhTien: Number(t.thanh_tien || 0),
    conNo: Number(t.con_no || 0),
    ghiChu: t.ghi_chu,
    trangThai: t.trang_thai,
  };
}

function mapTaskToDB(t: any) {
  const r: any = {};
  if (t.slDone !== undefined) r.so_luong_dat = t.slDone;
  if (t.status !== undefined) r.status = t.status;
  if (t.trangThai !== undefined) r.trang_thai = t.trangThai;
  if (t.slDone === t.sl && t.status) r.trang_thai = "Hoàn thành";
  return r;
}

// ============ ADAPTER ============
export const SupabaseAdapter = {
  isCloud: isSupabaseEnabled,

  // ====== TASKS ======
  async getTasks(filter?: { assignedTo?: string; nhom?: string }): Promise<any[]> {
    if (isSupabaseEnabled && supabase) {
      let q = supabase.from("tasks").select("*");
      if (filter?.assignedTo) q = q.eq("assigned_to", filter.assignedTo);
      if (filter?.nhom) q = q.eq("nhom", filter.nhom);
      const { data, error } = await q.order("created_at", { ascending: false });
      if (error) {
        console.error("[Supabase] getTasks error:", error);
        return fromStorage<any[]>("tasks", []);
      }
      return (data || []).map(mapTaskFromDB);
    }
    return fromStorage<any[]>("tasks", []);
  },

  async getTaskById(id: string): Promise<any | null> {
    if (isSupabaseEnabled && supabase) {
      const { data, error } = await supabase.from("tasks").select("*").eq("id", id).single();
      if (error) return null;
      return data ? mapTaskFromDB(data) : null;
    }
    const tasks = fromStorage<any[]>("tasks", []);
    return tasks.find((t: any) => t.id === id) || null;
  },

  async updateTask(id: string, patch: any): Promise<void> {
    if (isSupabaseEnabled && supabase) {
      const dbPatch = mapTaskToDB(patch);
      const { error } = await supabase.from("tasks").update(dbPatch).eq("id", id);
      if (error) {
        console.error("[Supabase] updateTask error:", error);
        // Fallback to localStorage
        const tasks = fromStorage<any[]>("tasks", []);
        const idx = tasks.findIndex((t: any) => t.id === id);
        if (idx >= 0) {
          tasks[idx] = { ...tasks[idx], ...patch };
          toStorage("tasks", tasks);
        }
      }
    } else {
      const tasks = fromStorage<any[]>("tasks", []);
      const idx = tasks.findIndex((t: any) => t.id === id);
      if (idx >= 0) {
        tasks[idx] = { ...tasks[idx], ...patch };
        toStorage("tasks", tasks);
      }
    }
  },

  // ====== KHO ======
  async getKho(): Promise<any[]> {
    if (isSupabaseEnabled && supabase) {
      const { data, error } = await supabase.from("kho").select("*");
      if (error) return fromStorage<any[]>("kho", []);
      return (data || []).map((k) => ({
        sku: k.sku, ten: k.ten, sl: k.sl, donVi: k.don_vi, tonThap: k.ton_thap, ngayNhap: k.ngay_nhap, loai: k.loai,
      }));
    }
    return fromStorage<any[]>("kho", []);
  },

  // ====== CÔNG NỢ ======
  async getCongNo(): Promise<any[]> {
    if (isSupabaseEnabled && supabase) {
      const { data, error } = await supabase.from("cong_no").select("*");
      if (error) return fromStorage<any[]>("cong_no", []);
      return (data || []).map((c) => ({
        id: c.id, kh: c.kh, no: Number(c.no), han: c.han, status: c.status,
      }));
    }
    return fromStorage<any[]>("cong_no", []);
  },

  // ====== MASTER DATA: NCC ======
  async getNhaCungCap(): Promise<any[]> {
    if (isSupabaseEnabled && supabase) {
      const { data, error } = await supabase.from("nha_cung_cap").select("*");
      if (error) return [];
      return data || [];
    }
    return [];
  },

  // ====== MASTER DATA: KH sỉ ======
  async getKhachHangSi(): Promise<any[]> {
    if (isSupabaseEnabled && supabase) {
      const { data, error } = await supabase.from("khach_hang_si").select("*");
      if (error) return [];
      return data || [];
    }
    return [];
  },

  // ====== MASTER DATA: Xưởng ======
  async getXuongGiaCong(): Promise<any[]> {
    if (isSupabaseEnabled && supabase) {
      const { data, error } = await supabase.from("xuong_gia_cong").select("*");
      if (error) return [];
      return data || [];
    }
    return [];
  },

  // ====== USERS ======
  async getUsers(): Promise<any[]> {
    if (isSupabaseEnabled && supabase) {
      const { data, error } = await supabase.from("users").select("id, username, email, name, nhom, phong_ban, ma_nv, chuc_vu, sdt, role").order("username");
      if (error) return [];
      return data || [];
    }
    return [];
  },

  // ====== REALTIME ======
  subscribeTasks(callback: (payload: any) => void): () => void {
    if (isSupabaseEnabled && supabase) {
      const sb = supabase;
      const channel = sb
        .channel("tasks-realtime")
        .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, (payload) => {
          console.log("[Realtime] tasks:", payload.eventType);
          callback(payload);
        })
        .subscribe();
      return () => {
        sb.removeChannel(channel);
      };
    }
    // Fallback: poll localStorage mỗi 2s
    const interval = setInterval(() => {
      callback({ eventType: "POLL" });
    }, 2000);
    return () => clearInterval(interval);
  },

  subscribeKho(callback: (payload: any) => void): () => void {
    if (isSupabaseEnabled && supabase) {
      const sb = supabase;
      const channel = sb
        .channel("kho-realtime")
        .on("postgres_changes", { event: "*", schema: "public", table: "kho" }, (payload) => {
          callback(payload);
        })
        .subscribe();
      return () => {
        sb.removeChannel(channel);
      };
    }
    return () => {};
  },
};

// ============ REACT HOOK: useSupabaseData ============
import { useEffect, useState, useCallback } from "react";

export function useSupabaseTasks(filter?: { assignedTo?: string; nhom?: string }) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const data = await SupabaseAdapter.getTasks(filter);
    setTasks(data);
    setLoading(false);
  }, [filter?.assignedTo, filter?.nhom]);

  useEffect(() => {
    reload();
    const unsub = SupabaseAdapter.subscribeTasks(() => reload());
    return () => unsub();
  }, [reload]);

  return { tasks, loading, reload };
}

export function useSupabaseKho() {
  const [kho, setKho] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const data = await SupabaseAdapter.getKho();
    setKho(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
    const unsub = SupabaseAdapter.subscribeKho(() => reload());
    return () => unsub();
  }, [reload]);

  return { kho, loading, reload };
}

export function useSupabaseCongNo() {
  const [congNo, setCongNo] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    SupabaseAdapter.getCongNo().then((data) => {
      setCongNo(data);
      setLoading(false);
    });
  }, []);

  return { congNo, loading };
}
