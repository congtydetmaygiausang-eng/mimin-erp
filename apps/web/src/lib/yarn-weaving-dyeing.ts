// Module Sợi - Dệt - Nhuộm - Kho vải
// Quy trình sản xuất vải từ sợi

import { KHO_VAI, type KhoVai, KHO_VAT_TU } from "./data/real-data";
import { logAudit } from "./audit-log";
import { nhapKho, getAllInventory, type TruTonKhoResult } from "./inventory-engine";

// ============ ĐỊNH MỨC CHUYỂN ĐỔI ============
export const DINH_MUC_CHUYEN_DOI = {
  // 1kg sợi thô → mét vải dệt thô (chưa nhuộm)
  SOI_TO_VAI_THO: 4.0, // 1kg = 4m vải thô

  // Hao hụt khi dệt (sợi → vải thô)
  HAO_HUT_DET: 10, // 10% hao hụt

  // Hao hụt khi nhuộm (vải thô → vải thành phẩm)
  HAO_HUT_NHUOM: 5, // 5% hao hụt (cotton), có thể lên đến 8% (poly)

  // Hao hụt khi hoàn tất (vải nhuộm → vải thành phẩm cuối)
  HAO_HUT_HOAN_TAT: 2, // 2% hao hụt
};

// ============ LOẠI SỢI ============
export const LOAI_SOI = [
  { ma: "SOI-COTTON-30", ten: "Sợi cotton 30s", dvt: "kg", donGia: 145000, mau: "Trắng", chatLuong: "Compact" },
  { ma: "SOI-COTTON-32", ten: "Sợi cotton 32s", dvt: "kg", donGia: 135000, mau: "Trắng", chatLuong: "Compact" },
  { ma: "SOI-POLY-DTY", ten: "Sợi Polyester DTY", dvt: "kg", donGia: 95000, mau: "Trắng", chatLuong: "Dệt kim" },
  { ma: "SOI-POLY-FDY", ten: "Sợi Polyester FDY", dvt: "kg", donGia: 105000, mau: "Trắng", chatLuong: "Dệt thoi" },
  { ma: "SOI-CVC-655", ten: "Sợi CVC 65/35", dvt: "kg", donGia: 155000, mau: "Trắng", chatLuong: "Cao cấp" },
  { ma: "SOI-KAKI", ten: "Sợi Kaki cotton", dvt: "kg", donGia: 125000, mau: "Trắng", chatLuong: "Dệt thoi" },
];

// ============ LOẠI VẢI ĐẦU RA (sau nhuộm) ============
export const LOAI_VAI_DAU_RA = [
  "Vải thun cotton 4 chiều",
  "Vải thun cotton 2 chiều",
  "Vải polo 2 da",
  "Vải thun lạnh (poly)",
  "Vải sơ mi poplin",
  "Vải kaki cotton",
];

// ============ BẢNG SỢI (YARN) ============
export interface PhieuSoi {
  id: string;            // SOI_001
  ngayNhap: string;      // 2026-07-20
  loaiSoi: string;       // SOI-COTTON-30
  tenSoi: string;        // Sợi cotton 30s
  nhaCungCap: string;    // NCC ID
  tenNCC: string;
  soKg: number;          // 1000kg
  donGia: number;        // 145,000đ/kg
  thanhTien: number;     // 145 triệu
  soMetDuKien: number;   // 1000 * 4 = 4000m vải thô
  trangThai: "Chờ dệt" | "Đang dệt" | "Đã dệt" | "Đã nhuộm" | "Đã nhập kho" | "Hủy";
  ghiChu: string;
  nguoiNhap: string;     // NV005
}

// ============ BẢNG DỆT (WEAVING) ============
export interface PhieuDet {
  id: string;            // DET_001
  ngayBatDau: string;
  ngayHoanThanh?: string;
  phieuSoiId: string;    // SOI_001
  loaiSoi: string;
  soKgSoi: number;       // 1000kg
  soKgSauHaoHut: number; // 900kg (10% hao hụt)
  soMetVaiTho: number;   // 1000 * 4 * 0.9 = 3600m
  soMetDuKien: number;   // 3600m
  soMetDat: number;       // 3580m (sau khi dệt)
  soMetLoi: number;       // 20m
  nguoiDet: string;       // NV007 hoặc outsource
  tenNguoiDet: string;
  donGia: number;         // 25,000đ/kg sợi (phí dệt)
  thanhTien: number;      // 25 triệu
  trangThai: "Chờ dệt" | "Đang dệt" | "Hoàn thành" | "Hủy";
  ghiChu: string;
}

