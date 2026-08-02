
// ============ LENH CAT STORE (Giai đoạn 3 - Nâng cấp) ============
// Quản lý Lệnh Cắt mới tạo (CuttingOrder)
// Lưu localStorage `mimin_lenh_cat_v2`
// Auto-generate ID theo format LC-2026-XXXX
// CRUD: themLenhCat, suaLenhCat, xoaLenhCat

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { logWorkflow } from "../audit-log";
import type { AppUser } from "@/components/session-provider";

export type LoaiSP = "AoTru" | "AoCoTron" | "BoTru" | "BoCoTron";
export type LoaiLenh = "HangNha" | "HangDat";

export const LOAI_SP_LABELS: Record<LoaiSP, string> = {
  "AoTru": "Áo Trụ",
  "AoCoTron": "Áo Cổ Tròn",
  "BoTru": "Bộ Trụ",
  "BoCoTron": "Bộ Cổ Tròn",
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

export type PhanCongGiaCong = {
  cat?: { nguoiMa: string; nguoiTen: string; donGia: number };
  mayAo?: { nguoiMa: string; nguoiTen: string; donGia: number };
  mayQuan?: { nguoiMa: string; nguoiTen: string; donGia: number };
  inTheu?: { nguoiMa: string; nguoiTen: string; donGia: number };
  uiQC?: { nguoiMa: string; nguoiTen: string; donGia: number };
};

export type ChiPhiCoDinh = {
  baoBi: number;
  temNhan: number;
  khauHao: number;
};

export type BangCOGS = {
  tongTienVai: number;
  tongTienPhuLieu: number;
  giaCong1SP: number;
  tongChiPhiCoDinh: number;
  giaVonBinhQuan: number;
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

const DEFAULT_MAU_CONG_DOAN: MauCongDoanItem[] = [
  { id: "AoThun", ten: "Áo Thun", giaCong: { cat: { nguoiMa: "", nguoiTen: "", donGia: 1400 }, mayAo: { nguoiMa: "", nguoiTen: "", donGia: 12000 }, inTheu: { nguoiMa: "", nguoiTen: "", donGia: 3000 }, uiQC: { nguoiMa: "", nguoiTen: "", donGia: 2000 } } },
  { id: "Quan", ten: "Quần", giaCong: { cat: { nguoiMa: "", nguoiTen: "", donGia: 900 }, mayQuan: { nguoiMa: "", nguoiTen: "", donGia: 15000 }, uiQC: { nguoiMa: "", nguoiTen: "", donGia: 2500 } } },
  { id: "BoTheThao", ten: "Bộ Thể Thao", giaCong: { cat: { nguoiMa: "", nguoiTen: "", donGia: 2300 }, mayAo: { nguoiMa: "", nguoiTen: "", donGia: 12000 }, mayQuan: { nguoiMa: "", nguoiTen: "", donGia: 15000 }, inTheu: { nguoiMa: "", nguoiTen: "", donGia: 3000 }, uiQC: { nguoiMa: "", nguoiTen: "", donGia: 4500 } } }
];

const DEFAULT_MAU_CHI_PHI: MauChiPhiItem[] = [
  { id: "AoThun", ten: "Áo Thun", chiPhi: { baoBi: 1500, temNhan: 500, khauHao: 2000 } },
  { id: "Quan", ten: "Quần", chiPhi: { baoBi: 1200, temNhan: 300, khauHao: 1500 } },
  { id: "BoTheThao", ten: "Bộ Thể Thao", chiPhi: { baoBi: 2500, temNhan: 1000, khauHao: 3500 } }
];

const STORAGE_KEY_MCD = "mimin_mau_cong_doan";
const STORAGE_KEY_MCP = "mimin_mau_chi_phi";

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
  dsMauChiPhi: MauChiPhiItem[];
  themMauCongDoan: (mau: MauCongDoanItem) => void;
  themMauChiPhi: (mau: MauChiPhiItem) => void;
  capNhatTrangThai: (id: string, tt: TrangThaiLenhCat, u: any) => void;
  reset: () => void;
}

const LenhCatContext = createContext<LenhCatStore | null>(null);

const DUMMY_DATA: LenhCat[] = [];

export function LenhCatProvider({ children }: { children: ReactNode }) {
  const [dsLenhCat, setDsLenhCat] = useState<LenhCat[]>([]);

  const [dsMauCongDoan, setDsMauCongDoan] = useState<MauCongDoanItem[]>([]);
  const [dsMauChiPhi, setDsMauChiPhi] = useState<MauChiPhiItem[]>([]);

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
      if (storedMCD) setDsMauCongDoan(JSON.parse(storedMCD));
      else { setDsMauCongDoan(DEFAULT_MAU_CONG_DOAN); localStorage.setItem(STORAGE_KEY_MCD, JSON.stringify(DEFAULT_MAU_CONG_DOAN)); }
      
      const storedMCP = localStorage.getItem(STORAGE_KEY_MCP);
      if (storedMCP) setDsMauChiPhi(JSON.parse(storedMCP));
      else { setDsMauChiPhi(DEFAULT_MAU_CHI_PHI); localStorage.setItem(STORAGE_KEY_MCP, JSON.stringify(DEFAULT_MAU_CHI_PHI)); }

    setIsLoaded(true);
  }, []);

  const themLenhCat = useCallback((lenh: LenhCat, u: AppUser) => {
    setDsLenhCat((prev) => {
      const next = [lenh, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    logWorkflow(`Tạo lệnh cắt ${lenh.id}`, "Tạo mới", u, "Thành công");
  }, []);

  const suaLenhCat = useCallback((id: string, lenh: Partial<LenhCat>, u: AppUser) => {
    setDsLenhCat((prev) => {
      const next = prev.map((item) => (item.id === id ? { ...item, ...lenh } : item));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    logWorkflow(`Cập nhật lệnh cắt ${id}`, "Cập nhật", u, "Thành công");
  }, []);

  const xoaLenhCat = useCallback((id: string, u: AppUser) => {
    setDsLenhCat((prev) => {
      const next = prev.filter((item) => item.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    logWorkflow(`Xoá lệnh cắt ${id}`, "Xoá", u, "Thành công");
  }, []);
  
  const themMauCongDoan = useCallback((mau: MauCongDoanItem) => {
    setDsMauCongDoan(prev => { const next = [...prev, mau]; localStorage.setItem(STORAGE_KEY_MCD, JSON.stringify(next)); return next; });
  }, []);
  const themMauChiPhi = useCallback((mau: MauChiPhiItem) => {
    setDsMauChiPhi(prev => { const next = [...prev, mau]; localStorage.setItem(STORAGE_KEY_MCP, JSON.stringify(next)); return next; });
  }, []);
  const capNhatTrangThai = useCallback((id: string, tt: TrangThaiLenhCat, u: any) => {
    setDsLenhCat(prev => { const next = prev.map(x => x.id === id ? { ...x, trangThai: tt } : x); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); return next; });
  }, []);
  const reset = useCallback(() => {
    setDsLenhCat([]); localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    setDsMauCongDoan(DEFAULT_MAU_CONG_DOAN); localStorage.setItem(STORAGE_KEY_MCD, JSON.stringify(DEFAULT_MAU_CONG_DOAN));
    setDsMauChiPhi(DEFAULT_MAU_CHI_PHI); localStorage.setItem(STORAGE_KEY_MCP, JSON.stringify(DEFAULT_MAU_CHI_PHI));
  }, []);


  if (!isLoaded) return null;

  return (
    <LenhCatContext.Provider value={{ dsLenhCat, themLenhCat, suaLenhCat, xoaLenhCat, dsMauCongDoan, dsMauChiPhi, themMauCongDoan, themMauChiPhi, capNhatTrangThai, reset }}>
      {children}
    </LenhCatContext.Provider>
  );
}

export function useLenhCat() {
  const ctx = useContext(LenhCatContext);
  if (!ctx) throw new Error("useLenhCat must be used within LenhCatProvider");
  return ctx;
}
