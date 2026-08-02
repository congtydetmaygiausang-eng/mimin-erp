"use client";

import { useState, useMemo, useRef } from "react";
import {
  Boxes,
  Plus,
  Minus,
  AlertTriangle,
  TrendingUp,
  History,
  Search,
  X,
  DollarSign,
  Box,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useKho, type GiaoDichKho } from "@/lib/data/kho-store";
import { KHO_VAT_TU, KHO_VAI, formatVND, formatVNDShort, type KhoVai } from "@/lib/data/real-data";
import { DOI_TAC } from "@/lib/data/real-data";

type Tab = "tongquan" | "nhap" | "xuat" | "lichsu";

export default function KhoPhuLieuPage() {
  const { giaoDich, themGiaoDich, danhSachTrangThai, giaoDichTheoVT, reset } = useKho();
  const [tab, setTab] = useState<Tab>("tongquan");
  const [search, setSearch] = useState("");
  const [showNhap, setShowNhap] = useState<string | null>(null);
  const [showXuat, setShowXuat] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<string | null>(null);
  
  const [inventoryImages, setInventoryImages] = useState<Record<string, string>>({});
  const [uploadingVT, setUploadingVT] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadingVT) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setInventoryImages((prev) => ({
          ...prev,
          [uploadingVT]: e.target?.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // KPIs
  const dsTrangThai = danhSachTrangThai("phu-lieu");
  const tongGiaTri = dsTrangThai.reduce((s, t) => s + t.giaTriTon, 0);
  const dsCanhBao = dsTrangThai.filter((t) => t.canhBao);
  const tongNhap = giaoDich.filter((g) => g.loai === "NHAP" && KHO_VAT_TU.find((v) => v.maVT === g.maVT)).reduce((s, g) => s + g.thanhTien, 0);
  const tongXuat = giaoDich.filter((g) => g.loai === "XUAT" && KHO_VAT_TU.find((v) => v.maVT === g.maVT)).reduce((s, g) => s + g.thanhTien, 0);

  // Group VT theo loại
  const dsTheoLoai = useMemo(() => {
    const groups: Record<string, typeof KHO_VAT_TU> = {};
    for (const v of KHO_VAT_TU) {
      const loai = v.loai || "Khác";
      if (!groups[loai]) groups[loai] = [];
      groups[loai].push(v);
    }
    return groups;
  }, []);

  const filteredVT = useMemo(() => {
    return KHO_VAT_TU.filter((v) => {
      const matchSearch = [v.tenVT, v.maVT, v.loai].some((x) => (x || "").toLowerCase().includes(search.toLowerCase()));
      return matchSearch;
    });
  }, [search]);

  const filteredGD = useMemo(() => {
    return giaoDich
      .filter((g) => KHO_VAT_TU.find((v) => v.maVT === g.maVT))
      .filter((g) => {
        const matchSearch = [g.maVT, g.tenVT, g.nguonNhap, g.nguoiThucHien].some((x) => (x || "").toLowerCase().includes(search.toLowerCase()));
        const matchLoai = tab === "nhap" ? g.loai === "NHAP" : tab === "xuat" ? g.loai === "XUAT" : true;
        return matchSearch && matchLoai;
      })
      .sort((a, b) => b.ngay.localeCompare(a.ngay));
  }, [giaoDich, search, tab]);

  return (
    <div className="min-h-[calc(100vh-64px)] -m-4 md:-m-6 p-4 md:p-6 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-400/20 via-violet-200/10 to-transparent dark:from-violet-900/30 dark:via-slate-900 dark:to-slate-900">
      <div className="max-w-7xl mx-auto space-y-5 animate-fade-in relative z-10">
        
      <div className="bg-[#2e1065] p-5 md:p-6 rounded-3xl shadow-lg border border-violet-800/30 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 text-white">
              <Boxes className="w-7 h-7 text-violet-300" />
              Kho Phụ Liệu
            </h1>
            <p className="opacity-90 mt-1 text-sm text-violet-100">
              {KHO_VAT_TU.length} mã phụ liệu · Tổng giá trị tồn <b className="text-emerald-400">{formatVNDShort(tongGiaTri)}</b>
              {dsCanhBao.length > 0 && <> · <b className="text-rose-400">⚠️ {dsCanhBao.length} mã dưới tồn tối thiểu</b></>}
            </p>
          </div>
          <button onClick={() => { if (confirm("Reset?")) { reset(); toast.success("Đã reset"); } }} className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">Reset</button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          <div className="card p-4 bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-0">
            <div className="text-xs font-medium text-violet-200 flex items-center gap-1.5 opacity-80"><Box className="w-4 h-4" /> Tổng tồn kho</div>
            <div className="text-xl font-bold mt-1 text-white">{KHO_VAT_TU.length} mã</div>
            <div className="text-xs opacity-60 mt-1 text-violet-200">{Object.keys(dsTheoLoai).length} loại</div>
          </div>
          <div className="card p-4 bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-0">
            <div className="text-xs font-medium text-emerald-200 flex items-center gap-1.5 opacity-80"><DollarSign className="w-4 h-4" /> Giá trị tồn</div>
            <div className="text-xl font-bold mt-1 text-emerald-400">{formatVNDShort(tongGiaTri)}</div>
            <div className="text-xs opacity-60 mt-1 text-emerald-200/70">{formatVND(tongGiaTri)}</div>
          </div>
          <div className="card p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-0">
            <div className="text-xs font-medium text-blue-200 flex items-center gap-1.5 opacity-80"><TrendingUp className="w-4 h-4" /> Tổng nhập</div>
            <div className="text-xl font-bold mt-1 text-blue-400">{formatVNDShort(tongNhap)}</div>
          </div>
          <div className={`card p-4 bg-gradient-to-br border-0 ${dsCanhBao.length > 0 ? "from-rose-500/20 to-red-500/20" : "from-violet-500/10 to-purple-500/10"}`}>
            <div className={`text-xs font-medium flex items-center gap-1.5 opacity-80 ${dsCanhBao.length > 0 ? 'text-rose-200' : 'text-violet-200'}`}>
              <AlertTriangle className="w-4 h-4" /> Cảnh báo tồn
            </div>
            <div className={`text-xl font-bold mt-1 ${dsCanhBao.length > 0 ? "text-rose-400" : "text-white"}`}>
              {dsCanhBao.length}
            </div>
            <div className={`text-xs opacity-60 mt-1 ${dsCanhBao.length > 0 ? 'text-rose-200' : 'text-violet-200'}`}>mã dưới tối thiểu</div>
          </div>
        </div>

        {dsCanhBao.length > 0 && (
          <div className="mt-4 p-3 rounded-xl flex items-start gap-3 bg-red-500/20 border border-red-500/30 text-white">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <b className="text-rose-300">⚠️ Cảnh báo tồn kho thấp:</b>{" "}
              {dsCanhBao.slice(0, 5).map((t) => {
                const vt = KHO_VAT_TU.find((v) => v.maVT === t.maVT);
                return `${vt?.tenVT} (còn ${t.tonKho.toFixed(0)})`;
              }).join(", ")}.
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 bg-black/20 rounded-xl p-1.5 w-fit mt-5">
          {([
            { id: "tongquan" as Tab, label: `Tổng quan (${KHO_VAT_TU.length})`, icon: <Boxes className="w-4 h-4" /> },
            { id: "nhap" as Tab, label: `Nhập kho`, icon: <Plus className="w-4 h-4" /> },
            { id: "xuat" as Tab, label: `Xuất kho`, icon: <Minus className="w-4 h-4" /> },
            { id: "lichsu" as Tab, label: "Lịch sử GD", icon: <History className="w-4 h-4" /> },
          ]).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm rounded-lg flex items-center gap-2 transition-all ${
                tab === t.id 
                  ? "bg-violet-500 shadow-md font-bold text-white" 
                  : "font-medium text-violet-100 hover:bg-black/20 hover:text-white"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

      <div className="card p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
          <input
            className="input pl-9"
            placeholder="Tìm theo tên, mã, loại, NCC…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {tab === "tongquan" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-4">
          {filteredVT.map((v) => {
            const tt = dsTrangThai.find((t) => t.maVT === v.maVT);
            if (!tt) return null;
            
            const getTonKhoColor = (tonKho: number) => {
              if (tonKho < v.tonToiThieu) return "text-red-600 dark:text-red-500";
              if (tonKho > v.tonToiThieu * 3) return "text-emerald-600 dark:text-emerald-500";
              if (tonKho > v.tonToiThieu * 2) return "text-amber-500 dark:text-amber-400";
              return "text-violet-600 dark:text-violet-400";
            };

            return (
              <div key={v.maVT} className={`bg-white dark:bg-slate-900 border ${tt.canhBao ? 'border-red-300 dark:border-red-700/50 shadow-sm' : 'border-slate-200 dark:border-slate-800'} rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-violet-300 dark:hover:border-violet-700 transition-all relative overflow-hidden group`}>
                
                {/* Top row: ID and Status */}
                <div className="flex justify-between items-start mb-3">
                  <div className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md text-sm font-bold text-slate-700 dark:text-slate-300 tracking-wider">
                    {v.maVT}
                  </div>
                  <div className="flex gap-2">
                    {tt.canhBao ? (
                      <span className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wider">Thấp</span>
                    ) : (
                      <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wider">OK</span>
                    )}
                  </div>
                </div>

                {/* Main content: Icon & Name */}
                <div className="flex gap-4 items-center mb-4">
                  <div 
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-slate-200/50 dark:border-slate-700/50 shadow-sm overflow-hidden flex-shrink-0 cursor-pointer relative group/img flex items-center justify-center bg-violet-50 dark:bg-violet-900/20 transition-transform hover:scale-105"
                    onClick={() => { setUploadingVT(v.maVT); fileInputRef.current?.click(); }}
                    title="Bấm để tải ảnh lên"
                  >
                    {inventoryImages[v.maVT] ? (
                      <img src={inventoryImages[v.maVT]} alt={v.tenVT} className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Boxes className="w-8 h-8 sm:w-10 sm:h-10 text-violet-400 opacity-80 group-hover/img:opacity-0 transition-opacity" />
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-violet-600 bg-violet-100/80 opacity-0 group-hover/img:opacity-100 transition-opacity">
                          + Tải ảnh
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 leading-tight truncate" title={v.tenVT}>{v.tenVT}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1.5 truncate">
                      <span className="w-3 h-3 rounded-full shadow-inner border border-slate-200 dark:border-slate-700 bg-violet-400"></span> 
                      {v.loai}
                    </p>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 gap-3 mb-4 bg-slate-50/80 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">Tồn kho</div>
                    <div className={`font-black text-xl ${getTonKhoColor(tt.tonKho)}`}>{tt.tonKho.toFixed(0)} <span className="text-sm font-semibold opacity-70">{v.dvt}</span></div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">Giá trị</div>
                    <div className="flex flex-col gap-1 mt-0.5">
                      <span className="text-[13px] font-black text-slate-700 dark:text-slate-200 bg-slate-200/60 dark:bg-slate-700/60 px-1.5 py-0.5 rounded shadow-sm border border-slate-200/50 dark:border-slate-700/50">{formatVNDShort(tt.giaTriTon)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Footer: Price and Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Đơn giá</div>
                    <div className="font-bold text-slate-700 dark:text-slate-300">{v.donGia.toLocaleString()} ₫</div>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => setShowXuat(v.maVT)} className="bg-amber-100 hover:bg-amber-200 text-amber-700 text-xs py-1.5 px-3 shadow-sm font-semibold rounded-lg flex items-center gap-1">
                      <Minus className="w-3 h-3" /> Xuất
                    </button>
                    <button onClick={() => setShowNhap(v.maVT)} className="bg-sky-500 hover:bg-sky-600 text-white text-xs py-1.5 px-3 shadow-sm hover:shadow-md font-semibold rounded-lg flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Nhập
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(tab === "nhap" || tab === "xuat" || tab === "lichsu") && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b" style={{ borderColor: "var(--border)" }}>
                  <th className="p-3">Mã GD</th>
                  <th className="p-3">Ngày</th>
                  <th className="p-3">Loại</th>
                  <th className="p-3">Mã VT</th>
                  <th className="p-3">Tên</th>
                  <th className="p-3 text-right">SL</th>
                  <th className="p-3 text-right">Đơn giá</th>
                  <th className="p-3 text-right">Tiền</th>
                  <th className="p-3">Nguồn</th>
                  <th className="p-3">Người TH</th>
                </tr>
              </thead>
              <tbody>
                {filteredGD.length === 0 ? (
                  <tr><td colSpan={10} className="p-8 text-center opacity-60 text-sm">Chưa có giao dịch</td></tr>
                ) : filteredGD.map((g) => (
                  <tr key={g.id} className="border-b last:border-0 hover:bg-white/30 dark:hover:bg-white/5" style={{ borderColor: "var(--border)" }}>
                    <td className="p-3 font-mono text-xs opacity-70">{g.id}</td>
                    <td className="p-3 text-xs">{g.ngay}</td>
                    <td className="p-3">{g.loai === "NHAP" ? <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-700 text-[10px] font-semibold">+NHẬP</span> : <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 text-[10px] font-semibold">-XUẤT</span>}</td>
                    <td className="p-3 font-mono text-xs">{g.maVT}</td>
                    <td className="p-3">{g.tenVT}</td>
                    <td className="p-3 text-right font-mono font-semibold">{g.soLuong.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono">{g.donGia.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-emerald-600">{formatVNDShort(g.thanhTien)}</td>
                    <td className="p-3 text-xs">{g.nguonNhap || "—"}</td>
                    <td className="p-3 text-xs">{g.nguoiThucHien}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showNhap && <PLNhapKho maVT={showNhap} loai="phu-lieu" onClose={() => setShowNhap(null)} />}
      {showXuat && <PLXuatKho maVT={showXuat} loai="phu-lieu" onClose={() => setShowXuat(null)} />}
      {showHistory && <PLLichSu maVT={showHistory} loai="phu-lieu" onClose={() => setShowHistory(null)} />}
      </div>
    </div>
  );
}

// ============ MODALS (chung cho cả KhoVai + KhoPhuLieu) ============

function PLNhapKho({ maVT, loai, onClose }: { maVT: string; loai: "vai" | "phu-lieu"; onClose: () => void }) {
  const { themGiaoDich } = useKho();
  const dsVT = loai === "vai" ? KHO_VAI : KHO_VAT_TU;
  const vt = dsVT.find((v) => v.maVT === maVT)!;
  const nccList = DOI_TAC.filter((n) => n.trangThai === "Đang hợp tác");
  const [form, setForm] = useState({
    ngay: new Date().toISOString().split("T")[0],
    soLuong: 0,
    donGia: vt.donGia,
    nguonNhap: nccList[0]?.tenDonVi || "",
    nguoiThucHien: "Trần Thị Bình",
    ghiChu: "",
  });

  const thanhTien = form.soLuong * form.donGia;
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.soLuong <= 0) return toast.error("SL phải > 0");
    themGiaoDich({ ...form, loai: "NHAP", maVT: vt.maVT, tenVT: vt.tenVT, donVi: vt.dvt, thanhTien });
    toast.success(`Đã nhập ${form.soLuong.toLocaleString()} ${vt.dvt} ${vt.tenVT}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="card max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2"><Plus className="w-5 h-5 text-sky-600" /> Nhập kho: {vt.tenVT}</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/40 rounded"><X className="w-5 h-5" /></button>
        </div>
        <div className="bg-sky-500/10 rounded p-2 mb-3 text-xs">
          <span className="opacity-70">Mã:</span> <b className="font-mono">{vt.maVT}</b> · <span className="opacity-70">ĐVT:</span> {vt.dvt} · <span className="opacity-70">Loại:</span> {vt.loai}
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1">Ngày nhập *</label>
              <input type="date" required className="input w-full" value={form.ngay} onChange={(e) => setForm({ ...form, ngay: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Số lượng ({vt.dvt}) *</label>
              <input type="number" required min={1} className="input w-full" value={form.soLuong || ""} onChange={(e) => setForm({ ...form, soLuong: Number(e.target.value) })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1">Đơn giá (đ/{vt.dvt}) *</label>
              <input type="number" required min={0} className="input w-full" value={form.donGia} onChange={(e) => setForm({ ...form, donGia: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Thành tiền</label>
              <div className="input w-full bg-emerald-500/10 text-emerald-700 font-bold flex items-center">{thanhTien.toLocaleString()}đ</div>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Nguồn nhập (NCC) *</label>
            <select required className="input w-full" value={form.nguonNhap} onChange={(e) => setForm({ ...form, nguonNhap: e.target.value })}>
              <option value="">-- Chọn NCC --</option>
              {nccList.map((n) => <option key={n.maDT} value={n.tenDonVi}>{n.tenDonVi}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Người TH</label>
            <input className="input w-full" value={form.nguoiThucHien} onChange={(e) => setForm({ ...form, nguoiThucHien: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Ghi chú</label>
            <textarea className="input w-full min-h-[50px]" value={form.ghiChu} onChange={(e) => setForm({ ...form, ghiChu: e.target.value })} />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Huỷ</button>
            <button type="submit" className="btn-primary flex-1 bg-sky-500 hover:bg-sky-600">Xác nhận nhập</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PLXuatKho({ maVT, loai, onClose }: { maVT: string; loai: "vai" | "phu-lieu"; onClose: () => void }) {
  const { themGiaoDich, tinhTonKho } = useKho();
  const dsVT = loai === "vai" ? KHO_VAI : KHO_VAT_TU;
  const vt = dsVT.find((v) => v.maVT === maVT)!;
  const tonHienTai = tinhTonKho(maVT, loai);
  const [form, setForm] = useState({
    ngay: new Date().toISOString().split("T")[0],
    soLuong: 0,
    nguonNhap: "",
    nguoiThucHien: "Nguyễn Thị Mỹ Nhi",
    ghiChu: "",
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.soLuong <= 0) return toast.error("SL phải > 0");
    if (form.soLuong > tonHienTai) return toast.error(`Không đủ tồn! Còn ${tonHienTai.toFixed(1)} ${vt.dvt}`);
    themGiaoDich({ ...form, loai: "XUAT", maVT: vt.maVT, tenVT: vt.tenVT, donVi: vt.dvt, donGia: vt.donGia, thanhTien: form.soLuong * vt.donGia });
    toast.success(`Đã xuất ${form.soLuong.toLocaleString()} ${vt.dvt} ${vt.tenVT}`);
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="card max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2"><Minus className="w-5 h-5 text-amber-600" /> Xuất kho: {vt.tenVT}</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/40 rounded"><X className="w-5 h-5" /></button>
        </div>
        <div className="bg-amber-500/10 rounded p-2 mb-3 text-xs flex items-center gap-2">
          <Box className="w-4 h-4 text-amber-600" />
          <span><b>Tồn hiện tại:</b> <b className="text-amber-700">{tonHienTai.toFixed(1)} {vt.dvt}</b></span>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1">Ngày xuất *</label>
              <input type="date" required className="input w-full" value={form.ngay} onChange={(e) => setForm({ ...form, ngay: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Số lượng ({vt.dvt}) *</label>
              <input type="number" required min={1} max={tonHienTai} className="input w-full" value={form.soLuong || ""} onChange={(e) => setForm({ ...form, soLuong: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Mục đích xuất *</label>
            <select required className="input w-full" value={form.nguonNhap} onChange={(e) => setForm({ ...form, nguonNhap: e.target.value })}>
              <option value="">-- Chọn --</option>
              <optgroup label="Lệnh cắt">
                <option value="LC-M758 Bộ trụ 500 bộ">LC-M758 Bộ trụ 500 bộ</option>
                <option value="LC-M873 Áo trụ 546 áo">LC-M873 Áo trụ 546 áo</option>
              </optgroup>
              <optgroup label="Khác">
                <option value="Xuất mẫu">Xuất mẫu</option>
                <option value="Hao hụt">Hao hụt/hỏng</option>
                <option value="Điều chỉnh kho">Điều chỉnh kiểm kê</option>
              </optgroup>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Người TH</label>
            <input className="input w-full" value={form.nguoiThucHien} onChange={(e) => setForm({ ...form, nguoiThucHien: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Ghi chú</label>
            <textarea className="input w-full min-h-[50px]" value={form.ghiChu} onChange={(e) => setForm({ ...form, ghiChu: e.target.value })} />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Huỷ</button>
            <button type="submit" className="btn-primary flex-1 bg-amber-500 hover:bg-amber-600">Xác nhận xuất</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PLLichSu({ maVT, loai, onClose }: { maVT: string; loai: "vai" | "phu-lieu"; onClose: () => void }) {
  const { giaoDichTheoVT } = useKho();
  const dsVT = loai === "vai" ? KHO_VAI : KHO_VAT_TU;
  const vt = dsVT.find((v) => v.maVT === maVT)!;
  const ds = giaoDichTheoVT(maVT);
  const tongNhap = ds.filter((g) => g.loai === "NHAP").reduce((s, g) => s + g.soLuong, 0);
  const tongXuat = ds.filter((g) => g.loai === "XUAT").reduce((s, g) => s + g.soLuong, 0);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="card max-w-3xl w-full p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2"><History className="w-5 h-5 text-brand-500" /> Lịch sử: {vt.tenVT}</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/40 rounded"><X className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
          <div className="bg-sky-500/10 rounded p-2 text-center">
            <div className="text-xs opacity-70">Tổng nhập</div>
            <div className="font-bold text-sky-600">+{tongNhap.toFixed(0)} {vt.dvt}</div>
          </div>
          <div className="bg-amber-500/10 rounded p-2 text-center">
            <div className="text-xs opacity-70">Tổng xuất</div>
            <div className="font-bold text-amber-600">-{tongXuat.toFixed(0)} {vt.dvt}</div>
          </div>
          <div className="bg-emerald-500/10 rounded p-2 text-center">
            <div className="text-xs opacity-70">Tồn hiện tại</div>
            <div className="font-bold text-emerald-600">{(tongNhap - tongXuat).toFixed(0)} {vt.dvt}</div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b" style={{ borderColor: "var(--border)" }}>
                <th className="p-2">Ngày</th>
                <th className="p-2">Loại</th>
                <th className="p-2 text-right">SL</th>
                <th className="p-2 text-right">Đơn giá</th>
                <th className="p-2 text-right">Tiền</th>
                <th className="p-2">Mục đích</th>
                <th className="p-2">Người TH</th>
              </tr>
            </thead>
            <tbody>
              {ds.length === 0 ? (
                <tr><td colSpan={7} className="p-6 text-center opacity-60 text-sm">Chưa có giao dịch</td></tr>
              ) : ds.map((g) => (
                <tr key={g.id} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                  <td className="p-2 text-xs">{g.ngay}</td>
                  <td className="p-2">{g.loai === "NHAP" ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-700 font-semibold">+NHẬP</span> : <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 font-semibold">-XUẤT</span>}</td>
                  <td className="p-2 text-right font-mono font-semibold">{g.soLuong.toLocaleString()}</td>
                  <td className="p-2 text-right font-mono">{g.donGia.toLocaleString()}</td>
                  <td className="p-2 text-right font-mono text-emerald-600">{formatVNDShort(g.thanhTien)}</td>
                  <td className="p-2 text-xs">{g.nguonNhap || "—"}</td>
                  <td className="p-2 text-xs">{g.nguoiThucHien}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
