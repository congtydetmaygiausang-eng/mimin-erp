import React, { useState } from "react";
import { X, Save, Scissors, Shirt, Package } from "lucide-react";
import type { LenhCat, MauVai, PhanCongGiaCong } from "@/lib/data/lenh-cat-store";

interface Props {
  lc: LenhCat;
  mauIdx: number;
  onClose: () => void;
  onSave: (mauIdx: number, newTyLeChiTiet: Record<string, { size: string; sl: number }[]>) => void;
}

export function TyLeSizeModal({ lc, mauIdx, onClose, onSave }: Props) {
  const mau = lc.dsMau?.[mauIdx];
  if (!mau) return null;

  // Lấy danh sách các khâu từ phân công và sắp xếp theo quy trình chuẩn
  const STAGE_ORDER = ["cat", "in", "theu", "in_theu", "may_ao", "may_quan", "may", "qc", "khuy_nut", "ui", "dong_goi", "nhap_kho"];
  const khauList = [...(lc.phanCong || [])].sort((a, b) => {
    const aRank = STAGE_ORDER.findIndex(k => a.id.toLowerCase().includes(k));
    const bRank = STAGE_ORDER.findIndex(k => b.id.toLowerCase().includes(k));
    return (aRank >= 0 ? aRank : 999) - (bRank >= 0 ? bRank : 999);
  });

  // Cột size cố định lấy theo phân bổ size gốc của màu (SL dự kiến) - mọi khâu
  // dùng chung 1 danh sách size này để bảng thẳng cột.
  const phanBoGoc = mau.phanBoSize || [];

  // Khởi tạo state bằng dữ liệu cũ. CHỈ khâu ĐẦU TIÊN (Cắt) được mặc định = SL
  // dự kiến ban đầu. Các khâu SAU không được tự copy số của khâu liền trước làm
  // mặc định - mỗi khâu gia công đều có thể phát sinh lỗi/rớt số lượng, nên
  // không có căn cứ gì để mặc định "y nguyên số khâu trước". Để trống buộc
  // người thật phải nhập số thực tế của khâu đó.
  const [tyLeChiTiet, setTyLeChiTiet] = useState<Record<string, { size: string; sl: number }[]>>(() => {
    const initial: Record<string, { size: string; sl: number }[]> = {};

    // Nếu đã có dữ liệu lưu trước đó, copy sang
    if (mau.tyLeSizeChiTiet && Object.keys(mau.tyLeSizeChiTiet).length > 0) {
      Object.assign(initial, JSON.parse(JSON.stringify(mau.tyLeSizeChiTiet)));
    }

    khauList.forEach((khau, idx) => {
      if (!initial[khau.id] || initial[khau.id].length === 0) {
        initial[khau.id] = phanBoGoc.map((s: any) => ({
          size: s.size,
          // idx === 0: khâu Cắt - mặc định = SL dự kiến. Các khâu sau: 0.
          sl: idx === 0 ? (s.sl || 0) : 0,
        }));
      }
    });

    return initial;
  });

  const handleSizeChange = (khauId: string, sizeIdx: number, sl: number) => {
    setTyLeChiTiet(prev => {
      const next = JSON.parse(JSON.stringify(prev));

      // Chỉ cập nhật khâu hiện tại
      if (!next[khauId]) {
        next[khauId] = phanBoGoc.map((s: any) => ({ size: s.size, sl: 0 }));
      }
      if (next[khauId][sizeIdx]) {
        next[khauId][sizeIdx].sl = sl;
      }

      return next;
    });
  };

  const handleSave = () => {
    onSave(mauIdx, JSON.parse(JSON.stringify(tyLeChiTiet)));
    onClose();
  };

  const getKhauIcon = (tenKhau: string) => {
    const t = tenKhau.toLowerCase();
    if (t.includes("cắt")) return <Scissors className="w-4 h-4 text-sky-500 shrink-0" />;
    if (t.includes("đóng gói") || t.includes("bao bì")) return <Package className="w-4 h-4 text-amber-500 shrink-0" />;
    return <Shirt className="w-4 h-4 text-emerald-500 shrink-0" />;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-sky-500" />
              Nhập Tỷ Lệ Size Từng Khâu
            </h2>
            <div className="text-sm font-bold text-slate-500 mt-1">
              Màu: <span className="text-sky-600">{mau.ten}</span> {mau.maVai ? `(${mau.maVai})` : ""}
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body - bảng ngang: mỗi HÀNG là 1 khâu công đoạn, mỗi CỘT là 1 size */}
        <div className="p-6 overflow-y-auto flex-1">
          {khauList.length === 0 ? (
            <div className="text-center text-slate-500 italic py-10">Chưa có phân công gia công nào để nhập tỷ lệ.</div>
          ) : phanBoGoc.length === 0 ? (
            <div className="text-center text-slate-500 italic py-10">Màu này chưa có phân bổ size ban đầu.</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-3 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wide sticky left-0 bg-slate-50 whitespace-nowrap">
                      Khâu
                    </th>
                    {phanBoGoc.map((s: any) => (
                      <th key={s.size} className="px-2 py-2.5 text-center font-black text-slate-600 text-xs whitespace-nowrap">
                        {s.size}
                      </th>
                    ))}
                    <th className="px-3 py-2.5 text-center font-bold text-slate-500 text-xs uppercase tracking-wide whitespace-nowrap">Tổng</th>
                    <th className="px-3 py-2.5 text-center font-bold text-slate-500 text-xs uppercase tracking-wide whitespace-nowrap">Lỗi</th>
                  </tr>
                </thead>
                <tbody>
                  {khauList.map((khau, khauIdx) => {
                    const sizes = tyLeChiTiet[khau.id] || [];
                    const tongSL = sizes.reduce((acc, curr) => acc + (curr.sl || 0), 0);

                    // Khoá khâu nếu khâu ngay trước đó (theo quy trình) chưa hoàn thành -
                    // tránh nhập nhầm số liệu cho khâu chưa tới lượt (VD: nhập Ủi khi May chưa xong)
                    const khauTruoc = khauIdx > 0 ? khauList[khauIdx - 1] : null;
                    const daKhoa = !!khauTruoc && khauTruoc.trangThaiCD !== "hoan_thanh";

                    // Số lượng lỗi = số nhận từ khâu LIỀN TRƯỚC trừ số thực tế đạt ở
                    // khâu này (hao hụt tính riêng từng khâu, không dồn từ Cắt).
                    const sizesTruoc = khauTruoc ? tyLeChiTiet[khauTruoc.id] : null;
                    const defectBySize = sizes.map((sz, sIdx) => {
                      if (!sizesTruoc || !sizesTruoc[sIdx]) return 0;
                      const slNhan = sizesTruoc[sIdx].sl || 0;
                      const slThucTe = sz.sl || 0;
                      return Math.max(0, slNhan - slThucTe);
                    });
                    const tongLoi = defectBySize.reduce((a, b) => a + b, 0);

                    return (
                      <tr key={khau.id} className={`border-b border-slate-100 last:border-b-0 ${daKhoa ? "opacity-50 bg-slate-50/50" : "bg-white"}`}>
                        <td className="px-3 py-2.5 sticky left-0 bg-inherit">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800 whitespace-nowrap">
                            {getKhauIcon(khau.tenCongDoan)}
                            <span>{khau.tenCongDoan}</span>
                            {khau.nguoiTen && <span className="text-xs font-medium text-slate-400">({khau.nguoiTen})</span>}
                          </div>
                          {daKhoa && (
                            <span className="mt-1 inline-block text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 whitespace-nowrap">
                              🔒 Chờ "{khauTruoc?.tenCongDoan}" xong
                            </span>
                          )}
                        </td>
                        {sizes.map((sz, sIdx) => {
                          const defect = defectBySize[sIdx] || 0;
                          return (
                            <td key={sIdx} className="px-1.5 py-2 text-center">
                              <input
                                type="number"
                                value={sz.sl || ""}
                                onChange={e => handleSizeChange(khau.id, sIdx, Number(e.target.value))}
                                onFocus={e => e.target.select()}
                                disabled={daKhoa}
                                title={daKhoa ? `Chưa thể nhập - đang chờ "${khauTruoc?.tenCongDoan}" hoàn thành` : undefined}
                                className={`w-16 px-1.5 py-1.5 text-center border rounded focus:ring-2 focus:ring-sky-500/50 outline-none text-sm font-bold text-slate-800 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${defect > 0 ? "border-rose-300 bg-rose-50" : "border-slate-300 bg-white"}`}
                                min="0"
                              />
                            </td>
                          );
                        })}
                        <td className="px-3 py-2.5 text-center font-black text-sky-600 whitespace-nowrap">{tongSL}</td>
                        <td className="px-3 py-2.5 text-center whitespace-nowrap">
                          {khauTruoc ? (
                            <span className={`text-xs font-black px-2 py-1 rounded-md border ${tongLoi > 0 ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-slate-50 border-slate-100 text-slate-400"}`}>
                              {tongLoi}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-300">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl font-bold text-white bg-sky-500 hover:bg-sky-600 flex items-center gap-2 transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" /> Lưu thông số
          </button>
        </div>
      </div>
    </div>
  );
}
