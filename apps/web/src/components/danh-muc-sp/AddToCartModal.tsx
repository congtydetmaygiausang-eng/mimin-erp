"use client";

import { useState, useMemo } from "react";
import { X, ShoppingCart, Info, CheckCircle2, Printer, FileText, Banknote, Building2 } from "lucide-react";
import type { SanPham } from "@/lib/data/danh-muc-sp-store";

interface Props {
  sp: SanPham;
  onClose: () => void;
  onConfirm: (data: { 
    mode: "si" | "le", 
    mau: string, 
    ri?: number, 
    sizes?: Record<string, number>,
    khachHang: string,
    thue: number,
    thanhToan: "tien-mat" | "cong-no",
    inPhieu: boolean,
    xuatHD: boolean
  }) => void;
}

export default function AddToCartModal({ sp, onClose, onConfirm }: Props) {
  const [mode, setMode] = useState<"si" | "le">("si");
  const [selectedMau, setSelectedMau] = useState<string>(sp.dsMau?.[0]?.ten || "");
  const [soRi, setSoRi] = useState<number>(1);
  const [sizeInputs, setSizeInputs] = useState<Record<string, number>>({});
  
  // Checkout fields
  const [khachHang, setKhachHang] = useState("Khách lẻ");
  const [thue, setThue] = useState<number>(0);
  const [thanhToan, setThanhToan] = useState<"tien-mat" | "cong-no">("tien-mat");
  const [inPhieu, setInPhieu] = useState(true);
  const [xuatHD, setXuatHD] = useState(false);

  const tong1Ri = sp.bangSize?.riSo || 0;
  
  // Computed values
  const { tongSL, donGia, thanhTien, tongSauThue } = useMemo(() => {
    let sl = 0;
    let gia = 0;
    if (mode === "si") {
      sl = soRi * tong1Ri;
      gia = sp.giaBanSi || sp.giaBanDuKien || 0;
    } else {
      sl = Object.values(sizeInputs).reduce((a, b) => a + (b || 0), 0);
      gia = sp.giaBanLe || sp.giaBanDuKien || 0;
    }
    
    const tt = sl * gia;
    const sauThue = tt + (tt * thue / 100);
    
    return { tongSL: sl, donGia: gia, thanhTien: tt, tongSauThue: sauThue };
  }, [mode, soRi, sizeInputs, thue, tong1Ri, sp.giaBanSi, sp.giaBanLe, sp.giaBanDuKien]);
  
  const handleConfirm = () => {
    if (!selectedMau) {
      alert("Vui lòng chọn màu!");
      return;
    }
    if (mode === "si" && soRi <= 0) {
      alert("Số lượng Ri phải lớn hơn 0");
      return;
    }
    if (mode === "le" && tongSL <= 0) {
      alert("Vui lòng nhập số lượng cho ít nhất 1 size");
      return;
    }
    
    onConfirm({
      mode,
      mau: selectedMau,
      ri: mode === "si" ? soRi : undefined,
      sizes: mode === "le" ? sizeInputs : undefined,
      khachHang,
      thue,
      thanhToan,
      inPhieu,
      xuatHD
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden animate-scale-in flex flex-col md:flex-row" onClick={e => e.stopPropagation()}>
        
        {/* LEFT PANEL: SELECT ITEMS */}
        <div className="w-full md:w-3/5 p-5 space-y-6 flex flex-col border-r border-slate-100 max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg text-slate-800">Lên Đơn Hàng Nhanh</h2>
              <div className="text-sm font-semibold text-slate-500">{sp.tenSP}</div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors md:hidden">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setMode("si")}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${mode === "si" ? "bg-white text-cyan-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              BÁN SỈ (THEO RI)
            </button>
            <button
              onClick={() => setMode("le")}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${mode === "le" ? "bg-white text-cyan-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              BÁN LẺ (TỪNG SIZE)
            </button>
          </div>

          {/* Chọn màu */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Chọn màu sắc</label>
            <div className="flex flex-wrap gap-2">
              {sp.dsMau?.map((m) => (
                <button
                  key={m.ten}
                  onClick={() => setSelectedMau(m.ten)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                    selectedMau === m.ten 
                      ? "bg-cyan-50 border-cyan-500 text-cyan-700" 
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {m.ten}
                  {selectedMau === m.ten && <CheckCircle2 className="w-4 h-4 inline-block ml-1.5" />}
                </button>
              ))}
            </div>
          </div>

          {/* Nhập liệu */}
          {mode === "si" ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Số lượng Ri (Lốc)</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setSoRi(Math.max(1, soRi - 1))} className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-200">-</button>
                  <input
                    type="number"
                    min="1"
                    className="w-24 text-center font-bold text-lg border-b-2 border-slate-300 focus:border-cyan-500 outline-none"
                    value={soRi}
                    onChange={(e) => setSoRi(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                  <button onClick={() => setSoRi(soRi + 1)} className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-200">+</button>
                </div>
              </div>
              <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-3 flex gap-3 text-sm">
                <Info className="w-5 h-5 text-cyan-600 shrink-0" />
                <div>
                  <div className="font-bold text-cyan-800">Quy đổi 1 Ri = {tong1Ri} áo</div>
                  <div className="text-cyan-700 mt-1">
                    {sp.bangSize?.sizes.map((s, idx) => `${s}: ${sp.bangSize!.ratios[idx]}`).join(" | ")}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
               <label className="block text-sm font-bold text-slate-700 mb-2">Nhập số lượng từng Size</label>
               <div className="grid grid-cols-2 gap-2">
                 {sp.bangSize?.sizes.map((s) => (
                   <div key={s} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 border border-slate-100">
                     <span className="font-bold text-slate-700">{s}</span>
                     <input 
                        type="number"
                        min="0"
                        placeholder="0"
                        className="w-20 border border-slate-200 rounded-lg px-2 py-1.5 text-center font-bold text-slate-700 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                        value={sizeInputs[s] || ""}
                        onChange={(e) => setSizeInputs({...sizeInputs, [s]: parseInt(e.target.value) || 0})}
                     />
                   </div>
                 ))}
               </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: CHECKOUT & PAYMENT */}
        <div className="w-full md:w-2/5 bg-slate-50 p-5 flex flex-col justify-between max-h-[85vh] overflow-y-auto">
           <div className="space-y-5">
             <div className="flex justify-between items-start md:items-center">
               <h3 className="font-bold text-slate-800 text-lg">Thanh Toán</h3>
               <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors hidden md:block">
                 <X className="w-5 h-5 text-slate-500" />
               </button>
             </div>

             <div className="space-y-3">
               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Khách Hàng</label>
                 <input 
                   className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-cyan-500 outline-none"
                   value={khachHang}
                   onChange={e => setKhachHang(e.target.value)}
                   placeholder="Tên khách hàng..."
                 />
               </div>
               
               <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 text-sm shadow-sm">
                 <div className="flex justify-between">
                   <span className="text-slate-500">Số lượng cái:</span>
                   <span className="font-bold">{tongSL}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-slate-500">Đơn giá ({mode === "si" ? "Sỉ" : "Lẻ"}):</span>
                   <span className="font-bold">{donGia.toLocaleString()}đ</span>
                 </div>
                 <div className="flex justify-between items-center pt-2 border-t border-dashed">
                   <span className="text-slate-500">Thuế VAT (%):</span>
                   <input 
                     type="number" 
                     className="w-16 border rounded px-2 py-1 text-right text-sm outline-none focus:border-cyan-500"
                     value={thue}
                     onChange={e => setThue(Number(e.target.value))}
                   />
                 </div>
                 <div className="flex justify-between items-end pt-3 border-t">
                   <span className="font-bold text-slate-700">TỔNG CỘNG:</span>
                   <span className="font-black text-xl text-rose-600">{tongSauThue.toLocaleString()}đ</span>
                 </div>
               </div>

               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-2 mt-4">Hình thức thanh toán</label>
                 <div className="grid grid-cols-2 gap-2">
                   <button 
                     onClick={() => setThanhToan("tien-mat")}
                     className={`flex flex-col items-center justify-center p-3 rounded-xl border ${thanhToan === "tien-mat" ? "bg-blue-50 border-blue-500 text-blue-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                   >
                     <Banknote className="w-5 h-5 mb-1" />
                     <span className="text-xs font-bold">Tiền mặt</span>
                   </button>
                   <button 
                     onClick={() => setThanhToan("cong-no")}
                     className={`flex flex-col items-center justify-center p-3 rounded-xl border ${thanhToan === "cong-no" ? "bg-amber-50 border-amber-500 text-amber-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                   >
                     <Building2 className="w-5 h-5 mb-1" />
                     <span className="text-xs font-bold">Công nợ</span>
                   </button>
                 </div>
               </div>

               <div className="space-y-2 mt-2">
                 <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                   <input type="checkbox" checked={inPhieu} onChange={e => setInPhieu(e.target.checked)} className="rounded text-cyan-600 focus:ring-cyan-500" />
                   <Printer className="w-4 h-4 text-slate-500" /> In phiếu đơn hàng
                 </label>
                 <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                   <input type="checkbox" checked={xuatHD} onChange={e => setXuatHD(e.target.checked)} className="rounded text-cyan-600 focus:ring-cyan-500" />
                   <FileText className="w-4 h-4 text-slate-500" /> Xuất hoá đơn điện tử (Kết nối PM)
                 </label>
               </div>
             </div>
           </div>

           <div className="mt-6">
             <button 
               onClick={handleConfirm}
               className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 rounded-xl shadow-md flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
             >
               <ShoppingCart className="w-5 h-5" /> TẠO ĐƠN HÀNG NGAY
             </button>
           </div>
        </div>
      </div>
    </div>
  );
}
