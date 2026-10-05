"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle, Bell, Package, Clock, Wallet, Users, TrendingUp,
  Filter, RefreshCw, ExternalLink, CheckCircle2, XCircle, AlertCircle,
  Calendar, ArrowRight, Activity, BarChart3, ShieldAlert, LayoutDashboard,
  Factory, Search, CheckCircle, ChevronRight, Boxes
} from "lucide-react";
import {
  tinhTatCaCanhBao, thongKeCanhBao, type CanhBao, type LoaiCanhBao, type MucDoCanhBao
} from "@/lib/canh-bao-engine";
import { useLenhCat } from "@/lib/data/lenh-cat-store";
import { useKho } from "@/lib/data/kho-store";
import { usePhanCong } from "@/lib/data/cong-no-store";
import { formatVNDShort, KHO_VAI, KHO_VAT_TU } from "@/lib/data/real-data";

const LOAI_INFO: Record<LoaiCanhBao, { ten: string; icon: any; mau: string; bg: string; border: string }> = {
  "kho-sap-het": {
    ten: "Kho sắp hết",
    icon: Package,
    mau: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-100/90 dark:bg-amber-950/60",
    border: "border-amber-500",
  },
  "lsx-qua-han": {
    ten: "Lệnh SX quá hạn",
    icon: Clock,
    mau: "text-rose-700 dark:text-rose-400",
    bg: "bg-rose-100/90 dark:bg-rose-950/60",
    border: "border-rose-500",
  },
  "cong-no-qua-han": {
    ten: "Công nợ quá hạn",
    icon: Wallet,
    mau: "text-purple-700 dark:text-purple-400",
    bg: "bg-purple-100/90 dark:bg-purple-950/60",
    border: "border-purple-500",
  },
  "cn-tre-sl": {
    ten: "Lỗi SX / Tiến độ khâu",
    icon: Users,
    mau: "text-sky-700 dark:text-sky-400",
    bg: "bg-sky-100/90 dark:bg-sky-950/60",
    border: "border-sky-500",
  },
  "ncc-vuot-han-muc": {
    ten: "NCC vượt hạn mức",
    icon: AlertCircle,
    mau: "text-pink-700 dark:text-pink-400",
    bg: "bg-pink-100/90 dark:bg-pink-950/60",
    border: "border-pink-500",
  },
};

const MUCDO_INFO: Record<MucDoCanhBao, { ten: string; badge: string; icon: any }> = {
  "cao": {
    ten: "P0 Khẩn cấp",
    badge: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300/80",
    icon: XCircle,
  },
  "trung-binh": {
    ten: "P1 Cần xử lý",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300/80",
    icon: AlertCircle,
  },
  "thap": {
    ten: "P2 Theo dõi",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300/80",
    icon: Activity,
  },
};

