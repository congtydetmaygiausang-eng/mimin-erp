"use client";
import { useState, useMemo, useEffect } from "react";
import {
  AlertTriangle, Bell, Package, Clock, Wallet, Users, TrendingUp,
  Filter, RefreshCw, ExternalLink, CheckCircle2, XCircle, AlertCircle,
  Calendar, ArrowRight, Activity, BarChart3,
} from "lucide-react";
import { tinhTatCaCanhBao, thongKeCanhBao, type CanhBao, type LoaiCanhBao, type MucDoCanhBao } from "@/lib/canh-bao-engine";

const LOAI_INFO: Record<LoaiCanhBao, { ten: string; icon: any; mau: string; bg: string }> = {
  "kho-sap-het":      { ten: "Kho sắp hết",      icon: Package,     mau: "#f59e0b", bg: "from-amber-500 to-orange-500" },
  "lsx-qua-han":      { ten: "LSX quá hạn",      icon: Clock,       mau: "#dc2626", bg: "from-rose-500 to-red-500" },
  "cong-no-qua-han":  { ten: "Công nợ quá hạn",  icon: Wallet,      mau: "#7c3aed", bg: "from-violet-500 to-purple-500" },
  "cn-tre-sl":        { ten: "CN trễ cập nhật",   icon: Users,       mau: "#0284c7", bg: "from-sky-500 to-cyan-500" },
  "ncc-vuot-han-muc": { ten: "NCC vượt hạn mức", icon: AlertCircle, mau: "#db2777", bg: "from-pink-500 to-rose-500" },
};

const MUCDO_INFO: Record<MucDoCanhBao, { ten: string; mau: string; icon: any }> = {
  "cao":        { ten: "Cao",         mau: "bg-rose-100 text-rose-700 border-rose-300",     icon: XCircle },
  "trung-binh": { ten: "Trung bình",  mau: "bg-amber-100 text-amber-700 border-amber-300",  icon: AlertCircle },
  "thap":       { ten: "Thấp",        mau: "bg-blue-100 text-blue-700 border-blue-300",     icon: Activity },
};

