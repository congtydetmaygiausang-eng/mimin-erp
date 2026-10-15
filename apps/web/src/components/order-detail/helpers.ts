// ============================================
// Order helpers - tạo mới + tính tổng
// Phase 2: multi-item + multi-payment + shipping
// 2026-08-06
// ============================================

import type {
  Order,
  OrderItem,
  OrderPayment,
  OrderShipping,
  LoaiDonHang,
  TepKhachHang,
  PhuongThucThanhToan,
  PhuongThucVanChuyen,
  TrangThaiThanhToan,
} from "./types";
import type { KhachHangUI } from "@/lib/data/khach-hang-store";

/** Tạo ID ngẫu nhiên cho item/payment (dùng crypto.randomUUID nếu có) */
function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Trích xuất số thứ tự từ mã đơn hàng.
 * Hỗ trợ các định dạng:
 * - "DH-2026-10-14-001" -> 1
 * - "DH-2026-002" -> 2
 * - "DH003" -> 3
 */
export function extractOrderSeq(ma: string): number {
  if (!ma || typeof ma !== "string") return 0;
  const match = ma.trim().match(/(\d+)$/);
  if (!match) return 0;
  const n = parseInt(match[1], 10);
  return isNaN(n) ? 0 : n;
}

export const ORDER_SEQ_KEY = "mimin_don_hang_last_seq";

/**
 * Lấy số thứ tự đơn hàng tiếp theo toàn hệ thống (không bao giờ bị reset về 001 mỗi ngày).
 */
export function getNextOrderSeq(dsMaDaCo: string[] = []): number {
  let maxSeq = 0;
  for (const ma of dsMaDaCo) {
    const seq = extractOrderSeq(ma);
    if (seq > maxSeq) {
      maxSeq = seq;
    }
  }

  let storedSeq = 0;
  if (typeof window !== "undefined") {
    try {
      storedSeq = parseInt(localStorage.getItem(ORDER_SEQ_KEY) || "0", 10) || 0;
    } catch {}
  }

  return Math.max(maxSeq, dsMaDaCo.length, storedSeq) + 1;
}

/**
 * Ghi nhận số thứ tự đơn hàng vừa tạo thành công để bảo toàn chuỗi tự tăng liên tục.
 */
export function commitOrderSeq(seq: number): void {
  if (typeof window === "undefined" || !seq || seq <= 0) return;
  try {
    const curr = parseInt(localStorage.getItem(ORDER_SEQ_KEY) || "0", 10) || 0;
    if (seq > curr) {
      localStorage.setItem(ORDER_SEQ_KEY, String(seq));
    }
  } catch {}
}

/**
 * Sinh mã đơn hàng mới - tự tăng liên tục theo thứ tự (VD: "DH-2026-10-15-004").
 *
 * Truyền `dsMaDaCo` (danh sách mã đơn đang có) để đảm bảo:
 * 1. Tự tăng liên tục theo thứ tự đơn hàng toàn hệ thống (không bị kẹt ở 001 mỗi ngày).
 * 2. Tuyệt đối KHÔNG trùng với bất kỳ mã đơn nào đã có trong hệ thống.
 */
export function generateMaDH(dsMaDaCo: string[] = []): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const prefix = `DH-${yyyy}-${mm}-${dd}-`;

  let nextSeq = getNextOrderSeq(dsMaDaCo);

  // Đảm bảo mã sinh ra tuyệt đối không trùng lặp
  let candidate = `${prefix}${String(nextSeq).padStart(3, "0")}`;
  while (dsMaDaCo.includes(candidate)) {
    nextSeq++;
    candidate = `${prefix}${String(nextSeq).padStart(3, "0")}`;
  }

  return candidate;
}

/**
 * Tạo Order mới (mặc định bán lẻ, chưa có items).
 * Truyền `dsMaDaCo` để mã đơn chạy tuần tự, không đụng mã đã có.
 */