// ============ BẢNG NHUỘM (DYEING) ============
export interface PhieuNhuom {
  id: string;            // NHUOM_001
  ngayBatDau: string;
  ngayHoanThanh?: string;
  phieuDetId: string;    // DET_001
  loaiVai: string;       // Vải thun cotton
  mauNhuom: string;      // Trắng / Đen / Xanh navy...
  soMetVaiTho: number;   // 3580m
  soMetSauHaoHut: number; // 3401m (5% hao hụt)
  soMetDat: number;       // 3385m
  soMetLoi: number;       // 16m
  nguoiNhuom: string;    // Outsoure
  tenNguoiNhuom: string;
  donGia: number;        // 8,000đ/m
  thanhTien: number;     // 28.6 triệu
  trangThai: "Chờ nhuộm" | "Đang nhuộm" | "Hoàn thành" | "Hủy";
  maVaiThanhPham: string; // V-DENNANO (mapping màu → mã vải)
  tenVaiThanhPham: string;
  ghiChu: string;
}

// ============ MẪU DATA (6 phiếu mỗi khâu) ============
export const MAU_PHIEU_SOI: PhieuSoi[] = [
  {
    id: "SOI_001", ngayNhap: "2026-07-20", loaiSoi: "SOI-COTTON-30", tenSoi: "Sợi cotton 30s",
    nhaCungCap: "NCC-01", tenNCC: "Cty Sợi Việt Nam",
    soKg: 1000, donGia: 145000, thanhTien: 145000000, soMetDuKien: 4000,
    trangThai: "Đã nhập kho", ghiChu: "Nhập cho LSX-2026-001 (M758) và LSX-2026-002 (M873)", nguoiNhap: "NV005",
  },
  {
    id: "SOI_002", ngayNhap: "2026-07-22", loaiSoi: "SOI-COTTON-32", tenSoi: "Sợi cotton 32s",
    nhaCungCap: "NCC-01", tenNCC: "Cty Sợi Việt Nam",
    soKg: 800, donGia: 135000, thanhTien: 108000000, soMetDuKien: 3200,
    trangThai: "Đang dệt", ghiChu: "Cho LSX-2026-003 (M111 Áo polo)", nguoiNhap: "NV005",
  },
  {
    id: "SOI_003", ngayNhap: "2026-07-24", loaiSoi: "SOI-POLY-DTY", tenSoi: "Sợi Polyester DTY",
    nhaCungCap: "NCC-02", tenNCC: "Cty Sợi Hưng Yên",
    soKg: 1500, donGia: 95000, thanhTien: 142500000, soMetDuKien: 6000,
    trangThai: "Đã nhập kho", ghiChu: "Cho LSX-2026-004 (M222 Bộ thể thao)", nguoiNhap: "NV005",
  },
  {
    id: "SOI_004", ngayNhap: "2026-07-25", loaiSoi: "SOI-CVC-655", tenSoi: "Sợi CVC 65/35",
    nhaCungCap: "NCC-01", tenNCC: "Cty Sợi Việt Nam",
    soKg: 600, donGia: 155000, thanhTien: 93000000, soMetDuKien: 2400,
    trangThai: "Chờ dệt", ghiChu: "Cho LSX-2026-005 (M333 Áo sơ mi nữ)", nguoiNhap: "NV005",
  },
  {
    id: "SOI_005", ngayNhap: "2026-07-26", loaiSoi: "SOI-KAKI", tenSoi: "Sợi Kaki cotton",
    nhaCungCap: "NCC-03", tenNCC: "Cty Sợi Phong Phú",
    soKg: 700, donGia: 125000, thanhTien: 87500000, soMetDuKien: 2800,
    trangThai: "Chờ dệt", ghiChu: "Cho LSX-2026-006 (M555 Quần kaki)", nguoiNhap: "NV005",
  },
  {
    id: "SOI_006", ngayNhap: "2026-07-26", loaiSoi: "SOI-COTTON-30", tenSoi: "Sợi cotton 30s",
    nhaCungCap: "NCC-01", tenNCC: "Cty Sợi Việt Nam",
    soKg: 2000, donGia: 145000, thanhTien: 290000000, soMetDuKien: 8000,
    trangThai: "Đã nhập kho", ghiChu: "Dự trữ cho Q3/2026", nguoiNhap: "NV005",
  },
];

