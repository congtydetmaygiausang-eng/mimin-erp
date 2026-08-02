"use client";

// ============ LENH CAT MODAL (Giai đoạn 1 - Mavis) ============
// Form 4 sections theo layout anh Sang yeu cau:
//   Section 1: Thong tin chung & Ke hoach (Loai SP, Ma SP, Tong SL, Size, Han, Phu trach Cat)
//   Section 2: Vai (multi-mau, so kg, don gia) → auto tinh gia vai BQ
//   Section 3: Phu lieu (Bo co, Khoa, Cuc, Chi, Nhan, Tui PE...) → auto tinh chi phi / SP
//   Section 4: Phan cong gia cong 5 khau (Cat, May Ao, May Quan, InTheu, UiQC)
//   Section 5: Bang tinh gia von san xuat (COGS) tu dong
// Buttons: [Huy bo] [Phat lenh & Dieu chuyen]
//
// Giai doan 1: Focus Section 1 + 5 (form + COGS auto + luu DB)
// Giai doan 2 (sau): Auto tru kho + Phan cong/Cong no

import { useEffect, useMemo, useState } from "react";
import {
  X, Plus, Trash2, AlertTriangle, Sparkles, Shirt, Package, Scissors,
  Calculator, TrendingUp, Save, Send, ChevronDown, ChevronUp, Info,
} from "lucide-react";
import { toast } from "sonner";
import { KHO_VAI, KHO_VAT_TU, formatVND, formatVNDShort } from "@/lib/data/real-data";
import { REAL_NHAN_VIEN } from "@/lib/real-workflow-data";
import {
  type LenhCat, type LoaiSP, type LenhCatVai, type LenhCatPhuLieu,
  type PhanCongGiaCong, type TrangThaiLenhCat,
  LOAI_SP_LABELS, TRANG_THAI_LC_LABELS, TRANG_THAI_LC_STYLE,
  tinhCOGS, useLenhCat,
} from "@/lib/data/lenh-cat-store";

// Constants
const SIZE_OPTIONS = ["S", "M", "L", "XL", "2XL", "3XL"];
const DEFAULT_HAO_HUT = 1.5; // 1.5%
const DEFAULT_DON_GIA = {
  cat: 3500,
  mayAo: 22000,
  mayQuan: 18000,
  inTheu: 4500,
  uiQC: 3000,
};

interface Props {
  open: boolean;
  onClose: () => void;
  editId?: string | null; // Nếu có → edit mode, ngược lại → create
}

