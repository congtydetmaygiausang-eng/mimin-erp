"use client";

import { useState, useEffect } from "react";
import {
  Calendar, Plus, CheckCircle2, TrendingUp, Target,
  AlertCircle, Edit2, Trash2, X, Layers, Save, Filter
} from "lucide-react";
import { toast } from "sonner";
import { Portal } from "@/components/ui/Portal";

// ============ TYPES ============
type TrangThaiKHSX = "LÃªn káº¿ hoáº¡ch" | "Äang SX" | "HoÃ n thÃ nh" | "Trá»… háº¡n";

interface KHSX {
  id: string;
  maKHSX: string;
  tuan: string;
  tuNgay: string;
  denNgay: string;
  sanPham: string;
  loai: "Ão" | "Bá»™" | "Quáº§n" | "Phá»¥ kiá»‡n";
  soLuong: number;
  daHoanThanh: number;
  xuongPhuTrach: string;
  trangThai: TrangThaiKHSX;
  ghiChu?: string;
}

const LS_KEY = "mimin_ke_hoach_sx";

const TRANG_THAI_STYLE: Record<TrangThaiKHSX, { color: string; bg: string; dot: string }> = {
  "LÃªn káº¿ hoáº¡ch": { color: "text-slate-700 dark:text-slate-300", bg: "bg-slate-100 dark:bg-slate-700/50", dot: "bg-slate-400" },
  "Äang SX":      { color: "text-amber-700 dark:text-amber-400",  bg: "bg-amber-100 dark:bg-amber-500/20",  dot: "bg-amber-500" },
  "HoÃ n thÃ nh":   { color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/20", dot: "bg-emerald-500" },
  "Trá»… háº¡n":      { color: "text-red-700 dark:text-red-400",      bg: "bg-red-100 dark:bg-red-500/20",      dot: "bg-red-500" },
};

const XUONG_LIST = [
  "XÆ°á»Ÿng May 1 â€“ Polomimin", "XÆ°á»Ÿng May 2 â€“ Polomimin",
  "Gia cÃ´ng ngoÃ i â€“ Cty A", "Gia cÃ´ng ngoÃ i â€“ Cty B",
  "Tá»• hoÃ n thiá»‡n", "Tá»• cáº¯t",
];

const FORM_EMPTY = {
  tuan: "", tuNgay: "", denNgay: "", sanPham: "",
  loai: "Ão" as KHSX["loai"], soLuong: 0, daHoanThanh: 0,
  xuongPhuTrach: XUONG_LIST[0], trangThai: "LÃªn káº¿ hoáº¡ch" as TrangThaiKHSX, ghiChu: "",
};

function autoTrangThai(k: KHSX): TrangThaiKHSX {
  if (k.daHoanThanh >= k.soLuong && k.soLuong > 0) return "HoÃ n thÃ nh";
  if (k.trangThai !== "HoÃ n thÃ nh" && k.denNgay && new Date(k.denNgay) < new Date()) return "Trá»… háº¡n";
  return k.trangThai;
}

export default function KeHoachSXPage() {
  const [list, setList] = useState<KHSX[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<KHSX | null>(null);
  const [form, setForm] = useState(FORM_EMPTY);
  const [filterTT, setFilterTT] = useState<TrangThaiKHSX | "Táº¥t cáº£">("Táº¥t cáº£");
  const [progressEdit, setProgressEdit] = useState<{ id: string; val: number } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      const loaded: KHSX[] = raw ? JSON.parse(raw) : [];
      setList(loaded.map(k => ({ ...k, trangThai: autoTrangThai(k) })));
    } catch { setList([]); }
  }, []);

  const commit = (next: KHSX[]) => {
    const updated = next.map(k => ({ ...k, trangThai: autoTrangThai(k) }));
    setList(updated);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
  };

  const tongSL = list.reduce((s, k) => s + k.soLuong, 0);
  const tongXong = list.reduce((s, k) => s + k.daHoanThanh, 0);
  const tienDoChung = tongSL > 0 ? (tongXong / tongSL) * 100 : 0;
  const dsTreHan = list.filter(k => k.trangThai === "Trá»… háº¡n");
  const dsDangSX = list.filter(k => k.trangThai === "Äang SX");
  const filtered = filterTT === "Táº¥t cáº£" ? list : list.filter(k => k.trangThai === filterTT);

  const handleSubmit = () => {
    if (!form.sanPham.trim()) { toast.error("Vui lÃ²ng nháº­p tÃªn sáº£n pháº©m"); return; }
    if (!form.tuNgay || !form.denNgay) { toast.error("Vui lÃ²ng chá»n ngÃ y SX"); return; }
    if (form.soLuong <= 0) { toast.error("Sá»‘ lÆ°á»£ng pháº£i > 0"); return; }
    if (editItem) {
      commit(list.map(k => k.id === editItem.id ? { ...editItem, ...form } : k));
      toast.success(`âœ… ÄÃ£ cáº­p nháº­t: ${form.sanPham}`);
    } else {
      const n = list.length + 1;
      const newItem: KHSX = {
        id: `KHSX-${Date.now()}`,
        maKHSX: `KH-${String(n).padStart(3, "0")}`,
        ...form,
      };
      commit([...list, newItem]);
      toast.success(`âœ… ÄÃ£ táº¡o ${newItem.maKHSX}: ${form.sanPham} â€” ${form.soLuong.toLocaleString()} SP`);
    }
    setShowForm(false); setEditItem(null); setForm(FORM_EMPTY);
  };

  const handleEdit = (k: KHSX) => {
    setEditItem(k);
    setForm({ tuan: k.tuan, tuNgay: k.tuNgay, denNgay: k.denNgay, sanPham: k.sanPham, loai: k.loai, soLuong: k.soLuong, daHoanThanh: k.daHoanThanh, xuongPhuTrach: k.xuongPhuTrach, trangThai: k.trangThai, ghiChu: k.ghiChu || "" });
    setShowForm(true);
  };

  const handleDelete = (k: KHSX) => {
    if (!confirm(`XoÃ¡ káº¿ hoáº¡ch "${k.sanPham}"?`)) return;
    commit(list.filter(x => x.id !== k.id));
    toast.success("ÄÃ£ xoÃ¡ káº¿ hoáº¡ch");
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="rounded-2xl overflow-hidden shadow-xl" style={{ background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 35%, #0891b2 75%, #06b6d4 100%)" }}>
        <div className="p-5 md:p-7 text-white flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-medium opacity-90 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> MIMIN ERP Â· Sáº£n xuáº¥t & Káº¿ hoáº¡ch
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold flex items-center gap-2.5">
              <Calendar className="w-7 h-7" /> Káº¿ hoáº¡ch sáº£n xuáº¥t
            </h1>
            <p className="text-sm opacity-95 mt-1.5">
              {list.length} KH Â· Tá»•ng SL <b>{tongSL.toLocaleString()}</b> Â· HoÃ n thÃ nh <b>{tongXong.toLocaleString()}</b> Â· Tiáº¿n Ä‘á»™ <b>{tienDoChung.toFixed(1)}%</b>
            </p>
            <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden w-80 max-w-full">
              <div className="h-full bg-white/80 rounded-full transition-all" style={{ width: `${tienDoChung}%` }} />
            </div>
          </div>
          <button onClick={() => { setEditItem(null); setForm(FORM_EMPTY); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm transition">
            <Plus className="w-4 h-4" /> Táº¡o KHSX
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Tá»•ng KH", val: list.length, icon: <Target className="w-3 h-3" />, sub: "káº¿ hoáº¡ch", color: "" },
          { label: "Äang SX", val: dsDangSX.length, icon: <Layers className="w-3 h-3" />, sub: "Ä‘ang cháº¡y", color: "text-amber-600" },
          { label: "HoÃ n thÃ nh", val: list.filter(k => k.trangThai === "HoÃ n thÃ nh").length, icon: <CheckCircle2 className="w-3 h-3 text-emerald-600" />, sub: "xong", color: "text-emerald-600" },
          { label: "Trá»… háº¡n", val: dsTreHan.length, icon: <AlertCircle className="w-3 h-3 text-red-600" />, sub: "cáº§n xá»­ lÃ½", color: dsTreHan.length > 0 ? "text-red-600" : "text-emerald-600" },
        ].map(({ label, val, icon, sub, color }) => (
          <div key={label} className={`card p-5 ${label === "Trá»… háº¡n" && dsTreHan.length > 0 ? "bg-red-500/10 border-red-500/40" : ""}`}>
            <div className="text-xs opacity-70 flex items-center gap-1">{icon} {label}</div>
            <div className={`text-2xl md:text-3xl font-bold mt-1 ${color}`}>{val}</div>
            <div className="text-xs opacity-60 mt-1">{sub}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="card p-3 flex flex-wrap gap-2 items-center">
        <Filter className="w-4 h-4 text-slate-400" />
        {(["Táº¥t cáº£", "LÃªn káº¿ hoáº¡ch", "Äang SX", "HoÃ n thÃ nh", "Trá»… háº¡n"] as const).map(tt => (
          <button key={tt} onClick={() => setFilterTT(tt)} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filterTT === tt ? "bg-teal-600 text-white shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"}`}>
            {tt} {tt !== "Táº¥t cáº£" && `(${list.filter(k => k.trangThai === tt).length})`}
          </button>
        ))}
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <div className="font-bold">ChÆ°a cÃ³ Káº¿ hoáº¡ch sáº£n xuáº¥t nÃ o</div>
          <div className="text-sm mt-1">Báº¥m "Táº¡o KHSX" Ä‘á»ƒ báº¯t Ä‘áº§u lÃªn lá»‹ch</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((k) => {
            const tienDo = k.soLuong > 0 ? Math.min((k.daHoanThanh / k.soLuong) * 100, 100) : 0;
            const s = TRANG_THAI_STYLE[k.trangThai];
            return (
              <div key={k.id} className="card p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold text-teal-600 mb-1">{k.maKHSX} Â· {k.tuan || "â€”"}</div>
                    <h3 className="text-lg font-black leading-tight text-slate-800 dark:text-slate-100 truncate" title={k.sanPham}>{k.sanPham}</h3>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${s.bg} ${s.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{k.trangThai}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${k.loai === "Bá»™" ? "bg-violet-100 text-violet-700" : k.loai === "Quáº§n" ? "bg-amber-100 text-amber-700" : "bg-sky-100 text-sky-700"}`}>{k.loai}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-500 mb-3 flex gap-1.5 items-center">
                  <span>ðŸ“</span><span className="font-medium truncate">{k.xuongPhuTrach}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mb-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  <div>
                    <div className="text-[11px] font-medium text-slate-400 mb-0.5">Lá»‹ch SX</div>
                    <div className="font-bold text-slate-700 dark:text-slate-300">{k.tuNgay.slice(5)} â†’ {k.denNgay.slice(5)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] font-medium text-slate-400 mb-0.5">Xong / Tá»•ng</div>
                    <div className="font-bold"><span className="text-emerald-600">{k.daHoanThanh.toLocaleString()}</span> / {k.soLuong.toLocaleString()}</div>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-bold text-slate-500">Tiáº¿n Ä‘á»™</span>
                    <span className={`font-black ${tienDo >= 100 ? "text-emerald-600" : "text-teal-600"}`}>{tienDo.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full transition-all rounded-full ${tienDo >= 100 ? "bg-emerald-500" : tienDo > 50 ? "bg-amber-500" : "bg-teal-500"}`} style={{ width: `${tienDo}%` }} />
                  </div>
                </div>

                {progressEdit?.id === k.id && (
                  <div className="flex gap-2 mb-3">
                    <input type="number" min={0} max={k.soLuong} className="input flex-1 text-sm" value={progressEdit.val} onChange={e => setProgressEdit({ id: k.id, val: Number(e.target.value) })} placeholder={`Tá»‘i Ä‘a ${k.soLuong}`} />
                    <button onClick={() => { commit(list.map(x => x.id === k.id ? { ...x, daHoanThanh: Math.min(progressEdit.val, k.soLuong) } : x)); setProgressEdit(null); toast.success("ÄÃ£ cáº­p nháº­t tiáº¿n Ä‘á»™"); }} className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs px-3 rounded-lg font-bold"><Save className="w-3 h-3" /></button>
                    <button onClick={() => setProgressEdit(null)} className="bg-slate-200 text-slate-700 text-xs px-2 rounded-lg font-bold"><X className="w-3 h-3" /></button>
                  </div>
                )}

                {k.ghiChu && <div className="mb-3 text-xs bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 p-2 rounded-lg border border-amber-200 dark:border-amber-500/20 font-medium">ðŸ’¬ {k.ghiChu}</div>}

                <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button onClick={() => setProgressEdit({ id: k.id, val: k.daHoanThanh })} className="flex-1 text-xs py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg font-bold hover:bg-emerald-100 transition flex items-center justify-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Tiáº¿n Ä‘á»™
                  </button>
                  <button onClick={() => handleEdit(k)} className="flex-1 text-xs py-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-lg font-bold hover:bg-amber-100 transition flex items-center justify-center gap-1">
                    <Edit2 className="w-3 h-3" /> Sá»­a
                  </button>
                  <button onClick={() => handleDelete(k)} className="px-3 text-xs py-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 rounded-lg font-bold hover:bg-rose-100 transition">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => { setShowForm(false); setEditItem(null); }}>
            <div className="card max-w-2xl w-full p-6 animate-slide-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-teal-600" />
                  {editItem ? `Sá»­a: ${editItem.maKHSX}` : "Táº¡o Káº¿ hoáº¡ch SX má»›i"}
                </h3>
                <button onClick={() => { setShowForm(false); setEditItem(null); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><X className="w-5 h-5 text-slate-500" /></button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">TÃªn sáº£n pháº©m *</label>
                    <input type="text" className="input-field" placeholder="VD: Ão thun cotton tráº¯ng" value={form.sanPham} onChange={e => setForm(f => ({ ...f, sanPham: e.target.value }))} autoFocus />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Tuáº§n sáº£n xuáº¥t</label>
                    <input type="text" className="input-field" placeholder="VD: Tuáº§n 34/2026" value={form.tuan} onChange={e => setForm(f => ({ ...f, tuan: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">Tá»« ngÃ y *</label>
                    <input type="date" className="input-field" value={form.tuNgay} onChange={e => setForm(f => ({ ...f, tuNgay: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Äáº¿n ngÃ y *</label>
                    <input type="date" className="input-field" value={form.denNgay} onChange={e => setForm(f => ({ ...f, denNgay: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">Loáº¡i SP</label>
                    <select className="input-field" value={form.loai} onChange={e => setForm(f => ({ ...f, loai: e.target.value as KHSX["loai"] }))}>
                      {["Ão", "Bá»™", "Quáº§n", "Phá»¥ kiá»‡n"].map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Sá»‘ lÆ°á»£ng *</label>
                    <input type="number" min={1} className="input-field" value={form.soLuong || ""} onChange={e => setForm(f => ({ ...f, soLuong: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">ÄÃ£ hoÃ n thÃ nh</label>
                    <input type="number" min={0} className="input-field" value={form.daHoanThanh || ""} onChange={e => setForm(f => ({ ...f, daHoanThanh: Number(e.target.value) }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">XÆ°á»Ÿng phá»¥ trÃ¡ch</label>
                    <select className="input-field" value={form.xuongPhuTrach} onChange={e => setForm(f => ({ ...f, xuongPhuTrach: e.target.value }))}>
                      {XUONG_LIST.map(x => <option key={x}>{x}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Tráº¡ng thÃ¡i</label>
                    <select className="input-field" value={form.trangThai} onChange={e => setForm(f => ({ ...f, trangThai: e.target.value as TrangThaiKHSX }))}>
                      {(["LÃªn káº¿ hoáº¡ch", "Äang SX", "HoÃ n thÃ nh", "Trá»… háº¡n"] as const).map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Ghi chÃº</label>
                  <textarea className="input-field" rows={2} placeholder="Ghi chÃº thÃªm..." value={form.ghiChu} onChange={e => setForm(f => ({ ...f, ghiChu: e.target.value }))} />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setShowForm(false); setEditItem(null); }} className="btn-secondary flex-1">Huỷ</button>
                  <button type="button" onClick={handleSubmit} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    <Save className="w-4 h-4" /> {editItem ? "Lưu thay đổi" : "Tạo kế hoạch"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
