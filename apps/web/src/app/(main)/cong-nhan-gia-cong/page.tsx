// Trang quan ly cong nhan / xuong gia cong du phong (27 nguoi)
// Tu file Excel "gia cong du phong.xlsx" 2026-08-04
// Phan biet voi DoiTacGiaCong (20 NCC chinh thuc, on dinh)
// Dung de backup khi 20 NCC chinh thuc het lich / qua tai

"use client";

import { useState, useMemo } from "react";
import {
  Users, Search, Phone, MapPin, FileText,
  CheckCircle2, XCircle, Filter, Hammer, Briefcase,
  Plus, Edit2, Trash2, X, AlertTriangle, Save, MessageCircle,
  Hash, Shirt
} from "lucide-react";
import {
  useCongNhanGiaCong, thongKeCongNhan, chuanHoaLoaiHang, formatSDT,
  LOAI_HANG_LABELS, TRANG_THAI_CNGC_LABELS, TRANG_THAI_CNGC_STYLE,
  type CongNhanGiaCong, type LoaiHang, type TrangThaiCongNhan
} from "@/lib/data/cong-nhan-gia-cong";
import { usePermission } from "@/components/PermissionGuard";
import { useSession } from "@/components/session-provider";
import { toast } from "sonner";

const LOAI_TABS: { key: LoaiHang | "ALL"; label: string; emoji: string; color: string }[] = [
  { key: "ALL", label: "Tất cả", emoji: "📋", color: "bg-slate-500" },
  { key: "cổ tròn", label: "Cổ tròn", emoji: "👕", color: "bg-emerald-500" },
  { key: "cổ trụ", label: "Cổ trụ", emoji: "👔", color: "bg-blue-500" },
  { key: "polo", label: "Polo", emoji: "👗", color: "bg-violet-500" },
  { key: "thun", label: "Thun", emoji: "👚", color: "bg-amber-500" },
  { key: "móc xích", label: "Móc xích", emoji: "🔗", color: "bg-rose-500" },
  { key: "đa dạng", label: "Đa dạng", emoji: "🎨", color: "bg-fuchsia-500" },
];

