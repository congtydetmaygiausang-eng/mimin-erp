// Engine tổng hợp Công nợ - MIMIN ERP
// Hỗ trợ 3 loại: KH, NCC, Công đoạn

import { KH_SI_FULL, NCC_FULL, type KhachHangSi, type NCC } from "./master-data-full";
import { ALL_REAL_PHIEU } from "./real-workflow-data";

export interface CongNoKH {
  kh: string;
  maKH: string;
  nhom: string;
  tongNo: number;
  daThu: number;
  conNo: number;
  soNgayQuaHan: number;
  hanThanhToan?: string;
  trangThai: "chua-thu" | "da-thu-1-phan" | "da-thu";
}

export interface CongNoNCC {
  ncc: string;
  maNCC: string;
  loaiNCC: string;
  hanMuc: number;
  tongNo: number;
  daThanhToan: number;
  conNo: number;
  vuotHanMuc: boolean;
  phanTramVuot: number;
  trangThai: "binh-thuong" | "canh-bao" | "vuot-han";
}

export interface CongNoCongDoan {
  phieuId: string;
  lsx: string;
  maSP: string;
  congDoan: string;
  nguoiThucHien: string;
  thanhTien: number;
  daThanhToan: number;
  conNo: number;
  trangThai: "chua-tt" | "tt-mot-phan" | "da-tt";
}

export interface TongHopCongNo {
  tongKH: CongNoKH[];
  tongNCC: CongNoNCC[];
  tongCongDoan: CongNoCongDoan[];
  tongCongNoKH: number;
  tongCongNoNCC: number;
  tongCongNoCongDoan: number;
  tongCongNo: number;
}

/**
 * Tính công nợ khách hàng - dựa trên master-data + workflow
 */
export function tinhCongNoKH(tasks: any[] = ALL_REAL_PHIEU): CongNoKH[] {
  return KH_SI_FULL.map((kh) => {
    const congNoHT = kh.congNoHT || 0;
    const tasksKH = tasks.filter((t) => t.khachHang === kh.tenKH);
    const tongDonHang = tasksKH.reduce((s, t) => s + (t.thanhTien || 0), 0);
    const daThu = tongDonHang - congNoHT;
    const soNgayQuaHan = Math.max(0, Math.floor((Date.now() - new Date(kh.hanMucNo).getTime()) / 86400_000));
    return {
      kh: kh.tenKH,
      maKH: kh.maKH,
      nhom: kh.loai,
      tongNo: tongDonHang || congNoHT,
      daThu: Math.max(0, daThu),
      conNo: congNoHT,
      soNgayQuaHan,
      hanThanhToan: String(kh.hanMucNo),
      trangThai: daThu >= tongDonHang ? "da-thu" : daThu > 0 ? "da-thu-1-phan" : "chua-thu",
    };
  });
}

/**
 * Tính công nợ nhà cung cấp - dựa trên master-data
 */
export function tinhCongNoNCC(): CongNoNCC[] {
  return NCC_FULL.map((n) => {
    const conNo = n.congNo || 0;
    const hanMuc = 500_000_000;
    const vuot = conNo > hanMuc;
    const ptVuot = vuot ? ((conNo - hanMuc) / hanMuc) * 100 : 0;
    return {
      ncc: n.tenNCC,
      maNCC: n.maNCC,
      loaiNCC: n.loai,
      hanMuc,
      tongNo: conNo,
      daThanhToan: 0,
      conNo,
      vuotHanMuc: vuot,
      phanTramVuot: ptVuot,
      trangThai: vuot ? "vuot-han" : conNo > hanMuc * 0.7 ? "canh-bao" : "binh-thuong",
    };
  });
}

/**
 * Tính công nợ theo công đoạn (cho từng phiếu workflow)
 */
export function tinhCongNoCongDoan(tasks: any[] = ALL_REAL_PHIEU): CongNoCongDoan[] {
  return tasks.map((t) => {
    const thanhTien = t.thanhTien || 0;
    const daThanhToan = t.daThanhToan || 0;
    const conNo = thanhTien - daThanhToan;
    return {
      phieuId: t.id,
      lsx: t.lenhSX,
      maSP: t.maSP,
      congDoan: (t.id || "").split("_")[0] || "?",
      nguoiThucHien: t.tenNguoiNhan || t.nguoiNhan || "?",
      thanhTien,
      daThanhToan,
      conNo: Math.max(0, conNo),
      trangThai: daThanhToan >= thanhTien ? "da-tt" : daThanhToan > 0 ? "tt-mot-phan" : "chua-tt",
    };
  });
}

/**
 * Tổng hợp toàn bộ công nợ
 */
export function tongHopCongNo(tasks?: any[]): TongHopCongNo {
  const kh = tinhCongNoKH(tasks);
  const ncc = tinhCongNoNCC();
  const cd = tinhCongNoCongDoan(tasks);
  return {
    tongKH: kh,
    tongNCC: ncc,
    tongCongDoan: cd,
    tongCongNoKH: kh.reduce((s, k) => s + k.conNo, 0),
    tongCongNoNCC: ncc.reduce((s, n) => s + n.conNo, 0),
    tongCongNoCongDoan: cd.reduce((s, c) => s + c.conNo, 0),
    tongCongNo: 0,
  };
}

export function fmtVND(n: number): string {
  return n.toLocaleString("vi-VN") + "đ";
}
