"use client";

import { useState, useMemo } from "react";
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
              if (confirm("Xoá toàn bộ phân công công nợ? Không thể hoàn tác.")) {
                reset();
                toast.success("Đã xoá toàn bộ phân công");
              }
            }}
            className="btn-ghost text-xs"
            title="Xoá toàn bộ dữ liệu phân công"
          >
            Xoá tất cả
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
          { id: "all" as TabKey, label: `Tất cả (${phanCong.length})` },
          { id: "theo-nguoi" as TabKey, label: `Theo người PT (${congNoTheoNguoi(phanCong).length})` },
          { id: "theo-cong-doan" as TabKey, label: `Theo công đoạn (${congNoTheoCongDoan(phanCong).length})` },
          { id: "theo-lenh" as TabKey, label: "Theo lệnh cắt" },
          { id: "tre-han" as TabKey, label: `Trễ hạn (${dsTreHan.length})`, danger: dsTreHan.length > 0 },
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
          onSubmit={(soTien: number, ghiChu?: string) => {
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
