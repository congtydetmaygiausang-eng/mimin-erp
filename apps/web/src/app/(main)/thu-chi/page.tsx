"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ReceiptText,
  Plus,
  Download,
  Search,
  Calendar,
  Wallet,
  CreditCard,
  Banknote,
  Trash2,
  Edit3,
  Eye,
  X,
  FileText,
  TrendingUp,
  TrendingDown,
  Layers,
  Utensils,
  Zap,
  Building,
  Package,
  Wrench,
  Truck,
  Coffee,
  HandCoins,
  Coins,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  RefreshCw,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { formatVND, formatVNDShort } from "@/lib/data/real-data";
import { useSession } from "@/components/session-provider";
import {
  type GiaoDichThuChi,
  type LoaiThuChi,
  type DanhMucThuChi,
  type HinhThucThanhToan,
  DANH_MUC_LIST,
  DANH_MUC_MAP,
  getDanhSachThuChi,
  themGiaoDich,
  capNhatGiaoDich,
  xoaGiaoDich,
  tinhTongThu,
  tinhTongChi,
  tinhTonQuy,
  thongKeTheoDanhMuc,
  xuatExcelThuChi,
  syncFromSupabase,
} from "@/lib/data/thu-chi";
import { ImageUploader, type UploadedFile } from "@/components/ui/ImageUploader";
import ImageLightbox from "@/components/ui/ImageLightbox";

// Helper lấy icon theo danh mục
function getCategoryIcon(danhMuc: DanhMucThuChi, className = "w-4 h-4") {
  switch (danhMuc) {
    case "an_uong":
      return <Utensils className={className} />;
    case "dien_nuoc":
      return <Zap className={className} />;
    case "mat_bang":
      return <Building className={className} />;
    case "vat_dung":
      return <Package className={className} />;
    case "sua_chua":
      return <Wrench className={className} />;
    case "van_chuyen":
      return <Truck className={className} />;
    case "tiep_khach":
      return <Coffee className={className} />;
    case "tam_ung":
      return <HandCoins className={className} />;
    case "phe_lieu":
      return <Coins className={className} />;
    default:
      return <MoreHorizontal className={className} />;
  }
}

const PRESET_AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 2000000];

