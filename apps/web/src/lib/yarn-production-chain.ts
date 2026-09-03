// Yarn Production Chain - ERP chuẩn: 6 bước + kho_log + truy ngược lô + 1 mẻ nhiều màu
// Quy tắc bắt buộc:
// 1. KHÔNG sửa tồn kho trực tiếp - Mọi nhập/xuất qua phiếu + kho_log
// 2. KHÔNG sửa giá vốn sau khóa lô - Phải tạo phiếu điều chỉnh
// 3. 1 mẻ nhuộm nhiều màu - Mỗi màu giá/hao hụt/giá vốn riêng
// 4. Công nợ liên kết NCC/xưởng dệt/xưởng nhuộm
// 5. Truy ngược: Vải TP → Mẻ nhuộm → Vải mộc → Lệnh dệt → Lô sợi → NCC

import { logAudit } from "./audit-log";
import { isSupabaseEnabled, supabase } from "./supabase/client";

type YarnCollectionType =
  | "KHO_LOG"
  | "PHIEU_NHAP_SOI"
  | "LO_SOI"
  | "LENH_DET"
  | "LO_MOC"
  | "ME_NHUOM"
  | "NGHIEM_THU_MAU"
  | "LO_VAI_TP";

type YarnRecord = {
  entity_type: YarnCollectionType;
  entity_id: string;
  payload: Record<string, unknown>;
};

const YARN_TABLE = "yarn_production_records";
export const YARN_PRODUCTION_SYNCED_EVENT = "mimin:yarn-production-synced";

const YARN_COLLECTIONS: Array<{ key: string; type: YarnCollectionType }> = [
  { key: "mimin_kho_log", type: "KHO_LOG" },
  { key: "mimin_phieu_nhap_soi", type: "PHIEU_NHAP_SOI" },
  { key: "mimin_lo_soi", type: "LO_SOI" },
  { key: "mimin_lenh_det", type: "LENH_DET" },
  { key: "mimin_lo_moc", type: "LO_MOC" },
  { key: "mimin_me_nhuom", type: "ME_NHUOM" },
  { key: "mimin_phieu_nghiem_thu_mau", type: "NGHIEM_THU_MAU" },
  { key: "mimin_lo_vai_tp", type: "LO_VAI_TP" },
];

function persistCollection(type: YarnCollectionType, rows: Array<{ id: string }>): void {
  if (!isSupabaseEnabled || !supabase || rows.length === 0) return;
  const payload: YarnRecord[] = rows.map((row) => ({
    entity_type: type,
    entity_id: row.id,
    payload: row as unknown as Record<string, unknown>,
  }));
  void supabase.from(YARN_TABLE).upsert(payload, { onConflict: "entity_type,entity_id" }).then(({ error }) => {
    if (error) console.error(`[Supabase] ${YARN_TABLE}/${type}:`, error.message);
  });
}

function saveCollection<T extends { id: string }>(key: string, type: YarnCollectionType, rows: T[]): void {
  localStorage.setItem(key, JSON.stringify(rows));
  persistCollection(type, rows);
}

export async function syncYarnProductionFromSupabase(): Promise<void> {
  if (typeof window === "undefined" || !isSupabaseEnabled || !supabase) return;
  const { data, error } = await supabase.from(YARN_TABLE).select("entity_type,entity_id,payload,updated_at");
  if (error) throw new Error(`Không đồng bộ được Sợi - Dệt - Nhuộm: ${error.message}`);

  const remote = (data || []) as Array<YarnRecord & { updated_at: string }>;
  for (const collection of YARN_COLLECTIONS) {
    const remoteRows = remote
      .filter((row) => row.entity_type === collection.type)
      .map((row) => row.payload);
    if (remoteRows.length > 0) {
      localStorage.setItem(collection.key, JSON.stringify(remoteRows));
      continue;
    }
    try {
      const localRows = JSON.parse(localStorage.getItem(collection.key) || "[]") as Array<{ id: string }>;
      persistCollection(collection.type, localRows);
    } catch {
      // Cache local lỗi thì bỏ qua, Supabase vẫn là nguồn dữ liệu chính.
    }
  }
  window.dispatchEvent(new CustomEvent(YARN_PRODUCTION_SYNCED_EVENT));
}

export function subscribeYarnProductionChanges(onChange: () => void): () => void {
  if (!isSupabaseEnabled || !supabase) return () => undefined;
  const channel = supabase
    .channel(`yarn-production-${Math.random().toString(36).slice(2)}`)
    .on("postgres_changes", { event: "*", schema: "public", table: YARN_TABLE }, () => {
      void syncYarnProductionFromSupabase().then(onChange).catch(console.error);
    })
    .subscribe();
  return () => { void supabase?.removeChannel(channel); };
}

export interface ChungTuSanXuat {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  category: string;
  uploadedAt: string;
}

// ============ KHO LOG (BẮT BUỘC) ============
export interface KhoLog {
  id: string;
  thoiGian: string;
  loaiPhieu: "NHAP_SOI" | "XUAT_DET" | "NHAP_MOC" | "XUAT_NHUOM" | "NHAP_TP" | "DIEU_CHINH";
  maPhieu: string;
  loaiKho: "SOI" | "MOC" | "TP";
  loaiAction: "NHAP" | "XUAT" | "DIEU_CHINH";
  maLo: string; // LSOI-001 / LM_001 / NKV_001
  soKg: number;
  soCay?: number;
  tuKho?: string;
  denKho?: string;
  nguoiThucHien: string;
  ghiChu: string;
  truocKg?: number;  // tồn trước
  sauKg?: number;    // tồn sau
}

const LOG_KEY = "mimin_kho_log";
function getLogs(): KhoLog[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(LOG_KEY) || "[]"); } catch { return []; }
}
function saveLogs(logs: KhoLog[]) {
  saveCollection(LOG_KEY, "KHO_LOG", logs);
}
function ghiLog(log: Omit<KhoLog, "id" | "thoiGian">) {
  const logs = getLogs();
  logs.unshift({
    ...log,
    id: `LOG_${Date.now()}_${Math.random().toString(36).slice(-4)}`,
    thoiGian: new Date().toISOString(),
  });
  saveLogs(logs.slice(0, 500)); // Giữ 500 log gần nhất
}

