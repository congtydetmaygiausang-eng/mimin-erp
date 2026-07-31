"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { KHO_VAI as KHO_VAI_DEFAULT, KHO_VAT_TU as KHO_VAT_TU_DEFAULT, type KhoVai } from "./real-data";

// ============ TYPES ============
export type LoaiKho = "vai" | "phu-lieu";

export type GiaoDichKho = {
  id: string;
  ngay: string;              // YYYY-MM-DD
  loai: "NHAP" | "XUAT";
  maVT: string;              // Mã vải/VT
  tenVT: string;
  soLuong: number;           // Số lượng giao dịch
  donVi: string;             // kg, m, cái, cuộn...
  donGia: number;            // đơn giá (cho nhập)
  thanhTien: number;         // Tổng tiền
  nguonNhap?: string;        // NCC cho nhập, lệnh cắt cho xuất
  nguoiThucHien: string;     // Người thực hiện
  ghiChu?: string;
};

export type TrangThaiKho = {
  maVT: string;
  tonKho: number;            // Tồn hiện tại
  tonToiThieu: number;       // Tồn tối thiểu
  canhBao: boolean;          // Tồn < tối thiểu
  giaTriTon: number;         // Giá trị tồn kho
  lanNhapGanNhat?: string;
  lanXuatGanNhat?: string;
  tongNhap: number;
  tongXuat: number;
};

type StoreContext = {
  giaoDich: GiaoDichKho[];
  themGiaoDich: (gd: Omit<GiaoDichKho, "id">) => void;
  xoaGiaoDich: (id: string) => void;
  tinhTonKho: (maVT: string, loaiKho: LoaiKho) => number;
  trangThaiKho: (maVT: string, loaiKho: LoaiKho) => TrangThaiKho;
  danhSachTrangThai: (loaiKho: LoaiKho) => TrangThaiKho[];
  giaoDichTheoVT: (maVT: string) => GiaoDichKho[];
  reset: () => void;
};

const Ctx = createContext<StoreContext | null>(null);

const STORAGE_KEY = "mimin_kho_vai_v2";

