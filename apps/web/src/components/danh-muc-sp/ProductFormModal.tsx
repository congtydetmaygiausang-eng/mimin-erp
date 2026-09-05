import { useState, useEffect } from "react";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { X, Save, Plus, Trash2, Package } from "lucide-react";
import { toast } from "sonner";
import { useDanhMucSP, type SanPham } from "@/lib/data/danh-muc-sp-store";
import { LOAI_SP_LABELS, type LoaiSP } from "@/lib/data/lenh-cat-store";
import { type SizeRatioPreset, SIZE_RATIO_PRESETS, loadCustomSizeRatioPresets, buildCustomSizeRatioPreset, saveCustomSizeRatioPreset } from "@/lib/size-ratio-presets";
import { uploadProductFile } from "@/lib/product-upload";

interface ProductFormModalProps {
  onClose: () => void;
  onSave: (sp: Partial<SanPham>) => void;
  initialData?: SanPham;
}

export default function ProductFormModal({ onClose, onSave, initialData }: ProductFormModalProps) {
  const { dsSanPham } = useDanhMucSP();
  const [mounted, setMounted] = useState(false);
  const [customPresets, setCustomPresets] = useState<SizeRatioPreset[]>([]);
  const [isCreatingRatio, setIsCreatingRatio] = useState(false);
  const [customSizes, setCustomSizes] = useState("S:M:L:XL");
  const [customValues, setCustomValues] = useState("1:2:2:1");

  const [presetId, setPresetId] = useState("1s-1-2-2-2-1");

  useEffect(() => {
    setMounted(true);
    const loadedCustom = loadCustomSizeRatioPresets();
    setCustomPresets(loadedCustom);
    
    if (initialData?.bangSize && initialData.bangSize.sizes.length > 0) {
      const sStr = initialData.bangSize.sizes.join(":");
      const rStr = initialData.bangSize.ratios.join(":");
      const all = [...SIZE_RATIO_PRESETS, ...loadedCustom];
      const found = all.find(p => p.sizes.join(":") === sStr && p.value === rStr);
      if (found) {
        setPresetId(found.id);
      }
    }
  }, [initialData]);

  const allPresets = [...SIZE_RATIO_PRESETS, ...customPresets];

  const handleSaveCustomRatio = () => {
    const sizes = customSizes.split(":").map(s => s.trim());
    const ratios = customValues.split(":").map(Number);
    
    if (sizes.length !== ratios.length || ratios.some(isNaN)) {
      toast.error("Định dạng không hợp lệ. Ví dụ: S:M:L:XL và 1:2:2:1");
      return;
    }
    
    const newPreset = buildCustomSizeRatioPreset(sizes, ratios);
    const updated = saveCustomSizeRatioPreset(newPreset);
    setCustomPresets(updated);
    setPresetId(newPreset.id);
    setIsCreatingRatio(false);
    toast.success("Đã lưu bảng size mới!");
  };

  const [maSP, setMaSP] = useState(initialData?.id || "");
  const [tenSP, setTenSP] = useState(initialData?.tenSP || "");
  const [loaiSP, setLoaiSP] = useState<LoaiSP>(initialData?.loaiSP || "BoTru");
  const [presetIdStateUnused, setPresetIdStateUnused] = useState(""); // Dummy unused to keep lines consistent or just delete
  const [dsMau, setDsMau] = useState<{ ten: string; maSKU: string; dinhMuc: number; img: string; video: string; hinhAnhChiTiet?: string[] }[]>(
    initialData?.dsMau?.map(m => ({
      ten: m.ten,
      maSKU: m.maSKU || "",
      dinhMuc: m.dinhMuc || 0.25,
      img: m.img || "",
      video: m.video || "",
      hinhAnhChiTiet: m.hinhAnhChiTiet || []
    })) || [
      { ten: "Đen", maSKU: "", dinhMuc: 0.25, img: "", video: "", hinhAnhChiTiet: [] },
    ]
  );
  
  const [chatLieu, setChatLieu] = useState(initialData?.chatLieu || "");
  const [ncc, setNcc] = useState(initialData?.ncc || "");
  const [ghiChu, setGhiChu] = useState(initialData?.ghiChu || "");
  const [giaBanLe, setGiaBanLe] = useState(initialData?.giaBanLe || 0);
  const [giaBanSi, setGiaBanSi] = useState(initialData?.giaBanSi || 0);
  const [giaBanLo, setGiaBanLo] = useState(initialData?.giaBanLo || 0);
  const [giaTikTok, setGiaTikTok] = useState(initialData?.giaTikTok || 0);
  const [giaShopee, setGiaShopee] = useState(initialData?.giaShopee || 0);

  const handleSave = () => {
    if (!maSP || !tenSP) {
      toast.error("Vui lòng nhập Mã SP và Tên SP!");
      return;
    }

    // Chặn trùng mã SP khi TẠO MỚI. Bảng san_pham dùng id (UUID) làm khoá chính
    // còn ma_sp chỉ là cột text không ràng buộc duy nhất, nên gõ trùng mã cũ sẽ
    // tạo ra 2 sản phẩm cùng mã trong danh mục, làm chia đôi số liệu bán hàng.
    if (!initialData) {
      const maMoi = maSP.trim().toUpperCase();
      const trung = dsSanPham.find((sp) => (sp.id || "").toUpperCase() === maMoi);
      if (trung) {
        toast.error(`Mã SP "${maMoi}" đã tồn tại: ${trung.tenSP}. Vui lòng dùng mã khác hoặc sửa sản phẩm đang có.`);
        return;
      }
    }

    // Match with selected preset or fallback
    const preset = allPresets.find(p => p.id === presetId);
    let bangSize;
    let tiLeSizeStr = "1:2:2:2:1";
    if (preset) {
      bangSize = {
        sizes: preset.sizes,
        ratios: preset.ratios,
        riSo: preset.riSo
      };
      tiLeSizeStr = preset.value;
    } else {
      const ratios = [1,2,2,2,1];
      bangSize = {
        sizes: ["S", "M", "L", "XL", "2XL"],
        ratios: ratios,
        riSo: 8
      };
    }

    const newProduct: Partial<SanPham> = {
      ...(initialData || {}),
      id: maSP.toUpperCase(),
      tenSP,
      loaiSP,
      tiLeSize: tiLeSizeStr,
      dsMau: dsMau.map(m => ({
        ten: m.ten,
        maSKU: m.maSKU || `${maSP}-${m.ten.toUpperCase()}`,
        dinhMuc: m.dinhMuc,
        img: m.img || "",
        video: m.video || "",
        hinhAnhChiTiet: m.hinhAnhChiTiet || []
      })),
      hinhAnh: dsMau[0]?.img || "",
      bangSize,
      giaBanLe,
      giaBanSi,
      giaBanLo,
      giaTikTok,
      giaShopee,
      giaBanDuKien: giaBanLe || giaBanSi || giaBanLo || giaTikTok || giaShopee || 0,
      giaVonDuKien: initialData?.giaVonDuKien || 0,
      chatLieu,
      ncc,
      ghiChu: ghiChu || (initialData ? initialData.ghiChu : ""),
      trangThai: initialData?.trangThai || "con-hang",
      ngayTao: initialData?.ngayTao || new Date().toISOString().substring(0, 10),
    };

    onSave(newProduct);
  };

  if (!mounted) return null;

  return (
    <ResponsiveModal
      open={true}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-[#2B4C3E]">
          <Package className="w-5 h-5"/> 
          <span>TẠO SẢN PHẨM MỚI</span>
        </div>
      }
      maxWidth="2xl"
    >
      <div className="flex flex-col bg-slate-50 h-full">
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-5">
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-sm mb-2 shadow-sm">
            <strong>Lưu ý:</strong> Đây là các trường dữ liệu bắt buộc để có thể liên kết tự động khi tạo Lệnh Cắt (KHSX).
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Mã Sản Phẩm *</label>
              <input 
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 uppercase font-mono font-bold" 
                placeholder="VD: M024"
                value={maSP} onChange={e => setMaSP(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Tên Sản Phẩm *</label>
              <input 
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500" 
                placeholder="VD: Bộ Trụ Phối Lé"
                value={tenSP} onChange={e => setTenSP(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Loại Sản Phẩm *</label>
              <select 
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 bg-white"
                value={loaiSP} onChange={e => setLoaiSP(e.target.value as LoaiSP)}
              >
                {Object.entries(LOAI_SP_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-bold italic text-fuchsia-700 bg-fuchsia-50 px-2 py-0.5 rounded border border-fuchsia-200 w-fit">✨ Tỉ lệ Size *</label>
                <button onClick={() => setIsCreatingRatio(!isCreatingRatio)} className="text-xs text-cyan-700 font-bold hover:bg-cyan-100 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded transition-colors">
                  + Tạo mới
                </button>
              </div>
              <select 
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 bg-white"
                value={presetId} onChange={e => setPresetId(e.target.value)}
              >
                {SIZE_RATIO_PRESETS.length > 0 && (
                  <optgroup label="Bảng chuẩn">
                    {SIZE_RATIO_PRESETS.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.label}
                      </option>
                    ))}
                  </optgroup>
                )}
                {customPresets.length > 0 && (
                  <optgroup label="Bảng tự tạo">
                    {customPresets.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.label}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              
              {isCreatingRatio && (
                <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg shadow-inner space-y-3 relative">
                   <div className="text-xs font-bold text-slate-700 border-b pb-1">TẠO TỈ LỆ SIZE MỚI</div>
                   <div>
                     <label className="text-xs font-semibold text-slate-600">Danh sách Size</label>
                     <input className="w-full border p-1.5 rounded text-sm mt-1 focus:ring-1 focus:ring-cyan-500 outline-none uppercase font-mono" value={customSizes} onChange={e => setCustomSizes(e.target.value.toUpperCase())} placeholder="VD: S:M:L:XL" />
                   </div>
                   <div>
                     <label className="text-xs font-semibold text-slate-600">Tỉ lệ tương ứng</label>
                     <input className="w-full border p-1.5 rounded text-sm mt-1 focus:ring-1 focus:ring-cyan-500 outline-none font-mono" value={customValues} onChange={e => setCustomValues(e.target.value)} placeholder="VD: 1:2:2:1" />
                   </div>
                   <div className="flex gap-2 pt-1">
                     <button className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded py-1.5 text-sm font-bold" onClick={handleSaveCustomRatio}>Lưu tỉ lệ</button>
                     <button className="px-3 bg-white border hover:bg-slate-50 rounded py-1.5 text-sm font-bold text-slate-600" onClick={() => setIsCreatingRatio(false)}>Hủy</button>
                   </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mt-2">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-bold text-slate-700">Thiết lập Giá bán</label>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Bán lẻ</label>
                <input type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 font-mono" placeholder="VD: 150000" value={giaBanLe || ""} onChange={e => setGiaBanLe(Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Bán sỉ</label>
                <input type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 font-mono" placeholder="VD: 120000" value={giaBanSi || ""} onChange={e => setGiaBanSi(Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Bán lô</label>
                <input type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 font-mono" placeholder="VD: 100000" value={giaBanLo || ""} onChange={e => setGiaBanLo(Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">TikTok Shop</label>
                <input type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 font-mono" placeholder="VD: 155000" value={giaTikTok || ""} onChange={e => setGiaTikTok(Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Shopee</label>
                <input type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 font-mono" placeholder="VD: 160000" value={giaShopee || ""} onChange={e => setGiaShopee(Number(e.target.value))} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Chất liệu vải</label>
              <input 
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500" 
                placeholder="VD: Cotton 100%, Cá sấu..."
                value={chatLieu} onChange={e => setChatLieu(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Nhà cung cấp (Gia công)</label>
              <input 
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500" 
                placeholder="VD: Xưởng A..."
                value={ncc} onChange={e => setNcc(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Mô tả ngắn / Ghi chú</label>
            <input 
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500" 
              placeholder="VD: Mã DM: DM-BTR | Hàng xuất dư..."
              value={ghiChu} onChange={e => setGhiChu(e.target.value)}
            />
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mt-2">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-bold text-slate-700">Màu sắc tiêu chuẩn & Định mức vải</label>
              <button 
                onClick={() => setDsMau([...dsMau, { ten: "", maSKU: "", dinhMuc: 0.25, img: "", video: "", hinhAnhChiTiet: [] }])}
                className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold hover:bg-emerald-200 flex items-center gap-1"
              >
                <Plus className="w-3 h-3"/> Thêm màu
              </button>
            </div>
            
            <div className="flex flex-col gap-4">
              {dsMau.map((m, i) => (
                <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex gap-6 items-start relative shadow-sm">
                  {/* Media Area (Left side) */}
                  <div className="w-2/5 shrink-0 flex items-end gap-2">
                    {/* Image Upload */}
                    <div className="w-24 aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg bg-white relative overflow-hidden group shadow-sm">
                      {m.img ? (
                        <img src={m.img} alt={m.ten} className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
                      ) : (
                        <div className="text-center text-slate-400">
                          <Plus className="w-5 h-5 mx-auto mb-1 text-slate-300" />
                          <span className="text-[9px] font-bold uppercase">Ảnh</span>
                        </div>
                      )}
                      <input
                        type="file"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          uploadProductFile(file, "mau-anh").then((url) => {
                            const n = [...dsMau]; n[i].img = url; setDsMau(n);
                          }).catch((err) => toast.error(err instanceof Error ? err.message : "Không upload được ảnh"));
                        }}
                      />
                    </div>
                    {/* Video Upload */}
                    <div className="w-[5.25rem] aspect-[9/16] flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 relative overflow-hidden group shadow-sm">
                      {m.video ? (
                        <video src={m.video} className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
                      ) : (
                        <div className="text-center text-slate-400">
                          <Plus className="w-5 h-5 mx-auto mb-1 text-slate-300" />
                          <span className="text-[9px] font-bold uppercase text-center leading-tight">Video<br/>(Dọc)</span>
                        </div>
                      )}
                      <input
                        type="file"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        accept="video/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          uploadProductFile(file, "mau-video").then((url) => {
                            const n = [...dsMau]; n[i].video = url; setDsMau(n);
                          }).catch((err) => toast.error(err instanceof Error ? err.message : "Không upload được video"));
                        }}
                      />
                      {m.video && (
                         <div className="absolute top-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded shadow">Video</div>
                      )}
                    </div>
                  </div>
                  
                  {/* Inputs (Right side) */}
                  <div className="w-3/5 flex flex-col gap-3 py-1">
                    
                    {/* Add hinhAnhChiTiet thumbnails and upload button */}
                    <div className="flex flex-col gap-1.5 w-full bg-white p-2 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] font-bold text-slate-500 uppercase">Ảnh chi tiết (Nhiều ảnh)</span>
                         <label className="text-[10px] bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded cursor-pointer font-bold hover:bg-cyan-100">
                            + Thêm ảnh
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                Promise.all(files.map((file) => uploadProductFile(file, "mau-chi-tiet")))
                                  .then((urls) => {
                                    const n = [...dsMau];
                                    n[i].hinhAnhChiTiet = [...(n[i].hinhAnhChiTiet || []), ...urls];
                                    setDsMau(n);
                                  })
                                  .catch((err) => toast.error(err instanceof Error ? err.message : "Không upload được ảnh"));
                              }}
                            />
                         </label>
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar min-h-[40px]">
                        {m.hinhAnhChiTiet && m.hinhAnhChiTiet.length > 0 ? (
                           m.hinhAnhChiTiet.map((imgUrl, idx) => (
                              <div key={idx} className="w-10 h-10 shrink-0 rounded border border-slate-200 relative group overflow-hidden">
                                 <img src={imgUrl} className="w-full h-full object-cover" />
                                 <div 
                                    className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center cursor-pointer"
                                    onClick={() => {
                                       const n = [...dsMau];
                                       n[i].hinhAnhChiTiet = n[i].hinhAnhChiTiet?.filter((_, index) => index !== idx);
                                       setDsMau(n);
                                    }}
                                 >
                                    <X className="w-4 h-4 text-white" />
                                 </div>
                              </div>
                           ))
                        ) : (
                           <div className="text-[10px] text-slate-400 italic flex items-center w-full h-full">Chưa có ảnh chi tiết</div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Tên màu</label>
                      <input 
                        className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-emerald-500" 
                        placeholder="VD: Đen"
                        value={m.ten} onChange={e => { const n = [...dsMau]; n[i].ten = e.target.value; setDsMau(n); }}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Mã SKU Biến thể</label>
                      <input 
                        className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm font-bold text-emerald-700 uppercase focus:ring-2 focus:ring-emerald-500" 
                        placeholder="VD: M024-DEN"
                        value={m.maSKU} onChange={e => { const n = [...dsMau]; n[i].maSKU = e.target.value.toUpperCase(); setDsMau(n); }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Định mức vải (kg/sp)</label>
                        <input 
                          className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-emerald-500" 
                          placeholder="VD: 0.25" type="number" step="0.01"
                          value={m.dinhMuc || ""} onChange={e => { const n = [...dsMau]; n[i].dinhMuc = parseFloat(e.target.value) || 0; setDsMau(n); }}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Định mức bo (kg/sp)</label>
                        <input 
                          className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-emerald-500" 
                          placeholder="VD: 0.05" type="number" step="0.01"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {dsMau.length > 1 && (
                    <button 
                      onClick={() => setDsMau(dsMau.filter((_, idx) => idx !== i))} 
                      className="absolute top-2 right-2 p-1.5 text-rose-500 hover:bg-rose-100 rounded-full transition-colors"
                      title="Xóa màu này"
                    >
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

        <div className="p-4 border-t border-slate-200 bg-white flex justify-end gap-3 sticky bottom-0 z-10">
          <button onClick={onClose} className="px-5 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Hủy</button>
          <button onClick={handleSave} className="px-5 py-2 font-bold text-white bg-[#2B4C3E] hover:bg-[#2B4C3E]/90 rounded-lg flex items-center gap-2 shadow-md">
            <Save className="w-4 h-4" /> Lưu Sản Phẩm
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
}
