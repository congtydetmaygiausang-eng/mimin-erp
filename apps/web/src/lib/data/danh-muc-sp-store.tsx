"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { type LoaiSP, type MauVai } from "./lenh-cat-store";
import { useSupabaseSync, supabaseUpsert, supabaseDelete } from "@/lib/supabase/client";

export interface MauTieuChuan {
  ten: string;
  maSKU: string;
  dinhMuc: number;
  img: string;
}

export interface BangSize {
  // 5 size: M, L, XL, 2XL, 3XL (5 so tuong ung)
  // 0 = khong lay size do
  // VD: [1, 2, 2, 2, 1] = ratio 1:2:2:2:1 (Ri8)
  sizes: ["M", "L", "XL", "2XL", "3XL"];
  ratios: [number, number, number, number, number];
  riSo: number; // Tong 1 ri = sum(ratios)
}

export interface SanPham {
  id: string; // Map to ma_sp in DB
  maSP?: string; // Add optional maSP mapping
  tenSP: string;
  loaiSP: LoaiSP;
  giaBanDuKien: number;
  giaVonDuKien: number;
  tiLeSize: string; // e.g. "1:2:2:2:1" (string de hien thi)
  bangSize: BangSize; // BANG SIZE rieng cua SP
  dsMau: MauTieuChuan[];
  ghiChu: string;
  ngayTao: string;
}

const DEFAULT_BANGSIZE_5SIZE: BangSize = {
  sizes: ["M", "L", "XL", "2XL", "3XL"],
  ratios: [1, 2, 2, 2, 1],
  riSo: 8,
};

const MOCK_DANH_MUC: SanPham[] = [
  {
    id: "M001",
    tenSP: "Bộ Thể Thao Nam Cao Cấp",
    loaiSP: "BoTru",
    giaBanDuKien: 250000,
    giaVonDuKien: 110000,
    tiLeSize: "1:2:2:2:1",
    bangSize: { sizes: ["M", "L", "XL", "2XL", "3XL"], ratios: [1, 2, 2, 2, 1], riSo: 8 },
    dsMau: [
      { ten: "Đen", maSKU: "M001-DEN", dinhMuc: 0.25, img: "" },
      { ten: "Trắng", maSKU: "M001-TRA", dinhMuc: 0.25, img: "" }
    ],
    ghiChu: "Vải thể thao co giãn 4 chiều",
    ngayTao: "2026-08-01",
  },
  {
    id: "A001",
    tenSP: "Áo Polo Basic",
    loaiSP: "AoTru",
    giaBanDuKien: 120000,
    giaVonDuKien: 65000,
    tiLeSize: "1:2:2:1",
    bangSize: { sizes: ["M", "L", "XL", "2XL", "3XL"], ratios: [1, 2, 2, 1, 0], riSo: 6 },
    dsMau: [
      { ten: "Xanh Đen", maSKU: "A001-XDEN", dinhMuc: 0.15, img: "" },
      { ten: "Rêu", maSKU: "A001-REU", dinhMuc: 0.15, img: "" }
    ],
    ghiChu: "Vải cá sấu poly",
    ngayTao: "2026-08-02",
  }
];

interface DanhMucSPContextType {
  dsSanPham: SanPham[];
  themSP: (sp: SanPham) => void;
  suaSP: (id: string, data: Partial<SanPham>) => void;
  xoaSP: (id: string) => void;
  loading: boolean;
}

const DanhMucSPContext = createContext<DanhMucSPContextType | undefined>(undefined);

