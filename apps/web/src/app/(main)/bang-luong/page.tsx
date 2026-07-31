"use client";

import { useState, useMemo } from "react";
import { Wallet, Download, TrendingUp, Users, Calendar, DollarSign, FileText, Shield } from "lucide-react";
import { toast } from "sonner";
import { NHAN_SU, formatVND, formatVNDShort } from "@/lib/data/real-data";
import { usePhanCong } from "@/lib/data/cong-no-store";
import { Avatar } from "@/components/Avatar";
import { EntityCard, EntityCardGrid, EntityCardList } from "@/components/EntityCard";
import { DataViewToggle, type ViewMode } from "@/components/DataViewToggle";

const LUONG_CUNG_MOI_NV = 8500000;  // Mặc định

export default function BangLuongPage() {
  const { phanCong } = usePhanCong();
  const [thang, setThang] = useState("2026-07");
  const [viewMode, setViewMode] = useState<ViewMode>("card");

  // Tính lương SP cho từng NV
  const luongSPTheoNV = useMemo(() => {
    const map: Record<string, number> = {};
    for (const pc of phanCong) {
      const maNV = pc.nguoiPhuTrach.ma;
      if (!map[maNV]) map[maNV] = 0;
      map[maNV] += pc.donGiaGiao * pc.soLuongGiao;
    }
    return map;
  }, [phanCong]);

  // Tổng hợp bảng lương tất cả NV
  const bangLuong = NHAN_SU.map((nv) => {
    const luongCung = LUONG_CUNG_MOI_NV;
    const luongSP = luongSPTheoNV[nv.maNV] || 0;
    const baoHiem = luongCung * 0.105;  // 10.5%
    const thucNhan = luongCung - baoHiem + luongSP;
    return { nv, luongCung, luongSP, baoHiem, thucNhan };
  });

  const tongLuongCung = bangLuong.reduce((s, b) => s + b.luongCung, 0);
  const tongLuongSP = bangLuong.reduce((s, b) => s + b.luongSP, 0);
  const tongBH = bangLuong.reduce((s, b) => s + b.baoHiem, 0);
  const tongThucNhan = bangLuong.reduce((s, b) => s + b.thucNhan, 0);
  const tongCongDoan = phanCong.length;

  // Group theo bộ phận
  const theoBoPhan = useMemo(() => {
    const map: Record<string, { sl: number; luong: number; nv: number }> = {};
    for (const b of bangLuong) {
      const bp = b.nv.boPhan;
      if (!map[bp]) map[bp] = { sl: 0, luong: 0, nv: 0 };
      map[bp].sl += 1;
      map[bp].luong += b.thucNhan;
      map[bp].nv += 1;
    }
    return map;
  }, [bangLuong]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="card p-3 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-blue-500/30 flex items-center gap-3">
        <Shield className="w-5 h-5 text-blue-600 shrink-0" />
        <div className="flex-1 text-xs">
          <b>Bảng lương</b> là dữ liệu nhạy cảm. Chỉ <b>Kế toán</b> và <b>Quản trị viên</b> mới có quyền xem & chỉnh sửa.
        </div>
      </div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2"><Wallet className="w-7 h-7 text-emerald-500" /> Bảng lương tổng hợp</h1>
          <p className="opacity-70 mt-1 text-sm">Tháng <b>{thang}</b> · {NHAN_SU.length} nhân viên · Tổng chi <b className="text-red-600">{formatVNDShort(tongThucNhan)}</b></p>
        </div>
        <div className="flex gap-2">
          <select className="input" value={thang} onChange={(e) => setThang(e.target.value)}>
            <option value="2026-05">Tháng 5/2026</option>
            <option value="2026-06">Tháng 6/2026</option>
            <option value="2026-07">Tháng 7/2026</option>
            <option value="2026-08">Tháng 8/2026</option>
          </select>
          <button onClick={() => toast.info("Đang xuất bảng lương…")} className="btn-secondary flex items-center gap-2"><Download className="w-4 h-4" /> Xuất Excel</button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5"><div className="text-xs opacity-70 flex items-center gap-1"><Users className="w-3 h-3" /> Tổng NV</div><div className="text-2xl md:text-3xl font-bold mt-1">{NHAN_SU.length}</div><div className="text-xs opacity-60 mt-1">nhân viên</div></div>
        <div className="card p-5"><div className="text-xs opacity-70 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Lương cứng</div><div className="text-2xl md:text-3xl font-bold mt-1 text-sky-600">{formatVNDShort(tongLuongCung)}</div><div className="text-xs opacity-60 mt-1">{formatVND(tongLuongCung)}</div></div>
        <div className="card p-5"><div className="text-xs opacity-70 flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-600" /> Lương SP</div><div className="text-2xl md:text-3xl font-bold mt-1 text-emerald-600">{formatVNDShort(tongLuongSP)}</div><div className="text-xs opacity-60 mt-1">{tongCongDoan} công đoạn</div></div>
        <div className="card p-5 bg-emerald-500/10 border-emerald-500/30"><div className="text-xs opacity-70 flex items-center gap-1"><Wallet className="w-3 h-3 text-emerald-600" /> Thực chi</div><div className="text-2xl md:text-3xl font-bold mt-1 text-emerald-700">{formatVNDShort(tongThucNhan)}</div><div className="text-xs opacity-60 mt-1">- BHXH {formatVNDShort(tongBH)}</div></div>
      </div>

      {/* Theo bộ phận */}
      <div className="card p-4">
        <h3 className="font-semibold mb-3">Theo bộ phận</h3>
        <div className="grid md:grid-cols-3 gap-3">
          {Object.entries(theoBoPhan).map(([bp, d]) => (
            <div key={bp} className="bg-white/30 dark:bg-white/5 rounded p-3">
              <div className="text-xs opacity-70">{bp}</div>
              <div className="text-lg font-bold mt-1">{d.sl} NV</div>
              <div className="text-sm text-emerald-600 font-mono mt-1">{formatVNDShort(d.luong)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
          <h3 className="font-semibold flex items-center gap-2"><FileText className="w-4 h-4 text-brand-500" /> Chi tiết bảng lương tháng {thang}</h3>
          <DataViewToggle onChange={setViewMode} />
        </div>

        {viewMode === "table" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b" style={{ borderColor: "var(--border)" }}>
                  <th className="p-3">Mã NV</th>
                  <th className="p-3">Họ tên</th>
                  <th className="p-3">Bộ phận</th>
                  <th className="p-3 text-right">Lương cứng</th>
                  <th className="p-3 text-right">Lương SP</th>
                  <th className="p-3 text-right">BHXH (10.5%)</th>
                  <th className="p-3 text-right">Thực nhận</th>
                </tr>
              </thead>
              <tbody>
                {bangLuong.map(({ nv, luongCung, luongSP, baoHiem, thucNhan }) => (
                  <tr key={nv.maNV} className="border-b last:border-0 hover:bg-white/30 dark:hover:bg-white/5" style={{ borderColor: "var(--border)" }}>
                    <td className="p-3 font-mono text-xs opacity-70">{nv.maNV}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={nv.hoTen} size="sm" />
                        <span className="font-medium">{nv.hoTen}</span>
                      </div>
                    </td>
                    <td className="p-3 text-xs">{nv.boPhan}</td>
                    <td className="p-3 text-right font-mono">{formatVNDShort(luongCung)}</td>
                    <td className="p-3 text-right font-mono text-emerald-600">{luongSP > 0 ? formatVNDShort(luongSP) : "—"}</td>
                    <td className="p-3 text-right font-mono text-red-600">-{formatVNDShort(baoHiem)}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-700">{formatVNDShort(thucNhan)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-emerald-500/10 font-bold text-xs">
                  <td colSpan={3} className="p-3 text-right">TỔNG ({NHAN_SU.length} NV)</td>
                  <td className="p-3 text-right">{formatVNDShort(tongLuongCung)}</td>
                  <td className="p-3 text-right text-emerald-600">{formatVNDShort(tongLuongSP)}</td>
                  <td className="p-3 text-right text-red-600">-{formatVNDShort(tongBH)}</td>
                  <td className="p-3 text-right text-emerald-700">{formatVNDShort(tongThucNhan)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {viewMode === "card" && (
          <div className="p-4">
            <EntityCardGrid cols={3}>
              {bangLuong.map(({ nv, luongCung, luongSP, baoHiem, thucNhan }) => (
                <EntityCard
                  key={nv.maNV}
                  name={nv.hoTen}
                  avatarSize="xl"
                  highlight={thucNhan >= 10000000}
                  badges={[
                    { label: nv.boPhan, bg: "bg-violet-500/15", color: "text-violet-700" },
                    { label: nv.chucVu?.split(" ").slice(0, 2).join(" "), bg: "bg-sky-500/15", color: "text-sky-700" },
                  ]}
                  subtitle={<span className="font-mono text-[10px] opacity-60">{nv.maNV}</span>}
                  stats={[
                    { label: "Lương cứng", value: formatVNDShort(luongCung), color: "text-sky-600" },
                    { label: "Lương SP", value: luongSP > 0 ? formatVNDShort(luongSP) : "—", color: "text-emerald-600" },
                    { label: "BHXH 10.5%", value: `-${formatVNDShort(baoHiem)}`, color: "text-red-600" },
                    { label: "Thực nhận", value: <span className="text-base font-bold text-emerald-700">{formatVNDShort(thucNhan)}</span>, color: "text-emerald-700" },
                  ]}
                />
              ))}
            </EntityCardGrid>
          </div>
        )}

        {viewMode === "list" && (
          <div className="p-4 space-y-2">
            {bangLuong.map(({ nv, luongCung, luongSP, baoHiem, thucNhan }) => (
              <div key={nv.maNV} className="card p-3 flex items-center gap-3">
                <Avatar name={nv.hoTen} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{nv.hoTen}</div>
                  <div className="text-[10px] opacity-60 flex items-center gap-2">
                    <span className="font-mono">{nv.maNV}</span>
                    <span>·</span>
                    <span className="px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-700">{nv.boPhan}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] opacity-60">Cứng: {formatVNDShort(luongCung)}</div>
                  <div className="text-[10px] text-emerald-600">SP: +{formatVNDShort(luongSP)}</div>
                </div>
                <div className="text-right border-l pl-3" style={{ borderColor: "var(--border)" }}>
                  <div className="text-[10px] opacity-60">Thực nhận</div>
                  <div className="text-sm font-bold text-emerald-700">{formatVNDShort(thucNhan)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
