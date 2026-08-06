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
  PhuongThucThanhToan,
  PhuongThucVanChuyen,
  TrangThaiThanhToan,
} from "./types";

/** Tạo ID ngẫu nhiên cho item/payment (dùng crypto.randomUUID nếu có) */
function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Sinh mã đơn hàng mới - VD: "DH-2026-08-06-001" */
export function generateMaDH(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, "0");
  return `DH-${yyyy}-${mm}-${dd}-${seq}`;
}

/** Tạo Order mới (mặc định bán lẻ, chưa có items) */
export function createEmptyOrder(): Order {
  const today = new Date().toISOString().slice(0, 10);
  const ngayGiao = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return {
    id: uuid(),
    maDH: generateMaDH(),
    ngayDat: today,
    ngayGiao,
    khachHang: "",
    sdt: "",
    loaiDonHang: "ban-le",
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
  return calcOrderTotal(order.items) + (order.shipping?.phiVanChuyen || 0) - calcPaidTotal(order.payments);
}

/** Xác định trạng thái thanh toán dựa trên tổng tiền và đã trả */
export function determinePaymentStatus(order: Order): TrangThaiThanhToan {
  const total = calcOrderTotal(order.items) + (order.shipping?.phiVanChuyen || 0);
  const paid = calcPaidTotal(order.payments);
  if (paid <= 0) return "chua-thanh-toan";
  if (paid >= total) return "thanh-toan-du";
  return "thanh-toan-mot-phan";
}

/** Cập nhật thanhTien cho 1 item (khi thay đổi soLuong hoặc donGia) */
export function recalcItem(item: OrderItem): OrderItem {
  return { ...item, thanhTien: (item.soLuong || 0) * (item.donGia || 0) };
}
