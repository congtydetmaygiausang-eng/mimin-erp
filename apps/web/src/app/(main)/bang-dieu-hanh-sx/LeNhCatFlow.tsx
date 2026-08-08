"use client";

// ============ LENH CAT FLOW BOARD ============
// Bảng theo dõi Lệnh Cắt qua từng công đoạn sản xuất
// Dùng trong Bảng Điều Hành SX - tab mới "Luồng LC"

import { useState } from "react";
import {
  Scissors, Shirt, ShieldCheck, Package, Truck,
  CheckCircle2, Clock, AlertTriangle, Circle,
  ChevronDown, ChevronUp, Eye,
} from "lucide-react";
import { toast } from "sonner";
import { useLenhCat, TRANG_THAI_CD_LABELS, TRANG_THAI_CD_STYLE, LOAI_SP_LABELS, type TrangThaiCongDoan } from "@/lib/data/lenh-cat-store";
import { formatVND } from "@/lib/data/real-data";
import { DateDisplay } from "@/components/ui";

// Thứ tự công đoạn trong luồng
const CONG_DOAN_FLOW = [
  { key: "cat",      label: "Cắt",      icon: Scissors,     color: "sky" },
  { key: "in",       label: "In",        icon: Package,      color: "purple" },
  { key: "theu",     label: "Thêu",      icon: Package,      color: "indigo" },
  { key: "mayAo",    label: "May Áo",    icon: Shirt,        color: "violet" },
  { key: "mayQuan",  label: "May Quần",  icon: Shirt,        color: "violet" },
  { key: "ui",       label: "Ủi/HT",     icon: ShieldCheck,  color: "teal" },
  { key: "dongGoi",  label: "Đóng gói",  icon: Package,      color: "emerald" },
] as const;

const DOT_COLOR: Record<string, string> = {
  cho_giao:   "bg-slate-300",
  dang_lam:   "bg-amber-400 animate-pulse",
  hoan_thanh: "bg-emerald-500",
  co_loi:     "bg-rose-500",
  "":         "bg-slate-200",
};

const CELL_BG: Record<string, string> = {
  cho_giao:   "bg-slate-50 border-slate-200",
  dang_lam:   "bg-amber-50 border-amber-300",
  hoan_thanh: "bg-emerald-50 border-emerald-300",
  co_loi:     "bg-rose-50 border-rose-300",
  "":         "bg-slate-50 border-slate-100",
};

