
// ============ LENH CAT STORE (Giai Ä‘oáº¡n 3 - NÃ¢ng cáº¥p) ============
// Quáº£n lÃ½ Lá»‡nh Cáº¯t má»›i táº¡o (CuttingOrder)
// LÆ°u localStorage `mimin_lenh_cat_v2` + sync Supabase
// Auto-generate ID theo format LC-2026-XXXX
// CRUD: themLenhCat, suaLenhCat, xoaLenhCat
// 2026-08-03: ThÃªm sync Supabase (sáº¿p Sang báº­t láº¡i schema)

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { logWorkflow } from "../audit-log";
import { useSupabaseRealtime } from "@/lib/supabase/sync-helper";
import { supabaseUpsert, supabaseDelete, supabaseFetchAll, isSupabaseEnabled } from "@/lib/supabase/client";
import type { AppUser } from "@/components/session-provider";
import { usePhanCong } from "./cong-no-store";

export type LoaiSP = "AoTru" | "AoCoTron" | "BoTru" | "BoCoTron" | "AoPolo" | "PhuKien";
export type LoaiLenh = "HangNha" | "HangDat";

export const LOAI_SP_LABELS: Record<LoaiSP, string> = {
  "AoTru": "Ão Trá»¥",
  "AoCoTron": "Ão Cá»• TrÃ²n",
  "BoTru": "Bá»™ Trá»¥",
  "BoCoTron": "Bá»™ Cá»• TrÃ²n",
  "AoPolo": "Ão Polo",
  "PhuKien": "Phá»¥ Kiá»‡n",
};

export const BANG_CHI_PHI_CO_DINH: Record<LoaiSP, ChiPhiCoDinh> = {
  "BoTru": { "EPKEOTRU": 300, "EPNHAN": 300, "BAOBI_GIAY": 700, "THEBAI": 700, "DAYKEO": 1400, "THUNQUAN": 1500 },
  "AoTru": { "EPKEOTRU": 300, "EPNHAN": 300, "BAOBI_GIAY": 700, "THEBAI": 700, "DAYKEO": 0, "THUNQUAN": 0 },
  "BoCoTron": { "EPKEOTRU": 0, "EPNHAN": 300, "BAOBI_GIAY": 700, "THEBAI": 700, "DAYKEO": 1400, "THUNQUAN": 1500 },
  "AoCoTron": { "EPKEOTRU": 0, "EPNHAN": 300, "BAOBI_GIAY": 700, "THEBAI": 700, "DAYKEO": 0, "THUNQUAN": 0 },
  "AoPolo": { "EPKEOTRU": 300, "EPNHAN": 300, "BAOBI_GIAY": 700, "THEBAI": 700, "DAYKEO": 0, "THUNQUAN": 0 },
  "PhuKien": { "BAOBI_GIAY": 0, "THEBAI": 0 }
};

export type TrangThaiLenhCat = "Nhap" | "DaTao" | "DangCat" | "HoanThanh" | "ChuyenTiep";

export const TRANG_THAI_LC_LABELS: Record<TrangThaiLenhCat, string> = {
  "Nhap": "Báº£n nhÃ¡p",
  "DaTao": "ÄÃ£ táº¡o",
  "DangCat": "Äang cáº¯t",
  "HoanThanh": "HoÃ n thÃ nh",
  "ChuyenTiep": "Chuyá»ƒn tiáº¿p",
};

export const TRANG_THAI_LC_STYLE: Record<TrangThaiLenhCat, { bg: string; color: string }> = {
  "Nhap": { bg: "bg-slate-500/15", color: "text-slate-700" },
  "DaTao": { bg: "bg-blue-500/15", color: "text-blue-700" },
  "DangCat": { bg: "bg-amber-500/15", color: "text-amber-700" },
  "HoanThanh": { bg: "bg-emerald-500/15", color: "text-emerald-700" },
  "ChuyenTiep": { bg: "bg-purple-500/15", color: "text-purple-700" },
};

export type MauVai = {
  ten: string;
  maSKU?: string;
  maVai: string;
  dinhMuc: number;
  slDuKien: number;
  slThucTe?: number;
  kgThucTe?: number;
  haoHut?: number;
  ghiChu: string;
  img: string;
  phanBoSize: { size: string; sl: number }[];
  
  // Náº¾U LÃ€ Bá»˜ THÃŒ CÃ“ THÃŠM QUáº¦N
  maVaiQuan?: string;
  dinhMucQuan?: number;
  imgQuan?: string;    // áº¢nh máº«u QUáº¦N (hÃ ng Bá»™) - img á»Ÿ trÃªn lÃ  áº£nh ÃO
  phanBoSizeQuan?: { size: string; sl: number }[];

  // MÃ u phá»‘i - danh sÃ¡ch TÃŠN MÃ€U dÃ¹ng Ä‘á»ƒ phá»‘i (viá»n, phá»‘i mÃ u...), khÃ´ng gáº¯n mÃ£ váº£i trong kho.
  // CHá»ˆ mang tÃ­nh tham kháº£o, KHÃ”NG tÃ­nh vÃ o Ä‘á»‹nh má»©c/tiá»n váº£i (chá»‰ váº£i chÃ­nh maVai/maVaiQuan má»›i tÃ­nh).
  mauPhoi?: string[];

  // Tracking tá»‰ lá»‡ size chi tiáº¿t theo tá»«ng khÃ¢u (Cáº¯t, May Ão, May Quáº§n, In/ThÃªu, á»¦i/QC...)
  // Key: id khÃ¢u (vidu: "cat", "mayAo") -> Value: list size distribution
  tyLeSizeChiTiet?: Record<string, { size: string; sl: number }[]>;

  // Káº¿t quáº£ GhÃ©p Ão+Quáº§n theo Size táº¡i khÃ¢u QC (2026-08-22) - pháº§n dÆ° 1 bÃªn
  // khÃ´ng cÃ³ bÃªn kia ghÃ©p cÃ¹ng, giá»¯ láº¡i theo tá»«ng size Ä‘á»ƒ QC/quáº£n lÃ½ biáº¿t cÃ²n
  // tá»“n Ão/Quáº§n láº» chÆ°a ghÃ©p Ä‘Æ°á»£c thÃ nh Bá»™. KhÃ´ng dÃ¹ng cho tÃ­nh SL nháº­n cá»§a
  // khÃ¢u sau (Ä‘Ã£ ghi vÃ o tyLeSizeChiTiet["qc"]) - chá»‰ Ä‘á»ƒ hiá»ƒn thá»‹/theo dÃµi.
  aoDuTheoSize?: { size: string; sl: number }[];
  quanDuTheoSize?: { size: string; sl: number }[];
};

