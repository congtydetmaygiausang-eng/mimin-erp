"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  Phone,
  Mail,
  MapPin,
  Star,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Award,
  FileText,
  Bookmark,
  Building2,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  MessageCircle,
  Sparkles,
  ArrowUpRight,
  Filter,
  Check,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { formatVND, formatVNDShort } from "@/lib/data/real-data";
import { Avatar } from "@/components/Avatar";
import { DataViewToggle, type ViewMode } from "@/components/DataViewToggle";
import { useKhachHang, type KhachHangUI, formatLoaiKH, cleanCorruptedText } from "@/lib/data/khach-hang-store";
import { scoreCustomer } from "@/components/ui/SearchableCustomerSelect";

// Helper lấy doanh thu và số đơn hàng từ ghi chú dữ liệu
function getDoanhThu(k: KhachHangUI): number {
  if (!k.ghiChu) return 0;
  const match = k.ghiChu.match(/doanh thu tích lũy:\s*([\d\.]+)/i);
  if (match) return Number(match[1].replace(/\./g, "")) || 0;
  return 0;
}

function getSoDon(k: KhachHangUI): number {
  if (!k.ghiChu) return 0;
  const match = k.ghiChu.match(/tổng số đơn:\s*(\d+)/i);
  if (match) return Number(match[1]) || 0;
  return 0;
}

