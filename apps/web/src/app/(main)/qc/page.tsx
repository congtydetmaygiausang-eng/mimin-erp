"use client";

import { useState } from "react";
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, ClipboardCheck, Award, TrendingUp } from "lucide-react";
import { toast } from "sonner";

type QCRecord = {
  id: string;
  ngay: string;
  lenhCat: string;
  congDoan: string;
  nguoiQC: string;
  soLuongKiem: number;
  dat: number;
  loi: number;
  tiLeDat: number;
  ghiChu?: string;
};

const QC_DATA: QCRecord[] = [
  { id: "QC-001", ngay: "2026-07-25", lenhCat: "LC-M758", congDoan: "Cắt", nguoiQC: "Trần Thị Hoa", soLuongKiem: 500, dat: 498, loi: 2, tiLeDat: 99.6 },
  { id: "QC-002", ngay: "2026-07-26", lenhCat: "LC-M758", congDoan: "May áo", nguoiQC: "Nguyễn Văn Minh", soLuongKiem: 200, dat: 196, loi: 4, tiLeDat: 98.0 },
  { id: "QC-003", ngay: "2026-07-27", lenhCat: "LC-M873", congDoan: "In", nguoiQC: "Lê Thị Tuyết", soLuongKiem: 300, dat: 295, loi: 5, tiLeDat: 98.3 },
  { id: "QC-004", ngay: "2026-07-28", lenhCat: "LC-M873", congDoan: "May áo", nguoiQC: "Trần Thị Hoa", soLuongKiem: 250, dat: 240, loi: 10, tiLeDat: 96.0, ghiChu: "10 áo lỗi đường may" },
  { id: "QC-005", ngay: "2026-07-29", lenhCat: "LC-M758", congDoan: "Ủi/Đóng gói", nguoiQC: "Nguyễn Văn Minh", soLuongKiem: 180, dat: 180, loi: 0, tiLeDat: 100 },
];

export default function QCPage() {
  const dsDat = QC_DATA.filter((q) => q.tiLeDat === 100);
  const dsLoi = QC_DATA.filter((q) => q.tiLeDat < 98);
  const tongKiem = QC_DATA.reduce((s, q) => s + q.soLuongKiem, 0);
  const tongLoi = QC_DATA.reduce((s, q) => s + q.loi, 0);
  const tiLeDatChung = tongKiem > 0 ? ((tongKiem - tongLoi) / tongKiem) * 100 : 0;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2"><ShieldCheck className="w-7 h-7 text-emerald-500" /> Kiểm tra chất lượng (QC)</h1>
          <p className="opacity-70 mt-1 text-sm">{QC_DATA.length} lượt kiểm · {tongKiem.toLocaleString()} sp đã kiểm · Đạt <b className="text-emerald-600">{tiLeDatChung.toFixed(1)}%</b></p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5"><div className="text-xs opacity-70 flex items-center gap-1"><ClipboardCheck className="w-3 h-3" /> Tổng kiểm</div><div className="text-2xl md:text-3xl font-bold mt-1">{tongKiem.toLocaleString()}</div><div className="text-xs opacity-60 mt-1">sản phẩm</div></div>
        <div className="card p-5"><div className="text-xs opacity-70 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đạt</div><div className="text-2xl md:text-3xl font-bold mt-1 text-emerald-600">{(tongKiem - tongLoi).toLocaleString()}</div><div className="text-xs opacity-60 mt-1">{tiLeDatChung.toFixed(1)}%</div></div>
        <div className={`card p-5 ${tongLoi > 0 ? "bg-red-500/10 border-red-500/40" : ""}`}><div className="text-xs opacity-70 flex items-center gap-1"><XCircle className="w-3 h-3 text-red-600" /> Lỗi</div><div className={`text-2xl md:text-3xl font-bold mt-1 ${tongLoi > 0 ? "text-red-600" : ""}`}>{tongLoi.toLocaleString()}</div><div className="text-xs opacity-60 mt-1">sản phẩm</div></div>
        <div className="card p-5"><div className="text-xs opacity-70 flex items-center gap-1"><Award className="w-3 h-3 text-amber-500" /> Lô đạt 100%</div><div className="text-2xl md:text-3xl font-bold mt-1 text-amber-600">{dsDat.length}</div><div className="text-xs opacity-60 mt-1">/ {QC_DATA.length} lô</div></div>
      </div>

      {dsLoi.length > 0 && (
        <div className="card p-4 flex items-start gap-3 bg-red-500/10 border-red-500/40">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <b className="text-red-700 dark:text-red-400">⚠️ Cảnh báo lỗi &gt; 2%:</b>{" "}
            {dsLoi.map((q) => `${q.lenhCat} - ${q.congDoan} (${q.tiLeDat}%)`).join(", ")}
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b" style={{ borderColor: "var(--border)" }}>
                <th className="p-3">Mã QC</th>
                <th className="p-3">Ngày</th>
                <th className="p-3">Lệnh cắt</th>
                <th className="p-3">Công đoạn</th>
                <th className="p-3">Người QC</th>
                <th className="p-3 text-right">SL kiểm</th>
                <th className="p-3 text-right">Đạt</th>
                <th className="p-3 text-right">Lỗi</th>
                <th className="p-3 text-right">% Đạt</th>
                <th className="p-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {QC_DATA.map((q) => (
                <tr key={q.id} className={`border-b last:border-0 hover:bg-white/30 dark:hover:bg-white/5 ${q.tiLeDat < 98 ? "bg-red-500/5" : ""}`} style={{ borderColor: "var(--border)" }}>
                  <td className="p-3 font-mono text-xs opacity-70">{q.id}</td>
                  <td className="p-3 text-xs">{q.ngay}</td>
                  <td className="p-3 font-mono text-xs text-brand-600 font-semibold">{q.lenhCat}</td>
                  <td className="p-3 text-xs">{q.congDoan}</td>
                  <td className="p-3 text-xs">{q.nguoiQC}</td>
                  <td className="p-3 text-right font-mono font-semibold">{q.soLuongKiem.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono text-emerald-600">{q.dat.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono text-red-600 font-semibold">{q.loi.toLocaleString()}</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <div className="w-16 h-1.5 bg-slate-200/40 dark:bg-slate-700/40 rounded-full overflow-hidden">
                        <div className={`h-full ${q.tiLeDat === 100 ? "bg-emerald-500" : q.tiLeDat >= 98 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${q.tiLeDat}%` }} />
                      </div>
                      <span className={`font-bold text-xs ${q.tiLeDat === 100 ? "text-emerald-600" : q.tiLeDat >= 98 ? "text-amber-600" : "text-red-600"}`}>{q.tiLeDat}%</span>
                    </div>
                  </td>
                  <td className="p-3">
                    {q.tiLeDat === 100 ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 font-semibold flex items-center gap-0.5 w-fit">
                        <CheckCircle2 className="w-3 h-3" /> Đạt
                      </span>
                    ) : q.tiLeDat >= 98 ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 font-semibold w-fit block">Cảnh báo</span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-700 font-semibold flex items-center gap-0.5 w-fit">
                        <XCircle className="w-3 h-3" /> Lỗi nặng
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