export type LenhCatPhuLieu = {
  maPL: string;
  tenPL: string;
  soLuong: number;
  donGia: number;
  dvt: string;
  // Váº­t tÆ° thuá»™c Ão hay Quáº§n (hÃ ng Bá»™) - khÃ´ng set = dÃ¹ng chung
  apDungCho?: "ao" | "quan";
  // Index vÃ o dsMau - váº­t tÆ° nÃ y gáº¯n vá»›i mÃ u váº£i nÃ o (Ä‘á»ƒ hiá»‡n ngay trong card mÃ u Ä‘Ã³
  // cho bÃªn gia cÃ´ng biáº¿t Ä‘Ãºng mÃ u). KhÃ´ng set = dÃ¹ng chung má»i mÃ u (dá»¯ liá»‡u cÅ©).
  mauIdx?: number;
};

// P0 - 2026-08-07 - Tach ro NV noi bo vs Xuong ngoai (FK + tracking thanh toan)
export type TrangThaiThanhToan = "chua_tra" | "tra_mot_phan" | "da_tra_du";

// Type chung cho moi cong doan
export type TrangThaiCongDoan = "cho_giao" | "dang_lam" | "cho_qc" | "hoan_thanh" | "co_loi";

export const TRANG_THAI_CD_LABELS: Record<TrangThaiCongDoan, string> = {
  "cho_giao":    "Chá» giao",
  "dang_lam":    "Äang lÃ m",
  "cho_qc":      "Chá» QC duyá»‡t",
  "hoan_thanh":  "HoÃ n thÃ nh",
  "co_loi":      "CÃ³ lá»—i",
};

