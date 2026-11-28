"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Package, AlertCircle, TrendingUp,
  Scissors, Calculator, FileText, BarChart3, Plus, X,
  History, Search, ArrowDownToLine, ArrowUpFromLine, Filter,
  Sparkles, Layers, Factory, CheckCircle2, ChevronRight,
  ShieldCheck, Zap, Info, RefreshCw, SlidersHorizontal,
  LayoutGrid, List, Eye, Edit3, RotateCcw
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/components/session-provider";
import { logAudit } from "@/lib/audit-log";
import {
  getAllInventory, truTonKho, nhapKho, updateVaiInfo,
  getInventoryByMaVT, upsertInventoryItem, subscribeInventoryChanges,
  tinhMan, parseSize, goiYVai, syncInventoryWithSupabase,
  baoCaoVaiTheoLSX, DINH_MUC_VAI, HAO_HUT_MAC_DINH,
  addNewVai, getVaiImages,
  type BaoCaoVai, type ThuongHieuVai, detectThuongHieuVai
} from "@/lib/inventory-engine";
import { KHO_VAI, formatVND, type KhoVai } from "@/lib/data/real-data";
import { useNhaCungCap } from "@/lib/data/nha-cung-cap-store";
import { ALL_REAL_PHIEU } from "@/lib/real-workflow-data";
import { Portal } from "@/components/ui/Portal";
import { useKho } from "@/lib/data/kho-store";
import { uploadProductFile } from "@/lib/product-upload";
import { FabricDyeLotZones } from "./components/fabric-dye-lot-zones";
import { VaiChinhSuaModal } from "./components/VaiChinhSuaModal";
import {
  getChiTietGia3Khau, saveChiTietGia3Khau, PRESETS_VAI_MAU,
  type ChiTietGia3Khau, type PresetVaiMau
} from "@/lib/fabric-cost-breakdown";
import { DataViewToggle, type ViewMode } from "@/components/DataViewToggle";
import ImageLightbox from "@/components/ui/ImageLightbox";
import { getFabricSwatchImage } from "@/lib/fabric-swatches";

const TINH_MAN_PHAN_LOAI = [
  "Áo thun cotton",
  "Áo trụ",
  "Áo polo",
  "Quần",
  "Bộ trụ trơn",
];

const LOAI_VAI_OPTIONS = ["Cotton 100%", "Cá sấu", "Polyester 4 chiều"] as const;
type KhoVaiWithImage = KhoVai & { imageUrl?: string };
type NewVaiForm = {
  tenVT: string;
  mauSac: string;
  donGia: number;
  ghiChu: string;
  previewImg: string;
  thuongHieu: ThuongHieuVai;
};

type LoVaiMoc = {
  id: string;
  maLoMoc?: string;
  maLenhDet?: string;
  loaiVai?: string;
  soKg: number;
  soCay: number;
  soKgLoi: number;
  ngayNhap: string;
  kho?: string;
  trangThai?: string;
};

function dataUrlToFile(dataUrl: string, name: string): File {
  const [header, encoded] = dataUrl.split(",");
  const mime = header.match(/data:([^;]+)/)?.[1] || "image/jpeg";
  const bytes = Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0));
  return new File([bytes], name, { type: mime });
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    const value = error as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
    return [value.message, value.details, value.hint, value.code].filter((item): item is string => typeof item === "string" && item.length > 0).join(" · ") || JSON.stringify(error);
  }
  return String(error || "Lỗi không xác định");
}