export function createEmptyOrder(dsMaDaCo: string[] = []): Order {
  const today = new Date().toISOString().slice(0, 10);
  const ngayGiao = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return {
    id: uuid(),
    maDH: generateMaDH(dsMaDaCo),
    ngayDat: today,
    ngayGiao,
    khachHang: "",
    sdt: "",
    loaiDonHang: "ban-le",
    tepKhachHang: "don-ban-khach",
    thanhTien: 0,
    trangThai: "Mới",
    items: [],
    payments: [],
    shipping: {
      phuongThuc: "tu-giao",
      phiVanChuyen: 0,
      trangThai: "cho-xu-ly",
    },
    trangThaiThanhToan: "chua-thanh-toan",
    tienCoc: 0,
  };
}

/** Tạo OrderItem rỗng từ variant (auto-fill sku, mau, size) */
export function createOrderItemFromVariant(variant: {
  spId: string;
  spTen: string;
  mauCode?: string;
  mauTen?: string;
  mauImg?: string;
  size?: string;
  sku?: string;
  donGia: number;
}): OrderItem {
  return {
    id: uuid(),
    spId: variant.spId,
    spTen: variant.spTen,
    mauCode: variant.mauCode,
    mauTen: variant.mauTen,
    mauImg: variant.mauImg,
    size: variant.size,
    sku: variant.sku,
    soLuong: 1,
    donGia: variant.donGia,
    thanhTien: variant.donGia,
  };
}

/** Tạo OrderPayment rỗng */
export function createEmptyPayment(
  phuongThuc: PhuongThucThanhToan = "tien-mat"
): OrderPayment {
  return {
    id: uuid(),
    phuongThuc,
    soTien: 0,
    ngayThanhToan: new Date().toISOString().slice(0, 10),
  };
}

/** Tính tổng tiền đơn hàng từ items[] */
export function calcOrderTotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + (item.thanhTien || 0), 0);
}

/** Tính tổng thanh toán đã nhận */
export function calcPaidTotal(payments: OrderPayment[]): number {
  return payments.reduce((sum, p) => sum + (p.soTien || 0), 0);
}

/** Tính tổng số lượng sản phẩm */
export function calcOrderQty(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + (item.soLuong || 0), 0);
}

/** Còn lại phải thanh toán */
export function calcOrderRemain(order: Order): number {
  const tongTien = (order.items && order.items.length > 0)
    ? calcOrderTotal(order.items)
    : (order.thanhTien || 0);
  const vatPercent = Number(order.thueVAT) || Number((order.shipping as any)?.xthuevat) || 0;
  const tienVAT = vatPercent > 0 ? Math.round((tongTien * vatPercent) / 100) : 0;
  const phiVC = Number(order.shipping?.phiVanChuyen) || 0;
  const giam = Number(order.giamGia) || 0;
  const total = Math.max(0, tongTien + tienVAT + phiVC - giam);
  const paid = calcPaidTotal(order.payments || []);
  return Math.max(0, total - paid);
}

/** Xác định trạng thái thanh toán dựa trên tổng tiền và đã trả */
export function determinePaymentStatus(order: Order): TrangThaiThanhToan {
  const tongTien = (order.items && order.items.length > 0)
    ? calcOrderTotal(order.items)
    : (order.thanhTien || 0);
  const vatPercent = Number(order.thueVAT) || Number((order.shipping as any)?.xthuevat) || 0;
  const tienVAT = vatPercent > 0 ? Math.round((tongTien * vatPercent) / 100) : 0;
  const phiVC = Number(order.shipping?.phiVanChuyen) || 0;
  const giam = Number(order.giamGia) || 0;
  const total = Math.max(0, tongTien + tienVAT + phiVC - giam);
  const paid = calcPaidTotal(order.payments || []);
  if (paid <= 0) return "chua-thanh-toan";
  if (paid >= total && total > 0) return "thanh-toan-du";
  return "thanh-toan-mot-phan";
}

