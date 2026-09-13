// ============ PRODUCT FORM MODAL (Add/Edit) ============
// Tach tu page.tsx (2026-08-05 - toi uu B.2)
// 2026-08-24: Chế độ Thêm mới cho phép nhập NHIỀU biến thể (màu) cùng lúc,
// mỗi biến thể có tỉ lệ size + số lượng theo từng size + đủ giá vốn/giá bán/
// giá bán sỉ/giá bán lẻ/giá bán lô - phục vụ nhập lô hàng tồn kho hiện tại.
// Chế độ Sửa giữ nguyên form 1 biến thể như cũ (sửa 1 dòng tồn kho có sẵn).

import { useState, useRef, useEffect } from "react";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { Camera, Save, Plus, Trash2, Package, Calculator, X } from "lucide-react";
import { toast } from "sonner";
import { DS_TI_LE_SIZE, DS_KHU_KE_HANG, DS_KENH_BAN, ALL_PHIEU, type KenhBan, type SanPhamTP } from "../data";
import {
  SIZE_RATIO_PRESETS,
  type SizeRatioPreset,
  loadSharedSizeRatioPresets,
  buildCustomSizeRatioPreset,
  saveSharedSizeRatioPreset,
} from "@/lib/size-ratio-presets";
import { uploadProductFile } from "@/lib/product-upload";
import { LOAI_SP_LABELS, type LoaiSP } from "@/lib/data/lenh-cat-store";

// Chỉ còn Màu + số lượng theo size là khác nhau giữa các biến thể - mọi thứ
// khác (mã/tên SP, phân loại, tỉ lệ size, giá vốn/bán/sỉ/lẻ/lô) đều dùng
// CHUNG cho cả lô, nhập 1 lần ở đầu form (theo đúng góp ý thực tế: 1 lô hàng
// nhập về nhiều màu nhưng cùng 1 mã hàng thì giá và tỉ lệ size luôn giống
// nhau, không có lý do phải gõ lại cho từng màu).
type BienTheDraft = {
  mau: string;
  img: string;
  sizes: { size: string; sl: number }[];
  slDuKien: number;
  viTri: string;
  trangThai: SanPhamTP["trangThai"];
  ghiChu: string;
  kenhBan: KenhBan[];
};

function bienTheMoi(sizes: string[]): BienTheDraft {
  return {
    mau: "",
    img: "",
    sizes: sizes.map((s) => ({ size: s, sl: 0 })),
    slDuKien: 0,
    viTri: "",
    trangThai: "con",
    ghiChu: "",
    kenhBan: ["ban-le"],
  };
}

function phanBoTheoTiLe(ratios: number[], sizes: string[], slDuKien: number): { size: string; sl: number }[] {
  const tongTiLe = ratios.reduce((a, b) => a + b, 0) || 1;
  const base = Math.floor(slDuKien / tongTiLe);
  return sizes.map((s, i) => ({ size: s, sl: base * (ratios[i] || 0) }));
}

export function ProductFormModal({ sp, initialImage, onClose, onSave }: { sp?: SanPhamTP; initialImage?: string; onClose: () => void; onSave: (data: any) => void }) {
  if (sp) {
    return <SuaBienTheForm sp={sp} initialImage={initialImage} onClose={onClose} onSave={onSave} />;
  }
  return <ThemNhieuBienTheForm onClose={onClose} onSave={onSave} />;
}

