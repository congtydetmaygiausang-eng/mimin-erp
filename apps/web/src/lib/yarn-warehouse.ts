// Yarn Warehouse - 4 form + Giá vốn vải tự động

import { logAudit } from "./audit-log";

// ============ 1. NHẬP KHO SỢI ============
export interface NhapSoi {
  id: string;            // NS_001
  ngayNhap: string;
  nhaCungCap: string;    // NCC-01
  tenNCC: string;
  loaiSoi: string;       // SOI-COTTON-30
  tenSoi: string;
  maSoi: string;         // Mã sợi nội bộ
  donVi: "Kg";
  soKg: number;
  donGia: number;        // VNĐ/kg
  thanhTien: number;      // = soKg * donGia
  congNo: number;        // = thanhTien (chưa trả)
  daTra: number;
  trangThai: "Chưa trả" | "Đã trả một phần" | "Đã trả";
  ghiChu: string;
}

// ============ 2. GIA CÔNG DỆT ============
export interface GiaCongDet {
  id: string;            // GCD_001
  ngayGiao: string;
  ngayNhan?: string;
  donViDet: string;      // DNT Dệt Bắc Ninh
  tenDonVi: string;
  maLoSoi: string;       // LSOI-001
  loaiSoi: string;
  soKgXuat: number;       // 500
  donGiaDet: number;      // 8,000đ/kg
  tienDet: number;         // 4,000,000
  soKgMocNhan?: number;   // 485 (khi nghiệm thu)
  haoHutKg?: number;       // 15
  haoHutPt?: number;       // 3%
  congNo: number;          // = tienDet
  trangThai: "Đã giao sợi" | "Đang dệt" | "Đã nghiệm thu" | "Hủy";
  ghiChu: string;
}

// ============ 3. GIA CÔNG NHUỘM ============
export interface GiaCongNhuom {
  id: string;            // GCN_001
  ngayGiao: string;
  ngayNhan?: string;
  donViNhuom: string;
  tenDonVi: string;
  maLoMoc: string;       // LM_001 (lô mộc)
  loaiVai: string;        // Vải thun cotton
  mau: string;            // Trắng ngà / Đen / Xanh navy
  soKgNhuom: number;      // 485
  donGiaNhuom: number;    // 8,500đ/kg
  tienHoaChat: number;     // 500,000
  tienNhuom: number;       // 485 * 8500 = 4,122,500
  tongCong: number;        // tienNhuom + tienHoaChat
  soKgThanhPham?: number; // 470 (sau khi nhuộm)
  haoHutKg?: number;       // 15
  haoHutPt?: number;       // 3%
  congNo: number;
  trangThai: "Đã giao mộc" | "Đang nhuộm" | "Đã nghiệm thu" | "Hủy";
  ghiChu: string;
}

// ============ 4. NHẬP KHO VẢI THÀNH PHẨM ============
export interface NhapKhoVaiTP {
  id: string;            // NKV_001
  ngayNhap: string;
  maPhieuGoc: string;     // GCN_001 (phiếu nhuộm gốc)
  loaiVai: string;
  mau: string;
  tenVai: string;
  maVai: string;          // V-DENNANO
  soKg: number;           // 470
  kgPerCay: number;        // 20
  soCay: number;           // INT(470/20) = 23
  kgLe: number;            // MOD(470, 20) = 10
  kho: string;             // Kho Vải TP
  khu: string;             // Khu A/B/C
  ke: string;              // Kệ A03
  giaVonPerKg: number;     // Giá vốn / kg = tổng chi phí / kg thành phẩm
  tongGiaTri: number;       // soKg * giaVonPerKg
  ghiChu: string;
}

// ============ KHU VỰC KHO ============
export const KHU_KHO = {
  "Kho Vải TP": {
    "Khu A": ["Đen", "Trắng", "Xám"],
    "Khu B": ["Navy", "Đỏ", "Vàng"],
    "Khu C": ["Vải lỗi", "Chờ kiểm"],
  },
};

