// ============ BANG LUONG NV MODAL ============
// Tach tu page.tsx (2026-08-05 - toi uu B.3)

import { useEffect, useState } from "react";
import { X, Wallet, Shield } from "lucide-react";
import { formatVNDShort } from "@/lib/data/real-data";
import { usePhanCong } from "@/lib/data/cong-no-store";
import {
  CHUAN_NGAY_CONG_THANG,
  mergeChamCongRecords,
  normalizeChamCongFromDB,
  tinhLuongTheoNgayCong,
  tinhPhanTramNgayCong,
  tongHopChamCong,
  type ChamCongRecord,
} from "@/lib/cham-cong";
import { isSupabaseEnabled, supabase } from "@/lib/supabase/client";
import type { NhanSuExt } from "../data";

export function BangLuongNV({ nv, luongSP, onClose }: { nv: NhanSuExt; luongSP: number; onClose: () => void }) {
  const [monthRecords, setMonthRecords] = useState<ChamCongRecord[]>([]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "auto"; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const now = new Date();
    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const startIso = `${monthPrefix}-01`;
    const endIso = `${monthPrefix}-${String(lastDay).padStart(2, "0")}`;

    const readLocal = (key: string): ChamCongRecord[] => {
      try {
        const raw = typeof window !== "undefined" ? localStorage.getItem(key) : null;
        const parsed = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(parsed)) return [];
        return parsed
          .map((row) => normalizeChamCongFromDB(row as Record<string, unknown>))
          .filter((row) => row.maNV && row.ngay.startsWith(monthPrefix));
      } catch {
        return [];
      }
    };

    const localCached = readLocal("mimin_cham_cong_v1");
    const localPending = readLocal("mimin_cham_cong_pending_v1");
    setMonthRecords(mergeChamCongRecords(localCached, localPending));

    (async () => {
      if (!isSupabaseEnabled || !supabase) return;
      try {
        const { data, error } = await supabase
          .from("cham_cong")
          .select("*")
          .gte("ngay", startIso)
          .lte("ngay", endIso);
        if (!cancelled && !error && Array.isArray(data)) {
          const remote = data
            .map((row) => normalizeChamCongFromDB(row as Record<string, unknown>))
            .filter((row) => row.maNV && row.ngay.startsWith(monthPrefix));
          setMonthRecords(mergeChamCongRecords(remote, localPending));
        }
      } catch {
        // giữ fallback local
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [nv.maNV]);

  const { phanCong } = usePhanCong();
  const pcNV = phanCong.filter((p) => {
    const ma = typeof p.nguoiPhuTrach === "object" ? p.nguoiPhuTrach?.ma : p.nguoiPhuTrach;
    return ma === nv.maNV;
  });
  const tongCongDoan = pcNV.reduce((s, p) => s + (p.donGiaGiao || 0) * (p.soLuongGiao || 0), 0);
  const daThanhToan = pcNV.reduce((s, p) => s + (p.daThanhToan || 0), 0);
  const conNo = tongCongDoan - daThanhToan;

  const hasAttendance = monthRecords.length > 0;
  const empRecords = monthRecords.filter(
    (r) => r.maNV.trim().toUpperCase() === nv.maNV.trim().toUpperCase()
  );
  const attSummary = tongHopChamCong(empRecords);
  const tyLeCong = tinhPhanTramNgayCong(attSummary.ngayCong, CHUAN_NGAY_CONG_THANG);
  const luongCoBanThang = nv.luongCung || 0;
  const luongTheoCong = hasAttendance
    ? tinhLuongTheoNgayCong(luongCoBanThang, attSummary.ngayCong, CHUAN_NGAY_CONG_THANG)
    : luongCoBanThang;
  const baoHiem = luongCoBanThang * 0.105;
  const thucNhan = Math.max(0, luongTheoCong - baoHiem + (luongSP || 0));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div className="card max-w-3xl w-[96%] p-5 sm:p-7 max-h-[90vh] overflow-y-auto rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-600" />
            Bảng lương: {nv.hoTen}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-white/40 rounded"><X className="w-5 h-5" /></button>
        </div>
        <div className="bg-emerald-500/10 rounded p-3 mb-4 text-sm">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
            <div>
              <div className="text-xs opacity-70">Ngày công ({CHUAN_NGAY_CONG_THANG} chuẩn)</div>
              <div className="text-lg font-bold text-teal-700">
                {attSummary.ngayCong}/{CHUAN_NGAY_CONG_THANG}
              </div>
              <div className="text-[11px] opacity-70">
                {hasAttendance ? `${tyLeCong}% · Phép ${attSummary.ngayPhep}` : "Chưa có chấm công"}
              </div>
            </div>
            <div>
              <div className="text-xs opacity-70">Lương theo công</div>
              <div className="text-lg font-bold">{formatVNDShort(luongTheoCong)}</div>
              {luongCoBanThang > 0 && luongTheoCong !== luongCoBanThang && (
                <div className="text-[11px] opacity-70">Mức 28 công: {formatVNDShort(luongCoBanThang)}</div>
              )}
            </div>
            <div>
              <div className="text-xs opacity-70">Lương SP</div>
              <div className="text-lg font-bold text-emerald-600">{formatVNDShort(luongSP)}</div>
            </div>
            <div>
              <div className="text-xs opacity-70">BHXH (10.5%)</div>
              <div className="text-lg font-bold text-red-600">-{formatVNDShort(baoHiem)}</div>
            </div>
            <div className="bg-emerald-500/20 rounded p-1">
              <div className="text-xs opacity-70">Thực nhận</div>
              <div className="text-lg font-bold text-emerald-700">{formatVNDShort(thucNhan)}</div>
            </div>
          </div>
        </div>

        <div className="text-sm font-semibold mb-2">📋 Chi tiết lương sản phẩm ({pcNV.length} công đoạn):</div>
        {/* Desktop Table */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b" style={{ borderColor: "var(--border)" }}>
                <th className="p-2">Lệnh cắt</th>
                <th className="p-2">Công đoạn</th>
                <th className="p-2 text-right">SL</th>
                <th className="p-2 text-right">Đơn giá</th>
                <th className="p-2 text-right">Tiền</th>
                <th className="p-2 text-right">Đã TT</th>
                <th className="p-2">TT</th>
              </tr>
            </thead>
            <tbody>
              {pcNV.length === 0 ? (
                <tr><td colSpan={7} className="p-6 text-center opacity-60 text-sm">Chưa có công đoạn nào</td></tr>
              ) : pcNV.map((p) => (
                <tr key={p.id} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                  <td className="p-2 font-mono text-xs">{p.lenhCatId}</td>
                  <td className="p-2 text-xs">{p.congDoan}</td>
                  <td className="p-2 text-right text-xs">{p.soLuongGiao}</td>
                  <td className="p-2 text-right text-xs font-mono">{p.donGiaGiao.toLocaleString()}</td>
                  <td className="p-2 text-right text-xs font-mono font-semibold">{(p.donGiaGiao * p.soLuongGiao).toLocaleString()}</td>
                  <td className="p-2 text-right text-xs font-mono text-emerald-600">{p.daThanhToan.toLocaleString()}</td>
                  <td className="p-2 text-xs">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${p.trangThai === "Đã thanh toán" ? "bg-emerald-500/15 text-emerald-700" : "bg-amber-500/15 text-amber-700"}`}>
                      {p.trangThai}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-emerald-500/10 font-bold text-xs">
                <td colSpan={4} className="p-2 text-right">TỔNG</td>
                <td className="p-2 text-right">{formatVNDShort(tongCongDoan)}</td>
                <td className="p-2 text-right text-emerald-600">{formatVNDShort(daThanhToan)}</td>
                <td className="p-2"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden flex flex-col gap-2">
          {pcNV.length === 0 ? (
            <div className="p-6 text-center opacity-60 text-sm">Chưa có công đoạn nào</div>
          ) : pcNV.map((p) => (
            <div key={p.id} className="bg-slate-50 border rounded-lg p-2 text-xs">
              <div className="flex justify-between items-center mb-1">
                <div className="font-semibold text-brand-700">{p.congDoan}</div>
                <span className={`px-1.5 py-0.5 rounded text-[10px] ${p.trangThai === "Đã thanh toán" ? "bg-emerald-500/15 text-emerald-700" : "bg-amber-500/15 text-amber-700"}`}>
                  {p.trangThai}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 mb-2 font-mono">Lệnh cắt: {p.lenhCatId}</div>
              
              <div className="grid grid-cols-2 gap-2 mt-1 pt-1 border-t border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 block">Khối lượng</span>
                  <span className="font-medium">{p.soLuongGiao} x {p.donGiaGiao.toLocaleString()}đ</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Thành tiền</span>
                  <span className="font-bold text-emerald-600">{(p.donGiaGiao * p.soLuongGiao).toLocaleString()}đ</span>
                </div>
              </div>
            </div>
          ))}
          {pcNV.length > 0 && (
            <div className="mt-2 bg-emerald-500/10 border border-emerald-500/20 rounded p-2 text-xs flex justify-between font-bold">
              <span>TỔNG CỘNG</span>
              <span className="text-emerald-700">{formatVNDShort(tongCongDoan)}</span>
            </div>
          )}
        </div>
        {conNo > 0 && (
          <div className="mt-3 text-xs bg-amber-500/10 border border-amber-500/30 rounded p-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-600" />
            <span>Còn <b className="text-amber-700">{formatVNDShort(conNo)}</b> chưa thanh toán - sẽ trừ vào lương tháng sau hoặc chờ xưởng trả</span>
          </div>
        )}
      </div>
    </div>
  );
}