export default function CanhBaoPage() {
  const [filterLoai, setFilterLoai] = useState<LoaiCanhBao | "all">("all");
  const [filterMucDo, setFilterMucDo] = useState<MucDoCanhBao | "all">("all");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastCheck, setLastCheck] = useState(new Date());

  const canhBaos = useMemo(() => tinhTatCaCanhBao(), []);
  const thongKe = useMemo(() => thongKeCanhBao(canhBaos), [canhBaos]);

  // Auto refresh mỗi 30s (giả lập real-time)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setLastCheck(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const filtered = useMemo(() => {
    return canhBaos.filter((cb) => {
      if (filterLoai !== "all" && cb.loai !== filterLoai) return false;
      if (filterMucDo !== "all" && cb.mucDo !== filterMucDo) return false;
      return true;
    });
  }, [canhBaos, filterLoai, filterMucDo]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/30 to-amber-50/30 p-3 md:p-5">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-br from-rose-600 via-amber-600 to-orange-700 text-white p-5 md:p-7 shadow-xl">
          <div className="text-xs font-medium opacity-90 mb-1 flex items-center gap-2">
            <Bell className="w-3.5 h-3.5" /> MIMIN OS · Cảnh báo real-time
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">🔔 Trung tâm cảnh báo</h1>
          <p className="text-sm opacity-95 mt-1 max-w-3xl">
            Tự động phát hiện <b>{thongKe.tong} vấn đề</b>: 
            <b className="text-rose-200"> {thongKe.cao} cao</b> · 
            <b className="text-amber-200"> {thongKe.trungBinh} trung bình</b> · 
            <b className="text-blue-200"> {thongKe.thap} thấp</b>.
            Tự động refresh mỗi 30s.
          </p>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2 text-center text-xs">
            {Object.entries(thongKe.theoLoai).map(([loai, count]) => {
              const info = LOAI_INFO[loai as LoaiCanhBao];
              const Icon = info?.icon || AlertCircle;
              return (
                <div key={loai} className="bg-white/15 backdrop-blur rounded-lg p-2">
                  <Icon className="w-4 h-4 mx-auto mb-1" />
                  <div className="text-lg font-bold">{count}</div>
                  <div className="opacity-90 text-[10px]">{info?.ten || loai}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <div className="card p-3 flex flex-col md:flex-row gap-2">
          <select value={filterLoai} onChange={(e) => setFilterLoai(e.target.value as any)} className="px-2 py-1.5 text-sm border rounded">
            <option value="all">📋 Tất cả loại</option>
            {Object.entries(LOAI_INFO).map(([k, v]) => (
              <option key={k} value={k}>{v.ten}</option>
            ))}
          </select>
          <select value={filterMucDo} onChange={(e) => setFilterMucDo(e.target.value as any)} className="px-2 py-1.5 text-sm border rounded">
            <option value="all">🚦 Tất cả mức độ</option>
            <option value="cao">🔴 Cao</option>
            <option value="trung-binh">🟡 Trung bình</option>
            <option value="thap">🔵 Thấp</option>
          </select>
          <div className="flex-1 flex items-center justify-end gap-2 text-xs text-slate-500">
            <span>Last check: {lastCheck.toLocaleTimeString("vi-VN")}</span>
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
              Auto-refresh 30s
            </label>
            <button onClick={() => setLastCheck(new Date())} className="text-xs px-2 py-1 bg-slate-100 rounded">
              <RefreshCw className="w-3 h-3 inline" /> Refresh
            </button>
          </div>
        </div>

        {/* Theo loại */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {Object.entries(LOAI_INFO).map(([loai, info]) => {
            const list = canhBaos.filter((c) => c.loai === loai);
            const Icon = info.icon;
            return (
              <button
                key={loai}
                onClick={() => setFilterLoai(loai as LoaiCanhBao)}
                className={`card p-3 text-left hover:shadow-md transition ${
                  filterLoai === loai ? `bg-gradient-to-br ${info.bg} text-white` : ""
                }`}
              >
                <Icon className={`w-5 h-5 mb-1 ${filterLoai === loai ? "text-white" : ""}`} style={filterLoai === loai ? {} : { color: info.mau }} />
                <div className={`text-xs font-semibold ${filterLoai === loai ? "text-white" : "text-slate-600"}`}>{info.ten}</div>
                <div className={`text-2xl font-bold ${filterLoai === loai ? "text-white" : ""}`}>{list.length}</div>
              </button>
            );
          })}
        </div>

        {/* List cảnh báo */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="card p-8 text-center text-slate-500">
              <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-2" />
              <p className="font-semibold">Không có cảnh báo nào</p>
              <p className="text-xs mt-1">Mọi thứ đều ổn! 🎉</p>
            </div>
          ) : (
            filtered.map((cb) => <CanhBaoCard key={cb.id} cb={cb} />)
          )}
        </div>
      </div>
    </div>
  );
}

function CanhBaoCard({ cb }: { cb: CanhBao }) {
  const loai = LOAI_INFO[cb.loai];
  const mucDo = MUCDO_INFO[cb.mucDo];
  const LoaiIcon = loai.icon;
  const MucDoIcon = mucDo.icon;

  return (
    <div className={`card p-4 border-l-4`} style={{ borderLeftColor: loai.mau }}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0 bg-gradient-to-br ${loai.bg}`}>
          <LoaiIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-bold text-sm">{cb.tieuDe}</h3>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${mucDo.mau} flex items-center gap-0.5`}>
              <MucDoIcon className="w-3 h-3" /> {mucDo.ten}
            </span>
            <span className="text-[10px] text-slate-500">· {loai.ten}</span>
          </div>
          <p className="text-xs text-slate-600 mb-1">{cb.noiDung}</p>
          <div className="flex items-center gap-3 text-[10px] text-slate-500">
            <span>👤 {cb.doiTuong}</span>
            {cb.giaTri !== undefined && (
              <span>
                {cb.loai === "kho-sap-het" ? `📦 Còn ${cb.giaTri} ${cb.donVi}` :
                 cb.loai === "lsx-qua-han" ? `⏰ Trễ ${cb.giaTri} ${cb.donVi}` :
                 cb.loai === "cong-no-qua-han" ? `💰 ${(cb.giaTri / 1_000_000).toFixed(1)} tr đ` :
                 cb.loai === "cn-tre-sl" ? `⏳ ${cb.giaTri} ${cb.donVi}` : ""}
              </span>
            )}
            {cb.lienKet && (
              <a href={cb.lienKet} className="text-blue-600 hover:underline flex items-center gap-0.5">
                Xem chi tiết <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