export function DanhMucSPProvider({ children }: { children: ReactNode }) {
  const [dsSanPham, setDsSanPham] = useState<SanPham[]>([]);
  const [loading, setLoading] = useState(true);

  // Load from Supabase on mount
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const { supabase } = await import("@/lib/supabase/client");
        const client = supabase;
        if (client) {
          const { data, error } = await client.from("san_pham").select("*").order("ma_sp", { ascending: true });
          if (error) throw error;
          
          if (data && data.length > 0 && mounted) {
            // Map snake_case from DB back to camelCase for frontend, and map ma_sp -> id
            const mapped = data.map(item => ({
              id: item.ma_sp, // Map ma_sp to id so frontend doesn't break
              dbId: item.id, // Keep the UUID just in case
              tenSP: item.ten_sp || "",
              loaiSP: item.loai_sp as LoaiSP || "BoTru",
              giaBanDuKien: item.gia_ban_du_kien || 0,
              giaVonDuKien: item.gia_von_du_kien || 0,
              tiLeSize: item.ti_le_size || "",
              bangSize: item.bang_size || DEFAULT_BANGSIZE_5SIZE,
              dsMau: item.ds_mau || [],
              ghiChu: item.ghi_chu || "",
              ngayTao: item.ngay_tao || item.created_at || ""
            }));
            setDsSanPham(mapped as SanPham[]);
          } else if (mounted) {
             setDsSanPham(MOCK_DANH_MUC);
          }
        } else {
           setDsSanPham(MOCK_DANH_MUC);
        }
      } catch (e) {
        console.error("Lỗi fetch Sản phẩm", e);
        if (mounted) setDsSanPham(MOCK_DANH_MUC);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    
    load();
    return () => { mounted = false; };
  }, []);

  const themSP = useCallback(async (sp: SanPham) => {
    setDsSanPham(prev => [...prev, sp]); // Optimistic update
    
    try {
      const { supabase } = await import("@/lib/supabase/client");
      const client = supabase;
      if (client) {
        const dbPayload = {
          ma_sp: sp.id,
          ma_dm: `DM-${sp.loaiSP}`,
          ten_sp: sp.tenSP,
          loai_sp: sp.loaiSP,
          gia_ban_du_kien: sp.giaBanDuKien,
          gia_von_du_kien: sp.giaVonDuKien,
          ti_le_size: sp.tiLeSize,
          bang_size: sp.bangSize,
          ds_mau: sp.dsMau,
          ghi_chu: sp.ghiChu,
          ngay_tao: sp.ngayTao
        };
        await client.from("san_pham").insert(dbPayload);
      }
    } catch(e) {
      console.error(e);
    }
  }, []);

  const suaSP = useCallback(async (id: string, data: Partial<SanPham>) => {
    setDsSanPham(prev => prev.map(p => p.id === id ? { ...p, ...data } : p)); // Optimistic update
    
    try {
      const { supabase } = await import("@/lib/supabase/client");
      const client = supabase;
      if (client) {
         const snakeData: any = {};
         if (data.tenSP !== undefined) snakeData.ten_sp = data.tenSP;
         if (data.loaiSP !== undefined) snakeData.loai_sp = data.loaiSP;
         if (data.giaBanDuKien !== undefined) snakeData.gia_ban_du_kien = data.giaBanDuKien;
         if (data.giaVonDuKien !== undefined) snakeData.gia_von_du_kien = data.giaVonDuKien;
         if (data.tiLeSize !== undefined) snakeData.ti_le_size = data.tiLeSize;
         if (data.bangSize !== undefined) snakeData.bang_size = data.bangSize;
         if (data.dsMau !== undefined) snakeData.ds_mau = data.dsMau;
         if (data.ghiChu !== undefined) snakeData.ghi_chu = data.ghiChu;
         if (data.ngayTao !== undefined) snakeData.ngay_tao = data.ngayTao;
         
         await client.from("san_pham").update(snakeData).eq("ma_sp", id);
      }
    } catch(e) {
      console.error(e);
    }
  }, []);

  const xoaSP = useCallback(async (id: string) => {
    setDsSanPham(prev => prev.filter(p => p.id !== id)); // Optimistic update
    try {
      const { supabase } = await import("@/lib/supabase/client");
      const client = supabase;
      if (client) {
         await client.from("san_pham").delete().eq("ma_sp", id);
      }
    } catch(e) {
      console.error(e);
    }
  }, []);

  return (
    <DanhMucSPContext.Provider value={{ dsSanPham, themSP, suaSP, xoaSP, loading }}>
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
