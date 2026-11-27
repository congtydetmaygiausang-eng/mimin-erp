"use client";

/**
 * Trang Bảng Lương - MIMIN ERP
 * Nâng cấp toàn diện theo chuẩn UI/UX cao cấp:
 * - Khối điều khiển chu kỳ lương: Hiển thị ngày/tháng/năm bắt đầu, kết thúc, ngày dự kiến chi trả, đồng hồ thời gian thực
 * - Hệ thống Tìm kiếm & Bộ lọc chuyên nghiệp: Tìm tức thì, lọc theo bộ phận, tình trạng tạm ứng, mức thu nhập, nút reset
 * - Dashboard KPI tài chính 5 thẻ cao cấp & Biểu đồ phân bổ chi phí xưởng
 * - Chuyển đổi linh hoạt chế độ xem: Dạng Bảng (Table View) & Dạng Thẻ Hồ Sơ (Card View)
 * - Tự động khấu trừ tạm ứng từ Sổ Thu Chi nội bộ, theo dõi chi tiết từng lần tạm ứng
 * - Phiếu lương cá nhân chuẩn A4 dọc (bỏ phụ cấp trách nhiệm, đọc số tiền chuẩn, tính số ngày nghỉ từ chấm công)
 * - In toàn bộ bảng lương chuẩn A4 ngang
 */

import { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Calculator, Download, Users, TrendingUp, TrendingDown,
  DollarSign, Calendar, ChevronLeft, ChevronRight, Filter, FileText,
  CheckCircle2, AlertCircle, Wallet, Award, Loader2, HandCoins,
  CreditCard, Banknote, Eye, Printer, Clock, ArrowRight, Search,
  Building2, ExternalLink, X, ShieldCheck, Check, Sparkles, UserCheck, Factory,
  LayoutGrid, List, RotateCcw, Copy, CheckCheck, User, ChevronDown, ArrowUpRight,
  BadgePercent, Briefcase
} from "lucide-react";
import { toast } from "sonner";
import {
  tinhBangLuongThang, tongKetBangLuong, fmtVND, fmtVNDFull,
  type BangLuongNV, type TongKetBangLuong
} from "@/lib/bang-luong-engine";
import { CHUAN_NGAY_CONG_THANG } from "@/lib/cham-cong";
import { useBangLuongData } from "@/lib/use-bang-luong";
import type { GiaoDichThuChi } from "@/lib/data/thu-chi";

