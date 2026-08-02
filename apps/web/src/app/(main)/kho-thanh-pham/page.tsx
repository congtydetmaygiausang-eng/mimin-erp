"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { Box, Plus, Search, Filter, Download, Upload, Trash2, Edit, Eye, Package, TrendingUp, TrendingDown, Calendar, User, Building2, Hash, Sparkles, ChevronDown, ChevronUp, FileSpreadsheet, AlertTriangle, CheckCircle2, Truck, ShoppingBag, LayoutGrid, List, Camera, PackageOpen, Save, Video } from "lucide-react";
import { toast } from "sonner";
import { ALL_REAL_PHIEU } from "@/lib/real-workflow-data";
import type { PhieuWorkflow } from "@/lib/workflow-data";
import { MORE_LSX } from "@/lib/more-workflow-data";

// Combine tất cả phiếu workflow
const ALL_PHIEU: PhieuWorkflow[] = [...ALL_REAL_PHIEU, ...(MORE_LSX as any)];

const DS_TI_LE_SIZE = [
  "M-L-XL-2XL-3XL (1-1-1-1-1)",
  "L-XL-XL-2XL-3XL (0-1-2-1-1)",
  "L-XL-XL-2XL-2XL-3XL (0-1-2-2-1)",
  "L-XL-2XL-3XL (1-1-1-1)",
  "L-XL-XL-2XL-3XL (1-2-1-1)"
];

const DS_KHU_KE_HANG = [
  "Khu A1", "Khu A2", "Khu A3", "Khu A4", "Khu A5", "Khu A6",
  "Khu B1", "Khu B2", "Khu B3", "Khu B4", "Khu C1"
];

// ============ TYPES ============
interface SanPhamTP {
  id: string;
  maSP: string;
  tenSP: string;
  phanLoai: string;
  mau: string;
  size: string;
  lsx: string;
  ngayNhap: string;
  soLuong: number;
  donGia: number;
  giaTri: number;
  viTri: string;       // "Kệ A1-A2"
  trangThai: "con" | "dat-hang" | "xuat-kho" | "khong-dat";
  khachHang?: string;
  tiLeSize?: string;
  ghiChu?: string;
}

const STORAGE_KEY = "mimin_kho_thanh_pham_v1";

// ============ HELPERS ============
function fromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const r = localStorage.getItem(key);
    if (r) return JSON.parse(r);
  } catch {}
  return defaultValue;
}
function saveStorage<T>(key: string, v: T) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
}

// Tự động generate danh sách SP thành phẩm từ các phiếu DG_ (Đóng gói) hoàn thành
function generateSanPhamFromWorkflow(): SanPhamTP[] {
  const ds = ALL_PHIEU.filter((p: any) => (p.id || "").startsWith("DG_") && p.trangThai === "Hoàn thành");
  return ds.map((p: any, i) => {
    const sl = p.soLuongDat || 0;
    const dg = p.donGia || 0;
    return {
      id: p.id,
      maSP: p.maSP,
      tenSP: p.phanLoai,
      phanLoai: p.phanLoai,
      mau: p.mau || "Trắng",
      size: p.size || "M",
      lsx: p.lenhSX,
      ngayNhap: p.ngayHoanThanh || new Date().toISOString().slice(0, 10),
      soLuong: sl,
      donGia: dg * 5, // Đơn giá bán = 5x công may
      giaTri: sl * dg * 5,
      viTri: `Kệ ${String.fromCharCode(65 + Math.floor(i / 5))}${(i % 5) + 1}-${(i % 5) + 2}`,
      trangThai: "con",
      ghiChu: p.ghiChu,
    } as SanPhamTP;
  });
}

