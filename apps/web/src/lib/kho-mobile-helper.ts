// ============ HELPER KHO MOBILE (Đợt 7) ============

import type { PhieuKho, LoaiKho, LoaiPhieu, TrangThaiPhieuKho } from "./data/kho-mobile-store";
import { TRANG_THAI_PHIEU_KHO } from "./data/kho-mobile-store";
import { KHO_VAI, KHO_VAT_TU } from "./data/real-data";

// FIX BUG #4: tồn kho runtime - delta so với data gốc
// Khi phiếu nhập "Hoàn thành" → delta[loaiKho][maVT] += soLuong
// Khi phiếu xuất "Hoàn thành" → delta[loaiKho][maVT] -= soLuong
// Helper này nhận tonKhoDelta từ store và áp dụng vào tồn gốc
export type TonKhoDelta = Record<LoaiKho, Record<string, number>>;

export type KhoKPI = {
  tongPhieu: number;
  tongNhap: number;        // SL nhập
  tongXuat: number;         // SL xuất
  tongGiaTriNhap: number;
  tongGiaTriXuat: number;
  choDuyet: number;
  hoanThanh: number;
  tuChoi: number;
  // Theo loại kho
  theoLoaiKho: Record<LoaiKho, { count: number; giaTri: number }>;
  // Theo loại phiếu
  theoLoaiPhieu: Record<LoaiPhieu, { count: number; giaTri: number }>;
  // Theo trạng thái
  theoTrangThai: Record<TrangThaiPhieuKho, { count: number; giaTri: number }>;
};

const EMPTY_TRANG_THAI = (): Record<TrangThaiPhieuKho, { count: number; giaTri: number }> => {
  const result = {} as Record<TrangThaiPhieuKho, { count: number; giaTri: number }>;
  for (const t of TRANG_THAI_PHIEU_KHO) result[t] = { count: 0, giaTri: 0 };
  return result;
};

const EMPTY_LOAI_KHO = (): Record<LoaiKho, { count: number; giaTri: number }> => ({
  "vai": { count: 0, giaTri: 0 },
  "phu-lieu": { count: 0, giaTri: 0 },
  "thanh-pham": { count: 0, giaTri: 0 },
});

const EMPTY_LOAI_PHIEU = (): Record<LoaiPhieu, { count: number; giaTri: number }> => ({
  "nhap": { count: 0, giaTri: 0 },
  "xuat": { count: 0, giaTri: 0 },
  "kiem-ke": { count: 0, giaTri: 0 },
});

export function getKhoKPI(data: PhieuKho[]): KhoKPI {
  const kpi: KhoKPI = {
    tongPhieu: data.length,
    tongNhap: 0,
    tongXuat: 0,
    tongGiaTriNhap: 0,
    tongGiaTriXuat: 0,
    choDuyet: 0,
    hoanThanh: 0,
    tuChoi: 0,
    theoLoaiKho: EMPTY_LOAI_KHO(),
    theoLoaiPhieu: EMPTY_LOAI_PHIEU(),
    theoTrangThai: EMPTY_TRANG_THAI(),
  };

  for (const p of data) {
    if (p.loai === "nhap") {
      kpi.tongNhap += p.soLuong;
      kpi.tongGiaTriNhap += p.thanhTien;
    }
    if (p.loai === "xuat") {
      kpi.tongXuat += p.soLuong;
      kpi.tongGiaTriXuat += p.thanhTien;
    }
    if (p.trangThai === "Chờ duyệt") kpi.choDuyet++;
    if (p.trangThai === "Hoàn thành") kpi.hoanThanh++;
    if (p.trangThai === "Từ chối") kpi.tuChoi++;

    kpi.theoLoaiKho[p.loaiKho].count++;
    kpi.theoLoaiKho[p.loaiKho].giaTri += p.thanhTien;

    kpi.theoLoaiPhieu[p.loai].count++;
    kpi.theoLoaiPhieu[p.loai].giaTri += p.thanhTien;

    kpi.theoTrangThai[p.trangThai].count++;
    kpi.theoTrangThai[p.trangThai].giaTri += p.thanhTien;
  }

  return kpi;
}

/** Tổng tồn kho hiện tại (FIX BUG #4: gốc + delta từ phiếu đã hoàn thành) */
export function getTonKhoHienTai(loaiKho: LoaiKho, tonKhoDelta?: TonKhoDelta) {
  const base = (() => {
    if (loaiKho === "vai") return KHO_VAI.reduce((sum, v) => sum + (v.tonKho || 0), 0);
    if (loaiKho === "phu-lieu") return KHO_VAT_TU.reduce((sum, v) => sum + (v.tonKho || 0), 0);
    return 0;
  })();
  if (!tonKhoDelta) return base;
  const deltaMap = tonKhoDelta[loaiKho] || {};
  const delta = Object.values(deltaMap).reduce((sum, v) => sum + v, 0);
  return base + delta;
}

/** Lấy tồn thực tế cho từng mặt hàng (FIX BUG #4: gốc + delta) */
export function getTonTheoMatHang(loaiKho: LoaiKho, tonKhoDelta?: TonKhoDelta) {
  const deltaMap = tonKhoDelta?.[loaiKho] || {};
  if (loaiKho === "vai") {
    return KHO_VAI.map((v) => ({
      ma: v.maVT,
      ten: v.tenVT,
      ton: (v.tonKho || 0) + (deltaMap[v.maVT] || 0),
      donVi: v.dvt,
      gia: v.donGia || 0,
    }));
  }
  if (loaiKho === "phu-lieu") {
    return KHO_VAT_TU.map((v) => ({
      ma: v.maVT,
      ten: v.tenVT,
      ton: (v.tonKho || 0) + (deltaMap[v.maVT] || 0),
      donVi: v.dvt,
      gia: v.donGia || 0,
    }));
  }
  return [];
}

/** Filter theo loại kho */
export function filterByLoaiKho(data: PhieuKho[], loaiKho: LoaiKho | "all"): PhieuKho[] {
  if (loaiKho === "all") return data;
  return data.filter((p) => p.loaiKho === loaiKho);
}

/** Filter theo loại phiếu */
export function filterByLoaiPhieu(data: PhieuKho[], loai: LoaiPhieu | "all"): PhieuKho[] {
  if (loai === "all") return data;
  return data.filter((p) => p.loai === loai);
}
