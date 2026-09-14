"use client";

import { createContext, useCallback, useContext, type ReactNode } from "react";
import { useSupabaseSync } from "@/lib/supabase/client";
import type { PhieuDatNccPhuLieu, TrangThaiPhieuDatNcc } from "./phieu-dat-ncc";

const STORAGE_KEY = "mimin_phieu_dat_ncc_phu_lieu_v1";

interface PhieuDatNccContextValue {
  orders: PhieuDatNccPhuLieu[];
  loading: boolean;
  saveOrder: (order: PhieuDatNccPhuLieu) => Promise<void>;
  updateStatus: (id: string, trangThai: TrangThaiPhieuDatNcc, nguoiCapNhat: string, ghiChu?: string) => Promise<void>;
}

const Context = createContext<PhieuDatNccContextValue | null>(null);

const mapOut = (order: PhieuDatNccPhuLieu) => ({
  id: order.id,
  ma_phieu: order.maPhieu,
  ngay_dat: order.ngayDat,
  ngay_giao: order.ngayGiao,
  nguoi_tao: order.nguoiTao || "",
  ma_khach_hang: order.maKhachHang || null,
  ma_ncc: order.maNcc,
  owner_organization_id: order.ownerOrganizationId || "mimin",
  supplier_organization_id: order.supplierOrganizationId || null,
  customer_organization_id: order.customerOrganizationId || null,
  noi_dung: order,
  trang_thai: order.trangThai,
  created_at: order.createdAt,
  updated_at: order.updatedAt || order.createdAt,
});

const mapIn = (row: Record<string, unknown>): PhieuDatNccPhuLieu => {
  const content = (row.noi_dung && typeof row.noi_dung === "object" ? row.noi_dung : {}) as Partial<PhieuDatNccPhuLieu>;
  return {
    ...content,
    id: String(row.id || content.id || ""),
    maPhieu: String(row.ma_phieu || content.maPhieu || ""),
    ngayDat: String(row.ngay_dat || content.ngayDat || ""),
    ngayGiao: String(row.ngay_giao || content.ngayGiao || ""),
    nguoiTao: String(row.nguoi_tao || content.nguoiTao || ""),
    maKhachHang: String(row.ma_khach_hang || content.maKhachHang || ""),
    maNcc: String(row.ma_ncc || content.maNcc || ""),
    ownerOrganizationId: String(row.owner_organization_id || content.ownerOrganizationId || "mimin"),
    supplierOrganizationId: String(row.supplier_organization_id || content.supplierOrganizationId || ""),
    customerOrganizationId: String(row.customer_organization_id || content.customerOrganizationId || ""),
    trangThai: String(row.trang_thai || content.trangThai || "Nháp") as TrangThaiPhieuDatNcc,
    createdAt: String(row.created_at || content.createdAt || new Date().toISOString()),
    updatedAt: String(row.updated_at || content.updatedAt || new Date().toISOString()),
  } as PhieuDatNccPhuLieu;
};

export function PhieuDatNccProvider({ children }: { children: ReactNode }) {
  const { data, setData, loading } = useSupabaseSync<PhieuDatNccPhuLieu>(
    STORAGE_KEY,
    "phieu_dat_ncc_san_xuat",
    [],
    { mapOut, mapIn, onConflict: "id" },
  );

  const saveOrder = useCallback(async (order: PhieuDatNccPhuLieu) => {
    await setData((current) => {
      const old = current.find((item) => item.maPhieu === order.maPhieu);
      const now = new Date().toISOString();
      const saved: PhieuDatNccPhuLieu = {
        ...order,
        id: old?.id || order.id,
        createdAt: old?.createdAt || order.createdAt,
        updatedAt: now,
        lichSuTrangThai: old?.lichSuTrangThai?.length
          ? old.lichSuTrangThai
          : [{ trangThai: order.trangThai, thoiGian: now, nguoiCapNhat: order.nguoiTao || "MIMIN" }],
      };
      return [saved, ...current.filter((item) => item.maPhieu !== order.maPhieu)];
    });
  }, [setData]);

  const updateStatus = useCallback(async (id: string, trangThai: TrangThaiPhieuDatNcc, nguoiCapNhat: string, ghiChu?: string) => {
    await setData((current) => current.map((order) => {
      if (order.id !== id || order.trangThai === trangThai) return order;
      const now = new Date().toISOString();
      return {
        ...order,
        trangThai,
        updatedAt: now,
        lichSuTrangThai: [...(order.lichSuTrangThai || []), { trangThai, thoiGian: now, nguoiCapNhat, ghiChu }],
      };
    }));
  }, [setData]);

  return <Context.Provider value={{ orders: data, loading, saveOrder, updateStatus }}>{children}</Context.Provider>;
}

export function usePhieuDatNcc() {
  const context = useContext(Context);
  if (!context) throw new Error("usePhieuDatNcc must be used within PhieuDatNccProvider");
  return context;
}
