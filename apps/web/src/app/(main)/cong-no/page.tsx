"use client";

import { useState, useMemo, useEffect } from "react";
import { Wallet, AlertCircle, AlertTriangle, Plus, Download } from "lucide-react";
import { toast } from "sonner";
import { usePhanCong, exportCongNoExcel } from "@/lib/data/cong-no-store";
import { tinhCongNo, congNoTheoNguoi, congNoTheoCongDoan } from "@/lib/data/cong-no";
import { formatVND, formatVNDShort } from "@/lib/data/real-data";
import type { TabKey } from "./data";
import { AllTable } from "./components/AllTable";
import { BangTheoNguoi, BangTheoCongDoan, BangTheoLenhCat, BangTreHan } from "./components/Tables";
import { ModalThanhToan, ModalPhanCongMoi, ModalLenhCat } from "./components/Modals";

export default function CongNoPage() {
  const { phanCong, themThanhToan, themPhanCong, reset, isLate } = usePhanCong();

  const [tab, setTab] = useState<TabKey>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "Chờ giao" | "Đang làm" | "Hoàn thành" | "Đã thanh toán">("all");
  const [nguoiFilter, setNguoiFilter] = useState<"all" | "Đối tác gia công" | "Nhân viên nội bộ">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("search") || params.get("lenhCat");
      if (q) setSearch(q);
    }
  }, []);
  const [selectedLenh, setSelectedLenh] = useState<string | null>(null);
  const [showModalTT, setShowModalTT] = useState<any | null>(null);
  const [showModalPC, setShowModalPC] = useState(false);

  const tong = tinhCongNo(phanCong);
  const dsDangLam = phanCong.filter((p) => p.trangThai === "Đang làm");
  const dsTreHan = phanCong.filter((p) => isLate(p));

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
      {/* Executive Header Banner - Chuẩn Bảng Lương */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-teal-950 via-teal-900 to-slate-900 border border-teal-800/60 p-5 sm:p-6 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            MIMIN ERP · KẾ TOÁN & GIA CÔNG
          </div>
          <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2.5 tracking-tight text-white">
            <Wallet className="w-7 h-7 text-teal-400" />
            Công nợ công đoạn
          </h1>
          <p className="text-slate-300 text-xs md:text-sm mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{phanCong.length} phân công</span>
            <span className="text-slate-500">·</span>
            <span>Tổng thành tiền: <b className="text-white font-mono">{formatVNDShort(tong.tongThanhTien)}</b></span>
            <span className="text-slate-500">·</span>
            <span>Đã thanh toán: <b className="text-emerald-400 font-mono">{formatVNDShort(tong.tongDaThanhToan)}</b></span>
            <span className="text-slate-500">·</span>
            <span className="text-rose-400">Còn nợ: <b className="font-mono">{formatVNDShort(tong.tongConNo)}</b></span>
          </p>
        </div>
        <div className="relative z-10 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowModalPC(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" /> Tạo phân công
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-100 border border-white/15 text-xs font-medium shadow-xs transition backdrop-blur-md"
          >
            <Download className="w-4 h-4 text-teal-300" /> Xuất Excel
          </button>
          <button
            onClick={() => {
              if (confirm("Xoá toàn bộ phân công công nợ? Không thể hoàn tác.")) {
                reset();
                toast.success("Đã xoá toàn bộ phân công");
              }
            }}
            className="px-3 py-2 rounded-xl text-slate-400 hover:text-rose-300 hover:bg-white/5 text-xs transition"
            title="Xoá toàn bộ dữ liệu phân công"
          >
            Xoá tất cả
          </button>
        </div>
      </div>

      {/* Unslopped KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tổng nợ còn lại</span>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono tracking-tight my-1 text-rose-600 dark:text-rose-400">
            {formatVNDShort(tong.tongConNo)}
          </div>
          <div className="text-[11px] font-mono text-slate-400">{formatVND(tong.tongConNo)}</div>
        </div>

        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Đã thanh toán</span>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono tracking-tight my-1 text-emerald-600 dark:text-emerald-400">
            {formatVNDShort(tong.tongDaThanhToan)}
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            {((tong.tongDaThanhToan / (tong.tongThanhTien || 1)) * 100).toFixed(0)}% tổng giá trị
          </div>
        </div>

        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Đang triển khai</span>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono tracking-tight my-1 text-amber-600 dark:text-amber-400">
            {dsDangLam.length}
          </div>
          <div className="text-[11px] text-slate-400">công đoạn đang chạy</div>
        </div>

        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              Trễ hạn deadline
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${dsTreHan.length > 0 ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-black font-mono tracking-tight my-1 ${dsTreHan.length > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
            {dsTreHan.length}
          </div>
          <div className="text-[11px] text-slate-400">
            {dsTreHan.length > 0 ? "công đoạn cần xử lý gấp" : "tiến độ chuẩn xác"}
          </div>
        </div>
      </div>

      {dsDangLam.length > 0 && (
        <div className="rounded-xl p-3.5 flex items-start gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 text-amber-900 dark:text-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <b className="font-semibold text-amber-900 dark:text-amber-200">Có {dsDangLam.length} công đoạn đang chạy:</b>{" "}
            {dsDangLam.map((p) => `${p.congDoan} - ${p.nguoiPhuTrach.ten.split(" (")[0]}`).join(", ")}.
            Theo dõi tiến độ giao hàng & kiểm đếm.
          </div>
        </div>
      )}

      {dsTreHan.length > 0 && (
        <div className="rounded-xl p-3.5 flex items-start gap-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-800/40 text-rose-900 dark:text-rose-200">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <b className="font-semibold text-rose-900 dark:text-rose-200">⚠️ Có {dsTreHan.length} công đoạn trễ hạn deadline:</b>{" "}
            {dsTreHan.map((p) => `${p.congDoan} - ${p.nguoiPhuTrach.ten.split(" (")[0]}`).join(", ")}.
            Cần liên hệ xưởng/nhân sự để thúc đẩy tiến độ ngay!
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex w-full sm:w-fit overflow-x-auto no-scrollbar tab-scroll-mobile gap-1 shadow-xs">
        {([
          { id: "all" as TabKey, label: `Tất cả (${phanCong.length})` },
          { id: "theo-nguoi" as TabKey, label: `Theo người PT (${congNoTheoNguoi(phanCong).length})` },
          { id: "theo-cong-doan" as TabKey, label: `Theo công đoạn (${congNoTheoCongDoan(phanCong).length})` },
          { id: "theo-lenh" as TabKey, label: "Theo lệnh cắt" },
          { id: "tre-han" as TabKey, label: `Trễ hạn (${dsTreHan.length})`, danger: dsTreHan.length > 0 },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 whitespace-nowrap px-3.5 py-2 rounded-lg text-xs font-semibold transition ${tab === t.id
              ? t.danger
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-slate-900 dark:bg-slate-800 text-white shadow-xs"
              : t.danger
                ? "hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "all" && (
        <AllTable
          filtered={filtered}
          phanCong={phanCong}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          nguoiFilter={nguoiFilter}
          setNguoiFilter={setNguoiFilter}
          search={search}
          setSearch={setSearch}
          isLate={isLate}
          onThanhToan={setShowModalTT}
        />
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
          onSubmit={async (soTien: number, ghiChu?: string, taoPhieuChi?: boolean, hinhThuc?: "Chuyển khoản" | "Tiền mặt") => {
            themThanhToan(showModalTT.id, soTien, ghiChu);
            if (taoPhieuChi) {
              try {
                const { themGiaoDich } = await import("@/lib/data/thu-chi");
                await themGiaoDich({
                  loai: "chi",
                  danhMuc: "tam_ung",
                  soTien,
                  hinhThuc: (hinhThuc === "Tiền mặt" ? "tien_mat" : "chuyen_khoan"),
                  ngay: new Date().toISOString().slice(0, 10),
                  nguoiThucHien: "Kế toán xưởng",
                  nguoiNhan: showModalTT.nguoiPhuTrach.ten,
                  noiDung: `Chi tiền công ${showModalTT.congDoan} - Lệnh ${showModalTT.lenhCatId} (${showModalTT.id})${ghiChu ? " - " + ghiChu : ""}`,
                  hinhAnh: [],
                  nguoiNhap: "Kế toán xưởng",
                  roleNguoiNhap: "ketoan",
                });
                toast.success(`Đã trả ${soTien.toLocaleString()}đ và tạo phiếu Chi vào Sổ Quỹ!`);
              } catch (e) {
                console.error(e);
                toast.success(`Đã trả ${soTien.toLocaleString()}đ cho ${showModalTT.nguoiPhuTrach.ten.split(" (")[0]}`);
              }
            } else {
              toast.success(`Đã trả ${soTien.toLocaleString()}đ cho ${showModalTT.nguoiPhuTrach.ten.split(" (")[0]}`);
            }
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
