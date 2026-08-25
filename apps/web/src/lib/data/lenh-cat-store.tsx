
// ============ LENH CAT STORE (Giai đoạn 3 - Nâng cấp) ============
// Quản lý Lệnh Cắt mới tạo (CuttingOrder)
// Lưu localStorage `mimin_lenh_cat_v2` + sync Supabase
// Auto-generate ID theo format LC-2026-XXXX
// CRUD: themLenhCat, suaLenhCat, xoaLenhCat
// 2026-08-03: Thêm sync Supabase (sếp Sang bật lại schema)

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { logWorkflow } from "../audit-log";
import { supabaseUpsert, supabaseDelete, supabaseFetchAll, isSupabaseEnabled } from "@/lib/supabase/client";
import type { AppUser } from "@/components/session-provider";
import { usePhanCong } from "./cong-no-store";

export type LoaiSP = "AoTru" | "AoCoTron" | "BoTru" | "BoCoTron" | "AoPolo" | "PhuKien";
export type LoaiLenh = "HangNha" | "HangDat";

export const LOAI_SP_LABELS: Record<LoaiSP, string> = {
  "AoTru": "Áo Trụ",
  "AoCoTron": "Áo Cổ Tròn",
  "BoTru": "Bộ Trụ",
  "BoCoTron": "Bộ Cổ Tròn",
  "AoPolo": "Áo Polo",
  "PhuKien": "Phụ Kiện",
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
  "Nhap": "Bản nháp",
  "DaTao": "Đã tạo",
  "DangCat": "Đang cắt",
  "HoanThanh": "Hoàn thành",
  "ChuyenTiep": "Chuyển tiếp",
};

export const TRANG_THAI_LC_STYLE: Record<TrangThaiLenhCat, { bg: string; color: string }> = {
  "Nhap": { bg: "bg-slate-500/15", color: "text-slate-700" },
  "DaTao": { bg: "bg-blue-500/15", color: "text-blue-700" },
  "DangCat": { bg: "bg-amber-500/15", color: "text-amber-700" },
  "HoanThanh": { bg: "bg-emerald-500/15", color: "text-emerald-700" },
  "ChuyenTiep": { bg: "bg-purple-500/15", color: "text-purple-700" },
};

export type SizeDetail = {
  size: string;
  sl: number;       // SL thực tế (Cắt, Đóng gói, etc)
  nhan?: number;    // SL nhận từ khâu trước
  dat?: number;     // SL đạt (QC)
  loi?: number;     // SL lỗi (QC)
  nguyenNhan?: string; // Nguyên nhân lỗi nếu có
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
  
  // NẾU LÀ BỘ THÌ CÓ THÊM QUẦN
  maVaiQuan?: string;
  dinhMucQuan?: number;
  imgQuan?: string;    // Ảnh mẫu QUẦN (hàng Bộ) - img ở trên là ảnh ÁO

  // Màu phối
  mauPhoi?: string[];

  // Tracking tỉ lệ size chi tiết theo từng khâu (Cắt, May Áo, May Quần, In/Thêu, Ủi/QC...)
  tyLeSizeChiTiet?: Record<string, SizeDetail[]>;

  // Bảng đối chiếu Ghép Bộ (Áo + Quần = Bộ) sau khi QC
  bangGhepBo?: { size: string; aoDat: number; quanDat: number; boGhepDuoc: number; aoDu: number; quanDu: number }[];

  // Kết quả Ghép Áo+Quần theo Size tại khâu QC (2026-08-22) - phần dư 1 bên
  // không có bên kia ghép cùng, giữ lại theo từng size để QC/quản lý biết còn
  // tồn Áo/Quần lẻ chưa ghép được thành Bộ. Không dùng cho tính SL nhận của
  // khâu sau (đã ghi vào tyLeSizeChiTiet["qc"]) - chỉ để hiển thị/theo dõi.
  aoDuTheoSize?: { size: string; sl: number }[];
  quanDuTheoSize?: { size: string; sl: number }[];
};

export type LenhCatPhuLieu = {
  maPL: string;
  tenPL: string;
  soLuong: number;
  donGia: number;
  dvt: string;
  // Vật tư thuộc Áo hay Quần (hàng Bộ) - không set = dùng chung
  apDungCho?: "ao" | "quan";
  // Index vào dsMau - vật tư này gắn với màu vải nào (để hiện ngay trong card màu đó
  // cho bên gia công biết đúng màu). Không set = dùng chung mọi màu (dữ liệu cũ).
  mauIdx?: number;
};