export default function CanhBaoPage() {
  const { dsLenhCat } = useLenhCat();
  const { danhSachTrangThai } = useKho();
  const { phanCong } = usePhanCong();

  const [filterLoai, setFilterLoai] = useState<LoaiCanhBao | "all">("all");
  const [filterMucDo, setFilterMucDo] = useState<MucDoCanhBao | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastCheck, setLastCheck] = useState(new Date());
  const [countdown, setCountdown] = useState(30);

  // Quét cảnh báo từ 100% dữ liệu thực tế
  const canhBaos = useMemo(() => {
    const vaiMap = new Map(KHO_VAI.map(v => [v.maVT, v]));
    const vtMap = new Map(KHO_VAT_TU.map(v => [v.maVT, v]));

    const dsKhoVai = danhSachTrangThai("vai").map(v => {
      const info = vaiMap.get(v.maVT);
      return {
        sku: v.maVT,
        ten: info?.tenVT ? `${info.tenVT} (${v.maVT})` : v.maVT,
        sl: v.tonKho,
        donVi: info?.dvt || "kg",
        tonThap: v.tonToiThieu || 500,
      };
    });
    const dsKhoPL = danhSachTrangThai("phu-lieu").map(p => {
      const info = vtMap.get(p.maVT);
      return {
        sku: p.maVT,
        ten: info?.tenVT ? `${info.tenVT} (${p.maVT})` : p.maVT,
        sl: p.tonKho,
        donVi: info?.dvt || "cái",
        tonThap: p.tonToiThieu || 1000,
      };
    });
    const dsKho = [...dsKhoVai, ...dsKhoPL];

    return tinhTatCaCanhBao(
      [],
      dsKho.length > 0 ? dsKho : undefined,
      undefined,
      dsLenhCat,
      undefined,
      phanCong
    );
  }, [dsLenhCat, danhSachTrangThai, phanCong, lastCheck]);

  const thongKe = useMemo(() => thongKeCanhBao(canhBaos), [canhBaos]);

  // Điểm an toàn vận hành (%)
  const safetyScore = useMemo(() => {
    const tong = canhBaos.length;
    if (tong === 0) return 100;
    const penalty = thongKe.cao * 15 + thongKe.trungBinh * 8 + thongKe.thap * 3;
    return Math.max(50, Math.min(100, 100 - penalty));
  }, [canhBaos, thongKe]);

  // Auto refresh mỗi 30s
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setLastCheck(new Date());
      setCountdown(30);
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Countdown timer mỗi giây
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [autoRefresh]);

  // Lọc theo search, loại và mức độ
  const filtered = useMemo(() => {
    return canhBaos.filter((cb) => {
      if (filterLoai !== "all" && cb.loai !== filterLoai) return false;
      if (filterMucDo !== "all" && cb.mucDo !== filterMucDo) return false;
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchTitle = cb.tieuDe.toLowerCase().includes(query);
        const matchDesc = cb.noiDung.toLowerCase().includes(query);
        const matchTarget = (cb.doiTuong || "").toLowerCase().includes(query);
        if (!matchTitle && !matchDesc && !matchTarget) return false;
      }
      return true;
    });
  }, [canhBaos, filterLoai, filterMucDo, searchTerm]);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Hero Header Card - Chuẩn Thẻ Trắng Cao Cấp */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 via-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Trung tâm cảnh báo rủi ro
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                Live Radar Scanner
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800">
                Quét tự động 30s
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 font-medium mt-0.5">
              Tự động quét và cảnh báo Lệnh Cắt quá hạn, lỗi công đoạn, tồn kho dưới ngưỡng & công nợ gia công
            </p>
          </div>
        </div>

        {/* Quick Actions Navigation */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-brand-600" /> Bàn làm việc
          </Link>
          <Link
            href="/bang-dieu-hanh-sx"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            <Factory className="w-3.5 h-3.5 text-blue-600" /> Bảng điều hành SX
          </Link>
          <Link
            href="/realtime"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            <BarChart3 className="w-3.5 h-3.5 text-teal-600" /> Báo cáo BI
          </Link>
        </div>
      </div>

      {/* Real-time Status Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-emerald-800 dark:text-emerald-300">
              Radar Đang Hoạt Động
            </span>
          </div>

          <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>

          <span className="text-slate-600 dark:text-slate-300 font-medium">
            Lần quét gần nhất: <strong className="text-slate-900 dark:text-white">{lastCheck.toLocaleTimeString("vi-VN")}</strong>
          </span>

          {autoRefresh && (
            <>
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>
              <span className="text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-brand-600 animate-spin" />
                Quét lại sau: <span className="font-bold text-brand-700 dark:text-brand-400">{countdown}s</span>
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all ${
              autoRefresh
                ? "bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/80"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200"
            }`}
          >
            {autoRefresh ? "✓ Tự động (30s)" : "Tắt Auto"}
          </button>
          <button
            onClick={() => {
              setLastCheck(new Date());
              setCountdown(30);
            }}
            className="text-xs px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 font-bold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Quét rủi ro ngay
          </button>
        </div>
      </div>

      {/* Row 1: 4 KPI Cards Mức độ Rủi ro (Solid White Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-4 hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-rose-100/90 dark:bg-rose-950/60 border border-rose-200/80 flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5 text-rose-700 dark:text-rose-400" />
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200">
              P0 Khẩn cấp
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {thongKe.cao} sự cố
          </div>
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">
            Rủi ro mức Cao (Cần can thiệp ngay)
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Hàng lỗi công đoạn, trễ hạn &gt; 5 ngày
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-4 hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-100/90 dark:bg-amber-950/60 border border-amber-200/80 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200">
              P1 Cần đôn đốc
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {thongKe.trungBinh} cảnh báo
          </div>
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">
            Rủi ro Trung bình (Cần theo dõi)
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Kho chạm ngưỡng tối thiểu, trễ 1-3 ngày
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-4 hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-100/90 dark:bg-blue-950/60 border border-blue-200/80 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200">
              P2 Nhắc nhở
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {thongKe.thap} nhắc việc
          </div>
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">
            Rủi ro Thấp (Lưu ý dây chuyền)
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Thiếu sơ đồ cắt, sắp đến hạn hoàn thành
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-4 hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100/90 dark:bg-emerald-950/60 border border-emerald-200/80 flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
              An toàn
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {safetyScore}%
          </div>
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">
            Điểm kiểm soát an toàn xưởng
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {thongKe.tong === 0 ? "100% dây chuyền đạt chuẩn" : `Đang xử lý ${thongKe.tong} hạng mục`}
          </div>
        </div>
      </div>

      {/* Row 2: Bộ lọc nhanh theo danh mục cảnh báo (5 Category Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Object.entries(LOAI_INFO).map(([loai, info]) => {
          const count = thongKe.theoLoai[loai as LoaiCanhBao] || 0;
          const Icon = info.icon;
          const isSelected = filterLoai === loai;
          return (
            <button
              key={loai}
              onClick={() => setFilterLoai(isSelected ? "all" : (loai as LoaiCanhBao))}
              className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-md"
                  : "bg-white dark:bg-slate-900 text-slate-800 dark:text-white border-slate-200/90 dark:border-slate-800 hover:border-slate-300 shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-xl ${isSelected ? "bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900" : `${info.bg} ${info.mau}`}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-base font-black ${isSelected ? "text-white dark:text-slate-900" : "text-slate-900 dark:text-white"}`}>
                  {count}
                </span>
              </div>
              <div className={`text-xs font-bold ${isSelected ? "text-white dark:text-slate-900" : "text-slate-700 dark:text-slate-300"}`}>
                {info.ten}
              </div>
            </button>
          );
        })}
      </div>

      {/* Row 3: Thanh điều khiển & Tìm kiếm */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-3.5 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo mã lệnh, sản phẩm, đối tác..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <select
            value={filterMucDo}
            onChange={(e) => setFilterMucDo(e.target.value as any)}
            className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">🚦 Tất cả mức độ</option>
            <option value="cao">🔴 P0 Khẩn cấp</option>
            <option value="trung-binh">🟡 P1 Cần xử lý</option>
            <option value="thap">🔵 P2 Theo dõi</option>
          </select>

          <select
            value={filterLoai}
            onChange={(e) => setFilterLoai(e.target.value as any)}
            className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">📋 Tất cả danh mục</option>
            {Object.entries(LOAI_INFO).map(([k, v]) => (
              <option key={k} value={k}>{v.ten}</option>
            ))}
          </select>

          {(filterLoai !== "all" || filterMucDo !== "all" || searchTerm.trim()) && (
            <button
              onClick={() => {
                setFilterLoai("all");
                setFilterMucDo("all");
                setSearchTerm("");
              }}
              className="text-xs px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300 transition-colors"
            >
              Đặt lại
            </button>
          )}
        </div>
      </div>

      {/* Row 4: Danh Sách Thẻ Cảnh Báo (Alert Cards) */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 mx-auto flex items-center justify-center mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-black text-base text-slate-900 dark:text-white">
              Dây chuyền an toàn tuyệt đối
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Không tìm thấy vấn đề hay sự cố nào tồn đọng theo bộ lọc hiện tại. Mọi Lệnh Cắt và công đoạn xưởng đều đúng kế hoạch.
            </p>
          </div>
        ) : (
          filtered.map((cb) => <AlertCardModern key={cb.id} cb={cb} />)
        )}
      </div>
    </div>
  );
}

