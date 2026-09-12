"use client";

import { createContext, useCallback, useContext, useMemo, ReactNode } from "react";
import type { SanPham, MauTieuChuan, BangSize } from "./san-pham";
export type { SanPham, MauTieuChuan, BangSize };
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


// Chuyển từ App lên DB (snake_case), bỏ qua các cột chưa có nếu DB cũ
function buildDBPayload(sp: SanPham) {
  const payload: any = {
    ma_sp: sp.id,
    ma_dm: `DM-${sp.loaiSP}`,
    ten_sp: sp.tenSP,
    loai_sp: sp.loaiSP,
    gia_ban_du_kien: sp.giaBanDuKien,
    gia_von_du_kien: sp.giaVonDuKien,
    gia_ban_le: sp.giaBanLe,
    gia_ban_si: sp.giaBanSi,
    gia_ban_lo: sp.giaBanLo,
    gia_tiktok: sp.giaTikTok,
    gia_shopee: sp.giaShopee,
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
  if (sp.dbId) {
    payload.id = sp.dbId;
  }
  return payload;
}

function mapSanPhamFromDB(item: any, localData: SanPham[]): SanPham {
  // sync-helper.ts (snakeToCamel) da convert các key từ snake_case sang camelCase
  // Nên ta cần đọc cả 2 trường hợp để đảm bảo an toàn.
  const maSp = item.maSp || item.ma_sp;
  const local = localData.find((x) => x.id === maSp);
  const tenSP = item.tenSp || item.ten_sp || "Sản phẩm mới";
  
  let loaiSP = (item.loaiSp || item.loai_sp) as any || "AoCoTron";
  const validKeys = ["AoTru", "AoCoTron", "BoTru", "BoCoTron", "AoPolo", "PhuKien"];
  if (!validKeys.includes(loaiSP)) {
      const checkStr = (tenSP + " " + (item.phanLoai || item.phan_loai || "")).toLowerCase();
      if (checkStr.includes("áo polo") || checkStr.includes("ao polo")) loaiSP = "AoPolo";
      else if (checkStr.includes("áo trụ") || checkStr.includes("ao tru") || checkStr.includes("cổ trụ") || checkStr.includes("co tru")) loaiSP = "AoTru";
      else if (checkStr.includes("áo tròn") || checkStr.includes("áo cổ tròn") || checkStr.includes("cổ tròn") || checkStr.includes("co tron")) loaiSP = "AoCoTron";
      else if (checkStr.includes("bộ tròn") || checkStr.includes("bộ cổ tròn") || checkStr.includes("bo tron") || checkStr.includes("bo co tron")) loaiSP = "BoCoTron";
      else if (checkStr.includes("phụ kiện") || checkStr.includes("quần") || checkStr.includes("quan")) loaiSP = "PhuKien";
      else if (checkStr.includes("áo thun") || checkStr.includes("áo") || checkStr.includes("ao")) loaiSP = "AoCoTron";
      else loaiSP = "BoTru";
  }

  return {
    id: maSp || item.id, // Application ID (ma_sp string)
    dbId: item.id, // UUID in database
    tenSP: tenSP,
    loaiSP: loaiSP,
    giaBanDuKien: item.giaBanDuKien ?? item.gia_ban_du_kien ?? 0,
    giaVonDuKien: item.giaVonDuKien ?? item.gia_von_du_kien ?? 0,
    giaBanLe: item.giaBanLe ?? item.gia_ban_le ?? 0,
    giaBanSi: item.giaBanSi ?? item.gia_ban_si ?? 0,
    giaBanLo: item.giaBanLo ?? item.gia_ban_lo ?? 0,
    giaTikTok: item.giaTikTok ?? item.gia_tiktok ?? 0,
    giaShopee: item.giaShopee ?? item.gia_shopee ?? 0,
    tiLeSize: item.tiLeSize || item.ti_le_size || "1:2:2:2:1",
    bangSize: item.bangSize || item.bang_size || { sizes: [], ratios: [], riSo: 1 },
    dsMau: (typeof (item.dsMau || item.ds_mau) === 'string' ? (function(){ try { return JSON.parse(item.dsMau || item.ds_mau); } catch(e){ return []; } })() : (item.dsMau || item.ds_mau)) || [],
    ghiChu: item.ghiChu || item.ghi_chu || "",
    ngayTao: item.createdAt || item.created_at ? (item.createdAt || item.created_at).split("T")[0] : new Date().toISOString().split("T")[0],
    hinhAnh: item.hinhAnh || item.hinh_anh || local?.hinhAnh || "",
    trangThai: item.trangThai || item.trang_thai || "con-hang",
    ncc: item.ncc || item.ncc || "",
    chatLieu: item.chatLieu || item.chat_lieu || "",
    daBan: item.daBan ?? item.da_ban ?? 0,
    rating: item.rating ?? 0,
    luotXem: item.luotXem ?? item.luot_xem ?? 0,
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

  const { data: dsSanPham, setData: setDsSanPham, loading } = useSupabaseSync<SanPham>(
    STORAGE_KEY,
    "san_pham",
    [],
    {
      mapOut: (row) => buildDBPayload(row),
      mapIn: (row) => mapSanPhamFromDB(row, getLocalData()),
      onConflict: "id"
    }
  );

  const themSP = useCallback((sp: SanPham) => {
    setDsSanPham((prev) => [...prev, sp]);
  }, [setDsSanPham]);

  const suaSP = useCallback(async (id: string, data: Partial<SanPham>) => {
    setDsSanPham((prev) => {
      const exists = prev.some((p) => p.id === id);
      if (exists) {
        // Update record đã có
        return prev.map((p) => p.id === id ? { ...p, ...data, ngayCapNhat: new Date().toISOString().slice(0, 10) } : p);
      } else {
        // SP từ kho chưa có trong danh mục → thêm mới
        const newSP: SanPham = { id, tenSP: "", loaiSP: "BoTru", ...data, ngayCapNhat: new Date().toISOString().slice(0, 10) } as SanPham;
        return [...prev, newSP];
      }
    });

    // Đồng bộ lập tức vào localStorage của Kho Thành Phẩm
    if (data.loaiSP || data.tenSP || data.dsMau) {
      try {
        const KHO_KEY = "mimin_kho_thanh_pham_v2";
        const raw = localStorage.getItem(KHO_KEY);
        if (raw) {
          let khoData = JSON.parse(raw);
          let changed = false;
          khoData = khoData.map((item: any) => {
            if (item.maSP === id) {
              changed = true;
              let newHinhAnh = item.hinhAnh;
              let newImgQuan = item.imgQuan;
              let newVideo = item.video;

              if (data.dsMau && Array.isArray(data.dsMau)) {
                const matchedMau = data.dsMau.find(m => m.ten === item.mau);
                if (matchedMau) {
                  if (matchedMau.img) {
                    newHinhAnh = [matchedMau.img, ...(matchedMau.hinhAnhChiTiet || [])];
                  }
                  if ((matchedMau as any).imgQuan) {
                    newImgQuan = (matchedMau as any).imgQuan;
                  }
                  if (matchedMau.video !== undefined) {
                    newVideo = matchedMau.video;
                  }
                }
              }

              return {
                ...item,
                ...(data.loaiSP ? { phanLoai: data.loaiSP } : {}),
                ...(data.tenSP ? { tenSP: data.tenSP } : {}),
                ...(newHinhAnh ? { hinhAnh: newHinhAnh } : {}),
                ...(newImgQuan ? { imgQuan: newImgQuan } : {}),
                ...(newVideo !== undefined ? { video: newVideo } : {})
              };
            }
            return item;
          });
          if (changed) {
            localStorage.setItem(KHO_KEY, JSON.stringify(khoData));
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("mimin:kho-thanh-pham-changed"));
            }
          }
        }
      } catch (e) {
        console.error("Lỗi đồng bộ local kho_thanh_pham:", e);
      }
    }

    if (isSupabaseEnabled && (data.loaiSP || data.tenSP || data.dsMau)) {
      try {
        const { supabase } = await import("@/lib/supabase/client");
        if (supabase) {
          // 1. Bulk update common fields
          const updates: any = {};
          if (data.loaiSP) updates.phan_loai = data.loaiSP;
          if (data.tenSP) updates.ten_sp = data.tenSP;
          if (Object.keys(updates).length > 0) {
            await supabase.from("kho_thanh_pham").update(updates).eq("ma_sp", id);
          }

          // 2. Specific update for variant images
          if (data.dsMau && Array.isArray(data.dsMau)) {
             for (const m of data.dsMau) {
               if (m.img) {
                 const variantUpdates: any = {
                   hinh_anh: [m.img, ...(m.hinhAnhChiTiet || [])]
                 };
                 if ((m as any).imgQuan) {
                   variantUpdates.img_quan = (m as any).imgQuan;
                 }
                 if (m.video !== undefined) {
                   variantUpdates.video = m.video;
                 }
                 await supabase.from("kho_thanh_pham").update(variantUpdates).eq("ma_sp", id).eq("mau", m.ten);
               }
             }
          }
        }
      } catch (e) {
        console.error("Lỗi đồng bộ kho_thanh_pham khi suaSP:", e);
      }
    }
  }, [setDsSanPham]);

  const xoaSP = useCallback(async (id: string) => {
    setDsSanPham((prev) => prev.filter((p) => p.id !== id));

    // Xóa khỏi localStorage của kho_thanh_pham
    try {
      const KHO_KEY = "mimin_kho_thanh_pham_v2";
      const raw = localStorage.getItem(KHO_KEY);
      if (raw) {
        let khoData = JSON.parse(raw);
        const filtered = khoData.filter((item: any) => item.maSP !== id);
        if (filtered.length !== khoData.length) {
          localStorage.setItem(KHO_KEY, JSON.stringify(filtered));
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("mimin:kho-thanh-pham-changed"));
          }
        }
      }
    } catch (e) {
      console.error("Lỗi xóa local kho_thanh_pham:", e);
    }

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
