"use client";

// ============================================
// Module Vận chuyển - riêng cho POLOMIMIN
// Phase 3: theo doi cac don hang dang van chuyen
// 2026-08-06
// ============================================

import { useState, useMemo } from "react";
import {
  Truck, Package, MapPin, Search, Edit2, Save, X, Plus,
  AlertCircle, CheckCircle2, Clock, ChevronRight, Filter,
  ExternalLink, Phone, User
} from "lucide-react";
import { toast } from "sonner";
import { useSupabaseSync } from "@/lib/supabase/client";
import { useSession } from "@/components/session-provider";
import { formatVNDShort } from "@/lib/data/real-data";
import type { Order } from "@/components/order-detail/types";
import {
  PHUONG_THUC_VAN_CHUYEN_LABELS, TRANG_THAI_VAN_CHUYEN_LABELS,
  type PhuongThucVanChuyen, type TrangThaiVanChuyen
} from "@/components/order-detail/types";

const TRANG_THAI_VC_STYLE: Record<TrangThaiVanChuyen, { color: string; bg: string; icon: any }> = {
  "cho-xu-ly": { color: "text-slate-700", bg: "bg-slate-500/15", icon: Clock },
  "cho-lay-hang": { color: "text-amber-700", bg: "bg-amber-500/15", icon: Package },
  "dang-giao": { color: "text-sky-700", bg: "bg-sky-500/15", icon: Truck },
  "da-giao": { color: "text-emerald-700", bg: "bg-emerald-500/15", icon: CheckCircle2 },
  "huy": { color: "text-red-700", bg: "bg-red-500/15", icon: X },
};