// ============ BƯỚC 1: NHẬP KHO SỢI ============
export interface PhieuNhapSoi {
  id: string;             // PNS_001
  ngayNhap: string;
  nccId: string;          // NCC-01
  tenNCC: string;
  loaiSoi: string;        // SOI-COTTON-30
  tenSoi: string;
  maLoSoi: string;        // LSOI-001 (mã lô)
  soKg: number;
  donGia: number;         // VNĐ/kg
  thanhTien: number;      // = soKg * donGia
  daThanhToan: number;
  conCongNo: number;      // = thanhTien - daThanhToan
  khoNhap: string;        // Kho Sợi
  nguoiPhuTrach: string;
  ghiChu: string;
  chungTu?: ChungTuSanXuat[];
  khoa: boolean;          // true = đã khóa, không được sửa
}

const PNS_KEY = "mimin_phieu_nhap_soi";
function getPNS(): PhieuNhapSoi[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PNS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}
function savePNS(data: PhieuNhapSoi[]) { saveCollection(PNS_KEY, "PHIEU_NHAP_SOI", data); }


/**
 * Công thức chuyển đổi Sợi → Vải mộc
 * 1kg sợi = 4m vải (theo định mức MIMIN)
 * Hao hụt dệt: 4% (cảnh báo)
 * Hao hụt nhuộm: 5% (cảnh báo)
 */
export const SOI_TO_VAI_RATIO = 4;        // m vải / kg sợi
export const HAO_HUT_DET_PCT = 4;         // % hao hụt dệt (định mức)
export const HAO_HUT_NHUOM_PCT = 5;       // % hao hụt nhuộm (định mức)
export const HAO_HUT_DET_WARNING = 10;    // % ngưỡng cảnh báo
export const HAO_HUT_NHUOM_WARNING = 8;   // % ngưỡng cảnh báo

export function nhapKhoSoi_V2(data: Omit<PhieuNhapSoi, "id" | "thanhTien" | "conCongNo">, user: any): { ok: boolean; phieu?: PhieuNhapSoi; message: string } {
  const list = getPNS();
  const phieu: PhieuNhapSoi = {
    ...data,
    id: `PNS_${Date.now().toString().slice(-6)}`,
    thanhTien: data.soKg * data.donGia,
    conCongNo: data.soKg * data.donGia - data.daThanhToan,
  };
  list.unshift(phieu);
  savePNS(list);

  // Tăng tồn kho sợi (theo mã lô)
  const loSois = getLoSoi();
  const existing = loSois.find((l: any) => l.maLoSoi === data.maLoSoi);
  if (existing) {
    existing.soKgBanDau += data.soKg;
    existing.soKgConLai += data.soKg;
  } else {
    loSois.unshift({
      id: `LSOI-${Date.now().toString().slice(-4)}`,
      maLoSoi: data.maLoSoi,
      loaiSoi: data.loaiSoi, tenSoi: data.tenSoi,
      nhaCungCap: data.tenNCC,
      soKgBanDau: data.soKg, soKgConLai: data.soKg,
      ngayNhap: data.ngayNhap, trangThai: "Tồn kho",
      qrCode: `QR-${phieu.id}`,
    });
  }
  saveCollection("mimin_lo_soi", "LO_SOI", loSois);

  // Ghi log + audit
  ghiLog({
    loaiPhieu: "NHAP_SOI", maPhieu: phieu.id, loaiKho: "SOI", loaiAction: "NHAP",
    maLo: data.maLoSoi, soKg: data.soKg, denKho: data.khoNhap,
    nguoiThucHien: user?.name || "system", ghiChu: data.ghiChu,
    truocKg: existing?.soKgConLai || 0,
    sauKg: (existing?.soKgConLai || 0) + data.soKg,
  });

  logAudit({
    user, action: "create", module: "kho-soi",
    description: `Nhập ${data.soKg}kg ${data.tenSoi} từ ${data.tenNCC}. Lô ${data.maLoSoi}. Thành tiền ${phieu.thanhTien.toLocaleString()}đ, còn nợ ${phieu.conCongNo.toLocaleString()}đ`,
    resourceId: phieu.id, success: true,
  });

  return { ok: true, phieu, message: `✅ Nhập ${data.soKg}kg ${data.tenSoi}. Lô ${data.maLoSoi}. Công nợ NCC: ${phieu.conCongNo.toLocaleString()}đ` };
}

// ============ BƯỚC 2: XUẤT SỢI ĐI DỆT (LỆNH DỆT) ============
export type TrangThaiLenhDet = "Nháp" | "Đã giao sợi" | "Đang dệt" | "Chờ nghiệm thu" | "Hoàn thành" | "Hủy";

export interface LenhDet {
  id: string;             // LD_001
  ngayGiao: string;
  ngayDuKienNhan: string;
  xuongDet: string;       // DNT Dệt Bắc Ninh
  maLoSoi: string;        // LSOI-001
  loaiSoi: string;
  soKgGiao: number;
  donGiaDet: number;      // VNĐ/kg
  tienDuKien: number;     // = soKgGiao * donGiaDet
  soMetDuKien: number;    // = soKgGiao * SOI_TO_VAI_RATIO (4m/kg)
  nguoiPhuTrach: string;
  trangThai: TrangThaiLenhDet;
  soKgXuongXacNhan?: number;
  ngayXacNhanNhanSoi?: string;
  haoHutBanGiaoSoiKg?: number;
  chungTuXuatNhanSoi?: ChungTuSanXuat[];
  // Sau nghiệm thu
  soKgMocNhan?: number;
  soCayMoc?: number;
  danhSachCayMoc?: Array<{ maCay: string; kg: number }>;
  soKgLoi?: number;
  haoHutKg?: number;
  haoHutPt?: number;
  chiPhiPhatSinh?: number;
  daThanhToan?: number;
  congNoXuong?: number;
  khoMocNhap?: string;
  ngayNghiemThu?: string;
  ketQuaKiemTra?: string;
  ghiChu: string;
}

