
// ============ LENH CAT STORE (Giai đoạn 3 - Nâng cấp) ============
// Quản lý Lệnh Cắt mới tạo (CuttingOrder)
// Lưu localStorage `mimin_lenh_cat_v2` + sync Supabase
// Auto-generate ID theo format LC-2026-XXXX
// CRUD: themLenhCat, suaLenhCat, xoaLenhCat
// 2026-08-03: Thêm sync Supabase (sếp Sang bật lại schema)

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { logWorkflow } from "../audit-log";
import { supabaseUpsert, supabaseDelete, supabaseFetchAll, isSupabaseEnabled } from "@/lib/supabase/client";
import type { AppUser } from "@/components/session-provider";

export type LoaiSP = "AoTru" | "AoCoTron" | "BoTru" | "BoCoTron";
export type LoaiLenh = "HangNha" | "HangDat";

export const LOAI_SP_LABELS: Record<LoaiSP, string> = {
  "AoTru": "Áo Trụ",
  "AoCoTron": "Áo Cổ Tròn",
  "BoTru": "Bộ Trụ",
  "BoCoTron": "Bộ Cổ Tròn",
};

export const BANG_CHI_PHI_CO_DINH: Record<LoaiSP, ChiPhiCoDinh> = {
  "BoTru": { "Cắt": 1600, "Ép keo trụ": 300, "Ép nhãn": 300, "Khuy nút": 750, "Ủi": 1500, "Đóng gói": 1200, "Bao bì": 700, "Tem mác": 700, "Lưng thun": 1500 },
  "AoTru": { "Cắt": 900, "Ép keo trụ": 300, "Ép nhãn": 300, "Khuy nút": 750, "Ủi": 900, "Đóng gói": 700, "Bao bì": 700, "Tem mác": 700, "Lưng thun": 0 },
  "BoCoTron": { "Cắt": 1600, "Ép keo trụ": 0, "Ép nhãn": 300, "Khuy nút": 0, "Ủi": 1400, "Đóng gói": 700, "Bao bì": 700, "Tem mác": 700, "Lưng thun": 1500 },
  "AoCoTron": { "Cắt": 800, "Ép keo trụ": 0, "Ép nhãn": 300, "Khuy nút": 0, "Ủi": 800, "Đóng gói": 1300, "Bao bì": 700, "Tem mác": 700, "Lưng thun": 0 }
};

export type TrangThaiLenhCat = "Nhap" | "DaTao" | "DangCat" | "HoanThanh" | "ChuyenTiep";

export const TRANG_THAI_LC_LABELS: Record<TrangThaiLenhCat, string> = {
  "Nhap": "Bản nháp",
  "DaTao": "Đã tạo",
  "DangCat": "Đang cắt",
  "HoanThanh": "Hoàn thành",
  "ChuyenTiep": "Chuyển tiếp",
};

export const TRANG_THAI_LC_STYLE: Record<TrangThaiLenhCat, { bg: string; color: string }> = {
  "Nhap": { bg: "bg-slate-500/15", color: "text-slate-700" },
  "DaTao": { bg: "bg-blue-500/15", color: "text-blue-700" },
  "DangCat": { bg: "bg-amber-500/15", color: "text-amber-700" },
  "HoanThanh": { bg: "bg-emerald-500/15", color: "text-emerald-700" },
  "ChuyenTiep": { bg: "bg-purple-500/15", color: "text-purple-700" },
};

export type MauVai = {
  ten: string;
  maSKU?: string;
  maVai: string;
  dinhMuc: number;
  slDuKien: number;
  slThucTe?: number;
  kgThucTe?: number;
  haoHut?: number;
  ghiChu: string;
  img: string;
  phanBoSize: { size: string; sl: number }[];
};

export type LenhCatPhuLieu = {
  maPL: string;
  tenPL: string;
  soLuong: number;
  donGia: number;
  dvt: string;
};

export type CongDoanItem = {
  id: string; // e.g. "cat", "mayAo", "in", "theu" or auto-generated
  tenCongDoan: string; // e.g. "Cắt", "May Áo", "In", "Thêu", "Ủi", "Đóng Gói", "In Chuyển Nhiệt"
  nguoiMa: string;
  nguoiTen: string;
  donGia: number;
};
export type PhanCongGiaCong = CongDoanItem[];

