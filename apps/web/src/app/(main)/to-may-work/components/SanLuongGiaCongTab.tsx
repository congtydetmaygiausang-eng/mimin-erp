"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Search,
  Filter,
  Edit3,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Layers,
  Scissors,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  ArrowUpDown,
  Building2,
  Package,
  RotateCcw,
  UserCheck,
  Eye,
  Shirt,
  Palette,
} from "lucide-react";
import { toast } from "sonner";
import { LenhCat } from "@/lib/data/lenh-cat-store";
import { DOI_TAC_GIA_CONG, DoiTacGiaCong } from "@/lib/doi-tac-gia-cong";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";

// Key lưu trữ localStorage
const STORAGE_TARGET_KEY = "mimin_san_luong_toi_thieu_gc";

// Phân loại nhóm đối tác chuyên môn
export type NhomGiaCong = "may_tru" | "may_tron" | "may_quan" | "theu" | "in" | "may";

export function getNhomGiaCong(dt: DoiTacGiaCong): NhomGiaCong {
  const name = (dt.tenDonVi || "").toLowerCase();
  const ma = (dt.ma || "").toLowerCase();
  
  // 1. Thêu vi tính (tách riêng thêu theo yêu cầu của anh Sang)
  if (name.includes("thêu") && !name.includes("in/thêu/dập")) {
    return "theu";
  }
  if (ma === "gc-in-002" || ma === "gc-in-006") {
    // Xưởng thêu chị Hạnh, Xưởng thêu anh Vui
    return "theu";
  }

  // 2. In / Dập (tách riêng in theo yêu cầu của anh Sang)
  if (ma.startsWith("gc-in-") || name.includes("in") || name.includes("dập")) {
    return "in";
  }

  // 3. May Quần
  if (ma.startsWith("gc-quan-") || name.includes("quần")) {
    return "may_quan";
  }

  // 4. May Áo Trụ
  if (ma.startsWith("gc-tru-") || name.includes("trụ")) {
    return "may_tru";
  }

  // 5. May Áo Tròn
  if (ma.startsWith("gc-tron-") || name.includes("tròn")) {
    return "may_tron";
  }

  return "may";
}

export function isMayPartner(dt: DoiTacGiaCong): boolean {
  const nhom = getNhomGiaCong(dt);
  return nhom === "may_tru" || nhom === "may_tron" || nhom === "may_quan" || nhom === "may";
}

// Sản lượng tối thiểu tháng mặc định theo từng xưởng
export const DEFAULT_SAN_LUONG_TOI_THIEU: Record<string, number> = {
  // May Áo Trụ
  "GC-TRU-001": 1500, // Chị Liễu
  "GC-TRU-002": 1200, // Chị Tý Sơn
  "GC-TRU-003": 1500, // Anh Duẩn
  "GC-TRU-005": 1600, // Anh Thông
  "GC-TRU-006": 1200, // Cô Cúc
  "GC-TRU-007": 1500, // Anh Sản
  "GC-TRU-008": 1500, // GC chị Vân cổ tròn trụ
  
  // May Áo Tròn
  "GC-TRON-001": 1500, // Anh Trai
  "GC-TRON-002": 1200, // Chị Hằng
  "GC-TRON-003": 1200, // Anh Chiến
  "GC-TRON-004": 1200, // Anh Thuận
  "GC-TRON-005": 1200, // Anh Quang
  "GC-TRON-006": 1200, // GC cô Liên cổ tròn
  
  // May Quần
  "GC-QUAN-001": 2000, // Chị Dung
  "GC-QUAN-002": 1500, // Chị Minh Vy
  "GC-QUAN-003": 1600, // Anh Thơ
  "GC-QUAN-004": 1500, // Chị Hương

  // May Chung / Đa Năng
  "GC-ALL-01": 1500, // Xưởng may anh Long

  // XƯỞNG THÊU (Tách riêng)
  "GC-IN-002": 2500, // Thêu chị Hạnh
  "GC-IN-006": 3000, // Thêu anh Vui

  // XƯỞNG IN (Tách riêng)
  "GC-IN-001": 2000, // In/thêu/dập Bảo Ngân
  "GC-IN-003": 3000, // In/dập Thanh Sơn
  "GC-IN-004": 3000, // In chuyển nhiệt Tiến Đạt
  "GC-IN-007": 1500, // In anh Trung Nha Trang
};

interface SanLuongItem {
  doiTac: DoiTacGiaCong;
  nhom: NhomGiaCong;
  sanLuongToiThieu: number;
  sanLuongDaNhan: number;
  sanLuongHoanThanh: number;
  sanLuongDangMay: number;
  soLenh: number;
  tiLe: number;
  chenhLech: number; // daNhan - toiThieu
  trangThai: "DU_HANG" | "THIEU_HANG";
  dsLenh: {
    lcId: string;
    maSP: string;
    tenSP: string;
    soLuong: number;
    trangThaiCD: string;
    ngay: string;
    donGia: number;
    congDoan: string;
  }[];
}

