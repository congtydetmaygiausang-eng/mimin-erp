// ============ HELPER HOÀN THIỆN (Đợt 6) ============

import type { BanGhiHoanThien, TrangThaiHoanThien } from "./data/hoan-thien-store";
import { TRANG_THAI_HOAN_THIEN } from "./data/hoan-thien-store";

export type HoanThienKPI = {
  tongPhieu: number;
  tongDonGia: number;
  tongThanhTien: number;
  tongSLDat: number;
  tongSLLoi: number;
  quaHan: number;
  theoTrangThai: Record<TrangThaiHoanThien, { count: number; tien: number; soLuong: number }>;
  theoCongDoan: Record<string, { count: number; tien: number; soLuong: number }>;
};

const EMPTY_TRANG_THAI = (): Record<TrangThaiHoanThien, { count: number; tien: number; soLuong: number }> => {
  const result = {} as Record<TrangThaiHoanThien, { count: number; tien: number; soLuong: number }>;
  for (const t of TRANG_THAI_HOAN_THIEN) {
    result[t] = { count: 0, tien: 0, soLuong: 0 };
  }
  return result;
};

export function getHoanThienKPI(data: BanGhiHoanThien[]): HoanThienKPI {
  const kpi: HoanThienKPI = {
    tongPhieu: data.length,
    tongDonGia: 0,
    tongThanhTien: 0,
    tongSLDat: 0,
    tongSLLoi: 0,
    quaHan: 0,
    theoTrangThai: EMPTY_TRANG_THAI(),
    theoCongDoan: {},
  };

  const today = new Date().toISOString().split("T")[0];

  for (const b of data) {
    kpi.tongThanhTien += b.thanhTien;
    kpi.tongSLDat += b.soLuongDat;
    kpi.tongSLLoi += b.soLuongLoi;
    if (b.hanHoanThanh && b.hanHoanThanh < today && b.trangThai !== "Hoàn thành" && b.trangThai !== "Bàn giao kho TP") {
      kpi.quaHan++;
    }

    kpi.theoTrangThai[b.trangThai].count++;
    kpi.theoTrangThai[b.trangThai].tien += b.thanhTien;
    kpi.theoTrangThai[b.trangThai].soLuong += b.soLuongDat;

    if (!kpi.theoCongDoan[b.congDoan]) {
      kpi.theoCongDoan[b.congDoan] = { count: 0, tien: 0, soLuong: 0 };
    }
    kpi.theoCongDoan[b.congDoan].count++;
    kpi.theoCongDoan[b.congDoan].tien += b.thanhTien;
    kpi.theoCongDoan[b.congDoan].soLuong += b.soLuongDat;
  }

  return kpi;
}

/** Filter theo NV thực hiện (cho mobile - mỗi NV chỉ thấy việc của mình) */
export function filterByNguoiThucHien(data: BanGhiHoanThien[], maNV: string | undefined): BanGhiHoanThien[] {
  if (!maNV) return data;
  return data.filter((b) => b.nguoiThucHienMa === maNV);
}

/** Lấy việc cần làm (chưa hoàn thành) */
export function getViecCanLam(data: BanGhiHoanThien[]): BanGhiHoanThien[] {
  return data.filter((b) => b.trangThai !== "Hoàn thành" && b.trangThai !== "Bàn giao kho TP");
}

/** Top NV có sản lượng cao nhất */
export function topNVHoanThien(data: BanGhiHoanThien[], n: number = 10) {
  const map: Record<string, { ma: string; ten: string; tongDat: number; tongLoi: number; tongTien: number; soPhieu: number }> = {};
  for (const b of data) {
    const key = b.nguoiThucHienMa || b.nguoiThucHien;
    if (!map[key]) {
      map[key] = { ma: key, ten: b.nguoiThucHien, tongDat: 0, tongLoi: 0, tongTien: 0, soPhieu: 0 };
    }
    map[key].tongDat += b.soLuongDat;
    map[key].tongLoi += b.soLuongLoi;
    map[key].tongTien += b.thanhTien;
    map[key].soPhieu++;
  }
  return Object.values(map).sort((a, b) => b.tongTien - a.tongTien).slice(0, n);
}
