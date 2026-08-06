export type OrderStatus = "Mới" | "Đã duyệt" | "Đang SX" | "Hoàn thành" | "Đã giao" | "Hủy";

export type Order = {
  id: string;
  maDH: string;
  ngayDat: string;
  ngayGiao: string;
  khachHang: string;
  sdt: string;
  sanPham: string;
  loai: "Áo" | "Bộ";
  soLuong: number;
  donGia: number;
  thanhTien: number;
  trangThai: OrderStatus;
  ghiChu?: string;
  tienCoc: number;
};

export type OrderItem = {
  id: string;
  sku: string;
  name: string;
  type: Order["loai"];
  quantity: number;
  unitPrice: number;
  total: number;
};

export function calcTotalQty(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

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
