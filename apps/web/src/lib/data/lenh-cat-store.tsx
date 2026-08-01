"use client";

// ============ LENH CAT STORE (Giai đoạn 1 - Mavis) ============
// Quản lý Lệnh Cắt mới tạo (CuttingOrder)
// Lưu localStorage `mimin_lenh_cat_v1`
// Auto-generate ID theo format LC-2026-XXXX
// CRUD: themLenhCat, suaLenhCat, xoaLenhCat
// Trang thái: Moi → DangCat → DaCat → HoanThanh

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { logWorkflow } from "../audit-log";
import type { AppUser } from "@/components/session-provider";

export type LoaiSP = "AoTru" | "AoCoTron" | "BoTru" | "BoCoTron";

export const LOAI_SP_LABELS: Record<LoaiSP, string> = {
  "AoTru": "Áo Trụ",
  "AoCoTron": "Áo Cổ Tròn",
  "BoTru": "Bộ Trụ",
  "BoCoTron": "Bộ Cổ Tròn",
};

export type TrangThaiLenhCat = "Moi" | "DangCat" | "DaCat" | "HoanThanh";

export const TRANG_THAI_LC_LABELS: Record<TrangThaiLenhCat, string> = {
  "Moi": "Mới tạo",
  "DangCat": "Đang cắt",
  "DaCat": "Đã cắt",
  "HoanThanh": "Hoàn thành",
};

export const TRANG_THAI_LC_STYLE: Record<TrangThaiLenhCat, { bg: string; color: string }> = {
  "Moi": { bg: "bg-slate-500/15", color: "text-slate-700" },
  "DangCat": { bg: "bg-amber-500/15", color: "text-amber-700" },
  "DaCat": { bg: "bg-sky-500/15", color: "text-sky-700" },
  "HoanThanh": { bg: "bg-emerald-500/15", color: "text-emerald-700" },
};

// ============ Vải trong lệnh cắt (multi-màu, có giá riêng) ============
export type LenhCatVai = {
  maVai: string;       // Mã VT từ KHO_VAI
  tenVai: string;      // Tên vải (lookup)
  soKg: number;        // Số kg xuất kho
  donGia: number;       // đ/kg (lookup từ KHO_VAI, có thể chỉnh)
};

// ============ Phụ liệu trong lệnh cắt ============
export type LenhCatPhuLieu = {
  maPL: string;         // Mã VT từ KHO_VAT_TU
  tenPL: string;        // Tên phụ liệu
  soLuong: number;      // SL xuất
  donGia: number;       // đ/đvt
  dvt: string;          // đơn vị tính
};

// ============ Phân công gia công (5 khâu) ============
export type PhanCongGiaCong = {
  cat: { nguoiMa: string; nguoiTen: string; donGia: number };
  mayAo?: { nguoiMa: string; nguoiTen: string; donGia: number };   // Có cho Áo & Bộ
  mayQuan?: { nguoiMa: string; nguoiTen: string; donGia: number }; // Chỉ Bộ
  inTheu?: { nguoiMa: string; nguoiTen: string; donGia: number };  // Có thể có
  uiQC: { nguoiMa: string; nguoiTen: string; donGia: number };
};

// ============ Bảng COGS (tính tự động) ============
export type BangCOGS = {
  // Vải
  tongTienVai: number;
  giaVaiBQ: number;       // đ / 1 SP
  // Phụ liệu
  tongTienPhuLieu: number;
  giaPhuLieuBQ: number;   // đ / 1 SP
  // Công (sum 5 khâu × SL)
  congCat: number;
  congMay: number;         // May Áo + May Quần
  congInTheu: number;
  congUiQC: number;
  tongCong: number;
  giaCongBQ: number;       // đ / 1 SP
  // Hao hụt
  haoHutPhanTram: number;  // 1.5%
  tienHaoHut: number;
  // Tổng
  tongGiaVon: number;       // Tổng cả lô
  giaVon1SP: number;        // đ / 1 SP
};

