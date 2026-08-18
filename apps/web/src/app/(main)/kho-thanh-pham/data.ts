// ============ TYPES + CONSTANTS + HELPERS ============
// Tach tu page.tsx (2026-08-05 - toi uu B.2)

import { ALL_REAL_PHIEU } from "@/lib/real-workflow-data";
import type { PhieuWorkflow } from "@/lib/workflow-data";
import { MORE_LSX } from "@/lib/more-workflow-data";
import { SIZE_RATIO_PRESETS } from "@/lib/size-ratio-presets";

// Combine tất cả phiếu workflow
export const ALL_PHIEU: PhieuWorkflow[] = [...ALL_REAL_PHIEU, ...(MORE_LSX as any)];

// Danh sách tỉ lệ size — lấy từ preset chung
export const DS_TI_LE_SIZE = SIZE_RATIO_PRESETS.map((p) => p.label);

export const DS_KHU_KE_HANG = [
  "Khu A1", "Khu A2", "Khu A3", "Khu A4", "Khu A5", "Khu A6",
  "Khu B1", "Khu B2", "Khu B3", "Khu B4", "Khu C1"
];

// ============ TYPES ============
export interface SanPhamTP {
  id: string;
  maSP: string;
  tenSP: string;
  phanLoai: string;
  mau: string;
  size: string;
  lsx: string;
  ngayNhap: string;
  soLuong: number;
  donGia: number;
  giaTri: number;
  viTri: string;
  trangThai: "con" | "dat-hang" | "xuat-kho" | "khong-dat";
  khachHang?: string;
  tiLeSize?: string;
  ghiChu?: string;
  // Chi tiết theo từng màu (biến thể) - thêm 2026-08-18
  giaBanLe?: number;
  giaBanSi?: number;
  hinhAnh?: string[];
  video?: string;
  chiTietSize?: { size: string; sl: number }[];
}

export const STORAGE_KEY = "mimin_kho_thanh_pham_v2";

// Map 1 row Supabase (snake_case) -> SanPhamTP (camelCase app model).
// KHONG dung camelToSnake/snakeToCamel tu dong vi no bien ma_sp -> maSp
// (mat hoa "SP"), giong van de da gap voi kho-store.tsx/giao_dich_kho.
export function fromSupabaseRow(r: any): SanPhamTP {
  return {
    id: String(r.id),
    maSP: r.ma_sp ?? "",
    tenSP: r.ten_sp ?? "",
    phanLoai: r.phan_loai ?? "",
    mau: r.mau ?? "",
    size: r.size ?? "",
    lsx: r.lsx ?? "",
    ngayNhap: r.ngay_nhap ?? "",
    soLuong: Number(r.so_luong) || 0,
    donGia: Number(r.don_gia) || 0,
    giaTri: Number(r.gia_tri) || 0,
    viTri: r.vi_tri ?? "",
    trangThai: (r.trang_thai as SanPhamTP["trangThai"]) ?? "con",
    khachHang: r.khach_hang ?? undefined,
    tiLeSize: r.ti_le_size ?? undefined,
    ghiChu: r.ghi_chu ?? undefined,
    giaBanLe: r.gia_ban_le != null ? Number(r.gia_ban_le) : undefined,
    giaBanSi: r.gia_ban_si != null ? Number(r.gia_ban_si) : undefined,
    hinhAnh: Array.isArray(r.hinh_anh) ? r.hinh_anh : undefined,
    video: r.video ?? undefined,
    chiTietSize: Array.isArray(r.chi_tiet_size) ? r.chi_tiet_size : undefined,
  };
}

export function toSupabaseRow(sp: SanPhamTP) {
  return {
    id: sp.id,
    ma_sp: sp.maSP,
    ten_sp: sp.tenSP,
    phan_loai: sp.phanLoai,
    mau: sp.mau,
    size: sp.size,
    lsx: sp.lsx,
    ngay_nhap: sp.ngayNhap,
    so_luong: sp.soLuong,
    don_gia: sp.donGia,
    gia_tri: sp.giaTri,
    vi_tri: sp.viTri,
    trang_thai: sp.trangThai,
    khach_hang: sp.khachHang ?? null,
    ti_le_size: sp.tiLeSize ?? null,
    ghi_chu: sp.ghiChu ?? null,
    gia_ban_le: sp.giaBanLe ?? null,
    gia_ban_si: sp.giaBanSi ?? null,
    hinh_anh: sp.hinhAnh ?? null,
    video: sp.video ?? null,
    chi_tiet_size: sp.chiTietSize ?? null,
  };
}

// ============ HELPERS ============
export function fromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const r = localStorage.getItem(key);
    if (r) return JSON.parse(r);
  } catch {}
  return defaultValue;
}

export function saveStorage<T>(key: string, v: T) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
}

// Tự động generate danh sách SP thành phẩm từ các phiếu DG_ (Đóng gói) hoàn thành
export function generateSanPhamFromWorkflow(): SanPhamTP[] {
  const ds = ALL_PHIEU.filter((p: any) => (p.id || "").startsWith("DG_") && p.trangThai === "Hoàn thành");
  return ds.map((p: any, i) => {
    const sl = p.soLuongDat || 0;
    const dg = p.donGia || 0;
    return {
      id: p.id,
      maSP: p.maSP,
      tenSP: p.phanLoai,
      phanLoai: p.phanLoai,
      mau: p.mau || "Trắng",
      size: p.size || "M",
      lsx: p.lenhSX,
      ngayNhap: p.ngayHoanThanh || new Date().toISOString().slice(0, 10),
      soLuong: sl,
      donGia: dg * 5, // Đơn giá bán = 5x công may
      giaTri: sl * dg * 5,
      viTri: `Kệ ${String.fromCharCode(65 + Math.floor(i / 5))}${(i % 5) + 1}-${(i % 5) + 2}`,
      trangThai: "con",
      ghiChu: p.ghiChu,
    } as SanPhamTP;
  });
}
