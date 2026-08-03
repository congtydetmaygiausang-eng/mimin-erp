"use client";

/**
 * Trang Bảng Lương - MIMIN ERP
 * Tính lương tự động cho 17 NV mới (từ Excel)
 * - Lương sản phẩm: 13 CN (cắt, ủi, gấp, khuy nút)
 * - Lương cứng: 4 quản lý (Content, KH sỉ, Kế toán, Kho, Media)
 *
 * Created: 2026-08-03 by Mavis
 */

import { useMemo, useState } from "react";
import {
  Calculator, Download, Users, TrendingUp, TrendingDown,
  DollarSign, Calendar, ChevronLeft, ChevronRight, Filter, FileText,
  CheckCircle2, AlertCircle, Wallet, Award, Loader2
} from "lucide-react";
import {
  tinhBangLuongThang, tongKetBangLuong, fmtVND, fmtVNDFull,
  type BangLuongNV, type TongKetBangLuong
} from "@/lib/bang-luong-engine";
import { REAL_NHAN_VIEN } from "@/lib/real-workflow-data";
import { useBangLuongData } from "@/lib/use-bang-luong";

export default function BangLuongPage() {
  const now = new Date();
  const [thang, setThang] = useState<number>(now.getMonth() + 1);
  const [nam, setNam] = useState<number>(now.getFullYear());
  const [tab, setTab] = useState<"tong-hop" | "chi-tiet" | "thanh-toan">("tong-hop");

  // Hook lấy data từ các store (workflow thật)
  const { bangLuong, tongKet, loading, allPhieuCount } = useBangLuongData(thang, nam);

  // Phân loại NV
  const luongSP = bangLuong.filter(b => b.isLuongSP);
  const luongCung = bangLuong.filter(b => !b.isLuongSP);

  // Navigation tháng
  const prevMonth = () => {
    if (thang === 1) { setThang(12); setNam(nam - 1); }
    else setThang(thang - 1);
  };
  const nextMonth = () => {
    if (thang === 12) { setThang(1); setNam(nam + 1); }
    else setThang(thang + 1);
  };

  // Xuất Excel (CSV đơn giản)
  const xuatExcel = () => {
    const headers = ["Mã NV", "Tên NV", "Bộ phận", "Đơn giá", "SL Giao", "SL Đạt", "SL Lỗi", "SL Vượt", "Tiền công", "Phạt lỗi", "Thưởng vượt", "Phạt trễ", "Thực nhận", "Ngày trả"];
    const rows = bangLuong.map(b => [
      b.maNV, b.tenNV, b.boPhan, b.donGia, b.soLuongGiao, b.soLuongDat,
      b.soLuongLoi, b.soLuongVuot, b.tienCong, b.phatLoi, b.thuongVuot,
      b.phatTreHan, b.thucNhan, b.ngayTra
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bang-luong-${nam}-${String(thang).padStart(2, "0")}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/30 p-3 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white p-5 md:p-7 shadow-xl">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <div className="text-xs font-medium opacity-90 mb-1 flex items-center gap-2">
                <Calculator className="w-3.5 h-3.5" /> MIMIN ERP · Bảng lương
              </div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <Wallet className="w-7 h-7" /> Bảng Lương Tự Động
              </h1>
              <p className="text-sm opacity-95 mt-1">
                Tính lương cho {REAL_NHAN_VIEN.length} NV mới từ Excel (1 admin + 17 NV)
                {loading && <span className="ml-2 inline-flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Đang tải workflow...</span>}
                {!loading && allPhieuCount > 0 && <span className="ml-2 opacity-80">· {allPhieuCount} workflow</span>}
              </p>
            </div>
            <button
              onClick={xuatExcel}
              className="px-4 py-2 bg-white/15 hover:bg-white/25 backdrop-blur rounded-lg text-sm font-medium flex items-center gap-2 transition"
            >
              <Download className="w-4 h-4" /> Xuất CSV
            </button>
          </div>
        </div>

        {/* Filter Tháng/Năm */}
        <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
              <Calendar className="w-4 h-4 text-emerald-700" />
              <span className="font-bold text-emerald-900">
                Tháng {String(thang).padStart(2, "0")} / {nam}
              </span>
            </div>
            <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={thang}
              onChange={(e) => setThang(Number(e.target.value))}
              className="border rounded px-2 py-1"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>Tháng {m}</option>
              ))}
            </select>
            <select
              value={nam}
              onChange={(e) => setNam(Number(e.target.value))}
              className="border rounded px-2 py-1"
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>Năm {y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {[
            { id: "tong-hop", label: "Tổng hợp", icon: TrendingUp },
            { id: "chi-tiet", label: "Chi tiết", icon: Users },
            { id: "thanh-toan", label: "Thanh toán", icon: Wallet },
          ].map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition ${
                  tab === t.id
                    ? "bg-emerald-600 text-white shadow-md"
                    : "bg-white text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab: Tổng hợp */}
        {tab === "tong-hop" && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <SummaryCard
                icon={Users}
                label="Tổng NV"
                value={`${tongKet.tongNV}`}
                sub={`${luongSP.length} lương SP + ${luongCung.length} lương cứng`}
                color="from-blue-500 to-indigo-500"
              />
              <SummaryCard
                icon={DollarSign}
                label="Tổng thực nhận"
                value={fmtVND(tongKet.tongThucNhan)}
                sub={`Lương cứng: ${fmtVND(tongKet.tongLuongCung)}`}
                color="from-emerald-500 to-teal-500"
              />
              <SummaryCard
                icon={TrendingUp}
                label="Thưởng vượt"
                value={fmtVND(tongKet.tongThuongVuot)}
                sub={`+${tongKet.tongThuongVuot > 0 ? "🎉" : ""}`}
                color="from-amber-500 to-orange-500"
              />
              <SummaryCard
                icon={TrendingDown}
                label="Phạt lỗi + trễ"
                value={fmtVND(tongKet.tongPhatLoi + tongKet.tongPhatTreHan)}
                sub={`Lỗi: ${fmtVND(tongKet.tongPhatLoi)} | Trễ: ${fmtVND(tongKet.tongPhatTreHan)}`}
                color="from-rose-500 to-pink-500"
              />
            </div>

            {/* Theo bộ phận */}
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" /> Phân bổ theo bộ phận
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {tongKet.theoBoPhan.map(bp => (
                  <div
                    key={bp.boPhan}
                    className="p-3 rounded-lg border-l-4"
                    style={{ borderLeftColor: bp.mau, backgroundColor: `${bp.mau}10` }}
                  >
                    <div className="text-xs text-slate-600">{bp.ten}</div>
                    <div className="text-lg font-bold" style={{ color: bp.mau }}>
                      {fmtVND(bp.thucNhan)}
                    </div>
                    <div className="text-xs text-slate-500">{bp.tongNV} NV</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Empty state */}
            {tongKet.tongNV === 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                <AlertCircle className="w-12 h-12 mx-auto text-amber-400 mb-3" />
                <h3 className="font-bold text-slate-700 mb-1">Chưa có dữ liệu</h3>
                <p className="text-sm text-slate-500">
                  Chưa có NV nào trong bảng lương. Vui lòng kiểm tra REAL_NHAN_VIEN.
                </p>
              </div>
            )}
          </>
        )}

        {/* Tab: Chi tiết */}
        {tab === "chi-tiet" && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-bold text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" /> Bảng lương chi tiết
              </h2>
              <span className="text-xs text-slate-500">
                {bangLuong.length} NV · Lương SP: {luongSP.length} · Lương cứng: {luongCung.length}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs text-slate-600">
                  <tr>
                    <th className="px-3 py-2 text-left">Mã NV</th>
                    <th className="px-3 py-2 text-left">Tên NV</th>
                    <th className="px-3 py-2 text-left">Bộ phận</th>
                    <th className="px-3 py-2 text-right">Đơn giá</th>
                    <th className="px-3 py-2 text-right">SL Giao</th>
                    <th className="px-3 py-2 text-right">SL Đạt</th>
                    <th className="px-3 py-2 text-right">SL Lỗi</th>
                    <th className="px-3 py-2 text-right">SL Vượt</th>
                    <th className="px-3 py-2 text-right">Tiền công</th>
                    <th className="px-3 py-2 text-right">Phạt</th>
                    <th className="px-3 py-2 text-right">Thưởng</th>
                    <th className="px-3 py-2 text-right">Thực nhận</th>
                    <th className="px-3 py-2 text-left">Ngày trả</th>
                  </tr>
                </thead>
                <tbody>
                  {bangLuong.map(b => (
                    <tr key={b.maNV} className="border-t hover:bg-slate-50">
                      <td className="px-3 py-2 font-mono text-xs">{b.maNV}</td>
                      <td className="px-3 py-2 font-medium">{b.tenNV}</td>
                      <td className="px-3 py-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${b.isLuongSP ? "bg-sky-100 text-sky-700" : "bg-amber-100 text-amber-700"}`}>
                          {b.boPhan}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        {b.isLuongSP ? `${b.donGia.toLocaleString("vi-VN")}` : `${(b.luongCung / 1_000_000).toFixed(1)}tr`}
                      </td>
                      <td className="px-3 py-2 text-right">{b.soLuongGiao || "-"}</td>
                      <td className="px-3 py-2 text-right">{b.soLuongDat || "-"}</td>
                      <td className="px-3 py-2 text-right text-rose-600">{b.soLuongLoi || "-"}</td>
                      <td className="px-3 py-2 text-right text-emerald-600">{b.soLuongVuot || "-"}</td>
                      <td className="px-3 py-2 text-right">{fmtVND(b.tienCong)}</td>
                      <td className="px-3 py-2 text-right text-rose-600">{b.phatLoi > 0 ? `-${fmtVND(b.phatLoi + b.phatTreHan)}` : "-"}</td>
                      <td className="px-3 py-2 text-right text-emerald-600">{b.thuongVuot > 0 ? `+${fmtVND(b.thuongVuot)}` : "-"}</td>
                      <td className="px-3 py-2 text-right font-bold text-emerald-700">{fmtVNDFull(b.thucNhan)}</td>
                      <td className="px-3 py-2 text-xs text-slate-500">{b.ngayTra}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 font-bold">
                  <tr>
                    <td colSpan={11} className="px-3 py-2 text-right">TỔNG THỰC NHẬN:</td>
                    <td className="px-3 py-2 text-right text-emerald-700">{fmtVNDFull(tongKet.tongThucNhan)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Thanh toán */}
        {tab === "thanh-toan" && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-bold text-sm flex items-center gap-2 mb-4">
              <Wallet className="w-4 h-4 text-emerald-600" /> Kế hoạch thanh toán
            </h2>
            <div className="space-y-3">
              {bangLuong.map(b => (
                <div key={b.maNV} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{b.tenNV}</div>
                    <div className="text-xs text-slate-500">{b.maNV} · {b.boPhan}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-700">{fmtVNDFull(b.thucNhan)}</div>
                    <div className="text-xs text-slate-500">Ngày trả: {b.ngayTra}</div>
                  </div>
                  <button className="px-3 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700">
                    <CheckCircle2 className="w-3 h-3 inline mr-1" /> Đã trả
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="text-center text-xs text-slate-400 pt-2">
          Tính lương tự động dựa trên workflow + đơn giá NV • Bảng lương cứng dựa theo Excel sếp Sang 2026-08-03
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon, label, value, sub, color
}: { icon: any; label: string; value: string; sub: string; color: string }) {
  return (
    <div className={`rounded-2xl p-4 bg-gradient-to-br ${color} text-white shadow-md`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4" />
        <span className="text-xs opacity-90">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs opacity-80 mt-1">{sub}</div>
    </div>
  );
}
