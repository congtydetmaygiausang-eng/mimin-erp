"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Eye,
  X,
  Package,
  FileText,
  UserRound,
  Building2,
  Pencil,
  Trash2,
  Printer,
  Phone,
  MapPin,
  Mail,
  CreditCard,
  Hash,
  Calendar,
  Clock,
  CheckCircle2,
  Truck,
  Layers,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import type { AppUser } from "@/components/session-provider";
import type { PhieuDatNccPhuLieu, TrangThaiPhieuDatNcc } from "@/lib/data/phieu-dat-ncc";
import { usePhieuDatNcc } from "@/lib/data/phieu-dat-ncc-store";
import { useNhaCungCap } from "@/lib/data/nha-cung-cap-store";
import { useKhachHang } from "@/lib/data/khach-hang-store";
import { useWorkspace } from "@/lib/workspace-context";
import { scopeOrders } from "./theo-doi-tien-do";
import { formatVND } from "@/lib/data/real-data";

const safe = (value: string) =>
  value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char] || char);

const STATUS_COLORS: Record<TrangThaiPhieuDatNcc, string> = {
  "Nháp": "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  "Đã gửi NCC": "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
  "NCC xác nhận": "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
  "Đang dệt": "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800",
  "Hoàn thành": "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
  "Đã giao": "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800",
  "Đã hủy": "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800",
};