// Matching hàm thông minh giữa tên xưởng trong lệnh cắt và đối tác gia công
function isMatchPartner(pcNguoiTen: string, pcNguoiMa: string, partner: DoiTacGiaCong): boolean {
  if (!pcNguoiTen && !pcNguoiMa) return false;
  if (pcNguoiMa && pcNguoiMa.toLowerCase() === partner.ma.toLowerCase()) return true;
  
  const cleanName = (pcNguoiTen || "").toLowerCase().trim();
  const pName = (partner.tenDonVi || "").toLowerCase().trim();
  const pContact = (partner.nguoiLienHe || "").toLowerCase().trim();

  if (cleanName.includes(pName) || pName.includes(cleanName)) return true;
  if (cleanName.includes(pContact) || pContact.includes(cleanName)) return true;

  if (partner.ma === "GC-TRU-005" && (cleanName.includes("thông") || cleanName.includes("thong"))) return true;
  if (partner.ma === "GC-QUAN-003" && (cleanName.includes("thơ") || cleanName.includes("tho"))) return true;
  if (partner.ma === "GC-TRON-006" && (cleanName.includes("cô liên") || cleanName.includes("co lien") || cleanName === "cô liên")) return true;
  if (partner.ma === "GC-TRU-008" && (cleanName.includes("vân") || cleanName.includes("van anh"))) return true;
  if (partner.ma === "GC-ALL-01" && (cleanName.includes("anh long") || cleanName.includes("long"))) return true;
  if (partner.ma === "GC-QUAN-001" && (cleanName.includes("chị dung") || cleanName.includes("chi dung") || cleanName.includes("dung"))) return true;
  if (partner.ma === "GC-QUAN-004" && (cleanName.includes("hương") || cleanName.includes("huong"))) return true;
  if (partner.ma === "GC-TRON-001" && (cleanName.includes("trai") || cleanName.includes("nguyễn ngọc trai"))) return true;
  if (partner.ma === "GC-TRON-003" && (cleanName.includes("chiến") || cleanName.includes("chien"))) return true;
  if (partner.ma === "GC-TRU-001" && (cleanName.includes("liễu") || cleanName.includes("lieu"))) return true;
  if (partner.ma === "GC-TRU-002" && (cleanName.includes("tý sơn") || cleanName.includes("ty son"))) return true;
  if (partner.ma === "GC-TRU-006" && (cleanName.includes("cúc") || cleanName.includes("cuc"))) return true;
  if (partner.ma === "GC-IN-006" && (cleanName.includes("vui") || cleanName.includes("anh vui"))) return true;
  if (partner.ma === "GC-IN-002" && (cleanName.includes("hạnh") || cleanName.includes("hanh"))) return true;
  if (partner.ma === "GC-IN-007" && (cleanName.includes("nha trang") || cleanName.includes("trung"))) return true;
  if (partner.ma === "GC-IN-003" && (cleanName.includes("thanh sơn") || cleanName.includes("thanh son"))) return true;
  if (partner.ma === "GC-IN-001" && (cleanName.includes("bảo ngân") || cleanName.includes("bao ngan"))) return true;
  if (partner.ma === "GC-IN-004" && (cleanName.includes("tiến đạt") || cleanName.includes("tien dat"))) return true;

  return false;
}

interface SanLuongGiaCongTabProps {
  dsLenhCat: LenhCat[];
  // scope: "MAY_ONLY" (ở Tổ May: CHỈ XƯỞNG MAY) | "IN_THEU_ONLY" (ở In/Thêu: CHỈ THÊU VÀ IN) | "ALL"
  scope?: "MAY_ONLY" | "IN_THEU_ONLY" | "ALL";
  defaultGroup?: "MAY" | "THEU" | "IN" | "ALL_IN_THEU" | "ALL";
}

