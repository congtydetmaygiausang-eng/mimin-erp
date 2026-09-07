import { useState } from "react";
import { Edit, Save, X } from "lucide-react";
import { toast } from "sonner";
import { type SanPhamTP } from "../data";

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
  const [form, setForm] = useState({
    tenSP: group.tenSP || "",
    phanLoai: group.items[0]?.phanLoai || "",
    lsx: group.items[0]?.lsx || "",
    giaVon: group.items[0]?.giaVon || 0,
    giaBanSi: group.items[0]?.giaBanSi || 0,
    giaBanLe: group.items[0]?.giaBanLe || 0,
    giaBanLo: group.items[0]?.giaBanLo || 0,
    giaTikTok: group.items[0]?.giaTikTok || 0,
    giaShopee: group.items[0]?.giaShopee || 0,
  });

  const handleSubmit = () => {
    if (!form.tenSP.trim()) {
      toast.error("Vui lòng nhập tên SP");
      return;
    }

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
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-3" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 flex items-center justify-between sticky top-0 z-10">
          <h2 className="font-bold text-lg flex items-center gap-2"><Edit className="w-5 h-5" /> Sửa tổng quát cho mã: {group.maSP}</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-amber-50 text-amber-800 text-sm p-3 rounded-lg border border-amber-200">
            <strong>Lưu ý:</strong> Chỉnh sửa ở đây sẽ áp dụng chung cho tất cả <strong>{group.items.length}</strong> biến thể màu/size của sản phẩm này trong kho.
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Tên SP mẹ *</label>
              <input value={form.tenSP} onChange={(e) => setForm({ ...form, tenSP: e.target.value })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Phân loại</label>
              <input value={form.phanLoai} onChange={(e) => setForm({ ...form, phanLoai: e.target.value })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">LSX / Lô nhập</label>
              <input value={form.lsx} onChange={(e) => setForm({ ...form, lsx: e.target.value })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none font-mono" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Giá vốn</label>
              <input type="number" min="0" value={form.giaVon || ""} onChange={(e) => setForm({ ...form, giaVon: Math.max(0, parseInt(e.target.value) || 0) })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Giá bán sỉ</label>
              <input type="number" min="0" value={form.giaBanSi || ""} onChange={(e) => setForm({ ...form, giaBanSi: Math.max(0, parseInt(e.target.value) || 0) })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Giá bán lẻ</label>
              <input type="number" min="0" value={form.giaBanLe || ""} onChange={(e) => setForm({ ...form, giaBanLe: Math.max(0, parseInt(e.target.value) || 0) })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Giá bán lô</label>
              <input type="number" min="0" value={form.giaBanLo || ""} onChange={(e) => setForm({ ...form, giaBanLo: Math.max(0, parseInt(e.target.value) || 0) })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Giá TikTok</label>
              <input type="number" min="0" value={form.giaTikTok || ""} onChange={(e) => setForm({ ...form, giaTikTok: Math.max(0, parseInt(e.target.value) || 0) })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Giá Shopee</label>
              <input type="number" min="0" value={form.giaShopee || ""} onChange={(e) => setForm({ ...form, giaShopee: Math.max(0, parseInt(e.target.value) || 0) })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none" />
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-2 bg-slate-50 rounded-b-2xl sticky bottom-0">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-semibold transition-colors">Hủy</button>
          <button onClick={handleSubmit} className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold flex items-center gap-2 shadow-sm transition-colors">
            <Save className="w-4 h-4" /> Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}