export type ChiPhiCoDinh = {
  [key: string]: number;
};

export type BangCOGS = {
  tongTienVai: number;
  tongTienPhuLieu: number;
  giaCong1SP: number;
  tongChiPhiCoDinh: number;
  giaVonBinhQuan: number;
  // Aliases cho UI hiển thị (Antigravity dùng trong page.tsx)
  giaVon1SP?: number;       // = giaVonBinhQuan
  tongGiaVon?: number;      // = giaVonBinhQuan * tongSL
};

export type LenhCat = {
  id: string; // Tự sinh VD: LC-2026-0001
  loaiLenh: LoaiLenh;
  khachHang?: string; // Nếu là Hàng Đặt
  loaiSP: LoaiSP;
  maSP: string;
  tenSP: string;
  tongSL: number;
  tongSLThucTe?: number;
  hanHoanThanh: string;
  tiLeSize: string; // VD 1:2:2:1
  // Màu sắc & Vải
  dsMau: MauVai[];
  // Phụ liệu
  dsPhuLieu: LenhCatPhuLieu[];
  // Gia Công
  mauCongDoan?: string;
  phanCong: PhanCongGiaCong;
  // Chi Phí Cố Định
  mauChiPhi?: string;
  chiPhiCoDinh: ChiPhiCoDinh;
  // Bảng tính
  bangCOGS?: BangCOGS;
  // Meta
  phuTrachCat: string;
  phuTrachSX?: string;
  ghiChu?: string;
  trangThai: TrangThaiLenhCat;
  phienBanDinhMuc: number;
  ngayTao: string;
  nguoiTao?: string;
};


export type MauCongDoanItem = {
  id: string;
  ten: string;
  giaCong: PhanCongGiaCong;
};

export type MauChiPhiItem = {
  id: string;
  ten: string;
  chiPhi: ChiPhiCoDinh;
};

const DEFAULT_MAU_CONG_DOAN: MauCongDoanItem[] = [];

const STORAGE_KEY_MCD = "mimin_mau_cong_doan";
const STORAGE_KEY = "mimin_lenh_cat_v2";

export function generateLenhCatId(existing: LenhCat[]): string {
  const year = new Date().getFullYear();
  const yearPrefix = `LC-${year}-`;
  const yearItems = existing.filter((l) => l.id.startsWith(yearPrefix));
  const maxNum = yearItems.reduce((max, l) => {
    const n = parseInt(l.id.replace(yearPrefix, ""), 10);
    return isNaN(n) ? max : Math.max(max, n);
  }, 0);
  const nextNum = (maxNum + 1).toString().padStart(4, "0");
  return `${yearPrefix}${nextNum}`;
}

// Bỏ hàm tính COGS tĩnh, sẽ tính động trong component và lưu lúc submit

interface LenhCatStore {
  dsLenhCat: LenhCat[];
  themLenhCat: (lenh: LenhCat, nguoiTao: AppUser) => void;
  suaLenhCat: (id: string, lenh: Partial<LenhCat>, nguoiSua: AppUser) => void;
  xoaLenhCat: (id: string, nguoiXoa: AppUser) => void;
  dsMauCongDoan: MauCongDoanItem[];
  themMauCongDoan: (mau: MauCongDoanItem) => void;
  xoaMauCongDoan: (id: string) => void;
  capNhatTrangThai: (id: string, tt: TrangThaiLenhCat, u: any) => void;
  reset: () => void;
}

const LenhCatContext = createContext<LenhCatStore | null>(null);

const DUMMY_DATA: LenhCat[] = [];

