"use client";

import { useState } from "react";
import { X, ShoppingCart, Check } from "lucide-react";
import { type SanPham } from "@/lib/data/danh-muc-sp-store";
import { formatVNDShort } from "@/lib/data/real-data";
import { useCustomerCart } from "@/lib/data/customer-cart-store";
import { toast } from "sonner";

export default function CustomerAddToCartModal({
  sp,
  onClose,
}: {
  sp: SanPham;
  onClose: () => void;
}) {
  const { addItem } = useCustomerCart();
  const [selectedColor, setSelectedColor] = useState(sp.dsMau?.[0]?.ten || "");
  const [selectedSize, setSelectedSize] = useState(sp.bangSize?.sizes[0] || "");
  const [quantity, setQuantity] = useState(1);

  const price = sp.giaBanLe || sp.giaBanDuKien || 0; // Default B2C price
  
  const handleAdd = () => {
    if (!selectedColor) {
      toast.error("Vui lòng chọn màu sắc!");
      return;
    }
    if (!selectedSize) {
      toast.error("Vui lòng chọn kích cỡ!");
      return;
    }
    
    const colorObj = sp.dsMau?.find((m) => m.ten === selectedColor);
    
    addItem({
      spId: sp.id,
      spTen: sp.tenSP,
      hinhAnh: colorObj?.img || sp.hinhAnh || "",
      mauCode: colorObj?.maSKU || "DEFAULT",
      mauTen: selectedColor,
      size: selectedSize,
      soLuong: quantity,
      donGia: price,
    });
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Thêm vào giỏ hàng</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex gap-4 mb-6">
            <div className="w-20 h-24 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-100">
              {sp.hinhAnh ? (
                <img src={sp.hinhAnh} alt={sp.tenSP} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><ShoppingCart className="w-8 h-8 text-slate-300" /></div>
              )}
            </div>
            <div>
              <h3 className="font-bold text-slate-800 line-clamp-2 leading-tight mb-2">{sp.tenSP}</h3>
              <div className="text-xl font-extrabold text-cyan-600">{formatVNDShort(price)}đ</div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Colors */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Màu sắc</label>
              <div className="flex flex-wrap gap-2">
                {sp.dsMau?.map((m) => (
                  <button
                    key={m.ten}
                    onClick={() => setSelectedColor(m.ten)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                      selectedColor === m.ten 
                        ? 'border-cyan-500 bg-cyan-50 text-cyan-700 shadow-sm' 
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {m.ten}
                  </button>
                ))}
              </div>
            </div>

            {/* Sizes */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Kích cỡ</label>
              <div className="flex flex-wrap gap-2">
                {sp.bangSize?.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`w-12 h-12 rounded-xl text-sm font-bold border flex items-center justify-center transition-all ${
                      selectedSize === s 
                        ? 'border-cyan-500 bg-cyan-50 text-cyan-700 shadow-sm' 
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Số lượng</label>
              <div className="flex items-center w-max bg-slate-50 rounded-xl border border-slate-200 p-1">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded-lg font-bold transition-colors"
                >-</button>
                <span className="w-12 text-center font-extrabold text-slate-800">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded-lg font-bold transition-colors"
                >+</button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <button 
            onClick={handleAdd}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold shadow-lg shadow-cyan-500/30 transition-all active:scale-[0.98]"
          >
            <Check className="w-5 h-5" />
            THÊM VÀO GIỎ HÀNG
          </button>
        </div>
      </div>
    </div>
  );
}
