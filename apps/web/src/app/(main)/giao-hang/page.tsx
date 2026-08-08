"use client";

import { useState } from "react";
import { Truck, MapPin, Calendar, Package, Phone, CheckCircle2, Clock, AlertCircle, ShoppingCart } from "lucide-react";
import { useSupabaseSync } from "@/lib/supabase/client";
import type { Order } from "@/components/order-detail/types";
import { toast } from "sonner";
import { PHUONG_THUC_VAN_CHUYEN_LABELS } from "@/components/order-detail/types";

const TT_STYLE: Record<string, { color: string; bg: string; icon: any }> = {
  "Mới": { color: "text-slate-700", bg: "bg-slate-500/15", icon: Clock },
  "Đã duyệt": { color: "text-slate-700", bg: "bg-slate-500/15", icon: Clock },
  "Đang SX": { color: "text-amber-700", bg: "bg-amber-500/15", icon: Truck },
  "Hoàn thành": { color: "text-sky-700", bg: "bg-sky-500/15", icon: Package },
  "Đã giao": { color: "text-emerald-700", bg: "bg-emerald-500/15", icon: CheckCircle2 },
  "Hủy": { color: "text-red-700", bg: "bg-red-500/15", icon: AlertCircle },
};

export default function GiaoHangPage() {
  const { data: list, updateRecord, isLoading } = useSupabaseSync<Order>("mimin_don_hang", "don_hang", []);
  
  // Lọc danh sách giao hàng: Chỉ lấy những đơn hàng chưa bị Hủy. 
  // (Tùy logic doanh nghiệp có thể lọc thêm: đang có trạng thái Đã duyệt, Đang SX, Hoàn thành, Đã giao)
  const deliveryList = list.filter(o => o.trangThai !== "Hủy" && o.trangThai !== "Mới");

  const tongLo = deliveryList.length;
  const daGiao = deliveryList.filter(o => o.trangThai === "Đã giao").length;
  const dangGiao = deliveryList.filter(o => o.trangThai === "Hoàn thành").length; // Đã xong SX, đang chờ giao
  const choGiao = deliveryList.filter(o => o.trangThai === "Đang SX" || o.trangThai === "Đã duyệt").length;

  const handleUpdateStatus = async (orderId: string, currentStatus: Order["trangThai"]) => {
    let newStatus: Order["trangThai"] = "Đã giao";
    if (currentStatus === "Đã giao") {
      newStatus = "Hoàn thành"; // Trở lại trạng thái trước nếu nhầm
    } else {
      newStatus = "Đã giao";
    }

    await updateRecord(orderId, { trangThai: newStatus });
    toast.success(`Đã cập nhật đơn hàng sang: ${newStatus}`);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Truck className="w-7 h-7 text-sky-500" /> 
            Giao hàng
            {isLoading && <span className="ml-3 w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></span>}
          </h1>
          <p className="opacity-70 mt-1 text-sm">Theo dõi và cập nhật lịch giao hàng cho khách từ Đơn hàng</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5"><div className="text-xs opacity-70">Tổng lô cần theo dõi</div><div className="text-2xl md:text-3xl font-bold mt-1">{tongLo}</div></div>
        <div className="card p-5"><div className="text-xs opacity-70">Đã giao hoàn tất</div><div className="text-2xl md:text-3xl font-bold mt-1 text-emerald-600">{daGiao}</div></div>
        <div className="card p-5"><div className="text-xs opacity-70">Kho đã xuất (Đợi đi)</div><div className="text-2xl md:text-3xl font-bold mt-1 text-amber-600">{dangGiao}</div></div>
        <div className="card p-5"><div className="text-xs opacity-70">Đang Sản Xuất (Chờ)</div><div className="text-2xl md:text-3xl font-bold mt-1 text-slate-600">{choGiao}</div></div>
      </div>
      
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b bg-slate-50/50 dark:bg-slate-800/50" style={{ borderColor: "var(--border)" }}>
                <th className="p-3">Đơn hàng</th>
                <th className="p-3">Ngày giao (Hẹn)</th>
                <th className="p-3">Khách hàng & Địa chỉ</th>
                <th className="p-3 text-right">Tổng SP</th>
                <th className="p-3">Hàng hóa chi tiết</th>
                <th className="p-3">Vận chuyển</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {deliveryList.map((g) => {
                const s = TT_STYLE[g.trangThai] || TT_STYLE["Mới"];
                const Icon = s.icon;
                
                // Tóm tắt sản phẩm
                const tongSL = (g.items || []).reduce((sum, item) => sum + (item.soLuong || 0), 0) || g.soLuong || 0;
                const spSummaries = (g.items || []).map(it => `${it.soLuong} ${it.spTen || it.spId}`).join(", ");
                const summaryText = spSummaries || g.sanPham || "Chưa có SP";
                
                // Phương thức VC
                const pthucVC = g.shipping?.phuongThuc 
                  ? (PHUONG_THUC_VAN_CHUYEN_LABELS[g.shipping.phuongThuc] || g.shipping.phuongThuc)
                  : "Chưa rõ";
                
                // Trạng thái (thay vì đang SX thì ghi Rõ ở góc độ giao hàng)
                let displayStatus = g.trangThai;
                if (g.trangThai === "Hoàn thành") displayStatus = "Kho xuất - Chờ đi";

                return (
                  <tr key={g.id} className="border-b last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors" style={{ borderColor: "var(--border)" }}>
                    <td className="p-3">
                      <div className="font-mono text-xs text-brand-600 font-bold">{g.maDH}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">ID: {g.id}</div>
                    </td>
                    <td className="p-3 text-xs">
                      <div className="flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> {g.ngayGiao || g.ngayDat}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-sm text-slate-800 dark:text-slate-200">{g.khachHang}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-1">
                        <Phone className="w-3 h-3" /> {g.sdt || "—"}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3 h-3" /> {g.diaChi || "—"}
                      </div>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-700">{tongSL.toLocaleString()}</td>
                    <td className="p-3 text-xs">
                      <div className="line-clamp-2 text-slate-600 dark:text-slate-400" title={summaryText}>
                        {summaryText}
                      </div>
                    </td>
                    <td className="p-3 text-xs font-medium text-slate-700">
                      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 border border-slate-200">
                        {pthucVC}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold ${s.bg} ${s.color}`}>
                        <Icon className="w-3.5 h-3.5" /> {displayStatus}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {g.trangThai === "Đã giao" ? (
                        <button 
                          onClick={() => handleUpdateStatus(g.id, g.trangThai)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded shadow-sm transition-colors"
                        >
                          Hoàn tác
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleUpdateStatus(g.id, g.trangThai)}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded shadow-sm transition-colors flex items-center gap-1 ml-auto"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Chốt giao
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              
              {deliveryList.length === 0 && (
                 <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      Không có đơn hàng nào cần giao lúc này.
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
