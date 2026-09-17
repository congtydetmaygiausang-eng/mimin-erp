// ============ MASTER DETAILS MODAL ============
// Redesigned for Mobile-first & Desktop Responsive UI (2026-09-12)

import { Package, X, Star, Eye, ShoppingCart, Plus, ChevronRight, ShieldCheck, Box, MapPin } from "lucide-react";
import type { SanPhamTP } from "../data";

interface ProductGroup {
  maSP: string;
  tenSP: string;
  items: SanPhamTP[];
}

export function MasterDetailsModal({ maSP, groups, productImages, onClose }: { maSP: string; groups: ProductGroup[]; productImages: Record<string, string>; onClose: () => void }) {
  const group = groups.find(g => (g.maSP || "NO_CODE") === maSP);
  if (!group) return null;

  // Extract common fields for the display
  const loaiSP = group.items[0]?.loaiSP === "BoTru" ? "BỘ TRỤ" : (group.items[0]?.loaiSP || "BỘ TRỤ").toUpperCase();
  const rating = 5.0;
  const views = 0;
  const sold = 0;

  // Extract unique sizes and their ratio (tiLeSize)
  const sizeMap = new Map();
  group.items.forEach(item => {
    if (item.size) {
      if (!sizeMap.has(item.size)) sizeMap.set(item.size, item.tiLeSize || "1");
    }
  });
  // If no items have size but tiLeSize exists globally, we might not have size details
  const sizes = Array.from(sizeMap.entries()).map(([size, tl]) => ({ size, tl }));

  // Extract unique colors
  const colorMap = new Map();
  group.items.forEach((item, idx) => {
    if (item.mau) {
      if (!colorMap.has(item.mau)) {
        colorMap.set(item.mau, {
          mau: item.mau,
          hinhAnh: item.hinhAnh?.[0] || productImages[`${item.maSP}_${item.mau}`] || productImages[item.maSP],
          maMau: `${item.maSP}-${(idx + 1).toString().padStart(2, '0')}`, // Mocking color code
          dinhMuc: (item as any).dinhMuc || "0.25", // Fallback mock value
        });
      }
    }
  });
  const colors = Array.from(colorMap.values());

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-50 w-full md:w-[850px] lg:w-[960px] md:max-w-none h-[95vh] md:h-[650px] md:max-h-[90vh] rounded-t-3xl md:rounded-3xl flex flex-col md:flex-row overflow-hidden relative shadow-2xl">
        
        {/* Mobile handle */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/50 backdrop-blur-md rounded-full z-20 md:hidden"></div>
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2 bg-black/20 md:bg-white/50 backdrop-blur-md rounded-full shadow-sm text-white md:text-slate-700 hover:bg-black/40 md:hover:bg-white transition-colors">
          <X className="w-5 h-5" />
        </button>

        {/* Cover Image Section (Left on Desktop, Top on Mobile) */}
        <div className="w-full h-[35vh] min-h-[250px] md:min-h-0 md:h-full md:w-[45%] lg:w-[50%] bg-slate-100 relative shrink-0">
          {productImages[group.maSP] ? (
            <img src={productImages[group.maSP]} alt={group.tenSP} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-200">
              <Package className="w-16 h-16 text-slate-400" />
            </div>
          )}
          {/* Gradient overlay to blend with content below (Mobile only) */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent md:hidden z-10"></div>
        </div>

        {/* Content Section (Right on Desktop, Bottom on Mobile) */}
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0 custom-scrollbar md:w-[55%] lg:w-[50%] bg-slate-50 relative">
          
          {/* Header Info Section */}
          <div className="bg-white px-6 pt-5 md:pt-10 pb-8 rounded-b-[40px] md:rounded-none shadow-sm relative -mt-5 md:mt-0 z-10">
            <div className="flex flex-wrap gap-2 mb-4 relative z-10">
              <span className="px-4 py-1.5 bg-cyan-50 text-cyan-700 font-extrabold text-[11px] rounded-full uppercase tracking-widest shadow-sm border border-cyan-100/50">{group.maSP}</span>
              <span className="px-4 py-1.5 bg-slate-100 text-slate-600 font-extrabold text-[11px] rounded-full uppercase tracking-widest shadow-sm border border-slate-200/50">{loaiSP}</span>
            </div>

            <h1 className="text-[32px] md:text-[36px] lg:text-[40px] font-black text-[#1e293b] leading-[1.1] mb-6 tracking-tight relative z-10">
              {group.tenSP || "Sản phẩm mới"}
            </h1>

            <div className="flex items-center flex-wrap gap-3 relative z-10">
              <div className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-full text-slate-600 font-semibold text-sm">
                <Eye className="w-4 h-4 text-slate-400" /> {views}
              </div>
              <div className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-full text-slate-600 font-semibold text-sm">
                <ShoppingCart className="w-4 h-4 text-slate-400" /> {sold} đã bán
              </div>
              <div className="flex items-center gap-2 px-4 py-2 border border-amber-200 bg-amber-50 rounded-full text-amber-600 font-bold text-sm">
                <Star className="w-4 h-4 fill-amber-500" /> {rating.toFixed(1)}
              </div>
            </div>
          </div>

          {/* Pricing / Details Section */}
          <div className="px-6 py-8">
            <h3 className="text-[11px] font-black text-slate-400 tracking-[0.2em] uppercase mb-4 ml-2">BẢNG GIÁ</h3>
            <div className="bg-white rounded-[32px] p-6 shadow-sm space-y-6 border border-slate-100">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">CHẤT LIỆU</div>
                  <div className="text-slate-800 font-bold text-[17px]">Cotton</div>
                </div>
              </div>
              <div className="w-full h-[1px] bg-slate-100"></div>
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
                  <Box className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">KHO HÀNG</div>
                  <div className="text-slate-800 font-bold text-[17px]">Sẵn sàng giao</div>
                </div>
              </div>
              <div className="w-full h-[1px] bg-slate-100"></div>
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">NGUỒN GỐC</div>
                  <div className="text-slate-800 font-bold text-[17px]">Sản xuất Nội bộ</div>
                </div>
              </div>
            </div>
          </div>

          {/* Size Info Section */}
          <div className="px-6 pb-8">
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
              <h3 className="text-[11px] font-black text-slate-400 tracking-[0.2em] uppercase mb-6 text-center">THÔNG SỐ SIZE & TỈ LỆ</h3>
              <div className="flex flex-wrap gap-4 justify-center">
                {sizes.length > 0 ? sizes.map((s, i) => (
                  <div key={i} className="flex flex-col items-center gap-3">
                    <div className="w-[72px] h-[72px] rounded-3xl border-[2.5px] border-slate-100 flex items-center justify-center text-3xl font-black text-[#1e293b] shadow-sm">
                      {s.size}
                    </div>
                    <div className="bg-slate-100 text-slate-500 text-[11px] font-bold px-4 py-1.5 rounded-full">
                      TL: {s.tl}
                    </div>
                  </div>
                )) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-[72px] h-[72px] rounded-3xl border-[2.5px] border-slate-100 flex items-center justify-center text-xl font-black text-slate-400 shadow-sm">
                      ?
                    </div>
                    <div className="bg-slate-100 text-slate-500 text-[11px] font-bold px-4 py-1.5 rounded-full">
                      Chưa có
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Colors Section */}
          <div className="px-6 pb-12">
            <div className="flex items-center justify-between mb-5 ml-2">
              <h3 className="text-[11px] font-black text-slate-400 tracking-[0.2em] uppercase">MÀU SẮC & PHÂN LOẠI ({colors.length})</h3>
              <button className="flex items-center gap-1.5 text-cyan-600 font-bold text-sm bg-cyan-50 hover:bg-cyan-100 transition-colors px-4 py-2 rounded-full">
                <Plus className="w-4 h-4" /> Thêm màu
              </button>
            </div>

            <div className="space-y-4">
              {colors.map((c, i) => (
                <div key={i} className={`bg-white border-[2.5px] ${i === 0 ? 'border-cyan-400' : 'border-transparent'} rounded-[32px] p-4 shadow-sm flex gap-4 items-center relative overflow-hidden transition-all hover:border-cyan-200`}>
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
                    {c.hinhAnh ? <img src={c.hinhAnh} className="w-full h-full object-cover" /> : <Package className="w-10 h-10 text-slate-300 m-auto mt-7 md:mt-9" />}
                  </div>
                  <div className="flex-1 py-1">
                    <h4 className="text-[20px] md:text-[22px] font-black text-[#1e293b] mb-1.5">{c.mau}</h4>
                    <div className="bg-slate-50 inline-block px-2.5 py-1.5 rounded-lg text-[12px] md:text-[13px] font-mono text-slate-400 mb-2.5 font-semibold">
                      {c.maMau}
                    </div>
                    <div className="text-slate-500 text-sm font-medium">
                      Định mức: <span className="font-bold text-cyan-700 text-[15px]">{c.dinhMuc} kg</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-cyan-50 flex items-center justify-center text-cyan-500 shrink-0 mr-1 cursor-pointer hover:bg-cyan-100 transition-colors">
                    <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                </div>
              ))}
              
              {colors.length === 0 && (
                <div className="text-center py-10 bg-white rounded-[32px] border border-dashed border-slate-300">
                   <p className="text-slate-500 font-medium">Chưa có thông tin màu sắc</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

