"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { Box, Download, Sparkles, Plus } from "lucide-react";
import { toast } from "sonner";
import { STORAGE_KEY, fromStorage, saveStorage, generateSanPhamFromWorkflow, type SanPhamTP } from "./data";
import { StatsHeader, StatsByType } from "./components/StatsPanel";
import { FilterBar, SortBar } from "./components/FilterBar";
import { ProductGrid } from "./components/ProductGrid";
import { ProductTable } from "./components/ProductTable";
import { ProductFormModal } from "./components/ProductFormModal";
import { MasterDetailsModal } from "./components/MasterDetailsModal";

export default function KhoThanhPhamPage() {
  const [dsSanPham, setDsSanPham] = useState<SanPhamTP[]>([]);
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

  // Load data
  useEffect(() => {
    let ds = fromStorage<SanPhamTP[]>(STORAGE_KEY, []);
    if (ds.length === 0) {
      ds = generateSanPhamFromWorkflow();
      saveStorage(STORAGE_KEY, ds);
    }
    setDsSanPham(ds);
  }, []);

  // Save on change
  const update = (newDs: SanPhamTP[]) => {
    setDsSanPham(newDs);
    saveStorage(STORAGE_KEY, newDs);
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/30 to-rose-50/30 p-3 md:p-5">
      <div className="max-w-7xl mx-auto space-y-4">
        <StatsHeader stats={stats} />

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

      {/* Hidden file input for upload (image + video) */}
      <input ref={fileInputRef} type="file" className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
    </div>
  );
}
