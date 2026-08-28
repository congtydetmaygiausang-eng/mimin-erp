"use client";

import { useEffect, useState } from "react";
import { X, Plus, Trash2, Wand2, Shirt, Save, Info, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { AIMockupModal } from "@/components/AIMockupModal";
import { useDanhMucSP, type SanPham, type MauTieuChuan, type BangSize } from "@/lib/data/danh-muc-sp-store";
import { type LoaiSP, LOAI_SP_LABELS } from "@/lib/data/lenh-cat-store";
import { SIZE_RATIO_5SIZE } from "@/lib/size-ratio-presets";
import BangSizeInput from "@/components/BangSizeInput";
import { Portal } from "@/components/ui/Portal";

interface Props {
  open: boolean;
  onClose: () => void;
  editId?: string | null;
}

const DEFAULT_BANGSIZE: BangSize = {
  sizes: ["M", "L", "XL", "2XL", "3XL"],
  ratios: [1, 2, 2, 2, 1],
  riSo: 8,
};

const TI_LE_OPTIONS = SIZE_RATIO_5SIZE.map((p) => ({
  label: p.label,
  value: p.value,
  ratios: p.ratios,
}));

export default function DanhMucSPModal({ open, onClose, editId }: Props) {
  const { dsSanPham, themSP, suaSP } = useDanhMucSP();
  
  const [maSP, setMaSP] = useState("");
  const [tenSP, setTenSP] = useState("");
  const [loaiSP, setLoaiSP] = useState<LoaiSP>("BoTru");
  const [giaVonDuKien, setGiaVonDuKien] = useState<number | "">("");
  const [giaBanDuKien, setGiaBanDuKien] = useState<number | "">("");
  const [tiLeSize, setTiLeSize] = useState("1:2:2:1");
  const [bangSize, setBangSize] = useState<BangSize>(DEFAULT_BANGSIZE);
  const [ghiChu, setGhiChu] = useState("");
  const [dsMau, setDsMau] = useState<MauTieuChuan[]>([
    { ten: "Đen", maSKU: "", dinhMuc: 0.25, img: "" }
  ]);

  const [aiMockupIdx, setAiMockupIdx] = useState<number | null>(null);

  useEffect(() => {
    if (editId) {
      const sp = dsSanPham.find(s => s.id === editId);
      if (sp) {
        setMaSP(sp.id);
        setTenSP(sp.tenSP);
        setLoaiSP(sp.loaiSP);
        setGiaVonDuKien(sp.giaVonDuKien);
        setGiaBanDuKien(sp.giaBanDuKien);
        setTiLeSize(sp.tiLeSize);
        setBangSize(sp.bangSize || DEFAULT_BANGSIZE);
        setGhiChu(sp.ghiChu);
        setDsMau(sp.dsMau);
      }
    } else {
      setMaSP("");
      setTenSP("");
      setLoaiSP("BoTru");
      setGiaVonDuKien("");
      setGiaBanDuKien("");
      setTiLeSize("1:2:2:1");
      setBangSize(DEFAULT_BANGSIZE);
      setGhiChu("");
      setDsMau([{ ten: "", maSKU: "", dinhMuc: 0.25, img: "" }]);
    }
  }, [editId, dsSanPham]);

  const handleSave = () => {
    if (!maSP.trim() || !tenSP.trim()) {
      toast.error("Vui lòng nhập Mã SP và Tên SP");
      return;
    }
    
    // Auto generate SKU if empty
    const finalDsMau = dsMau.map((m, i) => ({
      ...m,
      maSKU: m.maSKU || `${maSP}-${m.ten.substring(0, 4).toUpperCase().replace(/\\s/g, "")}`
    }));

    const data: SanPham = {
      id: maSP.toUpperCase(),
      tenSP,
      loaiSP,
      giaVonDuKien: Number(giaVonDuKien) || 0,
      giaBanDuKien: Number(giaBanDuKien) || 0,
      tiLeSize,
      bangSize,
      dsMau: finalDsMau,
      ghiChu,
      ngayTao: new Date().toISOString().split("T")[0]
    };

    if (editId) {
      suaSP(editId, data);
      toast.success("Cập nhật danh mục thành công!");
    } else {
      if (dsSanPham.some(s => s.id === data.id)) {
        toast.error("Mã Sản Phẩm này đã tồn tại!");
        return;
      }
      themSP(data);
      toast.success("Tạo danh mục mới thành công!");
    }
    onClose();
  };

  const handleImageUpload = (idx: number) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setDsMau(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], img: ev.target?.result as string };
            return next;
          });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const buildAiPrompt = (idx: number): string => {
    const loaiText = LOAI_SP_LABELS[loaiSP] || "áo polo";
    const colorText = dsMau[idx]?.ten || "";
    if (tenSP) {
      return `${tenSP} ${loaiText} màu ${colorText}, may mặc thời trang nam, studio lighting, nền trắng`;
    }
    return `mockup sản phẩm may mặc ${loaiText} màu ${colorText}, studio lighting, nền trắng`;
  };

  if (!open) return null;

  return (
    <>
    <Portal>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#2B4C3E]/80 backdrop-blur-sm p-4 animate-fade-in">
        <div 
          className="bg-[#F4F1EA] rounded-xl shadow-2xl max-w-4xl w-full max-h-[96vh] overflow-hidden flex flex-col border-4 border-[#2B4C3E]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-4 bg-[#2B4C3E] shrink-0">
            <h2 className="text-white font-bold ml-2 text-lg flex items-center gap-2">
              <Shirt className="w-5 h-5" />
              {editId ? `SỬA SẢN PHẨM: ${editId}` : "TẠO MÃ SẢN PHẨM MỚI (MASTER DATA)"}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {/* BẢNG SIZE - Ở TRÊN CÙNG cho dễ thấy */}
            <div className="mb-2">
               <BangSizeInput
                  ratios={bangSize.ratios as [number, number, number, number, number]}
                  onChange={(n) => {
                     const riSo = n.reduce((a, b) => a + b, 0);
                     setBangSize({ ...bangSize, ratios: n, riSo });
                     setTiLeSize(n.join(":"));
                  }}
               />
            </div>

            <div className="bg-white p-4 md:p-5 rounded-lg border border-slate-200 shadow-sm">
               <h3 className="text-lg font-bold text-[#2B4C3E] uppercase tracking-wide mb-4 border-b pb-2">THÔNG TIN CƠ BẢN</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="text-sm font-bold text-slate-700 block mb-1.5">Mã SP *</label>
                    <input className="w-full px-3 py-2 min-h-[44px] border rounded-lg focus:ring-2 focus:ring-[#2B4C3E] outline-none" value={maSP} onChange={e => setMaSP(e.target.value.toUpperCase())} placeholder="VD: M001" disabled={!!editId} />
                 </div>
                 <div>
                    <label className="text-sm font-bold text-slate-700 block mb-1.5">Tên SP *</label>
                    <input className="w-full px-3 py-2 min-h-[44px] border rounded-lg focus:ring-2 focus:ring-[#2B4C3E] outline-none" value={tenSP} onChange={e => setTenSP(e.target.value)} placeholder="VD: Bộ Thể Thao Nam" />
                 </div>
                 <div>
                    <label className="text-sm font-bold text-slate-700 block mb-1.5">Loại Sản Phẩm *</label>
                    <select className="w-full px-3 py-2 min-h-[44px] border rounded-lg focus:ring-2 focus:ring-[#2B4C3E] outline-none" value={loaiSP} onChange={e => setLoaiSP(e.target.value as LoaiSP)}>
                      {Object.entries(LOAI_SP_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="text-sm font-bold text-slate-700 block mb-1.5">Bảng Size (Tỉ lệ mẫu) *</label>
                    <select
                      className="w-full px-3 py-2 min-h-[44px] border rounded-lg focus:ring-2 focus:ring-[#2B4C3E] outline-none"
                      value={tiLeSize}
                      onChange={e => {
                        const opt = TI_LE_OPTIONS.find(o => o.value === e.target.value);
                        if (opt) {
                          setTiLeSize(opt.value);
                          setBangSize({ sizes: ["M", "L", "XL", "2XL", "3XL"], ratios: opt.ratios as [number, number, number, number, number], riSo: opt.ratios.reduce((a: number, b: number) => a + b, 0) });
                        }
                      }}
                    >
                      {TI_LE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1 italic">Chọn tỉ lệ mẫu → tự điền vào bảng size bên dưới (có thể chỉnh tay)</p>
                 </div>
                 <div>
                    <label className="text-sm font-bold text-slate-700 block mb-1.5">Giá Vốn Dự Kiến (COGS)</label>
                    <input type="number" className="w-full px-3 py-2 min-h-[44px] border rounded-lg focus:ring-2 focus:ring-[#2B4C3E] outline-none" value={giaVonDuKien} onChange={e => setGiaVonDuKien(Number(e.target.value)||"")} placeholder="VD: 110000" />
                 </div>
                 <div>
                    <label className="text-sm font-bold text-slate-700 block mb-1.5">Giá Bán Dự Kiến</label>
                    <input type="number" className="w-full px-3 py-2 min-h-[44px] border rounded-lg focus:ring-2 focus:ring-[#2B4C3E] outline-none" value={giaBanDuKien} onChange={e => setGiaBanDuKien(Number(e.target.value)||"")} placeholder="VD: 250000" />
                 </div>
               </div>
               
               <div className="mt-4">
                  <label className="text-sm font-bold text-slate-700 block mb-1.5">Ghi chú & Đặc tả</label>
                  <textarea className="w-full px-3 py-2 min-h-[44px] border rounded-lg focus:ring-2 focus:ring-[#2B4C3E] outline-none" value={ghiChu} onChange={e => setGhiChu(e.target.value)} rows={3} placeholder="VD: Chất liệu cotton co giãn, thiết kế trẻ trung..."></textarea>
               </div>
            </div>

            {/* BẢNG SIZE đã chuyển lên đầu modal */}

            <div className="bg-white p-4 md:p-5 rounded-lg border border-slate-200 shadow-sm">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 border-b pb-3">
                  <h3 className="text-lg font-bold text-[#2B4C3E] uppercase tracking-wide">BẢNG MÀU & HÌNH ẢNH</h3>
                  <button onClick={() => setDsMau([...dsMau, { ten: "", maSKU: "", dinhMuc: 0.25, img: "" }])} className="w-full sm:w-auto text-sm font-bold bg-[#2B4C3E] text-white px-4 py-2 min-h-[44px] rounded-lg flex items-center justify-center gap-2 hover:bg-[#1A3329] transition-colors">
                    <Plus className="w-4 h-4"/> Thêm Màu
                  </button>
               </div>

               <div className="space-y-4">
                 {dsMau.map((mau, idx) => (
                   <div key={idx} className="flex flex-col md:flex-row gap-4 p-4 bg-slate-50 border rounded-lg relative group">
                      <button onClick={() => setDsMau(dsMau.filter((_, i) => i !== idx))} className="absolute top-2 right-2 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors z-10">
                        <Trash2 className="w-5 h-5" />
                      </button>
                      
                      <div className="w-full md:w-40 h-48 md:h-40 bg-white border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center relative overflow-hidden group-hover:border-[#2B4C3E] transition-colors shrink-0">
                        {mau.img ? (
                          <img src={mau.img} className="w-full h-full object-cover" alt="Color variant" />
                        ) : (
                          <div className="text-center text-slate-400">
                            <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                            <span className="text-[10px] font-medium">Chưa có ảnh</span>
                          </div>
                        )}
                        
                        <div className="absolute inset-0 bg-black/60 flex-col items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity flex">
                          <button onClick={() => setAiMockupIdx(idx)} className="px-4 py-2 min-h-[44px] bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-lg hover:scale-105 transition-transform w-3/4 justify-center">
                            <Wand2 className="w-4 h-4"/> AI MOCKUP
                          </button>
                          <button onClick={() => handleImageUpload(idx)} className="px-4 py-2 min-h-[44px] bg-white text-slate-800 text-xs font-bold rounded-lg flex items-center gap-2 shadow-lg hover:scale-105 transition-transform w-3/4 justify-center">
                            <Plus className="w-4 h-4"/> TẢI ẢNH LÊN
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 content-start">
                         <div>
                           <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Tên Màu</label>
                           <input className="w-full px-3 py-2 min-h-[44px] border rounded-lg text-sm font-semibold outline-none focus:border-[#2B4C3E]" placeholder="VD: Đen" value={mau.ten} onChange={e => {
                             const n = [...dsMau]; n[idx].ten = e.target.value; setDsMau(n);
                           }} />
                         </div>
                         <div>
                           <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Mã Biến Thể (SKU)</label>
                           <input className="w-full px-3 py-2 min-h-[44px] border rounded-lg text-sm text-slate-600 outline-none focus:border-[#2B4C3E]" placeholder="Tự động hoặc nhập..." value={mau.maSKU} onChange={e => {
                             const n = [...dsMau]; n[idx].maSKU = e.target.value; setDsMau(n);
                           }} />
                         </div>
                         <div className="md:col-span-2">
                           <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Định Mức Vải (Kg/SP)</label>
                           <input type="number" step="0.01" className="w-full px-3 py-2 min-h-[44px] border rounded-lg text-sm font-mono text-emerald-700 outline-none focus:border-emerald-500" value={mau.dinhMuc} onChange={e => {
                             const n = [...dsMau]; n[idx].dinhMuc = Number(e.target.value) || 0; setDsMau(n);
                           }} />
                         </div>
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>

          <div className="bg-[#1A3329] p-4 flex flex-col sm:flex-row items-center justify-end gap-3 shrink-0">
            <button onClick={onClose} className="w-full sm:w-auto px-6 py-2 min-h-[44px] rounded-lg font-bold text-slate-300 hover:bg-slate-800 transition-colors border border-slate-600">
               Huỷ Bỏ
            </button>
            <button onClick={handleSave} className="w-full sm:w-auto px-6 py-2 min-h-[44px] rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg flex items-center justify-center gap-2">
               <Save className="w-5 h-5"/> {editId ? "LƯU CẬP NHẬT" : "TẠO MÃ SẢN PHẨM"}
            </button>
          </div>

        </div>
      </div>
      </Portal>

      {aiMockupIdx !== null && (
        <AIMockupModal
          open={true}
          onClose={() => setAiMockupIdx(null)}
          onApply={(url) => {
             const n = [...dsMau];
             n[aiMockupIdx].img = url;
             setDsMau(n);
             setAiMockupIdx(null);
          }}
          colorIndex={aiMockupIdx}
          colorName={dsMau[aiMockupIdx]?.ten || ""}
          productName={tenSP}
          defaultPrompt={buildAiPrompt(aiMockupIdx)}
        />
      )}
    </>
  );
}
