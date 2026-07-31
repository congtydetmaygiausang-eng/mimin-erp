"use client";

import { useState, useMemo } from "react";
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
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Boxes className="w-7 h-7 text-violet-500" />
            Kho phụ liệu
          </h1>
          <p className="opacity-70 mt-1 text-sm">
            {KHO_VAT_TU.length} mã phụ liệu · Tổng giá trị tồn <b className="text-emerald-600">{formatVNDShort(tongGiaTri)}</b>
            {dsCanhBao.length > 0 && <> · <b className="text-red-600">⚠️ {dsCanhBao.length} mã dưới tồn tối thiểu</b></>}
          </p>
        </div>
        <button onClick={() => { if (confirm("Reset?")) { reset(); toast.success("Đã reset"); } }} className="btn-ghost text-xs">Reset</button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="text-xs opacity-70 flex items-center gap-1"><Box className="w-3 h-3" /> Tổng tồn kho</div>
          <div className="text-2xl md:text-3xl font-bold mt-1">{KHO_VAT_TU.length} mã</div>
          <div className="text-xs opacity-60 mt-1">{Object.keys(dsTheoLoai).length} loại</div>
        </div>
        <div className="card p-5">
          <div className="text-xs opacity-70 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Giá trị tồn</div>
          <div className="text-2xl md:text-3xl font-bold mt-1 text-emerald-600">{formatVNDShort(tongGiaTri)}</div>
          <div className="text-xs opacity-60 mt-1">{formatVND(tongGiaTri)}</div>
        </div>
        <div className="card p-5">
          <div className="text-xs opacity-70 flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-600" /> Tổng nhập</div>
          <div className="text-2xl md:text-3xl font-bold mt-1 text-sky-600">{formatVNDShort(tongNhap)}</div>
        </div>
        <div className={`card p-5 ${dsCanhBao.length > 0 ? "bg-red-500/10 border-red-500/40" : ""}`}>
          <div className="text-xs opacity-70 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-red-600" /> Cảnh báo tồn
          </div>
          <div className={`text-2xl md:text-3xl font-bold mt-1 ${dsCanhBao.length > 0 ? "text-red-600" : "text-emerald-600"}`}>
            {dsCanhBao.length}
          </div>
          <div className="text-xs opacity-60 mt-1">mã dưới tối thiểu</div>
        </div>
      </div>

      {dsCanhBao.length > 0 && (
        <div className="card p-4 flex items-start gap-3 bg-red-500/10 border-red-500/40">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <b className="text-red-700 dark:text-red-400">⚠️ Cảnh báo tồn kho thấp:</b>{" "}
            {dsCanhBao.slice(0, 5).map((t) => {
              const vt = KHO_VAT_TU.find((v) => v.maVT === t.maVT);
              return `${vt?.tenVT} (còn ${t.tonKho.toFixed(0)})`;
            }).join(", ")}.
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="card p-1.5 inline-flex flex-wrap">
        {([
          { id: "tongquan" as Tab, label: `Tổng quan (${KHO_VAT_TU.length})` },
          { id: "nhap" as Tab, label: `Nhập kho (${giaoDich.filter((g) => g.loai === "NHAP" && KHO_VAT_TU.find((v) => v.maVT === g.maVT)).length})` },
          { id: "xuat" as Tab, label: `Xuất kho (${giaoDich.filter((g) => g.loai === "XUAT" && KHO_VAT_TU.find((v) => v.maVT === g.maVT)).length})` },
          { id: "lichsu" as Tab, label: "Lịch sử GD" },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === t.id ? "bg-brand-500 text-white shadow" : "hover:bg-white/40 dark:hover:bg-white/5"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

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
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b" style={{ borderColor: "var(--border)" }}>
                  <th className="p-3">Mã VT</th>
                  <th className="p-3">Tên phụ liệu</th>
                  <th className="p-3">Loại</th>
                  <th className="p-3 text-right">Đơn giá</th>
                  <th className="p-3 text-right">Tồn kho</th>
                  <th className="p-3 text-right">Tối thiểu</th>
                  <th className="p-3 text-right">Giá trị</th>
                  <th className="p-3 text-center">TT</th>
                  <th className="p-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredVT.map((v) => {
                  const tt = dsTrangThai.find((t) => t.maVT === v.maVT);
                  if (!tt) return null;
                  return (
                    <tr key={v.maVT} className={`border-b last:border-0 hover:bg-white/30 dark:hover:bg-white/5 ${tt.canhBao ? "bg-red-500/5" : ""}`} style={{ borderColor: "var(--border)" }}>
                      <td className="p-3 font-mono text-xs opacity-70">{v.maVT}</td>
                      <td className="p-3 font-medium">{v.tenVT}</td>
                      <td className="p-3 text-xs"><span className="px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-700 text-[10px]">{v.loai}</span></td>
                      <td className="p-3 text-right font-mono">{v.donGia.toLocaleString()}đ</td>
                      <td className="p-3 text-right font-mono font-semibold">{tt.tonKho.toFixed(0)} {v.dvt}</td>
                      <td className="p-3 text-right text-xs opacity-60">{v.tonToiThieu.toFixed(0)} {v.dvt}</td>
                      <td className="p-3 text-right font-mono text-emerald-600">{formatVNDShort(tt.giaTriTon)}</td>
                      <td className="p-3 text-center">
                        {tt.canhBao ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-700 font-semibold inline-flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" /> Thấp</span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 font-medium inline-flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3" /> OK</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setShowNhap(v.maVT)} className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-700 hover:bg-sky-500/25 flex items-center gap-0.5"><Plus className="w-3 h-3" /> Nhập</button>
                          <button onClick={() => setShowXuat(v.maVT)} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 flex items-center gap-0.5"><Minus className="w-3 h-3" /> Xuất</button>
                          <button onClick={() => setShowHistory(v.maVT)} className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/15 text-brand-700 hover:bg-brand-500/25"><History className="w-3 h-3" /></button>
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