export const MAU_PHIEU_DET: PhieuDet[] = [
  {
    id: "DET_001", ngayBatDau: "2026-07-21", ngayHoanThanh: "2026-07-24",
    phieuSoiId: "SOI_001", loaiSoi: "SOI-COTTON-30", soKgSoi: 1000,
    soKgSauHaoHut: 900, soMetVaiTho: 3600, soMetDuKien: 3600, soMetDat: 3580, soMetLoi: 20,
    nguoiDet: "DT-DET-01", tenNguoiDet: "DNT Dệt Bắc Ninh",
    donGia: 25000, thanhTien: 25000000,
    trangThai: "Hoàn thành",
    ghiChu: "Dệt vải thun cotton 4 chiều, 10% hao hụt, dệt máy",
  },
  {
    id: "DET_002", ngayBatDau: "2026-07-23",
    phieuSoiId: "SOI_002", loaiSoi: "SOI-COTTON-32", soKgSoi: 800,
    soKgSauHaoHut: 720, soMetVaiTho: 2880, soMetDuKien: 2880, soMetDat: 0, soMetLoi: 0,
    nguoiDet: "DT-DET-01", tenNguoiDet: "DNT Dệt Bắc Ninh",
    donGia: 25000, thanhTien: 20000000,
    trangThai: "Đang dệt",
    ghiChu: "Dệt vải polo 2 da (dày hơn)",
  },
  {
    id: "DET_003", ngayBatDau: "2026-07-25", ngayHoanThanh: "2026-07-28",
    phieuSoiId: "SOI_003", loaiSoi: "SOI-POLY-DTY", soKgSoi: 1500,
    soKgSauHaoHut: 1350, soMetVaiTho: 5400, soMetDuKien: 5400, soMetDat: 5380, soMetLoi: 20,
    nguoiDet: "DT-DET-02", tenNguoiDet: "Dệt An Phước",
    donGia: 22000, thanhTien: 33000000,
    trangThai: "Hoàn thành",
    ghiChu: "Dệt thun lạnh (poly) cho bộ thể thao",
  },
];

export const MAU_PHIEU_NHUOM: PhieuNhuom[] = [
  {
    id: "NHUOM_001", ngayBatDau: "2026-07-25", ngayHoanThanh: "2026-07-28",
    phieuDetId: "DET_001", loaiVai: "Vải thun cotton 4 chiều", mauNhuom: "Trắng ngà",
    soMetVaiTho: 3580, soMetSauHaoHut: 3401, soMetDat: 3385, soMetLoi: 16,
    nguoiNhuom: "DT-NH-01", tenNguoiNhuom: "Cty Nhuộm Hà Đông",
    donGia: 8000, thanhTien: 28648000,
    trangThai: "Hoàn thành",
    maVaiThanhPham: "V-TRANG003", tenVaiThanhPham: "TRẮNG 003(1)",
    ghiChu: "Nhuộm trắng ngà 5% hao hụt, đã nhập kho 3,385m",
  },
  {
    id: "NHUOM_002", ngayBatDau: "2026-07-26", ngayHoanThanh: "2026-07-29",
    phieuDetId: "DET_001", loaiVai: "Vải thun cotton 4 chiều", mauNhuom: "Đen",
    soMetVaiTho: 0, soMetSauHaoHut: 0, soMetDat: 0, soMetLoi: 0,
    nguoiNhuom: "DT-NH-01", tenNguoiNhuom: "Cty Nhuộm Hà Đông",
    donGia: 9000, thanhTien: 0,
    trangThai: "Chờ nhuộm",
    maVaiThanhPham: "V-DENNANO", tenVaiThanhPham: "Poly Nano Đen",
    ghiChu: "Đợi vải thô từ DET_001",
  },
  {
    id: "NHUOM_003", ngayBatDau: "2026-07-29",
    phieuDetId: "DET_003", loaiVai: "Vải thun lạnh (poly)", mauNhuom: "Xanh navy",
    soMetVaiTho: 5380, soMetSauHaoHut: 5057, soMetDat: 0, soMetLoi: 0,
    nguoiNhuom: "DT-NH-02", tenNguoiNhuom: "Cty Nhuộm Phong Phú",
    donGia: 12000, thanhTien: 0,
    trangThai: "Đang nhuộm",
    maVaiThanhPham: "V-XANHDENCM", tenVaiThanhPham: "XANH ĐEN CM",
    ghiChu: "Nhuộm xanh navy cho bộ thể thao M222, hao hụt 6%",
  },
];

