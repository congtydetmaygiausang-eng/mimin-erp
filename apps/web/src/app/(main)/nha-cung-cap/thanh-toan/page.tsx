"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  CreditCard,
  Plus,
  Search,
  X,
  Calendar,
  DollarSign,
  TrendingUp,
  Building2,
  FileText,
  CheckCircle2,
  Wallet,
  Receipt,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import { formatVND, formatVNDShort } from "@/lib/data/real-data";
import { useSupplierRelations, EmptyRelationState } from "../supplier-relations";
import { DataViewToggle, type ViewMode } from "@/components/DataViewToggle";

export default function ThanhToanPage() {
  const { suppliers, payments, addPayment } = useSupplierRelations();
  const searchParams = useSearchParams();
  const paramMaNcc = searchParams?.get("maNcc") || "";

  const [search, setSearch] = useState("");
  const [filterMethod, setFilterMethod] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [form, setForm] = useState({
    maNcc: paramMaNcc || (suppliers[0]?.ma_ncc || ""),
    soTien: 0,
    ngay: new Date().toISOString().slice(0, 10),
    phuongThuc: "Chuyển khoản",
    maChungTu: "",
    ghiChu: "",
  });

  useEffect(() => {
    if (paramMaNcc) {
      setForm((prev) => ({ ...prev, maNcc: paramMaNcc }));
      setShowModal(true);
    }
  }, [paramMaNcc]);

  // Thống kê
  const stats = useMemo(() => {
    const totalPaid = payments.reduce((sum, p) => sum + (p.soTien || 0), 0);
    const totalVouchers = payments.length;
    const uniqueSuppliers = new Set(payments.map((p) => p.maNcc)).size;
    const transferCount = payments.filter((p) => p.phuongThuc === "Chuyển khoản").length;
    return { totalPaid, totalVouchers, uniqueSuppliers, transferCount };
  }, [payments]);

  // Danh sách lọc
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return payments.filter((p) => {
      const sup = suppliers.find((s) => s.ma_ncc === p.maNcc);
      const supName = (sup?.ten_ncc || "").toLowerCase();

      const matchQ =
        !q ||
        p.maNcc.toLowerCase().includes(q) ||
        supName.includes(q) ||
        (p.maChungTu || "").toLowerCase().includes(q) ||
        (p.ghiChu || "").toLowerCase().includes(q);

      const matchM = filterMethod === "ALL" || p.phuongThuc === filterMethod;
      return matchQ && matchM;
    });
  }, [payments, suppliers, search, filterMethod]);

  // Submit phiếu thanh toán
  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.maNcc) return toast.error("Vui lòng chọn nhà cung cấp");
    if (!form.soTien || form.soTien <= 0) return toast.error("Vui lòng nhập số tiền thanh toán hợp lệ");

    const code = form.maChungTu || `UNC-${Date.now().toString().slice(-6)}`;
    addPayment({
      maNcc: form.maNcc,
      ngay: form.ngay,
      soTien: Number(form.soTien),
      phuongThuc: form.phuongThuc,
      maChungTu: code,
      ghiChu: form.ghiChu || "Thanh toán tiền hàng NCC",
    });

    toast.success(`Đã lập phiếu thanh toán ${formatVND(form.soTien)} cho ${form.maNcc}`);
    setShowModal(false);
    setForm({
      maNcc: suppliers[0]?.ma_ncc || "",
      soTien: 0,
      ngay: new Date().toISOString().slice(0, 10),
      phuongThuc: "Chuyển khoản",
      maChungTu: "",
      ghiChu: "",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 w-full max-w-full overflow-x-hidden">
      {/* 1. HERO COMMAND BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-white via-teal-50/70 to-emerald-50/80 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6 md:p-7 shadow-sm border border-teal-200/90 dark:border-teal-800/80 group">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300 border border-teal-200 dark:border-teal-800 shadow-2xs">
              <CreditCard className="w-3.5 h-3.5 text-teal-600" />
              Sổ Quản Lý Thanh Toán & Chi Trả Công Nợ NCC
            </span>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-teal-500/25">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Thanh Toán Nhà Cung Cấp
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                  Lập phiếu chi, ủy nhiệm chi ngân hàng, đối soát các đợt thanh toán tiền vải & phụ liệu
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 shadow-2xs">
                💰 Đã thanh toán: {formatVND(stats.totalPaid)}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 shadow-2xs">
                📄 {stats.totalVouchers} phiếu thanh toán
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 shadow-2xs">
                🏢 {stats.uniqueSuppliers} NCC đã nhận tiền
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 transition active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Lập Phiếu Thanh Toán Mới
          </button>
        </div>
      </div>

      {/* 2. DASHBOARD 4 KPI THANH TOÁN */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-white dark:to-slate-900 border border-emerald-300/80 dark:border-emerald-800/80 rounded-3xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">Tổng Đã Chi Trả</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono tracking-tight text-emerald-700 dark:text-emerald-400 mt-2 tabular-nums">
            {formatVNDShort(stats.totalPaid)}
          </div>
          <div className="text-xs text-slate-500 mt-1 truncate">{formatVND(stats.totalPaid)}</div>
        </div>

        <div className="card p-5 bg-gradient-to-br from-teal-500/10 via-cyan-500/5 to-white dark:to-slate-900 border border-teal-300/80 dark:border-teal-800/80 rounded-3xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wide">Phiếu Thanh Toán</span>
            <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-700 dark:text-teal-300 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono tracking-tight text-teal-700 dark:text-teal-400 mt-2 tabular-nums">
            {stats.totalVouchers} <span className="text-sm font-bold text-slate-500 font-sans">phiếu</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">Đã hoàn tất chuyển tiền</div>
        </div>

        <div className="card p-5 bg-gradient-to-br from-sky-500/10 via-indigo-500/5 to-white dark:to-slate-900 border border-sky-300/80 dark:border-sky-800/80 rounded-3xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-800 dark:text-sky-300 uppercase tracking-wide">NCC Đã Nhận</span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-700 dark:text-sky-300 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono tracking-tight text-sky-700 dark:text-sky-400 mt-2 tabular-nums">
            {stats.uniqueSuppliers} <span className="text-sm font-bold text-slate-500 font-sans">đối tác</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">Được giải ngân thanh toán</div>
        </div>

        <div className="card p-5 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-white dark:to-slate-900 border border-indigo-300/80 dark:border-indigo-800/80 rounded-3xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wide">Chuyển Khoản</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono tracking-tight text-indigo-700 dark:text-indigo-400 mt-2 tabular-nums">
            {stats.transferCount} <span className="text-sm font-bold text-slate-500 font-sans">lần</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">Ủy nhiệm chi ngân hàng</div>
        </div>
      </div>

      {/* 3. TÌM KIẾM & BỘ LỌC PHIẾU THANH TOÁN */}
      <div className="card p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xs space-y-3.5">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600" />
          <input
            className="w-full pl-11 pr-10 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="Tìm theo mã NCC, tên nhà cung cấp, mã chứng từ UNC, nội dung chuyển khoản..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: "ALL", label: "Tất cả phương thức" },
              { id: "Chuyển khoản", label: "Chuyển khoản ngân hàng" },
              { id: "Tiền mặt", label: "Tiền mặt trực tiếp" },
            ].map((tab) => {
              const active = filterMethod === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterMethod(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    active
                      ? "bg-teal-600 text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500">
              Hiển thị: <b className="text-teal-700 font-mono">{filtered.length}</b> phiếu
            </span>
            <DataViewToggle onChange={setViewMode} />
          </div>
        </div>
      </div>

      {/* 4. HIỂN THỊ DANH SÁCH THANH TOÁN */}
      {filtered.length === 0 ? (
        <EmptyRelationState>
          Chưa có phiếu thanh toán nào phù hợp. Bấm “Lập Phiếu Thanh Toán Mới” để tạo phiếu đầu tiên.
        </EmptyRelationState>
      ) : viewMode === "table" ? (
        <div className="card bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold bg-slate-50/80 dark:bg-slate-800/60">
                  <th className="py-3 px-4">NGÀY CHI</th>
                  <th className="py-3 px-4">MÃ CHỨNG TỪ</th>
                  <th className="py-3 px-4">NHÀ CUNG CẤP</th>
                  <th className="py-3 px-4">PHƯƠNG THỨC</th>
                  <th className="py-3 px-4 text-right">SỐ TIỀN THANH TOÁN</th>
                  <th className="py-3 px-4">GHI CHÚ NỘI DUNG</th>
                  <th className="py-3 px-4 text-center">TRẠNG THÁI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((p) => {
                  const sup = suppliers.find((s) => s.ma_ncc === p.maNcc);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-500">{p.ngay}</td>
                      <td className="py-3 px-4 font-mono font-bold text-teal-600">{p.maChungTu || p.id}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{sup?.ten_ncc || p.maNcc}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{p.maNcc}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-medium text-[11px]">
                          {p.phuongThuc}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm tabular-nums">
                        {formatVND(p.soTien)}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-[200px] truncate">
                        {p.ghiChu || "Thanh toán công nợ"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Thành công
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const sup = suppliers.find((s) => s.ma_ncc === p.maNcc);
            return (
              <div
                key={p.id}
                className="card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-teal-600">{p.maChungTu || p.id}</span>
                    <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Thành công
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1.5">{sup?.ten_ncc || p.maNcc}</h3>
                  <div className="text-xs text-slate-500 font-medium">Mã NCC: <b className="font-mono">{p.maNcc}</b></div>

                  <div className="mt-3 p-3 rounded-2xl bg-emerald-50/50 dark:bg-slate-800/60 border border-emerald-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Số tiền chi:</span>
                    <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-base tabular-nums">
                      {formatVND(p.soTien)}
                    </span>
                  </div>

                  {p.ghiChu && <div className="text-xs text-slate-500 mt-2 line-clamp-2">{p.ghiChu}</div>}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>{p.phuongThuc}</span>
                  <span className="font-mono">{p.ngay}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. MODAL LẬP PHIẾU THANH TOÁN */}
      {showModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/15 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Lập Phiếu Thanh Toán NCC</h3>
                  <p className="text-xs text-slate-500">Ghi nhận chi trả tiền hàng / ủy nhiệm chi ngân hàng</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nhà cung cấp thụ hưởng *
                </label>
                <select
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  value={form.maNcc}
                  onChange={(e) => setForm({ ...form, maNcc: e.target.value })}
                >
                  {suppliers.map((s) => (
                    <option key={s.ma_ncc} value={s.ma_ncc}>
                      {s.ma_ncc} — {s.ten_ncc} (Nợ: {formatVNDShort(s.cong_no || 0)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Số tiền thanh toán (đ) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1000}
                    step={1000}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono font-bold text-emerald-600 focus:ring-2 focus:ring-teal-500"
                    value={form.soTien || ""}
                    onChange={(e) => setForm({ ...form, soTien: Number(e.target.value) })}
                    placeholder="VD: 15000000"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Ngày chi *</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                    value={form.ngay}
                    onChange={(e) => setForm({ ...form, ngay: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Phương thức thanh toán
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                    value={form.phuongThuc}
                    onChange={(e) => setForm({ ...form, phuongThuc: e.target.value })}
                  >
                    <option value="Chuyển khoản">Chuyển khoản ngân hàng</option>
                    <option value="Tiền mặt">Tiền mặt</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Mã chứng từ / Số UNC
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono focus:ring-2 focus:ring-teal-500"
                    value={form.maChungTu}
                    onChange={(e) => setForm({ ...form, maChungTu: e.target.value })}
                    placeholder="VD: UNC-VCB-8839"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Nội dung ghi chú</label>
                <textarea
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-teal-500 min-h-[60px]"
                  value={form.ghiChu}
                  onChange={(e) => setForm({ ...form, ghiChu: e.target.value })}
                  placeholder="Ghi chú chi trả lô vải nào, hóa đơn nào..."
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-1/3 py-2.5 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 rounded-xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs shadow-md shadow-teal-600/25 transition cursor-pointer"
                >
                  Xác Nhận Thanh Toán
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