const LD_KEY = "mimin_lenh_det";
function getLD(): LenhDet[] {
  if (typeof window === "undefined") return [];
  try { const r = localStorage.getItem(LD_KEY); if (r) return JSON.parse(r); } catch {}
  return [];
}
function saveLD(data: LenhDet[]) { saveCollection(LD_KEY, "LENH_DET", data); }

export function taoLenhDet(data: Omit<LenhDet, "id" | "trangThai">, user: any): { ok: boolean; lenh?: LenhDet; message: string } {
  const list = getLD();
  const lenh: LenhDet = {
    ...data, id: `LD_${Date.now().toString().slice(-6)}`,
    tienDuKien: data.soKgGiao * data.donGiaDet,
    soMetDuKien: data.soKgGiao * SOI_TO_VAI_RATIO,
    trangThai: "Đã giao sợi",
  };
  list.unshift(lenh);
  saveLD(list);

  // Giảm tồn kho sợi
  const loSois = getLoSoi();
  const loSoi = loSois.find((l: any) => l.maLoSoi === data.maLoSoi);
  if (loSoi) {
    const truoc = loSoi.soKgConLai;
    loSoi.soKgConLai -= data.soKgGiao;
    if (loSoi.soKgConLai <= 0) loSoi.trangThai = "Đã xuất hết";
  }
  saveCollection("mimin_lo_soi", "LO_SOI", loSois);

  ghiLog({
    loaiPhieu: "XUAT_DET", maPhieu: lenh.id, loaiKho: "SOI", loaiAction: "XUAT",
    maLo: data.maLoSoi, soKg: data.soKgGiao,
    tuKho: "Kho Sợi", denKho: data.xuongDet,
    nguoiThucHien: user?.name || "system", ghiChu: `Lệnh dệt ${lenh.id}`,
    truocKg: loSoi ? loSoi.soKgConLai + data.soKgGiao : 0,
    sauKg: loSoi?.soKgConLai || 0,
  });

  logAudit({
    user, action: "create", module: "kho-soi",
    description: `Lệnh dệt ${lenh.id}: Giao ${data.soKgGiao}kg sợi ${data.loaiSoi} → ${data.xuongDet}. Phí dệt dự kiến ${lenh.tienDuKien.toLocaleString()}đ`,
    resourceId: lenh.id, success: true,
  });

  return { ok: true, lenh, message: `✅ Tạo lệnh dệt ${lenh.id}. Đã trừ ${data.soKgGiao}kg khỏi lô ${data.maLoSoi}` };
}

export function capNhatTrangThaiLenhDet(lenhId: string, trangThai: TrangThaiLenhDet, user: any): { ok: boolean; message: string } {
  const list = getLD();
  const newList = list.map((l) => l.id === lenhId ? { ...l, trangThai } : l);
  saveLD(newList);
  logAudit({
    user, action: "update", module: "kho-soi",
    description: `Cập nhật lệnh dệt ${lenhId} → ${trangThai}`,
    resourceId: lenhId, success: true,
  });
  return { ok: true, message: `✅ Đã cập nhật ${lenhId} → ${trangThai}` };
}

export function xacNhanXuongDetNhanSoi(
  lenhId: string,
  soKgThucNhan: number,
  chungTu: ChungTuSanXuat[],
  user: any
): { ok: boolean; message: string } {
  const list = getLD();
  const lenh = list.find((item) => item.id === lenhId);
  if (!lenh) return { ok: false, message: "Không tìm thấy lệnh dệt" };
  if (soKgThucNhan <= 0 || soKgThucNhan > lenh.soKgGiao) {
    return { ok: false, message: `Số kg thực nhận phải từ 1 đến ${lenh.soKgGiao}kg` };
  }
  const haoHutBanGiaoSoiKg = lenh.soKgGiao - soKgThucNhan;
  saveLD(list.map((item) => item.id === lenhId ? {
    ...item,
    soKgXuongXacNhan: soKgThucNhan,
    ngayXacNhanNhanSoi: new Date().toISOString().slice(0, 10),
    haoHutBanGiaoSoiKg,
    chungTuXuatNhanSoi: chungTu,
    trangThai: "Đang dệt" as TrangThaiLenhDet,
  } : item));
  logAudit({
    user, action: "update", module: "kho-soi",
    description: `${lenhId}: xưởng dệt nhận ${soKgThucNhan}kg, chênh lệch bàn giao ${haoHutBanGiaoSoiKg}kg`,
    resourceId: lenhId, success: true,
  });
  return { ok: true, message: `Đã xác nhận nhận ${soKgThucNhan}kg sợi` };
}