export default function CongNhanGiaCongPage() {
  const { dsCongNhan, themCongNhan, suaCongNhan, xoaCongNhan, loading } = useCongNhanGiaCong();
  const { user } = useSession();
  const perm = usePermission();
  const [search, setSearch] = useState("");
  const [loaiFilter, setLoaiFilter] = useState<LoaiHang | "ALL">("ALL");
  const [trangThaiFilter, setTrangThaiFilter] = useState<TrangThaiCongNhan | "ALL">("ALL");
  const [selected, setSelected] = useState<CongNhanGiaCong | null>(null);
  const [showForm, setShowForm] = useState<{ mode: "add" | "edit"; cn?: CongNhanGiaCong } | null>(null);

  const stats = useMemo(() => thongKeCongNhan(dsCongNhan), [dsCongNhan]);

  const filtered = useMemo(() => {
    return dsCongNhan.filter((c) => {
      const matchSearch = [c.hoTen, c.sdt, c.diaChi, c.ghiChu, c.id].some(
        (y) => (y || "").toLowerCase().includes(search.toLowerCase())
      );
      const matchLoai = loaiFilter === "ALL" || c.loaiHang === loaiFilter;
      const matchTrangThai = trangThaiFilter === "ALL" || c.trangThai === trangThaiFilter;
      return matchSearch && matchLoai && matchTrangThai;
    });
  }, [dsCongNhan, search, loaiFilter, trangThaiFilter]);

  // Đếm số lượng theo loại
  const countByLoai = useMemo(() => {
    const acc: Record<string, number> = { ALL: dsCongNhan.length };
    for (const c of dsCongNhan) {
      acc[c.loaiHang] = (acc[c.loaiHang] || 0) + 1;
    }
    return acc;
  }, [dsCongNhan]);

  const handleDelete = (cn: CongNhanGiaCong) => {
    if (!user) return toast.error("Vui lòng đăng nhập");
    if (!confirm(`Xoá công nhân gia công "${cn.hoTen}"?`)) return;
    xoaCongNhan(cn.id, user);
    toast.success(`Đã xoá ${cn.hoTen}`);
    setSelected(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 mx-auto border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Đang tải danh sách công nhân gia công...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Hero Header Banner */}
      <div className="relative rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 35%, #0891b2 75%, #06b6d4 100%)" }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #5eead4 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-15" style={{ background: "radial-gradient(circle, #67e8f9 0%, transparent 70%)", transform: "translate(-30%, 30%)" }} />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 text-white drop-shadow">
              <Hammer className="w-7 h-7 text-cyan-300" />
              Công nhân Gia công Dự phòng
            </h1>
            <p className="text-white/80 mt-1 text-sm font-medium">
              {stats.tong} công nhân / xưởng · <b className="text-emerald-300">{stats.sanSang} sẵn sàng</b> · {stats.tamNgung} tạm ngưng · {stats.hetViec} hết việc
            </p>
          </div>
          <button
            onClick={() => setShowForm({ mode: "add" })}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm transition shadow-lg"
          >
            <Plus className="w-4 h-4" /> Thêm công nhân
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="card p-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200">
        <div className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-200">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <b>Khác với Đối tác Gia công chính thức (20 NCC):</b> Danh sách này là các xưởng nhỏ, thợ rảnh, có thể nhận thầu phụ khi 20 NCC chính thức hết lịch hoặc quá tải. Dùng để tra cứu nhanh SĐT + chuyên môn + số thợ.
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card p-4">
          <div className="text-xs opacity-70 flex items-center gap-1"><Users className="w-3 h-3" /> Tổng</div>
          <div className="text-2xl font-bold mt-1">{stats.tong}</div>
        </div>
        <div className="card p-4 border-emerald-200">
          <div className="text-xs opacity-70 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-600" /> Sẵn sàng</div>
          <div className="text-2xl font-bold mt-1 text-emerald-600">{stats.sanSang}</div>
        </div>
        <div className="card p-4 border-amber-200">
          <div className="text-xs opacity-70 flex items-center gap-1"><Briefcase className="w-3 h-3 text-amber-600" /> Tổng thợ</div>
          <div className="text-2xl font-bold mt-1 text-amber-600">{stats.tongTho}</div>
        </div>
        <div className="card p-4 border-cyan-200">
          <div className="text-xs opacity-70 flex items-center gap-1"><Hammer className="w-3 h-3 text-cyan-600" /> Loại hàng</div>
          <div className="text-2xl font-bold mt-1 text-cyan-600">{Object.keys(stats.theoLoai).length}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-2 flex-1">
            {LOAI_TABS.map((tab) => {
              const count = countByLoai[tab.key] || 0;
              return (
                <button
                  key={tab.key}
                  onClick={() => setLoaiFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${
                    loaiFilter === tab.key ? "bg-brand-500 text-white" : "bg-white/40 dark:bg-white/5 hover:bg-white/60"
                  }`}
                >
                  <span>{tab.emoji}</span> {tab.label} ({count})
                </button>
              );
            })}
          </div>
          <select
            value={trangThaiFilter}
            onChange={(e) => setTrangThaiFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-lg text-xs border border-slate-200 bg-white"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="san_sang">✅ Sẵn sàng</option>
            <option value="tam_ngung">⏸️ Tạm ngưng</option>
            <option value="het_viec">🚫 Hết việc</option>
          </select>
        </div>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
          <input
            className="input pl-9"
            placeholder="Tìm tên, SĐT, địa chỉ, ghi chú..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table view */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b bg-slate-50" style={{ borderColor: "var(--border)" }}>
                <th className="p-3 font-semibold">Mã</th>
                <th className="p-3 font-semibold">Họ tên / Xưởng</th>
                <th className="p-3 font-semibold">Loại hàng</th>
                <th className="p-3 font-semibold text-center">Số thợ</th>
                <th className="p-3 font-semibold">SĐT</th>
                <th className="p-3 font-semibold">Địa chỉ</th>
                <th className="p-3 font-semibold text-center">Trạng thái</th>
                <th className="p-3 font-semibold text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-slate-500 text-sm">Không tìm thấy công nhân nào</td></tr>
              ) : filtered.map((c) => {
                const ttStyle = TRANG_THAI_CNGC_STYLE[c.trangThai];
                return (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-slate-50/50" style={{ borderColor: "var(--border)" }}>
                    <td className="p-3 font-mono text-xs">
                      <div className="font-semibold text-cyan-600">{c.id}</div>
                      <div className="text-[10px] text-slate-400">STT {c.stt}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{c.hoTen}</div>
                      {c.ghiChu && (
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <FileText className="w-3 h-3" /> <span className="line-clamp-1">{c.ghiChu}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-xs">
                      <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-700">
                        {LOAI_HANG_LABELS[c.loaiHang]}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full font-bold text-amber-700 bg-amber-100 text-sm">
                        {c.soTho}
                      </span>
                    </td>
                    <td className="p-3 text-xs">
                      <div className="flex items-center gap-1">
                        <a href={`tel:${c.sdt}`} className="flex items-center gap-1 text-brand-600 hover:underline">
                          <Phone className="w-3 h-3" /> {c.sdt}
                        </a>
                        <a
                          href={`https://zalo.me/${c.sdt.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-1 p-1 rounded text-blue-600 hover:bg-blue-50"
                          title="Nhắn Zalo"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                    <td className="p-3 text-xs max-w-xs">
                      {c.diaChi ? (
                        <div className="flex items-start gap-1 text-slate-700">
                          <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{c.diaChi}</span>
                        </div>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${ttStyle.bg} ${ttStyle.color}`}>
                        {ttStyle.emoji} {TRANG_THAI_CNGC_LABELS[c.trangThai]}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setSelected(c)}
                        className="text-xs px-2.5 py-1 rounded bg-brand-500 text-white hover:bg-brand-600"
                      >
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <CongNhanDetail
          cn={selected}
          onClose={() => setSelected(null)}
          onEdit={() => {
            setShowForm({ mode: "edit", cn: selected });
            setSelected(null);
          }}
          onDelete={() => handleDelete(selected)}
        />
      )}

      {/* Form Modal */}
      {showForm && (
        <CongNhanFormModal
          mode={showForm.mode}
          cn={showForm.cn}
          onClose={() => setShowForm(null)}
          onSave={(newCn) => {
            if (!user) return toast.error("Vui lòng đăng nhập");
            if (!newCn.hoTen?.trim()) return toast.error("Vui lòng nhập họ tên");
            if (!newCn.sdt?.trim()) return toast.error("Vui lòng nhập SĐT");
            try {
              const cn: CongNhanGiaCong = {
                id: newCn.id || `CNGC-${Date.now().toString().slice(-6)}`,
                stt: newCn.stt || dsCongNhan.length + 1,
                hoTen: newCn.hoTen,
                sdt: formatSDT(newCn.sdt),
                loaiHang: chuanHoaLoaiHang(newCn.loaiHang || "đa dạng"),
                soTho: newCn.soTho || 0,
                diaChi: newCn.diaChi || "",
                ghiChu: newCn.ghiChu || "",
                trangThai: newCn.trangThai || "san_sang",
                nguoiTao: user.name,
                ngayTao: new Date().toISOString(),
              };
              if (showForm.mode === "add") {
                themCongNhan(cn, user);
                toast.success(`Đã thêm ${cn.hoTen}`);
              } else {
                suaCongNhan(cn.id, cn, user);
                toast.success("Cập nhật thành công");
              }
              setShowForm(null);
            } catch (err: any) {
              toast.error("Lỗi: " + err.message);
            }
          }}
        />
      )}
    </div>
  );
}

// ============ DETAIL MODAL ============
function CongNhanDetail({ cn, onClose, onEdit, onDelete }: { cn: CongNhanGiaCong; onClose: () => void; onEdit: () => void; onDelete: () => void }) {
  const ttStyle = TRANG_THAI_CNGC_STYLE[cn.trangThai];
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div className="w-full sm:w-[96%] sm:max-w-xl rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 min-h-[60vh] sm:min-h-0 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-white text-xl font-bold shadow-md">
              {cn.hoTen ? cn.hoTen.charAt(0).toUpperCase() : "?"}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">{cn.hoTen}</h3>
              <p className="text-xs text-slate-500 font-mono">{cn.id} · STT {cn.stt}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Trạng thái */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${ttStyle.bg} ${ttStyle.color}`}>
            {ttStyle.emoji} {TRANG_THAI_CNGC_LABELS[cn.trangThai]}
          </span>
          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-cyan-100 text-cyan-700">
            {LOAI_HANG_LABELS[cn.loaiHang]}
          </span>
          <span className="px-3 py-1 rounded-full text-sm font-bold bg-amber-100 text-amber-700">
            👷 {cn.soTho} thợ
          </span>
        </div>

        {/* Thông tin liên hệ */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-slate-400" />
            <a href={`tel:${cn.sdt}`} className="text-brand-600 font-mono font-semibold hover:underline">{cn.sdt}</a>
            <a
              href={`https://zalo.me/${cn.sdt.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold text-white bg-blue-500 hover:bg-blue-600"
            >
              <MessageCircle className="w-3 h-3" /> Zalo
            </a>
          </div>
          {cn.diaChi && (
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <span className="text-slate-700 dark:text-slate-300">{cn.diaChi}</span>
            </div>
          )}
          {cn.ghiChu && (
            <div className="flex items-start gap-2 text-sm">
              <FileText className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <span className="text-slate-700 dark:text-slate-300">{cn.ghiChu}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 text-white font-semibold text-sm hover:bg-brand-600"
          >
            <Edit2 className="w-4 h-4" /> Sửa
          </button>
          <button
            onClick={onDelete}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500 text-white font-semibold text-sm hover:bg-rose-600"
          >
            <Trash2 className="w-4 h-4" /> Xoá
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ FORM MODAL ============
function CongNhanFormModal({ mode, cn, onClose, onSave }: { mode: "add" | "edit"; cn?: CongNhanGiaCong; onClose: () => void; onSave: (c: Partial<CongNhanGiaCong>) => void }) {
  const [form, setForm] = useState<Partial<CongNhanGiaCong>>(cn || {
    stt: 0,
    hoTen: "",
    sdt: "",
    loaiHang: "cổ tròn",
    soTho: 1,
    diaChi: "",
    ghiChu: "",
    trangThai: "san_sang",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.hoTen?.trim()) return toast.error("Vui lòng nhập họ tên");
    if (!form.sdt?.trim()) return toast.error("Vui lòng nhập SĐT");
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div className="w-full sm:w-[96%] sm:max-w-xl rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 min-h-[70vh] sm:min-h-0 max-h-[95vh] sm:max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center font-bold">
              {mode === "add" ? <Plus className="w-6 h-6" /> : <Edit2 className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {mode === "add" ? "Thêm Công nhân Gia công" : `Sửa: ${cn?.hoTen}`}
              </h3>
              <p className="text-xs text-slate-500">Xưởng nhỏ, thợ rảnh, có thể thầu phụ</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Họ tên / Tên xưởng *</label>
            <input
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold focus:ring-2 focus:ring-cyan-500"
              value={form.hoTen || ""}
              onChange={(e) => setForm({ ...form, hoTen: e.target.value })}
              placeholder="VD: Trần Liên, Xưởng may Nam Việt..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">SĐT *</label>
              <input
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono font-semibold focus:ring-2 focus:ring-cyan-500"
                value={form.sdt || ""}
                onChange={(e) => setForm({ ...form, sdt: e.target.value })}
                placeholder="VD: 0901234567"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Số thợ</label>
              <input
                type="number"
                min={0}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold focus:ring-2 focus:ring-cyan-500"
                value={form.soTho || 0}
                onChange={(e) => setForm({ ...form, soTho: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Loại hàng *</label>
              <select
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold focus:ring-2 focus:ring-cyan-500"
                value={form.loaiHang || "cổ tròn"}
                onChange={(e) => setForm({ ...form, loaiHang: e.target.value as LoaiHang })}
              >
                <option value="cổ tròn">👕 Cổ tròn</option>
                <option value="cổ trụ">👔 Cổ trụ</option>
                <option value="polo">👗 Polo</option>
                <option value="thun">👚 Thun</option>
                <option value="sơ mi">👔 Sơ mi</option>
                <option value="áo khoác">🧥 Áo khoác</option>
                <option value="móc xích">🔗 Móc xích</option>
                <option value="váy">👗 Váy</option>
                <option value="đa dạng">🎨 Đa dạng</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Trạng thái *</label>
              <select
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold focus:ring-2 focus:ring-cyan-500"
                value={form.trangThai || "san_sang"}
                onChange={(e) => setForm({ ...form, trangThai: e.target.value as TrangThaiCongNhan })}
              >
                <option value="san_sang">✅ Sẵn sàng</option>
                <option value="tam_ngung">⏸️ Tạm ngưng</option>
                <option value="het_viec">🚫 Hết việc</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Địa chỉ</label>
            <input
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-cyan-500"
              value={form.diaChi || ""}
              onChange={(e) => setForm({ ...form, diaChi: e.target.value })}
              placeholder="VD: Quận 12, Bình Chánh..."
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Ghi chú</label>
            <textarea
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-cyan-500"
              value={form.ghiChu || ""}
              onChange={(e) => setForm({ ...form, ghiChu: e.target.value })}
              placeholder="VD: Xưởng lớn, gần TP.HCM, chuyên polo..."
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-300"
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 text-white font-semibold text-sm hover:bg-cyan-600"
            >
              <Save className="w-4 h-4" /> Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
