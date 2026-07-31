// Lark Base API Integration - 2 chiều realtime sync
// Docs: https://open.larksuite.com/document/server-docs/docs/bitable-v1/overview

import type { PhieuWorkflow } from "./workflow-data";
import { setupMockFetchInterceptor } from "./lark-mock";

// ============ TYPES ============
export type LarkConfig = {
  appId: string;
  appSecret: string;
  baseToken: string;       // Base ID (app token)
  tableIds: {
    inTheuDap: string;     // INTD_xxx
    may: string;            // MAY_xxx
    khuyNut: string;        // KN_xxx
    ui: string;              // UI_xxx
    dongGoi: string;        // DG_xxx
  };
  webhookUrl?: string;      // URL để Lark gọi về khi có thay đổi
  syncMode: "one-way" | "two-way"; // Một chiều ERP→Lark hay 2 chiều
  enabled: boolean;
  useMock?: boolean;        // Dùng mock server (test khi chưa có credentials)
};

const STORAGE_KEY = "mimin_lark_config_v1";

export function getLarkConfig(): LarkConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LarkConfig;
  } catch {
    return null;
  }
}

export function saveLarkConfig(config: LarkConfig) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function isLarkEnabled(): boolean {
  const c = getLarkConfig();
  if (c?.useMock) return c.enabled; // Mock chỉ cần enabled=true
  return !!(c && c.enabled && c.appId && c.appSecret && c.baseToken);
}

// ============ AUTH ============
let cachedToken: { token: string; expireAt: number } | null = null;

async function getTenantAccessToken(): Promise<string> {
  const config = getLarkConfig();
  if (!config) throw new Error("Lark chưa được cấu hình");

  // Dùng cache nếu còn hạn
  if (cachedToken && cachedToken.expireAt > Date.now() + 60000) {
    return cachedToken.token;
  }

  const res = await fetch("https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_id: config.appId,
      app_secret: config.appSecret,
    }),
  });

  const data = await res.json();
  if (data.code !== 0) {
    throw new Error(`Lark auth failed: ${data.msg}`);
  }

  cachedToken = {
    token: data.tenant_access_token,
    expireAt: Date.now() + data.expire * 1000,
  };
  return cachedToken.token;
}

// ============ API CALLS ============
async function larkApi(endpoint: string, method: string, body?: any): Promise<any> {
  const token = await getTenantAccessToken();
  const config = getLarkConfig();
  const url = `https://open.larksuite.com/open-apis/bitable/v1${endpoint}?app_token=${config!.baseToken}`;

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (data.code !== 0) {
    throw new Error(`Lark API error (${endpoint}): ${data.msg}`);
  }
  return data.data;
}

// ============ MAPPING PHIẾU ↔ LARK FIELDS ============

