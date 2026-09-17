"use client";

import { useEffect, useState } from "react";
import { useNhaCungCap } from "@/lib/data/nha-cung-cap-store";
import { useKho } from "@/lib/data/kho-store";
import { useSupabaseSync } from "@/lib/supabase/client";

export type SupplierContract = {
  id: string;
  maNcc: string;
  tenDoiTac: string;
  doiTuong: "NCC" | "Gia công" | "Nhân sự" | "Khách hàng";
  soHopDong: string;
  tenHopDong: string;
  loaiHopDong: string;
  ngayKy: string;
  ngayHieuLuc: string;
  ngayHetHan: string;
  giaTri: number;
  tienTe: "VND" | "USD";
  dieuKhoanThanhToan: string;
  noiDung: string;
  daiDienBenA: string;
  chucVuBenA: string;
  daiDienBenB: string;
  chucVuBenB: string;
  nguoiPhuTrach: string;
  trangThai: "Đang hiệu lực" | "Hết hạn" | "Nháp";
  ghiChu: string;
  createdAt: string;
};

export type SupplierPayment = {
  id: string;
  maNcc: string;
  ngay: string;
  soTien: number;
  phuongThuc: string;
  maChungTu: string;
  ghiChu: string;
};

const CONTRACT_KEY = "mimin_ncc_hop_dong_v1";
const PAYMENT_KEY = "mimin_ncc_thanh_toan_v1";

export function useSupplierRelations() {
  const { data: contracts, setData: setContracts, loading: contractsLoading } = useSupabaseSync<SupplierContract>(
    CONTRACT_KEY,
    "hop_dong_ncc",
  );
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const { list: suppliers } = useNhaCungCap();
  const { giaoDich } = useKho();

  useEffect(() => {
    try { setPayments(JSON.parse(localStorage.getItem(PAYMENT_KEY) || "[]")); } catch { setPayments([]); }
  }, []);

  const addContract = async (contract: Omit<SupplierContract, "id">) => {
    await setContracts((current) => [{ ...contract, id: `HD-NCC-${Date.now()}` }, ...current]);
  };
  const addPayment = (payment: Omit<SupplierPayment, "id">) => {
    const next = [{ ...payment, id: `TT-NCC-${Date.now()}` }, ...payments];
    setPayments(next); localStorage.setItem(PAYMENT_KEY, JSON.stringify(next));
  };

  return { suppliers, giaoDich, contracts, contractsLoading, payments, addContract, addPayment };
}

export function EmptyRelationState({ children }: { children: React.ReactNode }) {
  return <div className="card p-6 text-center text-sm text-slate-500">{children}</div>;
}