// P0 - 2026-08-07 - Tach ro NV noi bo vs Xuong ngoai (FK + tracking thanh toan)
export type TrangThaiThanhToan = "chua_tra" | "tra_mot_phan" | "da_tra_du";

// Type chung cho moi cong doan
export type TrangThaiCongDoan = "cho_giao" | "dang_lam" | "cho_qc" | "hoan_thanh" | "co_loi";

export const TRANG_THAI_CD_LABELS: Record<TrangThaiCongDoan, string> = {
  "cho_giao":    "Chờ giao",
  "dang_lam":    "Đang làm",
  "cho_qc":      "Chờ QC duyệt",
  "hoan_thanh":  "Hoàn thành",
  "co_loi":      "Có lỗi",
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

// Lịch sử 1 lần QC kiểm tra (mỗi lần kiểm = 1 phần tử)
export type LichSuQCItem = {
  lan: number;                       // Lần kiểm thứ mấy (1, 2, 3...)
  ngay: string;                      // ISO date
  slDat: number;                     // SL đạt lần này
  slLoi: number;                     // SL lỗi lần này
  loaiLoi?: string;                  // Loại lỗi
  khauGayLoi?: string;               // Khâu gây ra lỗi (Tổ May, Tổ Cắt...)
  nguoiKiem?: string;                // Người QC kiểm
  ketQua: "dat" | "tra_lai" | "hoan_tat"; // dat=đạt hết, tra_lai=trả về sửa, hoan_tat=đã xong vòng lặp
  ghiChu?: string;
  daPhatQuaHan?: boolean;
};

// Lịch sử nhập SL từng sự kiện (dùng cho nhập kho + công nợ + lương)
export type LichSuNhapSLItem = {
  ngay: string;                      // ISO date
  nguoiNhap?: string;               // Người nhập
  soLuong: number;                   // SL tại sự kiện này
  loai: "nhan_viec" | "hoan_thanh" | "sua_loi" | "qc_dat" | "tra_loi" | "nhap_kho";
  ghiChu?: string;
};

type CongDoanBase = {
  id: string; // e.g. "cat", "mayAo", "in", "theu" or auto-generated
  tenCongDoan: string; // e.g. "Cắt", "May Áo", "In", "Thêu", "Ủi", "Đóng Gói", "In Chuyển Nhiệt"
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
  trangThaiCD?: TrangThaiCongDoan; // Trạng thái công đoạn
  soLuongHoanThanh?: number;       // SP đã làm xong (tổng đạt cuối)
  soLuongLoi?: number;             // SP lỗi (còn tồn)
  lyDoLoi?: string;                // Lý do lỗi
  ngayNhanViec?: string;           // Ngày nhận việc
  ngayHoanThanh?: string;          // Ngày hoàn thành thực tế
  // Chi tiết 4 bước dành riêng cho khâu Cắt
  catChiTiet?: CatChiTiet;
  // Khai báo chi tiết số lượng theo màu (Mới)
  chiTietMau?: {
    mau: string;
    soLuongNhan: number;
    soLuongDat: number;
    soLuongLoi: number;
  }[];
  // === QC DEFECT RETURN FLOW (P2 - 2026-08-22) ===
  // Lịch sử các lần QC kiểm tra (vòng lặp May ↔ QC)
  lichSuQC?: LichSuQCItem[];
  // SL đã sửa xong (Tổ May sửa và trả lại QC)
  soLuongSuaXong?: number;
  // SL phế phẩm (lỗi không sửa được - loại bỏ)
  soLuongPhePham?: number;
  // SL đạt cuối cùng = tổng SL đạt qua tất cả vòng QC (dùng để tính công nợ/lương)
  soLuongDatCuoi?: number;
  // Lịch sử nhập SL toàn bộ sự kiện (dùng cho nhập kho, công nợ, lương)
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
  // Aliases cho UI hiển thị (Antigravity dùng trong page.tsx)
  giaVon1SP?: number;       // = giaVonBinhQuan
  tongGiaVon?: number;      // = giaVonBinhQuan * tongSL
};

export type LenhCat = {
  id: string; // Tự sinh VD: LC-2026-0001
  loaiLenh: LoaiLenh;
  khachHang?: string; // Nếu là Hàng Đặt
  loaiSP: LoaiSP;
  maSP: string;
  tenSP: string;
  tongSL: number;
  tongSLThucTe?: number;
  tongSLThucTeAo?: number;
  tongSLThucTeQuan?: number;
  hanHoanThanh: string;
  tiLeSize: string; // VD 1:2:2:1
  // Màu sắc & Vải
  dsMau: MauVai[];
  // Phụ liệu
  dsPhuLieu: LenhCatPhuLieu[];
  // Gia Công
  mauCongDoan?: string;
  phanCong: PhanCongGiaCong;
  // Chi Phí Cố Định
  mauChiPhi?: string;
  chiPhiCoDinh: ChiPhiCoDinh;
  // Bảng tính
  bangCOGS?: BangCOGS;
  // Sơ đồ áo/quần (PLT) - dùng để tự tính định mức kg/SP
  daiSoDoAo?: string;
  soDoAo?: string;
  daiSoDoQuan?: string;
  soDoQuan?: string;
  // Sơ đồ cắt
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
  // Tài liệu In/Thêu (mẫu)
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
    ten: "Áo tròn",
    giaCong: [
      { id: "cat", loaiNguoi: "noi_bo", tenCongDoan: "Cắt áo", nguoiMa: "", nguoiTen: "", donGia: 1400, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra", catChiTiet: { nhanLieu: "cho_lam", traiVai: "cho_lam", catHang: "cho_lam", epNhan: "cho_lam", epKeo: "khong_can" } },
      { id: "in_theu", loaiNguoi: "xuong_ngoai", tenCongDoan: "In/Thêu", nguoiMa: "", nguoiTen: "", donGia: 1500, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" },
      { id: "may_ao", loaiNguoi: "noi_bo", tenCongDoan: "May áo", nguoiMa: "", nguoiTen: "", donGia: 13000, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" },
      { id: "qc", loaiNguoi: "noi_bo", tenCongDoan: "QC (Kiểm hàng)", nguoiMa: "", nguoiTen: "", donGia: 500, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" },
      { id: "ui", loaiNguoi: "noi_bo", tenCongDoan: "Ủi", nguoiMa: "", nguoiTen: "", donGia: 900, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" },
      { id: "dong_goi", loaiNguoi: "noi_bo", tenCongDoan: "Đóng gói", nguoiMa: "", nguoiTen: "", donGia: 700, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" },
      { id: "nhap_kho", loaiNguoi: "noi_bo", tenCongDoan: "Nhập kho", nguoiMa: "", nguoiTen: "", donGia: 0, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" }
    ]
  },
  {
    id: "MCD-AO-TRU",
    ten: "Áo trụ",
    giaCong: [
      { id: "cat", loaiNguoi: "noi_bo", tenCongDoan: "Cắt áo", nguoiMa: "", nguoiTen: "", donGia: 1400, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra", catChiTiet: { nhanLieu: "cho_lam", traiVai: "cho_lam", catHang: "cho_lam", epNhan: "cho_lam", epKeo: "cho_lam" } },
      { id: "in_theu", loaiNguoi: "xuong_ngoai", tenCongDoan: "In/Thêu", nguoiMa: "", nguoiTen: "", donGia: 1500, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" },
      { id: "may_ao", loaiNguoi: "noi_bo", tenCongDoan: "May áo", nguoiMa: "", nguoiTen: "", donGia: 15000, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" },
      { id: "qc", loaiNguoi: "noi_bo", tenCongDoan: "QC (Kiểm hàng)", nguoiMa: "", nguoiTen: "", donGia: 500, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" },
      { id: "khuy_nut", loaiNguoi: "noi_bo", tenCongDoan: "Khuy nút", nguoiMa: "", nguoiTen: "", donGia: 750, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" },
      { id: "ui", loaiNguoi: "noi_bo", tenCongDoan: "Ủi", nguoiMa: "", nguoiTen: "", donGia: 900, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" },
      { id: "dong_goi", loaiNguoi: "noi_bo", tenCongDoan: "Đóng gói", nguoiMa: "", nguoiTen: "", donGia: 700, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" },
      { id: "nhap_kho", loaiNguoi: "noi_bo", tenCongDoan: "Nhập kho", nguoiMa: "", nguoiTen: "", donGia: 0, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" }
    ]
  },
  {
    id: "MCD-BO-TRON",
    ten: "Bộ tròn",
    giaCong: [
      { id: "cat", loaiNguoi: "noi_bo", tenCongDoan: "Cắt bộ", nguoiMa: "", nguoiTen: "", donGia: 2300, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra", catChiTiet: { nhanLieu: "cho_lam", traiVai: "cho_lam", catHang: "cho_lam", epNhan: "cho_lam", epKeo: "khong_can" } },
      { id: "in_theu", loaiNguoi: "xuong_ngoai", tenCongDoan: "In/Thêu", nguoiMa: "", nguoiTen: "", donGia: 1500, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" },
      { id: "may_ao", loaiNguoi: "noi_bo", tenCongDoan: "May áo", nguoiMa: "", nguoiTen: "", donGia: 13000, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" },
      { id: "may_quan", loaiNguoi: "noi_bo", tenCongDoan: "May quần", nguoiMa: "", nguoiTen: "", donGia: 9500, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" },
      { id: "qc", loaiNguoi: "noi_bo", tenCongDoan: "QC (Kiểm hàng)", nguoiMa: "", nguoiTen: "", donGia: 500, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" },
      { id: "ui", loaiNguoi: "noi_bo", tenCongDoan: "Ủi", nguoiMa: "", nguoiTen: "", donGia: 1500, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" },
      { id: "dong_goi", loaiNguoi: "noi_bo", tenCongDoan: "Đóng gói", nguoiMa: "", nguoiTen: "", donGia: 1200, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" },
      { id: "nhap_kho", loaiNguoi: "noi_bo", tenCongDoan: "Nhập kho", nguoiMa: "", nguoiTen: "", donGia: 0, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" }
    ]
  },
  {
    id: "MCD-BO-TRU",
    ten: "Bộ trụ",
    giaCong: [
      { id: "cat", loaiNguoi: "noi_bo", tenCongDoan: "Cắt bộ", nguoiMa: "", nguoiTen: "", donGia: 2300, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra", catChiTiet: { nhanLieu: "cho_lam", traiVai: "cho_lam", catHang: "cho_lam", epNhan: "cho_lam", epKeo: "cho_lam" } },
      { id: "in_theu", loaiNguoi: "xuong_ngoai", tenCongDoan: "In/Thêu", nguoiMa: "", nguoiTen: "", donGia: 1500, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" },
      { id: "may_ao", loaiNguoi: "noi_bo", tenCongDoan: "May áo", nguoiMa: "", nguoiTen: "", donGia: 13000, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" },
      { id: "may_quan", loaiNguoi: "noi_bo", tenCongDoan: "May quần", nguoiMa: "", nguoiTen: "", donGia: 9500, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" },
      { id: "qc", loaiNguoi: "noi_bo", tenCongDoan: "QC (Kiểm hàng)", nguoiMa: "", nguoiTen: "", donGia: 500, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" },
      { id: "khuy_nut", loaiNguoi: "noi_bo", tenCongDoan: "Khuy nút", nguoiMa: "", nguoiTen: "", donGia: 750, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" },
      { id: "ui", loaiNguoi: "noi_bo", tenCongDoan: "Ủi", nguoiMa: "", nguoiTen: "", donGia: 900, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" },
      { id: "dong_goi", loaiNguoi: "noi_bo", tenCongDoan: "Đóng gói", nguoiMa: "", nguoiTen: "", donGia: 1200, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" },
      { id: "nhap_kho", loaiNguoi: "noi_bo", tenCongDoan: "Nhập kho", nguoiMa: "", nguoiTen: "", donGia: 0, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra" }
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

// Bỏ hàm tính COGS tĩnh, sẽ tính động trong component và lưu lúc submit

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
  ghiNhanLichSuNhap: (idLenh: string, khauId: string, soLuong: number, nguoiNhap: string, ghiChu?: string) => void;
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
  // isSupabaseReady: set true sau khi Supabase fetch xong (thành công hoặc thất bại)
  // Dùng để đồng bộ với isLoaded (localStorage) trước khi render Provider
  const [isSupabaseDone, setIsSupabaseDone] = useState(false);

  // Load Lệnh Cắt từ Supabase
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
            // Merge thay vì ghi đè: ưu tiên bản ghi Supabase (nguồn sự thật),
            // nhưng GIỮ lại lệnh cắt chỉ có ở local (tạo lúc mất mạng) - trước
            // đây setDsLenhCat(mapped) thay sạch state nên các lệnh này bị xoá.
            const remoteIds = new Set(mapped.map((r) => r.id));
            setDsLenhCat((prev) => [
              ...(mapped as LenhCat[]),
              ...prev.filter((x) => !remoteIds.has(x.id)),
            ]);
          }
        }
      } catch (err) {
        console.error("Lỗi fetch Lệnh cắt", err);
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

  // Load Mẫu từ localStorage
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
    // Chốt chặn cuối: upsert theo id nên nếu mã bị trùng sẽ GHI ĐÈ mất lệnh cũ.
    // Kiểm tra thẳng trên Supabase (không tin cache client vì có thể chưa tải xong
    // hoặc người khác vừa tạo) - trùng thì báo lỗi, KHÔNG ghi đè.
    {
      const { supabase: sb } = await import("@/lib/supabase/client");
      if (sb) {
        const { data: trung } = await sb.from("lenh_cat").select("id").eq("id", lenh.id).limit(1).maybeSingle();
        if (trung) {
          throw new Error(`Mã lệnh cắt ${lenh.id} đã tồn tại. Vui lòng tải lại trang rồi tạo lại để lấy mã mới.`);
        }
      }
    }

    setDsLenhCat((prev) => [lenh, ...prev]); // Optimistic
    logWorkflow(u, "create", `Tạo lệnh cắt ${lenh.id}`, lenh.id, { module: "lenh-cat" });
    const { supabase } = await import("@/lib/supabase/client");
    if (!supabase) throw new Error("Supabase chưa kết nối");
    const { error } = await supabase!.from("lenh_cat").upsert({
      id: lenh.id, loai_lenh: lenh.loaiLenh, khach_hang: lenh.khachHang, loai_sp: lenh.loaiSP, ma_sp: lenh.maSP,
      ten_sp: lenh.tenSP, tong_sl: lenh.tongSL, tong_sl_thuc_te: lenh.tongSLThucTe,
      tong_sl_thuc_te_ao: lenh.tongSLThucTeAo, tong_sl_thuc_te_quan: lenh.tongSLThucTeQuan,
      han_hoan_thanh: lenh.hanHoanThanh, ti_le_size: lenh.tiLeSize, ds_mau: lenh.dsMau, ds_phu_lieu: lenh.dsPhuLieu,
      mau_cong_doan: lenh.mauCongDoan, phan_cong: lenh.phanCong, mau_chi_phi: lenh.mauChiPhi,
      chi_phi_co_dinh: lenh.chiPhiCoDinh, bang_cogs: lenh.bangCOGS, phu_trach_cat: lenh.phuTrachCat,
      phu_trach_sx: lenh.phuTrachSX, phu_trach_so_do: lenh.phuTrachSoDo, ghi_chu: lenh.ghiChu, trang_thai: lenh.trangThai,
      phien_ban_dinh_muc: lenh.phienBanDinhMuc, ngay_tao: lenh.ngayTao, nguoi_tao: lenh.nguoiTao
    });
    if (error) throw error;
  }, []);

  const suaLenhCat = useCallback(async (id: string, lenh: Partial<LenhCat>, u: AppUser) => {
    setDsLenhCat((prev) => prev.map((item) => item.id === id ? { ...item, ...lenh } : item));
    logWorkflow(u, "update", `Cập nhật lệnh cắt ${id}`, id, { module: "lenh-cat" });
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
      if (lenh.tongSLThucTeAo !== undefined)    updateData.tong_sl_thuc_te_ao = lenh.tongSLThucTeAo;
      if (lenh.tongSLThucTeQuan !== undefined)  updateData.tong_sl_thuc_te_quan = lenh.tongSLThucTeQuan;
      if (lenh.hanHoanThanh !== undefined)      updateData.han_hoan_thanh = lenh.hanHoanThanh;
      if (lenh.tiLeSize !== undefined)          updateData.ti_le_size = lenh.tiLeSize;
      if (lenh.dsMau !== undefined)             updateData.ds_mau = lenh.dsMau;
      if (lenh.dsPhuLieu !== undefined)         updateData.ds_phu_lieu = lenh.dsPhuLieu;
      if (lenh.mauCongDoan !== undefined)       updateData.mau_cong_doan = lenh.mauCongDoan;
      if (lenh.phanCong !== undefined)          updateData.phan_cong = lenh.phanCong;
      if (lenh.chiPhiCoDinh !== undefined)      updateData.chi_phi_co_dinh = lenh.chiPhiCoDinh;
      if (lenh.bangCOGS !== undefined)          updateData.bang_cogs = lenh.bangCOGS;
      if (lenh.phuTrachCat !== undefined)       updateData.phu_trach_cat = lenh.phuTrachCat;
      if (lenh.phuTrachSX !== undefined)        updateData.phu_trach_sx = lenh.phuTrachSX;
      if (lenh.phuTrachSoDo !== undefined)      updateData.phu_trach_so_do = lenh.phuTrachSoDo;
      if (lenh.ghiChu !== undefined)            updateData.ghi_chu = lenh.ghiChu;
      if (lenh.trangThai !== undefined)         updateData.trang_thai = lenh.trangThai;
      if (lenh.phienBanDinhMuc !== undefined)   updateData.phien_ban_dinh_muc = lenh.phienBanDinhMuc;
      if (lenh.ngayTao !== undefined)           updateData.ngay_tao = lenh.ngayTao;

      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase!.from("lenh_cat").update(updateData).eq("id", id);
        if (error) throw error;
      }
    } else {
      throw new Error("Supabase chưa kết nối");
    }
  }, []);

  const xoaLenhCat = useCallback(async (id: string, u: AppUser) => {
    setDsLenhCat((prev) => prev.filter((item) => item.id !== id));
    logWorkflow(u, "delete", `Xoá lệnh cắt ${id}`, id, { module: "lenh-cat" });
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
    // Tìm lệnh cắt hiện tại để check trạng thái cũ
    let lenhHienTai: LenhCat | undefined;
    setDsLenhCat(prev => {
      lenhHienTai = prev.find(x => x.id === id);
      return prev.map(x => x.id === id ? { ...x, trangThai: tt } : x);
    });

    // ĐÃ BỎ auto-xuất-kho ở đây (trước gọi xuatKhoChoLenhCat của inventory-engine).
    // Lý do: có 2 luồng trừ kho chạy song song cho cùng 1 lần bắt đầu cắt ->
    //   (1) handleNhanViec ở to-cat-work/page.tsx: ghi qua useKho().themGiaoDich
    //       (có React state + đồng bộ Supabase)
    //   (2) xuatKhoChoLenhCat: ghi thẳng localStorage "mimin_kho_vai_v2" bằng
    //       ghiXuatKho(), không qua React state, không lên Supabase
    // Cả 2 ghi cùng 1 key nên useEffect lưu state của kho-store sẽ ghi đè, XOÁ MẤT
    // các dòng do (2) tạo -> vừa trừ kho 2 lần vừa mất dữ liệu.
    // Nay giữ DUY NHẤT luồng (1), và đã port công thức đúng của (2) sang
    // (định mức × slDuKien từng màu + % hao hụt + đơn giá thật) tại to-cat-work.

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
    soLuongDatCuoi?: number;     // SL đạt cuối - dùng cho công nợ/lương
    lichSuNhapSL?: LichSuNhapSLItem[];
  }) => {
    // Tính TRƯỚC, đồng bộ, từ closure `dsLenhCat` hiện tại - KHÔNG được gán biến
    // ngoài bên trong callback của setDsLenhCat rồi đọc lại ngay sau đó. Callback
    // updater không đảm bảo chạy đồng bộ tại chỗ gọi (không phải hợp đồng API công
    // khai của React, chỉ là 1 tối ưu nội bộ đôi khi có đôi khi không) - kiểm tra
    // thật trên Supabase cho thấy cách làm cũ CHỈ đồng bộ đúng lần gọi capNhatCongDoan
    // ĐẦU TIÊN trong 1 chuỗi bấm liên tiếp, các lần sau (kể cả "Hoàn thành") bị rơi
    // mất - state React cục bộ vẫn đúng nên không ai để ý, nhưng Supabase (và công
    // nợ công đoạn) thì sai.
    const lcCurrent = dsLenhCat.find(x => x.id === lenhId);
    const newPhanCong = lcCurrent
      ? lcCurrent.phanCong.map((pc: any) =>
          pc.id === congDoanId
            ? {
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
              }
            : pc
        )
      : null;

    let congNoSyncInfo: {
      lenhCatId: string; congDoan: string; nguoiMa: string; nguoiTen: string;
      donGia: number; soLuongGiao: number; ngayGiao?: string; daThanhToan?: number;
    } | null = null;
    if (data.trangThaiCD === 'hoan_thanh' && lcCurrent && newPhanCong) {
      const pc = newPhanCong.find((x: any) => x.id === congDoanId);
      if (pc && pc.nguoiMa) {
        // Ưu tiên dùng soLuongDatCuoi (tổng SL đạt sau tất cả vòng QC)
        // Nếu chưa có (khâu không qua QC nư Cắt/Ủi) dùng soLuongHoanThanh rồi tongSL
        const slDeTinhCongNo =
          data.soLuongDatCuoi ?? pc.soLuongDatCuoi ??
          data.soLuongHoanThanh ?? pc.soLuongHoanThanh ??
          pc.soLuong ?? lcCurrent.tongSL;
        congNoSyncInfo = {
          lenhCatId: lenhId,
          congDoan: pc.tenCongDoan || "Gia công",
          nguoiMa: pc.nguoiMa,
          nguoiTen: pc.nguoiTen || "Chưa rõ",
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

    // Đồng bộ công nợ công đoạn qua store thật (=> lên Supabase) - KHÔNG ghi thẳng
    // localStorage["mimin_phan_cong_v2"] nữa, vì làm vậy sẽ bị useSupabaseSync ghi
    // đè mất ở lần tải trang kế tiếp (Supabase là nguồn sự thật, không biết dòng
    // này tồn tại vì chưa từng được đẩy lên).
    if (congNoSyncInfo) {
      upsertTuLenhCat(congNoSyncInfo);
    }

    // Đồng bộ Supabase (nguồn sự thật) - thiếu bước này thì effect load-lại-từ-Supabase
    // khi mount trang sẽ ghi đè mất thay đổi công đoạn vừa lưu (chỉ có ở localStorage).
    if (newPhanCong) {
      (async () => {
        try {
          const { supabase } = await import("@/lib/supabase/client");
          if (supabase) {
            const { error } = await supabase.from("lenh_cat").update({ phan_cong: newPhanCong }).eq("id", lenhId);
            if (error) console.error("[LenhCat] Đồng bộ phan_cong lên Supabase thất bại:", error);
          }
        } catch (e) {
          console.error("[LenhCat] Đồng bộ phan_cong lên Supabase lỗi:", e);
        }
      })();
    }
  }, [upsertTuLenhCat, dsLenhCat]);

  const ghiNhanLichSuNhap = useCallback((idLenh: string, khauId: string, soLuong: number, nguoiNhap: string, ghiChu?: string) => {
    const item: LichSuNhapSLItem = {
      ngay: new Date().toISOString(),
      loai: "nhan_viec", // Mặc định loại thao tác
      nguoiNhap,
      soLuong,
      ghiChu
    };
    capNhatCongDoan(idLenh, khauId, {
      lichSuNhapSL: [item]
    });
  }, [capNhatCongDoan]);

  const reset = useCallback(() => {
    setDsLenhCat([]); localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    setDsMauCongDoan(DEFAULT_MAU_CONG_DOAN); localStorage.setItem(STORAGE_KEY_MCD, JSON.stringify(DEFAULT_MAU_CONG_DOAN));
  }, []);


  // Chỉ render khi cả localStorage và Supabase đều đã sẵn sàng
  if (!isLoaded || !isSupabaseDone) return null;

  return (
    <LenhCatContext.Provider value={{ 
      dsLenhCat, 
      themLenhCat, 
      suaLenhCat, 
      xoaLenhCat, 
      dsMauCongDoan, 
      themMauCongDoan, 
      xoaMauCongDoan, 
      dsMauChiPhi, 
      themMauChiPhi,
      xoaMauChiPhi,
      capNhatTrangThai,
      capNhatCongDoan,
      ghiNhanLichSuNhap,
      reset,
      loading
    }}>
      {children}
    </LenhCatContext.Provider>
  );
}

export function useLenhCat() {
  const ctx = useContext(LenhCatContext);
  if (!ctx) throw new Error("useLenhCat must be used within LenhCatProvider");
  return ctx;
}
