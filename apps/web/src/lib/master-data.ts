// Master Data - NCC sợi, Xưởng dệt, Xưởng nhuộm
// CRUD + dropdown selection cho mọi form
// v85: Thêm 35 đối tác gia công thật từ CSV chị Giàu (2026-07-28)

import {
  DOI_TAC_GIA_CONG, getDoiTacByMa, getDoiTacByLoai, getDoiTacDangHopTac,
  getDoiTacNgungHopTac, thongKeDoiTac,
  type DoiTacGiaCong, type LoaiDoiTac, type TrangThaiHopTac,
} from "./doi-tac-gia-cong";

// Re-export để code khác dùng
export { DOI_TAC_GIA_CONG, getDoiTacByMa, getDoiTacByLoai, getDoiTacDangHopTac, getDoiTacNgungHopTac, thongKeDoiTac };
export type { DoiTacGiaCong, LoaiDoiTac, TrangThaiHopTac };

export interface NhaCungCap {
  id: string;          // NCC-01
  maNCC: string;       // NCC-01
  tenNCC: string;      // Cty Sợi Việt Nam
  loai: "sợi" | "phụ liệu" | "hóa chất";
  diaChi: string;
  sdt: string;
  email: string;
  maSoThue: string;
  nguoiLienHe: string;
  ghiChu: string;
  ngayTao: string;
  trangThai: "Đang hợp tác" | "Tạm dừng" | "Ngừng hợp tác";
}

export interface XuongGiaCong {
  id: string;          // XGC-01
  maXuong: string;     // XGC-01
  tenXuong: string;    // DNT Dệt Bắc Ninh
  loai: "dệt" | "nhuộm" | "hoàn thiện" | "may";
  diaChi: string;
  sdt: string;
  email: string;
  maSoThue: string;
  nguoiLienHe: string;
  nangLuc: string;     // "500kg/ngày"
  chatLuongTB: "Tốt" | "Khá" | "Trung bình";
  ghiChu: string;
  ngayTao: string;
  trangThai: "Đang hợp tác" | "Tạm dừng" | "Ngừng hợp tác";
}

// ============ DEFAULT DATA ============
const DEFAULT_NCC: NhaCungCap[] = [
  { id: "NCC-01", maNCC: "NCC-01", tenNCC: "Cty Sợi Việt Nam", loai: "sợi",
    diaChi: "KCN Tân Bình, TP.HCM", sdt: "028-1234-5678", email: "sales@soivn.com",
    maSoThue: "0312345678", nguoiLienHe: "Anh Tuấn", ghiChu: "NCC chính - sợi cotton",
    ngayTao: "2025-01-15", trangThai: "Đang hợp tác" },
  { id: "NCC-02", maNCC: "NCC-02", tenNCC: "Cty Sợi Hưng Yên", loai: "sợi",
    diaChi: "KCN Phố Nối, Hưng Yên", sdt: "0221-987-654", email: "info@soihy.vn",
    maSoThue: "0987654321", nguoiLienHe: "Chị Hương", ghiChu: "Sợi poly chất lượng cao",
    ngayTao: "2025-02-20", trangThai: "Đang hợp tác" },
  { id: "NCC-03", maNCC: "NCC-03", tenNCC: "Cty Sợi Bình Dương", loai: "sợi",
    diaChi: "KCN Sóng Thần, Bình Dương", sdt: "0274-555-666", email: "contact@soibd.com",
    maSoThue: "0376543210", nguoiLienHe: "Anh Minh", ghiChu: "Sợi pha CVC",
    ngayTao: "2025-03-10", trangThai: "Đang hợp tác" },
  { id: "NCC-04", maNCC: "NCC-04", tenNCC: "Cty Sợi Đồng Nai", loai: "sợi",
    diaChi: "KCN Biên Hòa, Đồng Nai", sdt: "0251-777-888", email: "sales@soidn.vn",
    maSoThue: "0361234567", nguoiLienHe: "Chị Lan", ghiChu: "Sợi kaki chuyên dụng",
    ngayTao: "2025-04-05", trangThai: "Đang hợp tác" },
];

