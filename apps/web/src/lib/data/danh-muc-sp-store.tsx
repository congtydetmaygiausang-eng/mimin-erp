"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { type LoaiSP, type MauVai } from "./lenh-cat-store";
import { useSupabaseSync, supabaseUpsert, supabaseDelete } from "@/lib/supabase/client";

// ============================================
// 2026-08-07 - Map data tu Supabase DB
// DB columns: id, ma_sp, loai_sp, ma_dm, ten_sp, dinh_muc, created_at
// Mapping: loai_sp (text tieng Viet) -> LoaiSP enum
// ============================================

const LOAI_SP_MAP: Record<string, LoaiSP> = {
  "Áo trụ": "AoTru",
  "Áo cổ tròn": "AoCoTron",
  "Bộ trụ": "BoTru",
  "Bộ tròn": "BoCoTron",
};

function mapLoaiSPFromText(loaiSPText: string | null | undefined): LoaiSP {
  if (!loaiSPText) return "BoTru";
  return LOAI_SP_MAP[loaiSPText] || (loaiSPText as LoaiSP) || "BoTru";
}

// Map 1 record DB -> SanPham (graceful voi columns chua co)
function mapSanPhamFromDB(item: any): SanPham {
  return {
    id: item.ma_sp || item.id || "", // ma_sp làm primary
    dbId: item.id, // UUID gốc
    tenSP: item.ten_sp || "",
    loaiSP: mapLoaiSPFromText(item.loai_sp),
    // === Fields chua co trong DB -> gia tri mac dinh (se update sau) ===
    giaBanDuKien: item.gia_ban_du_kien || 0,
    giaVonDuKien: item.gia_von_du_kien || 0,
    tiLeSize: item.ti_le_size || "",
    bangSize: item.bang_size || DEFAULT_BANGSIZE_5SIZE,
    dsMau: item.ds_mau || [],
    ghiChu: item.ghi_chu || `Mã DM: ${item.ma_dm || "N/A"} | Định mức: ${item.dinh_muc || 0}`,
    ngayTao: item.ngay_tao || item.created_at || new Date().toISOString().substring(0, 10),
    // === Fields moi 2026-08-07 (chua co trong DB schema hien tai) ===
    trangThai: item.trang_thai || "con-hang",
    daBan: item.da_ban || 0,
    ncc: item.ncc || "",
    chatLieu: item.chat_lieu || "",
    luotXem: item.luot_xem || 0,
    rating: item.rating || 0,
    hinhAnh: item.hinh_anh || "",
  };
}

export interface MauTieuChuan {
  ten: string;
  maSKU: string;
  dinhMuc: number;
  img: string;
  video?: string;
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
}

const DEFAULT_BANGSIZE_5SIZE: BangSize = {
  sizes: ["M", "L", "XL", "2XL", "3XL"],
  ratios: [1, 2, 2, 2, 1],
  riSo: 8,
};