// =================== THÊM MỚI - NHIỀU BIẾN THỂ ===================
function ThemNhieuBienTheForm({ onClose, onSave }: { onClose: () => void; onSave: (data: any[]) => void }) {
  // === Thông tin CHUNG cho cả lô (nhập 1 lần) ===
  const [maSP, setMaSP] = useState("");
  const [tenSP, setTenSP] = useState("");
  const [phanLoai, setPhanLoai] = useState<string>("BoTru");
  const [lsx, setLsx] = useState("LSX-2026-007");
  const [ngayNhap, setNgayNhap] = useState(new Date().toISOString().slice(0, 10));
  const [presetId, setPresetId] = useState(SIZE_RATIO_PRESETS[0].id);
  const [giaVon, setGiaVon] = useState(0);
  const [donGia, setDonGia] = useState(0);
  const [giaBanSi, setGiaBanSi] = useState(0);
  const [giaBanLe, setGiaBanLe] = useState(0);
  const [giaBanLo, setGiaBanLo] = useState(0);
  const [giaTikTok, setGiaTikTok] = useState(0);
  const [giaShopee, setGiaShopee] = useState(0);
  const [customPresets, setCustomPresets] = useState<SizeRatioPreset[]>([]);
  const [openSizeBuilder, setOpenSizeBuilder] = useState(false);
  useEffect(() => {
    let active = true;
    loadSharedSizeRatioPresets().then((items) => {
      if (active) setCustomPresets(items);
    });
    return () => { active = false; };
  }, []);

  const allPresets = [...SIZE_RATIO_PRESETS, ...customPresets];
  const preset = allPresets.find((p) => p.id === presetId) || SIZE_RATIO_PRESETS[0];

  const handleLuuBangSizeMoi = async (p: SizeRatioPreset) => {
    try {
      const updated = await saveSharedSizeRatioPreset(p);
      setCustomPresets(updated);
      doiPresetChung(p.id, [...SIZE_RATIO_PRESETS, ...updated]);
      setOpenSizeBuilder(false);
      toast.success(`Đã lưu bảng size "${p.label}" lên Supabase`);
    } catch (error) {
      toast.error(`Chưa lưu được bảng size: ${error instanceof Error ? error.message : "Lỗi không xác định"}`);
    }
  };

  // === Danh sách biến thể (chỉ khác Màu + số lượng theo size) ===
  const [bienThe, setBienThe] = useState<BienTheDraft[]>([bienTheMoi(preset.sizes)]);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});

  // Đổi tỉ lệ size chung -> áp lại size list cho MỌI biến thể đang có.
  // Nhận thêm `fromList` (dùng khi vừa lưu 1 bảng size mới, tránh phụ thuộc
  // vào customPresets trong closure vì setCustomPresets chưa kịp cập nhật).
  const doiPresetChung = (id: string, fromList: SizeRatioPreset[] = allPresets) => {
    const p = fromList.find((x) => x.id === id) || SIZE_RATIO_PRESETS[0];
    setPresetId(id);
    setBienThe((prev) => prev.map((bt) => ({ ...bt, sizes: p.sizes.map((s) => ({ size: s, sl: 0 })), slDuKien: 0 })));
  };

  const capNhatBienThe = (idx: number, patch: Partial<BienTheDraft>) => {
    setBienThe((prev) => prev.map((bt, i) => (i === idx ? { ...bt, ...patch } : bt)));
  };

  const doiSlDuKien = (idx: number, sl: number) => {
    capNhatBienThe(idx, { slDuKien: sl, sizes: phanBoTheoTiLe(preset.ratios, preset.sizes, sl) });
  };

  const doiSizeSL = (idx: number, sizeIdx: number, sl: number) => {
    setBienThe((prev) => prev.map((bt, i) => {
      if (i !== idx) return bt;
      const sizes = [...bt.sizes];
      sizes[sizeIdx] = { ...sizes[sizeIdx], sl };
      return { ...bt, sizes };
    }));
  };

  const handleUploadAnh = async (idx: number, file: File) => {
    setUploadingIdx(idx);
    try {
      const url = await uploadProductFile(file, "kho-tp");
      capNhatBienThe(idx, { img: url });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không upload được ảnh");
    } finally {
      setUploadingIdx(null);
    }
  };

  const tongSLBienThe = (bt: BienTheDraft) => bt.sizes.reduce((s, x) => s + (x.sl || 0), 0);
  const tongSLTatCa = bienThe.reduce((s, bt) => s + tongSLBienThe(bt), 0);
  const tongGiaTriVon = tongSLTatCa * (giaVon || 0);

  const handleSubmit = () => {
    if (!maSP.trim() || !tenSP.trim()) {
      toast.error("Vui lòng nhập Mã SP và Tên SP");
      return;
    }
    const hopLe = bienThe.filter((bt) => bt.mau.trim());
    if (hopLe.length === 0) {
      toast.error("Cần ít nhất 1 biến thể có tên màu");
      return;
    }
    if (hopLe.some((bt) => bt.kenhBan.length === 0)) {
      toast.error("Mỗi màu cần chọn ít nhất 1 kênh bán");
      return;
    }
    setSaving(true);
    const rows = hopLe.map((bt) => ({
      maSP: maSP.trim().toUpperCase(),
      tenSP: tenSP.trim(),
      phanLoai,
      mau: bt.mau.trim(),
      size: bt.sizes.filter((s) => s.sl > 0).map((s) => s.size).join(", "),
      chiTietSize: bt.sizes,
      tiLeSize: preset.value,
      lsx,
      ngayNhap,
      soLuong: tongSLBienThe(bt),
      donGia: 0,
      giaVon,
      giaBanSi,
      giaBanLe,
      giaBanLo,
      giaTikTok,
      giaShopee,
      kenhBan: bt.kenhBan,
      viTri: viTri.trim(),
      ghiChu: ghiChu.trim(),
      __tempImage: bt.img,
    }));
    onSave(rows);
  };

  return (
    <>
      <ResponsiveModal
        open={true}
        maxWidth="3xl"
        onClose={onClose}
        title={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2B4C3E] flex items-center justify-center shadow-inner">
              <Package className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="text-lg font-bold text-slate-800 tracking-tight">Nhập lô hàng tồn kho</div>
              <div className="text-xs font-medium text-slate-500">
                Thêm nhiều biến thể cùng lúc
              </div>
            </div>
          </div>
        }
      >
        <div className="flex flex-col h-[85vh]">
          <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50 space-y-6">
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
              <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">1</span>
                Thông Tin Chung
              </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1.5 block">Mã SP mẹ *</label>
                    <input value={maSP} onChange={(e) => setMaSP(e.target.value.toUpperCase())} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm focus:border-[#2B4C3E] outline-none font-mono bg-white" placeholder="VD: M024" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1.5 block">Tên SP mẹ *</label>
                    <input value={tenSP} onChange={(e) => {
                      const val = e.target.value;
                      setTenSP(val);
                      setPhanLoai(detectLoaiSP(val));
                    }} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm focus:border-[#2B4C3E] outline-none bg-white" placeholder="VD: Bộ Trụ Phối Lé" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1.5 block">Phân loại</label>
                    <select 
                      value={phanLoai} 
                      onChange={(e) => setPhanLoai(e.target.value)} 
                      className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm focus:border-[#2B4C3E] outline-none bg-white font-medium"
                    >
                      {Object.entries(LOAI_SP_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1.5 block">LSX / Lô nhập</label>
                    <input value={lsx} onChange={(e) => setLsx(e.target.value)} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm focus:border-[#2B4C3E] outline-none font-mono bg-white" />
                  </div>
                </div>
              </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-fuchsia-500"></div>
              <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-fuchsia-100 text-fuchsia-700 flex items-center justify-center text-xs">2</span>
                  Đặc Tính & Tỉ Lệ Size
                </div>
                <button
                  type="button"
                  onClick={() => setOpenSizeBuilder(true)}
                  className="p-1.5 bg-fuchsia-50 text-fuchsia-600 rounded-lg hover:bg-fuchsia-100 transition-colors"
                  title="Tạo bảng size mới"
                >
                  <Calculator className="w-4 h-4" />
                </button>
              </h3>
              
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">Chọn bảng tỉ lệ áp dụng *</label>
                <select value={presetId} onChange={(e) => doiPresetChung(e.target.value)} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm focus:border-[#2B4C3E] outline-none bg-white font-medium">
                  {SIZE_RATIO_PRESETS.length > 0 && (
                    <optgroup label="Bảng chuẩn">
                      {SIZE_RATIO_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                    </optgroup>
                  )}
                  {customPresets.length > 0 && (
                    <optgroup label="Bảng tự tạo">
                      {customPresets.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                    </optgroup>
                  )}
                </select>
              </div>
              <div className="mt-3 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-2 text-xs text-slate-600">
                <span className="font-bold text-slate-800 shrink-0">Tỉ lệ:</span> 
                <span className="tracking-widest">{preset.sizes.join(":")} = {preset.ratios.join(":")}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
              <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs">3</span>
                Thiết Lập Giá Bán
              </h3>
              
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">Giá vốn</label>
                  <div className="relative">
                    <input type="number" min={0} value={giaVon || ""} onChange={(e) => setGiaVon(Math.max(0, parseInt(e.target.value) || 0))} className="w-full pl-3 pr-8 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-bold focus:border-[#2B4C3E] outline-none bg-white text-slate-800" placeholder="0" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">đ</span>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-800 mb-3 block">Giá bán các kênh</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase">Bán lẻ</label>
                      <input type="number" min={0} value={giaBanLe || ""} onChange={(e) => setGiaBanLe(Math.max(0, parseInt(e.target.value) || 0))} className="w-full px-2.5 py-2 border-2 border-slate-200 rounded-xl text-sm focus:border-[#2B4C3E] outline-none bg-white font-semibold" placeholder="0" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase">Bán sỉ</label>
                      <input type="number" min={0} value={giaBanSi || ""} onChange={(e) => setGiaBanSi(Math.max(0, parseInt(e.target.value) || 0))} className="w-full px-2.5 py-2 border-2 border-slate-200 rounded-xl text-sm focus:border-[#2B4C3E] outline-none bg-white font-semibold" placeholder="0" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase">Bán lô</label>
                      <input type="number" min={0} value={giaBanLo || ""} onChange={(e) => setGiaBanLo(Math.max(0, parseInt(e.target.value) || 0))} className="w-full px-2.5 py-2 border-2 border-slate-200 rounded-xl text-sm focus:border-[#2B4C3E] outline-none bg-white font-semibold" placeholder="0" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase">TikTok</label>
                      <input type="number" min={0} value={giaTikTok || ""} onChange={(e) => setGiaTikTok(Math.max(0, parseInt(e.target.value) || 0))} className="w-full px-2.5 py-2 border-2 border-slate-200 rounded-xl text-sm focus:border-[#2B4C3E] outline-none bg-white font-semibold" placeholder="0" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase">Shopee</label>
                      <input type="number" min={0} value={giaShopee || ""} onChange={(e) => setGiaShopee(Math.max(0, parseInt(e.target.value) || 0))} className="w-full px-2.5 py-2 border-2 border-slate-200 rounded-xl text-sm focus:border-[#2B4C3E] outline-none bg-white font-semibold" placeholder="0" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">4</span>
                  Danh Sách Biến Thể Màu ({bienThe.length})
                </h3>
                <span className="text-xs font-semibold text-[#2B4C3E] bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                  Tổng: {tongSLTatCa.toLocaleString()} SP
                </span>
              </div>
              
              <div className="space-y-4">
                {bienThe.map((bt, idx) => {
                  const tong = tongSLBienThe(bt);
                  return (
                    <div key={idx} className="border-2 border-slate-200 bg-slate-50/50 rounded-xl p-4 relative group transition-colors hover:border-[#2B4C3E]">
                      {bienThe.length > 1 && (
                        <button onClick={() => setBienThe((prev) => prev.filter((_, i) => i !== idx))} className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors" title="Xoá biến thể này">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      
                      <div className="flex flex-col sm:flex-row gap-5 mb-4">
                        <div className="w-20 h-20 bg-white rounded-xl border-2 border-slate-200 shrink-0 flex items-center justify-center cursor-pointer overflow-hidden relative shadow-sm hover:border-[#2B4C3E] transition-colors" onClick={() => fileInputs.current[idx]?.click()}>
                          <input ref={(el) => { fileInputs.current[idx] = el; }} type="file" className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadAnh(idx, f); }} />
                          {uploadingIdx === idx ? (
                            <div className="text-[10px] text-emerald-600 font-bold text-center px-1">Đang tải...</div>
                          ) : bt.img ? (
                            <img src={bt.img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="flex flex-col items-center">
                              <Camera className="w-6 h-6 text-slate-300" />
                              <span className="text-[9px] text-slate-400 font-bold uppercase mt-1">Tải ảnh</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 space-y-4">
                          <div className="pr-8">
                            <label className="text-xs font-bold text-slate-700 mb-1.5 block">Tên màu biến thể *</label>
                            <input value={bt.mau} onChange={(e) => capNhatBienThe(idx, { mau: e.target.value })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm focus:border-[#2B4C3E] outline-none bg-white font-medium" placeholder="VD: Trắng" />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-xs font-bold text-slate-700">Chia số lượng theo Size</label>
                              <div className="flex items-center gap-2">
                                <label className="text-[10px] text-slate-500 shrink-0">Nhập tổng SL tự chia:</label>
                                <input type="number" min={0} value={bt.slDuKien || ""} onChange={(e) => doiSlDuKien(idx, Math.max(0, parseInt(e.target.value) || 0))} className="w-20 px-2 py-1 border-2 border-slate-200 rounded-lg text-xs focus:border-[#2B4C3E] outline-none text-right font-bold bg-white" placeholder="0" />
                              </div>
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar items-end">
                              {bt.sizes.map((s, si) => (
                                <div key={s.size} className="flex flex-col shrink-0 min-w-[54px]">
                                  <span className="w-full px-1 py-1 text-[11px] font-bold rounded-t-lg bg-slate-200 text-slate-600 text-center">{s.size}</span>
                                  <input
                                    type="number" min={0} value={s.sl}
                                    onChange={(e) => doiSizeSL(idx, si, Math.max(0, parseInt(e.target.value) || 0))}
                                    className="w-full px-1 py-1.5 text-sm font-extrabold text-center bg-white text-emerald-700 border-x-2 border-b-2 border-slate-200 rounded-b-lg outline-none focus:border-[#2B4C3E]"
                                  />
                                </div>
                              ))}
                              <div className="flex flex-col shrink-0 min-w-[60px] ml-2">
                                <span className="w-full px-1 py-1 text-[11px] font-bold rounded-t-lg bg-[#2B4C3E] text-white text-center">Tổng SL</span>
                                <span className="w-full px-1 py-1.5 text-sm font-extrabold text-center bg-white border-x-2 border-b-2 border-[#2B4C3E] rounded-b-lg text-slate-800">{tong}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t-2 border-slate-200 border-dashed">
                        <div>
                          <label className="text-xs font-bold text-slate-700 mb-1.5 block">Vị trí (Khu kệ)</label>
                          <select value={bt.viTri} onChange={(e) => capNhatBienThe(idx, { viTri: e.target.value })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm focus:border-[#2B4C3E] outline-none bg-white font-medium">
                            <option value="">-- Chọn --</option>
                            {DS_KHU_KE_HANG.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-700 mb-1.5 block">Trạng thái</label>
                          <select value={bt.trangThai} onChange={(e) => capNhatBienThe(idx, { trangThai: e.target.value as any })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm focus:border-[#2B4C3E] outline-none bg-white font-medium">
                            <option value="con">Còn hàng</option>
                            <option value="dat-hang">Đã đặt hàng</option>
                            <option value="xuat-kho">Đã xuất kho</option>
                            <option value="khong-dat">Không đạt</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs font-bold text-slate-700 mb-2 block">Kênh được phép bán *</label>
                          <div className="flex flex-wrap gap-2">
                            {DS_KENH_BAN.map((kenh) => {
                              const selected = bt.kenhBan.includes(kenh.value);
                              return (
                                <button
                                  key={kenh.value}
                                  type="button"
                                  onClick={() => capNhatBienThe(idx, {
                                    kenhBan: selected
                                      ? bt.kenhBan.filter((value) => value !== kenh.value)
                                      : [...bt.kenhBan, kenh.value],
                                  })}
                                  className={`rounded-xl border-2 px-4 py-2 text-xs font-bold transition-all ${selected ? "border-[#2B4C3E] bg-emerald-50 text-[#2B4C3E]" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}
                                >
                                  {selected ? "✓ " : ""}{kenh.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setBienThe((prev) => [...prev, bienTheMoi(preset.sizes)])}
                className="w-full mt-4 py-3 border-2 border-dashed border-[#2B4C3E] rounded-xl text-[#2B4C3E] font-bold text-sm hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" /> Thêm biến thể mới
              </button>
            </div>

            {/* Summary widget */}
            <div className="bg-[#2B4C3E]/5 p-4 rounded-2xl border-2 border-[#2B4C3E]/20">
              <div className="text-xs font-bold text-[#2B4C3E] mb-2">TÓM TẮT LÔ NHẬP</div>
              <div className="space-y-1.5 text-sm text-[#2B4C3E]">
                <div className="flex justify-between items-start gap-2">
                  <span className="font-bold shrink-0">{maSP || "—"}</span>
                  <span className="text-right truncate">{tenSP || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Số lượng màu:</span>
                  <span className="font-bold">{bienThe.length}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#2B4C3E]/20 mt-2">
                  <span className="font-bold">Tổng nhập kho:</span>
                  <span className="font-black text-[#2B4C3E] text-lg">{tongSLTatCa.toLocaleString()}</span>
                </div>
              </div>
            </div>
        </div>

          <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-3 sticky bottom-0 rounded-b-2xl z-20">
            <button onClick={onClose} className="px-5 py-2.5 text-slate-600 bg-white hover:bg-slate-50 border-2 border-slate-200 rounded-xl font-bold transition-colors">
              Hủy bỏ
            </button>
            <button 
              onClick={handleSubmit} 
              disabled={saving} 
              className="px-6 py-2.5 bg-[#2B4C3E] hover:bg-[#203a2f] text-white rounded-xl font-bold flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" /> {saving ? "Đang lưu..." : `Lưu ${bienThe.length} biến thể`}
            </button>
          </div>
        </div>
      </ResponsiveModal>

      {openSizeBuilder && (
        <SizeRatioBuilderModal onClose={() => setOpenSizeBuilder(false)} onSave={handleLuuBangSizeMoi} />
      )}
    </>
  );
}

// =================== TẠO BẢNG TỈ LỆ SIZE MỚI + QUY ĐỔI TỈ LỆ ===================
function SizeRatioBuilderModal({ onClose, onSave }: { onClose: () => void; onSave: (p: SizeRatioPreset) => void }) {
  const [label, setLabel] = useState("");
  const [rows, setRows] = useState<{ size: string; ratio: number }[]>([
    { size: "M", ratio: 1 },
    { size: "L", ratio: 1 },
    { size: "XL", ratio: 1 },
  ]);
  const [tongSLQuyDoi, setTongSLQuyDoi] = useState(0);

  const suaRow = (idx: number, patch: Partial<{ size: string; ratio: number }>) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };
  const xoaRow = (idx: number) => setRows((prev) => prev.filter((_, i) => i !== idx));
  const themRow = () => setRows((prev) => [...prev, { size: "", ratio: 1 }]);

  const riSo = rows.reduce((s, r) => s + (r.ratio || 0), 0);
  const quyDoi = (() => {
    const base = riSo > 0 ? Math.floor(tongSLQuyDoi / riSo) : 0;
    return rows.map((r) => ({ size: r.size, sl: base * (r.ratio || 0) }));
  })();

  const handleLuu = () => {
    const hopLe = rows.map((r) => ({ size: r.size.trim(), ratio: r.ratio })).filter((r) => r.size && r.ratio > 0);
    if (hopLe.length < 2) {
      toast.error("Cần ít nhất 2 size có tên và tỉ lệ > 0");
      return;
    }
    const tenTrung = new Set(hopLe.map((r) => r.size.toUpperCase()));
    if (tenTrung.size !== hopLe.length) {
      toast.error("Tên size bị trùng nhau");
      return;
    }
    onSave(buildCustomSizeRatioPreset(hopLe.map((r) => r.size), hopLe.map((r) => r.ratio), label));
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-3" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white p-4 flex items-center justify-between sticky top-0 z-10">
          <h2 className="font-bold text-lg flex items-center gap-2"><Calculator className="w-5 h-5" /> Tạo bảng tỉ lệ size mới</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">Tên bảng (tuỳ chọn)</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none" placeholder="Tự động đặt tên nếu để trống" />
          </div>

          <div className="space-y-1.5">
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-[10px] font-bold text-slate-500 uppercase px-0.5">
              <div>Size</div>
              <div>Tỉ lệ</div>
              <div></div>
            </div>
            {rows.map((r, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                <input value={r.size} onChange={(e) => suaRow(idx, { size: e.target.value })} className="w-full px-2.5 py-1.5 border-2 border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none" placeholder="VD: M" />
                <input type="number" min={0} value={r.ratio || ""} onChange={(e) => suaRow(idx, { ratio: Math.max(0, parseInt(e.target.value) || 0) })} className="w-full px-2.5 py-1.5 border-2 border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none" placeholder="0" />
                <button onClick={() => xoaRow(idx)} disabled={rows.length <= 1} className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded disabled:opacity-30 disabled:hover:bg-transparent" title="Xoá size này">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button type="button" onClick={themRow} className="w-full py-2 border-2 border-dashed border-indigo-300 rounded-lg text-indigo-600 font-bold text-xs hover:bg-indigo-50 flex items-center justify-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Thêm size
            </button>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-xs">
            <div className="font-semibold text-indigo-800 mb-1">
              Tỉ lệ: {rows.filter((r) => r.size).map((r) => r.ratio).join(":")} (Ri{riSo})
            </div>
            <div className="text-indigo-700">{rows.filter((r) => r.size).map((r) => r.size).join(":") || "—"}</div>
          </div>

          {/* Quy đổi tỉ lệ: nhập tổng SL -> xem thử chia ra bao nhiêu mỗi size */}
          <div className="border-2 border-slate-200 rounded-lg p-3 space-y-2">
            <div className="text-xs font-bold text-slate-700">Quy đổi tỉ lệ (xem thử)</div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-slate-500 shrink-0">Tổng SL muốn nhập</label>
              <input type="number" min={0} value={tongSLQuyDoi || ""} onChange={(e) => setTongSLQuyDoi(Math.max(0, parseInt(e.target.value) || 0))} className="w-28 px-2 py-1 border border-slate-200 rounded text-sm focus:border-indigo-500 outline-none" placeholder="0" />
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {quyDoi.filter((q) => q.size).map((q) => (
                <div key={q.size} className="flex flex-col items-center shrink-0 min-w-[48px]">
                  <span className="w-full px-1 py-1 text-[11px] font-bold rounded-t bg-slate-100 text-slate-600 border border-b-0 border-slate-200 text-center">{q.size}</span>
                  <span className="w-full px-1 py-1 text-sm font-extrabold text-center bg-emerald-50 text-emerald-700 border border-slate-200 rounded-b">{q.sl}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-2 bg-slate-50 rounded-b-2xl sticky bottom-0">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-semibold">Hủy</button>
          <button onClick={handleLuu} className="px-4 py-2 bg-indigo-500 text-white rounded-lg font-bold hover:bg-indigo-600 flex items-center gap-2">
            <Save className="w-4 h-4" /> Lưu bảng size
          </button>
        </div>
      </div>
    </div>
  );
}

// =================== SỬA 1 BIẾN THỂ (giữ nguyên hành vi cũ) ===================
function SuaBienTheForm({ sp, initialImage, onClose, onSave }: { sp: SanPhamTP; initialImage?: string; onClose: () => void; onSave: (data: any) => void }) {
  const isValidKey = Object.keys(LOAI_SP_LABELS).includes(sp.phanLoai || "");
  const detectedPhanLoai = isValidKey ? sp.phanLoai : detectLoaiSP((sp.tenSP || "") + " " + (sp.phanLoai || ""));

  const [form, setForm] = useState({
    maSP: sp.maSP || "",
    tenSP: sp.tenSP || "",
    phanLoai: detectedPhanLoai || "BoTru",
    mau: sp.mau || "Trắng",
    size: sp.size || "M, L, XL",
    lsx: sp.lsx || "LSX-2026-007",
    ngayNhap: sp.ngayNhap || new Date().toISOString().slice(0, 10),
    soLuong: sp.soLuong ?? 0,
    donGia: sp.donGia ?? 0,
    giaVon: sp.giaVon ?? 0,
    giaBanSi: sp.giaBanSi ?? 0,
    giaBanLe: sp.giaBanLe ?? 0,
    giaBanLo: sp.giaBanLo ?? 0,
    giaTikTok: sp.giaTikTok ?? 0,
    giaShopee: sp.giaShopee ?? 0,
    kenhBan: sp.kenhBan?.length ? sp.kenhBan : (["ban-le"] as KenhBan[]),
    viTri: sp.viTri || "",
    trangThai: sp.trangThai || "con",
    ghiChu: sp.ghiChu || "",
  });

  const [image, setImage] = useState(initialImage || "");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadProductFile(file, "kho-tp");
      setImage(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không upload được ảnh");
    } finally {
      setUploading(false);
    }
  };

  return (
    <ResponsiveModal
      open={true}
      maxWidth="3xl"
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-slate-800 font-black tracking-tight">
          <div className="bg-[#2B4C3E] p-1.5 rounded-lg">
            <Package className="w-5 h-5 text-white" />
          </div>
          <span>CẬP NHẬT BIẾN THỂ</span>
        </div>
      }
    >
      <div className="flex flex-col bg-slate-50/50 h-full">
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-6">

          {/* KHỐI 1: THÔNG TIN CHUNG */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">1</span>
              Thông Tin Chung
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Mã SP mẹ *</label>
                <input 
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 uppercase font-mono font-bold text-slate-800 bg-slate-50 transition-all hover:bg-white" 
                  value={form.maSP} onChange={(e) => setForm({ ...form, maSP: e.target.value.toUpperCase() })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Tên SP mẹ *</label>
                <input 
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-slate-800 bg-slate-50 transition-all hover:bg-white" 
                  value={form.tenSP} onChange={(e) => {
                    const val = e.target.value;
                    setForm({ ...form, tenSP: val, phanLoai: detectLoaiSP(val) });
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Phân loại</label>
                <select 
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 bg-slate-50 font-medium text-slate-700 transition-all hover:bg-white cursor-pointer"
                  value={form.phanLoai} onChange={(e) => setForm({ ...form, phanLoai: e.target.value })}
                >
                  {Object.entries(LOAI_SP_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">LSX (Tự động điền màu)</label>
                <input 
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 bg-slate-50 font-mono text-slate-700 transition-all hover:bg-white" 
                  value={form.lsx} onChange={(e) => {
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
                />
              </div>
            </div>
          </div>

          {/* KHỐI 2: ĐẶC TÍNH & TRẠNG THÁI */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">2</span>
              Đặc Tính & Trạng Thái
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Màu</label>
                <input 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-white" 
                  value={form.mau} onChange={(e) => setForm({ ...form, mau: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Size / Tỉ lệ</label>
                <input 
                  list="ds-ti-le-size"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-white" 
                  value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })}
                />
                <datalist id="ds-ti-le-size">
                  {DS_TI_LE_SIZE.map(s => <option key={s} value={s} />)}
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Vị trí (Khu kệ)</label>
                <select 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-white cursor-pointer" 
                  value={form.viTri} onChange={(e) => setForm({ ...form, viTri: e.target.value })}
                >
                  <option value="">-- Chọn --</option>
                  {DS_KHU_KE_HANG.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Trạng thái</label>
                <select 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-white cursor-pointer" 
                  value={form.trangThai} onChange={(e) => setForm({ ...form, trangThai: e.target.value as any })}
                >
                  <option value="con">Còn hàng</option>
                  <option value="dat-hang">Đã đặt hàng</option>
                  <option value="xuat-kho">Đã xuất kho</option>
                  <option value="khong-dat">Không đạt</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4 items-center">
              <div className="w-24 h-24 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex-shrink-0 flex items-center justify-center cursor-pointer overflow-hidden group hover:border-blue-400 transition-colors" onClick={() => fileInputRef.current?.click()}>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
                {uploading ? (
                  <div className="text-[9px] text-blue-600 font-bold text-center px-1">Đang tải...</div>
                ) : image ? (
                  <img src={image} className="w-full h-full object-cover group-hover:opacity-70 transition-opacity" />
                ) : (
                  <div className="text-center text-slate-400 group-hover:text-blue-500 transition-colors">
                    <Camera className="w-6 h-6 mx-auto mb-1 opacity-50" />
                    <div className="text-[9px] font-bold uppercase">Tải ảnh</div>
                  </div>
                )}
              </div>
              <div className="flex-1 bg-blue-50 p-4 rounded-xl border border-blue-100">
                <label className="block text-xs font-bold text-blue-900 mb-1.5 uppercase tracking-wider">Số Lượng Thực Tế *</label>
                <input 
                  type="number" min="0" 
                  className="w-32 border-2 border-blue-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-lg font-bold text-blue-700 bg-white" 
                  value={form.soLuong} onChange={(e) => setForm({ ...form, soLuong: Math.max(0, parseInt(e.target.value) || 0) })}
                />
              </div>
            </div>
          </div>

          {/* KHỐI 3: THIẾT LẬP GIÁ BÁN */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs">3</span>
              Thiết Lập Giá Bán
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: "Giá Vốn", value: form.giaVon, set: (v: number) => setForm({ ...form, giaVon: v }) },
                { label: "Giá Bán Lẻ", value: form.giaBanLe, set: (v: number) => setForm({ ...form, giaBanLe: v }) },
                { label: "Giá Bán Sỉ", value: form.giaBanSi, set: (v: number) => setForm({ ...form, giaBanSi: v }) },
                { label: "Giá Bán Lô", value: form.giaBanLo, set: (v: number) => setForm({ ...form, giaBanLo: v }) },
                { label: "Giá TikTok", value: form.giaTikTok, set: (v: number) => setForm({ ...form, giaTikTok: v }) },
                { label: "Giá Shopee", value: form.giaShopee, set: (v: number) => setForm({ ...form, giaShopee: v }) },
              ].map((item, idx) => (
                <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">{item.label}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₫</span>
                    <input 
                      type="number" 
                      className="w-full border border-slate-300 rounded-lg pl-8 pr-3 py-2 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 font-mono font-bold text-slate-700" 
                      placeholder="0" 
                      value={item.value || ""} 
                      onChange={e => item.set(Math.max(0, parseInt(e.target.value) || 0))} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* KHỐI 4: THÔNG TIN KHÁC */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-fuchsia-500"></div>
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-fuchsia-100 text-fuchsia-700 flex items-center justify-center text-xs">4</span>
              Kênh Bán & Ghi Chú
            </h3>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Kênh được phép bán *</label>
              <div className="flex flex-wrap gap-2">
                {DS_KENH_BAN.map((kenh) => {
                  const selected = form.kenhBan.includes(kenh.value);
                  return (
                    <button
                      key={kenh.value}
                      type="button"
                      onClick={() => setForm({
                        ...form,
                        kenhBan: selected
                          ? form.kenhBan.filter((value) => value !== kenh.value)
                          : [...form.kenhBan, kenh.value],
                      })}
                      className={`rounded-lg border px-3 py-2 text-xs font-bold shadow-sm transition-colors ${selected ? "border-[#2B4C3E] bg-[#2B4C3E]/5 text-[#2B4C3E]" : "border-slate-200 text-slate-500 hover:border-slate-300 bg-white"}`}
                    >
                      {selected ? "✓ " : ""}{kenh.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ghi chú thêm</label>
              <textarea 
                value={form.ghiChu} onChange={(e) => setForm({ ...form, ghiChu: e.target.value })} 
                rows={2} 
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500 outline-none bg-slate-50" 
              />
            </div>
          </div>

        </div>

        {/* STICKY FOOTER */}
        <div className="p-4 sm:px-6 sm:py-4 border-t border-slate-200 bg-white flex justify-end gap-3 sticky bottom-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] rounded-b-2xl">
          <button onClick={onClose} className="px-6 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors border-2 border-slate-200">Đóng</button>
          <button onClick={() => {
            if (form.kenhBan.length === 0) {
              toast.error("Cần chọn ít nhất 1 kênh bán");
              return;
            }
            onSave({ ...sp, ...form, __tempImage: image });
          }} className="px-8 py-2.5 font-bold text-white bg-[#2B4C3E] hover:bg-[#1f382d] rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg transition-all scale-100 hover:scale-[1.02]">
            <Save className="w-5 h-5" /> LƯU THAY ĐỔI
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
}
