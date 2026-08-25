"use client";

import { useState, useEffect, useRef } from "react";
import {
  Package, AlertCircle, TrendingUp,
  Scissors, Calculator, FileText, BarChart3, Plus, X,
  History, Search, ArrowDownToLine, ArrowUpFromLine, Filter
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
  type BaoCaoVai
} from "@/lib/inventory-engine";
import { KHO_VAI, formatVND, type KhoVai } from "@/lib/data/real-data";
import { useNhaCungCap } from "@/lib/data/nha-cung-cap-store";
import { ALL_REAL_PHIEU } from "@/lib/real-workflow-data";
import { Portal } from "@/components/ui/Portal";
import { useKho } from "@/lib/data/kho-store";
import { uploadProductFile } from "@/lib/product-upload";

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
  const [inventory, setInventory] = useState<KhoVai[]>([]);
  const [tab, setTab] = useState<"tonkho" | "tinhman" | "baocao" | "danhmuc" | "lichsu">("tonkho");
  const [searchVai, setSearchVai] = useState("");
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
  // Form tạo mã vải mới — bind thật
  const [newVaiForm, setNewVaiForm] = useState<NewVaiForm>({
    tenVT: LOAI_VAI_OPTIONS[0],
    mauSac: "",
    donGia: 0,
    ghiChu: "",
    previewImg: "",
  });
  const newVaiImgRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  };

  // Tính màn
  const tinh = tinhMan(selected, parseSize(soLuong, sizeStr));
  const totalTonKho = inventory.reduce((s, v) => s + v.tonKho, 0);
  const totalDonGia = inventory.reduce((s, v) => s + v.tonKho * v.donGia, 0);
  const nextVaiNumber = inventory.reduce((max, item) => {
    const value = Number(item.maVT.match(/VAI-(\d+)/i)?.[1] || 0);
    return Math.max(max, value);
  }, 0) + 1;

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
    <div className="min-h-[calc(100vh-64px)] -m-4 md:-m-6 p-4 md:p-6 bg-gradient-to-br from-cyan-600 via-cyan-700 to-cyan-800">
      <div className="max-w-7xl mx-auto space-y-5 animate-fade-in relative z-10">
      <div className="rounded-3xl overflow-hidden shadow-xl mb-6" style={{ background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 35%, #0891b2 75%, #06b6d4 100%)" }}>
        <div className="p-5 md:p-6 text-white">
          <div className="text-xs font-medium opacity-90 mb-1.5 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5" /> MIMIN ERP · Kho & Giao hàng
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold flex items-center gap-2.5">
            <Package className="w-7 h-7" /> Kho Vải & Định Mức Vải
          </h1>
          <p className="text-sm opacity-95 mt-1.5">
            Quản lý tồn kho {inventory.length} loại vải · Tính định mức vải theo sản phẩm + size · Trừ kho tự động khi cắt
          </p>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-xs opacity-90 flex items-center gap-1.5"><Package className="w-3.5 h-3.5" /> Tổng tồn</div>
              <div className="text-xl md:text-2xl font-bold mt-1">{(totalTonKho / 1000).toFixed(1)} tấn</div>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-xs opacity-90 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> Giá trị tồn</div>
              <div className="text-xl md:text-2xl font-bold mt-1">{(totalDonGia / 1_000_000).toFixed(1)}tr</div>
            </div>
          </div>

          {/* Tabs (inline trong header gradient) */}
          <div className="flex flex-wrap gap-2 bg-white/15 backdrop-blur-sm rounded-xl p-1.5 w-fit mt-5 border border-white/20">
            {[
              { key: "tonkho", label: "Tồn kho", icon: <Package className="w-4 h-4" /> },
              { key: "tinhman", label: "Định mức vải", icon: <Calculator className="w-4 h-4" /> },
              { key: "baocao", label: "Báo cáo vải", icon: <BarChart3 className="w-4 h-4" /> },
              { key: "lichsu", label: "Lịch sử GD", icon: <History className="w-4 h-4" /> },
              { key: "danhmuc", label: "Danh mục", icon: <Plus className="w-4 h-4" /> },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key as any)}
                className={`px-4 py-2 text-sm rounded-lg flex items-center gap-2 transition-all ${
                  tab === t.key
                    ? "bg-white text-teal-700 shadow-md font-bold"
                    : "font-medium text-white/85 hover:bg-white/15 hover:text-white"
                }`}
              >
                {t.icon} {t.label}
                {t.key === "lichsu" && giaoDich.length > 0 && (
                  <span className="bg-white/30 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {giaoDich.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab: Tồn kho */}
      {tab === "tonkho" && (
        <>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          <div className="card p-4 flex flex-wrap gap-2">
            <button onClick={handleTruAllCAT} className="btn-primary text-sm flex items-center gap-1.5">
              <Scissors className="w-4 h-4" /> Trừ vải xuất cho Lệnh cắt
            </button>
          </div>
          {/* Search bar Tồn kho */}
          <div className="card p-3 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Tìm tên vải, màu sắc..."
              className="flex-1 text-sm bg-transparent outline-none text-slate-700 dark:text-slate-300 placeholder:text-slate-400"
              value={searchVai}
              onChange={(e) => setSearchVai(e.target.value)}
            />
            {searchVai && (
              <button onClick={() => setSearchVai("")} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
            <span className="text-xs text-slate-400 ml-2">
              {inventory.filter(v => !searchVai || v.tenVT.toLowerCase().includes(searchVai.toLowerCase()) || v.mauSac?.toLowerCase().includes(searchVai.toLowerCase())).length}/{inventory.length} loại
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-4">
            {inventory.filter(v => !searchVai || v.tenVT.toLowerCase().includes(searchVai.toLowerCase()) || v.mauSac?.toLowerCase().includes(searchVai.toLowerCase())).map((v, index) => {
              const getTonKhoColor = (tonKho: number) => {
                if (tonKho < 100) return "text-red-600 dark:text-red-500";
                if (tonKho >= 300) return "text-emerald-600 dark:text-emerald-500";
                if (tonKho >= 200) return "text-amber-500 dark:text-amber-400";
                return "text-sky-600 dark:text-sky-400";
              };
              
              return (
              <div key={v.maVT} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all relative overflow-hidden group">
                
                {/* Top row: ID and actions */}
                <div className="flex justify-between items-start mb-3">
                  <div className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md text-sm font-bold text-slate-700 dark:text-slate-300 tracking-wider">
                    {`VAI-${(index + 1).toString().padStart(2, "0")}`}
                  </div>
                </div>

                {/* Main content: Color image & Name */}
                <div className="flex flex-col gap-3 mb-4">
                  <div 
                    className="w-full h-40 rounded-2xl border-2 border-slate-200/50 dark:border-slate-700/50 shadow-sm overflow-hidden cursor-pointer relative group/img flex items-center justify-center bg-slate-100 dark:bg-slate-800 transition-transform group-hover:scale-[1.02]"
                    style={{ backgroundColor: (vaiImages[v.maVT] || (v as KhoVaiWithImage).imageUrl) ? 'transparent' : getColorHex(v.mauSac) }}
                    onClick={() => {
                      const src = vaiImages[v.maVT] || (v as KhoVaiWithImage).imageUrl;
                      if (src) setPreviewImage({ src, alt: `${v.tenVT} - ${v.mauSac}` });
                      else { setUploadingVT(v.maVT); fileInputRef.current?.click(); }
                    }}
                    title="Bấm để xem ảnh lớn"
                  >
                    {(vaiImages[v.maVT] || (v as KhoVaiWithImage).imageUrl) ? (
                      <img src={vaiImages[v.maVT] || (v as KhoVaiWithImage).imageUrl} alt={v.mauSac} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-white/90 font-bold opacity-0 group-hover/img:opacity-100 transition-opacity drop-shadow-md">+ Ảnh</span>
                    )}
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setUploadingVT(v.maVT);
                        fileInputRef.current?.click();
                      }}
                      className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-blue-600 text-white font-bold shadow-lg opacity-0 group-hover/img:opacity-100 transition-opacity"
                      title="Đổi ảnh vải"
                    >+</button>
                  </div>
                  <div className="w-full min-w-0">
                    {editingVT === v.maVT ? (
                      <div className="space-y-2">
                        <input 
                          type="text" 
                          className="w-full text-sm font-bold text-slate-800 p-1 border rounded"
                          value={editForm.tenVT || ''} 
                          onChange={(e) => setEditForm({...editForm, tenVT: e.target.value})}
                          placeholder="Tên vải"
                        />
                        <input 
                          type="text" 
                          className="w-full text-xs p-1 border rounded"
                          value={editForm.mauSac || ''} 
                          onChange={(e) => setEditForm({...editForm, mauSac: e.target.value})}
                          placeholder="Màu sắc"
                        />
                        <div className="flex items-center gap-1">
                          <label className="text-[10px] text-slate-500 whitespace-nowrap">Tồn kho (kg):</label>
                          <input 
                            type="number"
                            min={0}
                            className="w-full text-sm font-bold text-emerald-700 p-1 border border-emerald-300 rounded bg-emerald-50"
                            value={editForm.tonKho ?? v.tonKho} 
                            onChange={(e) => setEditForm({...editForm, tonKho: Number(e.target.value)})}
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 leading-tight truncate" title={v.tenVT}>{v.tenVT}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1.5 truncate">
                          <span className="w-3 h-3 rounded-full shadow-inner border border-slate-200 dark:border-slate-700" style={{ backgroundColor: getColorHex(v.mauSac) }}></span> 
                          {v.mauSac}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 gap-3 mb-4 bg-slate-50/80 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">Tồn kho (kg)</div>
                    <div className={`font-black text-xl ${getTonKhoColor(v.tonKho)}`}>{v.tonKho.toFixed(0)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">Quy đổi</div>
                    <div className="flex flex-col gap-1 mt-0.5">
                      <span className="text-sm font-black text-slate-700 dark:text-slate-200 bg-slate-200/60 dark:bg-slate-700/60 px-1.5 py-0.5 rounded shadow-sm border border-slate-200/50 dark:border-slate-700/50">≈ {(v.tonKho / 20).toFixed(1)} cây</span>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 pl-1.5">≈ {(v.tonKho * 2).toFixed(0)} m</span>
                    </div>
                  </div>
                </div>
                
                {/* Footer: Price and Action */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Đơn giá</div>
                    {editingVT === v.maVT ? (
                      <input 
                        type="number" 
                        className="w-20 text-sm font-bold text-slate-700 p-0.5 border rounded"
                        value={editForm.donGia || 0} 
                        onChange={(e) => setEditForm({...editForm, donGia: Number(e.target.value)})}
                      />
                    ) : (
                      <div className="font-bold text-slate-700 dark:text-slate-300">{v.donGia.toLocaleString()} ₫</div>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    {editingVT === v.maVT ? (
                      <>
                        <button 
                          onClick={async () => {
                            // Persist vào localStorage qua inventory-engine
                            updateVaiInfo(v.maVT, {
                              tenVT: editForm.tenVT ?? v.tenVT,
                              mauSac: editForm.mauSac ?? v.mauSac,
                              donGia: editForm.donGia ?? v.donGia,
                              tonKho: editForm.tonKho ?? v.tonKho,
                            });
                            const updated = getInventoryByMaVT(v.maVT);
                            if (!updated) {
                              toast.error("Không tìm thấy mã vải vừa cập nhật.");
                              return;
                            }
                            try {
                              await upsertInventoryItem(updated);
                            } catch (error) {
                              const message = error instanceof Error ? error.message : "Lỗi không xác định";
                              toast.error(`Chưa đồng bộ được lên Supabase: ${message}`);
                              return;
                            }
                            refresh(); // đọc lại từ localStorage
                            toast.success(`✅ Đã lưu: ${editForm.tenVT || v.tenVT} — tồn kho: ${editForm.tonKho ?? v.tonKho}kg`);
                            setEditingVT(null);
                          }} 
                          className="bg-green-500 hover:bg-green-600 text-white text-xs py-1.5 px-3 shadow-sm rounded-lg font-bold"
                        >
                          Lưu
                        </button>
                        <button 
                          onClick={() => setEditingVT(null)} 
                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs py-1.5 px-2 shadow-sm rounded-lg font-bold"
                        >
                          Huỷ
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => {
                            setEditForm(v);
                            setEditingVT(v.maVT);
                          }} 
                          className="bg-amber-400 hover:bg-amber-500 text-amber-950 text-xs py-1.5 px-3 shadow-sm font-bold rounded-lg"
                        >
                          Sửa
                        </button>
                        <button onClick={() => handleNhapKho(v.maVT)} className="btn-primary text-xs py-1.5 px-3 shadow-sm hover:shadow-md font-semibold rounded-lg">
                          + Nhập
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </>
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
              <table className="w-full text-sm">
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
            <table className="w-full text-sm">
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
                <table className="w-full text-sm">
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
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500">
                  <tr>
                    <th className="py-2 px-3 text-left">Mã Vải</th>
                    <th className="py-2 px-3 text-left">Tên Vải</th>
                    <th className="py-2 px-3 text-left">Màu</th>
                    <th className="py-2 px-3 text-right">Tồn (kg)</th>
                    <th className="py-2 px-3 text-right">Đơn giá</th>
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
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewVaiForm({ tenVT: LOAI_VAI_OPTIONS[0], mauSac: "", donGia: 0, ghiChu: "", previewImg: "" })}
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

                    setNewVaiForm({ tenVT: LOAI_VAI_OPTIONS[0], mauSac: "", donGia: 0, ghiChu: "", previewImg: "" });
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

      {/* Modal Nhập kho vải (chuẩn hoá theo form Kho Phụ liệu) */}
      {showNhap && (
        <VaiNhapKho
          maVT={showNhap}
          vatTu={inventory.find((item) => item.maVT === showNhap)}
          user={user}
          onClose={() => setShowNhap(null)}
          onSuccess={() => refresh()}
        />
      )}
      {previewImage && (
        <Portal>
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
            onClick={() => setPreviewImage(null)}
          >
            <button
              type="button"
              className="absolute right-5 top-5 rounded-full bg-white/15 p-2 text-white hover:bg-white/25"
              onClick={() => setPreviewImage(null)}
              aria-label="Đóng ảnh"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={previewImage.src}
              alt={previewImage.alt}
              className="max-h-[88vh] max-w-[94vw] rounded-2xl object-contain shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        </Portal>
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

// ============ MODAL NHẬP KHO VẢI (chuẩn hoá theo form Kho Phụ liệu) ============
function VaiNhapKho({
  maVT,
  vatTu,
  user,
  onClose,
  onSuccess,
}: {
  maVT: string;
  vatTu?: KhoVai;
  user: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const vt = vatTu || KHO_VAI.find((v) => v.maVT === maVT);
  const { list: nccList } = useNhaCungCap();
  const { themGiaoDich } = useKho();
  const [form, setForm] = useState({
    ngay: new Date().toISOString().split("T")[0],
    soLuong: 0,
    donGia: vt?.donGia ?? 0,
    nccMa: nccList[0]?.ma_ncc || "",
    nguoiThucHien: user?.name || user?.id || "NV kho",
    ghiChu: "",
  });

  if (!vt) return null;

  const thanhTien = form.soLuong * form.donGia;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.soLuong <= 0) {
      toast.error("Số lượng phải > 0");
      return;
    }
    const ncc = nccList.find((item) => item.ma_ncc === form.nccMa);
    if (!ncc) {
      toast.error("Vui lòng chọn nguồn nhập (NCC)");
      return;
    }
    const r = nhapKho(maVT, form.soLuong, user, form.ghiChu, {
      ngay: form.ngay,
      donGia: form.donGia,
      nguonNhap: ncc.ten_ncc,
      nguoiThucHien: form.nguoiThucHien,
    });
    if (r.ok) {
      const updated = getInventoryByMaVT(maVT);
      if (!updated) {
        toast.error("Không tìm thấy mã vải vừa nhập kho.");
        return;
      }
      try {
        await upsertInventoryItem(updated);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Lỗi không xác định";
        toast.error(`Đã lưu tạm trên máy này nhưng chưa đồng bộ Supabase: ${message}`);
        return;
      }
      const giaoDich = await themGiaoDich({
        ngay: form.ngay, loai: "NHAP", loaiKho: "vai", maVT: vt.maVT,
        tenVT: vt.tenVT, soLuong: form.soLuong, donVi: "kg", donGia: form.donGia,
        thanhTien, nguonNhap: ncc.ten_ncc, nguoiThucHien: form.nguoiThucHien,
        ghiChu: [form.ghiChu, `NCC: ${ncc.ma_ncc}`].filter(Boolean).join(" · "),
      });
      if (!giaoDich) {
        toast.error("Chưa lưu được giao dịch nhập vải lên Supabase nên công nợ NCC chưa được cộng");
        return;
      }
      toast.success(`✅ Đã cộng ${form.soLuong.toLocaleString()}kg vào tồn kho và ${formatVND(thanhTien)} công nợ ${ncc.ten_ncc}`);
      onSuccess();
      onClose();
    } else {
      toast.error(r.message);
    }
  };

  return (
    <Portal>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      >
        <div
          className="card max-w-md w-full p-6 animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Plus className="w-5 h-5 text-sky-600" />
              Nhập kho vải: {vt.tenVT}
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/40 dark:hover:bg-white/5 rounded"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Thông tin VT (read-only) */}
          <div className="bg-sky-500/10 dark:bg-sky-500/20 rounded p-2 mb-3 text-xs flex flex-wrap items-center gap-x-3 gap-y-1">
            <span><span className="opacity-70">Mã:</span> <b className="font-mono">{vt.maVT}</b></span>
            <span><span className="opacity-70">ĐVT:</span> <b>kg</b></span>
            <span><span className="opacity-70">Loại:</span> <b>{vt.loai || "—"}</b></span>
            <span><span className="opacity-70">Màu:</span> <b>{vt.mauSac || "—"}</b></span>
            <span><span className="opacity-70">Tồn hiện tại:</span> <b className="text-sky-700">{vt.tonKho.toFixed(0)} kg</b></span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium block mb-1">Ngày nhập *</label>
                <input
                  type="date"
                  required
                  className="input w-full"
                  value={form.ngay}
                  onChange={(e) => setForm({ ...form, ngay: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Số lượng (kg) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  step="0.1"
                  className="input w-full"
                  value={form.soLuong || ""}
                  onChange={(e) => setForm({ ...form, soLuong: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium block mb-1">Đơn giá (đ/kg) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  className="input w-full"
                  value={form.donGia}
                  onChange={(e) => setForm({ ...form, donGia: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Thành tiền</label>
                <div className="input w-full bg-emerald-500/10 text-emerald-700 font-bold flex items-center">
                  {formatVND(thanhTien)}
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium block mb-1">
                Nguồn nhập (NCC) *{" "}
                {nccList.length === 0 && (
                  <span className="text-rose-600 font-normal">— chưa có NCC "Đang hợp tác"</span>
                )}
              </label>
              <select
                required
                className="input w-full"
                value={form.nccMa}
                onChange={(e) => setForm({ ...form, nccMa: e.target.value })}
              >
                <option value="">-- Chọn NCC --</option>
                {nccList.map((n) => (
                  <option key={n.ma_ncc} value={n.ma_ncc}>
                    {n.ma_ncc} — {n.ten_ncc} (nợ {(n.cong_no || 0).toLocaleString()}đ)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium block mb-1">Người thực hiện</label>
              <input
                className="input w-full"
                value={form.nguoiThucHien}
                onChange={(e) => setForm({ ...form, nguoiThucHien: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-medium block mb-1">Ghi chú</label>
              <textarea
                className="input w-full min-h-[60px]"
                value={form.ghiChu}
                onChange={(e) => setForm({ ...form, ghiChu: e.target.value })}
                placeholder="VD: Nhập lô đầu tháng 8, chất lượng OK, đã kiểm tra mẫu..."
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1"
              >
                Huỷ
              </button>
              <button
                type="submit"
                className="btn-primary flex-1 bg-sky-500 hover:bg-sky-600"
              >
                Xác nhận nhập kho
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