export function LenhCatProvider({ children }: { children: ReactNode }) {
  const [dsLenhCat, setDsLenhCat] = useState<LenhCat[]>([]);
  const [dsMauCongDoan, setDsMauCongDoan] = useState<MauCongDoanItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setDsLenhCat(JSON.parse(stored));
      } else {

        setDsLenhCat(DUMMY_DATA);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DUMMY_DATA));
      }
    } catch (err) {
      console.error(err);
    }
    
      const storedMCD = localStorage.getItem(STORAGE_KEY_MCD);
      if (storedMCD) {
        try {
          const parsed = JSON.parse(storedMCD);
          // If old format (object instead of array), reset
          if (parsed.length > 0 && !Array.isArray(parsed[0].giaCong)) {
            setDsMauCongDoan(DEFAULT_MAU_CONG_DOAN);
            localStorage.setItem(STORAGE_KEY_MCD, JSON.stringify(DEFAULT_MAU_CONG_DOAN));
          } else {
            setDsMauCongDoan(parsed);
          }
        } catch {
          setDsMauCongDoan([]);
        }
      } else {
        setDsMauCongDoan([]);
        localStorage.setItem(STORAGE_KEY_MCD, JSON.stringify(DEFAULT_MAU_CONG_DOAN));
      }


    setIsLoaded(true);
  }, []);

  const themLenhCat = useCallback((lenh: LenhCat, u: AppUser) => {
    setDsLenhCat((prev) => {
      const next = [lenh, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    logWorkflow(u, "create", `Tạo lệnh cắt ${lenh.id}`, lenh.id, { module: "lenh-cat" });
    // Sync Supabase (background, không block UI)
    if (isSupabaseEnabled) {
      supabaseUpsert("lenh_cat", lenh as any).catch((err) =>
        console.error("[LenhCatStore] Supabase upsert error:", err)
      );
    }
  }, []);

  const suaLenhCat = useCallback((id: string, lenh: Partial<LenhCat>, u: AppUser) => {
    let updated: LenhCat | null = null;
    setDsLenhCat((prev) => {
      const next = prev.map((item) => {
        if (item.id === id) {
          updated = { ...item, ...lenh };
          return updated;
        }
        return item;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    logWorkflow(u, "update", `Cập nhật lệnh cắt ${id}`, id, { module: "lenh-cat" });
    // Sync Supabase
    if (isSupabaseEnabled && updated) {
      supabaseUpsert("lenh_cat", updated as any).catch((err) =>
        console.error("[LenhCatStore] Supabase upsert error:", err)
      );
    }
  }, []);

  const xoaLenhCat = useCallback((id: string, u: AppUser) => {
    setDsLenhCat((prev) => {
      const next = prev.filter((item) => item.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    logWorkflow(u, "delete", `Xoá lệnh cắt ${id}`, id, { module: "lenh-cat" });
    // Sync Supabase
    if (isSupabaseEnabled) {
      supabaseDelete("lenh_cat", id).catch((err) =>
        console.error("[LenhCatStore] Supabase delete error:", err)
      );
    }
  }, []);
  
  const themMauCongDoan = useCallback((mau: MauCongDoanItem) => {
    setDsMauCongDoan(prev => {
      const exists = prev.some(x => x.id === mau.id);
      const next = exists ? prev.map(x => x.id === mau.id ? mau : x) : [...prev, mau];
      localStorage.setItem(STORAGE_KEY_MCD, JSON.stringify(next));
      return next;
    });
  }, []);
  const xoaMauCongDoan = useCallback((id: string) => {
    setDsMauCongDoan(prev => { const next = prev.filter(x => x.id !== id); localStorage.setItem(STORAGE_KEY_MCD, JSON.stringify(next)); return next; });
  }, []);
  const capNhatTrangThai = useCallback((id: string, tt: TrangThaiLenhCat, u: any) => {
    setDsLenhCat(prev => { const next = prev.map(x => x.id === id ? { ...x, trangThai: tt } : x); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); return next; });
  }, []);
  const reset = useCallback(() => {
    setDsLenhCat([]); localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    setDsMauCongDoan(DEFAULT_MAU_CONG_DOAN); localStorage.setItem(STORAGE_KEY_MCD, JSON.stringify(DEFAULT_MAU_CONG_DOAN));
  }, []);


  if (!isLoaded) return null;

  return (
    <LenhCatContext.Provider value={{ dsLenhCat, themLenhCat, suaLenhCat, xoaLenhCat, dsMauCongDoan, themMauCongDoan, xoaMauCongDoan, capNhatTrangThai, reset }}>
      {children}
    </LenhCatContext.Provider>
  );
}

export function useLenhCat() {
  const ctx = useContext(LenhCatContext);
  if (!ctx) throw new Error("useLenhCat must be used within LenhCatProvider");
  return ctx;
}
