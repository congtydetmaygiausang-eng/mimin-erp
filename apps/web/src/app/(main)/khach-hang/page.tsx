"use client";

import { useState, useMemo } from "react";
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  Phone,
  Mail,
  MapPin,
  Star,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Award,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { formatVND, formatVNDShort } from "@/lib/data/real-data";
import { Avatar } from "@/components/Avatar";
import { EntityCard, EntityCardGrid, EntityCardList } from "@/components/EntityCard";
import { DataViewToggle, type ViewMode } from "@/components/DataViewToggle";
import { useKhachHang, type KhachHangUI } from "@/lib/data/khach-hang-store";
import { useEffect } from "react";
import PageHeader from "@/components/ui/PageHeader";

// Tính từ đơn hàng (mock data)
const DOANH_THU_KH: Record<string, number> = {
  "Cty May Hà Nội": 145000000,
  "Shop Thời Trang Sài Gòn": 57000000,
  "Xưởng may Minh Tâm": 33000000,
  "Cty Dệt Phong Phú": 65000000,
  "Xưởng may Hoàng Long": 46500000,
  "Cty May Việt Hưng": 29000000,
  "Shop Đồng Phục Sài Gòn": 28000000,
  "Cty Thời Trang Bảo Long": 35000000,
};

const SO_DON_KH: Record<string, number> = {
  "Cty May Hà Nội": 5, "Shop Thời Trang Sài Gòn": 3, "Xưởng may Minh Tâm": 1,
  "Cty Dệt Phong Phú": 1, "Xưởng may Hoàng Long": 1, "Cty May Việt Hưng": 1,
  "Shop Đồng Phục Sài Gòn": 2, "Cty Thời Trang Bảo Long": 2,
};

