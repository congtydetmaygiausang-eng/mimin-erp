import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  saveSharedSizeRatioPreset, 
  deleteSharedSizeRatioPreset,
  buildCustomSizeRatioPreset, 
  loadSharedSizeRatioPresets, 
  SIZE_RATIO_PRESETS,
  type SizeRatioPreset 
} from "@/lib/size-ratio-presets";
import { X, Sparkles, Check, Calculator, List, Plus, Ruler, CheckCircle2, Trash2, Layers, Bookmark } from "lucide-react";
import { toast } from "sonner";

const QUICK_TEMPLATES = [
  { label: "M - 2XL (Ri 6)", sizes: "M, L, XL, 2XL", ratios: "1:2:2:1" },
  { label: "M - 2XL (Ri 8)", sizes: "M, L, XL, 2XL", ratios: "2:2:2:2" },
  { label: "M - 3XL (Ri 8)", sizes: "M, L, XL, 2XL, 3XL", ratios: "1:2:2:2:1" },
  { label: "M - 3XL (Ri 10)", sizes: "M, L, XL, 2XL, 3XL", ratios: "2:2:2:2:2" },
  { label: "L - 3XL (Ri 8)", sizes: "L, XL, 2XL, 3XL", ratios: "2:2:2:2" },
  { label: "L - 3XL (Ri 4)", sizes: "L, XL, 2XL, 3XL", ratios: "1:1:1:1" },
  { label: "L - 3XL (Ri 6)", sizes: "L, XL, 2XL, 3XL", ratios: "1:2:2:1" },
  { label: "S - 3XL (Ri 9)", sizes: "S, M, L, XL, 2XL, 3XL", ratios: "1:2:2:2:1:1" },
];

