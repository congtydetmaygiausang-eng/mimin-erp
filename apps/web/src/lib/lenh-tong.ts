// Lệnh dệt-nhuộm TỔNG - 1 form duy nhất tạo cả chuỗi
// Tự động: nhập sợi → tạo lệnh dệt → tạo mẻ nhuộm → tạo lô vải TP → 3 công nợ

import {
  nhapKhoSoi_V2, taoLenhDet, taoMeNhuom, nhapKhoVaiTP,
  getAllPhieuNhapSoi, getAllLenhDet, getAllMeNhuom, getAllLoVaiTP,
  type PhieuNhapSoi, type LenhDet, type MeNhuom, type LoVaiTP,
} from "./yarn-production-chain";
import { logAudit } from "./audit-log";

// ============ NOTIFICATION SYSTEM ============
export interface Notification {
  id: string;
  thoiGian: string;
  cho: string;            // "Kho sợi" / "Xưởng dệt" / "Xưởng nhuộm" / "Kho TP" / "Kế toán"
  loai: "lenh-moi" | "nghiem-thu" | "hoan-thanh" | "canh-bao";
  tieuDe: string;
  noiDung: string;
  maThamChieu: string;   // Lệnh tổng ID
  daDoc: boolean;
}

const NOTIF_KEY = "mimin_notifications";

function getNotifications(): Notification[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(NOTIF_KEY) || "[]"); } catch { return []; }
}

function pushNotification(cho: string, loai: Notification["loai"], tieuDe: string, noiDung: string, maThamChieu: string) {
  const list = getNotifications();
  list.unshift({
    id: `NOTIF_${Date.now()}_${Math.random().toString(36).slice(-4)}`,
    thoiGian: new Date().toISOString(),
    cho, loai, tieuDe, noiDung, maThamChieu,
    daDoc: false,
  });
  localStorage.setItem(NOTIF_KEY, JSON.stringify(list.slice(0, 100)));
}

export function getNotificationsByRole(role: string): Notification[] {
  return getNotifications().filter((n) => n.cho === role);
}

export function markNotificationRead(id: string) {
  const list = getNotifications();
  const newList = list.map((n) => n.id === id ? { ...n, daDoc: true } : n);
  localStorage.setItem(NOTIF_KEY, JSON.stringify(newList));
}

export function clearAllNotifications() {
  localStorage.setItem(NOTIF_KEY, JSON.stringify([]));
}

// ============ LỆNH DỆT-NHUỘM TỔNG ============
export interface LenhTong {
  // Bước 1: Sợi
  ncc: string;              // Tên NCC
  loaiSoi: string;          // Cotton 32s
  maLoSoi: string;          // LSOI-001
  soKgSoi: number;          // 1000kg
  donGiaSoi: number;        // 130,000đ/kg
  // Bước 2: Dệt
  xuongDet: string;         // DNT Dệt Bắc Ninh
  donGiaDet: number;        // 8,000đ/kg
  // Bước 3: Nhuộm (1 lệnh có thể nhiều màu)
  xuongNhuom: string;       // Cty Nhuộm Hà Đông
  danhSachMau: {
    mau: string;
    soKg: number;
    donGiaNhuom: number;
    chiPhiHoaChat: number;
  }[];
  // Bước 4: Kho vải TP
  kho: string;              // Kho Vải TP
  khu: string;              // Khu A
  ke: string;               // A03
  // Thông tin chung
  ngayTao: string;
  nguoiTao: string;
  ghiChu: string;
}

export interface LenhTongResult {
  ok: boolean;
  message: string;
  maLenhTong: string;        // LDT_001
  phieuNhapSoiId?: string;
  lenhDetId?: string;
  meNhuomId?: string;
  loVaiTPIds?: string[];
  // Chi phí
  chiPhi: {
    chiSoi: number;
    chiDet: number;
    chiNhuom: number;
    chiHoaChat: number;
    tongCong: number;
  };
  // Công nợ
  congNo: {
    ncc: number;
    xuongDet: number;
    xuongNhuom: number;
    tongCongNo: number;
  };
}

