"use client";

// ============================================================
// MAU CARD STAGE - Card màu dùng chung mọi công đoạn
// Thứ tự hiển thị: Ảnh → Màu → Mã vải → Màu phối → Tỉ lệ size → Tổng SL → Đơn giá → Thành tiền → Trạng thái
// ============================================================

import type { MauVai } from "@/lib/data/lenh-cat-store";
import { formatVND } from "@/lib/data/real-data";

export type CardType = "ao" | "quan" | "bo";

export interface MauCardStageProps {
  mau: MauVai;
  type: CardType;
  label?: string;
  // Key trong tyLeSizeChiTiet để lấy SL đúng khâu, nếu không có thì lấy từ phanBoSize
  khauKey?: string;
  // Đơn giá của công đoạn này (lấy từ phanCong[].donGia)
  donGia?: number;
  // Trạng thái công đoạn
  trangThai?: "cho_giao" | "dang_lam" | "cho_qc" | "hoan_thanh" | "co_loi";
  // Custom UI props cho các tab nhập liệu
  renderSizeRows?: (sizeData: any[], isThucTe: boolean, totalSL: number) => React.ReactNode;
  footerAction?: React.ReactNode;
  showSizeOnly?: boolean;
  // Metadata bổ sung
  nguoiPhuTrach?: string;
  ghiChu?: string;
}

// Lấy SL size theo khâu hoặc fallback về phanBoSize
function getSizeData(mau: MauVai, khauKey?: string) {
  // Thử lấy đúng khâu
  if (khauKey && mau.tyLeSizeChiTiet?.[khauKey]?.some((s) => s.sl > 0)) {
    return { data: mau.tyLeSizeChiTiet[khauKey], isThucTe: true };
  }
  // Fallback: lấy khâu Cắt
  if (mau.tyLeSizeChiTiet) {
    const catKey = Object.keys(mau.tyLeSizeChiTiet).find((k) =>
      k.toLowerCase() === "cat" || k.toLowerCase().includes("cat")
    );
    if (catKey && mau.tyLeSizeChiTiet[catKey]?.some((s) => s.sl > 0)) {
      return { data: mau.tyLeSizeChiTiet[catKey], isThucTe: true };
    }
  }
  return { data: mau.phanBoSize || [], isThucTe: false };
}