// ============ MẪU DATA ============
const MAU_NHAP_SOI: NhapSoi[] = [
  { id: "NS_001", ngayNhap: "2026-07-20", nhaCungCap: "NCC-01", tenNCC: "Cty Sợi Việt Nam",
    loaiSoi: "SOI-COTTON-30", tenSoi: "Sợi cotton 30s", maSoi: "MS-C30-2026-001",
    donVi: "Kg", soKg: 1000, donGia: 145000, thanhTien: 145000000,
    congNo: 145000000, daTra: 0, trangThai: "Chưa trả",
    ghiChu: "Nhập cho LSX-2026-001 (M758) + LSX-2026-002 (M873)" },
  { id: "NS_002", ngayNhap: "2026-07-22", nhaCungCap: "NCC-01", tenNCC: "Cty Sợi Việt Nam",
    loaiSoi: "SOI-COTTON-32", tenSoi: "Sợi cotton 32s", maSoi: "MS-C32-2026-002",
    donVi: "Kg", soKg: 800, donGia: 135000, thanhTien: 108000000,
    congNo: 108000000, daTra: 0, trangThai: "Chưa trả",
    ghiChu: "Cho LSX-2026-003 (M111 Áo polo)" },
  { id: "NS_003", ngayNhap: "2026-07-24", nhaCungCap: "NCC-02", tenNCC: "Cty Sợi Hưng Yên",
    loaiSoi: "SOI-POLY-DTY", tenSoi: "Sợi Polyester DTY", maSoi: "MS-PD-2026-003",
    donVi: "Kg", soKg: 1500, donGia: 95000, thanhTien: 142500000,
    congNo: 142500000, daTra: 50000000, trangThai: "Đã trả một phần",
    ghiChu: "Cho LSX-2026-004 (M222 Bộ thể thao). Đã tạm ứng 50tr" },
];

const MAU_GIA_CONG_DET: GiaCongDet[] = [
  { id: "GCD_001", ngayGiao: "2026-07-21", ngayNhan: "2026-07-24",
    donViDet: "DT-DET-01", tenDonVi: "DNT Dệt Bắc Ninh",
    maLoSoi: "LSOI-001", loaiSoi: "SOI-COTTON-30",
    soKgXuat: 1000, donGiaDet: 25000, tienDet: 25000000,
    soKgMocNhan: 900, haoHutKg: 100, haoHutPt: 10,
    congNo: 25000000, trangThai: "Đã nghiệm thu",
    ghiChu: "1000kg sợi → 900kg mộc (10% hao hụt)" },
  { id: "GCD_002", ngayGiao: "2026-07-23",
    donViDet: "DT-DET-01", tenDonVi: "DNT Dệt Bắc Ninh",
    maLoSoi: "LSOI-002", loaiSoi: "SOI-COTTON-32",
    soKgXuat: 450, donGiaDet: 25000, tienDet: 11250000,
    congNo: 11250000, trangThai: "Đang dệt",
    ghiChu: "Chờ nghiệm thu" },
];

const MAU_GIA_CONG_NHUOM: GiaCongNhuom[] = [
  { id: "GCN_001", ngayGiao: "2026-07-25", ngayNhan: "2026-07-28",
    donViNhuom: "DT-NH-01", tenDonVi: "Cty Nhuộm Hà Đông",
    maLoMoc: "LM_001", loaiVai: "Vải thun cotton", mau: "Trắng ngà",
    soKgNhuom: 900, donGiaNhuom: 8000, tienHoaChat: 500000,
    tienNhuom: 7200000, tongCong: 7700000,
    soKgThanhPham: 855, haoHutKg: 45, haoHutPt: 5,
    congNo: 7700000, trangThai: "Đã nghiệm thu",
    ghiChu: "900kg mộc → 855kg thành phẩm (5% hao hụt)" },
  { id: "GCN_002", ngayGiao: "2026-07-29",
    donViNhuom: "DT-NH-02", tenDonVi: "Cty Nhuộm Phong Phú",
    maLoMoc: "LM_002", loaiVai: "Vải thun lạnh (poly)", mau: "Xanh navy",
    soKgNhuom: 1200, donGiaNhuom: 12000, tienHoaChat: 800000,
    tienNhuom: 14400000, tongCong: 15200000,
    congNo: 15200000, trangThai: "Đang nhuộm",
    ghiChu: "Chờ nghiệm thu" },
];

