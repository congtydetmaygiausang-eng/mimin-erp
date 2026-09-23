"use client";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Box, Download, Sparkles, Plus, Package, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useLenhCat } from "@/lib/data/lenh-cat-store";
import { useSession } from "@/components/session-provider";
import { logCRUD } from "@/lib/audit-log";
import { useDanhMucSP, type MauTieuChuan } from "@/lib/data/danh-muc-sp-store";
import { supabaseFetchAllRaw, supabaseUpsertRaw, supabaseDelete, checkSupabase, useSupabaseRealtime } from "@/lib/supabase/sync-helper";
import { STORAGE_KEY, KHO_TP_CHANGED_EVENT, generateSanPhamFromWorkflow, fromSupabaseRow, toSupabaseRow, chuanHoaSanPhamKho, taoMaLoTonKhoTheoDong, layMaLoTonKho, type SanPhamTP } from "./data";
import { StatsHeader, StatsByType } from "./components/StatsPanel";
import { FilterBar, SortBar } from "./components/FilterBar";
import { ProductGrid } from "./components/ProductGrid";
import { ProductTable } from "./components/ProductTable";
import { ProductFormModal } from "./components/ProductFormModal";
import { MasterDetailsModal } from "./components/MasterDetailsModal";
import { DangBanModal } from "./components/DangBanModal";
import { VariantDetailModal } from "./components/VariantDetailModal";
import { SuaTongModal } from "./components/SuaTongModal";
import { useKho } from "@/lib/data/kho-store";
import { tinhGiaVonLenhCat } from "@/lib/gia-von-lenh-cat";
import { useBangGia, type KenhBan as KenhBanBangGia } from "@/lib/data/bang-gia-store";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { DS_KENH_BAN, type KenhBan } from "./data";

