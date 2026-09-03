"use client";

import { ShoppingBag } from "lucide-react";
import { useSupplierRelations, EmptyRelationState } from "../supplier-relations";

export default function GiaoDichMuaPage() {
  const { giaoDich } = useSupplierRelations();
  const rows = giaoDich.filter(g => g.loai === "NHAP");
  return <div className="space-y-4"><h1 className="text-2xl font-bold flex items-center gap-2"><ShoppingBag className="text-brand-500" /> Giao dịch mua NCC</h1>{rows.length === 0 ? <EmptyRelationState>Chưa có giao dịch mua từ nhà cung cấp.</EmptyRelationState> : <div className="card overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-3">Ngày</th><th className="p-3">NCC</th><th className="p-3">Vật tư</th><th className="p-3">SL</th><th className="p-3">Thành tiền</th></tr></thead><tbody>{rows.map(g => <tr key={g.id} className="border-b"><td className="p-3">{g.ngay}</td><td className="p-3">{g.nguonNhap || "-"}</td><td className="p-3">{g.tenVT}</td><td className="p-3">{g.soLuong} {g.donVi}</td><td className="p-3 font-semibold">{g.thanhTien.toLocaleString("vi-VN")}đ</td></tr>)}</tbody></table></div>}</div>;
}