export default function KhoVaiPage() {
  const { user } = useSession();
  const [inventory, setInventory] = useState<KhoVai[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("mimin_kho_vai_v2_inventory");
        // Wait, where does getAllInventory get it from? I will just use getAllInventory()
        // since it's imported from @/lib/inventory-engine
        return getAllInventory();
      } catch {}
    }
    return [];
  });
  const [tab, setTab] = useState<"thanhpham" | "menhuom" | "moc" | "tinhman" | "baocao" | "danhmuc" | "lichsu">(() => {
    if (typeof window !== "undefined") {
      try {
        const p = new URLSearchParams(window.location.search).get("tab");
        if (p === "menhuom" || p === "thanhpham" || p === "moc" || p === "tinhman" || p === "baocao" || p === "danhmuc" || p === "lichsu") {
          return p as any;
        }
      } catch {}
    }
    return "thanhpham";
  });
  const [searchVai, setSearchVai] = useState("");
  const [thuongHieuFilter, setThuongHieuFilter] = useState<"ALL" | "manpj" | "polomimin">("ALL");
  const [filterLoaiGD, setFilterLoaiGD] = useState<"TAT_CA" | "NHAP" | "XUAT">("TAT_CA");
  const [giaoDich, setGiaoDich] = useState<any[]>([]);
  const [selected, setSelected] = useState<string>("Áo thun cotton");
  const [soLuong, setSoLuong] = useState(500);
  const [sizeStr, setSizeStr] = useState("M, L, XL, 2XL");
  const [baoCaoLenSX, setBaoCaoLenSX] = useState("LSX-2026-001");
  const [showNhap, setShowNhap] = useState<string | null>(null);
  const [showTaoMa, setShowTaoMa] = useState(false);
  const [uploadingVT, setUploadingVT] = useState<string | null>(null);
  const [editingVT, setEditingVT] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<KhoVai>>({});
  const [vaiImages, setVaiImages] = useState<Record<string, string>>({});
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null);
  const [vaiMoc, setVaiMoc] = useState<LoVaiMoc[]>([]);
  // Form tạo mã vải mới — bind thật
  const [newVaiForm, setNewVaiForm] = useState<NewVaiForm>({
    tenVT: LOAI_VAI_OPTIONS[0],
    mauSac: "",
    donGia: 0,
    ghiChu: "",
    previewImg: "",
    thuongHieu: "polomimin",
  });
  const newVaiImgRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

    const getEffectiveVaiImage = (v: KhoVai) => {
    const custom = vaiImages[v.maVT] || (v as KhoVaiWithImage).imageUrl;
    if (custom && !custom.includes("1787667") && !custom.includes("1787648")) {
      return custom;
    }
    return getFabricSwatchImage(v.mauSac || v.tenVT, v.maVT);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadingVT) {
      try {
        const imageUrl = await uploadProductFile(file, `kho-vai-${uploadingVT}`);
        const currentVai = inventory.find(v => v.maVT === uploadingVT);
        if (currentVai) {
          const updatedVai: KhoVaiWithImage = { ...currentVai, imageUrl };
          await upsertInventoryItem(updatedVai);
          setInventory(prev => prev.map(v => v.maVT === uploadingVT ? updatedVai : v));
        }
        toast.success("Đã tải ảnh lên và lưu thành công (nén tự động)!");
      } catch (err) {
        toast.error("Lỗi khi xử lý ảnh");
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    setUploadingVT(null);
  };

  const loadGiaoDich = () => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("mimin_kho_vai_v2");
      setGiaoDich(raw ? JSON.parse(raw) : []);
    } catch { setGiaoDich([]); }
  };

  useEffect(() => {
    setInventory(getAllInventory());
    const localImages = getVaiImages();
    setVaiImages(localImages); // Load ảnh persistent từ localStorage
    loadGiaoDich();
    try {
      const rawMoc = localStorage.getItem("mimin_lo_moc");
      setVaiMoc(rawMoc ? JSON.parse(rawMoc) : []);
    } catch { setVaiMoc([]); }
    syncInventoryWithSupabase().then(async () => {
      const syncedInventory = getAllInventory();
      // Tự chuyển các ảnh cũ chỉ có trên máy người nhập lên dữ liệu dùng chung.
      await Promise.all(
        syncedInventory.map(async (vai) => {
          const localImage = localImages[vai.maVT];
          const remoteImage = (vai as KhoVaiWithImage).imageUrl;
          if (!localImage || remoteImage) return;
          const sharedUrl = localImage.startsWith("data:")
            ? await uploadProductFile(dataUrlToFile(localImage, `${vai.maVT}.jpg`), `kho-vai-${vai.maVT}`)
            : localImage;
          await upsertInventoryItem({ ...vai, imageUrl: sharedUrl } as KhoVaiWithImage);
        }),
      ).catch(() => undefined);
      localStorage.removeItem("mimin_kho_vai_images");
      await syncInventoryWithSupabase();
      setInventory(getAllInventory());
    });
    return subscribeInventoryChanges(() => {
      setInventory(getAllInventory());
      loadGiaoDich();
    });
  }, []);

  const refresh = () => {
    setInventory(getAllInventory());
    loadGiaoDich();
    try {
      const rawMoc = localStorage.getItem("mimin_lo_moc");
      setVaiMoc(rawMoc ? JSON.parse(rawMoc) : []);
    } catch { setVaiMoc([]); }
  };

  // Chế độ xem: Dạng Danh Sách (list) hoặc Dạng Thẻ (card)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("mimin_kho_vai_view_mode") as ViewMode | null;
        if (saved === "list" || saved === "card") return saved;
      } catch {}
    }
    return "list"; // Mặc định Dạng Danh Sách theo thói quen quản lý của anh Cường
  });

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("mimin_kho_vai_view_mode", mode);
    }
  };

  // Bộ lọc nâng cao: Loại vải, Tình trạng tồn kho, Sắp xếp
  const [loaiVaiFilter, setLoaiVaiFilter] = useState<string>("ALL");
  const [tonKhoFilter, setTonKhoFilter] = useState<"ALL" | "DOI_DAO" | "BINH_THUONG" | "SAP_HET" | "HET_HANG">("ALL");
  const [sortBy, setSortBy] = useState<"ma_asc" | "ton_desc" | "ton_asc" | "gia_desc" | "gia_asc" | "ten_asc">("ma_asc");
  const [zoomImage, setZoomImage] = useState<{ src: string; alt?: string } | null>(null);

  // Helper đảm bảo lấy đơn giá vải hợp lệ, chuẩn hoá giá rác > 200k về giá 3 khâu chuẩn
  const getValidDonGiaVai = (v: KhoVai): number => {
    if (v.donGia > 0 && v.donGia <= 250000) {
      return v.donGia;
    }
    const ct = getChiTietGia3Khau(v.maVT, v.tenVT, v.mauSac, v.donGia);
    return ct.donGiaQuyDoi || 74000;
  };

  const getTonKhoColor = (tonKho: number) => {
    if (tonKho === 0) return "text-rose-600 dark:text-rose-400";
    if (tonKho < 100) return "text-amber-600 dark:text-amber-400";
    if (tonKho >= 300) return "text-emerald-600 dark:text-emerald-400";
    return "text-teal-700 dark:text-teal-400";
  };

  const getTonKhoBadge = (tonKho: number) => {
    if (tonKho === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 whitespace-nowrap shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
          Hết hàng
        </span>
      );
    }
    if (tonKho < 100) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 whitespace-nowrap shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
          Sắp hết ({tonKho}kg)
        </span>
      );
    }
    if (tonKho >= 300) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 whitespace-nowrap shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          Dồi dào
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800 whitespace-nowrap shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
        Bình thường
      </span>
    );
  };

  // Tính màn
  const tinh = tinhMan(selected, parseSize(soLuong, sizeStr));
  const totalTonKho = useMemo(() => inventory.reduce((s, v) => s + v.tonKho, 0), [inventory]);
  const totalDonGia = useMemo(() => inventory.reduce((s, v) => s + v.tonKho * getValidDonGiaVai(v), 0), [inventory]);
  const nextVaiNumber = inventory.reduce((max, item) => {
    const value = Number(item.maVT.match(/VAI-(\d+)/i)?.[1] || 0);
    return Math.max(max, value);
  }, 0) + 1;

  // Thống kê số lượng theo 2 loại thương hiệu: Vải ManPJ & Vải Polomimin
  const thuongHieuCounts = useMemo(() => {
    let manpj = 0;
    let polomimin = 0;
    for (const v of inventory) {
      const th = detectThuongHieuVai(v);
      if (th === "manpj") manpj++;
      else polomimin++;
    }
    return {
      all: inventory.length,
      manpj,
      polomimin,
    };
  }, [inventory]);

  // Danh sách các loại vải duy nhất trong kho
  const loaiVaiOptions = useMemo(() => {
    const set = new Set<string>();
    inventory.forEach((v) => {
      if (v.tenVT && v.tenVT.trim()) set.add(v.tenVT.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "vi"));
  }, [inventory]);

  // Thống kê phân loại theo mức tồn kho
  const stockStats = useMemo(() => {
    let doiDao = 0;
    let binhThuong = 0;
    let sapHet = 0;
    let hetHang = 0;
    for (const v of inventory) {
      if (v.tonKho === 0) hetHang++;
      else if (v.tonKho < 100) sapHet++;
      else if (v.tonKho <= 300) binhThuong++;
      else doiDao++;
    }
    return { doiDao, binhThuong, sapHet, hetHang };
  }, [inventory]);

  // Lọc danh sách vải theo ô tìm kiếm, thương hiệu, loại vải, tình trạng tồn kho, và sắp xếp
  const filteredInventory = useMemo(() => {
    let list = inventory.filter((v) => {
      if (searchVai.trim()) {
        const q = searchVai.toLowerCase().trim();
        const matchSearch =
          v.maVT.toLowerCase().includes(q) ||
          v.tenVT.toLowerCase().includes(q) ||
          (v.mauSac && v.mauSac.toLowerCase().includes(q));
        if (!matchSearch) return false;
      }
      if (thuongHieuFilter !== "ALL") {
        const th = detectThuongHieuVai(v);
        if (th !== thuongHieuFilter) return false;
      }
      if (loaiVaiFilter !== "ALL") {
        if (v.tenVT !== loaiVaiFilter) return false;
      }
      if (tonKhoFilter === "DOI_DAO" && v.tonKho < 300) return false;
      if (tonKhoFilter === "BINH_THUONG" && (v.tonKho < 100 || v.tonKho >= 300)) return false;
      if (tonKhoFilter === "SAP_HET" && (v.tonKho <= 0 || v.tonKho >= 100)) return false;
      if (tonKhoFilter === "HET_HANG" && v.tonKho > 0) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === "ton_desc") return b.tonKho - a.tonKho;
      if (sortBy === "ton_asc") return a.tonKho - b.tonKho;
      if (sortBy === "gia_desc") return getValidDonGiaVai(b) - getValidDonGiaVai(a);
      if (sortBy === "gia_asc") return getValidDonGiaVai(a) - getValidDonGiaVai(b);
      if (sortBy === "ten_asc") return a.tenVT.localeCompare(b.tenVT, "vi");
      return a.maVT.localeCompare(b.maVT, undefined, { numeric: true });
    });

    return list;
  }, [inventory, searchVai, thuongHieuFilter, loaiVaiFilter, tonKhoFilter, sortBy]);

  const filteredTonKho = useMemo(() => filteredInventory.reduce((s, v) => s + v.tonKho, 0), [filteredInventory]);
  const filteredThanhTien = useMemo(() => filteredInventory.reduce((s, v) => s + v.tonKho * getValidDonGiaVai(v), 0), [filteredInventory]);

  const hasActiveFilters =
    searchVai !== "" ||
    thuongHieuFilter !== "ALL" ||
    loaiVaiFilter !== "ALL" ||
    tonKhoFilter !== "ALL" ||
    sortBy !== "ma_asc";

  const handleResetFilters = () => {
    setSearchVai("");
    setThuongHieuFilter("ALL");
    setLoaiVaiFilter("ALL");
    setTonKhoFilter("ALL");
    setSortBy("ma_asc");
  };

  // Chuyển đổi nhanh thương hiệu trực tiếp trên thẻ vải
  const handleToggleThuongHieu = async (v: KhoVai, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentTH = detectThuongHieuVai(v);
    const nextTH: ThuongHieuVai = currentTH === "manpj" ? "polomimin" : "manpj";
    const nextLabel = nextTH === "manpj" ? "Vải ManPJ" : "Vải Polomimin";

    updateVaiInfo(v.maVT, { thuongHieu: nextTH });
    const updated = getInventoryByMaVT(v.maVT);
    if (updated) {
      try {
        await upsertInventoryItem(updated);
      } catch (error) {
        console.error("Lỗi sync supabase:", error);
      }
    }
    refresh();
    toast.success(`Đã chuyển ${v.maVT} sang "${nextLabel}"`);
  };

  const handleTruKho = (phieuId: string) => {
    const p = ALL_REAL_PHIEU.find((x) => x.id === phieuId);
    if (!p) return;
    const results = truTonKho(p, user);
    if (results[0]?.ok) {
      toast.success(results[0].message);
      refresh();
    } else {
      toast.error(results[0]?.message || "Lỗi");
    }
  };

  const handleTruAllCAT = () => {
    if (!confirm(`Trừ tồn kho cho tất cả phiếu Cắt (6 LSX)?`)) return;
    let count = 0;
    ALL_REAL_PHIEU
      .filter((p) => p.id.startsWith("CAT_"))
      .forEach((p) => {
        const r = truTonKho(p, user);
        if (r[0]?.ok) count++;
      });
    toast.success(`✅ Đã trừ kho cho ${count} phiếu cắt`);
    refresh();
  };

  const handleNhapKho = (maVT: string) => {
    // Mở Modal thay vì dùng prompt() (chuẩn hoá form nhập liệu)
    setShowNhap(maVT);
  };

  // Báo cáo theo LSX
  const baoCao: BaoCaoVai[] = baoCaoVaiTheoLSX(ALL_REAL_PHIEU, baoCaoLenSX);
  const lenhSXVailable = Array.from(new Set(ALL_REAL_PHIEU.map((p) => p.lenhSX)));

  return (
    <div className="space-y-5 animate-fade-in w-full max-w-full pb-10">
      <div className="w-full max-w-[1800px] mx-auto px-2 sm:px-4 md:px-6 space-y-5">
        {/* ============ HEADER TỔNG QUAN KHO VẢI THÀNH PHẨM (PREMIUM HEADER) ============ */}
        <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-cyan-800 rounded-3xl p-5 md:p-6 text-white shadow-lg border border-teal-600/30">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-teal-200/90 mb-1 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" /> MIMIN ERP · KHO & NGUYÊN PHỤ LIỆU
              </div>
              <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2.5 drop-shadow-sm">
                <Package className="w-7 h-7 text-teal-200" /> Kho Vải Thành Phẩm & Định Mức Vải
              </h1>
              <p className="text-xs sm:text-sm text-teal-100/90 mt-1 max-w-2xl font-medium">
                Quản lý tồn kho {inventory.length} loại vải · Quy đổi chi phí 3 khâu chuẩn Sợi - Dệt - Nhuộm · Tự động trừ tồn kho khi cắt
              </p>
            </div>

            {/* Quick Action buttons */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
              <button
                type="button"
                onClick={refresh}
                className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white font-bold text-xs sm:text-sm transition flex items-center gap-1.5 backdrop-blur-sm cursor-pointer shadow-xs"
                title="Làm mới và đồng bộ lại dữ liệu tồn kho"
              >
                <RefreshCw className="w-4 h-4" /> Đồng bộ
              </button>
              <button
                type="button"
                onClick={handleTruAllCAT}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold text-xs sm:text-sm transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="Trừ vải xuất cho tất cả 6 LSX lệnh cắt"
              >
                <Scissors className="w-4 h-4" /> Trừ vải cắt
              </button>
              <button
                type="button"
                onClick={() => setTab("danhmuc")}
                className="px-4 py-2 rounded-xl bg-white hover:bg-teal-50 text-teal-800 font-bold text-xs sm:text-sm transition flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Thêm vải mới
              </button>
            </div>
          </div>

                    {/* 4 THẺ KPI TỔNG QUAN */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-5">
            {/* Card 1: Tổng tồn kho */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white/10 hover:bg-white/15 transition backdrop-blur-md border border-white/15 min-h-[125px] flex flex-col justify-between shadow-sm">
              <div className="text-xs font-semibold text-teal-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-teal-300" /> Tổng Tồn Kho Vải
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-teal-500/20 text-teal-200 border border-teal-400/30">
                  Kho vải
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-2 font-mono">
                <span className="text-2xl lg:text-3xl font-black text-white">
                  {(totalTonKho / 1000).toFixed(1)}
                </span>
                <span className="text-xs font-bold text-teal-200 uppercase">tấn</span>
              </div>
              <div className="text-xs text-teal-100/85 font-medium mt-1 leading-normal">
                {totalTonKho.toLocaleString()} kg · ≈ {(totalTonKho / 20).toFixed(0)} cây vải
              </div>
            </div>

            {/* Card 2: Giá trị tồn */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white/10 hover:bg-white/15 transition backdrop-blur-md border border-white/15 min-h-[125px] flex flex-col justify-between shadow-sm">
              <div className="text-xs font-semibold text-teal-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-300" /> Tổng Giá Trị Tồn Kho
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  Giá trị kho
                </span>
              </div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-black mt-2 font-mono text-emerald-200 truncate" title={formatVND(totalDonGia)}>
                {formatVND(totalDonGia)}
              </div>
              <div className="text-xs text-teal-100/85 font-medium mt-1 leading-normal">
                Đơn giá quy đổi chuẩn 3 khâu Sợi - Dệt - Nhuộm
              </div>
            </div>

            {/* Card 3: Phân loại thương hiệu */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white/10 hover:bg-white/15 transition backdrop-blur-md border border-white/15 min-h-[125px] flex flex-col justify-between shadow-sm">
              <div className="text-xs font-semibold text-teal-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-cyan-300" /> Phân Loại Thương Hiệu
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-cyan-500/20 text-cyan-200 border border-cyan-400/30">
                  Thương hiệu
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-2 font-mono">
                <span className="text-2xl lg:text-3xl font-black text-indigo-200">{thuongHieuCounts.manpj}</span>
                <span className="text-sm opacity-60">/</span>
                <span className="text-2xl lg:text-3xl font-black text-emerald-200">{thuongHieuCounts.polomimin}</span>
                <span className="text-xs font-semibold text-teal-100/80 ml-1">loại vải</span>
              </div>
              <div className="text-xs text-teal-100/85 font-medium mt-1 leading-normal">
                👔 {thuongHieuCounts.manpj} ManPJ · 👕 {thuongHieuCounts.polomimin} Polomimin
              </div>
            </div>

            {/* Card 4: Tình trạng tồn */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white/10 hover:bg-white/15 transition backdrop-blur-md border border-white/15 min-h-[125px] flex flex-col justify-between shadow-sm">
              <div className="text-xs font-semibold text-teal-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-300" /> Cảnh Báo Tồn Kho
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-200 border border-amber-400/30">
                  Cảnh báo
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-2 font-mono text-amber-200">
                <span className="text-2xl lg:text-3xl font-black">
                  {stockStats.sapHet + stockStats.hetHang}
                </span>
                <span className="text-xs font-bold text-white">loại vải</span>
              </div>
              <div className="text-xs text-teal-100/85 font-medium mt-1 leading-normal">
                {stockStats.sapHet > 0 ? (stockStats.sapHet + " sắp hết (<100kg)") : "Không có sắp hết"} · {stockStats.hetHang} hết hàng
              </div>
            </div>
          </div>

          {/* TAB NAVIGATION */}
          <div className="flex overflow-x-auto no-scrollbar tab-scroll-mobile gap-1.5 bg-black/20 backdrop-blur-md rounded-2xl p-1.5 mt-5 border border-white/15">
            {[
              { key: "thanhpham", label: "Vải thành phẩm", icon: <Package className="w-4 h-4" />, count: inventory.length },
              { key: "menhuom", label: "Khu mẻ nhuộm", icon: <Layers className="w-4 h-4" /> },
              { key: "moc", label: "Vải mộc", icon: <Factory className="w-4 h-4" />, count: vaiMoc.length },
              { key: "tinhman", label: "Định mức vải", icon: <Calculator className="w-4 h-4" /> },
              { key: "baocao", label: "Báo cáo vải", icon: <BarChart3 className="w-4 h-4" /> },
              { key: "lichsu", label: "Lịch sử GD", icon: <History className="w-4 h-4" />, count: giaoDich.length },
              { key: "danhmuc", label: "Danh mục vải", icon: <Plus className="w-4 h-4" /> },
            ].map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key as any)}
                  className={`shrink-0 px-3.5 py-2 text-xs sm:text-sm rounded-xl flex items-center gap-2 font-bold transition-all ${
                    active
                      ? "bg-white text-teal-800 shadow-md"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {t.icon}
                  <span>{t.label}</span>
                  {typeof t.count === "number" && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                        active ? "bg-teal-100 text-teal-800 font-bold" : "bg-white/20 text-white"
                      }`}
                    >
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ============ TAB: VẢI THÀNH PHẨM ============ */}
        {tab === "thanhpham" && (
          <>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

            {/* BỘ LỌC TÌM KIẾM NÂNG CAO */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3.5">
              {/* HÀNG 1: PHÂN LOẠI THƯƠNG HIỆU & TÌNH TRẠNG KHO */}
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
                {/* Thương hiệu */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
                    Thương hiệu:
                  </span>
                  <button
                    type="button"
                    onClick={() => setThuongHieuFilter("ALL")}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition border ${
                      thuongHieuFilter === "ALL"
                        ? "bg-slate-800 text-white border-slate-800 dark:bg-slate-100 dark:text-slate-900 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span>Tất cả</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 dark:bg-slate-900/20 font-mono">
                      {thuongHieuCounts.all}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setThuongHieuFilter("manpj")}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition border ${
                      thuongHieuFilter === "manpj"
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100/60"
                    }`}
                  >
                    <span>👔 Vải ManPJ</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
                      {thuongHieuCounts.manpj}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setThuongHieuFilter("polomimin")}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition border ${
                      thuongHieuFilter === "polomimin"
                        ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                        : "bg-teal-50/60 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800 hover:bg-teal-100/60"
                    }`}
                  >
                    <span>👕 Vải Polomimin</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
                      {thuongHieuCounts.polomimin}
                    </span>
                  </button>
                </div>

                {/* Tình trạng tồn kho */}
                <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto overflow-x-auto no-scrollbar">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
                    Tình trạng:
                  </span>
                  {[
                    { id: "ALL", label: "Tất cả mức tồn" },
                    { id: "DOI_DAO", label: "Dồi dào (>300kg)", dot: "bg-emerald-500" },
                    { id: "BINH_THUONG", label: "Bình thường", dot: "bg-teal-500" },
                    { id: "SAP_HET", label: "Sắp hết (<100kg)", dot: "bg-amber-500" },
                    { id: "HET_HANG", label: "Hết hàng (0kg)", dot: "bg-rose-500" },
                  ].map((item) => {
                    const active = tonKhoFilter === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setTonKhoFilter(item.id as any)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 border cursor-pointer ${
                          active
                            ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 shadow-xs"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {item.dot && <span className={`w-2 h-2 rounded-full ${item.dot}`} />}
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* HÀNG 2: TÌM KIẾM, CHỌN LOẠI VẢI, SẮP XẾP, RESET */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                {/* Ô tìm kiếm */}
                <div className="lg:col-span-5 relative">
                  <div className="relative flex items-center">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                    <input
                      type="text"
                      value={searchVai}
                      onChange={(e) => setSearchVai(e.target.value)}
                      placeholder="Tìm theo mã vải (VAI-01...), tên vải (Cá sấu...), màu sắc..."
                      className="w-full pl-9 pr-8 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium placeholder:text-slate-400 text-slate-800 dark:text-slate-100 transition"
                    />
                    {searchVai && (
                      <button
                        type="button"
                        onClick={() => setSearchVai("")}
                        className="absolute right-2.5 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Lọc loại vải */}
                <div className="lg:col-span-3">
                  <select
                    value={loaiVaiFilter}
                    onChange={(e) => setLoaiVaiFilter(e.target.value)}
                    className="w-full py-2 px-3 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <option value="ALL">-- Tất cả loại vải ({loaiVaiOptions.length}) --</option>
                    {loaiVaiOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sắp xếp */}
                <div className="lg:col-span-3">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full py-2 px-3 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <option value="ma_asc">Sắp xếp: Mã vải (VAI-01 → VAI-41)</option>
                    <option value="ton_desc">Sắp xếp: Tồn kho nhiều nhất</option>
                    <option value="ton_asc">Sắp xếp: Tồn kho ít nhất</option>
                    <option value="gia_desc">Sắp xếp: Đơn giá cao nhất</option>
                    <option value="gia_asc">Sắp xếp: Đơn giá thấp nhất</option>
                    <option value="ten_asc">Sắp xếp: Tên loại vải (A - Z)</option>
                  </select>
                </div>

                {/* Reset Filters button */}
                <div className="lg:col-span-1 flex items-center">
                  {hasActiveFilters ? (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="w-full py-2 px-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-300 hover:bg-rose-100 font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                      title="Đặt lại tất cả bộ lọc"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="sm:inline">Xóa</span>
                    </button>
                  ) : (
                    <div className="w-full text-center text-[11px] text-slate-400 font-medium py-2">
                      Mặc định
                    </div>
                  )}
                </div>
              </div>

              {/* HÀNG 3: KẾT QUẢ ĐẾM & CÁC NÚT HÀNH ĐỘNG NHẬP / TẠO MỚI / CHẾ ĐỘ XEM */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2">
                  <span>
                    Hiển thị: <b className="text-teal-700 dark:text-teal-400 text-sm font-mono">{filteredInventory.length}</b> / {inventory.length} loại vải
                  </span>
                  <span>•</span>
                  <span>
                    Tổng tồn lọc: <b className="text-slate-800 dark:text-slate-200 font-mono font-bold">{filteredTonKho.toLocaleString()} kg</b> (≈ {(filteredTonKho / 20).toFixed(0)} cây)
                  </span>
                  <span>•</span>
                  <span>
                    Trị giá: <b className="text-emerald-700 dark:text-emerald-400 font-mono font-bold">{formatVND(filteredThanhTien)}</b>
                  </span>
                </div>

                {/* CÁC NÚT HÀNH ĐỘNG NHẬP VẢI & TẠO MÃ & TOGGLE VIEW */}
                <div className="shrink-0 flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                  <button
                    type="button"
                    onClick={() => setShowNhap(filteredInventory[0]?.maVT || inventory[0]?.maVT || "VAI-01")}
                    className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition hover:scale-105 cursor-pointer"
                    title="Mở phiếu nhập kho vải mới & tính giá 3 khâu"
                  >
                    <ArrowDownToLine className="w-4 h-4 stroke-[2.5]" />
                    <span>+ Nhập Kho Vải</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowTaoMa(true)}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition hover:scale-105 cursor-pointer"
                    title="Thêm quy cách / mã vải mới vào danh mục"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>+ Thêm Vải Mới</span>
                  </button>

                  <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

                  <DataViewToggle value={viewMode} onChange={handleViewModeChange} modes={["list", "card"]} />
                </div>
              </div>
            </div>

            {/* ============ NỘI DUNG: DẠNG DANH SÁCH (TABLE) HOẶC DẠNG THẺ (CARD) ============ */}
            {viewMode === "list" ? (
              /* DẠNG DANH SÁCH (TABLE VIEW) CHUẨN ERP */
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm border-collapse">
                    <thead className="bg-slate-50/90 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-2.5 text-center w-9 whitespace-nowrap">#</th>
                        <th className="py-3 px-3 whitespace-nowrap">Mã Vải</th>
                        <th className="py-3 px-3.5 whitespace-nowrap">Hình ảnh & Màu Sắc</th>
                        <th className="py-3 px-3.5 whitespace-nowrap">Tên Loại Vải</th>
                        <th className="py-3 px-2.5 text-center whitespace-nowrap">Phân Loại</th>
                        <th className="py-3 px-3.5 text-right whitespace-nowrap">Tồn Kho & Quy Đổi</th>
                        <th className="py-3 px-3 text-right whitespace-nowrap">Đơn Giá (/kg)</th>
                        <th className="py-3 px-3.5 text-right whitespace-nowrap">Thành Tiền</th>
                        <th className="py-3 px-2.5 text-center whitespace-nowrap">Tình Trạng</th>
                        <th className="py-3 px-3 text-center whitespace-nowrap sticky right-0 bg-slate-100 dark:bg-slate-800 z-20 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.08)] min-w-[150px]">
                          Thao Tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredInventory.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-12 text-center text-slate-400">
                            <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                            Không tìm thấy loại vải nào phù hợp với bộ lọc hiện tại.
                          </td>
                        </tr>
                      ) : (
                        filteredInventory.map((v, index) => {
                          const validDonGia = getValidDonGiaVai(v);
                          const thanhTien = v.tonKho * validDonGia;
                          const isManPJ = detectThuongHieuVai(v) === "manpj";
                          const imgUrl = getEffectiveVaiImage(v);

                          return (
                            <tr
                              key={v.maVT}
                              className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group"
                            >
                              {/* STT */}
                              <td className="py-3 px-2.5 text-center text-xs font-bold text-slate-400 whitespace-nowrap">
                                {index + 1}
                              </td>

                              {/* Mã Vải */}
                              <td className="py-3 px-3 whitespace-nowrap">
                                <span className="font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 whitespace-nowrap inline-block">
                                  {v.maVT}
                                </span>
                              </td>

                              {/* Hình ảnh & Màu Sắc */}
                              <td className="py-3 px-3.5 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <div
                                    className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 cursor-pointer relative group/img bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-xs"
                                    style={{ backgroundColor: imgUrl ? "transparent" : getColorHex(v.mauSac) }}
                                    onClick={() => {
                                      if (imgUrl) setZoomImage({ src: imgUrl, alt: `${v.tenVT} - ${v.mauSac}` });
                                      else {
                                        setUploadingVT(v.maVT);
                                        fileInputRef.current?.click();
                                      }
                                    }}
                                    title="Bấm để phóng to ảnh hoặc tải ảnh mới"
                                  >
                                    {imgUrl ? (
                                      <img src={imgUrl} alt={v.mauSac} className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="text-[9px] font-bold text-white/90 drop-shadow-sm">+ Ảnh</span>
                                    )}
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center text-white">
                                      <Eye className="w-3.5 h-3.5" />
                                    </div>
                                  </div>

                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                                      <span
                                        className="w-3 h-3 rounded-full border border-slate-300 dark:border-slate-600 shadow-xs shrink-0"
                                        style={{ backgroundColor: getColorHex(v.mauSac) }}
                                      />
                                      <span className="font-bold text-slate-800 dark:text-slate-100 text-xs truncate">
                                        {v.mauSac}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5 whitespace-nowrap">
                                      {v.maVT}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Tên loại vải */}
                              <td className="py-3 px-3.5 whitespace-nowrap">
                                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                                  {v.tenVT}
                                </span>
                              </td>

                              {/* Phân loại thương hiệu */}
                              <td className="py-3 px-2.5 text-center whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={(e) => handleToggleThuongHieu(v, e)}
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition cursor-pointer hover:scale-105 active:scale-95 shadow-xs whitespace-nowrap shrink-0 ${
                                    isManPJ
                                      ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800"
                                      : "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800"
                                  }`}
                                  title="Bấm để chuyển đổi phân loại giữa Vải ManPJ và Vải Polomimin"
                                >
                                  <span>{isManPJ ? "👔" : "👕"}</span>
                                  <span>{isManPJ ? "Vải ManPJ" : "Vải Polomimin"}</span>
                                </button>
                              </td>

                              {/* Tồn kho (kg) & Quy đổi hợp nhất */}
                              <td className="py-3 px-3.5 text-right whitespace-nowrap">
                                <div className="inline-flex flex-col items-end gap-0.5">
                                  <div className="inline-flex items-baseline gap-1">
                                    <span className={`font-mono font-black text-sm md:text-base ${getTonKhoColor(v.tonKho)}`}>
                                      {v.tonKho.toLocaleString()}
                                    </span>
                                    <span className="text-[11px] font-semibold text-slate-400">kg</span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                                    ≈ {(v.tonKho / 20).toFixed(1)} cây · {(v.tonKho * 2).toFixed(0)}m
                                  </span>
                                </div>
                              </td>

                              {/* Đơn giá */}
                              <td className="py-3 px-3 text-right whitespace-nowrap">
                                <div className="inline-flex items-baseline gap-1">
                                  <span className="font-mono font-bold text-xs text-slate-700 dark:text-slate-300">
                                    {formatVND(validDonGia)}
                                  </span>
                                  <span className="text-[10px] text-slate-400">/kg</span>
                                </div>
                              </td>

                              {/* Thành tiền */}
                              <td className="py-3 px-3.5 text-right whitespace-nowrap">
                                <span className="font-mono font-bold text-xs text-teal-700 dark:text-teal-400">
                                  {formatVND(thanhTien)}
                                </span>
                              </td>

                              {/* Tình trạng */}
                              <td className="py-3 px-2.5 text-center whitespace-nowrap">
                                {getTonKhoBadge(v.tonKho)}
                              </td>

                              {/* Thao tác (CỐ ĐỊNH PHẢI - KHÔNG BAO GIỜ BỊ CHE KHUẤT) */}
                              <td className="py-2.5 px-3 text-center whitespace-nowrap sticky right-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)]">
                                <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => handleNhapKho(v.maVT)}
                                    className="px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition hover:scale-105 cursor-pointer whitespace-nowrap shrink-0"
                                    title="Mở phiếu nhập kho vải & quy đổi giá 3 khâu"
                                  >
                                    <ArrowDownToLine className="w-3.5 h-3.5 stroke-[2.5]" />
                                    <span>+ Nhập</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditForm({ ...v, thuongHieu: v.thuongHieu || detectThuongHieuVai(v) });
                                      setEditingVT(v.maVT);
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs flex items-center gap-1 shadow-sm transition hover:scale-105 cursor-pointer whitespace-nowrap shrink-0"
                                    title="Chỉnh sửa thông tin loại vải này"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>Sửa</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    {filteredInventory.length > 0 && (
                      <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-bold text-xs border-t-2 border-slate-200 dark:border-slate-700">
                        <tr>
                          <td colSpan={5} className="py-3 px-4 text-slate-600 dark:text-slate-300">
                            Tổng cộng ({filteredInventory.length} loại vải đang hiển thị):
                          </td>
                          <td className="py-3 px-3.5 text-right font-mono text-sm text-teal-700 dark:text-teal-400">
                            <div>{filteredTonKho.toLocaleString()} kg</div>
                            <div className="text-[10px] text-slate-400 font-normal">≈ {(filteredTonKho / 20).toFixed(0)} cây</div>
                          </td>
                          <td className="py-3 px-3 text-right text-slate-400">—</td>
                          <td className="py-3 px-3.5 text-right font-mono text-sm text-emerald-700 dark:text-emerald-400">
                            {formatVND(filteredThanhTien)}
                          </td>
                          <td className="py-3 px-2.5 text-slate-400 text-center">—</td>
                          <td className="py-3 px-3 text-center sticky right-0 bg-slate-50 dark:bg-slate-800 z-10 font-bold text-teal-700">
                            MIMIN
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            ) : (
              /* DẠNG THẺ (CARD VIEW) HIỆN ĐẠI */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredInventory.map((v) => {
                  const isEditing = editingVT === v.maVT;
                  const validDonGia = getValidDonGiaVai(v);
                  const thanhTien = v.tonKho * validDonGia;
                  const isManPJ = detectThuongHieuVai(v) === "manpj";
                  const imgUrl = getEffectiveVaiImage(v);

                  return (
                    <div
                      key={v.maVT}
                      className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-teal-400 dark:hover:border-teal-600 transition-all relative flex flex-col justify-between"
                    >
                      <div>
                        {/* Top row: ID and actions */}
                        <div className="flex justify-between items-center mb-3 gap-2">
                          <div className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md text-xs font-mono font-bold text-slate-700 dark:text-slate-300 tracking-wider">
                            {v.maVT}
                          </div>

                          <button
                            type="button"
                            onClick={(e) => handleToggleThuongHieu(v, e)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition cursor-pointer hover:scale-105 active:scale-95 shadow-xs ${
                              isManPJ
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800"
                                : "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800"
                            }`}
                            title="Bấm để chuyển đổi phân loại giữa Vải ManPJ và Vải Polomimin"
                          >
                            <span>{isManPJ ? "👔" : "👕"}</span>
                            <span>{isManPJ ? "Vải ManPJ" : "Vải Polomimin"}</span>
                          </button>
                        </div>

                        {/* Image & swatch */}
                        <div className="flex flex-col gap-3 mb-3 relative group/imgwrap">
                          <div
                            className="w-full h-40 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner overflow-hidden cursor-pointer relative group/img flex items-center justify-center bg-slate-100 dark:bg-slate-800 transition"
                            style={{ backgroundColor: imgUrl ? "transparent" : getColorHex(v.mauSac) }}
                            onClick={() => {
                              if (imgUrl) setZoomImage({ src: imgUrl, alt: `${v.tenVT} - ${v.mauSac}` });
                              else {
                                setUploadingVT(v.maVT);
                                fileInputRef.current?.click();
                              }
                            }}
                            title="Bấm để xem ảnh lớn hoặc tải ảnh mới"
                          >
                            {imgUrl ? (
                              <img src={imgUrl} alt={v.mauSac} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs text-white/90 font-bold drop-shadow-md">+ Thêm ảnh</span>
                            )}
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setUploadingVT(v.maVT);
                                fileInputRef.current?.click();
                              }}
                              className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center text-xs"
                              title="Đổi ảnh vải"
                            >
                              +
                            </button>
                          </div>

                          {/* Title & color info */}
                          <div className="w-full min-w-0">
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 leading-snug truncate text-sm" title={v.tenVT}>
                              {v.tenVT}
                            </h3>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5 truncate">
                                <span
                                  className="w-3 h-3 rounded-full border border-slate-300 dark:border-slate-600 shrink-0"
                                  style={{ backgroundColor: getColorHex(v.mauSac) }}
                                />
                                <span className="font-medium truncate">{v.mauSac}</span>
                              </p>
                              {getTonKhoBadge(v.tonKho)}
                            </div>
                          </div>
                        </div>

                        {/* Stats Box: Tồn kho & Quy đổi */}
                        <div className="grid grid-cols-2 gap-2 mb-3 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                          <div>
                            <div className="text-[11px] text-slate-400 font-semibold mb-0.5">Tồn kho</div>
                            <div className={`font-mono font-black text-lg ${getTonKhoColor(v.tonKho)}`}>
                              {v.tonKho.toLocaleString()} <span className="text-[11px] font-normal text-slate-400">kg</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[11px] text-slate-400 font-semibold mb-0.5">Quy đổi</div>
                            <div className="font-bold text-xs text-slate-700 dark:text-slate-200">
                              ≈ {(v.tonKho / 20).toFixed(1)} cây
                            </div>
                            <div className="text-[10px] text-slate-400">
                              ≈ {(v.tonKho * 3.2).toFixed(0)} m
                            </div>
                          </div>
                        </div>

                        {/* Price Box */}
                        <div className="flex items-center justify-between text-xs py-1.5 px-2 bg-teal-50/50 dark:bg-teal-950/20 rounded-lg border border-teal-100 dark:border-teal-900/40 mb-3">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Đơn giá</span>
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                              {formatVND(validDonGia)}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block">Thành tiền</span>
                            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                              {formatVND(thanhTien)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingVT(v.maVT)}
                          className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                          title="Chỉnh sửa chi tiết loại vải & nguồn giá 3 khâu"
                        >
                          <Edit3 className="w-3 h-3" /> Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleNhapKho(v.maVT)}
                          className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition cursor-pointer"
                        >
                          <ArrowDownToLine className="w-3 h-3" /> + Nhập
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

      {tab === "menhuom" && <FabricDyeLotZones inventory={inventory} />}

      {tab === "moc" && (
        <div className="space-y-4">
          <div className="card p-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Kho vải mộc</h2>
              <p className="text-sm text-slate-500">Nhận từ xưởng dệt · chờ nhuộm · theo dõi hao hụt và số cây</p>
            </div>
            <div className="text-right"><div className="text-2xl font-black text-teal-700">{vaiMoc.reduce((sum, item) => sum + item.soKg, 0).toLocaleString()} kg</div><div className="text-xs text-slate-500">{vaiMoc.length} lô mộc</div></div>
          </div>
          {vaiMoc.length === 0 ? (
            <div className="card p-10 text-center text-sm text-slate-500">Chưa có vải mộc. Vải mộc sẽ xuất hiện sau khi nghiệm thu lệnh dệt.</div>
          ) : (
            <div className="card overflow-x-auto"><table className="w-full min-w-[700px] text-sm"><thead className="bg-slate-100 text-slate-600"><tr><th className="p-3 text-left">Mã lô mộc</th><th className="p-3 text-left">Lệnh dệt</th><th className="p-3 text-left">Loại vải</th><th className="p-3 text-right">Kg mộc</th><th className="p-3 text-right">Số cây</th><th className="p-3 text-right">Kg lỗi</th><th className="p-3 text-left">Trạng thái</th></tr></thead><tbody className="divide-y divide-slate-100">{vaiMoc.map(item => <tr key={item.id}><td className="p-3 font-mono font-bold text-teal-700">{item.maLoMoc || item.id}</td><td className="p-3">{item.maLenhDet || "-"}</td><td className="p-3">{item.loaiVai || "Vải mộc"}</td><td className="p-3 text-right font-bold">{item.soKg.toLocaleString()} kg</td><td className="p-3 text-right">{item.soCay}</td><td className="p-3 text-right text-rose-600">{item.soKgLoi}</td><td className="p-3"><span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">{item.trangThai || "Chờ nhuộm"}</span></td></tr>)}</tbody></table></div>
          )}
        </div>
      )}

      {/* Tab: Tính màn */}
      {tab === "tinhman" && (
        <>
          <div className="card p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Calculator className="w-5 h-5 text-violet-500" /> Tính định mức vải (m/cái)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs opacity-70">Sản phẩm</label>
                <select
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                >
                  {TINH_MAN_PHAN_LOAI.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs opacity-70">Tổng SL giao</label>
                <input
                  type="number"
                  value={soLuong}
                  onChange={(e) => setSoLuong(parseInt(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                />
              </div>
              <div>
                <label className="text-xs opacity-70">Size (phân cách bằng , hoặc /)</label>
                <input
                  type="text"
                  value={sizeStr}
                  onChange={(e) => setSizeStr(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Kết quả */}
          <div className="card p-4 space-y-3">
            <h3 className="font-semibold">📊 Kết quả tính màn</h3>
            {tinh.warning && (
              <div className="p-3 rounded bg-amber-500/10 border border-amber-500/30 text-sm">
                <AlertCircle className="w-4 h-4 inline mr-1" /> {tinh.warning}
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <div className="text-xs opacity-70">Mét gốc</div>
                <div className="text-2xl font-bold text-blue-600">{tinh.soMetGoc}m</div>
              </div>
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                <div className="text-xs opacity-70">Hao hụt ({tinh.tyLeHaoHut}%)</div>
                <div className="text-2xl font-bold text-amber-600">+{tinh.soMetHaoHut}m</div>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                <div className="text-xs opacity-70">Tổng cần</div>
                <div className="text-2xl font-bold text-emerald-600">{tinh.soMetCan}m</div>
              </div>
              <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-900/20">
                <div className="text-xs opacity-70">Quy ra kg (×0.25)</div>
                <div className="text-2xl font-bold text-violet-600">{(tinh.soMetCan * 0.25).toFixed(1)}kg</div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-sm">
                <thead className="bg-slate-100 dark:bg-slate-800">
                  <tr>
                    <th className="p-2 text-left">Size</th>
                    <th className="p-2 text-right">SL</th>
                    <th className="p-2 text-right">Định mức (m/cái)</th>
                    <th className="p-2 text-right">Tổng (m)</th>
                  </tr>
                </thead>
                <tbody>
                  {tinh.chiTiet.map((c) => (
                    <tr key={c.size} className="border-t border-slate-200 dark:border-slate-700">
                      <td className="p-2 font-bold">{c.size}</td>
                      <td className="p-2 text-right">{c.sl}</td>
                      <td className="p-2 text-right">{c.dinhMuc}</td>
                      <td className="p-2 text-right font-semibold text-emerald-600">{c.tong}m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Tab: Báo cáo vải */}
      {tab === "baocao" && (
        <>
          <div className="card p-4 flex items-center gap-3">
            <label className="text-sm font-semibold">Lệnh SX:</label>
            <select
              value={baoCaoLenSX}
              onChange={(e) => setBaoCaoLenSX(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
            >
              {lenhSXVailable.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800">
                <tr>
                  <th className="p-2 text-left">Phiếu</th>
                  <th className="p-2 text-left">SP</th>
                  <th className="p-2 text-left">Loại</th>
                  <th className="p-2 text-left">Màu</th>
                  <th className="p-2 text-left">Vải</th>
                  <th className="p-2 text-right">Cần (m)</th>
                  <th className="p-2 text-right">Đạt (m)</th>
                  <th className="p-2 text-right">Hao hụt (m)</th>
                  <th className="p-2 text-right">Đơn giá</th>
                  <th className="p-2 text-right">Tiền vải</th>
                </tr>
              </thead>
              <tbody>
                {baoCao.map((r) => (
                  <tr key={r.phieuId} className="border-t border-slate-200 dark:border-slate-700">
                    <td className="p-2 font-mono text-xs">{r.phieuId}</td>
                    <td className="p-2 font-mono">{r.maSP}</td>
                    <td className="p-2 text-xs">{r.phanLoai}</td>
                    <td className="p-2 text-xs">{r.mau}</td>
                    <td className="p-2 text-xs">{r.vai}</td>
                    <td className="p-2 text-right font-semibold">{r.soMetCan}m</td>
                    <td className="p-2 text-right text-emerald-600">{r.soMetDat}m</td>
                    <td className="p-2 text-right text-rose-600">{r.soMetTon}m</td>
                    <td className="p-2 text-right text-xs">{r.donGiaVai.toLocaleString()}</td>
                    <td className="p-2 text-right font-bold text-violet-600">{(r.tienVai / 1000).toFixed(0)}K</td>
                  </tr>
                ))}
                <tr className="bg-slate-50 dark:bg-slate-800/50 font-semibold">
                  <td colSpan={5} className="p-2 text-right">TỔNG</td>
                  <td className="p-2 text-right">{baoCao.reduce((s, r) => s + r.soMetCan, 0).toFixed(0)}m</td>
                  <td className="p-2 text-right text-emerald-600">{baoCao.reduce((s, r) => s + r.soMetDat, 0).toFixed(0)}m</td>
                  <td className="p-2 text-right text-rose-600">{baoCao.reduce((s, r) => s + r.soMetTon, 0).toFixed(0)}m</td>
                  <td></td>
                  <td className="p-2 text-right text-violet-600">{(baoCao.reduce((s, r) => s + r.tienVai, 0) / 1_000_000).toFixed(2)}tr</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Tab: Lịch sử Giao dịch */}
      {tab === "lichsu" && (
        <>
          {/* Filter bar */}
          <div className="card p-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400">
              <Filter className="w-4 h-4" /> Lọc:
            </div>
            {(["TAT_CA", "NHAP", "XUAT"] as const).map((loai) => (
              <button
                key={loai}
                onClick={() => setFilterLoaiGD(loai)}
                className={`px-3 py-1.5 text-xs rounded-lg font-bold transition-all ${
                  filterLoaiGD === loai
                    ? loai === "NHAP" ? "bg-emerald-500 text-white shadow-sm" : loai === "XUAT" ? "bg-rose-500 text-white shadow-sm" : "bg-teal-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                }`}
              >
                {loai === "TAT_CA" ? "Tất cả" : loai === "NHAP" ? "📥 Nhập kho" : "📤 Xuất kho"}
                {loai !== "TAT_CA" && (
                  <span className="ml-1.5 opacity-80">
                    ({giaoDich.filter(g => g.loai === loai).length})
                  </span>
                )}
              </button>
            ))}
            <div className="flex items-center gap-2 ml-auto">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm mã vải, tên..."
                className="text-sm bg-transparent outline-none text-slate-700 dark:text-slate-300 placeholder:text-slate-400"
                value={searchVai}
                onChange={(e) => setSearchVai(e.target.value)}
              />
            </div>
          </div>

          {/* KPI tổng hợp */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="card p-3 text-center">
              <div className="text-xs text-slate-500 mb-1">Tổng GD</div>
              <div className="text-2xl font-black text-slate-800 dark:text-white">{giaoDich.length}</div>
            </div>
            <div className="card p-3 text-center">
              <div className="text-xs text-slate-500 mb-1 flex items-center justify-center gap-1"><ArrowDownToLine className="w-3 h-3 text-emerald-500" />Nhập</div>
              <div className="text-2xl font-black text-emerald-600">{giaoDich.filter(g => g.loai === "NHAP").length}</div>
            </div>
            <div className="card p-3 text-center">
              <div className="text-xs text-slate-500 mb-1 flex items-center justify-center gap-1"><ArrowUpFromLine className="w-3 h-3 text-rose-500" />Xuất</div>
              <div className="text-2xl font-black text-rose-600">{giaoDich.filter(g => g.loai === "XUAT").length}</div>
            </div>
            <div className="card p-3 text-center">
              <div className="text-xs text-slate-500 mb-1">Tổng giá trị nhập</div>
              <div className="text-lg font-black text-violet-600">
                {formatVND(giaoDich.filter(g => g.loai === "NHAP").reduce((s: number, g: any) => s + (g.thanhTien || 0), 0))}
              </div>
            </div>
          </div>

          {/* Bảng giao dịch */}
          <div className="card overflow-hidden">
            {giaoDich.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <History className="w-12 h-12 mb-3 opacity-30" />
                <p className="font-medium">Chưa có giao dịch nào</p>
                <p className="text-sm mt-1">Nhập kho hoặc xuất kho để thấy lịch sử ở đây</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="py-3 px-4 text-left font-semibold">Mã GD</th>
                      <th className="py-3 px-4 text-left font-semibold">Loại</th>
                      <th className="py-3 px-4 text-left font-semibold">Ngày</th>
                      <th className="py-3 px-4 text-left font-semibold">Mã Vải</th>
                      <th className="py-3 px-4 text-left font-semibold">Tên Vải</th>
                      <th className="py-3 px-4 text-right font-semibold">SL (kg)</th>
                      <th className="py-3 px-4 text-right font-semibold">Đơn giá</th>
                      <th className="py-3 px-4 text-right font-semibold">Thành tiền</th>
                      <th className="py-3 px-4 text-left font-semibold">Nguồn / Ghi chú</th>
                      <th className="py-3 px-4 text-left font-semibold">Người TH</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {giaoDich
                      .filter(g => {
                        const matchLoai = filterLoaiGD === "TAT_CA" || g.loai === filterLoaiGD;
                        const matchSearch = !searchVai || (g.maVT || "").toLowerCase().includes(searchVai.toLowerCase()) || (g.tenVT || "").toLowerCase().includes(searchVai.toLowerCase());
                        return matchLoai && matchSearch;
                      })
                      .sort((a: any, b: any) => (b.ngay || "").localeCompare(a.ngay || ""))
                      .map((g: any, idx: number) => (
                        <tr key={g.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-2.5 px-4 font-mono text-xs text-slate-500">{g.id || `GD-${idx + 1}`}</td>
                          <td className="py-2.5 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                              g.loai === "NHAP"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                                : "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400"
                            }`}>
                              {g.loai === "NHAP" ? <ArrowDownToLine className="w-3 h-3" /> : <ArrowUpFromLine className="w-3 h-3" />}
                              {g.loai}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">{g.ngay || "—"}</td>
                          <td className="py-2.5 px-4 font-mono text-xs text-teal-700 dark:text-teal-400">{g.maVT}</td>
                          <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200 max-w-[160px] truncate" title={g.tenVT}>{g.tenVT}</td>
                          <td className="py-2.5 px-4 text-right font-bold">{(g.soLuong || 0).toLocaleString()} {g.donVi || "kg"}</td>
                          <td className="py-2.5 px-4 text-right text-xs text-slate-500">{(g.donGia || 0).toLocaleString()}đ</td>
                          <td className={`py-2.5 px-4 text-right font-bold ${
                            g.loai === "NHAP" ? "text-emerald-600" : "text-rose-600"
                          }`}>
                            {formatVND(g.thanhTien || 0)}
                          </td>
                          <td className="py-2.5 px-4 text-xs text-slate-500 max-w-[140px] truncate" title={g.nguonNhap || g.ghiChu}>
                            {g.nguonNhap || g.ghiChu || "—"}
                          </td>
                          <td className="py-2.5 px-4 text-xs text-slate-500">{g.nguoiThucHien || "—"}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Tab: Quản lý danh mục */}
      {tab === "danhmuc" && (
        <div className="space-y-4">
          {/* Danh sách vải hiện có */}
          <div className="card p-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-3">
              <Package className="w-4 h-4 text-teal-600" /> Danh sách mã vải ({inventory.length} loại)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500">
                  <tr>
                    <th className="py-2 px-3 text-left">Mã Vải</th>
                    <th className="py-2 px-3 text-left">Tên Vải</th>
                    <th className="py-2 px-3 text-left">Màu</th>
                    <th className="py-2 px-3 text-right">Tồn (kg)</th>
                    <th className="py-2 px-3 text-right">Đơn giá</th>
                    <th className="py-2 px-3 text-center">Phân loại</th>
                    <th className="py-2 px-3 text-center">Ảnh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {inventory.map(v => (
                    <tr key={v.maVT} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-2 px-3 font-mono text-xs text-teal-700 dark:text-teal-400 font-bold">{v.maVT}</td>
                      <td className="py-2 px-3 font-medium">{v.tenVT}</td>
                      <td className="py-2 px-3 text-xs">
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: getColorHex(v.mauSac) }} />
                          {v.mauSac}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-bold">{v.tonKho.toFixed(0)}</td>
                      <td className="py-2 px-3 text-right text-xs">{v.donGia.toLocaleString()}đ</td>
                      <td className="py-2 px-3 text-center">
                        {(() => {
                          const isManPJ = detectThuongHieuVai(v) === "manpj";
                          return (
                            <button
                              type="button"
                              onClick={(e) => handleToggleThuongHieu(v, e)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition cursor-pointer hover:scale-105 active:scale-95 ${
                                isManPJ
                                  ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300"
                                  : "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300"
                              }`}
                              title="Bấm để chuyển đổi phân loại"
                            >
                              {isManPJ ? "👔 ManPJ" : "👕 Polomimin"}
                            </button>
                          );
                        })()}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {vaiImages[v.maVT] ? (
                          <img src={vaiImages[v.maVT]} className="w-8 h-8 rounded object-cover mx-auto" alt={v.tenVT} />
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Form tạo mã vải mới */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" /> Tạo mã vải mới
              </h3>
              <span className="text-xs text-slate-400 font-mono">Mã: VAI-{String(nextVaiNumber).padStart(2, "0")}</span>
            </div>

            {/* Ẩnh preview */}
            <input
              type="file"
              ref={newVaiImgRef}
              className="hidden"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const sharedUrl = await uploadProductFile(file, "kho-vai-moi");
                  setNewVaiForm(f => ({ ...f, previewImg: sharedUrl }));
                  toast.success("Đã tải ảnh lên Supabase Storage");
                } catch (error) {
                  toast.error(`Không tải được ảnh: ${getErrorMessage(error)}`);
                }
                if (newVaiImgRef.current) newVaiImgRef.current.value = "";
              }}
            />

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Loại vải *</label>
                  <select
                    className="input-field h-12 text-base font-semibold cursor-pointer"
                    value={newVaiForm.tenVT}
                    onChange={(e) => setNewVaiForm(f => ({ ...f, tenVT: e.target.value }))}
                  >
                    {LOAI_VAI_OPTIONS.map((loaiVai) => (
                      <option key={loaiVai} value={loaiVai}>{loaiVai}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Màu sắc *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="VD: Đỏ tươi"
                    value={newVaiForm.mauSac}
                    onChange={(e) => setNewVaiForm(f => ({ ...f, mauSac: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Ảnh màu vải</label>
                  <button
                    type="button"
                    onClick={() => newVaiImgRef.current?.click()}
                    className="w-full min-h-24 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center gap-3 cursor-pointer hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-slate-800 transition-colors overflow-hidden"
                  >
                    {newVaiForm.previewImg ? (
                      <img src={newVaiForm.previewImg} className="w-24 h-20 rounded-lg object-cover" alt="Ảnh màu vải" />
                    ) : (
                      <Plus className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="text-sm text-slate-500">{newVaiForm.previewImg ? "Đổi ảnh" : "Chọn ảnh tải lên"}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Đơn giá (đ/kg)</label>
                  <input
                    type="number"
                    min={0}
                    className="input-field"
                    placeholder="0"
                    value={newVaiForm.donGia || ""}
                    onChange={(e) => setNewVaiForm(f => ({ ...f, donGia: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Ghi chú</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Vải chính, lô mới..."
                    value={newVaiForm.ghiChu}
                    onChange={(e) => setNewVaiForm(f => ({ ...f, ghiChu: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Phân loại thương hiệu *</label>
                  <div className="grid grid-cols-2 gap-2 h-11">
                    <button
                      type="button"
                      onClick={() => setNewVaiForm(f => ({ ...f, thuongHieu: "polomimin" }))}
                      className={`rounded-xl border-2 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition ${
                        newVaiForm.thuongHieu === "polomimin"
                          ? "bg-teal-50 border-teal-500 text-teal-700 dark:bg-teal-950 dark:text-teal-300 shadow-sm"
                          : "border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      👕 Vải Polomimin
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewVaiForm(f => ({ ...f, thuongHieu: "manpj" }))}
                      className={`rounded-xl border-2 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition ${
                        newVaiForm.thuongHieu === "manpj"
                          ? "bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 shadow-sm"
                          : "border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      👔 Vải ManPJ
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewVaiForm({ tenVT: LOAI_VAI_OPTIONS[0], mauSac: "", donGia: 0, ghiChu: "", previewImg: "", thuongHieu: "polomimin" })}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Xóa form
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!newVaiForm.tenVT.trim()) { toast.error("Vui lòng nhập tên vải"); return; }
                    if (!newVaiForm.mauSac.trim()) { toast.error("Vui lòng nhập màu sắc"); return; }
                    const maVT = `VAI-${String(nextVaiNumber).padStart(2, "0")}`;
                    
                    const newVai = {
                      maVT,
                      tenVT: newVaiForm.tenVT.trim(),
                      mauSac: newVaiForm.mauSac.trim(),
                      donGia: newVaiForm.donGia || 0,
                      tonToiThieu: 0,
                      loai: "Vải",
                      dvt: "kg",
                      tonKho: 0,
                      ghiChu: newVaiForm.ghiChu.trim(),
                      imageUrl: newVaiForm.previewImg || "",
                      thuongHieu: newVaiForm.thuongHieu,
                    };

                    try {
                      await upsertInventoryItem(newVai as KhoVaiWithImage);
                    } catch (error) {
                      const message = getErrorMessage(error);
                      toast.error(`Supabase chưa nhận mã ${maVT}: ${message}. Thẻ chưa được tạo, anh bấm lưu lại.`);
                      return;
                    }

                    const ok = addNewVai(newVai as KhoVaiWithImage);
                    if (!ok) { toast.error(`Mã ${maVT} đã tồn tại!`); return; }

                    if (newVaiForm.previewImg) {
                      setVaiImages(prev => ({ ...prev, [maVT]: newVaiForm.previewImg }));
                    }
                    toast.success(`✅ Đã lưu ${maVT} và đồng bộ cho toàn hệ thống`);

                    setNewVaiForm({ tenVT: LOAI_VAI_OPTIONS[0], mauSac: "", donGia: 0, ghiChu: "", previewImg: "", thuongHieu: "polomimin" });
                    refresh();
                  }}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Lưu mã vải
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chỉnh sửa chi tiết mẻ vải: Nhà cung cấp 3 khâu (Sợi, Dệt, Nhuộm), đơn giá, tồn kho & quy đổi */}
      {editingVT && (
        <VaiChinhSuaModal
          maVT={editingVT}
          vatTu={inventory.find((item) => item.maVT === editingVT)}
          inventory={inventory}
          onClose={() => setEditingVT(null)}
          onSuccess={() => {
            refresh();
            setEditingVT(null);
          }}
        />
      )}

      {/* Modal Nhập kho vải (chuẩn hoá theo form Kho Phụ liệu) */}
      {showNhap && (
        <VaiNhapKho
          maVT={showNhap}
          vatTu={inventory.find((item) => item.maVT === showNhap)}
          inventory={inventory}
          user={user}
          onClose={() => setShowNhap(null)}
          onSuccess={() => refresh()}
        />
      )}

      {/* Modal Tạo mã vải mới (Popup tạo nhanh trên màn hình Vải thành phẩm) */}
      {showTaoMa && (
        <ModalTaoMaVai
          isOpen={showTaoMa}
          onClose={() => setShowTaoMa(false)}
          nextVaiNumber={nextVaiNumber}
          addNewVai={addNewVai}
          upsertInventoryItem={upsertInventoryItem}
          setVaiImages={setVaiImages}
          refresh={refresh}
        />
      )}
      {zoomImage && (
        <ImageLightbox
          src={zoomImage.src}
          alt={zoomImage.alt}
          onClose={() => setZoomImage(null)}
        />
      )}
      {previewImage && (
        <ImageLightbox
          src={previewImage.src}
          alt={previewImage.alt}
          onClose={() => setPreviewImage(null)}
        />
      )}
      </div>
    </div>
  );
}

// ============ HELPER COLOR SWATCH ============
function getColorHex(mau: string) {
  if (!mau) return "#ccc";
  const m = mau.toLowerCase();
  if (m.includes("trắng")) return "#f1f2f6";
  if (m.includes("đen")) return "#2f3542";
  if (m.includes("xám chì")) return "#57606f";
  if (m.includes("xám")) return "#a4b0be";
  if (m.includes("rêu")) return "#4b6584"; // Hoặc rêu lá: #3e5128
  if (m.includes("nâu")) return "#8b5a2b";
  if (m.includes("xanh đen")) return "#0c2461";
  if (m.includes("đỏ")) return "#ff4757";
  if (m.includes("vàng")) return "#eccc68";
  if (m.includes("xanh chuối")) return "#7bed9f";
  if (m.includes("tím")) return "#9b59b6";
  if (m.includes("hồng")) return "#ff9ff3";
  if (m.includes("xanh dương") || m.includes("xanh bích")) return "#1e90ff";
  if (m.includes("cam")) return "#ffa502";
  return "#dfe4ea"; // default
}

// ============ MODAL NHẬP KHO VẢI (QUY ĐỔI NGUỒN GIÁ 3 KHÂU: SỢI - DỆT - NHUỘM) ============
function VaiNhapKho({
  maVT: initialMaVT,
  vatTu,
  inventory = [],
  user,
  onClose,
  onSuccess,
}: {
  maVT: string;
  vatTu?: KhoVai;
  inventory?: KhoVai[];
  user: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [maVT, setMaVT] = useState(initialMaVT);
  const vt = inventory.find((v) => v.maVT === maVT) || (maVT === initialMaVT ? vatTu : undefined) || KHO_VAI.find((v) => v.maVT === maVT);
  const { list: nccList, suaNCC } = useNhaCungCap();
  const { themGiaoDich } = useKho();

  // Danh sách NCC theo nghiệp vụ 3 khâu thực tế đang có trên hệ thống MIMIN ERP
  const nccSoiOptions = useMemo(() => {
    const list = nccList.filter(n => {
      const v = (n.loai || "").toLowerCase();
      return v.includes("sợi") || v.includes("soi") || n.ma_ncc === "NCC-001" || n.ma_ncc === "NCC-002" || n.ma_ncc === "NCC-01" || n.ma_ncc === "NCC-02";
    });
    if (list.length > 0) return list;
    return [
      { id: "NCC-002", ma_ncc: "NCC-002", ten_ncc: "CT TNHH TM Quốc tế Sammoon", don_gia: "42.000 đ/kg", loai: "Bán sợi", cong_no: 909052000 },
      { id: "NCC-001", ma_ncc: "NCC-001", ten_ncc: "Công ty Lucky Avanti", don_gia: "45.000 đ/kg", loai: "Bán sợi", cong_no: 0 },
    ];
  }, [nccList]);

  const nccDetOptions = useMemo(() => {
    const list = nccList.filter(n => {
      const v = (n.loai || "").toLowerCase();
      return v.includes("dệt") || v.includes("det") || n.ma_ncc === "NCC-003" || n.ma_ncc === "NCC-03";
    });
    if (list.length > 0) return list;
    return [
      { id: "NCC-003", ma_ncc: "NCC-003", ten_ncc: "CT TNHH SX TM Dệt May Hải Dương", don_gia: "10.000 đ/kg", loai: "Dệt", cong_no: 183944000 },
    ];
  }, [nccList]);

  const nccNhuomOptions = useMemo(() => {
    const list = nccList.filter(n => {
      const v = (n.loai || "").toLowerCase();
      return v.includes("nhuộm") || v.includes("nhuom") || n.ma_ncc === "NCC-004" || n.ma_ncc === "NCC-014" || n.ma_ncc === "NCC-04" || n.ma_ncc === "NCC-14";
    });
    if (list.length > 0) return list;
    return [
      { id: "NCC-004", ma_ncc: "NCC-004", ten_ncc: "CT TNHH MTV Dệt Nhuộm Thái Thành", don_gia: "22.000 đ/kg", loai: "Nhuộm", cong_no: 0 },
      { id: "NCC-014", ma_ncc: "NCC-014", ten_ncc: "CÔNG TY GIGATEX = Dệt Nhuộm Thái Thành (anh Hùng)", don_gia: "22.000 đ/kg", loai: "Nhuộm", cong_no: 639347450 },
    ];
  }, [nccList]);

  // Chuẩn hóa giá: Khắc phục triệt để số lỗi ảo > 200.000 (như 7474040), đưa về giá thực tế của vải 74.000 đ/kg
  const donGiaKhoHopLe = useMemo(() => {
    if (vt?.donGia && vt.donGia > 0 && vt.donGia < 200000) {
      return vt.donGia;
    }
    return 74000;
  }, [vt?.donGia]);

  // Đọc cấu thành giá 3 khâu từ cache hoặc khởi tạo chuẩn từ NCC thực tế
  const [initialGia3Khau] = useState<ChiTietGia3Khau>(() =>
    getChiTietGia3Khau(maVT, donGiaKhoHopLe, vt?.tenVT, vt?.mauSac)
  );

  const [form, setForm] = useState({
    ngay: new Date().toISOString().split("T")[0],
    soLuong: 0,
    nguoiThucHien: user?.name || user?.id || "Hồ Minh Sang",
    ghiChu: "",
    maLoNhap: `LO-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${maVT.slice(-4)}`,
  });

  // 1. Khâu Sợi (Sammoon / Lucky Avanti)
  const [nccSoi, setNccSoi] = useState(initialGia3Khau.nccSoi || "CT TNHH TM Quốc tế Sammoon");
  const [loaiSoi, setLoaiSoi] = useState(initialGia3Khau.loaiSoi || "Sợi 30s Poly Spandex (Sammoon)");
  const [giaSoi, setGiaSoi] = useState<number>(initialGia3Khau.giaSoi || 42000);
  const [dinhMucSoi, setDinhMucSoi] = useState<number>(initialGia3Khau.dinhMucSoi || 1.0);
  const [haoHutSoi, setHaoHutSoi] = useState<number>(initialGia3Khau.haoHutSoi || 0);
  const [vatSoi, setVatSoi] = useState<number>(initialGia3Khau.vatSoi || 0);

  // 2. Khâu Dệt vải mộc (Dệt May Hải Dương - đơn giá hệ thống là 10.000 đ/kg)
  const [nccDet, setNccDet] = useState(initialGia3Khau.nccDet || "CT TNHH SX TM Dệt May Hải Dương");
  const [kieuDet, setKieuDet] = useState(initialGia3Khau.kieuDet || (vt?.loai || "Cá sấu 4 chiều (Pique)"));
  const [giaDet, setGiaDet] = useState<number>(initialGia3Khau.giaDet || 10000);
  const [haoHutDet, setHaoHutDet] = useState<number>(initialGia3Khau.haoHutDet || 0);
  const [vatDet, setVatDet] = useState<number>(initialGia3Khau.vatDet || 0);

  // 3. Khâu Nhuộm & hoàn tất (Dệt Nhuộm Thái Thành / Gigatex)
  const [nccNhuom, setNccNhuom] = useState(initialGia3Khau.nccNhuom || "CT TNHH MTV Dệt Nhuộm Thái Thành");
  const [kieuNhuom, setKieuNhuom] = useState(initialGia3Khau.kieuNhuom || "Nhuộm cao áp OZ chống nhiễm màu");
  const [giaNhuom, setGiaNhuom] = useState<number>(initialGia3Khau.giaNhuom || 22000);
  const [phuPhiNhuom, setPhuPhiNhuom] = useState<number>(initialGia3Khau.phuPhiNhuom || 0);
  const [haoHutNhuom, setHaoHutNhuom] = useState<number>(initialGia3Khau.haoHutNhuom || 0);
  const [vatNhuom, setVatNhuom] = useState<number>(initialGia3Khau.vatNhuom || 0);

  if (!vt) return null;

  // Tính quy đổi giá thời gian thực (Bao gồm Hao hụt và VAT từng khâu)
  // Công thức: Đơn giá khâu = Giá gốc * (1 + Hao hụt %) * (1 + VAT %)
  const heSoSoi = (1 + (haoHutSoi || 0) / 100) * (1 + (vatSoi || 0) / 100);
  const chiPhiSoiQuyDoi = Math.round((giaSoi || 0) * (dinhMucSoi || 1.0) * heSoSoi);

  const heSoDet = (1 + (haoHutDet || 0) / 100) * (1 + (vatDet || 0) / 100);
  const chiPhiDetQuyDoi = Math.round((giaDet || 0) * heSoDet);

  const heSoNhuom = (1 + (haoHutNhuom || 0) / 100) * (1 + (vatNhuom || 0) / 100);
  const chiPhiNhuomQuyDoi = Math.round(((giaNhuom || 0) + (phuPhiNhuom || 0)) * heSoNhuom);

  const donGiaQuyDoi = chiPhiSoiQuyDoi + chiPhiDetQuyDoi + chiPhiNhuomQuyDoi;
  const thanhTien = Math.round((form.soLuong || 0) * donGiaQuyDoi);

  // Tìm đối tượng NCC chính xác trong danh sách NCC của hệ thống
  const timNCC = (tenHoacMa: string, keyword: string, fallbackMa: string) => {
    if (!tenHoacMa) return nccList.find(n => n.ma_ncc === fallbackMa) || null;
    const lower = tenHoacMa.toLowerCase();
    let found = nccList.find(n => n.ma_ncc === tenHoacMa || n.ten_ncc === tenHoacMa);
    if (found) return found;
    found = nccList.find(n => n.ten_ncc.toLowerCase().includes(lower) || lower.includes(n.ten_ncc.toLowerCase()));
    if (found) return found;
    found = nccList.find(n => n.ten_ncc.toLowerCase().includes(keyword.toLowerCase()));
    if (found) return found;
    return nccList.find(n => n.ma_ncc === fallbackMa) || null;
  };

  const targetNccSoi = timNCC(nccSoi, "Sammoon", "NCC-002") || nccSoiOptions[0];
  const targetNccDet = timNCC(nccDet, "Hải Dương", "NCC-003") || nccDetOptions[0];
  const targetNccNhuom = timNCC(nccNhuom, "Thái Thành", "NCC-004") || nccNhuomOptions[0];

  // Tính số tiền công nợ tự động phát sinh cho từng NCC theo số kg nhập
  const soKg = Number(form.soLuong) || 0;
  const congNoSoi = Math.round(soKg * chiPhiSoiQuyDoi);
  const congNoDet = Math.round(soKg * chiPhiDetQuyDoi);
  const congNoNhuom = Math.round(soKg * chiPhiNhuomQuyDoi);
  const tongCongNoPhatSinh = congNoSoi + congNoDet + congNoNhuom;

  // Tỷ trọng %
  const tongChiPhi = Math.max(1, donGiaQuyDoi);
  const pctSoi = Math.round((chiPhiSoiQuyDoi / tongChiPhi) * 100);
  const pctDet = Math.round((chiPhiDetQuyDoi / tongChiPhi) * 100);
  const pctNhuom = Math.max(0, 100 - pctSoi - pctDet);

  const handleApplyPreset = (preset: PresetVaiMau) => {
    setNccSoi(preset.khauSoi.nccSoi);
    setLoaiSoi(preset.khauSoi.loaiSoi);
    setGiaSoi(preset.khauSoi.giaSoi);
    setDinhMucSoi(preset.khauSoi.dinhMucSoi);
    setHaoHutSoi(preset.khauSoi.haoHutSoi || 0);
    setVatSoi(preset.khauSoi.vatSoi || 0);

    setNccDet(preset.khauDet.nccDet);
    setKieuDet(preset.khauDet.kieuDet);
    setGiaDet(preset.khauDet.giaDet);
    setHaoHutDet(preset.khauDet.haoHutDet || 0);
    setVatDet(preset.khauDet.vatDet || 0);

    setNccNhuom(preset.khauNhuom.nccNhuom);
    setKieuNhuom(preset.khauNhuom.kieuNhuom);
    setGiaNhuom(preset.khauNhuom.giaNhuom);
    setPhuPhiNhuom(preset.khauNhuom.phuPhiNhuom);
    setHaoHutNhuom(preset.khauNhuom.haoHutNhuom || 0);
    setVatNhuom(preset.khauNhuom.vatNhuom || 0);

    toast.success(`Đã nạp công thức giá chuẩn NCC: ${preset.tenPreset} (${formatVND(preset.donGiaMau)}/kg)`);
  };

  const resetChuanHeThong = () => {
    setNccSoi("CT TNHH TM Quốc tế Sammoon");
    setLoaiSoi("Sợi 30s Poly Spandex (Sammoon)");
    setGiaSoi(42000);
    setDinhMucSoi(1.0);
    setHaoHutSoi(0);
    setVatSoi(0);

    setNccDet("CT TNHH SX TM Dệt May Hải Dương");
    setKieuDet(vt.loai || "Cá sấu 4 chiều");
    setGiaDet(10000);
    setHaoHutDet(0);
    setVatDet(0);

    setNccNhuom("CT TNHH MTV Dệt Nhuộm Thái Thành");
    setKieuNhuom("Nhuộm cao áp OZ chống nhiễm");
    setGiaNhuom(22000);
    setPhuPhiNhuom(0);
    setHaoHutNhuom(0);
    setVatNhuom(0);

    toast.success("Đã khôi phục bảng giá chuẩn theo đúng thông tin NCC của anh (74.000 đ/kg)");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.soLuong <= 0) {
      toast.error("Số lượng nhập kho phải lớn hơn 0 kg");
      return;
    }
    if (donGiaQuyDoi <= 0) {
      toast.error("Đơn giá vải quy đổi từ 3 khâu phải lớn hơn 0 đ/kg");
      return;
    }

    // 1. Lưu cấu thành giá 3 khâu vào LocalStorage & phát event (Bao gồm Hao hụt & VAT)
    const duLieu3Khau: ChiTietGia3Khau = {
      maVT,
      tenVT: vt.tenVT,
      mauSac: vt.mauSac,
      nccSoi,
      loaiSoi,
      giaSoi,
      dinhMucSoi,
      haoHutSoi,
      vatSoi,
      chiPhiSoi: chiPhiSoiQuyDoi,
      nccDet,
      kieuDet,
      giaDet,
      haoHutDet,
      vatDet,
      chiPhiDet: chiPhiDetQuyDoi,
      nccNhuom,
      kieuNhuom,
      giaNhuom,
      phuPhiNhuom,
      haoHutNhuom,
      vatNhuom,
      chiPhiNhuom: chiPhiNhuomQuyDoi,
      donGiaQuyDoi,
      ngayCapNhat: form.ngay,
      ghiChu: form.ghiChu,
    };
    saveChiTietGia3Khau(duLieu3Khau);

    // 2. Tự động cập nhật công nợ cho cả 3 Nhà Cung Cấp
    const nccBaoCaoList: string[] = [];

    if (targetNccSoi && congNoSoi > 0) {
      try {
        await suaNCC({
          ...targetNccSoi,
          cong_no: (targetNccSoi.cong_no || 0) + congNoSoi,
        });
        nccBaoCaoList.push(`${targetNccSoi.ten_ncc}: +${formatVND(congNoSoi)}`);
      } catch (err) {
        console.warn("Lỗi cập nhật công nợ Sợi:", err);
      }
    }

    if (targetNccDet && congNoDet > 0) {
      try {
        await suaNCC({
          ...targetNccDet,
          cong_no: (targetNccDet.cong_no || 0) + congNoDet,
        });
        nccBaoCaoList.push(`${targetNccDet.ten_ncc}: +${formatVND(congNoDet)}`);
      } catch (err) {
        console.warn("Lỗi cập nhật công nợ Dệt:", err);
      }
    }

    if (targetNccNhuom && congNoNhuom > 0) {
      try {
        await suaNCC({
          ...targetNccNhuom,
          cong_no: (targetNccNhuom.cong_no || 0) + congNoNhuom,
        });
        nccBaoCaoList.push(`${targetNccNhuom.ten_ncc}: +${formatVND(congNoNhuom)}`);
      } catch (err) {
        console.warn("Lỗi cập nhật công nợ Nhuộm:", err);
      }
    }

    // 3. Ghi chú chi tiết 3 khâu và phân bổ công nợ
    const tenCacNcc = [
      targetNccSoi?.ten_ncc || nccSoi,
      targetNccDet?.ten_ncc || nccDet,
      targetNccNhuom?.ten_ncc || nccNhuom
    ].filter(Boolean).join(" · ");

    const ghiChuDayDu = [
      form.ghiChu,
      `[Lô: ${form.maLoNhap}]`,
      `[3 Khâu: Sợi ${formatVND(chiPhiSoiQuyDoi)} (HH:${haoHutSoi}%,VAT:${vatSoi}%) + Dệt ${formatVND(chiPhiDetQuyDoi)} (HH:${haoHutDet}%,VAT:${vatDet}%) + Nhuộm ${formatVND(chiPhiNhuomQuyDoi)} (HH:${haoHutNhuom}%,VAT:${vatNhuom}%) = ${formatVND(donGiaQuyDoi)}/kg]`,
      `[Tự động ghi nhận công nợ 3 NCC: ${nccBaoCaoList.join(" | ")}]`
    ].filter(Boolean).join(" · ");

    // 4. Nhập kho và cập nhật đơn giá quy đổi chuẩn vào kho
    const r = nhapKho(maVT, form.soLuong, user, ghiChuDayDu, {
      ngay: form.ngay,
      donGia: donGiaQuyDoi,
      nguonNhap: tenCacNcc,
      nguoiThucHien: form.nguoiThucHien,
    });

    if (r.ok) {
      updateVaiInfo(maVT, { donGia: donGiaQuyDoi });
      const updated = getInventoryByMaVT(maVT);
      if (updated) {
        try {
          await upsertInventoryItem(updated);
        } catch (error) {
          console.warn("Chưa đồng bộ Supabase:", error);
        }
      }

      try {
        await themGiaoDich({
          ngay: form.ngay,
          loai: "NHAP",
          loaiKho: "vai",
          maVT: vt.maVT,
          tenVT: vt.tenVT,
          soLuong: form.soLuong,
          donVi: "kg",
          donGia: donGiaQuyDoi,
          thanhTien,
          nguonNhap: tenCacNcc,
          nguoiThucHien: form.nguoiThucHien,
          ghiChu: ghiChuDayDu,
        });
      } catch (e) {
        console.warn("Lưu giao dịch Supabase:", e);
      }

      toast.success(
        `🎉 Đã nhập ${form.soLuong.toLocaleString()} kg vải "${vt.tenVT}". Tự động ghi nhận công nợ 3 NCC: ${nccBaoCaoList.join(" · ")}`
      );
      onSuccess();
      onClose();
    } else {
      toast.error(r.message);
    }
  };

  return (
    <Portal>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
        onClick={onClose}
      >
        <div
          className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-auto animate-slide-up max-h-[92vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER MODAL */}
          <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-sky-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300">
                    Kho Vải Thành Phẩm
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">{vt.maVT}</span>
                  {inventory && inventory.length > 0 && (
                    <select
                      value={maVT}
                      onChange={(e) => setMaVT(e.target.value)}
                      className="text-xs font-bold py-0.5 px-2 rounded-lg border border-teal-300 dark:border-teal-700 bg-white dark:bg-slate-800 text-teal-900 dark:text-teal-200 focus:outline-none focus:ring-1 focus:ring-teal-500 max-w-[200px]"
                      title="Chọn loại vải cần nhập"
                    >
                      {inventory.map((item) => (
                        <option key={item.maVT} value={item.maVT}>
                          {item.maVT} - {item.tenVT} ({item.mauSac})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">
                  Nhập kho & Quy đổi giá 3 khâu: {vt.tenVT} - {vt.mauSac}
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetChuanHeThong}
                className="px-2.5 py-1 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950 dark:text-teal-300 rounded-lg border border-teal-200 dark:border-teal-800 transition flex items-center gap-1 cursor-pointer"
                title="Khôi phục lại đúng đơn giá và NCC thực tế (74.000 đ/kg)"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Chuẩn hệ thống (74k)
              </button>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 transition"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* CUỘN NỘI DUNG */}
          <div className="overflow-y-auto pr-1 flex-1 py-4 space-y-4">
            {/* THẺ TỔNG QUAN VẬT TƯ */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200/80 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span><span className="text-slate-500">Mã vật tư:</span> <b className="font-mono text-slate-800 dark:text-white">{vt.maVT}</b></span>
                <span><span className="text-slate-500">Loại vải:</span> <b>{vt.loai || "Vải dệt"}</b></span>
                <span><span className="text-slate-500">Màu sắc:</span> <b>{vt.mauSac || "—"}</b></span>
                <span><span className="text-slate-500">Tồn kho hiện tại:</span> <b className="text-teal-600 dark:text-teal-400 font-bold">{vt.tonKho.toLocaleString()} kg</b></span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Tự động phân bổ công nợ vào danh bạ Nhà Cung Cấp</span>
              </div>
            </div>

            {/* PRESETS NẠP NHANH 1-CLICK (ĐÚNG NCC CỦA ỨNG DỤNG) */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-teal-500/5 via-sky-500/5 to-purple-500/5 border border-teal-200/60 dark:border-teal-800/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-teal-900 dark:text-teal-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Mẫu bảng giá chuẩn theo Nhà cung cấp của xưởng (Nạp nhanh 1-Click):
                </span>
                <span className="text-[11px] text-slate-500">Click để tự động điền các khâu</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
                {PRESETS_VAI_MAU.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 hover:border-teal-400 dark:border-slate-700 hover:shadow-sm text-left transition flex flex-col justify-between group"
                  >
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-teal-600 line-clamp-1">
                      {p.tenPreset.split("(")[0].trim()}
                    </span>
                    <span className="text-[11px] font-black text-teal-700 dark:text-teal-400 mt-1 font-mono">
                      {formatVND(p.donGiaMau)}/kg
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <form id="form-nhap-vai-3-khau" onSubmit={handleSubmit} className="space-y-4">
              {/* KHỐI 1: THÔNG TIN LÔ NHẬP & SỐ LƯỢNG */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Ngày nhập kho *
                  </label>
                  <input
                    type="date"
                    required
                    className="input w-full text-sm"
                    value={form.ngay}
                    onChange={(e) => setForm({ ...form, ngay: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Số lượng nhập (kg) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0.1}
                    step="any"
                    placeholder="VD: 500"
                    className="input w-full text-sm font-bold text-teal-700 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-950/30 border-teal-300 dark:border-teal-700"
                    value={form.soLuong || ""}
                    onChange={(e) => setForm({ ...form, soLuong: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Mã lô sản xuất / cuộn
                  </label>
                  <input
                    type="text"
                    className="input w-full text-sm font-mono"
                    value={form.maLoNhap}
                    onChange={(e) => setForm({ ...form, maLoNhap: e.target.value })}
                    placeholder="VD: LO-202611-VAI"
                  />
                </div>
              </div>

              {/* KHỐI 2: CHI TIẾT NGUỒN GIÁ 3 KHÂU SỢI - DỆT - NHUỘM KÈM HAO HỤT (%) & VAT (%) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <SlidersHorizontal className="w-4 h-4 text-sky-600" />
                    Nguồn giá cả 3 khâu sản xuất cấu thành 1 kg vải (Có Hao hụt & VAT)
                  </h4>
                  <span className="text-[11px] text-slate-500 italic">
                    Nhập chi phí hao hụt & VAT theo từng khâu thực tế
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  {/* KHÂU 1: NHẬP SỢI (BLUE / SKY) */}
                  <div className="p-3.5 rounded-xl border-2 border-sky-300 dark:border-sky-800 bg-sky-50/60 dark:bg-sky-950/20 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-sky-200 dark:border-sky-800 mb-2.5">
                        <span className="text-xs font-black text-sky-900 dark:text-sky-300 uppercase flex items-center gap-1.5">
                          🧵 Khâu 1: Nhập Sợi
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-200/80 dark:bg-sky-900 text-sky-800 dark:text-sky-200 font-bold">
                          {pctSoi}% giá vải
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-0.5">
                            Nhà cung cấp sợi *
                          </label>
                          <select
                            className="input w-full text-xs font-semibold bg-white dark:bg-slate-900"
                            value={nccSoi}
                            onChange={(e) => {
                              const val = e.target.value;
                              setNccSoi(val);
                              if (val.includes("Sammoon")) {
                                setGiaSoi(42000);
                                setLoaiSoi("Sợi 30s Poly Spandex (Sammoon)");
                              } else if (val.includes("Lucky Avanti")) {
                                setGiaSoi(45000);
                                setLoaiSoi("Sợi cotton 30s/32s Compact");
                              }
                            }}
                          >
                            {nccSoiOptions.map((n) => (
                              <option key={n.ma_ncc} value={n.ten_ncc}>
                                {n.ten_ncc} {n.don_gia ? `(${n.don_gia})` : ""}
                              </option>
                            ))}
                            <option value="CT TNHH TM Quốc tế Sammoon">CT TNHH TM Quốc tế Sammoon (42.000 đ/kg)</option>
                            <option value="Công ty Lucky Avanti">Công ty Lucky Avanti (45.000 đ/kg)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-0.5">
                            Loại sợi / Chi số
                          </label>
                          <input
                            type="text"
                            className="input w-full text-xs bg-white dark:bg-slate-900"
                            value={loaiSoi}
                            onChange={(e) => setLoaiSoi(e.target.value)}
                            placeholder="VD: Sợi 30s Poly Spandex..."
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-0.5">
                              Giá sợi (đ/kg)
                            </label>
                            <input
                              type="number"
                              min={0}
                              step="any"
                              className="input w-full text-xs font-bold text-sky-800 dark:text-sky-300 bg-white dark:bg-slate-900"
                              value={giaSoi || ""}
                              onChange={(e) => setGiaSoi(Number(e.target.value))}
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-0.5">
                              Định mức (kg/kg)
                            </label>
                            <input
                              type="number"
                              min={0.8}
                              step={0.01}
                              className="input w-full text-xs font-mono bg-white dark:bg-slate-900"
                              value={dinhMucSoi || 1.0}
                              onChange={(e) => setDinhMucSoi(Number(e.target.value))}
                            />
                          </div>
                        </div>

                        {/* CHI PHÍ HAO HỤT & VAT SỢI */}
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-sky-200/60 dark:border-sky-800/60">
                          <div>
                            <label className="text-[11px] font-bold text-sky-900 dark:text-sky-300 block mb-0.5">
                              Hao hụt sợi (%)
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={0.1}
                              placeholder="0%"
                              className="input w-full text-xs font-semibold text-rose-700 bg-white dark:bg-slate-900"
                              value={haoHutSoi || ""}
                              onChange={(e) => setHaoHutSoi(Number(e.target.value))}
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-sky-900 dark:text-sky-300 block mb-0.5">
                              Thuế VAT sợi (%)
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={1}
                              placeholder="0%"
                              className="input w-full text-xs font-semibold text-emerald-700 bg-white dark:bg-slate-900"
                              value={vatSoi || ""}
                              onChange={(e) => setVatSoi(Number(e.target.value))}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-sky-200 dark:border-sky-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-sky-800 dark:text-sky-300">Chi phí sợi/kg vải:</span>
                        <span className="text-sm font-black text-sky-700 dark:text-sky-400 font-mono">
                          {formatVND(chiPhiSoiQuyDoi)}
                        </span>
                      </div>
                      {(haoHutSoi > 0 || vatSoi > 0) && (
                        <div className="text-[10px] text-right text-slate-500 font-mono mt-0.5">
                          (Đã gồm {haoHutSoi > 0 ? `HH:${haoHutSoi}%` : ""} {haoHutSoi > 0 && vatSoi > 0 ? "+" : ""} {vatSoi > 0 ? `VAT:${vatSoi}%` : ""})
                        </div>
                      )}
                    </div>
                  </div>

                  {/* KHÂU 2: DỆT VẢI MỘC (PURPLE / VIOLET) */}
                  <div className="p-3.5 rounded-xl border-2 border-violet-300 dark:border-violet-800 bg-violet-50/60 dark:bg-violet-950/20 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-violet-200 dark:border-violet-800 mb-2.5">
                        <span className="text-xs font-black text-violet-900 dark:text-violet-300 uppercase flex items-center gap-1.5">
                          🏭 Khâu 2: Dệt Vải Mộc
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-200/80 dark:bg-violet-900 text-violet-800 dark:text-violet-200 font-bold">
                          {pctDet}% giá vải
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-0.5">
                            Xưởng dệt / NCC dệt *
                          </label>
                          <select
                            className="input w-full text-xs font-semibold bg-white dark:bg-slate-900"
                            value={nccDet}
                            onChange={(e) => {
                              const val = e.target.value;
                              setNccDet(val);
                              if (val.includes("Hải Dương")) {
                                setGiaDet(10000);
                              }
                            }}
                          >
                            {nccDetOptions.map((n) => (
                              <option key={n.ma_ncc} value={n.ten_ncc}>
                                {n.ten_ncc} {n.don_gia ? `(${n.don_gia})` : ""}
                              </option>
                            ))}
                            <option value="CT TNHH SX TM Dệt May Hải Dương">CT TNHH SX TM Dệt May Hải Dương (10.000 đ/kg)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-0.5">
                            Kiểu dệt / Cấu trúc
                          </label>
                          <input
                            type="text"
                            className="input w-full text-xs bg-white dark:bg-slate-900"
                            value={kieuDet}
                            onChange={(e) => setKieuDet(e.target.value)}
                            placeholder="VD: Cá sấu 4 chiều (Pique)..."
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-0.5">
                            Đơn giá công dệt (đ/kg mộc)
                          </label>
                          <input
                            type="number"
                            min={0}
                            step="any"
                            className="input w-full text-xs font-bold text-violet-800 dark:text-violet-300 bg-white dark:bg-slate-900"
                            value={giaDet || ""}
                            onChange={(e) => setGiaDet(Number(e.target.value))}
                          />
                        </div>

                        {/* CHI PHÍ HAO HỤT & VAT DỆT */}
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-violet-200/60 dark:border-violet-800/60">
                          <div>
                            <label className="text-[11px] font-bold text-violet-900 dark:text-violet-300 block mb-0.5">
                              Hao hụt dệt (%)
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={0.1}
                              placeholder="0%"
                              className="input w-full text-xs font-semibold text-rose-700 bg-white dark:bg-slate-900"
                              value={haoHutDet || ""}
                              onChange={(e) => setHaoHutDet(Number(e.target.value))}
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-violet-900 dark:text-violet-300 block mb-0.5">
                              Thuế VAT dệt (%)
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={1}
                              placeholder="0%"
                              className="input w-full text-xs font-semibold text-emerald-700 bg-white dark:bg-slate-900"
                              value={vatDet || ""}
                              onChange={(e) => setVatDet(Number(e.target.value))}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-violet-200 dark:border-violet-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-violet-800 dark:text-violet-300">Công dệt/kg vải:</span>
                        <span className="text-sm font-black text-violet-700 dark:text-violet-400 font-mono">
                          {formatVND(chiPhiDetQuyDoi)}
                        </span>
                      </div>
                      {(haoHutDet > 0 || vatDet > 0) && (
                        <div className="text-[10px] text-right text-slate-500 font-mono mt-0.5">
                          (Đã gồm {haoHutDet > 0 ? `HH:${haoHutDet}%` : ""} {haoHutDet > 0 && vatDet > 0 ? "+" : ""} {vatDet > 0 ? `VAT:${vatDet}%` : ""})
                        </div>
                      )}
                    </div>
                  </div>

                  {/* KHÂU 3: NHUỘM & HOÀN TẤT (ORANGE / AMBER) */}
                  <div className="p-3.5 rounded-xl border-2 border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/20 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-amber-200 dark:border-amber-800 mb-2.5">
                        <span className="text-xs font-black text-amber-900 dark:text-amber-300 uppercase flex items-center gap-1.5">
                          🧪 Khâu 3: Nhuộm & Hoàn Tất
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200/80 dark:bg-amber-900 text-amber-800 dark:text-amber-200 font-bold">
                          {pctNhuom}% giá vải
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-0.5">
                            Nhà máy nhuộm / NCC nhuộm *
                          </label>
                          <select
                            className="input w-full text-xs font-semibold bg-white dark:bg-slate-900"
                            value={nccNhuom}
                            onChange={(e) => {
                              const val = e.target.value;
                              setNccNhuom(val);
                              if (val.includes("Thái Thành") || val.includes("GIGATEX")) {
                                setGiaNhuom(22000);
                              }
                            }}
                          >
                            {nccNhuomOptions.map((n) => (
                              <option key={n.ma_ncc} value={n.ten_ncc}>
                                {n.ten_ncc}
                              </option>
                            ))}
                            <option value="CT TNHH MTV Dệt Nhuộm Thái Thành">CT TNHH MTV Dệt Nhuộm Thái Thành (22.000 đ/kg)</option>
                            <option value="CÔNG TY GIGATEX = Dệt Nhuộm Thái Thành (anh Hùng)">CÔNG TY GIGATEX = Dệt Nhuộm Thái Thành (anh Hùng)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-0.5">
                            Quy trình / Kiểu nhuộm
                          </label>
                          <input
                            type="text"
                            className="input w-full text-xs bg-white dark:bg-slate-900"
                            value={kieuNhuom}
                            onChange={(e) => setKieuNhuom(e.target.value)}
                            placeholder="VD: Nhuộm cao áp OZ chống nhiễm..."
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-0.5">
                              Công nhuộm (đ/kg)
                            </label>
                            <input
                              type="number"
                              min={0}
                              step="any"
                              className="input w-full text-xs font-bold text-amber-800 dark:text-amber-300 bg-white dark:bg-slate-900"
                              value={giaNhuom || ""}
                              onChange={(e) => setGiaNhuom(Number(e.target.value))}
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-0.5">
                              Phụ phí (đ/kg)
                            </label>
                            <input
                              type="number"
                              min={0}
                              step="any"
                              className="input w-full text-xs font-mono bg-white dark:bg-slate-900"
                              value={phuPhiNhuom || ""}
                              onChange={(e) => setPhuPhiNhuom(Number(e.target.value))}
                              placeholder="0"
                            />
                          </div>
                        </div>

                        {/* CHI PHÍ HAO HỤT & VAT NHUỘM */}
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-amber-200/60 dark:border-amber-800/60">
                          <div>
                            <label className="text-[11px] font-bold text-amber-900 dark:text-amber-300 block mb-0.5">
                              Hao hụt nhuộm (%)
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={0.1}
                              placeholder="0%"
                              className="input w-full text-xs font-semibold text-rose-700 bg-white dark:bg-slate-900"
                              value={haoHutNhuom || ""}
                              onChange={(e) => setHaoHutNhuom(Number(e.target.value))}
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-amber-900 dark:text-amber-300 block mb-0.5">
                              Thuế VAT nhuộm (%)
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={1}
                              placeholder="0%"
                              className="input w-full text-xs font-semibold text-emerald-700 bg-white dark:bg-slate-900"
                              value={vatNhuom || ""}
                              onChange={(e) => setVatNhuom(Number(e.target.value))}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-amber-200 dark:border-amber-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">Công nhuộm/kg vải:</span>
                        <span className="text-sm font-black text-amber-700 dark:text-amber-400 font-mono">
                          {formatVND(chiPhiNhuomQuyDoi)}
                        </span>
                      </div>
                      {(haoHutNhuom > 0 || vatNhuom > 0) && (
                        <div className="text-[10px] text-right text-slate-500 font-mono mt-0.5">
                          (Đã gồm {haoHutNhuom > 0 ? `HH:${haoHutNhuom}%` : ""} {haoHutNhuom > 0 && vatNhuom > 0 ? "+" : ""} {vatNhuom > 0 ? `VAT:${vatNhuom}%` : ""})
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* KHỐI 3: HIGHLIGHT QUY ĐỔI GIÁ THÀNH & TỶ TRỌNG CHI PHÍ */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-sky-500/10 border-2 border-emerald-400/80 dark:border-emerald-600/60 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-200 dark:border-emerald-800/60">
                  <div>
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Công thức quy đổi giá thành 1 kg vải hoàn chỉnh:
                    </span>
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-1 flex flex-wrap items-center gap-1.5 font-mono">
                      <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200">
                        Sợi: {formatVND(chiPhiSoiQuyDoi)}
                      </span>
                      <span>+</span>
                      <span className="px-1.5 py-0.5 rounded bg-violet-100 text-violet-800 dark:bg-violet-900/60 dark:text-violet-200">
                        Dệt: {formatVND(chiPhiDetQuyDoi)}
                      </span>
                      <span>+</span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                        Nhuộm: {formatVND(chiPhiNhuomQuyDoi)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 shadow-sm">
                    <span className="text-[11px] font-bold text-slate-500 uppercase block">Đơn giá / 1 kg vải</span>
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      {formatVND(donGiaQuyDoi)}
                    </span>
                  </div>
                </div>

                {/* THANH TỶ TRỌNG % */}
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] font-bold mb-1 text-slate-600 dark:text-slate-400">
                    <span>Tỷ trọng chi phí 3 khâu:</span>
                    <span>Sợi: {pctSoi}% · Dệt: {pctDet}% · Nhuộm: {pctNhuom}%</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-700 flex overflow-hidden shadow-inner">
                    <div style={{ width: `${pctSoi}%` }} className="bg-sky-500 h-full transition-all" title={`Sợi: ${pctSoi}%`} />
                    <div style={{ width: `${pctDet}%` }} className="bg-violet-500 h-full transition-all" title={`Dệt: ${pctDet}%`} />
                    <div style={{ width: `${pctNhuom}%` }} className="bg-amber-500 h-full transition-all" title={`Nhuộm: ${pctNhuom}%`} />
                  </div>
                </div>

                {/* TỔNG THÀNH TIỀN LÔ HÀNG */}
                <div className="mt-3 pt-3 border-t border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Tổng thành tiền lô nhập ({soKg > 0 ? soKg.toLocaleString() : 0} kg × {formatVND(donGiaQuyDoi)}):
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-teal-800 dark:text-teal-300 font-mono">
                    {formatVND(thanhTien)}
                  </span>
                </div>
              </div>

              {/* KHỐI 4: TỰ ĐỘNG PHÂN BỔ & TÍNH CÔNG NỢ 3 NHÀ CUNG CẤP (THEO SỐ LƯỢNG NHẬP) */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Tự động phân bổ công nợ 3 Nhà Cung Cấp ({soKg > 0 ? soKg.toLocaleString() : 0} kg)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Hệ thống tự động cộng dồn số tiền tương ứng vào sổ nợ của từng NCC khi xác nhận nhập kho
                      </p>
                    </div>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Tự động ghi nhận
                  </span>
                </div>

                {/* BẢNG CÔNG NỢ CHI TIẾT 3 KHÂU */}
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5">Khâu SX & Nhà Cung Cấp</th>
                        <th className="p-2.5 text-right">Đơn giá quy đổi</th>
                        <th className="p-2.5 text-center">Hao hụt / VAT</th>
                        <th className="p-2.5 text-right">Nợ hiện tại</th>
                        <th className="p-2.5 text-right text-teal-700 dark:text-teal-400">Công nợ phát sinh (+)</th>
                        <th className="p-2.5 text-right font-black">Nợ sau khi nhập</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {/* KHÂU SỢI */}
                      <tr className="hover:bg-sky-50/40 dark:hover:bg-sky-950/20 transition">
                        <td className="p-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">
                                {targetNccSoi?.ten_ncc || nccSoi}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                {targetNccSoi?.ma_ncc || "NCC Sợi"} · Khâu Sợi ({loaiSoi})
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-sky-800 dark:text-sky-300">
                          {formatVND(chiPhiSoiQuyDoi)}/kg
                        </td>
                        <td className="p-2.5 text-center font-mono text-[11px] text-slate-600 dark:text-slate-400">
                          {haoHutSoi > 0 ? `${haoHutSoi}% HH` : "0%"} · {vatSoi > 0 ? `${vatSoi}% VAT` : "0%"}
                        </td>
                        <td className="p-2.5 text-right font-mono text-slate-500">
                          {formatVND(targetNccSoi?.cong_no || 0)}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-sky-600 dark:text-sky-400">
                          +{formatVND(congNoSoi)}
                        </td>
                        <td className="p-2.5 text-right font-mono font-black text-slate-900 dark:text-white">
                          {formatVND((targetNccSoi?.cong_no || 0) + congNoSoi)}
                        </td>
                      </tr>

                      {/* KHÂU DỆT */}
                      <tr className="hover:bg-violet-50/40 dark:hover:bg-violet-950/20 transition">
                        <td className="p-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-violet-500 shrink-0" />
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">
                                {targetNccDet?.ten_ncc || nccDet}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                {targetNccDet?.ma_ncc || "NCC Dệt"} · Khâu Dệt ({kieuDet})
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-violet-800 dark:text-violet-300">
                          {formatVND(chiPhiDetQuyDoi)}/kg
                        </td>
                        <td className="p-2.5 text-center font-mono text-[11px] text-slate-600 dark:text-slate-400">
                          {haoHutDet > 0 ? `${haoHutDet}% HH` : "0%"} · {vatDet > 0 ? `${vatDet}% VAT` : "0%"}
                        </td>
                        <td className="p-2.5 text-right font-mono text-slate-500">
                          {formatVND(targetNccDet?.cong_no || 0)}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-violet-600 dark:text-violet-400">
                          +{formatVND(congNoDet)}
                        </td>
                        <td className="p-2.5 text-right font-mono font-black text-slate-900 dark:text-white">
                          {formatVND((targetNccDet?.cong_no || 0) + congNoDet)}
                        </td>
                      </tr>

                      {/* KHÂU NHUỘM */}
                      <tr className="hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition">
                        <td className="p-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">
                                {targetNccNhuom?.ten_ncc || nccNhuom}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                {targetNccNhuom?.ma_ncc || "NCC Nhuộm"} · Khâu Nhuộm ({kieuNhuom})
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-amber-800 dark:text-amber-300">
                          {formatVND(chiPhiNhuomQuyDoi)}/kg
                        </td>
                        <td className="p-2.5 text-center font-mono text-[11px] text-slate-600 dark:text-slate-400">
                          {haoHutNhuom > 0 ? `${haoHutNhuom}% HH` : "0%"} · {vatNhuom > 0 ? `${vatNhuom}% VAT` : "0%"}
                        </td>
                        <td className="p-2.5 text-right font-mono text-slate-500">
                          {formatVND(targetNccNhuom?.cong_no || 0)}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                          +{formatVND(congNoNhuom)}
                        </td>
                        <td className="p-2.5 text-right font-mono font-black text-slate-900 dark:text-white">
                          {formatVND((targetNccNhuom?.cong_no || 0) + congNoNhuom)}
                        </td>
                      </tr>
                    </tbody>
                    <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-black border-t border-slate-200 dark:border-slate-700">
                      <tr>
                        <td colSpan={4} className="p-2.5 text-slate-700 dark:text-slate-300 text-right uppercase text-[11px]">
                          Tổng cộng công nợ phát sinh 3 khâu ({soKg.toLocaleString()} kg):
                        </td>
                        <td className="p-2.5 text-right font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                          +{formatVND(tongCongNoPhatSinh)}
                        </td>
                        <td className="p-2.5 text-right text-[11px] text-slate-500 font-medium">
                          Khớp 100% lô vải
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* THÔNG TIN NGƯỜI THỰC HIỆN & GHI CHÚ */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Người thực hiện
                    </label>
                    <input
                      className="input w-full text-xs"
                      value={form.nguoiThucHien}
                      onChange={(e) => setForm({ ...form, nguoiThucHien: e.target.value })}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Ghi chú phiếu nhập kho
                    </label>
                    <input
                      type="text"
                      className="input w-full text-xs"
                      value={form.ghiChu}
                      onChange={(e) => setForm({ ...form, ghiChu: e.target.value })}
                      placeholder="VD: Nhập lô sợi dệt nhuộm đạt tiêu chuẩn sản xuất..."
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold transition cursor-pointer"
            >
              Huỷ
            </button>
            <button
              type="submit"
              form="form-nhap-vai-3-khau"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-700 hover:to-sky-700 text-white font-bold text-sm shadow-lg shadow-teal-500/25 transition flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Xác nhận nhập kho & Ghi nhận công nợ ({formatVND(donGiaQuyDoi)}/kg)
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}

// ============ MODAL TẠO MÃ VẢI MỚI (POPUP THÊM VẢI TRỰC TIẾP TRÊN MÀN HÌNH CHÍNH) ============
function ModalTaoMaVai({
  isOpen,
  onClose,
  nextVaiNumber,
  addNewVai,
  upsertInventoryItem,
  setVaiImages,
  refresh,
}: {
  isOpen: boolean;
  onClose: () => void;
  nextVaiNumber: number;
  addNewVai: (vai: KhoVaiWithImage) => boolean;
  upsertInventoryItem: (item: KhoVaiWithImage) => Promise<any>;
  setVaiImages: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  refresh: () => void;
}) {
  const [tenVT, setTenVT] = useState(LOAI_VAI_OPTIONS[0]);
  const [mauSac, setMauSac] = useState("");
  const [donGia, setDonGia] = useState<number>(74000);
  const [thuongHieu, setThuongHieu] = useState<"polomimin" | "manpj">("polomimin");
  const [ghiChu, setGhiChu] = useState("");
  const [previewImg, setPreviewImg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const imgInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const maVTDukien = `VAI-${String(nextVaiNumber).padStart(2, "0")}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenVT.trim()) {
      toast.error("Vui lòng chọn hoặc nhập tên loại vải");
      return;
    }
    if (!mauSac.trim()) {
      toast.error("Vui lòng nhập tên màu sắc");
      return;
    }

    setIsSubmitting(true);
    const newVai: KhoVaiWithImage = {
      maVT: maVTDukien,
      tenVT: tenVT.trim(),
      mauSac: mauSac.trim(),
      donGia: donGia || 74000,
      tonToiThieu: 0,
      loai: "Vải",
      dvt: "kg",
      tonKho: 0,
      ghiChu: ghiChu.trim(),
      imageUrl: previewImg || "",
      thuongHieu,
    };

    try {
      await upsertInventoryItem(newVai);
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(`Chưa thể đồng bộ mã ${maVTDukien} lên Supabase: ${message}. Vui lòng thử lại.`);
      setIsSubmitting(false);
      return;
    }

    const ok = addNewVai(newVai);
    if (!ok) {
      toast.error(`Mã ${maVTDukien} đã tồn tại trong kho!`);
      setIsSubmitting(false);
      return;
    }

    if (previewImg) {
      setVaiImages((prev) => ({ ...prev, [maVTDukien]: previewImg }));
    }

    toast.success(`🎉 Đã tạo thành công mã vải ${maVTDukien} (${tenVT} - ${mauSac})`);
    refresh();
    setIsSubmitting(false);
    onClose();
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      toast.loading("Đang tải ảnh mẫu vải...");
      const publicUrl = await uploadProductFile(file);
      toast.dismiss();
      if (publicUrl) {
        setPreviewImg(publicUrl);
        toast.success("Tải ảnh thành công");
      }
    } catch (err) {
      toast.dismiss();
      toast.error("Lỗi tải ảnh lên máy chủ");
    }
  };

  return (
    <Portal>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
        onClick={onClose}
      >
        <div
          className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-auto animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Thêm Mã Vải Mới Vào Kho
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Mã hệ thống tự cấp: <span className="text-blue-600 dark:text-blue-400 font-bold">{maVTDukien}</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 pt-4">
            {/* Ảnh đại diện mẫu vải */}
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
              <div
                className="w-16 h-16 rounded-xl border border-slate-300 dark:border-slate-600 overflow-hidden shrink-0 cursor-pointer relative group flex items-center justify-center shadow-inner"
                style={{ backgroundColor: previewImg ? "transparent" : (mauSac ? getColorHex(mauSac) : "#e2e8f0") }}
                onClick={() => imgInputRef.current?.click()}
                title="Bấm để chọn ảnh từ máy"
              >
                {previewImg ? (
                  <img src={previewImg} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] font-bold text-slate-500 text-center px-1">
                    + Tải ảnh
                  </span>
                )}
              </div>
              <input
                type="file"
                ref={imgInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleUploadImage}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Hình ảnh đại diện vải
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Bấm ô bên cạnh để tải ảnh chụp thớ vải thực tế (hoặc hệ thống tự tạo swatch màu theo tên màu).
                </p>
              </div>
            </div>

            {/* Phân loại thương hiệu */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Phân loại thương hiệu *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setThuongHieu("polomimin")}
                  className={`py-2 px-3 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    thuongHieu === "polomimin"
                      ? "bg-teal-50 border-teal-500 text-teal-700 dark:bg-teal-950 dark:text-teal-300 shadow-xs"
                      : "border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  👕 Vải Polomimin
                </button>
                <button
                  type="button"
                  onClick={() => setThuongHieu("manpj")}
                  className={`py-2 px-3 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    thuongHieu === "manpj"
                      ? "bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 shadow-xs"
                      : "border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  👔 Vải ManPJ
                </button>
              </div>
            </div>

            {/* Loại vải & Tên màu */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tên loại vải *
                </label>
                <select
                  value={tenVT}
                  onChange={(e) => setTenVT(e.target.value)}
                  className="w-full text-xs font-medium p-2.5 border rounded-xl bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {LOAI_VAI_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Màu sắc & Mã màu *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Xanh lá 15, Đen 01, Nâu 11..."
                  value={mauSac}
                  onChange={(e) => setMauSac(e.target.value)}
                  className="w-full text-xs font-medium p-2.5 border rounded-xl bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Đơn giá & Ghi chú */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Đơn giá cơ sở (/kg)
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={donGia}
                  onChange={(e) => setDonGia(Number(e.target.value))}
                  placeholder="74000"
                  className="w-full text-xs font-bold p-2.5 border rounded-xl bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Đơn giá chuẩn hệ thống: 74.000 đ/kg
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ghi chú
                </label>
                <input
                  type="text"
                  placeholder="VD: Dùng cho dòng áo Polo cao cấp..."
                  value={ghiChu}
                  onChange={(e) => setGhiChu(e.target.value)}
                  className="w-full text-xs font-medium p-2.5 border rounded-xl bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>{isSubmitting ? "Đang lưu..." : "Tạo & Lưu Mã Vải"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
}

function Stat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: any; color: string }) {
  const colors: Record<string, string> = {
    blue: "from-blue-500/10 to-cyan-500/10 text-blue-600",
    emerald: "from-emerald-500/10 to-green-500/10 text-emerald-600",
    rose: "from-rose-500/10 to-red-500/10 text-rose-600",
    violet: "from-violet-500/10 to-purple-500/10 text-violet-600",
  };
  return (
    <div className={`card p-3 bg-gradient-to-br ${colors[color]}`}>
      <div className="flex items-center gap-1.5 opacity-80 text-xs">{icon}<span>{label}</span></div>
      <div className="text-xl font-bold mt-1">{value}</div>
    </div>
  );
}
