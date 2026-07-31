"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Wallet,
  AlertCircle,
  TrendingUp,
  Users,
  Scissors,
  Search,
  Phone,
  Clock,
  Plus,
  CreditCard,
  Download,
  X,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import {
  usePhanCong,
  exportCongNoExcel,
  layDanhSachNguoiPT,
  type PhanCongCongDoan,
  type CongDoanKey,
  type NguoiPhuTrach,
} from "@/lib/data/cong-no-store";
import { tinhCongNo, congNoTheoNguoi, congNoTheoCongDoan } from "@/lib/data/cong-no";
import { formatVND, formatVNDShort } from "@/lib/data/real-data";

type StatusFilter = "all" | "Chờ giao" | "Đang làm" | "Hoàn thành" | "Đã thanh toán";
type NguoiFilter = "all" | "Đối tác gia công" | "Nhân viên nội bộ";

const STATUS_STYLE: Record<PhanCongCongDoan["trangThai"], { color: string; bg: string }> = {
  "Chờ giao": { color: "text-slate-700 dark:text-slate-300", bg: "bg-slate-500/15" },
  "Đang làm": { color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-500/15" },
  "Hoàn thành": { color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-500/15" },
  "Đã thanh toán": { color: "text-sky-700 dark:text-sky-400", bg: "bg-sky-500/15" },
};

const CONG_DOAN_OPTIONS: CongDoanKey[] = ["Cắt", "Thêu", "In", "May áo", "May quần", "Ủi/Đóng gói"];

export default function CongNoPage() {
  const { phanCong, themThanhToan, themPhanCong, reset, isLate } = usePhanCong();

  const [tab, setTab] = useState<"all" | "theo-nguoi" | "theo-cong-doan" | "theo-lenh" | "tre-han">("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [nguoiFilter, setNguoiFilter] = useState<NguoiFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedLenh, setSelectedLenh] = useState<string | null>(null);

  // Modals
  const [showModalTT, setShowModalTT] = useState<PhanCongCongDoan | null>(null);
  const [showModalPC, setShowModalPC] = useState(false);

  // KPIs
  const tong = tinhCongNo(phanCong);
  const dsChoGiao = phanCong.filter((p) => p.trangThai === "Chờ giao");
  const dsDangLam = phanCong.filter((p) => p.trangThai === "Đang làm");
  const dsDaThanhToan = phanCong.filter((p) => p.trangThai === "Đã thanh toán");
  const dsHoanThanhChuaTT = phanCong.filter((p) => p.trangThai === "Hoàn thành" && p.daThanhToan < p.donGiaGiao * p.soLuongGiao);
  const dsTreHan = phanCong.filter((p) => isLate(p));

  // Filtered list
  const filtered = useMemo(() => {
    return phanCong.filter((p) => {
      const matchSearch = [p.nguoiPhuTrach.ten, p.nguoiPhuTrach.ma, p.lenhCatId, p.congDoan].some((x) =>
        x.toLowerCase().includes(search.toLowerCase())
      );
      const matchStatus = statusFilter === "all" || p.trangThai === statusFilter;
      const matchNguoi = nguoiFilter === "all" || p.nguoiPhuTrach.loai === nguoiFilter;
      return matchSearch && matchStatus && matchNguoi;
    });
  }, [phanCong, search, statusFilter, nguoiFilter]);

  const handleExport = () => {
    exportCongNoExcel(phanCong, "CongNoCongDoan_MIMIN");
    toast.success("Đã xuất Excel công nợ!");
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Wallet className="w-7 h-7 text-brand-500" />
            Công nợ công đoạn
          </h1>
          <p className="opacity-70 mt-1 text-sm">
            {phanCong.length} phân công · Tổng thành tiền <b>{formatVNDShort(tong.tongThanhTien)}</b> · Đã thanh toán <b className="text-emerald-600">{formatVNDShort(tong.tongDaThanhToan)}</b> · <b className="text-red-600">Còn nợ {formatVNDShort(tong.tongConNo)}</b>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowModalPC(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Tạo phân công
          </button>
          <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" /> Xuất Excel
          </button>
          <button
            onClick={() => {
              if (confirm("Reset về data mặc định?")) {
                reset();
                toast.success("Đã reset data");
              }
            }}
            className="btn-ghost text-xs"
            title="Reset data"
          >
            Reset
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="text-xs opacity-70">Tổng công nợ</div>
          <div className="text-2xl md:text-3xl font-bold mt-1 text-red-600">{formatVNDShort(tong.tongConNo)}</div>
          <div className="text-xs opacity-60 mt-1">{formatVND(tong.tongConNo)}</div>
        </div>
        <div className="card p-5">
          <div className="text-xs opacity-70">Đã thanh toán</div>
          <div className="text-2xl md:text-3xl font-bold mt-1 text-emerald-600">{formatVNDShort(tong.tongDaThanhToan)}</div>
          <div className="text-xs opacity-60 mt-1">{((tong.tongDaThanhToan / tong.tongThanhTien) * 100).toFixed(0)}% tổng</div>
        </div>
        <div className="card p-5">
          <div className="text-xs opacity-70">Đang làm</div>
          <div className="text-2xl md:text-3xl font-bold mt-1 text-amber-600">{dsDangLam.length}</div>
          <div className="text-xs opacity-60 mt-1">công đoạn đang chạy</div>
        </div>
        <div className={`card p-5 ${dsTreHan.length > 0 ? "bg-red-500/10 border-red-500/40" : ""}`}>
          <div className="text-xs opacity-70 flex items-center gap-1">
            Trễ hạn {dsTreHan.length > 0 && <AlertTriangle className="w-3 h-3 text-red-600" />}
          </div>
          <div className={`text-2xl md:text-3xl font-bold mt-1 ${dsTreHan.length > 0 ? "text-red-600" : "text-emerald-600"}`}>
            {dsTreHan.length}
          </div>
          <div className="text-xs opacity-60 mt-1">công đoạn cần xử lý</div>
        </div>
      </div>

      {dsDangLam.length > 0 && (
        <div className="card p-4 flex items-start gap-3 bg-amber-500/10 border-amber-500/30">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <b className="text-amber-700 dark:text-amber-400">Đang có {dsDangLam.length} công đoạn đang chạy:</b>{" "}
            {dsDangLam.map((p) => `${p.congDoan} - ${p.nguoiPhuTrach.ten.split(" (")[0]}`).join(", ")}.
            Cần theo dõi tiến độ giao hàng.
          </div>
        </div>
      )}

      {dsTreHan.length > 0 && (
        <div className="card p-4 flex items-start gap-3 bg-red-500/10 border-red-500/40">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <b className="text-red-700 dark:text-red-400">⚠️ Có {dsTreHan.length} công đoạn trễ hạn deadline:</b>{" "}
            {dsTreHan.map((p) => `${p.congDoan} - ${p.nguoiPhuTrach.ten.split(" (")[0]}`).join(", ")}.
            Cần liên hệ gấp!
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="card p-1.5 inline-flex flex-wrap">
        {([
          { id: "all" as const, label: `Tất cả (${phanCong.length})` },
          { id: "theo-nguoi" as const, label: `Theo người PT (${congNoTheoNguoi(phanCong).length})` },
          { id: "theo-cong-doan" as const, label: `Theo công đoạn (${congNoTheoCongDoan(phanCong).length})` },
          { id: "theo-lenh" as const, label: "Theo lệnh cắt" },
          { id: "tre-han" as const, label: `Trễ hạn (${dsTreHan.length})`, danger: dsTreHan.length > 0 },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === t.id
                ? t.danger
                  ? "bg-red-500 text-white shadow"
                  : "bg-brand-500 text-white shadow"
                : t.danger
                ? "hover:bg-red-500/10 text-red-600"
                : "hover:bg-white/40 dark:hover:bg-white/5"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "all" && (
        <>
          <div className="card p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs opacity-60">Trạng thái:</span>
              {([
                { id: "all" as StatusFilter, label: `Tất cả (${phanCong.length})` },
                { id: "Chờ giao" as StatusFilter, label: `Chờ giao (${dsChoGiao.length})` },
                { id: "Đang làm" as StatusFilter, label: `Đang làm (${dsDangLam.length})` },
                { id: "Hoàn thành" as StatusFilter, label: `Hoàn thành (${phanCong.filter(p => p.trangThai === "Hoàn thành").length})` },
                { id: "Đã thanh toán" as StatusFilter, label: `Đã TT (${dsDaThanhToan.length})` },
              ]).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-2.5 py-1 rounded text-xs ${
                    statusFilter === f.id ? "bg-brand-500 text-white" : "bg-white/40 dark:bg-white/5 hover:bg-white/60"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs opacity-60">Người PT:</span>
              {([
                { id: "all" as NguoiFilter, label: "Tất cả" },
                { id: "Đối tác gia công" as NguoiFilter, label: "Đối tác" },
                { id: "Nhân viên nội bộ" as NguoiFilter, label: "Nội bộ" },
              ]).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setNguoiFilter(f.id)}
                  className={`px-2.5 py-1 rounded text-xs ${
                    nguoiFilter === f.id ? "bg-brand-500 text-white" : "bg-white/40 dark:bg-white/5 hover:bg-white/60"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
              <input
                className="input pl-9"
                placeholder="Tìm theo tên, mã, lệnh cắt…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b" style={{ borderColor: "var(--border)" }}>
                    <th className="p-3">Mã PC</th>
                    <th className="p-3">Lệnh cắt</th>
                    <th className="p-3">Công đoạn</th>
                    <th className="p-3">Người phụ trách</th>
                    <th className="p-3">Loại</th>
                    <th className="p-3 text-right">SL</th>
                    <th className="p-3 text-right">Đơn giá</th>
                    <th className="p-3 text-right">Thành tiền</th>
                    <th className="p-3 text-right">Đã TT</th>
                    <th className="p-3 text-right">Còn nợ</th>
                    <th className="p-3">Trạng thái</th>
                    <th className="p-3 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const thanhTien = p.donGiaGiao * p.soLuongGiao;
                    const conNo = thanhTien - p.daThanhToan;
                    const s = STATUS_STYLE[p.trangThai];
                    const late = isLate(p);
                    return (
                      <tr
                        key={p.id}
                        className={`border-b last:border-0 hover:bg-white/30 dark:hover:bg-white/5 ${
                          late ? "bg-red-500/5" : ""
                        }`}
                        style={{ borderColor: "var(--border)" }}
                      >
                        <td className="p-3 font-mono text-xs opacity-70">{p.id}</td>
                        <td className="p-3 font-mono text-xs text-brand-600 font-semibold">
                          <Link href={`/lenh-cat?id=${p.lenhCatId}`} className="hover:underline">
                            {p.lenhCatId}
                          </Link>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-brand-500/15 text-brand-700 dark:text-brand-300 text-xs font-medium">
                            {p.congDoan}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="text-xs">
                            <div className="font-medium flex items-center gap-1">
                              {p.nguoiPhuTrach.ten.split(" (")[0]}
                              {late && <AlertTriangle className="w-3 h-3 text-red-600" />}
                            </div>
                            <div className="text-[10px] opacity-60 font-mono">{p.nguoiPhuTrach.ma}</div>
                          </div>
                        </td>
                        <td className="p-3 text-xs">
                          {p.nguoiPhuTrach.loai === "Đối tác gia công" ? "Đối tác" : "Nội bộ"}
                        </td>
                        <td className="p-3 text-right">{p.soLuongGiao.toLocaleString()} {p.donVi}</td>
                        <td className="p-3 text-right font-mono">{p.donGiaGiao.toLocaleString()}</td>
                        <td className="p-3 text-right font-mono font-semibold">{thanhTien.toLocaleString()}</td>
                        <td className="p-3 text-right font-mono text-emerald-600">{p.daThanhToan.toLocaleString()}</td>
                        <td className="p-3 text-right font-mono font-semibold text-red-600">
                          {conNo > 0 ? conNo.toLocaleString() : "✓"}
                        </td>
                        <td className="p-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${s.bg} ${s.color}`}>
                            {p.trangThai}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {conNo > 0 && (
                            <button
                              onClick={() => setShowModalTT(p)}
                              className="text-xs px-2 py-1 rounded bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 flex items-center gap-1 mx-auto"
                              title="Tạo thanh toán"
                            >
                              <CreditCard className="w-3 h-3" /> Trả
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-brand-500/10 font-bold">
                    <td colSpan={7} className="p-3 text-right">TỔNG</td>
                    <td className="p-3 text-right">{formatVNDShort(tong.tongThanhTien)}</td>
                    <td className="p-3 text-right text-emerald-600">{formatVNDShort(tong.tongDaThanhToan)}</td>
                    <td className="p-3 text-right text-red-600">{formatVNDShort(tong.tongConNo)}</td>
                    <td colSpan={2} className="p-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === "theo-nguoi" && <BangTheoNguoi phanCong={phanCong} />}
      {tab === "theo-cong-doan" && <BangTheoCongDoan phanCong={phanCong} />}
      {tab === "theo-lenh" && <BangTheoLenhCat phanCong={phanCong} onSelect={setSelectedLenh} />}
      {tab === "tre-han" && <BangTreHan phanCong={dsTreHan} onThanhToan={setShowModalTT} isLate={isLate} />}

      {selectedLenh && (
        <ModalLenhCat
          lenhCatId={selectedLenh}
          onClose={() => setSelectedLenh(null)}
          onThanhToan={setShowModalTT}
          isLate={isLate}
        />
      )}

      {showModalTT && (
        <ModalThanhToan
          pc={showModalTT}
          onClose={() => setShowModalTT(null)}
          onSubmit={(soTien, ghiChu) => {
            themThanhToan(showModalTT.id, soTien, ghiChu);
            toast.success(`Đã trả ${soTien.toLocaleString()}đ cho ${showModalTT.nguoiPhuTrach.ten.split(" (")[0]}`);
            setShowModalTT(null);
          }}
        />
      )}

      {showModalPC && <ModalPhanCongMoi onClose={() => setShowModalPC(false)} onSubmit={(pc) => {
        themPhanCong(pc);
        toast.success(`Đã tạo phân công mới cho ${pc.nguoiPhuTrach.ten.split(" - ")[0]}`);
        setShowModalPC(false);
      }} />}
    </div>
  );
}

function BangTheoNguoi({ phanCong }: { phanCong: PhanCongCongDoan[] }) {
  const data = congNoTheoNguoi(phanCong);
  const tongNo = data.reduce((s, x) => s + x.conNo, 0);
  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
        <h3 className="font-semibold flex items-center gap-2">
          <Users className="w-4 h-4 text-brand-500" />
          Công nợ theo người phụ trách ({data.length} người)
        </h3>
        <div className="text-xs opacity-70 mt-1">Tổng còn nợ: <b className="text-red-600">{formatVND(tongNo)}</b></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b" style={{ borderColor: "var(--border)" }}>
              <th className="p-3">Mã</th>
              <th className="p-3">Tên</th>
              <th className="p-3">Loại</th>
              <th className="p-3 text-center">Số PC</th>
              <th className="p-3 text-right">Thành tiền</th>
              <th className="p-3 text-right">Đã TT</th>
              <th className="p-3 text-right">Còn nợ</th>
              <th className="p-3 text-center">% Đã TT</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => {
              const pct = d.thanhTien > 0 ? (d.daThanhToan / d.thanhTien) * 100 : 0;
              return (
                <tr key={d.nguoi.ma} className="border-b last:border-0 hover:bg-white/30 dark:hover:bg-white/5" style={{ borderColor: "var(--border)" }}>
                  <td className="p-3 font-mono text-xs text-brand-600 font-semibold">{d.nguoi.ma}</td>
                  <td className="p-3">
                    <div className="font-medium">{d.nguoi.ten.split(" (")[0]}</div>
                    {d.nguoi.sdt && (
                      <div className="text-[10px] opacity-60 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {d.nguoi.sdt}
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    {d.nguoi.loai === "Đối tác gia công" ? (
                      <span className="px-2 py-0.5 rounded bg-violet-500/15 text-violet-700 text-xs">Đối tác</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-sky-500/15 text-sky-700 text-xs">Nội bộ</span>
                    )}
                  </td>
                  <td className="p-3 text-center font-mono">{d.soPC}</td>
                  <td className="p-3 text-right font-mono">{d.thanhTien.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono text-emerald-600">{d.daThanhToan.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono font-semibold text-red-600">{d.conNo.toLocaleString()}</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-white/40 dark:bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] opacity-60 w-10 text-right">{pct.toFixed(0)}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BangTheoCongDoan({ phanCong }: { phanCong: PhanCongCongDoan[] }) {
  const data = congNoTheoCongDoan(phanCong);
  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
        <h3 className="font-semibold flex items-center gap-2">
          <Scissors className="w-4 h-4 text-brand-500" />
          Công nợ theo công đoạn
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b" style={{ borderColor: "var(--border)" }}>
              <th className="p-3">Công đoạn</th>
              <th className="p-3 text-center">Số PC</th>
              <th className="p-3 text-right">Tổng SL</th>
              <th className="p-3 text-right">Thành tiền</th>
              <th className="p-3 text-right">Đã TT</th>
              <th className="p-3 text-right">Còn nợ</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.congDoan} className="border-b last:border-0 hover:bg-white/30 dark:hover:bg-white/5" style={{ borderColor: "var(--border)" }}>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded bg-brand-500/15 text-brand-700 text-xs font-medium">{d.congDoan}</span>
                </td>
                <td className="p-3 text-center font-mono">{phanCong.filter(p => p.congDoan === d.congDoan).length}</td>
                <td className="p-3 text-right font-mono">{d.soLuong.toLocaleString()}</td>
                <td className="p-3 text-right font-mono">{d.thanhTien.toLocaleString()}</td>
                <td className="p-3 text-right font-mono text-emerald-600">{d.daThanhToan.toLocaleString()}</td>
                <td className="p-3 text-right font-mono font-semibold text-red-600">{d.conNo.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BangTheoLenhCat({ phanCong, onSelect }: { phanCong: PhanCongCongDoan[]; onSelect: (id: string) => void }) {
  const grouped: Record<string, { lenhCatId: string; phanCong: PhanCongCongDoan[] }> = {};
  for (const p of phanCong) {
    if (!grouped[p.lenhCatId]) grouped[p.lenhCatId] = { lenhCatId: p.lenhCatId, phanCong: [] };
    grouped[p.lenhCatId].phanCong.push(p);
  }
  return (
    <div className="space-y-4">
      {Object.values(grouped).map((g) => {
        const t = tinhCongNo(g.phanCong);
        return (
          <div key={g.lenhCatId} className="card overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
              <div>
                <div className="text-xs text-brand-600 font-mono">{g.lenhCatId}</div>
                <div className="text-sm font-semibold mt-0.5">{g.phanCong.length} công đoạn</div>
              </div>
              <div className="text-right">
                <div className="text-xs opacity-60">Tổng còn nợ</div>
                <div className="text-lg font-bold text-red-600">{formatVND(t.tongConNo)}</div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b bg-white/30 dark:bg-white/5" style={{ borderColor: "var(--border)" }}>
                    <th className="p-3">Công đoạn</th>
                    <th className="p-3">Người PT</th>
                    <th className="p-3 text-right">SL</th>
                    <th className="p-3 text-right">Đơn giá</th>
                    <th className="p-3 text-right">Thành tiền</th>
                    <th className="p-3 text-right">Đã TT</th>
                    <th className="p-3 text-right">Còn nợ</th>
                    <th className="p-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {g.phanCong.map((p) => {
                    const tt = p.donGiaGiao * p.soLuongGiao;
                    const cn = tt - p.daThanhToan;
                    const s = STATUS_STYLE[p.trangThai];
                    return (
                      <tr key={p.id} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                        <td className="p-3 text-xs">{p.congDoan}</td>
                        <td className="p-3 text-xs">
                          <div className="font-medium">{p.nguoiPhuTrach.ten.split(" (")[0]}</div>
                          <div className="text-[10px] opacity-60 font-mono">{p.nguoiPhuTrach.ma}</div>
                        </td>
                        <td className="p-3 text-right text-xs">{p.soLuongGiao.toLocaleString()}</td>
                        <td className="p-3 text-right text-xs font-mono">{p.donGiaGiao.toLocaleString()}</td>
                        <td className="p-3 text-right text-xs font-mono">{tt.toLocaleString()}</td>
                        <td className="p-3 text-right text-xs font-mono text-emerald-600">{p.daThanhToan.toLocaleString()}</td>
                        <td className="p-3 text-right text-xs font-mono font-semibold text-red-600">{cn > 0 ? cn.toLocaleString() : "✓"}</td>
                        <td className="p-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] ${s.bg} ${s.color}`}>
                            {p.trangThai}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BangTreHan({ phanCong, onThanhToan, isLate }: { phanCong: PhanCongCongDoan[]; onThanhToan: (p: PhanCongCongDoan) => void; isLate: (p: PhanCongCongDoan) => boolean }) {
  if (phanCong.length === 0) {
    return (
      <div className="card p-12 text-center">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
        <div className="text-lg font-semibold text-emerald-600">Tuyệt vời! Không có công đoạn nào trễ hạn</div>
        <div className="text-sm opacity-70 mt-1">Tất cả các công đoạn đều đang đúng tiến độ</div>
      </div>
    );
  }
  return (
    <div className="card overflow-hidden border-red-500/40">
      <div className="p-4 border-b bg-red-500/10 flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
        <AlertTriangle className="w-5 h-5 text-red-600" />
        <h3 className="font-semibold text-red-700 dark:text-red-400">
          Công đoạn trễ hạn deadline ({phanCong.length})
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b" style={{ borderColor: "var(--border)" }}>
              <th className="p-3">Lệnh cắt</th>
              <th className="p-3">Công đoạn</th>
              <th className="p-3">Người PT</th>
              <th className="p-3">SĐT</th>
              <th className="p-3 text-right">Thành tiền</th>
              <th className="p-3 text-right">Còn nợ</th>
              <th className="p-3">Deadline</th>
              <th className="p-3 text-center">Trễ</th>
              <th className="p-3 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {phanCong.map((p) => {
              const tt = p.donGiaGiao * p.soLuongGiao;
              const cn = tt - p.daThanhToan;
              const today = new Date();
              const deadline = new Date(p.ngayXongDuKien);
              const soNgayTre = Math.floor((today.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24));
              return (
                <tr key={p.id} className="border-b last:border-0 bg-red-500/5" style={{ borderColor: "var(--border)" }}>
                  <td className="p-3 font-mono text-xs text-brand-600 font-semibold">{p.lenhCatId}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-red-500/15 text-red-700 text-xs font-medium">{p.congDoan}</span>
                  </td>
                  <td className="p-3 text-xs font-medium">{p.nguoiPhuTrach.ten.split(" (")[0]}</td>
                  <td className="p-3 text-xs">
                    {p.nguoiPhuTrach.sdt && (
                      <a href={`tel:${p.nguoiPhuTrach.sdt}`} className="flex items-center gap-1 text-brand-600 hover:underline">
                        <Phone className="w-3 h-3" /> {p.nguoiPhuTrach.sdt}
                      </a>
                    )}
                  </td>
                  <td className="p-3 text-right font-mono">{tt.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono font-semibold text-red-600">{cn.toLocaleString()}</td>
                  <td className="p-3 text-xs text-red-600 font-medium">{p.ngayXongDuKien}</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded bg-red-500 text-white text-xs font-bold">-{soNgayTre} ngày</span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex flex-col gap-1">
                      {p.nguoiPhuTrach.sdt && (
                        <a
                          href={`tel:${p.nguoiPhuTrach.sdt}`}
                          className="text-xs px-2 py-1 rounded bg-blue-500/15 text-blue-700 hover:bg-blue-500/25"
                        >
                          📞 Gọi
                        </a>
                      )}
                      {cn > 0 && (
                        <button
                          onClick={() => onThanhToan(p)}
                          className="text-xs px-2 py-1 rounded bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25"
                        >
                          💰 Trả
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ MODALS ============

function ModalThanhToan({
  pc,
  onClose,
  onSubmit,
}: {
  pc: PhanCongCongDoan;
  onClose: () => void;
  onSubmit: (soTien: number, ghiChu?: string) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const [soTien, setSoTien] = useState("");
  const [ghiChu, setGhiChu] = useState("");

  const thanhTien = pc.donGiaGiao * pc.soLuongGiao;
  const conNo = thanhTien - pc.daThanhToan;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tien = Number(soTien);
    if (!tien || tien <= 0) {
      toast.error("Vui lòng nhập số tiền > 0");
      return;
    }
    if (tien > conNo) {
      toast.error(`Số tiền vượt quá công nợ (${conNo.toLocaleString()}đ)`);
      return;
    }
    onSubmit(tien, ghiChu);
  };

  const quickAmounts = [Math.round(conNo / 2), conNo, 1000000, 5000000, 10000000].filter((x) => x > 0 && x <= conNo);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="card max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            Tạo thanh toán
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-white/40 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-brand-500/10 rounded-lg p-3 mb-4 text-sm space-y-1">
          <div><b>Mã PC:</b> <span className="font-mono">{pc.id}</span></div>
          <div><b>Người nhận:</b> {pc.nguoiPhuTrach.ten.split(" (")[0]} ({pc.nguoiPhuTrach.ma})</div>
          <div><b>Công đoạn:</b> {pc.congDoan} - Lệnh cắt {pc.lenhCatId}</div>
          <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-brand-500/20">
            <div>
              <div className="text-[10px] opacity-70">Thành tiền</div>
              <div className="font-bold text-xs">{thanhTien.toLocaleString()}đ</div>
            </div>
            <div>
              <div className="text-[10px] opacity-70">Đã trả</div>
              <div className="font-bold text-xs text-emerald-600">{pc.daThanhToan.toLocaleString()}đ</div>
            </div>
            <div>
              <div className="text-[10px] opacity-70">Còn nợ</div>
              <div className="font-bold text-xs text-red-600">{conNo.toLocaleString()}đ</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium block mb-1">Số tiền thanh toán (đ) <span className="text-red-600">*</span></label>
            <input
              type="number"
              required
              min={1}
              max={conNo}
              className="input w-full"
              placeholder="VD: 5000000"
              value={soTien}
              onChange={(e) => setSoTien(e.target.value)}
            />
            {quickAmounts.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                <span className="text-[10px] opacity-60">Nhanh:</span>
                {quickAmounts.map((amt) => (
                  <button
                    type="button"
                    key={amt}
                    onClick={() => setSoTien(String(amt))}
                    className="text-[10px] px-2 py-0.5 rounded bg-white/40 hover:bg-white/60"
                  >
                    {amt >= 1000000 ? `${(amt / 1000000).toFixed(amt % 1000000 === 0 ? 0 : 1)}tr` : `${amt / 1000}k`}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Ghi chú (tuỳ chọn)</label>
            <textarea
              className="input w-full min-h-[60px]"
              placeholder="VD: Tạm ứng đợt 2, Thanh toán khi giao hàng..."
              value={ghiChu}
              onChange={(e) => setGhiChu(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Huỷ</button>
            <button type="submit" className="btn-primary flex-1">Xác nhận thanh toán</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModalPhanCongMoi({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (pc: Omit<PhanCongCongDoan, "id">) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const dsNguoi = useMemo(() => layDanhSachNguoiPT(), []);
  const [form, setForm] = useState({
    lenhCatId: "LC-M758",
    congDoan: "May áo" as CongDoanKey,
    nguoiMa: dsNguoi[0]?.ma || "",
    donGiaGiao: 0,
    soLuongGiao: 0,
    donVi: "bộ",
    ngayGiao: new Date().toISOString().split("T")[0],
    ngayXongDuKien: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    trangThai: "Chờ giao" as PhanCongCongDoan["trangThai"],
    ghiChu: "",
  });

  const nguoiSelected = dsNguoi.find((n) => n.ma === form.nguoiMa);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nguoiSelected) {
      toast.error("Vui lòng chọn người phụ trách");
      return;
    }
    if (form.donGiaGiao <= 0 || form.soLuongGiao <= 0) {
      toast.error("Đơn giá và số lượng phải > 0");
      return;
    }
    onSubmit({
      lenhCatId: form.lenhCatId,
      congDoan: form.congDoan,
      nguoiPhuTrach: nguoiSelected,
      donGiaGiao: form.donGiaGiao,
      soLuongGiao: form.soLuongGiao,
      donVi: form.donVi,
      ngayGiao: form.ngayGiao,
      ngayXongDuKien: form.ngayXongDuKien,
      trangThai: form.trangThai,
      daThanhToan: 0,
      ghiChu: form.ghiChu,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="card max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Plus className="w-5 h-5 text-brand-500" />
            Tạo phân công mới
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-white/40 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1">Lệnh cắt <span className="text-red-600">*</span></label>
              <input className="input w-full" required value={form.lenhCatId} onChange={(e) => setForm({ ...form, lenhCatId: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Công đoạn <span className="text-red-600">*</span></label>
              <select className="input w-full" value={form.congDoan} onChange={(e) => setForm({ ...form, congDoan: e.target.value as CongDoanKey })}>
                {CONG_DOAN_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium block mb-1">Người phụ trách <span className="text-red-600">*</span></label>
            <select className="input w-full" required value={form.nguoiMa} onChange={(e) => setForm({ ...form, nguoiMa: e.target.value })}>
              <option value="">-- Chọn NV/Đối tác --</option>
              <optgroup label="Nhân viên nội bộ">
                {dsNguoi.filter((n) => n.loai === "Nhân viên nội bộ").map((n) => (
                  <option key={n.ma} value={n.ma}>{n.ten} - {n.ma}</option>
                ))}
              </optgroup>
              <optgroup label="Đối tác gia công">
                {dsNguoi.filter((n) => n.loai === "Đối tác gia công").map((n) => (
                  <option key={n.ma} value={n.ma}>{n.ten} - {n.ma}</option>
                ))}
              </optgroup>
            </select>
            {nguoiSelected && (
              <div className="text-[10px] opacity-60 mt-1">
                📞 {nguoiSelected.sdt || "Không có SĐT"} · Loại: {nguoiSelected.loai}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1">Số lượng <span className="text-red-600">*</span></label>
              <input type="number" required min={1} className="input w-full" value={form.soLuongGiao} onChange={(e) => setForm({ ...form, soLuongGiao: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Đơn vị</label>
              <select className="input w-full" value={form.donVi} onChange={(e) => setForm({ ...form, donVi: e.target.value })}>
                <option value="bộ">Bộ</option>
                <option value="áo">Áo</option>
                <option value="quần">Quần</option>
                <option value="cái">Cái</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Đơn giá (đ) <span className="text-red-600">*</span></label>
              <input type="number" required min={1} className="input w-full" value={form.donGiaGiao} onChange={(e) => setForm({ ...form, donGiaGiao: Number(e.target.value) })} />
            </div>
          </div>

          <div className="bg-brand-500/10 rounded p-2 text-sm">
            <span className="opacity-70">Thành tiền ước tính:</span>{" "}
            <b className="text-brand-700">{(form.donGiaGiao * form.soLuongGiao).toLocaleString()}đ</b>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1">Ngày giao <span className="text-red-600">*</span></label>
              <input type="date" required className="input w-full" value={form.ngayGiao} onChange={(e) => setForm({ ...form, ngayGiao: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Ngày xong dự kiến <span className="text-red-600">*</span></label>
              <input type="date" required className="input w-full" value={form.ngayXongDuKien} onChange={(e) => setForm({ ...form, ngayXongDuKien: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium block mb-1">Trạng thái</label>
            <select className="input w-full" value={form.trangThai} onChange={(e) => setForm({ ...form, trangThai: e.target.value as PhanCongCongDoan["trangThai"] })}>
              <option value="Chờ giao">Chờ giao</option>
              <option value="Đang làm">Đang làm</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium block mb-1">Ghi chú</label>
            <textarea className="input w-full min-h-[60px]" placeholder="Ghi chú thêm..." value={form.ghiChu} onChange={(e) => setForm({ ...form, ghiChu: e.target.value })} />
          </div>

          <div className="flex gap-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Huỷ</button>
            <button type="submit" className="btn-primary flex-1">Tạo phân công</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModalLenhCat({
  lenhCatId,
  onClose,
  onThanhToan,
  isLate,
}: {
  lenhCatId: string;
  onClose: () => void;
  onThanhToan: (p: PhanCongCongDoan) => void;
  isLate: (p: PhanCongCongDoan) => boolean;
}) {
  const { layTheoLenh } = usePhanCong();
  const ds = layTheoLenh(lenhCatId);
  const tong = tinhCongNo(ds);
  const ngayHomNay = new Date().toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="card max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Scissors className="w-5 h-5 text-brand-500" />
            Phân công & Công nợ: {lenhCatId}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-white/40 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-brand-500/10 rounded p-3">
            <div className="text-xs opacity-70">Tổng thành tiền</div>
            <div className="text-lg font-bold">{formatVNDShort(tong.tongThanhTien)}</div>
          </div>
          <div className="bg-emerald-500/10 rounded p-3">
            <div className="text-xs opacity-70">Đã thanh toán</div>
            <div className="text-lg font-bold text-emerald-600">{formatVNDShort(tong.tongDaThanhToan)}</div>
          </div>
          <div className="bg-red-500/10 rounded p-3">
            <div className="text-xs opacity-70">Còn nợ</div>
            <div className="text-lg font-bold text-red-600">{formatVNDShort(tong.tongConNo)}</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b bg-white/30 dark:bg-white/5" style={{ borderColor: "var(--border)" }}>
                <th className="p-2">#</th>
                <th className="p-2">Công đoạn</th>
                <th className="p-2">Người PT</th>
                <th className="p-2 text-right">SL</th>
                <th className="p-2 text-right">Đơn giá</th>
                <th className="p-2 text-right">Thành tiền</th>
                <th className="p-2 text-right">Đã TT</th>
                <th className="p-2 text-right">Còn nợ</th>
                <th className="p-2">Trạng thái</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {ds.map((p, i) => {
                const tt = p.donGiaGiao * p.soLuongGiao;
                const cn = tt - p.daThanhToan;
                const late = isLate(p);
                const s = STATUS_STYLE[p.trangThai];
                return (
                  <tr key={p.id} className={`border-b ${late ? "bg-red-500/5" : ""}`} style={{ borderColor: "var(--border)" }}>
                    <td className="p-2 text-xs opacity-60">{i + 1}</td>
                    <td className="p-2 text-xs">
                      <span className="px-1.5 py-0.5 rounded bg-brand-500/15 text-brand-700 font-medium">
                        {p.congDoan}
                      </span>
                      {late && <AlertTriangle className="w-3 h-3 text-red-600 inline ml-1" />}
                    </td>
                    <td className="p-2 text-xs">
                      <div className="font-medium">{p.nguoiPhuTrach.ten.split(" (")[0]}</div>
                      <div className="text-[10px] opacity-60 font-mono">{p.nguoiPhuTrach.ma}</div>
                    </td>
                    <td className="p-2 text-right text-xs">{p.soLuongGiao.toLocaleString()}</td>
                    <td className="p-2 text-right text-xs font-mono">{p.donGiaGiao.toLocaleString()}</td>
                    <td className="p-2 text-right text-xs font-mono font-semibold">{tt.toLocaleString()}</td>
                    <td className="p-2 text-right text-xs font-mono text-emerald-600">{p.daThanhToan.toLocaleString()}</td>
                    <td className="p-2 text-right text-xs font-mono font-semibold text-red-600">{cn > 0 ? cn.toLocaleString() : "✓"}</td>
                    <td className="p-2">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] ${s.bg} ${s.color}`}>
                        {p.trangThai}
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      {cn > 0 && (
                        <button
                          onClick={() => onThanhToan(p)}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25"
                        >
                          Trả
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-brand-500/10 font-bold text-xs">
                <td colSpan={5} className="p-2 text-right">TỔNG</td>
                <td className="p-2 text-right">{formatVNDShort(tong.tongThanhTien)}</td>
                <td className="p-2 text-right text-emerald-600">{formatVNDShort(tong.tongDaThanhToan)}</td>
                <td className="p-2 text-right text-red-600">{formatVNDShort(tong.tongConNo)}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="text-xs opacity-60 mt-3 flex items-center gap-1">
          <Clock className="w-3 h-3" /> Ngày hôm nay: {ngayHomNay}
        </div>
      </div>
    </div>
  );
}
