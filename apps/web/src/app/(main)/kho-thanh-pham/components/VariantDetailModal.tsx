// ============ CHI TIẾT BIẾN THỂ (theo màu) ============
// Xem & sửa số lượng chi tiết từng size, thêm nhiều ảnh + video, nhập giá bán lẻ/sỉ cho 1 màu.

import { useRef, useState } from "react";
import { X, Camera, Video, Trash2, Save, Box, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { layMaLoTonKho, type SanPhamTP } from "../data";
import { uploadProductFile } from "@/lib/product-upload";

interface Props {
  sp: SanPhamTP;
  onClose: () => void;
  onSave: (updated: SanPhamTP) => void;
  onDelete?: (id: string) => void;
}

export function VariantDetailModal({ sp, onClose, onSave, onDelete }: Props) {
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
          {/* Size + số lượng tồn kho (Cho phép chỉnh sửa chi tiết) */}
          <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Box className="w-4 h-4 text-emerald-600" /> SỐ LƯỢNG TỒN KHO THEO SIZE
              </div>
              <div className="text-xs font-black bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-300 shadow-xs">
                Tổng tồn màu: <span className="text-emerald-950 text-sm font-extrabold">{tongSL.toLocaleString()}</span> SP
              </div>
            </div>

            {/* Danh sách các ô nhập size */}
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
                      setChiTietSize((prev) =>
                        prev.map((s, i) => (i === idx ? { ...s, sl: val } : s))
                      );
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
