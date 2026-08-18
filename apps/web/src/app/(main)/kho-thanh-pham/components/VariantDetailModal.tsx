// ============ CHI TIẾT BIẾN THỂ (theo màu) ============
// Xem size/số lượng, thêm nhiều ảnh + video, nhập giá bán lẻ/sỉ cho 1 màu.

import { useRef, useState } from "react";
import { X, Camera, Video, Trash2, Save, Box } from "lucide-react";
import type { SanPhamTP } from "../data";

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

  const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => setHinhAnh((prev) => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const handleAddVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setVideo(ev.target?.result as string);
    reader.readAsDataURL(file);
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

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Size + số lượng */}
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5" /> Số lượng theo size
            </div>
            {sp.chiTietSize && sp.chiTietSize.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {sp.chiTietSize.map((s, i) => (
                  <div key={i} className="flex flex-col items-center bg-slate-50 border border-slate-200 rounded-lg p-2 w-16">
                    <span className="text-xs font-black text-slate-600">{s.size}</span>
                    <span className="text-sm font-bold text-emerald-600">{s.sl}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500">Tổng: <span className="font-bold text-slate-800">{sp.soLuong.toLocaleString()}</span> sản phẩm</div>
            )}
          </div>

          {/* Ảnh */}
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Hình ảnh ({hinhAnh.length})</div>
            <div className="flex flex-wrap gap-3">
              {hinhAnh.map((img, i) => (
                <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 group">
                  <img src={img} className="w-full h-full object-cover" alt="" />
                  <button
                    onClick={() => setHinhAnh((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-rose-600 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => imageInputRef.current?.click()}
                className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-400 flex flex-col items-center justify-center text-slate-400 hover:text-emerald-500 transition-colors"
              >
                <Camera className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-bold">Thêm ảnh</span>
              </button>
              <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAddImages} />
            </div>
          </div>

          {/* Video */}
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Video</div>
            {video ? (
              <div className="relative w-40 rounded-xl overflow-hidden border border-slate-200 group">
                <video src={video} className="w-full aspect-[9/16] object-cover bg-black" controls playsInline />
                <button
                  onClick={() => setVideo(undefined)}
                  className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-rose-600 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => videoInputRef.current?.click()}
                className="w-40 aspect-[9/16] rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-400 flex flex-col items-center justify-center text-slate-400 hover:text-emerald-500 transition-colors"
              >
                <Video className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-bold">Thêm video</span>
              </button>
            )}
            <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleAddVideo} />
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