const MAU_NHAP_KHO_TP: NhapKhoVaiTP[] = [
  { id: "NKV_001", ngayNhap: "2026-07-28", maPhieuGoc: "GCN_001",
    loaiVai: "Vải thun cotton 4 chiều", mau: "Trắng ngà",
    tenVai: "TRẮNG 003(1)", maVai: "V-TRANG003",
    soKg: 855, kgPerCay: 20, soCay: 42, kgLe: 15,
    kho: "Kho Vải TP", khu: "Khu A", ke: "A03",
    giaVonPerKg: 0, tongGiaTri: 0, // Sẽ tính sau
    ghiChu: "Nhập từ phiếu nhuộm GCN_001" },
];

// ============ GETTERS / SETTERS ============
const NS_KEY = "mimin_nhap_soi";
const GCD_KEY = "mimin_gia_cong_det";
const GCN_KEY = "mimin_gia_cong_nhuom";
const NKV_KEY = "mimin_nhap_kho_vai_tp";

function getStorage<T>(key: string, defaultData: T): T {
  if (typeof window === "undefined") return defaultData;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(key, JSON.stringify(defaultData));
  return defaultData;
}
function setStorage<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function getNhapSoi(): NhapSoi[] { return getStorage(NS_KEY, MAU_NHAP_SOI); }
export function getGiaCongDet(): GiaCongDet[] { return getStorage(GCD_KEY, MAU_GIA_CONG_DET); }
export function getGiaCongNhuom(): GiaCongNhuom[] { return getStorage(GCN_KEY, MAU_GIA_CONG_NHUOM); }
export function getNhapKhoTP(): NhapKhoVaiTP[] { return getStorage(NKV_KEY, MAU_NHAP_KHO_TP); }

export function saveNhapSoi(d: NhapSoi[]) { setStorage(NS_KEY, d); }
export function saveGiaCongDet(d: GiaCongDet[]) { setStorage(GCD_KEY, d); }
export function saveGiaCongNhuom(d: GiaCongNhuom[]) { setStorage(GCN_KEY, d); }
export function saveNhapKhoTP(d: NhapKhoVaiTP[]) { setStorage(NKV_KEY, d); }

// ============ CÔNG THỨC TÍNH GIÁ VỐN ============
export interface CostBreakdown {
  chiSoi: number;         // tiền sợi
  chiDet: number;         // tiền dệt
  chiNhuom: number;       // tiền nhuộm + hóa chất
  chiKhac: number;        // chi phí khác (optional)
  tongCong: number;        // tổng cộng
  soKgTP: number;         // kg vải thành phẩm
  giaVonPerKg: number;    // giá vốn / kg vải TP
}

/**
 * Tính giá vốn vải thành phẩm
 * Công thức: (Giá sợi + Gia công dệt + Gia công nhuộm + Khác) / Kg vải TP
 */
export function tinhGiaVonVai(
  nhapSoi: NhapSoi,           // phiếu nhập sợi gốc
  giaCongDet: GiaCongDet,     // phiếu dệt
  giaCongNhuom: GiaCongNhuom, // phiếu nhuộm
  soKgTP: number,             // kg vải thành phẩm cuối cùng
  chiKhac: number = 0
): CostBreakdown {
  const chiSoi = nhapSoi.thanhTien;
  const chiDet = giaCongDet.tienDet;
  const chiNhuom = giaCongNhuom.tongCong;
  const tongCong = chiSoi + chiDet + chiNhuom + chiKhac;
  const giaVonPerKg = soKgTP > 0 ? tongCong / soKgTP : 0;

  return {
    chiSoi, chiDet, chiNhuom, chiKhac,
    tongCong, soKgTP, giaVonPerKg,
  };
}

