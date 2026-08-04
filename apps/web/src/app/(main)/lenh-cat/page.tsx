"use client";

// ============ LENH CAT PAGE (Giai đoạn 1 - Mavis) ============
// Trang chu quan ly Lenh Cat moi
// - Stats tong quan (tong LC, dang cat, da cat, hoan thanh, COGS TB)
// - List lệnh cắt mới tạo (cards)
// - Modal "Them Lenh Cat" với 4 sections + COGS auto

import { useState } from "react";
import {
  Scissors, Plus, TrendingUp, Calendar, Shirt, Package, AlertCircle,
  ChevronRight, Calculator, Wallet, Clock, CheckCircle2, Edit3, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { LenhCatModal } from "@/components/LenhCatModal";
import {
  useLenhCat,
  type LenhCat,
  type TrangThaiLenhCat,
  TRANG_THAI_LC_LABELS,
  TRANG_THAI_LC_STYLE,
  LOAI_SP_LABELS,
} from "@/lib/data/lenh-cat-store";
import { formatVND, formatVNDShort } from "@/lib/data/real-data";
import { MobileCard, EmptyState, DateDisplay } from "@/components/ui";

export default function LenhCatPage() {
  const { dsLenhCat, xoaLenhCat, capNhatTrangThai, reset, themMauCongDoan, themMauChiPhi, dsMauCongDoan, dsMauChiPhi, xoaMauCongDoan, xoaMauChiPhi } = useLenhCat();
  const [showTaoMauCD, setShowTaoMauCD] = useState(false);
  const [customStepName, setCustomStepName] = useState("");
  const [customCostName, setCustomCostName] = useState("");
  const [newMauCD, setNewMauCD] = useState<{id: string; ten: string; giaCong: {id: string; tenCongDoan: string; nguoiMa: string; nguoiTen: string; donGia: number}[]}>({ id: "", ten: "", giaCong: [
    { id: "cat", tenCongDoan: "Cắt", nguoiMa: "", nguoiTen: "", donGia: 0 },
    { id: "mayAo", tenCongDoan: "May Áo", nguoiMa: "", nguoiTen: "", donGia: 0 },
    { id: "mayQuan", tenCongDoan: "May Quần", nguoiMa: "", nguoiTen: "", donGia: 0 },
    { id: "in", tenCongDoan: "In", nguoiMa: "", nguoiTen: "", donGia: 0 },
    { id: "theu", tenCongDoan: "Thêu", nguoiMa: "", nguoiTen: "", donGia: 0 },
    { id: "ui", tenCongDoan: "Ủi", nguoiMa: "", nguoiTen: "", donGia: 0 },
    { id: "dongGoi", tenCongDoan: "Đóng Gói", nguoiMa: "", nguoiTen: "", donGia: 0 }
  ] });

  const [showTaoMauCP, setShowTaoMauCP] = useState(false);
  const [newMauCP, setNewMauCP] = useState({ id: "", ten: "", chiPhi: { baoBi: 0, temNhan: 0, khauHao: 0 } });

  const handleCreateCD = () => {
    setNewMauCD({ id: "cd_" + Date.now(), ten: "", giaCong: [
      { id: "cat", tenCongDoan: "Cắt", nguoiMa: "", nguoiTen: "", donGia: 0 },
      { id: "mayAo", tenCongDoan: "May Áo", nguoiMa: "", nguoiTen: "", donGia: 0 },
      { id: "mayQuan", tenCongDoan: "May Quần", nguoiMa: "", nguoiTen: "", donGia: 0 },
      { id: "in", tenCongDoan: "In", nguoiMa: "", nguoiTen: "", donGia: 0 },
      { id: "theu", tenCongDoan: "Thêu", nguoiMa: "", nguoiTen: "", donGia: 0 },
      { id: "ui", tenCongDoan: "Ủi", nguoiMa: "", nguoiTen: "", donGia: 0 },
      { id: "dongGoi", tenCongDoan: "Đóng Gói", nguoiMa: "", nguoiTen: "", donGia: 0 }
    ] });
    setShowTaoMauCD(true);
  };

  const handleCreateCP = () => {
    setNewMauCP({ id: "cp_" + Date.now(), ten: "", chiPhi: { baoBi: 0, temNhan: 0, khauHao: 0 } });
    setShowTaoMauCP(true);
  };
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filterTrangThai, setFilterTrangThai] = useState<TrangThaiLenhCat | "ALL">("ALL");
  const [expandedMauCD, setExpandedMauCD] = useState<string | null>(null);
  const [expandedMauCP, setExpandedMauCP] = useState<string | null>(null);
  const [showDanhSachMau, setShowDanhSachMau] = useState(false);

  // ============ KPIs ============
  const stats = {
    tongLC: dsLenhCat.length,
    nhap: dsLenhCat.filter((l) => l.trangThai === "Nhap").length,
    daTao: dsLenhCat.filter((l) => l.trangThai === "DaTao").length,
    dangCat: dsLenhCat.filter((l) => l.trangThai === "DangCat").length,
    hoanThanh: dsLenhCat.filter((l) => l.trangThai === "HoanThanh").length,
    chuyenTiep: dsLenhCat.filter((l) => l.trangThai === "ChuyenTiep").length,
    tongSL: dsLenhCat.reduce((s, l) => s + l.tongSL, 0),
    tongGiaVon: dsLenhCat.reduce((s, l) => s + ((l.bangCOGS as any)?.tongGiaVon ?? (l.bangCOGS as any)?.giaVonBinhQuan ?? 0) * l.tongSL, 0),
    giaVonTBSP: (() => {
      const valid = dsLenhCat.filter((l) => l.tongSL > 0 && l.bangCOGS);
      if (valid.length === 0) return 0;
      return valid.reduce((s, l) => s + l.tongSL * ((l.bangCOGS as any)?.giaVon1SP ?? (l.bangCOGS as any)?.giaVonBinhQuan ?? 0), 0) /
        valid.reduce((s, l) => s + l.tongSL, 0);
    })(),
  };

  // ============ Filter ============
  const filteredLC = dsLenhCat.filter((l) => {
    if (filterTrangThai !== "ALL" && l.trangThai !== filterTrangThai) return false;
    return true;
  });

  // ============ Handlers ============
  const handleEdit = (id: string) => {
    setEditId(id);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditId(null);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm(`Xoá ${id}? Hành động này không thể hoàn tác.`)) {
      xoaLenhCat(id, (typeof window !== 'undefined' && (window as any).__currentUser) || null as any);
      toast.success(`Đã xoá ${id}`);
    }
  };

  const handleReset = () => {
    if (confirm("Reset toàn bộ lệnh cắt về mặc định? Hành động này sẽ xoá dữ liệu bạn đã tạo.")) {
      reset();
      toast.success("Đã reset");
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Scissors className="w-7 h-7 text-violet-500" />
            Lệnh cắt
          </h1>
          <p className="opacity-70 mt-1 text-sm">
            Tạo lệnh cắt mới, phân bổ size, tính giá vốn tự động (COGS)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-3 py-2 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Reset
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold hover:from-violet-700 hover:to-fuchsia-700 flex items-center gap-1.5 shadow-lg shadow-violet-500/20"
          >
            <Plus className="w-4 h-4" />
            Tạo lệnh cắt
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<Scissors className="w-4 h-4" />}
          label="Tổng lệnh"
          value={stats.tongLC.toString()}
          sub={`${stats.tongSL.toLocaleString()} sp`}
          color="violet"
        />
        <StatCard
          icon={<Clock className="w-4 h-4" />}
          label="Nháp + Đang cắt"
          value={(stats.nhap + stats.dangCat).toString()}
          sub={`${stats.nhap} nháp · ${stats.dangCat} đang cắt`}
          color="amber"
        />
        <StatCard
          icon={<CheckCircle2 className="w-4 h-4" />}
          label="Đã tạo + Hoàn thành"
          value={(stats.daTao + stats.hoanThanh).toString()}
          sub={`${stats.daTao} đã tạo · ${stats.hoanThanh} xong`}
          color="emerald"
        />
        <StatCard
          icon={<Wallet className="w-4 h-4" />}
          label="Tổng giá vốn lô"
          value={formatVNDShort(stats.tongGiaVon)}
          sub={`BQ: ${formatVNDShort(stats.giaVonTBSP)}/sp`}
          color="sky"
        />
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-1.5 overflow-x-auto">
        {(["ALL", "Nhap", "DaTao", "DangCat", "HoanThanh", "ChuyenTiep"] as const).map((tt) => {
          const count = tt === "ALL" ? dsLenhCat.length : dsLenhCat.filter((l) => l.trangThai === tt).length;
          const active = filterTrangThai === tt;
          return (
            <button
              key={tt}
              onClick={() => setFilterTrangThai(tt)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                active
                  ? "bg-violet-500 text-white shadow"
                  : "bg-white/40 dark:bg-white/5 hover:bg-white/60"
              }`}
            >
              {tt === "ALL" ? "Tất cả" : TRANG_THAI_LC_LABELS[tt]} ({count})
            </button>
          );
        })}
      </div>

        <div className="w-px h-6 bg-slate-300 mx-2 self-center"></div>
        <button
          onClick={handleCreateCD}
          className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition bg-violet-100 text-violet-700 hover:bg-violet-200 border border-violet-200 shadow-sm"
        >
          + Tạo mẫu công đoạn
        </button>
        <button
          onClick={handleCreateCP}
          className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200 shadow-sm"
        >
          + Tạo bảng chi phí
        </button>


      {/* Danh sách mẫu đã lưu */}
      {(dsMauCongDoan.length > 0 || dsMauChiPhi.length > 0) && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 overflow-hidden">
          <button
            onClick={() => setShowDanhSachMau(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
          >
            <span className="flex items-center gap-2">
              <span className="text-violet-600">📋</span>
              Danh sách mẫu đã lưu
              <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-xs font-bold">
                {dsMauCongDoan.length} công đoạn · {dsMauChiPhi.length} bảng chi phí
              </span>
            </span>
            <span className={`text-slate-400 transition-transform ${showDanhSachMau ? 'rotate-180' : ''}`}>▼</span>
          </button>

          {showDanhSachMau && (
            <div className="border-t border-slate-200 dark:border-slate-700 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mẫu Công Đoạn */}
              <div>
                <h4 className="text-xs font-bold text-violet-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <span>✂️</span> Mẫu Công Đoạn ({dsMauCongDoan.length})
                </h4>
                <div className="space-y-2">
                  {dsMauCongDoan.map((m) => (
                    <div key={m.id} className="border border-violet-100 rounded-lg bg-violet-50/50 overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-2">
                        <button
                          onClick={() => setExpandedMauCD(expandedMauCD === m.id ? null : m.id)}
                          className="font-semibold text-sm text-slate-800 flex items-center gap-1.5 flex-1 text-left"
                        >
                          <span className="w-2 h-2 rounded-full bg-violet-400 flex-shrink-0"></span>
                          {m.ten}
                          <span className="text-xs font-normal text-slate-400">({Array.isArray(m.giaCong) ? m.giaCong.length : 0} khâu)</span>
                        </button>
                        <button
                          onClick={() => {
                            setNewMauCD(m);
                            setShowTaoMauCD(true);
                          }}
                          className="p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-700/50 rounded ml-2 flex-shrink-0"
                          title="Sửa mẫu"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { if (confirm(`Xoá mẫu "${m.ten}"?`)) { xoaMauCongDoan(m.id); toast.success('Đã xoá mẫu'); } }}
                          className="p-1 text-rose-400 hover:bg-rose-100 rounded ml-2 flex-shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {expandedMauCD === m.id && (
                        <div className="border-t border-violet-100 px-3 py-2 space-y-1">
                          {(Array.isArray(m.giaCong) ? m.giaCong : []).map((k, i) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                              <span className="text-slate-600">{k.tenCongDoan}</span>
                              <span className="font-bold text-violet-700">{(k.donGia || 0).toLocaleString()}đ</span>
                            </div>
                          ))}
                          <div className="flex items-center justify-between text-xs pt-1 border-t border-violet-100 mt-1">
                            <span className="font-bold text-slate-700">Tổng gia công/SP</span>
                            <span className="font-bold text-emerald-600">{(Array.isArray(m.giaCong) ? m.giaCong : []).reduce((s, k) => s + (k.donGia || 0), 0).toLocaleString()}đ</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Bảng Chi Phí */}
              <div>
                <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <span>💰</span> Bảng Chi Phí Cố Định ({dsMauChiPhi.length})
                </h4>
                <div className="space-y-2">
                  {dsMauChiPhi.map((m) => (
                    <div key={m.id} className="border border-emerald-100 rounded-lg bg-emerald-50/50 overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-2">
                        <button
                          onClick={() => setExpandedMauCP(expandedMauCP === m.id ? null : m.id)}
                          className="font-semibold text-sm text-slate-800 flex items-center gap-1.5 flex-1 text-left"
                        >
                          <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0"></span>
                          {m.ten}
                          <span className="text-xs font-normal text-slate-400">
                            ({Object.values(m.chiPhi || {}).reduce((s, v) => s + v, 0).toLocaleString()}đ/sp)
                          </span>
                        </button>
                        <button
                          onClick={() => {
                            setNewMauCP(m as any);
                            setShowTaoMauCP(true);
                          }}
                          className="p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-700/50 rounded ml-2 flex-shrink-0"
                          title="Sửa bảng giá"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { if (confirm(`Xoá bảng giá "${m.ten}"?`)) { xoaMauChiPhi(m.id); toast.success('Đã xoá bảng giá'); } }}
                          className="p-1 text-rose-400 hover:bg-rose-100 rounded ml-2 flex-shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {expandedMauCP === m.id && (
                        <div className="border-t border-emerald-100 px-3 py-2 space-y-1">
                          {Object.entries(m.chiPhi || {}).map(([key, val]) => (
                            <div key={key} className="flex justify-between text-xs">
                              <span className="text-slate-600">{key}</span>
                              <span className="font-bold text-emerald-700">{(Number(val) || 0).toLocaleString()}đ</span>
                            </div>
                          ))}
                          <div className="flex justify-between text-xs pt-1 border-t border-emerald-100 mt-1">
                            <span className="font-bold text-slate-700">Tổng chi phí cố định/SP</span>
                            <span className="font-bold text-emerald-600">{Object.values(m.chiPhi || {}).reduce((s, v) => s + v, 0).toLocaleString()}đ</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* List */}
      {filteredLC.length === 0 ? (
        <EmptyState
          icon={<Scissors className="w-7 h-7 text-violet-500 opacity-60" />}
          title={filterTrangThai === "ALL" ? "Chưa có lệnh cắt nào" : `Không có lệnh cắt ở trạng thái "${TRANG_THAI_LC_LABELS[filterTrangThai as TrangThaiLenhCat]}"`}
          description="Bấm 'Tạo lệnh cắt' để bắt đầu"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredLC.map((lc) => (
            <LenhCatCard
              key={lc.id}
              lc={lc}
              onEdit={() => handleEdit(lc.id)}
              onDelete={() => handleDelete(lc.id)}
              onChangeStatus={(tt) => capNhatTrangThai(lc.id, tt, null)}
            />
          ))}
        </div>
      )}
      {/* Modal Tạo Mẫu Công Đoạn */}
      {showTaoMauCD && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 animate-in zoom-in-95">
            <h3 className="text-lg font-bold mb-4">{dsMauCongDoan.some(x => x.id === newMauCD.id && newMauCD.id !== "") ? "Cập Nhật Mẫu Công Đoạn" : "Tạo Mẫu Công Đoạn Mới"}</h3>
            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-sm font-bold mb-1">Tên Mẫu</label>
                <input className="w-full px-3 py-2 border rounded" placeholder="VD: Áo Thun Cổ Tròn" value={newMauCD.ten} onChange={e => setNewMauCD(prev => ({ ...prev, ten: e.target.value }))} />
              </div>
              {newMauCD.giaCong.map((item, index) => (
                  <div key={index} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <button onClick={() => {
                        const newGiaCong = [...newMauCD.giaCong];
                        newGiaCong.splice(index, 1);
                        setNewMauCD(prev => ({ ...prev, giaCong: newGiaCong }));
                      }} className="text-rose-500 hover:bg-rose-100 p-1 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <input className="text-sm font-medium border-b border-dashed border-slate-300 focus:outline-none flex-1 bg-transparent" value={item.tenCongDoan} onChange={e => {
                        const newGiaCong = [...newMauCD.giaCong];
                        newGiaCong[index].tenCongDoan = e.target.value;
                        setNewMauCD(prev => ({ ...prev, giaCong: newGiaCong }));
                      }} />
                    </div>
                    <div className="flex items-center gap-1 w-32 border rounded px-2">
                      <input type="number" className="w-full py-1 focus:outline-none bg-transparent" placeholder="Đơn giá" value={item.donGia || ""} onChange={e => {
                        const newGiaCong = [...newMauCD.giaCong];
                        newGiaCong[index].donGia = parseInt(e.target.value) || 0;
                        setNewMauCD(prev => ({ ...prev, giaCong: newGiaCong }));
                      }} />
                      <span className="text-xs text-slate-400">đ</span>
                    </div>
                  </div>
                ))}
                
                {/* Thêm công đoạn mới */}
                <div className="flex items-center gap-2 mt-4 pt-2 border-t border-slate-100">
                  <input className="flex-1 px-3 py-1.5 border rounded text-sm" placeholder="Nhập tên công đoạn mới..." value={customStepName} onChange={e => setCustomStepName(e.target.value)} onKeyDown={e => {
                    if (e.key === "Enter" && customStepName.trim()) {
                      const newId = "cd_" + Date.now();
                      setNewMauCD(prev => ({ ...prev, giaCong: [...prev.giaCong, { id: newId, tenCongDoan: customStepName.trim(), nguoiMa: "", nguoiTen: "", donGia: 0 }] }));
                      setCustomStepName("");
                    }
                  }}/>
                  <button onClick={() => {
                    if (customStepName.trim()) {
                      const newId = "cd_" + Date.now();
                      setNewMauCD(prev => ({ ...prev, giaCong: [...prev.giaCong, { id: newId, tenCongDoan: customStepName.trim(), nguoiMa: "", nguoiTen: "", donGia: 0 }] }));
                      setCustomStepName("");
                    }
                  }} className="px-3 py-1.5 bg-slate-100 text-slate-700 font-medium text-sm rounded hover:bg-slate-200 whitespace-nowrap">+ Thêm</button>
                </div>

            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowTaoMauCD(false)} className="px-4 py-2 border rounded text-slate-600 font-bold hover:bg-slate-50">Huỷ</button>
              <button onClick={() => { if (!newMauCD.ten.trim()) { toast.error("Vui lòng nhập tên mẫu"); return; } themMauCongDoan(newMauCD); setShowTaoMauCD(false); toast.success("Đã lưu mẫu công đoạn"); }} className="px-4 py-2 bg-violet-600 text-white rounded font-bold hover:bg-violet-700 shadow-lg">Lưu Mẫu</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tạo Mẫu Chi Phí */}
      {showTaoMauCP && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 animate-in zoom-in-95">
            <h3 className="text-lg font-bold mb-4">{dsMauChiPhi.some(x => x.id === newMauCP.id && newMauCP.id !== "") ? "Cập Nhật Mẫu Chi Phí Cố Định" : "Tạo Mẫu Chi Phí Cố Định Mới"}</h3>
            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-sm font-bold mb-1">Tên Bảng Giá</label>
                <input className="w-full px-3 py-2 border rounded" placeholder="VD: Bảng giá Áo Trẻ Em" value={newMauCP.ten} onChange={e => setNewMauCP(prev => ({ ...prev, ten: e.target.value }))} />
              </div>
              <div className="space-y-3 overflow-y-auto max-h-[300px] pr-1">
                {Object.entries(newMauCP.chiPhi || {}).map(([key, val], index) => (
                  <div key={index} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <button onClick={() => {
                        setNewMauCP(prev => {
                          const newChiPhi: Record<string, number> = { ...prev.chiPhi };
                          delete newChiPhi[key];
                          return { ...prev, chiPhi: newChiPhi as { baoBi: number; temNhan: number; khauHao: number } };
                        });
                      }} className="text-rose-500 hover:bg-rose-100 p-1 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <input className="text-sm font-medium border-b border-dashed border-slate-300 focus:outline-none flex-1 bg-transparent" value={key} onChange={e => {
                        const newKey = e.target.value;
                        if (newKey && newKey !== key) {
                          setNewMauCP(prev => {
                            const newChiPhi: Record<string, number> = { ...prev.chiPhi };
                            const currentVal = newChiPhi[key];
                            delete newChiPhi[key];
                            newChiPhi[newKey] = currentVal;
                            return { ...prev, chiPhi: newChiPhi as { baoBi: number; temNhan: number; khauHao: number } };
                          });
                        }
                      }} />
                    </div>
                    <div className="flex items-center gap-1 w-32 border rounded px-2">
                      <input type="number" className="w-full py-1 focus:outline-none bg-transparent" placeholder="Chi phí" value={val || ""} onChange={e => {
                        const newVal = parseInt(e.target.value) || 0;
                        setNewMauCP(prev => ({
                          ...prev,
                          chiPhi: { ...prev.chiPhi, [key]: newVal }
                        }));
                      }} />
                      <span className="text-xs text-slate-400">đ</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Thêm chi phí mới */}
              <div className="flex items-center gap-2 mt-4 pt-2 border-t border-slate-100">
                <input className="flex-1 px-3 py-1.5 border rounded text-sm" placeholder="Nhập tên chi phí mới..." value={customCostName} onChange={e => setCustomCostName(e.target.value)} onKeyDown={e => {
                  if (e.key === "Enter" && customCostName.trim()) {
                    setNewMauCP(prev => ({
                      ...prev,
                      chiPhi: { ...prev.chiPhi, [customCostName.trim()]: 0 }
                    }));
                    setCustomCostName("");
                  }
                }}/>
                <button onClick={() => {
                  if (customCostName.trim()) {
                    setNewMauCP(prev => ({
                      ...prev,
                      chiPhi: { ...prev.chiPhi, [customCostName.trim()]: 0 }
                    }));
                    setCustomCostName("");
                  }
                }} className="px-3 py-1.5 bg-slate-100 text-slate-700 font-medium text-sm rounded hover:bg-slate-200 whitespace-nowrap">+ Thêm</button>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowTaoMauCP(false)} className="px-4 py-2 border rounded text-slate-600 font-bold hover:bg-slate-50">Huỷ</button>
              <button onClick={() => { if (!newMauCP.ten.trim()) { toast.error("Vui lòng nhập tên bảng giá"); return; } themMauChiPhi(newMauCP); setShowTaoMauCP(false); toast.success("Đã lưu bảng giá"); }} className="px-4 py-2 bg-violet-600 text-white rounded font-bold hover:bg-violet-700 shadow-lg">Lưu Bảng Giá</button>
            </div>
          </div>
        </div>
      )}



      {/* Modal */}
      {showModal && (
        <LenhCatModal
          isOpen={true}
          onClose={() => {
            setShowModal(false);
            setEditId(null);
          }}
          editId={editId}
        />
      )}
    </div>
  );
}

// ============ Sub-components ============
function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: "violet" | "amber" | "emerald" | "sky";
}) {
  const colorMap: Record<string, string> = {
    violet: "bg-violet-900 text-violet-50",
    amber: "bg-amber-900 text-amber-50",
    emerald: "bg-emerald-900 text-emerald-50",
    sky: "bg-sky-900 text-sky-50",
  };
  return (
    <div className={`rounded-xl p-3 shadow-md ${colorMap[color]}`}>
      <div className="flex items-center gap-1.5 text-xs font-semibold opacity-80 mb-1">
        {icon}<span>{label}</span>
      </div>
      <div className="text-xl md:text-2xl font-bold tabular-nums">{value}</div>
      {sub && <div className="text-[10px] opacity-70 mt-1 font-medium">{sub}</div>}
    </div>
  );
}

function LenhCatCard({ lc, onEdit, onDelete, onChangeStatus }: {
  lc: LenhCat;
  onEdit: () => void;
  onDelete: () => void;
  onChangeStatus: (tt: TrangThaiLenhCat) => void;
}) {
  const s = TRANG_THAI_LC_STYLE[lc.trangThai];
  const cogs = lc.bangCOGS;
  const isLate = lc.hanHoanThanh < new Date().toISOString().split("T")[0] && lc.trangThai !== "HoanThanh";

  return (
    <div className={`card p-4 hover:shadow-lg transition-shadow ${isLate ? "ring-1 ring-rose-500/40" : ""}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs font-mono opacity-60">{lc.id}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${s.bg} ${s.color} font-semibold`}>
              {TRANG_THAI_LC_LABELS[lc.trangThai]}
            </span>
            {isLate && <AlertCircle className="w-3.5 h-3.5 text-rose-600" />}
          </div>
          <h3 className="font-bold text-sm truncate">{lc.tenSP}</h3>
          <p className="text-[10px] opacity-60 mt-0.5">
            {LOAI_SP_LABELS[lc.loaiSP]} · Mã: <span className="font-mono">{lc.maSP}</span>
          </p>
        </div>
      </div>

      {/* Body - Stats */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center justify-between text-xs">
          <span className="opacity-60 flex items-center gap-1">
            <Package className="w-3 h-3" /> Tổng SL
          </span>
          <span className="font-bold tabular-nums">{(lc.tongSL || 0).toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="opacity-60 flex items-center gap-1">
            <Shirt className="w-3 h-3" /> Tỉ lệ size
          </span>
          <span className="font-mono text-[10px]">
            {lc.tiLeSize || "--"}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="opacity-60 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Hạn
          </span>
          <DateDisplay value={lc.hanHoanThanh} format="dd/MM" showRelative />
        </div>
        {cogs && (
          <>
            <div className="border-t pt-1.5 mt-1.5" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between text-xs">
                <span className="opacity-60 flex items-center gap-1">
                  <Calculator className="w-3 h-3" /> Giá vốn / SP
                </span>
                <span className="font-bold text-violet-600 tabular-nums">
                  {formatVND(cogs.giaVon1SP ?? cogs.giaVonBinhQuan)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs mt-0.5">
                <span className="opacity-60">Tổng lô:</span>
                <span className="font-mono text-emerald-600 tabular-nums text-[11px]">
                  {formatVND(cogs.tongGiaVon ?? cogs.giaVonBinhQuan)}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-1 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={onEdit}
          className="flex-1 text-[10px] px-2 py-1.5 rounded bg-sky-500/15 text-sky-700 hover:bg-sky-500/25 font-medium flex items-center justify-center gap-1"
        >
          <Edit3 className="w-3 h-3" /> Sửa
        </button>
        <select
          value={lc.trangThai}
          onChange={(e) => onChangeStatus(e.target.value as TrangThaiLenhCat)}
          className="text-[10px] px-1 py-1 rounded border" style={{ borderColor: "var(--border)" }}
        >
          {(["Nhap", "DaTao", "DangCat", "HoanThanh", "ChuyenTiep"] as TrangThaiLenhCat[]).map((tt) => (
            <option key={tt} value={tt}>{TRANG_THAI_LC_LABELS[tt]}</option>
          ))}
        </select>
        <button
          onClick={onDelete}
          className="text-[10px] px-2 py-1.5 rounded bg-rose-500/15 text-rose-700 hover:bg-rose-500/25 font-medium"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