// ============ BƯỚC 3: NGHIỆM THU VẢI MỘC ============
export function nghiemThuDet_V2(
  lenhId: string,
  data: {
    soKgMocNhan: number;
    soCayMoc: number;
    danhSachCayMoc: Array<{ maCay: string; kg: number }>;
    soKgLoi: number;
    chiPhiPhatSinh: number;
    daThanhToan: number;
    khoMocNhap: string;
    ketQuaKiemTra: string;
    chungTuBanGiaoMoc?: ChungTuSanXuat[];
  },
  user: any
): { ok: boolean; message: string; haoHutPt: number } {
  const list = getLD();
  const lenh = list.find((l) => l.id === lenhId);
  if (!lenh) return { ok: false, message: "Không tìm thấy lệnh dệt", haoHutPt: 0 };

  const soKgSoiThucNhan = lenh.soKgXuongXacNhan ?? lenh.soKgGiao;
  const haoHutKg = soKgSoiThucNhan - data.soKgMocNhan;
  const haoHutPt = soKgSoiThucNhan > 0 ? (haoHutKg / soKgSoiThucNhan) * 100 : 0;
  const tienGiaCong = lenh.soKgGiao * lenh.donGiaDet; // tính theo kg sợi giao (hoặc kg mộc theo quy ước)
  const congNo = tienGiaCong + data.chiPhiPhatSinh - data.daThanhToan;

  const newList = list.map((l) => l.id === lenhId ? {
    ...l,
    soKgMocNhan: data.soKgMocNhan,
    soCayMoc: data.soCayMoc,
    danhSachCayMoc: data.danhSachCayMoc,
    soKgLoi: data.soKgLoi,
    haoHutKg, haoHutPt,
    chiPhiPhatSinh: data.chiPhiPhatSinh,
    daThanhToan: data.daThanhToan,
    congNoXuong: congNo,
    khoMocNhap: data.khoMocNhap,
    ketQuaKiemTra: data.ketQuaKiemTra,
    chungTuBanGiaoMoc: data.chungTuBanGiaoMoc || [],
    ngayNghiemThu: new Date().toISOString().slice(0, 10),
    trangThai: "Hoàn thành" as TrangThaiLenhDet,
  } : l);
  saveLD(newList);

  // Nhập kho vải mộc
  const loMocs = getLoMoc();
  loMocs.unshift({
    id: `LM_${Date.now().toString().slice(-4)}`,
    maLoMoc: `LM-${lenhId}`,
    maLenhDet: lenhId, loaiVai: "Vải thun cotton",
    soKg: data.soKgMocNhan, soCay: data.soCayMoc, soKgLoi: data.soKgLoi,
    danhSachCay: data.danhSachCayMoc,
    ngayNhap: new Date().toISOString().slice(0, 10),
    kho: data.khoMocNhap,
    trangThai: "Chờ nhuộm",
  });
  saveCollection("mimin_lo_moc", "LO_MOC", loMocs);

  const meNhuoms = getMN();
  saveMN(meNhuoms.map((me) => me.maLoMoc === `LM-${lenhId}` ? {
    ...me,
    tongKgXuat: data.soKgMocNhan,
    soKgMocGiao: data.soKgMocNhan,
    soCayMocGiao: data.soCayMoc,
  } : me));

  ghiLog({
    loaiPhieu: "NHAP_MOC", maPhieu: lenhId, loaiKho: "MOC", loaiAction: "NHAP",
    maLo: `LM-${lenhId}`, soKg: data.soKgMocNhan, soCay: data.soCayMoc,
    denKho: data.khoMocNhap, nguoiThucHien: user?.name || "system",
    ghiChu: `Từ lệnh dệt ${lenhId}. Hao hụt ${haoHutPt.toFixed(1)}%`,
  });

  logAudit({
    user, action: "update", module: "kho-soi",
    description: `Nghiệm thu ${lenhId}: ${data.soKgMocNhan}kg mộc (${data.soCayMoc} cây). Hao hụt ${haoHutPt.toFixed(1)}%. Công nợ xưởng: ${congNo.toLocaleString()}đ`,
    resourceId: lenhId, success: true,
  });

  return {
    ok: true,
    message: `✅ Nghiệm thu: ${data.soKgMocNhan}kg mộc. Hao hụt ${haoHutPt.toFixed(1)}%. Công nợ xưởng: ${congNo.toLocaleString()}đ`,
    haoHutPt,
  };
}

// ============ BƯỚC 4: XUẤT VẢI MỘC ĐI NHUỘM (MẺ NHUỘM - NHIỀU MÀU) ============
export interface MauNhuom {
  maMau?: string;         // Mã màu lấy từ danh mục Kho vải thành phẩm
  mau: string;            // Đen, Trắng, Navy
  soKg: number;
  soCay?: number;
  maCayMoc?: string[];
  donGiaNhuom: number;    // đ/kg (riêng từng màu)
  giaVonDuKien?: number;
  ghiChu?: string;
}

export interface MeNhuom {
  id: string;             // MN_001
  ngayGiao: string;
  ngayDuKienNhan: string;
  xuongNhuom: string;
  maLoMoc: string;        // LM-LD_001
  tongKgXuat: number;     // = tổng các màu
  danhSachMau: MauNhuom[]; // NHIỀU MÀU
  nguoiPhuTrach: string;
  trangThai: "Đã giao mộc" | "Đang nhuộm" | "Chờ nghiệm thu" | "Hoàn thành" | "Hủy";
  soKgMocGiao?: number;
  soCayMocGiao?: number;
  soKgMocNhan?: number;
  soCayMocNhan?: number;
  ngayXacNhanNhanMoc?: string;
  haoHutBanGiaoMocKg?: number;
  chungTuNhanMoc?: ChungTuSanXuat[];
  chungTuNghiemThuNhuom?: ChungTuSanXuat[];
  ghiChu: string;
}

const MN_KEY = "mimin_me_nhuom";
function getMN(): MeNhuom[] {
  if (typeof window === "undefined") return [];
  try { const r = localStorage.getItem(MN_KEY); if (r) return JSON.parse(r); } catch {}
  return [];
}
function saveMN(data: MeNhuom[]) { saveCollection(MN_KEY, "ME_NHUOM", data); }

export function taoMeNhuom(data: Omit<MeNhuom, "id" | "tongKgXuat" | "trangThai">, user: any): { ok: boolean; me?: MeNhuom; message: string } {
  const tongKg = data.danhSachMau.reduce((s, m) => s + m.soKg, 0);
  const me: MeNhuom = {
    ...data, id: `MN_${Date.now().toString().slice(-6)}`,
    tongKgXuat: tongKg, trangThai: "Đã giao mộc",
  };
  const list = getMN();
  list.unshift(me);
  saveMN(list);

  // Giảm kho vải mộc
  const loMocs = getLoMoc();
  const loMoc = loMocs.find((l: any) => l.maLoMoc === data.maLoMoc);
  if (loMoc) loMoc.trangThai = "Đang nhuộm";
  saveCollection("mimin_lo_moc", "LO_MOC", loMocs);

  ghiLog({
    loaiPhieu: "XUAT_NHUOM", maPhieu: me.id, loaiKho: "MOC", loaiAction: "XUAT",
    maLo: data.maLoMoc, soKg: tongKg,
    tuKho: "Kho Vải Mộc", denKho: data.xuongNhuom,
    nguoiThucHien: user?.name || "system",
    ghiChu: `Mẻ nhuộm ${me.id} - ${data.danhSachMau.length} màu: ${data.danhSachMau.map((m) => m.mau).join(", ")}`,
  });

  logAudit({
    user, action: "create", module: "kho-soi",
    description: `Mẻ nhuộm ${me.id}: ${tongKg}kg mộc → ${data.xuongNhuom} (${data.danhSachMau.length} màu)`,
    resourceId: me.id, success: true,
  });

  return { ok: true, me, message: `✅ Tạo mẻ nhuộm ${me.id}: ${tongKg}kg, ${data.danhSachMau.length} màu` };
}

