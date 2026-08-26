// ============ CHI TIẾT BIẾN THỂ (theo màu) ============
// Xem size/số lượng, thêm nhiều ảnh + video, nhập giá bán lẻ/sỉ cho 1 màu.

import { useRef, useState } from "react";
import { X, Camera, Video, Trash2, Save, Box, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { SanPhamTP } from "../data";
import { uploadProductFile } from "@/lib/product-upload";

interface Props {
  sp: SanPhamTP;
  onClose: () => void;
  onSave: (updated: SanPhamTP) => void;
}

export function VariantDetailModal({ sp, onClose, onSave }: Props) {
  const [hinhAnh, setHinhAnh] = useState<string[]>(sp.hinhAnh || []);
  const [video, setVideo] = useState<string | undefined>(sp.video);
  const [giaBanLe, setGiaBanLe] = useState(sp.giaBanLe || 0);
  const [giaBanSi, setGiaBanSi] = useState(sp.giaBanSi || 0);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);

  const handleAddImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const urls = await Promise.all(files.map(f => uploadProductFile(f, "kho-tp")));
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
    onSave({ ...sp, hinhAnh, video, giaBanLe, giaBanSi });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h2 className="text-lg font-black text-slate-800">Chi tiết màu: <span className="text-emerald-600">{sp.mau}</span></h2>
            <div className="text-sm font-bold text-slate-500 mt-1">{sp.maSP} · {sp.tenSP} · LSX: {sp.lsx}</div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Size + số lượng */}
          <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5" /> Số lượng theo size
            </div>
            {sp.chiTietSize && sp.chiTietSize.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {sp.chiTietSize.map((s, i) => (
                  <div key={i} className="flex flex-col items-center bg-white border border-slate-200 rounded-lg p-2 w-16 shadow-sm">
                    <span className="text-xs font-black text-slate-600">{s.size}</span>
                    <span className="text-sm font-bold text-emerald-600">{s.sl}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500">Tổng: <span className="font-bold text-slate-800">{sp.soLuong.toLocaleString()}</span> sản phẩm</div>
            )}
          </div>

          {/* Ảnh + Video cùng hàng */}
          <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 flex gap-5">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5">Hình ảnh ({hinhAnh.length})</div>
              <div className="flex flex-wrap gap-3">
                {hinhAnh.map((img, i) => (
                  <div key={i} className="relative w-40 h-40 rounded-xl overflow-hidden border border-slate-200 group shadow-sm">
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
                  {uploading ? <Loader2 className="w-8 h-8 mb-2 animate-spin" /> : <Camera className="w-8 h-8 mb-2" />}
                  <span className="text-xs font-bold">{uploading ? "Đang tải..." : "Thêm ảnh"}</span>
                </button>
                <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAddImages} />
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
                  {uploading ? <Loader2 className="w-8 h-8 mb-2 animate-spin" /> : <Video className="w-8 h-8 mb-2" />}
                  <span className="text-xs font-bold">{uploading ? "Đang tải..." : "Thêm video"}</span>
                </button>
              )}
              <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleAddVideo} />
            </div>
          </div>

          {/* Giá */}
          <div className="grid grid-cols-2 gap-4">
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
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors">
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
  );
}
