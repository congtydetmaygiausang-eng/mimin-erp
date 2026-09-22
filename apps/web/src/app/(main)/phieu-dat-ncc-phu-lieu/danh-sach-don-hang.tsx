"use client";

import { useMemo, useState } from "react";
import { Search, Eye, X, Package, FileText, UserRound, Building2, Pencil, Trash2, Printer } from "lucide-react";
import { toast } from "sonner";
import type { AppUser } from "@/components/session-provider";
import type { PhieuDatNccPhuLieu } from "@/lib/data/phieu-dat-ncc";
import { tinhTongTienPhieuDatNcc } from "@/lib/data/phieu-dat-ncc";
import { usePhieuDatNcc } from "@/lib/data/phieu-dat-ncc-store";
import { useNhaCungCap } from "@/lib/data/nha-cung-cap-store";
import { useKhachHang } from "@/lib/data/khach-hang-store";
import { useWorkspace } from "@/lib/workspace-context";
import { scopeOrders } from "./theo-doi-tien-do";
import { formatVND } from "@/lib/data/real-data";

const safe = (value: string) => value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char] || char);

export function DanhSachDonHang({ user, onEdit }: { user: AppUser | null, onEdit?: (order: PhieuDatNccPhuLieu) => void }) {
  const { orders, loading, deleteOrder } = usePhieuDatNcc();
  const { workspaces } = useWorkspace();
  const { list: nccList } = useNhaCungCap();
  const { list: khachHangList } = useKhachHang();
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
                        {(() => {
                          const ncc = nccList.find((n) => n.ma_ncc === order.maNcc);
                          const tooltip = ncc ? `${ncc.ten_ncc}\nSĐT: ${ncc.sdt || "Trống"}\nĐịa chỉ: ${ncc.dia_chi || "Trống"}` : order.maNcc;
                          return <div className="font-semibold cursor-help" title={tooltip}>{order.maNcc}</div>;
                        })()}
                      </td>
                      <td className="p-4">
                        {(() => {
                          if (!order.maKhachHang) return <div className="font-semibold">MIMIN (Nội bộ)</div>;
                          const kh = khachHangList.find((k) => k.maKH === order.maKhachHang);
                          const tooltip = kh ? `${kh.ten}\nSĐT: ${kh.sdt || "Trống"}\nĐịa chỉ: ${kh.diaChi || "Trống"}` : order.maKhachHang;
                          return <div className="font-semibold cursor-help" title={tooltip}>{order.maKhachHang}</div>;
                        })()}
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
                        <button 
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 transition"
                        >
                          <Eye className="h-3.5 w-3.5" /> Chi tiết
                        </button>
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
          onEdit={onEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

function OrderDetailsModal({ order, onClose, onEdit, onDelete }: { order: PhieuDatNccPhuLieu, onClose: () => void, onEdit?: (order: PhieuDatNccPhuLieu) => void, onDelete?: (id: string, maPhieu: string) => void }) {
  const isInternal = !order.maKhachHang;
  const { list: nccList } = useNhaCungCap();
  const { list: khachHangList } = useKhachHang();
  
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

  const handlePrint = (target: "ncc" | "customer") => {
    const customer = khachHangList.find((item) => item.maKH === order.maKhachHang);
    const supplier = nccList.find((item) => item.ma_ncc === order.maNcc);
    const isSupplier = target === "ncc";
    
    const printItems = items || [];
    const subtotal = printItems.reduce((sum, item) => sum + item.soLuong * (isSupplier ? item.donGiaMua : item.donGiaBan), 0);
    
    const itemRows = printItems.map((item) => {
      const unitPrice = isSupplier ? item.donGiaMua : item.donGiaBan;
      return `<tr><td><b>${safe(item.maVatTu)}</b><br>${safe(item.tenVatTu)}</td><td>${safe(item.mauSac)}<br><span class="muted">${safe(item.quyCach || "Theo mẫu đính kèm")}</span></td><td class="right">${item.soLuong.toLocaleString("vi-VN")} ${safe(item.donVi)}</td><td class="right">${formatVND(unitPrice)}</td><td class="right"><b>${formatVND(item.soLuong * unitPrice)}</b></td></tr>`;
    }).join("");
    
    const vat = isSupplier ? 0 : vatDauRa;
    const imageUrl = order.hinhAnh?.[0]?.dataUrl || "";
    
    const frame = document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    frame.style.position = "fixed";
    frame.style.right = "0";
    frame.style.bottom = "0";
    frame.style.width = "0";
    frame.style.height = "0";
    frame.style.border = "0";
    document.body.appendChild(frame);
    const popup = frame.contentWindow;
    if (!popup) { frame.remove(); toast.error("Không khởi tạo được vùng in"); return; }
    
    popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${safe(order.maPhieu)}</title><style>body{font-family:Arial,sans-serif;color:#17202a;margin:36px}header{display:flex;justify-content:space-between;border-bottom:3px solid #047857;padding-bottom:18px}h1{font-size:24px;margin:0;color:#065f46}.muted{color:#64748b;font-size:12px}.box{border:1px solid #cbd5e1;border-radius:10px;padding:14px;margin-top:18px}table{width:100%;border-collapse:collapse;margin-top:18px}th,td{border:1px solid #cbd5e1;padding:10px;text-align:left}th{background:#ecfdf5}.right{text-align:right}.total{font-size:18px;font-weight:bold;color:#065f46}.photo{max-width:220px;max-height:160px;border-radius:8px;margin-top:12px}.signatures{display:grid;grid-template-columns:1fr 1fr;text-align:center;margin-top:50px;gap:80px}.note{white-space:pre-wrap}@media print{button{display:none}body{margin:15mm}}</style></head><body><header><div><div class="muted">MIMIN ERP</div><h1>${isSupplier ? "LỆNH ĐẶT SẢN XUẤT" : "PHIẾU XÁC NHẬN ĐẶT HÀNG"}</h1><div class="muted">Mã phiếu: ${safe(order.maPhieu)}</div></div><div class="right"><b>Ngày đặt: ${safe(order.ngayDat)}</b><div>Hạn giao: ${safe(order.ngayGiao)}</div></div></header><div class="box"><b>${isSupplier ? "NHÀ CUNG CẤP" : "KHÁCH HÀNG / XƯỞNG MAY"}</b><div>${safe(isSupplier ? supplier?.ten_ncc || order.maNcc : customer?.ten || order.maKhachHang || "MIMIN")}</div><div class="muted">${safe(isSupplier ? supplier?.sdt || "" : customer?.sdt || "")}</div>${isSupplier ? `<div class="muted">Nơi giao: ${safe(order.diaChiGiao || "Theo thỏa thuận")}</div>` : ""}</div><table><thead><tr><th>Mẫu vật tư</th><th>Màu / quy cách</th><th class="right">Số lượng</th><th class="right">Đơn giá</th><th class="right">Thành tiền</th></tr></thead><tbody>${itemRows}</tbody></table>${imageUrl ? `<div class="box"><b>Hình mẫu</b><br><img class="photo" src="${safe(imageUrl)}" alt="Hình mẫu"></div>` : ""}<div class="box right"><div>Tạm tính: <b>${formatVND(subtotal)}</b></div>${!isSupplier ? `<div>VAT ${order.thueVat}%: <b>${formatVND(vat)}</b></div><div class="total">Tổng thanh toán: ${formatVND(subtotal + vat)}</div>` : `<div class="total">Giá trị đặt NCC: ${formatVND(subtotal)}</div>`}</div><div class="box note"><b>Ghi chú:</b> ${safe(order.ghiChu || "Không có")}</div><div class="signatures"><div><b>${isSupplier ? "MIMIN ĐẶT HÀNG" : "ĐẠI DIỆN MIMIN"}</b><p class="muted">Ký và ghi rõ họ tên</p></div><div><b>${isSupplier ? "NHÀ CUNG CẤP XÁC NHẬN" : "KHÁCH HÀNG XÁC NHẬN"}</b><p class="muted">Ký và ghi rõ họ tên</p></div></div><script>window.onload=()=>window.print()</script></body></html>`);
    popup.document.close();
    const headerMeta = popup.document.querySelector<HTMLElement>("header .right");
    if (headerMeta) {
      headerMeta.innerHTML = `<div><b>Người tạo:</b> ${safe(order.nguoiTao || "Nhân viên MIMIN")}</div><div><b>Ngày bắt đầu:</b> ${safe(order.ngayDat)}</div><div><b>Ngày kết thúc:</b> ${safe(order.ngayGiao)}</div>`;
    }
    const contactBox = popup.document.querySelector<HTMLElement>(".box");
    if (contactBox) {
      const contactCode = isSupplier ? order.maNcc : order.maKhachHang;
      const contactAddress = isSupplier ? supplier?.dia_chi || "" : customer?.diaChi || order.diaChiGiao;
      contactBox.insertAdjacentHTML("beforeend", `<div class="muted">Mã: ${safe(contactCode || "")}</div>${contactAddress ? `<div class="muted">Địa chỉ: ${safe(contactAddress)}</div>` : ""}`);
    }
    const printedRows = popup.document.querySelectorAll<HTMLTableRowElement>("tbody tr");
    printItems.forEach((item, index) => {
      if (!item.hinhAnh) return;
      const firstCell = printedRows[index]?.querySelector<HTMLTableCellElement>("td");
      if (!firstCell) return;
      const image = popup.document.createElement("img");
      image.src = item.hinhAnh;
      image.alt = "Hình vật tư";
      image.style.cssText = "max-width:100px;max-height:100px;border-radius:4px;margin-top:8px;display:block;";
      firstCell.appendChild(image);
    });
    setTimeout(() => {
      frame.remove();
    }, 5000);
  };

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
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/30 relative">
              <div className="flex items-center gap-2 mb-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                <UserRound className="h-4 w-4 text-blue-500" /> Khách hàng
              </div>
              <div className="text-lg font-bold">{order.maKhachHang || "Nội bộ (MIMIN)"}</div>
              {order.diaChiGiao && <div className="text-xs text-slate-500 mt-1">Giao đến: {order.diaChiGiao}</div>}
              <div className="mt-2 text-xs font-semibold text-slate-600">Ngày đặt: {order.ngayDat}</div>
              
              {!isInternal && (
                <button title="In phiếu xác nhận đơn hàng" onClick={() => handlePrint("customer")} className="absolute top-4 right-4 p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 transition border border-blue-100 dark:border-blue-900">
                  <Printer className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/30 relative">
              <div className="flex items-center gap-2 mb-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                <Building2 className="h-4 w-4 text-emerald-500" /> Nhà cung cấp
              </div>
              <div className="text-lg font-bold">{order.maNcc}</div>
              <div className="text-xs text-slate-500 mt-1">Hạn giao: {order.ngayGiao}</div>
              
              <button title="In lệnh sản xuất NCC" onClick={() => handlePrint("ncc")} className="absolute top-4 right-4 p-2.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 transition border border-emerald-100 dark:border-emerald-900">
                <Printer className="h-4 w-4" />
              </button>
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
          
          {/* Action Buttons */}
          {(onEdit || onDelete) && (
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10 mt-2">
              {onDelete && (
                <button
                  onClick={() => {
                    onDelete(order.id, order.maPhieu);
                    onClose();
                  }}
                  className="btn-secondary border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/30 dark:hover:bg-rose-950/30 transition"
                >
                  <Trash2 className="h-4 w-4" /> Xóa phiếu
                </button>
              )}
              {onEdit && (
                <button
                  onClick={() => {
                    onEdit(order);
                    onClose();
                  }}
                  className="btn-primary bg-blue-600 hover:bg-blue-700 transition"
                >
                  <Pencil className="h-4 w-4" /> Sửa phiếu
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