function getLoaiBadgeStyle(loai?: string): { bg: string; text: string; border: string } {
  const formatted = formatLoaiKH(loai);
  switch (formatted) {
    case "Đại lý cấp 1":
      return { bg: "bg-teal-50 dark:bg-teal-950/50", text: "text-teal-700 dark:text-teal-300", border: "border-teal-200 dark:border-teal-800" };
    case "Đại lý cấp 2":
      return { bg: "bg-cyan-50 dark:bg-cyan-950/50", text: "text-cyan-700 dark:text-cyan-300", border: "border-cyan-200 dark:border-cyan-800" };
    case "Shop":
      return { bg: "bg-blue-50 dark:bg-blue-950/50", text: "text-blue-700 dark:text-blue-300", border: "border-blue-200 dark:border-blue-800" };
    case "Công ty":
      return { bg: "bg-violet-50 dark:bg-violet-950/50", text: "text-violet-700 dark:text-violet-300", border: "border-violet-200 dark:border-violet-800" };
    case "Xưởng":
    case "Khách hàng xưởng":
      return { bg: "bg-amber-50 dark:bg-amber-950/50", text: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800" };
    case "Cá nhân":
      return { bg: "bg-sky-50 dark:bg-sky-950/50", text: "text-sky-700 dark:text-sky-300", border: "border-sky-200 dark:border-sky-800" };
    case "Khách sỉ":
      return { bg: "bg-emerald-50 dark:bg-emerald-950/50", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800" };
    default:
      return { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-300", border: "border-slate-200/80 dark:border-slate-700" };
  }
}

export default function KhachHangPage() {
  const { list, themKhachHang, suaKhachHang, xoaKhachHang, loading } = useKhachHang();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState<{ mode: "add" | "edit"; kh?: KhachHangUI; initialLoai?: string } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [activeFilter, setActiveFilter] = useState<"all" | "si" | "xuong" | "vip" | "ghinho" | "no">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Copy helper
  const copyText = (txt: string, id: string) => {
    if (!txt) return;
    navigator.clipboard.writeText(txt);
    setCopiedId(id);
    toast.success(`Đã sao chép: ${txt}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Đếm nhanh số lượng theo các phân hệ lọc
  const counts = useMemo(() => {
    const raw = list || [];
    const si = raw.filter((k) => k && formatLoaiKH(k.loai) !== "Xưởng" && formatLoaiKH(k.loai) !== "Khách hàng xưởng").length;
    const xuong = raw.filter((k) => k && (formatLoaiKH(k.loai) === "Xưởng" || formatLoaiKH(k.loai) === "Khách hàng xưởng")).length;
    const vip = raw.filter((k) => (k.rating || 0) >= 4.5).length;
    const ghinho = raw.filter((k) => k.ghiNho).length;
    const no = raw.filter((k) => (k.congNo || 0) > 0).length;
    return { all: raw.length, si, xuong, vip, ghinho, no };
  }, [list]);

  // Bộ lọc kết hợp tìm kiếm thông minh
  const filtered = useMemo(() => {
    const q = (search || "").trim();

    return (list || [])
      .filter((k: KhachHangUI) => {
        if (!k) return false;
        const formattedLoai = formatLoaiKH(k.loai);
        const isXuong = formattedLoai === "Xưởng" || formattedLoai === "Khách hàng xưởng";

        if (activeFilter === "si" && isXuong) return false;
        if (activeFilter === "xuong" && !isXuong) return false;
        if (activeFilter === "vip" && (k.rating || 0) < 4.5) return false;
        if (activeFilter === "ghinho" && !k.ghiNho) return false;
        if (activeFilter === "no" && (k.congNo || 0) <= 0) return false;

        return true;
      })
      .map((k: KhachHangUI) => ({
        customer: k,
        score: q ? scoreCustomer(k, q) : 0,
      }))
      .filter((item) => !q || item.score > 0)
      .sort((a, b) => {
        if (q) return b.score - a.score;
        return 0;
      })
      .map((item) => item.customer);
  }, [list, search, activeFilter]);

  // Các chỉ số tài chính và hoạt động
  const tongKH = filtered.length;
  const dsVIP = (list || []).filter((k) => (k.rating || 0) >= 4.5);
  const tongDoanhThu = (list || []).reduce((sum, k) => sum + getDoanhThu(k), 0);
  const tongSoDon = (list || []).reduce((sum, k) => sum + getSoDon(k), 0);
  const tongCongNo = (list || []).reduce((sum, k) => sum + (k.congNo || 0), 0);

  // Top 3 khách hàng doanh số lớn nhất
  const topKH = useMemo(() => {
    return [...(list || [])].sort((a, b) => getDoanhThu(b) - getDoanhThu(a)).slice(0, 3);
  }, [list]);

  // Đổi trạng thái ghi nhớ
  const toggleGhiNho = async (kh: KhachHangUI, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await suaKhachHang({ ...kh, ghiNho: !kh.ghiNho });
      if (!kh.ghiNho) toast.success(`Đã thêm vào danh sách ghi nhớ: ${kh.ten}`);
      else toast.info(`Đã bỏ ghi nhớ: ${kh.ten}`);
    } catch (err: any) {
      toast.error(`Lỗi: ${err.message}`);
    }
  };

  // Lưu Khách Hàng (Thêm mới hoặc Cập nhật)
  const handleSave = async (kh: KhachHangUI) => {
    const isEdit = showForm?.mode === "edit";
    if (isEdit) {
      try {
        await suaKhachHang(kh);
        toast.success(`Đã cập nhật khách hàng: ${kh.ten}`);
      } catch (err: any) {
        toast.error(`Lỗi khi sửa: ${err.message}`);
      }
    } else {
      if (list.some((x) => x.maKH === kh.maKH)) {
        toast.error(`Mã KH "${kh.maKH}" đã có người dùng. Vui lòng đổi sang mã khác trước khi lưu.`);
        return;
      }

      const chuanHoa = (s: string) => (s || "").trim().toLowerCase().replace(/\s+/g, " ");
      const soDT = (s: string) => (s || "").replace(/\D/g, "");
      const trungTen = list.find((x) => chuanHoa(x.ten) === chuanHoa(kh.ten));
      const trungSDT = kh.sdt ? list.find((x) => soDT(x.sdt) && soDT(x.sdt) === soDT(kh.sdt)) : undefined;
      const trung = trungTen || trungSDT;
      if (trung) {
        const lyDo = trungTen ? `trùng tên với "${trung.ten}"` : `trùng số điện thoại với "${trung.ten}"`;
        if (
          !confirm(
            `Khách hàng này ${lyDo} (mã ${trung.maKH}).\n\nNếu là cùng một người, vui lòng hủy và sửa hồ sơ hiện có để tránh phân mảnh công nợ.\n\nBạn vẫn muốn tạo hồ sơ mới?`
          )
        ) {
          return;
        }
      }
      try {
        await themKhachHang(kh);
        toast.success(`Đã thêm khách hàng mới: ${kh.ten}`);
      } catch (err: any) {
        toast.error(`Lỗi khi thêm mới: ${err.message}`);
      }
    }
    setShowForm(null);
  };

  // Xóa Khách Hàng
  const handleDelete = async (kh: KhachHangUI) => {
    if (confirm(`Bạn có chắc muốn xoá khách hàng "${kh.ten}" (${kh.maKH}) khỏi hệ thống?`)) {
      const ok = await xoaKhachHang(kh.maKH);
      if (ok) toast.success(`Đã xoá khách hàng: ${kh.ten}`);
      else toast.error("Lỗi khi xoá khách hàng");
    }
  };

  // Xuất file CSV
  const handleExportCSV = () => {
    const headers = [
      "Mã KH",
      "Tên Khách Hàng / Shop",
      "Phân Loại",
      "SĐT",
      "Email",
      "Địa Chỉ",
      "Mã Số Thuế",
      "Đánh Giá (Sao)",
      "Số Đơn",
      "Doanh Thu (đ)",
      "Công Nợ (đ)",
      "Hạn Mức Nợ (đ)",
      "Facebook URL",
      "Ghi Chú",
    ];
    const rows = filtered.map((k) => [
      `"${k.maKH}"`,
      `"${k.ten}"`,
      `"${k.loai || ""}"`,
      `"${k.sdt || ""}"`,
      `"${k.email || ""}"`,
      `"${k.diaChi || ""}"`,
      `"${k.mst || ""}"`,
      k.rating || 4,
      getSoDon(k),
      getDoanhThu(k),
      k.congNo || 0,
      k.hanMucNo || 0,
      `"${k.facebookUrl || ""}"`,
      `"${(k.ghiChu || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Danh_Sach_Khach_Hang_POLOMIMIN_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Đã xuất danh sách khách hàng ra file CSV thành công");
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 w-full max-w-full overflow-x-hidden">
      {/* ========================================================================= */}
      {/* 1. HERO COMMAND BANNER KHÁCH HÀNG (MÀU SÁNG, SANG TRỌNG, ĐẲNG CẤP)        */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-white via-teal-50/70 to-emerald-50/80 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6 md:p-7 shadow-sm border border-teal-200/90 dark:border-teal-800/80 group">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-teal-400/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300 border border-teal-200 dark:border-teal-800 shadow-2xs">
                <Users className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                Hệ thống Quản lý Đối tác & Khách Hàng Sỉ POLOMIMIN
              </span>
              {loading && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 animate-pulse">
                  Đang đồng bộ Cloud...
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 via-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-teal-500/25">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Khách Hàng & Hệ Thống Đại Lý Sỉ
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                  Quản lý hồ sơ đối tác sỉ, cửa hàng thời trang, khách xưởng may, công nợ gối đầu và doanh thu tích lũy
                </p>
              </div>
            </div>

            {/* Quick Summary Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs">
                👥 {counts.all} đối tác khách hàng
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-2xs">
                <Award className="w-3.5 h-3.5 text-amber-600" /> {counts.vip} khách hàng VIP
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Doanh thu: {formatVNDShort(tongDoanhThu)}
              </span>
              {tongCongNo > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shadow-2xs">
                  <CreditCard className="w-3.5 h-3.5 text-rose-600" /> Công nợ KH: {formatVNDShort(tongCongNo)}
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 font-bold text-xs sm:text-sm border border-slate-200 dark:border-slate-700 transition active:scale-95 shadow-2xs cursor-pointer"
              title="Xuất file Excel/CSV danh sách khách hàng"
            >
              <FileText className="w-4 h-4 text-teal-600" />
              Xuất CSV
            </button>
            <button
              onClick={() => setShowForm({ mode: "add", initialLoai: "Đại lý cấp 1" })}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-teal-600/20 hover:-translate-y-0.5 active:translate-y-0 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Thêm Khách Hàng
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. BỐN TRỤ CỘT KPI KHÁCH HÀNG & KINH DOANH (GIÀU MÀU SẮC, RÕ RÀNG)        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Tổng khách hàng */}
        <div className="card p-5 bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-white dark:to-slate-900 border border-teal-300/80 dark:border-teal-800/80 rounded-3xl shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-800 dark:text-teal-300 flex items-center gap-1.5 uppercase tracking-wide">
              <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-700 dark:text-teal-300 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              Tổng Khách Hàng
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-800 dark:text-teal-300 font-bold">
              {counts.all} đối tác
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
              {counts.all} <span className="text-sm font-bold text-slate-500 font-sans">KH</span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex items-center justify-between font-medium">
              <span>Đại lý sỉ: {counts.si}</span>
              <span>Xưởng: {counts.xuong}</span>
            </div>
            <div className="mt-2 text-xs flex items-center justify-between bg-teal-50/80 dark:bg-slate-800/60 px-2.5 py-1 rounded-xl border border-teal-200 dark:border-teal-800">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Đang giao dịch:</span>
              <span className="font-bold text-teal-700 dark:text-teal-300">100% kết nối</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Khách hàng VIP */}
        <div className="card p-5 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-white dark:to-slate-900 border border-amber-300/80 dark:border-amber-800/80 rounded-3xl shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 uppercase tracking-wide">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
              Khách Hàng VIP
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold">
              ≥ 4.5⭐
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black font-mono tracking-tight text-amber-700 dark:text-amber-400 tabular-nums">
              {counts.vip} <span className="text-sm font-bold text-slate-500 font-sans">đối tác</span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex items-center justify-between font-medium">
              <span>Đại lý cấp 1 & chuỗi shop</span>
              <span className="text-amber-600 font-bold">Uy tín cao</span>
            </div>
            <div className="mt-2 text-xs flex items-center justify-between bg-amber-50/80 dark:bg-slate-800/60 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Doanh số ổn định:</span>
              <span className="font-bold text-amber-700 dark:text-amber-300">Nhập hàng đều</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Tổng doanh thu tích lũy */}
        <div className="card p-5 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-white dark:to-slate-900 border border-emerald-300/80 dark:border-emerald-800/80 rounded-3xl shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 uppercase tracking-wide">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              Tổng Doanh Thu
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold">
              Tích lũy
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black font-mono tracking-tight text-emerald-700 dark:text-emerald-400 tabular-nums">
              {formatVNDShort(tongDoanhThu)}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex items-center justify-between font-medium">
              <span>Chốt theo đơn đặt hàng</span>
              <span className="text-emerald-600 font-bold">Đã thu & ghi sổ</span>
            </div>
            <div className="mt-2 text-xs flex items-center justify-between bg-emerald-50/80 dark:bg-slate-800/60 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Chi tiết:</span>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">{formatVND(tongDoanhThu)}</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Tổng đơn hàng */}
        <div className="card p-5 bg-gradient-to-br from-sky-500/10 via-indigo-500/5 to-white dark:to-slate-900 border border-sky-300/80 dark:border-sky-800/80 rounded-3xl shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-800 dark:text-sky-300 flex items-center gap-1.5 uppercase tracking-wide">
              <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-700 dark:text-sky-300 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4" />
              </div>
              Tổng Đơn Hàng
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-800 dark:text-sky-300 font-bold">
              Thành phẩm
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black font-mono tracking-tight text-sky-700 dark:text-sky-400 tabular-nums">
              {tongSoDon} <span className="text-sm font-bold text-slate-500 font-sans">đơn</span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex items-center justify-between font-medium">
              <span>Trung bình / khách hàng</span>
              <span className="text-sky-600 font-bold">
                {counts.all > 0 ? (tongSoDon / counts.all).toFixed(1) : 0} đơn/KH
              </span>
            </div>
            <div className="mt-2 text-xs flex items-center justify-between bg-sky-50/80 dark:bg-slate-800/60 px-2.5 py-1 rounded-xl border border-sky-200 dark:border-sky-800">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Vận chuyển:</span>
              <span className="font-bold text-sky-700 dark:text-sky-300">Giao hàng tận nơi</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. TOP 3 KHÁCH HÀNG VIP DOANH SỐ LỚN NHẤT                                */}
      {/* ========================================================================= */}
      <div className="card p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-sm">
        <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3.5 flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-500" />
          Top 3 Khách Hàng VIP Có Doanh Thu Cao Nhất
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {topKH.map((k, i) => (
            <div
              key={k.maKH}
              onClick={() => setShowForm({ mode: "edit", kh: k })}
              className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-400/40 hover:border-amber-500/70 transition-all cursor-pointer shadow-2xs group"
            >
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-white shadow-sm shrink-0 ${
                  i === 0
                    ? "bg-gradient-to-tr from-amber-500 to-yellow-400 text-lg"
                    : i === 1
                    ? "bg-gradient-to-tr from-slate-400 to-slate-300 text-base"
                    : "bg-gradient-to-tr from-amber-700 to-amber-600 text-base"
                }`}
              >
                #{i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                  {k.ten || k.maKH || "Khách hàng"}
                </div>
                <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {formatVNDShort(getDoanhThu(k))} · <span className="text-slate-500 font-normal">{getSoDon(k)} đơn hàng</span>
                </div>
                <div className="flex items-center gap-0.5 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3 h-3 ${star <= (k.rating || 0) ? "text-amber-400 fill-amber-400" : "text-slate-300 dark:text-slate-600"}`}
                    />
                  ))}
                  <span className="text-[10px] text-slate-400 ml-1 font-mono">({k.rating}⭐)</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. THANH CÔNG CỤ TÌM KIẾM & BỘ LỌC CHUYÊN NGHIỆP ("NHƯ CÁC KHÂU")          */}
      {/* ========================================================================= */}
      <div className="card p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
        {/* Hàng 1: Ô tìm kiếm toàn năng */}
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600 dark:text-teal-400" />
          <input
            className="w-full pl-11 pr-10 py-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
            placeholder="Tìm theo tên khách hàng, số điện thoại, mã KH, địa chỉ, mã số thuế..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              title="Xóa tìm kiếm"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Hàng 2: Bộ lọc phân hệ chuyên nghiệp & Nút chuyển đổi giao diện */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
          {/* Nhóm Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar tab-scroll-mobile py-1">
            {[
              { id: "all", label: "Tất cả", count: counts.all },
              { id: "si", label: "Đại lý sỉ", count: counts.si },
              { id: "xuong", label: "Khách xưởng", count: counts.xuong },
              { id: "vip", label: "Khách VIP", count: counts.vip },
              { id: "ghinho", label: "Đã ghi nhớ", count: counts.ghinho },
              { id: "no", label: "Có công nợ", count: counts.no },
            ].map((tab) => {
              const active = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id as any)}
                  className={`shrink-0 whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    active
                      ? "bg-teal-600 text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      active ? "bg-white/25 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Phải: Đếm kết quả & Chế độ xem */}
          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Hiển thị: <b className="text-teal-700 dark:text-teal-400 font-mono">{filtered.length}</b> / {list.length} KH
            </span>
            <DataViewToggle onChange={setViewMode} />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. HIỂN THỊ DỮ LIỆU: DẠNG THẺ (CARD VIEW)                                 */}
      {/* ========================================================================= */}
      {viewMode === "card" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((k) => {
            const dt = getDoanhThu(k);
            const soDon = getSoDon(k);
            const isVIP = (k.rating || 0) >= 4.5;
            const hasDebt = (k.congNo || 0) > 0;

            return (
              <div
                key={k.maKH}
                onClick={() => setShowForm({ mode: "edit", kh: k })}
                className="group p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-600 transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Card Header: Avatar + Tên + Bookmark */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={k.ten || k.maKH || "KH"} src={k.avatar} size="lg" />
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                            {k.maKH}
                          </span>
                          {isVIP && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200">
                              VIP
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-1 group-hover:text-teal-600 transition-colors line-clamp-1">
                          {k.ten || k.maKH || "Khách hàng"}
                        </h3>
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getLoaiBadgeStyle(k.loai).bg} ${getLoaiBadgeStyle(k.loai).text} ${getLoaiBadgeStyle(k.loai).border}`}>
                            {formatLoaiKH(k.loai)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => toggleGhiNho(k, e)}
                      className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-amber-500 transition"
                      title={k.ghiNho ? "Bỏ ghi nhớ" : "Ghi nhớ khách hàng này"}
                    >
                      <Bookmark className={`w-4 h-4 ${k.ghiNho ? "fill-amber-500 text-amber-500" : ""}`} />
                    </button>
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-1 mt-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= (k.rating || 0) ? "text-amber-400 fill-amber-400" : "text-slate-200 dark:text-slate-700"
                        }`}
                      />
                    ))}
                    <span className="text-xs text-slate-400 font-mono ml-1">({k.rating || 4}⭐)</span>
                  </div>

                  {/* Contact Info */}
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" /> SĐT:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:${k.sdt}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-mono font-bold text-teal-700 dark:text-teal-400 hover:underline"
                        >
                          {k.sdt}
                        </a>
                        {k.facebookUrl && (
                          <a
                            href={k.facebookUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[#1877F2] hover:scale-110 transition"
                            title="Mở Facebook khách hàng"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>

                    {k.diaChi && (
                      <div className="flex items-start gap-1 text-[11px] text-slate-500 line-clamp-1">
                        <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
                        <span className="truncate">{k.diaChi}</span>
                      </div>
                    )}
                  </div>

                  {/* 2x2 Stats Box */}
                  <div className="grid grid-cols-2 gap-2 mt-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">Doanh thu tích lũy</div>
                      <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {formatVNDShort(dt)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">Số đơn hàng</div>
                      <div className="font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                        {soDon} đơn
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">Công nợ hiện tại</div>
                      <div className={`font-mono font-bold tabular-nums ${hasDebt ? "text-rose-600 font-black" : "text-slate-500"}`}>
                        {hasDebt ? formatVNDShort(k.congNo) : "0 đ"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">Mã số thuế</div>
                      <div className="font-mono text-slate-700 dark:text-slate-300 truncate">
                        {k.mst || "—"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <a
                    href={`https://zalo.me/${k.sdt?.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-bold text-xs text-center border border-teal-200 dark:border-teal-800 transition"
                  >
                    Nhắn Zalo
                  </a>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowForm({ mode: "edit", kh: k });
                    }}
                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                    title="Chỉnh sửa thông tin"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(k);
                    }}
                    className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-600 transition"
                    title="Xóa khách hàng"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. HIỂN THỊ DỮ LIỆU: DẠNG BẢNG (TABLE VIEW)                                */}
      {/* ========================================================================= */}
      {viewMode === "table" && (
        <div className="card bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold bg-slate-50/80 dark:bg-slate-800/60">
                  <th className="py-3 px-4">MÃ KH</th>
                  <th className="py-3 px-4">KHÁCH HÀNG / SHOP</th>
                  <th className="py-3 px-4">SĐT & LIÊN HỆ</th>
                  <th className="py-3 px-4">ĐỊA CHỈ</th>
                  <th className="py-3 px-4 text-center">ĐÁNH GIÁ</th>
                  <th className="py-3 px-4 text-center">SỐ ĐƠN</th>
                  <th className="py-3 px-4 text-right">DOANH THU</th>
                  <th className="py-3 px-4 text-right">CÔNG NỢ</th>
                  <th className="py-3 px-4 text-center">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((k) => {
                  const dt = getDoanhThu(k);
                  const soDon = getSoDon(k);
                  const hasDebt = (k.congNo || 0) > 0;

                  return (
                    <tr
                      key={k.maKH}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                      onClick={() => setShowForm({ mode: "edit", kh: k })}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-teal-600">{k.maKH}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={k.ten || k.maKH || "KH"} src={k.avatar} size="sm" />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                              {k.ten || k.maKH || "Chưa đặt tên"}
                              <button
                                onClick={(e) => toggleGhiNho(k, e)}
                                className="p-0.5 rounded text-slate-300 hover:text-amber-500 transition"
                                title="Ghi nhớ"
                              >
                                <Bookmark className={`w-3.5 h-3.5 ${k.ghiNho ? "fill-amber-500 text-amber-500" : ""}`} />
                              </button>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${getLoaiBadgeStyle(k.loai).bg} ${getLoaiBadgeStyle(k.loai).text} ${getLoaiBadgeStyle(k.loai).border}`}>
                                {formatLoaiKH(k.loai)}
                              </span>
                              {k.mst && <span className="text-[10px] text-slate-400 font-mono">MST: {k.mst}</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`tel:${k.sdt}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-mono font-bold text-teal-700 dark:text-teal-400 hover:underline"
                          >
                            {k.sdt}
                          </a>
                          {k.facebookUrl && (
                            <a
                              href={k.facebookUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[#1877F2] hover:scale-110 transition"
                              title="Facebook"
                            >
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                              </svg>
                            </a>
                          )}
                        </div>
                        {k.email && <div className="text-[11px] text-slate-400 truncate max-w-[150px]">{k.email}</div>}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-[200px] truncate">
                        {k.diaChi || "—"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${star <= (k.rating || 0) ? "text-amber-400 fill-amber-400" : "text-slate-200"}`}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                        {soDon}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 tabular-nums">
                        {formatVNDShort(dt)}
                      </td>
                      <td className={`py-3 px-4 text-right font-mono font-bold tabular-nums ${hasDebt ? "text-rose-600 font-black" : "text-slate-400"}`}>
                        {hasDebt ? formatVNDShort(k.congNo) : "0 đ"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setShowForm({ mode: "edit", kh: k })}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                            title="Sửa"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(k)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                            title="Xóa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. HIỂN THỊ DỮ LIỆU: DẠNG DANH SÁCH (LIST VIEW)                           */}
      {/* ========================================================================= */}
      {viewMode === "list" && (
        <div className="space-y-2.5">
          {filtered.map((k) => {
            const dt = getDoanhThu(k);
            const soDon = getSoDon(k);
            const hasDebt = (k.congNo || 0) > 0;

            return (
              <div
                key={k.maKH}
                onClick={() => setShowForm({ mode: "edit", kh: k })}
                className="card p-4 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs hover:shadow-md transition flex items-center justify-between gap-4 cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <Avatar name={k.ten || k.maKH || "KH"} src={k.avatar} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200">
                        {k.maKH}
                      </span>
                      <span className="truncate">{k.ten || k.maKH || "Chưa đặt tên"}</span>
                      <button
                        onClick={(e) => toggleGhiNho(k, e)}
                        className="text-slate-300 hover:text-amber-500 transition"
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${k.ghiNho ? "fill-amber-500 text-amber-500" : ""}`} />
                      </button>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-2.5 flex-wrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${getLoaiBadgeStyle(k.loai).bg} ${getLoaiBadgeStyle(k.loai).text} ${getLoaiBadgeStyle(k.loai).border}`}>
                        {formatLoaiKH(k.loai)}
                      </span>
                      <span>·</span>
                      <span>SĐT: <b className="font-mono text-teal-600">{k.sdt}</b></span>
                      <span>·</span>
                      <span>{k.diaChi || "Chưa có địa chỉ"}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-mono font-bold text-sm text-emerald-600">{formatVNDShort(dt)}</div>
                  <div className="text-[11px] text-slate-400">{soDon} đơn hàng {hasDebt ? `· Nợ: ${formatVNDShort(k.congNo)}` : ""}</div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setShowForm({ mode: "edit", kh: k })}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"
                    title="Sửa"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(k)}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600"
                    title="Xóa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL THÊM / CHỈNH SỬA KHÁCH HÀNG (KHFORM)                             */}
      {/* ========================================================================= */}
      {showForm && (
        <KHForm
          mode={showForm.mode}
          kh={showForm.kh}
          initialLoai={showForm.initialLoai}
          dsMaDaCo={list.map((x) => x.maKH)}
          onClose={() => setShowForm(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

// Modal Form Khách Hàng chuyên nghiệp
function KHForm({
  mode,
  kh,
  dsMaDaCo,
  onClose,
  onSave,
  initialLoai,
}: {
  mode: "add" | "edit";
  kh?: KhachHangUI;
  dsMaDaCo: string[];
  onClose: () => void;
  onSave: (k: KhachHangUI) => void;
  initialLoai?: string;
}) {
  const maKHMoi = useMemo(() => {
    const maxSo = dsMaDaCo.reduce((max, ma) => {
      const n = parseInt((ma || "").replace(/^KH-/, ""), 10);
      return isNaN(n) ? max : Math.max(max, n);
    }, 0);
    return `KH-${String(maxSo + 1).padStart(3, "0")}`;
  }, [dsMaDaCo]);

  const [form, setForm] = useState<KhachHangUI>(
    kh
      ? {
          ...kh,
          loai: formatLoaiKH(kh.loai),
          ten: cleanCorruptedText(kh.ten),
          diaChi: cleanCorruptedText(kh.diaChi),
          ghiChu: cleanCorruptedText(kh.ghiChu),
        }
      : {
          maKH: maKHMoi,
          ten: "",
          sdt: "",
          email: "",
          diaChi: "",
          loai: formatLoaiKH(initialLoai || "Đại lý cấp 1"),
          mst: "",
          congNo: 0,
          rating: 4.5,
          ghiChu: "",
          avatar: "",
          facebookUrl: "",
        }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tenTrim = cleanCorruptedText((form.ten || "").trim());
    const sdtTrim = (form.sdt || "").trim();
    const maKHTrim = (form.maKH || "").trim();
    if (!tenTrim || !sdtTrim) return toast.error("Vui lòng nhập Tên Khách Hàng và Số Điện Thoại");
    onSave({
      ...form,
      ten: tenTrim,
      sdt: sdtTrim,
      maKH: maKHTrim,
      loai: formatLoaiKH(form.loai),
      diaChi: cleanCorruptedText(form.diaChi),
      ghiChu: cleanCorruptedText(form.ghiChu),
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full sm:w-[96%] sm:max-w-3xl rounded-t-3xl sm:rounded-3xl flex flex-col min-h-[90vh] sm:min-h-0 max-h-[92vh] sm:max-h-[88vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex-none p-5 sm:p-7 pb-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/15 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold">
              {mode === "add" ? <Plus className="w-6 h-6 stroke-[3]" /> : <Edit2 className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {mode === "add" ? "Thêm Khách Hàng / Đại Lý Sỉ Mới" : `Chỉnh sửa: ${kh?.ten}`}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Nhập thông tin đại lý sỉ, shop quần áo đối tác, hạn mức tín dụng và công nợ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-4">
            {/* Logo / Avatar Upload */}
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-teal-50/50 dark:bg-slate-800/50 border border-teal-200/80 dark:border-slate-700/80">
              <div className="relative group cursor-pointer">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-teal-500/30 shadow-md overflow-hidden bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold">
                  {form.avatar ? (
                    <img src={form.avatar} alt={form.ten} className="w-full h-full object-cover" />
                  ) : (
                    <span>{form.ten ? form.ten.charAt(0).toUpperCase() : "KH"}</span>
                  )}
                </div>
                <label className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition cursor-pointer">
                  <span className="text-xs font-semibold">Tải Logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setForm({ ...form, avatar: ev.target?.result as string });
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>

              <div className="text-center sm:text-left space-y-1">
                <div className="text-sm font-bold text-slate-900 dark:text-white">Biểu trưng / Logo Shop Sỉ</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Tải ảnh đại diện shop sỉ hoặc ảnh đại diện chủ shop để nhận diện nhanh trên hóa đơn & đơn hàng
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Mã KH *</label>
                <input
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono font-bold focus:ring-2 focus:ring-teal-500"
                  value={form.maKH}
                  onChange={(e) => setForm({ ...form, maKH: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Tên Khách Hàng / Tên Shop *
                </label>
                <input
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-teal-500"
                  value={form.ten}
                  onChange={(e) => setForm({ ...form, ten: e.target.value })}
                  placeholder="VD: Shop Thời Trang Lan Anh..."
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Phân loại khách hàng *
                </label>
                <select
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-teal-500"
                  value={formatLoaiKH(form.loai) || "Đại lý cấp 1"}
                  onChange={(e) => setForm({ ...form, loai: e.target.value })}
                >
                  <option value="Đại lý cấp 1">🏆 Đại lý cấp 1 (Mua sỉ SL lớn)</option>
                  <option value="Đại lý cấp 2">🥈 Đại lý cấp 2 (Mua sỉ SL vừa)</option>
                  <option value="Công ty">🏢 Công ty (Có MST)</option>
                  <option value="Shop">🛍️ Shop (Bán lẻ / Chuỗi shop)</option>
                  <option value="Cá nhân">👤 Cá nhân</option>
                  <option value="Khách sỉ">📦 Khách sỉ</option>
                  <option value="Khách hàng xưởng">🏭 Khách hàng xưởng</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">SĐT liên hệ *</label>
                <input
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono font-bold focus:ring-2 focus:ring-teal-500"
                  value={form.sdt}
                  onChange={(e) => setForm({ ...form, sdt: e.target.value })}
                  placeholder="0901234567"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                  Facebook URL
                </label>
                <input
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#1877F2]"
                  value={form.facebookUrl || ""}
                  onChange={(e) => setForm({ ...form, facebookUrl: e.target.value })}
                  placeholder="https://facebook.com/shop-khach-hang"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-teal-500"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="khachhang@example.com"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Địa chỉ nhận hàng / Cửa hàng
              </label>
              <input
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-teal-500"
                value={form.diaChi}
                onChange={(e) => setForm({ ...form, diaChi: e.target.value })}
                placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/TP..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Mã số thuế</label>
                <input
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-teal-500"
                  value={form.mst}
                  onChange={(e) => setForm({ ...form, mst: e.target.value })}
                  placeholder="0312456789"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Công nợ đầu kỳ (đ)</label>
                <input
                  type="number"
                  min={0}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono font-bold focus:ring-2 focus:ring-teal-500"
                  value={form.congNo}
                  onChange={(e) => setForm({ ...form, congNo: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Hạn mức nợ (đ)</label>
                <input
                  type="number"
                  min={0}
                  step={1000000}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono font-bold focus:ring-2 focus:ring-teal-500"
                  value={(form as any).hanMucNo || 0}
                  onChange={(e) => setForm({ ...form, hanMucNo: Number(e.target.value) } as any)}
                  placeholder="30000000"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Đánh giá (sao)</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  step={0.5}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-teal-500"
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Ghi chú sở thích & yêu cầu riêng
              </label>
              <textarea
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-teal-500 min-h-[70px]"
                value={form.ghiChu}
                onChange={(e) => setForm({ ...form, ghiChu: e.target.value })}
                placeholder="Ghi chú đóng gói bao bì riêng, chặng xe chành giao nhận, thỏa thuận chiết khấu..."
              />
            </div>
          </div>

          {/* Modal Action Buttons */}
          <div className="flex-none p-5 sm:p-7 pt-4 flex flex-col-reverse sm:flex-row gap-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-1/3 py-3 rounded-2xl font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="w-full sm:w-2/3 py-3 rounded-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-lg shadow-teal-600/25 transition flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
            >
              {mode === "add" ? <Plus className="w-5 h-5 stroke-[3]" /> : <Edit2 className="w-4 h-4" />}
              {mode === "add" ? "Thêm Khách Hàng mới" : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