// Mapping field names giữa ERP và Lark
// Trong Lark Base, mỗi cột có field_name (vd "ma_phieu", "so_luong_giao")
export const FIELD_MAP = {
  inTheuDap: {
    maPhieu: "ma_phieu",
    lenhSX: "ma_lenh_sx",
    maSP: "ma_san_pham",
    phanLoai: "cong_doan",       // In, Thêu, Dập
    mau: "mau",
    size: "size",
    soLuongGiao: "so_luong_giao",
    ngayGiao: "ngay_giao",
    nguoiGiao: "nguoi_giao",
    doiTacNhan: "doi_tac_nhan",
    hanTraHang: "han_tra_hang",
    soLuongNhan: "so_luong_nhan",
    soLuongDat: "so_luong_dat",
    soLuongLoi: "so_luong_loi",
    soLuongThieu: "so_luong_thieu",
    donGia: "don_gia",
    thanhTien: "thanh_tien",
    trangThai: "trang_thai",
    ghiChu: "ghi_chu",
    viTriIn: "vi_tri_thuc_hien",
  },
  may: {
    maPhieu: "ma_phieu",
    lenhSX: "ma_lenh_sx",
    maSP: "ma_san_pham",
    phanLoai: "loai_san_pham",   // Áo trụ, áo tròn, quần
    kieuMay: "kieu_may",
    mau: "mau",
    size: "size",
    soLuongGiao: "so_luong_giao",
    soBoGiao: "so_bo_giao",
    ngayGiao: "ngay_giao",
    nguoiGiao: "nguoi_giao",
    xuongNhan: "xuong_nhan_may",
    hanHoanThanh: "han_hoan_thanh",
    soLuongNhan: "so_luong_nhan_ve",
    soLuongDat: "so_luong_dat",
    soLuongLoi: "so_luong_loi",
    soLuongThieu: "so_luong_thieu",
    soLuongSua: "so_luong_sua_lai",
    donGia: "don_gia_may",
    thanhTien: "thanh_tien",
    daThanhToan: "tien_da_thanh_toan",
    conNo: "cong_no_con_lai",
    trangThai: "trang_thai",
    hinhAnh: "hinh_anh",
    ghiChu: "ghi_chu",
  },
  khuyNut: {
    maPhieu: "ma_phieu",
    lenhSX: "ma_lenh_sx",
    maPhieuMay: "ma_phieu_may",
    maSP: "ma_san_pham",
    mauSize: "mau_size",
    soLuongNhan: "so_luong_nhan",
    soLuongLamKhuy: "so_luong_lam_khuy",
    soLuongDinhNut: "so_luong_dinh_nut",
    soLuongDat: "so_luong_dat",
    soLuongLoi: "so_luong_loi",
    soLuongSua: "so_luong_sua_lai",
    soLuongGiaoUi: "so_luong_giao_ui",
    nguoiThucHien: "nguoi_thuc_hien",
    donGia: "don_gia",
    thanhTien: "thanh_tien",
    ngayNhan: "ngay_nhan",
    ngayHoanThanh: "ngay_hoan_thanh",
    nguoiNhanSau: "nguoi_nhan_cong_doan_sau",
    trangThai: "trang_thai",
    ghiChu: "ghi_chu",
  },
  ui: {
    maPhieu: "ma_phieu",
    lenhSX: "ma_lenh_sx",
    maSP: "ma_san_pham",
    phanLoai: "loai_san_pham",
    mauSize: "mau_size",
    soLuongNhan: "so_luong_nhan",
    soLuongDuBo: "so_luong_du_bo",
    soLuongChuaDu: "so_luong_chua_du_bo",
    soLuongDaUi: "so_luong_da_ui",
    soLuongDat: "so_luong_dat",
    soLuongLoi: "so_luong_loi",
    soLuongGiaoGap: "so_luong_giao_gap_xep",
    nguoiThucHien: "nguoi_thuc_hien",
    sanLuongTungNguoi: "san_luong_tung_nguoi",
    donGia: "don_gia",
    thanhTien: "thanh_tien",
    ngayNhan: "ngay_nhan",
    ngayHoanThanh: "ngay_hoan_thanh",
    trangThai: "trang_thai",
    ghiChu: "ghi_chu",
  },
  dongGoi: {
    maPhieu: "ma_phieu",
    lenhSX: "ma_lenh_sx",
    maSP: "ma_san_pham",
    phanLoai: "phan_loai",
    mau: "mau",
    size: "size",
    soLuongNhan: "so_luong_nhan",
    soLuongDaGap: "so_luong_da_gap",
    soLuongDongBao: "so_luong_dong_bao",
    soLuongDat: "so_luong_dat",
    soLuongLoi: "so_luong_loi",
    soLuongGiaoKho: "so_luong_giao_kho",
    nguoiThucHien: "nguoi_thuc_hien",
    sanLuongTungNguoi: "san_luong_tung_nguoi",
    donGia: "don_gia",
    thanhTien: "thanh_tien",
    loaiBaoBi: "loai_bao_bi",
    temSize: "tem_size",
    riDongHang: "ri_dong_hang",
    ngayThucHien: "ngay_thuc_hien",
    nguoiNhanKho: "nguoi_nhan_kho",
    trangThai: "trang_thai",
    hinhAnh: "hinh_anh",
    ghiChu: "ghi_chu",
  },
};

