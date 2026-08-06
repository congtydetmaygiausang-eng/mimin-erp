"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Database, Download, Upload, RefreshCw, CheckCircle2, XCircle,
  Loader2, ArrowRight, Sparkles, AlertCircle, FileText, BarChart3,
  Users, DollarSign, TrendingUp, Eye, EyeOff, Copy
} from "lucide-react";
import { toast } from "sonner";
import { ALL_REAL_PHIEU, tinhSanLuongTheoNguoi, REAL_PHIEU_M758, REAL_PHIEU_M873 } from "@/lib/real-workflow-data";
import type { PhieuWorkflow } from "@/lib/workflow-data";
import { logAudit } from "@/lib/audit-log";
import { useSession } from "@/components/session-provider";
import { getLarkConfig } from "@/lib/lark";
import { pushRecordToLark, pullFromLark } from "@/lib/lark-helpers";
import { hasUserToken, getUserAccessToken } from "@/lib/lark-user-token";
import { AdminOnly } from "@/components/AdminOnly";

const LS_KEY = "mimin_real_workflow_data";

export default function TestRealDataPage() {
  const { user } = useSession();
  const [phieus, setPhieus] = useState<PhieuWorkflow[]>([]);
  const [pushingId, setPushingId] = useState<string | null>(null);
  const [pulling, setPulling] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [filter, setFilter] = useState<"all" | "M758" | "M873">("all");

  // Load từ localStorage hoặc init từ sample
  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) {
      try {
        setPhieus(JSON.parse(stored));
      } catch {
        setPhieus(ALL_REAL_PHIEU);
      }
    } else {
      setPhieus(ALL_REAL_PHIEU);
      localStorage.setItem(LS_KEY, JSON.stringify(ALL_REAL_PHIEU));
    }
  }, []);

  const persist = (next: PhieuWorkflow[]) => {
    setPhieus(next);
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  };

  const filtered = useMemo(() => {
    if (filter === "M758") return phieus.filter((p) => p.lenhCat === "LC-M758");
    if (filter === "M873") return phieus.filter((p) => p.lenhCat === "LC-M873");
    return phieus;
  }, [phieus, filter]);

  const stats = useMemo(() => {
    const giao = phieus.reduce((s, p) => s + p.soLuongGiao, 0);
    const nhan = phieus.reduce((s, p) => s + p.soLuongNhan, 0);
    const dat = phieus.reduce((s, p) => s + p.soLuongDat, 0);
    const loi = phieus.reduce((s, p) => s + p.soLuongLoi, 0);
    const thieu = phieus.reduce((s, p) => s + p.soLuongThieu, 0);
    const tien = phieus.reduce((s, p) => s + p.thanhTien, 0);
    const tra = phieus.reduce((s, p) => s + p.daThanhToan, 0);
    const no = phieus.reduce((s, p) => s + p.conNo, 0);
    return { giao, nhan, dat, loi, thieu, tien, tra, no };
  }, [phieus]);

  const sanLuongTheoNguoi = useMemo(() => tinhSanLuongTheoNguoi(phieus), [phieus]);

  const reset = () => {
    if (!confirm("Reset về data mẫu?")) return;
    persist(ALL_REAL_PHIEU);
    toast.success("Đã reset data mẫu");
  };

  const pushToLark = async (phieu: PhieuWorkflow) => {
    setPushingId(phieu.id);
    try {
      const token = getUserAccessToken();
      const config = getLarkConfig();
      if (!token || !config) {
        toast.error("Chưa config Lark. Vào /lark-settings + /lark-login");
        return;
      }
      // Map khâu → bảng
      const stageMap: Record<string, string> = {
        "INTD": "inTheuDap",
        "MAY": "may",
        "KN": "khuyNut",
        "UI": "ui",
        "DG": "dongGoi",
      };
      const stage = phieu.id.split("_")[0] as keyof typeof stageMap;
      const tableKey = stageMap[stage];
      const tableId = config.tableIds[tableKey as keyof typeof config.tableIds];
      if (!tableId) {
        toast.error(`Chưa có table_id cho khâu ${stage}. Chạy Auto Setup trước.`);
        return;
      }
      // Map field
      await pushRecordToLark(tableId, {
        ma_phieu: phieu.id,
        ma_lenh_sx: phieu.lenhSX,
        ma_san_pham: phieu.maSP,
        so_luong_giao: phieu.soLuongGiao,
        so_luong_dat: phieu.soLuongDat,
        don_gia: phieu.donGia,
        thanh_tien: phieu.thanhTien,
        trang_thai: phieu.trangThai,
        ghi_chu: phieu.ghiChu,
      });
      toast.success(`✅ Đã push ${phieu.id} lên Lark`);
      logAudit({
        user, action: "create", module: "lark-sync" as any,
        description: `Push phiếu ${phieu.id} lên Lark table ${tableId}`,
        success: true,
      });
    } catch (e: any) {
      toast.error(`❌ Lỗi: ${e.message}`);
    } finally {
      setPushingId(null);
    }
  };

  const pushAllToLark = async () => {
    if (!confirm(`Push ${phieus.length} phiếu lên Lark?`)) return;
    for (const p of phieus) {
      await pushToLark(p);
      await new Promise((r) => setTimeout(r, 200));
    }
  };

  return (
    <AdminOnly>
    <div className="max-w-7xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Database className="w-7 h-7 text-emerald-500" /> Test Data Thật - M758 + M873
        </h1>
        <p className="opacity-70 mt-1 text-sm">
          12 phiếu thật đi qua 5 khâu với người thật + đơn giá thật (theo Lark chị Giàu)
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat icon={<TrendingUp className="w-4 h-4" />} label="Tổng giao" value={stats.giao} unit="cái" color="blue" />
        <Stat icon={<CheckCircle2 className="w-4 h-4" />} label="Đạt" value={stats.dat} unit="cái" color="emerald" />
        <Stat icon={<XCircle className="w-4 h-4" />} label="Lỗi" value={stats.loi} unit="cái" color="rose" />
        <Stat icon={<AlertCircle className="w-4 h-4" />} label="Thiếu" value={stats.thieu} unit="cái" color="amber" />
        <Stat icon={<DollarSign className="w-4 h-4" />} label="Thành tiền" value={(stats.tien / 1000).toFixed(0)} unit="K đ" color="violet" />
        <Stat icon={<CheckCircle2 className="w-4 h-4" />} label="Đã trả" value={(stats.tra / 1000).toFixed(0)} unit="K đ" color="teal" />
        <Stat icon={<AlertCircle className="w-4 h-4" />} label="Còn nợ" value={(stats.no / 1000).toFixed(0)} unit="K đ" color="orange" />
        <Stat icon={<BarChart3 className="w-4 h-4" />} label="Tỷ lệ đạt" value={`${stats.giao ? ((stats.dat / stats.giao) * 100).toFixed(1) : 0}%`} unit="" color="sky" />
      </div>

      {/* Action bar */}
      <div className="card p-4 flex flex-wrap items-center gap-2">
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          {(["all", "M758", "M873"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                filter === f ? "bg-white dark:bg-slate-700 shadow" : "opacity-60 hover:opacity-100"
              }`}
            >
              {f === "all" ? "Tất cả" : `LSX ${f}`}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button onClick={reset} className="btn-secondary text-xs">
          <RefreshCw className="w-3.5 h-3.5" /> Reset
        </button>
        <button onClick={() => setShowRaw((v) => !v)} className="btn-secondary text-xs">
          {showRaw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showRaw ? "Ẩn JSON" : "Xem JSON"}
        </button>
        <button
          onClick={pushAllToLark}
          className="btn-primary text-xs"
        >
          <Upload className="w-3.5 h-3.5" /> Push tất cả lên Lark
        </button>
      </div>

      {/* Bảng sản lượng theo người */}
      <div className="card p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Users className="w-5 h-5 text-violet-500" /> Sản lượng theo người thật
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {sanLuongTheoNguoi.map((p) => (
            <div key={p.maNV} className="p-3 rounded-lg bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-violet-500/20">
              <div className="text-xs opacity-70">{p.maNV}</div>
              <div className="font-semibold text-sm truncate">{p.ten}</div>
              <div className="flex justify-between mt-2 text-xs">
                <span>Đạt: <b className="text-emerald-500">{p.tongDat}</b></span>
                <span>Tiền: <b className="text-violet-500">{(p.tongTien / 1000).toFixed(0)}K</b></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Danh sách phiếu */}
      <div className="card p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-500" /> Phiếu workflow ({filtered.length})
        </h3>
        <div className="space-y-2">
          {filtered.map((p) => (
            <div key={p.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <span className="font-mono font-bold text-brand-600 dark:text-brand-400 text-sm">{p.id}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700">{p.lenhSX}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700">{p.maSP}</span>
                  <StatusBadge status={p.trangThai} />
                </div>
                <button
                  onClick={() => pushToLark(p)}
                  disabled={pushingId === p.id}
                  className="text-xs px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 flex items-center gap-1 shrink-0"
                >
                  {pushingId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  Lark
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-xs">
                <div><span className="opacity-60">Người:</span> <b>{p.tenNguoiNhan}</b></div>
                <div><span className="opacity-60">Mau/Size:</span> {p.mau} - {p.size}</div>
                <div>
                  <span className="opacity-60">SL:</span>{" "}
                  <span className="text-blue-600">G {p.soLuongGiao}</span> /{" "}
                  <span className="text-emerald-600">N {p.soLuongNhan}</span> /{" "}
                  <span className="text-green-600">Đ {p.soLuongDat}</span>{" "}
                  {p.soLuongLoi > 0 && <span className="text-rose-600">/ L {p.soLuongLoi}</span>}
                </div>
                <div>
                  <span className="opacity-60">Tiền:</span>{" "}
                  <b>{(p.thanhTien / 1000).toFixed(0)}K</b>
                  {p.conNo > 0 && <span className="text-orange-600 ml-1">(nợ {(p.conNo / 1000).toFixed(0)}K)</span>}
                </div>
              </div>
              {p.ghiChu && <div className="mt-1 text-xs opacity-60 italic">📝 {p.ghiChu}</div>}
              {showRaw && (
                <pre className="mt-2 p-2 bg-slate-100 dark:bg-slate-900 rounded text-[10px] overflow-x-auto">
                  {JSON.stringify(p, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
    </AdminOnly>
  );
}

function Stat({ icon, label, value, unit, color }: { icon: React.ReactNode; label: string; value: number | string; unit: string; color: string }) {
  const colors: Record<string, string> = {
    blue: "from-blue-500/10 to-cyan-500/10 text-blue-600 dark:text-blue-400",
    emerald: "from-emerald-500/10 to-green-500/10 text-emerald-600 dark:text-emerald-400",
    rose: "from-rose-500/10 to-red-500/10 text-rose-600 dark:text-rose-400",
    amber: "from-amber-500/10 to-yellow-500/10 text-amber-600 dark:text-amber-400",
    violet: "from-violet-500/10 to-purple-500/10 text-violet-600 dark:text-violet-400",
    teal: "from-teal-500/10 to-emerald-500/10 text-teal-600 dark:text-teal-400",
    orange: "from-orange-500/10 to-red-500/10 text-orange-600 dark:text-orange-400",
    sky: "from-sky-500/10 to-blue-500/10 text-sky-600 dark:text-sky-400",
  };
  return (
    <div className={`card p-3 bg-gradient-to-br ${colors[color]} border`}>
      <div className="flex items-center gap-1.5 opacity-80 text-xs">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-xl font-bold mt-1">
        {value} <span className="text-xs font-normal opacity-70">{unit}</span>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Hoàn thành": "bg-emerald-500 text-white",
    "Đang làm": "bg-blue-500 text-white",
    "Đang may": "bg-blue-500 text-white",
    "Chờ giao": "bg-amber-500 text-white",
    "Chờ gấp": "bg-amber-500 text-white",
    "Tạm dừng": "bg-slate-500 text-white",
    "Hủy": "bg-rose-500 text-white",
  };
  return <span className={`text-[10px] px-1.5 py-0.5 rounded ${map[status] || "bg-slate-300 text-slate-800"}`}>{status}</span>;
}
