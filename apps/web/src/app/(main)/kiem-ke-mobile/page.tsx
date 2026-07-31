"use client";

// ============ KIỂM KÊ MOBILE (Đợt 7) ============
// Kiểm kê kho vải / phụ liệu (mobile-first)

import { useState, useMemo, Suspense } from "react";
import { ClipboardCheck, AlertTriangle, CheckCircle2, ScanLine } from "lucide-react";
import { useKhoMobile } from "@/lib/data/kho-mobile-store";
import { getTonTheoMatHang, type KhoKPI } from "@/lib/kho-mobile-helper";
import { formatVNDShort } from "@/components/ui";
import type { LoaiKho } from "@/lib/data/kho-mobile-store";

export default function KiemKeMobilePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm opacity-60">Đang tải…</div>}>
      <KiemKeMobileContent />
    </Suspense>
  );
}

function KiemKeMobileContent() {
  const [loaiKho, setLoaiKho] = useState<LoaiKho>("vai");
  const [thucTe, setThucTe] = useState<Record<string, number>>({});
  const ton = useMemo(() => getTonTheoMatHang(loaiKho), [loaiKho]);

  const chenhLech = ton.map((v) => {
    const tt = thucTe[v.ma] ?? v.ton;
    return { ...v, thucTe: tt, chenh: tt - v.ton };
  });
  const tongChenh = chenhLech.reduce((sum, v) => sum + v.chenh, 0);
  const giaTriChenh = chenhLech.reduce((sum, v) => sum + v.chenh * v.gia, 0);
  const matHangChenh = chenhLech.filter((v) => v.chenh !== 0).length;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <ClipboardCheck className="w-7 h-7 text-violet-500" />
          Kiểm kê
        </h1>
        <p className="opacity-70 mt-1 text-sm">
          Đếm thực tế và so sánh với tồn hệ thống
        </p>
      </div>

      {/* Filter loại kho */}
      <div className="flex gap-1.5">
        {(["vai", "phu-lieu"] as LoaiKho[]).map((k) => (
          <button
            key={k}
            onClick={() => { setLoaiKho(k); setThucTe({}); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${
              loaiKho === k ? "bg-brand-500 text-white" : "bg-white/40 dark:bg-white/5"
            }`}
          >
            {k === "vai" ? "Vải" : "Phụ liệu"}
          </button>
        ))}
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-3 bg-gradient-to-br from-sky-500/10 to-sky-500/5 text-sky-700">
          <div className="text-xs opacity-80 mb-1">Tổng mặt hàng</div>
          <div className="text-xl font-bold">{ton.length}</div>
        </div>
        <div className="card p-3 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 text-emerald-700">
          <div className="text-xs opacity-80 mb-1">Khớp</div>
          <div className="text-xl font-bold">{chenhLech.length - matHangChenh}</div>
        </div>
        <div className="card p-3 bg-gradient-to-br from-rose-500/10 to-rose-500/5 text-rose-700">
          <div className="text-xs opacity-80 mb-1">Lệch</div>
          <div className="text-xl font-bold">{matHangChenh}</div>
        </div>
        <div className="card p-3 bg-gradient-to-br from-amber-500/10 to-amber-500/5 text-amber-700">
          <div className="text-xs opacity-80 mb-1">Tổng chênh</div>
          <div className="text-xl font-bold">{tongChenh > 0 ? `+${tongChenh}` : tongChenh}</div>
        </div>
      </div>

      {/* Giá trị chênh lệch */}
      {Math.abs(giaTriChenh) > 0 && (
        <div className="card p-3 bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>
              Giá trị chênh lệch: <b className={giaTriChenh > 0 ? "text-emerald-600" : "text-rose-600"}>
                {giaTriChenh > 0 ? "+" : ""}{formatVNDShort(Math.abs(giaTriChenh))}
              </b>
            </span>
          </div>
        </div>
      )}

      {/* Bảng kiểm kê */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b bg-slate-50/50 dark:bg-white/5" style={{ borderColor: "var(--border)" }}>
                <th className="p-2">Mã</th>
                <th className="p-2">Tên</th>
                <th className="p-2 text-right">Hệ thống</th>
                <th className="p-2 text-right">Thực tế</th>
                <th className="p-2 text-right">Chênh</th>
              </tr>
            </thead>
            <tbody>
              {chenhLech.map((v) => (
                <tr key={v.ma} className="border-b hover:bg-white/30" style={{ borderColor: "var(--border)" }}>
                  <td className="p-2 font-mono text-xs">{v.ma}</td>
                  <td className="p-2 text-xs">{v.ten}</td>
                  <td className="p-2 text-right font-mono text-xs">{v.ton.toLocaleString()}</td>
                  <td className="p-2 text-right">
                    <input
                      type="number"
                      className="input w-20 text-right text-xs py-1"
                      value={thucTe[v.ma] ?? ""}
                      placeholder={v.ton.toString()}
                      onChange={(e) => setThucTe({ ...thucTe, [v.ma]: parseInt(e.target.value) || 0 })}
                    />
                  </td>
                  <td className={`p-2 text-right font-mono text-xs font-semibold ${
                    v.chenh === 0 ? "text-emerald-600" : v.chenh > 0 ? "text-sky-600" : "text-rose-600"
                  }`}>
                    {v.chenh > 0 ? "+" : ""}{v.chenh}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-[10px] opacity-50 text-center pb-2">
        💡 Nhập số thực tế vào ô bên phải. Hệ thống sẽ tự động tính chênh lệch.
      </div>
    </div>
  );
}
