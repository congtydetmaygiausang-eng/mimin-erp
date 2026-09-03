"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { AppUser } from "@/components/session-provider";
import type { LoaiSP, MauVai } from "./lenh-cat-store";
import { logWorkflow } from "../audit-log";
import { isSupabaseEnabled, supabaseDelete, supabaseFetchAllRaw, supabaseUpsertRaw } from "@/lib/supabase/client";
import { toast } from "sonner";

export type TrangThaiKHSX = "LÃªn káº¿ hoáº¡ch" | "Äang SX" | "HoÃ n thÃ nh" | "Trá»… háº¡n";

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
  loai: "Ão" | "Bá»™" | "Quáº§n" | "Phá»¥ kiá»‡n";
  soLuong: number;
  daHoanThanh: number;
  xuongPhuTrach: string;
  trangThai: TrangThaiKHSX;
  ghiChu?: string;
  ngayTao?: string;
  nguoiTao?: string;
  lenhCatId?: string;
};

function getCorrectLoaiSP(val: string, tenSP: string): any {
  if (val && val !== "BoTru") return val;
  const checkStr = (tenSP || "").toLowerCase();
  if (checkStr.includes("áo polo") || checkStr.includes("ao polo")) return "AoPolo";
  if (checkStr.includes("áo tr?") || checkStr.includes("ao tru") || checkStr.includes("c? tr?") || checkStr.includes("co tru")) return "AoTru";
  if (checkStr.includes("áo tròn") || checkStr.includes("áo c? tròn") || checkStr.includes("c? tròn") || checkStr.includes("co tron")) return "AoCoTron";
  if (checkStr.includes("b? tròn") || checkStr.includes("b? c? tròn") || checkStr.includes("bo tron") || checkStr.includes("bo co tron")) return "BoCoTron";
  if (checkStr.includes("ph? ki?n") || checkStr.includes("qu?n") || checkStr.includes("quan")) return "PhuKien";
  if (checkStr.includes("áo thun") || checkStr.includes("áo") || checkStr.includes("ao")) return "AoCoTron";
  return "BoTru";
}
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
    console.error("[KHSX] Lá»—i lÆ°u localStorage:", e);
    toast.error("Lá»—i há»‡ thá»‘ng: KhÃ´ng thá»ƒ lÆ°u dá»¯ liá»‡u káº¿ hoáº¡ch sáº£n xuáº¥t vÃ o mÃ¡y tÃ­nh (" + e.message + ")");
  }
}

function persist(item: KHSX) {
  if (!isSupabaseEnabled) return;
  
  // Báº£ng khsx trÃªn Supabase thá»±c táº¿ Ä‘ang dÃ¹ng cá»™t camelCase, nÃªn ta dÃ¹ng supabaseUpsertRaw
  supabaseUpsertRaw("khsx", item, "id").catch((error) => console.error("[KHSX] Supabase upsert error:", error));
}

