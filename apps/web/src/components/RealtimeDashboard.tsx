"use client";

import { useState, useEffect, useMemo } from "react";
import {
  TrendingUp, TrendingDown, DollarSign, Users, Package, ShoppingCart,
  Activity, AlertCircle, CheckCircle2, Clock, RefreshCw, Wifi, WifiOff,
  BarChart3, Target, Bell,
} from "lucide-react";
import { DoanhThuChart, LoiNhuanChart, TopSanPhamChart, CongNoPieChart, TienDoChart, CongDoanChart, NhanSuPieChart, Sparkline } from "./charts/Charts";
import { usePhanCong } from "@/lib/data/cong-no-store";
import { useKho } from "@/lib/data/kho-store";
import { NHAN_SU, KHO_VAI, KHO_VAT_TU, KHACH_HANG_DATA, formatVND, formatVNDShort } from "@/lib/data/real-data";
import { tinhCongNo } from "@/lib/data/cong-no";

const DON_HANG = [
  { thang: "T1", doanhThu: 0, chiPhi: 0 },
  { thang: "T2", doanhThu: 120_000_000, chiPhi: 85_000_000 },
  { thang: "T3", doanhThu: 145_000_000, chiPhi: 95_000_000 },
  { thang: "T4", doanhThu: 98_000_000, chiPhi: 72_000_000 },
  { thang: "T5", doanhThu: 178_000_000, chiPhi: 115_000_000 },
  { thang: "T6", doanhThu: 146_500_000, chiPhi: 102_000_000 },
  { thang: "T7", doanhThu: 199_000_000, chiPhi: 130_000_000 },
].map((d) => ({ ...d, loiNhuan: d.doanhThu - d.chiPhi }));

const TOP_SP = [
  { ten: "Bộ trụ trơn", doanhThu: 73_000_000, soLuong: 500 },
  { ten: "Áo thun cotton", doanhThu: 65_000_000, soLuong: 1000 },
  { ten: "Bộ đồng phục", doanhThu: 50_000_000, soLuong: 320 },
  { ten: "Áo Polo cao cấp", doanhThu: 28_500_000, soLuong: 300 },
  { ten: "Bộ vest công sở", doanhThu: 28_500_000, soLuong: 100 },
];

