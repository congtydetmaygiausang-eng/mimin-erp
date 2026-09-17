"use client";

import { createContext, useCallback, useContext, type ReactNode } from "react";
import { useSupabaseSync } from "@/lib/supabase/client";
import type { VatTuDatSanXuat } from "@/lib/data/phieu-dat-ncc";

const STORAGE_KEY = "mimin_vat_tu_dat_san_xuat_v1";

interface VatTuDatSanXuatContextValue {
  list: VatTuDatSanXuat[];
  loading: boolean;
  error: string | null;
  themMau: (input: Omit<VatTuDatSanXuat, "id" | "createdAt" | "updatedAt">) => Promise<VatTuDatSanXuat>;
  suaMau: (id: string, input: Partial<VatTuDatSanXuat>) => Promise<void>;
  xoaMau: (id: string) => Promise<void>;
}

const Context = createContext<VatTuDatSanXuatContextValue | null>(null);

const mapOut = (item: VatTuDatSanXuat) => ({
  id: item.id,
  ma_mau: item.maMau,
  ten_mau: item.tenMau,
  loai: item.loai,
  mau_sac: item.mauSac,
  quy_cach: item.quyCach,
  don_vi: item.donVi,
  ma_ncc_mac_dinh: item.maNccMacDinh || null,
  gia_mua_tham_khao: item.giaMuaThamKhao,
  gia_ban_de_xuat: item.giaBanDeXuat,
  so_luong_toi_thieu: item.soLuongToiThieu,
  thoi_gian_san_xuat: item.thoiGianSanXuat,
  ma_khach_hang_so_huu: item.maKhachHangSoHuu || null,
  hinh_anh: item.hinhAnh || null,
  dung_chung: item.dungChung,
  trang_thai: item.trangThai,
  created_at: item.createdAt,
  updated_at: item.updatedAt,
});

const mapIn = (row: Record<string, unknown>): VatTuDatSanXuat => ({
  id: String(row.id || ""),
  maMau: String(row.ma_mau || ""),
  tenMau: String(row.ten_mau || ""),
  loai: String(row.loai || "Khác"),
  mauSac: String(row.mau_sac || ""),
  quyCach: String(row.quy_cach || ""),
  donVi: String(row.don_vi || "cái"),
  maNccMacDinh: String(row.ma_ncc_mac_dinh || ""),
  giaMuaThamKhao: Number(row.gia_mua_tham_khao) || 0,
  giaBanDeXuat: Number(row.gia_ban_de_xuat) || 0,
  soLuongToiThieu: Number(row.so_luong_toi_thieu) || 0,
  thoiGianSanXuat: Number(row.thoi_gian_san_xuat) || 0,
  maKhachHangSoHuu: String(row.ma_khach_hang_so_huu || ""),
  hinhAnh: String(row.hinh_anh || ""),
  dungChung: row.dung_chung !== false,
  trangThai: row.trang_thai === "Tạm ngưng" ? "Tạm ngưng" : "Đang dùng",
  createdAt: String(row.created_at || new Date().toISOString()),
  updatedAt: String(row.updated_at || new Date().toISOString()),
});

export function VatTuDatSanXuatProvider({ children }: { children: ReactNode }) {
  const { data, setData, loading, error } = useSupabaseSync<VatTuDatSanXuat>(
    STORAGE_KEY,
    "vat_tu_dat_san_xuat",
    [],
    { mapOut, mapIn, onConflict: "id" },
  );

  const themMau = useCallback(async (input: Omit<VatTuDatSanXuat, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    const item: VatTuDatSanXuat = { ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
    await setData((current) => [item, ...current]);
    return item;
  }, [setData]);

  const suaMau = useCallback(async (id: string, input: Partial<VatTuDatSanXuat>) => {
    await setData((current) => current.map((item) => item.id === id ? { ...item, ...input, updatedAt: new Date().toISOString() } : item));
  }, [setData]);

  const xoaMau = useCallback(async (id: string) => {
    await setData((current) => current.filter((item) => item.id !== id));
  }, [setData]);

  return <Context.Provider value={{ list: data, loading, error, themMau, suaMau, xoaMau }}>{children}</Context.Provider>;
}

export function useVatTuDatSanXuat() {
  const context = useContext(Context);
  if (!context) throw new Error("useVatTuDatSanXuat must be used within VatTuDatSanXuatProvider");
  return context;
}
