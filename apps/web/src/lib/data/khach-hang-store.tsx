"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase, supabaseUpsert, supabaseDelete, isSupabaseEnabled } from "@/lib/supabase/client";

export type KhachHangDBModel = {
  id: string;
  ma_kh: string;
  ten_kh: string;
  loai: string;
  dia_chi: string;
  sdt: string;
  email: string;
  mst: string;
  nguoi_lh: string;
  chinh_sach?: string;
  han_muc_no?: number;
  cong_no_hien_tai: number;
  doanh_so_nam?: number;
  sp_chinh?: string;
  ghi_chu: string;
  trang_thai: string;
  // === P2 - 2026-08-07 - Rating tach rieng ===
  rating?: number;
};

export type KhachHangUI = {
  id?: string;
  maKH: string;
  ten: string;
  sdt: string;
  email: string;
  diaChi: string;
  mst?: string;
  congNo: number;
  rating: number;
  ghiChu: string;
  loai?: string;
  trangThai?: string;
  avatar?: string;
  // === P1 - 2026-08-07 - Han muc no KH ===
  hanMucNo?: number;
};

// P1 - 2026-08-07 - Enum phan loai KH
export const LOAI_KH_OPTIONS = ["Đại lý cấp 1", "Đại lý cấp 2", "Công ty", "Shop", "Cá nhân"] as const;
export type LoaiKH = typeof LOAI_KH_OPTIONS[number];

function mapToDB(ui: KhachHangUI): any {
  return {
    id: ui.id,
    ma_kh: ui.maKH,
    ten_kh: ui.ten,
    loai: ui.loai || "",
    dia_chi: ui.diaChi,
    sdt: ui.sdt,
    email: ui.email,
    mst: ui.mst || "",
    cong_no: ui.congNo || 0,
    han_muc_no: ui.hanMucNo || 0, // P1 - 2026-08-07
    rating: ui.rating || 4,
    ghi_chu: ui.ghiChu || "",
    trang_thai: ui.trangThai || "Thường",
  };
}

function mapToUI(db: any): KhachHangUI {
  let r = db.rating || 4;
  if (!db.rating) {
    const match = db.ghi_chu?.match(/Đánh giá:\s*(\d)/);
    if (match) r = parseInt(match[1], 10);
  }

  let mst = db.mst || "";
  const mstMatch = db.ghi_chu?.match(/MST:\s*([\d\-]+)/);
  if (mstMatch && !mst) mst = mstMatch[1];

  let ghiChu = db.ghi_chu || "";
  ghiChu = ghiChu.replace(/Đánh giá:\s*\d\s*\|\s*/, "").replace(/MST:\s*[\d\-]+\s*\|\s*/, "");

  return {
    id: db.id,
    maKH: db.ma_kh,
    ten: db.ten_kh || db.ten, // Hỗ trợ cả ten_kh (cũ) và ten (mới trong bảng khach_hang)
    sdt: db.sdt || "",
    email: db.email || "",
    diaChi: db.dia_chi || "",
    loai: db.loai || "",
    congNo: db.cong_no || db.cong_no_hien_tai || 0,
    hanMucNo: db.han_muc_no || 0, // P1 - 2026-08-07
    ghiChu: ghiChu,
    trangThai: db.trang_thai || "",
    rating: r,
    mst: mst
  };
}

type KhachHangContextType = {
  list: KhachHangUI[];
  themKhachHang: (kh: KhachHangUI) => Promise<boolean>;
  suaKhachHang: (kh: KhachHangUI) => Promise<boolean>;
  xoaKhachHang: (idOrMaKH: string) => Promise<boolean>;
  loading: boolean;
};

const Ctx = createContext<KhachHangContextType | null>(null);
const STORAGE_KEY = "mimin_khach_hang_v1";

const KHACH_HANG_MOCK: KhachHangUI[] = [
  { maKH: "KH-001", ten: "Cty May Hà Nội", sdt: "0901234567", email: "hanoi@may.vn", diaChi: "Hà Nội", congNo: 15000000, rating: 5, ghiChu: "Khách VIP", loai: "Công ty" },
  { maKH: "KH-002", ten: "Shop Thời Trang Sài Gòn", sdt: "0901234568", email: "saigon@shop.vn", diaChi: "TPHCM", congNo: 0, rating: 4, ghiChu: "Khách lẻ", loai: "Shop" },
];

export function KhachHangProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<KhachHangUI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setList(parsed);
        }
      }
    } catch (err) {}
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchSupabase = async () => {
      if (!isSupabaseEnabled) {
        if (list.length === 0) setList(KHACH_HANG_MOCK);
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase!.from("khach_hang").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        
        if (mounted) {
          if (data && data.length > 0) {
            const mapped = data.map((d: any) => mapToUI(d));
            setList(mapped);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
          } else {
            setList(KHACH_HANG_MOCK);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(KHACH_HANG_MOCK));
            Promise.all(KHACH_HANG_MOCK.map(kh => 
              supabaseUpsert("khach_hang", mapToDB(kh))
            )).catch(() => {});
          }
        }
      } catch (err) {
        if (mounted && list.length === 0) setList(KHACH_HANG_MOCK);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchSupabase();
    return () => { mounted = false; };
  }, []);

  const themKhachHang = useCallback(async (kh: KhachHangUI) => {
    setList(prev => {
      const newList = [kh, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      return newList;
    });
    if (isSupabaseEnabled) {
      try {
        await supabaseUpsert("khach_hang", mapToDB(kh));
        return true;
      } catch (err) { return false; }
    }
    return true;
  }, []);

  const suaKhachHang = useCallback(async (kh: KhachHangUI) => {
    setList(prev => {
      const newList = prev.map(x => x.maKH === kh.maKH ? kh : x);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      return newList;
    });
    if (isSupabaseEnabled) {
      try {
        await supabase!.from("khach_hang").update(mapToDB(kh)).eq("ma_kh", kh.maKH);
        return true;
      } catch (err) { return false; }
    }
    return true;
  }, []);

  const xoaKhachHang = useCallback(async (maKH: string) => {
    setList(prev => {
      const newList = prev.filter(x => x.maKH !== maKH);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      return newList;
    });
    if (isSupabaseEnabled) {
      try {
        await supabase!.from("khach_hang").delete().eq("ma_kh", maKH);
        return true;
      } catch (err) { return false; }
    }
    return true;
  }, []);

  return (
    <Ctx.Provider value={{ list, themKhachHang, suaKhachHang, xoaKhachHang, loading }}>
      {children}
    </Ctx.Provider>
  );
}

export function useKhachHang() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useKhachHang must be used within KhachHangProvider");
  return ctx;
}
