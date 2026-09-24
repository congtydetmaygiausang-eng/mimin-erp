import { useState, useMemo, useEffect } from "react";
import { saveSharedSizeRatioPreset, buildCustomSizeRatioPreset, loadSharedSizeRatioPresets, type SizeRatioPreset } from "@/lib/size-ratio-presets";
import { X, Sparkles, Check, Calculator, List } from "lucide-react";
import { toast } from "sonner";

export function AddSizeRatioModal({ onClose }: { onClose: () => void }) {
  const [label, setLabel] = useState("");
  const [sizesStr, setSizesStr] = useState("M, L, XL, 2XL, 3XL");
  const [ratiosStr, setRatiosStr] = useState("1:2:2:2:1");
  const [loading, setLoading] = useState(false);
  const [ghiChu, setGhiChu] = useState("");
  const [presets, setPresets] = useState<SizeRatioPreset[]>([]);

  const loadData = async () => {
    try {
      const data = await loadSharedSizeRatioPresets();
      setPresets(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentRatios = useMemo(() => {
    return ratiosStr.split(":").map(r => parseInt(r.trim(), 10)).filter(r => !isNaN(r));
  }, [ratiosStr]);

  const currentRi = useMemo(() => {
    return currentRatios.reduce((a, b) => a + b, 0);
  }, [currentRatios]);

  const handleSave = async () => {
    try {
      const sizes = sizesStr.split(",").map(s => s.trim()).filter(Boolean);
      const ratios = currentRatios;

      if (sizes.length !== ratios.length) {
        toast.error("Số lượng size và số lượng tỉ lệ phải bằng nhau!");
        return;
      }
      if (sizes.length === 0) {
        toast.error("Vui lòng nhập ít nhất 1 size");
        return;
      }

      setLoading(true);
      const preset = buildCustomSizeRatioPreset(sizes, ratios, label);
      if (ghiChu) preset.ghiChu = ghiChu;

      await saveSharedSizeRatioPreset(preset);
      toast.success("Thêm bảng size thành công!");
      
      setLabel("");
      setGhiChu("");
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Quản Lý Bảng Tỉ Lệ Size</h2>
              <p className="text-xs text-slate-500">Tạo và xem các bảng master dùng chung cho mọi lệnh cắt</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row overflow-hidden flex-1">
          {/* CỘT TRÁI: FORM THÊM MỚI */}
          <div className="p-5 w-full md:w-1/2 overflow-y-auto border-r border-slate-100 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm mb-3">Tạo Bảng Size Mới</h3>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Tên bảng size <span className="text-rose-500">*</span></label>
              <input 
                value={label} onChange={e => setLabel(e.target.value)}
                placeholder={`VD: Bảng chuẩn (Ri ${currentRi > 0 ? currentRi : 8})`}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Danh sách Size <span className="text-rose-500">*</span></label>
              <input 
                value={sizesStr} onChange={e => setSizesStr(e.target.value)}
                placeholder="M, L, XL, 2XL, 3XL"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
              />
              <p className="text-xs text-slate-500 mt-1">Cách nhau bằng dấu phẩy (,)</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-bold text-slate-700">Tỉ lệ tương ứng <span className="text-rose-500">*</span></label>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-xs font-bold">
                  <Calculator className="w-3 h-3" />
                  <span>Quy đổi: Ri {currentRi}</span>
                </div>
              </div>
              <input 
                value={ratiosStr} onChange={e => setRatiosStr(e.target.value)}
                placeholder="1:2:2:2:1"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all font-mono"
              />
              <p className="text-xs text-slate-500 mt-1">Cách nhau bằng dấu hai chấm (:). Tổng tỉ lệ = Ri.</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Ghi chú thêm</label>
              <input 
                value={ghiChu} onChange={e => setGhiChu(e.target.value)}
                placeholder="Ghi chú (không bắt buộc)"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
              />
            </div>

            <div className="pt-2">
              <button 
                disabled={loading || !label || !sizesStr || !ratiosStr}
                onClick={handleSave} 
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-emerald-500/20"
              >
                {loading ? "Đang lưu..." : <><Check className="w-4 h-4" /> Lưu bảng size mới</>}
              </button>
            </div>
          </div>

          {/* CỘT PHẢI: DANH SÁCH BẢNG ĐÃ LƯU */}
          <div className="p-5 w-full md:w-1/2 overflow-y-auto bg-slate-50 rounded-br-2xl">
            <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
              <List className="w-4 h-4 text-indigo-500" />
              Danh sách Bảng Size từ Supabase
            </h3>
            
            <div className="space-y-3">
              {presets.length === 0 ? (
                <div className="text-center p-5 text-sm text-slate-500 bg-white rounded-xl border border-dashed border-slate-200">
                  Chưa có bảng size nào
                </div>
              ) : (
                presets.map(p => (
                  <div key={p.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-slate-800 text-sm">{p.label}</div>
                      <div className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded">
                        Ri {p.riSo}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500">Sizes:</span> <span className="font-semibold text-slate-700">{p.sizes.join(", ")}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Tỉ lệ:</span> <span className="font-semibold text-slate-700">{p.value}</span>
                      </div>
                    </div>
                    
                    {p.ghiChu && (
                      <div className="mt-2 text-xs text-slate-500 italic">
                        * {p.ghiChu}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
