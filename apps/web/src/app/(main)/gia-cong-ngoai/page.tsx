"use client";

import { useState, useMemo } from "react";
import { Hammer, Phone, MapPin, Star, TrendingUp, Plus, X, Briefcase, DollarSign, Award, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { DOI_TAC, formatVND, formatVNDShort } from "@/lib/data/real-data";
import { PHAN_CONG, tinhCongNo } from "@/lib/data/cong-no";
import { Avatar } from "@/components/Avatar";
import { EntityCard, EntityCardGrid, EntityCardList } from "@/components/EntityCard";
import { DataViewToggle, type ViewMode } from "@/components/DataViewToggle";

const LOAI_COLOR: Record<string, string> = {
  "Xưởng may": "bg-violet-500/15 text-violet-700",
  "Xưởng in/thêu": "bg-pink-500/15 text-pink-700",
  "Xưởng nhuộm": "bg-amber-500/15 text-amber-700",
  "Xưởng thêu": "bg-pink-500/15 text-pink-700",
  "Xưởng hoàn thiện": "bg-sky-500/15 text-sky-700",
  "Đối tác khác": "bg-slate-500/15 text-slate-700",
};

export default function GiaCongNgoaiPage() {
  const [search, setSearch] = useState("");
  const [filterLoai, setFilterLoai] = useState<string>("all");
  const [filterTrangThai, setFilterTrangThai] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("card");

  // Stats
  const dsDoiTac = DOI_TAC.filter((d) => d.trangThai === "Đang hợp tác");
  const congNo = tinhCongNo(PHAN_CONG);

  // Top đối tác theo doanh thu
  const topDT = useMemo(() => {
    const map: Record<string, { ma: string; ten: string; loai: string; tong: number; soPC: number; conNo: number }> = {};
    for (const pc of PHAN_CONG) {
      const ma = pc.nguoiPhuTrach.ma;
      if (!map[ma]) {
        const dt = DOI_TAC.find((d) => d.maDT === ma);
        map[ma] = { ma, ten: pc.nguoiPhuTrach.ten, loai: (dt as any)?.loai || "Khác", tong: 0, soPC: 0, conNo: 0 };
      }
      map[ma].tong += pc.donGiaGiao * pc.soLuongGiao;
      map[ma].soPC += 1;
      map[ma].conNo += (pc.donGiaGiao * pc.soLuongGiao) - pc.daThanhToan;
    }
    return Object.values(map).sort((a, b) => b.tong - a.tong);
  }, []);

  // Filter
  const filtered = topDT.filter((d) => {
    const matchSearch = [d.ten, d.ma, d.loai].some((x) => (x || "").toLowerCase().includes(search.toLowerCase()));
    const matchLoai = filterLoai === "all" || d.loai === filterLoai;
    return matchSearch && matchLoai;
  });

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2"><Hammer className="w-7 h-7 text-violet-500" /> Gia công ngoài</h1>
          <p className="opacity-70 mt-1 text-sm">{DOI_TAC.length} đối tác · {dsDoiTac.length} đang hợp tác · Tổng nợ <b className="text-red-600">{formatVNDShort(congNo.tongConNo)}</b></p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Thêm ĐT</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5"><div className="text-xs opacity-70 flex items-center gap-1"><Hammer className="w-3 h-3" /> Tổng ĐT</div><div className="text-2xl md:text-3xl font-bold mt-1">{DOI_TAC.length}</div><div className="text-xs opacity-60 mt-1">đối tác</div></div>
        <div className="card p-5"><div className="text-xs opacity-70 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đang hợp tác</div><div className="text-2xl md:text-3xl font-bold mt-1 text-emerald-600">{dsDoiTac.length}</div><div className="text-xs opacity-60 mt-1">active</div></div>
        <div className="card p-5"><div className="text-xs opacity-70 flex items-center gap-1"><Briefcase className="w-3 h-3" /> Tổng PC</div><div className="text-2xl md:text-3xl font-bold mt-1 text-sky-600">{PHAN_CONG.length}</div><div className="text-xs opacity-60 mt-1">phân công</div></div>
        <div className={`card p-5 ${congNo.tongConNo > 0 ? "bg-red-500/10 border-red-500/40" : ""}`}>
          <div className="text-xs opacity-70 flex items-center gap-1"><DollarSign className="w-3 h-3 text-red-600" /> Còn nợ</div>
          <div className={`text-2xl md:text-3xl font-bold mt-1 ${congNo.tongConNo > 0 ? "text-red-600" : "text-emerald-600"}`}>{formatVNDShort(congNo.tongConNo)}</div>
          <div className="text-xs opacity-60 mt-1">{formatVND(congNo.tongConNo)}</div>
        </div>
      </div>

      {/* Top 5 đối tác */}
      <div className="card p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-amber-500" /> Top đối tác theo doanh thu</h3>
        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-3">
          {topDT.slice(0, 5).map((d, i) => (
            <div key={d.ma} className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 border border-violet-500/20 rounded p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${i === 0 ? "bg-amber-500" : i === 1 ? "bg-slate-400" : "bg-violet-500"}`}>{i + 1}</div>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-medium ${LOAI_COLOR[d.loai] || 'bg-slate-500/15 text-slate-700'}">{d.loai}</span>
              </div>
              <div className="font-semibold text-sm truncate">{d.ten.split(" - ")[0]}</div>
              <div className="text-[10px] opacity-60 mt-0.5">{d.soPC} công đoạn</div>
              <div className="text-sm font-bold text-emerald-600 mt-1">{formatVNDShort(d.tong)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-2 flex-1">
            {["all", ...Array.from(new Set(DOI_TAC.map((d: any) => d.loai || "Khác")))].map((loai) => (
              <button key={loai} onClick={() => setFilterLoai(loai)} className={`px-3 py-1.5 rounded-full text-xs font-medium ${filterLoai === loai ? "bg-violet-500 text-white" : "bg-white/40 dark:bg-white/5 hover:bg-white/60"}`}>
                {loai === "all" ? "Tất cả" : loai}
              </button>
            ))}
          </div>
          <DataViewToggle onChange={setViewMode} />
        </div>
        <input className="input max-w-md" placeholder="Tìm tên, mã..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Table / Card / List View */}
      {viewMode === "table" && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b" style={{ borderColor: "var(--border)" }}>
                  <th className="p-3">#</th>
                  <th className="p-3">Đối tác</th>
                  <th className="p-3">Loại</th>
                  <th className="p-3 text-center">Số PC</th>
                  <th className="p-3 text-right">Tổng tiền</th>
                  <th className="p-3 text-right">Còn nợ</th>
                  <th className="p-3 text-right">% Đã TT</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, i) => {
                  const pct = d.tong > 0 ? ((d.tong - d.conNo) / d.tong) * 100 : 0;
                  return (
                    <tr key={d.ma} className="border-b last:border-0 hover:bg-white/30 dark:hover:bg-white/5" style={{ borderColor: "var(--border)" }}>
                      <td className="p-3 font-mono text-xs opacity-70">#{i + 1}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={d.ten} size="sm" />
                          <span className="font-medium">{d.ten.split(" - ")[0]}</span>
                        </div>
                      </td>
                      <td className="p-3"><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${LOAI_COLOR[d.loai] || "bg-slate-500/15 text-slate-700"}`}>{d.loai}</span></td>
                      <td className="p-3 text-center font-mono">{d.soPC}</td>
                      <td className="p-3 text-right font-mono font-semibold">{formatVNDShort(d.tong)}</td>
                      <td className="p-3 text-right font-mono font-semibold text-red-600">{d.conNo > 0 ? formatVNDShort(d.conNo) : "✓"}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <div className="w-16 h-1.5 bg-slate-200/40 dark:bg-slate-700/40 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[10px] opacity-60 w-8 text-right">{pct.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === "card" && (
        <EntityCardGrid cols={3}>
          {filtered.map((d) => {
            const pct = d.tong > 0 ? ((d.tong - d.conNo) / d.tong) * 100 : 0;
            return (
              <EntityCard
                key={d.ma}
                name={d.ten.split(" - ")[0]}
                avatarSize="xl"
                badges={[{ label: d.loai, bg: "bg-violet-500/15", color: "text-violet-700" }]}
                subtitle={<span className="font-mono text-[10px]">{d.ma}</span>}
                stats={[
                  { label: "Số PC", value: d.soPC, color: "text-sky-600" },
                  { label: "Tổng tiền", value: formatVNDShort(d.tong), color: "text-emerald-600" },
                  { label: "Còn nợ", value: d.conNo > 0 ? formatVNDShort(d.conNo) : "✓", color: d.conNo > 0 ? "text-red-600" : "text-emerald-600" },
                  { label: "Đã thanh toán", value: `${pct.toFixed(0)}%`, color: pct === 100 ? "text-emerald-600" : "text-amber-600" },
                ]}
                footer={
                  <div className="w-full h-2 bg-slate-200/40 dark:bg-slate-700/40 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400" style={{ width: `${pct}%` }} />
                  </div>
                }
              />
            );
          })}
        </EntityCardGrid>
      )}

      {viewMode === "list" && (
        <EntityCardList>
          {filtered.map((d) => {
            const pct = d.tong > 0 ? ((d.tong - d.conNo) / d.tong) * 100 : 0;
            return (
              <div key={d.ma} className="card p-3 flex items-center gap-3">
                <Avatar name={d.ten} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{d.ten.split(" - ")[0]}</div>
                  <div className="text-[10px] opacity-60 flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded font-medium ${LOAI_COLOR[d.loai] || "bg-slate-500/15 text-slate-700"}`}>{d.loai}</span>
                    <span>·</span>
                    <span>{d.soPC} PC</span>
                  </div>
                </div>
                <div className="w-32">
                  <div className="h-1.5 bg-slate-200/40 dark:bg-slate-700/40 rounded-full overflow-hidden mb-1">
                    <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-[10px] opacity-60 text-right">{pct.toFixed(0)}% đã TT</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold">{formatVNDShort(d.tong)}</div>
                  <div className={`text-[10px] font-mono ${d.conNo > 0 ? "text-red-600" : "text-emerald-600"}`}>
                    {d.conNo > 0 ? `Nợ: ${formatVNDShort(d.conNo)}` : "Sạch"}
                  </div>
                </div>
              </div>
            );
          })}
        </EntityCardList>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowForm(false)}>
          <div className="card max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-3">Thêm đối tác gia công</h3>
            <p className="text-sm opacity-70">Form đang phát triển. Vui lòng thêm qua Excel import hoặc liên hệ admin.</p>
            <button onClick={() => setShowForm(false)} className="btn-primary w-full mt-3">Đóng</button>
          </div>
        </div>
      )}
    </div>
  );
}