// ============ WORKFLOW ACTIONS ============

/**
 * 1. Nhập kho sợi → Tăng kho sợi + tăng công nợ NCC
 */
export function nhapKhoSoi(data: Omit<NhapSoi, "id" | "thanhTien" | "congNo">, user: any): { ok: boolean; nhapSoi?: NhapSoi; message: string } {
  const list = getNhapSoi();
  const nhapSoi: NhapSoi = {
    ...data,
    id: `NS_${Date.now().toString().slice(-6)}`,
    thanhTien: data.soKg * data.donGia,
    congNo: data.soKg * data.donGia, // ban đầu = 100% nợ
  };
  list.unshift(nhapSoi);
  saveNhapSoi(list);

  // Tăng kho sợi
  const loSois = getLoSoi();
  const loSoi = {
    id: `LSOI-${Date.now().toString().slice(-4)}`,
    loaiSoi: data.loaiSoi, tenSoi: data.tenSoi,
    nhaCungCap: data.tenNCC,
    soKgBanDau: data.soKg, soKgConLai: data.soKg,
    ngayNhap: data.ngayNhap, trangThai: "Tồn kho" as const,
    qrCode: `QR-${nhapSoi.id}`, ghiChu: data.ghiChu,
  };
  const newLoSois = [loSoi, ...loSois];
  localStorage.setItem("mimin_lo_soi", JSON.stringify(newLoSois));

  logAudit({
    user, action: "create", module: "kho-soi",
    description: `Nhập kho sợi ${data.soKg}kg ${data.tenSoi} từ ${data.tenNCC}. Thành tiền: ${nhapSoi.thanhTien.toLocaleString()}đ`,
    resourceId: nhapSoi.id, success: true,
  });

  return { ok: true, nhapSoi, message: `✅ Nhập ${data.soKg}kg ${data.tenSoi} = ${nhapSoi.thanhTien.toLocaleString()}đ. Tăng kho + ${nhapSoi.congNo.toLocaleString()}đ công nợ NCC` };
}

