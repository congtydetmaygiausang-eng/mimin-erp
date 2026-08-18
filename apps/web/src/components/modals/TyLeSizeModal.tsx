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

  // Khởi tạo state bằng dữ liệu cũ. Khâu nào chưa có dữ liệu thì lấy số lượng
  // dự kiến từ khâu liền trước (nếu có), hoặc từ phân bổ size gốc của màu -
  // KHÔNG reset về 0, để người dùng thấy ngay số dự kiến và chỉ cần xác nhận/chỉnh.
  const [tyLeChiTiet, setTyLeChiTiet] = useState<Record<string, { size: string; sl: number }[]>>(() => {
    const initial: Record<string, { size: string; sl: number }[]> = {};

    // Nếu đã có dữ liệu lưu trước đó, copy sang
    if (mau.tyLeSizeChiTiet && Object.keys(mau.tyLeSizeChiTiet).length > 0) {
      Object.assign(initial, JSON.parse(JSON.stringify(mau.tyLeSizeChiTiet)));
    }

    // Duyệt qua tất cả các khâu theo thứ tự để điền bù những khâu bị thiếu
    khauList.forEach((khau, idx) => {
      if (!initial[khau.id] || initial[khau.id].length === 0) {
        // Tìm khâu liền trước gần nhất đã có số liệu (khác 0) để cascade sang
        let cascadeFrom: { size: string; sl: number }[] | null = null;
        for (let i = idx - 1; i >= 0; i--) {
          const prev = initial[khauList[i].id];
          if (prev && prev.some(s => s.sl > 0)) { cascadeFrom = prev; break; }
        }
        const template = cascadeFrom || mau.phanBoSize || [];
        initial[khau.id] = template.map((s: any) => ({ size: s.size, sl: s.sl || 0 }));
      }
    });

    return initial;
  });

  const handleSizeChange = (khauId: string, sizeIdx: number, sl: number) => {
    setTyLeChiTiet(prev => {
      const next = JSON.parse(JSON.stringify(prev));

      // Chỉ cập nhật khâu hiện tại
      if (!next[khauId]) {
        const phanBoGoc = mau.phanBoSize ? JSON.parse(JSON.stringify(mau.phanBoSize)) : [];
        next[khauId] = phanBoGoc;
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
    if (t.includes("cắt")) return <Scissors className="w-4 h-4 text-sky-500" />;
    if (t.includes("đóng gói") || t.includes("bao bì")) return <Package className="w-4 h-4 text-amber-500" />;
    return <Shirt className="w-4 h-4 text-emerald-500" />;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden">
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

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {khauList.length === 0 ? (
            <div className="text-center text-slate-500 italic py-10">Chưa có phân công gia công nào để nhập tỷ lệ.</div>
          ) : (
            khauList.map((khau, khauIdx) => {
              const sizes = tyLeChiTiet[khau.id] || [];
              const tongSL = sizes.reduce((acc, curr) => acc + (curr.sl || 0), 0);

              const catKhauId = khauList.find(k => k.id.toLowerCase().includes("cat"))?.id;
              const isNotCat = catKhauId && khau.id !== catKhauId;
              const catSizes = catKhauId ? tyLeChiTiet[catKhauId] : null;

              // Khoá khâu nếu khâu ngay trước đó (theo quy trình) chưa hoàn thành -
              // tránh nhập nhầm số liệu cho khâu chưa tới lượt (VD: nhập Ủi khi May chưa xong)
              const khauTruoc = khauIdx > 0 ? khauList[khauIdx - 1] : null;
              const daKhoa = !!khauTruoc && khauTruoc.trangThaiCD !== "hoan_thanh";

              return (
                <div key={khau.id} className={`bg-white border rounded-xl p-4 shadow-sm ${daKhoa ? "border-slate-200 opacity-60" : "border-slate-200"}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="font-bold text-slate-800 flex items-center gap-2">
                      {getKhauIcon(khau.tenCongDoan)}
                      {khau.tenCongDoan}
                      {khau.nguoiTen && <span className="text-xs font-medium text-slate-400">({khau.nguoiTen})</span>}
                      {daKhoa && (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                          🔒 Chờ "{khauTruoc?.tenCongDoan}" xong
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                      Tổng: <span className="text-sky-600">{tongSL}</span> SP
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {sizes.map((sz, sIdx) => {
                      let defect = 0;
                      if (isNotCat && catSizes && catSizes[sIdx]) {
                        const catSl = catSizes[sIdx].sl || 0;
                        const currentSl = sz.sl || 0;
                        if (catSl > 0 && currentSl < catSl && currentSl > 0) {
                          // Chỉ hiển thị lỗi nếu có nhập số liệu (>0) và nhỏ hơn Cắt
                          defect = catSl - currentSl;
                        } else if (catSl > 0 && currentSl === 0 && tongSL > 0) {
                          // Đã nhập số liệu cho các size khác nhưng size này = 0 thì coi là lỗi hết
                          defect = catSl;
                        }
                      }

                      return (
                        <div key={sIdx} className="flex flex-col items-center w-20">
                          <div className={`flex flex-col items-center bg-slate-50 border ${defect > 0 ? 'border-rose-300' : 'border-slate-200'} rounded-lg p-2 w-full`}>
                            <span className="text-xs font-black text-slate-600 mb-1">{sz.size}</span>
                            <input
                              type="number"
                              value={sz.sl || ""}
                              onChange={e => handleSizeChange(khau.id, sIdx, Number(e.target.value))}
                              onFocus={e => e.target.select()}
                              disabled={daKhoa}
                              title={daKhoa ? `Chưa thể nhập - đang chờ "${khauTruoc?.tenCongDoan}" hoàn thành` : undefined}
                              className="w-full px-2 py-1.5 text-center border border-slate-300 rounded focus:ring-2 focus:ring-sky-500/50 outline-none text-sm font-bold text-slate-800 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                              min="0"
                            />
                          </div>
                          {defect > 0 && (
                            <div className="text-[10px] font-black text-rose-500 mt-1 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                              Lỗi: {defect}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {sizes.length === 0 && (
                      <div className="text-xs text-slate-400 italic">Màu này chưa có phân bổ size ban đầu.</div>
                    )}
                  </div>
                </div>
              );
            })
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
