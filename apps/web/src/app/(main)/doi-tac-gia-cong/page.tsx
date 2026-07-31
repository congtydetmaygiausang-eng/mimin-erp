// Trang quản lý 35 đối tác gia công thật (từ CSV chị Giàu 2026-07-28)
// 7 in/thêu/dập + 4 may quần + 14 may áo tròn + 10 may áo trụ

"use client";

import { useState, useMemo } from "react";
import {
  Users, Search, Phone, MapPin, Building2, CreditCard, FileText,
  CheckCircle2, XCircle, Briefcase, Filter, Scissors, Shirt,
  Hash, Banknote, Shield, AlertTriangle, X, Plus, Edit2, Trash2
} from "lucide-react";
import { DOI_TAC_GIA_CONG, thongKeDoiTac, type DoiTacGiaCong, type LoaiDoiTac } from "@/lib/doi-tac-gia-cong";
import { usePermission } from "@/components/PermissionGuard";
import { DataViewToggle, type ViewMode } from "@/components/DataViewToggle";
import { Avatar } from "@/components/Avatar";
import { EntityCard, EntityCardGrid } from "@/components/EntityCard";
import { toast } from "sonner";

const LOAI_TABS: { key: LoaiDoiTac | "ALL"; label: string; icon: any; color: string }[] = [
  { key: "ALL", label: "Tất cả", icon: Users, color: "bg-slate-500" },
  { key: "GC-IN", label: "In / Thêu / Dập", icon: Scissors, color: "bg-violet-500" },
  { key: "GC-QUAN", label: "May quần", icon: Shirt, color: "bg-blue-500" },
  { key: "GC-TRON", label: "May áo tròn", icon: Shirt, color: "bg-emerald-500" },
  { key: "GC-TRU", label: "May áo trụ", icon: Shirt, color: "bg-amber-500" },
];