// Data mẫu: giao dịch nhập kho ban đầu
const GIAO_DICH_DEFAULT: GiaoDichKho[] = [
  // Nhập vải
  { id: "GD-001", ngay: "2026-07-15", loai: "NHAP", maVT: "V-XAMCHI035", tenVT: "XÁM CHÌ 035", soLuong: 200, donVi: "kg", donGia: 70000, thanhTien: 14000000, nguonNhap: "NCC Dệt Phong Phú", nguoiThucHien: "Nguyễn Văn An", ghiChu: "Nhập lô đầu tháng 7" },
  { id: "GD-002", ngay: "2026-07-18", loai: "NHAP", maVT: "V-XANHDENCM", tenVT: "XANH ĐEN CM", soLuong: 150, donVi: "kg", donGia: 91000, thanhTien: 13650000, nguonNhap: "NCC Dệt Việt Hưng", nguoiThucHien: "Nguyễn Văn An" },
  { id: "GD-003", ngay: "2026-07-20", loai: "NHAP", maVT: "V-MAU11", tenVT: "MÀU 11", soLuong: 100, donVi: "kg", donGia: 71000, thanhTien: 7100000, nguonNhap: "NCC Dệt Phong Phú", nguoiThucHien: "Trần Thị Bình" },
  { id: "GD-004", ngay: "2026-07-22", loai: "NHAP", maVT: "V-BO068", tenVT: "BÒ (068) 26", soLuong: 180, donVi: "kg", donGia: 71000, thanhTien: 12780000, nguonNhap: "NCC Dệt Sài Gòn", nguoiThucHien: "Nguyễn Văn An" },
  { id: "GD-005", ngay: "2026-07-25", loai: "NHAP", maVT: "V-TRANG003", tenVT: "TRẮNG 003", soLuong: 250, donVi: "kg", donGia: 64000, thanhTien: 16000000, nguonNhap: "NCC Dệt Việt Hưng", nguoiThucHien: "Trần Thị Bình" },
  // Nhập phụ liệu
  { id: "GD-006", ngay: "2026-07-15", loai: "NHAP", maVT: "VT-CUC-001", tenVT: "Cúc áo trắng 4 lỗ", soLuong: 5000, donVi: "cái", donGia: 200, thanhTien: 1000000, nguonNhap: "NCC Phụ liệu Minh Tâm", nguoiThucHien: "Trần Thị Bình" },
  { id: "GD-007", ngay: "2026-07-16", loai: "NHAP", maVT: "VT-CHI-001", tenVT: "Chỉ may Polyester", soLuong: 50000, donVi: "m", donGia: 150, thanhTien: 7500000, nguonNhap: "NCC Phụ liệu Minh Tâm", nguoiThucHien: "Nguyễn Văn An" },
  { id: "GD-008", ngay: "2026-07-18", loai: "NHAP", maVT: "VT-BOCO-001", tenVT: "Bo cổ 2 da (poly)", soLuong: 1500, donVi: "cái", donGia: 6500, thanhTien: 9750000, nguonNhap: "NCC Bo cổ Hà Nội", nguoiThucHien: "Trần Thị Bình" },
  { id: "GD-009", ngay: "2026-07-20", loai: "NHAP", maVT: "VT-NHAN-001", tenVT: "Nhãn mác size M-L-XL", soLuong: 8000, donVi: "cái", donGia: 800, thanhTien: 6400000, nguonNhap: "NCC Nhãn mác Việt", nguoiThucHien: "Lê Thị Hoa" },
  { id: "GD-010", ngay: "2026-07-22", loai: "NHAP", maVT: "VT-TUI-001", tenVT: "Túi PE đóng gói", soLuong: 6000, donVi: "cái", donGia: 350, thanhTien: 2100000, nguonNhap: "NCC Phụ liệu Minh Tâm", nguoiThucHien: "Trần Thị Bình" },
  // Xuất vải cho lệnh cắt
  { id: "GD-011", ngay: "2026-07-22", loai: "XUAT", maVT: "V-XAMCHI035", tenVT: "XÁM CHÌ 035", soLuong: 75, donVi: "kg", donGia: 70000, thanhTien: 5250000, nguonNhap: "LC-M758 Bộ trụ 500 bộ", nguoiThucHien: "Nguyễn Thị Mỹ Nhi", ghiChu: "Xuất cho lệnh cắt M758" },
  { id: "GD-012", ngay: "2026-07-22", loai: "XUAT", maVT: "V-XANHDENCM", tenVT: "XANH ĐEN CM", soLuong: 75, donVi: "kg", donGia: 91000, thanhTien: 6825000, nguonNhap: "LC-M758 Bộ trụ 500 bộ", nguoiThucHien: "Nguyễn Thị Mỹ Nhi" },
  { id: "GD-013", ngay: "2026-07-22", loai: "XUAT", maVT: "V-MAU11", tenVT: "MÀU 11", soLuong: 75, donVi: "kg", donGia: 71000, thanhTien: 5325000, nguonNhap: "LC-M758 Bộ trụ 500 bộ", nguoiThucHien: "Nguyễn Thị Mỹ Nhi" },
  { id: "GD-014", ngay: "2026-07-22", loai: "XUAT", maVT: "V-BO068", tenVT: "BÒ (068) 26", soLuong: 75, donVi: "kg", donGia: 71000, thanhTien: 5325000, nguonNhap: "LC-M758 Bộ trụ 500 bộ", nguoiThucHien: "Nguyễn Thị Mỹ Nhi" },
  // Xuất phụ liệu
  { id: "GD-015", ngay: "2026-07-25", loai: "XUAT", maVT: "VT-CUC-001", tenVT: "Cúc áo trắng 4 lỗ", soLuong: 4000, donVi: "cái", donGia: 200, thanhTien: 800000, nguonNhap: "LC-M758 Bộ trụ 500 bộ", nguoiThucHien: "Nguyễn Thị Mỹ Nhi", ghiChu: "8 cúc/áo × 500 áo" },
  { id: "GD-016", ngay: "2026-07-25", loai: "XUAT", maVT: "VT-BOCO-001", tenVT: "Bo cổ 2 da (poly)", soLuong: 500, donVi: "cái", donGia: 6500, thanhTien: 3250000, nguonNhap: "LC-M758 Bộ trụ 500 bộ", nguoiThucHien: "Nguyễn Thị Mỹ Nhi" },
  { id: "GD-017", ngay: "2026-07-25", loai: "XUAT", maVT: "VT-CHI-001", tenVT: "Chỉ may Polyester", soLuong: 25000, donVi: "m", donGia: 150, thanhTien: 3750000, nguonNhap: "LC-M758 Bộ trụ 500 bộ", nguoiThucHien: "Nguyễn Thị Mỹ Nhi", ghiChu: "50m/bộ × 500 bộ" },
];