export function xacNhanNhuomNhanMoc(
  meNhuomId: string,
  data: { soKgMocNhan: number; soCayMocNhan: number; danhSachMau: MauNhuom[]; chungTu: ChungTuSanXuat[] },
  user: any
): { ok: boolean; message: string } {
  const list = getMN();
  const me = list.find((item) => item.id === meNhuomId);
  if (!me) return { ok: false, message: "Không tìm thấy mẻ nhuộm" };
  if (data.soKgMocNhan <= 0 || data.soCayMocNhan <= 0) return { ok: false, message: "Số kg và số cây nhận phải lớn hơn 0" };
  const tongKgPhan = data.danhSachMau.reduce((sum, item) => sum + item.soKg, 0);
  const tongCayPhan = data.danhSachMau.reduce((sum, item) => sum + (item.soCay || 0), 0);
  if (Math.abs(tongKgPhan - data.soKgMocNhan) > 0.01 || tongCayPhan !== data.soCayMocNhan) {
    return { ok: false, message: `Phải phân đủ ${data.soKgMocNhan}kg và ${data.soCayMocNhan} cây cho các màu` };
  }
  if (data.danhSachMau.some((item) => !item.mau.trim() || item.soKg <= 0 || (item.soCay || 0) <= 0)) {
    return { ok: false, message: "Mỗi màu phải có tên màu, số kg và số cây" };
  }
  const haoHutBanGiaoMocKg = Math.max((me.soKgMocGiao ?? me.tongKgXuat) - data.soKgMocNhan, 0);
  saveMN(list.map((item) => item.id === meNhuomId ? {
    ...item,
    soKgMocNhan: data.soKgMocNhan,
    soCayMocNhan: data.soCayMocNhan,
    danhSachMau: data.danhSachMau,
    tongKgXuat: data.soKgMocNhan,
    ngayXacNhanNhanMoc: new Date().toISOString().slice(0, 10),
    haoHutBanGiaoMocKg,
    chungTuNhanMoc: data.chungTu,
    trangThai: "Đang nhuộm" as const,
  } : item));
  logAudit({
    user, action: "update", module: "kho-soi",
    description: `${meNhuomId}: nhuộm nhận ${data.soKgMocNhan}kg/${data.soCayMocNhan} cây, phân ${data.danhSachMau.length} màu`,
    resourceId: meNhuomId, success: true,
  });
  return { ok: true, message: `Đã nhận và phân đủ ${data.soKgMocNhan}kg/${data.soCayMocNhan} cây` };
}

// ============ BƯỚC 5: NGHIỆM THU VẢI MÀU (TỪNG MÀU RIÊNG) ============
export interface NghiemThuMau {
  mau: string;
  soKgMocGiao: number;
  soKgMauNhan: number;
  soCayNhan: number;
  soKgLoi: number;
  donGiaNhuom: number;
  chiPhiHoaChat: number;
  chiPhiHoanThien: number;
  chiPhiPhatSinh: number;
  daThanhToan: number;
  haoHutKg?: number;
  haoHutPt?: number;
  tienNhuom?: number;
  tongChiPhi?: number;
}

export interface PhieuNghiemThuMau {
  id: string;             // NTM_001
  meNhuomId: string;      // MN_001
  ngayNghiemThu: string;
  danhSachMau: NghiemThuMau[]; // MỖI MÀU RIÊNG
  tongCong: number;
  congNoXuong: number;
  nguoiPhuTrach: string;
  ghiChu: string;
  chungTu?: ChungTuSanXuat[];
}

const NTM_KEY = "mimin_phieu_nghiem_thu_mau";
function getNTM(): PhieuNghiemThuMau[] {
  if (typeof window === "undefined") return [];
  try { const r = localStorage.getItem(NTM_KEY); if (r) return JSON.parse(r); } catch {}
  return [];
}
function saveNTM(data: PhieuNghiemThuMau[]) { saveCollection(NTM_KEY, "NGHIEM_THU_MAU", data); }