export default function VanChuyenPage() {
  const { data: donHangs, setData: setDonHangs } = useSupabaseSync<Order>("mimin_don_hang", "don_hang");
  const { data: khachHangs } = useSupabaseSync<any>("mimin_khach_hang", "khach_hang");
  const { user } = useSession();

  const [search, setSearch] = useState("");
  const [filterTrangThai, setFilterTrangThai] = useState<TrangThaiVanChuyen | "all">("all");
  const [filterPhuongThuc, setFilterPhuongThuc] = useState<PhuongThucVanChuyen | "all">("all");
  const [editingDH, setEditingDH] = useState<Order | null>(null);

  // Loc cac don co thong tin van chuyen
  const dsVanChuyen = useMemo(() => {
    return donHangs
      .filter((d) => d.shipping && d.trangThai !== "Hủy")
      .map((d) => {
        // Lookup ten KH tu bang khach_hang (neu co)
        const kh = khachHangs.find((k: any) => k.ten_kh === d.khachHang);
        return { ...d, tenKH: kh?.ten_kh || d.khachHang, sdtKH: d.sdt || kh?.sdt || "" };
      })
      .filter((d) => {
        const matchSearch = !search || [d.maDH, d.khachHang, d.sdt].some((x) => (x || "").toLowerCase().includes(search.toLowerCase()));
        const matchTrangThai = filterTrangThai === "all" || d.shipping.trangThai === filterTrangThai;
        const matchPhuongThuc = filterPhuongThuc === "all" || d.shipping.phuongThuc === filterPhuongThuc;
        return matchSearch && matchTrangThai && matchPhuongThuc;
      });
  }, [donHangs, khachHangs, search, filterTrangThai, filterPhuongThuc]);

  // KPIs
  const tongDonVC = dsVanChuyen.length;
  const dangGiao = dsVanChuyen.filter((d) => d.shipping.trangThai === "dang-giao").length;
  const choXuLy = dsVanChuyen.filter((d) => d.shipping.trangThai === "cho-xu-ly" || d.shipping.trangThai === "cho-lay-hang").length;
  const daGiao = dsVanChuyen.filter((d) => d.shipping.trangThai === "da-giao").length;

  // Update trang thai VC
  const updateTrangThaiVC = async (order: Order, newTrangThai: TrangThaiVanChuyen) => {
    const newShipping = { ...order.shipping, trangThai: newTrangThai };
    // Cập nhật state local (setDonHangs tự sync lên Supabase)
    await setDonHangs((prev) =>
      prev.map((d) => d.id === order.id ? { ...d, shipping: newShipping } : d)
    );
    toast.success(`Đã cập nhật: ${TRANG_THAI_VAN_CHUYEN_LABELS[newTrangThai]}`);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Truck className="w-7 h-7 text-brand-500" />
            Vận chuyển
            <span className="ml-3 text-sm font-normal opacity-70">({tongDonVC} đơn)</span>
          </h1>
          <p className="opacity-70 mt-1 text-sm">
            Theo dõi và cập nhật trạng thái vận chuyển các đơn hàng
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="Tổng đơn VC"
          value={tongDonVC}
          icon={Truck}
          color="from-cyan-500 to-blue-500"
        />
        <KpiCard
          label="Chờ xử lý"
          value={choXuLy}
          icon={Clock}
          color="from-slate-500 to-slate-600"
        />
        <KpiCard
          label="Đang giao"
          value={dangGiao}
          icon={Truck}
          color="from-sky-500 to-indigo-500"
        />
        <KpiCard
          label="Đã giao"
          value={daGiao}
          icon={CheckCircle2}
          color="from-emerald-500 to-green-500"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 bg-white/40 dark:bg-white/5 backdrop-blur rounded-xl p-3 border border-white/40 dark:border-white/10">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo mã ĐH, tên KH, SĐT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
          />
        </div>
        <select
          value={filterTrangThai}
          onChange={(e) => setFilterTrangThai(e.target.value as any)}
          className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
        >
          <option value="all">Tất cả trạng thái</option>
          {(Object.keys(TRANG_THAI_VAN_CHUYEN_LABELS) as TrangThaiVanChuyen[]).map((k) => (
            <option key={k} value={k}>{TRANG_THAI_VAN_CHUYEN_LABELS[k]}</option>
          ))}
        </select>
        <select
          value={filterPhuongThuc}
          onChange={(e) => setFilterPhuongThuc(e.target.value as any)}
          className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
        >
          <option value="all">Tất cả phương thức</option>
          {(Object.keys(PHUONG_THUC_VAN_CHUYEN_LABELS) as PhuongThucVanChuyen[]).map((k) => (
            <option key={k} value={k}>{PHUONG_THUC_VAN_CHUYEN_LABELS[k]}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-xl border border-white/40 dark:border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-xs uppercase font-bold">
              <tr>
                <th className="text-left p-3">Mã ĐH</th>
                <th className="text-left p-3">Khách hàng</th>
                <th className="text-left p-3">Sản phẩm</th>
                <th className="text-left p-3">Phương thức</th>
                <th className="text-left p-3">Mã vận đơn</th>
                <th className="text-right p-3">Phí VC</th>
                <th className="text-center p-3">Trạng thái</th>
                <th className="text-center p-3">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {dsVanChuyen.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-12 text-slate-400">
                    <Truck className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>Không có đơn vận chuyển nào phù hợp</p>
                  </td>
                </tr>
              ) : (
                dsVanChuyen.map((d) => {
                  const s = TRANG_THAI_VC_STYLE[d.shipping.trangThai];
                  const Icon = s.icon;
                  return (
                    <tr key={d.id} className="border-b last:border-0 hover:bg-white/30 dark:hover:bg-white/5">
                      <td className="p-3">
                        <div className="font-mono text-xs font-bold text-brand-600">{d.maDH}</div>
                        <div className="text-[10px] opacity-60">{d.ngayDat}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {d.khachHang}
                        </div>
                        {d.sdt && <div className="text-[10px] opacity-60 flex items-center gap-1"><Phone className="w-2.5 h-2.5" />{d.sdt}</div>}
                      </td>
                      <td className="p-3">
                        <div className="text-xs">
                          {d.items.length > 0 ? (
                            <>
                              <div className="font-medium truncate max-w-[200px]">{d.items[0].spTen}</div>
                              {d.items.length > 1 && <div className="text-[10px] opacity-60">+{d.items.length - 1} SP khác</div>}
                            </>
                          ) : (
                            <span className="opacity-60">{d.sanPham || "—"}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-xs">
                        <div className="flex items-center gap-1">
                          <Truck className="w-3 h-3 text-cyan-600" />
                          {PHUONG_THUC_VAN_CHUYEN_LABELS[d.shipping.phuongThuc]}
                        </div>
                        {d.shipping.diaChiGiao && (
                          <div className="text-[10px] opacity-60 truncate max-w-[180px] flex items-start gap-1 mt-0.5">
                            <MapPin className="w-2.5 h-2.5 mt-0.5 shrink-0" />
                            {d.shipping.diaChiGiao}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        {d.shipping.maVanDon ? (
                          <code className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            {d.shipping.maVanDon}
                          </code>
                        ) : (
                          <span className="text-[10px] opacity-40">—</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono text-xs">
                        {d.shipping.phiVanChuyen > 0 ? formatVNDShort(d.shipping.phiVanChuyen) : <span className="opacity-40">—</span>}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${s.bg} ${s.color}`}>
                          <Icon className="w-3 h-3" />
                          {TRANG_THAI_VAN_CHUYEN_LABELS[d.shipping.trangThai]}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {d.shipping.trangThai !== "da-giao" && d.shipping.trangThai !== "huy" && (
                          <button
                            onClick={() => {
                              const next: TrangThaiVanChuyen =
                                d.shipping.trangThai === "cho-xu-ly" ? "cho-lay-hang" :
                                d.shipping.trangThai === "cho-lay-hang" ? "dang-giao" :
                                "da-giao";
                              updateTrangThaiVC(d, next);
                            }}
                            className="text-[10px] px-2 py-1 rounded bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 flex items-center gap-0.5 mx-auto"
                            title="Chuyển bước tiếp theo"
                          >
                            <ChevronRight className="w-3 h-3" />
                            Tiếp
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal - inline simple */}
      {editingDH && (
        <EditVanChuyenModal
          order={editingDH}
          onClose={() => setEditingDH(null)}
          onSaved={() => {
            setEditingDH(null);
            setTimeout(() => window.location.reload(), 500);
          }}
        />
      )}
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-xl p-3 text-white shadow-md`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs opacity-90">{label}</div>
          <div className="text-2xl font-bold mt-0.5">{value}</div>
        </div>
        <Icon className="w-8 h-8 opacity-50" />
      </div>
    </div>
  );
}

function EditVanChuyenModal({ order, onClose, onSaved }: { order: Order; onClose: () => void; onSaved: () => void }) {
  const [shipping, setShipping] = useState(order.shipping);

  const handleSave = async () => {
    const { supabase } = await import("@/lib/supabase/client");
    if (supabase) {
      const { error } = await supabase.from("don_hang").update({ shipping }).eq("id", order.id);
      if (!error) {
        toast.success("Đã cập nhật vận chuyển");
        onSaved();
      } else {
        toast.error("Lỗi: " + error.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="card max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Truck className="w-5 h-5 text-brand-500" />
            Cập nhật vận chuyển: {order.maDH}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-white/40 rounded"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium block mb-1">Phương thức</label>
            <select className="input w-full" value={shipping.phuongThuc} onChange={(e) => setShipping({ ...shipping, phuongThuc: e.target.value as PhuongThucVanChuyen })}>
              {(Object.keys(PHUONG_THUC_VAN_CHUYEN_LABELS) as PhuongThucVanChuyen[]).map((k) => (
                <option key={k} value={k}>{PHUONG_THUC_VAN_CHUYEN_LABELS[k]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Mã vận đơn</label>
            <input className="input w-full" value={shipping.maVanDon || ""} onChange={(e) => setShipping({ ...shipping, maVanDon: e.target.value || undefined })} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Phí vận chuyển (đ)</label>
            <input type="number" className="input w-full" value={shipping.phiVanChuyen || 0} onChange={(e) => setShipping({ ...shipping, phiVanChuyen: Math.max(0, +e.target.value || 0) })} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Địa chỉ giao</label>
            <textarea className="input w-full min-h-[60px]" value={shipping.diaChiGiao || ""} onChange={(e) => setShipping({ ...shipping, diaChiGiao: e.target.value || undefined })} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Trạng thái</label>
            <select className="input w-full" value={shipping.trangThai} onChange={(e) => setShipping({ ...shipping, trangThai: e.target.value as TrangThaiVanChuyen })}>
              {(Object.keys(TRANG_THAI_VAN_CHUYEN_LABELS) as TrangThaiVanChuyen[]).map((k) => (
                <option key={k} value={k}>{TRANG_THAI_VAN_CHUYEN_LABELS[k]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Ghi chú</label>
            <textarea className="input w-full min-h-[40px]" value={shipping.ghiChu || ""} onChange={(e) => setShipping({ ...shipping, ghiChu: e.target.value || undefined })} />
          </div>
        </div>
        <div className="flex gap-2 pt-4 border-t mt-4">
          <button onClick={onClose} className="btn-secondary flex-1">Huỷ</button>
          <button onClick={handleSave} className="btn-primary flex-1"><Save className="w-4 h-4 inline mr-1" />Lưu</button>
        </div>
      </div>
    </div>
  );
}