// ============ CuttingOrder (entity chính) ============
export type LenhCat = {
  id: string;                    // "LC-2026-0001"
  loaiSP: LoaiSP;
  maSP: string;
  tenSP: string;
  tongSL: number;
  hanHoanThanh: string;
  phanBoSize: { size: string; sl: number }[];
  phuTrachCat: string;           // Mã NV Tổ Cắt
  phuTrachCatTen?: string;        // Tên NV
  ghiChu?: string;
  // Section 2
  dsVai: LenhCatVai[];
  dsPhuLieu: LenhCatPhuLieu[];
  // Section 3
  phanCong: PhanCongGiaCong;
  haoHutPhanTram: number;          // 1.5
  // Section 4 (tính tự động)
  bangCOGS?: BangCOGS;
  // Meta
  trangThai: TrangThaiLenhCat;
  ngayTao: string;
  nguoiTao?: string;
  ngaySua?: string;
  nguoiSua?: string;
};

const STORAGE_KEY = "mimin_lenh_cat_v1";

// ============ Helper: generate ID tự động ============
function generateLenhCatId(existing: LenhCat[]): string {
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

// ============ Helper: tính COGS từ form data ============
export function tinhCOGS(
  loaiSP: LoaiSP,
  tongSL: number,
  dsVai: LenhCatVai[],
  dsPhuLieu: LenhCatPhuLieu[],
  phanCong: PhanCongGiaCong,
  haoHutPhanTram: number
): BangCOGS {
  // Vải
  const tongTienVai = dsVai.reduce((s, v) => s + v.soKg * v.donGia, 0);
  const giaVaiBQ = tongSL > 0 ? tongTienVai / tongSL : 0;

  // Phụ liệu
  const tongTienPhuLieu = dsPhuLieu.reduce((s, p) => s + p.soLuong * p.donGia, 0);
  const giaPhuLieuBQ = tongSL > 0 ? tongTienPhuLieu / tongSL : 0;

  // Công (tính theo tổng SL)
  const congCat = phanCong.cat.donGia * tongSL;
  const congMay =
    (phanCong.mayAo?.donGia ?? 0) * tongSL +
    (phanCong.mayQuan?.donGia ?? 0) * tongSL;
  const congInTheu = (phanCong.inTheu?.donGia ?? 0) * tongSL;
  const congUiQC = phanCong.uiQC.donGia * tongSL;
  const tongCong = congCat + congMay + congInTheu + congUiQC;
  const giaCongBQ = tongSL > 0 ? tongCong / tongSL : 0;

  // Hao hụt
  const tienHaoHut = ((tongTienVai + tongTienPhuLieu + tongCong) * haoHutPhanTram) / 100;

  // Tổng
  const tongGiaVon = tongTienVai + tongTienPhuLieu + tongCong + tienHaoHut;
  const giaVon1SP = tongSL > 0 ? tongGiaVon / tongSL : 0;

  return {
    tongTienVai,
    giaVaiBQ,
    tongTienPhuLieu,
    giaPhuLieuBQ,
    congCat,
    congMay,
    congInTheu,
    congUiQC,
    tongCong,
    giaCongBQ,
    haoHutPhanTram,
    tienHaoHut,
    tongGiaVon,
    giaVon1SP,
  };
}

// ============ Default data (mẫu từ workflow thật) ============
const DEFAULT: LenhCat[] = [
  {
    id: "LC-2026-0001",
    loaiSP: "BoTru",
    maSP: "M758",
    tenSP: "Bộ trụ trơn (M758)",
    tongSL: 500,
    hanHoanThanh: "2026-07-30",
    phanBoSize: [
      { size: "L", sl: 150 },
      { size: "XL", sl: 200 },
      { size: "2XL", sl: 150 },
    ],
    phuTrachCat: "NV002",
    phuTrachCatTen: "Nguyễn Thị Mỹ Nhi (Cắt)",
    ghiChu: "Lô M758 tuần W28",
    dsVai: [
      { maVai: "V001", tenVai: "Vải cotton 100% (trắng)", soKg: 250, donGia: 70000 },
    ],
    dsPhuLieu: [
      { maPL: "PL001", tenPL: "Bo cổ 2 da", soLuong: 500, donGia: 6500, dvt: "cái" },
      { maPL: "PL002", tenPL: "Khóa eo", soLuong: 500, donGia: 2500, dvt: "cái" },
      { maPL: "PL003", tenPL: "Cúc 4 lỗ", soLuong: 2000, donGia: 200, dvt: "cúc" },
      { maPL: "PL004", tenPL: "Chỉ may", soLuong: 30, donGia: 25000, dvt: "cuộn" },
      { maPL: "PL005", tenPL: "Nhãn POLOMIMIN", soLuong: 500, donGia: 800, dvt: "cái" },
      { maPL: "PL006", tenPL: "Túi PE đựng SP", soLuong: 500, donGia: 1200, dvt: "cái" },
    ],
    phanCong: {
      cat: { nguoiMa: "NV002", nguoiTen: "Nguyễn Thị Mỹ Nhi (Cắt)", donGia: 3500 },
      mayAo: { nguoiMa: "GS002", nguoiTen: "Xưởng may Liễu", donGia: 22000 },
      mayQuan: { nguoiMa: "GS001", nguoiTen: "Xưởng may Hương (Quần)", donGia: 18000 },
      uiQC: { nguoiMa: "NV010", nguoiTen: "Trương Minh Tâm (Ủi)", donGia: 3000 },
    },
    haoHutPhanTram: 1.5,
    bangCOGS: undefined, // Sẽ tính khi load
    trangThai: "DaCat",
    ngayTao: "2026-07-08",
    nguoiTao: "QLSX",
  },
  {
    id: "LC-2026-0002",
    loaiSP: "AoTru",
    maSP: "M873",
    tenSP: "Áo trụ (M873)",
    tongSL: 546,
    hanHoanThanh: "2026-08-05",
    phanBoSize: [
      { size: "M", sl: 200 },
      { size: "L", sl: 200 },
      { size: "XL", sl: 146 },
    ],
    phuTrachCat: "NV002",
    phuTrachCatTen: "Nguyễn Thị Mỹ Nhi (Cắt)",
    ghiChu: "Lô M873 tuần W29",
    dsVai: [
      { maVai: "V002", tenVai: "Vải cotton compact (đen)", soKg: 273, donGia: 91000 },
    ],
    dsPhuLieu: [
      { maPL: "PL001", tenPL: "Bo cổ 2 da", soLuong: 546, donGia: 6500, dvt: "cái" },
      { maPL: "PL003", tenPL: "Cúc 4 lỗ", soLuong: 2184, donGia: 200, dvt: "cúc" },
      { maPL: "PL004", tenPL: "Chỉ may", soLuong: 25, donGia: 25000, dvt: "cuộn" },
      { maPL: "PL005", tenPL: "Nhãn POLOMIMIN", soLuong: 546, donGia: 800, dvt: "cái" },
      { maPL: "PL006", tenPL: "Túi PE đựng SP", soLuong: 546, donGia: 1200, dvt: "cái" },
    ],
    phanCong: {
      cat: { nguoiMa: "NV002", nguoiTen: "Nguyễn Thị Mỹ Nhi (Cắt)", donGia: 3500 },
      mayAo: { nguoiMa: "GS003", nguoiTen: "Xưởng may Cúc (Áo trụ)", donGia: 22000 },
      inTheu: { nguoiMa: "DT-IT-005", nguoiTen: "In Bảo Ngân", donGia: 4500 },
      uiQC: { nguoiMa: "NV010", nguoiTen: "Trương Minh Tâm (Ủi)", donGia: 3000 },
    },
    haoHutPhanTram: 1.5,
    bangCOGS: undefined,
    trangThai: "DangCat",
    ngayTao: "2026-07-15",
    nguoiTao: "QLSX",
  },
];

// ============ Store ============
type StoreContext = {
  dsLenhCat: LenhCat[];

  // Actions
  themLenhCat: (data: Omit<LenhCat, "id" | "ngayTao" | "trangThai" | "bangCOGS">, user: AppUser | null) => LenhCat;
  suaLenhCat: (id: string, patch: Partial<LenhCat>, user: AppUser | null) => void;
  xoaLenhCat: (id: string, user: AppUser | null) => void;
  capNhatTrangThai: (id: string, trangThai: TrangThaiLenhCat, user: AppUser | null) => void;
  tinhLaiCOGS: (id: string) => void; // Re-compute COGS cho 1 LC
  reset: () => void;
};

const Ctx = createContext<StoreContext | null>(null);

function loadData(): LenhCat[] {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as LenhCat[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Re-compute COGS cho tất cả LC load từ localStorage
        return parsed.map((lc) => ({
          ...lc,
          bangCOGS: tinhCOGS(lc.loaiSP, lc.tongSL, lc.dsVai, lc.dsPhuLieu, lc.phanCong, lc.haoHutPhanTram),
        }));
      }
    }
  } catch {}
  // Default cũng tính COGS
  return DEFAULT.map((lc) => ({
    ...lc,
    bangCOGS: tinhCOGS(lc.loaiSP, lc.tongSL, lc.dsVai, lc.dsPhuLieu, lc.phanCong, lc.haoHutPhanTram),
  }));
}

