"use client";

import { Wallet } from "lucide-react";
import { useSupplierRelations, EmptyRelationState } from "../supplier-relations";

export default function CongNoTongPage() {
  const { suppliers } = useSupplierRelations();
  const total = suppliers.reduce((sum, supplier) => sum + (supplier.cong_no || 0), 0);
  return <div className="space-y-4"><h1 className="text-2xl font-bold flex items-center gap-2"><Wallet className="text-brand-500" /> Công nợ tổng</h1><div className="card p-5"><div className="text-sm opacity-70">Tổng công nợ nhà cung cấp</div><div className="text-3xl font-bold text-rose-600">{total.toLocaleString("vi-VN")}đ</div></div>{suppliers.length === 0 ? <EmptyRelationState>Chưa có nhà cung cấp.</EmptyRelationState> : <div className="grid gap-2">{suppliers.map(supplier => <div key={supplier.ma_ncc} className="card p-3 flex justify-between"><span><b>{supplier.ten_ncc}</b><small className="block opacity-60">{supplier.ma_ncc}</small></span><b>{(supplier.cong_no || 0).toLocaleString("vi-VN")}đ</b></div>)}</div>}</div>;
}