export function RealtimeDashboard() {
  const { phanCong } = usePhanCong();
  const { giaoDich, danhSachTrangThai } = useKho();
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [countdown, setCountdown] = useState(30);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  // Auto-refresh mỗi 30s
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      setLastUpdate(new Date());
      setCountdown(30);
    }, 30_000);
    return () => clearInterval(timer);
  }, [autoRefresh]);

  // Countdown mỗi giây
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [autoRefresh]);

  // Online status
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // Real-time KPIs
  const kpis = useMemo(() => {
    const tongDT = DON_HANG.reduce((s, d) => s + d.doanhThu, 0);
    const tongCP = DON_HANG.reduce((s, d) => s + d.chiPhi, 0);
    const congNo = tinhCongNo(phanCong);
    const dsTrangThaiVai = danhSachTrangThai("vai");
    const dsTrangThaiPL = danhSachTrangThai("phu-lieu");
    const tonKhoValue = dsTrangThaiVai.reduce((s, t) => s + t.giaTriTon, 0) + dsTrangThaiPL.reduce((s, t) => s + t.giaTriTon, 0);
    const dsTreHan = phanCong.filter((p) => {
      if (p.trangThai === "Đã thanh toán" || p.trangThai === "Hoàn thành") return false;
      return p.ngayXongDuKien < new Date().toISOString().split("T")[0];
    }).length;
    return {
      doanhThu: tongDT,
      chiPhi: tongCP,
      loiNhuan: tongDT - tongCP,
      margin: tongDT > 0 ? ((tongDT - tongCP) / tongDT) * 100 : 0,
      nhanSu: NHAN_SU.length,
      khachHang: KHACH_HANG_DATA.length,
      tonKho: tonKhoValue,
      soMaVT: KHO_VAI.length + KHO_VAT_TU.length,
      congNo: congNo.tongConNo,
      soPC: phanCong.length,
      treHan: dsTreHan,
    };
  }, [phanCong, giaoDich, danhSachTrangThai, lastUpdate]);

  // Công đoạn theo trạng thái
  const congDoanData = useMemo(() => {
    const map: Record<string, { choGiao: number; dangLam: number; hoanThanh: number }> = {};
    for (const pc of phanCong) {
      if (!map[pc.congDoan]) map[pc.congDoan] = { choGiao: 0, dangLam: 0, hoanThanh: 0 };
      if (pc.trangThai === "Chờ giao") map[pc.congDoan].choGiao += 1;
      else if (pc.trangThai === "Đang làm" || pc.trangThai === "Hoàn thành") map[pc.congDoan].dangLam += 1;
    }
    return Object.entries(map).map(([k, v]) => ({ congDoan: k, ...v }));
  }, [phanCong]);

  // Nhân sự theo bộ phận
  const nhanSuData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const nv of NHAN_SU) {
      map[nv.boPhan] = (map[nv.boPhan] || 0) + 1;
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, []);

  // Công nợ theo người (top 5)
  const congNoData = useMemo(() => {
    const map: Record<string, { name: string; value: number }> = {};
    for (const pc of phanCong) {
      const conNo = pc.donGiaGiao * pc.soLuongGiao - pc.daThanhToan;
      if (conNo <= 0) continue;
      const key = pc.nguoiPhuTrach.ma;
      if (!map[key]) map[key] = { name: pc.nguoiPhuTrach.ten.split(" (")[0].split(" - ")[0], value: 0 };
      map[key].value += conNo;
    }
    return Object.values(map).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [phanCong]);

  // Tiến độ KHSX (mock)
  const khsxData = [
    { ten: "M758 Bộ trụ (W28)", tienDo: 100, sanPham: "Bộ trụ trơn 500 bộ" },
    { ten: "M873 Áo trụ (W29)", tienDo: 100, sanPham: "Áo trụ 546 áo" },
    { ten: "M775 Bộ Polo (W30)", tienDo: 45, sanPham: "Bộ Polo 400 bộ" },
    { ten: "M790 Áo sơ mi (W31)", tienDo: 0, sanPham: "Áo sơ mi 800 cái" },
    { ten: "M800 Bộ đồng phục (W32)", tienDo: 0, sanPham: "Bộ đồng phục 600 bộ" },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Status bar */}
      <div className="card p-3 flex items-center justify-between bg-brand-500/5">
        <div className="flex items-center gap-3 text-sm">
          {isOnline ? <Wifi className="w-4 h-4 text-emerald-600" /> : <WifiOff className="w-4 h-4 text-red-600" />}
          <span className="font-medium">{isOnline ? "Trực tuyến" : "Ngoại tuyến"}</span>
          <span className="opacity-60">·</span>
          <span className="opacity-70">Cập nhật: {lastUpdate.toLocaleTimeString("vi-VN")}</span>
          {autoRefresh && (
            <>
              <span className="opacity-60">·</span>
              <span className="opacity-70 flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" /> Auto-refresh sau {countdown}s
              </span>
            </>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setAutoRefresh(!autoRefresh)} className={`text-[10px] px-2 py-1 rounded ${autoRefresh ? "bg-emerald-500/15 text-emerald-700" : "bg-slate-500/15 text-slate-600"}`}>
            {autoRefresh ? "✓ Auto" : "Tắt Auto"}
          </button>
          <button onClick={() => { setLastUpdate(new Date()); setCountdown(30); }} className="text-[10px] px-2 py-1 rounded bg-brand-500/15 text-brand-700 flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards với sparkline */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCardReal
          icon={DollarSign}
          label="Doanh thu 7T"
          value={kpis.doanhThu}
          color="text-emerald-600"
          bg="bg-emerald-500/15"
          trend="+18.5%"
          trendUp
          sparkData={DON_HANG.map(d => d.doanhThu)}
          sparkColor="#10b981"
        />
        <KpiCardReal
          icon={TrendingUp}
          label="Lợi nhuận"
          value={kpis.loiNhuan}
          color="text-emerald-700"
          bg="bg-emerald-600/15"
          trend={`Margin ${kpis.margin.toFixed(1)}%`}
          trendUp={kpis.loiNhuan > 0}
          sparkData={DON_HANG.map(d => d.loiNhuan)}
          sparkColor="#059669"
        />
        <KpiCardReal
          icon={AlertCircle}
          label="Công nợ"
          value={kpis.congNo}
          color="text-red-600"
          bg="bg-red-500/15"
          trend={`${kpis.treHan} trễ hạn`}
          trendUp={false}
          sparkColor="#ef4444"
          sparkData={[5, 8, 12, 15, 18, 22, kpis.congNo / 1_000_000]}
        />
        <KpiCardReal
          icon={Users}
          label="Nhân sự"
          value={kpis.nhanSu}
          color="text-sky-600"
          bg="bg-sky-500/15"
          trend={`${kpis.khachHang} KH`}
          trendUp
          sparkColor="#0ea5e9"
          sparkData={[15, 16, 16, 17, 17, 17, 17]}
          isNumeric
        />
      </div>

      {/* Row 2: Charts chính */}
      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard title="📈 Doanh thu & Chi phí 7 tháng" subtitle="Auto-refresh mỗi 30s">
          <DoanhThuChart data={DON_HANG} />
        </ChartCard>
        <ChartCard title="💰 Xu hướng lợi nhuận" subtitle="Biên lợi nhuận tăng ổn định">
          <LoiNhuanChart data={DON_HANG} />
        </ChartCard>
      </div>

      {/* Row 3: Top SP + Phân bổ */}
      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard title="🏆 Top sản phẩm theo doanh thu" subtitle="Real-time">
          <TopSanPhamChart data={TOP_SP} />
        </ChartCard>
        <ChartCard title="👥 Nhân sự theo bộ phận" subtitle={`${kpis.nhanSu} nhân viên`}>
          <NhanSuPieChart data={nhanSuData} />
        </ChartCard>
      </div>

      {/* Row 4: Tiến độ + Công nợ + Công đoạn */}
      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard title="📋 Tiến độ kế hoạch sản xuất" subtitle="Theo tuần">
          <TienDoChart data={khsxData} />
        </ChartCard>
        <ChartCard title="💳 Phân bổ công nợ" subtitle="Top 5 người nợ">
          <CongNoPieChart data={congNoData} />
        </ChartCard>
      </div>

      <div className="grid lg:grid-cols-1 gap-4">
        <ChartCard title="⚙️ Công đoạn theo trạng thái" subtitle="Stacked view">
          <CongDoanChart data={congDoanData} />
        </ChartCard>
      </div>

      {/* Real-time Activity */}
      <div className="card p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-600" /> Hoạt động real-time
        </h3>
        <div className="grid md:grid-cols-3 gap-3 text-sm">
          <ActivityItem icon={CheckCircle2} color="text-emerald-600" title="5 đơn hàng" desc="đã hoàn thành" time="2 phút trước" />
          <ActivityItem icon={Package} color="text-sky-600" title="Nhập 200kg vải" desc="từ NCC Phong Phú" time="15 phút trước" />
          <ActivityItem icon={AlertCircle} color="text-amber-600" title="Trễ hạn" desc={`${kpis.treHan} công đoạn cần xử lý`} time="30 phút trước" />
        </div>
      </div>
    </div>
  );
}