export const TRANG_THAI_CD_STYLE: Record<TrangThaiCongDoan, { bg: string; text: string; dot: string }> = {
  "cho_giao":   { bg: "bg-slate-100",   text: "text-slate-600",   dot: "bg-slate-400" },
  "dang_lam":   { bg: "bg-amber-100",   text: "text-amber-700",   dot: "bg-amber-400" },
  "cho_qc":     { bg: "bg-sky-100",     text: "text-sky-700",     dot: "bg-sky-500" },
  "hoan_thanh": { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  "co_loi":     { bg: "bg-rose-100",    text: "text-rose-700",    dot: "bg-rose-500" },
};

export type CatChiTietTrangThai = "cho_lam" | "hoan_thanh" | "khong_can";

export type CatChiTiet = {
  nhanLieu: CatChiTietTrangThai;
  traiVai: CatChiTietTrangThai;
  catHang: CatChiTietTrangThai;
  epNhan: CatChiTietTrangThai;
  epKeo: CatChiTietTrangThai;
};

// Lá»‹ch sá»­ 1 láº§n QC kiá»ƒm tra (má»—i láº§n kiá»ƒm = 1 pháº§n tá»­)
export type LichSuQCItem = {
  lan: number;                       // Láº§n kiá»ƒm thá»© máº¥y (1, 2, 3...)
  ngay: string;                      // ISO date
  slDat: number;                     // SL Ä‘áº¡t láº§n nÃ y
  slLoi: number;                     // SL lá»—i láº§n nÃ y
  loaiLoi?: string;                  // Loáº¡i lá»—i
  khauGayLoi?: string;               // KhÃ¢u gÃ¢y ra lá»—i (Tá»• May, Tá»• Cáº¯t...)
  nguoiKiem?: string;                // NgÆ°á»i QC kiá»ƒm
  ketQua: "dat" | "tra_lai" | "hoan_tat"; // dat=Ä‘áº¡t háº¿t, tra_lai=tráº£ vá» sá»­a, hoan_tat=Ä‘Ã£ xong vÃ²ng láº·p
  ghiChu?: string;
  daPhatQuaHan?: boolean;
};

// Lá»‹ch sá»­ nháº­p SL tá»«ng sá»± kiá»‡n (dÃ¹ng cho nháº­p kho + cÃ´ng ná»£ + lÆ°Æ¡ng)
export type LichSuNhapSLItem = {
  ngay: string;                      // ISO date
  nguoiNhap?: string;               // NgÆ°á»i nháº­p
  soLuong: number;                   // SL táº¡i sá»± kiá»‡n nÃ y
  loai: "nhan_viec" | "hoan_thanh" | "sua_loi" | "qc_dat" | "tra_loi" | "nhap_kho";
  ghiChu?: string;
};

type CongDoanBase = {
  id: string; // e.g. "cat", "mayAo", "in", "theu" or auto-generated
  tenCongDoan: string; // e.g. "Cáº¯t", "May Ão", "In", "ThÃªu", "á»¦i", "ÄÃ³ng GÃ³i", "In Chuyá»ƒn Nhiá»‡t"
  donGia: number;
  soLuong: number;          // So luong SP giao cho cong doan nay
  thanhTien: number;        // = donGia * soLuong
  // Thanh toan (P0 - moi)
  daThanhToan: number;      // So tien da tra
  conLai: number;           // = thanhTien - daThanhToan
  trangThaiTT: TrangThaiThanhToan;
  ngayThanhToan?: string;   // Ngay thanh toan gan nhat
  ghiChu?: string;
  // Workflow tracking (P1 - 2026-08-09)
  trangThaiCD?: TrangThaiCongDoan; // Tráº¡ng thÃ¡i cÃ´ng Ä‘oáº¡n
  soLuongHoanThanh?: number;       // SP Ä‘Ã£ lÃ m xong (tá»•ng Ä‘áº¡t cuá»‘i)
  soLuongLoi?: number;             // SP lá»—i (cÃ²n tá»“n)
  lyDoLoi?: string;                // LÃ½ do lá»—i
  ngayNhanViec?: string;           // NgÃ y nháº­n viá»‡c
  ngayHoanThanh?: string;          // NgÃ y hoÃ n thÃ nh thá»±c táº¿
  // Chi tiáº¿t 4 bÆ°á»›c dÃ nh riÃªng cho khÃ¢u Cáº¯t
  catChiTiet?: CatChiTiet;
  // Khai bÃ¡o chi tiáº¿t sá»‘ lÆ°á»£ng theo mÃ u (Má»›i)
  chiTietMau?: {
    mau: string;
    soLuongNhan: number;
    soLuongDat: number;
    soLuongLoi: number;
  }[];
  // === QC DEFECT RETURN FLOW (P2 - 2026-08-22) ===
  // Lá»‹ch sá»­ cÃ¡c láº§n QC kiá»ƒm tra (vÃ²ng láº·p May â†” QC)
  lichSuQC?: LichSuQCItem[];
  // SL Ä‘Ã£ sá»­a xong (Tá»• May sá»­a vÃ  tráº£ láº¡i QC)
  soLuongSuaXong?: number;
  // SL pháº¿ pháº©m (lá»—i khÃ´ng sá»­a Ä‘Æ°á»£c - loáº¡i bá»)
  soLuongPhePham?: number;
  // SL Ä‘áº¡t cuá»‘i cÃ¹ng = tá»•ng SL Ä‘áº¡t qua táº¥t cáº£ vÃ²ng QC (dÃ¹ng Ä‘á»ƒ tÃ­nh cÃ´ng ná»£/lÆ°Æ¡ng)
  soLuongDatCuoi?: number;
  // Lá»‹ch sá»­ nháº­p SL toÃ n bá»™ sá»± kiá»‡n (dÃ¹ng cho nháº­p kho, cÃ´ng ná»£, lÆ°Æ¡ng)
  lichSuNhapSL?: LichSuNhapSLItem[];
};


// NV noi bo (nhan vien trong nha may)
export type PhanCongNoiBo = CongDoanBase & {
  loaiNguoi: "noi_bo";
  nguoiMa: string;     // ma_nv
  nguoiTen: string;
  nhanSuId?: string;   // FK -> nhan_su.ma_nv (backward compat alias)
};

// Xuong gia cong ngoai
export type PhanCongXuongNgoai = CongDoanBase & {
  loaiNguoi: "xuong_ngoai";
  nguoiMa: string;     // ma_xuong
  nguoiTen: string;
  maXuong?: string;    // FK -> xuong_gia_cong.ma_xuong (backward compat alias)
  hanThanhToan?: string; // Deadline tra tien xuong
};

// Discriminated union
export type CongDoanItem = PhanCongNoiBo | PhanCongXuongNgoai;
export type PhanCongGiaCong = CongDoanItem[];

export type ChiPhiCoDinh = {
  [key: string]: number;
};

export type BangCOGS = {
  tongTienVai: number;
  tongTienPhuLieu: number;
  giaCong1SP: number;
  tongChiPhiCoDinh: number;
  giaVonBinhQuan: number;
  // Aliases cho UI hiá»ƒn thá»‹ (Antigravity dÃ¹ng trong page.tsx)
  giaVon1SP?: number;       // = giaVonBinhQuan
  tongGiaVon?: number;      // = giaVonBinhQuan * tongSL
};

export type LenhCat = {
  id: string; // Tá»± sinh VD: LC-2026-0001
  loaiLenh: LoaiLenh;
  khachHang?: string; // Náº¿u lÃ  HÃ ng Äáº·t
  loaiSP: LoaiSP;
  maSP: string;
  tenSP: string;
  tongSL: number;
  tongSLThucTe?: number;
  tongSLThucTeAo?: number;
  tongSLThucTeQuan?: number;
  hanHoanThanh: string;
  tiLeSize: string; // VD 1:2:2:1
  // MÃ u sáº¯c & Váº£i
  dsMau: MauVai[];
  // Phá»¥ liá»‡u
  dsPhuLieu: LenhCatPhuLieu[];
  // Gia CÃ´ng
  mauCongDoan?: string;
  phanCong: PhanCongGiaCong;
  // Chi PhÃ­ Cá»‘ Äá»‹nh
  mauChiPhi?: string;
  chiPhiCoDinh: ChiPhiCoDinh;
  // Báº£ng tÃ­nh
  bangCOGS?: BangCOGS;
  // SÆ¡ Ä‘á»“ Ã¡o/quáº§n (PLT) - dÃ¹ng Ä‘á»ƒ tá»± tÃ­nh Ä‘á»‹nh má»©c kg/SP
  daiSoDoAo?: string;
  soDoAo?: string;
  daiSoDoQuan?: string;
  soDoQuan?: string;
  // SÆ¡ Ä‘á»“ cáº¯t
  soDoChinh?: string;
  pdfSoDoChinh?: string;
  khoSoDoChinh?: string;
  daiSoDoChinh?: string;
  soDoPhoi?: string;
  pdfSoDoPhoi?: string;
  khoSoDoPhoi?: string;
  daiSoDoPhoi?: string;
  ghiChuSoDoChinh?: string;
  ghiChuSoDoPhoi?: string;
  daCoSoDo?: boolean;
  ghiChuKyThuat?: string;
  // TÃ i liá»‡u In/ThÃªu (máº«u)
  hinhMauInTheu?: string;
  fileGocInTheu?: string;
  ghiChuInTheu?: string;
  
  // Meta
  phuTrachCat: string;
  phuTrachSX?: string;
  phuTrachSoDo?: string;
  ghiChu?: string;
  trangThai: TrangThaiLenhCat;
  phienBanDinhMuc: number;
  ngayTao: string;
  nguoiTao?: string;
};


export type MauCongDoanItem = {
  id: string;
  ten: string;
  giaCong: PhanCongGiaCong;
};

export type MauChiPhiItem = {
  id: string;
  ten: string;
  chiPhi: ChiPhiCoDinh;
};

const DEFAULT_MAU_CONG_DOAN: MauCongDoanItem[] = [
  {
    id: "MCD-AO-TRON",
    ten: "Ão trÃ²n",
    giaCong: [
      { id: "cat", loaiNguoi: "noi_bo", tenCongDoan: "Cáº¯t Ã¡o", nguoiMa: "", nguoiTen: "", donGia: 1400, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra", catChiTiet: { nhanLieu: "cho_lam", traiVai: "cho_lam", catHang: "cho_lam", epNhan: "cho_lam", epKeo: "khong_can" } },
      { id: "in_theu", loaiNguoi: "xuong_ngoai", tenCongDoan: "In/ThÃªu", nguoiMa: "", nguoiTen: "", donGia: 1500, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" },
      { id: "may_ao", loaiNguoi: "noi_bo", tenCongDoan: "May Ã¡o", nguoiMa: "", nguoiTen: "", donGia: 13000, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" },
      { id: "qc", loaiNguoi: "noi_bo", tenCongDoan: "QC (Kiá»ƒm hÃ ng)", nguoiMa: "", nguoiTen: "", donGia: 500, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" },
      { id: "ui", loaiNguoi: "noi_bo", tenCongDoan: "á»¦i", nguoiMa: "", nguoiTen: "", donGia: 900, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" },
      { id: "dong_goi", loaiNguoi: "noi_bo", tenCongDoan: "ÄÃ³ng gÃ³i", nguoiMa: "", nguoiTen: "", donGia: 700, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" },
      { id: "nhap_kho", loaiNguoi: "noi_bo", tenCongDoan: "Nháº­p kho", nguoiMa: "", nguoiTen: "", donGia: 0, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" }
    ]
  },
  {
    id: "MCD-AO-TRU",
    ten: "Ão trá»¥",
    giaCong: [
      { id: "cat", loaiNguoi: "noi_bo", tenCongDoan: "Cáº¯t Ã¡o", nguoiMa: "", nguoiTen: "", donGia: 1400, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra", catChiTiet: { nhanLieu: "cho_lam", traiVai: "cho_lam", catHang: "cho_lam", epNhan: "cho_lam", epKeo: "cho_lam" } },
      { id: "in_theu", loaiNguoi: "xuong_ngoai", tenCongDoan: "In/ThÃªu", nguoiMa: "", nguoiTen: "", donGia: 1500, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" },
      { id: "may_ao", loaiNguoi: "noi_bo", tenCongDoan: "May Ã¡o", nguoiMa: "", nguoiTen: "", donGia: 15000, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" },
      { id: "qc", loaiNguoi: "noi_bo", tenCongDoan: "QC (Kiá»ƒm hÃ ng)", nguoiMa: "", nguoiTen: "", donGia: 500, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" },
      { id: "khuy_nut", loaiNguoi: "noi_bo", tenCongDoan: "Khuy nÃºt", nguoiMa: "", nguoiTen: "", donGia: 750, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" },
      { id: "ui", loaiNguoi: "noi_bo", tenCongDoan: "á»¦i", nguoiMa: "", nguoiTen: "", donGia: 900, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" },
      { id: "dong_goi", loaiNguoi: "noi_bo", tenCongDoan: "ÄÃ³ng gÃ³i", nguoiMa: "", nguoiTen: "", donGia: 700, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" },
      { id: "nhap_kho", loaiNguoi: "noi_bo", tenCongDoan: "Nháº­p kho", nguoiMa: "", nguoiTen: "", donGia: 0, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" }
    ]
  },
  {
    id: "MCD-BO-TRON",
    ten: "Bá»™ trÃ²n",
    giaCong: [
      { id: "cat", loaiNguoi: "noi_bo", tenCongDoan: "Cáº¯t bá»™", nguoiMa: "", nguoiTen: "", donGia: 2300, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra", catChiTiet: { nhanLieu: "cho_lam", traiVai: "cho_lam", catHang: "cho_lam", epNhan: "cho_lam", epKeo: "khong_can" } },
      { id: "in_theu", loaiNguoi: "xuong_ngoai", tenCongDoan: "In/ThÃªu", nguoiMa: "", nguoiTen: "", donGia: 1500, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" },
      { id: "may_ao", loaiNguoi: "noi_bo", tenCongDoan: "May Ã¡o", nguoiMa: "", nguoiTen: "", donGia: 13000, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" },
      { id: "may_quan", loaiNguoi: "noi_bo", tenCongDoan: "May quáº§n", nguoiMa: "", nguoiTen: "", donGia: 9500, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" },
      { id: "qc", loaiNguoi: "noi_bo", tenCongDoan: "QC (Kiá»ƒm hÃ ng)", nguoiMa: "", nguoiTen: "", donGia: 500, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" },
      { id: "ui", loaiNguoi: "noi_bo", tenCongDoan: "á»¦i", nguoiMa: "", nguoiTen: "", donGia: 1500, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" },
      { id: "dong_goi", loaiNguoi: "noi_bo", tenCongDoan: "ÄÃ³ng gÃ³i", nguoiMa: "", nguoiTen: "", donGia: 1200, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" },
      { id: "nhap_kho", loaiNguoi: "noi_bo", tenCongDoan: "Nháº­p kho", nguoiMa: "", nguoiTen: "", donGia: 0, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" }
    ]
  },
  {
    id: "MCD-BO-TRU",
    ten: "Bá»™ trá»¥",
    giaCong: [
      { id: "cat", loaiNguoi: "noi_bo", tenCongDoan: "Cáº¯t bá»™", nguoiMa: "", nguoiTen: "", donGia: 2300, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra", catChiTiet: { nhanLieu: "cho_lam", traiVai: "cho_lam", catHang: "cho_lam", epNhan: "cho_lam", epKeo: "cho_lam" } },
      { id: "in_theu", loaiNguoi: "xuong_ngoai", tenCongDoan: "In/ThÃªu", nguoiMa: "", nguoiTen: "", donGia: 1500, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" },
      { id: "may_ao", loaiNguoi: "noi_bo", tenCongDoan: "May Ã¡o", nguoiMa: "", nguoiTen: "", donGia: 13000, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" },
      { id: "may_quan", loaiNguoi: "noi_bo", tenCongDoan: "May quáº§n", nguoiMa: "", nguoiTen: "", donGia: 9500, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" },
      { id: "qc", loaiNguoi: "noi_bo", tenCongDoan: "QC (Kiá»ƒm hÃ ng)", nguoiMa: "", nguoiTen: "", donGia: 500, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" },
      { id: "khuy_nut", loaiNguoi: "noi_bo", tenCongDoan: "Khuy nÃºt", nguoiMa: "", nguoiTen: "", donGia: 750, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" },
      { id: "ui", loaiNguoi: "noi_bo", tenCongDoan: "á»¦i", nguoiMa: "", nguoiTen: "", donGia: 900, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" },
      { id: "dong_goi", loaiNguoi: "noi_bo", tenCongDoan: "ÄÃ³ng gÃ³i", nguoiMa: "", nguoiTen: "", donGia: 1200, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" },
      { id: "nhap_kho", loaiNguoi: "noi_bo", tenCongDoan: "Nháº­p kho", nguoiMa: "", nguoiTen: "", donGia: 0, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" }
    ]
  }
];

const DEFAULT_MAU_CHI_PHI: MauChiPhiItem[] = [];

const STORAGE_KEY_MCD = "mimin_mau_cong_doan";
const STORAGE_KEY_MCP = "mimin_mau_chi_phi";
const STORAGE_KEY = "mimin_lenh_cat_v2";

export function generateLenhCatId(existing: LenhCat[]): string {
  const year = new Date().getFullYear();
  const yearPrefix = `LC-${year}-`;
  const yearItems = existing.filter((l) => l.id.startsWith(yearPrefix));
  const maxNum = yearItems.reduce((max, l) => {
    const n = parseInt(l.id.replace(yearPrefix, ""), 10);
    return isNaN(n) ? max : Math.max(max, n);
  }, 0);
  const nextNum = (maxNum + 1).toString().padStart(4, "0");
  return `${yearPrefix}${nextNum}`;
}

// Bá» hÃ m tÃ­nh COGS tÄ©nh, sáº½ tÃ­nh Ä‘á»™ng trong component vÃ  lÆ°u lÃºc submit

interface LenhCatStore {
  dsLenhCat: LenhCat[];
  themLenhCat: (lenh: LenhCat, nguoiTao: AppUser) => Promise<void>;
  suaLenhCat: (id: string, lenh: Partial<LenhCat>, nguoiSua: AppUser) => void;
  xoaLenhCat: (id: string, nguoiXoa: AppUser) => void;
  dsMauCongDoan: MauCongDoanItem[];
  themMauCongDoan: (mau: MauCongDoanItem) => void;
  xoaMauCongDoan: (id: string) => void;
  dsMauChiPhi: MauChiPhiItem[];
  themMauChiPhi: (mau: MauChiPhiItem) => void;
  xoaMauChiPhi: (id: string) => void;
  capNhatTrangThai: (id: string, tt: TrangThaiLenhCat, u: any) => void;
  capNhatCongDoan: (lenhId: string, congDoanId: string, data: {
    trangThaiCD?: TrangThaiCongDoan;
    soLuongHoanThanh?: number;
    soLuongLoi?: number;
    lyDoLoi?: string;
    thanhTien?: number;
    conLai?: number;
    catChiTiet?: CatChiTiet;
    chiTietMau?: any;
  }) => void;
  reset: () => void;
  loading: boolean;
}

const LenhCatContext = createContext<LenhCatStore | null>(null);

const DUMMY_DATA: LenhCat[] = [];

export function LenhCatProvider({ children }: { children: ReactNode }) {
  const { upsertTuLenhCat } = usePhanCong();
  const [dsLenhCat, setDsLenhCat] = useState<LenhCat[]>([]);
  const [dsMauCongDoan, setDsMauCongDoan] = useState<MauCongDoanItem[]>([]);
  const [dsMauChiPhi, setDsMauChiPhi] = useState<MauChiPhiItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [loading, setLoading] = useState(true);
  // isSupabaseReady: set true sau khi Supabase fetch xong (thÃ nh cÃ´ng hoáº·c tháº¥t báº¡i)
  // DÃ¹ng Ä‘á»ƒ Ä‘á»“ng bá»™ vá»›i isLoaded (localStorage) trÆ°á»›c khi render Provider
  const [isSupabaseDone, setIsSupabaseDone] = useState(false);

  // Load Lá»‡nh Cáº¯t tá»« Supabase
  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        const { supabase } = await import("@/lib/supabase/client");
        if (supabase) {
          const { data, error } = await supabase!.from("lenh_cat").select("*").order("created_at", { ascending: false });
          if (error) throw error;
          
          if (data && mounted) {
            const mapped = data.map(item => ({
              id: item.id,
              loaiLenh: item.loai_lenh,
              khachHang: item.khach_hang,
              loaiSP: item.loai_sp,
              maSP: item.ma_sp,
              tenSP: item.ten_sp,
              tongSL: item.tong_sl,
              tongSLThucTe: item.tong_sl_thuc_te,
              tongSLThucTeAo: item.tong_sl_thuc_te_ao,
              tongSLThucTeQuan: item.tong_sl_thuc_te_quan,
              hanHoanThanh: item.han_hoan_thanh,
              tiLeSize: item.ti_le_size,
              dsMau: item.ds_mau || [],
              dsPhuLieu: item.ds_phu_lieu || [],
              mauCongDoan: item.mau_cong_doan,
              phanCong: item.phan_cong || [],
              mauChiPhi: item.mau_chi_phi,
              chiPhiCoDinh: item.chi_phi_co_dinh || {},
              bangCOGS: item.bang_cogs,
              phuTrachCat: item.phu_trach_cat,
              phuTrachSX: item.phu_trach_sx,
              phuTrachSoDo: item.phu_trach_so_do,
              ghiChu: item.ghi_chu,
              trangThai: item.trang_thai,
              phienBanDinhMuc: item.phien_ban_dinh_muc,
              ngayTao: item.ngay_tao,
              nguoiTao: item.nguoi_tao
            }));
            // Merge thay vÃ¬ ghi Ä‘Ã¨: Æ°u tiÃªn báº£n ghi Supabase (nguá»“n sá»± tháº­t),
            // nhÆ°ng GIá»® láº¡i lá»‡nh cáº¯t chá»‰ cÃ³ á»Ÿ local (táº¡o lÃºc máº¥t máº¡ng) - trÆ°á»›c
            // Ä‘Ã¢y setDsLenhCat(mapped) thay sáº¡ch state nÃªn cÃ¡c lá»‡nh nÃ y bá»‹ xoÃ¡.
            const remoteIds = new Set(mapped.map((r) => r.id));
            setDsLenhCat((prev) => [
              ...(mapped as LenhCat[]),
              ...prev.filter((x) => !remoteIds.has(x.id)),
            ]);
          }
        }
      } catch (err) {
        console.error("Lá»—i fetch Lá»‡nh cáº¯t", err);
      } finally {
        if (mounted) {
          setLoading(false);
          setIsSupabaseDone(true);
        }
      }
    };
    loadData();
    return () => { mounted = false; };
  }, []);

  // Load Máº«u tá»« localStorage
  useEffect(() => {
    try {
      const storedMCD = localStorage.getItem(STORAGE_KEY_MCD);
      if (storedMCD) {
        try {
          const parsed = JSON.parse(storedMCD);
          // If old format (object instead of array), reset
          if (parsed.length > 0 && !Array.isArray(parsed[0].giaCong)) {
            setDsMauCongDoan(DEFAULT_MAU_CONG_DOAN);
            localStorage.setItem(STORAGE_KEY_MCD, JSON.stringify(DEFAULT_MAU_CONG_DOAN));
          } else {
            setDsMauCongDoan(parsed);
          }
        } catch {
          setDsMauCongDoan([]);
        }
      } else {
        setDsMauCongDoan([]);
        localStorage.setItem(STORAGE_KEY_MCD, JSON.stringify(DEFAULT_MAU_CONG_DOAN));
      }

      const storedMCP = localStorage.getItem(STORAGE_KEY_MCP);
      if (storedMCP) {
        try {
          const parsed = JSON.parse(storedMCP);
          if (Array.isArray(parsed) && parsed.every((p: any) => p && typeof p.id === "string")) {
            setDsMauChiPhi(parsed);
          } else {
            setDsMauChiPhi(DEFAULT_MAU_CHI_PHI);
            localStorage.setItem(STORAGE_KEY_MCP, JSON.stringify(DEFAULT_MAU_CHI_PHI));
          }
        } catch {
          setDsMauChiPhi([]);
        }
      } else {
        setDsMauChiPhi(DEFAULT_MAU_CHI_PHI);
        localStorage.setItem(STORAGE_KEY_MCP, JSON.stringify(DEFAULT_MAU_CHI_PHI));
      }

    } catch (err) {
      console.error(err);
    }
    setIsLoaded(true);
  }, []);

  const themLenhCat = useCallback(async (lenh: LenhCat, u: AppUser) => {
    {
      const { supabase: sb } = await import("@/lib/supabase/client");
      if (sb) {
        const { data: trung } = await sb.from("lenh_cat").select("id").eq("id", lenh.id).limit(1).maybeSingle();
        if (trung) {
          throw new Error(`MÃ£ lá»‡nh cáº¯t ${lenh.id} Ä‘Ã£ tá»“n táº¡i. Vui lÃ²ng táº£i láº¡i trang rá»“i táº¡o láº¡i Ä‘á»ƒ láº¥y mÃ£ má»›i.`);
        }
      }
    }

    setDsLenhCat((prev) => [lenh, ...prev]);
    logWorkflow(u, "create", `Táº¡o lá»‡nh cáº¯t ${lenh.id}`, lenh.id, { module: "lenh-cat" });
    const { supabase } = await import("@/lib/supabase/client");
    if (!supabase) throw new Error("Supabase chÆ°a káº¿t ná»‘i");
    const { error } = await supabase!.from("lenh_cat").upsert({
      id: lenh.id, loai_lenh: lenh.loaiLenh, khach_hang: lenh.khachHang, loai_sp: lenh.loaiSP, ma_sp: lenh.maSP,
      ten_sp: lenh.tenSP, tong_sl: lenh.tongSL, tong_sl_thuc_te: lenh.tongSLThucTe,
      han_hoan_thanh: lenh.hanHoanThanh, ti_le_size: lenh.tiLeSize, ds_mau: lenh.dsMau, ds_phu_lieu: lenh.dsPhuLieu,
      mau_cong_doan: lenh.mauCongDoan, phan_cong: lenh.phanCong, mau_chi_phi: lenh.mauChiPhi,
      chi_phi_co_dinh: lenh.chiPhiCoDinh, bang_cogs: lenh.bangCOGS, /* phu_trach_cat: lenh.phuTrachCat, */
      /* phu_trach_sx: lenh.phuTrachSX, phu_trach_so_do: lenh.phuTrachSoDo, */ ghi_chu: lenh.ghiChu, 
      /* ghi_chu_ky_thuat: lenh.ghiChuKyThuat, */ trang_thai: lenh.trangThai,
      phien_ban_dinh_muc: lenh.phienBanDinhMuc, ngay_tao: lenh.ngayTao, nguoi_tao: lenh.nguoiTao,
      // dai_so_do_ao: lenh.daiSoDoAo, so_do_ao: lenh.soDoAo, dai_so_do_quan: lenh.daiSoDoQuan, so_do_quan: lenh.soDoQuan,
      // so_do_chinh: lenh.soDoChinh, pdf_so_do_chinh: lenh.pdfSoDoChinh, kho_so_do_chinh: lenh.khoSoDoChinh, dai_so_do_chinh: lenh.daiSoDoChinh,
      // so_do_phoi: lenh.soDoPhoi, pdf_so_do_phoi: lenh.pdfSoDoPhoi, kho_so_do_phoi: lenh.khoSoDoPhoi, dai_so_do_phoi: lenh.daiSoDoPhoi,
      // ghi_chu_so_do_chinh: lenh.ghiChuSoDoChinh, ghi_chu_so_do_phoi: lenh.ghiChuSoDoPhoi, da_co_so_do: lenh.daCoSoDo,
      // hinh_mau_in_theu: lenh.hinhMauInTheu, file_goc_in_theu: lenh.fileGocInTheu, ghi_chu_in_theu: lenh.ghiChuInTheu
    });
    if (error) throw error;
  }, []);

  const suaLenhCat = useCallback(async (id: string, lenh: Partial<LenhCat>, u: AppUser) => {
    setDsLenhCat((prev) => prev.map((item) => item.id === id ? { ...item, ...lenh } : item));
    logWorkflow(u, "update", `Cáº­p nháº­t lá»‡nh cáº¯t ${id}`, id, { module: "lenh-cat" });
    const { supabase } = await import("@/lib/supabase/client");
    if (supabase) {
      const updateData: any = {};
      if (lenh.loaiLenh !== undefined)         updateData.loai_lenh = lenh.loaiLenh;
      if (lenh.khachHang !== undefined)         updateData.khach_hang = lenh.khachHang;
      if (lenh.loaiSP !== undefined)            updateData.loai_sp = lenh.loaiSP;
      if (lenh.maSP !== undefined)              updateData.ma_sp = lenh.maSP;
      if (lenh.tenSP !== undefined)             updateData.ten_sp = lenh.tenSP;
      if (lenh.tongSL !== undefined)            updateData.tong_sl = lenh.tongSL;
      if (lenh.tongSLThucTe !== undefined)      updateData.tong_sl_thuc_te = lenh.tongSLThucTe;
      if (lenh.hanHoanThanh !== undefined)      updateData.han_hoan_thanh = lenh.hanHoanThanh;
      if (lenh.tiLeSize !== undefined)          updateData.ti_le_size = lenh.tiLeSize;
      if (lenh.dsMau !== undefined)             updateData.ds_mau = lenh.dsMau;
      if (lenh.dsPhuLieu !== undefined)         updateData.ds_phu_lieu = lenh.dsPhuLieu;
      if (lenh.mauCongDoan !== undefined)       updateData.mau_cong_doan = lenh.mauCongDoan;
      if (lenh.phanCong !== undefined)          updateData.phan_cong = lenh.phanCong;
      if (lenh.chiPhiCoDinh !== undefined)      updateData.chi_phi_co_dinh = lenh.chiPhiCoDinh;
      if (lenh.bangCOGS !== undefined)          updateData.bang_cogs = lenh.bangCOGS;
      // if (lenh.phuTrachCat !== undefined)       updateData.phu_trach_cat = lenh.phuTrachCat;
      // if (lenh.phuTrachSX !== undefined)        updateData.phu_trach_sx = lenh.phuTrachSX;
      // if (lenh.phuTrachSoDo !== undefined)      updateData.phu_trach_so_do = lenh.phuTrachSoDo;
      if (lenh.ghiChu !== undefined)            updateData.ghi_chu = lenh.ghiChu;
      if (lenh.trangThai !== undefined)         updateData.trang_thai = lenh.trangThai;
      if (lenh.phienBanDinhMuc !== undefined)   updateData.phien_ban_dinh_muc = lenh.phienBanDinhMuc;
      if (lenh.ngayTao !== undefined)           updateData.ngay_tao = lenh.ngayTao;

      // New BOM fields
      // if (lenh.daiSoDoAo !== undefined)         updateData.dai_so_do_ao = lenh.daiSoDoAo;
      // if (lenh.soDoAo !== undefined)            updateData.so_do_ao = lenh.soDoAo;
      // if (lenh.daiSoDoQuan !== undefined)       updateData.dai_so_do_quan = lenh.daiSoDoQuan;
      // if (lenh.soDoQuan !== undefined)          updateData.so_do_quan = lenh.soDoQuan;
      // if (lenh.soDoChinh !== undefined)         updateData.so_do_chinh = lenh.soDoChinh;
      // if (lenh.pdfSoDoChinh !== undefined)      updateData.pdf_so_do_chinh = lenh.pdfSoDoChinh;
      // if (lenh.khoSoDoChinh !== undefined)      updateData.kho_so_do_chinh = lenh.khoSoDoChinh;
      // if (lenh.daiSoDoChinh !== undefined)      updateData.dai_so_do_chinh = lenh.daiSoDoChinh;
      // if (lenh.soDoPhoi !== undefined)          updateData.so_do_phoi = lenh.soDoPhoi;
      // if (lenh.pdfSoDoPhoi !== undefined)       updateData.pdf_so_do_phoi = lenh.pdfSoDoPhoi;
      // if (lenh.khoSoDoPhoi !== undefined)       updateData.kho_so_do_phoi = lenh.khoSoDoPhoi;
      // if (lenh.daiSoDoPhoi !== undefined)       updateData.dai_so_do_phoi = lenh.daiSoDoPhoi;
      // if (lenh.ghiChuSoDoChinh !== undefined)   updateData.ghi_chu_so_do_chinh = lenh.ghiChuSoDoChinh;
      // if (lenh.ghiChuSoDoPhoi !== undefined)    updateData.ghi_chu_so_do_phoi = lenh.ghiChuSoDoPhoi;
      // if (lenh.daCoSoDo !== undefined)          updateData.da_co_so_do = lenh.daCoSoDo;
      // if (lenh.hinhMauInTheu !== undefined)     updateData.hinh_mau_in_theu = lenh.hinhMauInTheu;
      // if (lenh.fileGocInTheu !== undefined)     updateData.file_goc_in_theu = lenh.fileGocInTheu;
      // if (lenh.ghiChuInTheu !== undefined)      updateData.ghi_chu_in_theu = lenh.ghiChuInTheu;
      // if (lenh.ghiChuKyThuat !== undefined)     updateData.ghi_chu_ky_thuat = lenh.ghiChuKyThuat;

      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase!.from("lenh_cat").update(updateData).eq("id", id);
        if (error) throw error;
      }
    } else {
      throw new Error("Supabase chÆ°a káº¿t ná»‘i");
    }
  }, []);

  const xoaLenhCat = useCallback(async (id: string, u: AppUser) => {
    setDsLenhCat((prev) => prev.filter((item) => item.id !== id));
    logWorkflow(u, "delete", `XoÃ¡ lá»‡nh cáº¯t ${id}`, id, { module: "lenh-cat" });
    try {
      const { supabase } = await import("@/lib/supabase/client");
      if (supabase) await supabase!.from("lenh_cat").delete().eq("id", id);
    } catch(e) { console.error(e); }
  }, []);
  
  const themMauCongDoan = useCallback((mau: MauCongDoanItem) => {
    setDsMauCongDoan(prev => {
      const exists = prev.some(x => x.id === mau.id);
      const next = exists ? prev.map(x => x.id === mau.id ? mau : x) : [...prev, mau];
      localStorage.setItem(STORAGE_KEY_MCD, JSON.stringify(next));
      return next;
    });
  }, []);
  const xoaMauCongDoan = useCallback((id: string) => {
    setDsMauCongDoan(prev => { const next = prev.filter(x => x.id !== id); localStorage.setItem(STORAGE_KEY_MCD, JSON.stringify(next)); return next; });
  }, []);
  const themMauChiPhi = useCallback((mau: MauChiPhiItem) => {
    setDsMauChiPhi(prev => {
      const exists = prev.some(x => x.id === mau.id);
      const next = exists ? prev.map(x => x.id === mau.id ? mau : x) : [...prev, mau];
      localStorage.setItem(STORAGE_KEY_MCP, JSON.stringify(next));
      return next;
    });
  }, []);
  const xoaMauChiPhi = useCallback((id: string) => {
    setDsMauChiPhi(prev => { const next = prev.filter(x => x.id !== id); localStorage.setItem(STORAGE_KEY_MCP, JSON.stringify(next)); return next; });
  }, []);
  const capNhatTrangThai = useCallback(async (id: string, tt: TrangThaiLenhCat, u: any) => {
    // TÃ¬m lá»‡nh cáº¯t hiá»‡n táº¡i Ä‘á»ƒ check tráº¡ng thÃ¡i cÅ©
    let lenhHienTai: LenhCat | undefined;
    setDsLenhCat(prev => {
      lenhHienTai = prev.find(x => x.id === id);
      const next = prev.map(x => x.id === id ? { ...x, trangThai: tt } : x);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });

    // ÄÃƒ Bá»Ž auto-xuáº¥t-kho á»Ÿ Ä‘Ã¢y (trÆ°á»›c gá»i xuatKhoChoLenhCat cá»§a inventory-engine).
    // LÃ½ do: cÃ³ 2 luá»“ng trá»« kho cháº¡y song song cho cÃ¹ng 1 láº§n báº¯t Ä‘áº§u cáº¯t ->
    //   (1) handleNhanViec á»Ÿ to-cat-work/page.tsx: ghi qua useKho().themGiaoDich
    //       (cÃ³ React state + Ä‘á»“ng bá»™ Supabase)
    //   (2) xuatKhoChoLenhCat: ghi tháº³ng localStorage "mimin_kho_vai_v2" báº±ng
    //       ghiXuatKho(), khÃ´ng qua React state, khÃ´ng lÃªn Supabase
    // Cáº£ 2 ghi cÃ¹ng 1 key nÃªn useEffect lÆ°u state cá»§a kho-store sáº½ ghi Ä‘Ã¨, XOÃ Máº¤T
    // cÃ¡c dÃ²ng do (2) táº¡o -> vá»«a trá»« kho 2 láº§n vá»«a máº¥t dá»¯ liá»‡u.
    // Nay giá»¯ DUY NHáº¤T luá»“ng (1), vÃ  Ä‘Ã£ port cÃ´ng thá»©c Ä‘Ãºng cá»§a (2) sang
    // (Ä‘á»‹nh má»©c Ã— slDuKien tá»«ng mÃ u + % hao há»¥t + Ä‘Æ¡n giÃ¡ tháº­t) táº¡i to-cat-work.

    try {
      const { supabase } = await import("@/lib/supabase/client");
      if (supabase) await supabase!.from("lenh_cat").update({ trang_thai: tt }).eq("id", id);
    } catch(e) { console.error(e); }
  }, []);
  const capNhatCongDoan = useCallback((lenhId: string, congDoanId: string, data: {
    trangThaiCD?: TrangThaiCongDoan;
    soLuongHoanThanh?: number;
    soLuongLoi?: number;
    lyDoLoi?: string;
    thanhTien?: number;
    conLai?: number;
    catChiTiet?: CatChiTiet;
    chiTietMau?: any;
    // QC Defect Return Flow (P2)
    lichSuQC?: LichSuQCItem[];
    soLuongSuaXong?: number;
    soLuongPhePham?: number;
    soLuongDatCuoi?: number;     // SL Ä‘áº¡t cuá»‘i - dÃ¹ng cho cÃ´ng ná»£/lÆ°Æ¡ng
    lichSuNhapSL?: LichSuNhapSLItem[];
  }) => {
    let found = false;
    const lcCurrent = dsLenhCat.find(x => x.id === lenhId);
    let newPhanCong = lcCurrent
      ? lcCurrent.phanCong.map((pc: any) => {
          if (pc.id === congDoanId) {
            found = true;
            return {
                ...pc,
                trangThaiCD: data.trangThaiCD ?? pc.trangThaiCD,
                soLuongHoanThanh: data.soLuongHoanThanh ?? pc.soLuongHoanThanh,
                soLuongLoi: data.soLuongLoi ?? pc.soLuongLoi,
                lyDoLoi: data.lyDoLoi ?? pc.lyDoLoi,
                thanhTien: data.thanhTien ?? pc.thanhTien,
                conLai: data.conLai ?? pc.conLai,
                catChiTiet: data.catChiTiet ?? pc.catChiTiet,
                chiTietMau: data.chiTietMau ?? pc.chiTietMau,
                // QC Defect Return Flow fields
                lichSuQC: data.lichSuQC ?? pc.lichSuQC,
                soLuongSuaXong: data.soLuongSuaXong ?? pc.soLuongSuaXong,
                soLuongPhePham: data.soLuongPhePham ?? pc.soLuongPhePham,
                soLuongDatCuoi: data.soLuongDatCuoi ?? pc.soLuongDatCuoi,
                lichSuNhapSL: data.lichSuNhapSL
                  ? [...(pc.lichSuNhapSL || []), ...data.lichSuNhapSL]
                  : pc.lichSuNhapSL,
                ngayNhanViec: data.trangThaiCD === 'dang_lam' && !pc.ngayNhanViec
                  ? new Date().toISOString().slice(0, 10)
                  : pc.ngayNhanViec,
                ngayHoanThanh: data.trangThaiCD === 'hoan_thanh'
                  ? new Date().toISOString().slice(0, 10)
                  : pc.ngayHoanThanh,
              };
          }
          return pc;
        })
      : null;

    let congNoSyncInfo: {
      lenhCatId: string; congDoan: string; nguoiMa: string; nguoiTen: string;
      donGia: number; soLuongGiao: number; ngayGiao?: string; daThanhToan?: number;
    } | null = null;
    if (data.trangThaiCD === 'hoan_thanh' && lcCurrent && newPhanCong) {
      const pc = newPhanCong.find((x: any) => x.id === congDoanId);
      if (pc && pc.nguoiMa) {
        // Æ¯u tiÃªn dÃ¹ng soLuongDatCuoi (tá»•ng SL Ä‘áº¡t sau táº¥t cáº£ vÃ²ng QC)
        // Náº¿u chÆ°a cÃ³ (khÃ¢u khÃ´ng qua QC nÆ° Cáº¯t/á»¦i) dÃ¹ng soLuongHoanThanh rá»“i tongSL
        const slDeTinhCongNo =
          data.soLuongDatCuoi ?? pc.soLuongDatCuoi ??
          data.soLuongHoanThanh ?? pc.soLuongHoanThanh ??
          pc.soLuong ?? lcCurrent.tongSL;
        congNoSyncInfo = {
          lenhCatId: lenhId,
          congDoan: pc.tenCongDoan || "Gia cÃ´ng",
          nguoiMa: pc.nguoiMa,
          nguoiTen: pc.nguoiTen || "ChÆ°a rÃµ",
          donGia: pc.donGia || 0,
          soLuongGiao: slDeTinhCongNo,
          ngayGiao: pc.ngayNhanViec,
          daThanhToan: pc.daThanhToan || 0,
        };
      }
    }

    setDsLenhCat(prev => {
      const next = prev.map(lc => lc.id === lenhId && newPhanCong ? { ...lc, phanCong: newPhanCong } : lc);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });

    // Äá»“ng bá»™ cÃ´ng ná»£ cÃ´ng Ä‘oáº¡n qua store tháº­t (=> lÃªn Supabase) - KHÃ”NG ghi tháº³ng
    // localStorage["mimin_phan_cong_v2"] ná»¯a, vÃ¬ lÃ m váº­y sáº½ bá»‹ useSupabaseSync ghi
    // Ä‘Ã¨ máº¥t á»Ÿ láº§n táº£i trang káº¿ tiáº¿p (Supabase lÃ  nguá»“n sá»± tháº­t, khÃ´ng biáº¿t dÃ²ng
    // nÃ y tá»“n táº¡i vÃ¬ chÆ°a tá»«ng Ä‘Æ°á»£c Ä‘áº©y lÃªn).
    if (congNoSyncInfo) {
      upsertTuLenhCat(congNoSyncInfo);
    }

    // Äá»“ng bá»™ Supabase (nguá»“n sá»± tháº­t) - thiáº¿u bÆ°á»›c nÃ y thÃ¬ effect load-láº¡i-tá»«-Supabase
    // khi mount trang sáº½ ghi Ä‘Ã¨ máº¥t thay Ä‘á»•i cÃ´ng Ä‘oáº¡n vá»«a lÆ°u (chá»‰ cÃ³ á»Ÿ localStorage).
    if (newPhanCong) {
      (async () => {
        try {
          const { supabase } = await import("@/lib/supabase/client");
          if (supabase) {
            const { error } = await supabase.from("lenh_cat").update({ phan_cong: newPhanCong }).eq("id", lenhId);
            if (error) console.error("[LenhCat] Äá»“ng bá»™ phan_cong lÃªn Supabase tháº¥t báº¡i:", error);
          }
        } catch (e) {
          console.error("[LenhCat] Äá»“ng bá»™ phan_cong lÃªn Supabase lá»—i:", e);
        }
      })();
    }
  }, [upsertTuLenhCat, dsLenhCat]);

  const reset = useCallback(() => {
    setDsLenhCat(prev => { prev.forEach(lc => { if (isSupabaseEnabled) supabaseDelete("lenh_cat", lc.id); }); return []; }); localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    setDsMauCongDoan(DEFAULT_MAU_CONG_DOAN); localStorage.setItem(STORAGE_KEY_MCD, JSON.stringify(DEFAULT_MAU_CONG_DOAN));
  }, []);


  // Chá»‰ render khi cáº£ localStorage vÃ  Supabase Ä‘á»u Ä‘Ã£ sáºµn sÃ ng
  if (!isLoaded || !isSupabaseDone) return null;

  return (
    <LenhCatContext.Provider value={{ dsLenhCat, themLenhCat, suaLenhCat, xoaLenhCat, dsMauCongDoan, themMauCongDoan, xoaMauCongDoan, dsMauChiPhi, themMauChiPhi, xoaMauChiPhi, capNhatTrangThai, capNhatCongDoan, reset, loading }}>
      {children}
    </LenhCatContext.Provider>
  );
}

export function useLenhCat() {
  const ctx = useContext(LenhCatContext);
  if (!ctx) throw new Error("useLenhCat must be used within LenhCatProvider");
  return ctx;
}