export function LenhCatFlowBoard() {
  const { dsLenhCat, capNhatCongDoan } = useLenhCat();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = dsLenhCat.filter(lc =>
    lc.id.toLowerCase().includes(search.toLowerCase()) ||
    lc.tenSP.toLowerCase().includes(search.toLowerCase()) ||
    lc.maSP.toLowerCase().includes(search.toLowerCase())
  );

  // KPI nhanh
  const total = dsLenhCat.length;
  const dangSX = dsLenhCat.filter(lc => lc.trangThai === "DangCat").length;
  const hoanThanh = dsLenhCat.filter(lc => lc.trangThai === "HoanThanh").length;
  const coLoi = dsLenhCat.filter(lc =>
    lc.phanCong?.some((pc: any) => pc.trangThaiCD === "co_loi")
  ).length;

  function getPCByKey(lc: any, key: string) {
    return lc.phanCong?.find((pc: any) =>
      pc.id === key ||
      pc.tenCongDoan?.toLowerCase().includes(key === "mayAo" ? "may áo" : key === "mayQuan" ? "may quần" : key)
    );
  }

  function handleUpdateCD(lc: any, pc: any, newTT: TrangThaiCongDoan) {
    if (!pc) return;
    capNhatCongDoan(lc.id, pc.id, { trangThaiCD: newTT });
    toast.success(`${lc.id} · ${pc.tenCongDoan}: cập nhật → ${TRANG_THAI_CD_LABELS[newTT]}`);
  }

  return (
    <div className="space-y-4">
      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Tổng LC", value: total, color: "text-slate-700" },
          { label: "Đang sản xuất", value: dangSX, color: "text-amber-600" },
          { label: "Hoàn thành", value: hoanThanh, color: "text-emerald-600" },
          { label: "Có lỗi công đoạn", value: coLoi, color: "text-rose-600" },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="text-xs text-slate-500 font-medium">{k.label}</div>
            <div className={`text-2xl font-black mt-0.5 ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="🔍 Tìm LC / tên SP / mã SP..."
        className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/30"
      />

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
        {Object.entries(TRANG_THAI_CD_LABELS).map(([k, v]) => {
          const s = TRANG_THAI_CD_STYLE[k as TrangThaiCongDoan];
          return (
            <span key={k} className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${s.bg} ${s.text} font-medium`}>
              <span className={`w-2 h-2 rounded-full ${s.dot}`} />
              {v}
            </span>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left font-black text-slate-600 whitespace-nowrap">Lệnh Cắt</th>
                <th className="px-3 py-3 text-left font-black text-slate-600">Sản phẩm</th>
                <th className="px-3 py-3 text-center font-black text-slate-600">SL</th>
                <th className="px-3 py-3 text-center font-black text-slate-600">Hạn</th>
                {CONG_DOAN_FLOW.map(cd => (
                  <th key={cd.key} className="px-2 py-3 text-center font-black text-slate-600 whitespace-nowrap min-w-[80px]">
                    {cd.label}
                  </th>
                ))}
                <th className="px-3 py-3 text-center font-black text-slate-600">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={20} className="text-center py-10 text-slate-400">Chưa có lệnh cắt nào</td></tr>
              )}
              {filtered.map(lc => {
                const isExpanded = expandedId === lc.id;
                const isLate = lc.hanHoanThanh < new Date().toISOString().split("T")[0] && lc.trangThai !== "HoanThanh";

                return (
                  <>
                    <tr key={lc.id} className={`border-b border-slate-100 hover:bg-slate-50/70 transition-colors ${isLate ? "bg-rose-50/30" : ""}`}>
                      {/* Lệnh cắt */}
                      <td className="px-4 py-3">
                        <div className="font-black text-teal-700 font-mono text-xs">{lc.id}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{lc.trangThai}</div>
                      </td>
                      {/* Sản phẩm */}
                      <td className="px-3 py-3">
                        <div className="font-bold text-slate-800 truncate max-w-[140px]">{lc.tenSP}</div>
                        <div className="text-[10px] text-slate-400">{LOAI_SP_LABELS[lc.loaiSP]} · {lc.maSP}</div>
                      </td>
                      {/* SL */}
                      <td className="px-3 py-3 text-center font-black text-slate-700">{(lc.tongSL || 0).toLocaleString()}</td>
                      {/* Hạn */}
                      <td className="px-3 py-3 text-center">
                        <div className={isLate ? "text-rose-600 font-bold" : "text-slate-600"}>
                          <DateDisplay value={lc.hanHoanThanh} format="dd/MM" />
                        </div>
                      </td>
                      {/* Từng công đoạn */}
                      {CONG_DOAN_FLOW.map(cd => {
                        const pc = getPCByKey(lc, cd.key);
                        const tt = (pc?.trangThaiCD as TrangThaiCongDoan | undefined) ?? (pc ? "cho_giao" : undefined);
                        if (!pc) {
                          return <td key={cd.key} className="px-2 py-3 text-center"><span className="text-slate-200">—</span></td>;
                        }
                        return (
                          <td key={cd.key} className="px-2 py-3 text-center">
                            <button
                              onClick={() => {
                                const nextTT: Record<string, TrangThaiCongDoan> = {
                                  "cho_giao": "dang_lam",
                                  "dang_lam": "hoan_thanh",
                                  "hoan_thanh": "cho_giao",
                                  "co_loi": "dang_lam",
                                };
                                handleUpdateCD(lc, pc, nextTT[tt || "cho_giao"] || "dang_lam");
                              }}
                              className={`w-full px-2 py-1.5 rounded-lg border text-[10px] font-bold transition-all hover:scale-105 ${CELL_BG[tt || ""]}`}
                              title={`${pc.tenCongDoan}: ${pc.nguoiTen || "Chưa giao"} · Click để cập nhật`}
                            >
                              <span className={`inline-block w-2 h-2 rounded-full mr-1 ${DOT_COLOR[tt || ""]}`} />
                              {tt ? TRANG_THAI_CD_LABELS[tt] : "Chờ giao"}
                            </button>
                          </td>
                        );
                      })}
                      {/* Chi tiết toggle */}
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : lc.id)}
                          className="text-sky-500 hover:text-sky-700 transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded row – chi tiết từng công đoạn */}
                    {isExpanded && (
                      <tr key={`${lc.id}-detail`}>
                        <td colSpan={20} className="px-4 py-3 bg-slate-50/80 border-b border-slate-200">
                          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2">
                            {(lc.phanCong || []).map((pc: any) => {
                              const tt = (pc.trangThaiCD as TrangThaiCongDoan | undefined) ?? "cho_giao";
                              const style = TRANG_THAI_CD_STYLE[tt];
                              return (
                                <div key={pc.id} className={`rounded-xl border p-3 ${CELL_BG[tt]}`}>
                                  <div className="font-black text-slate-700 text-xs mb-1">{pc.tenCongDoan}</div>
                                  <div className="text-[10px] text-slate-500 truncate mb-2">{pc.nguoiTen || <span className="italic text-slate-400">Chưa giao</span>}</div>
                                  <div className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                                    {TRANG_THAI_CD_LABELS[tt]}
                                  </div>
                                  {pc.soLuongHoanThanh != null && (
                                    <div className="text-[10px] text-emerald-600 font-bold mt-1">
                                      ✓ {pc.soLuongHoanThanh}/{pc.soLuong} SP
                                    </div>
                                  )}
                                  {pc.soLuongLoi != null && pc.soLuongLoi > 0 && (
                                    <div className="text-[10px] text-rose-600 font-bold">
                                      ✗ Lỗi: {pc.soLuongLoi} SP
                                    </div>
                                  )}
                                  {/* Quick update buttons */}
                                  <div className="flex gap-1 mt-2">
                                    {(["dang_lam", "hoan_thanh", "co_loi"] as TrangThaiCongDoan[]).map(s => (
                                      <button
                                        key={s}
                                        onClick={() => handleUpdateCD(lc, pc, s)}
                                        className={`flex-1 text-[9px] py-0.5 rounded font-bold border transition-colors ${
                                          tt === s ? "opacity-100" : "opacity-40 hover:opacity-80"
                                        } ${CELL_BG[s]}`}
                                      >
                                        {s === "dang_lam" ? "▶" : s === "hoan_thanh" ? "✓" : "✗"}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