const DEFAULT_XUONG: XuongGiaCong[] = [
  { id: "XGC-01", maXuong: "XGC-01", tenXuong: "DNT Dệt Bắc Ninh", loai: "dệt",
    diaChi: "KCN Tiên Sơn, Bắc Ninh", sdt: "0222-111-222", email: "info@detbn.vn",
    maSoThue: "0234567890", nguoiLienHe: "Anh Hùng", nangLuc: "1,000kg/ngày",
    chatLuongTB: "Tốt", ghiChu: "Xưởng dệt chính - uy tín 10 năm",
    ngayTao: "2025-01-10", trangThai: "Đang hợp tác" },
  { id: "XGC-02", maXuong: "XGC-02", tenXuong: "DNT Dệt Thái Bình", loai: "dệt",
    diaChi: "KCN Phú Khánh, Thái Bình", sdt: "0227-333-444", email: "contact@dettb.vn",
    maSoThue: "0345678901", nguoiLienHe: "Anh Quân", nangLuc: "800kg/ngày",
    chatLuongTB: "Khá", ghiChu: "Dệt khổ rộng chuyên nghiệp",
    ngayTao: "2025-02-15", trangThai: "Đang hợp tác" },
  { id: "XGC-03", maXuong: "XGC-03", tenXuong: "DNT Dệt Hà Nội", loai: "dệt",
    diaChi: "KCN Thạch Thất, Hà Nội", sdt: "024-555-666", email: "sales@dethn.vn",
    maSoThue: "0456789012", nguoiLienHe: "Chị Mai", nangLuc: "500kg/ngày",
    chatLuongTB: "Tốt", ghiChu: "Dệt vải cao cấp - đơn hàng nhỏ",
    ngayTao: "2025-03-01", trangThai: "Đang hợp tác" },
  { id: "XGC-04", maXuong: "XGC-04", tenXuong: "Cty Nhuộm Hà Đông", loai: "nhuộm",
    diaChi: "Quận Hà Đông, Hà Nội", sdt: "024-777-888", email: "info@nhomhd.vn",
    maSoThue: "0567890123", nguoiLienHe: "Anh Đức", nangLuc: "1,500kg/ngày",
    chatLuongTB: "Tốt", ghiChu: "Nhuộm phổ biến - giá tốt",
    ngayTao: "2025-01-20", trangThai: "Đang hợp tác" },
  { id: "XGC-05", maXuong: "XGC-05", tenXuong: "Cty Nhuộm Phong Phú", loai: "nhuộm",
    diaChi: "KCN Tân Thới Hiệp, TP.HCM", sdt: "028-999-000", email: "sales@nhompp.vn",
    maSoThue: "0678901234", nguoiLienHe: "Chị Phương", nangLuc: "2,000kg/ngày",
    chatLuongTB: "Tốt", ghiChu: "Nhuộm cao cấp - đa dạng màu",
    ngayTao: "2025-02-05", trangThai: "Đang hợp tác" },
  { id: "XGC-06", maXuong: "XGC-06", tenXuong: "Xưởng Nhuộm Bình Dương", loai: "nhuộm",
    diaChi: "KCN VSIP 2, Bình Dương", sdt: "0274-111-222", email: "info@nhombd.vn",
    maSoThue: "0789012345", nguoiLienHe: "Anh Tuấn", nangLuc: "1,200kg/ngày",
    chatLuongTB: "Khá", ghiChu: "Nhuộm nhanh - giá cạnh tranh",
    ngayTao: "2025-03-15", trangThai: "Đang hợp tác" },
];

// ============ STORAGE ============
const NCC_KEY = "mimin_ncc_v2";
const XUONG_KEY = "mimin_master_xuong";

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

// ============ NCC GETTERS / SETTERS ============
export function getAllNCC(): NhaCungCap[] {
  return getStorage(NCC_KEY, DEFAULT_NCC);
}

export function getNCCByLoai(loai: NhaCungCap["loai"]): NhaCungCap[] {
  return getAllNCC().filter((n) => n.loai === loai);
}

export function getNCCById(id: string): NhaCungCap | undefined {
  return getAllNCC().find((n) => n.id === id || n.maNCC === id);
}

export function saveNCC(data: NhaCungCap[]): void {
  setStorage(NCC_KEY, data);
}

export function upsertNCC(item: NhaCungCap): void {
  const list = getAllNCC();
  const idx = list.findIndex((n) => n.id === item.id);
  if (idx >= 0) list[idx] = item;
  else list.push(item);
  saveNCC(list);
}

export function deleteNCC(id: string): void {
  saveNCC(getAllNCC().filter((n) => n.id !== id));
}

// ============ XƯỞNG GETTERS / SETTERS ============
export function getAllXuong(): XuongGiaCong[] {
  return getStorage(XUONG_KEY, DEFAULT_XUONG);
}

export function getXuongByLoai(loai: XuongGiaCong["loai"]): XuongGiaCong[] {
  return getAllXuong().filter((x) => x.loai === loai);
}

