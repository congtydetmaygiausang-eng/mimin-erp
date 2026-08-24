// ============ PRODUCT FORM MODAL (Add/Edit) ============
// Tach tu page.tsx (2026-08-05 - toi uu B.2)
// 2026-08-24: Chế độ Thêm mới cho phép nhập NHIỀU biến thể (màu) cùng lúc,
// mỗi biến thể có tỉ lệ size + số lượng theo từng size + đủ giá vốn/giá bán/
// giá bán sỉ/giá bán lẻ/giá bán lô - phục vụ nhập lô hàng tồn kho hiện tại.
// Chế độ Sửa giữ nguyên form 1 biến thể như cũ (sửa 1 dòng tồn kho có sẵn).

import { useState, useRef } from "react";
import { Camera, Save, Plus, Trash2, Package } from "lucide-react";
import { toast } from "sonner";
import { DS_TI_LE_SIZE, DS_KHU_KE_HANG, ALL_PHIEU, type SanPhamTP } from "../data";
import { SIZE_RATIO_PRESETS } from "@/lib/size-ratio-presets";
import { uploadProductFile } from "@/lib/product-upload";

type BienTheDraft = {
  mau: string;
  img: string;
  presetId: string;
  sizes: { size: string; sl: number }[];
  slDuKien: number;
  viTri: string;
  trangThai: SanPhamTP["trangThai"];
  ghiChu: string;
  giaVon: number;
  donGia: number;
  giaBanSi: number;
  giaBanLe: number;
  giaBanLo: number;
};

function bienTheMoi(): BienTheDraft {
  const preset = SIZE_RATIO_PRESETS[0];
  return {
    mau: "",
    img: "",
    presetId: preset.id,
    sizes: preset.sizes.map((s) => ({ size: s, sl: 0 })),
    slDuKien: 0,
    viTri: "Kệ A1-A2",
    trangThai: "con",
    ghiChu: "",
    giaVon: 0,
    donGia: 0,
    giaBanSi: 0,
    giaBanLe: 0,
    giaBanLo: 0,
  };
}

function phanBoTheoTiLe(presetId: string, slDuKien: number): { size: string; sl: number }[] {
  const preset = SIZE_RATIO_PRESETS.find((p) => p.id === presetId) || SIZE_RATIO_PRESETS[0];
  const tongTiLe = preset.ratios.reduce((a, b) => a + b, 0) || 1;
  const base = Math.floor(slDuKien / tongTiLe);
  return preset.sizes.map((s, i) => ({ size: s, sl: base * preset.ratios[i] }));
}

export function ProductFormModal({ sp, initialImage, onClose, onSave }: { sp?: SanPhamTP; initialImage?: string; onClose: () => void; onSave: (data: any) => void }) {
  if (sp) {
    return <SuaBienTheForm sp={sp} initialImage={initialImage} onClose={onClose} onSave={onSave} />;
  }
  return <ThemNhieuBienTheForm onClose={onClose} onSave={onSave} />;
}

