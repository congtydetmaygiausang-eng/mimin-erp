import { useState } from "react";
import { Edit3, Save, AlertTriangle, Layers, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { type SanPhamTP } from "../data";
import { LOAI_SP_LABELS, detectLoaiSP } from "@/lib/data/lenh-cat-store";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";

interface ProductGroup {
  maSP: string;
  tenSP: string;
  items: SanPhamTP[];
}

export function SuaTongModal({
  group,
  onClose,
  onSave,
}: {
  group: ProductGroup;
  onClose: () => void;
  onSave: (updatedItems: SanPhamTP[]) => void;
}) {
  const phanLoaiInit = group.items[0]?.phanLoai || "";
  const isValidKey = Object.keys(LOAI_SP_LABELS).includes(phanLoaiInit);
  const detectedPhanLoai = isValidKey ? phanLoaiInit : detectLoaiSP((group.tenSP || "") + " " + phanLoaiInit);

  const [form, setForm] = useState({
    tenSP: group.tenSP || "",
    phanLoai: detectedPhanLoai || "BoTru",
    lsx: group.items[0]?.lsx || "",
    giaVon: group.items[0]?.giaVon || 0,
    giaBanSi: group.items[0]?.giaBanSi || 0,
    giaBanLe: group.items[0]?.giaBanLe || 0,
    giaBanLo: group.items[0]?.giaBanLo || 0,
    giaTikTok: group.items[0]?.giaTikTok || 0,
    giaShopee: group.items[0]?.giaShopee || 0,
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = () => {
    if (!form.tenSP.trim()) {
      toast.error("Vui lòng nhập tên SP");
      return;
    }

    setSaving(true);
    
    // Giả lập chút delay để hiển thị state loading xịn
    setTimeout(() => {
      const updatedItems = group.items.map((item) => ({
        ...item,
        tenSP: form.tenSP.trim(),
        phanLoai: form.phanLoai.trim(),
        lsx: form.lsx.trim(),
        giaVon: form.giaVon,
        giaBanSi: form.giaBanSi,
        giaBanLe: form.giaBanLe,
        giaBanLo: form.giaBanLo,
        giaTikTok: form.giaTikTok,
        giaShopee: form.giaShopee,
      }));
  
      onSave(updatedItems);
      setSaving(false);
    }, 300);
  };

  return (
    <ResponsiveModal
      open={true}
      maxWidth="3xl"
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-inner shadow-white/20">
            <Edit3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-800 tracking-tight">Sửa Thông Tin Nhóm</div>
            <div className="text-xs font-medium text-slate-500 flex items-center gap-1">
              Mã sản phẩm: <span className="text-orange-600 font-bold bg-orange-50 px-1.5 py-0.5 border border-orange-200 rounded">{group.maSP}</span>
            </div>
          </div>
        </div>
      }
    >
      <div className="flex flex-col h-[85vh]">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50 space-y-6">
          
          <div className="bg-gradient-to-r from-amber-50 to-orange-50/50 p-4 rounded-2xl border border-amber-200/60 flex items-start gap-3 shadow-sm">
            <div className="p-2 bg-amber-100/80 rounded-xl shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900 mb-0.5">Lưu ý khi sửa nhóm</h4>
              <p className="text-xs text-amber-700/90 leading-relaxed">
                Các thay đổi tại đây sẽ được áp dụng ĐỒNG LOẠT cho tất cả <strong className="text-orange-600 text-sm bg-white/60 px-1.5 py-0.5 rounded shadow-sm mx-0.5">{group.items.length}</strong> biến thể màu/size của mã hàng này đang có trong kho thành phẩm.
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden transition-all hover:border-blue-200 hover:shadow-md">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            <h3 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shadow-inner">
                <Layers className="w-4 h-4" />
              </span>
              Thông Tin Chung
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">Tên SP mẹ *</label>
                <input 
                  value={form.tenSP} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm({ ...form, tenSP: val, phanLoai: detectLoaiSP(val) });
                  }} 
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-slate-50 hover:bg-white focus:bg-white text-slate-800 font-bold shadow-sm"
                  placeholder="VD: Áo Polo Thể Thao"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">Phân loại</label>
                <select 
                  value={form.phanLoai} 
                  onChange={(e) => setForm({ ...form, phanLoai: e.target.value })} 
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-slate-50 hover:bg-white focus:bg-white text-slate-700 font-semibold cursor-pointer shadow-sm appearance-none"
                >
                  {Object.entries(LOAI_SP_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">LSX / Lô nhập</label>
                <input 
                  value={form.lsx} 
                  onChange={(e) => setForm({ ...form, lsx: e.target.value })} 
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-slate-50 hover:bg-white focus:bg-white text-slate-700 font-mono font-bold shadow-sm"
                  placeholder="VD: LSX-2026-..." 
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden transition-all hover:border-emerald-200 hover:shadow-md">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
            <h3 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-inner">
                <DollarSign className="w-4 h-4" />
              </span>
              Thiết Lập Giá (VNĐ)
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Giá vốn</label>
                <input type="number" min="0" value={form.giaVon || ""} onChange={(e) => setForm({ ...form, giaVon: Math.max(0, parseInt(e.target.value) || 0) })} className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-lg text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none bg-white font-bold text-slate-800 transition-all" placeholder="0" />
              </div>
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Giá bán sỉ</label>
                <input type="number" min="0" value={form.giaBanSi || ""} onChange={(e) => setForm({ ...form, giaBanSi: Math.max(0, parseInt(e.target.value) || 0) })} className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-lg text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none bg-white font-bold text-slate-800 transition-all" placeholder="0" />
              </div>
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Giá bán lẻ</label>
                <input type="number" min="0" value={form.giaBanLe || ""} onChange={(e) => setForm({ ...form, giaBanLe: Math.max(0, parseInt(e.target.value) || 0) })} className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-lg text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none bg-white font-bold text-slate-800 transition-all" placeholder="0" />
              </div>
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Giá bán lô</label>
                <input type="number" min="0" value={form.giaBanLo || ""} onChange={(e) => setForm({ ...form, giaBanLo: Math.max(0, parseInt(e.target.value) || 0) })} className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-lg text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none bg-white font-bold text-slate-800 transition-all" placeholder="0" />
              </div>
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Giá TikTok</label>
                <input type="number" min="0" value={form.giaTikTok || ""} onChange={(e) => setForm({ ...form, giaTikTok: Math.max(0, parseInt(e.target.value) || 0) })} className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-lg text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none bg-white font-bold text-slate-800 transition-all" placeholder="0" />
              </div>
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Giá Shopee</label>
                <input type="number" min="0" value={form.giaShopee || ""} onChange={(e) => setForm({ ...form, giaShopee: Math.max(0, parseInt(e.target.value) || 0) })} className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-lg text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none bg-white font-bold text-slate-800 transition-all" placeholder="0" />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 md:px-6 bg-white border-t border-slate-200 flex justify-end gap-3 sticky bottom-0 rounded-b-2xl z-20">
          <button 
            onClick={onClose} 
            disabled={saving}
            className="px-6 py-2.5 text-slate-600 bg-white hover:bg-slate-50 border-2 border-slate-200 rounded-xl font-bold transition-colors disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={saving}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-md shadow-orange-500/20 transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" /> 
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
}