export function getXuongById(id: string): XuongGiaCong | undefined {
  return getAllXuong().find((x) => x.id === id || x.maXuong === id);
}

export function saveXuong(data: XuongGiaCong[]): void {
  setStorage(XUONG_KEY, data);
}

export function upsertXuong(item: XuongGiaCong): void {
  const list = getAllXuong();
  const idx = list.findIndex((x) => x.id === item.id);
  if (idx >= 0) list[idx] = item;
  else list.push(item);
  saveXuong(list);
}

export function deleteXuong(id: string): void {
  saveXuong(getAllXuong().filter((x) => x.id !== id));
}

// ============ CONG NO ENGINE ============
export interface CongNoEntry {
  id: string;
  ngayPhatSinh: string;
  doiTuongId: string;       // NCC-01 hoặc XGC-01
  tenDoiTuong: string;
  loai: "NCC sợi" | "Xưởng dệt" | "Xưởng nhuộm";
  maPhieuGoc: string;       // PNS_001 / LD_001 / NTM_001
  moTa: string;
  phatSinh: number;
  thanhToan: number;
  conNo: number;
  trangThai: "Chưa trả" | "Đã trả một phần" | "Đã trả";
}

const CONGNO_KEY = "mimin_cong_no";

export function getAllCongNo(): CongNoEntry[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(CONGNO_KEY) || "[]"); } catch { return []; }
}

export function saveCongNo(data: CongNoEntry[]): void {
  setStorage(CONGNO_KEY, data);
}

export function themCongNo(entry: Omit<CongNoEntry, "id" | "conNo" | "trangThai">): CongNoEntry {
  const list = getAllCongNo();
  const conNo = entry.phatSinh - entry.thanhToan;
  const trangThai: CongNoEntry["trangThai"] =
    entry.thanhToan === 0 ? "Chưa trả" :
    entry.thanhToan >= entry.phatSinh ? "Đã trả" : "Đã trả một phần";
  const newEntry: CongNoEntry = {
    ...entry, id: `CN_${Date.now().toString().slice(-6)}`, conNo, trangThai,
  };
  list.unshift(newEntry);
  saveCongNo(list);
  return newEntry;
}

export function thanhToanCongNo(id: string, soTien: number): { ok: boolean; message: string } {
  const list = getAllCongNo();
  const idx = list.findIndex((c) => c.id === id);
  if (idx < 0) return { ok: false, message: "Không tìm thấy công nợ" };
  const item = list[idx];
  const newThanhToan = item.thanhToan + soTien;
  if (newThanhToan > item.phatSinh) {
    return { ok: false, message: `Số tiền thanh toán vượt quá công nợ (${item.conNo.toLocaleString()}đ)` };
  }
  list[idx] = {
    ...item,
    thanhToan: newThanhToan,
    conNo: item.phatSinh - newThanhToan,
    trangThai: newThanhToan >= item.phatSinh ? "Đã trả" : "Đã trả một phần",
  };
  saveCongNo(list);
  return { ok: true, message: `✅ Đã thanh toán ${soTien.toLocaleString()}đ. Còn nợ: ${list[idx].conNo.toLocaleString()}đ` };
}

/**
 * Báo cáo tổng hợp công nợ theo đối tượng
 */
export interface BaoCaoCongNo {
  doiTuongId: string;
  tenDoiTuong: string;
  loai: "NCC sợi" | "Xưởng dệt" | "Xưởng nhuộm";
  tongPhatSinh: number;
  tongThanhToan: number;
  tongConNo: number;
  soPhieu: number;
  chiTiet: CongNoEntry[];
}

export function baoCaoCongNoByDoiTuong(): BaoCaoCongNo[] {
  const all = getAllCongNo();
  const map: Record<string, BaoCaoCongNo> = {};

  all.forEach((c) => {
    if (!map[c.doiTuongId]) {
      map[c.doiTuongId] = {
        doiTuongId: c.doiTuongId,
        tenDoiTuong: c.tenDoiTuong,
        loai: c.loai,
        tongPhatSinh: 0, tongThanhToan: 0, tongConNo: 0, soPhieu: 0,
        chiTiet: [],
      };
    }
    map[c.doiTuongId].tongPhatSinh += c.phatSinh;
    map[c.doiTuongId].tongThanhToan += c.thanhToan;
    map[c.doiTuongId].tongConNo += c.conNo;
    map[c.doiTuongId].soPhieu += 1;
    map[c.doiTuongId].chiTiet.push(c);
  });

  return Object.values(map).sort((a, b) => b.tongConNo - a.tongConNo);
}