export function KhoProvider({ children }: { children: ReactNode }) {
  const [giaoDich, setGiaoDich] = useState<GiaoDichKho[]>(GIAO_DICH_DEFAULT);
  const [hydrated, setHydrated] = useState(false);

  // Load từ localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as GiaoDichKho[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setGiaoDich(parsed);
        }
      }
    } catch {}
    setHydrated(true);
  }, []);

  // Save
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(giaoDich));
    } catch {}
  }, [giaoDich, hydrated]);

  const themGiaoDich = useCallback((gd: Omit<GiaoDichKho, "id">) => {
    setGiaoDich((prev) => {
      const nextNum = prev.length + 1;
      return [...prev, { ...gd, id: `GD-${String(nextNum).padStart(3, "0")}` }];
    });
  }, []);

  const xoaGiaoDich = useCallback((id: string) => {
    setGiaoDich((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const tinhTonKho = useCallback(
    (maVT: string, loaiKho: LoaiKho): number => {
      const dsVT = loaiKho === "vai" ? KHO_VAI_DEFAULT : KHO_VAT_TU_DEFAULT;
      const baseTon = dsVT.find((v) => v.maVT === maVT)?.tonKho || 0;
      const gdNhap = giaoDich.filter((g) => g.maVT === maVT && g.loai === "NHAP").reduce((s, g) => s + g.soLuong, 0);
      const gdXuat = giaoDich.filter((g) => g.maVT === maVT && g.loai === "XUAT").reduce((s, g) => s + g.soLuong, 0);
      return baseTon + gdNhap - gdXuat;
    },
    [giaoDich]
  );

  const trangThaiKho = useCallback(
    (maVT: string, loaiKho: LoaiKho): TrangThaiKho => {
      const dsVT = loaiKho === "vai" ? KHO_VAI_DEFAULT : KHO_VAT_TU_DEFAULT;
      const vt = dsVT.find((v) => v.maVT === maVT);
      if (!vt) return { maVT, tonKho: 0, tonToiThieu: 0, canhBao: false, giaTriTon: 0, tongNhap: 0, tongXuat: 0 };
      const tonKho = tinhTonKho(maVT, loaiKho);
      const gd = giaoDich.filter((g) => g.maVT === maVT);
      const tongNhap = gd.filter((g) => g.loai === "NHAP").reduce((s, g) => s + g.soLuong, 0);
      const tongXuat = gd.filter((g) => g.loai === "XUAT").reduce((s, g) => s + g.soLuong, 0);
      const lanNhapGanNhat = gd.filter((g) => g.loai === "NHAP").sort((a, b) => b.ngay.localeCompare(a.ngay))[0]?.ngay;
      const lanXuatGanNhat = gd.filter((g) => g.loai === "XUAT").sort((a, b) => b.ngay.localeCompare(a.ngay))[0]?.ngay;
      return {
        maVT,
        tonKho,
        tonToiThieu: vt.tonToiThieu || 0,
        canhBao: tonKho < (vt.tonToiThieu || 0),
        giaTriTon: tonKho * vt.donGia,
        lanNhapGanNhat,
        lanXuatGanNhat,
        tongNhap,
        tongXuat,
      };
    },
    [giaoDich, tinhTonKho]
  );

  const danhSachTrangThai = useCallback(
    (loaiKho: LoaiKho): TrangThaiKho[] => {
      const dsVT = loaiKho === "vai" ? KHO_VAI_DEFAULT : KHO_VAT_TU_DEFAULT;
      return dsVT.map((v) => trangThaiKho(v.maVT, loaiKho));
    },
    [trangThaiKho]
  );

  const giaoDichTheoVT = useCallback(
    (maVT: string): GiaoDichKho[] => {
      return giaoDich.filter((g) => g.maVT === maVT).sort((a, b) => b.ngay.localeCompare(a.ngay));
    },
    [giaoDich]
  );

  const reset = useCallback(() => {
    setGiaoDich(GIAO_DICH_DEFAULT);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  return (
    <Ctx.Provider
      value={{ giaoDich, themGiaoDich, xoaGiaoDich, tinhTonKho, trangThaiKho, danhSachTrangThai, giaoDichTheoVT, reset }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useKho() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useKho must be used within KhoProvider");
  return ctx;
}
