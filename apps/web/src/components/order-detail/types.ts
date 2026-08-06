export type OrderStatus = "Mới" | "Đã duyệt" | "Đang SX" | "Hoàn thành" | "Đã giao" | "Hủy";

/** Loại đơn hàng - quyết định form render */
export type LoaiDonHang = "ban-le" | "ban-si" | "ban-san";

/** Phương thức thanh toán */
export type PhuongThucThanhToan = "ngan-hang" | "tien-mat" | "cong-no";

/** Phương thức vận chuyển */
export type PhuongThucVanChuyen = "ghtk" | "ghn" | "viettel-post" | "tu-giao" | "khach-den-lay";

/** Trạng thái thanh toán */
export type TrangThaiThanhToan = "chua-thanh-toan" | "thanh-toan-mot-phan" | "thanh-toan-du";

/** Trạng thái vận chuyển */
export type TrangThaiVanChuyen = "cho-xu-ly" | "cho-lay-hang" | "dang-giao" | "da-giao" | "huy";

/** Một dòng item trong đơn hàng - reference tới variant cụ thể */
export type OrderItem = {
  id: string;
  /** ID sản phẩm (maSP) - VD: "A001" */
  spId: string;
  /** Tên sản phẩm (denormalized để hiển thị) */
  spTen: string;
  /** Mã màu - VD: "DEN" */
  mauCode?: string;
  /** Tên màu hiển thị - VD: "Đen" */
  mauTen?: string;
  /** Size - "M", "L", "XL", "2XL", "3XL" */
  size?: string;
  /** SKU đầy đủ - VD: "A001-DEN-L" */
  sku?: string;
  /** Số lượng */
  soLuong: number;
  /** Đơn giá (VND) */
  donGia: number;
  /** Thành tiền = soLuong * donGia */
  thanhTien: number;
};

/** Một lần thanh toán - 1 đơn có thể có nhiều lần (multi-method) */
export type OrderPayment = {
  id: string;
  phuongThuc: PhuongThucThanhToan;
  /** Số tiền (VND) */
  soTien: number;
  /** Ngày thanh toán (ISO) */
  ngayThanhToan: string;
  /** Mã giao dịch NH (nếu có) - VD: "FT24081..." */
  maGiaoDich?: string;
  /** Ngân hàng (nếu chuyển NH) - VD: "VCB", "MB", "TPBank" */
  nganHang?: string;
  /** Ghi chú */
  ghiChu?: string;
};

/** Thông tin vận chuyển của đơn */
export type OrderShipping = {
  phuongThuc: PhuongThucVanChuyen;
  /** Phí vận chuyển (VND) */
  phiVanChuyen: number;
  /** Mã vận đơn / Tracking (nếu có) */
  maVanDon?: string;
  /** Địa chỉ giao */
  diaChiGiao?: string;
  /** Trạng thái vận chuyển */
  trangThai: TrangThaiVanChuyen;
  /** Ngày giao dự kiến */
  ngayGiaoDuKien?: string;
  /** Ghi chú */
  ghiChu?: string;
};

export type Order = {
  id: string;
  maDH: string;
  ngayDat: string;
  ngayGiao: string;
  khachHang: string;
  sdt: string;
  /** Loại đơn hàng - quyết định UI bán lẻ/sỉ/sàn */
  loaiDonHang: LoaiDonHang;
  /** Kênh bán (nếu là bán sàn) - VD: "Shopee", "TikTok Shop", "Lazada" */
  kenhBan?: string;
  /** DEPRECATED: dùng items[] thay thế. Giữ để backward compat. */
  sanPham?: string;
  loai?: "Áo" | "Bộ";
  /** DEPRECATED: tổng từ items[]. Giữ để backward compat. */
  soLuong?: number;
  donGia?: number;
  /** Tổng tiền đơn hàng (tính từ items[]) */
  thanhTien: number;
  trangThai: OrderStatus;
  ghiChu?: string;
  /** DEPRECATED: dùng payments[]. Giữ để backward compat. */
  tienCoc?: number;
  /** Danh sách sản phẩm trong đơn (mới) */
  items: OrderItem[];
  /** Danh sách thanh toán (multi-method) */
  payments: OrderPayment[];
  /** Thông tin vận chuyển */
  shipping: OrderShipping;
  /** Trạng thái thanh toán tổng */
  trangThaiThanhToan: TrangThaiThanhToan;
};

