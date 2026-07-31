// Yarn Inventory - Kho sợi + Mini Layout backend logic

import { logAudit } from "./audit-log";

export interface LoSoi {
  id: string;            // LSOI-001
  loaiSoi: string;       // SOI-COTTON-30
  tenSoi: string;
  nhaCungCap: string;
  soKgBanDau: number;    // 1000
  soKgConLai: number;     // 0 (đã dệt hết)
  ngayNhap: string;
  trangThai: "Tồn kho" | "Đang dệt" | "Hết" | "Hủy";
  qrCode: string;        // QR code for scanning
  ghiChu: string;
}

export interface XuatSoi {
  id: string;            // XS_001
  maLenhDet: string;     // DET_001
  loSoiId: string;        // LSOI-001
  loaiSoi: string;
  tenXuangDet: string;
  soKgXuat: number;       // 500
  ngayXuat: string;
  nguoiXuat: string;      // NV005
  tenNguoiXuat: string;
  ghiChu: string;
}

export interface NhapMoc {
  id: string;            // NM_001
  maLenhDet: string;     // DET_001
  ngayNhap: string;
  soCuon: number;         // 50 cuộn
  tongKgMoc: number;      // 450
  khoVai: number;         // 1.5m
  gsm: number;            // 180 g/m²
  nguoiNhap: string;      // NV006
  tenNguoiNhap: string;
  chatLuong: "Đạt" | "Kém" | "Cần kiểm tra";
  ghiChu: string;
}

const LO_SOI_KEY = "mimin_lo_soi";
const XUAT_SOI_KEY = "mimin_xuat_soi";
const NHAP_MOC_KEY = "mimin_nhap_moc";

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

// ============ MẪU DATA ============
export const MAU_LO_SOI: LoSoi[] = [
  { id: "LSOI-001", loaiSoi: "SOI-COTTON-30", tenSoi: "Sợi cotton 30s Compact", nhaCungCap: "Cty Sợi Việt Nam",
    soKgBanDau: 1000, soKgConLai: 0, ngayNhap: "2026-07-20", trangThai: "Hết",
    qrCode: "QR-LSOI-001", ghiChu: "Đã dệt xong cho LSX-2026-001 (M758) + LSX-2026-002 (M873)" },
  { id: "LSOI-002", loaiSoi: "SOI-COTTON-32", tenSoi: "Sợi cotton 32s Compact", nhaCungCap: "Cty Sợi Việt Nam",
    soKgBanDau: 800, soKgConLai: 350, ngayNhap: "2026-07-22", trangThai: "Đang dệt",
    qrCode: "QR-LSOI-002", ghiChu: "Đang dệt cho LSX-2026-003 (M111 Áo polo)" },
  { id: "LSOI-003", loaiSoi: "SOI-POLY-DTY", tenSoi: "Sợi Polyester DTY", nhaCungCap: "Cty Sợi Hưng Yên",
    soKgBanDau: 1500, soKgConLai: 1500, ngayNhap: "2026-07-24", trangThai: "Tồn kho",
    qrCode: "QR-LSOI-003", ghiChu: "Dự trữ cho LSX-2026-004 (M222)" },
  { id: "LSOI-004", loaiSoi: "SOI-CVC-655", tenSoi: "Sợi CVC 65/35 Cao cấp", nhaCungCap: "Cty Sợi Việt Nam",
    soKgBanDau: 600, soKgConLai: 600, ngayNhap: "2026-07-25", trangThai: "Tồn kho",
    qrCode: "QR-LSOI-004", ghiChu: "Chờ dệt LSX-2026-005 (M333 Áo sơ mi nữ)" },
  { id: "LSOI-005", loaiSoi: "SOI-KAKI", tenSoi: "Sợi Kaki cotton", nhaCungCap: "Cty Sợi Phong Phú",
    soKgBanDau: 700, soKgConLai: 700, ngayNhap: "2026-07-26", trangThai: "Tồn kho",
    qrCode: "QR-LSOI-005", ghiChu: "Chờ dệt LSX-2026-006 (M555 Quần kaki)" },
];

export const MAU_XUAT_SOI: XuatSoi[] = [
  { id: "XS_001", maLenhDet: "DET_001", loSoiId: "LSOI-001", loaiSoi: "SOI-COTTON-30",
    tenXuangDet: "DNT Dệt Bắc Ninh", soKgXuat: 1000, ngayXuat: "2026-07-21",
    nguoiXuat: "NV005", tenNguoiXuat: "Nguyễn Quốc Hậu (Kho)",
    ghiChu: "Xuất toàn bộ lô cho LSX-2026-001" },
  { id: "XS_002", maLenhDet: "DET_002", loSoiId: "LSOI-002", loaiSoi: "SOI-COTTON-32",
    tenXuangDet: "DNT Dệt Bắc Ninh", soKgXuat: 450, ngayXuat: "2026-07-23",
    nguoiXuat: "NV005", tenNguoiXuat: "Nguyễn Quốc Hậu (Kho)",
    ghiChu: "Xuất 450kg lô 2 cho LSX-2026-003 (M111 Áo polo)" },
];

