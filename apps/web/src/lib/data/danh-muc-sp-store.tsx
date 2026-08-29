"use client";

import { createContext, useCallback, useContext, useMemo, ReactNode } from "react";
import type { SanPham } from "./san-pham";
import { useSupabaseSync, camelToSnake } from "@/lib/supabase/sync-helper";
import { isSupabaseEnabled, supabaseDelete } from "@/lib/supabase/client";

const STORAGE_KEY = "mimin_danh_muc_v2";

type StoreContext = {
  dsSanPham: SanPham[];
  loading: boolean;
  themSP: (sp: SanPham) => void;
  suaSP: (id: string, data: Partial<SanPham>) => void;
  xoaSP: (id: string) => void;
  refresh: () => void;
};

const DanhMucSPContext = createContext<StoreContext | undefined>(undefined);

// Helper chuyển từ DB về App (kết hợp với dữ liệu local nếu DB thiếu cột do chưa chạy script SQL)
function mapSanPhamFromDB(item: any, localData: SanPham[]): SanPham {
  const local = localData.find(x => x.id === item.maSp);
  return {
    id: item.maSp,
    tenSP: item.tenSp || local?.tenSP || "",
    loaiSP: item.loaiSp || local?.loaiSP || "AoPolo",
    giaBanDuKien: item.giaBanDuKien ?? local?.giaBanDuKien ?? 0,
    giaVonDuKien: item.giaVonDuKien ?? local?.giaVonDuKien ?? 0,
    tiLeSize: item.tiLeSize || local?.tiLeSize || "1:2:2:2:1",
    bangSize: item.bangSize ? (typeof item.bangSize === 'string' ? JSON.parse(item.bangSize) : item.bangSize) : (local?.bangSize || { sizes: [], ratios: [], riSo: 1 }),
    dsMau: item.dsMau ? (typeof item.dsMau === 'string' ? JSON.parse(item.dsMau) : item.dsMau) : (local?.dsMau || []),
    ghiChu: item.ghiChu || local?.ghiChu || "",
    ngayTao: item.ngayTao || local?.ngayTao || "",
    trangThai: item.trangThai || local?.trangThai || "con-hang",
    daBan: item.daBan ?? local?.daBan ?? 0,
    ncc: item.ncc || local?.ncc || "",
    chatLieu: item.chatLieu || local?.chatLieu || "",
    luotXem: item.luotXem ?? local?.luotXem ?? 0,
    rating: item.rating ?? local?.rating ?? 0,
    hinhAnh: item.hinhAnh || local?.hinhAnh || "",
  };
}

// Chuyển từ App lên DB (snake_case), bỏ qua các cột chưa có nếu DB cũ
function buildDBPayload(sp: SanPham) {
  return {
    ma_sp: sp.id,
    ma_dm: `DM-${sp.loaiSP}`,
    ten_sp: sp.tenSP,
    loai_sp: sp.loaiSP,
    gia_ban_du_kien: sp.giaBanDuKien,
    gia_von_du_kien: sp.giaVonDuKien,
    ti_le_size: sp.tiLeSize,
    bang_size: sp.bangSize,
    ds_mau: sp.dsMau,
    trang_thai: sp.trangThai || "con-hang",
    da_ban: sp.daBan || 0,
    ncc: sp.ncc || "",
    chat_lieu: sp.chatLieu || "",
    luot_xem: sp.luotXem || 0,
    rating: sp.rating || 0,
    hinh_anh: sp.hinhAnh || "",
  };
}

export function DanhMucSPProvider({ children }: { children: ReactNode }) {
  // Đọc local data một lần để merge
  const getLocalData = () => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  };

  const { data: dsSanPham, setData: setDsSanPham, loading, source } = useSupabaseSync<SanPham>(
    STORAGE_KEY,
    "san_pham",
    MOCK_DANH_MUC,
    {
      mapOut: (row) => ({ ...buildDBPayload(row), id: row.id }),
      mapIn: (row) => mapSanPhamFromDB(row, getLocalData()),
      onConflict: "ma_sp"
    }
  );

  const themSP = useCallback((sp: SanPham) => {
    setDsSanPham((prev) => [...prev, sp]);
  }, [setDsSanPham]);

  const suaSP = useCallback((id: string, data: Partial<SanPham>) => {
    setDsSanPham((prev) => prev.map((p) => p.id === id ? { ...p, ...data } : p));
  }, [setDsSanPham]);

  const xoaSP = useCallback(async (id: string) => {
    setDsSanPham((prev) => prev.filter((p) => p.id !== id));
    if (isSupabaseEnabled) {
      // supabaseDelete mặc định dùng cột 'id', ta phải dùng query riêng cho ma_sp
      const { supabase } = await import("@/lib/supabase/client");
      if (supabase) {
        await supabase.from("san_pham").delete().eq("ma_sp", id);
        await supabase.from("kho_thanh_pham").delete().eq("ma_sp", id);
      }
    }
  }, [setDsSanPham]);

  // Hook này tự động sync, hàm refresh giữ lại để tương thích API cũ nhưng ko cần làm gì
  const refresh = useCallback(() => {}, []);

  return (
    <DanhMucSPContext.Provider value={{ dsSanPham, themSP, suaSP, xoaSP, loading, refresh }}>
      {children}
    </DanhMucSPContext.Provider>
  );
}

export function useDanhMucSP() {
  const context = useContext(DanhMucSPContext);
  if (context === undefined) {
    throw new Error("useDanhMucSP must be used within a DanhMucSPProvider");
  }
  return context;
}