const MOCK_DANH_MUC: SanPham[] = [
  {
    id: "M001",
    tenSP: "Bộ trụ trơn 5 size cao cấp M758",
    loaiSP: "BoTru",
    giaBanDuKien: 185000,
    giaVonDuKien: 78000,
    tiLeSize: "1:2:2:2:1",
    bangSize: { sizes: ["M", "L", "XL", "2XL", "3XL"], ratios: [1, 2, 2, 2, 1], riSo: 8 },
    dsMau: [
      { ten: "Đen", maSKU: "M758-DEN", dinhMuc: 0.62, img: "" },
      { ten: "Trắng", maSKU: "M758-TRA", dinhMuc: 0.62, img: "" },
      { ten: "Xám", maSKU: "M758-XAM", dinhMuc: 0.62, img: "" }
    ],
    ghiChu: "Vải cotton 4 chiều, may 5 size chuẩn body VN",
    ngayTao: "2026-08-01",
    trangThai: "con-hang",
    daBan: 1240,
    ncc: "Vải A Châu",
    chatLieu: "Cotton 95%, Spandex 5%",
    luotXem: 3420,
    rating: 4.8,
  },
  {
    id: "A001",
    tenSP: "Áo Polo Basic vải cá sấu cao cấp",
    loaiSP: "AoPolo",
    giaBanDuKien: 120000,
    giaVonDuKien: 52000,
    tiLeSize: "1:2:2:1",
    bangSize: { sizes: ["M", "L", "XL", "2XL", "3XL"], ratios: [1, 2, 2, 1, 0], riSo: 6 },
    dsMau: [
      { ten: "Xanh Đen", maSKU: "A001-XDEN", dinhMuc: 0.32, img: "" },
      { ten: "Rêu", maSKU: "A001-REU", dinhMuc: 0.32, img: "" },
      { ten: "Đỏ Đô", maSKU: "A001-DODO", dinhMuc: 0.32, img: "" }
    ],
    ghiChu: "Vải cá sấu poly - form regular fit, phù hợp công sở",
    ngayTao: "2026-08-02",
    trangThai: "con-hang",
    daBan: 856,
    ncc: "Dệt Phong Phú",
    chatLieu: "Polyester 65%, Cotton 35%",
    luotXem: 2150,
    rating: 4.6,
  },
  {
    id: "A002",
    tenSP: "Áo thun nam nữ form rộng 5 size",
    loaiSP: "AoTru",
    giaBanDuKien: 85000,
    giaVonDuKien: 38000,
    tiLeSize: "1:2:3:2:1",
    bangSize: { sizes: ["M", "L", "XL", "2XL", "3XL"], ratios: [1, 2, 3, 2, 1], riSo: 9 },
    dsMau: [
      { ten: "Trắng", maSKU: "A002-TRA", dinhMuc: 0.22, img: "" },
      { ten: "Đen", maSKU: "A002-DEN", dinhMuc: 0.22, img: "" },
      { ten: "Vàng", maSKU: "A002-VANG", dinhMuc: 0.22, img: "" },
      { ten: "Hồng", maSKU: "A002-HONG", dinhMuc: 0.22, img: "" }
    ],
    ghiChu: "Vải thun cotton 100%, form rộng thoải mái",
    ngayTao: "2026-07-28",
    trangThai: "con-hang",
    daBan: 2340,
    ncc: "Vải A Châu",
    chatLieu: "Cotton 100%",
    luotXem: 5680,
    rating: 4.7,
  },
  {
    id: "Q001",
    tenSP: "Quần short thể thao nam 5 size",
    loaiSP: "PhuKien",
    giaBanDuKien: 95000,
    giaVonDuKien: 42000,
    tiLeSize: "1:2:2:1:1",
    bangSize: { sizes: ["M", "L", "XL", "2XL", "3XL"], ratios: [1, 2, 2, 1, 1], riSo: 7 },
    dsMau: [
      { ten: "Đen", maSKU: "Q001-DEN", dinhMuc: 0.28, img: "" },
      { ten: "Xám", maSKU: "Q001-XAM", dinhMuc: 0.28, img: "" }
    ],
    ghiChu: "Quần short thể thao, có túi khoá kéo",
    ngayTao: "2026-07-25",
    trangThai: "con-hang",
    daBan: 678,
    ncc: "Polomimin",
    chatLieu: "Polyester 90%, Spandex 10%",
    luotXem: 1420,
    rating: 4.5,
  },
  {
    id: "B001",
    tenSP: "Bộ đồ gia đình in họa tiết 4 người",
    loaiSP: "BoTru",
    giaBanDuKien: 245000,
    giaVonDuKien: 98000,
    tiLeSize: "1:1:1:1",
    bangSize: { sizes: ["S", "M", "L", "XL"], ratios: [1, 1, 1, 1], riSo: 4 },
    dsMau: [
      { ten: "Hồng Pastel", maSKU: "B001-HONG", dinhMuc: 0.85, img: "" },
      { ten: "Xanh Mint", maSKU: "B001-MINT", dinhMuc: 0.85, img: "" }
    ],
    ghiChu: "Set đồ gia đình 4 người, vải cotton mềm mại",
    ngayTao: "2026-07-30",
    trangThai: "con-hang",
    daBan: 432,
    ncc: "Dệt Phong Phú",
    chatLieu: "Cotton 100%",
    luotXem: 1180,
    rating: 4.9,
  },
  {
    id: "A003",
    tenSP: "Áo thun trơn form ôm body",
    loaiSP: "AoTru",
    giaBanDuKien: 78000,
    giaVonDuKien: 32000,
    tiLeSize: "1:2:2:1:1",
    bangSize: { sizes: ["M", "L", "XL", "2XL", "3XL"], ratios: [1, 2, 2, 1, 1], riSo: 7 },
    dsMau: [
      { ten: "Đen", maSKU: "A003-DEN", dinhMuc: 0.18, img: "" },
      { ten: "Trắng", maSKU: "A003-TRA", dinhMuc: 0.18, img: "" },
      { ten: "Be", maSKU: "A003-BE", dinhMuc: 0.18, img: "" }
    ],
    ghiChu: "Form ôm body, vải cá sấu co giãn 4 chiều",
    ngayTao: "2026-07-20",
    trangThai: "con-hang",
    daBan: 1560,
    ncc: "Vải A Châu",
    chatLieu: "Cotton 95%, Spandex 5%",
    luotXem: 3240,
    rating: 4.6,
  },
  {
    id: "A004",
    tenSP: "Áo Polo thể thao nam công sở",
    loaiSP: "AoPolo",
    giaBanDuKien: 145000,
    giaVonDuKien: 62000,
    tiLeSize: "1:2:2:1:0",
    bangSize: { sizes: ["M", "L", "XL", "2XL"], ratios: [1, 2, 2, 1], riSo: 6 },
    dsMau: [
      { ten: "Xanh Navy", maSKU: "A004-NAVY", dinhMuc: 0.35, img: "" },
      { ten: "Đen", maSKU: "A004-DEN", dinhMuc: 0.35, img: "" },
      { ten: "Trắng", maSKU: "A004-TRA", dinhMuc: 0.35, img: "" }
    ],
    ghiChu: "Polo thể thao - vải cá sấu poly, thấm hút tốt",
    ngayTao: "2026-07-22",
    trangThai: "con-hang",
    daBan: 920,
    ncc: "Dệt Phong Phú",
    chatLieu: "Polyester 70%, Cotton 30%",
    luotXem: 1980,
    rating: 4.7,
  },
  {
    id: "B002",
    tenSP: "Bộ Thể Thao Nam cao cấp 3 màu",
    loaiSP: "BoTru",
    giaBanDuKien: 220000,
    giaVonDuKien: 95000,
    tiLeSize: "1:2:2:2:1",
    bangSize: { sizes: ["M", "L", "XL", "2XL", "3XL"], ratios: [1, 2, 2, 2, 1], riSo: 8 },
    dsMau: [
      { ten: "Xám Xanh", maSKU: "B002-XAMX", dinhMuc: 0.65, img: "" },
      { ten: "Đỏ Đen", maSKU: "B002-DODEN", dinhMuc: 0.65, img: "" },
      { ten: "Trắng Xám", maSKU: "B002-TXAM", dinhMuc: 0.65, img: "" }
    ],
    ghiChu: "Bộ thể thao chuyên dụng, co giãn 4 chiều",
    ngayTao: "2026-07-18",
    trangThai: "con-hang",
    daBan: 1080,
    ncc: "Polomimin",
    chatLieu: "Polyester 88%, Spandex 12%",
    luotXem: 2450,
    rating: 4.8,
  },
  {
    id: "A005",
    tenSP: "Áo tank top nam tập gym",
    loaiSP: "AoTru",
    giaBanDuKien: 65000,
    giaVonDuKien: 28000,
    tiLeSize: "1:2:1:1",
    bangSize: { sizes: ["M", "L", "XL", "2XL"], ratios: [1, 2, 1, 1], riSo: 5 },
    dsMau: [
      { ten: "Đen", maSKU: "A005-DEN", dinhMuc: 0.15, img: "" },
      { ten: "Trắng", maSKU: "A005-TRA", dinhMuc: 0.15, img: "" },
      { ten: "Xám", maSKU: "A005-XAM", dinhMuc: 0.15, img: "" }
    ],
    ghiChu: "Tank top tập gym, vải thun lạnh co giãn",
    ngayTao: "2026-07-15",
    trangThai: "con-hang",
    daBan: 540,
    ncc: "Vải A Châu",
    chatLieu: "Polyester 92%, Spandex 8%",
    luotXem: 980,
    rating: 4.4,
  },
  {
    id: "P001",
    tenSP: "Mũ lưỡi trai POLOMIMIN thêu logo",
    loaiSP: "PhuKien",
    giaBanDuKien: 85000,
    giaVonDuKien: 32000,
    tiLeSize: "1:1:1",
    bangSize: { sizes: ["Free"], ratios: [1], riSo: 1 },
    dsMau: [
      { ten: "Đen", maSKU: "P001-DEN", dinhMuc: 0.08, img: "" },
      { ten: "Trắng", maSKU: "P001-TRA", dinhMuc: 0.08, img: "" },
      { ten: "Xanh Navy", maSKU: "P001-NAVY", dinhMuc: 0.08, img: "" }
    ],
    ghiChu: "Mũ lưỡi trai thêu logo POLOMIMIN, điều chỉnh được",
    ngayTao: "2026-07-10",
    trangThai: "con-hang",
    daBan: 320,
    ncc: "Polomimin",
    chatLieu: "Cotton 100%",
    luotXem: 720,
    rating: 4.5,
  },
  {
    id: "P002",
    tenSP: "Tất cổ cao cotton nam nữ 3 đôi",
    loaiSP: "PhuKien",
    giaBanDuKien: 45000,
    giaVonDuKien: 18000,
    tiLeSize: "1:1:1:1",
    bangSize: { sizes: ["S", "M", "L", "XL"], ratios: [1, 1, 1, 1], riSo: 4 },
    dsMau: [
      { ten: "Đen", maSKU: "P002-DEN", dinhMuc: 0.05, img: "" },
      { ten: "Trắng", maSKU: "P002-TRA", dinhMuc: 0.05, img: "" },
      { ten: "Xám", maSKU: "P002-XAM", dinhMuc: 0.05, img: "" }
    ],
    ghiChu: "Combo 3 đôi tất cổ cao cotton, co giãn tốt",
    ngayTao: "2026-07-08",
    trangThai: "con-hang",
    daBan: 1180,
    ncc: "Polomimin",
    chatLieu: "Cotton 80%, Spandex 20%",
    luotXem: 1850,
    rating: 4.6,
  },
  {
    id: "B003",
    tenSP: "Bộ Pijama gia đình mùa hè",
    loaiSP: "BoTru",
    giaBanDuKien: 195000,
    giaVonDuKien: 82000,
    tiLeSize: "1:1:1:1",
    bangSize: { sizes: ["S", "M", "L", "XL"], ratios: [1, 1, 1, 1], riSo: 4 },
    dsMau: [
      { ten: "Hồng Pastel", maSKU: "B003-HONG", dinhMuc: 0.7, img: "" },
      { ten: "Xanh Mint", maSKU: "B003-MINT", dinhMuc: 0.7, img: "" },
      { ten: "Vàng Nhạt", maSKU: "B003-VANG", dinhMuc: 0.7, img: "" }
    ],
    ghiChu: "Bộ pijama cotton nhẹ, thoáng mát mùa hè",
    ngayTao: "2026-06-28",
    trangThai: "con-hang",
    daBan: 245,
    ncc: "Dệt Phong Phú",
    chatLieu: "Cotton 100%",
    luotXem: 580,
    rating: 4.7,
  },
  {
    id: "A006",
    tenSP: "Áo khoác hoodie form rộng unisex",
    loaiSP: "AoTru",
    giaBanDuKien: 185000,
    giaVonDuKien: 82000,
    tiLeSize: "1:2:2:1:1",
    bangSize: { sizes: ["M", "L", "XL", "2XL", "3XL"], ratios: [1, 2, 2, 1, 1], riSo: 7 },
    dsMau: [
      { ten: "Đen", maSKU: "A006-DEN", dinhMuc: 0.55, img: "" },
      { ten: "Xám", maSKU: "A006-XAM", dinhMuc: 0.55, img: "" },
      { ten: "Be", maSKU: "A006-BE", dinhMuc: 0.55, img: "" }
    ],
    ghiChu: "Hoodie nỉ form rộng unisex, mùa đông",
    ngayTao: "2026-06-15",
    trangThai: "het-hang",
    daBan: 480,
    ncc: "Polomimin",
    chatLieu: "Cotton 80%, Polyester 20%",
    luotXem: 1120,
    rating: 4.8,
  },
  {
    id: "Q002",
    tenSP: "Quần dài kaki nam công sở 5 size",
    loaiSP: "PhuKien",
    giaBanDuKien: 165000,
    giaVonDuKien: 72000,
    tiLeSize: "1:2:2:1:1",
    bangSize: { sizes: ["M", "L", "XL", "2XL", "3XL"], ratios: [1, 2, 2, 1, 1], riSo: 7 },
    dsMau: [
      { ten: "Xám", maSKU: "Q002-XAM", dinhMuc: 0.55, img: "" },
      { ten: "Đen", maSKU: "Q002-DEN", dinhMuc: 0.55, img: "" },
      { ten: "Be", maSKU: "Q002-BE", dinhMuc: 0.55, img: "" }
    ],
    ghiChu: "Quần kaki slimfit, 2 túi khoá kéo",
    ngayTao: "2026-06-12",
    trangThai: "sap-ve",
    daBan: 380,
    ncc: "Vải A Châu",
    chatLieu: "Cotton 98%, Spandex 2%",
    luotXem: 920,
    rating: 4.5,
  },
  {
    id: "A007",
    tenSP: "Áo thun nữ croptop form trẻ trung",
    loaiSP: "AoTru",
    giaBanDuKien: 72000,
    giaVonDuKien: 30000,
    tiLeSize: "1:2:2:1:0",
    bangSize: { sizes: ["S", "M", "L", "XL"], ratios: [1, 2, 2, 1], riSo: 6 },
    dsMau: [
      { ten: "Trắng", maSKU: "A007-TRA", dinhMuc: 0.15, img: "" },
      { ten: "Hồng", maSKU: "A007-HONG", dinhMuc: 0.15, img: "" },
      { ten: "Vàng", maSKU: "A007-VANG", dinhMuc: 0.15, img: "" },
      { ten: "Đen", maSKU: "A007-DEN", dinhMuc: 0.15, img: "" }
    ],
    ghiChu: "Croptop nữ form trẻ trung, vải thun cotton mềm",
    ngayTao: "2026-06-08",
    trangThai: "con-hang",
    daBan: 720,
    ncc: "Vải A Châu",
    chatLieu: "Cotton 100%",
    luotXem: 1640,
    rating: 4.7,
  },
  {
    id: "P003",
    tenSP: "Khẩu trang vải kháng khuẩn POLOMIMIN",
    loaiSP: "PhuKien",
    giaBanDuKien: 25000,
    giaVonDuKien: 8000,
    tiLeSize: "1:1:1",
    bangSize: { sizes: ["Free"], ratios: [1], riSo: 1 },
    dsMau: [
      { ten: "Đen", maSKU: "P003-DEN", dinhMuc: 0.02, img: "" },
      { ten: "Trắng", maSKU: "P003-TRA", dinhMuc: 0.02, img: "" },
      { ten: "Xám", maSKU: "P003-XAM", dinhMuc: 0.02, img: "" }
    ],
    ghiChu: "Khẩu trang vải 3 lớp, kháng khuẩn, có logo POLOMIMIN",
    ngayTao: "2026-05-20",
    trangThai: "con-hang",
    daBan: 2560,
    ncc: "Polomimin",
    chatLieu: "Cotton 100% + lớp kháng khuẩn",
    luotXem: 4280,
    rating: 4.6,
  },
  {
    id: "B004",
    tenSP: "Bộ thể thao nữ croptop quần short",
    loaiSP: "BoTru",
    giaBanDuKien: 195000,
    giaVonDuKien: 85000,
    tiLeSize: "1:2:2:1:1",
    bangSize: { sizes: ["S", "M", "L", "XL", "2XL"], ratios: [1, 2, 2, 1, 1], riSo: 7 },
    dsMau: [
      { ten: "Hồng", maSKU: "B004-HONG", dinhMuc: 0.55, img: "" },
      { ten: "Đen", maSKU: "B004-DEN", dinhMuc: 0.55, img: "" },
      { ten: "Tím Pastel", maSKU: "B004-TIM", dinhMuc: 0.55, img: "" }
    ],
    ghiChu: "Bộ croptop + quần short nữ, vải co giãn 4 chiều",
    ngayTao: "2026-05-12",
    trangThai: "ngung-kinh-doanh",
    daBan: 180,
    ncc: "Polomimin",
    chatLieu: "Polyester 88%, Spandex 12%",
    luotXem: 420,
    rating: 4.5,
  },
];

