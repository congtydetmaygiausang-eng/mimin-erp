"use client";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Box, Download, Sparkles, Plus, Package, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useLenhCat } from "@/lib/data/lenh-cat-store";
import { useDanhMucSP, type MauTieuChuan } from "@/lib/data/danh-muc-sp-store";
import { supabaseFetchAllRaw, supabaseUpsertRaw, supabaseDelete, checkSupabase } from "@/lib/supabase/sync-helper";
import { STORAGE_KEY, generateSanPhamFromWorkflow, fromSupabaseRow, toSupabaseRow, type SanPhamTP } from "./data";
import { StatsHeader, StatsByType } from "./components/StatsPanel";
import { FilterBar, SortBar } from "./components/FilterBar";
import { ProductGrid } from "./components/ProductGrid";
import { ProductTable } from "./components/ProductTable";
import { ProductFormModal } from "./components/ProductFormModal";
import { MasterDetailsModal } from "./components/MasterDetailsModal";
import { DangBanModal } from "./components/DangBanModal";

export default function KhoThanhPhamPage() {
  const { dsLenhCat, capNhatTrangThai } = useLenhCat();
  const [dsSanPham, setDsSanPhamState] = useState<SanPhamTP[]>([]);
  const { dsSanPham: dsDanhMuc, themSP, suaSP } = useDanhMucSP();
  const [dangBanGroup, setDangBanGroup] = useState<{ maSP: string; tenSP: string; items: SanPhamTP[] } | null>(null);
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
  const [viewMode, setViewMode] = useState<"table" | "grid">("grid");

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
      if (rows.length > 0) {
        const remote = rows.map(fromSupabaseRow);
        setDsSanPhamState((prev) => {
          const remoteIds = new Set(remote.map((r) => r.id));
          const localOnly = prev.filter((r) => !remoteIds.has(r.id));
          const merged = [...remote, ...localOnly];
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(merged)); } catch {}
          return merged;
        });
      }
    })();
    return () => { mounted = false; };
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
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [dsSanPham, search, filterTrangThai, filterLoai, filterSize, filterViTri, sortBy, sortDir]);

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

  // Handlers
  const handleAdd = (data: any) => {
    const { __tempImage, ...sp } = data;
    const newSp: SanPhamTP = {
      ...sp,
      id: `TP${Date.now().toString().slice(-6)}`,
      giaTri: sp.soLuong * sp.donGia,
    };
    update([newSp, ...dsSanPham]);
    if (__tempImage) {
      setProductImages((prev) => ({ ...prev, [newSp.id]: __tempImage }));
    }
    toast.success(`Đã thêm ${sp.tenSP} (${sp.soLuong} sp)`);
  };

  const handleEdit = (data: any) => {
    const { __tempImage, ...sp } = data;
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

  // Chuyển 1 nhóm sản phẩm (theo maSP) từ Kho thành phẩm sang Danh mục sản phẩm để bán.
  // Ảnh lấy từ dsMau của lệnh cắt gốc (lsx) - giữ nguyên, không cần upload lại.
  const handleDangBan = async (giaBan: number, giaVon: number) => {
    const group = dangBanGroup;
    if (!group) return;

    const lsx = group.items[0]?.lsx;
    const lc = dsLenhCat.find((l) => l.id === lsx);
    const mauTuLC = lc?.dsMau || [];

    const dsMauForSanPham: MauTieuChuan[] = mauTuLC.length > 0
      ? mauTuLC.map((m) => ({ ten: m.ten, maSKU: m.maSKU || `${group.maSP}-${m.ten}`, dinhMuc: m.dinhMuc || 0, img: m.img || "" }))
      : Array.from(new Set(group.items.map((i) => i.mau))).map((mau) => ({ ten: mau, maSKU: `${group.maSP}-${mau}`, dinhMuc: 0, img: "" }));

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

  // Tính toán Lệnh cắt chờ nhập kho
  const dsChoNhapKho = useMemo(() => {
    return dsLenhCat.filter(lc => {
      if (lc.trangThai === "HoanThanh" || lc.trangThai === "TaoMoi") return false;
      const htPCs = lc.phanCong?.filter((pc: any) => pc.id === "dongGoi" || pc.id === "dong_goi" || pc.tenCongDoan?.toLowerCase().includes("đóng gói"));
      if (!htPCs || htPCs.length === 0) return false;
      return htPCs.every((pc: any) => pc.trangThaiCD === "hoan_thanh");
    });
  }, [dsLenhCat]);

  const handleNhapKhoFromLC = (lc: any) => {
    // Collect all chiTietMau from dong_goi
    const dongGoiPCs = lc.phanCong?.filter((pc: any) => pc.id === "dongGoi" || pc.id === "dong_goi" || pc.tenCongDoan?.toLowerCase().includes("đóng gói")) || [];
    
    let addedCount = 0;
    const newSps: SanPhamTP[] = [];
    
    dongGoiPCs.forEach((pc: any) => {
      if (pc.chiTietMau) {
        Object.keys(pc.chiTietMau).forEach(tenMau => {
          Object.keys(pc.chiTietMau[tenMau]).forEach(size => {
            const val = pc.chiTietMau[tenMau][size];
            const sl = typeof val === 'object' ? val.dat || 0 : (parseInt(String(val)) || 0);
            
            if (sl > 0) {
              newSps.push({
                id: `TP${Date.now().toString().slice(-6)}${Math.floor(Math.random()*1000)}`,
                maSP: lc.id, // Or extract from lc
                tenSP: lc.ten || `Sản phẩm từ ${lc.id}`,
                phanLoai: "Áo",
                mau: tenMau,
                size: size,
                lsx: lc.id,
                ngayNhap: new Date().toISOString().slice(0, 10),
                soLuong: sl,
                donGia: pc.donGia || 0,
                giaTri: sl * (pc.donGia || 0),
                viTri: "Khu A1", // Default
                trangThai: "con"
              });
              addedCount++;
            }
          });
        });
      }
    });

    if (newSps.length > 0) {
      update([...newSps, ...dsSanPham]);
      capNhatTrangThai(lc.id, "HoanThanh");
      toast.success(`Đã nhập kho ${addedCount} loại sản phẩm từ ${lc.id}!`);
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
                    <div className="font-bold text-slate-800 text-sm">{lc.id} - {lc.ten}</div>
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
              productImages={productImages}
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
            />
          ) : (
            <ProductTable
              filtered={filtered}
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
      {showMasterDetails && <MasterDetailsModal maSP={showMasterDetails} groups={groupedProducts} productImages={productImages} onClose={() => setShowMasterDetails(null)} />}
      {showAdd && <ProductFormModal onClose={() => setShowAdd(false)} onSave={handleAdd} />}
      {editing && <ProductFormModal sp={editing} initialImage={productImages[editing.id]} onClose={() => setEditing(null)} onSave={handleEdit} />}
      {dangBanGroup && (() => {
        const lc = dsLenhCat.find((l) => l.id === dangBanGroup.items[0]?.lsx);
        const mauTuLC = lc?.dsMau || [];
        const soMauCoAnh = mauTuLC.filter((m) => m.img).length;
        const tongSoMau = mauTuLC.length || new Set(dangBanGroup.items.map((i) => i.mau)).size;
        const existing = dsDanhMuc.find((sp) => sp.id === dangBanGroup.maSP);
        return (
          <DangBanModal
            group={dangBanGroup}
            soMauCoAnh={soMauCoAnh}
            tongSoMau={tongSoMau}
            daCoTrongDanhMuc={!!existing}
            giaBanMacDinh={existing?.giaBanDuKien}
            giaVonMacDinh={existing?.giaVonDuKien}
            onClose={() => setDangBanGroup(null)}
            onConfirm={handleDangBan}
          />
        );
      })()}

      {/* Hidden file input for upload (image + video) */}
      <input ref={fileInputRef} type="file" className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
    </div>
  );
}
