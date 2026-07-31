// ============ HELPER QC (Đợt 8) ============

import type { BanGhiQC, TrangThaiQC } from "./data/qc-store";
import { TRANG_THAI_QC } from "./data/qc-store";

export type QCKPI = {
  tongPhieu: number;
  tongDat: number;
  tongLoi: number;
  tyLeDat: number;
  theoTrangThai: Record<TrangThaiQC, { count: number; soLuong: number }>;
  theoCongDoan: Record<string, { count: number; soLuong: number }>;
};

const EMPTY_TRANG_THAI = (): Record<TrangThaiQC, { count: number; soLuong: number }> => {
  const result = {} as Record<TrangThaiQC, { count: number; soLuong: number }>;
  for (const t of TRANG_THAI_QC) result[t] = { count: 0, soLuong: 0 };
  return result;
};

export function getQCKPI(data: BanGhiQC[]): QCKPI {
  const kpi: QCKPI = {
    tongPhieu: data.length,
    tongDat: 0,
    tongLoi: 0,
    tyLeDat: 0,
    theoTrangThai: EMPTY_TRANG_THAI(),
    theoCongDoan: {},
  };

  for (const b of data) {
    kpi.tongDat += b.soLuongDat;
    kpi.tongLoi += b.soLuongLoi;
    kpi.theoTrangThai[b.trangThai].count++;
    kpi.theoTrangThai[b.trangThai].soLuong += b.soLuongDat;
    if (!kpi.theoCongDoan[b.congDoan]) {
      kpi.theoCongDoan[b.congDoan] = { count: 0, soLuong: 0 };
    }
    kpi.theoCongDoan[b.congDoan].count++;
    kpi.theoCongDoan[b.congDoan].soLuong += b.soLuongDat;
  }
  kpi.tyLeDat = kpi.tongDat + kpi.tongLoi > 0
    ? Math.round((kpi.tongDat / (kpi.tongDat + kpi.tongLoi)) * 100)
    : 100;

  return kpi;
}