interface DanhMucSPContextType {
  dsSanPham: SanPham[];
  themSP: (sp: SanPham) => void;
  suaSP: (id: string, data: Partial<SanPham>) => void;
  xoaSP: (id: string) => void;
  loading: boolean;
}

const STORAGE_KEY = "mimin_danh_muc_sp";
const DanhMucSPContext = createContext<DanhMucSPContextType | undefined>(undefined);

/** Helper: build Supabase snake_case payload từ SanPham (camelCase) */
function buildDBPayload(sp: SanPham) {
  return {
    ma_sp: sp.id,
    ma_dm: `DM-${sp.loaiSP}`,
    ten_sp: sp.tenSP,
    loai_sp: sp.loaiSP,
    gia_ban_du_kien: sp.giaBanDuKien,
    gia_von_du_kien: sp.giaVonDuKien,
    ti_le_size: sp.tiLeSize,
    bang_size: sp.bangSize,
    ds_mau: sp.dsMau,
    ghi_chu: sp.ghiChu,
    ngay_tao: sp.ngayTao,
    trang_thai: sp.trangThai || "con-hang",
    da_ban: sp.daBan || 0,
    ncc: sp.ncc || "",
    chat_lieu: sp.chatLieu || "",
    luot_xem: sp.luotXem || 0,
    rating: sp.rating || 0,
    hinh_anh: sp.hinhAnh || "",
  };
}