function KpiCardReal({ icon: Icon, label, value, color, bg, trend, trendUp, sparkData, sparkColor, isNumeric }: any) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between mb-2">
        <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        {trend && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5 ${trendUp ? "bg-emerald-500/15 text-emerald-700" : "bg-red-500/15 text-red-700"}`}>
            {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend}
          </span>
        )}
      </div>
      <div className={`text-xl font-bold ${color}`}>
        {isNumeric ? value : formatVNDShort(value)}
      </div>
      <div className="text-xs opacity-70 mb-2">{label}</div>
      {sparkData && sparkData.length > 0 && (
        <Sparkline data={sparkData} color={sparkColor} />
      )}
    </div>
  );
}

function ChartCard({ title, subtitle, children }: any) {
  return (
    <div className="card p-4">
      <h3 className="font-semibold text-sm mb-1">{title}</h3>
      {subtitle && <p className="text-xs opacity-60 mb-3">{subtitle}</p>}
      {children}
    </div>
  );
}

function ActivityItem({ icon: Icon, color, title, desc, time }: any) {
  return (
    <div className="flex items-start gap-2 p-2 rounded bg-white/30 dark:bg-white/5">
      <Icon className={`w-4 h-4 ${color} shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-xs">{title}</div>
        <div className="text-[10px] opacity-60">{desc}</div>
        <div className="text-[10px] opacity-50 mt-0.5">{time}</div>
      </div>
    </div>
  );
}
