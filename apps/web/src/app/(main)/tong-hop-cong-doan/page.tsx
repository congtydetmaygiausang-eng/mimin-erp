"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Grid3x3, Filter, Download, Search, ChevronDown, CheckCircle2, Clock,
  AlertTriangle, XCircle, Package, TrendingUp, DollarSign, FileSpreadsheet
} from "lucide-react";
import { useSession } from "@/components/session-provider";
import { logAudit } from "@/lib/audit-log";
import {
  PHIEU_CAT, PHIEU_IN_THEU_DAP, PHIEU_MAY, PHIEU_KHUY_NUT, PHIEU_UI, PHIEU_DONG_GOI,
  type PhieuWorkflow, type Khau, KHAU_LABELS, KHAU_ICONS, DON_GIA
} from "@/lib/workflow-data";
import { ALL_REAL_PHIEU } from "@/lib/real-workflow-data";

const STORAGE_KEY = "mimin_phieu_workflow_v1";

function loadAllPhieu(): PhieuWorkflow[] {
  if (typeof window === "undefined") return [];
  const all: PhieuWorkflow[] = [];
  [...PHIEU_CAT, ...PHIEU_IN_THEU_DAP, ...PHIEU_MAY, ...PHIEU_KHUY_NUT, ...PHIEU_UI, ...PHIEU_DONG_GOI, ...ALL_REAL_PHIEU].forEach((p) => all.push(p));
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Record<string, PhieuWorkflow>;
      all.forEach((p, idx) => {
        if (saved[p.id]) all[idx] = saved[p.id];
      });
    }
  } catch {}
  return all;
}

type CellStatus = "chua-toi" | "dang-lam" | "hoan-thanh" | "loi" | "thieu" | "tre-han";

function getCellStatus(phieu: PhieuWorkflow | undefined): CellStatus {
  if (!phieu) return "chua-toi";
  const trangThai = phieu.trangThai;
  if (trangThai === "Hoàn thành" || trangThai === "Đã thanh toán") return "hoan-thanh";
  if (trangThai === "Lỗi" || phieu.soLuongLoi > 0) return "loi";
  if (trangThai === "Thiếu" || phieu.soLuongThieu > 0) return "thieu";
  if (trangThai === "Trễ hạn") return "tre-han";
  if (trangThai === "Đang làm" || trangThai === "Đang may" || trangThai === "Đã nhận" || trangThai === "Đã giao") return "dang-lam";
  return "chua-toi";
}

function cellColor(status: CellStatus): string {
  return {
    "hoan-thanh": "bg-emerald-500/20 text-emerald-700 border-emerald-500/40",
    "dang-lam": "bg-amber-500/20 text-amber-700 border-amber-500/40",
    "loi": "bg-red-500/20 text-red-700 border-red-500/40",
    "thieu": "bg-orange-500/20 text-orange-700 border-orange-500/40",
    "tre-han": "bg-red-500/20 text-red-700 border-red-500/40",
    "chua-toi": "bg-slate-500/10 text-slate-500 border-slate-500/20",
  }[status];
}

function cellIcon(status: CellStatus) {
  const Icon = {
    "hoan-thanh": CheckCircle2,
    "dang-lam": Clock,
    "loi": XCircle,
    "thieu": AlertTriangle,
    "tre-han": AlertTriangle,
    "chua-toi": Package,
  }[status];
  return <Icon className="w-3 h-3" />;
}

const KHAU_ORDER: Khau[] = ["cat", "in-thêu-dập", "may", "khuy-nut", "ui", "dong-goi"];

const KHAU_PREFIX: Record<Khau, string> = {
  "cat": "",
  "in-thêu-dập": "INTD_",
  "may": "MAY_",
  "khuy-nut": "KN_",
  "ui": "UI_",
  "dong-goi": "DG_",
};

