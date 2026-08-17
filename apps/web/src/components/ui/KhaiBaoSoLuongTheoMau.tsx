import { useState, useEffect } from "react";
import { CheckCircle2, AlertTriangle, Package } from "lucide-react";

export type ChiTietMauInput = {
  mau: string;
  soLuongNhan: number;
  soLuongDat: number;
  soLuongLoi: number;
};

interface Props {
  dsMau: { ten: string; slThucTe?: number; slDuKien: number }[];
  value: Record<string, ChiTietMauInput>;
  onChange: (newValue: Record<string, ChiTietMauInput>) => void;
  // Các thông số thêm để phục vụ layout
  showLyDoLoi?: boolean;
  lyDoLoi?: string;
  onLyDoLoiChange?: (lyDo: string) => void;
  // Field bổ sung (VD: Số lượng thùng)
  extraField?: React.ReactNode;
}

export function KhaiBaoSoLuongTheoMau({ dsMau, value, onChange, showLyDoLoi, lyDoLoi, onLyDoLoiChange, extraField }: Props) {
  
  // Khởi tạo giá trị mặc định nếu value chưa có
  useEffect(() => {
    if (Object.keys(value).length === 0 && dsMau?.length > 0) {
      const initVal: Record<string, ChiTietMauInput> = {};
      dsMau.forEach(m => {
        initVal[m.ten] = {
          mau: m.ten,
          soLuongNhan: m.slThucTe || m.slDuKien || 0,
          soLuongDat: m.slThucTe || m.slDuKien || 0,
          soLuongLoi: 0
        };
      });
      onChange(initVal);
    }
  }, [dsMau, value]);

  const handleChange = (mauTen: string, field: keyof ChiTietMauInput, val: number) => {
    onChange({
      ...value,
      [mauTen]: {
        ...value[mauTen],
        [field]: val
      }
    });
  };

  // Tính tổng để hiển thị
  const tongNhan = Object.values(value).reduce((sum, item) => sum + (item?.soLuongNhan || 0), 0);
  const tongDat = Object.values(value).reduce((sum, item) => sum + (item?.soLuongDat || 0), 0);
  const tongLoi = Object.values(value).reduce((sum, item) => sum + (item?.soLuongLoi || 0), 0);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mb-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 border-b border-slate-100 pb-3 gap-2">
        <div className="text-sm font-black text-sky-700 flex items-center gap-1.5 uppercase">
          <CheckCircle2 className="w-4 h-4" /> Khai báo chi tiết theo màu
        </div>
        <div className="flex gap-4 text-xs font-semibold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <span className="text-slate-600">Tổng nhận: <span className="text-slate-800">{tongNhan}</span></span>
          <span className="text-emerald-600">Tổng đạt: <span className="text-emerald-700 font-bold">{tongDat}</span></span>
          <span className="text-rose-600">Tổng lỗi: <span className="text-rose-700 font-bold">{tongLoi}</span></span>
        </div>
      </div>

      <div className="space-y-3">
        {/* Header (desktop) */}
        <div className="hidden md:grid grid-cols-12 gap-3 px-3 pb-1 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          <div className="col-span-3">Màu sắc</div>
          <div className="col-span-3 text-center">📦 Số lượng nhận</div>
          <div className="col-span-3 text-center text-emerald-600">🟢 Số lượng đạt</div>
          <div className="col-span-3 text-center text-rose-600">🔴 Số lượng lỗi</div>
        </div>

        {/* Các dòng màu */}
        {dsMau?.map((m) => {
          const rowData = value[m.ten] || { soLuongNhan: 0, soLuongDat: 0, soLuongLoi: 0 };
          return (
            <div key={m.ten} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-slate-50 md:bg-transparent p-3 md:p-0 rounded-lg border border-slate-100 md:border-none">
              <div className="col-span-1 md:col-span-3 font-bold text-slate-700 text-sm flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-300 shadow-sm" />
                {m.ten}
              </div>
              
              <div className="col-span-1 md:col-span-3">
                <div className="md:hidden text-[10px] font-semibold text-slate-500 mb-1">S.Lượng nhận</div>
                <input type="number" 
                  value={rowData.soLuongNhan === 0 ? "" : rowData.soLuongNhan}
                  onChange={e => handleChange(m.ten, 'soLuongNhan', +e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300/50 focus:bg-white transition-all text-center" 
                />
              </div>

              <div className="col-span-1 md:col-span-3">
                <div className="md:hidden text-[10px] font-semibold text-emerald-600 mb-1">S.Lượng đạt</div>
                <input type="number" 
                  value={rowData.soLuongDat === 0 ? "" : rowData.soLuongDat}
                  onChange={e => handleChange(m.ten, 'soLuongDat', +e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-1.5 border border-emerald-300 bg-emerald-50/30 rounded-lg text-sm font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:bg-white transition-all text-center" 
                />
              </div>

              <div className="col-span-1 md:col-span-3">
                <div className="md:hidden text-[10px] font-semibold text-rose-600 mb-1">S.Lượng lỗi</div>
                <input type="number" 
                  value={rowData.soLuongLoi === 0 ? "" : rowData.soLuongLoi}
                  onChange={e => handleChange(m.ten, 'soLuongLoi', +e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-1.5 border border-rose-200 rounded-lg text-sm font-bold text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-400/50 focus:bg-white transition-all text-center" 
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Tùy chọn nâng cao (Lý do lỗi, Vị trí kho, Khâu gây lỗi...) */}
      {(showLyDoLoi || extraField) && (
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
          {showLyDoLoi && (
            <div>
              <div className="text-[11px] font-bold text-slate-600 mb-1">Lý do lỗi chung (Nếu có)</div>
              <input type="text"
                value={lyDoLoi || ""}
                onChange={e => onLyDoLoiChange?.(e.target.value)}
                placeholder="Vd: Thủng lỗ, dơ, đứt chỉ..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400/30" />
            </div>
          )}
          {extraField && (
            <div>
              {extraField}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