function saveData(d: LenhCat[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  } catch {}
}

export function LenhCatProvider({ children }: { children: ReactNode }) {
  const [dsLenhCat, setDsLenhCat] = useState<LenhCat[]>(DEFAULT);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setDsLenhCat(loadData());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveData(dsLenhCat);
  }, [dsLenhCat, hydrated]);

  const themLenhCat = useCallback(
    (
      data: Omit<LenhCat, "id" | "ngayTao" | "trangThai" | "bangCOGS">,
      user: AppUser | null
    ): LenhCat => {
      const id = generateLenhCatId(dsLenhCat);
      const bangCOGS = tinhCOGS(
        data.loaiSP,
        data.tongSL,
        data.dsVai,
        data.dsPhuLieu,
        data.phanCong,
        data.haoHutPhanTram
      );
      const newLC: LenhCat = {
        ...data,
        id,
        ngayTao: new Date().toISOString().split("T")[0],
        trangThai: "Moi",
        bangCOGS,
        nguoiTao: user?.id || user?.name || "QLSX",
      };
      setDsLenhCat((prev) => [newLC, ...prev]);
      logWorkflow(user, "create", `Tạo lệnh cắt ${id} - ${data.tenSP} (${data.tongSL} sp)`, id, {
        newValue: { loaiSP: data.loaiSP, maSP: data.maSP, tongSL: data.tongSL, giaVon1SP: bangCOGS.giaVon1SP },
      });
      return newLC;
    },
    [dsLenhCat]
  );

  const suaLenhCat = useCallback(
    (id: string, patch: Partial<LenhCat>, user: AppUser | null) => {
      setDsLenhCat((prev) =>
        prev.map((lc) => {
          if (lc.id !== id) return lc;
          const merged = { ...lc, ...patch };
          // Re-compute COGS khi sửa các field liên quan
          merged.bangCOGS = tinhCOGS(
            merged.loaiSP,
            merged.tongSL,
            merged.dsVai,
            merged.dsPhuLieu,
            merged.phanCong,
            merged.haoHutPhanTram
          );
          merged.ngaySua = new Date().toISOString().split("T")[0];
          merged.nguoiSua = user?.id || user?.name || "QLSX";
          return merged;
        })
      );
      logWorkflow(user, "update", `Sửa lệnh cắt ${id}`, id, { newValue: patch });
    },
    []
  );

  const xoaLenhCat = useCallback((id: string, user: AppUser | null) => {
    setDsLenhCat((prev) => prev.filter((lc) => lc.id !== id));
    logWorkflow(user, "delete", `Xoá lệnh cắt ${id}`, id);
  }, []);

  const capNhatTrangThai = useCallback(
    (id: string, trangThai: TrangThaiLenhCat, user: AppUser | null) => {
      setDsLenhCat((prev) =>
        prev.map((lc) => (lc.id === id ? { ...lc, trangThai } : lc))
      );
      logWorkflow(user, "update", `Cập nhật trạng thái ${id} → ${trangThai}`, id, {
        newValue: { trangThai },
      });
    },
    []
  );

  const tinhLaiCOGS = useCallback((id: string) => {
    setDsLenhCat((prev) =>
      prev.map((lc) => {
        if (lc.id !== id) return lc;
        return {
          ...lc,
          bangCOGS: tinhCOGS(lc.loaiSP, lc.tongSL, lc.dsVai, lc.dsPhuLieu, lc.phanCong, lc.haoHutPhanTram),
        };
      })
    );
  }, []);

  const reset = useCallback(() => {
    setDsLenhCat(DEFAULT);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  return (
    <Ctx.Provider
      value={{
        dsLenhCat,
        themLenhCat,
        suaLenhCat,
        xoaLenhCat,
        capNhatTrangThai,
        tinhLaiCOGS,
        reset,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useLenhCat() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLenhCat must be used within LenhCatProvider");
  return ctx;
}