export default function KhachHangPage() {
  const { list, themKhachHang, suaKhachHang, xoaKhachHang, loading } = useKhachHang();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState<{ mode: "add" | "edit"; kh?: KhachHangUI } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("card");

  const filtered = useMemo(() => {
    return list.filter((k: KhachHangUI) => {
      const s = search.toLowerCase();
      return (
        k.ten.toLowerCase().includes(s) ||
        (k.sdt || "").includes(s) ||
        (k.maKH || "").toLowerCase().includes(s)
      );
    });
  }, [list, search]);

  const tongKH = list.length;
  const dsVIP = list.filter((k) => (k.rating || 0) >= 4.5);
  const tongDoanhThu = Object.values(DOANH_THU_KH).reduce((s, v) => s + v, 0);

  // Top 3 KH
  const topKH = useMemo(() => {
    return [...list].sort((a, b) => (DOANH_THU_KH[b.ten] || 0) - (DOANH_THU_KH[a.ten] || 0)).slice(0, 3);
  }, [list]);

  const handleSave = async (kh: KhachHangUI) => {
    const isEdit = showForm?.mode === "edit";
    if (isEdit) {
      const ok = await suaKhachHang(kh);
      if (ok) toast.success(`Đã cập nhật: ${kh.ten}`);
      else toast.error("Lỗi khi cập nhật");
    } else {
      const ok = await themKhachHang(kh);
      if (ok) toast.success(`Đã thêm KH: ${kh.ten}`);
      else toast.error("Lỗi khi thêm mới");
    }
    setShowForm(null);
  };

  const handleDelete = async (kh: KhachHangUI) => {
    if (confirm(`Xoá KH "${kh.ten}"?`)) {
      const ok = await xoaKhachHang(kh.maKH);
      if (ok) toast.success(`Đã xoá: ${kh.ten}`);
      else toast.error("Lỗi khi xoá");
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        moduleLabel="MIMIN ERP — Danh mục dữ liệu"
        title="Khách hàng sỉ"
        subtitle={`${tongKH} khách hàng · ${dsVIP.length} VIP · Tổng doanh thu ${formatVNDShort(tongDoanhThu)}`}
        icon={<Users className="w-5 h-5" />}
        actions={
          <button
            onClick={() => setShowForm({ mode: "add" })}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm transition"
          >
            <Plus className="w-4 h-4" /> Thêm KH
          </button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="text-xs opacity-70 flex items-center gap-1"><Users className="w-3 h-3" /> Tổng KH</div>
          <div className="text-2xl md:text-3xl font-bold mt-1">{tongKH}</div>
          <div className="text-xs opacity-60 mt-1">khách hàng</div>
        </div>
        <div className="card p-5">
          <div className="text-xs opacity-70 flex items-center gap-1"><Award className="w-3 h-3 text-amber-500" /> KH VIP</div>
          <div className="text-2xl md:text-3xl font-bold mt-1 text-amber-600">{dsVIP.length}</div>
          <div className="text-xs opacity-60 mt-1">rating ≥ 4.5⭐</div>
        </div>
        <div className="card p-5">
          <div className="text-xs opacity-70 flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-600" /> Tổng DT</div>
          <div className="text-2xl md:text-3xl font-bold mt-1 text-emerald-600">{formatVNDShort(tongDoanhThu)}</div>
          <div className="text-xs opacity-60 mt-1">{formatVND(tongDoanhThu)}</div>
        </div>
        <div className="card p-5">
          <div className="text-xs opacity-70 flex items-center gap-1"><ShoppingCart className="w-3 h-3 text-sky-500" /> Tổng đơn</div>
          <div className="text-2xl md:text-3xl font-bold mt-1 text-sky-600">{Object.values(SO_DON_KH).reduce((s, v) => s + v, 0)}</div>
          <div className="text-xs opacity-60 mt-1">đơn hàng</div>
        </div>
      </div>

      {/* Top 3 KH */}
      <div className="card p-4">
        <div className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-500" />
          Top 3 khách hàng VIP
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {topKH.map((k, i) => (
            <div key={k.maKH} className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/20">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${i === 0 ? "bg-amber-500" : i === 1 ? "bg-slate-400" : "bg-amber-700"}`}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{k.ten}</div>
                <div className="text-[10px] opacity-70">{formatVNDShort(DOANH_THU_KH[k.ten] || 0)} · {SO_DON_KH[k.ten] || 0} đơn</div>
              </div>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className={`w-3 h-3 ${star <= (k.rating || 0) ? "text-amber-400 fill-amber-400" : "text-slate-300"}`} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search + Toggle */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
            <input className="input pl-9" placeholder="Tìm tên, SĐT, email, địa chỉ…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <DataViewToggle onChange={setViewMode} />
        </div>
      </div>

      {/* Table / Card / List View */}
      {viewMode === "table" && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b" style={{ borderColor: "var(--border)" }}>
                  <th className="p-3">Mã KH</th>
                  <th className="p-3">Tên KH</th>
                  <th className="p-3">SĐT</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Địa chỉ</th>
                  <th className="p-3 text-center">Đánh giá</th>
                  <th className="p-3 text-center">Số đơn</th>
                  <th className="p-3 text-right">Doanh thu</th>
                  <th className="p-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((k) => {
                  const dt = DOANH_THU_KH[k.ten] || 0;
                  const soDon = SO_DON_KH[k.ten] || 0;
                  return (
                    <tr key={k.maKH} className="border-b last:border-0 hover:bg-white/30 dark:hover:bg-white/5" style={{ borderColor: "var(--border)" }}>
                      <td className="p-3 font-mono text-xs opacity-70">{k.maKH}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={k.ten} size="sm" />
                          <div>
                            <div className="font-medium">{k.ten}</div>
                            {k.mst && <div className="text-[10px] opacity-60">MST: {k.mst}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-xs">
                        <a href={`tel:${k.sdt}`} className="flex items-center gap-1 text-brand-600 hover:underline">
                          <Phone className="w-3 h-3" /> {k.sdt}
                        </a>
                      </td>
                      <td className="p-3 text-xs">
                        {k.email && <a href={`mailto:${k.email}`} className="flex items-center gap-1 text-sky-600 hover:underline">
                          <Mail className="w-3 h-3" /> {k.email.slice(0, 18)}
                        </a>}
                      </td>
                      <td className="p-3 text-xs">{k.diaChi ? <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {k.diaChi}</span> : "—"}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className={`w-3 h-3 ${star <= (k.rating || 0) ? "text-amber-400 fill-amber-400" : "text-slate-300"}`} />
                          ))}
                        </div>
                      </td>
                      <td className="p-3 text-center font-mono">{soDon}</td>
                      <td className="p-3 text-right font-mono font-semibold text-emerald-600">{formatVNDShort(dt)}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setShowForm({ mode: "edit", kh: k })} className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-700 hover:bg-sky-500/25">
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button onClick={() => handleDelete(k)} className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-700 hover:bg-red-500/25">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === "card" && (
        <EntityCardGrid cols={3}>
          {filtered.map((k) => {
            const dt = DOANH_THU_KH[k.ten] || 0;
            const soDon = SO_DON_KH[k.ten] || 0;
            return (
              <EntityCard
                key={k.maKH}
                name={k.ten}
                avatarSize="xl"
                rating={k.rating}
                highlight={k.rating >= 4.5}
                badges={k.mst ? [{ label: `MST: ${k.mst}`, bg: "bg-slate-500/15", color: "text-slate-700" }] : []}
                subtitle={<span className="font-mono text-[10px]">{k.maKH}</span>}
                stats={[
                  { label: "SĐT", value: k.sdt, icon: Phone },
                  { label: "Số đơn", value: `${soDon} đơn`, icon: ShoppingCart },
                  { label: "Doanh thu", value: <span className="font-bold text-emerald-700">{formatVNDShort(dt)}</span>, color: "text-emerald-700" },
                  { label: "MST", value: k.mst || "—", icon: FileText },
                ]}
                onEdit={() => setShowForm({ mode: "edit", kh: k })}
                onDelete={() => handleDelete(k)}
                meta={k.diaChi ? <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {k.diaChi}</span> : undefined}
              />
            );
          })}
        </EntityCardGrid>
      )}

      {viewMode === "list" && (
        <EntityCardList>
          {filtered.map((k) => {
            const dt = DOANH_THU_KH[k.ten] || 0;
            const soDon = SO_DON_KH[k.ten] || 0;
            return (
              <div key={k.maKH} className="card p-3 flex items-center gap-3">
                <Avatar name={k.ten} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{k.ten}</div>
                  <div className="text-[10px] opacity-60 flex items-center gap-2">
                    <span className="font-mono">{k.maKH}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {k.sdt}</span>
                    <span>·</span>
                    <span className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {k.rating}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-emerald-600">{formatVNDShort(dt)}</div>
                  <div className="text-[10px] opacity-60">{soDon} đơn hàng</div>
                </div>
                <button onClick={() => setShowForm({ mode: "edit", kh: k })} className="p-1.5 rounded hover:bg-white/40 text-sky-600"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(k)} className="p-1.5 rounded hover:bg-white/40 text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            );
          })}
        </EntityCardList>
      )}

      {showForm && <KHForm mode={showForm.mode} kh={showForm.kh} existingCount={list.length} onClose={() => setShowForm(null)} onSave={handleSave} />}
    </div>
  );
}

function KHForm({ mode, kh, existingCount, onClose, onSave }: { mode: "add" | "edit"; kh?: KH; existingCount: number; onClose: () => void; onSave: (k: KH) => void }) {
  const [form, setForm] = useState<KH>(kh || {
    maKH: `KH-${(existingCount + 1).toString().padStart(3, "0")}`,
    ten: "",
    sdt: "",
    email: "",
    diaChi: "",
    mst: "",
    congNo: 0,
    rating: 4,
    ghiChu: "",
    avatar: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ten || !form.sdt) return toast.error("Vui lòng nhập tên Khách hàng và SĐT");
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div className="w-full sm:w-[96%] sm:max-w-2xl sm:max-w-3xl rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 min-h-[90vh] sm:min-h-0 max-h-[97vh] sm:max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              {mode === "add" ? <Plus className="w-6 h-6" /> : <Edit2 className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {mode === "add" ? "Thêm Khách Hàng Sỉ mới" : `Chỉnh sửa: ${kh?.ten}`}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Nhập thông tin đại lý sỉ, shop quần áo đối tác</p>
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
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-indigo-500/30 shadow-md overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                {form.avatar ? (
                  <img src={form.avatar} alt={form.ten} className="w-full h-full object-cover" />
                ) : (
                  <span>{form.ten ? form.ten.charAt(0).toUpperCase() : "KH"}</span>
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
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Logo / Ảnh Khách Hàng</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Tải biểu trưng shop sỉ hoặc ảnh đại diện chủ shop</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Mã KH *</label>
              <input required className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-indigo-500" value={form.maKH} onChange={(e) => setForm({ ...form, maKH: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Tên Khách Hàng / Shop *</label>
              <input required className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-indigo-500" value={form.ten} onChange={(e) => setForm({ ...form, ten: e.target.value })} placeholder="VD: Shop Mẹ Bé Xinh..." />
            </div>
            {/* P1 - 2026-08-07 - Phan loai KH enum */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Phân loại khách hàng *</label>
              <select className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-indigo-500" value={form.loai || "Cá nhân"} onChange={(e) => setForm({ ...form, loai: e.target.value })}>
                <option value="Đại lý cấp 1">🏆 Đại lý cấp 1 (Mua sỉ SL lớn)</option>
                <option value="Đại lý cấp 2">🥈 Đại lý cấp 2 (Mua sỉ SL vừa)</option>
                <option value="Công ty">🏢 Công ty (Có MST)</option>
                <option value="Shop">🛍️ Shop (Bán lẻ)</option>
                <option value="Cá nhân">👤 Cá nhân</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">SĐT *</label>
              <input required className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-indigo-500" value={form.sdt} onChange={(e) => setForm({ ...form, sdt: e.target.value })} placeholder="0901234567" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Email</label>
              <input type="email" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="khachhang@example.com" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Địa chỉ giao hàng / Cửa hàng</label>
            <input className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500" value={form.diaChi} onChange={(e) => setForm({ ...form, diaChi: e.target.value })} placeholder="Số nhà, phố, quận/huyện, tỉnh/TP..." />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Mã số thuế</label>
              <input className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500" value={form.mst} onChange={(e) => setForm({ ...form, mst: e.target.value })} placeholder="0312456789" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Công nợ đầu kỳ (đ)</label>
              <input type="number" min={0} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-indigo-500" value={form.congNo} onChange={(e) => setForm({ ...form, congNo: Number(e.target.value) })} />
            </div>
            {/* P1 - 2026-08-07 - Han muc no KH */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Hạn mức cho nợ (đ) <span className="text-amber-500">*</span></label>
              <input type="number" min={0} step={1000000} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-indigo-500" value={(form as any).hanMucNo || 0} onChange={(e) => setForm({ ...form, hanMucNo: Number(e.target.value) } as any)} placeholder="VD: 30000000" />
              {((form as any).hanMucNo || 0) > 0 && (form.congNo || 0) > ((form as any).hanMucNo || 0) && (
                <p className="text-[10px] text-rose-600 mt-1 font-semibold">⚠️ Vượt hạn mức {((form as any).hanMucNo || 0).toLocaleString("vi-VN")} ₫</p>
              )}
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Đánh giá (1-5 sao)</label>
              <input type="number" min={1} max={5} step={0.5} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500" value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Ghi chú yêu cầu riêng</label>
            <textarea className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500 min-h-[70px]" value={form.ghiChu} onChange={(e) => setForm({ ...form, ghiChu: e.target.value })} placeholder="Ghi chú sở thích đóng gói, chặng xe giao hàng..." />
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
              className="w-full sm:w-2/3 py-3.5 rounded-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 transition flex items-center justify-center gap-2 text-base"
            >
              {mode === "add" ? <Plus className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
              {mode === "add" ? "Thêm Khách Hàng mới" : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