export function nghiemThuMau_V2(
  meNhuomId: string,
  danhSachMau: NghiemThuMau[],
  nguoiPhuTrach: string,
  user: any,
  chungTu: ChungTuSanXuat[] = []
): { ok: boolean; phieu?: PhieuNghiemThuMau; message: string; chiTiet: any[] } {
  // Tính từng màu
  const chiTiet = danhSachMau.map((m) => {
    const haoHutKg = m.soKgMocGiao - m.soKgMauNhan;
    const haoHutPt = m.soKgMocGiao > 0 ? (haoHutKg / m.soKgMocGiao) * 100 : 0;
    const tienNhuom = m.soKgMocGiao * m.donGiaNhuom;
    const tongChiPhi = tienNhuom + m.chiPhiHoaChat + m.chiPhiHoanThien + m.chiPhiPhatSinh;
    return { ...m, haoHutKg, haoHutPt, tienNhuom, tongChiPhi };
  });
  const tongCong = chiTiet.reduce((s, c) => s + c.tongChiPhi, 0);
  const tongDaTra = chiTiet.reduce((s, c) => s + c.daThanhToan, 0);
  const congNo = tongCong - tongDaTra;

  const phieu: PhieuNghiemThuMau = {
    id: `NTM_${Date.now().toString().slice(-6)}_${Math.random().toString(36).slice(-3).toUpperCase()}`,
    meNhuomId, ngayNghiemThu: new Date().toISOString().slice(0, 10),
    danhSachMau: chiTiet, tongCong, congNoXuong: congNo, nguoiPhuTrach,
    ghiChu: "", chungTu,
  };
  const list = getNTM();
  list.unshift(phieu);
  saveNTM(list);

  // Update trạng thái mẻ nhuộm
  const listMN = getMN();
  saveMN(listMN.map((m) => m.id === meNhuomId ? { ...m, trangThai: "Hoàn thành" as const } : m));

  logAudit({
    user, action: "update", module: "kho-soi",
    description: `Nghiệm thu nhuộm ${meNhuomId}: ${danhSachMau.length} màu. Tổng chi phí ${tongCong.toLocaleString()}đ, công nợ ${congNo.toLocaleString()}đ`,
    resourceId: phieu.id, success: true,
  });

  return { ok: true, phieu, chiTiet, message: `✅ Nghiệm thu ${danhSachMau.length} màu. Tổng chi phí: ${tongCong.toLocaleString()}đ, còn nợ: ${congNo.toLocaleString()}đ` };
}

// ============ BƯỚC 6: GIÁ VỐN VẢI THÀNH PHẨM (TÍNH RIÊNG TỪNG MÀU) ============
export interface GiaVonMau {
  mau: string;
  // Phân bổ chi phí
  chiSoi: number;             // (Sợi phân bổ theo tỷ lệ kg)
  chiDet: number;             // Từ lệnh dệt
  chiNhuom: number;           // Từ nghiệm thu màu (riêng từng màu)
  chiHoaChat: number;         // Riêng từng màu
  chiHoanThien: number;
  chiPhatSinh: number;
  tongCong: number;
  // Sản lượng
  kgThanhPham: number;        // Kg vải màu nhận
  // Kết quả
  giaVonPerKg: number;        // = tongCong / kgThanhPham
}

/**
 * Tính giá vốn RIÊNG từng màu (KHÔNG dùng giá trung bình toàn mẻ)
 * Công thức: (Giá trị sợi phân bổ + Dệt + Nhuộm + Hóa chất + Hoàn thiện + Phát sinh) / Kg vải TP
 */
export function tinhGiaVonTungMau(
  phieuNhapSoi: PhieuNhapSoi,        // PNS gốc
  lenhDet: LenhDet,                  // LD gốc
  nghiemThuMau: PhieuNghiemThuMau,   // NTM
  chiSoiPhanBo: number               // Tổng chi sợi của cả lô (chia theo tỷ lệ kg)
): GiaVonMau[] {
  return nghiemThuMau.danhSachMau.map((m) => {
    // Tỷ lệ kg màu này / tổng kg mẻ
    const tongKgMe = nghiemThuMau.danhSachMau.reduce((s, x) => s + x.soKgMauNhan, 0);
    const tyLe = tongKgMe > 0 ? m.soKgMauNhan / tongKgMe : 0;

    // Phân bổ chi sợi theo tỷ lệ
    const chiSoiMau = chiSoiPhanBo * tyLe;
    // Phân bổ chi dệt theo tỷ lệ
    const chiDetMau = (lenhDet.soKgGiao * lenhDet.donGiaDet) * tyLe;
    // Chi nhuộm riêng từng màu
    const chiNhuomMau = (m as any).tienNhuom || (m.soKgMocGiao * m.donGiaNhuom);
    const chiHCMau = m.chiPhiHoaChat;
    const chiHoanThien = m.chiPhiHoanThien;
    const chiPS = m.chiPhiPhatSinh;

    const tongCong = chiSoiMau + chiDetMau + chiNhuomMau + chiHCMau + chiHoanThien + chiPS;
    const giaVonPerKg = m.soKgMauNhan > 0 ? tongCong / m.soKgMauNhan : 0;

    return {
      mau: m.mau, chiSoi: chiSoiMau, chiDet: chiDetMau,
      chiNhuom: chiNhuomMau, chiHoaChat: chiHCMau, chiHoanThien, chiPhatSinh: chiPS,
      tongCong, kgThanhPham: m.soKgMauNhan, giaVonPerKg,
    };
  });
}

// ============ BƯỚC 7: NHẬP KHO VẢI THÀNH PHẨM (QUẢN LÝ TỪNG CÂY) ============
export interface CayVai {
  stt: number;             // 01, 02, 03
  kg: number;              // 19.6, 20.3, 18.9
}

export interface LoVaiTP {
  id: string;              // LTP_001
  ngayNhap: string;
  meNhuomId: string;       // MN_001
  nghiemThuMauId: string;  // NTM_001
  loaiVai: string;
  mau: string;
  maMau: string;           // M-DEN-001
  maLo: string;            // LTP-001-DEN
  tongKg: number;
  danhSachCay: CayVai[];   // TỪNG CÂY RIÊNG
  giaVonPerKg: number;
  tongGiaTri: number;
  kho: string;             // Kho Vải TP
  khu: string;             // Khu A (đạt) / B (chờ kiểm) / C (lỗi) / D (giữ riêng) / E (trả về)
  ke: string;              // A03
  tang: string;            // Tầng 2
  viTri: string;           // Vị trí cụ thể
  trangThaiChatLuong: "Đạt" | "Chờ kiểm" | "Lỗi" | "Giữ riêng" | "Trả về";
  nguoiPhuTrach: string;
  ghiChu: string;
  khoa: boolean;           // true = đã khóa giá vốn
  chungTuNhapKho?: ChungTuSanXuat[];
}

const LTP_KEY = "mimin_lo_vai_tp";
function getLTP(): LoVaiTP[] {
  if (typeof window === "undefined") return [];
  try { const r = localStorage.getItem(LTP_KEY); if (r) return JSON.parse(r); } catch {}
  return [];
}
function saveLTP(data: LoVaiTP[]) { saveCollection(LTP_KEY, "LO_VAI_TP", data); }

