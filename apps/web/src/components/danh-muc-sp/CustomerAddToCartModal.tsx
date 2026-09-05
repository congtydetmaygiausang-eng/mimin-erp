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

  // Determine the display image based on selected color
  const displayImage = sp.dsMau?.find((m) => m.ten === selectedColor)?.img || sp.hinhAnh;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col md:flex-row max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Side: Large Image with Hover Zoom */}
        <div className="w-full md:w-1/2 bg-slate-100 relative group overflow-hidden shrink-0 border-r border-slate-100 min-h-[300px] md:min-h-full">
          {displayImage ? (
            <img 
              src={displayImage} 
              alt={sp.tenSP} 
              className="w-full h-full object-contain md:object-cover transition-transform duration-500 ease-out group-hover:scale-150 cursor-zoom-in" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><ShoppingCart className="w-20 h-20 text-slate-300" /></div>
          )}
        </div>

        {/* Right Side: Details & Actions */}
        <div className="w-full md:w-1/2 flex flex-col bg-white overflow-hidden relative">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
            <h2 className="text-xl font-bold text-slate-800 line-clamp-1">{sp.tenSP}</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 ml-2">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 md:p-8 flex-1 overflow-y-auto space-y-6">
            <div>
              <div className="text-3xl font-extrabold text-cyan-600 mb-1">{formatVNDShort(price)}</div>
              <div className="text-sm font-semibold text-emerald-600 bg-emerald-50 inline-block px-2 py-1 rounded-md">
                Tình trạng: {sp.trangThai === "con-hang" ? "Còn hàng" : "Hết hàng"}
              </div>
            </div>

            {/* Colors */}
            <div>
              <label className="block text-sm font-bold text-slate-600 uppercase mb-3">Màu sắc</label>
              <div className="flex flex-wrap gap-2.5">
                {sp.dsMau?.map((m) => (
                  <button
                    key={m.ten}
                    onClick={() => setSelectedColor(m.ten)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                      selectedColor === m.ten 
                        ? 'border-cyan-500 bg-cyan-50 text-cyan-700 shadow-sm ring-2 ring-cyan-500/20' 
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {m.ten}
                  </button>
                ))}
              </div>
            </div>

            {/* Sizes */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-bold text-slate-600 uppercase">Kích cỡ</label>
                <span className="text-xs text-cyan-600 font-semibold cursor-pointer hover:underline">Bảng size</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {sp.bangSize?.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`min-w-[3.5rem] h-12 px-3 rounded-xl text-base font-bold border flex items-center justify-center transition-all ${
                      selectedSize === s 
                        ? 'border-cyan-500 bg-cyan-50 text-cyan-700 shadow-sm ring-2 ring-cyan-500/20' 
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-bold text-slate-600 uppercase mb-3">Số lượng</label>
              <div className="flex items-center w-max bg-slate-50 rounded-xl border border-slate-200 p-1.5 shadow-inner">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 flex items-center justify-center text-slate-600 hover:bg-white hover:shadow-sm rounded-lg font-bold transition-all text-xl"
                >-</button>
                <span className="w-16 text-center font-extrabold text-slate-800 text-lg">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-12 h-12 flex items-center justify-center text-slate-600 hover:bg-white hover:shadow-sm rounded-lg font-bold transition-all text-xl"
                >+</button>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0">
            <button 
              onClick={handleAdd}
              className="w-full flex items-center justify-center gap-2 py-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold shadow-lg shadow-cyan-500/30 transition-all active:scale-[0.98] text-lg"
            >
              <ShoppingCart className="w-6 h-6" />
              THÊM VÀO GIỎ HÀNG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