// Helper định dạng ngày giờ chi tiết HH:mm:ss · DD/MM/YYYY
function formatDateTimeFull(isoString?: string, defaultDate?: string): string {
  if (!isoString && !defaultDate) return "-";
  try {
    const raw = isoString || defaultDate;
    const d = new Date(raw!);
    if (isNaN(d.getTime())) return raw || "-";
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const MM = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${hh}:${mm}:${ss} · ${dd}/${MM}/${yyyy}`;
  } catch {
    return isoString || defaultDate || "-";
  }
}

// Helper lấy ngày cuối cùng trong tháng
function getLastDayOfMonth(thang: number, nam: number): number {
  return new Date(nam, thang, 0).getDate();
}

// Helper đọc số tiền thành chữ tiếng Việt chuẩn mực (sửa lỗi "Lẻ" ở hàng triệu/trăm)
function docSoThanhChu(so: number): string {
  if (!so || isNaN(so) || so <= 0) return "Không đồng";
  const chuSo = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];

  function docBlock3(b: number, isFirstBlock: boolean): string {
    const tram = Math.floor(b / 100);
    const chuc = Math.floor((b % 100) / 10);
    const donVi = b % 10;
    let res = "";

    if (!isFirstBlock || tram > 0) {
      res += chuSo[tram] + " trăm ";
    }

    if (chuc === 0) {
      if (donVi > 0) {
        if (!isFirstBlock || tram > 0) {
          res += "lẻ " + chuSo[donVi];
        } else {
          res += chuSo[donVi];
        }
      }
    } else if (chuc === 1) {
      res += "mười ";
      if (donVi === 5) res += "lăm";
      else if (donVi > 0) res += chuSo[donVi];
    } else {
      res += chuSo[chuc] + " mươi ";
      if (donVi === 1) res += "mốt";
      else if (donVi === 5) res += "lăm";
      else if (donVi > 0) res += chuSo[donVi];
    }

    return res.trim();
  }

  const donViTien = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];
  let num = Math.round(so);
  const blocks: number[] = [];
  while (num > 0) {
    blocks.push(num % 1000);
    num = Math.floor(num / 1000);
  }

  let str = "";
  let isFirst = true;
  for (let i = blocks.length - 1; i >= 0; i--) {
    const b = blocks[i];
    if (b > 0) {
      const bStr = docBlock3(b, isFirst);
      str += bStr + " " + donViTien[i] + " ";
      isFirst = false;
    }
  }
  str = str.trim() + " đồng";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Helper hiển thị nhân sự / xưởng nhận tạm ứng rõ ràng, chuẩn xác
function renderNhanSuTamUng(tc: GiaoDichThuChi) {
  const isGiaCong =
    tc.loaiTamUng === "gia_cong" ||
    (tc.nguoiNhan && (tc.nguoiNhan.startsWith("GC-") || tc.nguoiNhan.toLowerCase().includes("xưởng")));

  if (isGiaCong) {
    const tenXuong = tc.tenDoiTac || tc.nguoiNhan || "Xưởng gia công ngoài";
    return (
      <div className="flex flex-col gap-0.5">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 w-fit">
          <Factory className="w-3 h-3 text-indigo-600 shrink-0" />
          <span>{tenXuong}</span>
        </span>
        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium pl-0.5">
          {tc.maDoiTac ? `Mã ĐT: ${tc.maDoiTac} · Khấu trừ công nợ gia công` : "Đối tác gia công · Trừ công nợ"}
        </span>
      </div>
    );
  }

  // Nhân sự nội bộ
  let tenNhanSu = tc.tenDoiTac || "";
  let maNV = tc.maDoiTac || "";

  if (!tenNhanSu && tc.nguoiNhan) {
    if (tc.nguoiNhan.includes(" - ")) {
      const parts = tc.nguoiNhan.split(" - ");
      maNV = parts[0].trim();
      tenNhanSu = parts[1].trim();
    } else {
      tenNhanSu = tc.nguoiNhan;
    }
  }

  // Dò tìm thông minh nếu thiếu
  if (!tenNhanSu || tenNhanSu === "null" || tenNhanSu === "Chưa xác định") {
    const nd = (tc.noiDung || "").toLowerCase();
    if (nd.includes("nano")) {
      tenNhanSu = "Nano";
      maNV = "NANO";
    } else if (nd.includes("hào") || nd.includes("hao")) {
      tenNhanSu = "Trần Thái Hào";
      maNV = "NV07";
    } else if (nd.includes("lý") || nd.includes("ly")) {
      tenNhanSu = "Đoàn Văn Lý";
      maNV = "NV-015";
    } else if (nd.includes("giang")) {
      tenNhanSu = "Nguyễn Hoàng Giang";
      maNV = "NV08";
    } else if (nd.includes("hùng") || nd.includes("hung")) {
      tenNhanSu = "Trần Lương Hùng";
      maNV = "NV05";
    } else if (nd.includes("khang")) {
      tenNhanSu = "Nguyễn Triết Khang";
      maNV = "NV03";
    } else if (nd.includes("định") || nd.includes("dinh")) {
      tenNhanSu = "Lê Định";
      maNV = "NV02";
    } else if (nd.includes("phi")) {
      tenNhanSu = "Lương Hoàng Phi";
      maNV = "NV04";
    } else if (nd.includes("sang")) {
      tenNhanSu = "Hồ Minh Sang";
      maNV = "NV01";
    } else {
      tenNhanSu = tc.nguoiNhan || "Nhân sự nội bộ";
    }
  }

  return (
    <div className="flex flex-col gap-0.5">
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-200 border border-teal-200 dark:border-teal-800 w-fit">
        <UserCheck className="w-3 h-3 text-teal-600 shrink-0" />
        <span>{maNV && maNV !== "NANO" ? `[${maNV}] ${tenNhanSu}` : tenNhanSu}</span>
      </span>
      <span className="text-[10px] text-teal-700 dark:text-teal-400 font-medium pl-0.5">
        Khấu trừ tự động vào Bảng Lương
      </span>
    </div>
  );
}

export default function BangLuongPage() {
  const now = new Date();
  const [thang, setThang] = useState<number>(now.getMonth() + 1);
  const [nam, setNam] = useState<number>(now.getFullYear());
  const [tab, setTab] = useState<"tong-hop" | "chi-tiet" | "thanh-toan">("tong-hop");

  // Bộ lọc & Tìm kiếm chuyên nghiệp
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBoPhan, setFilterBoPhan] = useState<"all" | "QuanLy" | "KhoVan" | "SanXuat" | "LuongSP" | "LuongCung">("all");
  const [filterTamUng, setFilterTamUng] = useState<"all" | "co_tam_ung" | "khong_tam_ung">("all");
  const [filterMucLuong, setFilterMucLuong] = useState<"all" | "duoi_4tr" | "4tr_8tr" | "tren_8tr">("all");
  const [viewMode, setViewMode] = useState<"table" | "card">("table");

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals
  const [selectedTamUngNV, setSelectedTamUngNV] = useState<BangLuongNV | null>(null);
  const [selectedSlipNV, setSelectedSlipNV] = useState<BangLuongNV | null>(null);
  const [showAllTamUngModal, setShowAllTamUngModal] = useState(false);
  const [showPrintAllModal, setShowPrintAllModal] = useState(false);

  // Thời gian tra cứu / xem bảng lương (thời gian thực hiện tại)
  const [viewTime, setViewTime] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      const ss = String(d.getSeconds()).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const MM = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      setViewTime(`${hh}:${mm}:${ss} · Ngày ${dd}/${MM}/${yyyy}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Hook lấy data từ các store (workflow thật + chấm công + sổ thu chi tạm ứng)
  const { bangLuong, tongKet, loading, allPhieuCount, danhSachThuChi } = useBangLuongData(thang, nam);

  // Phân loại NV
  const luongSP = useMemo(() => bangLuong.filter((b) => b.isLuongSP), [bangLuong]);
  const luongCung = useMemo(() => bangLuong.filter((b) => !b.isLuongSP), [bangLuong]);

  // Bộ đếm nhanh cho các badge bộ lọc
  const counts = useMemo(() => {
    let ql = 0;
    let kv = 0;
    let sx = 0;
    let coTamUng = 0;

    bangLuong.forEach((b) => {
      const bp = (b.boPhan || "").toLowerCase();
      if (bp.includes("quản") || bp.includes("kế toán") || bp.includes("content") || bp.includes("media") || bp.includes("sỉ")) {
        ql++;
      } else if (bp.includes("kho")) {
        kv++;
      } else {
        sx++;
      }
      if (b.tamUng > 0) coTamUng++;
    });

    return {
      all: bangLuong.length,
      ql,
      kv,
      sx,
      sp: luongSP.length,
      cung: luongCung.length,
      coTamUng,
    };
  }, [bangLuong, luongSP, luongCung]);

  // Lọc đa điều kiện: Tìm kiếm + Bộ phận + Tạm ứng + Mức lương
  const filteredBangLuong = useMemo(() => {
    return bangLuong.filter((b) => {
      // 1. Text search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const match =
          b.maNV.toLowerCase().includes(term) ||
          b.tenNV.toLowerCase().includes(term) ||
          b.boPhan.toLowerCase().includes(term);
        if (!match) return false;
      }

      // 2. Bộ phận filter
      if (filterBoPhan === "QuanLy") {
        const bp = (b.boPhan || "").toLowerCase();
        if (!bp.includes("quản") && !bp.includes("kế toán") && !bp.includes("content") && !bp.includes("media") && !bp.includes("sỉ")) {
          return false;
        }
      } else if (filterBoPhan === "KhoVan") {
        const bp = (b.boPhan || "").toLowerCase();
        if (!bp.includes("kho")) return false;
      } else if (filterBoPhan === "SanXuat") {
        const bp = (b.boPhan || "").toLowerCase();
        if (bp.includes("quản") || bp.includes("kế toán") || bp.includes("content") || bp.includes("media") || bp.includes("sỉ") || bp.includes("kho")) {
          return false;
        }
      } else if (filterBoPhan === "LuongSP") {
        if (!b.isLuongSP) return false;
      } else if (filterBoPhan === "LuongCung") {
        if (b.isLuongSP) return false;
      }

      // 3. Tình trạng tạm ứng
      if (filterTamUng === "co_tam_ung" && b.tamUng <= 0) return false;
      if (filterTamUng === "khong_tam_ung" && b.tamUng > 0) return false;

      // 4. Mức thu nhập thực lĩnh
      if (filterMucLuong === "duoi_4tr" && b.thucNhan >= 4_000_000) return false;
      if (filterMucLuong === "4tr_8tr" && (b.thucNhan < 4_000_000 || b.thucNhan > 8_000_000)) return false;
      if (filterMucLuong === "tren_8tr" && b.thucNhan <= 8_000_000) return false;

      return true;
    });
  }, [bangLuong, searchTerm, filterBoPhan, filterTamUng, filterMucLuong]);

  // Kiểm tra có đang áp dụng bộ lọc nào không
  const hasActiveFilters = searchTerm.trim() !== "" || filterBoPhan !== "all" || filterTamUng !== "all" || filterMucLuong !== "all";

  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterBoPhan("all");
    setFilterTamUng("all");
    setFilterMucLuong("all");
  };

  // Tổng tiền thực nhận của danh sách đang hiển thị
  const filteredTotalThucNhan = useMemo(() => {
    return filteredBangLuong.reduce((sum, b) => sum + b.thucNhan, 0);
  }, [filteredBangLuong]);

  // Toàn bộ các khoản tạm ứng trong tháng đang chọn
  const monthPrefix = `${nam}-${String(thang).padStart(2, "0")}`;
  const allMonthTamUng = useMemo(() => {
    return (danhSachThuChi || []).filter(
      (tc) =>
        tc.loai === "chi" &&
        tc.danhMuc === "tam_ung" &&
        typeof tc.ngay === "string" &&
        tc.ngay.startsWith(monthPrefix)
    );
  }, [danhSachThuChi, monthPrefix]);

  // Lịch sử lương các tháng trước của một nhân sự (để xem so sánh đối chiếu)
  // Bắt đầu ghi nhận dữ liệu từ Tháng 11/2026 trở đi (trước đó chưa có dữ liệu)
  const historyMonths = useMemo(() => {
    if (!selectedSlipNV) return [];
    const list: { thang: number; nam: number; ngayCong: number; tienCong: number; tamUng: number; thucNhan: number }[] = [];
    for (let i = 1; i <= 3; i++) {
      let m = thang - i;
      let y = nam;
      if (m <= 0) {
        m += 12;
        y -= 1;
      }
      if (y < 2026 || (y === 2026 && m < 11)) {
        continue;
      }
      const prevBL = tinhBangLuongThang(m, y, [], undefined, undefined, danhSachThuChi);
      const found = prevBL.find((x) => x.maNV === selectedSlipNV.maNV);
      if (found) {
        list.push({
          thang: m,
          nam: y,
          ngayCong: found.ngayCongThucTe,
          tienCong: found.tienCong,
          tamUng: found.tamUng,
          thucNhan: found.thucNhan,
        });
      }
    }
    return list;
  }, [selectedSlipNV, thang, nam, danhSachThuChi]);

  // Navigation tháng
  const prevMonth = () => {
    if (thang === 1) {
      setThang(12);
      setNam(nam - 1);
    } else {
      setThang(thang - 1);
    }
  };
  const nextMonth = () => {
    if (thang === 12) {
      setThang(1);
      setNam(nam + 1);
    } else {
      setThang(thang + 1);
    }
  };

  // Xuất Excel / CSV
  const xuatExcel = () => {
    const headers = [
      "Mã NV",
      "Tên NV",
      "Bộ phận",
      "Ngày công",
      "Công chuẩn",
      "Tỷ lệ (%)",
      "Nghỉ phép",
      "Đơn giá / Lương cơ bản",
      "SL Giao",
      "SL Đạt",
      "SL Lỗi",
      "SL Vượt",
      "Tiền công",
      "Phạt lỗi",
      "Thưởng vượt",
      "Phạt trễ",
      "Tạm ứng (Thu Chi)",
      "Thực nhận",
      "Ngày trả",
    ];
    const rows = filteredBangLuong.map((b) => [
      b.maNV,
      b.tenNV,
      b.boPhan,
      b.ngayCongThucTe,
      b.ngayCongChuan,
      `${b.tyLeNgayCong}%`,
      b.ngayPhep,
      b.isLuongSP ? b.donGia : b.luongCung,
      b.soLuongGiao,
      b.soLuongDat,
      b.soLuongLoi,
      b.soLuongVuot,
      b.tienCong,
      b.phatLoi,
      b.thuongVuot,
      b.phatTreHan,
      b.tamUng,
      b.thucNhan,
      b.ngayTra,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bang-luong-${nam}-${String(thang).padStart(2, "0")}.csv`;
    a.click();
    toast.success("Đã xuất file báo cáo tiền lương thành công!");
  };

  // Copy số tiền
  const copyAmount = (amount: number, id: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(String(amount));
      setCopiedId(id);
      toast.success(`Đã sao chép số tiền: ${fmtVNDFull(amount)}`);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Copy cú pháp chuyển khoản
  const copyTransferMemo = (b: BangLuongNV) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      const memo = `LUONG T${thang}/${nam} ${b.maNV} ${b.tenNV}`;
      navigator.clipboard.writeText(memo);
      toast.success(`Đã sao chép nội dung CK: "${memo}"`);
    }
  };

  const lastDay = getLastDayOfMonth(thang, nam);
  const nextMonthNum = thang === 12 ? 1 : thang + 1;
  const nextMonthYear = thang === 12 ? nam + 1 : nam;
  const ngayChiTra = `10/${String(nextMonthNum).padStart(2, "0")}/${nextMonthYear}`;

  // Tính trung bình ngày công
  const avgNgayCong = useMemo(() => {
    if (!bangLuong.length) return "0.0";
    const sum = bangLuong.reduce((s, b) => s + b.ngayCongThucTe, 0);
    return (sum / bangLuong.length).toFixed(1);
  }, [bangLuong]);

  const tongTienCongGoc = useMemo(() => {
    return bangLuong.reduce((s, b) => s + b.tienCong, 0);
  }, [bangLuong]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100/50 to-teal-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950/20 p-3 md:p-6 print:bg-white print:p-0 transition-colors">
      <div className="max-w-7xl mx-auto space-y-4 print:hidden">

        {/* ================= HERO BANNER CAO CẤP CHUẨN MIMIN ERP ================= */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-950 via-teal-900 to-slate-900 text-white p-5 md:p-6 shadow-sm border border-teal-800/60">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex items-start justify-between flex-wrap gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/10 text-teal-300 border border-white/10">
                <Calculator className="w-3.5 h-3.5 text-teal-300" />
                <span>MIMIN ERP · KẾ TOÁN & QUẢN LÝ TIỀN LƯƠNG NHÀ MÁY</span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2.5 text-white">
                <Wallet className="w-7 h-7 text-emerald-400 shrink-0" />
                <span>Bảng Lương Tự Động</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Đồng bộ tự động từ hệ thống chấm công, khối lượng công việc 10 khâu và khấu trừ tạm ứng từ Sổ Thu Chi nội bộ.
                {loading && (
                  <span className="inline-flex items-center gap-1.5 text-amber-300 font-medium ml-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang cập nhật dữ liệu...
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  if (typeof document !== "undefined") {
                    document.body.classList.add("printing-landscape");
                  }
                  setShowPrintAllModal(true);
                }}
                className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 active:scale-95 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition text-slate-200 border border-slate-700 cursor-pointer shadow-xs"
                title="In toàn bộ bảng lương nhân viên tháng này theo chuẩn khổ A4 ngang"
              >
                <Printer className="w-4 h-4 text-teal-300" />
                <span>In Bảng Lương (A4)</span>
              </button>

              <button
                type="button"
                onClick={xuatExcel}
                className="px-3.5 py-2 bg-teal-600 text-white hover:bg-teal-500 active:scale-95 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4 text-white" />
                <span>Xuất CSV / Excel</span>
              </button>
            </div>
          </div>
        </div>

        {/* ================= KHỐI ĐIỀU KHIỂN KỲ LƯƠNG & NGÀY THÁNG NĂM ================= */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 p-4.5 space-y-3.5">
          <div className="flex items-center justify-between flex-wrap gap-3">

            {/* Bộ chọn tháng/năm chính */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition text-slate-600 dark:text-slate-300"
                  title="Xem kỳ tháng trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2 px-3.5 py-1 bg-teal-800 text-white rounded-lg shadow-xs">
                  <Calendar className="w-3.5 h-3.5 text-teal-300" />
                  <span className="font-bold text-xs sm:text-sm tracking-wide font-mono">
                    Tháng {String(thang).padStart(2, "0")} / {nam}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition text-slate-600 dark:text-slate-300"
                  title="Xem kỳ tháng sau"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Dropdown chọn nhanh tháng/năm */}
              <div className="flex items-center gap-1.5">
                <select
                  value={thang}
                  onChange={(e) => setThang(Number(e.target.value))}
                  aria-label="Chọn tháng tính lương"
                  className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      Tháng {m}
                    </option>
                  ))}
                </select>
                <select
                  value={nam}
                  onChange={(e) => setNam(Number(e.target.value))}
                  aria-label="Chọn năm tính lương"
                  className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>
                      Năm {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Xem nhanh các kỳ gần đây */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              <span className="text-slate-400 text-xs font-semibold mr-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Kỳ gần đây:
              </span>
              {[
                { m: 11, y: 2026, label: "T11/2026" },
                { m: 10, y: 2026, label: "T10/2026" },
                { m: 9, y: 2026, label: "T9/2026" },
                { m: 8, y: 2026, label: "T8/2026" },
              ].map((item) => (
                <button
                  type="button"
                  key={`${item.m}-${item.y}`}
                  onClick={() => {
                    setThang(item.m);
                    setNam(item.y);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${thang === item.m && nam === item.y
                      ? "bg-teal-700 text-white shadow-xs font-bold"
                      : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dòng mốc thời gian chi tiết rõ ràng: Ngày bắt đầu - Ngày kết thúc - Ngày dự kiến chi trả - Đồng hồ thực */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                  Chu kỳ tính lương:
                </span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  01/{String(thang).padStart(2, "0")}/{nam} ➔ {lastDay}/{String(thang).padStart(2, "0")}/{nam}
                </span>
                <span className="text-teal-600 dark:text-teal-400 font-medium ml-1">
                  ({CHUAN_NGAY_CONG_THANG} công)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                  Hạn chi trả lương dự kiến:
                </span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">{ngayChiTra}</span>
                <span className="text-slate-400 ml-1">(Mùng 10)</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                  Thời gian đối chiếu thực tế:
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {viewTime || "Đang đồng bộ..."}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= 5 THẺ DASHBOARD KPI TÀI CHÍNH (CHUẨN MIMIN ERP) ================= */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {/* 1. Tổng thực nhận */}
          <div className="rounded-2xl p-4 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-white dark:to-slate-900 border border-emerald-500/25 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <Wallet className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Thực Nhận (Net)
                </span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 px-2 py-0.5 rounded-md font-bold">
                Thực chi
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-emerald-700 dark:text-emerald-400 mt-1">
              {fmtVND(tongKet.tongThucNhan)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 truncate">
              Đã trừ <span className="font-semibold text-rose-500">{fmtVND(tongKet.tongTamUng)}</span> tạm ứng
            </div>
          </div>

          {/* 2. Tiền công gốc */}
          <div className="rounded-2xl p-4 bg-gradient-to-br from-sky-500/10 via-sky-500/5 to-white dark:to-slate-900 border border-sky-500/25 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 flex items-center justify-center shrink-0">
                  <Calculator className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Tiền Công Gốc
                </span>
              </div>
              <span className="text-[10px] bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 px-2 py-0.5 rounded-md font-bold">
                Gross
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white mt-1">
              {fmtVND(tongTienCongGoc)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 truncate">
              {luongSP.length} thợ SP + {luongCung.length} NV cứng
            </div>
          </div>

          {/* 3. Tạm ứng (Có nút click mở modal) */}
          <div
            onClick={() => setShowAllTamUngModal(true)}
            className="rounded-2xl p-4 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white dark:to-slate-900 border border-amber-500/25 shadow-xs cursor-pointer hover:border-amber-400 transition flex flex-col justify-between group"
            title="Bấm để xem danh sách toàn bộ phiếu tạm ứng trong tháng từ Sổ Thu Chi"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                  <HandCoins className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Tổng Tạm Ứng
                </span>
              </div>
              <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 group-hover:bg-amber-200 px-2 py-0.5 rounded-md font-bold flex items-center gap-1 transition">
                <span>Chi tiết</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-amber-700 dark:text-amber-400 mt-1">
              {fmtVND(tongKet.tongTamUng)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 truncate">
              {tongKet.tongSoLuotTamUng} lượt ứng từ Sổ Thu Chi
            </div>
          </div>

          {/* 4. Tổng nhân sự */}
          <div className="rounded-2xl p-4 bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-white dark:to-slate-900 border border-indigo-500/25 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Nhân Sự
                </span>
              </div>
              <span className="text-[10px] bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 px-2 py-0.5 rounded-md font-bold">
                Quy mô
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white mt-1">
              {tongKet.tongNV} <span className="text-sm font-bold text-slate-400">người</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 truncate">
              TB {avgNgayCong}/{CHUAN_NGAY_CONG_THANG} công làm việc
            </div>
          </div>

          {/* 5. Thưởng & Phạt */}
          <div className="col-span-2 md:col-span-1 rounded-2xl p-4 bg-gradient-to-br from-teal-500/10 via-teal-500/5 to-white dark:to-slate-900 border border-teal-500/25 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Thưởng & Phạt
                </span>
              </div>
              <span className="text-[10px] bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300 px-2 py-0.5 rounded-md font-bold">
                Quy chế
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-teal-700 dark:text-teal-400 mt-1">
              +{fmtVND(tongKet.tongThuongVuot)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 truncate">
              Phạt: <span className="text-rose-500 font-semibold">-{fmtVND(tongKet.tongPhatLoi + tongKet.tongPhatTreHan)}</span>
            </div>
          </div>
        </div>

        {/* ================= TABS ĐIỀU HƯỚNG CHÍNH ================= */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex p-1 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl gap-1 shadow-xs">
            {[
              { id: "tong-hop", label: "Tổng Hợp & Phân Bổ", icon: TrendingUp },
              { id: "chi-tiet", label: "Chi Tiết Nhân Sự", icon: Users },
              { id: "thanh-toan", label: "Kế Hoạch Thanh Toán", icon: Wallet },
            ].map((t) => {
              const Icon = t.icon;
              const isActive = tab === t.id;
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setTab(t.id as any)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${isActive
                      ? "bg-teal-700 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                    }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-teal-200" : "text-teal-600 dark:text-teal-400"}`} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Toggle chế độ xem: Dạng bảng vs Dạng thẻ (khi ở Tab Chi tiết) */}
          {tab === "chi-tiet" && (
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 pl-2 pr-1">Chế độ xem:</span>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${viewMode === "table"
                    ? "bg-teal-700 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                title="Xem dạng bảng kế toán chi tiết"
              >
                <List className="w-3.5 h-3.5" />
                <span>Dạng Bảng</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("card")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${viewMode === "card"
                    ? "bg-teal-700 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                title="Xem dạng thẻ hồ sơ nhân sự trực quan"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Dạng Thẻ</span>
              </button>
            </div>
          )}
        </div>

        {/* ================= THANH TÌM KIẾM & BỘ LỌC CHUYÊN NGHIỆP NHƯ CÁC KHÂU ================= */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-3 flex-wrap justify-between">
            {/* Ô tìm kiếm đa năng */}
            <div className="relative flex-1 min-w-[260px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm theo tên nhân viên, mã NV (NV01, NV07...), bộ phận..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-9 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown Lọc Tình Trạng Tạm Ứng */}
            <select
              value={filterTamUng}
              onChange={(e) => setFilterTamUng(e.target.value as any)}
              aria-label="Lọc theo tình trạng tạm ứng"
              className="px-3.5 py-2.5 rounded-2xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/25 cursor-pointer"
            >
              <option value="all">Tất cả tình trạng tài chính</option>
              <option value="co_tam_ung">Có tạm ứng ({counts.coTamUng} NV)</option>
              <option value="khong_tam_ung">Không tạm ứng ({counts.all - counts.coTamUng} NV)</option>
            </select>

            {/* Dropdown Lọc Mức Thu Nhập */}
            <select
              value={filterMucLuong}
              onChange={(e) => setFilterMucLuong(e.target.value as any)}
              aria-label="Lọc theo mức thu nhập"
              className="px-3.5 py-2.5 rounded-2xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/25 cursor-pointer"
            >
              <option value="all">Tất cả mức thu nhập</option>
              <option value="duoi_4tr">Dưới 4 triệu VNĐ</option>
              <option value="4tr_8tr">4 triệu - 8 triệu VNĐ</option>
              <option value="tren_8tr">Trên 8 triệu VNĐ</option>
            </select>

            {/* Nút đặt lại bộ lọc */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Đặt lại</span>
              </button>
            )}
          </div>

          {/* Dải nút lọc phân loại bộ phận */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
            <span className="text-[11px] font-bold uppercase text-slate-400 shrink-0 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Bộ phận:
            </span>
            {[
              { id: "all", label: "Tất Cả", count: counts.all },
              { id: "QuanLy", label: "Quản Lý & VP", count: counts.ql },
              { id: "KhoVan", label: "Kho Vận", count: counts.kv },
              { id: "SanXuat", label: "Sản Xuất May", count: counts.sx },
              { id: "LuongSP", label: "Lương Sản Phẩm", count: counts.sp },
              { id: "LuongCung", label: "Lương Thời Gian", count: counts.cung },
            ].map((p) => {
              const active = filterBoPhan === p.id;
              return (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setFilterBoPhan(p.id as any)}
                  className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${active
                      ? "bg-teal-700 text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                >
                  <span>{p.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${active ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                      }`}
                  >
                    {p.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Dòng tóm tắt kết quả sau khi lọc */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-white/5">
            <div>
              Đang hiển thị <b className="text-teal-700 dark:text-teal-400 font-bold">{filteredBangLuong.length}</b> / {bangLuong.length} nhân sự
              {hasActiveFilters && <span className="text-slate-400 ml-1">(đang áp dụng bộ lọc)</span>}
            </div>
            <div>
              Tổng thực lĩnh danh sách này: <b className="text-emerald-700 dark:text-emerald-400 font-black">{fmtVNDFull(filteredTotalThucNhan)}</b>
            </div>
          </div>
        </div>

        {/* ================= TAB 1: TỔNG HỢP & PHÂN BỔ ================= */}
        {tab === "tong-hop" && (
          <div className="space-y-4">
            {/* Phân bổ theo bộ phận */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 p-5 md:p-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-teal-600" />
                    <span>Cơ Cấu Phân Bổ Ngân Sách Lương Xưởng (Tháng {thang}/{nam})</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tỷ trọng chi phí lương thực tế đã khấu trừ các khoản tạm ứng của từng phòng ban
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  Tổng quỹ lương: {fmtVND(tongKet.tongThucNhan)}
                </span>
              </div>

              {/* Progress bar trực quan */}
              <div className="space-y-2">
                <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex shadow-inner">
                  {tongKet.theoBoPhan.map((bp) => {
                    const pct = tongKet.tongThucNhan > 0 ? (bp.thucNhan / tongKet.tongThucNhan) * 100 : 0;
                    if (pct <= 0) return null;
                    return (
                      <div
                        key={bp.boPhan}
                        style={{ width: `${pct}%`, backgroundColor: bp.mau }}
                        className="h-full transition-all duration-500"
                        title={`${bp.ten}: ${fmtVND(bp.thucNhan)} (${pct.toFixed(1)}%)`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Grid 4 Thẻ Phân Bổ Bộ Phận */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                {tongKet.theoBoPhan.map((bp) => {
                  const pct = tongKet.tongThucNhan > 0 ? ((bp.thucNhan / tongKet.tongThucNhan) * 100).toFixed(1) : "0.0";
                  return (
                    <div
                      key={bp.boPhan}
                      className="p-4 rounded-2xl border-l-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5 transition hover:shadow-xs"
                      style={{ borderLeftColor: bp.mau }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{bp.ten}</span>
                        <span className="text-[11px] font-extrabold px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {pct}%
                        </span>
                      </div>
                      <div className="text-lg font-black mt-1" style={{ color: bp.mau }}>
                        {fmtVND(bp.thucNhan)}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 font-medium">
                        {bp.tongNV} nhân sự
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bảng Danh Sách Phiếu Tạm Ứng Trong Tháng */}
            {allMonthTamUng.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 p-5 md:p-6 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold">
                      <HandCoins className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm md:text-base font-bold text-slate-900 dark:text-white">
                        Danh Sách Phiếu Tạm Ứng Trong Tháng {thang}/{nam} ({allMonthTamUng.length} phiếu)
                      </h2>
                      <p className="text-xs text-slate-500">
                        Dữ liệu tự động liên kết trực tiếp từ Sổ Thu Chi Nội Bộ và khấu trừ vào Bảng Lương
                      </p>
                    </div>
                  </div>
                  <a
                    href="/thu-chi"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 transition"
                  >
                    <span>Mở Sổ Thu Chi</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-white/10">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-3 px-3.5">Mã Phiếu</th>
                        <th className="py-3 px-3.5">Thời Gian Chi Tiết (Ngày Giờ)</th>
                        <th className="py-3 px-3.5">Nhân Sự Nhận Ứng</th>
                        <th className="py-3 px-3.5 text-right">Số Tiền Ứng</th>
                        <th className="py-3 px-3.5">Phương Thức</th>
                        <th className="py-3 px-3.5">Lý Do / Nội Dung</th>
                        <th className="py-3 px-3.5">Người Chi Thực Tế</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {allMonthTamUng.map((tc) => (
                        <tr key={tc.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                          <td className="py-2.5 px-3.5 font-mono font-bold text-teal-700 dark:text-teal-400">
                            {tc.id}
                          </td>
                          <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-600 dark:text-slate-400 font-mono">
                            {formatDateTimeFull(tc.ngayTao, tc.ngay)}
                          </td>
                          <td className="py-2.5 px-3.5 font-bold text-slate-800 dark:text-slate-200">
                            {renderNhanSuTamUng(tc)}
                          </td>
                          <td className="py-2.5 px-3.5 text-right font-black text-rose-600 dark:text-rose-400 whitespace-nowrap">
                            -{fmtVNDFull(tc.soTien)}
                          </td>
                          <td className="py-2.5 px-3.5 whitespace-nowrap">
                            {tc.hinhThuc === "tien_mat" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Banknote className="w-3 h-3" /> Tiền mặt
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                <CreditCard className="w-3 h-3" /> Chuyển khoản
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                            {tc.noiDung}
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-400 font-semibold">
                            {tc.nguoiThucHien}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: CHI TIẾT NHÂN SỰ ================= */}
        {tab === "chi-tiet" && (
          <div className="space-y-4">
            {/* Chế độ 1: Dạng Bảng Kế Toán (Table View) */}
            {viewMode === "table" ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 overflow-hidden">
                <div className="p-4 md:p-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h2 className="font-bold text-sm sm:text-base flex items-center gap-2 text-slate-900 dark:text-white">
                      <Users className="w-4 h-4 text-teal-600" />
                      <span>Bảng Lương Chi Tiết Từng Nhân Sự</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Bấm vào số tiền tại cột <b className="text-rose-600 font-bold">"Tạm Ứng"</b> để xem ngày giờ chi tiết · Bấm nút <b className="text-indigo-600 font-bold">"Phiếu Lương"</b> để xem và in phiếu cá nhân
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-500">
                    Hiển thị {filteredBangLuong.length}/{bangLuong.length} NV
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1100px] text-xs md:text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-3.5 py-3 text-left">Mã NV</th>
                        <th className="px-3.5 py-3 text-left">Tên Nhân Viên</th>
                        <th className="px-3.5 py-3 text-left whitespace-nowrap min-w-[95px]">Bộ phận</th>
                        <th className="px-3.5 py-3 text-center">Ngày công/{CHUAN_NGAY_CONG_THANG}</th>
                        <th className="px-3.5 py-3 text-right">Lương CB / Đơn giá</th>
                        <th className="px-3.5 py-3 text-right">SL Đạt</th>
                        <th className="px-3.5 py-3 text-right">SL Lỗi</th>
                        <th className="px-3.5 py-3 text-right">Tiền Công</th>
                        <th className="px-3.5 py-3 text-right">Phạt</th>
                        <th className="px-3.5 py-3 text-right">Thưởng</th>
                        <th className="px-3.5 py-3 text-right bg-amber-50/70 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-x border-amber-200/50">
                          Tăng Ca
                        </th>
                        {/* CỘT TẠM ỨNG THU CHI */}
                        <th className="px-3.5 py-3 text-right bg-rose-50/60 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 border-x border-rose-200/50">
                          Tạm Ứng (Thu Chi)
                        </th>
                        <th className="px-3.5 py-3 text-right text-emerald-700 dark:text-emerald-400 font-black">Thực Nhận</th>
                        <th className="px-3.5 py-3 text-center">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {filteredBangLuong.map((b) => (
                        <tr key={b.maNV} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                          <td className="px-3.5 py-3 font-mono text-xs font-bold text-slate-600 dark:text-slate-400">
                            {b.maNV}
                          </td>
                          <td className="px-3.5 py-3 font-bold text-slate-900 dark:text-white">
                            {b.tenNV}
                          </td>
                          <td className="px-3.5 py-3 whitespace-nowrap min-w-[95px]">
                            <span
                              className={`text-xs px-2.5 py-1 rounded-full font-semibold whitespace-nowrap inline-block ${b.isLuongSP
                                  ? "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800"
                                  : "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                                }`}
                            >
                              {b.boPhan}
                            </span>
                          </td>
                          <td className="px-3.5 py-3 text-center">
                            <div className="font-bold text-teal-700 dark:text-teal-400">
                              {b.ngayCongThucTe}/{b.ngayCongChuan}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {b.coDuLieuChamCong ? `${b.tyLeNgayCong}%` : "Chưa có CC"}
                              {b.ngayPhep > 0 ? ` · Phép: ${b.ngayPhep}` : ""}
                            </div>
                          </td>
                          <td className="px-3.5 py-3 text-right font-medium">
                            {b.isLuongSP
                              ? `${b.donGia.toLocaleString("vi-VN")} đ`
                              : `${(b.luongCung / 1_000_000).toFixed(1)} tr`}
                          </td>
                          <td className="px-3.5 py-3 text-right font-medium">{b.soLuongDat || "-"}</td>
                          <td className="px-3.5 py-3 text-right text-rose-600 font-semibold">{b.soLuongLoi || "-"}</td>
                          <td className="px-3.5 py-3 text-right font-bold text-slate-800 dark:text-slate-200">
                            {fmtVND(b.tienCong)}
                          </td>
                          <td className="px-3.5 py-3 text-right text-rose-600 font-medium">
                            {b.phatLoi + b.phatTreHan > 0 ? `-${fmtVND(b.phatLoi + b.phatTreHan)}` : "-"}
                          </td>
                          <td className="px-3.5 py-3 text-right text-emerald-600 font-medium">
                            {b.thuongVuot > 0 ? `+${fmtVND(b.thuongVuot)}` : "-"}
                          </td>

                          {/* Cột Tăng Ca: hiển thị số tiền cộng thêm & số giờ */}
                          <td className="px-3.5 py-3 text-right bg-amber-50/40 dark:bg-amber-950/20 border-x border-amber-100 dark:border-amber-900/40">
                            {b.gioTangCa > 0 ? (
                              <div className="flex flex-col items-end leading-tight">
                                <span className="font-bold text-amber-700 dark:text-amber-400">
                                  +{fmtVND(b.tienTangCa)}
                                </span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                  {b.gioTangCa}h ({fmtVND(b.donGiaGioTangCa)}/h)
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>

                          {/* Cột Tạm Ứng Click để xem chi tiết */}
                          <td className="px-3.5 py-3 text-right bg-rose-50/40 dark:bg-rose-950/20 border-x border-rose-100 dark:border-rose-900/40">
                            {b.tamUng > 0 ? (
                              <button
                                type="button"
                                onClick={() => setSelectedTamUngNV(b)}
                                className="group inline-flex flex-col items-end hover:opacity-80 transition cursor-pointer"
                                title="Bấm để xem chi tiết ngày giờ & phương thức tạm ứng"
                              >
                                <span className="font-black text-rose-600 dark:text-rose-400 underline decoration-rose-300 underline-offset-2">
                                  -{fmtVND(b.tamUng)}
                                </span>
                                <span className="text-[10px] text-teal-700 dark:text-teal-400 font-semibold flex items-center gap-0.5">
                                  <Eye className="w-3 h-3" />
                                  <span>({b.danhSachTamUng.length} lần)</span>
                                </span>
                              </button>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>

                          <td className="px-3.5 py-3 text-right font-black text-emerald-700 dark:text-emerald-400 text-sm">
                            {fmtVNDFull(b.thucNhan)}
                          </td>

                          <td className="px-3.5 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => setSelectedSlipNV(b)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800 transition shadow-2xs cursor-pointer"
                              title="Xem & in phiếu lương chi tiết"
                            >
                              <FileText className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Phiếu Lương</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-100 dark:bg-slate-800 font-bold text-xs md:text-sm">
                      <tr>
                        <td colSpan={10} className="px-3.5 py-3.5 text-right uppercase">
                          Tổng Cộng Lọc ({filteredBangLuong.length} NV):
                        </td>
                        <td className="px-3.5 py-3.5 text-right text-amber-700 font-black bg-amber-100/50 dark:bg-amber-900/50">
                          +{fmtVNDFull(filteredBangLuong.reduce((s, b) => s + b.tienTangCa, 0))}
                        </td>
                        <td className="px-3.5 py-3.5 text-right text-rose-600 font-black bg-rose-100/50 dark:bg-rose-900/50">
                          -{fmtVNDFull(filteredBangLuong.reduce((s, b) => s + b.tamUng, 0))}
                        </td>
                        <td className="px-3.5 py-3.5 text-right text-emerald-700 dark:text-emerald-400 font-black">
                          {fmtVNDFull(filteredTotalThucNhan)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ) : (
              /* Chế độ 2: Dạng Thẻ Hồ Sơ Trực Quan (Card View) */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredBangLuong.map((b) => (
                  <div
                    key={b.maNV}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-4.5 shadow-xs border border-slate-200/80 dark:border-slate-800 hover:shadow-sm transition flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Header thẻ */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                            {b.tenNV.split(" ").slice(-1)[0]?.charAt(0) || "U"}
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                              {b.tenNV}
                            </h3>
                            <span className="font-mono text-xs font-semibold text-teal-700 dark:text-teal-400">
                              {b.maNV}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${b.isLuongSP
                              ? "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border border-sky-200"
                              : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200"
                            }`}
                        >
                          {b.boPhan}
                        </span>
                      </div>

                      {/* Ngày công & Tiến độ */}
                      <div className="mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1.5 border border-slate-100 dark:border-white/5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">Chấm công tháng:</span>
                          <b className="text-teal-700 dark:text-teal-400">
                            {b.ngayCongThucTe}/{b.ngayCongChuan} công ({b.tyLeNgayCong}%)
                          </b>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div
                            className="h-full bg-teal-600 rounded-full"
                            style={{ width: `${Math.min(100, b.tyLeNgayCong)}%` }}
                          />
                        </div>
                      </div>

                      {/* Chi tiết tài chính */}
                      <div className="mt-3 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                          <span>Tiền công gốc:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{fmtVNDFull(b.tienCong)}</span>
                        </div>
                        {b.gioTangCa > 0 && (
                          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 font-semibold">
                            <span>Lương tăng ca ({b.gioTangCa}h):</span>
                            <span>+{fmtVNDFull(b.tienTangCa)}</span>
                          </div>
                        )}
                        {b.tamUng > 0 && (
                          <div className="flex items-center justify-between text-rose-600 font-semibold">
                            <span>Khấu trừ tạm ứng:</span>
                            <span>-{fmtVNDFull(b.tamUng)}</span>
                          </div>
                        )}
                        {b.thuongVuot > 0 && (
                          <div className="flex items-center justify-between text-emerald-600 font-semibold">
                            <span>Thưởng vượt:</span>
                            <span>+{fmtVNDFull(b.thuongVuot)}</span>
                          </div>
                        )}
                        {b.phatLoi + b.phatTreHan > 0 && (
                          <div className="flex items-center justify-between text-rose-600 font-medium">
                            <span>Phạt:</span>
                            <span>-{fmtVNDFull(b.phatLoi + b.phatTreHan)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer thẻ: Thực nhận & Nút thao tác */}
                    <div className="pt-3 border-t border-slate-100 dark:border-white/5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-medium">Thực nhận cuối kỳ:</span>
                        <span className="text-base font-black text-emerald-700 dark:text-emerald-400">
                          {fmtVNDFull(b.thucNhan)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedSlipNV(b)}
                          className="flex-1 py-2 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Phiếu Lương</span>
                        </button>
                        {b.tamUng > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedTamUngNV(b)}
                            className="p-2 rounded-xl text-xs font-bold bg-teal-50 hover:bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800 transition cursor-pointer"
                            title="Xem chi tiết lịch sử tạm ứng"
                          >
                            <HandCoins className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: KẾ HOẠCH THANH TOÁN ================= */}
        {tab === "thanh-toan" && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 p-5 md:p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
              <div>
                <h2 className="font-bold text-base flex items-center gap-2 text-slate-900 dark:text-white">
                  <Wallet className="w-4 h-4 text-teal-600" />
                  <span>Kế Hoạch Chi Trả & Giải Ngân Lương (Tháng {thang}/{nam})</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ngày chi trả dự kiến: <b className="text-slate-800 dark:text-white">{ngayChiTra}</b> · Đã tự động khấu trừ toàn bộ tạm ứng vào thực nhận
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Tổng chi: {fmtVNDFull(filteredTotalThucNhan)}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {filteredBangLuong.map((b) => (
                <div
                  key={b.maNV}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-white/5 gap-3 hover:shadow-xs transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded-md border border-teal-200 dark:border-teal-800">
                        {b.maNV}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{b.tenNV}</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
                        {b.boPhan}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center flex-wrap gap-2">
                      <span>Công: <b>{b.ngayCongThucTe}/{b.ngayCongChuan}</b></span>
                      <span>·</span>
                      <span>Tiền công: <b>{fmtVND(b.tienCong)}</b></span>
                      {b.tamUng > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-rose-600 font-bold">
                            Tạm ứng đã trừ: -{fmtVND(b.tamUng)} ({b.danhSachTamUng.length} lần)
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 flex-wrap">
                    <div className="text-left sm:text-right">
                      <div className="font-black text-emerald-700 dark:text-emerald-400 text-base md:text-lg">
                        {fmtVNDFull(b.thucNhan)}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium">Hạn CK: {b.ngayTra || ngayChiTra}</div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => copyAmount(b.thucNhan, b.maNV)}
                        className="px-2.5 py-1.5 bg-white dark:bg-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-600 transition flex items-center gap-1 cursor-pointer"
                        title="Sao chép số tiền cần chuyển khoản"
                      >
                        {copiedId === b.maNV ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                        <span>Số tiền</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => copyTransferMemo(b)}
                        className="px-2.5 py-1.5 bg-white dark:bg-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-600 transition flex items-center gap-1 cursor-pointer"
                        title="Sao chép nội dung chuyển khoản"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>Nội dung CK</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedSlipNV(b)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 text-xs font-semibold rounded-xl border border-indigo-200 transition cursor-pointer"
                      >
                        Phiếu lương
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="text-center text-xs text-slate-400 pt-3 pb-6 leading-relaxed">
          Hệ thống MIMIN ERP tính lương tự động chuẩn quy trình 10 bước nhà máy may · Công thức: Thực nhận = Tiền công + Thưởng - Phạt - Tạm ứng (Sổ Thu Chi)
        </div>
      </div>

      {/* ================= MODAL: CHI TIẾT TẠM ỨNG CỦA 1 NHÂN VIÊN ================= */}
      {selectedTamUngNV && mounted && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 md:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header modal */}
            <div className="p-4 md:p-5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/40 dark:to-cyan-950/40">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md">
                  <HandCoins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Chi Tiết Tạm Ứng Trong Tháng {thang}/{nam}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    Nhân sự: <b className="text-teal-700 dark:text-teal-300">{selectedTamUngNV.tenNV}</b> ({selectedTamUngNV.maNV} - {selectedTamUngNV.boPhan})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTamUngNV(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nội dung modal */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Thống kê tổng tiền tạm ứng */}
              <div className="flex items-center justify-between p-4 bg-teal-50 dark:bg-teal-950/40 rounded-2xl border border-teal-200 dark:border-teal-800">
                <div>
                  <div className="text-xs font-semibold text-teal-800 dark:text-teal-300">
                    Tổng tiền tạm ứng đã chi trong tháng:
                  </div>
                  <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
                    {fmtVNDFull(selectedTamUngNV.tamUng)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 rounded-xl text-xs font-bold bg-teal-600 text-white shadow-xs">
                    {selectedTamUngNV.danhSachTamUng.length} lần tạm ứng
                  </span>
                  <div className="text-[11px] text-teal-700 dark:text-teal-300 mt-1 font-semibold">
                    Đã khấu trừ vào Thực nhận
                  </div>
                </div>
              </div>

              {/* Danh sách từng lần tạm ứng */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                  Lịch sử từng lần tạm ứng chi tiết:
                </h4>
                {selectedTamUngNV.danhSachTamUng.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl">
                    Chưa có khoản tạm ứng nào trong tháng này.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {selectedTamUngNV.danhSachTamUng.map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 shadow-xs space-y-2"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400">
                              {item.id}
                            </span>
                            <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {formatDateTimeFull(item.ngayTao, item.ngay)}
                            </span>
                          </div>
                          <div className="text-sm font-black text-rose-600 dark:text-rose-400">
                            -{fmtVNDFull(item.soTien)}
                          </div>
                        </div>

                        <div className="text-xs text-slate-800 dark:text-slate-200 font-medium pl-7">
                          {item.noiDung}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pl-7 pt-1.5 border-t border-slate-100 dark:border-white/5">
                          <div className="flex items-center gap-2">
                            <span>Phương thức:</span>
                            {item.hinhThuc === "tien_mat" ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                <Banknote className="w-3 h-3" /> Tiền mặt
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                <CreditCard className="w-3 h-3" /> Chuyển khoản
                              </span>
                            )}
                          </div>
                          <div>
                            Người chi: <b className="text-slate-700 dark:text-slate-300">{item.nguoiThucHien}</b>
                            {item.nguoiNhap && <span> · Nhập: {item.nguoiNhap}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer modal */}
            <div className="p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <a
                href="/thu-chi"
                className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1"
              >
                <span>Xem Sổ Thu Chi Nội Bộ</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => setSelectedTamUngNV(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-white transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ================= MODAL: DANH SÁCH TOÀN BỘ TẠM ỨNG TRONG THÁNG ================= */}
      {showAllTamUngModal && mounted && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 md:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-4xl w-full border border-slate-200 dark:border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 md:p-5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-teal-50 dark:bg-teal-950/40">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md">
                  <HandCoins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Toàn Bộ Khoản Tạm Ứng Trong Tháng {thang}/{nam}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Tổng cộng {allMonthTamUng.length} giao dịch · Tổng tiền:{" "}
                    <b className="text-rose-600 dark:text-rose-400">{fmtVNDFull(tongKet.tongTamUng)}</b>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAllTamUngModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 max-h-[70vh] overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Mã Phiếu</th>
                    <th className="py-2.5 px-3">Ngày Giờ Chi Tiết</th>
                    <th className="py-2.5 px-3">Người Nhận (Nhân Sự)</th>
                    <th className="py-2.5 px-3 text-right">Số Tiền</th>
                    <th className="py-2.5 px-3">Hình Thức</th>
                    <th className="py-2.5 px-3">Nội Dung</th>
                    <th className="py-2.5 px-3">Người Chi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {allMonthTamUng.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono font-bold text-teal-700 dark:text-teal-400">
                        {item.id}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono text-slate-500">
                        {formatDateTimeFull(item.ngayTao, item.ngay)}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                        {renderNhanSuTamUng(item)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-rose-600 dark:text-rose-400">
                        -{fmtVNDFull(item.soTien)}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {item.hinhThuc === "tien_mat" ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <Banknote className="w-3 h-3" /> Tiền mặt
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            <CreditCard className="w-3 h-3" /> Chuyển khoản
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 max-w-xs truncate text-slate-700 dark:text-slate-300">
                        {item.noiDung}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-medium">
                        {item.nguoiThucHien}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAllTamUngModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white hover:bg-slate-300 transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ================= MODAL: PHIẾU LƯƠNG NHÂN VIÊN (A4 PORTRAIT) ================= */}
      {selectedSlipNV && mounted && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/75 backdrop-blur-sm overflow-y-auto print:static print:p-0 print:bg-white print:block">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-3xl w-full my-auto border border-slate-200 dark:border-white/10 overflow-hidden print:border-none print:shadow-none print:rounded-none print:max-w-none print:w-full">
            {/* Thanh công cụ Modal (ẩn khi in) */}
            <div className="p-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-slate-800 print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                <span className="font-bold text-sm text-slate-800 dark:text-white">
                  Phiếu Lương Nhân Viên · {selectedSlipNV.tenNV} ({selectedSlipNV.maNV})
                </span>
                <span className="text-[11px] font-semibold text-slate-400 bg-slate-200/60 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                  Chuẩn A4 dọc
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof document !== "undefined") {
                      document.body.classList.remove("printing-landscape");
                    }
                    window.print();
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 transition shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>In Phiếu Lương (A4)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSlipNV(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Nội dung Phiếu Lương chuẩn in A4 */}
            <div
              id="mimin-payslip-print"
              className="p-5 md:p-7 space-y-3.5 max-h-[82vh] overflow-y-auto print:max-h-none print:p-0 print:overflow-visible print:space-y-3 text-slate-900 bg-white"
            >
              {/* Header phiếu lương */}
              <div className="flex items-start justify-between border-b-2 pb-3 border-teal-700">
                <div className="space-y-0.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    CÔNG TY TNHH DỆT MAY GIÀU SANG
                  </div>
                  <div className="text-base md:text-lg font-black text-teal-800 tracking-tight">
                    THƯƠNG HIỆU THỜI TRANG POLOMIMIN
                  </div>
                  <div className="text-[10px] text-slate-500 leading-tight">
                    Địa chỉ: 13/4e Xuân Thới Sơn 19, Ấp 3, Xuân Thới Sơn, Hóc Môn, Hồ Chí Minh · Hotline: 0774480916
                  </div>
                </div>

                <div className="text-right space-y-0.5 shrink-0">
                  <div className="text-base md:text-lg font-black text-slate-900 uppercase tracking-tight">
                    PHIẾU LƯƠNG NHÂN VIÊN
                  </div>
                  <div className="text-xs font-black text-teal-700">
                    KỲ LƯƠNG THÁNG {String(thang).padStart(2, "0")}/{nam}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Mã phiếu: PL-{selectedSlipNV.maNV}-{nam}{String(thang).padStart(2, "0")} · Ngày lập: {viewTime ? viewTime.split("·")[1]?.trim() || "23/11/2026" : "23/11/2026"}
                  </div>
                </div>
              </div>

              {/* Thông tin nhân viên & Chấm công tháng */}
              {(() => {
                const soNgayNghi = Math.max(0, (selectedSlipNV.ngayCongChuan || 28) - (selectedSlipNV.ngayCongThucTe || 0));
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-500 text-[10px] block uppercase font-medium">Họ và tên:</span>
                      <div className="font-black text-slate-900 text-sm mt-0.5 truncate">{selectedSlipNV.tenNV}</div>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block uppercase font-medium">Mã nhân viên:</span>
                      <div className="font-mono font-bold text-teal-800 text-xs mt-0.5">
                        {selectedSlipNV.maNV}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block uppercase font-medium">Bộ phận:</span>
                      <div className="font-bold text-slate-800 text-xs mt-0.5 whitespace-nowrap">
                        {selectedSlipNV.boPhan}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block uppercase font-medium">Hình thức lương:</span>
                      <div className="font-semibold text-indigo-700 text-xs mt-0.5 truncate">
                        {selectedSlipNV.isLuongSP ? "Lương sản phẩm" : "Lương thời gian"}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block uppercase font-medium">Ngày công đi làm:</span>
                      <div className="font-bold text-teal-700 text-xs mt-0.5">
                        {selectedSlipNV.ngayCongThucTe}/{selectedSlipNV.ngayCongChuan} công ({selectedSlipNV.tyLeNgayCong}%)
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block uppercase font-medium">Số ngày đã nghỉ:</span>
                      <div className="font-bold text-xs mt-0.5">
                        {soNgayNghi > 0 ? (
                          <span className="text-rose-600 font-bold">
                            {soNgayNghi} ngày {selectedSlipNV.ngayPhep > 0 ? `(${selectedSlipNV.ngayPhep} ngày phép)` : "(Không phép)"}
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-bold">0 ngày (Đi làm đủ)</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block uppercase font-medium">Giờ tăng ca:</span>
                      <div className="font-bold text-xs mt-0.5">
                        {selectedSlipNV.gioTangCa > 0 ? (
                          <span className="text-amber-700 font-bold">
                            {selectedSlipNV.gioTangCa}h (+{fmtVND(selectedSlipNV.tienTangCa)})
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">0 giờ</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Bảng kê chi tiết thu nhập & các khoản khấu trừ */}
              <div className="space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center justify-between pb-0.5">
                  <span>I. CHI TIẾT THU NHẬP & CÁC KHOẢN KHẤU TRỪ</span>
                  <span className="text-[10px] font-normal text-slate-500 lowercase">
                    (Đơn vị tính: VNĐ)
                  </span>
                </div>
                <table className="w-full text-xs border border-slate-300 rounded-lg overflow-hidden border-collapse">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-[11px]">
                    <tr>
                      <th className="py-1.5 px-3 text-left border-r border-slate-300">Hạng Mục</th>
                      <th className="py-1.5 px-3 text-center border-r border-slate-300 w-48">Chỉ Số Thực Tế</th>
                      <th className="py-1.5 px-3 text-right border-r border-slate-300 w-36">Đơn Giá / Mức Chuẩn</th>
                      <th className="py-1.5 px-3 text-right w-36">Thành Tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {/* NHÓM A: THU NHẬP */}
                    <tr className="bg-slate-50/70 font-bold text-[11px] text-teal-900">
                      <td colSpan={4} className="py-1 px-3 uppercase tracking-wider">
                        A. CÁC KHOẢN THU NHẬP TRONG KỲ
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-medium text-slate-900 border-r border-slate-200">
                        1. Tiền lương thời gian / Tiền công sản phẩm
                      </td>
                      <td className="py-2 px-3 text-center border-r border-slate-200">
                        {selectedSlipNV.isLuongSP
                          ? `${selectedSlipNV.soLuongDat} sp đạt`
                          : `${selectedSlipNV.ngayCongThucTe}/${selectedSlipNV.ngayCongChuan} công (Đã nghỉ: ${Math.max(0, (selectedSlipNV.ngayCongChuan || 28) - (selectedSlipNV.ngayCongThucTe || 0))} ngày)`}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-600 border-r border-slate-200">
                        {selectedSlipNV.isLuongSP
                          ? `${selectedSlipNV.donGia.toLocaleString("vi-VN")} đ/sp`
                          : `${selectedSlipNV.luongCung.toLocaleString("vi-VN")} đ/tháng`}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">
                        {fmtVNDFull(selectedSlipNV.tienCong)}
                      </td>
                    </tr>

                    <tr>
                      <td className="py-2 px-3 font-medium text-slate-900 border-r border-slate-200">
                        2. Tiền lương tăng ca (Ngoài giờ làm việc)
                      </td>
                      <td className="py-2 px-3 text-center border-r border-slate-200">
                        {selectedSlipNV.gioTangCa > 0 ? (
                          <span className="font-bold text-amber-700">{selectedSlipNV.gioTangCa} giờ</span>
                        ) : (
                          <span className="text-slate-400">0 giờ</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-600 border-r border-slate-200">
                        {selectedSlipNV.donGiaGioTangCa > 0
                          ? `${selectedSlipNV.donGiaGioTangCa.toLocaleString("vi-VN")} đ/h (28 ngày × 8.5h)`
                          : "-"}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-amber-800">
                        {selectedSlipNV.tienTangCa > 0
                          ? `+${fmtVNDFull(selectedSlipNV.tienTangCa)}`
                          : "0 đ"}
                      </td>
                    </tr>

                    {selectedSlipNV.thuongVuot > 0 && (
                      <tr>
                        <td className="py-2 px-3 text-slate-700 border-r border-slate-200">
                          3. Thưởng vượt tiến độ / năng suất sản xuất
                        </td>
                        <td className="py-2 px-3 text-center border-r border-slate-200 text-slate-500">
                          {selectedSlipNV.soLuongVuot} sp vượt
                        </td>
                        <td className="py-2 px-3 text-right text-slate-500 border-r border-slate-200">
                          +20% đơn giá
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-700">
                          +{fmtVNDFull(selectedSlipNV.thuongVuot)}
                        </td>
                      </tr>
                    )}

                    <tr className="bg-emerald-50/40 font-bold text-slate-900 border-t border-slate-300">
                      <td colSpan={3} className="py-1.5 px-3 text-right uppercase text-[11px] border-r border-slate-300">
                        Cộng Tổng Thu Nhập (A):
                      </td>
                      <td className="py-1.5 px-3 text-right font-black text-emerald-800">
                        {fmtVNDFull(selectedSlipNV.tienCong + (selectedSlipNV.tienTangCa || 0) + selectedSlipNV.thuongVuot)}
                      </td>
                    </tr>

                    {/* NHÓM B: CÁC KHOẢN KHẤU TRỪ */}
                    <tr className="bg-slate-50/70 font-bold text-[11px] text-rose-900 border-t border-slate-300">
                      <td colSpan={4} className="py-1 px-3 uppercase tracking-wider">
                        B. CÁC KHOẢN KHẤU TRỪ VÀO LƯƠNG
                      </td>
                    </tr>

                    <tr className="bg-amber-50/30">
                      <td className="py-2 px-3 font-semibold text-rose-900 border-r border-slate-200">
                        1. Khấu trừ Tạm Ứng Đã Chi (Thu Chi Nội Bộ)
                      </td>
                      <td className="py-2 px-3 text-center text-slate-700 border-r border-slate-200">
                        {selectedSlipNV.danhSachTamUng.length} lần ứng
                      </td>
                      <td className="py-2 px-3 text-right text-slate-500 border-r border-slate-200">
                        Theo phiếu chi thực tế
                      </td>
                      <td className="py-2 px-3 text-right font-black text-rose-600">
                        {selectedSlipNV.tamUng > 0 ? `-${fmtVNDFull(selectedSlipNV.tamUng)}` : "0 đ"}
                      </td>
                    </tr>

                    {selectedSlipNV.phatLoi + selectedSlipNV.phatTreHan > 0 && (
                      <tr>
                        <td className="py-2 px-3 text-slate-700 border-r border-slate-200">
                          2. Khấu trừ phạt lỗi sản phẩm / Phạt vi phạm
                        </td>
                        <td className="py-2 px-3 text-center border-r border-slate-200 text-slate-500">
                          {selectedSlipNV.soLuongLoi > 0 ? `${selectedSlipNV.soLuongLoi} sp lỗi` : "Kỷ luật"}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-500 border-r border-slate-200">
                          Quy chế xưởng
                        </td>
                        <td className="py-2 px-3 text-right font-medium text-rose-600">
                          -{fmtVNDFull(selectedSlipNV.phatLoi + selectedSlipNV.phatTreHan)}
                        </td>
                      </tr>
                    )}

                    <tr className="bg-rose-50/40 font-bold text-slate-900 border-t border-slate-300">
                      <td colSpan={3} className="py-1.5 px-3 text-right uppercase text-[11px] border-r border-slate-300">
                        Cộng Các Khoản Khấu TrỪ (B):
                      </td>
                      <td className="py-1.5 px-3 text-right font-black text-rose-600">
                        {selectedSlipNV.tamUng + selectedSlipNV.phatLoi + selectedSlipNV.phatTreHan > 0
                          ? `-${fmtVNDFull(selectedSlipNV.tamUng + selectedSlipNV.phatLoi + selectedSlipNV.phatTreHan)}`
                          : "0 đ"}
                      </td>
                    </tr>
                  </tbody>

                  <tfoot className="bg-teal-50/80 text-xs font-black border-t-2 border-teal-700">
                    <tr>
                      <td colSpan={3} className="py-2.5 px-3 text-right uppercase text-slate-900 border-r border-slate-300 text-[12px]">
                        LƯƠNG THỰC LĨNH CUỐI KỲ (A - B):
                      </td>
                      <td className="py-2.5 px-3 text-right text-teal-900 text-base font-black whitespace-nowrap">
                        {fmtVNDFull(selectedSlipNV.thucNhan)}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Số tiền bằng chữ */}
                <div className="text-[11px] italic font-medium text-slate-800 pt-0.5 flex flex-wrap items-center justify-between gap-1">
                  <div>
                    Số tiền thực lĩnh bằng chữ: <b className="font-bold text-slate-950">{docSoThanhChu(selectedSlipNV.thucNhan)}</b>.
                  </div>
                  <div className="text-[10px] text-slate-500 font-normal">
                    Ngày chi trả dự kiến: {ngayChiTra} (Chuyển khoản / Tiền mặt)
                  </div>
                </div>
              </div>

              {/* Chi tiết từng lần tạm ứng nếu có */}
              {selectedSlipNV.danhSachTamUng.length > 0 ? (
                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                    <span>Bảng kê chi tiết các khoản tạm ứng trong kỳ:</span>
                    <span className="text-rose-600 font-bold">Tổng ứng: -{fmtVNDFull(selectedSlipNV.tamUng)}</span>
                  </div>
                  <table className="w-full text-[10px] border border-slate-300 border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300">
                      <tr>
                        <th className="py-1 px-2 text-left border-r border-slate-300">Mã Phiếu</th>
                        <th className="py-1 px-2 border-r border-slate-300">Thời Gian</th>
                        <th className="py-1 px-2 text-right border-r border-slate-300">Số Tiền</th>
                        <th className="py-1 px-2 border-r border-slate-300">Hình Thức</th>
                        <th className="py-1 px-2 border-r border-slate-300">Nội Dung</th>
                        <th className="py-1 px-2">Người Chi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedSlipNV.danhSachTamUng.map((item) => (
                        <tr key={item.id}>
                          <td className="py-1 px-2 font-mono font-bold text-teal-800 border-r border-slate-200">{item.id}</td>
                          <td className="py-1 px-2 text-center text-slate-600 border-r border-slate-200">
                            {formatDateTimeFull(item.ngayTao, item.ngay)}
                          </td>
                          <td className="py-1 px-2 text-right font-black text-rose-600 border-r border-slate-200">
                            -{fmtVNDFull(item.soTien)}
                          </td>
                          <td className="py-1 px-2 text-center border-r border-slate-200">
                            {item.hinhThuc === "tien_mat" ? "Tiền mặt" : "Chuyển khoản"}
                          </td>
                          <td className="py-1 px-2 text-slate-800 max-w-xs truncate border-r border-slate-200">
                            {item.noiDung}
                          </td>
                          <td className="py-1 px-2 text-slate-700">{item.nguoiThucHien}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-1.5 px-3 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-[10px] text-slate-500 italic">
                  * Ghi chú: Trong kỳ này nhân sự không phát sinh khoản tạm ứng lương nào.
                </div>
              )}

              {/* Cam kết & Xác nhận nhân viên */}
              <div className="text-[10px] text-slate-500 italic pt-0.5 leading-tight">
                * Cam kết: Nhân sự đã đối chiếu chính xác ngày công làm việc, số ngày nghỉ và các lần tạm ứng đã nhận. Sau khi nhận đủ tiền lương, hai bên ký xác nhận hoàn tất nghĩa vụ chi trả lương kỳ này.
              </div>

              {/* BẢNG ĐỐI CHIẾU LỊCH SỬ LƯƠNG CÁC THÁNG TRƯỚC (CHỈ HIỆN TRÊN WEB, ẨN KHI IN ĐỂ VỪA 1 TRANG A4) */}
              <div className="space-y-2 pt-2 border-t border-slate-200 print:hidden">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>II. LỊCH SỬ THU NHẬP & TẠM ỨNG CÁC THÁNG TRƯỚC</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {historyMonths.length > 0 ? "Đối chiếu các kỳ đã ghi nhận" : "Bắt đầu ghi nhận từ T11/2026"}
                  </span>
                </div>

                {historyMonths.length > 0 ? (
                  <table className="w-full text-xs border border-slate-200 rounded-xl overflow-hidden">
                    <thead className="bg-indigo-50/70 text-indigo-900 font-bold text-[11px]">
                      <tr>
                        <th className="py-1.5 px-3 text-left">Kỳ Lương</th>
                        <th className="py-1.5 px-3 text-center">Ngày Công</th>
                        <th className="py-1.5 px-3 text-right">Tổng Tiền Công</th>
                        <th className="py-1.5 px-3 text-right text-rose-600">Tạm Ứng Đã Trừ</th>
                        <th className="py-1.5 px-3 text-right text-emerald-700">Thực Lĩnh</th>
                        <th className="py-1.5 px-3 text-center">Hành Động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {historyMonths.map((h) => (
                        <tr key={`${h.nam}-${h.thang}`} className="hover:bg-slate-50">
                          <td className="py-1.5 px-3 font-bold text-slate-800">
                            Tháng {String(h.thang).padStart(2, "0")}/{h.nam}
                          </td>
                          <td className="py-1.5 px-3 text-center text-teal-700">
                            {h.ngayCong}/{CHUAN_NGAY_CONG_THANG}
                          </td>
                          <td className="py-1.5 px-3 text-right">{fmtVND(h.tienCong)}</td>
                          <td className="py-1.5 px-3 text-right text-rose-600 font-bold">
                            {h.tamUng > 0 ? `-${fmtVND(h.tamUng)}` : "-"}
                          </td>
                          <td className="py-1.5 px-3 text-right font-black text-emerald-700">
                            {fmtVNDFull(h.thucNhan)}
                          </td>
                          <td className="py-1.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setThang(h.thang);
                                setNam(h.nam);
                              }}
                              className="text-[11px] font-semibold text-teal-600 hover:underline cursor-pointer"
                            >
                              Xem kỳ này ➔
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      Chưa có dữ liệu lịch sử các tháng trước. Hệ thống MIMIN ERP bắt đầu áp dụng và theo dõi dữ liệu chấm công - tạm ứng tự động từ <b>Tháng 11/2026</b>.
                    </span>
                  </div>
                )}
              </div>

              {/* 4 Chữ ký xác nhận */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs pt-3 pb-1 print:pt-4">
                <div>
                  <div className="font-bold text-slate-900 uppercase text-[11px]">Người Lập Biểu</div>
                  <div className="text-[10px] text-slate-500 italic">(Ký, họ tên)</div>
                  <div className="mt-10 font-semibold text-slate-800 text-[11px]">Bùi Thị Thanh</div>
                </div>
                <div>
                  <div className="font-bold text-slate-900 uppercase text-[11px]">Kế Toán Trưởng</div>
                  <div className="text-[10px] text-slate-500 italic">(Ký, họ tên)</div>
                  <div className="mt-10 font-semibold text-slate-800 text-[11px]">Phan Tuyết Lan</div>
                </div>
                <div>
                  <div className="font-bold text-slate-900 uppercase text-[11px]">Giám Đốc Duyệt</div>
                  <div className="text-[10px] text-slate-500 italic">(Ký, đóng dấu)</div>
                  <div className="mt-10 font-black text-teal-900 text-[11px]">HỒ MINH SANG</div>
                </div>
                <div>
                  <div className="font-bold text-slate-900 uppercase text-[11px]">Người Nhận Lương</div>
                  <div className="text-[10px] text-slate-500 italic">(Ký xác nhận nhận đủ)</div>
                  <div className="mt-10 font-black text-slate-900 text-[11px]">
                    {selectedSlipNV.tenNV}
                  </div>
                </div>
              </div>

              {/* Chân phiếu */}
              <div className="text-[10px] text-slate-400 text-center pt-1 border-t border-slate-200 italic">
                Phiếu lương điện tử có giá trị đối chiếu chứng từ nội bộ MIMIN ERP · In lúc {viewTime || "Hệ thống"}
              </div>
            </div>

            {/* Footer Modal (ẩn khi in) */}
            <div className="p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-slate-800 flex items-center justify-between print:hidden">
              <span className="text-xs text-slate-500">
                Bấm &quot;In Phiếu Lương (A4)&quot; để in bản chuẩn vừa vặn 1 trang giấy A4
              </span>
              <button
                type="button"
                onClick={() => setSelectedSlipNV(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white hover:bg-slate-300 transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ================= MODAL: IN TOÀN BỘ BẢNG LƯƠNG (A4 LANDSCAPE) ================= */}
      {showPrintAllModal && mounted && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/75 backdrop-blur-sm overflow-y-auto print:static print:p-0 print:bg-white print:block">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-5xl w-full my-auto border border-slate-200 dark:border-white/10 overflow-hidden print:border-none print:shadow-none print:rounded-none print:max-w-none print:w-full">
            {/* Thanh công cụ Modal in bảng lương (ẩn khi in) */}
            <div className="p-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-slate-800 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-teal-600" />
                <span className="font-bold text-sm text-slate-800 dark:text-white">
                  Bản In Bảng Lương Toàn Bộ Nhân Viên · Tháng {String(thang).padStart(2, "0")}/{nam}
                </span>
                <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                  Chuẩn A4 ngang (Landscape)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof document !== "undefined") {
                      document.body.classList.add("printing-landscape");
                    }
                    window.print();
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 transition shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>In Bảng Lương Ngay (A4)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintAllModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Nội dung Bảng Lương chuẩn in A4 Landscape */}
            <div
              id="mimin-all-salaries-print"
              className="p-5 md:p-8 space-y-4 max-h-[82vh] overflow-y-auto print:max-h-none print:p-0 print:overflow-visible print:space-y-3.5 text-slate-900 bg-white"
            >
              {/* Header Bảng Lương */}
              <div className="flex items-start justify-between border-b pb-3.5 border-slate-300">
                <div className="space-y-0.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    CÔNG TY TNHH DỆT MAY GIÀU SANG
                  </div>
                  <div className="text-base md:text-lg font-black text-teal-800 tracking-tight">
                    THƯƠNG HIỆU THỜI TRANG POLOMIMIN
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Địa chỉ: 13/4e Xuân Thới Sơn 19, Ấp 3, Xuân Thới Sơn, Hóc Môn, Hồ Chí Minh · Hotline: 0774480916
                  </div>
                </div>

                <div className="text-right space-y-0.5">
                  <div className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight">
                    BẢNG THANH TOÁN TIỀN LƯƠNG & TẠM ỨNG
                  </div>
                  <div className="text-xs font-extrabold text-teal-700">
                    KỲ LƯƠNG: THÁNG {String(thang).padStart(2, "0")} / NĂM {nam}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Từ 01/{String(thang).padStart(2, "0")}/{nam} đến {lastDay}/{String(thang).padStart(2, "0")}/{nam} · Chuẩn 28 ngày công
                  </div>
                </div>
              </div>

              {/* Bảng Dữ Liệu Nhân Sự */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-slate-300 border-collapse">
                  <thead className="bg-slate-100 text-slate-800 font-bold text-[11px] border-b border-slate-300">
                    <tr>
                      <th className="py-2 px-2 text-center border-r border-slate-300 w-10">STT</th>
                      <th className="py-2 px-2 text-left border-r border-slate-300 w-16">Mã NV</th>
                      <th className="py-2 px-3 text-left border-r border-slate-300">Họ và Tên</th>
                      <th className="py-2 px-2 text-left border-r border-slate-300">Bộ Phận</th>
                      <th className="py-2 px-2 text-center border-r border-slate-300">Ngày Công</th>
                      <th className="py-2 px-3 text-right border-r border-slate-300">Lương / Tiền Công</th>
                      <th className="py-2 px-2 text-right border-r border-slate-300 text-amber-800">Tăng Ca</th>
                      <th className="py-2 px-2 text-right border-r border-slate-300 text-emerald-800">Thưởng</th>
                      <th className="py-2 px-2 text-right border-r border-slate-300 text-rose-700">Phạt</th>
                      <th className="py-2 px-3 text-right border-r border-slate-300 text-rose-700 font-bold">Tạm Ứng (Thu Chi)</th>
                      <th className="py-2 px-3 text-right border-r border-slate-300 font-black text-teal-900">Thực Lĩnh</th>
                      <th className="py-2 px-3 text-center w-24">Ký Nhận</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {bangLuong.map((b, idx) => (
                      <tr key={b.maNV} className="hover:bg-slate-50">
                        <td className="py-1.5 px-2 text-center border-r border-slate-200 text-slate-500">{idx + 1}</td>
                        <td className="py-1.5 px-2 font-mono font-bold text-teal-800 border-r border-slate-200">{b.maNV}</td>
                        <td className="py-1.5 px-3 font-bold text-slate-900 border-r border-slate-200">{b.tenNV}</td>
                        <td className="py-1.5 px-2 text-slate-700 border-r border-slate-200">{b.boPhan}</td>
                        <td className="py-1.5 px-2 text-center border-r border-slate-200">
                          {b.ngayCongThucTe}/{b.ngayCongChuan}
                        </td>
                        <td className="py-1.5 px-3 text-right font-semibold border-r border-slate-200">{fmtVND(b.tienCong)}</td>
                        <td className="py-1.5 px-2 text-right text-amber-800 font-semibold border-r border-slate-200">
                          {b.gioTangCa > 0 ? `+${fmtVND(b.tienTangCa)} (${b.gioTangCa}h)` : "-"}
                        </td>
                        <td className="py-1.5 px-2 text-right text-emerald-700 border-r border-slate-200">
                          {b.thuongVuot > 0 ? `+${fmtVND(b.thuongVuot)}` : "-"}
                        </td>
                        <td className="py-1.5 px-2 text-right text-rose-600 border-r border-slate-200">
                          {b.phatLoi + b.phatTreHan > 0 ? `-${fmtVND(b.phatLoi + b.phatTreHan)}` : "-"}
                        </td>
                        <td className="py-1.5 px-3 text-right font-bold text-rose-600 border-r border-slate-200">
                          {b.tamUng > 0 ? `-${fmtVNDFull(b.tamUng)}` : "-"}
                        </td>
                        <td className="py-1.5 px-3 text-right font-black text-teal-900 border-r border-slate-200">
                          {fmtVNDFull(b.thucNhan)}
                        </td>
                        <td className="py-1.5 px-3 text-center text-slate-300 italic text-[10px]">
                          Ký nhận
                        </td>
                      </tr>
                    ))}
                  </tbody>

                  {/* Dòng Tổng Kết */}
                  <tfoot className="bg-slate-100 font-black border-t-2 border-slate-300 text-[11px]">
                    <tr>
                      <td colSpan={5} className="py-2.5 px-3 text-right uppercase text-slate-900 border-r border-slate-300">
                        TỔNG CỘNG ({bangLuong.length} NHÂN SỰ):
                      </td>
                      <td className="py-2.5 px-3 text-right border-r border-slate-300 font-extrabold">
                        {fmtVNDFull(tongTienCongGoc)}
                      </td>
                      <td className="py-2.5 px-2 text-right text-amber-800 border-r border-slate-300">
                        +{fmtVNDFull(tongKet.tongTienTangCa)}
                      </td>
                      <td className="py-2.5 px-2 text-right text-emerald-800 border-r border-slate-300">
                        +{fmtVNDFull(tongKet.tongThuongVuot)}
                      </td>
                      <td className="py-2.5 px-2 text-right text-rose-700 border-r border-slate-300">
                        -{fmtVNDFull(tongKet.tongPhatLoi + tongKet.tongPhatTreHan)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-rose-700 border-r border-slate-300">
                        -{fmtVNDFull(tongKet.tongTamUng)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-teal-900 text-sm border-r border-slate-300">
                        {fmtVNDFull(tongKet.tongThucNhan)}
                      </td>
                      <td className="py-2.5 px-3"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Dòng đọc số tiền bằng chữ của toàn bộ quỹ lương */}
              <div className="text-xs italic font-medium text-slate-800 pt-1">
                Tổng số tiền thực lĩnh toàn công ty bằng chữ: <b className="font-bold text-slate-950">{docSoThanhChu(tongKet.tongThucNhan)}</b>.
              </div>

              {/* 3 Chữ ký xác nhận */}
              <div className="grid grid-cols-3 gap-6 text-center text-xs pt-4 pb-2 print:pt-4">
                <div>
                  <div className="font-bold text-slate-900 uppercase text-[11px]">Người Lập Bảng</div>
                  <div className="text-[10px] text-slate-500 italic">(Ký, họ tên)</div>
                  <div className="mt-12 font-semibold text-slate-800 text-[11px]">Bùi Thị Thanh</div>
                </div>
                <div>
                  <div className="font-bold text-slate-900 uppercase text-[11px]">Kế Toán Trưởng</div>
                  <div className="text-[10px] text-slate-500 italic">(Ký, họ tên)</div>
                  <div className="mt-12 font-semibold text-slate-800 text-[11px]">Phan Tuyết Lan</div>
                </div>
                <div>
                  <div className="font-bold text-slate-900 uppercase text-[11px]">Giám Đốc Duyệt</div>
                  <div className="text-[10px] text-slate-500 italic">(Ký, đóng dấu)</div>
                  <div className="mt-12 font-black text-teal-900 text-[11px]">HỒ MINH SANG</div>
                </div>
              </div>

              {/* Chân biểu */}
              <div className="text-[10px] text-slate-400 text-center pt-1 border-t border-slate-200 italic">
                Bảng thanh toán tiền lương nội bộ MIMIN ERP · In lúc {viewTime || "Hệ thống"}
              </div>
            </div>

            {/* Footer Modal In Tổng (ẩn khi in) */}
            <div className="p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-slate-800 flex items-center justify-between print:hidden">
              <span className="text-xs text-slate-500">
                Bản in tự động căn chỉnh vừa vặn trên khổ giấy A4 ngang (Landscape)
              </span>
              <button
                type="button"
                onClick={() => setShowPrintAllModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white hover:bg-slate-300 transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Global CSS chuyên dụng cho chế độ In Ấn A4 */}
      <style jsx global>{`
        @media print {
          /* Ẩn triệt để tất cả ngoại trừ container in được chọn */
          body * {
            visibility: hidden !important;
          }

          /* In phiếu lương cá nhân (A4 Portrait) */
          #mimin-payslip-print,
          #mimin-payslip-print * {
            visibility: visible !important;
          }
          #mimin-payslip-print {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 8mm 12mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            z-index: 999999 !important;
            display: block !important;
          }

          /* In toàn bộ bảng lương (A4 Landscape) */
          #mimin-all-salaries-print,
          #mimin-all-salaries-print * {
            visibility: visible !important;
          }
          #mimin-all-salaries-print {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 6mm 10mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            z-index: 999999 !important;
            display: block !important;
          }

          @page {
            size: A4 portrait;
            margin: 6mm 10mm 6mm 10mm;
          }

          body.printing-landscape @page {
            size: A4 landscape;
            margin: 6mm 8mm 6mm 8mm;
          }
        }
      `}</style>
    </div>
  );
}