export function nhapKhoVaiTP(
  data: Omit<LoVaiTP, "id" | "tongKg" | "tongGiaTri" | "khoa">,
  user: any
): { ok: boolean; lo?: LoVaiTP; message: string } {
  const tongKg = data.danhSachCay.reduce((s, c) => s + c.kg, 0);
  const lo: LoVaiTP = {
    ...data, id: `LTP_${Date.now().toString().slice(-6)}_${Math.random().toString(36).slice(-3).toUpperCase()}`,
    tongKg, tongGiaTri: tongKg * data.giaVonPerKg, khoa: true, // Khóa giá vốn ngay khi nhập
  };
  const list = getLTP();
  list.unshift(lo);
  saveLTP(list);

  ghiLog({
    loaiPhieu: "NHAP_TP", maPhieu: lo.id, loaiKho: "TP", loaiAction: "NHAP",
    maLo: lo.maLo, soKg: tongKg, soCay: data.danhSachCay.length,
    denKho: `${data.kho}/${data.khu}/${data.ke}/${data.tang}`,
    nguoiThucHien: user?.name || "system", ghiChu: data.ghiChu,
  });

  logAudit({
    user, action: "create", module: "kho-soi",
    description: `Nhập kho vải TP ${lo.maLo}: ${tongKg}kg, ${data.danhSachCay.length} cây, ${data.mau}. Vị trí: ${data.kho}/${data.khu}/${data.ke}/${data.tang}. Giá vốn ${data.giaVonPerKg.toFixed(0)}đ/kg. Đã khóa giá vốn.`,
    resourceId: lo.id, success: true,
  });

  return { ok: true, lo, message: `✅ Nhập kho ${tongKg}kg vải ${data.mau} (${data.danhSachCay.length} cây). Vị trí: ${data.khu}/${data.ke}/${data.tang}. Giá vốn ${data.giaVonPerKg.toFixed(0)}đ/kg (đã khóa)` };
}

// ============ CẤU TRÚC KHO VẢI TP ============
export const KHU_KHO_TP = {
  "Kho Vải TP": {
    "Khu A": { moTa: "Vải đạt chất lượng", tuDongDung: true },
    "Khu B": { moTa: "Chờ kiểm tra", tuDongDung: false },
    "Khu C": { moTa: "Vải lỗi", tuDongDung: false },
    "Khu D": { moTa: "Hàng giữ riêng", tuDongDung: false },
    "Khu E": { moTa: "Hàng trả về", tuDongDung: false },
  },
};

// ============ BƯỚC 8: TRUY NGƯỢC LÔ (TRACEABILITY) ============
export interface TruyNguoc {
  loVaiTP: LoVaiTP;
  phieuNghiemThuMau: PhieuNghiemThuMau;
  meNhuom: MeNhuom;
  loMoc: unknown;
  lenhDet: LenhDet;
  phieuNhapSoi: PhieuNhapSoi;
  loSoi: unknown;
}

/**
 * Truy ngược: Vải TP → Mẻ nhuộm → Vải mộc → Lệnh dệt → Lô sợi → NCC
 */
export function truyNguocLo(loVaiTPId: string): TruyNguoc | null {
  const ltps = getLTP();
  const ltp = ltps.find((l) => l.id === loVaiTPId);
  if (!ltp) return null;

  const ntms = getNTM();
  const ntm = ntms.find((n) => n.id === ltp.nghiemThuMauId);
  if (!ntm) return null;

  const mns = getMN();
  const mn = mns.find((m) => m.id === ntm.meNhuomId);
  if (!mn) return null;

  const lds = getLD();
  const ld = lds.find((l) => l.maLoSoi === mn.maLoMoc || l.id === mn.maLoMoc);
  // Nếu không match trực tiếp, tìm qua log

  const pnss = getPNS();
  const pns = pnss.find((p) => ld ? p.maLoSoi === ld.maLoSoi : false);

  const loSois = JSON.parse(localStorage.getItem("mimin_lo_soi") || "[]");
  const loSoi = loSois.find((l: any) => ld && l.maLoSoi === ld.maLoSoi);

  const loMocs = JSON.parse(localStorage.getItem("mimin_lo_moc") || "[]");
  const loMoc = loMocs.find((l: any) => l.maLoMoc === mn.maLoMoc);

  return {
    loVaiTP: ltp, phieuNghiemThuMau: ntm, meNhuom: mn,
    loMoc, lenhDet: ld || ({} as LenhDet),
    phieuNhapSoi: pns || ({} as PhieuNhapSoi), loSoi,
  };
}

// ============ GETTERS ============
export function getAllPhieuNhapSoi() { return getPNS(); }
export function getAllLenhDet() { return getLD(); }
export function getAllMeNhuom() { return getMN(); }
export function getAllPhieuNghiemThuMau() { return getNTM(); }
export function getAllLoVaiTP() { return getLTP(); }
export function getAllKhoLog() { return getLogs(); }

// ============ HELPERS ============
function getLoSoi() {
  try { return JSON.parse(localStorage.getItem("mimin_lo_soi") || "[]"); } catch { return []; }
}
function getLoMoc() {
  try { return JSON.parse(localStorage.getItem("mimin_lo_moc") || "[]"); } catch { return []; }
}

// ============ CÔNG NỢ GIA CÔNG ============
export interface CongNoGiaCong {
  doiTuong: string;        // NCC-01 / DNT Dệt Bắc Ninh / Cty Nhuộm Hà Đông
  loai: "NCC sợi" | "Xưởng dệt" | "Xưởng nhuộm";
  tongPhatSinh: number;
  daThanhToan: number;
  conNo: number;
  chiTiet: unknown[];      // Danh sách phiếu liên quan
}