export default function KhoThanhPhamPage() {
  const { user } = useSession();
  const { dsLenhCat, capNhatTrangThai } = useLenhCat();
  const { giaoDich } = useKho();
  const { layGia, loading: loadingBangGia, chiTiet, themChiTiet, suaChiTiet } = useBangGia();
  const [lenhDangNhap, setLenhDangNhap] = useState<(typeof dsLenhCat)[number] | null>(null);
  const [kenhNhapKho, setKenhNhapKho] = useState<KenhBan[]>(["ban-le"]);
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
  const { dsSanPham: dsDanhMuc, themSP, suaSP } = useDanhMucSP();
  const [dangBanGroup, setDangBanGroup] = useState<{ maSP: string; tenSP: string; items: SanPhamTP[] } | null>(null);
  const [suaTongGroup, setSuaTongGroup] = useState<{ maSP: string; tenSP: string; items: SanPhamTP[] } | null>(null);
  const [openVariant, setOpenVariant] = useState<SanPhamTP | null>(null);
  const [search, setSearch] = useState("");
  const [filterTrangThai, setFilterTrangThai] = useState<"all" | SanPhamTP["trangThai"]>("all");
  const [filterLoai, setFilterLoai] = useState<"all" | string>("all");
  const [filterSize, setFilterSize] = useState<"all" | string>("all");
  const [filterViTri, setFilterViTri] = useState<"all" | string>("all");
  const [sortBy, setSortBy] = useState<"ngay" | "sl" | "gt">("ngay");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [editing, setEditing] = useState<SanPhamTP | null>(null);
  const [showAdd, setShowAdd] = useState(false);
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

  // Load từ localStorage trước (không trắng màn hình), rồi đọc lại 2 chiều từ Supabase
  // (nguồn chính). Dùng fromSupabaseRow/toSupabaseRow thủ công thay vì
  // camelToSnake/snakeToCamel tự động vì "maSP"/"tenSP" có hoa liền (SP) bị
  // convert sai chiều đọc về (ma_sp -> maSp thay vì maSP).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SanPhamTP[];
        if (Array.isArray(parsed) && parsed.length > 0) setDsSanPhamState(parsed.map(chuanHoaSanPhamKho));
      }
    } catch {}

    if (!checkSupabase()) return;
    let mounted = true;
    (async () => {
      const rows = await supabaseFetchAllRaw<any>("kho_thanh_pham");
      if (!mounted) return;
      const remote = rows.map(fromSupabaseRow);
      // Supabase là nguồn chính. Mảng rỗng cũng phải xoá cache kho cũ trên máy.
      setDsSanPhamState(remote);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(remote)); } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  useSupabaseRealtime("kho_thanh_pham", setDsSanPhamState, {
    primaryKey: "id",
    mapIn: (row: any) => fromSupabaseRow(row),
  });

  // Đơn hàng chuyển sang "Đã giao" sẽ trừ tồn kho ở nơi khác (don-hang-store) rồi
  // phát sự kiện này - nạp lại từ localStorage để số tồn trên màn hình đúng ngay.
  useEffect(() => {
    const onChanged = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as SanPhamTP[];
        if (Array.isArray(parsed)) setDsSanPhamState(parsed.map(chuanHoaSanPhamKho));
      } catch {}
    };
    window.addEventListener(KHO_TP_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(KHO_TP_CHANGED_EVENT, onChanged);
  }, []);

  // Save on change: ghi localStorage ngay + đồng bộ Supabase cho các dòng thay đổi/mới/xoá
  const update = useCallback((newDs: SanPhamTP[]) => {
    setDsSanPhamState((prev) => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(newDs)); } catch {}
      if (checkSupabase()) {
        const prevIds = new Set(prev.map((r) => r.id));
        const newIds = new Set(newDs.map((r) => r.id));
        const deletedItems = prev.filter((r) => !newIds.has(r.id));
        const deletedIds = deletedItems.map((r) => r.id);

        deletedItems.forEach((item) => {
          logCRUD(user, "kho-thanh-pham", "delete", item.tenSP || "Sản phẩm", item.id, { oldValue: item });
        });

        const changedItems = newDs.filter((row) => {
          const oldRow = prev.find((p) => p.id === row.id);
          if (!oldRow) return true;
          return JSON.stringify(row) !== JSON.stringify(oldRow);
        });

        Promise.all([
          ...changedItems.map((row) => supabaseUpsertRaw("kho_thanh_pham", toSupabaseRow(row))),
          ...deletedIds.map((id) => supabaseDelete("kho_thanh_pham", id)),
        ]).catch((err) => console.error("[KhoThanhPham] sync error:", err));
      }
      return newDs;
    });
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
      let cmp = 0;
      if (sortBy === "ngay") cmp = new Date(a.ngayNhap).getTime() - new Date(b.ngayNhap).getTime();
      if (sortBy === "sl") cmp = a.soLuong - b.soLuong;
      if (sortBy === "gt") cmp = a.giaTri - b.giaTri;
      
      // Nếu cùng ngày (cmp = 0), ưu tiên xếp theo ID (ID sinh sau sẽ lớn hơn -> đưa lên đầu nếu desc)
      if (cmp === 0) {
        cmp = a.id.localeCompare(b.id);
      }
      
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [dsSanPham, search, filterTrangThai, filterLoai, filterSize, filterViTri, sortBy, sortDir]);

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
    const tongSP = dsSanPham.reduce((s, x) => s + x.soLuong, 0);
    const tongGT = dsSanPham.reduce((s, x) => s + x.giaTri, 0);
    const soLoai = new Set(dsSanPham.map((x) => x.maSP)).size;
    const conHang = dsSanPham.filter((x) => x.trangThai === "con").length;
    const daDat = dsSanPham.filter((x) => x.trangThai === "dat-hang").length;
    return { tongSP, tongGT, soLoai, conHang, daDat };
  }, [dsSanPham]);

  // Unique maSP cho filter
  const dsLoai = useMemo(() => Array.from(new Set(dsSanPham.map((s) => s.maSP))).sort(), [dsSanPham]);

  // Handlers - ThemNhieuBienTheForm gửi lên 1 MẢNG (nhiều biến thể/màu cùng
  // lô), form Sửa vẫn gửi 1 object đơn - chuẩn hoá về mảng để xử lý chung.
  const handleAdd = (data: any) => {
    const list = Array.isArray(data) ? data : [data];
    const newImages: Record<string, string> = {};
    const newRows: SanPhamTP[] = list.map((item, i) => {
      const { __tempImage, bangGiaSelected, ...sp } = item;
      const id = `TP${Date.now().toString().slice(-6)}${i}`;
      
      // Khắc phục lỗi không sync được ảnh sang Danh mục SP: phải đẩy link vào mảng hinhAnh
      if (__tempImage) {
        newImages[id] = __tempImage;
        if (!sp.hinhAnh || sp.hinhAnh.length === 0) {
          sp.hinhAnh = [__tempImage];
        } else if (!sp.hinhAnh.includes(__tempImage)) {
          sp.hinhAnh = [__tempImage, ...sp.hinhAnh];
        }
      }
      
      return { ...sp, id, giaTri: sp.soLuong * sp.donGia };
    });
    update([...newRows, ...dsSanPham]);
    if (Object.keys(newImages).length > 0) {
      setProductImages((prev) => ({ ...prev, ...newImages }));
    }
    const tongSL = newRows.reduce((s, r) => s + (r.soLuong || 0), 0);
    toast.success(newRows.length > 1 ? `Đã thêm ${newRows.length} biến thể (${tongSL} sp)` : `Đã thêm ${newRows[0]?.tenSP} (${tongSL} sp)`);
    setShowAdd(false);

    // Tự động đồng bộ lên Danh mục sản phẩm
    const groupMaSP = newRows[0]?.maSP;
    if (groupMaSP) {
      const existingDM = dsDanhMuc.find(d => d.id === groupMaSP || d.maSP === groupMaSP);
      const dsMauMoi = newRows.map((r) => {
        const oldMau = existingDM?.dsMau.find(old => old.ten === r.mau);
        return {
          ten: r.mau,
          maSKU: r.maSKU || oldMau?.maSKU || `${groupMaSP}-${r.mau}`,
          dinhMuc: oldMau ? oldMau.dinhMuc : 0,
          img: r.hinhAnh?.[0] || oldMau?.img || "",
          video: r.video || oldMau?.video || "",
        };
      });

      const anhDaiDien = dsMauMoi.find(m => m.img)?.img || "";
      const giaBanDuKien = newRows[0]?.giaBanLe || 0;
      const giaVonDuKien = newRows[0]?.giaVon || 0;

      if (existingDM) {
         // Ghi đè dsMau bằng danh sách màu thực tế từ Kho Thành Phẩm (xóa các màu rác/mặc định cũ)
         suaSP(existingDM.id, {
           giaBanDuKien: Math.max(existingDM.giaBanDuKien || 0, giaBanDuKien),
           dsMau: dsMauMoi,
           hinhAnh: anhDaiDien || existingDM.hinhAnh,
           loaiSP: (newRows[0]?.phanLoai as any) || existingDM.loaiSP,
           tenSP: newRows[0]?.tenSP || existingDM.tenSP,
         });
      } else {
         // Thêm mới Danh mục SP
         themSP({
           id: groupMaSP,
           maSP: groupMaSP,
           tenSP: newRows[0]?.tenSP || groupMaSP,
           loaiSP: (newRows[0]?.phanLoai as any) || "AoTru",
           giaBanDuKien,
           giaVonDuKien,
           tiLeSize: newRows[0]?.tiLeSize || "",
           bangSize: {
              sizes: newRows[0]?.chiTietSize?.map((s: any) => s.size) || [],
              ratios: (newRows[0]?.tiLeSize || "").split(":").map((n: string) => parseInt(n) || 0),
              riSo: (newRows[0]?.tiLeSize || "").split(":").reduce((s: number, n: string) => s + (parseInt(n) || 0), 0)
           },
           dsMau: dsMauMoi,
           ghiChu: newRows[0]?.ghiChu || "",
           ngayTao: new Date().toISOString().slice(0, 10),
           trangThai: "con-hang",
           hinhAnh: anhDaiDien
         });
      }
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

  const handleEdit = (data: any) => {
    const { __tempImage, bangGiaSelected, ...sp } = data;
    
    if (__tempImage) {
      if (!sp.hinhAnh || sp.hinhAnh.length === 0) {
        sp.hinhAnh = [__tempImage];
      } else {
        const filtered = Array.isArray(sp.hinhAnh) ? sp.hinhAnh.filter((i: string) => i !== __tempImage) : [];
        sp.hinhAnh = [__tempImage, ...filtered];
      }
    }
    
    update(dsSanPham.map((s) => {
      if (s.id === sp.id) {
        let newTrangThai = sp.trangThai;
        if (sp.soLuong === 0) newTrangThai = "xuat-kho";
        else if (sp.soLuong > 0 && (sp.trangThai === "xuat-kho" || sp.trangThai === "het")) newTrangThai = "con";
        
        return { ...sp, giaTri: (sp.soLuong || 0) * (sp.donGia || 0), trangThai: newTrangThai };
      }
      return s;
    }));
    if (__tempImage) {
      setProductImages((prev) => ({ ...prev, [sp.id]: __tempImage }));
    }

    // Đồng bộ sang Danh mục sản phẩm nếu đã có
    const existingDM = dsDanhMuc.find(d => d.id === sp.maSP || d.maSP === sp.maSP);
    if (existingDM) {
      let changed = false;
      const newDM = { ...existingDM };
      
      if (sp.phanLoai && newDM.loaiSP !== sp.phanLoai) {
        newDM.loaiSP = sp.phanLoai as any;
        changed = true;
      }
      if (sp.tenSP && newDM.tenSP !== sp.tenSP) {
        newDM.tenSP = sp.tenSP;
        changed = true;
      }
      
      if (__tempImage || sp.soLuong !== undefined) {
        // Cập nhật ảnh VÀ SỐ LƯỢNG của biến thể màu tương ứng trong dsMau
        if (newDM.dsMau) {
          const newDsMau = [...newDM.dsMau];
          const mauIndex = newDsMau.findIndex(m => m.ten === sp.mau);
          if (mauIndex >= 0) {
            const currentMau = { ...newDsMau[mauIndex] };
            if (__tempImage) {
               currentMau.img = __tempImage;
               changed = true;
            }
            if (sp.soLuong !== undefined && currentMau.soLuongKho !== sp.soLuong) {
               currentMau.soLuongKho = sp.soLuong;
               changed = true;
            }
            newDsMau[mauIndex] = currentMau;
            newDM.dsMau = newDsMau;
          }
          
          // Luôn lấy ảnh của màu đầu tiên làm ảnh đại diện cho sản phẩm
          if (__tempImage && newDsMau.length > 0 && newDsMau[0].img) {
            if (newDM.hinhAnh !== newDsMau[0].img) {
              newDM.hinhAnh = newDsMau[0].img;
              changed = true;
            }
          } else if (!newDM.hinhAnh) {
             newDM.hinhAnh = __tempImage;
             changed = true;
          }
        } else if (!newDM.hinhAnh) {
          newDM.hinhAnh = __tempImage;
          changed = true;
        }
      }
      
      if (changed) {
        suaSP(newDM.id, newDM);
      }
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

    toast.success("Đã cập nhật");
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Xóa sản phẩm này?")) return;
    update(dsSanPham.filter((s) => s.id !== id));
    toast.success("Đã xóa");
  };

  const handleDeleteGroup = (group: { maSP: string; tenSP: string; items: SanPhamTP[] }) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa toàn bộ sản phẩm trong nhóm này không?\n\nTất cả ${group.items.length} phân loại sẽ bị đưa vào Thùng rác.`)) return;
    const maSP = group.maSP;
    update(dsSanPham.filter((s) => s.maSP !== maSP));
    toast.success(`Đã xóa toàn bộ nhóm ${group.tenSP}`);
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

  const handleSaveVariant = (updated: SanPhamTP) => {
    update(dsSanPham.map((s) => (s.id === updated.id ? updated : s)));
    
    // Đồng bộ sang Danh mục sản phẩm nếu đã có
    const existingDM = dsDanhMuc.find(d => d.id === updated.maSP || d.maSP === updated.maSP);
    if (existingDM) {
      let changed = false;
      const newDM = { ...existingDM };
      
      if (updated.phanLoai && newDM.loaiSP !== updated.phanLoai) {
        newDM.loaiSP = updated.phanLoai as any;
        changed = true;
      }
      if (updated.tenSP && newDM.tenSP !== updated.tenSP) {
        newDM.tenSP = updated.tenSP;
        changed = true;
      }
      
      if (updated.giaBanLe && (updated.giaBanLe > newDM.giaBanDuKien || newDM.giaBanDuKien === 0)) {
        newDM.giaBanDuKien = updated.giaBanLe;
        changed = true;
      }
      
      if (newDM.dsMau) {
        const mauIndex = newDM.dsMau.findIndex(m => m.ten === updated.mau);
        if (mauIndex >= 0) {
          const oldMau = newDM.dsMau[mauIndex];
          let dsMauChanged = false;
          const newMau = { ...oldMau };

          if (updated.hinhAnh?.[0] && newMau.img !== updated.hinhAnh[0]) {
            newMau.img = updated.hinhAnh[0];
            dsMauChanged = true;
          }

          if (updated.video !== undefined && newMau.video !== updated.video) {
            newMau.video = updated.video;
            dsMauChanged = true;
          }

          if (updated.maSKU !== undefined && newMau.maSKU !== updated.maSKU) {
            newMau.maSKU = updated.maSKU;
            dsMauChanged = true;
          }

          if (dsMauChanged) {
            const newDsMau = [...newDM.dsMau];
            newDsMau[mauIndex] = newMau;
            newDM.dsMau = newDsMau;
            changed = true;
          }
        }
      }
      
      if (changed) {
        suaSP(newDM.id, newDM);
      }
    }
    
    toast.success(`Đã lưu chi tiết màu ${updated.mau}`);
  };

  const handleSaveSuaTong = (updatedItems: SanPhamTP[], bgSelected?: Record<string, string>) => {
    const maSP = updatedItems[0]?.maSP;
    if (!maSP) return;
    
    // Merge into Kho Thành Phẩm
    const otherItems = dsSanPham.filter(s => s.maSP !== maSP);
    update([...updatedItems, ...otherItems]);
    
    // Update Danh Mục SP if exists
    const dm = dsDanhMuc.find(d => d.id === maSP || d.maSP === maSP);
    if (dm) {
      suaSP(dm.id, { 
        tenSP: updatedItems[0].tenSP, 
        loaiSP: updatedItems[0].phanLoai as any,
        giaBanDuKien: Math.max(...updatedItems.map(i => i.giaBanLe || 0), dm.giaBanDuKien || 0),
        giaVonDuKien: Math.max(...updatedItems.map(i => i.giaVon || 0), dm.giaVonDuKien || 0),
      });
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
    toast.success(`Đã cập nhật thông tin chung cho ${updatedItems.length} biến thể của ${maSP}`);
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
  const dsChoNhapKho = useMemo(() => {
    return dsLenhCat.filter(lc => {
      if (lc.trangThai === "HoanThanh" || lc.trangThai === "Nhap") return false;
      const htPCs = lc.phanCong?.filter((pc: any) => pc.id === "dongGoi" || pc.id === "dong_goi" || pc.tenCongDoan?.toLowerCase().includes("đóng gói"));
      if (!htPCs || htPCs.length === 0) return false;
      return htPCs.every((pc: any) => pc.trangThaiCD === "hoan_thanh");
    });
  }, [dsLenhCat]);

  // Nhập kho từ lệnh cắt (luồng dự phòng của trang này - luồng chính ở ui-dong-goi).
  // Trước đây hàm này đọc pc.chiTietMau như object lồng (chiTietMau[tênMàu][size])
  // trong khi dữ liệu thật là MẢNG {mau, soLuongDat, soLuongLoi, sizes[]}, nên
  // Object.keys trả về "0","1"... và số lượng luôn = 0 -> luôn báo "Không tìm thấy".
  // Nay đọc đúng cấu trúc và tạo 1 dòng cho MỖI MÀU, khớp với luồng ui-dong-goi.
  const handleNhapKhoFromLC = (lc: any, kenhBan: KenhBan[] = kenhNhapKho) => {
    const dongGoiPCs = lc.phanCong?.filter((pc: any) => pc.id === "dongGoi" || pc.id === "dong_goi" || pc.tenCongDoan?.toLowerCase().includes("đóng gói")) || [];
    const chiTietMauAll: any[] = dongGoiPCs.flatMap((pc: any) => pc.chiTietMau || []);
    const dsMauLC = lc.dsMau && lc.dsMau.length > 0 ? lc.dsMau : [{ ten: "Mặc định", img: "" }];
    const giaVon1SP = Math.round(lc.bangCOGS?.giaVonBinhQuan || lc.bangCOGS?.giaVon1SP || 0);
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
      toast.error(`Chưa thiết lập bảng giá bán cho: ${thieuGia.join(", ")}`, { duration: 7000 });
      return;
    }

    const newSps: SanPhamTP[] = dsMauLC.map((m: any, idx: number) => {
      const ct = chiTietMauAll.find((c: any) => c.mau === m.ten);
      const sl = ct?.soLuongDat ?? Math.round((lc.tongSL || 0) / dsMauLC.length);
      const chiTietSize = (ct?.sizes || m.phanBoSize || []) as Array<{ size: string; sl: number }>;
      return {
        id: `TP-${Date.now().toString(36)}-${idx}`,
        maSP: lc.maSP || lc.id,
        tenSP: lc.tenSP || `Sản phẩm từ ${lc.id}`,
        phanLoai: lc.loaiSP || "BoTru",
        mau: m.ten,
        size: chiTietSize.filter((item) => item.sl > 0).map((item) => item.size).join(", ") || "Chưa có size",
        lsx: taoMaLoTonKhoTheoDong(`TP-${lc.id}-${idx}`, ngayNhap),
        maLenhCat: lc.id,
        ngayNhap,
        soLuong: sl,
        donGia: giaVon1SP,
        giaTri: sl * giaVon1SP,
        giaVon: giaVon1SP,
        giaBanSi: kenhBan.includes("ban-si") ? layGia("ban-si", lc.maSP, m.maSKU, Math.max(1, sl)) || 0 : 0,
        giaBanLe: kenhBan.includes("ban-le") ? layGia("ban-le", lc.maSP, m.maSKU, Math.max(1, sl)) || 0 : 0,
        giaBanLo: kenhBan.includes("ban-lo") ? layGia("ban-lo", lc.maSP, m.maSKU, Math.max(1, sl)) || 0 : 0,
        giaTikTok: kenhBan.includes("tiktok") ? layGia("tiktok", lc.maSP, m.maSKU, Math.max(1, sl)) || 0 : 0,
        giaShopee: kenhBan.includes("shopee") ? layGia("shopee", lc.maSP, m.maSKU, Math.max(1, sl)) || 0 : 0,
        kenhBan,
        viTri: "Khu A1",
        trangThai: "con",
        hinhAnh: m.img ? [m.img] : [],
        imgQuan: m.imgQuan || undefined,
        chiTietSize,
      } as SanPhamTP;
    }).filter((sp: SanPhamTP) => sp.soLuong > 0);

    if (newSps.length > 0) {
      update([...newSps, ...dsSanPham]);
      capNhatTrangThai(lc.id, "HoanThanh", null);
      toast.success(`Đã nhập kho ${newSps.length} màu từ ${lc.id}!`);
      setLenhDangNhap(null);
    } else {
      toast.error("Không tìm thấy chi tiết màu/số lượng đóng gói đạt!");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-3 md:p-5">
      <div className="max-w-7xl mx-auto space-y-4">
        <StatsHeader stats={stats} />

        {/* Lệnh Cắt chờ nhập kho */}
        {dsChoNhapKho.length > 0 && (
          <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-amber-200 p-4 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-amber-700 flex items-center gap-2">
              <Package className="w-4 h-4" /> Có {dsChoNhapKho.length} lệnh cắt hoàn thành đóng gói, chờ nhập kho thành phẩm:
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {dsChoNhapKho.map(lc => {
                const ketQuaGiaVon = tinhGiaVonLenhCat(lc, giaoDich);
                const coGiaVon = ketQuaGiaVon.giaVon1SP > 0;
                return (
                  <div key={lc.id} className={`bg-white rounded-xl border p-3 shadow-sm flex flex-col justify-between ${coGiaVon ? "border-amber-100" : "border-rose-300"}`}>
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{lc.id} - {lc.tenSP}</div>
                    <div className="text-xs text-slate-500 mt-1">SL yêu cầu: <span className="font-semibold text-sky-600">{lc.tongSL?.toLocaleString('vi-VN')}</span></div>
                    <div className={`mt-2 rounded-lg px-2.5 py-2 text-xs font-bold ${coGiaVon ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                      Giá vốn: {coGiaVon ? `${ketQuaGiaVon.giaVon1SP.toLocaleString("vi-VN")}đ/SP` : "Chưa tính được — không thể nhập kho"}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setKenhNhapKho(["ban-le"]);
                      setLenhDangNhap(lc);
                    }}
                    disabled={!coGiaVon}
                    className="mt-3 flex items-center justify-center gap-1.5 w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm disabled:bg-slate-300 disabled:cursor-not-allowed"
                  >
                    Chi tiết nhập kho <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* Unified Toolbar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-4">
          <FilterBar
            search={search} setSearch={setSearch}
            filterTrangThai={filterTrangThai} setFilterTrangThai={setFilterTrangThai}
            filterLoai={filterLoai} setFilterLoai={setFilterLoai}
            dsLoai={dsLoai}
            exportCSV={exportCSV}
            handleAutoGenerate={handleAutoGenerate}
            setShowAdd={setShowAdd}
          />
          <SortBar
            sortBy={sortBy} setSortBy={setSortBy}
            sortDir={sortDir} setSortDir={setSortDir}
            filterSize={filterSize} setFilterSize={setFilterSize}
            filterViTri={filterViTri} setFilterViTri={setFilterViTri}
            filteredCount={filtered.length} totalCount={dsSanPham.length}
            viewMode={viewMode} setViewMode={setViewMode}
          />
        </div>

        {/* Content */}
        <div className="overflow-hidden">
          {filtered.length === 0 ? (
            <div className="card p-12 text-center text-slate-400">
              <Box className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <div className="text-sm font-semibold">Chưa có sản phẩm nào trong kho</div>
              <div className="text-xs mt-1">Click "Auto" để tự động tạo từ workflow data</div>
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
              dsLenhCat={dsLenhCat}
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
      {openVariant && (
        <VariantDetailModal
          sp={openVariant}
          onClose={() => setOpenVariant(null)}
          onSave={handleSaveVariant}
        />
      )}

      {lenhDangNhap && (() => {
        const ketQuaGiaVon = tinhGiaVonLenhCat(lenhDangNhap, giaoDich);
        const dsMau = lenhDangNhap.dsMau || [];
        const tongSL = lenhDangNhap.tongSL || 0;
        return (
          <ResponsiveModal open={true} maxWidth="2xl" onClose={() => setLenhDangNhap(null)} title="CHI TIẾT NHẬP KHO TỪ SẢN XUẤT">
            <div className="space-y-5 p-1">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                  <div className="text-[11px] font-bold uppercase text-blue-600">Mã LC / LSX nguồn</div>
                  <div className="mt-1 font-mono font-black text-blue-900">{lenhDangNhap.id}</div>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                  <div className="text-[11px] font-bold uppercase text-emerald-600">Giá vốn bắt buộc</div>
                  <div className="mt-1 font-black text-emerald-900">{ketQuaGiaVon.giaVon1SP.toLocaleString("vi-VN")}đ/SP</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] font-bold uppercase text-slate-500">Số lượng nhập</div>
                  <div className="mt-1 font-black text-slate-900">{tongSL.toLocaleString("vi-VN")} SP</div>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-black text-slate-800">Chọn loại giá bán đã thiết lập</h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {DS_KENH_BAN.map((kenh) => {
                    const giaCacMau = dsMau.map((m) => layGia(kenh.value as KenhBanBangGia, lenhDangNhap.maSP, m.maSKU, Math.max(1, m.slDuKien || m.slThucTe || 1))).filter((gia): gia is number => gia != null);
                    const coDuGia = dsMau.length > 0 && giaCacMau.length === dsMau.length;
                    const selected = kenhNhapKho.includes(kenh.value);
                    const min = giaCacMau.length ? Math.min(...giaCacMau) : 0;
                    const max = giaCacMau.length ? Math.max(...giaCacMau) : 0;
                    return (
                      <button
                        key={kenh.value}
                        type="button"
                        disabled={!coDuGia}
                        onClick={() => setKenhNhapKho((current) => selected ? current.filter((item) => item !== kenh.value) : [...current, kenh.value])}
                        className={`rounded-xl border-2 p-3 text-left transition ${selected ? "border-emerald-600 bg-emerald-50" : "border-slate-200 bg-white"} disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        <div className="text-xs font-bold text-slate-700">{selected ? "✓ " : ""}{kenh.label}</div>
                        <div className={`mt-1 text-sm font-black ${coDuGia ? "text-emerald-700" : "text-rose-600"}`}>
                          {coDuGia ? `${min.toLocaleString("vi-VN")}${max !== min ? ` – ${max.toLocaleString("vi-VN")}` : ""}đ` : "Chưa có bảng giá"}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-slate-500">Giá bán được lấy tự động từ tab Bảng giá bán theo đúng mã sản phẩm, SKU, số lượng và ngày hiệu lực.</p>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                <button type="button" onClick={() => setLenhDangNhap(null)} className="rounded-xl border-2 border-slate-200 px-5 py-2.5 font-bold text-slate-600">Đóng</button>
                <button
                  type="button"
                  disabled={loadingBangGia || ketQuaGiaVon.giaVon1SP <= 0 || kenhNhapKho.length === 0}
                  onClick={() => handleNhapKhoFromLC(lenhDangNhap, kenhNhapKho)}
                  className="rounded-xl bg-[#2B4C3E] px-6 py-2.5 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingBangGia ? "Đang tải bảng giá..." : "Nhập kho"}
                </button>
              </div>
            </div>
          </ResponsiveModal>
        );
      })()}

      {/* Hidden file input for upload (image + video) */}
      <input ref={fileInputRef} type="file" className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
    </div>
  );
}
