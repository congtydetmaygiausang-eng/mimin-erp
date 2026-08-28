"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { AppUser } from "@/components/session-provider";
import type { LoaiSP, MauVai } from "./lenh-cat-store";
import { logWorkflow } from "../audit-log";
import { isSupabaseEnabled, supabaseDelete, supabaseFetchAllRaw, supabaseUpsertRaw } from "@/lib/supabase/client";
import { toast } from "sonner";

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
  try { 
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); 
  } catch (e: any) { 
    console.error("[KHSX] Lỗi lưu localStorage:", e);
    toast.error("Lỗi hệ thống: Không thể lưu dữ liệu kế hoạch sản xuất vào máy tính (" + e.message + ")");
  }
}

function persist(item: KHSX) {
  if (!isSupabaseEnabled) return;
  
  // Bảng khsx trên Supabase của dự án này đang dùng cột camelCase (cùng tên với type KHSX)
  // Nên ta không map sang snake_case nữa mà truyền thẳng dữ liệu item
  supabaseUpsertRaw("khsx", item).catch((error) => console.error("[KHSX] Supabase upsert error:", error));
}

export function KHSXProvider({ children }: { children: ReactNode }) {
  const [khsx, setKHSX] = useState<KHSX[]>([]);

  useEffect(() => {
    const localData = loadData();
    setKHSX(localData);

    if (!isSupabaseEnabled) return;
    
    let active = true;
    supabaseFetchAllRaw<any>("khsx", "created_at", false)
      .then((remote) => {
        if (!active) return;
        const normalized = remote.map((item) => ({
          id: item.id,
          maKHSX: item.ma_khsx || item.maKhsx || item.maKHSX || "",
          maSP: item.ma_sp || item.maSp || item.maSP,
          tenSP: item.ten_sp || item.tenSp || item.tenSP,
          loaiSP: item.loai_sp || item.loaiSp || item.loaiSP,
          tiLeSize: item.ti_le_size || item.tiLeSize,
          dsMau: item.ds_mau || item.dsMau || [],
          tuan: item.tuan || "",
          tuNgay: item.tu_ngay || item.tuNgay,
          denNgay: item.den_ngay || item.denNgay,
          sanPham: item.san_pham || item.sanPham,
          loai: item.loai,
          soLuong: item.so_luong ?? item.soLuong ?? 0,
          daHoanThanh: item.da_hoan_thanh ?? item.daHoanThanh ?? 0,
          xuongPhuTrach: item.xuong_phu_trach || item.xuongPhuTrach || "Tổ cắt",
          trangThai: item.trang_thai || item.trangThai || "Lên kế hoạch",
          ghiChu: item.ghi_chu || item.ghiChu,
          ngayTao: item.ngay_tao || item.ngayTao,
          nguoiTao: item.nguoi_tao || item.nguoiTao,
          lenhCatId: item.lenh_cat_id || item.lenhCatId,
        }));
        
        const currentLocal = loadData();
        const remoteIds = new Set(normalized.map((r) => r.id));
        const merged = [
          ...normalized,
          ...currentLocal.filter((x) => !remoteIds.has(x.id)),
        ];
        
        saveData(merged as KHSX[]);
        setKHSX(merged as KHSX[]);
      })
      .catch((err) => console.error("Lỗi fetch khsx:", err));
      
    return () => { active = false; };
  }, []);

  const themKHSX = useCallback((item: Omit<KHSX, "id">, user: AppUser | null) => {
    const created: KHSX = { ...item, id: `KHSX-${Date.now()}`, ngayTao: new Date().toISOString().slice(0, 10), nguoiTao: user?.id || user?.name };
    
    setKHSX((prev) => {
      const nextLocal = [created, ...prev];
      saveData(nextLocal);
      return nextLocal;
    });
    
    persist(created);
    logWorkflow(user, "create", created.maKHSX, created.id);
    return created;
  }, []);

  const suaKHSX = useCallback((id: string, patch: Partial<KHSX>, user: AppUser | null) => {
    setKHSX((prev) => {
      const next = prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, ...patch };
        persist(updated);
        return updated;
      });
      saveData(next);
      return next;
    });
    logWorkflow(user, "update", `KHSX ${id}`, id, { newValue: patch });
  }, []);

  const xoaKHSX = useCallback((id: string, user: AppUser | null) => {
    setKHSX((prev) => {
      const next = prev.filter((item) => item.id !== id);
      saveData(next);
      return next;
    });
    if (isSupabaseEnabled) supabaseDelete("khsx", id).catch(console.error);
    logWorkflow(user, "delete", `KHSX ${id}`, id);
  }, []);

  const capNhatTienDo = useCallback((id: string, value: number, user: AppUser | null) => {
    setKHSX((prev) => {
      const next = prev.map((item) => {
        if (item.id !== id) return item;
        const daHoanThanh = Math.min(Math.max(value, 0), item.soLuong);
        const trangThai: TrangThaiKHSX = daHoanThanh >= item.soLuong ? "Hoàn thành" : daHoanThanh > 0 ? "Đang SX" : item.trangThai;
        const updated = { ...item, daHoanThanh, trangThai };
        persist(updated);
        return updated;
      });
      saveData(next);
      return next;
    });
    logWorkflow(user, "update", `Tiến độ KHSX ${id}`, id, { newValue: { value } });
  }, []);

  const batDauSX = useCallback((id: string, user: AppUser | null) => suaKHSX(id, { trangThai: "Đang SX" }, user), [suaKHSX]);
  const hoanThanh = useCallback((id: string, user: AppUser | null) => {
    setKHSX((prev) => {
      const next = prev.map((item) => {
        if (item.id !== id) return item;
        const updated: KHSX = { ...item, trangThai: "Hoàn thành", daHoanThanh: item.soLuong };
        persist(updated);
        return updated;
      });
      saveData(next);
      return next;
    });
  }, []);
  const reset = useCallback(() => {
    setKHSX([]);
    saveData([]);
  }, []);

  return <Ctx.Provider value={{ khsx, themKHSX, suaKHSX, xoaKHSX, capNhatTienDo, batDauSX, hoanThanh, reset }}>{children}</Ctx.Provider>;
}

export function useKHSX() {
  const value = useContext(Ctx);
  if (!value) throw new Error("useKHSX must be used within KHSXProvider");
  return value;
}