export function DanhMucSPProvider({ children }: { children: ReactNode }) {
  const [dsSanPham, setDsSanPham] = useState<SanPham[]>([]);
  const [loading, setLoading] = useState(true);

  // Load tu Supabase, fallback localStorage, fallback MOCK
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      // B1: Luon doc localStorage cache truoc de khong blank
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached && mounted) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setDsSanPham(parsed);
            setLoading(false); // Show cached ngay
          }
        }
      } catch (_) {}

      // B2: Fetch Supabase (override cache neu co data moi)
      try {
        const { supabase } = await import("@/lib/supabase/client");
        const client = supabase;
        if (client) {
          const { data, error } = await client.from("san_pham").select("*").order("ma_sp", { ascending: true });
          if (error) throw error;

          if (data && data.length > 0 && mounted) {
            const mapped = data.map(item => mapSanPhamFromDB(item));
            setDsSanPham(mapped);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
          } else if (mounted) {
            const cached = localStorage.getItem(STORAGE_KEY);
            if (cached) {
               try { setDsSanPham(JSON.parse(cached)); } catch(e) { setDsSanPham(MOCK_DANH_MUC); }
            } else {
               setDsSanPham(MOCK_DANH_MUC);
               // Auto seed MOCK vao DB
               Promise.all(MOCK_DANH_MUC.map(async sp => {
                 const dbPayload = buildDBPayload(sp);
                 await client.from("san_pham").insert(dbPayload);
               })).catch(() => {});
            }
          }
        } else {
          // Khong co Supabase - dung localStorage
          const cached = localStorage.getItem(STORAGE_KEY);
          if (cached && mounted) {
            try { setDsSanPham(JSON.parse(cached)); } catch(e) { setDsSanPham(MOCK_DANH_MUC); }
          } else if (mounted) {
            setDsSanPham(MOCK_DANH_MUC);
          }
        }
      } catch (e) {
        console.error("Loi fetch San pham", e);
        // Fallback localStorage da duoc set o B1
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  const themSP = useCallback(async (sp: SanPham) => {
    setDsSanPham(prev => {
      const newList = [...prev, sp];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      return newList;
    });
    
    try {
      const { supabase } = await import("@/lib/supabase/client");
      const client = supabase;
      if (client) {
        await client.from("san_pham").insert(buildDBPayload(sp));
      }
    } catch(e) {
      console.error(e);
    }
  }, []);

  const suaSP = useCallback(async (id: string, data: Partial<SanPham>) => {
    setDsSanPham(prev => {
      const newList = prev.map(p => p.id === id ? { ...p, ...data } : p);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList)); // LUON save full object
      return newList;
    });
    
    try {
      const { supabase } = await import("@/lib/supabase/client");
      const client = supabase;
      if (client) {
         // Build snake_case payload - BAO GOM TAT CA FIELDS
         const snakeData: any = {};
         if (data.tenSP !== undefined) snakeData.ten_sp = data.tenSP;
         if (data.loaiSP !== undefined) snakeData.loai_sp = data.loaiSP;
         if (data.giaBanDuKien !== undefined) snakeData.gia_ban_du_kien = data.giaBanDuKien;
         if (data.giaVonDuKien !== undefined) snakeData.gia_von_du_kien = data.giaVonDuKien;
         if (data.tiLeSize !== undefined) snakeData.ti_le_size = data.tiLeSize;
         if (data.bangSize !== undefined) snakeData.bang_size = data.bangSize;
         if (data.dsMau !== undefined) snakeData.ds_mau = data.dsMau;
         if (data.ghiChu !== undefined) snakeData.ghi_chu = data.ghiChu;
         if (data.ngayTao !== undefined) snakeData.ngay_tao = data.ngayTao;
         // === FIELDS BI THIEU TRUOC DAY (FIX) ===
         if (data.hinhAnh !== undefined) snakeData.hinh_anh = data.hinhAnh;
         if (data.trangThai !== undefined) snakeData.trang_thai = data.trangThai;
         if (data.chatLieu !== undefined) snakeData.chat_lieu = data.chatLieu;
         if (data.ncc !== undefined) snakeData.ncc = data.ncc;
         if (data.daBan !== undefined) snakeData.da_ban = data.daBan;
         if (data.rating !== undefined) snakeData.rating = data.rating;
         if (data.luotXem !== undefined) snakeData.luot_xem = data.luotXem;
         
         if (Object.keys(snakeData).length > 0) {
           await client.from("san_pham").update(snakeData).eq("ma_sp", id);
         }
      }
    } catch(e) {
      console.error(e);
    }
  }, []);

  const xoaSP = useCallback(async (id: string) => {
    setDsSanPham(prev => {
      const newList = prev.filter(p => p.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      return newList;
    }); // Optimistic update
    try {
      const { supabase } = await import("@/lib/supabase/client");
      const client = supabase;
      if (client) {
         await client.from("san_pham").delete().eq("ma_sp", id);
      }
    } catch(e) {
      console.error(e);
    }
  }, []);

  return (
    <DanhMucSPContext.Provider value={{ dsSanPham, themSP, suaSP, xoaSP, loading }}>
      {children}
    </DanhMucSPContext.Provider>
  );
}

export function useDanhMucSP() {
  const context = useContext(DanhMucSPContext);
  if (context === undefined) {
    throw new Error("useDanhMucSP must be used within a DanhMucSPProvider");
  }
  return context;
}
