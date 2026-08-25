"use client";

// ============================================================
// TRANG CHI TIẾT LỆNH CẮT - 9 Tab Công Đoạn
// /lenh-cat/[id]
// Thiết kế: Antigravity 2026-08-23
// ============================================================

import { useParams, useRouter } from "next/navigation";
import { useLenhCat } from "@/lib/data/lenh-cat-store";
import { StageTabsView } from "./StageTabsView";
import { ArrowLeft, Scissors } from "lucide-react";
import { TRANG_THAI_LC_LABELS, TRANG_THAI_LC_STYLE } from "@/lib/data/lenh-cat-store";
import Link from "next/link";

export default function LenhCatDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { dsLenhCat, loading } = useLenhCat();

  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";
  const lc = dsLenhCat.find((l) => l.id === id);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 font-medium">Đang tải lệnh cắt...</p>
        </div>
      </div>
    );
  }

  if (!lc) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center space-y-4">
          <Scissors className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-slate-500 font-medium">Không tìm thấy lệnh cắt <strong>{id}</strong></p>
          <Link href="/lenh-cat" className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-xl font-bold text-sm hover:bg-sky-700 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  const s = TRANG_THAI_LC_STYLE[lc.trangThai] || { bg: "bg-slate-100", color: "text-slate-600" };
  const isLate = lc.hanHoanThanh < new Date().toISOString().split("T")[0] && lc.trangThai !== "HoanThanh";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/lenh-cat"
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="font-black text-slate-800 font-mono text-lg">{lc.id}</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${s.bg} ${s.color} border border-current/20`}>
              {TRANG_THAI_LC_LABELS[lc.trangThai]}
            </span>
            {isLate && (
              <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-700 border border-rose-200">
                ⚠️ Trễ hạn
              </span>
            )}
          </div>

          <div className="text-right shrink-0">
            <div className="font-black text-slate-900 text-lg leading-none">
              {(lc.tongSL || 0).toLocaleString()} <span className="text-xs text-slate-400 font-medium">SP</span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">Tổng SL</div>
          </div>
        </div>

        {/* SP Info strip */}
        <div className="max-w-screen-xl mx-auto px-4 pb-2 flex items-center gap-3">
          <div className="text-sm font-black text-slate-700">{lc.tenSP}</div>
          <span className="text-xs text-slate-400">•</span>
          <div className="text-xs text-slate-500 font-mono font-bold">{lc.maSP}</div>
          {lc.khachHang && (
            <>
              <span className="text-xs text-slate-400">•</span>
              <div className="text-xs text-slate-500">👤 {lc.khachHang}</div>
            </>
          )}
          <span className="text-xs text-slate-400">•</span>
          <div className="text-xs text-slate-500">
            📐 Tỉ lệ: <span className="font-bold text-slate-700">{lc.tiLeSize || "—"}</span>
          </div>
          {lc.hanHoanThanh && (
            <>
              <span className="text-xs text-slate-400">•</span>
              <div className={`text-xs font-bold ${isLate ? "text-rose-600" : "text-slate-600"}`}>
                📅 Hạn: {new Date(lc.hanHoanThanh).toLocaleDateString("vi-VN")}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-screen-xl mx-auto px-4 py-4">
        <StageTabsView lc={lc} />
      </div>
    </div>
  );
}