// ============ TÍNH TOÁN ============

// 1. Tính m vải thô từ số kg sợi
export function tinhMetVaiTuSoi(soKg: number): number {
  return soKg * DINH_MUC_CHUYEN_DOI.SOI_TO_VAI_THO;
}

// 2. Sau khi dệt (hao hụt 10%)
export function tinhMetSauDet(soMetVaiTho: number): number {
  return soMetVaiTho * (1 - DINH_MUC_CHUYEN_DOI.HAO_HUT_DET / 100);
}

// 3. Sau khi nhuộm (hao hụt 5%)
export function tinhMetSauNhuom(soMetVaiTho: number): number {
  return soMetVaiTho * (1 - DINH_MUC_CHUYEN_DOI.HAO_HUT_NHUOM / 100);
}

// 4. Sau khi hoàn tất (hao hụt 2%)
export function tinhMetSauHoanTat(soMetVaiTho: number): number {
  return soMetVaiTho * (1 - DINH_MUC_CHUYEN_DOI.HAO_HUT_HOAN_TAT / 100);
}

// ============ WORKFLOW: Tạo phiếu Dệt từ phiếu Sợi ============
export function taoPhieuDetTuSoi(phieuSoi: PhieuSoi, user: any, nguoiDet: string, tenNguoiDet: string, donGia: number): PhieuDet {
  const soMetVaiTho = tinhMetVaiTuSoi(phieuSoi.soKg);
  const soMetDuKien = tinhMetSauDet(soMetVaiTho);

  return {
    id: `DET_${Date.now().toString().slice(-6)}`,
    ngayBatDau: new Date().toISOString().slice(0, 10),
    phieuSoiId: phieuSoi.id,
    loaiSoi: phieuSoi.loaiSoi,
    soKgSoi: phieuSoi.soKg,
    soKgSauHaoHut: phieuSoi.soKg * (1 - DINH_MUC_CHUYEN_DOI.HAO_HUT_DET / 100),
    soMetVaiTho,
    soMetDuKien,
    soMetDat: 0,
    soMetLoi: 0,
    nguoiDet, tenNguoiDet, donGia,
    thanhTien: phieuSoi.soKg * donGia,
    trangThai: "Đang dệt",
    ghiChu: `Tự động tạo từ ${phieuSoi.id}`,
  };
}

// ============ WORKFLOW: Tạo phiếu Nhuộm từ phiếu Dệt ============
export function taoPhieuNhuomTuDet(phieuDet: PhieuDet, user: any, nguoiNhuom: string, tenNguoiNhuom: string, donGia: number, mauNhuom: string, maVai: string, tenVai: string): PhieuNhuom {
  const soMetSauNhuom = tinhMetSauNhuom(phieuDet.soMetDat);

  return {
    id: `NHUOM_${Date.now().toString().slice(-6)}`,
    ngayBatDau: new Date().toISOString().slice(0, 10),
    phieuDetId: phieuDet.id,
    loaiVai: "Vải thun",
    mauNhuom,
    soMetVaiTho: phieuDet.soMetDat,
    soMetSauHaoHut: soMetSauNhuom,
    soMetDat: 0,
    soMetLoi: 0,
    nguoiNhuom, tenNguoiNhuom, donGia,
    thanhTien: soMetSauNhuom * donGia,
    trangThai: "Đang nhuộm",
    maVaiThanhPham: maVai,
    tenVaiThanhPham: tenVai,
    ghiChu: `Tự động tạo từ ${phieuDet.id}`,
  };
}