/** Cập nhật thanhTien cho 1 item (khi thay đổi soLuong hoặc donGia) */
export function recalcItem(item: OrderItem): OrderItem {
  return { ...item, thanhTien: (item.soLuong || 0) * (item.donGia || 0) };
}

/**
 * Tự động phân loại đơn hàng vào đúng 3 tệp khách hàng:
 * 1. "don-hang-dat" (Đơn hàng đặt): Khách đặt may, hàng đặt theo hợp đồng, công ty
 * 2. "don-ban-khach" (Đơn bán khách): Bán sỉ, bán lẻ, bán lô, sàn TMĐT (Shopee, TikTok)
 * 3. "don-san-xuat" (Đơn sản xuất cho khách): Xưởng may, khách hàng xưởng, gia công sản xuất
 */
export function detectTepKhachHang(
  order: Partial<Order>,
  khList?: KhachHangUI[]
): TepKhachHang {
  // 1. Ưu tiên giá trị đã chọn hoặc lưu tường minh
  if (order.tepKhachHang) return order.tepKhachHang;

  // 2. Tra cứu theo thông tin khách hàng trong danh mục KH
  if (khList && khList.length > 0 && (order.khachHang || order.sdt)) {
    const chuanHoa = (s: string) => (s || "").trim().toLowerCase().replace(/\s+/g, " ");
    const digits = (s: string) => (s || "").replace(/\D/g, "");
    const orderKH = chuanHoa(order.khachHang || "");
    const orderSDT = digits(order.sdt || "");

    const kh = khList.find((k) => {
      const matchTen = orderKH && chuanHoa(k.ten) === orderKH;
      const matchSDT = orderSDT && orderSDT.length >= 8 && digits(k.sdt) === orderSDT;
      return matchTen || matchSDT;
    });

    if (kh) {
      const loaiKH = (kh.loai || "").toLowerCase();
      // Khách hàng xưởng -> Đơn sản xuất cho khách
      if (loaiKH.includes("xưởng")) {
        return "don-san-xuat";
      }
      // Công ty -> Đơn hàng đặt
      if (loaiKH.includes("công ty")) {
        return "don-hang-dat";
      }
      // Shop / Đại lý / Cá nhân
      if (order.loaiDonHang === "dat-may") {
        return "don-hang-dat";
      }
      return "don-ban-khach";
    }
  }

  // 3. Phân loại theo loại đơn hàng (loaiDonHang)
  if (order.loaiDonHang === "dat-may") {
    const text = `${order.khachHang || ""} ${order.ghiChu || ""}`.toLowerCase();
    if (text.includes("xưởng") || text.includes("gia công") || text.includes("sản xuất")) {
      return "don-san-xuat";
    }
    return "don-hang-dat";
  }

  if (
    order.loaiDonHang === "ban-le" ||
    order.loaiDonHang === "ban-si" ||
    order.loaiDonHang === "ban-lo" ||
    order.loaiDonHang === "tiktok" ||
    order.loaiDonHang === "shopee" ||
    order.loaiDonHang === "ban-san"
  ) {
    return "don-ban-khach";
  }

  // 4. Heuristics từ tên khách hàng hoặc ghi chú
  const combinedText = `${order.khachHang || ""} ${order.ghiChu || ""}`.toLowerCase();
  if (
    combinedText.includes("xưởng") ||
    combinedText.includes("gia công") ||
    combinedText.includes("sx cho khách") ||
    combinedText.includes("sản xuất cho khách")
  ) {
    return "don-san-xuat";
  }
  if (
    combinedText.includes("công ty") ||
    combinedText.includes("đặt may") ||
    combinedText.includes("đồng phục") ||
    combinedText.includes("hợp đồng") ||
    combinedText.includes("hàng đặt")
  ) {
    return "don-hang-dat";
  }

  // Mặc định là Đơn bán khách
  return "don-ban-khach";
}