export function SanLuongGiaCongTab({ dsLenhCat, scope = "MAY_ONLY", defaultGroup }: SanLuongGiaCongTabProps) {
  // 1. Quản lý Sản lượng tối thiểu (Targets)
  const [targets, setTargets] = useState<Record<string, number>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_TARGET_KEY);
        if (saved) {
          return { ...DEFAULT_SAN_LUONG_TOI_THIEU, ...JSON.parse(saved) };
        }
      } catch {}
    }
    return DEFAULT_SAN_LUONG_TOI_THIEU;
  });

  // 2. Tháng được chọn (Mặc định là 2026-11 hoặc tháng gần nhất)
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-11");

  // 3. Phân nhóm chính:
  // - Nếu scope === "MAY_ONLY" => luôn cố định "MAY"
  // - Nếu scope === "IN_THEU_ONLY" => mặc định "ALL_IN_THEU"
  const initialGroup = defaultGroup || (scope === "IN_THEU_ONLY" ? "ALL_IN_THEU" : "MAY");
  const [activeGroup, setActiveGroup] = useState<"MAY" | "THEU" | "IN" | "ALL_IN_THEU" | "ALL">(initialGroup);

  // 4. Phân loại phụ (chi tiết trong khâu may: ALL, may_tru, may_tron, may_quan)
  const [filterMayDetail, setFilterMayDetail] = useState<string>("ALL");

  // Inline edit state
  const [editingMa, setEditingMa] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  // Modal chi tiết lệnh cắt của xưởng
  const [selectedDetailPartner, setSelectedDetailPartner] = useState<SanLuongItem | null>(null);

  // Bộ lọc trạng thái & tìm kiếm
  const [filterStatus, setFilterStatus] = useState<"ALL" | "THIEU_HANG" | "DU_HANG">("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Danh sách các tháng có dữ liệu
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    dsLenhCat.forEach((lc) => {
      const d = lc.ngayTao || lc.hanHoanThanh;
      if (d && d.length >= 7) {
        set.add(d.slice(0, 7));
      }
    });
    set.add("2026-10");
    set.add("2026-11");
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [dsLenhCat]);

  // Cập nhật sản lượng tối thiểu
  const handleSaveTarget = (ma: string, val: number) => {
    if (isNaN(val) || val < 0) {
      toast.error("Vui lòng nhập số lượng hợp lệ lớn hơn 0");
      return;
    }
    const updated = { ...targets, [ma]: val };
    setTargets(updated);
    try {
      localStorage.setItem(STORAGE_TARGET_KEY, JSON.stringify(updated));
    } catch {}
    const partner = DOI_TAC_GIA_CONG.find((d) => d.ma === ma);
    toast.success(`Đã cập nhật chỉ tiêu tối thiểu của ${partner?.tenDonVi || ma}: ${val.toLocaleString("vi-VN")} SP/tháng`);
    setEditingMa(null);
  };

  // Tính toán dữ liệu sản lượng cho từng đối tác
  const sanLuongData: SanLuongItem[] = useMemo(() => {
    return DOI_TAC_GIA_CONG.map((partner) => {
      const nhom = getNhomGiaCong(partner);
      const toiThieu = targets[partner.ma] ?? DEFAULT_SAN_LUONG_TOI_THIEU[partner.ma] ?? 1200;
      
      let daNhan = 0;
      let daHoanThanh = 0;
      let dangMay = 0;
      const dsLenh: SanLuongItem["dsLenh"] = [];

      dsLenhCat.forEach((lc) => {
        // Kiểm tra tháng
        const dateStr = lc.ngayTao || lc.hanHoanThanh || "";
        if (selectedMonth !== "ALL" && !dateStr.startsWith(selectedMonth)) {
          return;
        }

        // Kiểm tra xem lệnh này có giao cho partner này không
        (lc.phanCong || []).forEach((pc: any) => {
          if (isMatchPartner(pc.nguoiTen, pc.nguoiMa, partner)) {
            // Xác định số lượng chính xác theo công đoạn
            let sl = pc.soLuong || 0;
            if (sl === 0) {
              if (pc.id === "may_ao" || pc.tenCongDoan?.toLowerCase().includes("áo")) {
                sl = lc.tongSLThucTeAo || lc.tongSL || 0;
              } else if (pc.id === "may_quan" || pc.tenCongDoan?.toLowerCase().includes("quần")) {
                sl = lc.tongSLThucTeQuan || lc.tongSL || 0;
              } else {
                sl = lc.tongSLThucTe || lc.tongSL || 0;
              }
            }

            daNhan += sl;
            if (pc.trangThaiCD === "hoan_thanh") {
              daHoanThanh += sl;
            } else {
              dangMay += sl;
            }

            dsLenh.push({
              lcId: lc.id,
              maSP: lc.maSP || "SP",
              tenSP: lc.tenSP || "Sản phẩm",
              soLuong: sl,
              trangThaiCD: pc.trangThaiCD || "cho_giao",
              ngay: dateStr,
              donGia: pc.donGia || 0,
              congDoan: pc.tenCongDoan || "Gia công",
            });
          }
        });
      });

      const chenhLech = daNhan - toiThieu;
      const tiLe = toiThieu > 0 ? Math.round((daNhan / toiThieu) * 100) : 100;
      const trangThai = daNhan >= toiThieu ? "DU_HANG" : "THIEU_HANG";

      return {
        doiTac: partner,
        nhom,
        sanLuongToiThieu: toiThieu,
        sanLuongDaNhan: daNhan,
        sanLuongHoanThanh: daHoanThanh,
        sanLuongDangMay: dangMay,
        soLenh: dsLenh.length,
        tiLe,
        chenhLech,
        trangThai,
        dsLenh,
      };
    });
  }, [targets, selectedMonth, dsLenhCat]);

  // Bộ lọc hiển thị theo Scope và Nhóm
  const groupedData = useMemo(() => {
    return sanLuongData.filter((item) => {
      if (scope === "MAY_ONLY") {
        // Chỉ xưởng may ở Tổ May
        if (!isMayPartner(item.doiTac)) return false;
        if (filterMayDetail === "may_tru" && item.nhom !== "may_tru") return false;
        if (filterMayDetail === "may_tron" && item.nhom !== "may_tron") return false;
        if (filterMayDetail === "may_quan" && item.nhom !== "may_quan") return false;
      } else if (scope === "IN_THEU_ONLY") {
        // Chỉ xưởng Thêu và In ở In/Thêu
        if (item.nhom !== "theu" && item.nhom !== "in") return false;
        if (activeGroup === "THEU" && item.nhom !== "theu") return false;
        if (activeGroup === "IN" && item.nhom !== "in") return false;
      } else {
        // Fallback / Tất cả
        if (activeGroup === "MAY" && !isMayPartner(item.doiTac)) return false;
        if (activeGroup === "THEU" && item.nhom !== "theu") return false;
        if (activeGroup === "IN" && item.nhom !== "in") return false;

        // Chi tiết khâu may
        if (activeGroup === "MAY" && filterMayDetail !== "ALL") {
          if (filterMayDetail === "may_tru" && item.nhom !== "may_tru") return false;
          if (filterMayDetail === "may_tron" && item.nhom !== "may_tron") return false;
          if (filterMayDetail === "may_quan" && item.nhom !== "may_quan") return false;
        }
      }

      // Filter Trạng thái Đủ / Thiếu
      if (filterStatus !== "ALL" && item.trangThai !== filterStatus) {
        return false;
      }

      // Search từ khóa
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchName = item.doiTac.tenDonVi.toLowerCase().includes(q);
        const matchMa = item.doiTac.ma.toLowerCase().includes(q);
        const matchContact = (item.doiTac.nguoiLienHe || "").toLowerCase().includes(q);
        const matchPhone = (item.doiTac.sdt || "").includes(q);
        if (!matchName && !matchMa && !matchContact && !matchPhone) return false;
      }

      return true;
    });
  }, [sanLuongData, scope, activeGroup, filterMayDetail, filterStatus, searchTerm]);

  // Thống kê tổng hợp theo nhóm hiện tại (KPIs)
  const currentGroupBaseList = useMemo(() => {
    if (scope === "MAY_ONLY") {
      if (filterMayDetail === "may_tru") return sanLuongData.filter((d) => d.nhom === "may_tru");
      if (filterMayDetail === "may_tron") return sanLuongData.filter((d) => d.nhom === "may_tron");
      if (filterMayDetail === "may_quan") return sanLuongData.filter((d) => d.nhom === "may_quan");
      return sanLuongData.filter((d) => isMayPartner(d.doiTac));
    }

    if (scope === "IN_THEU_ONLY") {
      if (activeGroup === "THEU") return sanLuongData.filter((d) => d.nhom === "theu");
      if (activeGroup === "IN") return sanLuongData.filter((d) => d.nhom === "in");
      return sanLuongData.filter((d) => d.nhom === "theu" || d.nhom === "in");
    }

    return sanLuongData.filter((item) => {
      if (activeGroup === "MAY") return isMayPartner(item.doiTac);
      if (activeGroup === "THEU") return item.nhom === "theu";
      if (activeGroup === "IN") return item.nhom === "in";
      return true;
    });
  }, [sanLuongData, scope, activeGroup, filterMayDetail]);

  const stats = useMemo(() => {
    const tongXuong = currentGroupBaseList.length;
    const duHang = currentGroupBaseList.filter((d) => d.trangThai === "DU_HANG").length;
    const thieuHang = currentGroupBaseList.filter((d) => d.trangThai === "THIEU_HANG").length;
    const tongToiThieu = currentGroupBaseList.reduce((acc, cur) => acc + cur.sanLuongToiThieu, 0);
    const tongDaNhan = currentGroupBaseList.reduce((acc, cur) => acc + cur.sanLuongDaNhan, 0);
    const tiLeTong = tongToiThieu > 0 ? Math.round((tongDaNhan / tongToiThieu) * 100) : 0;
    const tongThieuSP = currentGroupBaseList
      .filter((d) => d.trangThai === "THIEU_HANG")
      .reduce((acc, cur) => acc + Math.abs(cur.chenhLech), 0);

    return {
      tongXuong,
      duHang,
      thieuHang,
      tongToiThieu,
      tongDaNhan,
      tiLeTong,
      tongThieuSP,
    };
  }, [currentGroupBaseList]);

  // Số lượng đối tác theo từng nhóm
  const countMay = useMemo(() => sanLuongData.filter((d) => isMayPartner(d.doiTac)).length, [sanLuongData]);
  const countTru = useMemo(() => sanLuongData.filter((d) => d.nhom === "may_tru").length, [sanLuongData]);
  const countTron = useMemo(() => sanLuongData.filter((d) => d.nhom === "may_tron").length, [sanLuongData]);
  const countQuan = useMemo(() => sanLuongData.filter((d) => d.nhom === "may_quan").length, [sanLuongData]);

  const countTheu = useMemo(() => sanLuongData.filter((d) => d.nhom === "theu").length, [sanLuongData]);
  const countIn = useMemo(() => sanLuongData.filter((d) => d.nhom === "in").length, [sanLuongData]);
  const countAllInTheu = useMemo(() => sanLuongData.filter((d) => d.nhom === "theu" || d.nhom === "in").length, [sanLuongData]);

  // Format tháng hiển thị đẹp (VD: "Tháng 11 / 2026")
  const formatMonthTitle = (m: string) => {
    if (m === "ALL") return "Tất cả các tháng (Lũy kế)";
    const [y, mo] = m.split("-");
    return `Tháng ${parseInt(mo, 10)} / ${y}`;
  };

  // Helper render badge nhóm chuyên môn
  const renderNhomBadge = (nhom: NhomGiaCong) => {
    switch (nhom) {
      case "theu":
        return (
          <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200 shadow-2xs">
            🧵 THÊU
          </span>
        );
      case "in":
        return (
          <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-sky-100 text-sky-800 border border-sky-200 shadow-2xs">
            🎨 IN
          </span>
        );
      case "may_tru":
        return (
          <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs">
            👕 MAY TRỤ
          </span>
        );
      case "may_tron":
        return (
          <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-teal-100 text-teal-800 border border-teal-200 shadow-2xs">
            ⭕ MAY TRÒN
          </span>
        );
      case "may_quan":
        return (
          <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200 shadow-2xs">
            🩳 MAY QUẦN
          </span>
        );
      case "may":
      default:
        return (
          <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
            ✂️ MAY CHUNG
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      {/* ===== HEADER TIÊU ĐỀ & ĐIỀU KHIỂN THÁNG (MÀU XANH LÁ CHUẨN THƯƠNG HIỆU & CHẤM CÔNG) ===== */}
      <div className="bg-gradient-to-br from-emerald-700 via-teal-700 to-emerald-800 text-white rounded-3xl p-5 md:p-6 shadow-xl border border-emerald-400/30 relative overflow-hidden">
        {/* Glow hiệu ứng nền xanh lá */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-emerald-100 border border-white/30 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-200" /> Quản Lý Năng Lực & Điều Hàng Gia Công
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <BarChart3 className="w-7 h-7 text-emerald-200" />
              {scope === "MAY_ONLY"
                ? filterMayDetail === "may_tru"
                  ? "Sản Lượng Xưởng May Áo Trụ (Tổ May)"
                  : filterMayDetail === "may_tron"
                  ? "Sản Lượng Xưởng May Áo Tròn (Tổ May)"
                  : filterMayDetail === "may_quan"
                  ? "Sản Lượng Xưởng May Quần (Tổ May)"
                  : "Sản Lượng Gia Công Tổ May"
                : scope === "IN_THEU_ONLY"
                ? activeGroup === "THEU"
                  ? "Sản Lượng Xưởng Thêu"
                  : activeGroup === "IN"
                  ? "Sản Lượng Xưởng In"
                  : "Sản Lượng Gia Công In & Thêu"
                : activeGroup === "MAY"
                ? "Sản Lượng Gia Công May (Tổ May)"
                : activeGroup === "THEU"
                ? "Sản Lượng Xưởng Thêu"
                : activeGroup === "IN"
                ? "Sản Lượng Xưởng In"
                : "Sản Lượng Toàn Bộ Xưởng Gia Công"}
            </h2>
            <p className="text-xs md:text-sm text-emerald-100/90 mt-1.5 max-w-2xl font-normal leading-relaxed">
              {scope === "MAY_ONLY"
                ? "Đối chiếu sản lượng tối thiểu cam kết với sản lượng thực tế đã điều qua Lệnh Cắt trong tháng cho các xưởng may (Áo trụ, Áo tròn, Quần). Nhận diện chính xác xưởng may đang thiếu hàng và xưởng may đã đủ hàng."
                : scope === "IN_THEU_ONLY"
                ? "Đối chiếu sản lượng tối thiểu cam kết với sản lượng thực tế đã điều qua Lệnh Cắt trong tháng cho các xưởng Thêu và In. Nhận diện chính xác xưởng đang thiếu hàng cần điều việc và xưởng đã đủ hàng."
                : "Đối chiếu sản lượng tối thiểu cam kết với sản lượng thực tế đã điều qua Lệnh Cắt trong tháng. Nhận diện chính xác xưởng đang thiếu hàng cần điều việc và xưởng đã đủ hàng."}
            </p>
          </div>

          {/* Bộ chọn tháng thông minh (Đồng bộ font & bo góc Chấm công) */}
          <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md p-1.5 rounded-2xl border border-white/25 self-stretch md:self-auto justify-between sm:justify-start shadow-xs">
            <button
              onClick={() => {
                const curIdx = availableMonths.indexOf(selectedMonth);
                if (curIdx < availableMonths.length - 1) {
                  setSelectedMonth(availableMonths[curIdx + 1]);
                }
              }}
              disabled={availableMonths.indexOf(selectedMonth) >= availableMonths.length - 1}
              className="p-2 rounded-xl text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Tháng trước"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 px-3 py-1">
              <Calendar className="w-4 h-4 text-emerald-200" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-white font-bold text-xs sm:text-sm focus:outline-none cursor-pointer appearance-none text-center"
              >
                {availableMonths.map((m) => (
                  <option key={m} value={m} className="bg-teal-900 text-white font-bold">
                    {formatMonthTitle(m)}
                  </option>
                ))}
                <option value="ALL" className="bg-teal-900 text-white font-bold">
                  🌟 Tất cả các tháng (Lũy kế)
                </option>
              </select>
            </div>

            <button
              onClick={() => {
                const curIdx = availableMonths.indexOf(selectedMonth);
                if (curIdx > 0) {
                  setSelectedMonth(availableMonths[curIdx - 1]);
                }
              }}
              disabled={availableMonths.indexOf(selectedMonth) <= 0}
              className="p-2 rounded-xl text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Tháng sau"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ===== STAT CARDS: 4 KHỐI KPI TỔNG QUAN THEO NHÓM ĐANG XEM (MÀU XANH LÁ & ĐỒNG BỘ FONT CHẤM CÔNG) ===== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mt-6 pt-5 border-t border-white/20 relative z-10">
          {/* Card 1: Tổng xưởng theo dõi */}
          <div className="bg-emerald-900/40 backdrop-blur-md rounded-2xl p-4 border border-emerald-300/30 shadow-xs transition hover:bg-emerald-900/50">
            <div className="text-xs font-semibold text-emerald-100 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-200" />
              {scope === "MAY_ONLY"
                ? filterMayDetail === "may_tru"
                  ? "Xưởng May Trụ Theo Dõi"
                  : filterMayDetail === "may_tron"
                  ? "Xưởng May Tròn Theo Dõi"
                  : filterMayDetail === "may_quan"
                  ? "Xưởng May Quần Theo Dõi"
                  : "Xưởng May Theo Dõi"
                : scope === "IN_THEU_ONLY"
                ? activeGroup === "THEU"
                  ? "Xưởng Thêu Theo Dõi"
                  : activeGroup === "IN"
                  ? "Xưởng In Theo Dõi"
                  : "Xưởng In & Thêu Theo Dõi"
                : activeGroup === "MAY"
                ? "Xưởng May Theo Dõi"
                : activeGroup === "THEU"
                ? "Xưởng Thêu Theo Dõi"
                : activeGroup === "IN"
                ? "Xưởng In Theo Dõi"
                : "Tổng Xưởng Theo Dõi"}
            </div>
            <div className="text-2xl md:text-3xl font-black mt-1.5 text-white tracking-tight">
              {stats.tongXuong} <span className="text-xs font-normal text-emerald-100/80">đối tác</span>
            </div>
            <div className="text-[11px] text-emerald-100/90 mt-1.5 font-medium">
              Chỉ tiêu: {stats.tongToiThieu.toLocaleString("vi-VN")} SP
            </div>
          </div>

          {/* Card 2: Đang thiếu hàng (Cần điều thêm) */}
          <div className="bg-rose-500/25 backdrop-blur-md rounded-2xl p-4 border border-rose-300/40 shadow-xs relative overflow-hidden transition hover:bg-rose-500/35">
            <div className="text-xs font-semibold text-rose-100 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-200" /> Đang Thiếu Hàng
            </div>
            <div className="text-2xl md:text-3xl font-black mt-1.5 text-white tracking-tight flex items-center gap-2">
              {stats.thieuHang} <span className="text-xs font-normal text-rose-100/80">xưởng</span>
              {stats.thieuHang > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-ping"></span>
              )}
            </div>
            <div className="text-[11px] text-rose-100 mt-1.5 font-bold">
              Thiếu tổng: -{stats.tongThieuSP.toLocaleString("vi-VN")} SP
            </div>
          </div>

          {/* Card 3: Đã đủ hàng (Đủ tải / Vượt chỉ tiêu) */}
          <div className="bg-emerald-500/30 backdrop-blur-md rounded-2xl p-4 border border-emerald-300/50 shadow-xs transition hover:bg-emerald-500/40">
            <div className="text-xs font-semibold text-emerald-100 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" /> Đã Đủ Hàng
            </div>
            <div className="text-2xl md:text-3xl font-black mt-1.5 text-white tracking-tight">
              {stats.duHang} <span className="text-xs font-normal text-emerald-100/80">xưởng</span>
            </div>
            <div className="text-[11px] text-emerald-100 mt-1.5 font-medium">
              Đạt {stats.duHang > 0 ? Math.round((stats.duHang / stats.tongXuong) * 100) : 0}% danh sách
            </div>
          </div>

          {/* Card 4: Tổng sản lượng đã nhận vs Cam kết */}
          <div className="bg-emerald-900/40 backdrop-blur-md rounded-2xl p-4 border border-emerald-300/30 shadow-xs transition hover:bg-emerald-900/50">
            <div className="text-xs font-semibold text-emerald-100 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-200" /> Sản Lượng Đã Điều
            </div>
            <div className="text-2xl md:text-3xl font-black mt-1.5 text-white tracking-tight">
              {stats.tongDaNhan.toLocaleString("vi-VN")} <span className="text-xs font-normal text-emerald-100/80">SP</span>
            </div>
            <div className="text-[11px] text-emerald-100 mt-1.5 font-medium">
              Tỷ lệ lấp đầy: <b>{stats.tiLeTong}%</b>
            </div>
          </div>
        </div>
      </div>

      {/* ===== THANH CHỌN TÁCH NHÓM XƯỞNG ===== */}
      <div className="flex flex-wrap items-center gap-2">
        {scope === "MAY_ONLY" ? (
          <>
            <button
              onClick={() => setFilterMayDetail("ALL")}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-sm ${
                filterMayDetail === "ALL"
                  ? "bg-teal-700 text-white shadow-teal-700/20 ring-2 ring-teal-600"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Shirt className="w-4 h-4" />
              <span>Tất Cả Xưởng May</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                filterMayDetail === "ALL" ? "bg-white/20 text-white" : "bg-teal-100 text-teal-800"
              }`}>
                {countMay} xưởng
              </span>
            </button>

            <button
              onClick={() => setFilterMayDetail("may_tru")}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-sm ${
                filterMayDetail === "may_tru"
                  ? "bg-amber-600 text-white shadow-amber-600/20 ring-2 ring-amber-500"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span>👕 May Áo Trụ</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                filterMayDetail === "may_tru" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
              }`}>
                {countTru} xưởng
              </span>
            </button>

            <button
              onClick={() => setFilterMayDetail("may_tron")}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-sm ${
                filterMayDetail === "may_tron"
                  ? "bg-teal-600 text-white shadow-teal-600/20 ring-2 ring-teal-500"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span>⭕ May Áo Tròn</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                filterMayDetail === "may_tron" ? "bg-white/20 text-white" : "bg-teal-100 text-teal-800"
              }`}>
                {countTron} xưởng
              </span>
            </button>

            <button
              onClick={() => setFilterMayDetail("may_quan")}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-sm ${
                filterMayDetail === "may_quan"
                  ? "bg-indigo-600 text-white shadow-indigo-600/20 ring-2 ring-indigo-500"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span>🩳 May Quần</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                filterMayDetail === "may_quan" ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-800"
              }`}>
                {countQuan} xưởng
              </span>
            </button>
          </>
        ) : scope === "IN_THEU_ONLY" ? (
          <>
            <button
              onClick={() => setActiveGroup("ALL_IN_THEU")}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-sm ${
                activeGroup === "ALL_IN_THEU"
                  ? "bg-slate-800 text-white shadow-slate-800/20 ring-2 ring-slate-700"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Tất Cả In & Thêu</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeGroup === "ALL_IN_THEU" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-800"
              }`}>
                {countAllInTheu} xưởng
              </span>
            </button>

            <button
              onClick={() => setActiveGroup("THEU")}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-sm ${
                activeGroup === "THEU"
                  ? "bg-purple-700 text-white shadow-purple-700/20 ring-2 ring-purple-600"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span>🧵 Xưởng Thêu</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeGroup === "THEU" ? "bg-white/20 text-white" : "bg-purple-100 text-purple-800"
              }`}>
                {countTheu} xưởng
              </span>
            </button>

            <button
              onClick={() => setActiveGroup("IN")}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-sm ${
                activeGroup === "IN"
                  ? "bg-sky-700 text-white shadow-sky-700/20 ring-2 ring-sky-600"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Xưởng In</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeGroup === "IN" ? "bg-white/20 text-white" : "bg-sky-100 text-sky-800"
              }`}>
                {countIn} xưởng
              </span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => {
                setActiveGroup("MAY");
                setFilterMayDetail("ALL");
              }}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-sm ${
                activeGroup === "MAY"
                  ? "bg-teal-700 text-white shadow-teal-700/20 ring-2 ring-teal-600"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Shirt className="w-4 h-4" />
              <span>Xưởng May (Tổ May)</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeGroup === "MAY" ? "bg-white/20 text-white" : "bg-teal-100 text-teal-800"
              }`}>
                {countMay} xưởng
              </span>
            </button>

            <button
              onClick={() => {
                setActiveGroup("THEU");
                setFilterMayDetail("ALL");
              }}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-sm ${
                activeGroup === "THEU"
                  ? "bg-purple-700 text-white shadow-purple-700/20 ring-2 ring-purple-600"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span>🧵 Xưởng Thêu</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeGroup === "THEU" ? "bg-white/20 text-white" : "bg-purple-100 text-purple-800"
              }`}>
                {countTheu} xưởng
              </span>
            </button>

            <button
              onClick={() => {
                setActiveGroup("IN");
                setFilterMayDetail("ALL");
              }}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-sm ${
                activeGroup === "IN"
                  ? "bg-sky-700 text-white shadow-sky-700/20 ring-2 ring-sky-600"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Xưởng In</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeGroup === "IN" ? "bg-white/20 text-white" : "bg-sky-100 text-sky-800"
              }`}>
                {countIn} xưởng
              </span>
            </button>

            <button
              onClick={() => {
                setActiveGroup("ALL");
                setFilterMayDetail("ALL");
              }}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-sm ${
                activeGroup === "ALL"
                  ? "bg-slate-800 text-white shadow-slate-800/20 ring-2 ring-slate-700"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Tất Cả Đối Tác</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeGroup === "ALL" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-800"
              }`}>
                {sanLuongData.length}
              </span>
            </button>
          </>
        )}
      </div>

      {/* ===== BỘ LỌC TÌM KIẾM & PHÂN LOẠI CHI TIẾT ===== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Quick Filter: Tất cả | Thiếu hàng | Đủ hàng */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80 self-start sm:self-auto shrink-0">
            <button
              onClick={() => setFilterStatus("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                filterStatus === "ALL"
                  ? "bg-slate-800 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              Tất cả ({currentGroupBaseList.length})
            </button>
            <button
              onClick={() => setFilterStatus("THIEU_HANG")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                filterStatus === "THIEU_HANG"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-rose-700 hover:bg-rose-100/60"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" /> ⚠️ Thiếu hàng ({stats.thieuHang})
            </button>
            <button
              onClick={() => setFilterStatus("DU_HANG")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                filterStatus === "DU_HANG"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-emerald-700 hover:bg-emerald-100/60"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> ✅ Đủ hàng ({stats.duHang})
            </button>
          </div>

          {/* Ô tìm kiếm & Phân loại chuyên môn phụ */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 lg:max-w-xl">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm tên xưởng, người đại diện, SĐT..."
                className="w-full pl-9 pr-8 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium placeholder:text-slate-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Phân loại phụ trong nhóm may (chỉ hiện khi scope === "ALL" và đang xem tab MAY) */}
            {scope === "ALL" && activeGroup === "MAY" && (
              <select
                value={filterMayDetail}
                onChange={(e) => setFilterMayDetail(e.target.value)}
                className="py-2 px-3 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-semibold text-slate-700 cursor-pointer"
              >
                <option value="ALL">Tất cả khâu may ({countMay})</option>
                <option value="may_tru">👕 May Áo Trụ ({countTru} xưởng)</option>
                <option value="may_tron">⭕ May Áo Tròn ({countTron} xưởng)</option>
                <option value="may_quan">🩳 May Quần ({countQuan} xưởng)</option>
              </select>
            )}
          </div>
        </div>

        {/* Hướng dẫn thao tác nhanh */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex-wrap gap-2">
          <span>
            💡 <b>Thao tác:</b> Bấm trực tiếp vào con số ở cột <b>"Sản lượng tối thiểu / tháng"</b> để chỉnh sửa cam kết của xưởng.
          </span>
          <span className="font-mono text-teal-800 font-bold">
            Hiển thị: {groupedData.length} đối tác ({
              scope === "MAY_ONLY"
                ? filterMayDetail === "may_tru"
                  ? "May Áo Trụ"
                  : filterMayDetail === "may_tron"
                  ? "May Áo Tròn"
                  : filterMayDetail === "may_quan"
                  ? "May Quần"
                  : "Xưởng May"
                : scope === "IN_THEU_ONLY"
                ? activeGroup === "THEU"
                  ? "Xưởng Thêu"
                  : activeGroup === "IN"
                  ? "Xưởng In"
                  : "In & Thêu"
                : activeGroup === "MAY"
                ? "Xưởng May"
                : activeGroup === "THEU"
                ? "Xưởng Thêu"
                : activeGroup === "IN"
                ? "Xưởng In"
                : "Toàn bộ"
            })
          </span>
        </div>
      </div>

      {/* ===== BẢNG DỮ LIỆU SẢN LƯỢNG GIA CÔNG ===== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-xs">
                <th className="py-3 px-3 text-center w-12">STT</th>
                <th className="py-3 px-4 min-w-[220px]">Đối Tác Gia Công</th>
                <th className="py-3 px-3 text-center min-w-[150px]">
                  Sản Lượng Tối Thiểu <span className="text-[10px] text-teal-700 font-bold">(Anh cập nhật)</span>
                </th>
                <th className="py-3 px-3 text-center min-w-[140px]">Đã Nhận (Lệnh Cắt)</th>
                <th className="py-3 px-4 min-w-[180px]">Tiến Độ Cung Ứng</th>
                <th className="py-3 px-3 text-center min-w-[120px]">Chênh Lệch</th>
                <th className="py-3 px-3 text-center min-w-[130px]">Trạng Thái</th>
                <th className="py-3 px-3 text-center w-28">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {groupedData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-bold text-slate-600">Không tìm thấy xưởng gia công nào phù hợp</p>
                    <p className="text-xs text-slate-400 mt-1">Thử chọn nhóm đối tác khác hoặc xóa bộ lọc tìm kiếm</p>
                  </td>
                </tr>
              ) : (
                groupedData.map((item, idx) => {
                  const isEditing = editingMa === item.doiTac.ma;
                  const isThieu = item.trangThai === "THIEU_HANG";

                  return (
                    <tr
                      key={item.doiTac.ma}
                      className={`transition-colors hover:bg-slate-50/80 ${
                        isThieu ? "bg-rose-50/20" : ""
                      }`}
                    >
                      {/* 1. STT */}
                      <td className="py-3 px-3 text-center font-mono text-slate-500 font-bold text-xs">
                        {idx + 1}
                      </td>

                      {/* 2. Tên Xưởng & Badge Chuyên Môn Riêng Biệt */}
                      <td className="py-3 px-4">
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5 shrink-0">
                            {renderNhomBadge(item.nhom)}
                          </div>
                          <div>
                            <div
                              className="font-bold text-slate-900 hover:text-teal-700 cursor-pointer flex items-center gap-1.5"
                              onClick={() => setSelectedDetailPartner(item)}
                            >
                              {item.doiTac.tenDonVi}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap font-medium">
                              <span className="font-mono text-slate-600 font-bold">{item.doiTac.ma}</span>
                              {item.doiTac.nguoiLienHe && (
                                <>
                                  <span>·</span>
                                  <span>LH: {item.doiTac.nguoiLienHe}</span>
                                </>
                              )}
                              {item.doiTac.sdt && (
                                <>
                                  <span>·</span>
                                  <a href={`tel:${item.doiTac.sdt}`} className="text-teal-700 hover:underline flex items-center gap-0.5 font-bold">
                                    <Phone className="w-3 h-3" /> {item.doiTac.sdt}
                                  </a>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 3. Sản lượng tối thiểu / tháng (Người dùng cập nhật) */}
                      <td className="py-3 px-3 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <input
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleSaveTarget(item.doiTac.ma, parseInt(editValue, 10));
                                } else if (e.key === "Escape") {
                                  setEditingMa(null);
                                }
                              }}
                              className="w-24 px-2 py-1 text-center font-bold text-slate-900 border-2 border-teal-500 rounded-lg focus:outline-none text-sm"
                            />
                            <button
                              onClick={() => handleSaveTarget(item.doiTac.ma, parseInt(editValue, 10))}
                              className="p-1 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition"
                              title="Lưu"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingMa(null)}
                              className="p-1 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 transition"
                              title="Hủy"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              setEditingMa(item.doiTac.ma);
                              setEditValue(item.sanLuongToiThieu.toString());
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-teal-300 hover:border-teal-500 bg-teal-50/50 hover:bg-teal-50 cursor-pointer group transition"
                            title="Bấm để chỉnh sửa chỉ tiêu tối thiểu"
                          >
                            <span className="font-mono font-bold text-teal-900 text-sm">
                              {item.sanLuongToiThieu.toLocaleString("vi-VN")}
                            </span>
                            <span className="text-xs text-teal-700 font-bold">SP</span>
                            <Edit3 className="w-3 h-3 text-teal-500 opacity-60 group-hover:opacity-100 transition" />
                          </div>
                        )}
                      </td>

                      {/* 4. Sản lượng đã nhận trong tháng */}
                      <td className="py-3 px-3 text-center">
                        <div className="font-mono font-bold text-sm text-slate-900">
                          {item.sanLuongDaNhan.toLocaleString("vi-VN")}{" "}
                          <span className="text-xs text-slate-500 font-normal">SP</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {item.soLenh > 0 ? (
                            <span
                              onClick={() => setSelectedDetailPartner(item)}
                              className="text-teal-700 hover:underline font-bold cursor-pointer"
                            >
                              {item.soLenh} lệnh cắt
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Chưa giao lệnh</span>
                          )}
                        </div>
                      </td>

                      {/* 5. Tiến độ cung ứng (% và Progress bar) */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-800">
                              {item.tiLe}%
                            </span>
                            <span className="text-slate-500 text-xs font-medium">
                              {item.sanLuongDaNhan.toLocaleString("vi-VN")} / {item.sanLuongToiThieu.toLocaleString("vi-VN")}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                item.tiLe >= 100
                                  ? "bg-emerald-500"
                                  : item.tiLe >= 70
                                  ? "bg-amber-500"
                                  : "bg-rose-500"
                              }`}
                              style={{ width: `${Math.min(item.tiLe, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* 6. Chênh lệch (Thiếu / Thừa) */}
                      <td className="py-3 px-3 text-center">
                        {item.chenhLech >= 0 ? (
                          <div className="font-mono font-bold text-emerald-700 text-xs sm:text-sm">
                            +{item.chenhLech.toLocaleString("vi-VN")}{" "}
                            <span className="text-[10px] font-normal">SP</span>
                          </div>
                        ) : (
                          <div className="font-mono font-bold text-rose-600 text-xs sm:text-sm">
                            -{Math.abs(item.chenhLech).toLocaleString("vi-VN")}{" "}
                            <span className="text-[10px] font-normal">SP</span>
                          </div>
                        )}
                        <div className="text-[11px] text-slate-500 font-medium">
                          {item.chenhLech >= 0 ? "Vượt chỉ tiêu" : "Cần bổ sung"}
                        </div>
                      </td>

                      {/* 7. Trạng thái điều hàng (Cốt lõi theo yêu cầu) */}
                      <td className="py-3 px-3 text-center">
                        {item.trangThai === "DU_HANG" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ĐỦ HÀNG
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> THIẾU HÀNG
                          </span>
                        )}
                      </td>

                      {/* 8. Thao tác */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedDetailPartner(item)}
                            className="px-3 py-1.5 rounded-xl bg-teal-600 text-white font-bold text-xs hover:bg-teal-700 transition flex items-center gap-1 shadow-xs active:scale-95"
                            title="Xem chi tiết các lệnh cắt đã điều cho xưởng"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Điều hàng</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== MODAL CHI TIẾT CÁC LỆNH CẮT CỦA XƯỞNG ===== */}
      <ResponsiveModal
        open={!!selectedDetailPartner}
        onClose={() => setSelectedDetailPartner(null)}
        title={selectedDetailPartner ? `Chi Tiết Sản Lượng: ${selectedDetailPartner.doiTac.tenDonVi}` : ""}
      >
        {selectedDetailPartner && (
          <div className="space-y-4">
            {/* Thẻ tóm tắt năng lực */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase">Chỉ Tiêu Tối Thiểu</div>
                <div className="text-base font-black text-teal-800 font-mono mt-0.5">
                  {selectedDetailPartner.sanLuongToiThieu.toLocaleString("vi-VN")} SP
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase">Đã Nhận Tháng Này</div>
                <div className="text-base font-black text-slate-800 font-mono mt-0.5">
                  {selectedDetailPartner.sanLuongDaNhan.toLocaleString("vi-VN")} SP
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase">Chênh Lệch</div>
                <div className={`text-base font-black font-mono mt-0.5 ${
                  selectedDetailPartner.chenhLech >= 0 ? "text-emerald-700" : "text-rose-600"
                }`}>
                  {selectedDetailPartner.chenhLech >= 0 ? `+${selectedDetailPartner.chenhLech}` : selectedDetailPartner.chenhLech} SP
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase">Trạng Thái</div>
                <div className="mt-1">
                  {selectedDetailPartner.trangThai === "DU_HANG" ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                      ✅ ĐỦ HÀNG
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                      ⚠️ THIẾU HÀNG
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Thông tin đối tác & Chuyên môn */}
            <div className="text-xs text-slate-600 space-y-1 bg-white p-3 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold">Chuyên môn:</span>
                {renderNhomBadge(selectedDetailPartner.nhom)}
                <span className="mx-1">·</span>
                <span className="font-bold">Đại diện:</span> {selectedDetailPartner.doiTac.nguoiLienHe || "---"}
                <span className="mx-1">·</span>
                <Phone className="w-3.5 h-3.5 text-teal-600 inline" />
                <span className="font-bold">SĐT:</span> {selectedDetailPartner.doiTac.sdt || "---"}
              </div>
              {selectedDetailPartner.doiTac.diaChi && (
                <div className="flex items-start gap-2 pt-1">
                  <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                  <span>{selectedDetailPartner.doiTac.diaChi}</span>
                </div>
              )}
            </div>

            {/* Danh sách các lệnh cắt được giao */}
            <div>
              <div className="font-black text-slate-800 text-sm mb-2 flex items-center justify-between">
                <span>Danh sách lệnh cắt trong {formatMonthTitle(selectedMonth)} ({selectedDetailPartner.dsLenh.length} lệnh):</span>
                <a
                  href="/lenh-cat"
                  className="text-xs text-teal-700 hover:underline font-bold flex items-center gap-1"
                >
                  <Scissors className="w-3 h-3" /> Điều thêm hàng từ Lệnh Cắt
                </a>
              </div>

              {selectedDetailPartner.dsLenh.length === 0 ? (
                <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Package className="w-6 h-6 mx-auto mb-1 opacity-40" />
                  <p className="text-xs font-bold text-slate-500">Chưa có lệnh cắt nào giao cho xưởng trong tháng này</p>
                  <p className="text-[11px] text-rose-500 font-semibold mt-1">Xưởng đang thiếu 100% chỉ tiêu sản lượng</p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] sticky top-0">
                      <tr>
                        <th className="p-2.5">Mã Lệnh</th>
                        <th className="p-2.5">Sản Phẩm</th>
                        <th className="p-2.5">Công Đoạn</th>
                        <th className="p-2.5 text-center">Số Lượng</th>
                        <th className="p-2.5 text-center">Ngày Lập</th>
                        <th className="p-2.5 text-center">Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedDetailPartner.dsLenh.map((l, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-2.5 font-mono font-bold text-teal-800">
                            {l.lcId}
                          </td>
                          <td className="p-2.5">
                            <span className="font-bold text-slate-900">{l.maSP}</span> - {l.tenSP}
                          </td>
                          <td className="p-2.5 text-slate-600 font-semibold">
                            {l.congDoan}
                          </td>
                          <td className="p-2.5 text-center font-mono font-black text-slate-800">
                            {l.soLuong.toLocaleString("vi-VN")} SP
                          </td>
                          <td className="p-2.5 text-center text-slate-500 font-mono">
                            {l.ngay || "---"}
                          </td>
                          <td className="p-2.5 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              l.trangThaiCD === "hoan_thanh"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}>
                              {l.trangThaiCD === "hoan_thanh" ? "Hoàn thành" : "Đang làm"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Chỉnh sửa sản lượng tối thiểu trong Modal */}
            <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-teal-900">Điều chỉnh sản lượng tối thiểu tháng này:</div>
                <div className="text-[11px] text-teal-700">Cập nhật chỉ tiêu mới để hệ thống tính lại cảnh báo Đủ / Thiếu hàng.</div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  defaultValue={selectedDetailPartner.sanLuongToiThieu}
                  id="modal-target-input"
                  className="w-28 px-3 py-1.5 text-center font-bold text-sm bg-white border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  onClick={() => {
                    const el = document.getElementById("modal-target-input") as HTMLInputElement;
                    if (el) {
                      const val = parseInt(el.value, 10);
                      handleSaveTarget(selectedDetailPartner.doiTac.ma, val);
                      setSelectedDetailPartner({
                        ...selectedDetailPartner,
                        sanLuongToiThieu: val,
                        chenhLech: selectedDetailPartner.sanLuongDaNhan - val,
                        tiLe: val > 0 ? Math.round((selectedDetailPartner.sanLuongDaNhan / val) * 100) : 100,
                        trangThai: selectedDetailPartner.sanLuongDaNhan >= val ? "DU_HANG" : "THIEU_HANG",
                      });
                    }
                  }}
                  className="px-3 py-1.5 bg-teal-700 text-white font-bold text-xs rounded-lg hover:bg-teal-800 transition"
                >
                  Lưu
                </button>
              </div>
            </div>
          </div>
        )}
      </ResponsiveModal>
    </div>
  );
}