// Convert ERP phiếu → Lark record fields
function phieuToLarkFields(phieu: PhieuWorkflow): Record<string, any> {
  const prefix = phieu.id.split("_")[0];
  let map: any;
  if (prefix === "INTD") map = FIELD_MAP.inTheuDap;
  else if (prefix === "MAY") map = FIELD_MAP.may;
  else if (prefix === "KN") map = FIELD_MAP.khuyNut;
  else if (prefix === "UI") map = FIELD_MAP.ui;
  else if (prefix === "DG") map = FIELD_MAP.dongGoi;
  else return {};

  const fields: Record<string, any> = {};
  // Common
  if (map.maPhieu) fields[map.maPhieu] = phieu.id;
  if (map.lenhSX) fields[map.lenhSX] = phieu.lenhSX;
  if (map.maSP) fields[map.maSP] = phieu.maSP;
  if (map.phanLoai) fields[map.phanLoai] = phieu.phanLoai || "";
  if (map.mau) fields[map.mau] = phieu.mau || "";
  if (map.size) fields[map.size] = phieu.size || "";
  if (map.mauSize) fields[map.mauSize] = `${phieu.mau || ""} ${phieu.size || ""}`.trim();
  if (map.soLuongGiao) fields[map.soLuongGiao] = phieu.soLuongGiao;
  if (map.ngayGiao) fields[map.ngayGiao] = phieu.ngayGiao ? new Date(phieu.ngayGiao).getTime() : null;
  if (map.nguoiGiao) fields[map.nguoiGiao] = phieu.nguoiGiao;
  if (map.doiTacNhan) fields[map.doiTacNhan] = phieu.tenNguoiNhan;
  if (map.xuongNhan) fields[map.xuongNhan] = phieu.tenNguoiNhan;
  if (map.hanTraHang) fields[map.hanTraHang] = new Date(phieu.hanHoanThanh).getTime();
  if (map.hanHoanThanh) fields[map.hanHoanThanh] = new Date(phieu.hanHoanThanh).getTime();
  if (map.soLuongNhan) fields[map.soLuongNhan] = phieu.soLuongNhan;
  if (map.soLuongDat) fields[map.soLuongDat] = phieu.soLuongDat;
  if (map.soLuongLoi) fields[map.soLuongLoi] = phieu.soLuongLoi;
  if (map.soLuongThieu) fields[map.soLuongThieu] = phieu.soLuongThieu;
  if (map.soLuongSua) fields[map.soLuongSua] = phieu.soLuongSua;
  if (map.donGia) fields[map.donGia] = phieu.donGia;
  if (map.donGiaMay) fields[map.donGiaMay] = phieu.donGia;
  if (map.thanhTien) fields[map.thanhTien] = phieu.thanhTien;
  if (map.daThanhToan) fields[map.daThanhToan] = phieu.daThanhToan;
  if (map.conNo) fields[map.conNo] = phieu.conNo;
  if (map.trangThai) fields[map.trangThai] = phieu.trangThai;
  if (map.ghiChu) fields[map.ghiChu] = phieu.ghiChu || "";
  if (map.viTriIn) fields[map.viTriIn] = phieu.viTriIn || "";
  if (map.kieuMay) fields[map.kieuMay] = phieu.kieuMay || "";
  if (map.nguoiThucHien) fields[map.nguoiThucHien] = phieu.tenNguoiNhan;
  if (map.ngayHoanThanh) fields[map.ngayHoanThanh] = phieu.ngayHoanThanh ? new Date(phieu.ngayHoanThanh).getTime() : null;
  if (map.ngayNhan) fields[map.ngayNhan] = phieu.ngayNhan ? new Date(phieu.ngayNhan).getTime() : null;

  return fields;
}

// ============ SYNC FUNCTIONS ============