export function KHSXProvider({ children }: { children: ReactNode }) {
  const [khsx, setKHSX] = useState<KHSX[]>([]);

  useEffect(() => {
    const localData = loadData();
    setKHSX(localData);

    if (!isSupabaseEnabled) return;
    
    let active = true;
    let channel: any;
    
    supabaseFetchAllRaw<any>("khsx", "created_at", false)
      .then((remote) => {
        if (!active) return;
        const normalized = remote.map((item) => ({
          id: item.id,
          maKHSX: item.ma_khsx || item.maKhsx || item.maKHSX || "",
          maSP: item.ma_sp || item.maSp || item.maSP,
          tenSP: item.ten_sp || item.tenSp || item.tenSP,
          loaiSP: getCorrectLoaiSP(item.loai_sp || item.loaiSp || item.loaiSP, item.ten_sp || item.tenSp || item.tenSP),
          tiLeSize: item.ti_le_size || item.tiLeSize,
          dsMau: item.ds_mau || item.dsMau || [],
          tuan: item.tuan || "",
          tuNgay: item.tu_ngay || item.tuNgay,
          denNgay: item.den_ngay || item.denNgay,
          sanPham: item.san_pham || item.sanPham,
          loai: item.loai,
          soLuong: item.so_luong ?? item.soLuong ?? 0,
          daHoanThanh: item.da_hoan_thanh ?? item.daHoanThanh ?? 0,
          xuongPhuTrach: item.xuong_phu_trach || item.xuongPhuTrach || "Tá»• cáº¯t",
          trangThai: item.trang_thai || item.trangThai || "LÃªn káº¿ hoáº¡ch",
          ghiChu: item.ghi_chu || item.ghiChu,
          ngayTao: item.ngay_tao || item.ngayTao,
          nguoiTao: item.nguoi_tao || item.nguoiTao,
          lenhCatId: item.lenh_cat_id || item.lenhCatId,
        }));
        
        // Remote lÃ  nguá»“n chÃ¢n lÃ½ tuyá»‡t Ä‘á»‘i khi fetch thÃ nh cÃ´ng.
        const merged = normalized;
        
        saveData(merged as KHSX[]);
        setKHSX(merged as KHSX[]);
      })
      .catch((err) => console.error("Lá»—i fetch khsx:", err));
      
    // ÄÄƒng kÃ½ realtime láº¯ng nghe thay Ä‘á»•i
    import("@/lib/supabase/client").then(({ supabase }) => {
      if (!supabase) return;
      const channelName = `khsx-changes-${Math.random().toString(36).slice(2)}`;
      channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "khsx" },
          (payload) => {
            console.log(`[Realtime] khsx:`, payload.eventType);
            setKHSX((prev) => {
              if (payload.eventType === "DELETE") {
                const oldId = (payload.old as any).id;
                const next = prev.filter((r) => r.id !== oldId);
                saveData(next);
                return next;
              }
              if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
                const item = payload.new as any;
                const mapped: KHSX = {
                  id: item.id,
                  maKHSX: item.ma_khsx || item.maKhsx || item.maKHSX || "",
                  maSP: item.ma_sp || item.maSp || item.maSP,
                  tenSP: item.ten_sp || item.tenSp || item.tenSP,
                  loaiSP: getCorrectLoaiSP(item.loai_sp || item.loaiSp || item.loaiSP, item.ten_sp || item.tenSp || item.tenSP),
                  tiLeSize: item.ti_le_size || item.tiLeSize,
                  dsMau: item.ds_mau || item.dsMau || [],
                  tuan: item.tuan || "",
                  tuNgay: item.tu_ngay || item.tuNgay,
                  denNgay: item.den_ngay || item.denNgay,
                  sanPham: item.san_pham || item.sanPham,
                  loai: item.loai,
                  soLuong: item.so_luong ?? item.soLuong ?? 0,
                  daHoanThanh: item.da_hoan_thanh ?? item.daHoanThanh ?? 0,
                  xuongPhuTrach: item.xuong_phu_trach || item.xuongPhuTrach || "Tá»• cáº¯t",
                  trangThai: item.trang_thai || item.trangThai || "LÃªn káº¿ hoáº¡ch",
                  ghiChu: item.ghi_chu || item.ghiChu,
                  ngayTao: item.ngay_tao || item.ngayTao,
                  nguoiTao: item.nguoi_tao || item.nguoiTao,
                  lenhCatId: item.lenh_cat_id || item.lenhCatId,
                };
                const exists = prev.some((r) => r.id === mapped.id);
                let next;
                if (exists) {
                  next = prev.map((r) => (r.id === mapped.id ? mapped : r));
                } else {
                  next = [mapped, ...prev];
                }
                saveData(next);
                return next;
              }
              return prev;
            });
          }
        )
        .subscribe();
    });

    return () => { 
      active = false;
      if (channel) {
        import("@/lib/supabase/client").then(({ supabase }) => {
          supabase?.removeChannel(channel);
        });
      }
    };
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
        const trangThai: TrangThaiKHSX = daHoanThanh >= item.soLuong ? "HoÃ n thÃ nh" : daHoanThanh > 0 ? "Äang SX" : item.trangThai;
        const updated = { ...item, daHoanThanh, trangThai };
        persist(updated);
        return updated;
      });
      saveData(next);
      return next;
    });
    logWorkflow(user, "update", `Tiáº¿n Ä‘á»™ KHSX ${id}`, id, { newValue: { value } });
  }, []);

  const batDauSX = useCallback((id: string, user: AppUser | null) => suaKHSX(id, { trangThai: "Äang SX" }, user), [suaKHSX]);
  const hoanThanh = useCallback((id: string, user: AppUser | null) => {
    setKHSX((prev) => {
      const next = prev.map((item) => {
        if (item.id !== id) return item;
        const updated: KHSX = { ...item, trangThai: "HoÃ n thÃ nh", daHoanThanh: item.soLuong };
        persist(updated);
        return updated;
      });
      saveData(next);
      return next;
    });
  }, []);
  const reset = useCallback(() => {
    setKHSX(prev => { prev.forEach(k => { if (isSupabaseEnabled) supabaseDelete("khsx", k.id); }); return []; });
    saveData([]);
  }, []);

  return <Ctx.Provider value={{ khsx, themKHSX, suaKHSX, xoaKHSX, capNhatTienDo, batDauSX, hoanThanh, reset }}>{children}</Ctx.Provider>;
}

export function useKHSX() {
  const value = useContext(Ctx);
  if (!value) throw new Error("useKHSX must be used within KHSXProvider");
  return value;
}

