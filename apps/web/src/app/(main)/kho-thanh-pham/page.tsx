"use client";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Box, Download, Sparkles, Plus, Package, ArrowRight, CheckCircle2, Check, Warehouse } from "lucide-react";
import { toast } from "sonner";
import { useLenhCat } from "@/lib/data/lenh-cat-store";
import { useSession } from "@/components/session-provider";
import { logCRUD } from "@/lib/audit-log";
import { useDanhMucSP, isMatchingProduct, type MauTieuChuan } from "@/lib/data/danh-muc-sp-store";
import { supabaseFetchAllRaw, supabaseUpsertRaw, supabaseDelete, checkSupabase, useSupabaseRealtime } from "@/lib/supabase/sync-helper";
import { STORAGE_KEY, KHO_TP_CHANGED_EVENT, generateSanPhamFromWorkflow, taoSanPhamKhoTuLenhCat, fromSupabaseRow, toSupabaseRow, chuanHoaSanPhamKho, taoMaLoTonKhoTheoDong, layMaLoTonKho, hienThiDanhSachSize, type SanPhamTP } from "./data";
import { StatsHeader, StatsByType } from "./components/StatsPanel";
import { FilterBar } from "./components/FilterBar";
import { ProductGrid } from "./components/ProductGrid";
import { ProductTable } from "./components/ProductTable";
import { ProductFormModal } from "./components/ProductFormModal";
import { AddSizeRatioModal } from "./components/AddSizeRatioModal";
import { DangBanModal } from "./components/DangBanModal";
import { VariantDetailModal } from "./components/VariantDetailModal";
import { SuaTongModal } from "./components/SuaTongModal";
import { MasterDetailsModal } from "./components/MasterDetailsModal";
import { ChiTietNhapKhoModal } from "./components/ChiTietNhapKhoModal";
import { NhapKhoSuccessModal, type NhapKhoSuccessData } from "./components/NhapKhoSuccessModal";
import { useKho } from "@/lib/data/kho-store";
import { tinhGiaVonLenhCat } from "@/lib/gia-von-lenh-cat";
import { useBangGia, type KenhBan as KenhBanBangGia } from "@/lib/data/bang-gia-store";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { DS_KENH_BAN, type KenhBan } from "./data";