// Thẻ Cảnh Báo Thiết Kế Hiện Đại - Viền Nhận Diện Rõ Ràng
function AlertCardModern({ cb }: { cb: CanhBao }) {
  const loai = LOAI_INFO[cb.loai];
  const mucDo = MUCDO_INFO[cb.mucDo];
  const LoaiIcon = loai.icon;
  const MucDoIcon = mucDo.icon;

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-4 md:p-5 hover:shadow-md transition-all relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 ${loai.border}`}>
      <div className="flex items-start gap-3.5 flex-1 min-w-0">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${loai.bg} ${loai.mau} border border-slate-200/60 dark:border-slate-700/60`}>
          <LoaiIcon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-black text-sm md:text-base text-slate-900 dark:text-white">
              {cb.tieuDe}
            </h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 ${mucDo.badge}`}>
              <MucDoIcon className="w-3 h-3" />
              {mucDo.ten}
            </span>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              · {loai.ten}
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mb-2 leading-relaxed">
            {cb.noiDung}
          </p>

          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
            <span className="flex items-center gap-1">
              👤 Phụ trách: <strong className="text-slate-800 dark:text-slate-200">{cb.doiTuong}</strong>
            </span>

            {cb.giaTri !== undefined && (
              <>
                <span>•</span>
                <span className="text-slate-700 dark:text-slate-300">
                  {cb.loai === "kho-sap-het" && `📦 Còn tồn: ${cb.giaTri.toLocaleString()} ${cb.donVi}`}
                  {cb.loai === "lsx-qua-han" && `⏰ Quá hạn: ${cb.giaTri} ${cb.donVi}`}
                  {cb.loai === "cong-no-qua-han" && `💰 Dư nợ: ${formatVNDShort(cb.giaTri)}`}
                  {cb.loai === "cn-tre-sl" && `⚠️ Lỗi/Trễ: ${cb.giaTri} ${cb.donVi}`}
                  {cb.loai === "ncc-vuot-han-muc" && `💳 Vượt: ${formatVNDShort(cb.giaTri)}`}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action Button */}
      {cb.lienKet && (
        <div className="shrink-0 flex md:flex-col justify-end items-end gap-1.5 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
          <Link
            href={cb.lienKet}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 transition-all shadow-sm group"
          >
            <span>Xử lý ngay</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      )}
    </div>
  );
}
