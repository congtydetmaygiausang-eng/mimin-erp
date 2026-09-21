"use client";

import { createContext, useCallback, useContext, type ReactNode } from "react";
import { useSupabaseSync, checkSupabase, supabase } from "@/lib/supabase/client";
import type { PhieuDatNccPhuLieu, TrangThaiPhieuDatNcc } from "./phieu-dat-ncc";
import { useSession } from "@/components/session-provider";
import { LOCAL_ACCOUNT_MODE } from "../local-account-mode";
import { localActiveAccount } from "../local-account-store";
import { canAccessBusinessRecord, hasAccountPermission } from "../account-access";
import { can } from "../permissions";

const STORAGE_KEY = "mimin_phieu_dat_ncc_phu_lieu_v1";

interface PhieuDatNccContextValue {
  orders: PhieuDatNccPhuLieu[];
  loading: boolean;
  saveOrder: (order: PhieuDatNccPhuLieu) => Promise<void>;
  updateStatus: (id: string, trangThai: TrangThaiPhieuDatNcc, nguoiCapNhat: string, ghiChu?: string) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
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
  created_by: "50e26e29-6a55-488b-8892-b0e1e5b5bde7",
});

const mapIn = (row: Record<string, unknown>): PhieuDatNccPhuLieu => {
  const noiDungRaw = row.noiDung || row.noi_dung;
  const content = (noiDungRaw && typeof noiDungRaw === "object" ? noiDungRaw : {}) as Partial<PhieuDatNccPhuLieu>;
  return {
    ...content,
    id: String(row.id || content.id || ""),
    maPhieu: String(row.maPhieu || row.ma_phieu || content.maPhieu || ""),
    ngayDat: String(row.ngayDat || row.ngay_dat || content.ngayDat || ""),
    ngayGiao: String(row.ngayGiao || row.ngay_giao || content.ngayGiao || ""),
    nguoiTao: String(row.nguoiTao || row.nguoi_tao || content.nguoiTao || ""),
    maKhachHang: String(row.maKhachHang || row.ma_khach_hang || content.maKhachHang || ""),
    maNcc: String(row.maNcc || row.ma_ncc || content.maNcc || ""),
    ownerOrganizationId: String(row.ownerOrganizationId || row.owner_organization_id || content.ownerOrganizationId || "mimin"),
    supplierOrganizationId: String(row.supplierOrganizationId || row.supplier_organization_id || content.supplierOrganizationId || ""),
    customerOrganizationId: String(row.customerOrganizationId || row.customer_organization_id || content.customerOrganizationId || ""),
    trangThai: String(row.trangThai || row.trang_thai || content.trangThai || "Nháp") as TrangThaiPhieuDatNcc,
    createdAt: String(row.createdAt || row.created_at || content.createdAt || new Date().toISOString()),
    updatedAt: String(row.updatedAt || row.updated_at || content.updatedAt || new Date().toISOString()),
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

  const deleteOrder = useCallback(async (id: string) => {
    const order = data.find((item) => item.id === id);
    if (order && checkSupabase()) {
      const { error } = await supabase!.from("phieu_dat_ncc_san_xuat").delete().eq("id", id);
      if (error) {
        const { error: err2 } = await supabase!.from("phieu_dat_ncc_san_xuat").delete().eq("ma_phieu", order.maPhieu);
        if (err2) {
          console.error("Lỗi xóa Supabase:", err2);
          throw new Error("Không thể xóa phiếu: " + err2.message);
        }
      }
    }
    await setData((current) => current.map((item) => item.id === id ? { ...item, trangThai: "Đã hủy" } : item));
  }, [setData, data]);

  const activeOrders = data.filter((o) => o.trangThai !== "Đã hủy" && !(o as any).isDeleted && o.maPhieu && o.maPhieu.trim() !== "");

  return <Context.Provider value={{ orders: activeOrders, loading, saveOrder, updateStatus, deleteOrder }}>{children}</Context.Provider>;
}

export function usePhieuDatNcc() {
  const context = useContext(Context);
  useSession();
  if (!context) throw new Error("usePhieuDatNcc must be used within PhieuDatNccProvider");
  if (LOCAL_ACCOUNT_MODE) {
    return { ...context,
      orders: context.orders.filter(order => canAccessBusinessRecord(localActiveAccount(), order, "dat-ncc-phu-lieu", "view", can)),
      saveOrder: async (order: PhieuDatNccPhuLieu) => {
        const account = localActiveAccount();
        const old = context.orders.find(item => item.id === order.id);
        if (account?.kind !== "employee" || (old ? !canAccessBusinessRecord(account, old, "dat-ncc-phu-lieu", "edit", can) : !hasAccountPermission(account, "dat-ncc-phu-lieu", "create", can))) throw new Error("Không có quyền sửa đơn đặt NCC");
        if (old && !account.roles.includes("admin") && JSON.stringify([old.userIds, old.team, old.department, old.maNcc]) !== JSON.stringify([order.userIds, order.team, order.department, order.maNcc])) throw new Error("Không có quyền đổi phân công hoặc nhà cung cấp");
        return context.saveOrder(order);
      },
      updateStatus: async (...args: Parameters<typeof context.updateStatus>) => {
        const account = localActiveAccount();
        const old = context.orders.find(item => item.id === args[0]);
        if (!old || !canAccessBusinessRecord(account, old, "dat-ncc-phu-lieu", "edit", can)) throw new Error("Không có quyền cập nhật đơn đặt NCC");
        if (account?.kind === "supplier" && !["NCC xác nhận", "Đang dệt", "Hoàn thành", "Đã giao"].includes(args[1])) throw new Error("NCC chỉ được cập nhật xác nhận và tiến độ giao hàng");
        return context.updateStatus(args[0], args[1], account?.id || "", args[3]);
      },
      deleteOrder: async (id: string) => {
        const account = localActiveAccount();
        const old = context.orders.find(item => item.id === id);
        if (!old || !canAccessBusinessRecord(account, old, "dat-ncc-phu-lieu", "delete", can)) throw new Error("Không có quyền xóa đơn đặt NCC");
        return context.deleteOrder(id);
      },
    };
  }
  return context;
}
