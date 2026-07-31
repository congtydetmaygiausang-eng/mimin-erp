"use client";
import { useState } from "react";
import { X, Save, Package, AlertTriangle, CheckCircle2, Calculator } from "lucide-react";

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
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full md:max-w-lg bg-white rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-4 bg-gradient-to-r ${moduleColor} text-white rounded-t-2xl flex items-center justify-between`}>
          <div>
            <div className="text-xs opacity-90">{moduleName}</div>
            <div className="font-bold text-lg">{phieu.maSP} - {phieu.phanLoai}</div>
            <div className="text-xs opacity-90">Màu: {phieu.mau} | Size: {phieu.size}</div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Info row */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-50 p-2 rounded-lg">
              <div className="text-[10px] text-slate-500">SL Giao</div>
              <div className="text-lg font-bold">{phieu.soLuongGiao}</div>
            </div>
            <div className="bg-emerald-50 p-2 rounded-lg">
              <div className="text-[10px] text-emerald-600">SL Đạt</div>
              <div className="text-lg font-bold text-emerald-600">{slDat}</div>
            </div>
            <div className="bg-rose-50 p-2 rounded-lg">
              <div className="text-[10px] text-rose-600">SL Lỗi</div>
              <div className="text-lg font-bold text-rose-600">{slLoi}</div>
            </div>
          </div>

          {/* Inputs */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> SL Đạt (sản phẩm tốt)
              </label>
              <input
                type="number"
                min="0"
                max={phieu.soLuongGiao}
                value={slDat}
                onChange={(e) => setSlDat(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2.5 border-2 border-emerald-300 rounded-lg text-lg font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> SL Lỗi (phạt 30%)
              </label>
              <input
                type="number"
                min="0"
                value={slLoi}
                onChange={(e) => setSlLoi(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2.5 border-2 border-rose-300 rounded-lg text-lg font-bold focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1 mb-1">
                <Package className="w-3.5 h-3.5 text-amber-500" /> SL Thiếu (so với giao)
              </label>
              <input
                type="number"
                min="0"
                value={slThieu}
                onChange={(e) => setSlThieu(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2.5 border-2 border-amber-300 rounded-lg text-lg font-bold focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Ghi chú (lý do lỗi, vướng mắc...)</label>
              <textarea
                value={ghiChu}
                onChange={(e) => setGhiChu(e.target.value)}
                rows={2}
                placeholder="VD: Vải bị lỗi 2m, may lệch size M..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer bg-emerald-50 p-2.5 rounded-lg">
              <input
                type="checkbox"
                checked={hoanThanh}
                onChange={(e) => setHoanThanh(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-semibold text-emerald-700">✅ Đã hoàn thành - sẵn sàng bàn giao</span>
            </label>
          </div>

          {/* Summary */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-xl border border-blue-200">
            <div className="text-xs font-bold text-blue-700 mb-2 flex items-center gap-1">
              <Calculator className="w-3.5 h-3.5" /> Tính tiền (Đơn giá: {donGia.toLocaleString()}đ)
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>Tiền công:</span><b className="text-emerald-600">+{tienCong.toLocaleString()}đ</b></div>
              <div className="flex justify-between"><span>Phạt lỗi (30%):</span><b className="text-rose-600">-{phatLoi.toLocaleString()}đ</b></div>
              <div className="flex justify-between border-t pt-1 mt-1"><span>Thực nhận:</span><b className="text-blue-700 text-lg">{thucNhan.toLocaleString()}đ</b></div>
            </div>
            <div className="text-[10px] text-slate-500 mt-2">
              Tổng đã xử lý: {tongDaNhan} | Còn lại: {conLai}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-semibold">
            Huỷ
          </button>
          <button onClick={handleSave} className={`flex-1 py-2.5 ${moduleColor} text-white rounded-lg font-bold flex items-center justify-center gap-1.5`}>
            <Save className="w-4 h-4" /> Lưu
          </button>
        </div>
      </div>
    </div>
  );
}
