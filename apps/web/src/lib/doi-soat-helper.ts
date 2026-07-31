// ============ HELPER TỔNG HỢP TIỀN CÔNG (Đợt 5) ============
// Tính toán dashboard từ data đối soát

import type { BanGhiDoiSoat, TrangThaiDoiSoat } from "./data/doi-soat-store";
import { TRANG_THAI_DOI_SOAT } from "./data/doi-soat-store";

export type DoiSoatKPI = {
  tongBanGhi: number;
  tongThanhTien: number;
  tongThucNhan: number;
  tongDaThanhToan: number;
  tongConNo: number;
  tongKhiieuNai: number;
  tongLocked: number;
  // Theo 7 trạng thái
  theoTrangThai: Record<TrangThaiDoiSoat, { count: number; tien: number; soLuong: number }>;
  // Theo công đoạn
  theoCongDoan: Record<string, { count: number; tien: number; soLuong: number }>;
};

const EMPTY_TRANG_THAI = (): Record<TrangThaiDoiSoat, { count: number; tien: number; soLuong: number }> => {
  const result = {} as Record<TrangThaiDoiSoat, { count: number; tien: number; soLuong: number }>;
  for (const t of TRANG_THAI_DOI_SOAT) {
    result[t] = { count: 0, tien: 0, soLuong: 0 };
  }
  return result;
};

export function getDoiSoatKPI(data: BanGhiDoiSoat[]): DoiSoatKPI {
  const kpi: DoiSoatKPI = {
    tongBanGhi: data.length,
    tongThanhTien: 0,
    tongThucNhan: 0,
    tongDaThanhToan: 0,
    tongConNo: 0,
    tongKhiieuNai: 0,
    tongLocked: 0,
    theoTrangThai: EMPTY_TRANG_THAI(),
    theoCongDoan: {},
  };

  for (const d of data) {
    kpi.tongThanhTien += d.thanhTien;
    kpi.tongThucNhan += d.thucNhan;
    kpi.tongDaThanhToan += d.daThanhToan;
    kpi.tongConNo += d.conNo;
    if (d.khiieuNai && d.khiieuNai.trangThai !== "da-giai-quyet") kpi.tongKhiieuNai++;
    if (d.locked) kpi.tongLocked++;

    kpi.theoTrangThai[d.trangThai].count++;
    kpi.theoTrangThai[d.trangThai].tien += d.thucNhan;
    kpi.theoTrangThai[d.trangThai].soLuong += d.soLuongDat;

    if (!kpi.theoCongDoan[d.congDoan]) {
      kpi.theoCongDoan[d.congDoan] = { count: 0, tien: 0, soLuong: 0 };
    }
    kpi.theoCongDoan[d.congDoan].count++;
    kpi.theoCongDoan[d.congDoan].tien += d.thucNhan;
    kpi.theoCongDoan[d.congDoan].soLuong += d.soLuongDat;
  }

  return kpi;
}

/** Top N người có tiền công cao nhất */
export function topNguoiTienCong(data: BanGhiDoiSoat[], n: number = 10) {
  const map: Record<string, { ma: string; ten: string; tongTien: number; tongSL: number; soBanGhi: number }> = {};
  for (const d of data) {
    const key = d.nguoiThucHienMa || d.nguoiThucHien;
    if (!map[key]) {
      map[key] = { ma: key, ten: d.nguoiThucHien, tongTien: 0, tongSL: 0, soBanGhi: 0 };
    }
    map[key].tongTien += d.thucNhan;
    map[key].tongSL += d.soLuongDat;
    map[key].soBanGhi++;
  }
  return Object.values(map).sort((a, b) => b.tongTien - a.tongTien).slice(0, n);
}