// Helper - import getLoSoi
function getLoSoi() {
  try {
    const raw = localStorage.getItem("mimin_lo_soi");
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

/**
 * 2. Giao sợi cho xưởng dệt → Trừ kho sợi + tạo công nợ dệt
 */
export function giaoSoiChoXuong(data: Omit<GiaCongDet, "id" | "tienDet" | "congNo" | "trangThai" | "soKgMocNhan" | "haoHutKg" | "haoHutPt">, user: any): { ok: boolean; giaCong?: GiaCongDet; message: string } {
  const list = getGiaCongDet();
  const gcd: GiaCongDet = {
    ...data,
    id: `GCD_${Date.now().toString().slice(-6)}`,
    tienDet: data.soKgXuat * data.donGiaDet,
    congNo: data.soKgXuat * data.donGiaDet,
    trangThai: "Đã giao sợi",
  };
  list.unshift(gcd);
  saveGiaCongDet(list);

  logAudit({
    user, action: "create", module: "kho-soi",
    description: `Giao ${data.soKgXuat}kg sợi cho ${data.tenDonVi}. Phí dệt: ${gcd.tienDet.toLocaleString()}đ`,
    resourceId: gcd.id, success: true,
  });

  return { ok: true, giaCong: gcd, message: `✅ Giao ${data.soKgXuat}kg sợi cho ${data.tenDonVi}. Công nợ: ${gcd.tienDet.toLocaleString()}đ` };
}

/**
 * 3. Nghiệm thu dệt → Nhập số kg mộc, tính hao hụt
 */
export function nghiemThuDet(gcdId: string, soKgMocNhan: number, user: any): { ok: boolean; message: string; haoHutPt: number } {
  const list = getGiaCongDet();
  const item = list.find((g) => g.id === gcdId);
  if (!item) return { ok: false, message: "Không tìm thấy phiếu dệt", haoHutPt: 0 };

  const haoHutKg = item.soKgXuat - soKgMocNhan;
  const haoHutPt = item.soKgXuat > 0 ? (haoHutKg / item.soKgXuat) * 100 : 0;

  const newList = list.map((g) => g.id === gcdId ? {
    ...g, soKgMocNhan, haoHutKg, haoHutPt,
    ngayNhan: new Date().toISOString().slice(0, 10),
    trangThai: "Đã nghiệm thu" as const,
  } : g);
  saveGiaCongDet(newList);

  // Tạo lô mộc
  const loMoc = {
    id: `LM_${Date.now().toString().slice(-4)}`,
    maGoc: gcdId, loaiVai: "Vải thun cotton",
    soKg: soKgMocNhan, ngayNhap: new Date().toISOString().slice(0, 10),
    trangThai: "Chờ nhuộm" as const,
  };
  const loMocs = JSON.parse(localStorage.getItem("mimin_lo_moc") || "[]");
  loMocs.unshift(loMoc);
  localStorage.setItem("mimin_lo_moc", JSON.stringify(loMocs));

  logAudit({
    user, action: "update", module: "kho-soi",
    description: `Nghiệm thu ${gcdId}: ${soKgMocNhan}kg mộc. Hao hụt ${haoHutPt.toFixed(1)}%`,
    resourceId: gcdId, success: true,
  });

  return { ok: true, message: `✅ Nghiệm thu ${gcdId}: ${soKgMocNhan}kg mộc, hao hụt ${haoHutPt.toFixed(1)}%`, haoHutPt };
}

/**
 * 4. Giao mộc cho xưởng nhuộm
 */
export function giaoMocChoXuong(data: Omit<GiaCongNhuom, "id" | "tienNhuom" | "tongCong" | "congNo" | "trangThai" | "soKgThanhPham" | "haoHutKg" | "haoHutPt">, user: any): { ok: boolean; giaCong?: GiaCongNhuom; message: string } {
  const list = getGiaCongNhuom();
  const gcn: GiaCongNhuom = {
    ...data,
    id: `GCN_${Date.now().toString().slice(-6)}`,
    tienNhuom: data.soKgNhuom * data.donGiaNhuom,
    tongCong: data.soKgNhuom * data.donGiaNhuom + data.tienHoaChat,
    congNo: data.soKgNhuom * data.donGiaNhuom + data.tienHoaChat,
    trangThai: "Đã giao mộc",
  };
  list.unshift(gcn);
  saveGiaCongNhuom(list);

  logAudit({
    user, action: "create", module: "kho-soi",
    description: `Giao ${data.soKgNhuom}kg mộc ${data.mau} cho ${data.tenDonVi}. Phí: ${gcn.tongCong.toLocaleString()}đ`,
    resourceId: gcn.id, success: true,
  });

  return { ok: true, giaCong: gcn, message: `✅ Giao ${data.soKgNhuom}kg mộc ${data.mau}. Tổng phí: ${gcn.tongCong.toLocaleString()}đ` };
}

/**
 * 5. Nghiệm thu nhuộm → Tính giá vốn + Nhập kho vải TP
 */
export function nghiemThuNhuom(gcnId: string, soKgThanhPham: number, kho: string, khu: string, ke: string, user: any): { ok: boolean; message: string; nhapKho?: NhapKhoVaiTP; giaVon?: CostBreakdown } {
  const listNhuom = getGiaCongNhuom();
  const gcn = listNhuom.find((g) => g.id === gcnId);
  if (!gcn) return { ok: false, message: "Không tìm thấy phiếu nhuộm" };

  const haoHutKg = gcn.soKgNhuom - soKgThanhPham;
  const haoHutPt = gcn.soKgNhuom > 0 ? (haoHutKg / gcn.soKgNhuom) * 100 : 0;

  // Update nhuộm
  const newNhuom = listNhuom.map((g) => g.id === gcnId ? {
    ...g, soKgThanhPham, haoHutKg, haoHutPt,
    ngayNhan: new Date().toISOString().slice(0, 10),
    trangThai: "Đã nghiệm thu" as const,
  } : g);
  saveGiaCongNhuom(newNhuom);

  // Tìm phiếu dệt liên quan (qua lô mộc)
  const dsDet = getGiaCongDet();
  const gcd = dsDet.find((d) => d.id === gcn.maLoMoc || d.maLoSoi === gcn.maLoMoc);

  // Tìm phiếu nhập sợi gốc
  const dsNhap = getNhapSoi();
  const nhapSoi = dsNhap.find((n) => n.maSoi === gcn.maLoMoc || n.loaiSoi === gcn.loaiVai);

  // Tính giá vốn
  let giaVon: CostBreakdown | undefined;
  if (nhapSoi && gcd) {
    giaVon = tinhGiaVonVai(nhapSoi, gcd, gcn, soKgThanhPham);
  } else {
    // Fallback: chỉ tính từ dệt + nhuộm
    giaVon = {
      chiSoi: 0,
      chiDet: gcd?.tienDet || 0,
      chiNhuom: gcn.tongCong,
      chiKhac: 0,
      tongCong: (gcd?.tienDet || 0) + gcn.tongCong,
      soKgTP: soKgThanhPham,
      giaVonPerKg: soKgThanhPham > 0 ? ((gcd?.tienDet || 0) + gcn.tongCong) / soKgThanhPham : 0,
    };
  }

  // Tạo phiếu nhập kho TP
  const dsVai = JSON.parse(localStorage.getItem("mimin_kho_vai") || "[]");
  const mappingMau: Record<string, { ma: string; ten: string }> = {
    "Trắng ngà": { ma: "V-TRANG003", ten: "TRẮNG 003(1)" },
    "Đen": { ma: "V-DENNANO", ten: "Poly Nano Đen" },
    "Xanh navy": { ma: "V-XANHDENCM", ten: "XANH ĐEN CM" },
    "Xám": { ma: "V-XAMCHI035", ten: "XÁM CHÌ 035" },
  };
  const vai = mappingMau[gcn.mau] || { ma: "V-KHAC", ten: "Vải " + gcn.mau };

  const kgPerCay = 20;
  const nhapKho: NhapKhoVaiTP = {
    id: `NKV_${Date.now().toString().slice(-6)}`,
    ngayNhap: new Date().toISOString().slice(0, 10),
    maPhieuGoc: gcnId,
    loaiVai: gcn.loaiVai, mau: gcn.mau,
    tenVai: vai.ten, maVai: vai.ma,
    soKg: soKgThanhPham, kgPerCay, soCay: Math.floor(soKgThanhPham / kgPerCay), kgLe: soKgThanhPham % kgPerCay,
    kho, khu, ke,
    giaVonPerKg: giaVon.giaVonPerKg,
    tongGiaTri: giaVon.tongCong,
    ghiChu: `Từ phiếu nhuộm ${gcnId}. Hao hụt ${haoHutPt.toFixed(1)}%`,
  };
  const listNK = getNhapKhoTP();
  listNK.unshift(nhapKho);
  saveNhapKhoTP(listNK);

  logAudit({
    user, action: "create", module: "kho-soi",
    description: `Nghiệm thu nhuộm ${gcnId}: ${soKgThanhPham}kg TP. Giá vốn: ${giaVon.giaVonPerKg.toFixed(0)}đ/kg. Nhập kho ${kho}/${khu}/${ke}`,
    resourceId: gcnId, success: true,
  });

  return {
    ok: true,
    message: `✅ Nhập kho vải TP: ${soKgThanhPham}kg, giá vốn ${giaVon.giaVonPerKg.toFixed(0)}đ/kg. Tổng: ${giaVon.tongCong.toLocaleString()}đ`,
    nhapKho, giaVon,
  };
}
