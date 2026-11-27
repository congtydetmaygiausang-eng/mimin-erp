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
  Factory,
  Scissors,
  Users,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { formatVND, formatVNDShort, DOI_TAC, type DoiTac } from "@/lib/data/real-data";
import { useSession } from "@/components/session-provider";
import { DataViewToggle, type ViewMode } from "@/components/DataViewToggle";
import {
  type GiaoDichThuChi,
  type LoaiThuChi,
  type DanhMucThuChi,
  type HinhThucThanhToan,
  type LoaiTamUng,
  DANH_MUC_LIST,
  DANH_MUC_MAP,
  getDanhSachThuChi,
  themGiaoDich,
  capNhatGiaoDich,
  xoaGiaoDich,
  tinhTongThu,
  tinhTongChi,
  tinhTongTamUng,
  tinhTongTamUngNhanSu,
  tinhTongTamUngGiaCong,
  thongKeTamUngTheoXuongGiaCong,
  nhanDienLoaiTamUng,
  tinhTonQuy,
  thongKeTheoDanhMuc,
  xuatExcelThuChi,
  syncFromSupabase,
} from "@/lib/data/thu-chi";
import { ImageUploader, type UploadedFile } from "@/components/ui/ImageUploader";
import ImageLightbox from "@/components/ui/ImageLightbox";
import { REAL_NHAN_VIEN } from "@/lib/real-workflow-data";
import { supabase, isSupabaseEnabled } from "@/lib/supabase/client";

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
  const [viewScope, setViewScope] = useState<"tat_ca" | "van_hanh" | "tam_ung" | "tam_ung_gia_cong">("tat_ca");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
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
  const [formLoaiTamUng, setFormLoaiTamUng] = useState<LoaiTamUng>("nhan_su");
  const [formMaDoiTac, setFormMaDoiTac] = useState("");
  const [formTenDoiTac, setFormTenDoiTac] = useState("");
  const [formLoaiGiaCong, setFormLoaiGiaCong] = useState("");
  const [formMaLenhCat, setFormMaLenhCat] = useState("");
  const [formSoTien, setFormSoTien] = useState<number | string>("");
  const [formHinhThuc, setFormHinhThuc] = useState<HinhThucThanhToan>("tien_mat");
  const [formNgay, setFormNgay] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [formNguoiThucHien, setFormNguoiThucHien] = useState("");
  const [formNguoiNhan, setFormNguoiNhan] = useState("");
  const [formNoiDung, setFormNoiDung] = useState("");
  const [formUploadedFiles, setFormUploadedFiles] = useState<UploadedFile[]>([]);
  const [dsNhanSu, setDsNhanSu] = useState<{ ma: string; ten: string; boPhan: string }[]>([]);
  const [dsDoiTacGiaCong, setDsDoiTacGiaCong] = useState<DoiTac[]>(() =>
    DOI_TAC.filter((dt) => dt.trangThai !== "Ngưng")
  );

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

    // 3. Tải danh sách nhân sự để hỗ trợ chọn nhanh khi tạm ứng nhân sự
    void (async () => {
      try {
        let rawNS: any[] = [];
        if (isSupabaseEnabled && supabase) {
          const { data } = await supabase.from("nhan_su").select("ma_nv, ho_ten, bo_phan, trang_thai").order("stt", { ascending: true });
          if (data && data.length > 0) rawNS = data;
        }
        if (rawNS.length === 0) {
          const cached = typeof window !== "undefined" ? (localStorage.getItem("mimin_nhan_su_v2") || localStorage.getItem("mimin_nhan_su_v1")) : null;
          if (cached) {
            try {
              const p = JSON.parse(cached);
              if (Array.isArray(p)) rawNS = p;
            } catch {}
          }
        }
        if (rawNS.length > 0) {
          const parsed = rawNS
            .filter((r) => {
              const code = String(r.ma_nv || r.maNV || "").toUpperCase().trim();
              const status = String(r.trang_thai || r.trangThai || "").toLowerCase();
              return code && !/^GS\d+$/i.test(code) && status !== "nghi_viec";
            })
            .map((r) => ({
              ma: String(r.ma_nv || r.maNV || ""),
              ten: String(r.ho_ten || r.hoTen || ""),
              boPhan: String(r.bo_phan || r.boPhan || "Sản xuất"),
            }));
          setDsNhanSu(parsed.length > 0 ? parsed : REAL_NHAN_VIEN.map((r) => ({ ma: r.ma, ten: r.ten, boPhan: r.boPhan })));
        } else {
          setDsNhanSu(REAL_NHAN_VIEN.map((r) => ({ ma: r.ma, ten: r.ten, boPhan: r.boPhan })));
        }
      } catch {
        setDsNhanSu(REAL_NHAN_VIEN.map((r) => ({ ma: r.ma, ten: r.ten, boPhan: r.boPhan })));
      }
    })();

    // 4. Tải danh sách đối tác gia công để hỗ trợ chọn nhanh khi tạm ứng xưởng ngoài
    void (async () => {
      try {
        if (isSupabaseEnabled && supabase) {
          const { data } = await supabase.from("doi_tac").select("*");
          if (data && data.length > 0) {
            const mapped: DoiTac[] = data.map((d: any, idx: number) => ({
              stt: idx + 1,
              maDT: d.ma_dt || d.maDT || `GC-${idx + 1}`,
              tenDonVi: d.ten_don_vi || d.tenDonVi || d.ten || "",
              nguoiLH: d.nguoi_lh || d.nguoiLH || "",
              sdt: d.sdt || "",
              email: d.email || "",
              diaChi: d.dia_chi || d.diaChi || "",
              boPhan: "Sản xuất",
              chucVu: "Đối tác gia công",
              soTK: d.so_tk || "",
              nganHang: d.ngan_hang || "",
              mst: d.mst || "",
              loaiDT: "doi_tac_gia_cong",
              trangThai: d.trang_thai || "Đang hợp tác",
              congDoan: d.cong_doan || "Gia công ngoài",
              ghiChu: d.ghi_chu || "",
            }));
            setDsDoiTacGiaCong(mapped);
          }
        }
      } catch {
        // Fallback DOI_TAC
      }
    })();
  }, []);

  // Tính toán thời gian filter
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Lọc dữ liệu
  const filteredList = useMemo(() => {
    return danhSach.filter((item) => {
      const isTamUng = item.danhMuc === "tam_ung";
      const loaiTU = isTamUng ? nhanDienLoaiTamUng(item) : undefined;

      // Lọc theo phạm vi:
      // 1. "van_hanh": Loại trừ toàn bộ tạm ứng (vì tạm ứng cấn trừ lương hoặc trừ công nợ)
      if (viewScope === "van_hanh" && isTamUng) return false;
      // 2. "tam_ung": Chỉ lấy tạm ứng nhân sự (trừ lương)
      if (viewScope === "tam_ung" && (!isTamUng || loaiTU !== "nhan_su")) return false;
      // 3. "tam_ung_gia_cong": Chỉ lấy tạm ứng cho bên gia công (trừ công nợ)
      if (viewScope === "tam_ung_gia_cong" && (!isTamUng || loaiTU !== "gia_cong")) return false;
      // 4. "tat_ca": Lấy toàn bộ

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
  }, [danhSach, viewScope, loaiFilter, danhMucFilter, hinhThucFilter, thoiGianFilter, todayStr, tuNgay, denNgay, searchTerm]);

  // Các chỉ số KPI (Chi phí vận hành xưởng KHÔNG bao gồm khoản Tạm ứng nhân sự và Tạm ứng gia công)
  const tongThu = useMemo(() => tinhTongThu(filteredList), [filteredList]);
  const tongChi = useMemo(() => tinhTongChi(filteredList, viewScope !== "van_hanh"), [filteredList, viewScope]);
  const tongTamUng = useMemo(() => tinhTongTamUng(danhSach), [danhSach]);
  const tongTamUngNhanSu = useMemo(() => tinhTongTamUngNhanSu(danhSach), [danhSach]);
  const tongTamUngGiaCong = useMemo(() => tinhTongTamUngGiaCong(danhSach), [danhSach]);
  const thongKeXuongGiaCong = useMemo(() => thongKeTamUngTheoXuongGiaCong(danhSach), [danhSach]);
  const tonQuy = useMemo(() => tinhTonQuy(filteredList), [filteredList]);

  // Thống kê chi tiết bóc tách trong kỳ lọc hiện tại
  const chiVanHanhTrongKy = useMemo(
    () => filteredList.filter((x) => x.loai === "chi" && x.danhMuc !== "tam_ung").reduce((sum, x) => sum + x.soTien, 0),
    [filteredList]
  );
  const tamUngNhanSuTrongKy = useMemo(
    () =>
      filteredList
        .filter((x) => x.loai === "chi" && x.danhMuc === "tam_ung" && nhanDienLoaiTamUng(x) === "nhan_su")
        .reduce((sum, x) => sum + x.soTien, 0),
    [filteredList]
  );
  const tamUngGiaCongTrongKy = useMemo(
    () =>
      filteredList
        .filter((x) => x.loai === "chi" && x.danhMuc === "tam_ung" && nhanDienLoaiTamUng(x) === "gia_cong")
        .reduce((sum, x) => sum + x.soTien, 0),
    [filteredList]
  );
  const tongTamUngTrongKy = useMemo(
    () => tamUngNhanSuTrongKy + tamUngGiaCongTrongKy,
    [tamUngNhanSuTrongKy, tamUngGiaCongTrongKy]
  );
  const tongChiThucTeTrongKy = useMemo(
    () => filteredList.filter((x) => x.loai === "chi").reduce((sum, x) => sum + x.soTien, 0),
    [filteredList]
  );
  const soGiaoDichThu = useMemo(
    () => filteredList.filter((x) => x.loai === "thu").length,
    [filteredList]
  );
  const soGiaoDichChi = useMemo(
    () => filteredList.filter((x) => x.loai === "chi").length,
    [filteredList]
  );

  // Đếm số lượng theo Scope trên toàn bộ sổ quỹ
  const countVanHanh = useMemo(() => danhSach.filter((x) => x.danhMuc !== "tam_ung").length, [danhSach]);
  const countTamUngNhanSu = useMemo(
    () => danhSach.filter((x) => x.danhMuc === "tam_ung" && nhanDienLoaiTamUng(x) === "nhan_su").length,
    [danhSach]
  );
  const countTamUngGiaCong = useMemo(
    () => danhSach.filter((x) => x.danhMuc === "tam_ung" && nhanDienLoaiTamUng(x) === "gia_cong").length,
    [danhSach]
  );

  // Kiểm tra bộ lọc có đang khác mặc định không
  const isFilteringActive = useMemo(() => {
    return (
      viewScope !== "tat_ca" ||
      loaiFilter !== "all" ||
      thoiGianFilter !== "month" ||
      danhMucFilter !== "all" ||
      hinhThucFilter !== "all" ||
      searchTerm.trim() !== "" ||
      tuNgay !== "" ||
      denNgay !== ""
    );
  }, [viewScope, loaiFilter, thoiGianFilter, danhMucFilter, hinhThucFilter, searchTerm, tuNgay, denNgay]);

  const handleResetFilters = () => {
    setViewScope("tat_ca");
    setLoaiFilter("all");
    setThoiGianFilter("month");
    setDanhMucFilter("all");
    setHinhThucFilter("all");
    setSearchTerm("");
    setTuNgay("");
    setDenNgay("");
  };

  // Thống kê phân bổ theo danh mục (loại bỏ Tạm ứng khỏi chi phí vận hành)
  const thongKeChi = useMemo(
    () => thongKeTheoDanhMuc(filteredList, "chi", viewScope === "tam_ung" || viewScope === "tam_ung_gia_cong"),
    [filteredList, viewScope]
  );

  // Mở modal tạo mới
  const handleOpenCreate = (loai: LoaiThuChi = "chi", defaultTamUngLoai: LoaiTamUng = "nhan_su") => {
    setEditingItem(null);
    setFormLoai(loai);
    setFormDanhMuc(loai === "thu" ? "phe_lieu" : "an_uong");
    setFormLoaiTamUng(defaultTamUngLoai);
    setFormMaDoiTac("");
    setFormTenDoiTac("");
    setFormLoaiGiaCong("");
    setFormMaLenhCat("");
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
    setFormLoaiTamUng("nhan_su");
    setFormMaDoiTac("");
    setFormTenDoiTac("");
    setFormLoaiGiaCong("");
    setFormMaLenhCat("");
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

    const isTamUng = item.danhMuc === "tam_ung";
    const detectedLoaiTU = isTamUng ? nhanDienLoaiTamUng(item) : "nhan_su";
    setFormLoaiTamUng(detectedLoaiTU);
    setFormMaDoiTac(item.maDoiTac || "");
    setFormTenDoiTac(item.tenDoiTac || "");
    setFormLoaiGiaCong(item.loaiGiaCong || "");
    setFormMaLenhCat(item.maLenhCat || "");

    let initialNguoiNhan = item.nguoiNhan || "";
    // Nếu là tạm ứng nhân sự mà nguoiNhan chưa chọn nhưng nội dung có tên/mã NV
    if (isTamUng && detectedLoaiTU === "nhan_su" && !initialNguoiNhan) {
      const matchNS = dsNhanSu.find((ns) => {
        const parts = ns.ten.split(/\s+/);
        const fName = parts[parts.length - 1];
        return (
          item.noiDung.toLowerCase().includes(fName.toLowerCase()) ||
          item.noiDung.toLowerCase().includes(ns.ma.toLowerCase())
        );
      });
      if (matchNS) {
        initialNguoiNhan = `${matchNS.ma} - ${matchNS.ten}`;
        setFormMaDoiTac(matchNS.ma);
        setFormTenDoiTac(matchNS.ten);
      }
    }
    // Nếu là tạm ứng gia công mà chưa có mã xưởng
    if (isTamUng && detectedLoaiTU === "gia_cong" && !item.maDoiTac) {
      const matchDT = dsDoiTacGiaCong.find(
        (dt) =>
          item.noiDung.toLowerCase().includes(dt.tenDonVi.toLowerCase()) ||
          (item.nguoiNhan && item.nguoiNhan.toLowerCase().includes(dt.tenDonVi.toLowerCase())) ||
          (dt.maDT && item.noiDung.toLowerCase().includes(dt.maDT.toLowerCase()))
      );
      if (matchDT) {
        setFormMaDoiTac(matchDT.maDT);
        setFormTenDoiTac(matchDT.tenDonVi);
        setFormLoaiGiaCong(matchDT.congDoan);
        if (!initialNguoiNhan) initialNguoiNhan = `${matchDT.maDT} - ${matchDT.tenDonVi}`;
      }
    }

    setFormNguoiNhan(initialNguoiNhan);
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

    // Bắt buộc chọn đúng đối tượng nếu là khoản Tạm ứng
    if (formDanhMuc === "tam_ung") {
      if (!formNguoiNhan || !formNguoiNhan.trim()) {
        if (formLoaiTamUng === "gia_cong") {
          toast.error("Vui lòng chọn Đối tác / Xưởng gia công nhận tạm ứng!");
        } else {
          toast.error("Vui lòng chọn nhân sự nhận tạm ứng để trừ vào bảng lương!");
        }
        return;
      }
    }

    if (!formNoiDung.trim()) {
      toast.error("Vui lòng nhập lý do / nội dung chi tiết");
      return;
    }

    setIsSubmitting(true);
    const hinhAnhBase64 = formUploadedFiles.map((f) => f.dataUrl).filter(Boolean);

    try {
      const extraTamUngFields =
        formDanhMuc === "tam_ung"
          ? {
              loaiTamUng: formLoaiTamUng,
              maDoiTac: formMaDoiTac.trim() || undefined,
              tenDoiTac: formTenDoiTac.trim() || undefined,
              loaiGiaCong: formLoaiTamUng === "gia_cong" ? formLoaiGiaCong.trim() || undefined : undefined,
              maLenhCat: formLoaiTamUng === "gia_cong" ? formMaLenhCat.trim() || undefined : undefined,
            }
          : {
              loaiTamUng: undefined,
              maDoiTac: undefined,
              tenDoiTac: undefined,
              loaiGiaCong: undefined,
              maLenhCat: undefined,
            };

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
          ...extraTamUngFields,
        });

        if (res.item) {
          const updatedItem = res.item;
          setDanhSach((prev) => {
            const exists = prev.some((x) => x.id === editingItem.id);
            return exists ? prev.map((x) => (x.id === editingItem.id ? updatedItem : x)) : [updatedItem, ...prev];
          });
          if (res.supabaseError) {
            toast.warning(`Đã cập nhật trên máy. Cloud báo: ${res.supabaseError}`);
          } else {
            const doiTuong = updatedItem.nguoiNhan || updatedItem.tenDoiTac || "đối tượng";
            toast.success(`Đã cập nhật phiếu ${editingItem.id} (${doiTuong}) thành công!`);
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
          ...extraTamUngFields,
          nguoiNhap: user?.name || "Người dùng",
          emailNguoiNhap: user?.email || "",
          roleNguoiNhap: user?.role || "",
        });

        if (res.item) {
          setDanhSach((prev) => [res.item, ...prev]);
          if (res.supabaseError) {
            toast.warning(`Đã lưu phiếu trên máy. Cloud báo lỗi: ${res.supabaseError}`);
          } else {
            const labelMsg =
              formDanhMuc === "tam_ung" && formLoaiTamUng === "gia_cong"
                ? `Đã ghi nhận tạm ứng bên gia công -${formatVND(parsedAmount)} (theo dõi cấn trừ công nợ)`
                : formLoai === "thu"
                ? `Đã ghi nhận khoản thu +${formatVND(parsedAmount)} (lưu bởi ${user?.name || "bạn"})`
                : `Đã ghi nhận khoản chi -${formatVND(parsedAmount)} (lưu bởi ${user?.name || "bạn"})`;
            toast.success(labelMsg);
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
      {/* Tiêu đề trang & Nút hành động chính - Hero Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-sm p-4 md:p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-teal-500 text-white shadow-md shadow-teal-500/25">
              <ReceiptText className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  Sổ Quỹ Thu Chi Nội Bộ
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Realtime Cloud
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Quản lý chi phí xưởng, đính kèm bill chứng từ, kiểm soát tạm ứng nhân sự và đối soát công nợ gia công
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Nút đồng bộ Supabase */}
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-2 text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-white/10 rounded-xl shadow-xs transition disabled:opacity-50"
            title="Đồng bộ dữ liệu Supabase"
          >
            <RefreshCw className={`w-4 h-4 text-sky-500 ${isSyncing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Đồng bộ Cloud</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl shadow-xs transition"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Xuất Excel</span>
          </button>

          <button
            onClick={() => handleOpenCreate("thu")}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs md:text-sm font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/60 shadow-xs transition"
          >
            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
            <span>+ Thu Tiền</span>
          </button>

          <button
            onClick={() => handleOpenCreate("chi")}
            className="flex items-center gap-1.5 px-4 py-2 text-xs md:text-sm font-bold text-white bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 rounded-xl shadow-md shadow-rose-500/25 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Chi Tiền Mới</span>
          </button>
        </div>
      </div>

      {/* Thẻ KPI Thống Kê Tổng Quan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Thẻ 1: Tổng Chi Kỳ Này */}
        <div className="relative overflow-hidden rounded-2xl border border-rose-200/80 dark:border-rose-900/30 bg-gradient-to-br from-rose-50/70 via-white to-white dark:from-rose-950/20 dark:via-slate-900 dark:to-slate-900 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              {viewScope === "van_hanh"
                ? "Chi Phí Vận Hành Xưởng"
                : viewScope === "tam_ung"
                ? "Tổng Tạm Ứng Nhân Sự"
                : viewScope === "tam_ung_gia_cong"
                ? "Tổng Tạm Ứng Gia Công"
                : "Tổng Tiền Chi Kỳ Này"}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              {viewScope === "tam_ung" ? (
                <HandCoins className="h-5 w-5 text-teal-600" />
              ) : viewScope === "tam_ung_gia_cong" ? (
                <Factory className="h-5 w-5 text-indigo-600" />
              ) : (
                <ArrowUpRight className="h-5 w-5" />
              )}
            </div>
          </div>
          <div className="mt-2.5 text-2xl font-black text-rose-600 dark:text-rose-400">
            {viewScope === "van_hanh"
              ? formatVND(chiVanHanhTrongKy)
              : viewScope === "tam_ung"
              ? formatVND(tamUngNhanSuTrongKy)
              : viewScope === "tam_ung_gia_cong"
              ? formatVND(tamUngGiaCongTrongKy)
              : formatVND(tongChiThucTeTrongKy)}
          </div>
          <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            {viewScope === "tat_ca" ? (
              <span>
                Vận hành: <b className="text-slate-700 dark:text-slate-300">{formatVNDShort(chiVanHanhTrongKy)}</b> · Ứng NV: <b className="text-teal-600">{formatVNDShort(tamUngNhanSuTrongKy)}</b> · Ứng GC: <b className="text-indigo-600">{formatVNDShort(tamUngGiaCongTrongKy)}</b>
              </span>
            ) : viewScope === "van_hanh" ? (
              <span>Chi phí xưởng (Không tính tiền ứng: <b className="text-teal-600">{formatVNDShort(tamUngNhanSuTrongKy)}</b>)</span>
            ) : viewScope === "tam_ung" ? (
              <span>Được khấu trừ trực tiếp vào Bảng Lương hàng tháng</span>
            ) : (
              <span>Đã ứng trước xưởng ngoài · Dùng đối soát cấn trừ Công Nợ</span>
            )}
          </div>
        </div>

        {/* Thẻ 2: Tổng Tiền Thu */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-200/80 dark:border-emerald-900/30 bg-gradient-to-br from-emerald-50/70 via-white to-white dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Tổng Tiền Thu Vào
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ArrowDownLeft className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2.5 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {formatVND(tongThu)}
          </div>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            {soGiaoDichThu > 0 ? (
              <span>{soGiaoDichThu} khoản thu (bán vải vụn, phế liệu, ve chai...)</span>
            ) : (
              <span>Chưa có phát sinh khoản thu trong kỳ lọc</span>
            )}
          </p>
        </div>

        {/* Thẻ 3: Chênh Lệch Quỹ / Dòng Tiền */}
        <div
          className={`relative overflow-hidden rounded-2xl border p-5 shadow-xs ${
            tonQuy >= 0
              ? "border-sky-200/80 dark:border-sky-900/30 bg-gradient-to-br from-sky-50/70 via-white to-white dark:from-sky-950/20 dark:via-slate-900 dark:to-slate-900"
              : "border-amber-200/80 dark:border-amber-900/30 bg-gradient-to-br from-amber-50/70 via-white to-white dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
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
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            {tonQuy >= 0 ? "Dòng tiền dương trong kỳ lọc" : "Chi thực tế đang nhiều hơn thu"}
          </p>
        </div>

        {/* Thẻ 4: Tạm Ứng Đang Theo Dõi / Chi Lớn Nhất */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              {viewScope === "tam_ung_gia_cong"
                ? "Xưởng Ứng Nhiều Nhất"
                : viewScope === "tam_ung"
                ? "Nhân Sự Ứng Nhiều Nhất"
                : "Tạm Ứng Đang Theo Dõi"}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2.5 text-lg font-black text-slate-900 dark:text-white truncate">
            {viewScope === "tam_ung_gia_cong" ? (
              thongKeXuongGiaCong[0]?.tenXuong || "Chưa có xưởng ứng"
            ) : viewScope === "tam_ung" ? (
              filteredList[0]?.nguoiNhan || "Chưa có ứng lương"
            ) : (
              formatVND(tongTamUng)
            )}
          </div>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            {viewScope === "tam_ung_gia_cong" ? (
              thongKeXuongGiaCong[0] ? (
                <>
                  <b className="text-indigo-600 dark:text-indigo-400">
                    {formatVND(thongKeXuongGiaCong[0].tongUng)}
                  </b>{" "}
                  ({thongKeXuongGiaCong[0].soLanUng} lần tạm ứng)
                </>
              ) : (
                "Chưa có dữ liệu"
              )
            ) : viewScope === "tam_ung" ? (
              <span>{filteredList.length} lượt tạm ứng lương chờ cấn trừ</span>
            ) : (
              <span>
                Ứng NV: <b className="text-teal-600">{formatVNDShort(tongTamUngNhanSu)}</b> · Ứng GC: <b className="text-indigo-600">{formatVNDShort(tongTamUngGiaCong)}</b>
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Box tổng hợp chi tiết tiền tạm ứng từng xưởng gia công khi ở tab Tạm ứng Gia công */}
      {viewScope === "tam_ung_gia_cong" && thongKeXuongGiaCong.length > 0 && (
        <div className="rounded-2xl border border-indigo-200/80 dark:border-indigo-900/40 bg-gradient-to-br from-indigo-50/40 via-white to-white dark:from-indigo-950/20 dark:via-slate-900 dark:to-slate-900 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-indigo-100 dark:border-white/5 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Factory className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Bảng Tổng Hợp Tiền Gia Công Đã Ứng Trước</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                    {thongKeXuongGiaCong.length} xưởng
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Dữ liệu dùng để đối chiếu cấn trừ khi thanh toán công nợ các đợt gia công May, In/Thêu ngoài
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleOpenCreate("chi", "gia_cong")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Chi Tạm Ứng Xưởng Gia Công</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {thongKeXuongGiaCong.map((x) => (
              <div
                key={x.maDoiTac || x.tenXuong}
                className="p-3.5 rounded-xl border border-indigo-100 dark:border-white/5 bg-white dark:bg-slate-800/60 shadow-2xs hover:border-indigo-300 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      {x.maDoiTac && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200">
                          {x.maDoiTac}
                        </span>
                      )}
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {x.tenXuong}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Công đoạn: <b className="text-slate-700 dark:text-slate-300">{x.loaiGiaCong}</b>
                    </div>
                  </div>
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                    {formatVND(x.tongUng)}
                  </span>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{x.soLanUng} lần tạm ứng</span>
                  {x.ngayGanNhat && <span>Gần nhất: {x.ngayGanNhat}</span>}
                  <button
                    type="button"
                    onClick={() => setSearchTerm(x.maDoiTac || x.tenXuong)}
                    className="text-indigo-600 hover:text-indigo-700 font-semibold"
                  >
                    Xem phiếu →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Phân bổ chi phí theo danh mục (chỉ hiện khi có chi phí và không ở tab gia công riêng) */}
      {viewScope !== "tam_ung_gia_cong" && thongKeChi.length > 0 && (
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Phân Bổ Chi Phí Theo Danh Mục
              </h2>
            </div>
            <span className="text-xs text-slate-500">Tự động tính theo kỳ lọc hiện tại</span>
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

      {/* THANH SCOPE TABS (Bố cục khoa học: Toàn Bộ Quỹ lên đầu tiên) */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-xs">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-bold">
            {/* Tab 1: Toàn Bộ Quỹ */}
            <button
              type="button"
              onClick={() => {
                setViewScope("tat_ca");
                if (danhMucFilter === "tam_ung") setDanhMucFilter("all");
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all ${
                viewScope === "tat_ca"
                  ? "bg-teal-700 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>📋 Toàn Bộ Sổ Quỹ ({danhSach.length})</span>
            </button>

            {/* Tab 2: Chi Phí Vận Hành */}
            <button
              type="button"
              onClick={() => {
                setViewScope("van_hanh");
                if (danhMucFilter === "tam_ung") setDanhMucFilter("all");
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all ${
                viewScope === "van_hanh"
                  ? "bg-teal-700 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>🏢 Chi Phí Vận Hành Xưởng ({countVanHanh})</span>
            </button>

            {/* Tab 3: Tạm Ứng Nhân Sự */}
            <button
              type="button"
              onClick={() => {
                setViewScope("tam_ung");
                setDanhMucFilter("tam_ung");
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all ${
                viewScope === "tam_ung"
                  ? "bg-teal-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <HandCoins className="w-3.5 h-3.5" />
              <span>👥 Tạm Ứng Nhân Sự (Trừ Lương) ({countTamUngNhanSu})</span>
            </button>

            {/* Tab 4: Tạm Ứng Bên Gia Công */}
            <button
              type="button"
              onClick={() => {
                setViewScope("tam_ung_gia_cong");
                setDanhMucFilter("tam_ung");
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all ${
                viewScope === "tam_ung_gia_cong"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Factory className="w-3.5 h-3.5" />
              <span>🏭 Tạm Ứng Bên Gia Công (Trừ Công Nợ) ({countTamUngGiaCong})</span>
            </button>
          </div>

          {/* Tag ghi chú nhanh */}
          <div className="text-xs text-slate-500 dark:text-slate-400 px-2 py-1 font-medium hidden lg:flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            {viewScope === "tat_ca" && <span>Hiển thị toàn bộ dòng tiền thu, chi vận hành và các khoản tạm ứng</span>}
            {viewScope === "van_hanh" && <span>Khoản tạm ứng được tách riêng để không đội chi phí vận hành xưởng</span>}
            {viewScope === "tam_ung" && <span>Tự động khấu trừ vào Bảng Lương tháng tương ứng của nhân sự</span>}
            {viewScope === "tam_ung_gia_cong" && <span>Tự động theo dõi cấn trừ vào đợt thanh toán Công Nợ bên gia công</span>}
          </div>
        </div>
      </div>

      {/* THANH BỘ LỌC & TÌM KIẾM & CHUYỂN CHẾ ĐỘ XEM (DataViewToggle) */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-3.5">
        {/* Dòng 1: Phân loại Thu/Chi + Thời gian + DataViewToggle */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Lọc theo loại */}
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-bold">
              <button
                onClick={() => setLoaiFilter("all")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  loaiFilter === "all"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Tất Cả ({danhSach.length})
              </button>
              <button
                onClick={() => setLoaiFilter("chi")}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition ${
                  loaiFilter === "chi"
                    ? "bg-rose-500 text-white shadow-2xs font-bold"
                    : "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                }`}
              >
                🔴 Tiền Chi ({danhSach.filter((x) => x.loai === "chi").length})
              </button>
              <button
                onClick={() => setLoaiFilter("thu")}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition ${
                  loaiFilter === "thu"
                    ? "bg-emerald-600 text-white shadow-2xs font-bold"
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
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Tháng Này
              </button>
              <button
                onClick={() => setThoiGianFilter("all")}
                className={`px-2.5 py-1.5 rounded-lg transition ${
                  thoiGianFilter === "all"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Toàn Thời Gian
              </button>
              <button
                onClick={() => setThoiGianFilter("week")}
                className={`px-2.5 py-1.5 rounded-lg transition ${
                  thoiGianFilter === "week"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                7 Ngày Qua
              </button>
              <button
                onClick={() => setThoiGianFilter("today")}
                className={`px-2.5 py-1.5 rounded-lg transition ${
                  thoiGianFilter === "today"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Hôm Nay
              </button>
              <button
                onClick={() => setThoiGianFilter("custom")}
                className={`px-2.5 py-1.5 rounded-lg transition ${
                  thoiGianFilter === "custom"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Tùy Chọn Ngày
              </button>
            </div>

            {/* Chọn ngày tuỳ biến nếu bật custom */}
            {thoiGianFilter === "custom" && (
              <div className="flex items-center gap-2 text-xs bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-white/10">
                <input
                  type="date"
                  value={tuNgay}
                  onChange={(e) => setTuNgay(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
                <span className="text-slate-400 font-semibold">đến</span>
                <input
                  type="date"
                  value={denNgay}
                  onChange={(e) => setDenNgay(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>
            )}
          </div>

          {/* Toggle chế độ xem: Danh Sách & Dạng Thẻ */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5">
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Chế độ xem:</span>
            <DataViewToggle value={viewMode} onChange={(mode) => setViewMode(mode)} />
          </div>
        </div>

        {/* Dòng 2: Tìm kiếm + Dropdown Danh mục + Hình thức + Reset */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo mã phiếu (TC-...), nội dung, người chi, người nhận, tên nhân sự, xưởng gia công..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl text-xs md:text-sm border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md"
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
              className="px-3 py-2 rounded-xl text-xs md:text-sm border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-medium"
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
              className="px-3 py-2 rounded-xl text-xs md:text-sm border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-medium"
            >
              <option value="all">Tất cả hình thức</option>
              <option value="tien_mat">💵 Tiền mặt</option>
              <option value="chuyen_khoan">💳 Chuyển khoản</option>
            </select>

            {/* Nút Reset bộ lọc */}
            {isFilteringActive && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-xl transition"
                title="Đặt lại bộ lọc về mặc định"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Đặt lại</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* DANH SÁCH GIAO DỊCH (Hỗ trợ Dạng Thẻ & Dạng Bảng) */}
      <div className="space-y-4">
        {/* Header danh sách & đếm kết quả */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Danh Sách Giao Dịch ({filteredList.length})
            </span>
            {filteredList.length !== danhSach.length && (
              <span className="text-xs text-slate-500">· Đang lọc từ {danhSach.length} phiếu</span>
            )}
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Tổng chi trong lọc: <b className="text-rose-600">{formatVND(tongChiThucTeTrongKy)}</b>
            {tongThu > 0 && (
              <span> · Thu: <b className="text-emerald-600">{formatVND(tongThu)}</b></span>
            )}
          </div>
        </div>

        {filteredList.length === 0 ? (
          /* Khung Empty State thân thiện */
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 p-12 text-center shadow-xs">
            <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3">
              <ReceiptText className="w-7 h-7" />
            </div>
            <p className="text-base font-bold text-slate-800 dark:text-slate-200">
              Không tìm thấy giao dịch nào phù hợp với bộ lọc
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              {viewScope === "van_hanh"
                ? "Trong kỳ này các khoản chi đều là Tạm ứng (Nhân sự / Gia công) và đã được tách riêng. Bấm vào '📋 Toàn Bộ Sổ Quỹ' hoặc 'Đặt lại bộ lọc' để xem toàn bộ."
                : "Thử thay đổi từ khóa tìm kiếm, mở rộng mốc thời gian hoặc bấm Tạo Phiếu Chi Mới."}
            </p>
            <div className="flex items-center justify-center gap-2.5 mt-5">
              {isFilteringActive && (
                <button
                  onClick={handleResetFilters}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-xl transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Đặt lại bộ lọc</span>
                </button>
              )}
              <button
                onClick={() => handleOpenCreate("chi")}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tạo Phiếu Chi Ngay</span>
              </button>
            </div>
          </div>
        ) : viewMode === "card" ? (
          /* ==================== DẠNG THẺ (CARD GRID VIEW) ==================== */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredList.map((item) => {
              const dmConfig = DANH_MUC_MAP.get(item.danhMuc);
              const isThu = item.loai === "thu";
              const isTamUng = item.danhMuc === "tam_ung";
              const loaiTU = isTamUng ? nhanDienLoaiTamUng(item) : undefined;

              return (
                <div
                  key={item.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900 p-4 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-white/20 transition-all duration-200"
                >
                  <div className="space-y-3">
                    {/* Hàng 1: Badge Phân Loại & Mã Phiếu */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isTamUng ? (
                          loaiTU === "gia_cong" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold border bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800">
                              <Factory className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Tạm ứng Gia công</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold border bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800">
                              <Users className="w-3.5 h-3.5 text-teal-600" />
                              <span>Tạm ứng Nhân sự</span>
                            </span>
                          )
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${
                              dmConfig?.badgeBg || "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {getCategoryIcon(item.danhMuc, "w-3.5 h-3.5")}
                            <span>{dmConfig?.label || item.danhMuc}</span>
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-100 dark:border-white/5">
                        {item.id}
                      </span>
                    </div>

                    {/* Hàng 2: Số Tiền & Hình Thức Thanh Toán */}
                    <div className="flex items-baseline justify-between gap-2 pt-0.5">
                      <div
                        className={`text-2xl font-black tracking-tight ${
                          isThu ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {isThu ? `+${formatVND(item.soTien)}` : `-${formatVND(item.soTien)}`}
                      </div>

                      <div className="shrink-0">
                        {item.hinhThuc === "tien_mat" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60">
                            <Banknote className="w-3 h-3 text-emerald-600" />
                            <span>Tiền mặt</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60">
                            <CreditCard className="w-3 h-3 text-blue-600" />
                            <span>Chuyển khoản</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Hàng 3: Hộp thông tin đối tượng (Người chi -> Người nhận/Xưởng gia công) */}
                    <div className="rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/70 dark:bg-slate-800/40 p-2.5 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.ngay}</span>
                        </span>
                        <span>Người chi: <b className="text-slate-800 dark:text-slate-200">{item.nguoiThucHien}</b></span>
                      </div>

                      {item.nguoiNhan && (
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-white/5">
                          <span className="text-slate-400 text-[11px]">Bên nhận:</span>
                          <div className="flex items-center gap-1 font-bold">
                            {loaiTU === "gia_cong" ? (
                              <span className="text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                                <Factory className="w-3.5 h-3.5 text-indigo-600" />
                                <span>{item.nguoiNhan}</span>
                              </span>
                            ) : loaiTU === "nhan_su" ? (
                              <span className="text-teal-700 dark:text-teal-300 flex items-center gap-1">
                                <Users className="w-3.5 h-3.5 text-teal-600" />
                                <span>{item.nguoiNhan}</span>
                              </span>
                            ) : (
                              <span className="text-slate-800 dark:text-slate-200">{item.nguoiNhan}</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Tag nghiệp vụ (Khấu trừ bảng lương / Khấu trừ công nợ / Mã lệnh cắt) */}
                      {isTamUng && (
                        <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-200/50 dark:border-white/5 font-semibold">
                          <span className={loaiTU === "gia_cong" ? "text-indigo-600" : "text-teal-600"}>
                            {loaiTU === "gia_cong" ? "⚙️ Khấu trừ Công Nợ" : "💼 Khấu trừ Bảng Lương"}
                          </span>
                          {item.maLenhCat && (
                            <span className="font-mono px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                              {item.maLenhCat}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Nội dung / Diễn giải */}
                    <p className="text-xs text-slate-700 dark:text-slate-200 line-clamp-2 font-medium min-h-[32px]">
                      {item.noiDung}
                    </p>

                    {/* Chứng từ / Ảnh */}
                    {item.hinhAnh && item.hinhAnh.length > 0 ? (
                      <div className="pt-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                            <FileText className="w-3 h-3 text-sky-500" />
                            <span>Chứng từ ({item.hinhAnh.length} ảnh)</span>
                          </span>
                          <span className="text-[10px] text-sky-600 font-medium">Bấm phóng to</span>
                        </div>
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                          {item.hinhAnh.slice(0, 4).map((imgSrc, imgIdx) => (
                            <button
                              key={imgIdx}
                              type="button"
                              onClick={() =>
                                handleOpenLightbox(
                                  imgSrc,
                                  item.hinhAnh,
                                  `${item.id} - ${item.noiDung} (${imgIdx + 1}/${item.hinhAnh!.length})`
                                )
                              }
                              className="group/img relative h-12 w-14 shrink-0 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 hover:ring-2 hover:ring-sky-500 transition cursor-zoom-in"
                              title="Bấm để xem ảnh lớn"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={imgSrc} alt="Bill" className="h-full w-full object-cover group-hover/img:scale-105 transition" />
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center">
                                <Eye className="w-3.5 h-3.5 text-white" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 italic pt-1 flex items-center gap-1">
                        <span>Chưa có ảnh chứng từ</span>
                      </div>
                    )}
                  </div>

                  {/* Chân thẻ: Nút Thao tác */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                      {item.nguoiNhap ? `Lập: ${item.nguoiNhap}` : ""}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setViewingItem(item)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800 transition"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 transition"
                        title="Chỉnh sửa phiếu"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingId(item.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition"
                        title="Xóa phiếu"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ==================== DẠNG DANH SÁCH (TABLE VIEW) ==================== */
          <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            {/* Mobile View */}
            <div className="block md:hidden divide-y divide-slate-100 dark:divide-white/5">
              {filteredList.map((item) => {
                const dmConfig = DANH_MUC_MAP.get(item.danhMuc);
                const isThu = item.loai === "thu";
                const isTamUng = item.danhMuc === "tam_ung";
                const loaiTU = isTamUng ? nhanDienLoaiTamUng(item) : undefined;

                return (
                  <div key={item.id} className="p-4 space-y-3 bg-white dark:bg-slate-900">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isTamUng ? (
                            loaiTU === "gia_cong" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold border bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800">
                                <Factory className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Tạm ứng Gia công</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold border bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800">
                                <Users className="w-3.5 h-3.5 text-teal-600" />
                                <span>Tạm ứng Nhân sự</span>
                              </span>
                            )
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${
                                dmConfig?.badgeBg || "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {getCategoryIcon(item.danhMuc, "w-3.5 h-3.5")}
                              <span>{dmConfig?.label || item.danhMuc}</span>
                            </span>
                          )}
                          <span className="text-[11px] font-mono font-bold text-slate-400">{item.id}</span>
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
                        {item.nguoiNhan && (
                          <span>
                            {" "}➔{" "}
                            <b
                              className={
                                loaiTU === "gia_cong"
                                  ? "text-indigo-600 dark:text-indigo-400 font-bold"
                                  : loaiTU === "nhan_su"
                                  ? "text-teal-600 dark:text-teal-400 font-bold"
                                  : "text-slate-700 dark:text-slate-300"
                              }
                            >
                              {item.nguoiNhan}
                            </b>
                          </span>
                        )}
                        {item.maLenhCat && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {item.maLenhCat}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Nút thao tác Mobile */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
                      <button
                        type="button"
                        onClick={() => setViewingItem(item)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Chi tiết</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Sửa</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingId(item.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition"
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
                  <tr className="border-b border-slate-100 dark:border-white/5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/70 dark:bg-slate-800/50">
                    <th className="py-3 px-4">Ngày / Mã</th>
                    <th className="py-3 px-4">Loại & Danh Mục</th>
                    <th className="py-3 px-4 text-right">Số Tiền</th>
                    <th className="py-3 px-4">Hình Thức</th>
                    <th className="py-3 px-4">Nội Dung / Diễn Giải</th>
                    <th className="py-3 px-4">Người Chi & Người Nhận</th>
                    <th className="py-3 px-4 text-center">Chứng Từ</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-normal">
                  {filteredList.map((item) => {
                    const dmConfig = DANH_MUC_MAP.get(item.danhMuc);
                    const isThu = item.loai === "thu";
                    const isTamUng = item.danhMuc === "tam_ung";
                    const loaiTU = isTamUng ? nhanDienLoaiTamUng(item) : undefined;

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition group"
                      >
                        {/* Ngày / Mã */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.ngay}</span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 mt-0.5">{item.id}</div>
                        </td>

                        {/* Loại & Danh mục */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {isTamUng ? (
                              loaiTU === "gia_cong" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800">
                                  <Factory className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>Tạm ứng Gia công</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800">
                                  <Users className="w-3.5 h-3.5 text-teal-600" />
                                  <span>Tạm ứng Nhân sự</span>
                                </span>
                              )
                            ) : (
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                                  dmConfig?.badgeBg || "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {getCategoryIcon(item.danhMuc, "w-3.5 h-3.5")}
                                <span>{dmConfig?.label || item.danhMuc}</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Số tiền */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div
                            className={`text-sm md:text-base font-extrabold ${
                              isThu ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {isThu ? `+${formatVND(item.soTien)}` : `-${formatVND(item.soTien)}`}
                          </div>
                        </td>

                        {/* Hình thức */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {item.hinhThuc === "tien_mat" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60">
                              <Banknote className="w-3 h-3 text-emerald-600" />
                              <span>Tiền mặt</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60">
                              <CreditCard className="w-3 h-3 text-blue-600" />
                              <span>Chuyển khoản</span>
                            </span>
                          )}
                        </td>

                        {/* Nội dung */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="text-slate-800 dark:text-slate-200 line-clamp-2 font-medium">
                            {item.noiDung}
                          </p>
                        </td>

                        {/* Người chi & Người nhận */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                          <div className="text-slate-800 dark:text-slate-200 font-bold">
                            {item.nguoiThucHien}
                          </div>
                          {item.nguoiNhan && (
                            <div className="text-[11px] mt-0.5 flex items-center gap-1 flex-wrap">
                              <span className="text-slate-400">Đến:</span>
                              <span
                                className={`font-semibold ${
                                  loaiTU === "gia_cong"
                                    ? "text-indigo-700 dark:text-indigo-300 font-bold"
                                    : loaiTU === "nhan_su"
                                    ? "text-teal-700 dark:text-teal-300 font-bold"
                                    : "text-slate-700 dark:text-slate-300"
                                }`}
                              >
                                {item.nguoiNhan}
                              </span>
                              {item.maLenhCat && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  {item.maLenhCat}
                                </span>
                              )}
                            </div>
                          )}
                          {item.nguoiNhap && (
                            <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                              <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                              <span>Lập: {item.nguoiNhap}</span>
                            </div>
                          )}
                        </td>

                        {/* Chứng từ / Ảnh */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {item.hinhAnh && item.hinhAnh.length > 0 ? (
                            <div className="inline-flex items-center justify-center gap-1.5">
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
                                className="group relative h-9 w-9 shrink-0 rounded-lg overflow-hidden border border-sky-200 dark:border-sky-800 bg-slate-100 shadow-2xs hover:ring-2 hover:ring-sky-500 transition cursor-zoom-in"
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
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 border border-sky-200/60 transition"
                                title="Bấm để xem toàn bộ ảnh chứng từ"
                              >
                                <FileText className="w-3.5 h-3.5 text-sky-600" />
                                <span>{item.hinhAnh.length}</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Không có</span>
                          )}
                        </td>

                        {/* Thao tác */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setViewingItem(item)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-sky-600 bg-slate-100 hover:bg-sky-50 dark:bg-slate-800 transition"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-amber-600 bg-slate-100 hover:bg-amber-50 dark:bg-slate-800 transition"
                              title="Chỉnh sửa phiếu"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingId(item.id)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 transition"
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
          </div>
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
                  {formDanhMuc === "tam_ung" ? (
                    <div>
                      {/* Bộ chuyển đối tượng tạm ứng: Nhân sự vs Gia công */}
                      <div className="mb-2.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                          Đối tượng nhận tạm ứng <span className="text-rose-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                          <button
                            type="button"
                            onClick={() => {
                              setFormLoaiTamUng("nhan_su");
                              setFormNguoiNhan("");
                              setFormMaDoiTac("");
                              setFormTenDoiTac("");
                              setFormLoaiGiaCong("");
                              setFormMaLenhCat("");
                              setFormNoiDung("");
                            }}
                            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition ${
                              formLoaiTamUng === "nhan_su"
                                ? "bg-teal-600 text-white shadow-sm"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                            }`}
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>👤 Nhân sự nội bộ</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormLoaiTamUng("gia_cong");
                              setFormNguoiNhan("");
                              setFormMaDoiTac("");
                              setFormTenDoiTac("");
                              setFormLoaiGiaCong("");
                              setFormMaLenhCat("");
                              setFormNoiDung("");
                            }}
                            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition ${
                              formLoaiTamUng === "gia_cong"
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                            }`}
                          >
                            <Factory className="w-3.5 h-3.5" />
                            <span>🏭 Bên Gia công ngoài</span>
                          </button>
                        </div>
                      </div>

                      {formLoaiTamUng === "nhan_su" ? (
                        <>
                          <label className="block text-xs font-bold uppercase tracking-wider text-teal-900 dark:text-teal-200 mb-1.5 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <UserCheck className="w-4 h-4 text-teal-600" />
                              <span>Chọn Nhân Sự Nhận Tạm Ứng <span className="text-rose-500">*</span></span>
                            </span>
                            <span className="text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 px-2 py-0.5 rounded border border-teal-300">
                              Khấu trừ Bảng Lương
                            </span>
                          </label>

                          <select
                            required
                            value={formNguoiNhan}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormNguoiNhan(val);
                              const found = dsNhanSu.find((x) => `${x.ma} - ${x.ten}` === val || x.ma === val || x.ten === val);
                              if (found) {
                                setFormMaDoiTac(found.ma);
                                setFormTenDoiTac(found.ten);
                                const m = formNgay ? formNgay.slice(5, 7) : new Date().getMonth() + 1;
                                const y = formNgay ? formNgay.slice(0, 4) : new Date().getFullYear();
                                setFormNoiDung(`Tạm ứng lương tháng ${m}/${y} cho ${found.ten} (${found.ma} - ${found.boPhan})`);
                              }
                            }}
                            className="w-full px-3.5 py-3 rounded-xl text-sm font-bold border-2 border-teal-500 bg-teal-50/70 dark:bg-teal-950/40 text-teal-950 dark:text-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 shadow-xs cursor-pointer"
                          >
                            <option value="">-- Bấm vào đây để chọn Nhân sự nhận tiền tạm ứng * --</option>
                            {dsNhanSu.map((ns) => (
                              <option key={ns.ma} value={`${ns.ma} - ${ns.ten}`}>
                                [{ns.ma}] {ns.ten} - Bộ phận: {ns.boPhan}
                              </option>
                            ))}
                          </select>

                          {/* Nút chạm chọn nhanh danh sách nhân sự */}
                          {dsNhanSu.length > 0 && (
                            <div className="mt-2 p-2.5 bg-teal-50/50 dark:bg-teal-950/20 rounded-xl border border-teal-200/60 dark:border-teal-800/40">
                              <div className="text-[11px] font-semibold text-teal-900 dark:text-teal-200 mb-1.5 flex items-center gap-1">
                                <span>Hoặc chạm nhanh tên nhân viên:</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                                {dsNhanSu.map((ns) => {
                                  const isPicked = formNguoiNhan.includes(ns.ma) || formNguoiNhan.includes(ns.ten);
                                  return (
                                    <button
                                      key={ns.ma}
                                      type="button"
                                      onClick={() => {
                                        const val = `${ns.ma} - ${ns.ten}`;
                                        setFormNguoiNhan(val);
                                        setFormMaDoiTac(ns.ma);
                                        setFormTenDoiTac(ns.ten);
                                        const m = formNgay ? formNgay.slice(5, 7) : new Date().getMonth() + 1;
                                        const y = formNgay ? formNgay.slice(0, 4) : new Date().getFullYear();
                                        setFormNoiDung(`Tạm ứng lương tháng ${m}/${y} cho ${ns.ten} (${ns.ma} - ${ns.boPhan})`);
                                      }}
                                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition ${
                                        isPicked
                                          ? "bg-teal-600 text-white border-teal-600 font-bold shadow-xs"
                                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 hover:border-teal-400 hover:bg-teal-50/50"
                                      }`}
                                    >
                                      <span className="font-bold mr-1">{ns.ma}</span> {ns.ten}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          <p className="text-[11px] text-teal-700 dark:text-teal-300 mt-2 bg-teal-50 dark:bg-teal-950/40 p-2 rounded-lg border border-teal-200/70">
                            💡 <b>Quy tắc hệ thống:</b> Khoản tạm ứng này sẽ tự động trừ vào <b>Bảng Lương</b> tháng {formNgay ? `${formNgay.slice(5, 7)}/${formNgay.slice(0, 4)}` : "này"} của nhân sự. Khoản này <b>không tính vào chi phí vận hành</b> của xưởng.
                          </p>
                        </>
                      ) : (
                        <>
                          <label className="block text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-200 mb-1.5 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Factory className="w-4 h-4 text-indigo-600" />
                              <span>Chọn Đối Tác / Xưởng Gia Công <span className="text-rose-500">*</span></span>
                            </span>
                            <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 px-2 py-0.5 rounded border border-indigo-300">
                              Khấu trừ Công Nợ
                            </span>
                          </label>

                          <select
                            required
                            value={formNguoiNhan}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormNguoiNhan(val);
                              const found = dsDoiTacGiaCong.find(
                                (dt) => `${dt.maDT} - ${dt.tenDonVi}` === val || dt.maDT === val || dt.tenDonVi === val
                              );
                              if (found) {
                                setFormMaDoiTac(found.maDT);
                                setFormTenDoiTac(found.tenDonVi);
                                setFormLoaiGiaCong(found.congDoan);
                                const lcText = formMaLenhCat ? ` cho Lệnh cắt ${formMaLenhCat}` : "";
                                setFormNoiDung(`Tạm ứng tiền công ${found.congDoan} cho ${found.tenDonVi} (${found.maDT})${lcText}`);
                              }
                            }}
                            className="w-full px-3.5 py-3 rounded-xl text-sm font-bold border-2 border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-xs cursor-pointer"
                          >
                            <option value="">-- Bấm vào đây để chọn Xưởng gia công nhận tạm ứng * --</option>
                            {dsDoiTacGiaCong.map((dt) => (
                              <option key={dt.maDT || dt.tenDonVi} value={`${dt.maDT} - ${dt.tenDonVi}`}>
                                [{dt.maDT}] {dt.tenDonVi} · {dt.congDoan} {dt.sdt ? `(SĐT: ${dt.sdt})` : ""}
                              </option>
                            ))}
                          </select>

                          {/* Gợi ý chạm nhanh xưởng gia công tiêu biểu */}
                          <div className="mt-2 p-2.5 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-200/60 dark:border-indigo-800/40">
                            <div className="text-[11px] font-semibold text-indigo-900 dark:text-indigo-200 mb-1.5 flex items-center gap-1">
                              <span>Chạm nhanh xưởng gia công quen thuộc:</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                              {dsDoiTacGiaCong.slice(0, 12).map((dt) => {
                                const isPicked = formNguoiNhan.includes(dt.maDT) || formNguoiNhan.includes(dt.tenDonVi);
                                return (
                                  <button
                                    key={dt.maDT || dt.tenDonVi}
                                    type="button"
                                    onClick={() => {
                                      const val = `${dt.maDT} - ${dt.tenDonVi}`;
                                      setFormNguoiNhan(val);
                                      setFormMaDoiTac(dt.maDT);
                                      setFormTenDoiTac(dt.tenDonVi);
                                      setFormLoaiGiaCong(dt.congDoan);
                                      const lcText = formMaLenhCat ? ` cho Lệnh cắt ${formMaLenhCat}` : "";
                                      setFormNoiDung(`Tạm ứng tiền công ${dt.congDoan} cho ${dt.tenDonVi} (${dt.maDT})${lcText}`);
                                    }}
                                    className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition ${
                                      isPicked
                                        ? "bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs"
                                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50"
                                    }`}
                                  >
                                    <span className="font-bold mr-1">{dt.maDT}</span> {dt.tenDonVi} ({dt.congDoan})
                                  </button>
                                );
                              })}
                            </div>

                            {/* Ô nhập gắn Mã Lệnh Cắt */}
                            <div className="mt-2 pt-2 border-t border-indigo-200/50 flex items-center gap-2">
                              <span className="text-[11px] font-semibold text-indigo-900 dark:text-indigo-200 whitespace-nowrap">
                                Gắn Lệnh Cắt / Đơn hàng:
                              </span>
                              <input
                                type="text"
                                value={formMaLenhCat}
                                onChange={(e) => {
                                  const lc = e.target.value.toUpperCase();
                                  setFormMaLenhCat(lc);
                                  if (formTenDoiTac) {
                                    const cd = formLoaiGiaCong || "gia công";
                                    setFormNoiDung(`Tạm ứng tiền công ${cd} cho ${formTenDoiTac} (${formMaDoiTac || "Xưởng"}) - Lệnh cắt ${lc}`);
                                  }
                                }}
                                placeholder="VD: LC-M758, LC-M873..."
                                className="w-full px-2.5 py-1 rounded-lg text-xs font-semibold border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase"
                              />
                            </div>
                          </div>

                          <p className="text-[11px] text-indigo-800 dark:text-indigo-300 mt-2 bg-indigo-50 dark:bg-indigo-950/40 p-2 rounded-lg border border-indigo-200/70">
                            💡 <b>Quy tắc hệ thống:</b> Khoản tạm ứng này sẽ ghi nhận số tiền bên gia công đã ứng trước để <b>đối soát cấn trừ vào công nợ gia công</b>. Khoản này <b>không tính vào chi phí vận hành</b> của xưởng.
                          </p>
                        </>
                      )}
                    </div>
                  ) : (
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
                  )}
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

              {/* Thông tin nghiệp vụ Tạm Ứng nếu là khoản tạm ứng */}
              {viewingItem.danhMuc === "tam_ung" && (
                <div
                  className={`rounded-2xl border p-4 text-xs ${
                    nhanDienLoaiTamUng(viewingItem) === "gia_cong"
                      ? "border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-950 dark:text-indigo-200"
                      : "border-teal-200 dark:border-teal-900/50 bg-teal-50/70 dark:bg-teal-950/30 text-teal-950 dark:text-teal-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-indigo-200/50 dark:border-white/10">
                    <span className="font-bold flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                      {nhanDienLoaiTamUng(viewingItem) === "gia_cong" ? (
                        <>
                          <Factory className="w-4 h-4 text-indigo-600" />
                          <span>Tạm Ứng Bên Gia Công Ngoài</span>
                        </>
                      ) : (
                        <>
                          <Users className="w-4 h-4 text-teal-600" />
                          <span>Tạm Ứng Nhân Sự Nội Bộ</span>
                        </>
                      )}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        nhanDienLoaiTamUng(viewingItem) === "gia_cong"
                          ? "bg-indigo-200/70 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-200"
                          : "bg-teal-200/70 text-teal-900 dark:bg-teal-900 dark:text-teal-200"
                      }`}
                    >
                      {nhanDienLoaiTamUng(viewingItem) === "gia_cong" ? "Khấu trừ Công Nợ" : "Khấu trừ Bảng Lương"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Đơn vị / Người nhận:</span>
                      <span className="font-bold">{viewingItem.tenDoiTac || viewingItem.nguoiNhan}</span>
                      {viewingItem.maDoiTac && (
                        <span className="ml-1 px-1.5 py-0.2 rounded text-[10px] font-mono bg-white dark:bg-slate-800 border">
                          {viewingItem.maDoiTac}
                        </span>
                      )}
                    </div>

                    {nhanDienLoaiTamUng(viewingItem) === "gia_cong" && (
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Công đoạn gia công:</span>
                        <span className="font-semibold">{viewingItem.loaiGiaCong || "Gia công ngoài"}</span>
                      </div>
                    )}

                    {viewingItem.maLenhCat && (
                      <div className="col-span-2">
                        <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Gắn với Lệnh cắt:</span>
                        <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300">
                          {viewingItem.maLenhCat}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-indigo-200/40 dark:border-white/5 text-[11px] opacity-80">
                    💡{" "}
                    {nhanDienLoaiTamUng(viewingItem) === "gia_cong"
                      ? "Khoản tiền này được ghi chú theo dõi để cấn trừ trực tiếp khi thanh toán công nợ gia công. Không tính vào chi phí xưởng."
                      : "Khoản tiền này sẽ được trừ vào Bảng Lương hàng tháng của nhân sự. Không tính vào chi phí xưởng."}
                  </div>
                </div>
              )}

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
