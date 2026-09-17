"use client";

import { History } from "lucide-react";
import { useSupplierRelations, EmptyRelationState } from "../supplier-relations";

export default function LichSuNccPage() {
  const { giaoDich, contracts, payments } = useSupplierRelations();
  const events = [
    ...giaoDich.map(g => ({ id: `gd-${g.id}`, date: g.ngay, title: `Giao dịch ${g.loai === "NHAP" ? "nhập" : "xuất"}`, detail: `${g.nguonNhap || "NCC chưa xác định"} · ${g.tenVT}` })),
    ...contracts.map(c => ({ id: `hd-${c.id}`, date: c.ngayKy, title: "Hợp đồng", detail: `${c.maNcc} · ${c.soHopDong}` })),
    ...payments.map(p => ({ id: `tt-${p.id}`, date: p.ngay, title: "Thanh toán NCC", detail: `${p.maNcc} · ${p.soTien.toLocaleString("vi-VN")}đ` })),
  ].sort((a, b) => b.date.localeCompare(a.date));
  return <div className="space-y-4"><h1 className="text-2xl font-bold flex items-center gap-2"><History className="text-brand-500" /> Lịch sử hoạt động</h1>{events.length === 0 ? <EmptyRelationState>Chưa có lịch sử giao dịch, hợp đồng hoặc thanh toán.</EmptyRelationState> : <div className="card divide-y divide-slate-100">{events.map(event => <div key={event.id} className="p-3 flex gap-3"><div className="w-2 h-2 mt-2 rounded-full bg-brand-500 shrink-0" /><div><b>{event.title}</b><div className="text-xs opacity-70">{event.date} · {event.detail}</div></div></div>)}</div>}</div>;
}
