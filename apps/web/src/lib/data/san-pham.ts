import { type LoaiSP } from "./lenh-cat-store";

export interface MauTieuChuan {
  ten: string;
  maSKU: string;
  dinhMuc: number;
  img: string;
  video?: string;
  hinhAnhChiTiet?: string[]; // Thêm mảng chứa nhiều ảnh cho biến thể
}

export interface BangSize {
  // VD: ["M", "L", "XL", "2XL", "3XL"] or ["S", "M", "L", "XL"]
  sizes: string[];
  ratios: number[];
  riSo: number; // Tong 1 ri = sum(ratios)
}

export interface SanPham {
  id: string; // Map to ma_sp in DB
  dbId?: string; // UUID gốc trong database
  maSP?: string; // Add optional maSP mapping
  tenSP: string;
  loaiSP: LoaiSP;
  giaBanDuKien: number;
  giaVonDuKien: number;
  tiLeSize: string; // e.g. "1:2:2:2:1" (string de hien thi)
  bangSize: BangSize; // BANG SIZE rieng cua SP
  dsMau: MauTieuChuan[];
  ghiChu: string;
  ngayTao: string;
  // === Fields moi them 2026-08-07 ===
  trangThai?: "con-hang" | "het-hang" | "sap-ve" | "ngung-kinh-doanh"; // trang thai kho
  daBan?: number; // so luong da ban (social proof)
  ncc?: string; // nha cung cap (VD: "Vai A Chau", "Polomimin")
  chatLieu?: string; // chat lieu vai (VD: "Cotton 100%", "Polyester")
  luotXem?: number; // so luot xem (analytics)
  rating?: number; // danh gia 0-5
  hinhAnh?: string; // URL hinh anh that (placeholder hien tai)
  giaBanLe?: number;
  giaBanSi?: number;
  giaBanLo?: number;
  giaTikTok?: number;
  giaShopee?: number;
  kenhBan?: ("ban-le" | "ban-si" | "ban-lo" | "tiktok" | "shopee")[];
}