/**
 * TẠO LỆNH DỆT-NHUỘM TỔNG - 1 lần tạo cả chuỗi
 */
export function taoLenhTong(data: LenhTong, user: any): LenhTongResult {
  const maLenhTong = `LDT_${Date.now().toString().slice(-6)}`;

  // 1. Nhập kho sợi
  const pns = nhapKhoSoi_V2({
    ngayNhap: data.ngayTao,
    nccId: data.ncc, tenNCC: data.ncc,
    loaiSoi: `SOI-${data.loaiSoi.replace(/\s/g, "")}`,
    tenSoi: `Sợi ${data.loaiSoi}`,
    maLoSoi: data.maLoSoi,
    soKg: data.soKgSoi, donGia: data.donGiaSoi,
    daThanhToan: 0, khoNhap: "Kho Sợi",
    nguoiPhuTrach: data.nguoiTao, ghiChu: data.ghiChu, khoa: false,
  } as any, user);
  if (!pns.ok) return { ok: false, message: pns.message, maLenhTong, chiPhi: { chiSoi: 0, chiDet: 0, chiNhuom: 0, chiHoaChat: 0, tongCong: 0 }, congNo: { ncc: 0, xuongDet: 0, xuongNhuom: 0, tongCongNo: 0 } };

  // 2. Tạo lệnh dệt
  const ld = taoLenhDet({
    ngayGiao: data.ngayTao,
    ngayDuKienNhan: new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10),
    xuongDet: data.xuongDet, maLoSoi: data.maLoSoi, loaiSoi: data.loaiSoi,
    soKgGiao: data.soKgSoi, donGiaDet: data.donGiaDet, tienDuKien: data.soKgSoi * data.donGiaDet, soMetDuKien: data.soKgSoi * 4,
    nguoiPhuTrach: data.nguoiTao, ghiChu: `Lệnh tổng ${maLenhTong}`,
  }, user);
  if (!ld.ok) return { ok: false, message: ld.message, maLenhTong, phieuNhapSoiId: pns.phieu?.id, chiPhi: { chiSoi: 0, chiDet: 0, chiNhuom: 0, chiHoaChat: 0, tongCong: 0 }, congNo: { ncc: 0, xuongDet: 0, xuongNhuom: 0, tongCongNo: 0 } };

  // 3. Tạo mẻ nhuộm với nhiều màu (chỉ khi đã có lệnh dệt)
  let meNhuomId: string | undefined;
  const tongKgMau = data.danhSachMau.reduce((s, m) => s + m.soKg, 0);
  if (data.danhSachMau.length > 0) {
    const mn = taoMeNhuom({
      ngayGiao: data.ngayTao,
      ngayDuKienNhan: new Date(Date.now() + 14 * 86400_000).toISOString().slice(0, 10),
      xuongNhuom: data.xuongNhuom,
      maLoMoc: `LM-${ld.lenh?.id}`,
      danhSachMau: data.danhSachMau.map((m) => ({
        mau: m.mau, soKg: m.soKg, donGiaNhuom: m.donGiaNhuom,
      })),
      nguoiPhuTrach: data.nguoiTao,
      ghiChu: `Mẻ nhuộm từ lệnh tổng ${maLenhTong}`,
    }, user);
    if (mn.ok) meNhuomId = mn.me?.id;
  }

  // 4. Tính chi phí
  const chiSoi = data.soKgSoi * data.donGiaSoi;
  const chiDet = data.soKgSoi * data.donGiaDet;
  const chiNhuom = data.danhSachMau.reduce((s, m) => s + m.soKg * m.donGiaNhuom, 0);
  const chiHoaChat = data.danhSachMau.reduce((s, m) => s + m.chiPhiHoaChat, 0);
  const tongCong = chiSoi + chiDet + chiNhuom + chiHoaChat;

  // 5. Tính công nợ (3 bên)
  const congNoNCC = chiSoi; // NCC sợi
  const congNoDet = chiDet; // Xưởng dệt
  const congNoNhuom = chiNhuom + chiHoaChat; // Xưởng nhuộm
  const tongCongNo = congNoNCC + congNoDet + congNoNhuom;

  // 6. Push notifications cho các khâu
  pushNotification(
    "Kho sợi", "lenh-moi",
    `🆕 Lệnh dệt-nhuộm tổng mới: ${maLenhTong}`,
    `Có lệnh mới từ ${data.nguoiTao}. Cần chuẩn bị ${data.soKgSoi}kg sợi ${data.loaiSoi} (lô ${data.maLoSoi})`,
    maLenhTong
  );

  pushNotification(
    "Xưởng dệt", "lenh-moi",
    `🆕 Lệnh dệt mới: ${ld.lenh?.id}`,
    `${data.soKgSoi}kg sợi ${data.loaiSoi} → ${data.xuongDet}. Đơn giá: ${data.donGiaDet.toLocaleString()}đ/kg`,
    maLenhTong
  );

  if (meNhuomId) {
    pushNotification(
      "Xưởng nhuộm", "lenh-moi",
      `🆕 Mẻ nhuộm mới: ${meNhuomId}`,
      `${tongKgMau}kg mộc → ${data.xuongNhuom}. ${data.danhSachMau.length} màu: ${data.danhSachMau.map((m) => m.mau).join(", ")}`,
      maLenhTong
    );
  }

  pushNotification(
    "Kho TP", "lenh-moi",
    `🆕 Lô vải TP sẽ về kho ${data.kho}/${data.khu}`,
    `Sau khi nhuộm xong, sẽ nhập vào kho vải thành phẩm. Kho: ${data.kho} / Khu: ${data.khu} / Kệ: ${data.ke}`,
    maLenhTong
  );

  pushNotification(
    "Kế toán", "lenh-moi",
    `💰 Có 3 công nợ mới từ lệnh ${maLenhTong}`,
    `NCC sợi: ${congNoNCC.toLocaleString()}đ · Xưởng dệt: ${congNoDet.toLocaleString()}đ · Xưởng nhuộm: ${congNoNhuom.toLocaleString()}đ. Tổng: ${tongCongNo.toLocaleString()}đ`,
    maLenhTong
  );

  logAudit({
    user, action: "create", module: "kho-soi",
    description: `Tạo lệnh dệt-nhuộm tổng ${maLenhTong}: ${data.soKgSoi}kg sợi ${data.loaiSoi} → ${data.xuongDet} → ${data.xuongNhuom}. Tổng chi phí: ${tongCong.toLocaleString()}đ. Công nợ: NCC ${congNoNCC.toLocaleString()}đ, Dệt ${congNoDet.toLocaleString()}đ, Nhuộm ${congNoNhuom.toLocaleString()}đ`,
    resourceId: maLenhTong, success: true,
  });

  return {
    ok: true,
    message: `✅ Tạo lệnh tổng ${maLenhTong} thành công!\n• Phiếu nhập sợi: ${pns.phieu?.id}\n• Lệnh dệt: ${ld.lenh?.id}\n• Mẻ nhuộm: ${meNhuomId || "—"}\n• Tổng chi phí: ${tongCong.toLocaleString()}đ\n• 3 công nợ: ${tongCongNo.toLocaleString()}đ\n• 5 thông báo đã gửi`,
    maLenhTong,
    phieuNhapSoiId: pns.phieu?.id,
    lenhDetId: ld.lenh?.id,
    meNhuomId,
    chiPhi: { chiSoi, chiDet, chiNhuom, chiHoaChat, tongCong },
    congNo: { ncc: congNoNCC, xuongDet: congNoDet, xuongNhuom: congNoNhuom, tongCongNo },
  };
}

// ============ LẤY TẤT CẢ LỆNH TỔNG ============
export function getAllLenhTong(): any[] {
  try {
    return JSON.parse(localStorage.getItem("mimin_lenh_tong") || "[]");
  } catch { return []; }
}

export function saveLenhTong(item: any) {
  const list = getAllLenhTong();
  list.unshift(item);
  localStorage.setItem("mimin_lenh_tong", JSON.stringify(list.slice(0, 50)));
}