export const MAU_NHAP_MOC: NhapMoc[] = [
  { id: "NM_001", maLenhDet: "DET_001", ngayNhap: "2026-07-24", soCuon: 50, tongKgMoc: 900,
    khoVai: 1.5, gsm: 180, nguoiNhap: "NV006", tenNguoiNhap: "Nguyễn Hoàng Giang (Cắt)",
    chatLuong: "Đạt", ghiChu: "Vải thun cotton 4 chiều, 1000kg sợi → 900kg mộc (10% hao hụt)" },
];

// ============ GETTERS ============
export function getLoSoi(): LoSoi[] { return getStorage(LO_SOI_KEY, MAU_LO_SOI); }
export function getXuatSoi(): XuatSoi[] { return getStorage(XUAT_SOI_KEY, MAU_XUAT_SOI); }
export function getNhapMoc(): NhapMoc[] { return getStorage(NHAP_MOC_KEY, MAU_NHAP_MOC); }

export function saveLoSoi(data: LoSoi[]) { setStorage(LO_SOI_KEY, data); }
export function saveXuatSoi(data: XuatSoi[]) { setStorage(XUAT_SOI_KEY, data); }
export function saveNhapMoc(data: NhapMoc[]) { setStorage(NHAP_MOC_KEY, data); }

// ============ XUẤT SỢI (Trừ kho tự động) ============
export function xuatSoiChoXuong(
  loSoiId: string, maLenhDet: string, soKgXuat: number, nguoiXuat: string, user: any
): { ok: boolean; message: string; xuatSoi?: XuatSoi } {
  const loSois = getLoSoi();
  const xuats = getXuatSoi();

  const lo = loSois.find((l) => l.id === loSoiId);
  if (!lo) return { ok: false, message: `Không tìm thấy lô sợi ${loSoiId}` };

  if (lo.soKgConLai < soKgXuat) {
    return { ok: false, message: `⚠️ Lô ${loSoiId} chỉ còn ${lo.soKgConLai}kg, không đủ ${soKgXuat}kg` };
  }

  // Trừ tồn sợi
  const newLoSois = loSois.map((l) => l.id === loSoiId ? {
    ...l,
    soKgConLai: l.soKgConLai - soKgXuat,
    trangThai: (l.soKgConLai - soKgXuat) === 0 ? "Hết" as const : "Đang dệt" as const,
  } : l);
  saveLoSoi(newLoSois);

  // Tạo phiếu xuất
  const xuat: XuatSoi = {
    id: `XS_${Date.now().toString().slice(-6)}`,
    maLenhDet, loSoiId, loaiSoi: lo.loaiSoi,
    tenXuangDet: "", soKgXuat, ngayXuat: new Date().toISOString().slice(0, 10),
    nguoiXuat, tenNguoiXuat: "", ghiChu: "",
  };
  const newXuats = [xuat, ...xuats];
  saveXuatSoi(newXuats);

  logAudit({
    user, action: "create", module: "kho-soi",
    description: `Xuất sợi ${soKgXuat}kg từ lô ${loSoiId} cho lệnh dệt ${maLenhDet}`,
    resourceId: loSoiId, success: true,
  });

  return { ok: true, message: `✅ Xuất ${soKgXuat}kg sợi từ ${loSoiId} cho ${maLenhDet}`, xuatSoi: xuat };
}

// ============ NHẬP MỘC (Vải thô thu về từ xưởng dệt) ============
export function nhapMoc(
  maLenhDet: string, soCuon: number, tongKgMoc: number, khoVai: number, gsm: number,
  nguoiNhap: string, user: any
): { ok: boolean; message: string; nhapMoc?: NhapMoc; tyLeHaoHut: number } {
  const xuats = getXuatSoi();
  const mocs = getNhapMoc();

  // Tính tổng kg sợi đã xuất cho lệnh dệt này
  const tongKgXuat = xuats
    .filter((x) => x.maLenhDet === maLenhDet)
    .reduce((s, x) => s + x.soKgXuat, 0);

  const tyLeHaoHut = tongKgXuat > 0 ? ((tongKgXuat - tongKgMoc) / tongKgXuat) * 100 : 0;

  // Tạo phiếu nhập mộc
  const moc: NhapMoc = {
    id: `NM_${Date.now().toString().slice(-6)}`,
    maLenhDet, ngayNhap: new Date().toISOString().slice(0, 10),
    soCuon, tongKgMoc, khoVai, gsm, nguoiNhap, tenNguoiNhap: "",
    chatLuong: tyLeHaoHut > 10 ? "Kém" : tyLeHaoHut > 4 ? "Cần kiểm tra" : "Đạt",
    ghiChu: `Hao hụt ${tyLeHaoHut.toFixed(1)}% (định mức ≤4%)`,
  };
  const newMocs = [moc, ...mocs];
  saveNhapMoc(newMocs);

  logAudit({
    user, action: "create", module: "kho-soi",
    description: `Nhập mộc ${tongKgMoc}kg từ lệnh dệt ${maLenhDet} (${soCuon} cuộn, ${khoVai}m, ${gsm} GSM)`,
    resourceId: maLenhDet, success: true,
  });

  return {
    ok: true,
    message: `✅ Nhập mộc ${tongKgMoc}kg (${soCuon} cuộn) từ ${maLenhDet}. Hao hụt: ${tyLeHaoHut.toFixed(1)}%`,
    nhapMoc: moc,
    tyLeHaoHut,
  };
}

