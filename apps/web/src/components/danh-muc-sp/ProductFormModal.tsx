import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Save, Plus, Trash2, Package } from "lucide-react";
import { toast } from "sonner";
import { useDanhMucSP, type SanPham } from "@/lib/data/danh-muc-sp-store";
import { LOAI_SP_LABELS, type LoaiSP } from "@/lib/data/lenh-cat-store";
import { type SizeRatioPreset, SIZE_RATIO_PRESETS } from "@/lib/size-ratio-presets";
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

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('CUSTOM_SIZE_RATIOS');
    if (saved) {
      try { setCustomPresets(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const allPresets = [...SIZE_RATIO_PRESETS, ...customPresets];

  const handleSaveNewRatio = () => {
    const sList = customSizes.split(':').filter(Boolean);
    const vList = customValues.split(':').map(Number).filter(n => !isNaN(n));
    if (sList.length === 0 || vList.length === 0 || sList.length !== vList.length) {
      toast.error("Định dạng không hợp lệ. Số lượng size và tỉ lệ phải bằng nhau!");
      return;
    }
    const val = customValues;
    const riSo = vList.reduce((a, b) => a + b, 0);
    const label = `${customSizes} = ${customValues} (Ri${riSo})`;
    const newPreset: SizeRatioPreset = {
      id: `custom-${Date.now()}`,
      label,
      value: val,
      sizes: sList,
      ratios: vList,
      riSo,
      ghiChu: "Tùy chỉnh"
    };
    const updated = [...customPresets, newPreset];
    setCustomPresets(updated);
    localStorage.setItem('CUSTOM_SIZE_RATIOS', JSON.stringify(updated));
    setTiLeSize(val);
    setIsCreatingRatio(false);
    toast.success("Đã lưu tỉ lệ size mới!");
  };

  const [maSP, setMaSP] = useState(initialData?.id || "");
  const [tenSP, setTenSP] = useState(initialData?.tenSP || "");
  const [loaiSP, setLoaiSP] = useState<LoaiSP>(initialData?.loaiSP || "BoTru");
  const [tiLeSize, setTiLeSize] = useState(initialData?.bangSize?.ratios.join(":") || "1:2:2:2:1");
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
  const [giaBanDuKien, setGiaBanDuKien] = useState(initialData?.giaBanDuKien || 0);
  const [giaVonDuKien, setGiaVonDuKien] = useState(initialData?.giaVonDuKien || 0);

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
    const preset = allPresets.find(p => p.value === tiLeSize);
    let bangSize;
    if (preset) {
      bangSize = {
        sizes: preset.sizes,
        ratios: preset.ratios,
        riSo: preset.riSo
      };
    } else {
      const ratios = tiLeSize.split(":").map(Number);
      bangSize = {
        sizes: ["M", "L", "XL", "2XL", "3XL"].slice(0, ratios.length),
        ratios: ratios,
        riSo: ratios.reduce((a, b) => a + b, 0)
      };
    }

    const newProduct: Partial<SanPham> = {
      ...(initialData || {}),
      id: maSP.toUpperCase(),
      tenSP,
      loaiSP,
      tiLeSize,
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
      giaBanDuKien,
      giaVonDuKien,
      chatLieu,
      ncc,
      ghiChu: ghiChu || (initialData ? initialData.ghiChu : ""),
      trangThai: initialData?.trangThai || "con-hang",
      ngayTao: initialData?.ngayTao || new Date().toISOString().substring(0, 10),
    };

    onSave(newProduct);
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-start justify-center p-4 pt-16 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col animate-slide-up my-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 bg-[#2B4C3E] text-white flex justify-between items-center rounded-t-2xl">
          <h2 className="text-xl font-bold flex items-center gap-2"><Package className="w-5 h-5"/> TẠO SẢN PHẨM MỚI</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X className="w-6 h-6" /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5 bg-slate-50">
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
                <label className="block text-sm font-bold text-slate-700">Tỉ lệ Size *</label>
                <button onClick={() => setIsCreatingRatio(!isCreatingRatio)} className="text-xs text-cyan-700 font-bold hover:bg-cyan-100 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded transition-colors">
                  + Tạo mới
                </button>
              </div>
              <select 
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 bg-white"
                value={tiLeSize} onChange={e => setTiLeSize(e.target.value)}
              >
                {allPresets.map((preset) => (
                  <option key={preset.id} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
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
                     <button className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded py-1.5 text-sm font-bold" onClick={handleSaveNewRatio}>Lưu tỉ lệ</button>
                     <button className="px-3 bg-white border hover:bg-slate-50 rounded py-1.5 text-sm font-bold text-slate-600" onClick={() => setIsCreatingRatio(false)}>Hủy</button>
                   </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Giá bán dự kiến (VNĐ)</label>
              <input 
                type="number"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 font-mono" 
                placeholder="VD: 150000"
                value={giaBanDuKien || ""} onChange={e => setGiaBanDuKien(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Giá vốn dự kiến (VNĐ)</label>
              <input 
                type="number"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 font-mono" 
                placeholder="VD: 85000"
                value={giaVonDuKien || ""} onChange={e => setGiaVonDuKien(Number(e.target.value))}
              />
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

        <div className="p-4 border-t border-slate-200 bg-white flex justify-end gap-3 rounded-b-2xl">
          <button onClick={onClose} className="px-5 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Hủy</button>
          <button onClick={handleSave} className="px-5 py-2 font-bold text-white bg-[#2B4C3E] hover:bg-[#2B4C3E]/90 rounded-lg flex items-center gap-2 shadow-md">
            <Save className="w-4 h-4" /> Lưu Sản Phẩm
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