// ============ WORKFLOW: Hoàn thành Nhuộm → Nhập kho vải ============
export function nhapKhoVaiTuNhuom(phieuNhuom: PhieuNhuom, user: any): TruTonKhoResult {
  // 1 mét vải thành phẩm ~ 0.25kg (tùy loại vải)
  const kgPerMet = 0.25;
  const kgCan = phieuNhuom.soMetDat * kgPerMet;

  const r = nhapKho(phieuNhuom.maVaiThanhPham, kgCan, user, `Nhập từ phiếu nhuộm ${phieuNhuom.id} (${phieuNhuom.mauNhuom})`);

  logAudit({
    user, action: "create", module: "kho-vai",
    description: `Hoàn thành nhuộm → nhập kho ${kgCan}kg ${phieuNhuom.tenVaiThanhPham} từ ${phieuNhuom.id}`,
    resourceId: phieuNhuom.id, success: true,
  });

  return r;
}

// ============ Lưu trữ localStorage ============
const SOI_KEY = "mimin_phieu_soi";
const DET_KEY = "mimin_phieu_det";
const NHUOM_KEY = "mimin_phieu_nhuom";

export function getPhieuSoi(): PhieuSoi[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SOI_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(SOI_KEY, JSON.stringify(MAU_PHIEU_SOI));
  return MAU_PHIEU_SOI;
}

export function getPhieuDet(): PhieuDet[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DET_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(DET_KEY, JSON.stringify(MAU_PHIEU_DET));
  return MAU_PHIEU_DET;
}

export function getPhieuNhuom(): PhieuNhuom[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(NHUOM_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(NHUOM_KEY, JSON.stringify(MAU_PHIEU_NHUOM));
  return MAU_PHIEU_NHUOM;
}

export function savePhieuSoi(phieus: PhieuSoi[]) {
  localStorage.setItem(SOI_KEY, JSON.stringify(phieus));
}

export function savePhieuDet(phieus: PhieuDet[]) {
  localStorage.setItem(DET_KEY, JSON.stringify(phieus));
}

export function savePhieuNhuom(phieus: PhieuNhuom[]) {
  localStorage.setItem(NHUOM_KEY, JSON.stringify(phieus));
}

// ============ BÁO CÁO TỔNG HỢP ============
export interface BaoCaoSoiVai {
  tongSoi: number;        // tổng kg sợi đã nhập
  tongVaiTho: number;      // tổng m vải thô
  tongVaiThanhPham: number; // tổng m vải thành phẩm
  tongTienSoi: number;     // tổng tiền mua sợi
  tongTienDet: number;     // tổng phí dệt
  tongTienNhuom: number;   // tổng phí nhuộm
  tyLeHaoHutDet: number;   // % hao hụt trung bình dệt
  tyLeHaoHutNhuom: number; // % hao hụt trung bình nhuộm
  phieusSoi: number;
  phieusDet: number;
  phieusNhuom: number;
}

export function tinhBaoCao(): BaoCaoSoiVai {
  const sois = getPhieuSoi();
  const dets = getPhieuDet();
  const nhuoms = getPhieuNhuom();

  const tongSoi = sois.reduce((s, p) => s + p.soKg, 0);
  const tongVaiTho = dets.reduce((s, p) => s + p.soMetDat, 0);
  const tongVaiThanhPham = nhuoms
    .filter((p) => p.trangThai === "Hoàn thành")
    .reduce((s, p) => s + p.soMetDat, 0);
  const tongTienSoi = sois.reduce((s, p) => s + p.thanhTien, 0);
  const tongTienDet = dets.reduce((s, p) => s + p.thanhTien, 0);
  const tongTienNhuom = nhuoms.reduce((s, p) => s + p.thanhTien, 0);

  const tongMetVaiThoDuKien = dets.reduce((s, p) => s + p.soMetDuKien, 0);
  const tyLeHaoHutDet = tongMetVaiThoDuKien > 0
    ? ((tongMetVaiThoDuKien - tongVaiTho) / tongMetVaiThoDuKien) * 100
    : 0;

  return {
    tongSoi, tongVaiTho, tongVaiThanhPham,
    tongTienSoi, tongTienDet, tongTienNhuom,
    tyLeHaoHutDet, tyLeHaoHutNhuom: 0,
    phieusSoi: sois.length,
    phieusDet: dets.length,
    phieusNhuom: nhuoms.length,
  };
}