export function DanhSachDonHang({
  user,
  onEdit,
}: {
  user: AppUser | null;
  onEdit?: (order: PhieuDatNccPhuLieu) => void;
}) {
  const { orders, loading, deleteOrder } = usePhieuDatNcc();
  const { workspaces } = useWorkspace();
  const { list: nccList } = useNhaCungCap();
  const { list: khachHangList } = useKhachHang();

  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPurpose, setFilterPurpose] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<PhieuDatNccPhuLieu | null>(null);

  const visibleOrders = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("vi");
    return scopeOrders(orders, user, workspaces)
      .filter((order) => {
        if (filterStatus !== "all" && order.trangThai !== filterStatus) return false;
        if (filterPurpose === "internal" && Boolean(order.maKhachHang)) return false;
        if (filterPurpose === "customer" && !order.maKhachHang) return false;

        if (keyword) {
          const ncc = nccList.find((n) => n.ma_ncc === order.maNcc);
          const kh = khachHangList.find((k) => k.maKH === order.maKhachHang);
          const match = [
            order.maPhieu,
            order.maNcc,
            ncc?.ten_ncc,
            ncc?.sdt,
            order.maKhachHang,
            kh?.ten,
            kh?.sdt,
            order.tenVatTu,
            order.maVatTu,
          ].some((value) => value?.toLocaleLowerCase("vi").includes(keyword));
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, query, filterStatus, filterPurpose, user, workspaces, nccList, khachHangList]);

  const handleDelete = async (id: string, maPhieu: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa phiếu đặt ${maPhieu}?`)) {
      try {
        await deleteOrder(id);
        toast.success(`Đã xóa thành công phiếu ${maPhieu}`);
      } catch (e: any) {
        toast.error(e.message || "Lỗi khi xóa phiếu");
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center text-xs text-slate-500">
        Đang tải danh sách đơn đặt nhà cung cấp...
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Thanh bộ lọc & Tìm kiếm hiện đại */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm theo mã phiếu, tên/SĐT NCC, khách hàng hoặc vật tư..."
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Lọc loại đơn */}
          <select
            className="input h-10 text-xs font-semibold py-1.5"
            value={filterPurpose}
            onChange={(e) => setFilterPurpose(e.target.value)}
          >
            <option value="all">Tất cả mục đích ({orders.length})</option>
            <option value="customer">Đơn đặt cho khách</option>
            <option value="internal">Đơn đặt cho MIMIN (Nội bộ)</option>
          </select>

          {/* Lọc trạng thái */}
          <select
            className="input h-10 text-xs font-semibold py-1.5"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="Nháp">Nháp</option>
            <option value="Đã gửi NCC">Đã gửi NCC</option>
            <option value="NCC xác nhận">NCC xác nhận</option>
            <option value="Đang dệt">Đang dệt</option>
            <option value="Hoàn thành">Hoàn thành</option>
            <option value="Đã giao">Đã giao</option>
          </select>
        </div>
      </div>

      {/* Bảng danh sách đơn hàng chi tiết rõ ràng */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-xs md:text-sm">
            <thead className="bg-slate-50/90 dark:bg-slate-800/60 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5">Mã Phiếu / Ngày Đặt</th>
                <th className="p-3.5">Nhà Cung Cấp</th>
                <th className="p-3.5">Mục Đích / Khách Hàng</th>
                <th className="p-3.5">Vật Tư & Số Lượng</th>
                <th className="p-3.5 text-right">Tổng Tiền Đặt NCC</th>
                <th className="p-3.5 text-center">Hạn Giao</th>
                <th className="p-3.5 text-center">Trạng Thái</th>
                <th className="p-3.5 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {visibleOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-xs text-slate-400">
                    <Package className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
                    Không tìm thấy đơn đặt hàng nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                visibleOrders.map((order) => {
                  const ncc = nccList.find((n) => n.ma_ncc === order.maNcc);
                  const kh = khachHangList.find((k) => k.maKH === order.maKhachHang);
                  const isInternal = !order.maKhachHang;

                  const totalQty =
                    order.items?.reduce((sum, item) => sum + item.soLuong, 0) || order.soLuong;
                  const totalBuyAmount =
                    order.items?.reduce((sum, item) => sum + item.soLuong * item.donGiaMua, 0) ||
                    order.soLuong * order.donGiaMua;

                  const statusClass =
                    STATUS_COLORS[order.trangThai] || "bg-slate-100 text-slate-700 border-slate-200";

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition cursor-pointer"
                      onClick={() => setSelectedOrder(order)}
                    >
                      {/* Mã phiếu & Ngày tạo */}
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          {order.maPhieu}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{order.ngayDat}</span>
                        </div>
                      </td>

                      {/* Nhà cung cấp đầy đủ */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 dark:text-white leading-tight">
                          {ncc?.ten_ncc || order.maNcc}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {order.maNcc}
                          </span>
                          {ncc?.sdt && (
                            <span className="flex items-center gap-0.5">
                              <Phone className="h-2.5 w-2.5" /> {ncc.sdt}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Mục đích / Khách hàng */}
                      <td className="p-3.5">
                        {isInternal ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            MIMIN (Nội bộ)
                          </span>
                        ) : (
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white leading-tight">
                              {kh?.ten || order.maKhachHang}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {order.diaChiGiao ? `Giao: ${order.diaChiGiao}` : `Mã: ${order.maKhachHang}`}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Mặt hàng & Số lượng */}
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                          {order.tenVatTu || `${order.items?.length || 1} mặt hàng`}
                        </div>
                        <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {(totalQty || 0).toLocaleString("vi-VN")}{" "}
                          <span className="text-[10px] font-normal text-slate-500">{order.donVi}</span>
                        </div>
                      </td>

                      {/* Giá trị đặt NCC */}
                      <td className="p-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatVND(totalBuyAmount)}
                      </td>

                      {/* Hạn giao */}
                      <td className="p-3.5 text-center text-xs font-medium text-slate-600 dark:text-slate-400">
                        {order.ngayGiao}
                      </td>

                      {/* Trạng thái */}
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold border ${statusClass}`}
                        >
                          {order.trangThai}
                        </span>
                      </td>

                      {/* Thao tác */}
                      <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 px-2.5 py-1.5 text-xs font-bold transition cursor-pointer"
                            title="Xem chi tiết đầy đủ đơn hàng và nhà cung cấp"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Chi tiết</span>
                          </button>

                          {onEdit && (
                            <button
                              type="button"
                              onClick={() => onEdit(order)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                              title="Chỉnh sửa đơn này"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDelete(order.id, order.maPhieu)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            title="Xóa phiếu đặt"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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

      {/* Modal Xem Chi Tiết Đơn Hàng & Thông Tin Nhà Cung Cấp */}
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

// ============================================================================
// MODAL CHI TIẾT ĐƠN HÀNG - THỐNG KÊ TOÀN DIỆN & THÔNG TIN NCC ĐẦY ĐỦ
// ============================================================================
function OrderDetailsModal({
  order,
  onClose,
  onEdit,
  onDelete,
}: {
  order: PhieuDatNccPhuLieu;
  onClose: () => void;
  onEdit?: (order: PhieuDatNccPhuLieu) => void;
  onDelete?: (id: string, maPhieu: string) => void;
}) {
  const isInternal = !order.maKhachHang;
  const { list: nccList } = useNhaCungCap();
  const { list: khachHangList } = useKhachHang();

  // Tìm NCC chi tiết từ Store
  const supplier = nccList.find((n) => n.ma_ncc === order.maNcc || n.id === order.maNcc);
  // Tìm Khách Hàng từ Store
  const customer = khachHangList.find((k) => k.maKH === order.maKhachHang || k.id === order.maKhachHang);

  // Danh sách mặt hàng
  const items =
    order.items && order.items.length > 0
      ? order.items
      : [
          {
            id: "legacy",
            maVatTu: order.maVatTu,
            tenVatTu: order.tenVatTu,
            mauSac: order.mauSac,
            quyCach: order.quyCach,
            donVi: order.donVi,
            soLuong: order.soLuong,
            donGiaMua: order.donGiaMua,
            donGiaBan: order.donGiaBan,
            hinhAnh: order.hinhAnh?.[0]?.dataUrl || "",
          },
        ];

  // Tính toán số liệu
  const tienMua = items.reduce((sum, item) => sum + item.soLuong * item.donGiaMua, 0);
  const doanhThu = isInternal ? 0 : items.reduce((sum, item) => sum + item.soLuong * item.donGiaBan, 0);
  const giaVon = tienMua + Number(order.phiVanChuyen || 0) + Number(order.chiPhiKhac || 0);
  const loiNhuan = isInternal ? 0 : doanhThu - giaVon;
  const vatDauRa = isInternal ? 0 : (doanhThu * Number(order.thueVat || 0)) / 100;
  const tongHoaDon = doanhThu + vatDauRa;
  const bienLoiNhuan = doanhThu > 0 ? (loiNhuan / doanhThu) * 100 : 0;
  const totalQty = items.reduce((sum, item) => sum + item.soLuong, 0);

  const statusClass =
    STATUS_COLORS[order.trangThai] || "bg-slate-100 text-slate-700 border-slate-200";

  // Hàm in phiếu
  const handlePrint = (target: "ncc" | "customer") => {
    const isSupplier = target === "ncc";
    const subtotal = items.reduce(
      (sum, item) => sum + item.soLuong * (isSupplier ? item.donGiaMua : item.donGiaBan),
      0
    );

    const itemRows = items
      .map((item) => {
        const unitPrice = isSupplier ? item.donGiaMua : item.donGiaBan;
        return `<tr><td><b>${safe(item.maVatTu)}</b><br>${safe(item.tenVatTu)}</td><td>${safe(item.mauSac)}<br><span class="muted">${safe(item.quyCach || "Theo mẫu đính kèm")}</span></td><td class="right">${item.soLuong.toLocaleString("vi-VN")} ${safe(item.donVi)}</td><td class="right">${formatVND(unitPrice)}</td><td class="right"><b>${formatVND(item.soLuong * unitPrice)}</b></td></tr>`;
      })
      .join("");

    const vat = isSupplier ? 0 : vatDauRa;
    const imageUrl = order.hinhAnh?.[0]?.dataUrl || items[0]?.hinhAnh || "";

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
    if (!popup) {
      frame.remove();
      toast.error("Không khởi tạo được vùng in");
      return;
    }

    popup.document.write(
      `<!doctype html><html><head><meta charset="utf-8"><title>${safe(order.maPhieu)}</title><style>body{font-family:Arial,sans-serif;color:#17202a;margin:36px}header{display:flex;justify-content:space-between;border-bottom:3px solid #059669;padding-bottom:18px}h1{font-size:24px;margin:0;color:#047857}.muted{color:#64748b;font-size:12px}.box{border:1px solid #cbd5e1;border-radius:10px;padding:14px;margin-top:18px}table{width:100%;border-collapse:collapse;margin-top:18px}th,td{border:1px solid #cbd5e1;padding:10px;text-align:left}th{background:#ecfdf5}.right{text-align:right}.total{font-size:18px;font-weight:bold;color:#047857}.photo{max-width:220px;max-height:160px;border-radius:8px;margin-top:12px}.signatures{display:grid;grid-template-columns:1fr 1fr;text-align:center;margin-top:50px;gap:80px}.note{white-space:pre-wrap}@media print{button{display:none}body{margin:15mm}}</style></head><body><header><div><div class="muted">MIMIN ERP · QUẢN LÝ SẢN XUẤT</div><h1>${isSupplier ? "LỆNH ĐẶT NHÀ CUNG CẤP & SẢN XUẤT VẬT TƯ" : "PHIẾU XÁC NHẬN ĐẶT HÀNG"}</h1><div class="muted">Mã phiếu: <b>${safe(order.maPhieu)}</b></div></div><div class="right"><b>Ngày đặt: ${safe(order.ngayDat)}</b><div>Hạn giao: ${safe(order.ngayGiao)}</div></div></header><div class="box"><b>${isSupplier ? "NHÀ CUNG CẤP / XƯỞNG DỆT" : "KHÁCH HÀNG / XƯỞNG MAY"}</b><div>${safe(isSupplier ? supplier?.ten_ncc || order.maNcc : customer?.ten || order.maKhachHang)}</div><div class="muted">SĐT: ${safe(isSupplier ? supplier?.sdt || "Chưa có" : customer?.sdt || "Chưa có")}</div><div class="muted">Địa chỉ: ${safe(isSupplier ? supplier?.dia_chi || "Theo thỏa thuận" : customer?.diaChi || order.diaChiGiao)}</div>${isSupplier ? `<div class="muted">Nơi giao hàng: ${safe(order.diaChiGiao || "Kho phụ liệu MIMIN")}</div>` : ""}</div><table><thead><tr><th>Mẫu vật tư</th><th>Màu / Quy cách</th><th class="right">Số lượng</th><th class="right">Đơn giá</th><th class="right">Thành tiền</th></tr></thead><tbody>${itemRows}</tbody></table>${imageUrl ? `<div class="box"><b>Hình mẫu vật tư:</b><br><img class="photo" src="${safe(imageUrl)}" alt="Hình mẫu"></div>` : ""}<div class="box right"><div>Tạm tính: <b>${formatVND(subtotal)}</b></div>${!isSupplier ? `<div>VAT ${order.thueVat}%: <b>${formatVND(vat)}</b></div><div class="total">Tổng thanh toán: ${formatVND(subtotal + vat)}</div>` : `<div class="total">Tổng giá trị đặt hàng: ${formatVND(subtotal)}</div>`}</div><div class="box note"><b>Ghi chú:</b> ${safe(order.ghiChu || "Không có ghi chú thêm.")}</div><div class="signatures"><div><b>${isSupplier ? "ĐẠI DIỆN MIMIN ĐẶT HÀNG" : "ĐẠI DIỆN MIMIN"}</b><p class="muted">Ký và ghi rõ họ tên</p></div><div><b>${isSupplier ? "XÁC NHẬN CỦA NHÀ CUNG CẤP" : "XÁC NHẬN CỦA KHÁCH HÀNG"}</b><p class="muted">Ký và ghi rõ họ tên</p></div></div><script>window.onload=()=>window.print()</script></body></html>`
    );
    popup.document.close();
    setTimeout(() => frame.remove(), 60_000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-3xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ============================================================== */}
        {/* HEADER CHI TIẾT ĐƠN HÀNG                                       */}
        {/* ============================================================== */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-800 p-4 sm:p-5 md:px-7 bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-3 min-w-0">
            <div className="rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 p-2.5 shrink-0">
              <FileText className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold font-mono text-emerald-800 dark:text-emerald-400">
                  {order.maPhieu}
                </h2>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${statusClass}`}
                >
                  {order.trangThai}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                Tạo bởi <b>{order.nguoiTao || "Hồ Minh Sang"}</b> ·{" "}
                {new Date(order.createdAt).toLocaleString("vi-VN")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handlePrint("ncc")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
              title="In Lệnh Đặt Sản Xuất cho NCC"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">In Lệnh NCC</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 dark:hover:bg-slate-800 transition"
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* CONTENT NỘI DUNG CHI TIẾT                                       */}
        {/* ============================================================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-7 space-y-5">
          {/* 1. KHỐI THÔNG TIN NHÀ CUNG CẤP ĐẦY ĐỦ (THEO YÊU CẦU ANH SANG) */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Box Nhà Cung Cấp */}
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/20 p-4.5 space-y-3 relative shadow-2xs">
              <div className="flex items-center justify-between border-b border-emerald-200/60 dark:border-emerald-800/60 pb-2.5">
                <div className="flex items-center gap-2 text-sm font-bold text-emerald-800 dark:text-emerald-300">
                  <Building2 className="h-4.5 w-4.5 text-emerald-600" />
                  <span>Thông Tin Nhà Cung Cấp</span>
                </div>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                  {order.maNcc}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="text-slate-500">Tên NCC / Xưởng:</span>{" "}
                  <b className="text-slate-900 dark:text-white text-sm block sm:inline">
                    {supplier?.ten_ncc || order.maNcc}
                  </b>
                </div>

                {supplier?.loai && (
                  <div>
                    <span className="text-slate-500">Lĩnh vực:</span>{" "}
                    <span className="font-medium text-slate-700 dark:text-slate-300">{supplier.loai}</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <Phone className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Hotline / SĐT:</span>{" "}
                  <b className="font-mono text-emerald-700 dark:text-emerald-400">
                    {supplier?.sdt || "Chưa cập nhật"}
                  </b>
                </div>

                <div className="flex items-start gap-1.5 text-slate-700 dark:text-slate-300">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Địa chỉ:</span>{" "}
                  <span className="font-medium">{supplier?.dia_chi || "Chưa cập nhật"}</span>
                </div>

                {supplier?.nguoi_lh && (
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <UserRound className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Người liên hệ:</span>{" "}
                    <b className="text-slate-900 dark:text-white">{supplier.nguoi_lh}</b>
                  </div>
                )}

                {supplier?.mst && (
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <Hash className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>Mã số thuế:</span> <span className="font-mono">{supplier.mst}</span>
                  </div>
                )}

                {/* Công nợ hiện tại với NCC */}
                <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <CreditCard className="h-3.5 w-3.5 text-slate-500" /> Công nợ NCC hiện tại:
                  </span>
                  <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                    {formatVND(supplier?.cong_no || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Box Khách Hàng hoặc Kho Nhận Hàng */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 p-4.5 space-y-3 relative shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2.5">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                  <UserRound className="h-4.5 w-4.5 text-teal-600" />
                  <span>
                    {isInternal ? "Đơn Vị Nhận Hàng (Nội Bộ)" : "Khách Hàng / Xưởng Nhận"}
                  </span>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {isInternal ? "MIMIN" : order.maKhachHang}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                {isInternal ? (
                  <>
                    <div>
                      <span className="text-slate-500">Đơn vị:</span>{" "}
                      <b className="text-slate-900 dark:text-white">Công ty TNHH May Mặc MIMIN</b>
                    </div>
                    <div>
                      <span className="text-slate-500">Mục đích:</span>{" "}
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                        Nhập kho phụ liệu nội bộ phục vụ sản xuất
                      </span>
                    </div>
                    <div className="flex items-start gap-1.5 text-slate-700 dark:text-slate-300">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>Địa điểm giao:</span>{" "}
                      <span className="font-medium">
                        {order.diaChiGiao || "Kho phụ liệu MIMIN - Nhà xưởng sản xuất"}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="text-slate-500">Khách hàng:</span>{" "}
                      <b className="text-slate-900 dark:text-white text-sm block sm:inline">
                        {customer?.ten || order.maKhachHang}
                      </b>
                    </div>
                    {customer?.sdt && (
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                        <Phone className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                        <span>SĐT:</span> <b className="font-mono">{customer.sdt}</b>
                      </div>
                    )}
                    <div className="flex items-start gap-1.5 text-slate-700 dark:text-slate-300">
                      <MapPin className="h-3.5 w-3.5 text-teal-600 shrink-0 mt-0.5" />
                      <span>Địa chỉ nhận:</span>{" "}
                      <span className="font-medium">
                        {order.diaChiGiao || customer?.diaChi || "Theo thỏa thuận"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Hình thức giao:</span>{" "}
                      <span className="font-semibold text-teal-700 dark:text-teal-400">
                        {order.giaoThangKhach
                          ? "NCC giao thẳng cho khách"
                          : "Về kho MIMIN trước khi giao"}
                      </span>
                    </div>
                  </>
                )}

                {/* Thời gian đặt & Hạn giao */}
                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block">Ngày đặt:</span>
                    <b className="text-slate-800 dark:text-slate-200 font-mono">{order.ngayDat}</b>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Hạn giao hàng:</span>
                    <b className="text-emerald-700 dark:text-emerald-400 font-mono">
                      {order.ngayGiao}
                    </b>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. BẢNG CHI TIẾT TỪNG VẬT TƯ ĐÃ ĐẶT */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="h-4 w-4 text-emerald-600" />
                Danh Sách Vật Tư Đặt Hàng ({items.length} mặt hàng · {totalQty.toLocaleString("vi-VN")}{" "}
                {items[0]?.donVi || "đơn vị"})
              </h3>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
              <table className="w-full min-w-[720px] text-xs sm:text-sm">
                <thead className="bg-slate-50/90 dark:bg-slate-800/60 text-left text-xs font-bold text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Mẫu Vật Tư</th>
                    <th className="p-3">Màu / Quy Cách</th>
                    <th className="p-3 text-right">Số Lượng</th>
                    <th className="p-3 text-right">Đơn Giá Mua</th>
                    {!isInternal && <th className="p-3 text-right">Đơn Giá Bán</th>}
                    <th className="p-3 text-right">Thành Tiền Mua</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {item.hinhAnh ? (
                            <img
                              src={item.hinhAnh}
                              alt={item.tenVatTu}
                              className="h-10 w-10 shrink-0 rounded-lg border border-slate-200 dark:border-slate-700 object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                              <Package className="h-4 w-4 text-slate-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                              {item.maVatTu}
                            </div>
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {item.tenVatTu}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        <div>{item.mauSac || "—"}</div>
                        <div className="text-[11px] opacity-75 line-clamp-1">
                          {item.quyCach || "Theo thỏa thuận"}
                        </div>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {item.soLuong.toLocaleString("vi-VN")}{" "}
                        <span className="text-[11px] font-normal text-slate-500">{item.donVi}</span>
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {formatVND(item.donGiaMua)}
                      </td>
                      {!isInternal && (
                        <td className="p-3 text-right font-mono font-bold text-emerald-600">
                          {formatVND(item.donGiaBan)}
                        </td>
                      )}
                      <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatVND(item.soLuong * item.donGiaMua)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. THỐNG KÊ TÀI CHÍNH & LỢI NHUẬN (MÀU XANH LÁ SÁNG THEO YÊU CẦU) */}
          <div className="grid gap-5 md:grid-cols-[1.2fr_1fr]">
            {/* Ghi chú & Chi phí phụ */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Ghi Chú & Chi Phí Phụ
              </h3>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 text-xs bg-slate-50/60 dark:bg-slate-800/30 text-slate-600 dark:text-slate-300 space-y-2">
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Ghi chú đơn hàng:
                  </span>
                  <p className="mt-0.5 whitespace-pre-wrap">{order.ghiChu || "Không có ghi chú thêm."}</p>
                </div>
                {order.quyCach && (
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Quy cách kỹ thuật dệt:
                    </span>
                    <p className="mt-0.5 whitespace-pre-wrap">{order.quyCach}</p>
                  </div>
                )}
              </div>

              {/* Chi phí vận chuyển và chi phí khác */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <span className="text-slate-400 block text-[11px]">Phí vận chuyển</span>
                  <b className="font-mono text-slate-800 dark:text-slate-200">
                    {formatVND(order.phiVanChuyen || 0)}
                  </b>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <span className="text-slate-400 block text-[11px]">Chi phí khác</span>
                  <b className="font-mono text-slate-800 dark:text-slate-200">
                    {formatVND(order.chiPhiKhac || 0)}
                  </b>
                </div>
              </div>
            </div>

            {/* Thẻ Thống Kê Tài Chính Xanh Lá Sáng Rực Rỡ */}
            <div>
              <div className="rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 text-white p-5 shadow-lg shadow-emerald-600/15">
                {!isInternal ? (
                  <div>
                    <div className="text-xs font-bold text-emerald-100 uppercase tracking-wider">
                      LỢI NHUẬN DỰ KIẾN
                    </div>
                    <div className="text-2xl sm:text-3xl font-black font-mono mt-1 text-white">
                      {formatVND(loiNhuan)}
                    </div>
                    <div className="text-xs text-emerald-100 mt-1 font-semibold">
                      Biên lợi nhuận: {bienLoiNhuan.toFixed(1)}%
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-xs font-bold text-emerald-100 uppercase tracking-wider">
                      TỔNG GIÁ VỐN MUA NCC
                    </div>
                    <div className="text-2xl sm:text-3xl font-black font-mono mt-1 text-white">
                      {formatVND(giaVon)}
                    </div>
                    <div className="text-xs text-emerald-100 mt-1">
                      Đã bao gồm tiền hàng và phí vận chuyển
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-3.5 border-t border-white/20 space-y-2 text-xs">
                  <div className="flex justify-between text-emerald-50">
                    <span>Tiền hàng NCC:</span>
                    <b className="font-mono">{formatVND(tienMua)}</b>
                  </div>
                  <div className="flex justify-between text-emerald-50">
                    <span>Tổng giá vốn:</span>
                    <b className="font-mono">{formatVND(giaVon)}</b>
                  </div>

                  {!isInternal && (
                    <>
                      <div className="flex justify-between text-emerald-50">
                        <span>Doanh thu trước VAT:</span>
                        <b className="font-mono">{formatVND(doanhThu)}</b>
                      </div>
                      <div className="flex justify-between text-emerald-50">
                        <span>VAT ({order.thueVat || 0}%):</span>
                        <b className="font-mono">{formatVND(vatDauRa)}</b>
                      </div>
                      <div className="pt-2 border-t border-white/25 flex justify-between text-sm font-bold text-white">
                        <span>Tổng hóa đơn khách:</span>
                        <span className="font-mono text-base">{formatVND(tongHoaDon)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* FOOTER ACTIONS                                                 */}
        {/* ============================================================== */}
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 p-4 sm:p-5 bg-slate-50 dark:bg-slate-850 shrink-0">
          <div>
            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete(order.id, order.maPhieu);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                <span>Xóa Phiếu</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isInternal && (
              <button
                type="button"
                onClick={() => handlePrint("customer")}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>In Phiếu Khách</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handlePrint("ncc")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>In Lệnh NCC</span>
            </button>

            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onEdit(order);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <Pencil className="h-4 w-4" />
                <span>Sửa Đơn Này</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