export function baoCaoCongNoGiaCong(): CongNoGiaCong[] {
  const result: Record<string, CongNoGiaCong> = {};

  // NCC sợi
  getPNS().forEach((p) => {
    if (!result[p.tenNCC]) result[p.tenNCC] = {
      doiTuong: p.tenNCC, loai: "NCC sợi",
      tongPhatSinh: 0, daThanhToan: 0, conNo: 0, chiTiet: [],
    };
    result[p.tenNCC].tongPhatSinh += p.thanhTien;
    result[p.tenNCC].daThanhToan += p.daThanhToan;
    result[p.tenNCC].conNo += p.conCongNo;
    result[p.tenNCC].chiTiet.push({ id: p.id, ngay: p.ngayNhap, no: p.conCongNo });
  });

  // Xưởng dệt
  getLD().forEach((l) => {
    if (l.congNoXuong === undefined) return;
    if (!result[l.xuongDet]) result[l.xuongDet] = {
      doiTuong: l.xuongDet, loai: "Xưởng dệt",
      tongPhatSinh: 0, daThanhToan: 0, conNo: 0, chiTiet: [],
    };
    result[l.xuongDet].tongPhatSinh += (l.soKgGiao * l.donGiaDet) + (l.chiPhiPhatSinh || 0);
    result[l.xuongDet].daThanhToan += l.daThanhToan || 0;
    result[l.xuongDet].conNo += l.congNoXuong;
    result[l.xuongDet].chiTiet.push({ id: l.id, ngay: l.ngayGiao, no: l.congNoXuong });
  });

  // Xưởng nhuộm
  getNTM().forEach((n) => {
    if (!result[n.nguoiPhuTrach]) result[n.nguoiPhuTrach] = {
      doiTuong: n.nguoiPhuTrach, loai: "Xưởng nhuộm",
      tongPhatSinh: 0, daThanhToan: 0, conNo: 0, chiTiet: [],
    };
    result[n.nguoiPhuTrach].tongPhatSinh += n.tongCong;
    const daTra = n.danhSachMau.reduce((s, m) => s + m.daThanhToan, 0);
    result[n.nguoiPhuTrach].daThanhToan += daTra;
    result[n.nguoiPhuTrach].conNo += n.congNoXuong;
    result[n.nguoiPhuTrach].chiTiet.push({ id: n.id, ngay: n.ngayNghiemThu, no: n.congNoXuong });
  });

  return Object.values(result);
}

// ============ BÁO CÁO HAO HỤT ============
export interface HaoHutReport {
  loai: "Bàn giao sợi" | "Dệt" | "Bàn giao mộc" | "Nhuộm";
  maPhieu: string;
  ngay: string;
  dauVao: number;
  dauRa: number;
  haoHutKg: number;
  haoHutPt: number;
  canhBao: "Xanh" | "Vàng" | "Đỏ";
}

export function baoCaoHaoHut(): HaoHutReport[] {
  const result: HaoHutReport[] = [];

  getLD().forEach((l) => {
    if (l.soKgXuongXacNhan === undefined) return;
    const haoHutKg = l.soKgGiao - l.soKgXuongXacNhan;
    const haoHutPt = l.soKgGiao > 0 ? (haoHutKg / l.soKgGiao) * 100 : 0;
    result.push({
      loai: "Bàn giao sợi", maPhieu: l.id, ngay: l.ngayXacNhanNhanSoi || l.ngayGiao,
      dauVao: l.soKgGiao, dauRa: l.soKgXuongXacNhan, haoHutKg, haoHutPt,
      canhBao: haoHutKg === 0 ? "Xanh" : haoHutPt <= 1 ? "Vàng" : "Đỏ",
    });
  });

  // Hao hụt dệt
  getLD().forEach((l) => {
    if (l.haoHutPt === undefined) return;
    const canhBao: "Xanh" | "Vàng" | "Đỏ" =
      l.haoHutPt <= 4 ? "Xanh" :
      l.haoHutPt <= 10 ? "Vàng" : "Đỏ";
    result.push({
      loai: "Dệt", maPhieu: l.id, ngay: l.ngayGiao,
      dauVao: l.soKgXuongXacNhan ?? l.soKgGiao, dauRa: l.soKgMocNhan || 0,
      haoHutKg: l.haoHutKg || 0, haoHutPt: l.haoHutPt, canhBao,
    });
  });

  // Hao hụt nhuộm (từng màu)
  getNTM().forEach((n) => {
    n.danhSachMau.forEach((m) => {
      const haoHutKg = m.haoHutKg ?? (m.soKgMocGiao - m.soKgMauNhan);
      const haoHutPt = m.haoHutPt ?? (m.soKgMocGiao > 0 ? (haoHutKg / m.soKgMocGiao) * 100 : 0);
      const canhBao: "Xanh" | "Vàng" | "Đỏ" =
        haoHutPt <= 2 ? "Xanh" :
        haoHutPt <= 5 ? "Vàng" : "Đỏ";
      result.push({
        loai: "Nhuộm", maPhieu: `${n.id}-${m.mau}`, ngay: n.ngayNghiemThu,
        dauVao: m.soKgMocGiao, dauRa: m.soKgMauNhan,
        haoHutKg, haoHutPt, canhBao,
      });
    });
  });

  getMN().forEach((m) => {
    if (m.soKgMocNhan === undefined) return;
    const loMoc = getLoMoc().find((item: { maLoMoc?: string; soKg?: number }) => item.maLoMoc === m.maLoMoc);
    const dauVao = loMoc?.soKg || m.tongKgXuat;
    const haoHutKg = Math.max(dauVao - m.soKgMocNhan, 0);
    const haoHutPt = dauVao > 0 ? (haoHutKg / dauVao) * 100 : 0;
    result.push({
      loai: "Bàn giao mộc", maPhieu: m.id, ngay: m.ngayXacNhanNhanMoc || m.ngayGiao,
      dauVao, dauRa: m.soKgMocNhan, haoHutKg, haoHutPt,
      canhBao: haoHutKg === 0 ? "Xanh" : haoHutPt <= 1 ? "Vàng" : "Đỏ",
    });
  });

  return result;
}
