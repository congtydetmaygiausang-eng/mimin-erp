"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { AppUser } from "@/components/session-provider";
import type { LoaiSP, MauVai } from "./lenh-cat-store";
import { logWorkflow } from "../audit-log";
import { isSupabaseEnabled, supabaseDelete, supabaseFetchAllRaw, supabaseUpsertRaw } from "@/lib/supabase/client";

export type TrangThaiKHSX = "Lên kế hoạch" | "Đang SX" | "Hoàn thành" | "Trễ hạn";

export type KHSX = {
  id: string;
  maKHSX: string;
  maSP?: string;
  tenSP?: string;
  loaiSP?: LoaiSP;
  tiLeSize?: string;
  dsMau?: MauVai[];
  tuan: string;
  tuNgay: string;
  denNgay: string;
  sanPham: string;
  loai: "Áo" | "Bộ" | "Quần" | "Phụ kiện";
  soLuong: number;
  daHoanThanh: number;
  xuongPhuTrach: string;
  trangThai: TrangThaiKHSX;
  ghiChu?: string;
  ngayTao?: string;
  nguoiTao?: string;
  lenhCatId?: string;
};

const STORAGE_KEY = "mimin_khsx_v2";
const Ctx = createContext<StoreContext | null>(null);
type RemoteKHSX = KHSX & { maKhsx?: string; maSp?: string; tenSp?: string; loaiSp?: LoaiSP };

type StoreContext = {
  khsx: KHSX[];
  themKHSX: (item: Omit<KHSX, "id">, user: AppUser | null) => KHSX;
  suaKHSX: (id: string, patch: Partial<KHSX>, user: AppUser | null) => void;
  xoaKHSX: (id: string, user: AppUser | null) => void;
  capNhatTienDo: (id: string, value: number, user: AppUser | null) => void;
  batDauSX: (id: string, user: AppUser | null) => void;
  hoanThanh: (id: string, user: AppUser | null) => void;
  reset: () => void;
};

function loadData(): KHSX[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as KHSX[]) : [];
  } catch { return []; }
}

function saveData(items: KHSX[]) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
}

function persist(item: KHSX) {
  if (isSupabaseEnabled) supabaseUpsertRaw("khsx", item).catch((error) => console.error("[KHSX] Supabase:", error));
}

export function KHSXProvider({ children }: { children: ReactNode }) {
  const [khsx, setKHSX] = useState<KHSX[]>([]);

  useEffect(() => {
    const localData = loadData();
    setKHSX(localData);

    if (!isSupabaseEnabled) return;
    
    let active = true;
    supabaseFetchAllRaw<RemoteKHSX>("khsx", "created_at", false)
      .then((remote) => {
        if (!active) return;
        const normalized = remote.map((item) => ({
          ...item,
          maKHSX: item.maKHSX || item.maKhsx || "",
          maSP: item.maSP || item.maSp,
          tenSP: item.tenSP || item.tenSp,
          loaiSP: item.loaiSP || item.loaiSp,
        }));
        
        // Luôn luôn đọc lại bản mới nhất từ localStorage trước khi merge
        const currentLocal = loadData();
        const remoteIds = new Set(normalized.map((r) => r.id));
        const merged = [
          ...normalized,
          ...currentLocal.filter((x) => !remoteIds.has(x.id)),
        ];
        
        saveData(merged);
        setKHSX(merged);
      })
      .catch((err) => console.error("Lỗi fetch khsx:", err));
      
    return () => { active = false; };
  }, []);
  
  // Tự động lưu khi khsx thay đổi (đề phòng)
  useEffect(() => { saveData(khsx); }, [khsx]);

  const themKHSX = useCallback((item: Omit<KHSX, "id">, user: AppUser | null) => {
    const created: KHSX = { ...item, id: `KHSX-${Date.now()}`, ngayTao: new Date().toISOString().slice(0, 10), nguoiTao: user?.id || user?.name };
    
    // Ép kiểu đồng bộ tuyệt đối: Đọc -> Thêm -> Ghi ngay lập tức
    const currentLocal = loadData();
    const nextLocal = [created, ...currentLocal];
    saveData(nextLocal);
    
    setKHSX((prev) => [created, ...prev]);
    persist(created);
    logWorkflow(user, "create", created.maKHSX, created.id);
    return created;
  }, []);

  const suaKHSX = useCallback((id: string, patch: Partial<KHSX>, user: AppUser | null) => {
    setKHSX((prev) => prev.map((item) => {
      if (item.id !== id) return item;
      const updated = { ...item, ...patch };
      persist(updated);
      return updated;
    }));
    logWorkflow(user, "update", `KHSX ${id}`, id, { newValue: patch });
  }, []);

  const xoaKHSX = useCallback((id: string, user: AppUser | null) => {
    setKHSX((prev) => prev.filter((item) => item.id !== id));
    if (isSupabaseEnabled) supabaseDelete("khsx", id).catch(console.error);
    logWorkflow(user, "delete", `KHSX ${id}`, id);
  }, []);

  const capNhatTienDo = useCallback((id: string, value: number, user: AppUser | null) => {
    setKHSX((prev) => prev.map((item) => {
      if (item.id !== id) return item;
      const daHoanThanh = Math.min(Math.max(value, 0), item.soLuong);
      const trangThai: TrangThaiKHSX = daHoanThanh >= item.soLuong ? "Hoàn thành" : daHoanThanh > 0 ? "Đang SX" : item.trangThai;
      const updated = { ...item, daHoanThanh, trangThai };
      persist(updated);
      return updated;
    }));
    logWorkflow(user, "update", `Tiến độ KHSX ${id}`, id, { newValue: { value } });
  }, []);

  const batDauSX = useCallback((id: string, user: AppUser | null) => suaKHSX(id, { trangThai: "Đang SX" }, user), [suaKHSX]);
  const hoanThanh = useCallback((id: string, user: AppUser | null) => {
    const item = khsx.find((x) => x.id === id);
    if (item) suaKHSX(id, { trangThai: "Hoàn thành", daHoanThanh: item.soLuong }, user);
  }, [khsx, suaKHSX]);
  const reset = useCallback(() => setKHSX([]), []);

  return <Ctx.Provider value={{ khsx, themKHSX, suaKHSX, xoaKHSX, capNhatTienDo, batDauSX, hoanThanh, reset }}>{children}</Ctx.Provider>;
}

export function useKHSX() {
  const value = useContext(Ctx);
  if (!value) throw new Error("useKHSX must be used within KHSXProvider");
  return value;
}