export default function LenhCatModal({ open, onClose, editId }: Props) {
  const { dsLenhCat, themLenhCat, suaLenhCat } = useLenhCat();
  const editing = editId ? dsLenhCat.find((l) => l.id === editId) : null;

  // ============ Form state ============
  const [loaiSP, setLoaiSP] = useState<LoaiSP>("BoTru");
  const [maSP, setMaSP] = useState("");
  const [tenSP, setTenSP] = useState("");
  const [tongSL, setTongSL] = useState<number | "">("");
  const [hanHoanThanh, setHanHoanThanh] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });
  const [phuTrachCat, setPhuTrachCat] = useState("NV006");
  const [ghiChu, setGhiChu] = useState("");

  // ============ Size Ratio Logic ============
  const TI_LE_OPTIONS = [
    { label: "Tự nhập tay", value: "custom" },
    { label: "S:M:L:XL (1:2:2:1)", value: "1:2:2:1", sizes: ["S", "M", "L", "XL"] },
    { label: "M:L:XL:2XL (1:2:2:1)", value: "0:1:2:2:1", sizes: ["M", "L", "XL", "2XL"] },
    { label: "S:M:L:XL:2XL (1:2:2:2:1)", value: "1:2:2:2:1", sizes: ["S", "M", "L", "XL", "2XL"] },
  ];
  const [tiLeSize, setTiLeSize] = useState("custom");
  const [phanBoSize, setPhanBoSize] = useState<{ size: string; sl: number }[]>([
    { size: "M", sl: 100 },
    { size: "L", sl: 200 },
    { size: "XL", sl: 150 },
    { size: "2XL", sl: 50 },
  ]);

  useEffect(() => {
    if (tiLeSize === "custom" || !tongSL) return;
    
    let ratioParts = [];
    let sizes = [];
    
    if (tiLeSize === "1:2:2:1") {
      ratioParts = [1, 2, 2, 1];
      sizes = ["S", "M", "L", "XL"];
    } else if (tiLeSize === "0:1:2:2:1") {
      ratioParts = [1, 2, 2, 1];
      sizes = ["M", "L", "XL", "2XL"];
    } else if (tiLeSize === "1:2:2:2:1") {
      ratioParts = [1, 2, 2, 2, 1];
      sizes = ["S", "M", "L", "XL", "2XL"];
    }

    const totalRatio = ratioParts.reduce((a, b) => a + b, 0);
    const baseQty = Math.floor((tongSL as number) / totalRatio);
    
    let newPhanBo = [];
    let currentSum = 0;
    
    for (let i = 0; i < ratioParts.length - 1; i++) {
      const qty = baseQty * ratioParts[i];
      newPhanBo.push({ size: sizes[i], sl: qty });
      currentSum += qty;
    }
    
    // Gán phần lẻ cho size cuối cùng để đảm bảo tổng đúng bằng tongSL
    newPhanBo.push({ size: sizes[sizes.length - 1], sl: (tongSL as number) - currentSum });
    
    setPhanBoSize(newPhanBo);
  }, [tiLeSize, tongSL]);

  const addSizeRow = () => {
    const used = new Set(phanBoSize.map((p) => p.size));
    const next = SIZE_OPTIONS.find((s) => !used.has(s));
    if (next) {
      setPhanBoSize((prev) => [...prev, { size: next, sl: 0 }]);
      setTiLeSize("custom");
    }
  };

  const updateSizeRow = (idx: number, field: "size" | "sl", value: string | number) => {
    setPhanBoSize((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
    if (field === "sl") setTiLeSize("custom");
  };

  const removeSizeRow = (idx: number) => {
    setPhanBoSize((prev) => prev.filter((_, i) => i !== idx));
    setTiLeSize("custom");
  };

  // ============ Mau Sac & Vai ============
  const [soMau, setSoMau] = useState(4);
  const [dsMau, setDsMau] = useState(Array.from({ length: 4 }).map(() => ({ 
    ten: "", maVai: "", dinhMuc: 0.25, sl: "", ghiChu: "", img: "" 
  })));

  useEffect(() => {
    setDsMau(prev => {
      if (prev.length === soMau) return prev;
      if (prev.length < soMau) {
        return [...prev, ...Array.from({ length: soMau - prev.length }).map(() => ({ 
          ten: "", maVai: "", dinhMuc: 0.25, sl: "", ghiChu: "", img: "" 
        }))];
      }
      return prev.slice(0, soMau);
    });
  }, [soMau]);

  // Section 3 - Phụ liệu
  const [dsPhuLieu, setDsPhuLieu] = useState<LenhCatPhuLieu[]>([]);
  // Section 4 - Phân công
  const [phanCong, setPhanCong] = useState<PhanCongGiaCong>({
    cat: { nguoiMa: "NV006", nguoiTen: "Nguyễn Hoàng Giang (Cắt)", donGia: DEFAULT_DON_GIA.cat },
    mayAo: { nguoiMa: "GS002", nguoiTen: "Xưởng may Liễu", donGia: DEFAULT_DON_GIA.mayAo },
    mayQuan: { nguoiMa: "GS001", nguoiTen: "Xưởng may Hương (Quần)", donGia: DEFAULT_DON_GIA.mayQuan },
    inTheu: { nguoiMa: "DT-IT-005", nguoiTen: "In Bảo Ngân", donGia: DEFAULT_DON_GIA.inTheu },
    uiQC: { nguoiMa: "NV010", nguoiTen: "Trương Minh Tâm (Ủi)", donGia: DEFAULT_DON_GIA.uiQC },
  });
  
  // Chi Phí Cố Định
  const [chiPhiCoDinh, setChiPhiCoDinh] = useState({
    baoBi: 1500,
    temNhan: 500,
    khauHao: 2000
  });

  const handleColorImageUpload = (idx: number) => {
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

  // ============ Load data khi edit ============
  useEffect(() => {
    if (editing) {
      setLoaiSP(editing.loaiSP);
      setMaSP(editing.maSP);
      setTenSP(editing.tenSP);
      setTongSL(editing.tongSL);
      setHanHoanThanh(editing.hanHoanThanh);
      setPhanBoSize(editing.phanBoSize);
      setPhuTrachCat(editing.phuTrachCat);
      setGhiChu(editing.ghiChu || "");
      setDsPhuLieu(editing.dsPhuLieu);
      setPhanCong(editing.phanCong);
      // setHaoHutPhanTram(editing.haoHutPhanTram);
    }
  }, [editing]);

  if (!open) return null;

  // ============ Calculate Auto Values ============
  const tongPhanBoSize = phanBoSize.reduce((s, p) => s + p.sl, 0);
  const sizeHopLe = tongSL !== "" && tongPhanBoSize === tongSL;

  // Tính tổng chi phí vải từ dsMau
  let tongTienVai = 0;
  dsMau.forEach(m => {
    if (m.maVai && m.sl && m.dinhMuc) {
      const v = KHO_VAI.find(x => x.maVT === m.maVai);
      if (v) {
        tongTienVai += (parseInt(m.sl) || 0) * (m.dinhMuc) * (v.donGia || 0);
      }
    }
  });

  let tongTienPhuLieu = dsPhuLieu.reduce((s, p) => s + p.soLuong * p.donGia, 0);
  
  let giaCong1SP = 0;
  Object.values(phanCong).forEach(kh => {
    if (kh && kh.donGia) giaCong1SP += kh.donGia;
  });

  const tongChiPhiCoDinh = chiPhiCoDinh.baoBi + chiPhiCoDinh.temNhan + chiPhiCoDinh.khauHao;
  
  // Tính COGS Bình Quân
  const validTongSL = (tongSL || 1) as number;
  const giaVonBinhQuan = (tongTienVai / validTongSL) + (tongTienPhuLieu / validTongSL) + giaCong1SP + tongChiPhiCoDinh;

  // ============ Render ============
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2B4C3E]/80 backdrop-blur-sm p-2 md:p-6 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-[#2B4C3E] rounded-xl shadow-2xl max-w-5xl w-full max-h-[96vh] overflow-hidden flex flex-col animate-slide-up border-4 border-[#2B4C3E]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Close */}
        <div className="flex justify-between items-center p-3 bg-[#2B4C3E]">
          <h2 className="text-white font-bold ml-2">TẠO LỆNH CẮT MỚI (LC-2026-XXXX)</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#F4F1EA]">
          
          {/* KHỐI 1: THÔNG TIN CHÍNH CỦA LỆNH CẮT */}
          <div className="p-6 border-b-[8px] border-[#2B4C3E]">
            <h2 className="text-xl font-bold text-[#2B4C3E] mb-6 uppercase tracking-wide">THÔNG TIN CHÍNH CỦA LÊNH CẮT</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Cột trái */}
              <div className="space-y-5">
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1">Loại SP *</label>
                  <select className="w-full px-3 py-2 bg-white border-2 border-red-500 rounded focus:outline-none focus:ring-2 focus:ring-[#2B4C3E]" value={loaiSP} onChange={(e) => setLoaiSP(e.target.value as LoaiSP)}>
                    {Object.entries(LOAI_SP_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1">Mã SP *</label>
                  <input className="w-full px-3 py-2 bg-white border-2 border-red-500 rounded focus:outline-none focus:ring-2 focus:ring-[#2B4C3E]" value={maSP} onChange={(e) => setMaSP(e.target.value.toUpperCase())} placeholder="VD: M001" />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1">Tên SP *</label>
                  <input className="w-full px-3 py-2 bg-white border-2 border-red-500 rounded focus:outline-none focus:ring-2 focus:ring-[#2B4C3E]" value={tenSP} onChange={(e) => setTenSP(e.target.value)} placeholder="VD: Bộ Trụ" />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1">Tổng SL cắt *</label>
                  <input type="number" min={1} className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2B4C3E]" value={tongSL} onChange={(e) => setTongSL(e.target.value === "" ? "" : Math.max(1, parseInt(e.target.value) || 0))} placeholder="Nhập số lượng dự kiến..." />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1">Hạn hoàn thành *</label>
                  <input type="date" className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2B4C3E]" value={hanHoanThanh} onChange={(e) => setHanHoanThanh(e.target.value)} />
                </div>
              </div>

              {/* Cột phải */}
              <div className="space-y-5">
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1">Tỉ lệ size * (Chọn thả xuống)</label>
                  <select className="w-full px-3 py-2 bg-white border-2 border-red-500 rounded focus:outline-none focus:ring-2 focus:ring-[#2B4C3E]" value={tiLeSize} onChange={(e) => setTiLeSize(e.target.value)}>
                    {TI_LE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>

                <div className="bg-white p-4 rounded border-2 border-red-500">
                  <div className="flex items-center justify-between mb-3 border-b pb-2">
                    <label className="text-sm font-bold text-slate-700">Phân bổ size * <span className={`ml-2 text-xs ${sizeHopLe ? "text-emerald-600" : "text-rose-600"}`}>({tongPhanBoSize} / {tongSL || 0})</span></label>
                    <button onClick={addSizeRow} className="text-xs text-[#2B4C3E] hover:underline flex items-center font-bold">
                      <Plus className="w-3 h-3 mr-0.5" /> Thêm size
                    </button>
                  </div>
                  <div className="space-y-2">
                    {phanBoSize.map((p, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <select className="px-2 py-1.5 border border-slate-300 rounded focus:outline-none w-20 text-sm" value={p.size} onChange={(e) => updateSizeRow(idx, "size", e.target.value)}>
                          {SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <input type="number" min={0} className="px-2 py-1.5 border border-slate-300 rounded focus:outline-none flex-1 text-sm" value={p.sl} onChange={(e) => updateSizeRow(idx, "sl", Math.max(0, parseInt(e.target.value) || 0))} placeholder="Số lượng..." />
                        <span className="text-sm text-slate-500 w-6">cái</span>
                        <button onClick={() => removeSizeRow(idx)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* KHỐI 2: MÀU SẮC, VẢI, NGUYÊN PHỤ LIỆU */}
          <div className="bg-[#9ACBB8] p-6 border-b-[8px] border-[#2B4C3E]">
            <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-bold text-[#2B4C3E] uppercase tracking-wide">MÀU SẮC & NGUYÊN LIỆU</h2>
               <div className="flex items-center gap-2">
                 <label className="text-sm font-bold text-[#2B4C3E]">Số màu vải cắt:</label>
                 <input type="number" className="w-16 px-2 py-1 text-center rounded border border-white" value={soMau} onChange={e => setSoMau(Math.max(1, parseInt(e.target.value) || 1))} />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {dsMau.map((mau, idx) => (
                <div key={idx} className="bg-white rounded-lg shadow-md p-3 flex flex-col gap-3">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Màu {idx + 1}</div>
                  
                  <div 
                    className="relative w-full aspect-[4/5] bg-slate-100 border-2 border-dashed border-slate-300 rounded cursor-pointer overflow-hidden group hover:border-[#2B4C3E] transition-colors flex items-center justify-center"
                    onClick={() => handleColorImageUpload(idx)}
                  >
                    {mau.img ? (
                      <img src={mau.img} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center opacity-50 group-hover:opacity-100 transition-opacity">
                        <Plus className="w-8 h-8 text-[#2B4C3E]" />
                        <span className="text-xs mt-2 text-slate-600 font-medium">Tải ảnh</span>
                      </div>
                    )}
                  </div>

                  {/* Kho Vải */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 mb-1 block">Kho Vải Chính</label>
                    <select 
                      className="w-full px-2 py-1.5 border border-slate-200 text-sm rounded focus:outline-none focus:border-[#2B4C3E]" 
                      value={mau.maVai}
                      onChange={(e) => {
                        const next = [...dsMau];
                        next[idx].maVai = e.target.value;
                        setDsMau(next);
                      }}
                    >
                      <option value="">-- Chọn vải --</option>
                      {KHO_VAI.map((kv) => (
                        <option key={kv.maVT} value={kv.maVT}>{kv.maVT} - {kv.tenVT}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Định mức sơ đồ */}
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold text-slate-500 w-1/2 block">Định mức (kg/sp):</label>
                    <input 
                      type="number" step="0.01"
                      className="w-1/2 px-2 py-1.5 border border-slate-200 text-sm rounded focus:outline-none focus:border-[#2B4C3E]" 
                      value={mau.dinhMuc}
                      onChange={(e) => {
                        const next = [...dsMau];
                        next[idx].dinhMuc = parseFloat(e.target.value) || 0;
                        setDsMau(next);
                      }}
                    />
                  </div>

                  {/* Số lượng */}
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold text-slate-500 w-1/2 block">SL Dự kiến cắt:</label>
                    <input 
                      type="number" 
                      className="w-1/2 px-2 py-1.5 border border-slate-200 text-sm rounded focus:outline-none focus:border-[#2B4C3E]" 
                      value={mau.sl}
                      placeholder="VD: 125"
                      onChange={(e) => {
                        const next = [...dsMau];
                        next[idx].sl = e.target.value;
                        setDsMau(next);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Nguyên Phụ Liệu Kèm Theo */}
            <div className="bg-white/40 p-4 rounded-lg">
               <div className="flex items-center justify-between mb-3">
                 <h3 className="font-bold text-slate-800 text-sm">Nguyên Phụ Liệu (Bo cổ, Bo tay, Chỉ...)</h3>
                 <button 
                  onClick={() => {
                    const p = KHO_VAT_TU[0];
                    setDsPhuLieu(prev => [...prev, { maPL: p.maVT, tenPL: p.tenVT, soLuong: (tongSL as number) || 500, donGia: p.donGia || 1000, dvt: p.dvt || "cái" }]);
                  }}
                  className="px-3 py-1 bg-[#2B4C3E] text-white text-xs rounded hover:bg-[#2B4C3E]/80 transition flex items-center gap-1"
                 >
                   <Plus className="w-3 h-3"/> Thêm phụ liệu
                 </button>
               </div>
               
               <div className="space-y-2">
                 {dsPhuLieu.map((p, idx) => (
                   <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded shadow-sm">
                     <select className="col-span-4 text-sm p-1.5 border rounded" value={p.maPL} onChange={e => {
                       const v = KHO_VAT_TU.find(x => x.maVT === e.target.value);
                       if(v) {
                         const next = [...dsPhuLieu];
                         next[idx] = { ...next[idx], maPL: v.maVT, tenPL: v.tenVT, donGia: v.donGia || 0, dvt: v.dvt || "cái" };
                         setDsPhuLieu(next);
                       }
                     }}>
                       {KHO_VAT_TU.map(v => <option key={v.maVT} value={v.maVT}>{v.tenVT}</option>)}
                     </select>
                     <input type="number" className="col-span-2 text-sm p-1.5 border rounded" value={p.soLuong} onChange={e => {
                       const next = [...dsPhuLieu]; next[idx].soLuong = parseInt(e.target.value) || 0; setDsPhuLieu(next);
                     }} placeholder="Số lượng..." />
                     <div className="col-span-1 text-xs text-center text-slate-500">{p.dvt}</div>
                     <input type="number" className="col-span-2 text-sm p-1.5 border rounded" value={p.donGia} onChange={e => {
                       const next = [...dsPhuLieu]; next[idx].donGia = parseInt(e.target.value) || 0; setDsPhuLieu(next);
                     }} placeholder="Đơn giá..." />
                     <div className="col-span-2 text-right text-sm font-bold text-emerald-600">{formatVNDShort(p.soLuong * p.donGia)}</div>
                     <button onClick={() => setDsPhuLieu(prev => prev.filter((_, i) => i !== idx))} className="col-span-1 text-rose-500 p-1 flex justify-center"><Trash2 className="w-4 h-4"/></button>
                   </div>
                 ))}
                 {dsPhuLieu.length === 0 && <div className="text-center text-sm text-slate-600 py-2">Chưa chọn phụ liệu đi kèm</div>}
               </div>
            </div>
          </div>

          {/* KHỐI 3: GIA CÔNG VÀ ĐƠN GIÁ (NỀN CAM) */}
          <div className="bg-[#F0A619] p-6 pb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6 uppercase tracking-wide drop-shadow-sm">
              THÔNG TIN người phụ trách và đơn giá công đoạn
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cột Công đoạn Gia Công */}
              <div className="bg-white/20 p-4 rounded-xl">
                <h3 className="font-bold text-slate-800 mb-3 border-b border-black/10 pb-2">1. GIA CÔNG SẢN XUẤT</h3>
                <div className="grid grid-cols-12 gap-2 mb-2 text-xs font-bold text-slate-800 uppercase px-2">
                  <div className="col-span-3">Công Đoạn</div>
                  <div className="col-span-6">Người Phụ Trách</div>
                  <div className="col-span-3 text-right">Đơn Giá</div>
                </div>
                
                <div className="space-y-2.5">
                  {[
                    { key: "cat", label: "Cắt", bp: "Cắt" },
                    { key: "mayAo", label: "May Áo", bp: "May" },
                    { key: "mayQuan", label: "May Quần", bp: "May" },
                    { key: "inTheu", label: "In/Thêu", bp: "In" },
                    { key: "uiQC", label: "Ủi/Đóng Gói", bp: "Ủi" },
                  ].map((kh) => {
                    const curr = phanCong[kh.key as keyof PhanCongGiaCong];
                    if (!curr) return null;
                    return (
                      <div key={kh.key} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded shadow-sm">
                        <div className="col-span-3 font-semibold text-slate-700 text-sm">{kh.label}</div>
                        <select 
                          className="col-span-6 px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:border-[#F0A619]"
                          value={curr.nguoiMa}
                          onChange={(e) => {
                            const maNV = e.target.value;
                            const nv = REAL_NHAN_VIEN.find(n => n.ma === maNV);
                            setPhanCong(prev => ({ ...prev, [kh.key]: { ...prev[kh.key as keyof PhanCongGiaCong], nguoiMa: maNV, nguoiTen: nv?.ten || maNV } }));
                          }}
                        >
                          {REAL_NHAN_VIEN.filter(n => n.boPhan?.toLowerCase().includes(kh.bp.toLowerCase()) || n.chucVu?.toLowerCase().includes("gia công")).map(n => (
                            <option key={n.ma} value={n.ma}>{n.ma} - {n.ten}</option>
                          ))}
                        </select>
                        <div className="col-span-3 relative">
                          <input 
                            type="number" 
                            min={0}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm text-right pr-6 focus:outline-none focus:border-[#F0A619]"
                            value={curr.donGia}
                            onChange={(e) => setPhanCong(prev => ({ ...prev, [kh.key]: { ...prev[kh.key as keyof PhanCongGiaCong], donGia: parseInt(e.target.value) || 0 } }))}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">đ</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cột Chi Phí Cố Định & Tổng Kết COGS */}
              <div className="flex flex-col gap-4">
                <div className="bg-white/20 p-4 rounded-xl">
                  <h3 className="font-bold text-slate-800 mb-3 border-b border-black/10 pb-2">2. CHI PHÍ CỐ ĐỊNH / SẢN PHẨM</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-white p-2 rounded shadow-sm">
                      <span className="text-sm font-semibold text-slate-700">Bao bì, Túi PE</span>
                      <input type="number" className="w-24 px-2 py-1 text-sm text-right border rounded" value={chiPhiCoDinh.baoBi} onChange={e => setChiPhiCoDinh(p => ({...p, baoBi: parseInt(e.target.value)||0}))} />
                    </div>
                    <div className="flex justify-between items-center bg-white p-2 rounded shadow-sm">
                      <span className="text-sm font-semibold text-slate-700">Tem, Nhãn mác</span>
                      <input type="number" className="w-24 px-2 py-1 text-sm text-right border rounded" value={chiPhiCoDinh.temNhan} onChange={e => setChiPhiCoDinh(p => ({...p, temNhan: parseInt(e.target.value)||0}))} />
                    </div>
                    <div className="flex justify-between items-center bg-white p-2 rounded shadow-sm">
                      <span className="text-sm font-semibold text-slate-700">Khấu hao máy, Điện nước</span>
                      <input type="number" className="w-24 px-2 py-1 text-sm text-right border rounded" value={chiPhiCoDinh.khauHao} onChange={e => setChiPhiCoDinh(p => ({...p, khauHao: parseInt(e.target.value)||0}))} />
                    </div>
                  </div>
                </div>

                <div className="bg-[#2B4C3E] text-white p-4 rounded-xl shadow-lg mt-auto flex flex-col justify-center">
                  <div className="text-center text-sm text-emerald-200 mb-1">TỔNG CỘNG TẤT CẢ GIÁ BÌNH QUÂN / SP =</div>
                  <div className="text-3xl font-bold text-center text-yellow-400">
                    {formatVND(giaVonBinhQuan)}
                  </div>
                  <div className="mt-4 text-xs opacity-70 grid grid-cols-2 gap-x-4 gap-y-1">
                    <div className="flex justify-between"><span>Vải chính:</span> <span>{formatVND(tongTienVai / validTongSL)}</span></div>
                    <div className="flex justify-between"><span>Phụ liệu:</span> <span>{formatVND(tongTienPhuLieu / validTongSL)}</span></div>
                    <div className="flex justify-between"><span>Gia công:</span> <span>{formatVND(giaCong1SP)}</span></div>
                    <div className="flex justify-between"><span>Cố định:</span> <span>{formatVND(tongChiPhiCoDinh)}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>

        {/* Footer Buttons */}
        <div className="bg-[#2B4C3E] p-4 flex items-center justify-end gap-3 border-t border-white/20">
          <button onClick={onClose} className="px-5 py-2.5 rounded text-white bg-transparent hover:bg-white/10 transition-colors">
            Hủy bỏ
          </button>
          
          <button 
            className="px-6 py-2.5 rounded font-bold text-slate-800 bg-emerald-400 hover:bg-emerald-300 transition-colors shadow-lg flex items-center gap-2"
            onClick={() => {
              // Lưu trạng thái nháp
              toast.success("Đã lưu nháp Lệnh Cắt");
              onClose();
            }}
          >
            <Save className="w-5 h-5" />
            Lưu Nháp
          </button>

          <button 
            className="px-6 py-2.5 rounded font-bold text-slate-900 bg-[#F0A619] hover:bg-[#F0A619]/90 transition-colors shadow-lg flex items-center gap-2"
            onClick={() => {
              // Phát lệnh
              toast.success("Đã phát lệnh & Chuyển khâu tiếp nhận");
              onClose();
            }}
          >
            <Send className="w-5 h-5" />
            Phát Lệnh (Chuyển khâu tiếp nhận)
          </button>
        </div>
      </div>
    </div>
  );
}
