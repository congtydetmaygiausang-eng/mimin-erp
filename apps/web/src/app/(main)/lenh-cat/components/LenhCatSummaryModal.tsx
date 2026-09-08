"use client";

import { Calculator, UserRound, UsersRound, X } from "lucide-react";
import { formatVND } from "@/lib/data/real-data";
import type { LenhCat } from "@/lib/data/lenh-cat-store";

export type LenhCatSummaryView = "cost" | "owners";

function CostSummary({ lc }: { lc: LenhCat }) {
  const cogs = lc.bangCOGS;
  const tongSL = lc.tongSL || 0;
  const tongGiaCong = (cogs?.giaCong1SP || 0) * tongSL;
  const tongGiaVon = cogs?.tongGiaVon
    ?? (cogs?.giaVon1SP ?? cogs?.giaVonBinhQuan ?? 0) * tongSL;
  const rows = [
    { label: "Chi phí vải", value: cogs?.tongTienVai || 0 },
    { label: "Chi phí phụ liệu", value: cogs?.tongTienPhuLieu || 0 },
    { label: "Chi phí gia công", value: tongGiaCong },
    { label: "Chi phí cố định", value: cogs?.tongChiPhiCoDinh || 0 },
  ];

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-4 text-white shadow-sm">
        <div className="text-xs font-bold uppercase tracking-wider text-white/80">Tổng giá vốn lệnh cắt</div>
        <div className="mt-1 text-3xl font-black tabular-nums">{formatVND(tongGiaVon)}</div>
        <div className="mt-1 text-xs text-white/80">
          {tongSL.toLocaleString("vi-VN")} sản phẩm · {formatVND(cogs?.giaVon1SP ?? cogs?.giaVonBinhQuan ?? 0)}/SP
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {rows.map((row) => (
          <div key={row.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-[11px] font-semibold text-slate-500">{row.label}</div>
            <div className="mt-1 font-black tabular-nums text-slate-800">{formatVND(row.value)}</div>
          </div>
        ))}
      </div>
      {!cogs && <p className="rounded-lg bg-amber-50 p-3 text-xs font-semibold text-amber-700">Lệnh cắt chưa có bảng tính giá vốn.</p>}
    </div>
  );
}

function OwnersSummary({ lc }: { lc: LenhCat }) {
  const phanCong = lc.phanCong || [];
  const assignedCount = phanCong.filter((item) => item.nguoiMa || item.nguoiTen).length;
  const uniqueOwners = new Set(phanCong.filter((item) => item.nguoiMa || item.nguoiTen).map((item) => item.nguoiMa || item.nguoiTen)).size;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-sky-50 p-3 text-sky-800"><div className="text-[11px] font-bold">Đã phân công</div><div className="text-2xl font-black">{assignedCount}/{phanCong.length}</div></div>
        <div className="rounded-xl bg-violet-50 p-3 text-violet-800"><div className="text-[11px] font-bold">Tổng người phụ trách</div><div className="text-2xl font-black">{uniqueOwners}</div></div>
      </div>
      <div className="space-y-2">
        {phanCong.map((item) => (
          <div key={item.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700"><UserRound className="h-4 w-4" /></div>
            <div className="min-w-0 flex-1"><div className="font-bold text-slate-800">{item.tenCongDoan}</div><div className={`truncate text-xs ${item.nguoiTen ? "text-slate-500" : "italic text-amber-600"}`}>{item.nguoiTen || "Chưa giao người phụ trách"}</div></div>
            {item.nguoiMa && <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[10px] font-bold text-slate-500">{item.nguoiMa}</span>}
          </div>
        ))}
        {phanCong.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">Lệnh cắt chưa có công đoạn để phân công.</p>}
      </div>
    </div>
  );
}

export function LenhCatSummaryModal({ lc, view, onClose }: { lc: LenhCat; view: LenhCatSummaryView; onClose: () => void }) {
  const isCost = view === "cost";
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={isCost ? "Tổng giá vốn lệnh cắt" : "Người phụ trách công đoạn"} className="max-h-[88vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:max-w-xl sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
          <div className="flex items-center gap-2">{isCost ? <Calculator className="h-5 w-5 text-amber-600" /> : <UsersRound className="h-5 w-5 text-sky-600" />}<div><h2 className="font-black text-slate-900">{isCost ? "Tổng giá vốn" : "Người phụ trách công đoạn"}</h2><p className="text-xs text-slate-500">{lc.id} · {lc.tenSP}</p></div></div>
          <button type="button" onClick={onClose} aria-label="Đóng" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-4">{isCost ? <CostSummary lc={lc} /> : <OwnersSummary lc={lc} />}</div>
      </div>
    </div>
  );
}