// ============ THỐNG KÊ HAO HỤT THEO LỆNH DỆT ============
export interface ThongKeHaoHut {
  maLenhDet: string;
  tenXuongDet: string;
  tongKgXuat: number;
  tongKgMoc: number;
  tyLeHaoHut: number;     // % hao hụt
  dinhMuc: number;         // 4% định mức
  canhBao: "xanh" | "vang" | "do"; // xanh: ≤4%, vang: 4-10%, do: >10%
  soCuon: number;
  khoVai: number;
  gsm: number;
}

export function tinhThongKeHaoHut(): ThongKeHaoHut[] {
  const xuats = getXuatSoi();
  const mocs = getNhapMoc();
  const DinhMuc = 4; // % định mức hao hụt dệt

  // Group theo lệnh dệt
  const map: Record<string, ThongKeHaoHut> = {};

  // Tính tổng xuất theo lệnh
  for (const x of xuats) {
    if (!map[x.maLenhDet]) {
      map[x.maLenhDet] = {
        maLenhDet: x.maLenhDet,
        tenXuongDet: x.tenXuangDet,
        tongKgXuat: 0, tongKgMoc: 0, tyLeHaoHut: 0,
        dinhMuc: DinhMuc, canhBao: "xanh",
        soCuon: 0, khoVai: 0, gsm: 0,
      };
    }
    map[x.maLenhDet].tongKgXuat += x.soKgXuat;
  }

  // Tính tổng mộc theo lệnh
  for (const m of mocs) {
    if (!map[m.maLenhDet]) {
      map[m.maLenhDet] = {
        maLenhDet: m.maLenhDet, tenXuongDet: "",
        tongKgXuat: 0, tongKgMoc: 0, tyLeHaoHut: 0,
        dinhMuc: DinhMuc, canhBao: "xanh",
        soCuon: 0, khoVai: m.khoVai, gsm: m.gsm,
      };
    }
    map[m.maLenhDet].tongKgMoc += m.tongKgMoc;
    map[m.maLenhDet].soCuon += m.soCuon;
    if (m.khoVai) map[m.maLenhDet].khoVai = m.khoVai;
    if (m.gsm) map[m.maLenhDet].gsm = m.gsm;
  }

  // Tính % hao hụt + cảnh báo
  const results: ThongKeHaoHut[] = [];
  for (const k of Object.keys(map)) {
    const item = map[k];
    if (item.tongKgXuat > 0) {
      item.tyLeHaoHut = ((item.tongKgXuat - item.tongKgMoc) / item.tongKgXuat) * 100;
      item.canhBao = item.tyLeHaoHut <= DinhMuc ? "xanh" : item.tyLeHaoHut <= 10 ? "vang" : "do";
    }
    results.push(item);
  }

  return results.sort((a, b) => b.tyLeHaoHut - a.tyLeHaoHut);
}

// ============ BÁO CÁO TỔNG HỢP KHO SỢI ============
export interface BaoCaoKhoSoi {
  tongLo: number;          // tổng số lô
  tongKgBanDau: number;    // tổng kg ban đầu
  tongKgConLai: number;    // tổng kg còn lại
  tongKgDaDung: number;    // tổng kg đã dùng
  loHet: number;            // số lô hết
  loDangDung: number;       // số lô đang dùng
  loTon: number;            // số lô tồn
}

export function tinhBaoCaoKhoSoi(): BaoCaoKhoSoi {
  const loSois = getLoSoi();
  return {
    tongLo: loSois.length,
    tongKgBanDau: loSois.reduce((s, l) => s + l.soKgBanDau, 0),
    tongKgConLai: loSois.reduce((s, l) => s + l.soKgConLai, 0),
    tongKgDaDung: loSois.reduce((s, l) => s + (l.soKgBanDau - l.soKgConLai), 0),
    loHet: loSois.filter((l) => l.trangThai === "Hết").length,
    loDangDung: loSois.filter((l) => l.trangThai === "Đang dệt").length,
    loTon: loSois.filter((l) => l.trangThai === "Tồn kho").length,
  };
}
