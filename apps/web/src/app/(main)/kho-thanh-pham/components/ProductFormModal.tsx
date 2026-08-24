// ============ PRODUCT FORM MODAL (Add/Edit) ============
// Tach tu page.tsx (2026-08-05 - toi uu B.2)

import { useState, useRef } from "react";
import { Camera, Save } from "lucide-react";
import { DS_TI_LE_SIZE, DS_KHU_KE_HANG, ALL_PHIEU, type SanPhamTP } from "../data";
import { SIZE_RATIO_PRESETS } from "@/lib/size-ratio-presets";

export function ProductFormModal({ sp, initialImage, onClose, onSave }: { sp?: SanPhamTP; initialImage?: string; onClose: () => void; onSave: (data: any) => void }) {
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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const r = new FileReader();
      r.onload = ev => setImage(ev.target?.result as string);
      r.readAsDataURL(file);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3" 
      onClick={onClose}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => e.preventDefault()}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 flex items-center justify-between">
          <h2 className="font-bold text-lg">{sp ? "Sửa" : "Thêm"} biến thể</h2>
          <button onClick={onClose} className="px-2 py-1 hover:bg-white/20 rounded">✕</button>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex gap-4 items-start mb-4">
             <div 
                className="w-32 h-40 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex-shrink-0 flex items-center justify-center cursor-pointer overflow-hidden group hover:border-amber-400 transition-colors relative" 
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={handleDrop}
              >
               <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
               {image ? (
                 <img src={image} className="w-full h-full object-cover group-hover:opacity-70 transition-opacity" />
               ) : (
                 <div className="text-center text-slate-400 group-hover:text-amber-500 transition-colors p-2">
                   <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
                   <div className="text-[10px] font-bold uppercase">Tải ảnh hoặc<br/>Kéo thả vào đây</div>
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
          </div>

          <div className="grid grid-cols-2 gap-2">
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

          {(() => {
            const preset = SIZE_RATIO_PRESETS.find(p => p.label === form.size || p.value === form.size);
            if (!preset) return null;
            const totalRatio = preset.riSo;
            const multiplier = Math.floor(form.soLuong / totalRatio);
            const remainder = form.soLuong % totalRatio;

            return (
              <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-200 mt-2">
                <div className="text-xs font-semibold text-amber-800 mb-2">Bảng chi tiết tỉ lệ size (Ri = {totalRatio})</div>
                <div className="grid grid-cols-6 gap-2 text-center text-sm">
                  {preset.sizes.map((s, i) => (
                    <div key={s} className="bg-white rounded-lg border border-amber-100 p-1.5 shadow-sm">
                      <div className="font-bold text-slate-700">{s}</div>
                      <div className="text-[10px] text-slate-500 uppercase mt-0.5">Tỉ lệ {preset.ratios[i]}</div>
                      <div className="font-bold text-emerald-600 mt-1 border-t border-slate-100 pt-1 text-base">
                        {multiplier * preset.ratios[i]}
                      </div>
                    </div>
                  ))}
                </div>
                {remainder > 0 && <div className="text-xs font-medium text-red-500 mt-2 flex items-center gap-1">
                  <span>⚠️</span> Số lượng tổng ({form.soLuong}) không chia hết cho một Ri ({totalRatio}). Sẽ bị dư {remainder} sản phẩm lẻ.
                </div>}
              </div>
            );
          })()}

          <div className="grid grid-cols-2 gap-2 mt-2">
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
              <textarea value={form.ghiChu} onChange={(e) => setForm({ ...form, ghiChu: e.target.value })} rows={1} className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none" />
            </div>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg text-xs border border-slate-100">
            <div className="font-semibold text-slate-700 mb-1">Tóm tắt:</div>
            <div className="text-slate-600">
              <span className="font-bold text-slate-800">{form.maSP || "..."}</span> - {form.tenSP || "..."} | Màu {form.mau || "..."} | Size {form.size || "..."}
            </div>
            <div className="text-slate-600 mt-0.5">
              SL: <b className="text-slate-800">{form.soLuong.toLocaleString()}</b> × {form.donGia.toLocaleString()}đ = <b className="text-emerald-600 text-sm">{(form.soLuong * form.donGia).toLocaleString()}đ</b>
            </div>
          </div>
        </div>
        <div className="p-4 border-t flex justify-end gap-2 bg-slate-50/80 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-semibold transition-colors">Hủy</button>
          <button onClick={() => onSave({ ...form, __tempImage: image })} className="px-5 py-2 bg-amber-500 text-white rounded-lg font-bold hover:bg-amber-600 flex items-center gap-2 transition-colors shadow-sm">
            <Save className="w-4 h-4" /> Lưu biến thể
          </button>
        </div>
      </div>
    </div>
  );
}
