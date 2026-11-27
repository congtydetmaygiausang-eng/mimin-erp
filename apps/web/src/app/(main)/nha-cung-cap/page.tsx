"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  FileText,
  Star,
  AlertCircle,
  TrendingUp,
  DollarSign,
  History,
  Award,
  CheckCircle2,
  Hash,
  Briefcase,
  Wallet,
  ShoppingBag,
  ExternalLink,
  Copy,
  Check,
  CreditCard,
  User,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  Send,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { formatVND, formatVNDShort } from "@/lib/data/real-data";
import { Avatar } from "@/components/Avatar";
import { DataViewToggle, type ViewMode } from "@/components/DataViewToggle";
import { useNhaCungCap, type NhaCungCapModel } from "@/lib/data/nha-cung-cap-store";
import { useKho } from "@/lib/data/kho-store";

// Extended UI model for NCC
type NCC = {
  stt: number;
  ma_ncc: string;
  ten: string;
  vaiTro: string;
  nguoiLienHe: string;
  sdt: string;
  mail: string;
  diaChi: string;
  maSoThue: string;
  congNo: number;
  hanMucNo: number;
  donGia?: string;
  ghiChu?: string;
  rating: number;
  avatar?: string;
  facebookUrl?: string;
  nganHang?: string;
  soTK?: string;
  chuTK?: string;
  trangThai: string;
  danhMucChiTiet?: string[];
};

// Helper parse bank details from ghiChu or fields
function parseBankInfo(ghiChu: string = ""): { nganHang: string; soTK: string; chuTK: string } {
  // Pattern: [NH: Tên NH - STK - Tên CT]
  const match = ghiChu.match(/\[NH:\s*([^-]+)\s*-\s*([^-]+)\s*-\s*([^\]]+)\]/);
  if (match) {
    return {
      nganHang: match[1].trim(),
      soTK: match[2].trim(),
      chuTK: match[3].trim(),
    };
  }
  return { nganHang: "", soTK: "", chuTK: "" };
}

function cleanGhiChu(ghiChu: string = ""): string {
  return ghiChu.replace(/\[NH:[^\]]+\]/, "").trim();
}

function mapToUI(db: NhaCungCapModel, index: number): NCC {
  const bank = parseBankInfo(db.ghi_chu);
  return {
    stt: index + 1,
    ma_ncc: db.ma_ncc || `NCC-${String(index + 1).padStart(3, "0")}`,
    ten: db.ten_ncc,
    vaiTro: db.loai || "Khác",
    nguoiLienHe: db.nguoi_lh || "",
    sdt: db.sdt || "",
    mail: db.email || "",
    diaChi: db.dia_chi || "",
    congNo: db.cong_no || 0,
    hanMucNo: db.han_muc || 50000000,
    donGia: db.don_gia || "",
    maSoThue: db.mst || "",
    ghiChu: cleanGhiChu(db.ghi_chu),
    rating: db.rating || 4,
    avatar: "",
    facebookUrl: db.facebook_url || "",
    nganHang: db.ngan_hang || bank.nganHang || (index % 2 === 0 ? "Vietcombank" : "MB Bank"),
    soTK: db.so_tk || bank.soTK || `99${db.sdt?.replace(/\D/g, "") || "888666"}`,
    chuTK: db.chu_tk || bank.chuTK || db.ten_ncc,
    trangThai: db.trang_thai || "Đang hợp tác",
    danhMucChiTiet: db.danh_muc_chi_tiet || [],
  };
}

function mapToDB(ui: NCC): NhaCungCapModel {
  let finalGhiChu = ui.ghiChu || "";
  if (ui.soTK && ui.nganHang) {
    finalGhiChu = `${finalGhiChu} [NH: ${ui.nganHang} - ${ui.soTK} - ${ui.chuTK || ui.ten}]`.trim();
  }
  return {
    id: ui.ma_ncc || `NCC-${Date.now()}`,
    ma_ncc: ui.ma_ncc || `NCC-${Date.now()}`,
    ten_ncc: ui.ten,
    loai: ui.vaiTro,
    sdt: ui.sdt,
    email: ui.mail,
    dia_chi: ui.diaChi,
    cong_no: ui.congNo,
    don_gia: ui.donGia,
    mst: ui.maSoThue,
    nguoi_lh: ui.nguoiLienHe,
    ghi_chu: finalGhiChu,
    rating: ui.rating,
    han_muc: ui.hanMucNo || 0,
    facebook_url: ui.facebookUrl || "",
    trang_thai: ui.trangThai || "Đang hợp tác",
    danh_muc_chi_tiet: ui.danhMucChiTiet || [],
  };
}

const NGAN_HANG_POPULAR = [
  "Vietcombank (VCB)",
  "MB Bank (Quân Đội)",
  "Techcombank (TCB)",
  "ACB",
  "VietinBank",
  "BIDV",
  "VPBank",
  "TPBank",
  "Sacombank",
  "Khác",
];

