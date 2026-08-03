"use client";

import { useEffect, useState } from "react";
import { X, Plus, Trash2, Wand2, Shirt, Save, Info, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { AIMockupModal } from "@/components/AIMockupModal";
import { useDanhMucSP, type SanPham, type MauTieuChuan, type BangSize } from "@/lib/data/danh-muc-sp-store";
import { type LoaiSP, LOAI_SP_LABELS } from "@/lib/data/lenh-cat-store";
import { SIZE_RATIO_5SIZE } from "@/lib/size-ratio-presets";

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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#2B4C3E]/80 backdrop-blur-sm p-4 animate-fade-in">
      <div 
        className="bg-[#F4F1EA] rounded-xl shadow-2xl max-w-4xl w-full max-h-[96vh] overflow-hidden flex flex-col border-4 border-[#2B4C3E]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 bg-[#2B4C3E]">
          <h2 className="text-white font-bold ml-2 text-lg flex items-center gap-2">
            <Shirt className="w-5 h-5" />
            {editId ? `SỬA SẢN PHẨM: ${editId}` : "TẠO MÃ SẢN PHẨM MỚI (MASTER DATA)"}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
             <h3 className="text-lg font-bold text-[#2B4C3E] uppercase tracking-wide mb-4 border-b pb-2">THÔNG TIN CƠ BẢN</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1">Mã SP *</label>
                  <input className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-[#2B4C3E]" value={maSP} onChange={e => setMaSP(e.target.value.toUpperCase())} placeholder="VD: M001" disabled={!!editId} />
               </div>
               <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1">Tên SP *</label>
                  <input className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-[#2B4C3E]" value={tenSP} onChange={e => setTenSP(e.target.value)} placeholder="VD: Bộ Thể Thao Nam" />
               </div>
               <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1">Loại Sản Phẩm *</label>
                  <select className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-[#2B4C3E]" value={loaiSP} onChange={e => setLoaiSP(e.target.value as LoaiSP)}>
                    {Object.entries(LOAI_SP_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
               </div>
               <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1">Bảng Size (Tỉ lệ mẫu) *</label>
                  <select
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-[#2B4C3E]"
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
                  <label className="text-sm font-bold text-slate-700 block mb-1">Giá Vốn Dự Kiến (COGS)</label>
                  <input type="number" className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-[#2B4C3E]" value={giaVonDuKien} onChange={e => setGiaVonDuKien(Number(e.target.value)||"")} placeholder="VD: 110000" />
               </div>
               <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1">Giá Bán Dự Kiến</label>
                  <input type="number" className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-[#2B4C3E]" value={giaBanDuKien} onChange={e => setGiaBanDuKien(Number(e.target.value)||"")} placeholder="VD: 250000" />
               </div>
             </div>
             
             <div className="mt-4">
                <label className="text-sm font-bold text-slate-700 block mb-1">Ghi chú & Đặc tả</label>
                <textarea className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-[#2B4C3E]" value={ghiChu} onChange={e => setGhiChu(e.target.value)} rows={3} placeholder="VD: Chất liệu cotton co giãn, thiết kế trẻ trung..."></textarea>
             </div>
          </div>

          {/* BẢNG SIZE (5 size: M, L, XL, 2XL, 3XL) */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
             <h3 className="text-lg font-bold text-[#2B4C3E] uppercase tracking-wide mb-4 border-b pb-2 flex items-center gap-2">
               📐 BẢNG SIZE (M, L, XL, 2XL, 3XL)
             </h3>
             <div className="grid grid-cols-5 gap-3">
               {bangSize.sizes.map((size, idx) => (
                 <div key={size} className="text-center">
                   <label className="text-xs font-bold text-slate-600 uppercase block mb-1">{size}</label>
                   <input
                     type="number"
                     min="0"
                     className="w-full px-2 py-3 border-2 border-slate-200 rounded text-center font-bold text-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                     value={bangSize.ratios[idx]}
                     onChange={(e) => {
                       const n = [...bangSize.ratios] as [number, number, number, number, number];
                       n[idx] = Number(e.target.value) || 0;
                       const riSo = n.reduce((a, b) => a + b, 0);
                       setBangSize({ ...bangSize, ratios: n, riSo });
                       setTiLeSize(n.join(":"));
                     }}
                   />
                 </div>
               ))}
             </div>
             <div className="mt-4 flex flex-wrap items-center gap-3">
               <div className="px-3 py-2 bg-blue-50 border-2 border-blue-200 rounded-lg">
                 <span className="text-xs font-semibold text-blue-600 block">TỈ LỆ</span>
                 <span className="font-mono font-bold text-blue-900 text-lg">{bangSize.ratios.join(":")}</span>
               </div>
               <div className="px-3 py-2 bg-emerald-50 border-2 border-emerald-200 rounded-lg">
                 <span className="text-xs font-semibold text-emerald-600 block">RÌ (1 RI = )</span>
                 <span className="font-mono font-bold text-emerald-900 text-lg">{bangSize.riSo} SP</span>
               </div>
               {bangSize.riSo > 0 && (
                 <div className="px-3 py-2 bg-amber-50 border-2 border-amber-200 rounded-lg">
                   <span className="text-xs font-semibold text-amber-600 block">VD 100 SP = {Math.floor(100 / bangSize.riSo)} rì</span>
                   <span className="text-[10px] text-amber-700">→ M: {Math.floor((100 / bangSize.riSo) * bangSize.ratios[0])}, L: {Math.floor((100 / bangSize.riSo) * bangSize.ratios[1])}, XL: {Math.floor((100 / bangSize.riSo) * bangSize.ratios[2])}, 2XL: {Math.floor((100 / bangSize.riSo) * bangSize.ratios[3])}, 3XL: {Math.floor((100 / bangSize.riSo) * bangSize.ratios[4])}</span>
                 </div>
               )}
             </div>
             <p className="text-xs text-slate-500 mt-3 italic">
               💡 Mỗi màu trong Bảng Màu bên dưới sẽ áp dụng tỉ lệ này. Khi tạo lệnh cắt → hệ thống tự tính SL từng size.
             </p>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
             <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h3 className="text-lg font-bold text-[#2B4C3E] uppercase tracking-wide">BẢNG MÀU & HÌNH ẢNH</h3>
                <button onClick={() => setDsMau([...dsMau, { ten: "", maSKU: "", dinhMuc: 0.25, img: "" }])} className="text-sm font-bold bg-[#2B4C3E] text-white px-3 py-1.5 rounded flex items-center gap-1 hover:bg-[#1A3329]">
                  <Plus className="w-4 h-4"/> Thêm Màu
                </button>
             </div>

             <div className="space-y-4">
               {dsMau.map((mau, idx) => (
                 <div key={idx} className="flex flex-col md:flex-row gap-4 p-4 bg-slate-50 border rounded-lg relative group">
                    <button onClick={() => setDsMau(dsMau.filter((_, i) => i !== idx))} className="absolute top-2 right-2 text-slate-300 hover:text-rose-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <div className="w-32 h-32 md:w-40 md:h-40 bg-white border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center relative overflow-hidden group-hover:border-[#2B4C3E] transition-colors shrink-0">
                      {mau.img ? (
                        <img src={mau.img} className="w-full h-full object-cover" alt="Color variant" />
                      ) : (
                        <div className="text-center text-slate-400">
                          <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                          <span className="text-[10px] font-medium">Chưa có ảnh</span>
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-black/60 flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex">
                        <button onClick={() => setAiMockupIdx(idx)} className="px-3 py-1.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-bold rounded flex items-center gap-1 shadow-lg hover:scale-105 transition-transform">
                          <Wand2 className="w-3 h-3"/> AI MOCKUP
                        </button>
                        <button onClick={() => handleImageUpload(idx)} className="px-3 py-1.5 bg-white text-slate-800 text-xs font-bold rounded flex items-center gap-1 shadow-lg hover:scale-105 transition-transform">
                          <Plus className="w-3 h-3"/> TẢI ẢNH LÊN
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 content-start">
                       <div>
                         <label className="text-xs font-bold text-slate-500 uppercase">Tên Màu</label>
                         <input className="w-full px-2 py-1.5 border rounded text-sm font-semibold" placeholder="VD: Đen" value={mau.ten} onChange={e => {
                           const n = [...dsMau]; n[idx].ten = e.target.value; setDsMau(n);
                         }} />
                       </div>
                       <div>
                         <label className="text-xs font-bold text-slate-500 uppercase">Mã Biến Thể (SKU)</label>
                         <input className="w-full px-2 py-1.5 border rounded text-sm text-slate-600" placeholder="Tự động hoặc nhập..." value={mau.maSKU} onChange={e => {
                           const n = [...dsMau]; n[idx].maSKU = e.target.value; setDsMau(n);
                         }} />
                       </div>
                       <div>
                         <label className="text-xs font-bold text-slate-500 uppercase">Định Mức Vải (Kg/SP)</label>
                         <input type="number" step="0.01" className="w-full px-2 py-1.5 border rounded text-sm font-mono text-emerald-700" value={mau.dinhMuc} onChange={e => {
                           const n = [...dsMau]; n[idx].dinhMuc = Number(e.target.value) || 0; setDsMau(n);
                         }} />
                       </div>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        </div>

        <div className="bg-[#1A3329] p-4 flex items-center justify-end gap-3 border-t border-white/10">
          <button onClick={onClose} className="px-6 py-2 rounded font-bold text-slate-300 hover:bg-slate-800 transition-colors border border-slate-600">
             Huỷ Bỏ
          </button>
          <button onClick={handleSave} className="px-6 py-2 rounded font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg flex items-center gap-2">
             <Save className="w-4 h-4"/> {editId ? "LƯU CẬP NHẬT" : "TẠO MÃ SẢN PHẨM"}
          </button>
        </div>

      </div>

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
    </div>
  );
}