export default function KhoThanhPhamPage() {
  const { user } = useSession();
  const { dsLenhCat, capNhatTrangThai, suaLenhCat } = useLenhCat();
  const { giaoDich } = useKho();
  const { layGia, loading: loadingBangGia, chiTiet, themChiTiet, suaChiTiet } = useBangGia();
  const [lenhDangNhap, setLenhDangNhap] = useState<(typeof dsLenhCat)[number] | null>(null);
  const [kenhNhapKho, setKenhNhapKho] = useState<KenhBan[]>(["ban-le"]);
  const [nhapKhoSuccess, setNhapKhoSuccess] = useState<NhapKhoSuccessData | null>(null);
  const [justImportedIds, setJustImportedIds] = useState<string[]>([]);
  const [highlightedMaSP, setHighlightedMaSP] = useState<string | null>(null);
  const [isSubmittingNhapKho, setIsSubmittingNhapKho] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [dsSanPham, setDsSanPhamState] = useState<SanPhamTP[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("mimin_kho_thanh_pham_v2");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(chuanHoaSanPhamKho);
        }
      } catch {}
    }
    return [];
  });
  const { dsSanPham: dsDanhMuc, themSP, suaSP, xoaSP } = useDanhMucSP();
  const [dangBanGroup, setDangBanGroup] = useState<{ maSP: string; tenSP: string; items: SanPhamTP[] } | null>(null);
  const [suaTongGroup, setSuaTongGroup] = useState<{ maSP: string; tenSP: string; items: SanPhamTP[] } | null>(null);
  const [openVariant, setOpenVariant] = useState<SanPhamTP | null>(null);
  const [search, setSearch] = useState("");
  const [filterTrangThai, setFilterTrangThai] = useState<"all" | SanPhamTP["trangThai"]>("all");
  const [filterLoai, setFilterLoai] = useState<"all" | string>("all");
  const [filterSize, setFilterSize] = useState<"all" | string>("all");
  const [filterViTri, setFilterViTri] = useState<"all" | string>("all");
  const [filterThuongHieu, setFilterThuongHieu] = useState<"all" | "manpj" | "polomimin">("all");
  const [filterMucTon, setFilterMucTon] = useState<"all" | "con-hang" | "sap-het" | "het-hang">("all");
  const [sortBy, setSortBy] = useState<"ngay" | "sl" | "gt" | "ten">("ngay");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [editing, setEditing] = useState<SanPhamTP | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showAddSizeRatio, setShowAddSizeRatio] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const [productImages, setProductImages] = useState<Record<string, string>>({});
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [showMasterDetails, setShowMasterDetails] = useState<string | null>(null);
  const [productVideos, setProductVideos] = useState<Record<string, string>>({});
  const [uploadingSP, setUploadingSP] = useState<string | null>(null);
  const [uploadType, setUploadType] = useState<"image" | "video">("image");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadingSP) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (uploadType === "video") {
          setProductVideos((prev) => ({ ...prev, [uploadingSP]: ev.target?.result as string }));
        } else {
          setProductImages((prev) => ({ ...prev, [uploadingSP]: ev.target?.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper parse ngày an toàn, hỗ trợ cả DD/MM/YYYY lẫn ISO YYYY-MM-DD
  const parseNgayAnToan = (d?: string): number => {
    if (!d) return 0;
    const str = String(d).trim();
    if (str.includes("/")) {
      const parts = str.split("/");
      if (parts.length === 3) {
        const iso = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
        const t = Date.parse(iso);
        if (!isNaN(t)) return t;
      }
    }
    const t = Date.parse(str);
    return isNaN(t) ? 0 : t;
  };

  // Load từ localStorage trước (không trắng màn hình), rồi đọc lại 2 chiều từ Supabase
  // Nạp dữ liệu 3 chiều an toàn tuyệt đối: localStorage + Supabase + Tự động liên kết Lệnh Cắt Hoàn Thành
  // Đảm bảo không bao giờ bị trắng bảng, mất dòng khi mở tab hay sau khi nhập kho
  useEffect(() => {
    let localRows: SanPhamTP[] = [];
    let deletedIds = new Set<string>();
    try {
      const rawDel = localStorage.getItem("mimin_kho_tp_deleted_ids");
      if (rawDel) deletedIds = new Set(JSON.parse(rawDel));
    } catch {}

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SanPhamTP[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          localRows = parsed.map(chuanHoaSanPhamKho).filter(r => !deletedIds.has(r.id) && !deletedIds.has(r.lsx));
          setDsSanPhamState(localRows);
        }
      }
    } catch {}

    let mounted = true;
    (async () => {
      try {
        let remoteRows: SanPhamTP[] = [];
        if (checkSupabase()) {
          const rows = await supabaseFetchAllRaw<any>("kho_thanh_pham");
          if (!mounted) return;
          remoteRows = rows.map(fromSupabaseRow).filter(r => !deletedIds.has(r.id) && !deletedIds.has(r.lsx));
        }

        // Tự động kiểm tra và sinh tồn kho cho các Lệnh Cắt đã Hoàn Thành (hoặc hoàn thành đóng gói)
        const completedLCs = dsLenhCat.filter(
          (lc) =>
            lc.trangThai === "HoanThanh" ||
            lc.phanCong?.some(
              (pc: any) =>
                (pc.id === "nhap_kho" || pc.id === "nhapKho" || pc.tenCongDoan?.toLowerCase().includes("nhập kho")) &&
                pc.trangThaiCD === "hoan_thanh"
            )
        );

        const autoLCRows: SanPhamTP[] = completedLCs.flatMap((lc) =>
          taoSanPhamKhoTuLenhCat(lc, {
            layGiaFn: (kenh: KenhBanBangGia, maSP: string, sku?: string, sl?: number) => layGia(kenh, maSP, sku, sl),
          })
        ).filter(r => !deletedIds.has(r.id) && !deletedIds.has(r.lsx));

        // Chỉ giữ lại autoLCRows cho những sản phẩm/màu chưa từng xuất hiện trên server (tránh tự sinh duplicate đè hoặc nhân đôi tồn kho)
        const coveredColorKeys = new Set(
          remoteRows.map((rem) => `${String(rem.maSP || "").trim().toUpperCase()}::${String(rem.mau || "").trim().toLowerCase()}`)
        );

        const safeAutoLCRows = autoLCRows.filter((r) => {
          if (deletedIds.has(r.id) || (r.lsx && deletedIds.has(r.lsx))) return false;
          const key = `${String(r.maSP || "").trim().toUpperCase()}::${String(r.mau || "").trim().toLowerCase()}`;
          return !coveredColorKeys.has(key);
        });

        // Hợp nhất dữ liệu: safeAutoLCRows (nền) + localRows + remoteRows (ưu tiên cao nhất)
        const mergedMap = new Map<string, SanPhamTP>();
        safeAutoLCRows.forEach((r) => {
          if (!deletedIds.has(r.id) && !deletedIds.has(r.lsx)) mergedMap.set(r.id, r);
        });
        localRows.forEach((r) => {
          if (!deletedIds.has(r.id) && !deletedIds.has(r.lsx)) mergedMap.set(r.id, r);
        });
        remoteRows.forEach((r) => {
          if (!deletedIds.has(r.id) && !deletedIds.has(r.lsx)) mergedMap.set(r.id, r);
        });

        let finalMerged = Array.from(mergedMap.values()).filter(r => !deletedIds.has(r.id) && !deletedIds.has(r.lsx));
        if (finalMerged.length === 0) {
          finalMerged = generateSanPhamFromWorkflow();
        }

        if (mounted && finalMerged.length > 0) {
          setDsSanPhamState(finalMerged);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(finalMerged));
          } catch {}

          // Nếu có dòng nào trên Supabase chưa có (ví dụ lệnh cắt vừa hoàn thành), tự động đồng bộ lên Supabase
          if (checkSupabase()) {
            const remoteIds = new Set(remoteRows.map((r) => r.id));
            const missingOnSupabase = finalMerged.filter((r) => !remoteIds.has(r.id));
            if (missingOnSupabase.length > 0) {
              const { supabase } = await import("@/lib/supabase/client");
              if (supabase) {
                await supabase.from("kho_thanh_pham").upsert(missingOnSupabase.map(toSupabaseRow));
              }
            }
          }
        }
      } catch (e) {
        console.warn("[KhoThanhPham] Lỗi hợp nhất dữ liệu kho:", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [dsLenhCat, layGia]);

  useSupabaseRealtime("kho_thanh_pham", setDsSanPhamState, {
    primaryKey: "id",
    mapIn: (row: any) => fromSupabaseRow(row),
    localStorageKey: STORAGE_KEY,
  });

  // Đơn hàng chuyển sang "Đã giao" sẽ trừ tồn kho ở nơi khác (don-hang-store) rồi
  // phát sự kiện này - nạp lại từ localStorage để số tồn trên màn hình đúng ngay.
  useEffect(() => {
    const onChanged = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as SanPhamTP[];
        // Tuyệt đối không bao giờ ghi đè state bằng mảng rỗng []
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDsSanPhamState(parsed.map(chuanHoaSanPhamKho));
        }
      } catch {}
    };
    window.addEventListener(KHO_TP_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(KHO_TP_CHANGED_EVENT, onChanged);
  }, []);

  // Save on change: ghi localStorage ngay + đồng bộ Supabase an toàn
  const update = useCallback((newDs: SanPhamTP[]) => {
    setDsSanPhamState(newDs);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newDs));
    } catch {}
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(KHO_TP_CHANGED_EVENT));
    }
    if (checkSupabase() && newDs.length > 0) {
      Promise.all(newDs.map((row) => supabaseUpsertRaw("kho_thanh_pham", toSupabaseRow(row))))
        .catch((err) => console.error("[KhoThanhPham] sync error:", err));
    }
  }, []);

  // Filter + search + sort
  const filtered = useMemo(() => {
    let result = dsSanPham;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((s) =>
        s.maSP.toLowerCase().includes(q) ||
        s.tenSP.toLowerCase().includes(q) ||
        s.lsx.toLowerCase().includes(q) ||
        s.mau.toLowerCase().includes(q) ||
        s.size.toLowerCase().includes(q) ||
        s.viTri.toLowerCase().includes(q)
      );
    }
    if (filterThuongHieu !== "all") {
      result = result.filter((s) => {
        const str = `${s.maSP} ${s.tenSP} ${s.thuongHieu || ""}`.toLowerCase();
        const isMan = str.includes("tpj") || str.includes("manpj") || str.includes("man pj");
        return filterThuongHieu === "manpj" ? isMan : !isMan;
      });
    }
    if (filterMucTon !== "all") {
      result = result.filter((s) => {
        const sl = s.soLuong || 0;
        if (filterMucTon === "con-hang") return sl > 0;
        if (filterMucTon === "sap-het") return sl > 0 && sl < 50;
        if (filterMucTon === "het-hang") return sl === 0;
        return true;
      });
    }
    if (filterTrangThai !== "all") result = result.filter((s) => s.trangThai === filterTrangThai);
    if (filterLoai !== "all") {
      result = result.filter((sp) => {
        const checkStr = (sp.phanLoai || "").toLowerCase();
        if (filterLoai === "AoPolo") return checkStr.includes("áo polo") || checkStr.includes("ao polo") || checkStr === "aopolo";
        if (filterLoai === "AoTru") return checkStr.includes("áo trụ") || checkStr.includes("ao tru") || checkStr.includes("cổ trụ") || checkStr.includes("co tru") || checkStr === "aotru";
        if (filterLoai === "AoCoTron") return checkStr.includes("cổ tròn") || checkStr.includes("co tron") || checkStr.includes("áo thun") || checkStr === "áo" || checkStr === "ao" || checkStr === "aocotron";
        if (filterLoai === "BoCoTron") return checkStr.includes("bộ tròn") || checkStr.includes("bộ cổ tròn") || checkStr.includes("bo tron") || checkStr.includes("bo co tron") || checkStr === "bocotron";
        if (filterLoai === "BoTru") return checkStr.includes("bộ polo") || checkStr.includes("bo polo") || checkStr.includes("bộ trụ") || checkStr.includes("bo tru") || checkStr === "botru";
        if (filterLoai === "PhuKien") return checkStr.includes("phụ kiện") || checkStr.includes("phu kien") || checkStr.includes("quần") || checkStr === "phukien";
        return true;
      });
    }
    if (filterSize !== "all") result = result.filter((s) => s.size.includes(filterSize));
    if (filterViTri !== "all") result = result.filter((s) => s.viTri.includes(filterViTri));
    result = [...result].sort((a, b) => {
      // Ưu tiên cao nhất: Lệnh vừa mới nhập kho trong phiên được đưa lên trên cùng danh sách
      const aJust = (a.maLenhCat && justImportedIds.includes(a.maLenhCat)) || (a.id && justImportedIds.some((id) => a.id.includes(id)));
      const bJust = (b.maLenhCat && justImportedIds.includes(b.maLenhCat)) || (b.id && justImportedIds.some((id) => b.id.includes(id)));
      if (aJust && !bJust) return -1;
      if (!aJust && bJust) return 1;

      let cmp = 0;
      if (sortBy === "ngay") {
        cmp = parseNgayAnToan(a.ngayNhap) - parseNgayAnToan(b.ngayNhap);
      }
      if (sortBy === "sl") cmp = (a.soLuong || 0) - (b.soLuong || 0);
      if (sortBy === "gt") cmp = (a.giaTri || 0) - (b.giaTri || 0);
      if (sortBy === "ten") {
        cmp = (a.tenSP || "").localeCompare(b.tenSP || "");
      }
      
      // Nếu cùng ngày/giá trị (cmp = 0), ưu tiên xếp theo ID
      if (cmp === 0) {
        cmp = (a.id || "").localeCompare(b.id || "");
      }
      
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [dsSanPham, search, filterThuongHieu, filterMucTon, filterTrangThai, filterLoai, filterSize, filterViTri, sortBy, sortDir, justImportedIds]);

  const countManPJ = useMemo(() => {
    return dsSanPham.filter((s) => {
      const str = `${s.maSP} ${s.tenSP} ${s.thuongHieu || ""}`.toLowerCase();
      return str.includes("tpj") || str.includes("manpj") || str.includes("man pj");
    }).length;
  }, [dsSanPham]);

  const countPolomimin = useMemo(() => {
    return dsSanPham.length - countManPJ;
  }, [dsSanPham, countManPJ]);

  const totalQtyFiltered = useMemo(() => filtered.reduce((s, x) => {
    const sl = Number(x?.soLuong);
    return s + (isNaN(sl) || sl < 0 ? 0 : sl);
  }, 0), [filtered]);

  const totalValFiltered = useMemo(() => filtered.reduce((s, x) => {
    let gt = Number(x?.giaTri);
    if (isNaN(gt) || gt <= 0) {
      const sl = isNaN(Number(x?.soLuong)) ? 0 : Math.max(0, Number(x?.soLuong));
      const dg = isNaN(Number(x?.donGia)) ? (isNaN(Number(x?.giaVon)) ? 0 : Number(x?.giaVon)) : Number(x?.donGia);
      gt = sl * dg;
    }
    return s + (isNaN(gt) || gt < 0 ? 0 : gt);
  }, 0), [filtered]);

  const handleResetFilters = useCallback(() => {
    setSearch("");
    setFilterTrangThai("all");
    setFilterLoai("all");
    setFilterSize("all");
    setFilterViTri("all");
    setFilterThuongHieu("all");
    setFilterMucTon("all");
    setSortBy("ngay");
    setSortDir("desc");
    toast.success("Đã khôi phục bộ lọc mặc định");
  }, []);

  // Map hình ảnh từ Danh Mục Sản Phẩm để tự động hiển thị cho các lô hàng mới nhập
  const mergedProductImages = useMemo(() => {
    const map: Record<string, string> = { ...productImages };
    dsDanhMuc.forEach(dm => {
      let mainImg = dm.dsMau?.[0]?.img || dm.hinhAnh;
      
      if (!mainImg && dm.dsMau?.length > 0) {
        mainImg = dm.dsMau.find((m) => m.img)?.img || "";
      }
      
      if (mainImg) {
        if (!map[dm.id]) map[dm.id] = mainImg;
        // dm có thể có maSP (tuỳ DB), map cả 2 cho an toàn
        const maSP = (dm as any).maSP || (dm as any).ma_sp;
        if (maSP && !map[maSP]) map[maSP] = mainImg;
      }
    });
    // Lấy thêm hình ảnh từ các dòng kho thành phẩm đã có (nếu dòng mới không có ảnh nhưng dòng cũ có)
    dsSanPham.forEach(sp => {
      if (sp.hinhAnh?.[0] && !map[sp.maSP]) {
        map[sp.maSP] = sp.hinhAnh[0];
      }
    });
    return map;
  }, [productImages, dsDanhMuc, dsSanPham]);

  const mergedVariantImages = useMemo(() => {
    const map: Record<string, string> = {};
    dsDanhMuc.forEach(dm => {
      if (dm.dsMau) {
        dm.dsMau.forEach(m => {
          if (m.img) {
            map[`${dm.id}_${m.ten}`] = m.img;
          }
        });
      }
    });
    dsSanPham.forEach(sp => {
      if (sp.hinhAnh?.[0] && !map[`${sp.maSP}_${sp.mau}`]) {
        map[`${sp.maSP}_${sp.mau}`] = sp.hinhAnh[0];
      }
    });
    return map;
  }, [dsDanhMuc, dsSanPham]);

  const groupedProducts = useMemo(() => {
    const groups: Record<string, SanPhamTP[]> = {};
    filtered.forEach(s => {
      if (!groups[s.maSP]) groups[s.maSP] = [];
      groups[s.maSP].push(s);
    });
    return Object.entries(groups).map(([maSP, items]) => ({
      maSP,
      tenSP: items[0].tenSP,
      items
    }));
  }, [filtered]);

  // Thống kê
  const stats = useMemo(() => {
    const tongSP = dsSanPham.reduce((s, x) => {
      const sl = Number(x?.soLuong);
      return s + (isNaN(sl) || sl < 0 ? 0 : sl);
    }, 0);
    const tongGT = dsSanPham.reduce((s, x) => {
      let gt = Number(x?.giaTri);
      if (isNaN(gt) || gt <= 0) {
        const sl = isNaN(Number(x?.soLuong)) ? 0 : Math.max(0, Number(x?.soLuong));
        const dg = isNaN(Number(x?.donGia)) ? (isNaN(Number(x?.giaVon)) ? 0 : Number(x?.giaVon)) : Number(x?.donGia);
        gt = sl * dg;
      }
      return s + (isNaN(gt) || gt < 0 ? 0 : gt);
    }, 0);
    const soLoai = new Set(dsSanPham.map((x) => x.maSP).filter(Boolean)).size;
    const conHang = dsSanPham.filter((x) => (Number(x.soLuong) || 0) > 0 && x.trangThai === "con").length;
    const daDat = dsSanPham.filter((x) => x.trangThai === "dat-hang").length;
    return { tongSP, tongGT, soLoai, conHang, daDat };
  }, [dsSanPham]);

  // Unique maSP cho filter
  const dsLoai = useMemo(() => Array.from(new Set(dsSanPham.map((s) => s.maSP))).sort(), [dsSanPham]);

  // Helper: Đồng bộ toàn bộ thông tin sản phẩm từ Kho Thành Phẩm sang Danh Mục Sản Phẩm (san_pham)
  // Đảm bảo số lượng tồn kho từng màu, tỷ lệ size, bảng size, ảnh, tên SP, giá bán, loại SP luôn khớp 100%
  const dongBoSangDanhMucSP = async (
    maSPInput: string,
    customKhoRows?: SanPhamTP[],
    extraInfo?: {
      tenSP?: string;
      phanLoai?: string;
      anhDaiDien?: string;
      thuongHieu?: string;
      tiLeSize?: string;
      chiTietSize?: Array<{ size: string; sl: number }>;
    }
  ) => {
    const maSP = (maSPInput || "").trim();
    if (!maSP) return;
    const maSPNorm = maSP.toLowerCase();

    // 1. Lấy tất cả biến thể của sản phẩm này trong kho
    const allRows = customKhoRows || dsSanPham;
    const spRows = allRows.filter((item) => (item.maSP || "").trim().toLowerCase() === maSPNorm);

    // 2. Tìm sản phẩm trong dsDanhMuc
    const existingDM = dsDanhMuc.find(
      (d) => (d.id || "").trim().toLowerCase() === maSPNorm || (d.maSP || "").trim().toLowerCase() === maSPNorm
    );

    // Gom dữ liệu từ các dòng kho
    const firstRow = spRows[0];
    const tenSP = extraInfo?.tenSP || firstRow?.tenSP || existingDM?.tenSP || maSP;
    const phanLoai = (extraInfo?.phanLoai || firstRow?.phanLoai || existingDM?.loaiSP || "BoTru") as any;
    const thuongHieu = extraInfo?.thuongHieu || firstRow?.thuongHieu || existingDM?.thuongHieu || "Polomimin";

    // Xác định tỉ lệ size và bảng size từ variant mới nhất hoặc các dòng kho
    const tiLeSize = extraInfo?.tiLeSize || firstRow?.tiLeSize || existingDM?.tiLeSize || "1:1:1:1";
    let sizesList: string[] = [];
    if (extraInfo?.chiTietSize && extraInfo.chiTietSize.length > 0) {
      sizesList = extraInfo.chiTietSize.map((s) => s.size.trim()).filter(Boolean);
    } else {
      const allSizesFromRows = Array.from(
        new Set(spRows.flatMap((r) => (r.chiTietSize || []).map((s) => s.size.trim())).filter(Boolean))
      );
      if (allSizesFromRows.length > 0) {
        sizesList = allSizesFromRows;
      } else if (existingDM?.bangSize?.sizes?.length) {
        sizesList = existingDM.bangSize.sizes;
      } else {
        sizesList = ["L", "XL", "2XL", "3XL"];
      }
    }
    const ratioParts = (tiLeSize || "").split(/[:,-]+/).map((n) => parseInt(n.trim(), 10) || 1);
    const ratios = sizesList.map((_, idx) => ratioParts[idx] ?? 1);
    const riSo = ratios.reduce((a, b) => a + b, 0) || sizesList.length || 1;
    const bangSize = {
      sizes: sizesList,
      ratios,
      riSo,
    };

    // Tính giá
    const giaBanLe = Math.max(...spRows.map((r) => r.giaBanLe || 0), existingDM?.giaBanLe || 0, existingDM?.giaBanDuKien || 0);
    const giaBanSi = Math.max(...spRows.map((r) => r.giaBanSi || 0), existingDM?.giaBanSi || 0);
    const giaBanLo = Math.max(...spRows.map((r) => r.giaBanLo || 0), existingDM?.giaBanLo || 0);
    const giaTikTok = Math.max(...spRows.map((r) => r.giaTikTok || 0), existingDM?.giaTikTok || 0);
    const giaShopee = Math.max(...spRows.map((r) => r.giaShopee || 0), existingDM?.giaShopee || 0);
    const giaVon = Math.max(...spRows.map((r) => r.donGia || r.giaVon || 0), existingDM?.giaVonDuKien || 0);

    // Gom danh sách màu duy nhất
    const mauMap = new Map<string, { ten: string; img: string; soLuongKho: number; maSKU: string; video?: string; dinhMuc: number }>();
    
    // Đưa các màu từ các dòng kho vào
    for (const row of spRows) {
      const tenMau = (row.mau || "Mặc định").trim();
      const tenMauNorm = tenMau.toLowerCase();
      const rowSL = Math.max(0, Number(row.soLuong) || 0);
      const rowImg = row.hinhAnh?.[0] || row.imgQuan || "";

      // Kiểm tra xem trong existingDM đã có màu này chưa để ưu tiên giữ lại custom SKU & định mức
      const existingColor = existingDM?.dsMau?.find(
        (m: any) => String(m.ten || "").trim().toLowerCase() === tenMauNorm
      );

      if (!mauMap.has(tenMauNorm)) {
        mauMap.set(tenMauNorm, {
          ten: tenMau,
          img: rowImg || existingColor?.img || "",
          soLuongKho: rowSL,
          maSKU: existingColor?.maSKU || row.maSKU || `${maSP}-${tenMau.toUpperCase()}`,
          video: row.video || existingColor?.video,
          dinhMuc: existingColor?.dinhMuc ?? 0.26,
        });
      } else {
        const cur = mauMap.get(tenMauNorm)!;
        cur.soLuongKho += rowSL;
        if (rowImg && !cur.img) cur.img = rowImg;
        if (row.video && !cur.video) cur.video = row.video;
        if (existingColor?.maSKU) cur.maSKU = existingColor.maSKU;
      }
    }

    // Nếu trong existingDM có màu cũ nhưng kho chưa có dòng nào (ví dụ màu 0 tồn)
    if (existingDM?.dsMau && Array.isArray(existingDM.dsMau)) {
      for (const m of existingDM.dsMau) {
        if (!m || !m.ten) continue;
        const mNorm = String(m.ten || "").trim().toLowerCase();
        if (!mNorm) continue;
        if (mauMap.has(mNorm)) {
          const cur = mauMap.get(mNorm)!;
          if (!cur.img && m.img) cur.img = m.img;
          if (!cur.video && m.video) cur.video = m.video;
          if (m.maSKU) cur.maSKU = m.maSKU;
        } else {
          // Giữ lại các màu đã khai báo bên Danh Mục dù hiện tại kho chưa có hàng
          mauMap.set(mNorm, {
            ten: m.ten,
            img: m.img || "",
            soLuongKho: 0,
            maSKU: m.maSKU || `${maSP}-${String(m.ten || "").toUpperCase()}`,
            video: m.video,
            dinhMuc: m.dinhMuc ?? 0.26,
          });
        }
      }
    }

    const dsMauMoi = Array.from(mauMap.values()).map((m) => ({
      ten: m.ten,
      maSKU: m.maSKU,
      dinhMuc: m.dinhMuc,
      img: m.img,
      video: m.video,
      soLuongKho: m.soLuongKho,
    }));

    // Ảnh đại diện ưu tiên màu còn hàng có ảnh, rồi đến bất kỳ màu nào có ảnh, rồi đến ảnh đầu tiên của kho
    let anhDaiDien = extraInfo?.anhDaiDien;
    if (!anhDaiDien) {
      const inStockWithImg = dsMauMoi.find((m) => m.img && m.soLuongKho > 0);
      const anyWithImg = dsMauMoi.find((m) => m.img);
      const khoFirstImg = spRows.find((r) => r.hinhAnh?.[0])?.hinhAnh?.[0];
      anhDaiDien = inStockWithImg?.img || anyWithImg?.img || khoFirstImg || existingDM?.hinhAnh || (maSP && /^M\d{2}$/i.test(maSP) ? `/product-models/${maSP}.png` : "");
    }

    if (existingDM) {
      await suaSP(
        existingDM.id,
        {
          tenSP,
          loaiSP: phanLoai,
          thuongHieu,
          ncc: thuongHieu,
          giaBanLe,
          giaBanSi,
          giaBanLo,
          giaTikTok,
          giaShopee,
          giaBanDuKien: giaBanLe,
          giaVonDuKien: giaVon,
          tiLeSize,
          bangSize,
          dsMau: dsMauMoi,
          hinhAnh: anhDaiDien,
          trangThai: dsMauMoi.some((m) => m.soLuongKho > 0) ? "con-hang" : "het-hang",
        },
        { skipKhoSync: true }
      );
    } else {
      await themSP(
        {
          id: maSP,
          maSP: maSP,
          tenSP,
          loaiSP: phanLoai,
          thuongHieu,
          ncc: thuongHieu,
          giaBanLe,
          giaBanSi,
          giaBanLo,
          giaTikTok,
          giaShopee,
          giaBanDuKien: giaBanLe,
          giaVonDuKien: giaVon,
          tiLeSize,
          bangSize,
          dsMau: dsMauMoi,
          ghiChu: "Đồng bộ từ Kho thành phẩm",
          ngayTao: new Date().toISOString().slice(0, 10),
          trangThai: dsMauMoi.some((m) => m.soLuongKho > 0) ? "con-hang" : "het-hang",
          hinhAnh: anhDaiDien,
        },
        { skipKhoSync: true }
      );
    }

    // Trực tiếp cập nhật bảng san_pham trên Supabase để đồng bộ ngay lập tức cho các tab và thiết bị
    if (checkSupabase()) {
      try {
        const { supabase } = await import("@/lib/supabase/client");
        const { buildDBPayload } = await import("@/lib/data/danh-muc-sp-store");
        if (supabase) {
          const spToSave: any = {
            ...(existingDM || {}),
            id: maSP,
            maSP: maSP,
            tenSP,
            loaiSP: phanLoai,
            thuongHieu,
            giaBanLe,
            giaBanSi,
            giaBanLo,
            giaTikTok,
            giaShopee,
            giaBanDuKien: giaBanLe,
            giaVonDuKien: giaVon,
            tiLeSize,
            bangSize,
            dsMau: dsMauMoi,
            hinhAnh: anhDaiDien,
            trangThai: dsMauMoi.some((m) => m.soLuongKho > 0) ? "con-hang" : "het-hang",
          };
          await supabase.from("san_pham").upsert(buildDBPayload(spToSave), { onConflict: "ma_sp" });
        }
      } catch (errSync) {
        console.warn("[KhoThanhPham] Lỗi upsert sang Supabase san_pham:", errSync);
      }
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(KHO_TP_CHANGED_EVENT));
      window.dispatchEvent(new CustomEvent("mimin:danh-muc-sp-changed"));
    }
  };

  // Handlers - ThemNhieuBienTheForm gửi lên 1 MẢNG (nhiều biến thể/màu cùng
  // lô), form Sửa vẫn gửi 1 object đơn - chuẩn hoá về mảng để xử lý chung.
  const handleAdd = async (data: any) => {
    const list = Array.isArray(data) ? data : [data];
    const newImages: Record<string, string> = {};
    const groupMaSP = (list[0]?.maSP || "").trim().toUpperCase();

    const newRows: SanPhamTP[] = list.map((item, i) => {
      const { __tempImage, bangGiaSelected, ...sp } = item;
      const cleanMau = (sp.mau || "Mặc định").trim();
      const variantKey = (cleanMau || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .replace(/[^a-zA-Z0-9]/g, "")
        .toUpperCase() || `V${i}`;
      const id = `TP-${groupMaSP}-${variantKey}`;
      
      const imgList = sp.hinhAnh && sp.hinhAnh.length > 0 ? sp.hinhAnh : (__tempImage ? [__tempImage] : []);
      if (__tempImage) {
        newImages[id] = __tempImage;
      }
      
      const donGia = Number(sp.donGia || sp.giaVon || 0);
      const soLuong = Number(sp.soLuong || 0);

      return { 
        ...sp, 
        id, 
        maSP: groupMaSP,
        mau: cleanMau,
        hinhAnh: imgList,
        donGia,
        giaVon: donGia,
        giaTri: soLuong * donGia,
        maSKU: sp.maSKU || `${groupMaSP}-${cleanMau.toUpperCase()}`
      };
    });
    const updatedKho = [...newRows, ...dsSanPham];
    update(updatedKho);
    if (Object.keys(newImages).length > 0) {
      setProductImages((prev) => ({ ...prev, ...newImages }));
    }
    const tongSL = newRows.reduce((s, r) => s + (r.soLuong || 0), 0);
    toast.success(newRows.length > 1 ? `Đã thêm ${newRows.length} biến thể (${tongSL} sp)` : `Đã thêm ${newRows[0]?.tenSP} (${tongSL} sp)`);
    setShowAdd(false);

    // Tự động đồng bộ lên Danh mục sản phẩm (hình ảnh, màu sắc, SKU, giá bán, giá vốn)
    if (groupMaSP) {
      await dongBoSangDanhMucSP(groupMaSP, updatedKho, {
        tenSP: newRows[0]?.tenSP,
        phanLoai: newRows[0]?.phanLoai,
        anhDaiDien: newRows.find((r) => r.hinhAnh?.[0])?.hinhAnh?.[0] || newRows[0]?.hinhAnh?.[0],
        thuongHieu: newRows[0]?.thuongHieu,
      });
    }
    
    // Đồng bộ Bảng Giá Chi Tiết
    const bangGiaSelected = list[0]?.bangGiaSelected;
    if (groupMaSP && bangGiaSelected) {
       Object.entries(bangGiaSelected).forEach(([kenh, bgId]) => {
         if (!bgId) return;
         let giaBan = 0;
         if (kenh === "ban-le") giaBan = list[0].giaBanLe;
         if (kenh === "ban-si") giaBan = list[0].giaBanSi;
         if (kenh === "ban-lo") giaBan = list[0].giaBanLo;
         if (kenh === "tiktok") giaBan = list[0].giaTikTok;
         if (kenh === "shopee") giaBan = list[0].giaShopee;
         
         const existingChiTiet = chiTiet.find(ct => ct.bangGiaId === bgId && ct.maSP === groupMaSP && !ct.maSKUBienThe);
         if (existingChiTiet) {
           suaChiTiet(existingChiTiet.id, { giaBan });
         } else {
           themChiTiet({ bangGiaId: bgId as string, maSP: groupMaSP, giaBan, soLuongTu: 1 });
         }
       });
    }
  };

  const handleEdit = async (data: any) => {
    const { __tempImage, bangGiaSelected, ...sp } = data;
    
    if (__tempImage) {
      if (!sp.hinhAnh || sp.hinhAnh.length === 0) {
        sp.hinhAnh = [__tempImage];
      } else {
        const filtered = Array.isArray(sp.hinhAnh) ? sp.hinhAnh.filter((i: string) => i !== __tempImage) : [];
        sp.hinhAnh = [__tempImage, ...filtered];
      }
    }
    
    let newTrangThai = sp.trangThai;
    if (sp.soLuong === 0) newTrangThai = "xuat-kho";
    else if (sp.soLuong > 0 && (sp.trangThai === "xuat-kho" || sp.trangThai === "het")) newTrangThai = "con";

    // Tự động phân bổ lại chiTietSize nếu số lượng thay đổi hoặc nếu chiTietSize đang bằng 0 hết
    let newChiTietSize = sp.chiTietSize ? [...sp.chiTietSize] : [];
    const tongCT = newChiTietSize.reduce((sum: number, x: any) => sum + (Number(x.sl) || 0), 0);
    if (sp.soLuong > 0 && tongCT === 0) {
      if (newChiTietSize.length > 0) {
        let conLai = sp.soLuong;
        const curSizes = newChiTietSize;
        newChiTietSize = curSizes.map((x: any, idx: number) => {
          if (idx === curSizes.length - 1) return { ...x, sl: conLai };
          const chia = Math.floor(sp.soLuong / curSizes.length);
          conLai -= chia;
          return { ...x, sl: Math.max(0, chia) };
        });
      } else {
        newChiTietSize = [{ size: sp.size || "Freesize", sl: sp.soLuong }];
      }
    } else if (tongCT > 0 && tongCT !== sp.soLuong) {
      let conLai = sp.soLuong;
      const curSizes = newChiTietSize;
      newChiTietSize = curSizes.map((x: any, idx: number) => {
        if (idx === curSizes.length - 1) return { ...x, sl: conLai };
        const slMoi = Math.round((Number(x.sl) / tongCT) * sp.soLuong);
        conLai -= slMoi;
        return { ...x, sl: Math.max(0, slMoi) };
      });
    }
    const newSizeStr = hienThiDanhSachSize(sp.size || "", newChiTietSize);
    
    const cleanVariant: SanPhamTP = { 
      ...sp, 
      size: newSizeStr,
      chiTietSize: newChiTietSize,
      giaTri: (sp.soLuong || 0) * (sp.donGia || 0), 
      trangThai: newTrangThai 
    };

    const updatedKho: SanPhamTP[] = dsSanPham.map((s) => (s.id === cleanVariant.id ? cleanVariant : s));

    // 1. Cập nhật state & localStorage
    update(updatedKho);

    // 2. Trực tiếp upsert biến thể này lên Supabase kho_thanh_pham ngay lập tức
    if (checkSupabase()) {
      try {
        const { supabase } = await import("@/lib/supabase/client");
        if (supabase) {
          await supabase.from("kho_thanh_pham").upsert(toSupabaseRow(cleanVariant), { onConflict: "id" });
        }
      } catch (err) {
        console.warn("[KhoThanhPham] Lỗi upsert biến thể lên Supabase:", err);
      }
    }

    if (__tempImage) {
      setProductImages((prev) => ({ ...prev, [sp.id]: __tempImage }));
    }

    // 3. Tự động đồng bộ sang Danh mục sản phẩm (tồn kho từng màu, ảnh, tên, giá...)
    try {
      await dongBoSangDanhMucSP(sp.maSP, updatedKho, {
        tenSP: sp.tenSP,
        phanLoai: sp.phanLoai,
        anhDaiDien: __tempImage || sp.hinhAnh?.[0],
        thuongHieu: sp.thuongHieu,
      });
    } catch (dmErr) {
      console.warn("[KhoThanhPham] Lỗi đồng bộ Danh mục:", dmErr);
    }

    // Đồng bộ Bảng Giá Chi Tiết
    if (sp.maSP && bangGiaSelected) {
       Object.entries(bangGiaSelected).forEach(([kenh, bgId]) => {
         if (!bgId) return;
         let giaBan = 0;
         if (kenh === "ban-le") giaBan = sp.giaBanLe;
         if (kenh === "ban-si") giaBan = sp.giaBanSi;
         if (kenh === "ban-lo") giaBan = sp.giaBanLo;
         if (kenh === "tiktok") giaBan = sp.giaTikTok;
         if (kenh === "shopee") giaBan = sp.giaShopee;
         
         const existingChiTiet = chiTiet.find(ct => ct.bangGiaId === bgId && ct.maSP === sp.maSP && !ct.maSKUBienThe);
         if (existingChiTiet) {
           suaChiTiet(existingChiTiet.id, { giaBan });
         } else {
           themChiTiet({ bangGiaId: bgId as string, maSP: sp.maSP, giaBan, soLuongTu: 1 });
         }
       });
    }

    const tenMau = cleanVariant.mau || sp.mau;
    toast.success(`Đã cập nhật biến thể màu ${tenMau} & đồng bộ Danh mục sản phẩm`);
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    const spToDelete = dsSanPham.find((s) => s.id === id);
    if (!spToDelete) return;

    if (!confirm(`Bạn có chắc chắn muốn xóa biến thể "${spToDelete.mau}" của sản phẩm "${spToDelete.tenSP || spToDelete.maSP}"?`)) return;

    // 1. Chỉ xóa duy nhất biến thể có ID này khỏi Kho Thành Phẩm
    const remainingKho = dsSanPham.filter((s) => s.id !== id);
    update(remainingKho);

    // 2. Lưu vào danh sách đã xóa để F5/reload không bị nạp lại từ cache cũ
    try {
      const rawDel = localStorage.getItem("mimin_kho_tp_deleted_ids");
      const delSet = new Set<string>(rawDel ? JSON.parse(rawDel) : []);
      delSet.add(id);
      if (spToDelete.lsx) delSet.add(spToDelete.lsx);
      localStorage.setItem("mimin_kho_tp_deleted_ids", JSON.stringify(Array.from(delSet)));
    } catch {}

    // 3. Xóa triệt để khỏi Supabase bảng kho_thanh_pham
    try {
      const { supabase } = await import("@/lib/supabase/client");
      if (supabase) {
        await supabase.from("kho_thanh_pham").delete().eq("id", id);
        if (spToDelete.lsx) {
          await supabase.from("kho_thanh_pham").delete().eq("lsx", spToDelete.lsx);
        }
      }
    } catch (e) {
      console.error("Lỗi xóa kho_thanh_pham variant:", e);
    }

    // 4. Đồng bộ sang Danh mục sản phẩm
    await dongBoSangDanhMucSP(spToDelete.maSP, remainingKho);

    // 5. Phát sự kiện
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(KHO_TP_CHANGED_EVENT));
      window.dispatchEvent(new CustomEvent("mimin:danh-muc-sp-changed"));
    }

    toast.success(`Đã xóa biến thể màu "${spToDelete.mau}"`);
  };

  const handleDeleteGroup = async (group: { maSP: string; tenSP: string; items: SanPhamTP[] }) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa toàn bộ sản phẩm "${group.tenSP || group.maSP}" không?\n\nTất cả ${group.items.length} biến thể sẽ bị xóa khỏi Kho thành phẩm.`)) return;

    // 1. Cập nhật kho thành phẩm: xóa tất cả sản phẩm thuộc mã này
    const remainingKho = dsSanPham.filter((s) => s.maSP !== group.maSP);
    update(remainingKho);

    // 2. Lưu vào danh sách đã xóa để F5/reload không bị nạp lại từ cache cũ
    try {
      const rawDel = localStorage.getItem("mimin_kho_tp_deleted_ids");
      const delSet = new Set<string>(rawDel ? JSON.parse(rawDel) : []);
      group.items.forEach((it) => {
        if (it.id) delSet.add(it.id);
        if (it.lsx) delSet.add(it.lsx);
      });
      localStorage.setItem("mimin_kho_tp_deleted_ids", JSON.stringify(Array.from(delSet)));
    } catch {}

    // 3. Xóa khỏi Supabase bảng kho_thanh_pham
    try {
      const { supabase } = await import("@/lib/supabase/client");
      if (supabase) {
        await supabase.from("kho_thanh_pham").delete().eq("ma_sp", group.maSP);
      }
    } catch (e) {
      console.error("Lỗi xóa kho_thanh_pham group:", e);
    }

    // 3. Phát sự kiện
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(KHO_TP_CHANGED_EVENT));
      window.dispatchEvent(new CustomEvent("mimin:danh-muc-sp-changed"));
    }

    toast.success(`Đã xóa toàn bộ sản phẩm "${group.tenSP || group.maSP}"`);
  };

  const handleXuatKho = (id: string) => {
    const sp = dsSanPham.find((s) => s.id === id);
    if (!sp) return;
    const sl = prompt(`Xuất bao nhiêu ${sp.tenSP}?`, "1");
    const n = parseInt(sl || "0");
    if (n <= 0) return;
    if (n > sp.soLuong) { toast.error("Vượt quá tồn kho"); return; }
    update(dsSanPham.map((s) => s.id === id ? { ...s, soLuong: s.soLuong - n, trangThai: s.soLuong - n === 0 ? "xuat-kho" : s.trangThai } : s));
    toast.success(`Đã xuất ${n} sp`);
  };

  const handleAutoGenerate = () => {
    if (!confirm("Tự động tạo lại danh sách từ workflow data (các phiếu ĐG hoàn thành)?")) return;
    const ds = generateSanPhamFromWorkflow();
    update(ds);
    toast.success(`Đã tạo ${ds.length} sản phẩm từ workflow`);
  };

  const handleSaveVariant = async (updated: SanPhamTP) => {
    const cleanSizes = (updated.chiTietSize || [])
      .map((x) => ({
        size: String(x.size).trim(),
        sl: Math.max(0, Number(x.sl) || 0),
      }))
      .filter((x) => x.size.length > 0);

    const tongCT = cleanSizes.reduce((sum, x) => sum + x.sl, 0);
    const soLuongMoi = cleanSizes.length > 0 ? tongCT : Math.max(0, Number(updated.soLuong) || 0);
    const newTrangThai = soLuongMoi === 0 ? "xuat-kho" : "con";

    const cleanVariant: SanPhamTP = {
      ...updated,
      soLuong: soLuongMoi,
      trangThai: newTrangThai,
      size: hienThiDanhSachSize(updated.size || "", cleanSizes),
      chiTietSize: cleanSizes,
      tiLeSize: updated.tiLeSize,
      giaTri: soLuongMoi * (Number(updated.donGia) || 0),
    };

    const updatedKho: SanPhamTP[] = dsSanPham.map((s) => (s.id === cleanVariant.id ? cleanVariant : s));
    update(updatedKho);
    
    // Trực tiếp upsert biến thể lên Supabase
    if (checkSupabase()) {
      try {
        const { supabase } = await import("@/lib/supabase/client");
        if (supabase) {
          await supabase.from("kho_thanh_pham").upsert(toSupabaseRow(cleanVariant), { onConflict: "id" });
        }
      } catch (err) {
        console.warn("[KhoThanhPham] Lỗi upsert biến thể lên Supabase:", err);
      }
    }

    // Đồng bộ toàn diện sang Danh mục sản phẩm (tồn kho từng màu, tỷ lệ size, bảng size, ảnh, giá...)
    try {
      await dongBoSangDanhMucSP(cleanVariant.maSP, updatedKho, {
        tenSP: cleanVariant.tenSP,
        phanLoai: cleanVariant.phanLoai,
        anhDaiDien: cleanVariant.hinhAnh?.[0],
        thuongHieu: cleanVariant.thuongHieu,
        tiLeSize: cleanVariant.tiLeSize,
        chiTietSize: cleanSizes,
      });
    } catch (dmErr) {
      console.warn("[KhoThanhPham] Lỗi đồng bộ Danh mục:", dmErr);
    }
    
    toast.success(`Đã lưu chi tiết màu ${cleanVariant.mau} & đồng bộ Danh mục sản phẩm`);
  };

  const handleSaveSuaTong = async (updatedItems: SanPhamTP[], bgSelected?: Record<string, string>) => {
    const maSP = updatedItems[0]?.maSP;
    if (!maSP) return;
    
    // Merge into Kho Thành Phẩm
    const otherItems = dsSanPham.filter(s => s.maSP !== maSP);
    const updatedKho = [...updatedItems, ...otherItems];
    update(updatedKho);

    // Trực tiếp upsert các dòng thay đổi lên Supabase
    if (checkSupabase() && updatedItems.length > 0) {
      try {
        const { supabase } = await import("@/lib/supabase/client");
        if (supabase) {
          await supabase.from("kho_thanh_pham").upsert(updatedItems.map(toSupabaseRow), { onConflict: "id" });
        }
      } catch (err) {
        console.warn("[KhoThanhPham] Lỗi upsert nhóm SP lên Supabase:", err);
      }
    }
    
    // Đồng bộ toàn diện sang Danh Mục SP (tồn kho, ảnh, giá, loại...)
    try {
      await dongBoSangDanhMucSP(maSP, updatedKho, { 
        tenSP: updatedItems[0].tenSP, 
        phanLoai: updatedItems[0].phanLoai,
        anhDaiDien: updatedItems[0].hinhAnh?.[0],
        thuongHieu: updatedItems[0].thuongHieu,
      });
    } catch (dmErr) {
      console.warn("[KhoThanhPham] Lỗi đồng bộ Danh mục:", dmErr);
    }

    if (bgSelected) {
      Object.entries(bgSelected).forEach(([kenh, bgId]) => {
        if (!bgId) return;
        let giaBan = 0;
        if (kenh === "ban-le") giaBan = updatedItems[0].giaBanLe || 0;
        if (kenh === "ban-si") giaBan = updatedItems[0].giaBanSi || 0;
        if (kenh === "ban-lo") giaBan = updatedItems[0].giaBanLo || 0;
        if (kenh === "tiktok") giaBan = updatedItems[0].giaTikTok || 0;
        if (kenh === "shopee") giaBan = updatedItems[0].giaShopee || 0;
        
        // Cập nhật cho biến thể chung (không phân biệt size/màu)
        const existingChiTiet = chiTiet.find(ct => ct.bangGiaId === bgId && ct.maSP === maSP && !ct.maSKUBienThe);
        if (existingChiTiet) {
          suaChiTiet(existingChiTiet.id, { giaBan });
        } else {
          themChiTiet({ bangGiaId: bgId, maSP: maSP, giaBan, soLuongTu: 1 });
        }
      });
    }

    setSuaTongGroup(null);
    toast.success(`Đã cập nhật thông tin chung cho ${updatedItems.length} biến thể của ${maSP} & đồng bộ Danh mục`);
  };

  // Tách/đồng bộ lại 1 nhóm sản phẩm thành card riêng cho MỖI MÀU, dựa trên
  // dsMau + số lượng thật của khâu Đóng gói ở lệnh cắt gốc. Dùng cho các bản ghi
  // cũ bị gộp "Nhiều màu" (nhập kho trước khi sửa lỗi gộp màu) - giữ lại ảnh/giá
  // đã nhập riêng nếu tên màu trùng khớp với card cũ.
  const handleRebuildFromLC = (group: { maSP: string; tenSP: string; items: SanPhamTP[] }) => {
    const lsx = group.items[0]?.maLenhCat || group.maSP;
    const lc = dsLenhCat.find((l) => l.id === lsx);
    if (!lc || !lc.dsMau || lc.dsMau.length === 0) {
      toast.error("Không tìm thấy dữ liệu màu từ lệnh cắt gốc để tách");
      return;
    }
    const maSPMoi = lc.maSP || group.maSP;
    const doiMaMsg = maSPMoi !== group.maSP ? ` Mã SP sẽ đổi từ "${group.maSP}" thành "${maSPMoi}" (mã lệnh cắt vs mã sản phẩm thật).` : "";
    if (!confirm(`Tách "${group.maSP}" thành ${lc.dsMau.length} card theo màu (dựa trên lệnh cắt gốc ${lc.id}).${doiMaMsg}`)) return;

    const dongGoiPCs = (lc.phanCong || []).filter(
      (pc: any) => pc.id === "dongGoi" || pc.id === "dong_goi" || pc.tenCongDoan?.toLowerCase().includes("đóng gói")
    );
    const chiTietMauAll: any[] = dongGoiPCs.flatMap((pc: any) => pc.chiTietMau || []);
    const viTri = group.items.find((i) => i.viTri)?.viTri || "";
    const ngayNhap = group.items[0]?.ngayNhap || new Date().toISOString().slice(0, 10);

    // Giá vốn 1 SP từ lệnh cắt gốc - dùng khi bản ghi cũ chưa có (donGia = 0)
    const ketQuaGiaVon = tinhGiaVonLenhCat(lc, giaoDich);
    const giaVon1SP = ketQuaGiaVon.giaVon1SP;
    if (giaVon1SP <= 0) {
      const vatTuThieu = ketQuaGiaVon.maVatTuThieuGia.length > 0
        ? ` Thiếu đơn giá nhập của: ${ketQuaGiaVon.maVatTuThieuGia.join(", ")}.`
        : "";
      toast.error(`Lệnh ${lc.id} chưa tính được giá vốn, không thể nhập kho.${vatTuThieu}`, { duration: 7000 });
      return;
    }

    const newSPs: SanPhamTP[] = lc.dsMau.map((m: any, idx: number) => {
      const ct = chiTietMauAll.find((c: any) => c.mau === m.ten);
      const old = group.items.find((i) => i.mau === m.ten);
      const sl = ct?.soLuongDat ?? old?.soLuong ?? Math.round((lc.tongSL || 0) / lc.dsMau.length);
      const donGia = old?.donGia || giaVon1SP;
      return {
        id: old?.id || `SP-${Date.now()}-${idx}`,
        maSP: lc.maSP || group.maSP,
        tenSP: group.tenSP,
        phanLoai: old?.phanLoai || lc.loaiSP || "BoTru",
        mau: m.ten,
        size: "Nhiều size",
        lsx,
        ngayNhap,
        soLuong: sl,
        donGia,
        giaTri: sl * donGia,
        viTri,
        trangThai: old?.trangThai || "con",
        hinhAnh: old?.hinhAnh?.length ? old.hinhAnh : m.img ? [m.img] : [],
        imgQuan: old?.imgQuan || m.imgQuan || undefined,
        video: old?.video,
        giaBanLe: old?.giaBanLe,
        giaBanSi: old?.giaBanSi,
        chiTietSize: ct?.sizes || m.phanBoSize || old?.chiTietSize || [],
      };
    });

    const otherItems = dsSanPham.filter((s) => s.maSP !== group.maSP);
    update([...newSPs, ...otherItems]);
    toast.success(`Đã tách ${maSPMoi} thành ${newSPs.length} card theo màu`);
  };

  // Chuyển 1 nhóm sản phẩm (theo maSP) từ Kho thành phẩm sang Danh mục sản phẩm để bán.
  // Lấy tên màu + ảnh từ chính các card màu trong Kho thành phẩm (group.items) - đây là
  // nguồn đáng tin cậy vì đã được sửa/tách đúng qua "Tách theo màu"; lệnh cắt gốc (lc.dsMau)
  // chỉ dùng để tham khảo định mức, vì có thể thiếu tên/ảnh ở 1 vài màu.
  const handleDangBan = async (giaBan: number, giaVon: number) => {
    const group = dangBanGroup;
    if (!group) return;

    const lsx = group.items[0]?.maLenhCat;
    const lc = dsLenhCat.find((l) => l.id === lsx);
    const mauTuLC = lc?.dsMau || [];

    const dsMauForSanPham: MauTieuChuan[] = group.items.map((item) => {
      const mauGoc = mauTuLC.find((m) => m.ten === item.mau);
      return {
        ten: item.mau,
        maSKU: item.maSKU || mauGoc?.maSKU || `${group.maSP}-${item.mau}`,
        dinhMuc: mauGoc?.dinhMuc || 0,
        img: item.hinhAnh?.[0] || mauGoc?.img || "",
        video: item.video,
      };
    });

    // Ảnh đại diện cho card thư viện (SanPham.hinhAnh là 1 URL, khác dsMau[].img theo màu) -
    // lấy ảnh màu đầu tiên có ảnh, fallback ảnh đã upload riêng trong Kho thành phẩm.
    const anhDaiDien = dsMauForSanPham.find((m) => m.img)?.img || group.items.find((i) => i.hinhAnh?.[0])?.hinhAnh?.[0] || "";

    // Kiểm tra trực tiếp Supabase thay vì dùng dsDanhMuc cache (có thể chưa tải xong
    // lúc bấm nút, dẫn tới nhầm "chưa có" -> tạo bản ghi trùng thay vì cập nhật).
    let existingId: string | undefined = dsDanhMuc.find((sp) => sp.id === group.maSP)?.id;
    if (!existingId) {
      try {
        const { supabase } = await import("@/lib/supabase/client");
        if (supabase) {
          const { data } = await supabase.from("san_pham").select("ma_sp").eq("ma_sp", group.maSP).limit(1).maybeSingle();
          if (data) existingId = group.maSP;
        }
      } catch (e) {
        console.error("Lỗi kiểm tra sản phẩm đã tồn tại trong Danh mục", e);
      }
    }

    if (existingId) {
      const existing = dsDanhMuc.find((sp) => sp.id === existingId);
      suaSP(existingId, {
        giaBanDuKien: giaBan,
        giaVonDuKien: giaVon || existing?.giaVonDuKien || 0,
        dsMau: dsMauForSanPham,
        tenSP: group.tenSP || existing?.tenSP || group.maSP,
        hinhAnh: anhDaiDien || existing?.hinhAnh || "",
      });
      toast.success(`Đã cập nhật ${group.maSP} trong Danh mục sản phẩm`);
    } else {
      themSP({
        id: group.maSP,
        tenSP: group.tenSP || lc?.tenSP || group.maSP,
        loaiSP: lc?.loaiSP || "BoTru",
        giaBanDuKien: giaBan,
        giaVonDuKien: giaVon || 0,
        tiLeSize: lc?.tiLeSize || "",
        bangSize: {
          sizes: lc?.dsMau?.[0]?.phanBoSize?.map((s) => s.size) || [],
          ratios: (lc?.tiLeSize || "").split(":").map((n) => parseInt(n) || 0),
          riSo: (lc?.tiLeSize || "").split(":").reduce((s, n) => s + (parseInt(n) || 0), 0),
        },
        dsMau: dsMauForSanPham,
        ghiChu: lsx ? `Từ lệnh cắt ${lsx}` : "",
        ngayTao: new Date().toISOString().slice(0, 10),
        trangThai: "con-hang",
        hinhAnh: anhDaiDien,
      });
      toast.success(`Đã đăng bán ${group.maSP} vào Danh mục sản phẩm`);
    }
    setDangBanGroup(null);
  };

  const exportCSV = () => {
    const rows = [["Mã SP", "Tên SP", "Màu", "Size", "Mã lô tồn kho", "SL", "Vị trí", "Trạng thái"]];
    filtered.forEach((s) => rows.push([s.maSP, s.tenSP, s.mau, s.size, layMaLoTonKho(s), String(s.soLuong), s.viTri, s.trangThai]));
    const csv = "\uFEFF" + rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kho-thanh-pham-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Đã xuất CSV");
  };

  // Tính toán Lệnh cắt chờ nhập kho ("Nhap" = bản nháp, chưa chốt lệnh)
  // Luôn sắp xếp thứ tự từ LC-2026-0015 (M15) về LC-2026-0001 (M01)
  const dsChoNhapKho = useMemo(() => {
    return dsLenhCat.filter(lc => {
      if (lc.trangThai === "HoanThanh" || lc.trangThai === "Nhap") return false;
      const htPCs = lc.phanCong?.filter((pc: any) => pc.id === "dongGoi" || pc.id === "dong_goi" || pc.tenCongDoan?.toLowerCase().includes("đóng gói"));
      if (!htPCs || htPCs.length === 0) return false;
      return htPCs.every((pc: any) => pc.trangThaiCD === "hoan_thanh");
    }).sort((a, b) => b.id.localeCompare(a.id));
  }, [dsLenhCat]);

  // Nhập kho từ lệnh cắt (luồng dự phòng của trang này - luồng chính ở ui-dong-goi).
  // Trước đây hàm này đọc pc.chiTietMau như object lồng (chiTietMau[tênMàu][size])
  // trong khi dữ liệu thật là MẢNG {mau, soLuongDat, soLuongLoi, sizes[]}, nên
  // Object.keys trả về "0","1"... và số lượng luôn = 0 -> luôn báo "Không tìm thấy".
  // Nay đọc đúng cấu trúc và tạo 1 dòng cho MỖI MÀU, khớp với luồng ui-dong-goi.
  const handleNhapKhoFromLC = async (
    lc: any,
    customOptions?: { kenhBan?: KenhBan[]; viTri?: string; ghiChu?: string }
  ) => {
    setIsSubmittingNhapKho(true);
    try {
      const kenhBan = customOptions?.kenhBan || kenhNhapKho;
      const viTri = customOptions?.viTri || "Khu A1";
      const ghiChu = customOptions?.ghiChu || `Từ lệnh cắt ${lc.id}`;

      const dongGoiPCs = lc.phanCong?.filter((pc: any) => pc.id === "dongGoi" || pc.id === "dong_goi" || pc.tenCongDoan?.toLowerCase().includes("đóng gói")) || [];
      const chiTietMauAll: any[] = dongGoiPCs.flatMap((pc: any) => pc.chiTietMau || []);
      const dsMauLC = lc.dsMau && lc.dsMau.length > 0 ? lc.dsMau : [{ ten: "Mặc định", img: "" }];
      const ketQuaGiaVon = tinhGiaVonLenhCat(lc, giaoDich);
      const giaVon1SP = Math.round(ketQuaGiaVon.giaVon1SP || lc.bangCOGS?.giaVonBinhQuan || lc.bangCOGS?.giaVon1SP || (lc as any).giaVonDuKien || (lc as any).donGia || 0);
      const ngayNhap = new Date().toISOString().slice(0, 10);
      if (kenhBan.length === 0) {
        toast.error("Vui lòng chọn ít nhất một loại giá bán");
        return;
      }
      const thieuGia = dsMauLC.flatMap((m: any) => {
        const ct = chiTietMauAll.find((c: any) => c.mau === m.ten);
        const sl = ct?.soLuongDat ?? Math.round((lc.tongSL || 0) / dsMauLC.length);
        return kenhBan.filter((kenh) => layGia(kenh as KenhBanBangGia, lc.maSP, m.maSKU, Math.max(1, sl)) == null).map((kenh) => `${m.ten} · ${DS_KENH_BAN.find((item) => item.value === kenh)?.label || kenh}`);
      });
      if (thieuGia.length > 0) {
        toast.info(`Lưu ý: Chưa thiết lập bảng giá bán cho: ${thieuGia.join(", ")}. Hệ thống sẽ ghi nhận giá tạm để cập nhật sau.`, { duration: 5000 });
      }

      const maSPChuan = lc.maSP || lc.id;
      const phanLoaiChuan = lc.loaiSP === "BoTru" ? "Bộ Trụ" : lc.loaiSP === "AoTru" ? "Áo Trụ" : lc.loaiSP === "AoCoTron" ? "Áo Cổ Tròn" : lc.loaiSP === "BoCoTron" ? "Bộ Cổ Tròn" : lc.loaiSP === "AoPolo" ? "Áo Polo" : lc.loaiSP === "PhuKien" ? "Phụ Kiện" : (lc.loaiSP || "Bộ Trụ");
      const anhDaiDien = (lc.hinhAnh || (maSPChuan && /^M\d{2}$/i.test(maSPChuan) ? `/product-models/${maSPChuan}.png` : "")) || lc.hinhMauInTheu || "";

      // Tạo các dòng tồn kho chuẩn xác từ Lệnh Cắt
      const newSps = taoSanPhamKhoTuLenhCat(lc, {
        kenhBan,
        viTri,
        ngayNhap,
        giaVon1SP,
        layGiaFn: (kenh: KenhBanBangGia, maSP: string, sku?: string, sl?: number) => layGia(kenh, maSP, sku, sl),
      });

      if (newSps.length > 0) {
        // 1. Cập nhật Kho thành phẩm: Cập nhật state trực tiếp + localStorage + sync Supabase
        const incomingIds = new Set(newSps.map((sp) => sp.id));
        const filteredOld = dsSanPham.filter((sp) => !incomingIds.has(sp.id));
        const updatedKho = [...newSps, ...filteredOld];

        // Cập nhật ngay vào state React và lưu localStorage
        setDsSanPhamState(updatedKho);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedKho));
        } catch (e) {
          console.warn("[KhoThanhPham] Lỗi lưu localStorage:", e);
        }

        // Ghi trực tiếp các dòng mới vào Supabase đảm bảo không bị sót dòng nào
        if (checkSupabase()) {
          try {
            const { supabase } = await import("@/lib/supabase/client");
            if (supabase) {
              const payloadRows = newSps.map(toSupabaseRow);
              await supabase.from("kho_thanh_pham").upsert(payloadRows);
            }
          } catch (errUpsertKho) {
            console.error("[KhoThanhPham] Lỗi upsert Supabase kho_thanh_pham:", errUpsertKho);
          }
        }

        // Đóng ngay modal nhập kho để UI không bị treo
        setLenhDangNhap(null);

        // Lưu danh sách vừa nhập để đưa sản phẩm lên đầu bảng ngay lập tức
        setJustImportedIds((prev) => [lc.id, ...prev.filter((id) => id !== lc.id)]);
        setHighlightedMaSP(maSPChuan);

        const tongNhap = newSps.reduce((sum, sp) => sum + (sp.soLuong || 0), 0);

        // Mở popup thông báo thành công chi tiết
        setNhapKhoSuccess({
          maLC: lc.id,
          maSP: maSPChuan,
          tenSP: lc.tenSP || `Sản phẩm từ ${lc.id}`,
          anhDaiDien: anhDaiDien || "",
          tongSL: tongNhap,
          soMau: newSps.length,
          tongGiaTri: newSps.reduce((sum, sp) => sum + (sp.giaTri || 0), 0),
          giaVon1SP: giaVon1SP,
          viTri: viTri,
          kenhBan: kenhBan,
          dsMau: newSps.map((sp) => ({
            ten: sp.mau,
            sl: sp.soLuong,
            img: sp.hinhAnh?.[0],
          })),
        });

        toast.success(`🎉 Đã nhập kho thành công ${tongNhap.toLocaleString("vi-VN")} SP từ ${lc.id}!`, { duration: 5000 });

        // 2. Cập nhật công đoạn nhap_kho và chuyển lệnh cắt sang Hoàn thành (xử lý an toàn độc lập)
        const updatedPhanCong = (lc.phanCong || []).map((pc: any) => {
          if (pc.id === "nhap_kho" || pc.id === "nhapKho" || pc.tenCongDoan?.toLowerCase().includes("nhập kho")) {
            return {
              ...pc,
              trangThaiCD: "hoan_thanh",
              soLuongHoanThanh: tongNhap,
              soLuongDatCuoi: tongNhap,
              ngayHoanThanh: ngayNhap,
            };
          }
          return pc;
        });

        try {
          if (suaLenhCat) {
            await suaLenhCat(lc.id, { phanCong: updatedPhanCong, trangThai: "HoanThanh" }, user as any);
          }
        } catch (errSuaLC) {
          console.warn("[KhoThanhPham] suaLenhCat warning:", errSuaLC);
        }

        try {
          if (capNhatTrangThai) {
            await capNhatTrangThai(lc.id, "HoanThanh", user);
          }
        } catch (errCapNhatTT) {
          console.warn("[KhoThanhPham] capNhatTrangThai warning:", errCapNhatTT);
        }

        // Cập nhật trực tiếp lên Supabase cho bảng lenh_cat
        if (checkSupabase()) {
          try {
            const { supabase } = await import("@/lib/supabase/client");
            if (supabase) {
              await supabase.from("lenh_cat").update({
                trang_thai: "HoanThanh",
                phan_cong: updatedPhanCong,
              }).eq("id", lc.id);
            }
          } catch (errSupabaseLC) {
            console.error("[KhoThanhPham] update Supabase lenh_cat error:", errSupabaseLC);
          }
        }

        // 3. Tự động đồng bộ toàn diện sang Danh Mục Sản Phẩm (san_pham)
        try {
          await dongBoSangDanhMucSP(maSPChuan, updatedKho, {
            tenSP: lc.tenSP || maSPChuan,
            phanLoai: lc.loaiSP,
            anhDaiDien: anhDaiDien,
            thuongHieu: lc.khachHang || "Polomimin",
          });
        } catch (errSync) {
          console.error("Lỗi đồng bộ Danh mục sản phẩm khi nhập kho:", errSync);
        }

        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("mimin:kho-thanh-pham-changed"));
          window.dispatchEvent(new CustomEvent("mimin:danh-muc-sp-changed"));
          window.dispatchEvent(new CustomEvent("mimin:lenh-cat-changed"));
        }
      } else {
        toast.error("Không tìm thấy chi tiết màu/số lượng đóng gói đạt!");
      }
    } catch (err) {
      console.error("Lỗi nhập kho:", err);
      toast.error("Có lỗi xảy ra khi nhập kho!");
    } finally {
      setIsSubmittingNhapKho(false);
    }
  };

  const handleViewInKho = (maSP: string) => {
    setNhapKhoSuccess(null);
    setHighlightedMaSP(maSP);
    setTimeout(() => {
      const el = document.getElementById(`product-group-${maSP}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 250);
    setTimeout(() => {
      setHighlightedMaSP(null);
    }, 6000);
  };

  const handleContinueNhapKho = () => {
    setNhapKhoSuccess(null);
  };

  return (
    <div className="space-y-4 w-full max-w-full overflow-x-hidden animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header Banner cao cấp & Thống kê KPI */}
        <StatsHeader
          stats={{
            ...stats,
            tongBienThe: dsSanPham.length,
            countManPJ,
            countPolo: countPolomimin,
          }}
          onThemSP={() => setShowAdd(true)}
          onTiLeSize={() => setShowAddSizeRatio(true)}
          onExportCSV={exportCSV}
          onAutoSync={handleAutoGenerate}
        />

        {/* Lệnh Cắt chờ nhập kho */}
        {dsChoNhapKho.length > 0 && (
          <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-amber-200/90 p-4 md:p-5 shadow-sm space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-100 pb-2.5">
              <h2 className="text-sm md:text-base font-black text-slate-800 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <Package className="w-4 h-4" />
                </div>
                <span>Có <span className="text-amber-800 font-extrabold">{dsChoNhapKho.length}</span> lệnh cắt hoàn thành đóng gói, chờ nhập kho thành phẩm:</span>
              </h2>
              {justImportedIds.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Đã nhập kho {justImportedIds.length} lệnh trong phiên
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {dsChoNhapKho.map(lc => {
                const isJustImported = justImportedIds.includes(lc.id);
                const ketQuaGiaVon = tinhGiaVonLenhCat(lc, giaoDich);
                const coGiaVon = ketQuaGiaVon.giaVon1SP > 0;
                const anhLC = ((lc as any).hinhAnh || (lc.maSP && /^M\d{2}$/i.test(lc.maSP) ? `/product-models/${lc.maSP}.png` : "")) || lc.hinhMauInTheu;

                return (
                  <div 
                    key={lc.id} 
                    className={`bg-white rounded-xl border p-3.5 shadow-sm flex flex-col justify-between transition-all ${
                      isJustImported 
                        ? "border-emerald-400 bg-emerald-50/40 ring-2 ring-emerald-200" 
                        : coGiaVon 
                          ? "border-amber-200 hover:border-amber-300 hover:shadow-md" 
                          : "border-rose-300 bg-rose-50/20"
                    }`}
                  >
                    <div className="flex gap-3">
                      {anhLC && (
                        <div 
                          className="w-14 h-18 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shrink-0 cursor-zoom-in"
                          onClick={() => setPreviewImage(anhLC)}
                        >
                          <img src={anhLC} alt={lc.tenSP} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-[11px] text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                            {lc.id}
                          </span>
                          {lc.maSP && (
                            <span className="font-mono font-bold text-[11px] text-indigo-800 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                              {lc.maSP}
                            </span>
                          )}
                        </div>
                        <div className="font-black text-slate-800 text-xs md:text-sm mt-1 line-clamp-1">{lc.tenSP}</div>
                        <div className="text-xs text-slate-500 mt-0.5">SL yêu cầu: <span className="font-extrabold text-sky-700">{lc.tongSL?.toLocaleString('vi-VN')} SP</span></div>
                        <div className={`mt-1.5 rounded-md px-2 py-1 text-[11px] font-bold ${coGiaVon ? "bg-emerald-50 text-emerald-800 border border-emerald-100" : "bg-rose-50 text-rose-700"}`}>
                          Giá vốn: {coGiaVon ? `${ketQuaGiaVon.giaVon1SP.toLocaleString("vi-VN")}đ/SP` : "Chưa tính được giá vốn"}
                        </div>
                      </div>
                    </div>

                    {isJustImported ? (
                      <div className="mt-3 py-1.5 px-3 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ĐÃ NHẬP KHO THÀNH CÔNG
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setKenhNhapKho(["ban-le"]);
                          setLenhDangNhap(lc);
                        }}
                        disabled={!coGiaVon}
                        className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 bg-[#2B4C3E] hover:bg-[#1E372C] text-white text-xs font-black rounded-lg transition-colors shadow-sm disabled:bg-slate-300 disabled:cursor-not-allowed"
                      >
                        Chi tiết nhập kho <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Toolbar & Bộ lọc đa năng */}
        <FilterBar
          search={search}
          setSearch={setSearch}
          filterTrangThai={filterTrangThai}
          setFilterTrangThai={setFilterTrangThai}
          filterLoai={filterLoai}
          setFilterLoai={setFilterLoai}
          dsLoai={dsLoai}
          filterSize={filterSize}
          setFilterSize={setFilterSize}
          filterViTri={filterViTri}
          setFilterViTri={setFilterViTri}
          filterThuongHieu={filterThuongHieu}
          setFilterThuongHieu={setFilterThuongHieu}
          filterMucTon={filterMucTon}
          setFilterMucTon={setFilterMucTon}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortDir={sortDir}
          setSortDir={setSortDir}
          filteredCount={filtered.length}
          totalCount={dsSanPham.length}
          groupedCount={groupedProducts.length}
          totalQtyFiltered={totalQtyFiltered}
          totalValFiltered={totalValFiltered}
          countManPJ={countManPJ}
          countPolomimin={countPolomimin}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onResetFilters={handleResetFilters}
        />

        {/* Content: Danh sách hoặc Dạng Thẻ */}
        <div className="overflow-hidden">
          {filtered.length === 0 ? (
            <div className="card p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <Box className="w-12 h-12 mx-auto mb-2 opacity-50 text-slate-400" />
              <div className="text-sm font-bold text-slate-600">Không tìm thấy sản phẩm nào phù hợp bộ lọc</div>
              <div className="text-xs mt-1 text-slate-400">Thử xóa từ khóa tìm kiếm hoặc bấm "Xóa bộ lọc" ở trên</div>
            </div>
          ) : viewMode === "grid" ? (
            <ProductGrid
              groups={groupedProducts}
              productImages={mergedProductImages}
              productVariantImages={mergedVariantImages}
              productVideos={productVideos}
              setUploadingSP={setUploadingSP}
              setUploadType={setUploadType}
              fileInputRef={fileInputRef}
              setViewingImage={setViewingImage}
              setShowAdd={setShowAdd}
              setShowMasterDetails={setShowMasterDetails}
              setEditing={setEditing}
              handleXuatKho={handleXuatKho}
              update={update}
              dsSanPham={dsSanPham}
              onDangBan={setDangBanGroup}
              onOpenVariant={setOpenVariant}
              onRebuildFromLC={handleRebuildFromLC}
              onSuaTong={setSuaTongGroup}
              onXoaTong={handleDeleteGroup}
              onDeleteVariant={handleDelete}
              dsLenhCat={dsLenhCat}
              highlightedMaSP={highlightedMaSP}
            />
          ) : (
            <ProductTable
              filtered={filtered}
              productImages={mergedProductImages}
              productVariantImages={mergedVariantImages}
              setEditing={setEditing}
              handleXuatKho={handleXuatKho}
              handleDelete={handleDelete}
              onSuaTong={setSuaTongGroup}
              onXoaTong={handleDeleteGroup}
              onDangBan={setDangBanGroup}
              onOpenVariant={setOpenVariant}
              highlightedMaSP={highlightedMaSP}
            />
          )}
        </div>

        {/* Thống kê chi tiết */}
        {showStats && <StatsByType dsLoai={dsLoai} dsSanPham={dsSanPham} onClose={() => setShowStats(false)} />}
      </div>

      {/* Modals */}
      {showMasterDetails && <MasterDetailsModal maSP={showMasterDetails} groups={groupedProducts} productImages={mergedProductImages} onClose={() => setShowMasterDetails(null)} />}
      {showAdd && <ProductFormModal onClose={() => setShowAdd(false)} onSave={handleAdd} />}
      {editing && <ProductFormModal sp={editing} initialImage={editing.hinhAnh?.[0] || mergedVariantImages[`${editing.maSP}_${editing.mau}`] || mergedProductImages[editing.id] || mergedProductImages[editing.maSP]} onClose={() => setEditing(null)} onSave={handleEdit} />}
      {suaTongGroup && <SuaTongModal group={suaTongGroup} onClose={() => setSuaTongGroup(null)} onSave={handleSaveSuaTong} />}
      {dangBanGroup && (() => {
        const soMauCoAnh = dangBanGroup.items.filter((i) => i.hinhAnh?.[0]).length;
        const tongSoMau = dangBanGroup.items.length;
        const existing = dsDanhMuc.find((sp) => sp.id === dangBanGroup.maSP);
        // Giá vốn thật: ưu tiên đơn giá đã ghi lúc nhập kho, sau đó tới bảng COGS
        // của lệnh cắt gốc.
        const lcGoc = dsLenhCat.find((l) => l.id === dangBanGroup.items[0]?.maLenhCat);
        const giaVonTuLenhCat = Math.round(
          dangBanGroup.items.find((i) => i.donGia > 0)?.donGia ||
          lcGoc?.bangCOGS?.giaVonBinhQuan ||
          lcGoc?.bangCOGS?.giaVon1SP ||
          0
        );
        return (
          <DangBanModal
            group={dangBanGroup}
            soMauCoAnh={soMauCoAnh}
            tongSoMau={tongSoMau}
            daCoTrongDanhMuc={!!existing}
            giaBanMacDinh={existing?.giaBanDuKien}
            giaVonMacDinh={existing?.giaVonDuKien}
            giaVonTuLenhCat={giaVonTuLenhCat}
            onClose={() => setDangBanGroup(null)}
            onConfirm={handleDangBan}
          />
        );
      })()}
      {openVariant && (() => {
        const matchingDM = dsDanhMuc.find((d) => isMatchingProduct(d, openVariant.maSP));
        return (
          <VariantDetailModal
            sp={openVariant}
            tiLeSizeDefault={openVariant.tiLeSize || matchingDM?.tiLeSize}
            onClose={() => setOpenVariant(null)}
            onSave={handleSaveVariant}
            onDelete={handleDelete}
          />
        );
      })()}

      {lenhDangNhap && (
        <ChiTietNhapKhoModal
          lenhCat={lenhDangNhap}
          giaoDich={giaoDich}
          kenhNhapKho={kenhNhapKho}
          setKenhNhapKho={setKenhNhapKho}
          loadingBangGia={loadingBangGia}
          layGia={layGia}
          onClose={() => setLenhDangNhap(null)}
          onConfirmNhapKho={async ({ kenhBan, viTri, ghiChu }) => {
            await handleNhapKhoFromLC(lenhDangNhap, { kenhBan, viTri, ghiChu });
          }}
          isSubmitting={isSubmittingNhapKho}
          onPreviewImage={(url) => setPreviewImage(url)}
        />
      )}

      {nhapKhoSuccess && (
        <NhapKhoSuccessModal
          data={nhapKhoSuccess}
          onClose={() => setNhapKhoSuccess(null)}
          onViewInKho={handleViewInKho}
          onContinue={handleContinueNhapKho}
        />
      )}

      {previewImage && (
        <div 
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 cursor-zoom-out transition-opacity"
          onClick={() => setPreviewImage(null)}
        >
          <img src={previewImage} alt="Preview" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" />
        </div>
      )}

      {/* Hidden file input for upload (image + video) */}
      <input ref={fileInputRef} type="file" className="hidden" accept="image/*,video/*" onChange={handleFileChange} />

      {showAddSizeRatio && (
        <AddSizeRatioModal onClose={() => setShowAddSizeRatio(false)} />
      )}
    </div>
  );
}
