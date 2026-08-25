"use client";

import { useState, useEffect } from "react";
import {
  Calendar, Plus, CheckCircle2, TrendingUp, Target,
  AlertCircle, Edit2, Trash2, X, Layers, Save, Filter, Scissors
} from "lucide-react";
import { toast } from "sonner";
import { Portal } from "@/components/ui/Portal";
import { CrudModal } from "@/components/ui/CrudModal";

// ============ TYPES ============
type TrangThaiKHSX = "Lên kế hoạch" | "Đang SX" | "Hoàn thành" | "Trễ hạn";

interface KHSX {
  id: string;
  maKHSX: string;
  tuan: string;
  tuNgay: string;
  denNgay: string;
  sanPham: string;
  loai: "Áo" | "Bộ" | "Quần" | "Phụ kiện";
  soLuong: number;
  daHoanThanh: number;
  xuongPhuTrach: string;
  trangThai: TrangThaiKHSX;
  ghiChu?: string;
}

const LS_KEY = "mimin_ke_hoach_sx";

const TRANG_THAI_STYLE: Record<TrangThaiKHSX, { color: string; bg: string; dot: string }> = {
  "Lên kế hoạch": { color: "text-slate-700 dark:text-slate-300", bg: "bg-slate-100 dark:bg-slate-700/50", dot: "bg-slate-400" },
  "Đang SX":      { color: "text-amber-700 dark:text-amber-400",  bg: "bg-amber-100 dark:bg-amber-500/20",  dot: "bg-amber-500" },
  "Hoàn thành":   { color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/20", dot: "bg-emerald-500" },
  "Trễ hạn":      { color: "text-red-700 dark:text-red-400",      bg: "bg-red-100 dark:bg-red-500/20",      dot: "bg-red-500" },
};

const XUONG_LIST = [
  "Xưởng May 1 - Polomimin", "Xưởng May 2 - Polomimin",
  "Gia công ngoài - Cty A", "Gia công ngoài - Cty B",
  "Tổ hoàn thiện", "Tổ cắt",
];

const FORM_EMPTY = {
  tuan: "", tuNgay: "", denNgay: "", sanPham: "",
  loai: "Áo" as KHSX["loai"], soLuong: 0, daHoanThanh: 0,
  xuongPhuTrach: XUONG_LIST[0], trangThai: "Lên kế hoạch" as TrangThaiKHSX, ghiChu: "",
};

function autoTrangThai(k: KHSX): TrangThaiKHSX {
  if (k.daHoanThanh >= k.soLuong && k.soLuong > 0) return "Hoàn thành";
  if (k.trangThai !== "Hoàn thành" && k.denNgay && new Date(k.denNgay) < new Date()) return "Trễ hạn";
  return k.trangThai;
}

export default function KeHoachSXPage() {
  const [list, setList] = useState<KHSX[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<KHSX | null>(null);
  const [filterTT, setFilterTT] = useState<TrangThaiKHSX | "Tất cả">("Tất cả");
  const [progressEdit, setProgressEdit] = useState<{ id: string; val: number } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      const loaded: KHSX[] = raw ? JSON.parse(raw) : [];
      setList(loaded.map(k => ({ ...k, trangThai: autoTrangThai(k) })));
    } catch { setList([]); }
    
    // Auto fill form from Product Library transfer
    const transfer = sessionStorage.getItem("mimin_transfer_khsx");
    if (transfer) {
      try {
        const data = JSON.parse(transfer);
        const loaiMap: any = { AoTru: "Áo", AoCoTron: "Áo", AoPolo: "Áo", BoTru: "Bộ", BoCoTron: "Bộ", Quan: "Quần", QuanKaki: "Quần", PhuKien: "Phụ kiện" };
        const mappedLoai = loaiMap[data.loaiSP] || "Áo";
        setEditItem({
          id: "",
          maKHSX: `KH-${String(Date.now()).slice(-4)}`,
          tuan: "",
          tuNgay: new Date().toISOString().split("T")[0],
          denNgay: new Date().toISOString().split("T")[0],
          sanPham: data.tenSP || "",
          loai: mappedLoai,
          soLuong: 0,
          daHoanThanh: 0,
          xuongPhuTrach: XUONG_LIST[0],
          trangThai: "Lên kế hoạch",
          ghiChu: data.giaBan ? `Giá bán dự kiến: ${data.giaBan}` : ""
        });
        setShowForm(true);
      } catch (e) {}
      sessionStorage.removeItem("mimin_transfer_khsx");
    }
  }, []);

  const commit = (next: KHSX[]) => {
    const updated = next.map(k => ({ ...k, trangThai: autoTrangThai(k) }));
    setList(updated);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
  };

  const tongSL = list.reduce((s, k) => s + k.soLuong, 0);
  const tongXong = list.reduce((s, k) => s + k.daHoanThanh, 0);
  const tienDoChung = tongSL > 0 ? (tongXong / tongSL) * 100 : 0;
  const dsTreHan = list.filter(k => k.trangThai === "Trễ hạn");
  const dsDangSX = list.filter(k => k.trangThai === "Đang SX");
  const filtered = filterTT === "Tất cả" ? list : list.filter(k => k.trangThai === filterTT);

  const handleEdit = (k: KHSX) => {
    setEditItem(k);
    setShowForm(true);
  };

  const handleDelete = (k: KHSX) => {
    if (!confirm(`Xoá kế hoạch "${k.sanPham}"?`)) return;
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
          <button onClick={() => { setEditItem(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm transition">
            <Plus className="w-4 h-4" /> Tạo KHSX
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Tổng KH", val: list.length, icon: <Target className="w-3 h-3" />, sub: "kế hoạch", color: "" },
          { label: "Đang SX", val: dsDangSX.length, icon: <Layers className="w-3 h-3" />, sub: "đang chạy", color: "text-amber-600" },
          { label: "Hoàn thành", val: list.filter(k => k.trangThai === "Hoàn thành").length, icon: <CheckCircle2 className="w-3 h-3 text-emerald-600" />, sub: "xong", color: "text-emerald-600" },
          { label: "Trễ hạn", val: dsTreHan.length, icon: <AlertCircle className="w-3 h-3 text-red-600" />, sub: "cần xử lý", color: dsTreHan.length > 0 ? "text-red-600" : "text-emerald-600" },
        ].map(({ label, val, icon, sub, color }) => (
          <div key={label} className={`card p-5 ${label === "Trễ hạn" && dsTreHan.length > 0 ? "bg-red-500/10 border-red-500/40" : ""}`}>
            <div className="text-xs opacity-70 flex items-center gap-1">{icon} {label}</div>
            <div className={`text-2xl md:text-3xl font-bold mt-1 ${color}`}>{val}</div>
            <div className="text-xs opacity-60 mt-1">{sub}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="card p-3 flex flex-wrap gap-2 items-center">
        <Filter className="w-4 h-4 text-slate-400" />
        {(["Tất cả", "Lên kế hoạch", "Đang SX", "Hoàn thành", "Trễ hạn"] as const).map(tt => (
          <button key={tt} onClick={() => setFilterTT(tt)} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filterTT === tt ? "bg-teal-600 text-white shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"}`}>
            {tt} {tt !== "Tất cả" && `(${list.filter(k => k.trangThai === tt).length})`}
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
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${k.loai === "Bộ" ? "bg-violet-100 text-violet-700" : k.loai === "Quần" ? "bg-amber-100 text-amber-700" : "bg-sky-100 text-sky-700"}`}>{k.loai}</span>
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
                    <span className="font-bold text-slate-500">Tiến độ</span>
                    <span className={`font-black ${tienDo >= 100 ? "text-emerald-600" : "text-teal-600"}`}>{tienDo.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full transition-all rounded-full ${tienDo >= 100 ? "bg-emerald-500" : tienDo > 50 ? "bg-amber-500" : "bg-teal-500"}`} style={{ width: `${tienDo}%` }} />
                  </div>
                </div>

                {progressEdit?.id === k.id && (
                  <div className="flex gap-2 mb-3">
                    <input type="number" min={0} max={k.soLuong} className="input flex-1 text-sm" value={progressEdit.val} onChange={e => setProgressEdit({ id: k.id, val: Number(e.target.value) })} placeholder={`Tối đa ${k.soLuong}`} />
                    <button onClick={() => { commit(list.map(x => x.id === k.id ? { ...x, daHoanThanh: Math.min(progressEdit.val, k.soLuong) } : x)); setProgressEdit(null); toast.success("Đã cập nhật tiến độ"); }} className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs px-3 rounded-lg font-bold"><Save className="w-3 h-3" /></button>
                    <button onClick={() => setProgressEdit(null)} className="bg-slate-200 text-slate-700 text-xs px-2 rounded-lg font-bold"><X className="w-3 h-3" /></button>
                  </div>
                )}

                {k.ghiChu && <div className="mb-3 text-xs bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 p-2 rounded-lg border border-amber-200 dark:border-amber-500/20 font-medium">💬 {k.ghiChu}</div>}

                <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex-wrap">
                  <button onClick={() => {
                    sessionStorage.setItem("mimin_transfer_lenhcat", JSON.stringify(k));
                    window.location.href = "/lenh-cat";
                  }} className="w-full text-xs py-2 bg-cyan-600 text-white rounded-lg font-bold hover:bg-cyan-700 transition flex items-center justify-center gap-1 shadow-sm">
                    <Scissors className="w-3.5 h-3.5" /> Tạo Lệnh Cắt Nhanh
                  </button>
                  <div className="w-full flex gap-2">
                    <button onClick={() => setProgressEdit({ id: k.id, val: k.daHoanThanh })} className="flex-1 text-xs py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg font-bold hover:bg-emerald-100 transition flex items-center justify-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Tiến độ
                    </button>
                    <button onClick={() => handleEdit(k)} className="flex-1 text-xs py-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-lg font-bold hover:bg-amber-100 transition flex items-center justify-center gap-1">
                      <Edit2 className="w-3 h-3" /> Sửa
                    </button>
                    <button onClick={() => handleDelete(k)} className="flex-1 text-xs py-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 rounded-lg font-bold hover:bg-rose-100 transition flex items-center justify-center gap-1">
                      <Trash2 className="w-3 h-3" /> Xoá
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal sử dụng CrudModal chuẩn */}
      <CrudModal
        open={showForm}
        onClose={() => { setShowForm(false); setEditItem(null); }}
        title={editItem ? `Sửa kế hoạch: ${editItem.maKHSX}` : "Tạo Kế hoạch SX mới"}
        fields={[
          { name: "maKHSX", label: "Mã Kế Hoạch (Mã Lệnh)", type: "text", required: true, placeholder: "VD: KH-001" },
          { name: "sanPham", label: "Sản phẩm", type: "text", required: true, placeholder: "VD: Áo thun cotton trắng" },
          { name: "loai", label: "Loại SP", type: "select", options: [
            { value: "Áo", label: "Áo" }, { value: "Bộ", label: "Bộ" }, { value: "Quần", label: "Quần" }, { value: "Phụ kiện", label: "Phụ kiện" }
          ]},
          { name: "soLuong", label: "Số lượng (SL)", type: "number", required: true, min: 1 },
          { name: "daHoanThanh", label: "Đã hoàn thành", type: "number", min: 0 },
          { name: "tuNgay", label: "Từ ngày", type: "date", required: true },
          { name: "denNgay", label: "Đến ngày (Ngày dự kiến)", type: "date", required: true },
          { name: "xuongPhuTrach", label: "Xưởng phụ trách", type: "select", options: XUONG_LIST.map(x => ({ value: x, label: x })) },
          { name: "trangThai", label: "Trạng thái", type: "select", options: [
            { value: "Lên kế hoạch", label: "Lên kế hoạch" },
            { value: "Đang SX", label: "Đang SX" },
            { value: "Hoàn thành", label: "Hoàn thành" },
            { value: "Trễ hạn", label: "Trễ hạn" },
          ] },
          { name: "ghiChu", label: "Ghi chú", type: "textarea" },
        ]}
        initial={editItem ? {
          maKHSX: editItem.maKHSX,
          sanPham: editItem.sanPham,
          loai: editItem.loai,
          soLuong: String(editItem.soLuong),
          daHoanThanh: String(editItem.daHoanThanh),
          tuNgay: editItem.tuNgay,
          denNgay: editItem.denNgay,
          xuongPhuTrach: editItem.xuongPhuTrach,
          trangThai: editItem.trangThai,
          ghiChu: editItem.ghiChu || ""
        } : {
          maKHSX: `KH-${String(list.length + 1).padStart(3, "0")}`,
          soLuong: "0",
          daHoanThanh: "0",
          loai: "Áo",
          xuongPhuTrach: XUONG_LIST[0],
          trangThai: "Lên kế hoạch"
        }}
        onSubmit={async (values) => {
          const soLuong = Number(values.soLuong);
          const daHoanThanh = Number(values.daHoanThanh || 0);

          if (editItem) {
            commit(list.map(k => k.id === editItem.id ? { 
              ...k,
              maKHSX: values.maKHSX,
              sanPham: values.sanPham,
              loai: values.loai as KHSX["loai"],
              soLuong,
              daHoanThanh,
              tuNgay: values.tuNgay,
              denNgay: values.denNgay,
              xuongPhuTrach: values.xuongPhuTrach,
              trangThai: values.trangThai as TrangThaiKHSX,
              ghiChu: values.ghiChu
            } : k));
            toast.success(`✅ Đã cập nhật: ${values.sanPham}`);
          } else {
            const newItem: KHSX = {
              id: `KHSX-${Date.now()}`,
              tuan: "", // có thể tính toán tuần nếu cần
              maKHSX: values.maKHSX,
              sanPham: values.sanPham,
              loai: values.loai as KHSX["loai"],
              soLuong,
              daHoanThanh,
              tuNgay: values.tuNgay,
              denNgay: values.denNgay,
              xuongPhuTrach: values.xuongPhuTrach,
              trangThai: values.trangThai as TrangThaiKHSX,
              ghiChu: values.ghiChu
            };
            commit([...list, newItem]);
            toast.success(`✅ Đã tạo ${newItem.maKHSX}: ${values.sanPham} — ${soLuong.toLocaleString()} SP`);
          }
          setShowForm(false);
          setEditItem(null);
        }}
      />
    </div>
  );
}