export function calcTotalQty(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

// ============================================
// CONSTANTS - Labels cho UI
// ============================================

export const LOAI_DON_HANG_LABELS: Record<LoaiDonHang, string> = {
  "ban-le": "Bán lẻ",
  "ban-si": "Bán sỉ",
  "ban-san": "Bán sàn (Shopee, TikTok...)",
};

export const PHUONG_THUC_THANH_TOAN_LABELS: Record<PhuongThucThanhToan, string> = {
  "ngan-hang": "Chuyển khoản ngân hàng",
  "tien-mat": "Tiền mặt",
  "cong-no": "Công nợ (ghi nợ)",
};

export const PHUONG_THUC_VAN_CHUYEN_LABELS: Record<PhuongThucVanChuyen, string> = {
  "ghtk": "GHTK (Giao Hàng Tiết Kiệm)",
  "ghn": "GHN (Giao Hàng Nhanh)",
  "viettel-post": "Viettel Post",
  "tu-giao": "Tự giao (POLOMIMIN giao)",
  "khach-den-lay": "Khách đến lấy",
};

export const TRANG_THAI_THANH_TOAN_LABELS: Record<TrangThaiThanhToan, string> = {
  "chua-thanh-toan": "Chưa thanh toán",
  "thanh-toan-mot-phan": "Thanh toán một phần",
  "thanh-toan-du": "Đã thanh toán đủ",
};

export const TRANG_THAI_VAN_CHUYEN_LABELS: Record<TrangThaiVanChuyen, string> = {
  "cho-xu-ly": "Chờ xử lý",
  "cho-lay-hang": "Chờ lấy hàng",
  "dang-giao": "Đang giao",
  "da-giao": "Đã giao",
  "huy": "Hủy",
};

// Ngân hàng phổ biến ở VN
export const NGAN_HANG_OPTIONS = [
  { code: "VCB", ten: "Vietcombank" },
  { code: "TCB", ten: "Techcombank" },
  { code: "MB", ten: "MB Bank" },
  { code: "TPB", ten: "TPBank" },
  { code: "ACB", ten: "ACB" },
  { code: "VPB", ten: "VPBank" },
  { code: "BIDV", ten: "BIDV" },
  { code: "VIB", ten: "VIB" },
  { code: "SHB", ten: "SHB" },
  { code: "Momo", ten: "Ví MoMo" },
] as const;

// Kênh bán sàn
export const KENH_BAN_SAN_OPTIONS = [
  "Shopee",
  "TikTok Shop",
  "Lazada",
  "Tiki",
  "Sendo",
  "Facebook",
  "Zalo OA",
  "Khác",
] as const;

const DIGITS = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];

function readTriple(value: number, full: boolean): string {
  const hundred = Math.floor(value / 100);
  const ten = Math.floor((value % 100) / 10);
  const unit = value % 10;
  const parts: string[] = [];

  if (hundred > 0 || full) {
    parts.push(`${DIGITS[hundred]} trăm`);
  }

  if (ten > 1) {
    parts.push(`${DIGITS[ten]} mươi`);
    if (unit === 1) parts.push("mốt");
    else if (unit === 5) parts.push("lăm");
    else if (unit > 0) parts.push(DIGITS[unit]);
    return parts.join(" ");
  }

  if (ten === 1) {
    parts.push("mười");
    if (unit === 5) parts.push("lăm");
    else if (unit > 0) parts.push(DIGITS[unit]);
    return parts.join(" ");
  }

  if (ten === 0 && unit > 0) {
    if (hundred > 0 || full) parts.push("lẻ");
    if (unit === 5 && (hundred > 0 || full)) parts.push("năm");
    else parts.push(DIGITS[unit]);
  }

  return parts.join(" ");
}

export function docSoVietNam(value: number): string {
  const normalized = Math.floor(Math.abs(value));
  if (!Number.isFinite(normalized)) return "Không xác định";
  if (normalized === 0) return "Không đồng";

  const units = ["", " nghìn", " triệu", " tỷ"];
  const triples: number[] = [];
  let remaining = normalized;

  while (remaining > 0) {
    triples.push(remaining % 1000);
    remaining = Math.floor(remaining / 1000);
  }

  const parts: string[] = [];
  for (let i = triples.length - 1; i >= 0; i -= 1) {
    const triple = triples[i];
    if (triple === 0) continue;
    const full = i < triples.length - 1 && triple < 100;
    parts.push(`${readTriple(triple, full)}${units[i]}`.trim());
  }

  const text = parts.join(" ").replace(/\s+/g, " ").trim();
  return `${text.charAt(0).toUpperCase()}${text.slice(1)} đồng`;
}