export default function KhoThanhPhamPage() {
  const [dsSanPham, setDsSanPham] = useState<SanPhamTP[]>([]);
  const [search, setSearch] = useState("");
  const [filterTrangThai, setFilterTrangThai] = useState<"all" | SanPhamTP["trangThai"]>("all");
  const [filterLoai, setFilterLoai] = useState<"all" | string>("all");
  const [filterSize, setFilterSize] = useState<"all" | string>("all");
  const [filterViTri, setFilterViTri] = useState<"all" | string>("all");
  const [filterTiLeSize, setFilterTiLeSize] = useState<"all" | string>("all");
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
      // Tự động tạo từ workflow data
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
    if (filterTiLeSize !== "all") result = result.filter((s) => s.tiLeSize === filterTiLeSize);
    // Sort
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
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 text-white p-5 md:p-7 shadow-xl">
          <div className="text-xs font-medium opacity-90 mb-1 flex items-center gap-2">
            <Box className="w-3.5 h-3.5" /> MIMIN OS · Kho thành phẩm
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">📦 Kho Thành Phẩm</h1>
          <p className="text-sm opacity-95 mt-1 max-w-3xl">
            Quản lý sản phẩm hoàn thành từ khâu Đóng gói. Tự động đồng bộ từ workflow data, hỗ trợ nhập/xuất kho, thống kê doanh thu tiềm năng.
          </p>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2 text-center text-xs">
            <div className="bg-white/15 backdrop-blur rounded-lg p-2"><div className="text-xl md:text-2xl font-bold">{stats.tongSP.toLocaleString()}</div><div className="opacity-90">Tổng SP</div></div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-2"><div className="text-xl md:text-2xl font-bold">{stats.soLoai}</div><div className="opacity-90">Loại SP</div></div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-2"><div className="text-xl md:text-2xl font-bold">{(stats.tongGT/1_000_000).toFixed(1)}tr</div><div className="opacity-90">Giá trị</div></div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-2"><div className="text-xl md:text-2xl font-bold">{stats.conHang}</div><div className="opacity-90">Còn hàng</div></div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-2"><div className="text-xl md:text-2xl font-bold">{stats.daDat}</div><div className="opacity-90">Đã đặt</div></div>
          </div>
        </div>

        {/* Action bar */}
        <div className="card p-3 flex flex-col md:flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm mã SP, tên, LSX, màu, size, vị trí..."
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:border-amber-500 outline-none"
            />
          </div>
          <select
            value={filterTrangThai}
            onChange={(e) => setFilterTrangThai(e.target.value as any)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="con">Còn hàng</option>
            <option value="dat-hang">Đã đặt hàng</option>
            <option value="xuat-kho">Đã xuất kho</option>
            <option value="khong-dat">Không đặt</option>
          </select>
          <select
            value={filterLoai}
            onChange={(e) => setFilterLoai(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="all">Tất cả loại</option>
            {dsLoai.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <button onClick={exportCSV} className="px-3 py-2 bg-emerald-500 text-white rounded-lg text-sm font-semibold flex items-center gap-1">
            <Download className="w-4 h-4" /> CSV
          </button>
          <button onClick={handleAutoGenerate} className="px-3 py-2 bg-sky-500 text-white rounded-lg text-sm font-semibold flex items-center gap-1">
            <Sparkles className="w-4 h-4" /> Auto
          </button>
          <button onClick={() => setShowAdd(true)} className="px-3 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold flex items-center gap-1">
            <Plus className="w-4 h-4" /> Thêm
          </button>
        </div>

        {/* Sort bar */}
        <div className="card p-2 flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-600">Sắp xếp:</span>
          {[
            { k: "ngay", l: "Ngày nhập" },
            { k: "sl", l: "Số lượng" },
            { k: "gt", l: "Giá trị" },
          ].map((s) => (
            <button
              key={s.k}
              onClick={() => { if (sortBy === s.k) setSortDir(sortDir === "asc" ? "desc" : "asc"); else { setSortBy(s.k as any); setSortDir("desc"); } }}
              className={`px-2 py-1 rounded flex items-center gap-1 ${
                sortBy === s.k ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {s.l} {sortBy === s.k && (sortDir === "desc" ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />)}
            </button>
          ))}
          <div className="flex items-center gap-2 ml-2 border-l pl-2 border-slate-200">
            <select
              value={filterSize}
              onChange={(e) => setFilterSize(e.target.value)}
              className="px-2 py-1 bg-white border rounded text-xs outline-none text-slate-700"
            >
              <option value="all">Tỉ lệ size</option>
              {DS_TI_LE_SIZE.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={filterViTri}
              onChange={(e) => setFilterViTri(e.target.value)}
              className="px-2 py-1 bg-white border rounded text-xs outline-none text-slate-700"
            >
              <option value="all">Khu kệ hàng</option>
              {DS_KHU_KE_HANG.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          
          <div className="ml-auto flex items-center gap-2">
            <span className="text-slate-500 mr-2">Hiển thị <b>{filtered.length}</b>/{dsSanPham.length}</span>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded border">
              <button onClick={() => setViewMode("grid")} className={`p-1 rounded ${viewMode === "grid" ? "bg-white shadow" : "text-slate-500 hover:text-slate-700"}`} title="Grid view"><LayoutGrid className="w-4 h-4" /></button>
              <button onClick={() => setViewMode("table")} className={`p-1 rounded ${viewMode === "table" ? "bg-white shadow" : "text-slate-500 hover:text-slate-700"}`} title="Table view"><List className="w-4 h-4" /></button>
            </div>
          </div>
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
            <div className="flex flex-col gap-8">
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
              {groupedProducts.map(group => {
                const totalQty = group.items.reduce((s, x) => s + x.soLuong, 0);
                const totalValue = group.items.reduce((s, x) => s + x.giaTri, 0);
                const priceRange = Array.from(new Set(group.items.map(x => x.donGia)));
                const priceDisplay = priceRange.length === 1 ? priceRange[0].toLocaleString() : `${Math.min(...priceRange).toLocaleString()} - ${Math.max(...priceRange).toLocaleString()}`;

                return (
                  <div key={group.maSP} className="bg-white rounded-2xl shadow-sm border-2 border-emerald-500 overflow-hidden flex flex-col">
                    {/* Header: Khung vùng xanh lá */}
                    <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-4 md:p-6 text-white flex flex-col md:flex-row gap-6 items-stretch rounded-t-2xl">
                      
                      {/* Left: Big Cover Image & Video */}
                      <div className="flex gap-3 flex-shrink-0 w-full md:w-[420px] h-[240px] md:h-auto">
                        
                        {/* ẢNH BÌA */}
                        <div 
                          className="flex-1 bg-black/20 rounded-xl relative overflow-hidden group border border-white/20 shadow-inner"
                          onClick={() => {
                            if (productImages[group.maSP]) {
                              setViewingImage(productImages[group.maSP]);
                            } else {
                              setUploadingSP(group.maSP); setUploadType("image"); fileInputRef.current?.click();
                            }
                          }}
                          title={productImages[group.maSP] ? "Nhấn để tải ảnh về" : "Nhấn để tải ảnh lên"}
                        >
                          {productImages[group.maSP] && (
                            <button 
                              className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black/90 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-all z-10 hover:scale-110 shadow-lg"
                              onClick={(e) => { e.stopPropagation(); setUploadingSP(group.maSP); setUploadType("image"); fileInputRef.current?.click(); }}
                              title="Thay đổi ảnh bìa"
                            >
                              <Camera className="w-4 h-4" />
                            </button>
                          )}
                          
                          {productImages[group.maSP] ? (
                            <img src={productImages[group.maSP]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer" alt={group.tenSP} />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors">
                              <Camera className="w-10 h-10 mb-3 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                              <span className="text-sm font-bold uppercase tracking-widest opacity-80 text-center leading-tight">Ảnh bìa<br/>chính</span>
                            </div>
                          )}
                        </div>
                        
                        {/* VIDEO */}
                        <div 
                          className="w-[35%] bg-black/20 rounded-xl relative overflow-hidden group border border-white/20 shadow-inner flex-shrink-0"
                          onClick={() => {
                            if (!productVideos[group.maSP]) {
                              setUploadingSP(group.maSP); setUploadType("video"); fileInputRef.current?.click();
                            }
                          }}
                          title={productVideos[group.maSP] ? "Nhấn để xem hoặc tải video về" : "Nhấn để tải video lên"}
                        >
                          {productVideos[group.maSP] && (
                            <button 
                              className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black/90 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-all z-10 hover:scale-110 shadow-lg"
                              onClick={(e) => { e.stopPropagation(); setUploadingSP(group.maSP); setUploadType("video"); fileInputRef.current?.click(); }}
                              title="Thay đổi video"
                            >
                              <Video className="w-4 h-4" />
                            </button>
                          )}

                          {productVideos[group.maSP] ? (
                            <video src={productVideos[group.maSP]} className="w-full h-full object-contain bg-black/40" controls playsInline />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors">
                              <Video className="w-8 h-8 mb-3 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                              <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 text-center leading-tight">Video<br/>SP</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Middle & Right: Info, Stats (Red boxes), and Buttons (Green boxes) */}
                      <div className="flex-1 flex flex-col justify-between py-1">
                        
                        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
                          {/* Title */}
                          <div>
                            <div className="inline-flex items-center justify-center px-3 py-1 bg-white/20 rounded-md text-[11px] font-bold uppercase tracking-wider mb-2 backdrop-blur border border-white/10 shadow-sm">{group.maSP || "CHƯA CÓ MÃ"}</div>
                            <h2 className="text-3xl md:text-4xl font-extrabold leading-tight tracking-tight drop-shadow-sm">{group.tenSP || "Sản phẩm mới"}</h2>
                          </div>
                          
                          {/* Buttons */}
                          <div className="flex gap-2 flex-wrap xl:justify-end shrink-0">
                            <button onClick={() => setShowMasterDetails(group.maSP)} className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur text-white transition-all text-sm font-semibold flex items-center gap-2 shadow-sm border border-white/10 hover:scale-105" title="Xem chi tiết">
                              <Eye className="w-4 h-4" /> <span className="hidden sm:inline">Chi tiết</span>
                            </button>
                            <button onClick={() => setShowAdd(true)} className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur text-white transition-all text-sm font-semibold flex items-center gap-2 shadow-sm border border-white/10 hover:scale-105" title="Thêm đơn hàng">
                              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Thêm đơn</span>
                            </button>
                            <button onClick={() => alert('Chức năng sửa tổng')} className="px-4 py-2 bg-amber-500/90 hover:bg-amber-500 rounded-xl backdrop-blur text-white transition-all text-sm font-bold flex items-center gap-2 shadow-md border border-amber-400/50 hover:scale-105" title="Sửa tổng">
                              <Edit className="w-4 h-4" /> <span className="hidden sm:inline">Sửa tổng</span>
                            </button>
                            <button onClick={() => { if(confirm('Xóa toàn bộ sản phẩm này?')) update(dsSanPham.filter(s => s.maSP !== group.maSP)); }} className="p-2 bg-rose-500/80 hover:bg-rose-500 rounded-xl backdrop-blur text-white transition-all shadow-md hover:scale-105" title="Xóa toàn bộ sản phẩm">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
                          <div className="bg-black/15 rounded-xl p-4 backdrop-blur border border-white/10 shadow-inner hover:bg-black/20 transition-colors">
                            <div className="text-xs text-emerald-100 uppercase font-bold tracking-wider mb-1.5 opacity-90">Tổng số lượng</div>
                            <div className="text-3xl font-black drop-shadow-sm">{totalQty.toLocaleString()}</div>
                          </div>
                          <div className="bg-black/15 rounded-xl p-4 backdrop-blur border border-white/10 shadow-inner hover:bg-black/20 transition-colors">
                            <div className="text-xs text-emerald-100 uppercase font-bold tracking-wider mb-1.5 opacity-90">Giá bán</div>
                            <div className="text-3xl font-bold drop-shadow-sm">{priceDisplay}đ</div>
                          </div>
                          <div className="bg-black/15 rounded-xl p-4 backdrop-blur border border-white/10 shadow-inner hover:bg-black/20 transition-colors">
                            <div className="text-xs text-emerald-100 uppercase font-bold tracking-wider mb-1.5 opacity-90">Tổng giá trị</div>
                            <div className="text-3xl font-bold drop-shadow-sm">{(totalValue/1000).toFixed(0)}K</div>
                          </div>
                          <div className="bg-black/15 rounded-xl p-4 backdrop-blur border border-white/10 shadow-inner hover:bg-black/20 transition-colors">
                            <div className="text-xs text-emerald-100 uppercase font-bold tracking-wider mb-1.5 opacity-90">Kiện biến thể</div>
                            <div className="text-3xl font-bold drop-shadow-sm">{group.items.length}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Body: Danh sách biến thể */}
                    <div className="p-4 md:p-5 bg-slate-50 flex-1">
                      <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5" /> Chi tiết biến thể
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                        {group.items.map(s => (
                          <div key={s.id} className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm relative group hover:border-amber-400 hover:shadow-md transition-all flex gap-3">
                            <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer border border-slate-200" onClick={(e) => { e.stopPropagation(); setUploadingSP(s.id); fileInputRef.current?.click(); }}>
                              {productImages[s.id] ? (
                                <img src={productImages[s.id]} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-400 group-hover:text-amber-500 transition-colors">
                                  <Camera className="w-5 h-5 opacity-60" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 flex flex-col justify-between">
                              <div className="flex justify-between items-start mb-1">
                                <div>
                                  <div className="font-bold text-sm text-slate-800">{s.mau}</div>
                                  <div className="text-xs text-slate-500 font-semibold">{s.size}</div>
                                </div>
                                <div className="text-right">
                                  <div className="font-black text-amber-600 text-lg leading-none">{s.soLuong.toLocaleString()}</div>
                                  <div className="text-[10px] text-slate-400 font-mono mt-1">{s.lsx}</div>
                                </div>
                              </div>
                              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {s.trangThai === "con" && <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] rounded font-bold w-fit">Còn</span>}
                                  {s.trangThai === "dat-hang" && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] rounded font-bold w-fit">Đã đặt</span>}
                                  {s.trangThai === "xuat-kho" && <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 text-[9px] rounded font-bold w-fit">Đã xuất</span>}
                                  {s.trangThai === "khong-dat" && <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 text-[9px] rounded font-bold w-fit">Không đặt</span>}
                                  <span className="text-[9px] font-semibold text-slate-500 flex items-center gap-0.5"><Box className="w-2.5 h-2.5" /> {s.viTri}</span>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={(e) => { e.stopPropagation(); setEditing(s); }} className="p-1 hover:bg-amber-100 text-amber-600 rounded" title="Sửa thông tin, giá, số lượng">
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); handleXuatKho(s.id); }} className="p-1 hover:bg-emerald-100 text-emerald-600 rounded" title="Xuất kho">
                                    <Truck className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-amber-50 text-amber-900">
                  <tr>
                    <th className="p-2 text-left">Mã SP</th>
                    <th className="p-2 text-left">Tên SP</th>
                    <th className="p-2 text-left">Màu/Size</th>
                    <th className="p-2 text-left">LSX</th>
                    <th className="p-2 text-right">SL</th>
                    <th className="p-2 text-right">Đơn giá</th>
                    <th className="p-2 text-right">Giá trị</th>
                    <th className="p-2 text-left">Vị trí</th>
                    <th className="p-2 text-center">Trạng thái</th>
                    <th className="p-2 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id} className="border-t hover:bg-amber-50/30">
                      <td className="p-2 font-mono font-bold text-amber-700">{s.maSP}</td>
                      <td className="p-2">
                        <div className="font-semibold">{s.tenSP}</div>
                        <div className="text-[10px] text-slate-500">{s.phanLoai}</div>
                      </td>
                      <td className="p-2 text-xs">
                        <div>{s.mau}</div>
                        <div className="text-slate-500">{s.size}</div>
                      </td>
                      <td className="p-2 font-mono text-[10px]">{s.lsx}</td>
                      <td className="p-2 text-right font-bold">{s.soLuong.toLocaleString()}</td>
                      <td className="p-2 text-right text-xs">{s.donGia.toLocaleString()}đ</td>
                      <td className="p-2 text-right font-mono font-bold text-emerald-600">{(s.giaTri/1000).toFixed(0)}K</td>
                      <td className="p-2 text-xs font-mono text-slate-500">{s.viTri}</td>
                      <td className="p-2 text-center">
                        {s.trangThai === "con" && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] rounded-full font-bold">Còn</span>}
                        {s.trangThai === "dat-hang" && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded-full font-bold">Đã đặt</span>}
                        {s.trangThai === "xuat-kho" && <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] rounded-full font-bold">Đã xuất</span>}
                        {s.trangThai === "khong-dat" && <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] rounded-full font-bold">Không đặt</span>}
                      </td>
                      <td className="p-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setEditing(s)} className="p-1 hover:bg-blue-100 rounded" title="Sửa">
                            <Edit className="w-3.5 h-3.5 text-blue-600" />
                          </button>
                          <button onClick={() => handleXuatKho(s.id)} className="p-1 hover:bg-emerald-100 rounded" title="Xuất kho">
                            <Truck className="w-3.5 h-3.5 text-emerald-600" />
                          </button>
                          <button onClick={() => handleDelete(s.id)} className="p-1 hover:bg-rose-100 rounded" title="Xóa">
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Thống kê chi tiết */}
        {showStats && (
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm flex items-center gap-2"><FileSpreadsheet className="w-4 h-4 text-amber-500" /> Thống kê theo loại SP</h3>
              <button onClick={() => setShowStats(false)} className="text-xs text-slate-500 hover:text-slate-700">Ẩn</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {dsLoai.map((ma) => {
                const items = dsSanPham.filter((s) => s.maSP === ma);
                const sl = items.reduce((s, x) => s + x.soLuong, 0);
                const gt = items.reduce((s, x) => s + x.giaTri, 0);
                const sample = items[0];
                return (
                  <div key={ma} className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-amber-700">{ma}</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-amber-200 text-amber-800 rounded">{items.length} lô</span>
                    </div>
                    <div className="text-xs text-slate-600 truncate mb-1">{sample?.tenSP}</div>
                    <div className="flex justify-between text-[10px]">
                      <span>SL: <b>{sl.toLocaleString()}</b></span>
                      <span className="text-emerald-600 font-bold">{(gt/1000).toFixed(0)}K</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal thêm */}
      {showAdd && <AddEditModal onClose={() => setShowAdd(false)} onSave={handleAdd} />}
      {editing && <AddEditModal sp={editing} initialImage={productImages[editing.id]} onClose={() => setEditing(null)} onSave={handleEdit} />}
    </div>
  );
}

function AddEditModal({ sp, initialImage, onClose, onSave }: { sp?: SanPhamTP; initialImage?: string; onClose: () => void; onSave: (data: any) => void }) {
  const [form, setForm] = useState({
    maSP: sp?.maSP || "",
    tenSP: sp?.tenSP || "",
    phanLoai: sp?.phanLoai || "",
    mau: sp?.mau || "Trắng",
    size: sp?.size || "M, L, XL",
    lsx: sp?.lsx || "LSX-2026-007",
    ngayNhap: sp?.ngayNhap || new Date().toISOString().slice(0, 10),
    soLuong: sp?.soLuong || 100,
    donGia: sp?.donGia || 50000,
    viTri: sp?.viTri || "Kệ A1-A2",
    trangThai: sp?.trangThai || "con",
    ghiChu: sp?.ghiChu || "",
  });

  const [image, setImage] = useState(initialImage || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const r = new FileReader();
      r.onload = ev => setImage(ev.target?.result as string);
      r.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 flex items-center justify-between">
          <h2 className="font-bold text-lg">{sp ? "Sửa" : "Thêm"} biến thể</h2>
          <button onClick={onClose} className="px-2 py-1 hover:bg-white/20 rounded">✕</button>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex gap-4 items-start mb-4">
             <div className="w-24 h-24 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex-shrink-0 flex items-center justify-center cursor-pointer overflow-hidden group hover:border-amber-400 transition-colors" onClick={() => fileInputRef.current?.click()}>
               <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
               {image ? (
                 <img src={image} className="w-full h-full object-cover group-hover:opacity-70 transition-opacity" />
               ) : (
                 <div className="text-center text-slate-400 group-hover:text-amber-500 transition-colors">
                   <Camera className="w-6 h-6 mx-auto mb-1 opacity-50" />
                   <div className="text-[9px] font-bold uppercase">Tải ảnh</div>
                 </div>
               )}
             </div>
             <div className="flex-1 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">Mã SP mẹ *</label>
                    <input value={form.maSP} onChange={(e) => setForm({ ...form, maSP: e.target.value.toUpperCase() })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none font-mono" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">Tên SP mẹ *</label>
                    <input value={form.tenSP} onChange={(e) => setForm({ ...form, tenSP: e.target.value })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none" />
                  </div>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Màu</label>
              <input value={form.mau} onChange={(e) => setForm({ ...form, mau: e.target.value })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Size / Tỉ lệ</label>
              <input list="ds-ti-le-size" value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none" />
              <datalist id="ds-ti-le-size">
                {DS_TI_LE_SIZE.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">LSX (Tự động điền màu)</label>
              <input 
                value={form.lsx} 
                onChange={(e) => {
                  const val = e.target.value;
                  const newForm = { ...form, lsx: val };
                  const matchedLC = ALL_PHIEU.find((p: any) => p.lenhSX === val && p.id?.startsWith("LC_"));
                  const matched = ALL_PHIEU.find((p: any) => p.lenhSX === val && p.mau);
                  
                  if (matchedLC) {
                    if (!form.maSP) newForm.maSP = matchedLC.maSP || "";
                    if (!form.tenSP) newForm.tenSP = matchedLC.phanLoai || "";
                    if (!form.mau) newForm.mau = matchedLC.mau || "Trắng";
                    if (!form.size) newForm.size = matchedLC.size || "M";
                  } else if (matched && matched.mau) {
                    newForm.mau = matched.mau;
                    if (!form.maSP) newForm.maSP = matched.maSP || "";
                    if (!form.tenSP) newForm.tenSP = matched.phanLoai || "";
                  }
                  setForm(newForm);
                }} 
                className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none font-mono" 
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Số lượng *</label>
              <input type="number" min="0" value={form.soLuong} onChange={(e) => setForm({ ...form, soLuong: Math.max(0, parseInt(e.target.value) || 0) })} className="w-full px-3 py-2 border-2 border-emerald-300 rounded-lg text-lg font-bold focus:border-emerald-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Đơn giá (đ)</label>
              <input type="number" min="0" value={form.donGia} onChange={(e) => setForm({ ...form, donGia: Math.max(0, parseInt(e.target.value) || 0) })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Vị trí (Khu kệ)</label>
              <input list="ds-khu-ke-hang" value={form.viTri} onChange={(e) => setForm({ ...form, viTri: e.target.value })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none" />
              <datalist id="ds-khu-ke-hang">
                {DS_KHU_KE_HANG.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">Trạng thái</label>
            <select value={form.trangThai} onChange={(e) => setForm({ ...form, trangThai: e.target.value as any })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none">
              <option value="con">Còn hàng</option>
              <option value="dat-hang">Đã đặt hàng</option>
              <option value="xuat-kho">Đã xuất kho</option>
              <option value="khong-dat">Không đặt</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">Ghi chú</label>
            <textarea value={form.ghiChu} onChange={(e) => setForm({ ...form, ghiChu: e.target.value })} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none" />
          </div>
          <div className="bg-amber-50 p-3 rounded-lg text-xs">
            <div className="font-semibold text-amber-800">Tóm tắt:</div>
            <div><b>{form.maSP}</b> - {form.tenSP} | Màu {form.mau} | Size {form.size}</div>
            <div>SL: <b>{form.soLuong.toLocaleString()}</b> × {form.donGia.toLocaleString()}đ = <b className="text-emerald-600">{(form.soLuong * form.donGia).toLocaleString()}đ</b></div>
          </div>
        </div>
        <div className="p-4 border-t flex justify-end gap-2 bg-slate-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-semibold">Hủy</button>
          <button onClick={() => onSave({ ...form, __tempImage: image })} className="px-4 py-2 bg-amber-500 text-white rounded-lg font-bold hover:bg-amber-600 flex items-center gap-2">
            <Save className="w-4 h-4" /> Lưu biến thể
          </button>
        </div>
      </div>
    </div>
  );
}
