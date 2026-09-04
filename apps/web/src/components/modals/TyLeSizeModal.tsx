import React, { useState } from "react";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { X, Save, Scissors, Shirt, Package } from "lucide-react";
import type { LenhCat, MauVai, PhanCongGiaCong } from "@/lib/data/lenh-cat-store";
import { Portal } from "@/components/ui/Portal";

interface Props {
  lc: LenhCat;
  mauIdx: number;
  onClose: () => void;
  onSave: (mauIdx: number, newTyLeChiTiet: Record<string, { size: string; sl: number }[]>, tongDuCat?: number, fixedPhanCong?: PhanCongGiaCong) => void;
}

export function TyLeSizeModal({ lc, mauIdx, onClose, onSave }: Props) {
  const mau = lc.dsMau?.[mauIdx];
  if (!mau) return null;

  // ===== FALLBACK KHI phanCong RỖNG (do Supabase chưa lưu hoặc race condition) =====
  // Lấy thông tin người phụ trách cắt thực tế từ lệnh cắt
  const phuTrachCatMa = lc.phuTrachCat || "";
  const phuTrachCatTen = lc.phuTrachCat || "";
  const catTenCongDoan = (lc.loaiSP || "").toLowerCase().includes("bo") ? "Cắt bộ" : "Cắt";

  const buildFallbackStages = (isBo: boolean): PhanCongGiaCong => [
    // Khâu Cắt: dùng thông tin người phụ trách cắt thực tế từ lệnh cắt
    { id: "cat", tenCongDoan: catTenCongDoan, nguoiMa: phuTrachCatMa, nguoiTen: phuTrachCatTen,
      donGia: 0, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra", loaiNguoi: "noi_bo" } as any,
    { id: "in_theu_ao", tenCongDoan: "In/Thêu", nguoiMa: "", nguoiTen: "",
      donGia: 0, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra", loaiNguoi: "noi_bo" } as any,
    { id: "may_ao", tenCongDoan: "May áo", nguoiMa: "", nguoiTen: "",
      donGia: 0, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra", loaiNguoi: "noi_bo" } as any,
    ...(isBo ? [{ id: "may_quan", tenCongDoan: "May quần", nguoiMa: "", nguoiTen: "",
      donGia: 0, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra", loaiNguoi: "noi_bo" } as any] : []),
    { id: "khuy_nut", tenCongDoan: "Khuy nút", nguoiMa: "", nguoiTen: "",
      donGia: 0, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra", loaiNguoi: "noi_bo" } as any,
    { id: "qc", tenCongDoan: "QC (kiểm hàng)", nguoiMa: "", nguoiTen: "",
      donGia: 0, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra", loaiNguoi: "noi_bo" } as any,
    { id: "ui", tenCongDoan: "Ủi", nguoiMa: "", nguoiTen: "",
      donGia: 0, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra", loaiNguoi: "noi_bo" } as any,
    { id: "dong_goi", tenCongDoan: "Đóng gói", nguoiMa: "", nguoiTen: "",
      donGia: 0, soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra", loaiNguoi: "noi_bo" } as any,
  ];

  const isBo = (lc.loaiSP || "").toLowerCase().includes("bo");
  const phanCongSource = (lc.phanCong && lc.phanCong.length > 0)
    ? lc.phanCong
    : buildFallbackStages(isBo);
  // Flag để biết có cần tự repair phanCong lên Supabase không
  const needsRepair = !lc.phanCong || lc.phanCong.length === 0;

  // Sắp xếp khâu theo quy trình chuẩn: Cắt → In/Thêu → May → QC → Hoàn thiện
  const STAGE_ORDER = ["cat", "in_theu", "in", "theu", "may_ao", "may_quan", "may", "khuy_nut", "qc", "ui", "dong_goi", "nhap_kho"];
  const khauList: any[] = [...phanCongSource].sort((a: any, b: any) => {
    // BUG FIX: Không dùng || includes('cắt') toàn cục — chỉ xét id khâu
    const aRank = STAGE_ORDER.findIndex(k => (a.id || "").toLowerCase().includes(k));
    const bRank = STAGE_ORDER.findIndex(k => (b.id || "").toLowerCase().includes(k));
    // Nếu không match STAGE_ORDER, dùng tên khâu để xếp cắt lên đầu
    const aIsCat = (a.id || "").toLowerCase().includes("cat") || (a.tenCongDoan || "").toLowerCase().includes("cắt");
    const bIsCat = (b.id || "").toLowerCase().includes("cat") || (b.tenCongDoan || "").toLowerCase().includes("cắt");
    if (aIsCat && !bIsCat) return -1;
    if (!aIsCat && bIsCat) return 1;
    return (aRank >= 0 ? aRank : 999) - (bRank >= 0 ? bRank : 999);
  });

  const phanBoGoc = mau.phanBoSize || [];

  // Tính SL Cắt thực từ lệnh cắt khi phanBoSize.sl = 0 (Bản nháp chưa phân bổ)
  // Công thức: tongSL / số màu, phân bổ theo tỷ lệ size lc.tiLeSize
  const computedCatSizes = (() => {
    if (phanBoGoc.length === 0) return null;
    const phanBoTotal = phanBoGoc.reduce((s: number, sz: any) => s + (sz.sl || 0), 0);
    if (phanBoTotal > 0) return null; // phanBoGoc đã có SL thực, không cần tính

    // Tính từ tongSL / numMau
    const numMau = (lc.dsMau || []).length || 1;
    const slPerMau = Math.round((lc.tongSL || 0) / numMau);
    if (slPerMau === 0) return null;

    // Parse tiLeSize "1:2:2:2:1" thành mảng số
    const ratios = (lc.tiLeSize || "")
      .split(":")
      .map((r: string) => parseFloat(r.trim()))
      .filter((r: number) => !isNaN(r) && r > 0);

    if (ratios.length === 0 || ratios.length !== phanBoGoc.length) {
      // Không parse được tỷ lệ hoặc không khớp số size → chia đều
      const slEach = Math.round(slPerMau / phanBoGoc.length);
      return phanBoGoc.map((s: any) => ({ size: s.size, sl: slEach }));
    }

    const totalRatio = ratios.reduce((a: number, b: number) => a + b, 0);
    return phanBoGoc.map((s: any, i: number) => ({
      size: s.size,
      sl: Math.round(slPerMau * ratios[i] / totalRatio),
    }));
  })();

  // Khởi tạo state bằng dữ liệu cũ. CHỈ khâu ĐẦU TIÊN (Cắt) được mặc định = SL
  // dự kiến ban đầu. Các khâu SAU không được tự copy số của khâu liền trước làm
  // mặc định.
  const [tyLeChiTiet, setTyLeChiTiet] = useState<Record<string, { size: string; sl: number }[]>>(() => {
    const initial: Record<string, { size: string; sl: number }[]> = {};

    // Nếu đã có dữ liệu lưu trước đó, copy sang
    if (mau.tyLeSizeChiTiet && Object.keys(mau.tyLeSizeChiTiet).length > 0) {
      Object.assign(initial, JSON.parse(JSON.stringify(mau.tyLeSizeChiTiet)));
    }

    khauList.forEach((khau) => {
      const existing = initial[khau.id];
      // BUG FIX: Không dùng idx===0 vì sort có thể sai — kiểm tra trực tiếp id/tên
      const isCatKhau = (khau.id || "").toLowerCase().includes("cat") ||
                        (khau.tenCongDoan || "").toLowerCase().includes("cắt");

      // Với khâu CẮT: nếu data cũ toàn sl=0 (chưa nhập hoặc bị mất),
      // luôn fallback về phanBoSize để hiển thị SL dự kiến thực tế từ lệnh cắt.
      if (isCatKhau) {
        const existingTotal = (existing || []).reduce((s: number, sz: any) => s + (sz.sl || 0), 0);
        if (existingTotal === 0) {
          // Ưu tiên: phanBoSize → computedCatSizes (tính từ tongSL + tiLeSize) → 0
          const phanBoTotal = phanBoGoc.reduce((s: number, sz: any) => s + (sz.sl || 0), 0);
          if (phanBoTotal > 0) {
            initial[khau.id] = phanBoGoc.map((s: any) => ({ size: s.size, sl: s.sl || 0 }));
          } else if (computedCatSizes) {
            initial[khau.id] = computedCatSizes;
          } else {
            initial[khau.id] = phanBoGoc.map((s: any) => ({ size: s.size, sl: 0 }));
          }
          return;
        }
      }

      if (!existing || existing.length === 0) {
        initial[khau.id] = phanBoGoc.map((s: any) => ({
          size: s.size,
          sl: isCatKhau ? (s.sl || 0) : 0,
        }));
      }
    });

    return initial;
  });


  // Tìm khâu Cắt theo id/tên — KHÔNG dùng khauList[0] vì vị trí có thể sai
  const catKhau = khauList.find((k: any) =>
    (k.id || "").toLowerCase().includes("cat") ||
    (k.tenCongDoan || "").toLowerCase().includes("cắt")
  ) || khauList[0];
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

  const handleAutoFillCat = () => {
    if (!catKhau || !phanBoGoc || phanBoGoc.length === 0) return;
    setTyLeChiTiet(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next[catKhau.id] = phanBoGoc.map((s: any) => ({ size: s.size, sl: s.sl || 0 }));
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

    // Nếu phanCong của lệnh cắt đang rỗng (do race condition khi tạo Bản nháp),
    // truyền thêm phanCongSource để caller lưu luôn lên Supabase repair.
    onSave(mauIdx, JSON.parse(JSON.stringify(tyLeChiTiet)), tongDuCat, needsRepair ? phanCongSource : undefined);
    onClose();
  };

  const getKhauIcon = (tenKhau: string) => {
    const t = tenKhau.toLowerCase();
    if (t.includes("cắt")) return <Scissors className="w-4 h-4 text-sky-500 shrink-0" />;
    if (t.includes("đóng gói") || t.includes("bao bì")) return <Package className="w-4 h-4 text-amber-500 shrink-0" />;
    return <Shirt className="w-4 h-4 text-emerald-500 shrink-0" />;
  };

  const khauChungDau = khauList.filter(k => (k.id || "").toLowerCase().includes("cat"));
  const khauAo = khauList.filter(k => {
    const id = (k.id || "").toLowerCase();
    return id.includes("ao") || id.includes("in") || id.includes("theu") || id.includes("khuy");
  });
  const khauQuan = khauList.filter(k => (k.id || "").toLowerCase().includes("quan"));
  const khauChungCuoi = khauList.filter(k => {
    const id = (k.id || "").toLowerCase();
    return id.includes("qc") || id.includes("ui") || id.includes("dong_goi") || id.includes("nhap_kho");
  });
  const hasQuan = khauQuan.length > 0;

  const renderTable = (title: string, list: any[], initialSizesTruoc: { size: string, sl: number }[] | null, isGrid: boolean = false) => {
    if (list.length === 0) return null;
    return (
      <div className={`mb-4 ${isGrid ? "min-w-full md:min-w-[400px]" : "w-full"}`}>
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-2">
          {title}
        </h3>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-3 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wide sticky left-0 z-10 bg-slate-50 whitespace-nowrap">
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
                const isCatStage = (khau.id || "").toLowerCase().includes("cat") || (khau.tenCongDoan || "").toLowerCase().includes("cắt");
                const daKhoa = !isCatStage && !catDaNhap;

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
                  <tr key={khau.id} className={`border-b border-slate-100 last:border-b-0 ${daKhoa ? "bg-slate-50/80 text-slate-400" : "bg-white"}`}>
                    <td className={`px-3 py-2.5 sticky left-0 z-10 shadow-[1px_0_0_0_#e2e8f0] ${daKhoa ? "bg-slate-50" : "bg-white"}`}>
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
                            className={`w-16 px-1 py-1 min-h-[44px] text-center border rounded focus:ring-2 focus:ring-sky-500/50 outline-none text-sm font-bold text-slate-800 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${loi > 0 ? "border-rose-300 bg-rose-50 text-rose-700" : du > 0 ? "border-sky-400 bg-sky-50 text-sky-700" : "border-slate-300 bg-white"}`}
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
    <ResponsiveModal
      open={true}
      onClose={onClose}
      maxWidth="4xl"
      fullScreenMobile={true}
      title={
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-sky-500" />
            Nhập Tỷ Lệ Size Từng Khâu
          </div>
          <div className="text-sm font-normal text-slate-500 mt-1">
            Màu: <span className="text-sky-600 font-bold">{mau.ten}</span> {mau.maVai ? `(${mau.maVai})` : ""}
          </div>
          {(mau.slDuKien || 0) > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">
                SL Dự kiến cắt: <strong className="text-blue-600">{mau.slDuKien}</strong>
              </span>
              <button
                onClick={handleAutoFillCat}
                className="px-2 py-1 flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 font-bold rounded border border-blue-200 hover:bg-blue-100 transition-colors shadow-sm"
                title="Tự động điền số lượng dự kiến vào khâu Cắt"
              >
                <span>⚡</span> Điền tự động
              </button>
            </div>
          )}
        </div>
      }
    >
      {/* Body - bảng ngang: mỗi HÀNG là 1 khâu công đoạn, mỗi CỘT là 1 size */}
      <div className="p-4 md:p-6 flex-1">
        {khauList.length === 0 ? (
          <div className="text-center text-slate-500 italic py-10">Chưa có phân công gia công nào để nhập tỷ lệ.</div>
        ) : phanBoGoc.length === 0 ? (
          <div className="text-center text-slate-500 italic py-10">Màu này chưa có phân bổ size ban đầu.</div>
        ) : (
          <div className="space-y-6">
            {hasQuan ? (
              <>
                {renderTable("1. Khâu Cắt Bộ", khauChungDau, null)}
                <div className="flex flex-col gap-6 items-stretch">
                  {renderTable("2. Gia Công Áo", khauAo, sizesCat, false)}
                  {renderTable("3. Gia Công Quần", khauQuan, sizesCat, false)}
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
      <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-xl">
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
    </ResponsiveModal>
  );
}
