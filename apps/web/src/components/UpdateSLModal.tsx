"use client";
import { useState } from "react";
import { X, Save, Package, AlertTriangle, CheckCircle2, Calculator } from "lucide-react";
import { Portal } from "@/components/ui/Portal";

export interface UpdateSLPayload {
  soLuongDat: number;
  soLuongLoi: number;
  soLuongThieu: number;
  ghiChu: string;
  hoanThanh: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (payload: UpdateSLPayload) => void;
  phieu: {
    id: string;
    maSP: string;
    phanLoai: string;
    mau: string;
    size: string;
    soLuongGiao: number;
    soLuongDat?: number;
    soLuongLoi?: number;
  };
  donGia: number;
  moduleName: string;
  moduleColor: string;
}

export default function UpdateSLModal({ open, onClose, onSave, phieu, donGia, moduleName, moduleColor }: Props) {
  const [slDat, setSlDat] = useState(phieu.soLuongDat || 0);
  const [slLoi, setSlLoi] = useState(phieu.soLuongLoi || 0);
  const [slThieu, setSlThieu] = useState(0);
  const [ghiChu, setGhiChu] = useState("");
  const [hoanThanh, setHoanThanh] = useState(false);

  if (!open) return null;

  const tongDaNhan = slDat + slLoi + slThieu;
  const conLai = phieu.soLuongGiao - tongDaNhan;
  const tienCong = slDat * donGia;
  const phatLoi = Math.round(slLoi * donGia * 0.3);
  const thucNhan = tienCong - phatLoi;

  const handleSave = () => {
    if (tongDaNhan > phieu.soLuongGiao) {
      alert(`⚠️ Tổng (${tongDaNhan}) vượt quá số lượng giao (${phieu.soLuongGiao})!`);
      return;
    }
    onSave({ soLuongDat: slDat, soLuongLoi: slLoi, soLuongThieu: slThieu, ghiChu, hoanThanh });
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
        <div
          className="w-full md:max-w-lg bg-white rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`p-4 bg-gradient-to-r ${moduleColor} text-white rounded-t-2xl flex items-center justify-between shrink-0`}>
            <div>
              <div className="text-xs opacity-90">{moduleName}</div>
              <div className="font-bold text-lg">{phieu.maSP} - {phieu.phanLoai}</div>
              <div className="text-xs opacity-90">Màu: {phieu.mau} | Size: {phieu.size}</div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-4 flex-1 overflow-y-auto">
            {/* Info row */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                <div className="text-[10px] font-semibold text-slate-500 uppercase">SL Giao</div>
                <div className="text-lg font-black">{phieu.soLuongGiao}</div>
              </div>
              <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                <div className="text-[10px] font-semibold text-emerald-600 uppercase">SL Đạt</div>
                <div className="text-lg font-black text-emerald-600">{slDat}</div>
              </div>
              <div className="bg-rose-50 p-2 rounded-lg border border-rose-100">
                <div className="text-[10px] font-semibold text-rose-600 uppercase">SL Lỗi</div>
                <div className="text-lg font-black text-rose-600">{slLoi}</div>
              </div>
            </div>

            {/* Inputs */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> SL Đạt (sản phẩm tốt)
                </label>
                <input
                  type="number"
                  min="0"
                  max={phieu.soLuongGiao}
                  value={slDat}
                  onChange={(e) => setSlDat(Math.max(0, parseInt(e.target.value) || 0))}
                  onFocus={(e) => e.target.select()}
                  className="w-full px-4 py-2 min-h-[44px] border-2 border-emerald-300 rounded-xl text-lg font-black focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-500" /> SL Lỗi (phạt 30%)
                </label>
                <input
                  type="number"
                  min="0"
                  value={slLoi}
                  onChange={(e) => setSlLoi(Math.max(0, parseInt(e.target.value) || 0))}
                  onFocus={(e) => e.target.select()}
                  className="w-full px-4 py-2 min-h-[44px] border-2 border-rose-300 rounded-xl text-lg font-black focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                  <Package className="w-4 h-4 text-amber-500" /> SL Thiếu (so với giao)
                </label>
                <input
                  type="number"
                  min="0"
                  value={slThieu}
                  onChange={(e) => setSlThieu(Math.max(0, parseInt(e.target.value) || 0))}
                  onFocus={(e) => e.target.select()}
                  className="w-full px-4 py-2 min-h-[44px] border-2 border-amber-300 rounded-xl text-lg font-black focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Ghi chú (lý do lỗi, vướng mắc...)</label>
                <textarea
                  value={ghiChu}
                  onChange={(e) => setGhiChu(e.target.value)}
                  rows={2}
                  placeholder="VD: Vải bị lỗi 2m, may lệch size M..."
                  className="w-full px-4 py-3 min-h-[44px] border-2 border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer bg-emerald-50 hover:bg-emerald-100 p-3 rounded-xl transition-colors border border-emerald-100">
                <input
                  type="checkbox"
                  checked={hoanThanh}
                  onChange={(e) => setHoanThanh(e.target.checked)}
                  className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm font-bold text-emerald-800">✅ Đã hoàn thành - sẵn sàng bàn giao</span>
              </label>
            </div>

            {/* Summary */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200 mt-2">
              <div className="text-xs font-bold text-blue-800 mb-3 flex items-center gap-1.5">
                <Calculator className="w-4 h-4" /> Tính tiền (Đơn giá: {donGia.toLocaleString()}đ)
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between items-center"><span className="text-slate-600 font-medium">Tiền công:</span><b className="text-emerald-600 text-base">+{tienCong.toLocaleString()}đ</b></div>
                <div className="flex justify-between items-center"><span className="text-slate-600 font-medium">Phạt lỗi (30%):</span><b className="text-rose-600 text-base">-{phatLoi.toLocaleString()}đ</b></div>
                <div className="flex justify-between items-center border-t border-blue-200/50 pt-2 mt-2"><span className="font-bold text-slate-700">Thực nhận:</span><b className="text-blue-700 text-xl font-black">{thucNhan.toLocaleString()}đ</b></div>
              </div>
              <div className="text-[11px] font-semibold text-slate-500 mt-3 pt-2 border-t border-blue-100 flex justify-between">
                <span>Tổng đã xử lý: {tongDaNhan}</span>
                <span>Còn lại: {conLai}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t flex flex-col sm:flex-row gap-3 shrink-0">
            <button onClick={onClose} className="w-full sm:w-1/2 py-3 min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors">
              Huỷ
            </button>
            <button onClick={handleSave} className={`w-full sm:w-1/2 py-3 min-h-[44px] ${moduleColor} hover:opacity-90 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md`}>
              <Save className="w-5 h-5" /> Lưu cập nhật
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
