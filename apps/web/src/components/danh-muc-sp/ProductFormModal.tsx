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
      hinhAnh: dsMau.find(m => m.img)?.img || initialData?.hinhAnh || "",
    };

    onSave(newProduct);
  };

  if (!mounted) return null;

  return (
    <ResponsiveModal
      open={true}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-slate-800 font-black tracking-tight">
          <div className="bg-[#2B4C3E] p-1.5 rounded-lg">
            <Package className="w-5 h-5 text-white" />
          </div>
          <span>{initialData ? "CẬP NHẬT SẢN PHẨM" : "TẠO SẢN PHẨM MỚI"}</span>
        </div>
      }
      maxWidth="3xl"
    >
      <div className="flex flex-col bg-slate-50/50 h-full">
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          
          {/* Thông báo lưu ý */}
          {!initialData && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-xl text-sm shadow-sm flex items-start gap-2">
              <span className="text-amber-600 mt-0.5">⚠️</span>
              <div>
                <strong>Lưu ý quan trọng:</strong> Đây là các trường dữ liệu bắt buộc để có thể liên kết tự động khi tạo Lệnh Cắt (KHSX). Vui lòng điền chính xác Mã Sản Phẩm.
              </div>
            </div>
          )}

          {/* KHỐI 1: THÔNG TIN CHUNG */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">1</span>
              Thông Tin Chung
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Mã Sản Phẩm <span className="text-rose-500">*</span></label>
                <input 
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 uppercase font-mono font-bold text-slate-800 bg-slate-50 transition-all hover:bg-white" 
                  placeholder="VD: M024"
                  value={maSP} onChange={e => setMaSP(e.target.value)}
                  disabled={!!initialData}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Tên Sản Phẩm <span className="text-rose-500">*</span></label>
                <input 
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-slate-800 bg-slate-50 transition-all hover:bg-white" 
                  placeholder="VD: Bộ Trụ Phối Lé"
                  value={tenSP} onChange={e => setTenSP(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Loại Sản Phẩm <span className="text-rose-500">*</span></label>
                <select 
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 bg-slate-50 font-medium text-slate-700 transition-all hover:bg-white cursor-pointer"
                  value={loaiSP} onChange={e => setLoaiSP(e.target.value as LoaiSP)}
                >
                  {Object.entries(LOAI_SP_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Mô tả ngắn / Ghi chú</label>
                <input 
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 bg-slate-50 text-slate-700 transition-all hover:bg-white" 
                  placeholder="VD: Hàng xuất dư, Form rộng..."
                  value={ghiChu} onChange={e => setGhiChu(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* KHỐI 2: ĐẶC TÍNH & SIZE */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">2</span>
              Đặc Tính & Kích Cỡ
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Chất liệu vải</label>
                <input 
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-slate-50 transition-all hover:bg-white" 
                  placeholder="VD: Cotton 100%, Cá sấu..."
                  value={chatLieu} onChange={e => setChatLieu(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Nhà cung cấp (Gia công)</label>
                <input 
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-slate-50 transition-all hover:bg-white" 
                  placeholder="VD: Xưởng may A..."
                  value={ncc} onChange={e => setNcc(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-bold text-blue-900">✨ Tỉ lệ Size chuẩn <span className="text-rose-500">*</span></label>
                <button onClick={() => setIsCreatingRatio(!isCreatingRatio)} className="text-xs text-blue-700 font-bold hover:bg-blue-100 bg-white border border-blue-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-sm">
                  <Plus className="w-3 h-3"/> Tạo tỉ lệ mới
                </button>
              </div>
              
              <select 
                className="w-full border border-blue-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-white font-medium text-slate-700 cursor-pointer shadow-sm"
                value={presetId} onChange={e => setPresetId(e.target.value)}
              >
                {SIZE_RATIO_PRESETS.length > 0 && (
                  <optgroup label="Bảng chuẩn hệ thống">
                    {SIZE_RATIO_PRESETS.map((preset) => (
                      <option key={preset.id} value={preset.id}>{preset.label}</option>
                    ))}
                  </optgroup>
                )}
                {customPresets.length > 0 && (
                  <optgroup label="Bảng tự tạo">
                    {customPresets.map((preset) => (
                      <option key={preset.id} value={preset.id}>{preset.label}</option>
                    ))}
                  </optgroup>
                )}
              </select>
              
              {isCreatingRatio && (
                <div className="mt-3 p-4 bg-white border border-blue-200 rounded-xl shadow-sm space-y-4">
                   <div className="text-sm font-bold text-blue-800 flex items-center gap-2">
                     <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span>
                     Tạo tỉ lệ Size tùy chỉnh
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="text-xs font-semibold text-slate-500 mb-1 block">Danh sách Size</label>
                       <input className="w-full border border-slate-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50 outline-none uppercase font-mono bg-slate-50" value={customSizes} onChange={e => setCustomSizes(e.target.value.toUpperCase())} placeholder="VD: S:M:L:XL" />
                     </div>
                     <div>
                       <label className="text-xs font-semibold text-slate-500 mb-1 block">Tỉ lệ tương ứng</label>
                       <input className="w-full border border-slate-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50 outline-none font-mono bg-slate-50" value={customValues} onChange={e => setCustomValues(e.target.value)} placeholder="VD: 1:2:2:1" />
                     </div>
                   </div>
                   <div className="flex gap-2 pt-2">
                     <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-sm font-bold shadow-sm transition-colors" onClick={handleSaveCustomRatio}>Lưu tỉ lệ</button>
                     <button className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg py-2 text-sm font-bold transition-colors" onClick={() => setIsCreatingRatio(false)}>Hủy</button>
                   </div>
                </div>
              )}
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
                { label: "Giá Bán lẻ", value: giaBanLe, set: setGiaBanLe },
                { label: "Giá Bán sỉ", value: giaBanSi, set: setGiaBanSi },
                { label: "Giá Bán lô", value: giaBanLo, set: setGiaBanLo },
                { label: "Giá TikTok Shop", value: giaTikTok, set: setGiaTikTok },
                { label: "Giá Shopee", value: giaShopee, set: setGiaShopee },
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
                      onChange={e => item.set(Number(e.target.value))} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* KHỐI 4: QUẢN LÝ BIẾN THỂ MÀU SẮC & ĐỊNH MỨC */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-fuchsia-500"></div>
            
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-fuchsia-100 text-fuchsia-700 flex items-center justify-center text-xs">4</span>
                Quản Lý Biến Thể Màu
              </h3>
              <button 
                onClick={() => setDsMau([...dsMau, { ten: "", maSKU: "", dinhMuc: 0.25, img: "", video: "", hinhAnhChiTiet: [] }])}
                className="text-sm bg-fuchsia-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-fuchsia-700 transition-colors flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-4 h-4"/> Thêm màu mới
              </button>
            </div>
            
            <div className="flex flex-col gap-4">
              {dsMau.map((m, i) => (
                <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row gap-5 relative shadow-sm hover:shadow-md transition-shadow group">
                  
                  {/* Cột trái: Media (Ảnh/Video đại diện) */}
                  <div className="w-full md:w-auto flex flex-row gap-3">
                    <div className="flex flex-col gap-1 w-24">
                      <span className="text-[10px] font-bold text-slate-400 uppercase text-center">Ảnh Chính</span>
                      <div className="w-24 aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-fuchsia-400 rounded-xl bg-white relative overflow-hidden group/img shadow-sm transition-colors cursor-pointer">
                        {m.img ? (
                          <img src={m.img} alt={m.ten} className="w-full h-full object-cover group-hover/img:opacity-50 transition-opacity" />
                        ) : (
                          <div className="text-center text-slate-400">
                            <Plus className="w-6 h-6 mx-auto mb-1 text-slate-300 group-hover/img:text-fuchsia-400" />
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
                    </div>

                    <div className="flex flex-col gap-1 w-[5.25rem]">
                      <span className="text-[10px] font-bold text-slate-400 uppercase text-center">Video (Dọc)</span>
                      <div className="w-[5.25rem] aspect-[9/16] flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-fuchsia-400 rounded-xl bg-slate-100 relative overflow-hidden group/vid shadow-sm transition-colors cursor-pointer">
                        {m.video ? (
                          <video src={m.video} className="w-full h-full object-cover group-hover/vid:opacity-50 transition-opacity" />
                        ) : (
                          <div className="text-center text-slate-400">
                            <Plus className="w-6 h-6 mx-auto mb-1 text-slate-300 group-hover/vid:text-fuchsia-400" />
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
                        {m.video && <div className="absolute top-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded shadow backdrop-blur-sm">Video</div>}
                      </div>
                    </div>
                  </div>
                  
                  {/* Cột phải: Thông số chi tiết & Ảnh phụ */}
                  <div className="flex-1 flex flex-col gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Tên màu sắc</label>
                        <input 
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-fuchsia-500/50 outline-none" 
                          placeholder="VD: Đen, Trắng..."
                          value={m.ten} onChange={e => { const n = [...dsMau]; n[i].ten = e.target.value; setDsMau(n); }}
                        />
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Mã SKU Phân loại</label>
                        <input 
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-fuchsia-700 uppercase focus:ring-2 focus:ring-fuchsia-500/50 outline-none bg-fuchsia-50/30" 
                          placeholder="VD: M024-DEN"
                          value={m.maSKU} onChange={e => { const n = [...dsMau]; n[i].maSKU = e.target.value.toUpperCase(); setDsMau(n); }}
                        />
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Định mức Vải (kg/sp)</label>
                        <input 
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none font-mono" 
                          placeholder="0.25" type="number" step="0.01"
                          value={m.dinhMuc || ""} onChange={e => { const n = [...dsMau]; n[i].dinhMuc = parseFloat(e.target.value) || 0; setDsMau(n); }}
                        />
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Định mức Bo (kg/sp)</label>
                        <input 
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none font-mono text-slate-400" 
                          placeholder="Sắp ra mắt..." type="number" step="0.01" disabled
                        />
                      </div>
                    </div>

                    {/* Ảnh chi tiết */}
                    <div className="flex flex-col gap-2 w-full bg-white p-3 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between">
                         <span className="text-xs font-bold text-slate-600">Bộ ảnh chi tiết (Gallery)</span>
                         <label className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg cursor-pointer font-bold hover:bg-slate-200 transition-colors border border-slate-300 flex items-center gap-1 shadow-sm">
                            <Plus className="w-3 h-3"/> Thêm ảnh
                            <input
                              type="file" multiple accept="image/*" className="hidden"
                              onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                Promise.all(files.map((file) => uploadProductFile(file, "mau-chi-tiet")))
                                  .then((urls) => {
                                    const n = [...dsMau]; n[i].hinhAnhChiTiet = [...(n[i].hinhAnhChiTiet || []), ...urls]; setDsMau(n);
                                  })
                                  .catch((err) => toast.error(err instanceof Error ? err.message : "Không upload được ảnh"));
                              }}
                            />
                         </label>
                      </div>
                      <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1 no-scrollbar min-h-[60px]">
                        {m.hinhAnhChiTiet && m.hinhAnhChiTiet.length > 0 ? (
                           m.hinhAnhChiTiet.map((imgUrl, idx) => (
                              <div key={idx} className="w-14 h-14 shrink-0 rounded-lg border border-slate-200 relative group/thumb overflow-hidden shadow-sm">
                                 <img src={imgUrl} className="w-full h-full object-cover" />
                                 <div 
                                    className="absolute inset-0 bg-black/50 hidden group-hover/thumb:flex items-center justify-center cursor-pointer backdrop-blur-sm"
                                    onClick={() => {
                                       const n = [...dsMau];
                                       n[i].hinhAnhChiTiet = n[i].hinhAnhChiTiet?.filter((_, index) => index !== idx);
                                       setDsMau(n);
                                    }}
                                 >
                                    <Trash2 className="w-4 h-4 text-white" />
                                 </div>
                              </div>
                           ))
                        ) : (
                           <div className="text-xs text-slate-400 italic flex items-center w-full h-full justify-center bg-slate-50 rounded-lg border border-dashed border-slate-200 py-3">
                             Khu vực upload ảnh phụ, ảnh mẫu mặc...
                           </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Nút xóa biến thể */}
                  {dsMau.length > 1 && (
                    <button 
                      onClick={() => setDsMau(dsMau.filter((_, idx) => idx !== i))} 
                      className="absolute -top-3 -right-3 p-2 bg-white text-rose-500 hover:bg-rose-50 border border-slate-200 rounded-full shadow-md transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                      title="Xóa màu này"
                    >
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Spacing for sticky footer */}
          <div className="h-4"></div>
        </div>

        {/* STICKY FOOTER */}
        <div className="p-4 sm:px-6 sm:py-4 border-t border-slate-200 bg-white flex justify-end gap-3 sticky bottom-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button onClick={onClose} className="px-6 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Đóng</button>
          <button onClick={handleSave} className="px-8 py-2.5 font-bold text-white bg-[#2B4C3E] hover:bg-[#1f382d] rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg transition-all scale-100 hover:scale-[1.02]">
            <Save className="w-5 h-5" /> LƯU SẢN PHẨM
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
}
