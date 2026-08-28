import React, { useState } from "react";
import { X, Save, Scissors, Shirt, Package } from "lucide-react";
import type { LenhCat, MauVai, PhanCongGiaCong } from "@/lib/data/lenh-cat-store";
import { Portal } from "@/components/ui/Portal";

interface Props {
  lc: LenhCat;
  mauIdx: number;
  onClose: () => void;
  onSave: (mauIdx: number, newTyLeChiTiet: Record<string, { size: string; sl: number }[]>, tongDuCat?: number) => void;
}

export function TyLeSizeModal({ lc, mauIdx, onClose, onSave }: Props) {
  const mau = lc.dsMau?.[mauIdx];
  if (!mau) return null;

  // Lấy danh sách các khâu từ phân công và sắp xếp theo quy trình chuẩn
  const STAGE_ORDER = ["cat", "in", "theu", "in_theu", "may_ao", "may_quan", "may", "qc", "khuy_nut", "ui", "dong_goi", "nhap_kho"];
  const khauList: any[] = [...(lc.phanCong || [])].sort((a: any, b: any) => {
    const aRank = STAGE_ORDER.findIndex(k => (a.id || "").toLowerCase().includes(k));
    const bRank = STAGE_ORDER.findIndex(k => (b.id || "").toLowerCase().includes(k));
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

  // Tính tổng SL khâu Cắt (đầu tiên trong danh sách) - dùng để khoá các khâu sau
  const catKhau = khauList[0];
  const tongSLCat = catKhau
    ? (tyLeChiTiet[catKhau.id] || []).reduce((acc, s) => acc + (s.sl || 0), 0)
    : 0;
  const catDaNhap = tongSLCat > 0;


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
    // Tính số dư (thất thoát vải) so với khâu Cắt
    let maxTotal = 0;
    Object.values(tyLeChiTiet).forEach((sizes) => {
      const t = sizes.reduce((sum, sz) => sum + (sz.sl || 0), 0);
      if (t > maxTotal) maxTotal = t;
    });
    const tongDuCat = Math.max(0, maxTotal - tongSLCat);

    onSave(mauIdx, JSON.parse(JSON.stringify(tyLeChiTiet)), tongDuCat);
    onClose();
  };

  const getKhauIcon = (tenKhau: string) => {
    const t = tenKhau.toLowerCase();
    if (t.includes("cắt")) return <Scissors className="w-4 h-4 text-sky-500 shrink-0" />;
    if (t.includes("đóng gói") || t.includes("bao bì")) return <Package className="w-4 h-4 text-amber-500 shrink-0" />;
    return <Shirt className="w-4 h-4 text-emerald-500 shrink-0" />;
  };

  const khauChungDau = khauList.filter(k => k.id === "cat");
  const khauAo = khauList.filter(k => {
    const id = k.id.toLowerCase();
    return id.includes("ao") || id.includes("in") || id.includes("theu") || id.includes("khuy");
  });
  const khauQuan = khauList.filter(k => k.id.toLowerCase().includes("quan"));
  const khauChungCuoi = khauList.filter(k => {
    const id = k.id.toLowerCase();
    return id.includes("qc") || id.includes("ui") || id.includes("dong_goi") || id.includes("nhap_kho");
  });
  const hasQuan = khauQuan.length > 0;

  const renderTable = (title: string, list: any[], initialSizesTruoc: { size: string, sl: number }[] | null, isGrid: boolean = false) => {
    if (list.length === 0) return null;
    return (
      <div className={`mb-4 ${isGrid ? "min-w-[400px]" : "w-full"}`}>
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-2">
          {title}
        </h3>
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
              {list.map((khau, khauIdx) => {
                const sizes = tyLeChiTiet[khau.id] || [];
                const tongSL = sizes.reduce((acc, curr) => acc + (curr.sl || 0), 0);
                const daKhoa = khau.id !== "cat" && !catDaNhap;

                let sizesTruoc: any = null;
                if (khauIdx === 0) {
                  sizesTruoc = initialSizesTruoc;
                } else {
                  const khauTruoc = list[khauIdx - 1];
                  sizesTruoc = tyLeChiTiet[khauTruoc.id];
                }

                const defectBySize = sizes.map((sz, sIdx) => {
                  if (!sizesTruoc || !sizesTruoc[sIdx]) return { loi: 0, du: 0 };
                  const slNhan = sizesTruoc[sIdx].sl || 0;
                  const slThucTe = sz.sl || 0;
                  return {
                    loi: Math.max(0, slNhan - slThucTe),
                    du: Math.max(0, slThucTe - slNhan)
                  };
                });
                const tongLoi = defectBySize.reduce((a, b) => a + b.loi, 0);
                const tongDu = defectBySize.reduce((a, b) => a + b.du, 0);

                return (
                  <tr key={khau.id} className={`border-b border-slate-100 last:border-b-0 ${daKhoa ? "opacity-50 bg-slate-50/50" : "bg-white"}`}>
                    <td className="px-3 py-2.5 sticky left-0 bg-inherit shadow-[1px_0_0_0_#f1f5f9]">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 whitespace-nowrap">
                        {getKhauIcon(khau.tenCongDoan)}
                        <span>{khau.tenCongDoan}</span>
                        {khau.nguoiTen && <span className="text-xs font-medium text-slate-400">({khau.nguoiTen})</span>}
                      </div>
                      {daKhoa && (
                        <span className="mt-1 inline-block text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 whitespace-nowrap">
                          🔒 Chờ "Cắt"
                        </span>
                      )}
                    </td>
                    {sizes.map((sz, sIdx) => {
                      const { loi, du } = defectBySize[sIdx] || { loi: 0, du: 0 };
                      return (
                        <td key={sIdx} className="px-1.5 py-2 text-center">
                          <input
                            type="number"
                            value={sz.sl || ""}
                            onChange={e => handleSizeChange(khau.id, sIdx, Number(e.target.value))}
                            onFocus={e => e.target.select()}
                            disabled={daKhoa}
                            className={`w-14 px-1 py-1 min-h-[44px] text-center border rounded focus:ring-2 focus:ring-sky-500/50 outline-none text-sm font-bold text-slate-800 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${loi > 0 ? "border-rose-300 bg-rose-50 text-rose-700" : du > 0 ? "border-sky-400 bg-sky-50 text-sky-700" : "border-slate-300 bg-white"}`}
                            min="0"
                          />
                          {du > 0 && <div className="text-[9px] font-black text-sky-600 mt-0.5">+{du} dư</div>}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2.5 text-center font-black text-sky-600 whitespace-nowrap">{tongSL}</td>
                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      {sizesTruoc ? (
                        <div className="flex flex-col gap-1 items-center justify-center">
                          {tongLoi > 0 && (
                            <span className="text-[11px] font-black px-2 py-0.5 rounded border bg-rose-50 border-rose-200 text-rose-600 leading-none">
                              -{tongLoi}
                            </span>
                          )}
                          {tongDu > 0 && (
                            <span className="text-[11px] font-black px-2 py-0.5 rounded border bg-sky-50 border-sky-200 text-sky-600 leading-none" title="Dư (sẽ tính phạt Cắt)">
                              +{tongDu} dư
                            </span>
                          )}
                          {tongLoi === 0 && tongDu === 0 && (
                            <span className="text-[11px] font-black px-2 py-0.5 rounded border bg-slate-50 border-slate-100 text-slate-400 leading-none">
                              0
                            </span>
                          )}
                        </div>
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
      </div>
    );
  };

  let qcInitialSizesTruoc = null;
  if (hasQuan) {
    const lastAo = khauAo[khauAo.length - 1];
    const lastQuan = khauQuan[khauQuan.length - 1];
    if (lastAo && lastQuan) {
      const sizesAo = tyLeChiTiet[lastAo.id] || [];
      const sizesQuan = tyLeChiTiet[lastQuan.id] || [];
      qcInitialSizesTruoc = phanBoGoc.map((s: any, sIdx: number) => {
        const ao = sizesAo[sIdx]?.sl || 0;
        const quan = sizesQuan[sIdx]?.sl || 0;
        return { size: s.size, sl: Math.min(ao, quan) };
      });
    }
  }

  const sizesCat = catKhau ? tyLeChiTiet[catKhau.id] : null;

  return (
    <Portal>
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
              <div className="space-y-6">
                {hasQuan ? (
                  <>
                    {renderTable("1. Khâu Cắt Bộ", khauChungDau, null)}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                      {renderTable("2. Gia Công Áo", khauAo, sizesCat, true)}
                      {renderTable("3. Gia Công Quần", khauQuan, sizesCat, true)}
                    </div>
                    {renderTable("4. Hoàn Thiện (Đã Ghép Bộ)", khauChungCuoi, qcInitialSizesTruoc)}
                  </>
                ) : (
                  renderTable("Quy Trình Gia Công", khauList, null)
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 min-h-[44px] rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2.5 min-h-[44px] rounded-xl font-bold text-white bg-sky-500 hover:bg-sky-600 flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" /> Lưu thông số
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