export default function ThuChiPage() {
  const { user } = useSession();
  const [danhSach, setDanhSach] = useState<GiaoDichThuChi[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bộ lọc
  const [loaiFilter, setLoaiFilter] = useState<"all" | "chi" | "thu">("all");
  const [thoiGianFilter, setThoiGianFilter] = useState<"all" | "today" | "week" | "month" | "custom">("month");
  const [danhMucFilter, setDanhMucFilter] = useState<"all" | DanhMucThuChi>("all");
  const [hinhThucFilter, setHinhThucFilter] = useState<"all" | HinhThucThanhToan>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [tuNgay, setTuNgay] = useState("");
  const [denNgay, setDenNgay] = useState("");

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<GiaoDichThuChi | null>(null);
  const [viewingItem, setViewingItem] = useState<GiaoDichThuChi | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // State Lightbox phóng to ảnh chứng từ (hóa đơn / bill)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [lightboxAlt, setLightboxAlt] = useState<string>("");
  const [lightboxGallery, setLightboxGallery] = useState<string[]>([]);

  const handleOpenLightbox = (src: string, gallery: string[] = [], alt = "Chứng từ thu chi") => {
    setLightboxSrc(src);
    setLightboxGallery(gallery && gallery.length > 0 ? gallery : [src]);
    setLightboxAlt(alt);
  };

  // Form state
  const [formLoai, setFormLoai] = useState<LoaiThuChi>("chi");
  const [formDanhMuc, setFormDanhMuc] = useState<DanhMucThuChi>("an_uong");
  const [formSoTien, setFormSoTien] = useState<number | string>("");
  const [formHinhThuc, setFormHinhThuc] = useState<HinhThucThanhToan>("tien_mat");
  const [formNgay, setFormNgay] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [formNguoiThucHien, setFormNguoiThucHien] = useState("");
  const [formNguoiNhan, setFormNguoiNhan] = useState("");
  const [formNoiDung, setFormNoiDung] = useState("");
  const [formUploadedFiles, setFormUploadedFiles] = useState<UploadedFile[]>([]);

  // Tải dữ liệu: localStorage tức thì + đồng bộ ngầm Supabase
  useEffect(() => {
    // 1. Tải nhanh từ localStorage
    const local = getDanhSachThuChi();
    setDanhSach(local);
    setIsLoaded(true);

    // 2. Đồng bộ ngầm từ Supabase
    void (async () => {
      const res = await syncFromSupabase();
      if (res.data && res.data.length > 0) {
        setDanhSach(res.data);
      }
    })();
  }, []);

  // Tính toán thời gian filter
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Lọc dữ liệu
  const filteredList = useMemo(() => {
    return danhSach.filter((item) => {
      // Lọc theo loại (Thu / Chi)
      if (loaiFilter !== "all" && item.loai !== loaiFilter) return false;

      // Lọc theo danh mục
      if (danhMucFilter !== "all" && item.danhMuc !== danhMucFilter) return false;

      // Lọc theo hình thức
      if (hinhThucFilter !== "all" && item.hinhThuc !== hinhThucFilter) return false;

      // Lọc theo thời gian
      if (thoiGianFilter === "today") {
        if (item.ngay !== todayStr) return false;
      } else if (thoiGianFilter === "week") {
        const itemDate = new Date(item.ngay);
        const now = new Date();
        const past7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (itemDate < past7Days) return false;
      } else if (thoiGianFilter === "month") {
        const currentMonth = todayStr.slice(0, 7); // YYYY-MM
        if (!item.ngay.startsWith(currentMonth)) return false;
      } else if (thoiGianFilter === "custom") {
        if (tuNgay && item.ngay < tuNgay) return false;
        if (denNgay && item.ngay > denNgay) return false;
      }

      // Lọc theo từ khoá
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const dmConfig = DANH_MUC_MAP.get(item.danhMuc);
        const match =
          item.id.toLowerCase().includes(q) ||
          item.noiDung.toLowerCase().includes(q) ||
          item.nguoiThucHien.toLowerCase().includes(q) ||
          (item.nguoiNhan && item.nguoiNhan.toLowerCase().includes(q)) ||
          (item.nguoiNhap && item.nguoiNhap.toLowerCase().includes(q)) ||
          (item.emailNguoiNhap && item.emailNguoiNhap.toLowerCase().includes(q)) ||
          (dmConfig && dmConfig.label.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [danhSach, loaiFilter, danhMucFilter, hinhThucFilter, thoiGianFilter, todayStr, tuNgay, denNgay, searchTerm]);

  // Các chỉ số KPI
  const tongThu = useMemo(() => tinhTongThu(filteredList), [filteredList]);
  const tongChi = useMemo(() => tinhTongChi(filteredList), [filteredList]);
  const tonQuy = useMemo(() => tinhTonQuy(filteredList), [filteredList]);

  // Thống kê phân bổ theo danh mục
  const thongKeChi = useMemo(() => thongKeTheoDanhMuc(filteredList, "chi"), [filteredList]);

  // Mở modal tạo mới
  const handleOpenCreate = (loai: LoaiThuChi = "chi") => {
    setEditingItem(null);
    setFormLoai(loai);
    setFormDanhMuc(loai === "thu" ? "phe_lieu" : "an_uong");
    setFormSoTien("");
    setFormHinhThuc("tien_mat");
    setFormNgay(new Date().toISOString().slice(0, 10));
    setFormNguoiThucHien(user?.name || "Anh Cường");
    setFormNguoiNhan("");
    setFormNoiDung("");
    setFormUploadedFiles([]);
    setShowModal(true);
  };

  // Đóng modal và reset trạng thái form
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormUploadedFiles([]);
    setFormSoTien("");
    setFormNoiDung("");
    setFormNguoiNhan("");
  };

  // Mở modal chỉnh sửa
  const handleOpenEdit = (item: GiaoDichThuChi) => {
    setEditingItem(item);
    setFormLoai(item.loai);
    setFormDanhMuc(item.danhMuc);
    setFormSoTien(item.soTien);
    setFormHinhThuc(item.hinhThuc);
    setFormNgay(item.ngay);
    setFormNguoiThucHien(item.nguoiThucHien);
    setFormNguoiNhan(item.nguoiNhan || "");
    setFormNoiDung(item.noiDung);
    const existingFiles: UploadedFile[] = (item.hinhAnh || []).map((img, i) => ({
      id: `img-${item.id}-${i}-${Date.now()}`,
      name: `Chứng từ ${i + 1}`,
      type: "image/jpeg",
      size: 100000,
      dataUrl: img,
      category: "Chứng từ thu chi",
      uploadedAt: item.ngayTao,
    }));
    setFormUploadedFiles(existingFiles);
    setShowModal(true);
  };

  // Lưu giao dịch (Thêm hoặc Sửa)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Number(formSoTien);
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error("Vui lòng nhập số tiền hợp lệ (> 0đ)");
      return;
    }
    if (!formNoiDung.trim()) {
      toast.error("Vui lòng nhập lý do / nội dung chi tiết");
      return;
    }

    setIsSubmitting(true);
    const hinhAnhBase64 = formUploadedFiles.map((f) => f.dataUrl).filter(Boolean);

    try {
      if (editingItem) {
        const res = await capNhatGiaoDich(editingItem.id, {
          loai: formLoai,
          danhMuc: formDanhMuc,
          soTien: parsedAmount,
          hinhThuc: formHinhThuc,
          ngay: formNgay,
          nguoiThucHien: formNguoiThucHien.trim() || user?.name || "Người dùng",
          nguoiNhan: formNguoiNhan.trim() || undefined,
          noiDung: formNoiDung.trim(),
          hinhAnh: hinhAnhBase64,
        });

        if (res.item) {
          const updatedItem = res.item;
          setDanhSach((prev) => prev.map((x) => (x.id === editingItem.id ? updatedItem : x)));
          if (res.supabaseError) {
            toast.warning(`Đã cập nhật trên máy. Cloud báo lỗi: ${res.supabaseError}`);
          } else {
            toast.success(`Đã cập nhật phiếu ${editingItem.id} thành công!`);
          }
          handleCloseModal();
        } else {
          toast.error(res.supabaseError || "Không thể cập nhật phiếu");
        }
      } else {
        const res = await themGiaoDich({
          loai: formLoai,
          danhMuc: formDanhMuc,
          soTien: parsedAmount,
          hinhThuc: formHinhThuc,
          ngay: formNgay,
          nguoiThucHien: formNguoiThucHien.trim() || user?.name || "Thủ quỹ",
          nguoiNhan: formNguoiNhan.trim() || undefined,
          noiDung: formNoiDung.trim(),
          hinhAnh: hinhAnhBase64,
          nguoiNhap: user?.name || "Người dùng",
          emailNguoiNhap: user?.email || "",
          roleNguoiNhap: user?.role || "",
        });

        if (res.item) {
          setDanhSach((prev) => [res.item, ...prev]);
          if (res.supabaseError) {
            toast.warning(`Đã lưu phiếu trên máy. Cloud báo lỗi: ${res.supabaseError}`);
          } else {
            toast.success(
              formLoai === "thu"
                ? `Đã ghi nhận khoản thu +${formatVND(parsedAmount)} (lưu bởi ${user?.name || "bạn"})`
                : `Đã ghi nhận khoản chi -${formatVND(parsedAmount)} (lưu bởi ${user?.name || "bạn"})`
            );
          }
          handleCloseModal();
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi lưu phiếu");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Đồng bộ thủ công với Supabase
  const handleManualSync = async () => {
    setIsSyncing(true);
    toast.info("Đang đồng bộ dữ liệu với Supabase...");
    try {
      const res = await syncFromSupabase();
      if (res.error) {
        toast.error(`Lỗi Supabase: ${res.error}. Đang dùng dữ liệu cục bộ.`);
      } else {
        setDanhSach(res.data);
        toast.success(`Đồng bộ thành công! Hiện có ${res.data.length} phiếu.`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Không thể kết nối Supabase");
    } finally {
      setIsSyncing(false);
    }
  };

  // Xác nhận xoá
  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      const res = await xoaGiaoDich(deletingId);
      if (res.success) {
        setDanhSach((prev) => prev.filter((x) => x.id !== deletingId));
        if (res.supabaseError) {
          toast.warning(`Đã xoá trên máy. Cloud báo: ${res.supabaseError}`);
        } else {
          toast.success("Đã xoá phiếu thu chi thành công");
        }
      } else {
        toast.error(res.supabaseError || "Không thể xoá phiếu");
      }
    } catch (err: any) {
      toast.error(err?.message || "Không thể xoá phiếu");
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  // Xuất file Excel
  const handleExportExcel = () => {
    try {
      xuatExcelThuChi(filteredList, "SoQuy_ThuChi_MIMIN");
      toast.success("Đã xuất file Excel sổ quỹ thu chi (kèm thông tin người nhập)!");
    } catch (err) {
      console.error(err);
      toast.error("Không thể xuất file Excel");
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p className="text-sm text-slate-500">Đang tải sổ quỹ thu chi nội bộ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Tiêu đề trang & Nút hành động chính - Solid white hero card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-sm p-4 md:p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-md shadow-emerald-500/20">
              <ReceiptText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Sổ Quỹ Thu Chi Nội Bộ
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Realtime Cloud
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
                Quản lý chi phí xưởng may, đính kèm ảnh bill hóa đơn, kiểm soát người lập và tự động đối soát quỹ
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Nút đồng bộ Supabase */}
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-2 text-xs md:text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm transition disabled:opacity-50"
            title="Đồng bộ dữ liệu Supabase"
          >
            <RefreshCw className={`w-4 h-4 text-sky-500 ${isSyncing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Đồng bộ Cloud</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 text-xs md:text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm transition"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Xuất Excel</span>
          </button>

          <button
            onClick={() => handleOpenCreate("thu")}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs md:text-sm font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/60 shadow-sm transition"
          >
            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
            <span>+ Thu Tiền</span>
          </button>

          <button
            onClick={() => handleOpenCreate("chi")}
            className="flex items-center gap-1.5 px-4 py-2 text-xs md:text-sm font-semibold text-white bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 rounded-xl shadow-md shadow-rose-500/25 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Chi Tiền Mới</span>
          </button>
        </div>
      </div>

      {/* Thẻ KPI Thống Kê Tổng Quan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tổng Chi */}
        <div className="relative overflow-hidden rounded-2xl border border-rose-200/80 dark:border-rose-900/30 bg-gradient-to-br from-rose-50/70 via-white to-white dark:from-rose-950/20 dark:via-slate-900 dark:to-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Tổng Tiền Chi
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2.5 text-2xl font-black text-rose-600 dark:text-rose-400">
            {formatVND(tongChi)}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {filteredList.filter((x) => x.loai === "chi").length} giao dịch chi trong kỳ
          </p>
        </div>

        {/* Tổng Thu */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-200/80 dark:border-emerald-900/30 bg-gradient-to-br from-emerald-50/70 via-white to-white dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Tổng Tiền Thu
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ArrowDownLeft className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2.5 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {formatVND(tongThu)}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {filteredList.filter((x) => x.loai === "thu").length} giao dịch thu (bán vải vụn, ve chai...)
          </p>
        </div>

        {/* Tồn Quỹ (Chênh lệch) */}
        <div
          className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm ${
            tonQuy >= 0
              ? "border-sky-200/80 dark:border-sky-900/30 bg-gradient-to-br from-sky-50/70 via-white to-white dark:from-sky-950/20 dark:via-slate-900 dark:to-slate-900"
              : "border-amber-200/80 dark:border-amber-900/30 bg-gradient-to-br from-amber-50/70 via-white to-white dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                tonQuy >= 0 ? "text-sky-600 dark:text-sky-400" : "text-amber-600 dark:text-amber-400"
              }`}
            >
              Chênh Lệch Quỹ (Thu - Chi)
            </span>
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                tonQuy >= 0
                  ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              }`}
            >
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div
            className={`mt-2.5 text-2xl font-black ${
              tonQuy >= 0 ? "text-sky-700 dark:text-sky-400" : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {tonQuy >= 0 ? `+${formatVND(tonQuy)}` : formatVND(tonQuy)}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {tonQuy >= 0 ? "Dòng tiền dương trong kỳ lọc" : "Khoản chi đang nhiều hơn khoản thu"}
          </p>
        </div>

        {/* Khoản Chi Lớn Nhất */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Chi Nhiều Nhất
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2.5 text-lg font-bold text-slate-900 dark:text-white truncate">
            {thongKeChi[0]?.label || "Chưa có chi phí"}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {thongKeChi[0] ? (
              <>
                <b className="text-rose-600 dark:text-rose-400">{formatVND(thongKeChi[0].tongTien)}</b> (
                {thongKeChi[0].tyLe.toFixed(1)}% tổng chi)
              </>
            ) : (
              "Không có dữ liệu chi"
            )}
          </p>
        </div>
      </div>

      {/* Phân bổ tỷ trọng chi phí theo danh mục */}
      {thongKeChi.length > 0 && (
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Phân Bổ Chi Phí Theo Danh Mục
              </h2>
            </div>
            <span className="text-xs text-slate-500">Tự động tính theo bộ lọc hiện tại</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {thongKeChi.map((item) => {
              const cfg = DANH_MUC_MAP.get(item.danhMuc);
              return (
                <div
                  key={item.danhMuc}
                  className="rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/70 dark:bg-slate-800/40 p-3"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                      <span className={cfg?.badgeText}>{getCategoryIcon(item.danhMuc, "w-3.5 h-3.5")}</span>
                      {item.label}
                    </span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      {formatVNDShort(item.tongTien)}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(item.tyLe, 3))}%`,
                        backgroundColor: cfg?.color || "#f43f5e",
                      }}
                    />
                  </div>

                  <div className="flex justify-between items-center mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <span>{item.soGiaoDich} phiếu</span>
                    <span>{item.tyLe.toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Thanh Bộ Lọc & Tìm Kiếm */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-4 shadow-sm space-y-3.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Lọc theo loại */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold">
            <button
              onClick={() => setLoaiFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition ${
                loaiFilter === "all"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Tất Cả ({danhSach.length})
            </button>
            <button
              onClick={() => setLoaiFilter("chi")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition ${
                loaiFilter === "chi"
                  ? "bg-rose-500 text-white shadow-sm"
                  : "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              }`}
            >
              🔴 Tiền Chi ({danhSach.filter((x) => x.loai === "chi").length})
            </button>
            <button
              onClick={() => setLoaiFilter("thu")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition ${
                loaiFilter === "thu"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              }`}
            >
              🟢 Tiền Thu ({danhSach.filter((x) => x.loai === "thu").length})
            </button>
          </div>

          {/* Lọc theo mốc thời gian */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-medium">
            <button
              onClick={() => setThoiGianFilter("month")}
              className={`px-2.5 py-1.5 rounded-lg transition ${
                thoiGianFilter === "month"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Tháng Này
            </button>
            <button
              onClick={() => setThoiGianFilter("week")}
              className={`px-2.5 py-1.5 rounded-lg transition ${
                thoiGianFilter === "week"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              7 Ngày Qua
            </button>
            <button
              onClick={() => setThoiGianFilter("today")}
              className={`px-2.5 py-1.5 rounded-lg transition ${
                thoiGianFilter === "today"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Hôm Nay
            </button>
            <button
              onClick={() => setThoiGianFilter("all")}
              className={`px-2.5 py-1.5 rounded-lg transition ${
                thoiGianFilter === "all"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Toàn Thời Gian
            </button>
            <button
              onClick={() => setThoiGianFilter("custom")}
              className={`px-2.5 py-1.5 rounded-lg transition ${
                thoiGianFilter === "custom"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Tùy Chọn Ngày
            </button>
          </div>

          {/* Chọn ngày tuỳ biến nếu bật custom */}
          {thoiGianFilter === "custom" && (
            <div className="flex items-center gap-2 text-xs">
              <input
                type="date"
                value={tuNgay}
                onChange={(e) => setTuNgay(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
              <span>đến</span>
              <input
                type="date"
                value={denNgay}
                onChange={(e) => setDenNgay(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
            </div>
          )}
        </div>

        {/* Thanh tìm kiếm & lọc danh mục / hình thức */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo nội dung, người chi, người nhận, người nhập, mã phiếu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs md:text-sm border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Lọc Danh mục */}
            <select
              value={danhMucFilter}
              onChange={(e) => setDanhMucFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl text-xs md:text-sm border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">Tất cả danh mục</option>
              {DANH_MUC_LIST.map((dm) => (
                <option key={dm.key} value={dm.key}>
                  {dm.label}
                </option>
              ))}
            </select>

            {/* Lọc Hình thức */}
            <select
              value={hinhThucFilter}
              onChange={(e) => setHinhThucFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl text-xs md:text-sm border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">Tất cả hình thức</option>
              <option value="tien_mat">💵 Tiền mặt</option>
              <option value="chuyen_khoan">💳 Chuyển khoản</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bảng Danh Sách Giao Dịch */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-2">
            <span className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200">
              Danh Sách Giao Dịch ({filteredList.length})
            </span>
            {filteredList.length !== danhSach.length && (
              <span className="text-xs text-slate-500">· Đang lọc từ {danhSach.length} phiếu</span>
            )}
          </div>
        </div>

        {filteredList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3">
              <ReceiptText className="w-7 h-7" />
            </div>
            <p className="text-base font-semibold text-slate-700 dark:text-slate-200">Không tìm thấy giao dịch nào</p>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Thử thay đổi bộ lọc tìm kiếm hoặc bấm &quot;+ Chi Tiền Mới&quot; để tạo phiếu chi đầu tiên cho xưởng
            </p>
            <button
              onClick={() => handleOpenCreate("chi")}
              className="mt-4 flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Phiếu Chi Ngay</span>
            </button>
          </div>
        ) : (
          <>
            {/* Mobile Card View (hiển thị tối ưu trên điện thoại) */}
            <div className="block md:hidden divide-y divide-slate-100 dark:divide-white/5">
              {filteredList.map((item) => {
                const dmConfig = DANH_MUC_MAP.get(item.danhMuc);
                const isThu = item.loai === "thu";

                return (
                  <div key={item.id} className="p-4 space-y-3 bg-white dark:bg-slate-900">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${
                              dmConfig?.badgeBg || "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {getCategoryIcon(item.danhMuc, "w-3.5 h-3.5")}
                            <span>{dmConfig?.label || item.danhMuc}</span>
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">{item.id}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.ngay}</span>
                          <span>·</span>
                          <span>{item.hinhThuc === "tien_mat" ? "💵 Tiền mặt" : "💳 Chuyển khoản"}</span>
                        </div>
                      </div>

                      <div
                        className={`text-base font-black shrink-0 ${
                          isThu ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {isThu ? `+${formatVND(item.soTien)}` : `-${formatVND(item.soTien)}`}
                      </div>
                    </div>

                    <p className="text-xs text-slate-800 dark:text-slate-200 line-clamp-2 font-medium">
                      {item.noiDung}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <div>
                        <span>Người chi: </span>
                        <b className="text-slate-700 dark:text-slate-300">{item.nguoiThucHien}</b>
                        {item.nguoiNhan && <span> ➔ {item.nguoiNhan}</span>}
                      </div>
                      {item.nguoiNhap && (
                        <div className="text-[10px] text-slate-400">
                          Nhập: {item.nguoiNhap}
                        </div>
                      )}
                    </div>

                    {/* Ảnh chứng từ nếu có */}
                    {item.hinhAnh && item.hinhAnh.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-sky-500" />
                            <span>Chứng từ ({item.hinhAnh.length} ảnh)</span>
                          </span>
                          <span className="text-[10px] text-sky-600 dark:text-sky-400 font-medium">
                            Chạm để phóng to
                          </span>
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                          {item.hinhAnh.map((imgSrc, imgIdx) => (
                            <button
                              key={imgIdx}
                              type="button"
                              onClick={() =>
                                handleOpenLightbox(
                                  imgSrc,
                                  item.hinhAnh,
                                  `${item.id} - ${item.noiDung} (Ảnh ${imgIdx + 1}/${item.hinhAnh!.length})`
                                )
                              }
                              className="group relative h-16 w-20 shrink-0 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 shadow-xs hover:ring-2 hover:ring-sky-500 transition cursor-zoom-in text-left"
                              title={`Chạm xem ảnh ${imgIdx + 1}`}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={imgSrc} alt={`Chứng từ ${imgIdx + 1}`} className="h-full w-full object-cover group-hover:scale-105 transition" />
                              <div className="absolute inset-0 bg-black/25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                <Eye className="w-4 h-4 text-white" />
                              </div>
                              <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] text-center font-medium py-0.5">
                                {imgIdx + 1}/{item.hinhAnh?.length || 1}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Nút hành động Mobile */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
                      <button
                        type="button"
                        onClick={() => setViewingItem(item)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Chi tiết</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Sửa</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingId(item.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs md:text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-white/5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/70 dark:bg-slate-800/50">
                    <th className="py-3 px-4">Ngày / Mã</th>
                    <th className="py-3 px-4">Loại & Danh Mục</th>
                    <th className="py-3 px-4 text-right">Số Tiền</th>
                    <th className="py-3 px-4">Hình Thức</th>
                    <th className="py-3 px-4">Nội Dung / Diễn Giải</th>
                    <th className="py-3 px-4">Người Chi & Người Nhập</th>
                    <th className="py-3 px-4 text-center">Chứng Từ</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-normal">
                  {filteredList.map((item) => {
                    const dmConfig = DANH_MUC_MAP.get(item.danhMuc);
                    const isThu = item.loai === "thu";

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition group"
                      >
                        {/* Ngày / Mã */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.ngay}</span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 mt-0.5">{item.id}</div>
                        </td>

                        {/* Loại & Danh mục */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                                dmConfig?.badgeBg || "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {getCategoryIcon(item.danhMuc, "w-3.5 h-3.5")}
                              <span>{dmConfig?.label || item.danhMuc}</span>
                            </span>
                          </div>
                        </td>

                        {/* Số tiền */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div
                            className={`text-sm md:text-base font-extrabold ${
                              isThu ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {isThu ? `+${formatVND(item.soTien)}` : `-${formatVND(item.soTien)}`}
                          </div>
                        </td>

                        {/* Hình thức */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {item.hinhThuc === "tien_mat" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                              <Banknote className="w-3 h-3 text-emerald-600" />
                              <span>Tiền mặt</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                              <CreditCard className="w-3 h-3 text-blue-600" />
                              <span>Chuyển khoản</span>
                            </span>
                          )}
                        </td>

                        {/* Nội dung */}
                        <td className="py-3 px-4">
                          <p className="text-slate-800 dark:text-slate-200 line-clamp-2 font-medium">
                            {item.noiDung}
                          </p>
                        </td>

                        {/* Người chi / nhận & Người nhập */}
                        <td className="py-3 px-4 whitespace-nowrap text-xs">
                          <div className="text-slate-800 dark:text-slate-200 font-bold">
                            {item.nguoiThucHien}
                          </div>
                          {item.nguoiNhan && (
                            <div className="text-[11px] text-slate-500">Đến: {item.nguoiNhan}</div>
                          )}
                          {item.nguoiNhap && (
                            <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                              <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                              <span>Nhập: {item.nguoiNhap}</span>
                            </div>
                          )}
                        </td>

                        {/* Chứng từ / Ảnh */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {item.hinhAnh && item.hinhAnh.length > 0 ? (
                            <div className="inline-flex items-center justify-center gap-2">
                              {/* Thumbnail ảnh đầu tiên */}
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenLightbox(
                                    item.hinhAnh![0],
                                    item.hinhAnh,
                                    `${item.id} - ${item.noiDung} (1/${item.hinhAnh!.length})`
                                  )
                                }
                                className="group relative h-9 w-9 shrink-0 rounded-lg overflow-hidden border border-sky-200 dark:border-sky-800 bg-slate-100 shadow-xs hover:ring-2 hover:ring-sky-500 transition cursor-zoom-in"
                                title="Bấm để phóng to xem chứng từ"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={item.hinhAnh[0]}
                                  alt={item.noiDung}
                                  className="h-full w-full object-cover group-hover:scale-110 transition"
                                />
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                  <Eye className="w-3.5 h-3.5 text-white" />
                                </div>
                              </button>

                              {/* Nút đếm số ảnh */}
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenLightbox(
                                    item.hinhAnh![0],
                                    item.hinhAnh,
                                    `${item.id} - ${item.noiDung} (1/${item.hinhAnh!.length})`
                                  )
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-200/60 dark:border-sky-800/60 transition shadow-xs"
                                title="Bấm để xem toàn bộ ảnh chứng từ"
                              >
                                <FileText className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                                <span>{item.hinhAnh.length} ảnh</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Không có</span>
                          )}
                        </td>

                        {/* Thao tác */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setViewingItem(item)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-sky-600 bg-slate-100 hover:bg-sky-50 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-amber-600 bg-slate-100 hover:bg-amber-50 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
                              title="Chỉnh sửa phiếu"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingId(item.id)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
                              title="Xóa phiếu"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ==================== MODAL THÊM / CHỈNH SỬA PHIẾU THU CHI ==================== */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={handleCloseModal}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header modal */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-md ${
                    formLoai === "thu"
                      ? "bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-emerald-500/20"
                      : "bg-gradient-to-tr from-rose-500 to-red-500 shadow-rose-500/20"
                  }`}
                >
                  {formLoai === "thu" ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {editingItem
                        ? `Sửa Phiếu: ${editingItem.id}`
                        : formLoai === "thu"
                        ? "Lập Phiếu Thu Tiền Mới"
                        : "Lập Phiếu Chi Tiền Mới"}
                    </h3>
                    {editingItem && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                        Chế độ chỉnh sửa
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Tài khoản nhập: <b className="text-slate-700 dark:text-slate-300">{user?.name || "Người dùng"}</b> ({user?.email || "Local"})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="mt-5 space-y-5">
              {/* Chọn nhanh: Chi tiền / Thu tiền */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setFormLoai("chi");
                    if (formDanhMuc === "phe_lieu") setFormDanhMuc("an_uong");
                  }}
                  className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm border-2 transition ${
                    formLoai === "chi"
                      ? "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 shadow-sm"
                      : "border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>🔴 CHI TIỀN (-)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFormLoai("thu");
                    if (formDanhMuc !== "phe_lieu") setFormDanhMuc("phe_lieu");
                  }}
                  className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm border-2 transition ${
                    formLoai === "thu"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 shadow-sm"
                      : "border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>🟢 THU TIỀN (+)</span>
                </button>
              </div>

              {/* Số tiền + Chọn nhanh */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Số tiền ({formLoai === "chi" ? "Chi ra" : "Thu vào"}) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    placeholder="VD: 500000"
                    required
                    value={formSoTien}
                    onChange={(e) => setFormSoTien(e.target.value)}
                    className="w-full text-xl md:text-2xl font-extrabold px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-base">
                    VNĐ
                  </span>
                </div>

                {/* Các nút bấm số tiền nhanh */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-slate-400 mr-1">Gợi ý nhanh:</span>
                  {PRESET_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setFormSoTien(amt)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                    >
                      {formatVNDShort(amt)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Danh mục thu chi */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Danh mục khoản {formLoai === "chi" ? "chi" : "thu"} <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {DANH_MUC_LIST.map((dm) => {
                    const isSelected = formDanhMuc === dm.key;
                    return (
                      <button
                        key={dm.key}
                        type="button"
                        onClick={() => setFormDanhMuc(dm.key)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-medium transition ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20 font-bold"
                            : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <span className={isSelected ? "text-emerald-600" : dm.badgeText}>
                          {getCategoryIcon(dm.key, "w-4 h-4")}
                        </span>
                        <span className="truncate">{dm.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2 cột: Ngày & Hình thức */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Ngày ghi nhận <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formNgay}
                    onChange={(e) => setFormNgay(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Hình thức thanh toán <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormHinhThuc("tien_mat")}
                      className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold border transition ${
                        formHinhThuc === "tien_mat"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Banknote className="w-3.5 h-3.5" />
                      <span>Tiền mặt</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormHinhThuc("chuyen_khoan")}
                      className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold border transition ${
                        formHinhThuc === "chuyen_khoan"
                          ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Chuyển khoản</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 2 cột: Người chi/thu thực tế & Người nhận/trả */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    {formLoai === "chi" ? "Người chi tiền thực tế" : "Người thu tiền thực tế"}
                  </label>
                  <input
                    type="text"
                    value={formNguoiThucHien}
                    onChange={(e) => setFormNguoiThucHien(e.target.value)}
                    placeholder="VD: Anh Cường, Anh Sang, Chị Hoa, Thợ may..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    {formLoai === "chi" ? "Bên nhận tiền (Cửa hàng / Đối tác)" : "Bên trả tiền (Khách / Người mua)"}
                  </label>
                  <input
                    type="text"
                    value={formNguoiNhan}
                    onChange={(e) => setFormNguoiNhan(e.target.value)}
                    placeholder="VD: Quán cơm cô Ba, Thợ máy anh Hùng..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {/* Nội dung chi tiết */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Lý do / Nội dung chi tiết <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="VD: Tiền cơm trưa 20 phần cho tổ may & tổ cắt; Mua 6 cuộn băng keo dán thùng carton..."
                  value={formNoiDung}
                  onChange={(e) => setFormNoiDung(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Đính kèm ảnh hóa đơn / bill chứng từ */}
              <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-4 bg-slate-50/50 dark:bg-slate-800/40">
                <ImageUploader
                  files={formUploadedFiles}
                  onChange={setFormUploadedFiles}
                  category="Chứng từ thu chi"
                  label="Ảnh Hóa Đơn / Bill Chuyển Khoản / Phiếu Thu Chi"
                  hint="Chụp ảnh biên lai, hóa đơn đỏ, bill chuyển khoản hoặc phiếu ăn (tối đa 5MB)"
                  multiple={true}
                />
              </div>

              {/* Nút hành động */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-white/10">
                {editingItem ? (
                  <button
                    type="button"
                    onClick={() => {
                      const id = editingItem.id;
                      handleCloseModal();
                      setDeletingId(id);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa phiếu này</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2.5 rounded-xl text-xs md:text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs md:text-sm font-bold text-white shadow-md transition disabled:opacity-50 ${
                      formLoai === "thu"
                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/25"
                        : "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 shadow-rose-500/25"
                    }`}
                  >
                    {isSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                    <span>{editingItem ? "Cập Nhật Phiếu" : formLoai === "thu" ? "Lưu Khoản Thu" : "Lưu Khoản Chi"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL XEM CHI TIẾT & ẢNH BILL ==================== */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold ${
                    viewingItem.loai === "thu"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                  }`}
                >
                  {viewingItem.loai === "thu" ? "🟢 PHIẾU THU TIỀN" : "🔴 PHIẾU CHI TIỀN"}
                </span>
                <span className="font-mono text-xs text-slate-400">{viewingItem.id}</span>
              </div>
              <button
                onClick={() => setViewingItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="text-center py-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <span className="text-xs text-slate-500 uppercase tracking-wider block">Số tiền giao dịch</span>
                <div
                  className={`text-3xl font-black mt-1 ${
                    viewingItem.loai === "thu"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {viewingItem.loai === "thu" ? `+${formatVND(viewingItem.soTien)}` : `-${formatVND(viewingItem.soTien)}`}
                </div>
              </div>

              {/* Thông tin người nhập hệ thống (Audit trail) */}
              <div className="rounded-xl border border-sky-100 dark:border-sky-900/40 bg-sky-50/60 dark:bg-sky-950/30 p-3.5 text-xs">
                <span className="text-sky-800 dark:text-sky-300 font-bold block mb-1.5 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                  <span>Dữ liệu người nhập hệ thống</span>
                </span>
                <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Tài khoản nhập:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {viewingItem.nguoiNhap || viewingItem.nguoiThucHien}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Email / Vai trò:</span>
                    <span className="font-mono text-slate-600 dark:text-slate-300">
                      {viewingItem.emailNguoiNhap || "Hệ thống"} ({viewingItem.roleNguoiNhap || "admin"})
                    </span>
                  </div>
                  <div className="col-span-2 text-[11px] text-slate-400 border-t border-sky-100 dark:border-sky-900/30 pt-1.5 mt-0.5">
                    Thời gian tạo phiếu: {new Date(viewingItem.ngayTao).toLocaleString("vi-VN")}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs md:text-sm">
                <div className="rounded-xl border border-slate-100 dark:border-white/5 p-3">
                  <span className="text-slate-400 text-xs block">Danh mục:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {DANH_MUC_MAP.get(viewingItem.danhMuc)?.label || viewingItem.danhMuc}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-100 dark:border-white/5 p-3">
                  <span className="text-slate-400 text-xs block">Hình thức:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {viewingItem.hinhThuc === "tien_mat" ? "💵 Tiền mặt" : "💳 Chuyển khoản"}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-100 dark:border-white/5 p-3">
                  <span className="text-slate-400 text-xs block">Ngày ghi nhận:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {viewingItem.ngay}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-100 dark:border-white/5 p-3">
                  <span className="text-slate-400 text-xs block">Người chi/thu thực tế:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {viewingItem.nguoiThucHien}
                  </span>
                </div>
              </div>

              {viewingItem.nguoiNhan && (
                <div className="rounded-xl border border-slate-100 dark:border-white/5 p-3 text-xs md:text-sm">
                  <span className="text-slate-400 text-xs block">
                    {viewingItem.loai === "chi" ? "Bên nhận tiền:" : "Bên trả tiền:"}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {viewingItem.nguoiNhan}
                  </span>
                </div>
              )}

              <div className="rounded-xl border border-slate-100 dark:border-white/5 p-3 text-xs md:text-sm">
                <span className="text-slate-400 text-xs block">Nội dung chi tiết:</span>
                <p className="font-medium text-slate-800 dark:text-slate-200 mt-1 whitespace-pre-wrap">
                  {viewingItem.noiDung}
                </p>
              </div>

              {/* Danh sách ảnh đính kèm */}
              {viewingItem.hinhAnh && viewingItem.hinhAnh.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-sky-500" />
                      <span>Ảnh Chứng Từ / Hóa Đơn ({viewingItem.hinhAnh.length})</span>
                    </span>
                    <span className="text-[11px] text-sky-600 dark:text-sky-400 font-medium">
                      Bấm vào ảnh để phóng to & xoay
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {viewingItem.hinhAnh.map((imgSrc, idx) => (
                      <div
                        key={idx}
                        onClick={() =>
                          handleOpenLightbox(
                            imgSrc,
                            viewingItem.hinhAnh,
                            `${viewingItem.id} - ${viewingItem.noiDung} (Ảnh ${idx + 1}/${viewingItem.hinhAnh!.length})`
                          )
                        }
                        className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 aspect-video flex items-center justify-center cursor-zoom-in shadow-sm hover:border-sky-400 dark:hover:border-sky-500 transition"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imgSrc}
                          alt={`Chứng từ ${idx + 1}`}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-white opacity-0 group-hover:opacity-100 transition font-medium text-xs gap-1.5 backdrop-blur-[2px]">
                          <Eye className="w-4 h-4" />
                          <span>Bấm để phóng to & xoay ảnh</span>
                        </div>
                        <span className="absolute top-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white">
                          Ảnh {idx + 1}/{viewingItem.hinhAnh?.length || 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 text-center text-xs text-slate-400">
                  Phiếu này không đính kèm ảnh hóa đơn hoặc chứng từ
                </div>
              )}

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    const id = viewingItem.id;
                    setViewingItem(null);
                    setDeletingId(id);
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 transition inline-flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa Phiếu</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const item = viewingItem;
                      setViewingItem(null);
                      handleOpenEdit(item);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 transition inline-flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Sửa Phiếu</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewingItem(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 transition"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL XÁC NHẬN XOÁ ==================== */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl p-6 text-center">
            <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Xác nhận xoá phiếu thu chi</h3>
            <p className="text-xs text-slate-500 mt-1.5">
              Bạn có chắc chắn muốn xoá phiếu <b className="font-mono text-slate-800 dark:text-slate-200">{deletingId}</b>? Hành động này không thể hoàn tác.
            </p>

            <div className="flex items-center justify-center gap-2.5 mt-5">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 transition"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition disabled:opacity-50"
              >
                {isDeleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{isDeleting ? "Đang xoá..." : "Xác nhận xoá"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== LIGHTBOX PHÓNG TO & XOAY ẢNH CHỨNG TỪ ==================== */}
      <ImageLightbox
        src={lightboxSrc}
        alt={lightboxAlt}
        gallery={lightboxGallery}
        onChange={(newSrc) => setLightboxSrc(newSrc)}
        onClose={() => setLightboxSrc(null)}
      />
    </div>
  );
}