const TRANG_THAI_LABELS: Record<string, { label: string; cls: string }> = {
  cho_giao:   { label: "Chờ cắt",       cls: "bg-slate-100 text-slate-600 border-slate-200" },
  dang_lam:   { label: "Đang cắt",      cls: "bg-amber-100 text-amber-700 border-amber-200" },
  cho_qc:     { label: "Chờ QC",        cls: "bg-sky-100 text-sky-700 border-sky-200" },
  hoan_thanh: { label: "✅ Hoàn thành", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  co_loi:     { label: "⚠️ Có lỗi",    cls: "bg-rose-100 text-rose-700 border-rose-200" },
};

export function MauCardStage({
  mau,
  type,
  label,
  khauKey,
  donGia,
  trangThai,
  renderSizeRows,
  footerAction,
  nguoiPhuTrach,
  ghiChu,
}: MauCardStageProps) {
  const { data: sizeData, isThucTe } = getSizeData(mau, khauKey);
  const totalSL = sizeData.reduce((s, sz) => s + (sz.sl || 0), 0);
  const thanhTien = donGia && totalSL ? donGia * totalSL : 0;

  // Lấy đúng ảnh / mã vải theo loại
  const imgSrc   = type === "quan" ? mau.imgQuan : mau.img;
  const maVai    = type === "quan" ? mau.maVaiQuan : mau.maVai;
  const tenLoai  = type === "quan" ? "Quần" : type === "bo" ? "Bộ" : "Áo";
  const imgAlt   = `${tenLoai} ${mau.ten}`;

  // Bỏ qua Card Quần nếu không có dữ liệu quần
  if (type === "quan" && !mau.maVaiQuan && !mau.imgQuan) return null;

  const ttInfo = trangThai ? (TRANG_THAI_LABELS[trangThai] || TRANG_THAI_LABELS.cho_giao) : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all duration-200">
      
      {/* 1. Ảnh */}
      <div className="bg-slate-100 aspect-square overflow-hidden">
        {imgSrc ? (
          <img src={imgSrc} alt={imgAlt} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-1">
            <span className="text-4xl">{type === "quan" ? "👖" : "👔"}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">Chưa có ảnh</span>
          </div>
        )}
      </div>

      {/* 2 + 3 + 4. Màu · Mã vải · Màu phối */}
      <div className="p-3 space-y-2.5 flex-1 flex flex-col">
        {/* Tên màu + badge loại */}
        <div className="flex items-start justify-between gap-1">
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              {label ? `${label} · ` : ""}{tenLoai}
            </div>
            <div className="font-black text-slate-900 text-base leading-tight">
              {mau.ten || "Chưa đặt tên"}
            </div>
          </div>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border shrink-0 ${
            type === "quan"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : type === "bo"
              ? "bg-purple-50 border-purple-200 text-purple-700"
              : "bg-sky-50 border-sky-200 text-sky-700"
          }`}>
            {tenLoai}
          </span>
        </div>

        {/* Mã vải */}
        {maVai && (
          <div className="text-[12px] text-slate-600">
            Mã vải: <span className="font-black text-slate-800">{maVai}</span>
          </div>
        )}

        {/* Màu phối */}
        {mau.mauPhoi && mau.mauPhoi.length > 0 && (
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Màu phối</div>
            <div className="flex flex-wrap gap-1">
              {mau.mauPhoi.map((mp) => (
                <span
                  key={mp}
                  className="text-[11px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-bold border border-indigo-100"
                >
                  {mp}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 5 + 6. Tỉ lệ size + Tổng SL */}
        <div className="flex-1">
          {renderSizeRows ? (
            renderSizeRows(sizeData, isThucTe, totalSL)
          ) : (
            <>
              <div className="text-[10px] text-slate-400 font-bold uppercase mb-1.5">
                Tỉ lệ size {isThucTe ? "(thực tế)" : "(dự kiến)"}
              </div>
              {sizeData.length > 0 ? (
                <div className="space-y-1">
                  {sizeData.map((sz) => (
                    <div key={sz.size} className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600 w-10">{sz.size}</span>
                      <div className="flex-1 mx-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isThucTe ? "bg-sky-500" : "bg-slate-300"}`}
                          style={{ width: totalSL > 0 ? `${(sz.sl / totalSL) * 100}%` : "0%" }}
                        />
                      </div>
                      <span className="text-xs font-black text-slate-800 tabular-nums w-10 text-right">
                        {sz.sl.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 mt-1">
                    <span className="text-xs font-black text-slate-500">Tổng</span>
                    <span className="text-sm font-black text-slate-900 tabular-nums">
                      {totalSL.toLocaleString()} {type === "quan" ? "quần" : type === "bo" ? "bộ" : "áo"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic">Chưa nhập số lượng</div>
              )}
            </>
          )}
        </div>

        {/* 7 + 8. Đơn giá + Thành tiền */}
        {donGia != null && donGia > 0 && (
          <div className="bg-sky-50 rounded-lg p-2.5 border border-sky-100 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-sky-600 font-bold">Đơn giá:</span>
              <span className="font-black text-sky-800">{formatVND(donGia)}/SP</span>
            </div>
            {thanhTien > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-sky-600 font-bold">Thành tiền:</span>
                <span className="font-black text-sky-900">{formatVND(thanhTien)}</span>
              </div>
            )}
          </div>
        )}

        {/* Nguoi phu trach / Ghi chu */}
        {(nguoiPhuTrach || ghiChu) && (
          <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 space-y-1 text-xs">
            {nguoiPhuTrach && (
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Người PT:</span>
                <span className="font-bold text-slate-800">{nguoiPhuTrach}</span>
              </div>
            )}
            {ghiChu && (
              <div className="text-slate-600 italic">"{ghiChu}"</div>
            )}
          </div>
        )}

        {/* 9. Trạng thái */}
        {ttInfo && (
          <div className={`text-[11px] px-2.5 py-1.5 rounded-lg font-bold border text-center ${ttInfo.cls}`}>
            {ttInfo.label}
          </div>
        )}

        {/* Footer Actions */}
        {footerAction && (
          <div className="pt-2 border-t border-slate-100">
            {footerAction}
          </div>
        )}
      </div>
    </div>
  );
}
