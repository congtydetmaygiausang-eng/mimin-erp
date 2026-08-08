import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Save, Plus, Trash2, Package } from "lucide-react";
import { toast } from "sonner";
import { type LoaiSP, type SanPham } from "@/lib/data/danh-muc-sp-store";
import { LOAI_SP_LABELS } from "@/lib/data/lenh-cat-store";
import { SIZE_RATIO_PRESETS } from "@/lib/size-ratio-presets";

interface ProductFormModalProps {
  onClose: () => void;
  onSave: (sp: Partial<SanPham>) => void;
  initialData?: SanPham;
}

export default function ProductFormModal({ onClose, onSave, initialData }: ProductFormModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [maSP, setMaSP] = useState(initialData?.id || "");
  const [tenSP, setTenSP] = useState(initialData?.tenSP || "");
  const [loaiSP, setLoaiSP] = useState<LoaiSP>(initialData?.loaiSP || "BoTru");
  const [tiLeSize, setTiLeSize] = useState(initialData?.bangSize?.ratios.join(":") || "1:2:2:2:1");
  const [dsMau, setDsMau] = useState<{ ten: string; maSKU: string; dinhMuc: number; img: string; video?: string }[]>(
    initialData?.dsMau?.map(m => ({
      ten: m.ten,
      maSKU: m.maSKU || "",
      dinhMuc: m.dinhMuc || 0.25,
      img: m.img || "",
      video: m.video || ""
    })) || [
      { ten: "Đen", maSKU: "", dinhMuc: 0.25, img: "", video: "" },
    ]
  );

  const handleSave = () => {
    if (!maSP || !tenSP) {
      toast.error("Vui lòng nhập Mã SP và Tên SP!");
      return;
    }
    
    // Add default bangSize based on tiLeSize
    const ratios = tiLeSize.split(":").map(Number);
    const bangSize = {
      sizes: ["M", "L", "XL", "2XL", "3XL"].slice(0, ratios.length),
      ratios: ratios,
      riSo: ratios.reduce((a, b) => a + b, 0)
    };

    const newProduct: Partial<SanPham> = {
      ...(initialData || {}),
      id: maSP.toUpperCase(),
      tenSP,
      loaiSP,
      tiLeSize,
      dsMau: dsMau.map(m => ({
        ten: m.ten,
        maSKU: m.maSKU || `${maSP}-${m.ten.toUpperCase()}`,
        dinhMuc: m.dinhMuc,
        img: m.img || "",
        video: m.video || ""
      })),
      hinhAnh: dsMau[0]?.img || "",
      bangSize,
      giaBanDuKien: 0,
      giaVonDuKien: 0,
      trangThai: "con-hang",
      ngayTao: new Date().toISOString().substring(0, 10),
      ghiChu: "Tạo mới từ form"
    };

    onSave(newProduct);
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-start justify-center p-4 pt-16 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col animate-slide-up my-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 bg-[#2B4C3E] text-white flex justify-between items-center rounded-t-2xl">
          <h2 className="text-xl font-bold flex items-center gap-2"><Package className="w-5 h-5"/> TẠO SẢN PHẨM MỚI</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X className="w-6 h-6" /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5 bg-slate-50">
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-sm mb-2 shadow-sm">
            <strong>Lưu ý:</strong> Đây là các trường dữ liệu bắt buộc để có thể liên kết tự động khi tạo Lệnh Cắt (KHSX).
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Mã Sản Phẩm *</label>
              <input 
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 uppercase font-mono font-bold" 
                placeholder="VD: M024"
                value={maSP} onChange={e => setMaSP(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Tên Sản Phẩm *</label>
              <input 
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500" 
                placeholder="VD: Bộ Trụ Phối Lé"
                value={tenSP} onChange={e => setTenSP(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Loại Sản Phẩm *</label>
              <select 
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 bg-white"
                value={loaiSP} onChange={e => setLoaiSP(e.target.value as LoaiSP)}
              >
                {Object.entries(LOAI_SP_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Tỉ lệ Size (M:L:XL:2XL:3XL) *</label>
              <select 
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 bg-white"
                value={tiLeSize} onChange={e => setTiLeSize(e.target.value)}
              >
                {SIZE_RATIO_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mt-2">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-bold text-slate-700">Màu sắc tiêu chuẩn & Định mức vải</label>
              <button 
                onClick={() => setDsMau([...dsMau, { ten: "", maSKU: "", dinhMuc: 0.25, img: "", video: "" }])}
                className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold hover:bg-emerald-200 flex items-center gap-1"
              >
                <Plus className="w-3 h-3"/> Thêm màu
              </button>
            </div>
            
            <div className="flex flex-col gap-4">
              {dsMau.map((m, i) => (
                <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex gap-6 items-start relative shadow-sm">
                  {/* Media Area (Left side) */}
                  <div className="w-2/5 shrink-0 flex items-end gap-2">
                    {/* Image Upload */}
                    <div className="w-24 aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg bg-white relative overflow-hidden group shadow-sm">
                      {m.img ? (
                        <img src={m.img} alt={m.ten} className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
                      ) : (
                        <div className="text-center text-slate-400">
                          <Plus className="w-5 h-5 mx-auto mb-1 text-slate-300" />
                          <span className="text-[9px] font-bold uppercase">Ảnh</span>
                        </div>
                      )}
                      <input 
                        type="file" 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                        accept="image/*" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              const n = [...dsMau]; n[i].img = ev.target?.result as string; setDsMau(n);
                            };
                            reader.readAsDataURL(file);
                          }
                        }} 
                      />
                    </div>
                    {/* Video Upload */}
                    <div className="w-[5.25rem] aspect-[9/16] flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 relative overflow-hidden group shadow-sm">
                      {m.video ? (
                        <video src={m.video} className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
                      ) : (
                        <div className="text-center text-slate-400">
                          <Plus className="w-5 h-5 mx-auto mb-1 text-slate-300" />
                          <span className="text-[9px] font-bold uppercase text-center leading-tight">Video<br/>(Dọc)</span>
                        </div>
                      )}
                      <input 
                        type="file" 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                        accept="video/*" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                             const url = URL.createObjectURL(file);
                             const n = [...dsMau]; n[i].video = url; setDsMau(n);
                          }
                        }} 
                      />
                      {m.video && (
                         <div className="absolute top-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded shadow">Video</div>
                      )}
                    </div>
                  </div>
                  
                  {/* Inputs (Right side) */}
                  <div className="w-3/5 flex flex-col gap-3 py-1">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Tên màu</label>
                      <input 
                        className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-emerald-500" 
                        placeholder="VD: Đen"
                        value={m.ten} onChange={e => { const n = [...dsMau]; n[i].ten = e.target.value; setDsMau(n); }}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Mã SKU Biến thể</label>
                      <input 
                        className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm font-bold text-emerald-700 uppercase focus:ring-2 focus:ring-emerald-500" 
                        placeholder="VD: M024-DEN"
                        value={m.maSKU} onChange={e => { const n = [...dsMau]; n[i].maSKU = e.target.value.toUpperCase(); setDsMau(n); }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Định mức vải (kg/sp)</label>
                        <input 
                          className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-emerald-500" 
                          placeholder="VD: 0.25" type="number" step="0.01"
                          value={m.dinhMuc || ""} onChange={e => { const n = [...dsMau]; n[i].dinhMuc = parseFloat(e.target.value) || 0; setDsMau(n); }}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Định mức bo (kg/sp)</label>
                        <input 
                          className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-emerald-500" 
                          placeholder="VD: 0.05" type="number" step="0.01"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {dsMau.length > 1 && (
                    <button 
                      onClick={() => setDsMau(dsMau.filter((_, idx) => idx !== i))} 
                      className="absolute top-2 right-2 p-1.5 text-rose-500 hover:bg-rose-100 rounded-full transition-colors"
                      title="Xóa màu này"
                    >
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

        <div className="p-4 border-t border-slate-200 bg-white flex justify-end gap-3 rounded-b-2xl">
          <button onClick={onClose} className="px-5 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Hủy</button>
          <button onClick={handleSave} className="px-5 py-2 font-bold text-white bg-[#2B4C3E] hover:bg-[#2B4C3E]/90 rounded-lg flex items-center gap-2 shadow-md">
            <Save className="w-4 h-4" /> Lưu Sản Phẩm
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