// Push 1 phiếu lên Lark (create hoặc update)
export async function pushPhieuToLark(phieu: PhieuWorkflow): Promise<{ ok: boolean; recordId?: string; error?: string }> {
  if (!isLarkEnabled()) {
    return { ok: false, error: "Lark chưa được cấu hình" };
  }

  const config = getLarkConfig()!;
  const prefix = phieu.id.split("_")[0];
  let tableId: string;
  if (prefix === "INTD") tableId = config.tableIds.inTheuDap;
  else if (prefix === "MAY") tableId = config.tableIds.may;
  else if (prefix === "KN") tableId = config.tableIds.khuyNut;
  else if (prefix === "UI") tableId = config.tableIds.ui;
  else if (prefix === "DG") tableId = config.tableIds.dongGoi;
  else return { ok: false, error: "ID phiếu không hợp lệ" };

  try {
    const fields = phieuToLarkFields(phieu);

    // Tìm record đã tồn tại bằng maPhieu
    const list = await larkApi(`/tables/${tableId}/records`, "GET", undefined);
    const existing = list.items?.find((r: any) => r.fields.ma_phieu === phieu.id || r.fields[Object.keys(fields)[0]] === phieu.id);

    if (existing) {
      // Update
      await larkApi(`/tables/${tableId}/records/${existing.record_id}`, "PUT", { fields });
      return { ok: true, recordId: existing.record_id };
    } else {
      // Create
      const created = await larkApi(`/tables/${tableId}/records`, "POST", { fields });
      return { ok: true, recordId: created.record?.record_id };
    }
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

// Pull tất cả records từ 1 bảng Lark
export async function pullPhieuFromLark(khau: "INTD" | "MAY" | "KN" | "UI" | "DG"): Promise<PhieuWorkflow[]> {
  if (!isLarkEnabled()) return [];

  const config = getLarkConfig()!;
  const tableId = {
    "INTD": config.tableIds.inTheuDap,
    "MAY": config.tableIds.may,
    "KN": config.tableIds.khuyNut,
    "UI": config.tableIds.ui,
    "DG": config.tableIds.dongGoi,
  }[khau];

  try {
    const data = await larkApi(`/tables/${tableId}/records`, "GET", undefined);
    return (data.items || []).map((r: any) => larkRecordToPhieu(r.fields, khau));
  } catch (e) {
    console.error("Pull Lark failed:", e);
    return [];
  }
}

function larkRecordToPhieu(fields: any, khau: string): PhieuWorkflow {
  // Lark trả về timestamp as ms - convert to date string
  const toDate = (ts: any) => ts ? new Date(ts).toISOString().slice(0, 10) : undefined;

  let map: any;
  if (khau === "INTD") map = FIELD_MAP.inTheuDap;
  else if (khau === "MAY") map = FIELD_MAP.may;
  else if (khau === "KN") map = FIELD_MAP.khuyNut;
  else if (khau === "UI") map = FIELD_MAP.ui;
  else map = FIELD_MAP.dongGoi;

  return {
    id: fields[map.maPhieu] || "",
    lenhSX: fields[map.lenhSX] || "",
    lenhCat: "",
    maSP: fields[map.maSP] || "",
    phanLoai: fields[map.phanLoai] || "",
    mau: fields[map.mau] || (fields[map.mauSize]?.split(" ")[0] || ""),
    size: fields[map.size] || (fields[map.mauSize]?.split(" ")[1] || ""),
    viTriIn: fields[map.viTriIn],
    kieuMay: fields[map.kieuMay],
    soLuongGiao: fields[map.soLuongGiao] || 0,
    soLuongNhan: fields[map.soLuongNhan] || 0,
    soLuongDat: fields[map.soLuongDat] || 0,
    soLuongLoi: fields[map.soLuongLoi] || 0,
    soLuongThieu: fields[map.soLuongThieu] || 0,
    soLuongSua: fields[map.soLuongSua] || 0,
    nguoiGiao: fields[map.nguoiGiao] || "",
    nguoiNhan: "",
    tenNguoiNhan: fields[map.doiTacNhan] || fields[map.xuongNhan] || fields[map.nguoiThucHien] || "",
    ngayGiao: toDate(fields[map.ngayGiao]),
    ngayNhan: toDate(fields[map.ngayNhan]),
    ngayHoanThanh: toDate(fields[map.ngayHoanThanh]),
    hanHoanThanh: toDate(fields[map.hanTraHang] || fields[map.hanHoanThanh]) || "",
    donGia: fields[map.donGia] || fields[map.donGiaMay] || 0,
    thanhTien: fields[map.thanhTien] || 0,
    daThanhToan: fields[map.daThanhToan] || 0,
    conNo: fields[map.conNo] || 0,
    trangThai: fields[map.trangThai] || "Chờ giao",
    ghiChu: fields[map.ghiChu],
    mauDaDuyet: false,
  };
}

// ============ TEST CONNECTION ============
export async function testLarkConnection(): Promise<{ ok: boolean; message: string; tables?: any }> {
  if (!isLarkEnabled()) {
    return { ok: false, message: "Lark chưa được cấu hình" };
  }
  try {
    const token = await getTenantAccessToken();
    const config = getLarkConfig()!;
    // Test bằng cách list 1 bảng
    const tables = await larkApi(`/tables/${config.tableIds.inTheuDap}/records`, "GET", undefined);
    return {
      ok: true,
      message: `Kết nối thành công! Tìm thấy ${tables.total || 0} records trong bảng In/Thêu/Dập.`,
      tables: {
        inTheuDap: tables.total || 0,
      },
    };
  } catch (e: any) {
    return { ok: false, message: e.message };
  }
}
