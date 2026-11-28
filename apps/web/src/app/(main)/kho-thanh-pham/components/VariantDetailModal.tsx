// ============ CHI TIẾT BIẾN THỂ (theo màu) ============
// Xem & sửa số lượng chi tiết từng size, thêm nhiều ảnh + video, nhập giá bán lẻ/sỉ cho 1 màu.

import { useRef, useState, useMemo } from "react";
import { X, Camera, Video, Trash2, Save, Box, Loader2, Plus, Package, Layers, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { layMaLoTonKho, type SanPhamTP } from "../data";
import { uploadProductFile } from "@/lib/product-upload";

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function rutGonTiLe(ratios: number[]): number[] {
  if (ratios.length === 0) return [];
  const positive = ratios.filter((x) => x > 0);
  if (positive.length === 0) return ratios.map(() => 1);
  const common = positive.reduce((acc, v) => gcd(acc, v), positive[0]);
  if (common > 1) {
    return ratios.map((x) => Math.round(x / common));
  }
  return ratios;
}

function parseRatios(str: string, length: number): number[] {
  if (!str) return Array(length).fill(1);
  const parts = str.split(/[:,-]+/).map((p) => parseInt(p.trim(), 10) || 1);
  return Array.from({ length }, (_, i) => parts[i] || 1);
}

interface Props {
  sp: SanPhamTP;
  onClose: () => void;
  onSave: (updated: SanPhamTP) => void;
  onDelete?: (id: string) => void;
  tiLeSizeDefault?: string;
}

export function VariantDetailModal({ sp, onClose, onSave, onDelete, tiLeSizeDefault }: Props) {
  const [hinhAnh, setHinhAnh] = useState<string[]>(sp.hinhAnh || []);
  const [video, setVideo] = useState<string | undefined>(sp.video);
  const [giaBanLe, setGiaBanLe] = useState(sp.giaBanLe || 0);
  const [giaBanSi, setGiaBanSi] = useState(sp.giaBanSi || 0);
  const [maSKU, setMaSKU] = useState(sp.maSKU || "");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);

  // Khởi tạo chi tiết size cho phép chỉnh sửa
  const parseInitialSizes = (): Array<{ size: string; sl: number }> => {
    if (sp.chiTietSize && sp.chiTietSize.length > 0) {
      return sp.chiTietSize.map((s) => ({
        size: String(s.size || "").trim(),
        sl: Math.max(0, Number(s.sl) || 0),
      }));
    }
    const raw = (sp.size || "").trim();
    if (raw) {
      const parts = raw.split(/[,;\n]+/).map((p) => p.trim()).filter(Boolean);
      const parsed = parts.map((p) => {
        const colonMatch = p.match(/^([^:]+):\s*(\d+)$/);
        if (colonMatch) {
          return { size: colonMatch[1].trim(), sl: Math.max(0, parseInt(colonMatch[2], 10) || 0) };
        }
        return { size: p, sl: 0 };
      });
      if (parsed.length > 0) {
        const sumSl = parsed.reduce((acc, x) => acc + x.sl, 0);
        if (sumSl === 0 && (sp.soLuong || 0) > 0) {
          let conLai = sp.soLuong;
          return parsed.map((x, idx) => {
            if (idx === parsed.length - 1) return { ...x, sl: conLai };
            const chia = Math.floor(sp.soLuong / parsed.length);
            conLai -= chia;
            return { ...x, sl: Math.max(0, chia) };
          });
        }
        return parsed;
      }
    }
    // Mặc định chuẩn 4 size
    const defaultSizes = ["L", "XL", "2XL", "3XL"];
    const sumSl = Math.max(0, sp.soLuong || 0);
    let conLai = sumSl;
    return defaultSizes.map((sz, idx) => {
      if (idx === defaultSizes.length - 1) return { size: sz, sl: conLai };
      const chia = Math.floor(sumSl / defaultSizes.length);
      conLai -= chia;
      return { size: sz, sl: Math.max(0, chia) };
    });
  };

  const [chiTietSize, setChiTietSize] = useState<Array<{ size: string; sl: number }>>(parseInitialSizes);
  const [showAddSize, setShowAddSize] = useState(false);
  const [newSizeName, setNewSizeName] = useState("");

  const tongSL = chiTietSize.reduce((sum, item) => sum + (Number(item.sl) || 0), 0);

  // Khởi tạo tỷ lệ size: ưu tiên tiLeSizeDefault/sp.tiLeSize hoặc rút gọn từ số lượng hiện có
  const getInitialTiLe = (): string => {
    if (tiLeSizeDefault && tiLeSizeDefault.includes(":")) {
      const parts = tiLeSizeDefault.split(/[:,-]+/).map((p) => p.trim()).filter(Boolean);
      if (parts.length === chiTietSize.length) return parts.join(":");
    }
    if (sp.tiLeSize && sp.tiLeSize.includes(":")) {
      const parts = sp.tiLeSize.split(/[:,-]+/).map((p) => p.trim()).filter(Boolean);
      if (parts.length === chiTietSize.length) return parts.join(":");
    }
    const nonZero = chiTietSize.filter((s) => s.sl > 0);
    if (nonZero.length > 0 && chiTietSize.every((s) => s.sl >= 0)) {
      const sls = chiTietSize.map((s) => s.sl);
      const reduced = rutGonTiLe(sls);
      if (reduced.some((r) => r > 0)) {
        return reduced.map((r) => r || 1).join(":");
      }
    }
    return chiTietSize.map(() => "1").join(":");
  };

  const [tiLeSizeStr, setTiLeSizeStr] = useState<string>(getInitialTiLe);

  // Danh sách preset tỷ lệ nhanh theo số lượng size
  const presets = useMemo(() => {
    const n = chiTietSize.length;
    if (n === 4) {
      return [
        { label: "1:1:1:1 (Đều)", value: "1:1:1:1" },
        { label: "1:2:2:1", value: "1:2:2:1" },
        { label: "2:2:1:1", value: "2:2:1:1" },
        { label: "1:1:2:2", value: "1:1:2:2" },
        { label: "2:2:2:2", value: "2:2:2:2" },
      ];
    }
    if (n === 5) {
      return [
        { label: "1:1:1:1:1 (Đều)", value: "1:1:1:1:1" },
        { label: "1:2:2:2:1", value: "1:2:2:2:1" },
        { label: "1:2:3:2:1", value: "1:2:3:2:1" },
      ];
    }
    return [
      { label: `Đều (${Array(n).fill(1).join(":")})`, value: Array(n).fill(1).join(":") },
    ];
  }, [chiTietSize.length]);

  // Khi nhập Tổng số lượng tồn kho -> Tự động chia theo tỷ lệ size vào các size bên dưới
  const handleTotalStockChange = (newTotal: number) => {
    const total = Math.max(0, newTotal);
    const ratios = parseRatios(tiLeSizeStr, chiTietSize.length);
    const sumRatio = ratios.reduce((a, b) => a + b, 0) || 1;

    let allocated = 0;
    const updated = chiTietSize.map((s, idx) => {
      if (idx === chiTietSize.length - 1) {
        return { ...s, sl: Math.max(0, total - allocated) };
      }
      const sl = Math.round((total * ratios[idx]) / sumRatio);
      allocated += sl;
      return { ...s, sl: Math.max(0, sl) };
    });
    setChiTietSize(updated);
  };

  // Khi bấm đổi tỷ lệ size hoặc chọn preset -> Chia lại tổng số lượng theo tỷ lệ mới
  const handleApplyRatio = (newRatio: string) => {
    setTiLeSizeStr(newRatio);
    const ratios = parseRatios(newRatio, chiTietSize.length);
    const sumRatio = ratios.reduce((a, b) => a + b, 0) || 1;

    let allocated = 0;
    const updated = chiTietSize.map((s, idx) => {
      if (idx === chiTietSize.length - 1) {
        return { ...s, sl: Math.max(0, tongSL - allocated) };
      }
      const sl = Math.round((tongSL * ratios[idx]) / sumRatio);
      allocated += sl;
      return { ...s, sl: Math.max(0, sl) };
    });
    setChiTietSize(updated);
  };

  // Khi chỉnh lẻ từng size -> Ô tổng tự động cộng lại, tính lại tỷ lệ rút gọn nếu cần
  const handleIndividualSizeChange = (idx: number, val: number) => {
    const updated = chiTietSize.map((s, i) => (i === idx ? { ...s, sl: val } : s));
    setChiTietSize(updated);

    if (updated.every((s) => s.sl > 0)) {
      const reduced = rutGonTiLe(updated.map((s) => s.sl));
      setTiLeSizeStr(reduced.join(":"));
    }
  };

  const handleAddImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const urls = await Promise.all(files.map((f) => uploadProductFile(f, "kho-tp")));
      setHinhAnh((prev) => [...prev, ...urls]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không upload được ảnh");
    } finally {
      setUploading(false);
    }
    e.target.value = "";
  };

  const handleAddVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadProductFile(file, "kho-tp");
      setVideo(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không upload được video");
    } finally {
      setUploading(false);
    }
    e.target.value = "";
  };

  const handleSave = () => {
    const cleanSizes = chiTietSize
      .map((s) => ({
        size: s.size.trim(),
        sl: Math.max(0, Number(s.sl) || 0),
      }))
      .filter((s) => s.size.length > 0);

    const tongMoi = cleanSizes.reduce((sum, item) => sum + item.sl, 0);
    const newTrangThai = tongMoi === 0 ? "xuat-kho" : "con";
    const sizeStr = cleanSizes.map((s) => `${s.size}: ${s.sl}`).join(", ");

    onSave({
      ...sp,
      chiTietSize: cleanSizes,
      soLuong: tongMoi,
      trangThai: newTrangThai,
      size: sizeStr,
      tiLeSize: tiLeSizeStr.trim() || undefined,
      hinhAnh,
      video,
      giaBanLe,
      giaBanSi,
      maSKU: maSKU.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h2 className="text-lg font-black text-slate-800">
              Chi tiết màu: <span className="text-emerald-600">{sp.mau}</span>
            </h2>
            <div className="text-sm font-bold text-slate-500 mt-1">
              {sp.maSP} · {sp.tenSP} · Lô tồn kho: {layMaLoTonKho(sp)}
              {sp.maLenhCat ? ` · Nguồn: ${sp.maLenhCat}` : " · Nhập trực tiếp"}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* SỐ LƯỢNG TỒN KHO & TỶ LỆ SIZE (Tự động chia theo tỷ lệ size) */}
          <div className="bg-gradient-to-br from-emerald-50/50 via-slate-50 to-teal-50/30 rounded-2xl border-2 border-emerald-200/80 p-4 space-y-4 shadow-xs">
            {/* 1. Ô NHẬP TỔNG SỐ LƯỢNG TỒN KHO NỔI BẬT */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-emerald-200 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    TỔNG SỐ LƯỢNG TỒN KHO
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Tự chia size</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Nhập số lượng tổng sẽ tự động chia theo tỷ lệ size vào các size bên dưới
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={tongSL === 0 ? "0" : tongSL || ""}
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                      handleTotalStockChange(val);
                    }}
                    onFocus={(e) => e.target.select()}
                    placeholder="0"
                    className="w-36 text-right pr-11 pl-3 py-2 text-xl font-black text-emerald-700 bg-emerald-50/60 border-2 border-emerald-400 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 transition-all shadow-inner"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-emerald-700 pointer-events-none">
                    SP
                  </span>
                </div>
              </div>
            </div>

            {/* 2. ĐIỀU KHIỂN TỶ LỆ CHIA SIZE */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-white/80 p-2.5 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-600 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" /> Tỷ lệ size:
                </span>
                <input
                  type="text"
                  value={tiLeSizeStr}
                  onChange={(e) => handleApplyRatio(e.target.value)}
                  placeholder="1:1:1:1"
                  className="w-24 px-2 py-1 text-xs font-black text-center text-emerald-800 bg-emerald-50/80 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  title="Nhập chuỗi tỷ lệ (VD: 1:1:1:1 hoặc 1:2:2:1)"
                />
              </div>

              {/* Nút chọn nhanh preset */}
              <div className="flex flex-wrap items-center gap-1.5 ml-auto">
                <span className="text-[11px] font-semibold text-slate-400">Chọn tỷ lệ:</span>
                {presets.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => handleApplyRatio(preset.value)}
                    className={`px-2 py-1 text-[11px] font-black rounded-lg border transition-all ${
                      tiLeSizeStr === preset.value
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-white text-slate-600 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/60"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. DANH SÁCH CÁC Ô NHẬP SIZE CHI TIẾT */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase px-1">
                <span>Chi tiết số lượng từng size (có thể chỉnh lẻ):</span>
                <span className="text-emerald-700 font-black">
                  Tổng: {tongSL.toLocaleString()} SP
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                {chiTietSize.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white border-2 border-slate-200 hover:border-emerald-400 focus-within:border-emerald-500 rounded-xl p-2.5 flex flex-col items-center relative group transition-all shadow-xs"
                  >
                    <button
                      type="button"
                      onClick={() => setChiTietSize((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      title={`Xóa size ${item.size}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wide mb-1">
                      {item.size}
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={item.sl === 0 ? "0" : item.sl || ""}
                      onChange={(e) => {
                        const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                        handleIndividualSizeChange(idx, val);
                      }}
                      onFocus={(e) => e.target.select()}
                      className="w-full text-center py-1 text-sm font-black text-emerald-600 bg-emerald-50/50 rounded-lg border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                ))}

                {/* Nút thêm size */}
                <button
                  type="button"
                  onClick={() => setShowAddSize(true)}
                  className="border-2 border-dashed border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/30 text-slate-500 hover:text-emerald-600 rounded-xl p-2.5 flex flex-col items-center justify-center gap-1 transition-all text-xs font-bold min-h-[64px]"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Thêm size</span>
                </button>
              </div>
            </div>

            {/* Quick add size toolbar */}
            {showAddSize && (
              <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Chọn nhanh:</span>
                {["S", "M", "L", "XL", "2XL", "3XL", "4XL", "Freesize"].map((quickSize) => {
                  const alreadyHas = chiTietSize.some((s) => s.size.toLowerCase() === quickSize.toLowerCase());
                  if (alreadyHas) return null;
                  return (
                    <button
                      key={quickSize}
                      type="button"
                      onClick={() => {
                        setChiTietSize((prev) => [...prev, { size: quickSize, sl: 0 }]);
                      }}
                      className="px-2.5 py-1 text-xs font-bold bg-white border border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700 rounded-lg transition-colors"
                    >
                      +{quickSize}
                    </button>
                  );
                })}
                <div className="flex items-center gap-1 ml-auto">
                  <input
                    type="text"
                    value={newSizeName}
                    onChange={(e) => setNewSizeName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newSizeName.trim()) {
                        e.preventDefault();
                        const sz = newSizeName.trim();
                        if (!chiTietSize.some((s) => s.size.toLowerCase() === sz.toLowerCase())) {
                          setChiTietSize((prev) => [...prev, { size: sz, sl: 0 }]);
                        }
                        setNewSizeName("");
                      }
                    }}
                    placeholder="Size khác..."
                    className="w-24 px-2 py-1 text-xs font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const sz = newSizeName.trim();
                      if (sz && !chiTietSize.some((s) => s.size.toLowerCase() === sz.toLowerCase())) {
                        setChiTietSize((prev) => [...prev, { size: sz, sl: 0 }]);
                      }
                      setNewSizeName("");
                    }}
                    className="px-2.5 py-1 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                  >
                    Thêm
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddSize(false)}
                    className="text-xs text-slate-400 hover:text-slate-600 p-1"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Ảnh + Video cùng hàng */}
          <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 flex gap-5">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5">
                Hình ảnh ({hinhAnh.length})
              </div>
              <div className="flex flex-wrap gap-3">
                {hinhAnh.map((img, i) => (
                  <div
                    key={i}
                    className="relative w-40 h-40 rounded-xl overflow-hidden border border-slate-200 group shadow-sm"
                  >
                    <img src={img} className="w-full h-full object-cover" alt="" />
                    <button
                      onClick={() => setHinhAnh((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-rose-600 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploading}
                  className="w-40 h-40 rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-400 flex flex-col items-center justify-center text-slate-400 hover:text-emerald-500 transition-colors bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <Loader2 className="w-8 h-8 mb-2 animate-spin" />
                  ) : (
                    <Camera className="w-8 h-8 mb-2" />
                  )}
                  <span className="text-xs font-bold">{uploading ? "Đang tải..." : "Thêm ảnh"}</span>
                </button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleAddImages}
                />
              </div>
            </div>

            <div className="w-40 shrink-0">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5">Video</div>
              {video ? (
                <div className="relative w-40 rounded-xl overflow-hidden border border-slate-200 group shadow-sm">
                  <video src={video} className="w-full aspect-[9/16] object-cover bg-black" controls playsInline />
                  <button
                    onClick={() => setVideo(undefined)}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-rose-600 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => videoInputRef.current?.click()}
                  disabled={uploading}
                  className="w-40 aspect-[9/16] rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-400 flex flex-col items-center justify-center text-slate-400 hover:text-emerald-500 transition-colors bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <Loader2 className="w-8 h-8 mb-2 animate-spin" />
                  ) : (
                    <Video className="w-8 h-8 mb-2" />
                  )}
                  <span className="text-xs font-bold">{uploading ? "Đang tải..." : "Thêm video"}</span>
                </button>
              )}
              <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleAddVideo} />
            </div>
          </div>

          {/* Giá & SKU */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Mã SKU Phân Loại</label>
              <input
                type="text"
                value={maSKU}
                onChange={(e) => setMaSKU(e.target.value)}
                placeholder="VD: BPJ-289"
                className="w-full px-3 py-2.5 border border-slate-200 bg-white rounded-lg text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400/50"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Giá bán lẻ</label>
              <input
                type="number"
                value={giaBanLe || ""}
                onChange={(e) => setGiaBanLe(Number(e.target.value))}
                onFocus={(e) => e.target.select()}
                placeholder="VD: 185000"
                className="w-full px-3 py-2.5 border border-emerald-300 bg-emerald-50/30 rounded-lg text-sm font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Giá bán sỉ</label>
              <input
                type="number"
                value={giaBanSi || ""}
                onChange={(e) => setGiaBanSi(Number(e.target.value))}
                onFocus={(e) => e.target.select()}
                placeholder="VD: 150000"
                className="w-full px-3 py-2.5 border border-sky-300 bg-sky-50/30 rounded-lg text-sm font-bold text-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-400/50"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          {onDelete ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onDelete(sp.id);
              }}
              className="px-4 py-2.5 rounded-xl font-bold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 flex items-center gap-1.5 transition-colors text-sm"
              title="Xóa biến thể này"
            >
              <Trash2 className="w-4 h-4" /> Xóa biến thể
            </button>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl font-bold text-white bg-emerald-500 hover:bg-emerald-600 flex items-center gap-2 transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" /> Lưu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