// =================== THÊM MỚI - NHIỀU BIẾN THỂ ===================
function ThemNhieuBienTheForm({ onClose, onSave }: { onClose: () => void; onSave: (data: any[]) => void }) {
  const [maSP, setMaSP] = useState("");
  const [tenSP, setTenSP] = useState("");
  const [phanLoai, setPhanLoai] = useState("");
  const [lsx, setLsx] = useState("LSX-2026-007");
  const [ngayNhap, setNgayNhap] = useState(new Date().toISOString().slice(0, 10));
  const [bienThe, setBienThe] = useState<BienTheDraft[]>([bienTheMoi()]);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});

  const capNhatBienThe = (idx: number, patch: Partial<BienTheDraft>) => {
    setBienThe((prev) => prev.map((bt, i) => (i === idx ? { ...bt, ...patch } : bt)));
  };

  const doiPreset = (idx: number, presetId: string) => {
    const preset = SIZE_RATIO_PRESETS.find((p) => p.id === presetId) || SIZE_RATIO_PRESETS[0];
    capNhatBienThe(idx, { presetId, sizes: preset.sizes.map((s) => ({ size: s, sl: 0 })), slDuKien: 0 });
  };

  const doiSlDuKien = (idx: number, sl: number) => {
    capNhatBienThe(idx, { slDuKien: sl, sizes: phanBoTheoTiLe(bienThe[idx].presetId, sl) });
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
  const tongGiaTriVon = bienThe.reduce((s, bt) => s + tongSLBienThe(bt) * (bt.giaVon || 0), 0);

  const handleSubmit = () => {
    if (!maSP.trim() || !tenSP.trim()) {
      toast.error("Vui lòng nhập Mã SP và Tên SP");
      return;
    }
    const hopLe = bienThe.filter((bt) => bt.mau.trim() && tongSLBienThe(bt) > 0);
    if (hopLe.length === 0) {
      toast.error("Cần ít nhất 1 biến thể có màu và số lượng > 0");
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
      lsx,
      ngayNhap,
      soLuong: tongSLBienThe(bt),
      donGia: bt.donGia,
      giaVon: bt.giaVon,
      giaBanSi: bt.giaBanSi,
      giaBanLe: bt.giaBanLe,
      giaBanLo: bt.giaBanLo,
      viTri: bt.viTri,
      trangThai: bt.trangThai,
      ghiChu: bt.ghiChu,
      __tempImage: bt.img,
    }));
    onSave(rows);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 flex items-center justify-between sticky top-0 z-10">
          <h2 className="font-bold text-lg flex items-center gap-2"><Package className="w-5 h-5" /> Nhập lô hàng tồn kho (nhiều biến thể)</h2>
          <button onClick={onClose} className="px-2 py-1 hover:bg-white/20 rounded">✕</button>
        </div>

        <div className="p-4 space-y-4">
          {/* Thông tin SP mẹ - dùng chung cho mọi biến thể trong lô */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Mã SP mẹ *</label>
              <input value={maSP} onChange={(e) => setMaSP(e.target.value.toUpperCase())} className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none font-mono" placeholder="VD: M024" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Tên SP mẹ *</label>
              <input value={tenSP} onChange={(e) => setTenSP(e.target.value)} className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none" placeholder="VD: Bộ Trụ Phối Lé" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Phân loại</label>
              <input value={phanLoai} onChange={(e) => setPhanLoai(e.target.value)} className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none" placeholder="VD: Bộ Trụ" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">LSX / Lô nhập</label>
              <input value={lsx} onChange={(e) => setLsx(e.target.value)} className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none font-mono" />
            </div>
          </div>

          {/* Danh sách biến thể */}
          <div className="space-y-3">
            {bienThe.map((bt, idx) => {
              const preset = SIZE_RATIO_PRESETS.find((p) => p.id === bt.presetId) || SIZE_RATIO_PRESETS[0];
              const tong = tongSLBienThe(bt);
              return (
                <div key={idx} className="border-2 border-slate-200 rounded-xl p-3 space-y-3 relative">
                  {bienThe.length > 1 && (
                    <button onClick={() => setBienThe((prev) => prev.filter((_, i) => i !== idx))} className="absolute top-2 right-2 p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded" title="Xoá biến thể này">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <div className="flex gap-3 items-start">
                    <div className="w-16 h-16 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 shrink-0 flex items-center justify-center cursor-pointer overflow-hidden group hover:border-amber-400 transition-colors" onClick={() => fileInputs.current[idx]?.click()}>
                      <input ref={(el) => { fileInputs.current[idx] = el; }} type="file" className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadAnh(idx, f); }} />
                      {uploadingIdx === idx ? (
                        <div className="text-[9px] text-amber-600 font-bold text-center px-1">Đang tải...</div>
                      ) : bt.img ? (
                        <img src={bt.img} className="w-full h-full object-cover group-hover:opacity-70 transition-opacity" />
                      ) : (
                        <Camera className="w-5 h-5 text-slate-300 group-hover:text-amber-500 transition-colors" />
                      )}
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 mb-0.5 block">Màu / Biến thể *</label>
                        <input value={bt.mau} onChange={(e) => capNhatBienThe(idx, { mau: e.target.value })} className="w-full px-2.5 py-1.5 border-2 border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none" placeholder="VD: Trắng" />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 mb-0.5 block">Tỉ lệ Size</label>
                        <select value={bt.presetId} onChange={(e) => doiPreset(idx, e.target.value)} className="w-full px-2.5 py-1.5 border-2 border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none">
                          {SIZE_RATIO_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* SL dự kiến -> tự phân bổ theo tỉ lệ, vẫn sửa tay được từng size */}
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-semibold text-slate-500 shrink-0">SL dự kiến (tự chia theo tỉ lệ)</label>
                    <input type="number" min={0} value={bt.slDuKien || ""} onChange={(e) => doiSlDuKien(idx, Math.max(0, parseInt(e.target.value) || 0))} className="w-24 px-2 py-1 border border-slate-200 rounded text-sm focus:border-amber-500 outline-none" placeholder="0" />
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {bt.sizes.map((s, si) => (
                      <div key={s.size} className="flex flex-col items-center shrink-0 min-w-[48px]">
                        <span className="w-full px-1 py-1 text-[11px] font-bold rounded-t bg-slate-100 text-slate-600 border border-b-0 border-slate-200 text-center">{s.size}</span>
                        <input
                          type="number" min={0} value={s.sl}
                          onChange={(e) => doiSizeSL(idx, si, Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full px-1 py-1 text-sm font-extrabold text-center bg-emerald-50 text-emerald-700 border border-slate-200 rounded-b outline-none focus:border-emerald-500"
                        />
                      </div>
                    ))}
                    <div className="flex flex-col items-center shrink-0 min-w-[48px] ml-1">
                      <span className="w-full px-1 py-1 text-[11px] font-bold rounded-t bg-slate-800 text-white text-center">Tổng</span>
                      <span className="w-full px-1 py-1 text-sm font-extrabold text-center bg-white border-2 border-slate-800 rounded-b">{tong}</span>
                    </div>
                  </div>

                  {/* Giá vốn / giá bán / sỉ / lẻ / lô */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 mb-0.5 block">Giá vốn</label>
                      <input type="number" min={0} value={bt.giaVon || ""} onChange={(e) => capNhatBienThe(idx, { giaVon: Math.max(0, parseInt(e.target.value) || 0) })} className="w-full px-2 py-1.5 border-2 border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none" placeholder="0" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 mb-0.5 block">Giá bán</label>
                      <input type="number" min={0} value={bt.donGia || ""} onChange={(e) => capNhatBienThe(idx, { donGia: Math.max(0, parseInt(e.target.value) || 0) })} className="w-full px-2 py-1.5 border-2 border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none" placeholder="0" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 mb-0.5 block">Giá bán sỉ</label>
                      <input type="number" min={0} value={bt.giaBanSi || ""} onChange={(e) => capNhatBienThe(idx, { giaBanSi: Math.max(0, parseInt(e.target.value) || 0) })} className="w-full px-2 py-1.5 border-2 border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none" placeholder="0" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 mb-0.5 block">Giá bán lẻ</label>
                      <input type="number" min={0} value={bt.giaBanLe || ""} onChange={(e) => capNhatBienThe(idx, { giaBanLe: Math.max(0, parseInt(e.target.value) || 0) })} className="w-full px-2 py-1.5 border-2 border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none" placeholder="0" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 mb-0.5 block">Giá bán lô</label>
                      <input type="number" min={0} value={bt.giaBanLo || ""} onChange={(e) => capNhatBienThe(idx, { giaBanLo: Math.max(0, parseInt(e.target.value) || 0) })} className="w-full px-2 py-1.5 border-2 border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none" placeholder="0" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 mb-0.5 block">Vị trí (Khu kệ)</label>
                      <input list="ds-khu-ke-hang" value={bt.viTri} onChange={(e) => capNhatBienThe(idx, { viTri: e.target.value })} className="w-full px-2.5 py-1.5 border-2 border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 mb-0.5 block">Trạng thái</label>
                      <select value={bt.trangThai} onChange={(e) => capNhatBienThe(idx, { trangThai: e.target.value as any })} className="w-full px-2.5 py-1.5 border-2 border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none">
                        <option value="con">Còn hàng</option>
                        <option value="dat-hang">Đã đặt hàng</option>
                        <option value="xuat-kho">Đã xuất kho</option>
                        <option value="khong-dat">Không đạt</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setBienThe((prev) => [...prev, bienTheMoi()])}
            className="w-full py-2.5 border-2 border-dashed border-amber-300 rounded-xl text-amber-600 font-bold text-sm hover:bg-amber-50 flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Thêm biến thể (màu khác)
          </button>

          <datalist id="ds-khu-ke-hang">
            {DS_KHU_KE_HANG.map((s) => <option key={s} value={s} />)}
          </datalist>

          <div className="bg-amber-50 p-3 rounded-lg text-xs space-y-0.5">
            <div className="font-semibold text-amber-800">Tóm tắt lô nhập:</div>
            <div><b>{maSP || "—"}</b> - {tenSP || "—"} · {bienThe.length} biến thể</div>
            <div>Tổng SL: <b>{tongSLTatCa.toLocaleString()}</b> sản phẩm · Tổng giá trị vốn: <b className="text-emerald-600">{tongGiaTriVon.toLocaleString()}đ</b></div>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-2 bg-slate-50 rounded-b-2xl sticky bottom-0">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-semibold">Hủy</button>
          <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 bg-amber-500 text-white rounded-lg font-bold hover:bg-amber-600 flex items-center gap-2 disabled:opacity-50">
            <Save className="w-4 h-4" /> Lưu {bienThe.length > 1 ? `${bienThe.length} biến thể` : "biến thể"}
          </button>
        </div>
      </div>
    </div>
  );
}

// =================== SỬA 1 BIẾN THỂ (giữ nguyên hành vi cũ) ===================
function SuaBienTheForm({ sp, initialImage, onClose, onSave }: { sp: SanPhamTP; initialImage?: string; onClose: () => void; onSave: (data: any) => void }) {
  const [form, setForm] = useState({
    maSP: sp.maSP || "",
    tenSP: sp.tenSP || "",
    phanLoai: sp.phanLoai || "",
    mau: sp.mau || "Trắng",
    size: sp.size || "M, L, XL",
    lsx: sp.lsx || "LSX-2026-007",
    ngayNhap: sp.ngayNhap || new Date().toISOString().slice(0, 10),
    soLuong: sp.soLuong || 100,
    donGia: sp.donGia || 50000,
    giaVon: sp.giaVon || 0,
    giaBanSi: sp.giaBanSi || 0,
    giaBanLe: sp.giaBanLe || 0,
    giaBanLo: sp.giaBanLo || 0,
    viTri: sp.viTri || "Kệ A1-A2",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 flex items-center justify-between">
          <h2 className="font-bold text-lg">Sửa biến thể</h2>
          <button onClick={onClose} className="px-2 py-1 hover:bg-white/20 rounded">✕</button>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex gap-4 items-start mb-4">
             <div className="w-24 h-24 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex-shrink-0 flex items-center justify-center cursor-pointer overflow-hidden group hover:border-amber-400 transition-colors" onClick={() => fileInputRef.current?.click()}>
               <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
               {uploading ? (
                 <div className="text-[9px] text-amber-600 font-bold text-center px-1">Đang tải...</div>
               ) : image ? (
                 <img src={image} className="w-full h-full object-cover group-hover:opacity-70 transition-opacity" />
               ) : (
                 <div className="text-center text-slate-400 group-hover:text-amber-500 transition-colors">
                   <Camera className="w-6 h-6 mx-auto mb-1 opacity-50" />
                   <div className="text-[9px] font-bold uppercase">Tải ảnh</div>
                 </div>
               )}
             </div>
             <div className="flex-1 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">Mã SP mẹ *</label>
                    <input value={form.maSP} onChange={(e) => setForm({ ...form, maSP: e.target.value.toUpperCase() })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none font-mono" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">Tên SP mẹ *</label>
                    <input value={form.tenSP} onChange={(e) => setForm({ ...form, tenSP: e.target.value })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none" />
                  </div>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Màu</label>
              <input value={form.mau} onChange={(e) => setForm({ ...form, mau: e.target.value })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Size / Tỉ lệ</label>
              <input list="ds-ti-le-size" value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none" />
              <datalist id="ds-ti-le-size">
                {DS_TI_LE_SIZE.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">LSX (Tự động điền màu)</label>
              <input
                value={form.lsx}
                onChange={(e) => {
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
                className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none font-mono"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Số lượng *</label>
              <input type="number" min="0" value={form.soLuong} onChange={(e) => setForm({ ...form, soLuong: Math.max(0, parseInt(e.target.value) || 0) })} className="w-full px-3 py-2 border-2 border-emerald-300 rounded-lg text-lg font-bold focus:border-emerald-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Vị trí (Khu kệ)</label>
              <input list="ds-khu-ke-hang" value={form.viTri} onChange={(e) => setForm({ ...form, viTri: e.target.value })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none" />
              <datalist id="ds-khu-ke-hang">
                {DS_KHU_KE_HANG.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Trạng thái</label>
              <select value={form.trangThai} onChange={(e) => setForm({ ...form, trangThai: e.target.value as any })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none">
                <option value="con">Còn hàng</option>
                <option value="dat-hang">Đã đặt hàng</option>
                <option value="xuat-kho">Đã xuất kho</option>
                <option value="khong-dat">Không đạt</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Giá vốn</label>
              <input type="number" min="0" value={form.giaVon} onChange={(e) => setForm({ ...form, giaVon: Math.max(0, parseInt(e.target.value) || 0) })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Giá bán</label>
              <input type="number" min="0" value={form.donGia} onChange={(e) => setForm({ ...form, donGia: Math.max(0, parseInt(e.target.value) || 0) })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Giá bán sỉ</label>
              <input type="number" min="0" value={form.giaBanSi} onChange={(e) => setForm({ ...form, giaBanSi: Math.max(0, parseInt(e.target.value) || 0) })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Giá bán lẻ</label>
              <input type="number" min="0" value={form.giaBanLe} onChange={(e) => setForm({ ...form, giaBanLe: Math.max(0, parseInt(e.target.value) || 0) })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Giá bán lô</label>
              <input type="number" min="0" value={form.giaBanLo} onChange={(e) => setForm({ ...form, giaBanLo: Math.max(0, parseInt(e.target.value) || 0) })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">Ghi chú</label>
            <textarea value={form.ghiChu} onChange={(e) => setForm({ ...form, ghiChu: e.target.value })} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none" />
          </div>
          <div className="bg-amber-50 p-3 rounded-lg text-xs">
            <div className="font-semibold text-amber-800">Tóm tắt:</div>
            <div><b>{form.maSP}</b> - {form.tenSP} | Màu {form.mau} | Size {form.size}</div>
            <div>SL: <b>{form.soLuong.toLocaleString()}</b> × {form.donGia.toLocaleString()}đ = <b className="text-emerald-600">{(form.soLuong * form.donGia).toLocaleString()}đ</b></div>
          </div>
        </div>
        <div className="p-4 border-t flex justify-end gap-2 bg-slate-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-semibold">Hủy</button>
          <button onClick={() => onSave({ ...sp, ...form, __tempImage: image })} className="px-4 py-2 bg-amber-500 text-white rounded-lg font-bold hover:bg-amber-600 flex items-center gap-2">
            <Save className="w-4 h-4" /> Lưu biến thể
          </button>
        </div>
      </div>
    </div>
  );
}