export function AddSizeRatioModal({ 
  onClose,
  onSelectPreset,
}: { 
  onClose: () => void;
  onSelectPreset?: (preset: SizeRatioPreset) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<"all" | "custom" | "system">("all");
  const [label, setLabel] = useState("");
  const [sizesStr, setSizesStr] = useState("M, L, XL, 2XL, 3XL");
  const [ratiosStr, setRatiosStr] = useState("1:2:2:2:1");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [ghiChu, setGhiChu] = useState("");
  const [presets, setPresets] = useState<SizeRatioPreset[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const applyTemplate = (tpl: typeof QUICK_TEMPLATES[0]) => {
    setSizesStr(tpl.sizes);
    setRatiosStr(tpl.ratios);
    if (!label) {
      setLabel(`Bảng ${tpl.label}`);
    }
  };

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
      const finalLabel = label.trim() || `Bảng chuẩn (${sizes[0]}-${sizes[sizes.length - 1]}, Ri ${currentRi})`;
      const preset = buildCustomSizeRatioPreset(sizes, ratios, finalLabel);
      if (ghiChu) preset.ghiChu = ghiChu;

      await saveSharedSizeRatioPreset(preset);
      toast.success("Thêm bảng size thành công!");
      
      setLabel("");
      setGhiChu("");
      await loadData();

      // Nếu được mở từ form thêm sản phẩm, tự động áp dụng ngay bảng vừa tạo
      if (onSelectPreset) {
        onSelectPreset(preset);
        onClose();
      }
    } catch (err: any) {
      toast.error(err.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa bảng size "${name}"?`)) return;
    try {
      setDeletingId(id);
      await deleteSharedSizeRatioPreset(id);
      toast.success("Đã xóa bảng size!");
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Không thể xóa");
    } finally {
      setDeletingId(null);
    }
  };

  const displayedPresets = useMemo(() => {
    if (tab === "custom") return presets;
    if (tab === "system") return SIZE_RATIO_PRESETS;
    // Gộp cả 2, ưu tiên custom
    return [...presets, ...SIZE_RATIO_PRESETS];
  }, [tab, presets]);

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  const modalContent = (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-md animate-in fade-in p-3 sm:p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] border border-slate-200 overflow-hidden relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50/70 via-white to-indigo-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
                Quản Lý Bảng Tỉ Lệ Size
                {onSelectPreset && (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Áp dụng cho lô hàng
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500">Tạo mới hoặc chọn bảng master dùng chung cho sản xuất và kho thành phẩm</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-700 cursor-pointer"
            title="Đóng modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung 2 cột: Tạo mới & Danh sách đã lưu */}
        <div className="flex flex-col md:flex-row overflow-hidden flex-1 min-h-0">
          {/* CỘT TRÁI: FORM THÊM MỚI */}
          <div className="p-4 sm:p-5 w-full md:w-1/2 overflow-y-auto border-r border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                Tạo Bảng Size Mới
              </h3>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/70">
                Lưu vào Supabase
              </span>
            </div>

            {/* Mẫu nhanh */}
            <div>
              <div className="text-[11px] font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                <span>Gợi ý mẫu tỉ lệ phổ biến (bấm để chọn nhanh):</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_TEMPLATES.map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => applyTemplate(tpl)}
                    className="text-[11px] font-bold px-2 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 transition-all cursor-pointer"
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tên bảng size <span className="text-rose-500">*</span>
              </label>
              <input 
                value={label} 
                onChange={e => setLabel(e.target.value)}
                placeholder={`VD: Bảng chuẩn Ri ${currentRi > 0 ? currentRi : 8}`}
                className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all shadow-2xs font-semibold text-slate-800 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Danh sách Size <span className="text-rose-500">*</span>
              </label>
              <input 
                value={sizesStr} 
                onChange={e => setSizesStr(e.target.value)}
                placeholder="M, L, XL, 2XL, 3XL"
                className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all shadow-2xs font-mono font-bold text-slate-800 bg-white"
              />
              <p className="text-[11px] text-slate-400 mt-1">Các size cách nhau bằng dấu phẩy (,)</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Tỉ lệ tương ứng <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-xs font-black border border-emerald-200">
                  <Calculator className="w-3 h-3 text-emerald-600" />
                  <span>Quy đổi: Ri {currentRi}</span>
                </div>
              </div>
              <input 
                value={ratiosStr} 
                onChange={e => setRatiosStr(e.target.value)}
                placeholder="1:2:2:2:1"
                className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all font-mono font-black shadow-2xs text-emerald-800 bg-white"
              />
              <p className="text-[11px] text-slate-400 mt-1">Cách nhau bằng dấu hai chấm (:). Tổng tỉ lệ = Ri.</p>
            </div>

            {/* Preview thẻ size trực quan ngay khi gõ */}
            {sizesStr && ratiosStr && (
              <div className="p-3 bg-gradient-to-br from-slate-50 to-emerald-50/30 rounded-xl border border-slate-200 space-y-2">
                <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
                  <span>Xem trước phân bổ:</span>
                  <span className="text-emerald-700 font-black">Ri {currentRi} ({sizesStr.split(",").filter(Boolean).length} size)</span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                  {sizesStr.split(",").map((s, idx) => {
                    const r = currentRatios[idx];
                    const pct = currentRi > 0 && r ? Math.round((r / currentRi) * 100) : 0;
                    return (
                      <div key={idx} className="bg-white px-2 py-1.5 rounded-lg border border-slate-200 shadow-2xs text-center">
                        <div className="text-xs font-black text-slate-800 leading-none">{s.trim() || "?"}</div>
                        <div className="text-xs font-bold text-emerald-600 mt-1 leading-none font-mono">x{r !== undefined ? r : "?"}</div>
                        <div className="text-[9px] text-slate-400 mt-0.5 font-medium">{pct}%</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú thêm</label>
              <input 
                value={ghiChu} 
                onChange={e => setGhiChu(e.target.value)}
                placeholder="Ghi chú (không bắt buộc)"
                className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all shadow-2xs"
              />
            </div>

            <div className="pt-2">
              <button 
                type="button"
                disabled={loading || !sizesStr || !ratiosStr}
                onClick={handleSave} 
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-600/20 cursor-pointer text-sm"
              >
                {loading ? "Đang lưu lên Supabase..." : <><Check className="w-4 h-4 stroke-[2.5]" /> Lưu bảng size mới</>}
              </button>
            </div>
          </div>

          {/* CỘT PHẢI: DANH SÁCH BẢNG ĐÃ LƯU */}
          <div className="p-4 sm:p-5 w-full md:w-1/2 overflow-y-auto bg-slate-50/70 rounded-br-2xl flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <List className="w-4 h-4 text-indigo-500" />
                Danh sách Bảng Tỉ Lệ ({displayedPresets.length})
              </h3>

              {/* Tabs */}
              <div className="flex bg-white rounded-lg p-0.5 border border-slate-200 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setTab("all")}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${tab === "all" ? "bg-indigo-600 text-white" : "text-slate-600 hover:text-slate-900"}`}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setTab("custom")}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${tab === "custom" ? "bg-indigo-600 text-white" : "text-slate-600 hover:text-slate-900"}`}
                >
                  Supabase ({presets.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTab("system")}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${tab === "system" ? "bg-indigo-600 text-white" : "text-slate-600 hover:text-slate-900"}`}
                >
                  Chuẩn ({SIZE_RATIO_PRESETS.length})
                </button>
              </div>
            </div>
            
            <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
              {displayedPresets.length === 0 ? (
                <div className="text-center p-8 text-sm text-slate-400 bg-white rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center">
                  <Ruler className="w-8 h-8 text-slate-300 mb-2" />
                  <span>Chưa có bảng size nào</span>
                  <span className="text-xs text-slate-400 mt-1">Hãy tạo bảng đầu tiên ở khung bên trái</span>
                </div>
              ) : (
                displayedPresets.map(p => {
                  const isCustom = presets.some(c => c.id === p.id);
                  return (
                    <div 
                      key={p.id} 
                      className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all group/preset"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-1.5 flex-1 pr-2">
                          <div className="font-extrabold text-slate-800 text-sm group-hover/preset:text-indigo-700 transition-colors">
                            {p.label}
                          </div>
                          {isCustom ? (
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              Supabase
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              Hệ thống
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-black rounded-md border border-indigo-200/70">
                            Ri {p.riSo}
                          </div>
                          {isCustom && (
                            <button
                              type="button"
                              disabled={deletingId === p.id}
                              onClick={() => handleDelete(p.id, p.label)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title="Xóa bảng size này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                        <div>
                          <span className="text-slate-400 font-medium">Sizes:</span>{" "}
                          <span className="font-bold text-slate-700">{p.sizes.join(", ")}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium">Tỉ lệ:</span>{" "}
                          <span className="font-mono font-bold text-emerald-700">{p.value}</span>
                        </div>
                      </div>

                      {/* Preview chip tỉ lệ */}
                      <div className="flex flex-wrap gap-1 py-1">
                        {p.sizes.map((s, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200/70">
                            {s}: <span className="text-emerald-700 font-mono font-black">{p.ratios[idx] || 0}</span>
                          </span>
                        ))}
                      </div>
                      
                      {p.ghiChu && (
                        <div className="mt-1.5 text-[11px] text-slate-400 italic">
                          * {p.ghiChu}
                        </div>
                      )}

                      {/* Nút áp dụng bảng này */}
                      {onSelectPreset && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectPreset(p);
                            onClose();
                          }}
                          className="mt-2.5 w-full py-1.5 px-3 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white text-xs font-bold rounded-lg border border-indigo-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Áp dụng bảng này cho lô hàng
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
