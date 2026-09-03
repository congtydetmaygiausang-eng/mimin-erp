"use client";

import { CreditCard } from "lucide-react";
import { useSupplierRelations, EmptyRelationState } from "../supplier-relations";

export default function ThanhToanPage() {
  const { suppliers, payments } = useSupplierRelations();
  return <div className="space-y-4"><h1 className="text-2xl font-bold flex items-center gap-2"><CreditCard className="text-brand-500" /> Thanh toán nhà cung cấp</h1>{payments.length === 0 ? <EmptyRelationState>Chưa có phiếu thanh toán NCC. Các phiếu mới sẽ liên kết bằng mã NCC.</EmptyRelationState> : <div className="grid gap-2">{payments.map(p => <div key={p.id} className="card p-3 flex justify-between"><span><b>{p.maNcc}</b><small className="block opacity-60">{p.ngay} · {p.phuongThuc} · {p.maChungTu}</small></span><b className="text-emerald-600">{p.soTien.toLocaleString("vi-VN")}đ</b></div>)}</div>}<p className="text-xs opacity-60">{suppliers.length} NCC đang được liên kết trong danh mục dữ liệu.</p></div>;
}