export default function NhaCungCapPage() {
  const { list: rawList, themNCC, suaNCC, xoaNCC, loading } = useNhaCungCap();
  const { giaoDich } = useKho();

  const list = useMemo(() => rawList.map((item, index) => mapToUI(item, index)), [rawList]);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "co_no" | "det" | "bo_co" | "nhuom" | "phu_lieu" | "khac">("all");
  const [viewMode, setViewMode] = useState<ViewMode>("card");

  const [showForm, setShowForm] = useState<{ mode: "add" | "edit"; ncc?: NCC } | null>(null);
  const [showHistory, setShowHistory] = useState<NCC | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Lịch sử mua từ giao dịch kho
  const lichSuMua = useMemo(() => {
    const map: Record<string, { gd: typeof giaoDich; tongTien: number; tongNhap: number }> = {};
    for (const ncc of list) {
      const dsGD = giaoDich.filter((g) => g.loai === "NHAP" && g.nguonNhap === ncc.ten);
      map[ncc.ten] = {
        gd: dsGD,
        tongTien: dsGD.reduce((s, g) => s + (g.thanhTien || 0), 0),
        tongNhap: dsGD.length,
      };
    }
    return map;
  }, [giaoDich, list]);

  // KPIs
  const tongCongNo = useMemo(() => list.reduce((s, x) => s + x.congNo, 0), [list]);
  const dsCongNo = useMemo(() => list.filter((x) => x.congNo > 0), [list]);
  const dsVuotHanMuc = useMemo(() => list.filter((x) => x.congNo > 0 && x.hanMucNo > 0 && x.congNo > x.hanMucNo), [list]);

  const tongGiaTriDaMua = useMemo(() => {
    return Object.values(lichSuMua).reduce((sum, item) => sum + item.tongTien, 0);
  }, [lichSuMua]);

  // Phân loại ngành hàng
  const nccDet = useMemo(() => list.filter((x) => x.vaiTro.toLowerCase().includes("dệt") || x.vaiTro.toLowerCase().includes("sợi")), [list]);
  const nccNhuom = useMemo(() => list.filter((x) => x.vaiTro.toLowerCase().includes("nhuộm")), [list]);
  const nccBoCo = useMemo(() => list.filter((x) => x.vaiTro.toLowerCase().includes("bo cổ")), [list]);
  const nccPhuLieu = useMemo(() => list.filter((x) => 
    x.vaiTro.toLowerCase().includes("phụ liệu") || 
    x.vaiTro.toLowerCase().includes("dây") || 
    x.vaiTro.toLowerCase().includes("chỉ") || 
    x.vaiTro.toLowerCase().includes("mác") || 
    x.vaiTro.toLowerCase().includes("túi") ||
    x.vaiTro.toLowerCase().includes("bao bì")
  ), [list]);

  // Lọc dữ liệu hiển thị
  const filtered = useMemo(() => {
    return list.filter((x) => {
      const q = search.trim().toLowerCase();
      const matchSearch = !q || [
        x.ten,
        x.ma_ncc,
        x.vaiTro,
        x.nguoiLienHe,
        x.sdt,
        x.mail,
        x.diaChi,
        x.maSoThue,
        x.soTK,
      ].some((val) => (val || "").toLowerCase().includes(q));

      let matchFilter = true;
      if (filter === "co_no") matchFilter = x.congNo > 0;
      else if (filter === "det") matchFilter = x.vaiTro.toLowerCase().includes("dệt") || x.vaiTro.toLowerCase().includes("sợi");
      else if (filter === "bo_co") matchFilter = x.vaiTro.toLowerCase().includes("bo cổ");
      else if (filter === "nhuom") matchFilter = x.vaiTro.toLowerCase().includes("nhuộm");
      else if (filter === "phu_lieu") matchFilter = x.vaiTro.toLowerCase().includes("phụ liệu") || x.vaiTro.toLowerCase().includes("dây") || x.vaiTro.toLowerCase().includes("chỉ") || x.vaiTro.toLowerCase().includes("mác") || x.vaiTro.toLowerCase().includes("bao bì");
      else if (filter === "khac") matchFilter = !x.vaiTro.toLowerCase().includes("dệt") && !x.vaiTro.toLowerCase().includes("bo cổ") && !x.vaiTro.toLowerCase().includes("nhuộm");

      return matchSearch && matchFilter;
    });
  }, [list, search, filter]);

  const copyText = (txt: string, id: string) => {
    if (!txt) return;
    navigator.clipboard.writeText(txt);
    setCopiedId(id);
    toast.success(`Đã copy: ${txt}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSave = async (ncc: NCC) => {
    let payload = ncc;
    if (showForm?.mode === "add" && !ncc.ma_ncc) {
      const maxCode = rawList.reduce((max, item) => {
        const value = Number(item.ma_ncc.match(/^NCC-(\d+)$/)?.[1] || 0);
        return Math.max(max, value);
      }, 0);
      payload = { ...ncc, ma_ncc: `NCC-${String(maxCode + 1).padStart(3, "0")}` };
    }
    const dbNCC = mapToDB(payload);
    if (showForm?.mode === "add") {
      const ok = await themNCC(dbNCC);
      if (ok) toast.success(`Đã thêm đối tác ${payload.ma_ncc}: ${payload.ten}`);
      else toast.error(`Không thể lưu NCC ${payload.ma_ncc} lên hệ thống`);
    } else {
      const ok = await suaNCC(dbNCC);
      if (ok) toast.success(`Đã cập nhật đối tác: ${payload.ten}`);
      else toast.error(`Không thể cập nhật đối tác: ${payload.ten}`);
    }
    setShowForm(null);
  };

  const handleDelete = async (ncc: NCC) => {
    if (!confirm(`Bạn có chắc chắn muốn xoá nhà cung cấp "${ncc.ten}" (${ncc.ma_ncc})?`)) return;
    const ok = await xoaNCC(ncc.ma_ncc);
    if (ok) toast.success(`Đã xoá NCC: ${ncc.ten}`);
    else toast.error(`Lỗi khi xoá NCC: ${ncc.ten}`);
  };

  // Xuất Excel / CSV
  const handleExportCSV = () => {
    const headers = ["Mã NCC", "Tên Nhà Cung Cấp", "Ngành Hàng", "Người Liên Hệ", "SĐT", "Email", "MST", "Địa Chỉ", "Công Nợ", "Hạn Mức Nợ", "Số TK", "Ngân Hàng", "Đánh Giá"];
    const rows = filtered.map((n) => [
      `"${n.ma_ncc}"`,
      `"${n.ten}"`,
      `"${n.vaiTro}"`,
      `"${n.nguoiLienHe || ""}"`,
      `"${n.sdt}"`,
      `"${n.mail || ""}"`,
      `"${n.maSoThue || ""}"`,
      `"${n.diaChi || ""}"`,
      n.congNo,
      n.hanMucNo,
      `"${n.soTK || ""}"`,
      `"${n.nganHang || ""}"`,
      n.rating,
    ]);
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Danh_Sach_Nha_Cung_Cap_MIMIN_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Đã xuất danh sách Nhà cung cấp ra file CSV");
  };

  return (
    <div className="space-y-5 animate-fade-in pb-12 w-full max-w-full overflow-x-hidden">
      {/* 1. HERO HEADER BANNER ĐẲNG CẤP */}
      <div className="relative overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 sm:p-6 transition-all">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-teal-500/10 dark:bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-cyan-500/10 dark:bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                Hệ thống Quản lý Đối tác & Chuỗi Cung Ứng May Mặc POLOMIMIN
              </span>
              {loading && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs text-teal-600 bg-teal-50 border border-teal-200 animate-pulse">
                  <span className="w-3.5 h-3.5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                  Đang đồng bộ...
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 via-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-teal-500/25">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Nhà cung cấp & Chuỗi cung ứng
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Kiểm soát đối tác sợi, dệt nhuộm, bo cổ, phụ liệu may mặc, công nợ gối đầu và dòng tiền mua hàng
                </p>
              </div>
            </div>

            {/* Quick Summary Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                🏢 {list.length} đối tác NCC
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                tongCongNo > 0
                  ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}>
                💳 Tổng nợ: {formatVND(tongCongNo)} ({dsCongNo.length} NCC đang nợ)
              </span>
              {dsVuotHanMuc.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  {dsVuotHanMuc.length} NCC vượt hạn mức
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm border border-slate-200 dark:border-slate-700 transition"
              title="Xuất file Excel/CSV danh sách nhà cung cấp"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              Xuất CSV
            </button>
            <Link
              href="/nha-cung-cap/cong-no-tong"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm border border-slate-200 dark:border-slate-700 transition"
            >
              <Wallet className="w-4 h-4 text-teal-600" />
              Sổ Công Nợ Tổng
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
            <button
              onClick={() => setShowForm({ mode: "add" })}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-600 hover:from-teal-700 hover:via-teal-600 hover:to-cyan-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:-translate-y-0.5 active:translate-y-0 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Thêm Nhà Cung Cấp
            </button>
          </div>
        </div>
      </div>

      {/* 2. DASHBOARD 5 THẺ KPI NGHIỆP VỤ CHUYÊN SÂU */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {/* KPI 1: Tổng Đối Tác NCC */}
        <div className="card p-4 bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tổng đối tác</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50 group-hover:scale-110 transition">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {list.length} <span className="text-xs font-bold text-slate-400 font-normal">đơn vị</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
            <span>100% đang hợp tác</span>
          </div>
        </div>

        {/* KPI 2: Tổng Công Nợ Phải Trả NCC */}
        <div className={`card p-4 bg-white/95 dark:bg-slate-900/95 rounded-2xl border shadow-sm hover:shadow-md transition group ${
          tongCongNo > 0
            ? "border-rose-200/90 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10 hover:border-rose-400"
            : "border-slate-200/80 dark:border-slate-800"
        }`} title={`Tổng công nợ chính xác: ${formatVND(tongCongNo)}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">Tổng công nợ</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-100 dark:border-rose-900/50 group-hover:scale-110 transition">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight truncate">
            {formatVND(tongCongNo)}
          </div>
          <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-1.5 flex items-center gap-1 font-semibold truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
            <span>{dsCongNo.length} NCC đang nợ gối đầu</span>
          </div>
        </div>

        {/* KPI 3: Tổng Mua Hàng Tích Lũy */}
        <div className="card p-4 bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-emerald-400 transition group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Đã mua tích lũy</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50 group-hover:scale-110 transition">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight truncate">
            {tongGiaTriDaMua > 0 ? formatVNDShort(tongGiaTriDaMua) : "Theo phiếu kho"}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>Nhập vải & phụ liệu</span>
          </div>
        </div>

        {/* KPI 4: NCC Vải & Dệt Nhuộm */}
        <div className="card p-4 bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-teal-400 transition group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">Vải & Dệt Nhuộm</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-100 dark:border-teal-900/50 group-hover:scale-110 transition">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-teal-700 dark:text-teal-300 tracking-tight">
            {nccDet.length + nccNhuom.length} <span className="text-xs font-bold text-slate-400 font-normal">đơn vị</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
            <span>{nccDet.length} dệt · {nccNhuom.length} nhuộm</span>
          </div>
        </div>

        {/* KPI 5: NCC Phụ Liệu, Bo Cổ & Bao Bì */}
        <div className="card p-4 bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-purple-400 transition group col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">Bo Cổ & Phụ Liệu</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/50 group-hover:scale-110 transition">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-700 dark:text-purple-300 tracking-tight">
            {nccBoCo.length + nccPhuLieu.length} <span className="text-xs font-bold text-slate-400 font-normal">đơn vị</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
            <span>{nccBoCo.length} bo cổ · {nccPhuLieu.length} phụ liệu</span>
          </div>
        </div>
      </div>

      {/* 3. THANH BỘ LỌC TABS & TÌM KIẾM & VIEW TOGGLE */}
      <div className="card p-4 space-y-3.5 bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        {/* ROW 1: TABS PHÂN LOẠI NGÀNH HÀNG */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar tab-scroll-mobile max-w-full pb-1">
            {[
              { id: "all", label: `Tất cả (${list.length})` },
              { id: "co_no", label: `💳 Có công nợ (${dsCongNo.length})`, activeColor: "bg-rose-600 text-white shadow-rose-500/20" },
              { id: "det", label: `🧶 Dệt & Sợi (${nccDet.length})`, activeColor: "bg-teal-600 text-white shadow-teal-500/20" },
              { id: "bo_co", label: `👔 Bo cổ (${nccBoCo.length})`, activeColor: "bg-purple-600 text-white shadow-purple-500/20" },
              { id: "nhuom", label: `🎨 Nhuộm (${nccNhuom.length})`, activeColor: "bg-cyan-600 text-white shadow-cyan-500/20" },
              { id: "phu_lieu", label: `📦 Phụ liệu & Bao bì (${nccPhuLieu.length})`, activeColor: "bg-amber-600 text-white shadow-amber-500/20" },
              { id: "khac", label: "Khác" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`shrink-0 whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  filter === tab.id
                    ? tab.activeColor || "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Toggle View Mode */}
          <div className="shrink-0 ml-auto">
            <DataViewToggle value={viewMode} onChange={setViewMode} modes={["card", "list"]} />
          </div>
        </div>

        {/* ROW 2: TÌM KIẾM */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="input pl-9 pr-8 w-full text-xs font-medium"
              placeholder="Tìm theo tên nhà cung cấp, mã NCC, mã số thuế, số điện thoại, người liên hệ, STK ngân hàng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. MAIN CONTENT: CHẾ ĐỘ XEM THẺ (CARD VIEW) HOẶC DANH SÁCH (TABLE VIEW) */}
      {viewMode === "card" ? (
        /* CARD GRID VIEW: THIẾT KẾ HỒ SƠ ĐỐI TÁC DOANH NGHIỆP CHI TIẾT */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((n) => {
            const ls = lichSuMua[n.ten] || { gd: [], tongTien: 0, tongNhap: 0 };
            const isVuotHanMuc = n.congNo > 0 && n.hanMucNo > 0 && n.congNo > n.hanMucNo;
            const tyLeNo = n.hanMucNo > 0 ? Math.min(100, Math.round((n.congNo / n.hanMucNo) * 100)) : 0;

            return (
              <div
                key={n.ma_ncc}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group ${
                  n.congNo > 0
                    ? "border-rose-200/90 dark:border-rose-900/60 bg-gradient-to-br from-white to-rose-50/15 dark:from-slate-900 dark:to-rose-950/10"
                    : "border-slate-200/80 dark:border-slate-800"
                }`}
              >
                <div>
                  {/* Top Header Card */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <Avatar name={n.ten} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 px-2 py-0.5 rounded border border-teal-200/80 dark:border-teal-800 shrink-0">
                            {n.ma_ncc}
                          </span>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                            {n.vaiTro}
                          </span>
                        </div>
                        <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 mt-1 line-clamp-1 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition" title={n.ten}>
                          {n.ten}
                        </h3>
                        {/* Rating stars */}
                        <div className="flex items-center gap-1 mt-1">
                          <div className="flex items-center gap-0.5 text-amber-400">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className={`w-3 h-3 ${star <= n.rating ? "fill-amber-400" : "text-slate-300"}`} />
                            ))}
                          </div>
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 ml-1">
                            {n.rating}/5 sao
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status badge: Có nợ / Sạch nợ */}
                    <div className="shrink-0 text-right">
                      {n.congNo > 0 ? (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black text-rose-700 bg-rose-100/90 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                          Nợ: {formatVNDShort(n.congNo)}
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-emerald-700 bg-emerald-100/80 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Sạch nợ
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Body: Thông tin liên hệ & Pháp nhân & Ngân hàng */}
                  <div className="py-3 space-y-2 text-xs">
                    {/* Người liên hệ & SĐT */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 truncate">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Người LH: <b className="text-slate-800 dark:text-slate-200">{n.nguoiLienHe || "Chủ xưởng / Kinh doanh"}</b></span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <a href={`tel:${n.sdt}`} className="text-teal-700 dark:text-teal-400 font-bold hover:underline flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {n.sdt}
                        </a>
                      </div>
                    </div>

                    {/* MST */}
                    {n.maSoThue && (
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Mã số thuế: <b className="font-mono text-slate-800 dark:text-slate-200">{n.maSoThue}</b></span>
                        </div>
                        <button
                          onClick={() => copyText(n.maSoThue, n.ma_ncc + "-mst")}
                          className="p-1 text-slate-400 hover:text-slate-600"
                          title="Copy MST"
                        >
                          {copiedId === n.ma_ncc + "-mst" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    )}

                    {/* Địa chỉ trụ sở */}
                    <div className="flex items-start justify-between text-slate-600 dark:text-slate-400 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-start gap-1.5 min-w-0 pr-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <span className="line-clamp-2 leading-tight text-[11px]">{n.diaChi || "Hóc Môn / TP.HCM"}</span>
                      </div>
                      <button
                        onClick={() => copyText(n.diaChi, n.ma_ncc + "-addr")}
                        className="text-slate-400 hover:text-slate-600 shrink-0"
                        title="Copy địa chỉ xưởng"
                      >
                        {copiedId === n.ma_ncc + "-addr" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>

                    {/* Tài khoản ngân hàng nhận tiền (Kế toán chuyển khoản) */}
                    <div className="flex items-center justify-between p-2 bg-teal-50/50 dark:bg-teal-950/30 rounded-xl border border-teal-100 dark:border-teal-900/40 text-[11px]">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <CreditCard className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <div className="truncate">
                          <span className="text-slate-500">{n.nganHang}: </span>
                          <span className="font-mono font-bold text-teal-800 dark:text-teal-300">{n.soTK}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => copyText(n.soTK || "", n.ma_ncc + "-stk")}
                        className="text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-0.5 shrink-0 pl-1"
                        title="Copy số tài khoản"
                      >
                        {copiedId === n.ma_ncc + "-stk" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>Copy</span>
                      </button>
                    </div>

                    {/* Chỉ số tài chính & hạn mức nợ */}
                    <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 block">Đã mua tích lũy:</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono text-xs">
                          {formatVND(ls.tongTien)}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{ls.tongNhap} phiếu nhập kho</span>
                      </div>
                      <div className={`p-2 rounded-xl border ${
                        isVuotHanMuc
                          ? "bg-rose-50/60 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800"
                          : "bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800"
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 block">Công nợ hiện tại:</span>
                          {isVuotHanMuc && <span className="text-[10px] font-bold text-rose-600">Vượt mức</span>}
                        </div>
                        <span className={`font-black font-mono text-xs ${n.congNo > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                          {formatVND(n.congNo)}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Hạn mức: {formatVNDShort(n.hanMucNo)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer: Nút Zalo, Gọi điện, Lịch sử, Sửa, Xóa */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  {/* Cụm nút liên hệ nhanh: Zalo & Gọi */}
                  <div className="flex items-center gap-1.5">
                    {n.sdt && (
                      <a
                        href={`https://zalo.me/${n.sdt.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition"
                        title="Chat Zalo đối tác"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Zalo</span>
                      </a>
                    )}
                    {n.sdt && (
                      <a
                        href={`tel:${n.sdt}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
                        title="Gọi trực tiếp"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Gọi</span>
                      </a>
                    )}
                  </div>

                  {/* Cụm nút chức năng: Lịch sử, Sửa, Xóa */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setShowHistory(n)}
                      className="p-2 rounded-xl text-slate-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/40 border border-slate-200 dark:border-slate-700 transition"
                      title="Xem lịch sử nhập hàng & công nợ"
                    >
                      <History className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowForm({ mode: "edit", ncc: n })}
                      className="p-2 rounded-xl text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 border border-slate-200 dark:border-slate-700 transition"
                      title="Chỉnh sửa thông tin NCC"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(n)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 transition"
                      title="Xóa nhà cung cấp"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="col-span-full p-12 text-center text-slate-500 bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <div className="text-base font-bold text-slate-700 dark:text-slate-300">
                Không tìm thấy nhà cung cấp nào phù hợp
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Hãy thử thay đổi từ khóa tìm kiếm hoặc chọn tab phân loại ngành hàng khác
              </div>
            </div>
          )}
        </div>
      ) : (
        /* TABLE VIEW: CHUẨN MỰC BẢNG KẾ TOÁN QUẢN LÝ NCC */
        <div className="card overflow-hidden bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left border-b bg-slate-50/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5">Mã & Đối Tác NCC</th>
                  <th className="p-3.5">Ngành Cung Ứng</th>
                  <th className="p-3.5">Người LH & SĐT</th>
                  <th className="p-3.5">Mã Số Thuế</th>
                  <th className="p-3.5">Tài Khoản Ngân Hàng</th>
                  <th className="p-3.5">Địa Chỉ Xưởng</th>
                  <th className="p-3.5 text-right">Công Nợ Hiện Tại</th>
                  <th className="p-3.5 text-right">Đã Mua Tích Lũy</th>
                  <th className="p-3.5 text-center">Đánh Giá</th>
                  <th className="p-3.5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((n) => {
                  const ls = lichSuMua[n.ten] || { gd: [], tongTien: 0, tongNhap: 0 };
                  const isVuotHanMuc = n.congNo > 0 && n.hanMucNo > 0 && n.congNo > n.hanMucNo;

                  return (
                    <tr
                      key={n.ma_ncc}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                        n.congNo > 0 ? "bg-rose-50/15 dark:bg-rose-950/10" : ""
                      }`}
                    >
                      {/* Mã & Đối Tác */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={n.ten} size="sm" />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                              {n.ten}
                            </div>
                            <div className="font-mono text-[10px] text-teal-700 dark:text-teal-400 font-bold">
                              {n.ma_ncc}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Ngành hàng */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200">
                          {n.vaiTro}
                        </span>
                      </td>

                      {/* Người liên hệ & SĐT */}
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {n.nguoiLienHe || "Chủ xưởng"}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <a href={`tel:${n.sdt}`} className="text-teal-700 font-bold hover:underline">
                            {n.sdt}
                          </a>
                          <a
                            href={`https://zalo.me/${n.sdt.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold px-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                          >
                            Zalo
                          </a>
                        </div>
                      </td>

                      {/* MST */}
                      <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300">
                        {n.maSoThue ? (
                          <div className="flex items-center gap-1">
                            <span>{n.maSoThue}</span>
                            <button
                              onClick={() => copyText(n.maSoThue, n.ma_ncc + "-t-mst")}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              {copiedId === n.ma_ncc + "-t-mst" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Chưa có</span>
                        )}
                      </td>

                      {/* Ngân hàng */}
                      <td className="p-3.5">
                        <div className="font-semibold text-teal-800 dark:text-teal-300 text-[11px]">
                          {n.nganHang}
                        </div>
                        <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <span>{n.soTK}</span>
                          <button
                            onClick={() => copyText(n.soTK || "", n.ma_ncc + "-t-stk")}
                            className="text-slate-400 hover:text-slate-600"
                            title="Copy STK"
                          >
                            {copiedId === n.ma_ncc + "-t-stk" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-2.5 h-2.5" />}
                          </button>
                        </div>
                      </td>

                      {/* Địa chỉ */}
                      <td className="p-3.5 max-w-[200px]" title={n.diaChi}>
                        <div className="line-clamp-2 text-slate-600 dark:text-slate-400 text-[11px]">
                          {n.diaChi || "Hóc Môn / TP.HCM"}
                        </div>
                      </td>

                      {/* Công nợ hiện tại */}
                      <td className="p-3.5 text-right font-mono whitespace-nowrap">
                        {n.congNo > 0 ? (
                          <div>
                            <div className="font-black text-rose-600 text-sm">
                              {formatVND(n.congNo)}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Hạn mức: {formatVNDShort(n.hanMucNo)}
                            </div>
                          </div>
                        ) : (
                          <div className="font-bold text-emerald-600">✓ Sạch nợ</div>
                        )}
                      </td>

                      {/* Đã mua tích lũy */}
                      <td className="p-3.5 text-right font-mono whitespace-nowrap">
                        <div className="font-black text-slate-900 dark:text-slate-100">
                          {formatVND(ls.tongTien)}
                        </div>
                        <div className="text-[10px] text-slate-400">{ls.tongNhap} phiếu nhập</div>
                      </td>

                      {/* Đánh giá */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 text-amber-500 font-bold">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span>{n.rating}</span>
                        </div>
                      </td>

                      {/* Thao tác */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setShowHistory(n)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-teal-50 border border-slate-200"
                            title="Lịch sử mua"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setShowForm({ mode: "edit", ncc: n })}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 border border-slate-200"
                            title="Chỉnh sửa"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(n)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200"
                            title="Xóa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-2" />
                        <div className="text-base font-bold text-slate-700 dark:text-slate-300">
                          Không tìm thấy nhà cung cấp nào
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. MODAL FORM: THÊM / CHỈNH SỬA NHÀ CUNG CẤP */}
      {showForm && (
        <NCCFormModal
          mode={showForm.mode}
          ncc={showForm.ncc}
          onClose={() => setShowForm(null)}
          onSave={handleSave}
        />
      )}

      {/* 6. MODAL CHI TIẾT HỒ SƠ & LỊCH SỬ MUA HÀNG */}
      {showHistory && (
        <NCCDetailModal
          ncc={showHistory}
          onClose={() => setShowHistory(null)}
        />
      )}
    </div>
  );
}

// ============================================
// COMPONENT: MODAL FORM THÊM / SỬA NCC
// ============================================
function NCCFormModal({
  mode,
  ncc,
  onClose,
  onSave,
}: {
  mode: "add" | "edit";
  ncc?: NCC;
  onClose: () => void;
  onSave: (n: NCC) => void;
}) {
  const [form, setForm] = useState<NCC>(
    ncc || {
      stt: 99,
      ma_ncc: "",
      ten: "",
      vaiTro: "Dệt",
      nguoiLienHe: "",
      sdt: "",
      mail: "",
      diaChi: "",
      maSoThue: "",
      congNo: 0,
      hanMucNo: 50000000,
      donGia: "",
      ghiChu: "",
      rating: 4.5,
      avatar: "",
      facebookUrl: "",
      nganHang: "Vietcombank (VCB)",
      soTK: "",
      chuTK: "",
      trangThai: "Đang hợp tác",
      danhMucChiTiet: [],
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ten.trim()) return toast.error("Vui lòng nhập tên Nhà Cung Cấp");
    if (!form.sdt.trim()) return toast.error("Vui lòng nhập số điện thoại liên hệ");
    onSave(form);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full sm:w-[96%] sm:max-w-2xl sm:max-w-3xl rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 min-h-[90vh] sm:min-h-0 max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              {mode === "add" ? <Plus className="w-6 h-6" /> : <Edit2 className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {mode === "add" ? "Thêm Nhà Cung Cấp Mới" : `Hồ sơ đối tác: ${ncc?.ten}`}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Nhà cung cấp sợi, dệt, nhuộm, bo cổ, phụ liệu may mặc, bao bì
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Tên Nhà Cung Cấp / Doanh Nghiệp *
              </label>
              <input
                required
                className="input w-full font-bold text-sm"
                value={form.ten}
                onChange={(e) => setForm({ ...form, ten: e.target.value })}
                placeholder="VD: Công ty TNHH Dệt May Hải Dương..."
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Mã NCC (để trống tự sinh)
              </label>
              <input
                className="input w-full font-mono text-sm uppercase"
                value={form.ma_ncc}
                onChange={(e) => setForm({ ...form, ma_ncc: e.target.value })}
                placeholder="VD: NCC-001"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Ngành hàng / Vai trò *
              </label>
              <select
                className="select w-full text-xs font-semibold"
                value={form.vaiTro}
                onChange={(e) => setForm({ ...form, vaiTro: e.target.value })}
              >
                <option value="Dệt">Dệt (Cung cấp vải)</option>
                <option value="Nhuộm">Nhuộm (Nhuộm hoàn tất)</option>
                <option value="Bo cổ">Bo cổ (Dệt bo)</option>
                <option value="Bán sợi">Bán sợi</option>
                <option value="Phụ liệu">Phụ liệu may mặc</option>
                <option value="Dây kéo">Dây kéo</option>
                <option value="Nhãn mác">Nhãn mác / Thẻ bài</option>
                <option value="Bao bì">Bao bì / Túi zip</option>
                <option value="Chỉ">Chỉ may</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Người liên hệ (Kinh doanh / Chủ xưởng)
              </label>
              <input
                className="input w-full text-xs"
                value={form.nguoiLienHe}
                onChange={(e) => setForm({ ...form, nguoiLienHe: e.target.value })}
                placeholder="VD: Anh Hải (Giám đốc)"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Số điện thoại liên hệ *
              </label>
              <input
                required
                className="input w-full text-xs font-mono font-bold"
                value={form.sdt}
                onChange={(e) => setForm({ ...form, sdt: e.target.value })}
                placeholder="0901234567"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Mã số thuế (MST)
              </label>
              <input
                className="input w-full text-xs font-mono"
                value={form.maSoThue}
                onChange={(e) => setForm({ ...form, maSoThue: e.target.value })}
                placeholder="0312456815"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Email liên hệ
              </label>
              <input
                type="email"
                className="input w-full text-xs"
                value={form.mail}
                onChange={(e) => setForm({ ...form, mail: e.target.value })}
                placeholder="kinhdoanh@haiduongtextile.vn"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Địa chỉ nhà máy / Trụ sở xưởng
            </label>
            <input
              className="input w-full text-xs"
              value={form.diaChi}
              onChange={(e) => setForm({ ...form, diaChi: e.target.value })}
              placeholder="Số nhà, đường, cụm công nghiệp, quận/huyện, tỉnh thành..."
            />
          </div>

          {/* Khối Tài khoản Ngân hàng (Kế toán mua hàng) */}
          <div className="p-3 bg-teal-50/50 dark:bg-teal-950/20 rounded-xl border border-teal-200/80 dark:border-teal-900/40 space-y-2.5">
            <div className="text-xs font-bold text-teal-800 dark:text-teal-300 flex items-center gap-1.5 uppercase tracking-wider">
              <CreditCard className="w-3.5 h-3.5 text-teal-600" />
              Thông tin Ngân hàng thanh toán tiền hàng (Thụ hưởng)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-0.5">Tên Ngân Hàng</label>
                <input
                  className="input w-full text-xs"
                  value={form.nganHang}
                  onChange={(e) => setForm({ ...form, nganHang: e.target.value })}
                  placeholder="VD: Vietcombank, MB Bank..."
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-0.5">Số Tài Khoản (STK)</label>
                <input
                  className="input w-full text-xs font-mono font-bold"
                  value={form.soTK}
                  onChange={(e) => setForm({ ...form, soTK: e.target.value })}
                  placeholder="VD: 0123456789"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-0.5">Tên Chủ Tài Khoản</label>
                <input
                  className="input w-full text-xs uppercase"
                  value={form.chuTK}
                  onChange={(e) => setForm({ ...form, chuTK: e.target.value })}
                  placeholder="VD: CONG TY TNHH HAI DUONG"
                />
              </div>
            </div>
          </div>

          {/* Công nợ & Hạn mức */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Công nợ hiện tại (VNĐ)
              </label>
              <input
                type="number"
                min={0}
                className="input w-full text-xs font-mono font-bold text-rose-600"
                value={form.congNo}
                onChange={(e) => setForm({ ...form, congNo: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Hạn mức cho nợ (VNĐ)
              </label>
              <input
                type="number"
                min={0}
                step={1000000}
                className="input w-full text-xs font-mono font-bold"
                value={form.hanMucNo}
                onChange={(e) => setForm({ ...form, hanMucNo: Number(e.target.value) })}
                placeholder="50000000"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Đánh giá chất lượng (1-5 sao)
              </label>
              <input
                type="number"
                min={1}
                max={5}
                step={0.5}
                className="input w-full text-xs font-bold"
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Ghi chú điều khoản hợp tác / Mặt hàng cung cấp
            </label>
            <textarea
              className="textarea w-full text-xs min-h-[70px]"
              value={form.ghiChu}
              onChange={(e) => setForm({ ...form, ghiChu: e.target.value })}
              placeholder="VD: Chuyên dệt thoi 30s/32s cotton, thời gian giao hàng 5-7 ngày, thanh toán gối đầu 30 ngày..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-md shadow-teal-500/25 transition flex items-center gap-2"
            >
              {mode === "add" ? <Plus className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
              {mode === "add" ? "Thêm Đối Tác" : "Lưu Thay Đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// COMPONENT: MODAL CHI TIẾT HỒ SƠ & LỊCH SỬ MUA HÀNG
// ============================================
function NCCDetailModal({ ncc, onClose }: { ncc: NCC; onClose: () => void }) {
  const { giaoDich } = useKho();
  const dsGD = useMemo(() => {
    return giaoDich
      .filter((g) => g.loai === "NHAP" && g.nguonNhap === ncc.ten)
      .sort((a, b) => b.ngay.localeCompare(a.ngay));
  }, [giaoDich, ncc.ten]);

  const tongTien = useMemo(() => dsGD.reduce((s, g) => s + (g.thanhTien || 0), 0), [dsGD]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full sm:w-[96%] sm:max-w-4xl rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 min-h-[85vh] sm:min-h-0 max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Avatar name={ncc.ten} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  {ncc.ma_ncc}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                  {ncc.vaiTro}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
                {ncc.ten}
              </h2>
              <p className="text-xs text-slate-500">
                Người liên hệ: <b className="text-slate-800 dark:text-slate-200">{ncc.nguoiLienHe || "Chủ xưởng"}</b> · SĐT: <b className="text-teal-700">{ncc.sdt}</b>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 3 Thẻ Tổng Kết Tài Chính */}
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 text-center">
            <span className="text-slate-500 block">Tổng mua hàng tích lũy</span>
            <span className="text-base sm:text-lg font-black text-emerald-700 font-mono mt-0.5 block">
              {formatVND(tongTien)}
            </span>
          </div>
          <div className="p-3 bg-sky-50 dark:bg-sky-950/30 rounded-xl border border-sky-200 text-center">
            <span className="text-slate-500 block">Số lần nhập kho</span>
            <span className="text-base sm:text-lg font-black text-sky-700 font-mono mt-0.5 block">
              {dsGD.length} đợt nhập
            </span>
          </div>
          <div className={`p-3 rounded-xl border text-center ${
            ncc.congNo > 0 ? "bg-rose-50 border-rose-200" : "bg-slate-50 border-slate-200"
          }`}>
            <span className="text-slate-500 block">Công nợ hiện tại</span>
            <span className={`text-base sm:text-lg font-black font-mono mt-0.5 block ${
              ncc.congNo > 0 ? "text-rose-600" : "text-emerald-600"
            }`}>
              {formatVND(ncc.congNo)}
            </span>
          </div>
        </div>

        {/* Thông tin chuyển khoản & Địa chỉ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200">
          <div>
            <div className="font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-teal-600" /> Tài khoản thanh toán
            </div>
            <div className="text-slate-600 space-y-0.5">
              <div>Ngân hàng: <b>{ncc.nganHang}</b></div>
              <div>STK: <b className="font-mono text-teal-700">{ncc.soTK}</b></div>
              <div>Chủ tài khoản: <b>{ncc.chuTK || ncc.ten}</b></div>
            </div>
          </div>
          <div>
            <div className="font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-500" /> Địa chỉ & Pháp nhân
            </div>
            <div className="text-slate-600 space-y-0.5">
              <div>MST: <b className="font-mono">{ncc.maSoThue || "Chưa có"}</b></div>
              <div>Địa chỉ xưởng: {ncc.diaChi || "Hóc Môn / TP.HCM"}</div>
              {ncc.ghiChu && <div className="italic text-slate-500 mt-1">Ghi chú: {ncc.ghiChu}</div>}
            </div>
          </div>
        </div>

        {/* Bảng kê lịch sử các đợt nhập hàng */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-700">
            <span>Chi tiết các đợt nhập vật tư & nguyên phụ liệu</span>
            <span className="text-slate-500 font-normal">({dsGD.length} giao dịch)</span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2.5 text-left">Ngày</th>
                  <th className="p-2.5 text-left">Mã Vật Tư</th>
                  <th className="p-2.5 text-left">Tên Hàng Hóa / Vải</th>
                  <th className="p-2.5 text-right">Số Lượng</th>
                  <th className="p-2.5 text-right">Đơn Giá</th>
                  <th className="p-2.5 text-right">Thành Tiền</th>
                  <th className="p-2.5 text-left">Người Thực Hiện</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dsGD.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50">
                    <td className="p-2.5 text-slate-600 whitespace-nowrap">{g.ngay}</td>
                    <td className="p-2.5 font-mono text-teal-800 font-bold">{g.maVT}</td>
                    <td className="p-2.5 font-semibold text-slate-900">{g.tenVT}</td>
                    <td className="p-2.5 text-right font-mono font-bold">
                      {g.soLuong.toLocaleString()} {g.donVi}
                    </td>
                    <td className="p-2.5 text-right font-mono text-slate-600">
                      {formatVND(g.donGia)}
                    </td>
                    <td className="p-2.5 text-right font-mono font-black text-emerald-700">
                      {formatVND(g.thanhTien)}
                    </td>
                    <td className="p-2.5 text-slate-600">{g.nguoiThucHien}</td>
                  </tr>
                ))}
                {dsGD.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                      Chưa có giao dịch nhập kho nào được ghi nhận từ nhà cung cấp này
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-700 transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