export default function DoiTacGiaCongPage() {
  const [search, setSearch] = useState("");
  const [loaiFilter, setLoaiFilter] = useState<LoaiDoiTac | "ALL">("ALL");
  const [trangThaiFilter, setTrangThaiFilter] = useState<"ALL" | "dang_hop_tac" | "ngung_hop_tac">("ALL");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [selected, setSelected] = useState<DoiTacGiaCong | null>(null);
  const [showForm, setShowForm] = useState<{ mode: "add" | "edit"; dt?: DoiTacGiaCong } | null>(null);
  const perm = usePermission();

  const stats = thongKeDoiTac();

  const filtered = useMemo(() => {
    return DOI_TAC_GIA_CONG.filter((d) => {
      const matchSearch = [d.tenDonVi, d.nguoiLienHe, d.sdt, d.diaChi, d.ma, d.maSoThue].some(
        (y) => (y || "").toLowerCase().includes(search.toLowerCase())
      );
      const matchLoai = loaiFilter === "ALL" || d.ma.startsWith(loaiFilter + "-");
      const matchTrangThai = trangThaiFilter === "ALL" || d.trangThai === trangThaiFilter;
      return matchSearch && matchLoai && matchTrangThai;
    });
  }, [search, loaiFilter, trangThaiFilter]);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Users className="w-7 h-7 text-brand-500" />
            Đối tác gia công Outside
            <span className="text-sm font-normal text-slate-500">(35 đối tác thật từ CSV)</span>
          </h1>
          <p className="opacity-70 mt-1 text-sm">
            {stats.tong} đối tác · <b className="text-emerald-600">{stats.dangHopTac} đang hợp tác</b> · {stats.ngungHopTac} ngừng
          </p>
        </div>
        <button
          onClick={() => setShowForm({ mode: "add" })}
          className="px-4 py-2.5 rounded-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/20 flex items-center gap-2 transition"
        >
          <Plus className="w-5 h-5" /> Thêm đối tác mới
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="card p-4">
          <div className="text-xs opacity-70 flex items-center gap-1"><Users className="w-3 h-3" /> Tổng</div>
          <div className="text-2xl font-bold mt-1">{stats.tong}</div>
        </div>
        <div className="card p-4 border-violet-200">
          <div className="text-xs opacity-70 flex items-center gap-1"><Scissors className="w-3 h-3 text-violet-600" /> In/Thêu/Dập</div>
          <div className="text-2xl font-bold mt-1 text-violet-600">{stats.inTheuDap}</div>
        </div>
        <div className="card p-4 border-blue-200">
          <div className="text-xs opacity-70 flex items-center gap-1"><Shirt className="w-3 h-3 text-blue-600" /> May quần</div>
          <div className="text-2xl font-bold mt-1 text-blue-600">{stats.mayQuan}</div>
        </div>
        <div className="card p-4 border-emerald-200">
          <div className="text-xs opacity-70 flex items-center gap-1"><Shirt className="w-3 h-3 text-emerald-600" /> May áo tròn</div>
          <div className="text-2xl font-bold mt-1 text-emerald-600">{stats.mayTron}</div>
        </div>
        <div className="card p-4 border-amber-200">
          <div className="text-xs opacity-70 flex items-center gap-1"><Shirt className="w-3 h-3 text-amber-600" /> May áo trụ</div>
          <div className="text-2xl font-bold mt-1 text-amber-600">{stats.mayTru}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-2 flex-1">
            {LOAI_TABS.map((tab) => {
              const Icon = tab.icon;
              const count = tab.key === "ALL" ? stats.tong :
                tab.key === "GC-IN" ? stats.inTheuDap :
                tab.key === "GC-QUAN" ? stats.mayQuan :
                tab.key === "GC-TRON" ? stats.mayTron : stats.mayTru;
              return (
                <button
                  key={tab.key}
                  onClick={() => setLoaiFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${
                    loaiFilter === tab.key ? "bg-brand-500 text-white" : "bg-white/40 dark:bg-white/5 hover:bg-white/60"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {tab.label} ({count})
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <select
              value={trangThaiFilter}
              onChange={(e) => setTrangThaiFilter(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg text-xs border border-slate-200 bg-white"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="dang_hop_tac">Đang hợp tác</option>
              <option value="ngung_hop_tac">Ngừng hợp tác</option>
            </select>
            <DataViewToggle onChange={setViewMode} />
          </div>
        </div>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
          <input
            className="input pl-9"
            placeholder="Tìm tên, mã, SĐT, địa chỉ, MST..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table view */}
      {viewMode === "table" && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b bg-slate-50" style={{ borderColor: "var(--border)" }}>
                  <th className="p-3 font-semibold">Mã</th>
                  <th className="p-3 font-semibold">Tên đơn vị / Người LH</th>
                  <th className="p-3 font-semibold">Loại</th>
                  <th className="p-3 font-semibold">SĐT</th>
                  <th className="p-3 font-semibold">Địa chỉ</th>
                  <th className="p-3 font-semibold">MST</th>
                  <th className="p-3 font-semibold text-center">Trạng thái</th>
                  <th className="p-3 font-semibold text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-slate-500 text-sm">Không tìm thấy đối tác nào</td></tr>
                ) : filtered.map((d) => (
                  <tr key={d.ma} className="border-b last:border-0 hover:bg-slate-50/50" style={{ borderColor: "var(--border)" }}>
                    <td className="p-3 font-mono text-xs">
                      <div className="font-semibold text-brand-600">{d.ma}</div>
                      <div className="text-[10px] text-slate-400">STT {d.stt}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{d.tenDonVi}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Users className="w-3 h-3" /> {d.nguoiLienHe}
                      </div>
                    </td>
                    <td className="p-3 text-xs">
                      <span className="px-2 py-0.5 rounded bg-violet-500/10 text-violet-700">{d.chuyenMon}</span>
                    </td>
                    <td className="p-3 text-xs">
                      {d.sdt ? (
                        <a href={`tel:${d.sdt}`} className="flex items-center gap-1 text-brand-600 hover:underline">
                          <Phone className="w-3 h-3" /> {d.sdt}
                        </a>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="p-3 text-xs max-w-xs">
                      {d.diaChi ? (
                        <div className="flex items-start gap-1 text-slate-700">
                          <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{d.diaChi}</span>
                        </div>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="p-3 text-xs font-mono text-slate-600">{d.maSoThue && d.maSoThue !== "---" ? d.maSoThue : <span className="text-slate-400">—</span>}</td>
                    <td className="p-3 text-center">
                      {d.trangThai === "dang_hop_tac" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700">
                          <CheckCircle2 className="w-3 h-3" /> Đang hợp tác
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-rose-100 text-rose-700">
                          <XCircle className="w-3 h-3" /> Ngừng
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setSelected(d)}
                        className="text-xs px-2.5 py-1 rounded bg-brand-500 text-white hover:bg-brand-600"
                      >
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Card view */}
      {viewMode === "card" && (
        <EntityCardGrid cols={3}>
          {filtered.map((d) => (
            <EntityCard
              key={d.ma}
              name={d.tenDonVi}
              avatarSize="lg"
              badges={[
                { label: d.chuyenMon, bg: "bg-violet-500/15", color: "text-violet-700" },
                {
                  label: d.trangThai === "dang_hop_tac" ? "Đang hợp tác" : "Ngừng",
                  bg: d.trangThai === "dang_hop_tac" ? "bg-emerald-500/15" : "bg-rose-500/15",
                  color: d.trangThai === "dang_hop_tac" ? "text-emerald-700" : "text-rose-700",
                },
              ]}
              subtitle={<span className="font-mono text-[10px]">{d.ma} · {d.nguoiLienHe}</span>}
              stats={[
                { label: "SĐT", value: d.sdt || "—", icon: Phone },
                { label: "MST", value: d.maSoThue || "—", icon: Hash },
                { label: "NH", value: d.nganHang || "—", icon: Banknote },
              ]}
              onView={() => setSelected(d)}
            />
          ))}
        </EntityCardGrid>
      )}

      {/* Detail Modal */}
      {selected && <DoiTacDetail dt={selected} onClose={() => setSelected(null)} />}
      {showForm && (
        <DoiTacFormModal
          mode={showForm.mode}
          dt={showForm.dt}
          onClose={() => setShowForm(null)}
          onSave={(newDt) => {
            toast.success(showForm.mode === "add" ? "Thêm đối tác gia công mới thành công" : "Cập nhật thành công");
            setShowForm(null);
          }}
        />
      )}
    </div>
  );
}

function DoiTacFormModal({ mode, dt, onClose, onSave }: { mode: "add" | "edit"; dt?: DoiTacGiaCong; onClose: () => void; onSave: (d: any) => void }) {
  const [form, setForm] = useState<any>(dt || {
    ma: `GC-${Date.now().toString().slice(-4)}`,
    tenDonVi: "",
    nguoiLienHe: "",
    chuyenMon: "In / Thêu / Dập",
    sdt: "",
    email: "",
    diaChi: "",
    soTaiKhoan: "",
    nganHang: "",
    maSoThue: "",
    trangThai: "dang_hop_tac",
    ghiChu: "",
    avatar: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tenDonVi || !form.sdt) return toast.error("Vui lòng nhập Tên xưởng và SĐT");
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div className="w-[96%] max-w-2xl sm:max-w-3xl rounded-3xl p-5 sm:p-7 max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold">
              {mode === "add" ? <Plus className="w-6 h-6" /> : <Edit2 className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {mode === "add" ? "Thêm Đối Tác Gia Công mới" : `Chỉnh sửa: ${dt?.tenDonVi}`}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Xưởng Thêu, In, Giặt, May ngoài gia công cho MIMIN</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Upload Header */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
            <div className="relative group cursor-pointer">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-violet-500/30 shadow-md overflow-hidden bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                {form.avatar ? (
                  <img src={form.avatar} alt={form.tenDonVi} className="w-full h-full object-cover" />
                ) : (
                  <span>{form.tenDonVi ? form.tenDonVi.charAt(0).toUpperCase() : "GC"}</span>
                )}
              </div>
              <label className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition cursor-pointer">
                <span className="text-xs font-semibold">Tải Logo</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => setForm({ ...form, avatar: ev.target?.result as string });
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>

            <div className="text-center sm:text-left space-y-1">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Logo / Ảnh Xưởng Gia Công</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Tải logo biển hiệu xưởng thêu/in hoặc ảnh đại diện chủ xưởng</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Mã đối tác *</label>
              <input required className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-violet-500" value={form.ma} onChange={(e) => setForm({ ...form, ma: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Tên Xưởng / Đơn vị gia công *</label>
              <input required className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-violet-500" value={form.tenDonVi} onChange={(e) => setForm({ ...form, tenDonVi: e.target.value })} placeholder="VD: Xưởng Thêu Minh Tâm..." />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Người đại diện liên hệ</label>
              <input className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-violet-500" value={form.nguoiLienHe} onChange={(e) => setForm({ ...form, nguoiLienHe: e.target.value })} placeholder="Họ tên chủ xưởng / quản lý..." />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Loại gia công *</label>
              <select className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-violet-500" value={form.chuyenMon} onChange={(e) => setForm({ ...form, chuyenMon: e.target.value })}>
                <option>In / Thêu / Dập</option>
                <option>May quần</option>
                <option>May áo tròn</option>
                <option>May áo trụ</option>
                <option>Giặt nhuộm / Khác</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">SĐT liên hệ *</label>
              <input required className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-violet-500" value={form.sdt} onChange={(e) => setForm({ ...form, sdt: e.target.value })} placeholder="0901234567" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Email</label>
              <input type="email" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-violet-500" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="xuonggiacong@example.com" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Địa chỉ xưởng gia công</label>
            <input className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-violet-500" value={form.diaChi} onChange={(e) => setForm({ ...form, diaChi: e.target.value })} placeholder="Địa chỉ xưởng gia công..." />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Số tài khoản</label>
              <input className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-violet-500 font-mono" value={form.soTaiKhoan} onChange={(e) => setForm({ ...form, soTaiKhoan: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Ngân hàng</label>
              <input className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-violet-500" value={form.nganHang} onChange={(e) => setForm({ ...form, nganHang: e.target.value })} placeholder="MB, Vietcombank..." />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Mã số thuế</label>
              <input className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-violet-500 font-mono" value={form.maSoThue} onChange={(e) => setForm({ ...form, maSoThue: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Ghi chú điều khoản xưởng</label>
            <textarea className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-violet-500 min-h-[70px]" value={form.ghiChu} onChange={(e) => setForm({ ...form, ghiChu: e.target.value })} placeholder="Ghi chú thêm về đơn giá thêu/in, thời gian giao trả hàng..." />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-1/3 py-3.5 rounded-2xl font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="w-full sm:w-2/3 py-3.5 rounded-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25 transition flex items-center justify-center gap-2 text-base"
            >
              {mode === "add" ? <Plus className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
              {mode === "add" ? "Thêm Đối Tác mới" : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DoiTacDetail({ dt, onClose }: { dt: DoiTacGiaCong; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="card max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
          <div>
            <div className="text-xs font-mono text-brand-600">{dt.ma}</div>
            <h3 className="text-lg font-bold">{dt.tenDonVi}</h3>
            <p className="text-sm text-slate-500 mt-0.5">Người liên hệ: <b className="text-slate-700">{dt.nguoiLienHe}</b></p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/40 rounded"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-3 text-sm">
          <Section title="Phân loại">
            <Field icon={Briefcase} label="Loại hình" value={dt.chuyenMon} />
            <Field icon={Users} label="Loại đối tượng" value="Đối tác gia công" />
            <Field icon={Shield} label="Trạng thái" value={dt.trangThai === "dang_hop_tac" ? "Đang hợp tác" : "Ngừng hợp tác"}
              valueClass={dt.trangThai === "dang_hop_tac" ? "text-emerald-600" : "text-rose-600"} />
          </Section>

          <Section title="Liên hệ">
            <Field icon={Phone} label="SĐT" value={dt.sdt || "—"} mono />
            <Field icon={MapPin} label="Địa chỉ" value={dt.diaChi || "—"} />
            <Field icon={FileText} label="Email" value={dt.email || "—"} />
          </Section>

          <Section title="Tài chính">
            <Field icon={CreditCard} label="Số tài khoản" value={dt.soTaiKhoan || "—"} mono />
            <Field icon={Banknote} label="Ngân hàng" value={dt.nganHang || "—"} />
            <Field icon={Hash} label="Mã số thuế" value={dt.maSoThue || "—"} mono />
          </Section>

          {dt.cccd && (
            <Section title="Giấy tờ tùy thân">
              <Field icon={Shield} label="CCCD" value={dt.cccd} mono />
              {dt.cccdNgayCap && <Field icon={FileText} label="Ngày cấp" value={dt.cccdNgayCap} />}
            </Section>
          )}

          {dt.ghiChu && (
            <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600">
              <b>Ghi chú:</b> {dt.ghiChu}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">{title}</div>
      <div className="space-y-1.5 pl-1 border-l-2 border-slate-200">{children}</div>
    </div>
  );
}

function Field({ icon: Icon, label, value, mono, valueClass }: { icon: any; label: string; value: string; mono?: boolean; valueClass?: string }) {
  return (
    <div className="flex items-start gap-2 text-sm pl-2">
      <Icon className="w-3.5 h-3.5 text-slate-400 mt-1 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-slate-500">{label}</div>
        <div className={`${mono ? "font-mono" : ""} ${valueClass || "text-slate-800"}`}>{value}</div>
      </div>
    </div>
  );
}