export default function TongHopCongDoanPage() {
  const { user } = useSession();
  const [allPhieu, setAllPhieu] = useState<PhieuWorkflow[]>([]);
  const [search, setSearch] = useState("");
  const [filterTrangThai, setFilterTrangThai] = useState<string>("all");

  useEffect(() => {
    setAllPhieu(loadAllPhieu());
  }, []);

  // Group by lenhSX
  const lenhSXGroups = useMemo(() => {
    const map: Record<string, PhieuWorkflow[]> = {};
    allPhieu.forEach((p) => {
      if (!map[p.lenhSX]) map[p.lenhSX] = [];
      map[p.lenhSX].push(p);
    });
    return map;
  }, [allPhieu]);

  const lenhSXList = useMemo(() => {
    return Object.keys(lenhSXGroups).sort();
  }, [lenhSXGroups]);

  // Tìm phiếu cho 1 ô
  const findPhieu = (lsx: string, khau: Khau, maSP?: string): PhieuWorkflow | undefined => {
    const list = lenhSXGroups[lsx] || [];
    const prefix = KHAU_PREFIX[khau];
    if (!prefix) return undefined;
    return list.find((p) => p.id.startsWith(prefix) && (!maSP || p.maSP === maSP));
  };

  // Tính tổng tiền
  const tongTien = useMemo(() => {
    return allPhieu.reduce((s, p) => s + p.thanhTien, 0);
  }, [allPhieu]);

  // Thống kê tổng
  const stats = useMemo(() => {
    let hoanThanh = 0, dangLam = 0, loi = 0, thieu = 0, tongSL = 0;
    allPhieu.forEach((p) => {
      const s = getCellStatus(p);
      if (s === "hoan-thanh") hoanThanh++;
      else if (s === "dang-lam") dangLam++;
      else if (s === "loi") loi++;
      else if (s === "thieu") thieu++;
      tongSL += p.soLuongGiao;
    });
    return { hoanThanh, dangLam, loi, thieu, tongSL, tongPhieu: allPhieu.length };
  }, [allPhieu]);

  const handleExport = () => {
    const headers = ["Lệnh SX", "Mã SP", "Sản phẩm", "Cắt", "In/Thêu/Dập", "May", "Khuy nút", "Ủi", "Đóng gói", "Nhập kho", "Tổng tiền", "Trạng thái"];
    const rows = lenhSXList.map((lsx) => {
      const phieus = lenhSXGroups[lsx];
      const firstPhieu = phieus[0];
      const cells = KHAU_ORDER.map((k) => {
        const p = findPhieu(lsx, k, firstPhieu?.maSP);
        if (!p) return { sl: "—", status: "Chưa tới" };
        return { sl: `${p.soLuongDat || 0}/${p.soLuongGiao || 0}`, status: p.trangThai };
      });
      const tong = phieus.reduce((s, p) => s + p.thanhTien, 0);
      const allDone = cells.every((c) => c.status === "Hoàn thành");
      return [
        lsx,
        firstPhieu?.maSP || "",
        firstPhieu?.phanLoai || "",
        ...cells.map((c) => c.sl),
        allDone ? "✓ Hoàn thành" : "Đang thực hiện",
        tong.toLocaleString("vi-VN"),
      ];
    });
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tong-hop-cong-doan-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    logAudit({ user, action: "export", module: "bao-cao", description: `Xuất bảng tổng hợp công đoạn (${lenhSXList.length} LSX)`, success: true });
    toast.success("Đã xuất Excel");
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Grid3x3 className="w-7 h-7 text-violet-500" /> Bảng tổng hợp công đoạn
          </h1>
          <p className="opacity-70 mt-1 text-sm">
            {lenhSXList.length} lệnh SX · {stats.tongPhieu} phiếu · Tổng tiền công: <b className="text-emerald-700">{tongTien.toLocaleString("vi-VN")}đ</b>
          </p>
        </div>
        <button onClick={handleExport} className="btn-primary flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4" /> Xuất Excel
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Lệnh SX" value={lenhSXList.length} color="bg-violet-500/10 text-violet-700" />
        <StatCard label="Hoàn thành" value={stats.hoanThanh} color="bg-emerald-500/10 text-emerald-700" />
        <StatCard label="Đang làm" value={stats.dangLam} color="bg-amber-500/10 text-amber-700" />
        <StatCard label="Lỗi" value={stats.loi} color="bg-red-500/10 text-red-700" />
        <StatCard label="Tổng SP" value={stats.tongSL.toLocaleString()} color="bg-sky-500/10 text-sky-700" />
      </div>

      {/* Legend */}
      <div className="card p-3 flex flex-wrap gap-3 text-xs">
        <span className="font-semibold">Chú thích:</span>
        <Legend color="bg-emerald-500/20" label="Hoàn thành" />
        <Legend color="bg-amber-500/20" label="Đang làm" />
        <Legend color="bg-red-500/20" label="Lỗi" />
        <Legend color="bg-orange-500/20" label="Thiếu" />
        <Legend color="bg-slate-500/10" label="Chưa tới" />
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
          <input className="input pl-9" placeholder="Tìm LSX, mã SP..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input max-w-[200px]" value={filterTrangThai} onChange={(e) => setFilterTrangThai(e.target.value)}>
          <option value="all">Tất cả trạng thái</option>
          <option value="Hoàn thành">Hoàn thành</option>
          <option value="Đang làm">Đang làm</option>
          <option value="Lỗi">Có lỗi</option>
        </select>
      </div>

      {/* Matrix Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                <th className="p-3 text-left sticky left-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur z-10 min-w-[140px]">Lệnh SX</th>
                <th className="p-3 text-left min-w-[120px]">Sản phẩm</th>
                {KHAU_ORDER.map((k) => (
                  <th key={k} className="p-3 text-center min-w-[110px]">
                    <div className="text-base">{KHAU_ICONS[k]}</div>
                    <div className="text-[10px] opacity-70">{KHAU_LABELS[k]}</div>
                  </th>
                ))}
                <th className="p-3 text-right min-w-[120px]">Tổng tiền</th>
                <th className="p-3 text-center min-w-[100px]">Tổng thể</th>
              </tr>
            </thead>
            <tbody>
              {lenhSXList.filter((lsx) => {
                const phieus = lenhSXGroups[lsx];
                const firstPhieu = phieus[0];
                if (!search) return true;
                return lsx.toLowerCase().includes(search.toLowerCase()) || (firstPhieu?.maSP || "").toLowerCase().includes(search.toLowerCase());
              }).map((lsx) => {
                const phieus = lenhSXGroups[lsx];
                const firstPhieu = phieus[0];
                const tongTienLSX = phieus.reduce((s, p) => s + p.thanhTien, 0);
                const allDone = phieus.filter((p) => p.id.startsWith("INTD_") || p.id.startsWith("MAY_") || p.id.startsWith("KN_") || p.id.startsWith("UI_") || p.id.startsWith("DG_")).every((p) => p.trangThai === "Hoàn thành");
                const hasError = phieus.some((p) => p.trangThai === "Lỗi" || p.soLuongLoi > 0);
                const overallStatus = hasError ? "loi" : allDone ? "hoan-thanh" : "dang-lam";

                return (
                  <tr key={lsx} className="border-b last:border-0 hover:bg-white/30 dark:hover:bg-white/5" style={{ borderColor: "var(--border)" }}>
                    <td className="p-3 font-mono font-semibold sticky left-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur z-10">{lsx}</td>
                    <td className="p-3">
                      <div className="font-medium">{firstPhieu?.maSP}</div>
                      <div className="text-[10px] opacity-60 truncate">{firstPhieu?.phanLoai}</div>
                    </td>
                    {KHAU_ORDER.map((k) => {
                      const phieu = findPhieu(lsx, k, firstPhieu?.maSP);
                      const status = getCellStatus(phieu);
                      return (
                        <td key={k} className="p-2">
                          {phieu ? (
                            <div className={`p-1.5 rounded border ${cellColor(status)} text-center`} title={`${phieu.id}: ${phieu.trangThai}`}>
                              <div className="flex items-center justify-center gap-1 font-semibold">
                                {cellIcon(status)}
                                <span>{phieu.soLuongDat || 0}/{phieu.soLuongGiao || 0}</span>
                              </div>
                              <div className="text-[9px] opacity-80 truncate">{phieu.trangThai}</div>
                            </div>
                          ) : (
                            <div className="p-1.5 rounded border bg-slate-500/5 border-slate-500/10 text-center text-slate-400">
                              <div className="flex items-center justify-center gap-1">
                                <Package className="w-3 h-3" />
                                <span>—</span>
                              </div>
                              <div className="text-[9px]">Chưa tới</div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="p-3 text-right font-mono font-semibold text-emerald-700">{tongTienLSX.toLocaleString("vi-VN")}đ</td>
                    <td className="p-3 text-center">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        overallStatus === "hoan-thanh" ? "bg-emerald-500/20 text-emerald-700" :
                        overallStatus === "loi" ? "bg-red-500/20 text-red-700" :
                        "bg-amber-500/20 text-amber-700"
                      }`}>
                        {overallStatus === "hoan-thanh" ? "✓ Hoàn thành" : overallStatus === "loi" ? "⚠ Có lỗi" : "⏳ Đang làm"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {lenhSXList.length === 0 && (
          <div className="p-12 text-center opacity-60 text-sm">
            <Grid3x3 className="w-8 h-8 mx-auto mb-2 opacity-30" />
            Chưa có lệnh SX nào.
          </div>
        )}
      </div>

      {/* Công thức kiểm soát */}
      <div className="card p-5 max-w-2xl">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-violet-500" /> Công thức kiểm soát
        </h3>
        <div className="space-y-2 text-sm">
          <Formula label="Tồn tại công đoạn" formula="SL nhận − SL đã bàn giao" />
          <Formula label="Thiếu hụt công đoạn" formula="SL giao − SL nhận lại" />
          <Formula label="Tiền công" formula="SL đạt × Đơn giá" />
          <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-xs">
            ⚠️ <b>SL nhập kho</b> không được lớn hơn <b>SL đóng gói đạt</b>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: any) {
  return (
    <div className={`card p-3 ${color}`}>
      <div className="text-xs opacity-70">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

function Legend({ color, label }: any) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-3 h-3 rounded ${color}`} />
      <span>{label}</span>
    </div>
  );
}

function Formula({ label, formula }: { label: string; formula: string }) {
  return (
    <div className="flex items-center justify-between p-2 rounded bg-slate-100 dark:bg-slate-800">
      <span className="font-medium">{label}:</span>
      <code className="text-[11px] bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded font-mono">{formula}</code>
    </div>
  );
}

// Need toast
import { toast } from "sonner";
