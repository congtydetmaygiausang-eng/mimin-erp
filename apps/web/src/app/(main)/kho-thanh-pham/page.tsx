"use client";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Box, Download, Sparkles, Plus, Package, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useLenhCat } from "@/lib/data/lenh-cat-store";
import { useDanhMucSP, type MauTieuChuan } from "@/lib/data/danh-muc-sp-store";
import { supabaseFetchAllRaw, supabaseUpsertRaw, supabaseDelete, checkSupabase } from "@/lib/supabase/sync-helper";
import { STORAGE_KEY, KHO_TP_CHANGED_EVENT, generateSanPhamFromWorkflow, fromSupabaseRow, toSupabaseRow, type SanPhamTP } from "./data";
import { StatsHeader, StatsByType } from "./components/StatsPanel";
import { FilterBar, SortBar } from "./components/FilterBar";
import { ProductGrid } from "./components/ProductGrid";
import { ProductTable } from "./components/ProductTable";
import { ProductFormModal } from "./components/ProductFormModal";
import { MasterDetailsModal } from "./components/MasterDetailsModal";
import { DangBanModal } from "./components/DangBanModal";
import { VariantDetailModal } from "./components/VariantDetailModal";

export default function KhoThanhPhamPage() {
  const { dsLenhCat, capNhatTrangThai } = useLenhCat();
  const [dsSanPham, setDsSanPhamState] = useState<SanPhamTP[]>([]);
  const { dsSanPham: dsDanhMuc, themSP, suaSP } = useDanhMucSP();
  const [dangBanGroup, setDangBanGroup] = useState<{ maSP: string; tenSP: string; items: SanPhamTP[] } | null>(null);
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
        if (Array.isArray(parsed) && parsed.length > 0) setDsSanPhamState(parsed);
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

  // Đơn hàng chuyển sang "Đã giao" sẽ trừ tồn kho ở nơi khác (don-hang-store) rồi
  // phát sự kiện này - nạp lại từ localStorage để số tồn trên màn hình đúng ngay.
  useEffect(() => {
    const onChanged = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as SanPhamTP[];
        if (Array.isArray(parsed)) setDsSanPhamState(parsed);
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
        const deletedIds = prev.filter((r) => !newIds.has(r.id)).map((r) => r.id);
        Promise.all([
          ...newDs.map((row) => supabaseUpsertRaw("kho_thanh_pham", toSupabaseRow(row))),
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
    if (filterLoai !== "all") result = result.filter((s) => s.maSP === filterLoai);
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
      if (dm.hinhAnh && !map[dm.id]) {
        map[dm.id] = dm.hinhAnh;
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
      const { __tempImage, ...sp } = item;
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
          maSKU: `${groupMaSP}-${r.mau}`,
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
           hinhAnh: existingDM.hinhAnh || anhDaiDien
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
  };

  const handleEdit = (data: any) => {
    const { __tempImage, ...sp } = data;
    
    if (__tempImage) {
      if (!sp.hinhAnh || sp.hinhAnh.length === 0) {
        sp.hinhAnh = [__tempImage];
      } else if (!sp.hinhAnh.includes(__tempImage)) {
        sp.hinhAnh = [__tempImage, ...sp.hinhAnh];
      }
    }
    
    update(dsSanPham.map((s) => (s.id === sp.id ? { ...sp, giaTri: sp.soLuong * sp.donGia } : s)));
    if (__tempImage) {
      setProductImages((prev) => ({ ...prev, [sp.id]: __tempImage }));
    }
    toast.success("Đã cập nhật");
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Xóa sản phẩm này?")) return;
    update(dsSanPham.filter((s) => s.id !== id));
    toast.success("Đã xóa");
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
      
      if (updated.giaBanLe && (updated.giaBanLe > newDM.giaBanDuKien || newDM.giaBanDuKien === 0)) {
        newDM.giaBanDuKien = updated.giaBanLe;
        changed = true;
      }
      
      if (newDM.dsMau) {
        const mauIndex = newDM.dsMau.findIndex(m => m.ten === updated.mau);
        if (mauIndex >= 0) {
          const oldMau = newDM.dsMau[mauIndex];
          const newImg = updated.hinhAnh?.[0] || oldMau.img;
          const newVid = updated.video || oldMau.video;
          if (newImg !== oldMau.img || newVid !== oldMau.video) {
            const newDsMau = [...newDM.dsMau];
            newDsMau[mauIndex] = { ...oldMau, img: newImg, video: newVid };
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

  // Tách/đồng bộ lại 1 nhóm sản phẩm thành card riêng cho MỖI MÀU, dựa trên
  // dsMau + số lượng thật của khâu Đóng gói ở lệnh cắt gốc. Dùng cho các bản ghi
  // cũ bị gộp "Nhiều màu" (nhập kho trước khi sửa lỗi gộp màu) - giữ lại ảnh/giá
  // đã nhập riêng nếu tên màu trùng khớp với card cũ.
  const handleRebuildFromLC = (group: { maSP: string; tenSP: string; items: SanPhamTP[] }) => {
    const lsx = group.items[0]?.lsx || group.maSP;
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
    const giaVon1SP = Math.round(lc.bangCOGS?.giaVonBinhQuan || lc.bangCOGS?.giaVon1SP || 0);

    const newSPs: SanPhamTP[] = lc.dsMau.map((m: any, idx: number) => {
      const ct = chiTietMauAll.find((c: any) => c.mau === m.ten);
      const old = group.items.find((i) => i.mau === m.ten);
      const sl = ct?.soLuongDat ?? old?.soLuong ?? Math.round((lc.tongSL || 0) / lc.dsMau.length);
      const donGia = old?.donGia || giaVon1SP;
      return {
        id: old?.id || `SP-${Date.now()}-${idx}`,
        maSP: lc.maSP || group.maSP,
        tenSP: group.tenSP,
        phanLoai: old?.phanLoai || "Áo",
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

    const lsx = group.items[0]?.lsx;
    const lc = dsLenhCat.find((l) => l.id === lsx);
    const mauTuLC = lc?.dsMau || [];

    const dsMauForSanPham: MauTieuChuan[] = group.items.map((item) => {
      const mauGoc = mauTuLC.find((m) => m.ten === item.mau);
      return {
        ten: item.mau,
        maSKU: mauGoc?.maSKU || `${group.maSP}-${item.mau}`,
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
    const rows = [["Mã SP", "Tên SP", "Màu", "Size", "LSX", "SL", "Đơn giá", "Giá trị", "Vị trí", "Trạng thái"]];
    filtered.forEach((s) => rows.push([s.maSP, s.tenSP, s.mau, s.size, s.lsx, String(s.soLuong), String(s.donGia), String(s.giaTri), s.viTri, s.trangThai]));
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
  const handleNhapKhoFromLC = (lc: any) => {
    const dongGoiPCs = lc.phanCong?.filter((pc: any) => pc.id === "dongGoi" || pc.id === "dong_goi" || pc.tenCongDoan?.toLowerCase().includes("đóng gói")) || [];
    const chiTietMauAll: any[] = dongGoiPCs.flatMap((pc: any) => pc.chiTietMau || []);
    const dsMauLC = lc.dsMau && lc.dsMau.length > 0 ? lc.dsMau : [{ ten: "Mặc định", img: "" }];
    const giaVon1SP = Math.round(lc.bangCOGS?.giaVonBinhQuan || lc.bangCOGS?.giaVon1SP || 0);
    const ngayNhap = new Date().toISOString().slice(0, 10);

    const newSps: SanPhamTP[] = dsMauLC.map((m: any, idx: number) => {
      const ct = chiTietMauAll.find((c: any) => c.mau === m.ten);
      const sl = ct?.soLuongDat ?? Math.round((lc.tongSL || 0) / dsMauLC.length);
      return {
        id: `TP-${Date.now().toString(36)}-${idx}`,
        maSP: lc.maSP || lc.id,
        tenSP: lc.tenSP || `Sản phẩm từ ${lc.id}`,
        phanLoai: "Áo",
        mau: m.ten,
        size: "Nhiều size",
        lsx: lc.id,
        ngayNhap,
        soLuong: sl,
        donGia: giaVon1SP,
        giaTri: sl * giaVon1SP,
        viTri: "Khu A1",
        trangThai: "con",
        hinhAnh: m.img ? [m.img] : [],
        imgQuan: m.imgQuan || undefined,
        chiTietSize: ct?.sizes || m.phanBoSize || [],
      } as SanPhamTP;
    }).filter((sp: SanPhamTP) => sp.soLuong > 0);

    if (newSps.length > 0) {
      update([...newSps, ...dsSanPham]);
      capNhatTrangThai(lc.id, "HoanThanh", null);
      toast.success(`Đã nhập kho ${newSps.length} màu từ ${lc.id}!`);
    } else {
      toast.error("Không tìm thấy chi tiết màu/số lượng đóng gói đạt!");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/30 to-rose-50/30 p-3 md:p-5">
      <div className="max-w-7xl mx-auto space-y-4">
        <StatsHeader stats={stats} />

        {/* Lệnh Cắt chờ nhập kho */}
        {dsChoNhapKho.length > 0 && (
          <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-amber-200 p-4 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-amber-700 flex items-center gap-2">
              <Package className="w-4 h-4" /> Có {dsChoNhapKho.length} lệnh cắt hoàn thành đóng gói, chờ nhập kho thành phẩm:
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {dsChoNhapKho.map(lc => (
                <div key={lc.id} className="bg-white rounded-xl border border-amber-100 p-3 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{lc.id} - {lc.tenSP}</div>
                    <div className="text-xs text-slate-500 mt-1">SL yêu cầu: <span className="font-semibold text-sky-600">{lc.tongSL?.toLocaleString('vi-VN')}</span></div>
                  </div>
                  <button
                    onClick={() => handleNhapKhoFromLC(lc)}
                    className="mt-3 flex items-center justify-center gap-1.5 w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                  >
                    Chi tiết nhập kho <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

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
              dsLenhCat={dsLenhCat}
            />
          ) : (
            <ProductTable
              filtered={filtered}
              productImages={mergedProductImages}
              setEditing={setEditing}
              handleXuatKho={handleXuatKho}
              handleDelete={handleDelete}
            />
          )}
        </div>

        {/* Thống kê chi tiết */}
        {showStats && <StatsByType dsLoai={dsLoai} dsSanPham={dsSanPham} onClose={() => setShowStats(false)} />}
      </div>

      {/* Modals */}
      {showMasterDetails && <MasterDetailsModal maSP={showMasterDetails} groups={groupedProducts} productImages={mergedProductImages} onClose={() => setShowMasterDetails(null)} />}
      {showAdd && <ProductFormModal onClose={() => setShowAdd(false)} onSave={handleAdd} />}
      {editing && <ProductFormModal sp={editing} initialImage={mergedProductImages[editing.id] || mergedProductImages[editing.maSP]} onClose={() => setEditing(null)} onSave={handleEdit} />}
      {dangBanGroup && (() => {
        const soMauCoAnh = dangBanGroup.items.filter((i) => i.hinhAnh?.[0]).length;
        const tongSoMau = dangBanGroup.items.length;
        const existing = dsDanhMuc.find((sp) => sp.id === dangBanGroup.maSP);
        // Giá vốn thật: ưu tiên đơn giá đã ghi lúc nhập kho, sau đó tới bảng COGS
        // của lệnh cắt gốc.
        const lcGoc = dsLenhCat.find((l) => l.id === dangBanGroup.items[0]?.lsx);
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

      {/* Hidden file input for upload (image + video) */}
      <input ref={fileInputRef} type="file" className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
    </div>
  );
}
