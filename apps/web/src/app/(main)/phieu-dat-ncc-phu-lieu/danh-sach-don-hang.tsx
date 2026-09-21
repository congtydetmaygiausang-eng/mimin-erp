"use client";

import { useMemo, useState } from "react";
import { Search, Eye, X, Package, FileText, UserRound, Building2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { AppUser } from "@/components/session-provider";
import type { PhieuDatNccPhuLieu } from "@/lib/data/phieu-dat-ncc";
import { tinhTongTienPhieuDatNcc } from "@/lib/data/phieu-dat-ncc";
import { usePhieuDatNcc } from "@/lib/data/phieu-dat-ncc-store";
import { useWorkspace } from "@/lib/workspace-context";
import { scopeOrders } from "./theo-doi-tien-do";
import { formatVND } from "@/lib/data/real-data";

export function DanhSachDonHang({ user, onEdit }: { user: AppUser | null, onEdit?: (order: PhieuDatNccPhuLieu) => void }) {
  const { orders, loading, deleteOrder } = usePhieuDatNcc();
  const { workspaces } = useWorkspace();
  const [query, setQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<PhieuDatNccPhuLieu | null>(null);

  const visibleOrders = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("vi");
    return scopeOrders(orders, user, workspaces).filter((order) => 
      !keyword || [order.maPhieu, order.maNcc, order.maKhachHang, order.tenVatTu].some((value) => value?.toLocaleLowerCase("vi").includes(keyword))
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, query, user, workspaces]);

  const handleDelete = async (id: string, maPhieu: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa phiếu ${maPhieu}?`)) {
      try {
        await deleteOrder(id);
        toast.success(`Đã xóa phiếu ${maPhieu}`);
      } catch (e: any) {
        toast.error(e.message || "Lỗi khi xóa phiếu");
      }
    }
  };

  if (loading) return <div className="card p-8 text-center text-sm text-slate-500">Đang tải danh sách đơn hàng...</div>;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="card p-4">
        <label className="relative block">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input className="input pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm mã phiếu, NCC, khách hàng hoặc vật tư..." />
        </label>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500 dark:bg-white/5">
              <tr>
                <th className="p-4 border-b border-slate-200 dark:border-white/10">Mã phiếu / Ngày đặt</th>
                <th className="p-4 border-b border-slate-200 dark:border-white/10">Nhà cung cấp dệt</th>
                <th className="p-4 border-b border-slate-200 dark:border-white/10">Khách hàng / Xưởng</th>
                <th className="p-4 text-center border-b border-slate-200 dark:border-white/10">Số lượng</th>
                <th className="p-4 text-center border-b border-slate-200 dark:border-white/10">Trạng thái</th>
                <th className="p-4 text-center border-b border-slate-200 dark:border-white/10">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {visibleOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Chưa có đơn hàng nào.
                  </td>
                </tr>
              ) : (
                visibleOrders.map((order) => {
                  const totalQty = order.items?.reduce((sum, item) => sum + item.soLuong, 0) || order.soLuong;
                  return (
                    <tr key={order.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 dark:border-white/5 dark:hover:bg-white/5 transition">
                      <td className="p-4">
                        <div className="font-bold text-emerald-600">{order.maPhieu}</div>
                        <div className="text-xs text-slate-500 mt-1">{order.ngayDat}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold">{order.maNcc}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold">{order.maKhachHang || "MIMIN (Nội bộ)"}</div>
                      </td>
                      <td className="p-4 text-center font-bold">
                        {(totalQty || 0).toLocaleString("vi-VN")}
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {order.trangThai}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => setSelectedOrder(order)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 transition"
                          >
                            <Eye className="h-3.5 w-3.5" /> Chi tiết
                          </button>
                          {onEdit && (
                            <button
                              onClick={() => onEdit(order)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800 transition"
                              title="Sửa phiếu"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(order.id, order.maPhieu)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800 transition"
                            title="Xóa phiếu"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <OrderDetailsModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
        />
      )}
    </div>
  );
}

function OrderDetailsModal({ order, onClose }: { order: PhieuDatNccPhuLieu, onClose: () => void }) {
  const isInternal = !order.maKhachHang;
  
  // Calculate totals
  const items = order.items || [{
    id: "legacy",
    maVatTu: order.maVatTu,
    tenVatTu: order.tenVatTu,
    mauSac: order.mauSac,
    quyCach: order.quyCach,
    donVi: order.donVi,
    soLuong: order.soLuong,
    donGiaMua: order.donGiaMua,
    donGiaBan: order.donGiaBan,
    hinhAnh: order.hinhAnh?.[0]?.dataUrl || ""
  }];

  const tienMua = items.reduce((sum, item) => sum + item.soLuong * item.donGiaMua, 0);
  const doanhThu = isInternal ? 0 : items.reduce((sum, item) => sum + item.soLuong * item.donGiaBan, 0);
  const giaVon = tienMua + order.phiVanChuyen + order.chiPhiKhac;
  const loiNhuan = isInternal ? 0 : doanhThu - giaVon;
  const vatDauRa = isInternal ? 0 : doanhThu * order.thueVat / 100;
  const tongHoaDon = doanhThu + vatDauRa;
  const bienLoiNhuan = doanhThu > 0 ? loiNhuan / doanhThu * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-3xl bg-white shadow-2xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 p-5 dark:border-white/10 md:px-7">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-900/50">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{order.maPhieu}</h2>
              <p className="text-xs text-slate-500">
                Tạo bởi {order.nguoiTao} · {new Date(order.createdAt).toLocaleString("vi-VN")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {order.trangThai}
            </span>
            <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 transition">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 md:p-7 space-y-6">
          {/* General Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-2 mb-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                <UserRound className="h-4 w-4 text-blue-500" /> Khách hàng
              </div>
              <div className="text-lg font-bold">{order.maKhachHang || "Nội bộ (MIMIN)"}</div>
              {order.diaChiGiao && <div className="text-xs text-slate-500 mt-1">Giao đến: {order.diaChiGiao}</div>}
              <div className="mt-2 text-xs font-semibold text-slate-600">Ngày đặt: {order.ngayDat}</div>
            </div>
            
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-2 mb-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                <Building2 className="h-4 w-4 text-emerald-500" /> Nhà cung cấp
              </div>
              <div className="text-lg font-bold">{order.maNcc}</div>
              <div className="text-xs text-slate-500 mt-1">Hạn giao: {order.ngayGiao}</div>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <h3 className="mb-3 text-sm font-bold flex items-center gap-2">
              <Package className="h-4 w-4 text-slate-500" /> Danh sách vật tư
            </h3>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10">
              <table className="w-full min-w-[700px] text-sm">
                <thead className="bg-slate-50 text-left text-xs text-slate-500 dark:bg-white/5">
                  <tr>
                    <th className="p-3 border-b border-slate-200 dark:border-white/10">Mẫu vật tư</th>
                    <th className="p-3 border-b border-slate-200 dark:border-white/10">Màu / Quy cách</th>
                    <th className="p-3 text-right border-b border-slate-200 dark:border-white/10">Số lượng</th>
                    <th className="p-3 text-right border-b border-slate-200 dark:border-white/10">Giá mua</th>
                    {!isInternal && <th className="p-3 text-right border-b border-slate-200 dark:border-white/10">Giá bán</th>}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 last:border-b-0 dark:border-white/10">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {item.hinhAnh ? (
                            <img src={item.hinhAnh} alt={item.tenVatTu} className="h-10 w-10 shrink-0 rounded-lg border border-slate-200 object-cover dark:border-white/10" />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                              <Package className="h-4 w-4 text-slate-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-emerald-700">{item.maVatTu}</div>
                            <div className="font-semibold">{item.tenVatTu}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div>{item.mauSac}</div>
                        <div className="text-xs text-slate-500 line-clamp-1">{item.quyCach}</div>
                      </td>
                      <td className="p-3 text-right font-bold">
                        {(item.soLuong || 0).toLocaleString("vi-VN")} <span className="text-xs font-normal text-slate-500">{item.donVi}</span>
                      </td>
                      <td className="p-3 text-right">
                        {formatVND(item.donGiaMua)}
                      </td>
                      {!isInternal && (
                        <td className="p-3 text-right text-emerald-700 font-semibold">
                          {formatVND(item.donGiaBan)}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pricing & Profit */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-500" /> Ghi chú
              </h3>
              <div className="rounded-xl border border-slate-200 p-4 text-sm whitespace-pre-wrap dark:border-white/10 bg-slate-50 dark:bg-slate-800/20 text-slate-600 dark:text-slate-300 min-h-[100px]">
                {order.ghiChu || "Không có ghi chú."}
              </div>
            </div>

            <div className="w-full md:w-[350px] shrink-0">
              <div className="overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl">
                {!isInternal ? (
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-5">
                    <div className="text-xs font-bold text-emerald-50">LỢI NHUẬN DỰ KIẾN</div>
                    <div className="mt-1 text-3xl font-black">{formatVND(loiNhuan)}</div>
                    <div className="text-sm text-emerald-100 mt-1">Biên lợi nhuận {bienLoiNhuan.toFixed(1)}%</div>
                  </div>
                ) : (
                  <div className="bg-slate-800 p-5">
                    <div className="text-xs font-bold text-slate-400">TỔNG GIÁ VỐN (MUA NCC)</div>
                    <div className="mt-1 text-3xl font-black">{formatVND(giaVon)}</div>
                  </div>
                )}
                
                <div className="space-y-3 p-5 text-sm">
                  <div className="flex justify-between text-slate-300">
                    <span>Tiền mua NCC</span>
                    <span className="text-white font-medium">{formatVND(tienMua)}</span>
                  </div>
                  {order.phiVanChuyen > 0 && (
                    <div className="flex justify-between text-slate-300">
                      <span>Phí vận chuyển</span>
                      <span className="text-white font-medium">{formatVND(order.phiVanChuyen)}</span>
                    </div>
                  )}
                  {order.chiPhiKhac > 0 && (
                    <div className="flex justify-between text-slate-300">
                      <span>Chi phí khác</span>
                      <span className="text-white font-medium">{formatVND(order.chiPhiKhac)}</span>
                    </div>
                  )}
                  
                  {!isInternal && (
                    <>
                      <div className="border-t border-white/10 my-2" />
                      <div className="flex justify-between text-slate-300">
                        <span>Doanh thu trước VAT</span>
                        <span className="text-white font-medium">{formatVND(doanhThu)}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>VAT ({order.thueVat}%)</span>
                        <span className="text-white font-medium">{formatVND(vatDauRa)}</span>
                      </div>
                      <div className="border-t border-white/10 my-2" />
                      <div className="flex justify-between font-bold text-emerald-400">
                        <span>Tổng hóa đơn khách</span>
                        <span>{formatVND(tongHoaDon)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
