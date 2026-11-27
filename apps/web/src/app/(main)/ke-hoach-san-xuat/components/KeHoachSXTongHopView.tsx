"use client";

import { useState, useMemo } from "react";
import {
  Scissors, Search, Filter, AlertTriangle, CheckCircle2, Clock,
  Layers, Shirt, Factory, Calendar, Plus, RefreshCw, Eye, Edit3,
  PackageCheck, ArrowRight, Sparkles, Check, ChevronRight, AlertCircle,
  HelpCircle, Tag, CheckSquare, XCircle, ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import type { LenhCat } from "@/lib/data/lenh-cat-store";
import { useDieuPhoiKHSX, type ThongTinDieuPhoi, type TrangThaiBo, type TrangThaiVatTu } from "@/lib/data/dieu-phoi-khsx-store";
import { DieuPhoiLenhCatModal } from "./DieuPhoiLenhCatModal";
import { KeHoachThangView } from "./KeHoachThangView";
import { KeHoach30NgayView } from "./KeHoach30NgayView";

interface KeHoachSXTongHopViewProps {
  dsLenhCat: LenhCat[];
  onZoomImg: (url: string) => void;
  onViewLenhCat: (lenhCatId: string) => void;
}

export function KeHoachSXTongHopView({
  dsLenhCat,
  onZoomImg,
  onViewLenhCat,
}: KeHoachSXTongHopViewProps) {
  const { dieuPhoiMap, getDieuPhoi, capNhatDieuPhoi, toggleDuBo, toggleDuVai } = useDieuPhoiKHSX();

  // Mode chính trong Tổng hợp: Kế hoạch 1 tháng (MRP) HOẶC Kế hoạch 30 ngày HOẶC Điều phối lệnh cắt
  const [tongHopMode, setTongHopMode] = useState<"ke_hoach_thang" | "ke_hoach_30_ngay" | "dieu_phoi_lenh">("ke_hoach_30_ngay");

  // Tab phân chia 2 mục trong Điều phối lệnh:
  // 1: "chua_lam" -> Đang chuẩn bị triển khai & chưa hoàn thành
  // 2: "hoan_thanh" -> Lệnh đã hoàn thành
  const [activeTab, setActiveTab] = useState<"chua_lam" | "hoan_thanh">("chua_lam");

  // Bộ lọc
  const [search, setSearch] = useState("");
  const [filterThieu, setFilterThieu] = useState<"all" | "thieu_bo" | "thieu_vai" | "chua_xuong" | "san_sang">("all");

  // Modal điều phối chi tiết
  const [selectedLC, setSelectedLC] = useState<LenhCat | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Phân loại danh sách
  const { listChuaLam, listHoanThanh } = useMemo(() => {
    const chuaLam: { lc: LenhCat; dp: ThongTinDieuPhoi }[] = [];
    const hoanThanh: { lc: LenhCat; dp: ThongTinDieuPhoi }[] = [];

    dsLenhCat.forEach((lc) => {
      const dp = getDieuPhoi(lc);
      const isFinished = lc.trangThai === "HoanThanh" || dp.buocHienTai === "hoan_thanh";
      if (isFinished) {
        hoanThanh.push({ lc, dp });
      } else {
        chuaLam.push({ lc, dp });
      }
    });

    return { listChuaLam: chuaLam, listHoanThanh: hoanThanh };
  }, [dsLenhCat, getDieuPhoi]);

  // Bộ đếm cảnh báo chuẩn bị
  const thongKe = useMemo(() => {
    let thieuBo = 0;
    let thieuVai = 0;
    let chuaXuong = 0;
    let sanSang = 0;

    listChuaLam.forEach(({ dp }) => {
      const boOk = dp.trangThaiBo === "du_bo";
      const vaiOk = dp.trangThaiVai === "du_vai";
      const xuongOk = !!dp.tenXuongMay;

      if (!boOk) thieuBo++;
      if (!vaiOk) thieuVai++;
      if (!xuongOk) chuaXuong++;
      if (boOk && vaiOk && xuongOk) sanSang++;
    });

    return {
      tongDangChuanBi: listChuaLam.length,
      thieuBo,
      thieuVai,
      chuaXuong,
      sanSang,
      tongHoanThanh: listHoanThanh.length,
    };
  }, [listChuaLam, listHoanThanh]);

  // Danh sách hiển thị theo Tab và Tìm kiếm
  const currentDisplayList = useMemo(() => {
    const target = activeTab === "chua_lam" ? listChuaLam : listHoanThanh;
    const q = search.trim().toLowerCase();

    return target.filter(({ lc, dp }) => {
      // Lọc thiếu gì
      if (activeTab === "chua_lam") {
        if (filterThieu === "thieu_bo" && dp.trangThaiBo === "du_bo") return false;
        if (filterThieu === "thieu_vai" && dp.trangThaiVai === "du_vai") return false;
        if (filterThieu === "chua_xuong" && dp.tenXuongMay) return false;
        if (filterThieu === "san_sang") {
          const isFull = dp.trangThaiBo === "du_bo" && dp.trangThaiVai === "du_vai" && !!dp.tenXuongMay;
          if (!isFull) return false;
        }
      }

      // Lọc từ khóa
      if (!q) return true;
      const matchLC = lc.id.toLowerCase().includes(q);
      const matchSP = (lc.tenSP || "").toLowerCase().includes(q) || (lc.maSP || "").toLowerCase().includes(q);
      const matchVai = (dp.tenVai || "").toLowerCase().includes(q) || (dp.mauVai || "").toLowerCase().includes(q);
      const matchBo = (dp.tenBo || "").toLowerCase().includes(q) || (dp.mauBo || "").toLowerCase().includes(q);
      const matchXuong = (dp.tenXuongMay || "").toLowerCase().includes(q) || (dp.tenXuongInTheu || "").toLowerCase().includes(q);

      return matchLC || matchSP || matchVai || matchBo || matchXuong;
    });
  }, [activeTab, listChuaLam, listHoanThanh, search, filterThieu]);

  return (
    <div className="space-y-4 animate-fade-in w-full">
      {/* THANH CHUYỂN ĐỔI CHẾ ĐỘ: KẾ HOẠCH THÁNG (MRP 40.000 SP) & ĐIỀU PHỐI TRIỂN KHAI LỆNH CẮT */}
      <div className="bg-slate-100/90 dark:bg-slate-800/80 p-1.5 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border border-slate-200/80 dark:border-slate-700/60 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 flex-1">
          <button
            type="button"
            onClick={() => setTongHopMode("ke_hoach_30_ngay")}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              tongHopMode === "ke_hoach_30_ngay"
                ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm border border-emerald-200 dark:border-emerald-800"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-white/50 dark:hover:bg-slate-700/50"
            }`}
          >
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>Kế Hoạch Sản Xuất 30 Ngày</span>
          </button>

          <button
            type="button"
            onClick={() => setTongHopMode("ke_hoach_thang")}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              tongHopMode === "ke_hoach_thang"
                ? "bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm border border-teal-200 dark:border-teal-800"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-white/50 dark:hover:bg-slate-700/50"
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>Kế Hoạch Tháng & Dự Trù Vật Tư</span>
            <span className="hidden md:inline-flex text-[10px] px-2 py-0.5 rounded-full font-black bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
              MRP Tự Động
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTongHopMode("dieu_phoi_lenh")}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              tongHopMode === "dieu_phoi_lenh"
                ? "bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm border border-teal-200 dark:border-teal-800"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-white/50 dark:hover:bg-slate-700/50"
            }`}
          >
            <Scissors className="w-4 h-4 text-teal-600" />
            <span>Điều Phối Triển Khai Lệnh Cắt ({dsLenhCat.length})</span>
          </button>
        </div>
      </div>

      {/* RENDER CHẾ ĐỘ 1: KẾ HOẠCH THÁNG & BÓC TÁCH VẬT TƯ (MRP) */}
      {tongHopMode === "ke_hoach_thang" ? (
        <KeHoachThangView />
      ) : tongHopMode === "ke_hoach_30_ngay" ? (
        <KeHoach30NgayView />
      ) : (
        /* RENDER CHẾ ĐỘ 2: ĐIỀU PHỐI TRIỂN KHAI 10 LỆNH CẮT THỰC TẾ */
        <div className="space-y-4">
      {/* 1. TOP 4 KPI METRICS (Clickable Filter Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        {/* Card 1: Tổng lệnh điều phối */}
        <div
          onClick={() => {
            setActiveTab("chua_lam");
            setFilterThieu("all");
          }}
          className={`bg-white dark:bg-slate-900 rounded-2xl p-4 border transition-all cursor-pointer shadow-xs hover:shadow-sm ${
            filterThieu === "all" && activeTab === "chua_lam"
              ? "border-teal-500 ring-2 ring-teal-500/20"
              : "border-slate-200/90 dark:border-slate-800 hover:border-teal-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Tổng lệnh điều phối
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center text-teal-700 dark:text-teal-400 border border-teal-200/60 dark:border-teal-800/60">
              <Scissors className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight my-1 text-slate-900 dark:text-white">
            {thongKe.tongDangChuanBi} <span className="text-xs font-normal text-slate-400">lệnh</span>
          </div>
          <div className="text-[11px] text-teal-700 dark:text-teal-400 font-semibold flex items-center gap-1">
            <span>Đang chuẩn bị vật tư & xưởng</span>
          </div>
        </div>

        {/* Card 2: Thiếu Bo Cổ */}
        <div
          onClick={() => {
            setActiveTab("chua_lam");
            setFilterThieu(filterThieu === "thieu_bo" ? "all" : "thieu_bo");
          }}
          className={`bg-white dark:bg-slate-900 rounded-2xl p-4 border transition-all cursor-pointer shadow-xs hover:shadow-sm ${
            filterThieu === "thieu_bo" && activeTab === "chua_lam"
              ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20"
              : "border-rose-200/80 dark:border-rose-900/40 hover:border-rose-400"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
              Lệnh thiếu Bo Cổ
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight my-1 text-rose-600 dark:text-rose-400">
            {thongKe.thieuBo} <span className="text-xs font-normal text-slate-400">lệnh</span>
          </div>
          <div className="text-[11px] text-rose-600/90 font-medium">Cần đặt dệt bo / gom kho bo</div>
        </div>

        {/* Card 3: Thiếu Vải Chính */}
        <div
          onClick={() => {
            setActiveTab("chua_lam");
            setFilterThieu(filterThieu === "thieu_vai" ? "all" : "thieu_vai");
          }}
          className={`bg-white dark:bg-slate-900 rounded-2xl p-4 border transition-all cursor-pointer shadow-xs hover:shadow-sm ${
            filterThieu === "thieu_vai" && activeTab === "chua_lam"
              ? "border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20"
              : "border-amber-200/80 dark:border-amber-900/40 hover:border-amber-400"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Lệnh thiếu Vải Chính
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60">
              <Shirt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight my-1 text-amber-600 dark:text-amber-400">
            {thongKe.thieuVai} <span className="text-xs font-normal text-slate-400">lệnh</span>
          </div>
          <div className="text-[11px] text-amber-600/90 font-medium">Cần xuất kho hoặc nhập thêm</div>
        </div>

        {/* Card 4: Chưa gán xưởng */}
        <div
          onClick={() => {
            setActiveTab("chua_lam");
            setFilterThieu(filterThieu === "chua_xuong" ? "all" : "chua_xuong");
          }}
          className={`bg-white dark:bg-slate-900 rounded-2xl p-4 border transition-all cursor-pointer shadow-xs hover:shadow-sm ${
            filterThieu === "chua_xuong" && activeTab === "chua_lam"
              ? "border-sky-500 ring-2 ring-sky-500/20 bg-sky-50/20"
              : "border-sky-200/80 dark:border-sky-900/40 hover:border-sky-400"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider">
              Chưa gán xưởng may
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center text-sky-600 dark:text-sky-400 border border-sky-200/60 dark:border-sky-800/60">
              <Factory className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight my-1 text-sky-600 dark:text-sky-400">
            {thongKe.chuaXuong} <span className="text-xs font-normal text-slate-400">lệnh</span>
          </div>
          <div className="text-[11px] text-sky-600/90 font-medium">Cần điều phối xưởng gia công</div>
        </div>
      </div>

      {/* 2. THANH ĐIỀU HƯỚNG TỔNG HỢP (Sub-tab + Bộ lọc nhanh + Tìm kiếm) */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        {/* Hàng 1: Phân chia 2 mục chính & Bộ lọc trạng thái */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Segmented control: Chưa làm / Đã hoàn thành */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/60 dark:border-slate-700/60 w-full sm:w-fit shrink-0">
            <button
              type="button"
              onClick={() => {
                setActiveTab("chua_lam");
                setFilterThieu("all");
              }}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "chua_lam"
                  ? "bg-teal-700 text-white shadow-xs dark:bg-teal-600"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Đang Chuẩn Bị Triển Khai</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                activeTab === "chua_lam" ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
              }`}>
                {thongKe.tongDangChuanBi}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("hoan_thanh");
                setFilterThieu("all");
              }}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "hoan_thanh"
                  ? "bg-teal-700 text-white shadow-xs dark:bg-teal-600"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mục Đã Hoàn Thành</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                activeTab === "hoan_thanh" ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
              }`}>
                {thongKe.tongHoanThanh}
              </span>
            </button>
          </div>

          {/* Quick filter pills (ở tab Chưa làm) */}
          {activeTab === "chua_lam" && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar tab-scroll-mobile">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                Lọc nhanh:
              </span>
              <button
                type="button"
                onClick={() => setFilterThieu("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
                  filterThieu === "all"
                    ? "bg-slate-900 text-white dark:bg-slate-700 shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                Tất cả ({thongKe.tongDangChuanBi})
              </button>
              <button
                type="button"
                onClick={() => setFilterThieu("thieu_bo")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
                  filterThieu === "thieu_bo"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300"
                }`}
              >
                Thiếu Bo ({thongKe.thieuBo})
              </button>
              <button
                type="button"
                onClick={() => setFilterThieu("thieu_vai")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
                  filterThieu === "thieu_vai"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300"
                }`}
              >
                Thiếu Vải ({thongKe.thieuVai})
              </button>
              <button
                type="button"
                onClick={() => setFilterThieu("chua_xuong")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
                  filterThieu === "chua_xuong"
                    ? "bg-sky-600 text-white shadow-xs"
                    : "bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200/60 dark:bg-sky-950/40 dark:text-sky-300"
                }`}
              >
                Chưa gán xưởng ({thongKe.chuaXuong})
              </button>
              <button
                type="button"
                onClick={() => setFilterThieu("san_sang")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
                  filterThieu === "san_sang"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                }`}
              >
                ✓ Sẵn sàng ({thongKe.sanSang})
              </button>
            </div>
          )}
        </div>

        {/* Hàng 2: Tìm kiếm & Đếm số lượng */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition placeholder:text-slate-400"
              placeholder="Tìm theo mã lệnh cắt, tên sản phẩm, loại vải, bo cổ hoặc xưởng gia công..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 shrink-0 self-end sm:self-center">
            <span>Hiển thị:</span>
            <span className="font-bold text-teal-700 dark:text-teal-400 font-mono text-sm">
              {currentDisplayList.length}
            </span>
            <span>lệnh cắt</span>
          </div>
        </div>
      </div>

      {/* 3. DANH SÁCH LỆNH CẮT ĐIỀU PHỐI (BỐ CỤC CHUYÊN NGHIỆP) */}
      {currentDisplayList.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <CheckCircle2 className="mx-auto h-12 w-12 text-teal-400" />
          <h3 className="mt-3 text-base font-bold text-slate-800 dark:text-slate-200">
            {activeTab === "chua_lam" ? "Không có lệnh cắt nào phù hợp bộ lọc" : "Chưa có lệnh cắt hoàn thành nào"}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            {activeTab === "chua_lam"
              ? "Tất cả các lệnh cắt đã đầy đủ vật tư hoặc không có lệnh cắt nào trùng khớp với tiêu chí tìm kiếm."
              : "Các lệnh cắt khi được đánh dấu hoàn thành sẽ tự động xuất hiện tại đây."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {currentDisplayList.map(({ lc, dp }) => {
            const firstMau = lc.dsMau?.[0];
            const imgUrl = firstMau?.img || (firstMau as any)?.imgQuan || "";
            const isDuBo = dp.trangThaiBo === "du_bo";
            const isDuVai = dp.trangThaiVai === "du_vai";
            const isCoXuong = !!dp.tenXuongMay;

            // Kiểm tra cảnh báo thiếu gì
            const thieuItems: string[] = [];
            if (!isDuVai) thieuItems.push("Thiếu vải");
            if (!isDuBo) thieuItems.push("Thiếu bo cổ");
            if (!isCoXuong) thieuItems.push("Chưa gán xưởng");

            const isAllReady = thieuItems.length === 0;

            return (
              <div
                key={lc.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-all p-4 sm:p-5 space-y-3.5"
              >
                {/* HÀNG TRÊN: Ảnh + Mã LC + Tên SP + Số Lượng + Trạng thái chuẩn bị + Nút Thao Tác */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  {/* Khối Thông Tin Sản Phẩm */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Ảnh sản phẩm (Zoom được) */}
                    <div
                      className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 cursor-zoom-in group shadow-2xs"
                      onClick={() => imgUrl && onZoomImg(imgUrl)}
                      title="Bấm để xem ảnh lớn"
                    >
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={lc.tenSP}
                          className="w-full h-full object-cover group-hover:scale-110 transition duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No img</div>
                      )}
                    </div>

                    {/* Tên & Mã & Trạng thái chuẩn bị */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-black text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-200/60 dark:border-teal-800/60">
                          {lc.id}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {lc.loaiSP}
                        </span>

                        {isAllReady ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Đã sẵn sàng triển khai (3/3)</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80 dark:bg-rose-950/60 dark:text-rose-300 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Thiếu {thieuItems.length} mục: {thieuItems.join(" · ")}</span>
                          </span>
                        )}
                      </div>

                      <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white mt-1 line-clamp-1" title={lc.tenSP}>
                        {lc.tenSP} {lc.maSP && <span className="text-slate-400 font-normal">({lc.maSP})</span>}
                      </h3>

                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span>
                          Tổng SL: <b className="text-teal-700 dark:text-teal-400 font-mono font-bold">{lc.tongSL.toLocaleString("vi-VN")}</b> sản phẩm
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Hạn giao: <b className="text-slate-700 dark:text-slate-300 font-semibold">{lc.hanHoanThanh || "Chưa gán"}</b></span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Nút Thao Tác (Điều phối chi tiết & Xem lệnh cắt) */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLC(lc);
                        setShowDetailModal(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Điều phối chi tiết</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onViewLenhCat(lc.id)}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem lệnh</span>
                    </button>
                  </div>
                </div>

                {/* HÀNG DƯỚI: 3 CỘT TIẾN TRÌNH THIẾU / ĐỦ CHUẨN XÁC (Vải, Bo, Xưởng) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* 1. VẢI CHÍNH (KHO VẢI) */}
                  <div className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                    isDuVai
                      ? "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800"
                      : "bg-amber-50/30 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/40"
                  }`}>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Shirt className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>Vải chính (Kho vải)</span>
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            isDuVai
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60"
                          }`}
                        >
                          {isDuVai ? "✓ Đã đủ vải" : "⚠️ Thiếu vải"}
                        </span>
                      </div>
                      <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 line-clamp-1" title={dp.tenVai || "Chưa chọn vải"}>
                        {dp.tenVai || "Chưa gán vải từ kho"}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Màu vải: <b className="text-slate-700 dark:text-slate-300">{dp.mauVai || "Theo bảng màu"}</b>
                      </p>
                    </div>

                    {/* Nút toggle Đủ / Thiếu Vải */}
                    <button
                      type="button"
                      onClick={() => toggleDuVai(lc.id, dp.trangThaiVai)}
                      className={`mt-3 w-full py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs ${
                        isDuVai
                          ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300"
                      }`}
                    >
                      {isDuVai ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>✓ Đã đủ vải (Bấm để hủy)</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5 text-amber-600" />
                          <span>Xác nhận: Đã đủ vải</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* 2. BO CỔ (KHO BO) - NÚT XÁC NHẬN HÀI HÒA & ĐẲNG CẤP */}
                  <div className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                    isDuBo
                      ? "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800"
                      : "bg-rose-50/30 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/40"
                  }`}>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                          <span>Bo cổ (Kho bo)</span>
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            isDuBo
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60"
                          }`}
                        >
                          {isDuBo ? "✓ Đã đủ bo" : "⚠️ Thiếu bo"}
                        </span>
                      </div>
                      <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 line-clamp-1" title={dp.tenBo || "Chưa chọn bo"}>
                        {dp.tenBo || "Chưa gán bo cổ"}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Màu bo: <b className="text-slate-700 dark:text-slate-300">{dp.mauBo || "Đồng màu vải"}</b>
                      </p>
                    </div>

                    {/* Nút 1-click cập nhật "ĐÃ ĐỦ BO" cho anh Sang */}
                    <button
                      type="button"
                      onClick={() => toggleDuBo(lc.id, dp.trangThaiBo)}
                      className={`mt-3 w-full py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs ${
                        isDuBo
                          ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-300"
                      }`}
                      title={isDuBo ? "Bấm để đổi sang Thiếu bo" : "Bấm 1-click để xác nhận ĐÃ ĐỦ BO CỔ"}
                    >
                      {isDuBo ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>✓ Đã đủ bo cổ (Bấm để hủy)</span>
                        </>
                      ) : (
                        <>
                          <PackageCheck className="w-3.5 h-3.5 text-rose-600" />
                          <span>Xác nhận: Đã đủ bo</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* 3. XƯỞNG GIA CÔNG MAY & IN/THÊU */}
                  <div className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                    isCoXuong
                      ? "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800"
                      : "bg-sky-50/30 dark:bg-sky-950/20 border-sky-200/80 dark:border-sky-900/40"
                  }`}>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Factory className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                          <span>Xưởng may & In thêu</span>
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            isCoXuong
                              ? "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200/60"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          {isCoXuong ? "Đã gán" : "Chưa gán"}
                        </span>
                      </div>
                      <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 line-clamp-1" title={dp.tenXuongMay || "Chưa chọn xưởng may"}>
                        {dp.tenXuongMay || "Chưa chọn xưởng may"}
                      </p>
                      <p className="text-[11px] text-teal-700 dark:text-teal-400 mt-0.5 line-clamp-1">
                        In/Thêu: <b className="text-slate-700 dark:text-slate-300">{dp.tenXuongInTheu || "Chưa chỉ định"}</b>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLC(lc);
                        setShowDetailModal(true);
                      }}
                      className="mt-3 w-full py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-2xs"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                      <span>{dp.tenXuongMay ? "Đổi xưởng gia công" : "+ Gán xưởng may"}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
        </div>
      )}

      {/* Modal Điều Phối Chi Tiết */}
      {selectedLC && (
        <DieuPhoiLenhCatModal
          open={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedLC(null);
          }}
          lenhCat={selectedLC}
          dieuPhoi={getDieuPhoi(selectedLC)}
          onSave={(patch) => {
            capNhatDieuPhoi(selectedLC.id, patch);
          }}
          onZoomImg={onZoomImg}
        />
      )}
    </div>
  );
}
