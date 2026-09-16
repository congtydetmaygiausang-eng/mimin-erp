"use client";

/**
 * Trang Bảng Lương - MIMIN ERP
 * Tính lương tự động cho 17 NV mới (từ Excel)
 * - Lương sản phẩm: 13 CN (cắt, ủi, gấp, khuy nút)
 * - Lương cứng: 4 quản lý (Content, KH sỉ, Kế toán, Kho, Media)
 *
 * Created: 2026-08-03 by Mavis
 */

import { type ReactNode, useState, useMemo } from "react";
import {
  Calculator, Download, Users, TrendingUp, TrendingDown,
  DollarSign, Calendar, ChevronLeft, ChevronRight, Filter, FileText,
  CheckCircle2, AlertCircle, Wallet, Award, Loader2, type LucideIcon
} from "lucide-react";
import {
  tinhBangLuongThang, tongKetBangLuong, fmtVND, fmtVNDFull,
  type BangLuongNV, type TongKetBangLuong
} from "@/lib/bang-luong-engine";
import { REAL_NHAN_VIEN } from "@/lib/real-workflow-data";
import { useBangLuongData } from "@/lib/use-bang-luong";
import { NhanSuTabs } from "@/components/nhan-su-tabs";

export default function BangLuongPage() {
  const now = new Date();
  const [thang, setThang] = useState<number>(now.getMonth() + 1);
  const [nam, setNam] = useState<number>(now.getFullYear());
  const [tab, setTab] = useState<"tong-hop" | "chi-tiet" | "thanh-toan">("tong-hop");

  // Hook lấy data từ các store (workflow thật)
  const { bangLuong, tongKet, loading, allPhieuCount, source } = useBangLuongData(thang, nam);

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
    <div className="min-h-screen bg-slate-50/50 space-y-5 animate-fade-in pb-10">
      
      {/* Premium Header */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-5 md:p-7 text-white shadow-xl shadow-teal-500/20">
        {/* Background Decorative Elements */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-teal-400 opacity-20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-medium backdrop-blur-md border border-white/10 uppercase tracking-wide">
              <Calculator className="h-3.5 w-3.5" />
              <span>MIMIN ERP · Kế Toán & Mua Bán</span>
            </div>
            <h1 className="flex items-center gap-3 text-2xl md:text-3xl font-extrabold tracking-tight">
              <Wallet className="h-7 w-7 md:h-8 md:w-8 opacity-90" /> Bảng Lương
            </h1>
            <p className="text-xs md:text-sm font-medium opacity-90 max-w-lg">
              Tính lương tự động cho <span className="font-bold text-teal-100">{tongKet.tongNV} nhân sự</span>. Dữ liệu đồng bộ trực tiếp từ module Nhân Sự và các phân hệ công việc.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <div className="inline-flex items-center gap-2 rounded-lg bg-black/10 px-3 py-1.5 text-xs font-medium backdrop-blur-md border border-white/5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Nguồn: {source === "supabase" ? "Supabase (Live)" : "Thiết bị này"}
            </div>
            <button
              onClick={xuatExcel}
              className="inline-flex items-center gap-2 rounded-lg bg-white text-teal-700 px-4 py-2 text-sm font-bold shadow-md transition-all hover:bg-slate-50 focus:scale-95"
            >
              <Download className="w-4 h-4" /> Xuất Excel
            </button>
          </div>
        </div>
      </section>

      {/* Control Bar (Tabs & Filters) */}
      <section className="sticky top-4 z-20 flex flex-col xl:flex-row items-center justify-between gap-4 rounded-2xl bg-white/80 p-2.5 shadow-lg shadow-slate-200/50 backdrop-blur-xl border border-white">
        
        {/* Tabs */}
        <div className="flex w-full overflow-x-auto xl:w-auto p-1 bg-slate-100/80 rounded-xl">
          <TabButton active={tab === "tong-hop"} onClick={() => setTab("tong-hop")} icon={TrendingUp}>Tổng hợp</TabButton>
          <TabButton active={tab === "chi-tiet"} onClick={() => setTab("chi-tiet")} icon={Users}>Chi tiết</TabButton>
          <TabButton active={tab === "thanh-toan"} onClick={() => setTab("thanh-toan")} icon={Wallet}>Thanh toán</TabButton>
        </div>

        {/* Date Filter */}
        <div className="flex w-full xl:w-auto items-center justify-between xl:justify-end gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200/60">
          <button onClick={prevMonth} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition text-slate-500 hover:text-slate-900">
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-2 px-3">
            <Calendar className="w-3.5 h-3.5 text-teal-600" />
            <select
              value={thang}
              onChange={(e) => setThang(Number(e.target.value))}
              className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer text-sm"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>Tháng {m}</option>
              ))}
            </select>
            <span className="text-slate-300 font-light">/</span>
            <select
              value={nam}
              onChange={(e) => setNam(Number(e.target.value))}
              className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer text-sm"
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>Năm {y}</option>
              ))}
            </select>
          </div>

          <button onClick={nextMonth} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition text-slate-500 hover:text-slate-900">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>

        {/* Tab: Tổng hợp */}
        {tab === "tong-hop" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard
                icon={Users}
                label="Tổng Nhân Sự"
                value={`${tongKet.tongNV}`}
                sub={`${luongSP.length} SP + ${luongCung.length} Cứng`}
                color="from-blue-600 to-indigo-600 shadow-blue-500/20"
              />
              <SummaryCard
                icon={DollarSign}
                label="Tổng Thực Nhận"
                value={fmtVND(tongKet.tongThucNhan)}
                sub={`Lương cứng: ${fmtVND(tongKet.tongLuongCung)}`}
                color="from-emerald-500 to-teal-600 shadow-emerald-500/20"
              />
              <SummaryCard
                icon={TrendingUp}
                label="Thưởng Vượt"
                value={fmtVND(tongKet.tongThuongVuot)}
                sub={`+${tongKet.tongThuongVuot > 0 ? "🎉" : ""}`}
                color="from-amber-500 to-orange-500 shadow-orange-500/20"
              />
              <SummaryCard
                icon={TrendingDown}
                label="Phạt Lỗi & Trễ"
                value={fmtVND(tongKet.tongPhatLoi + tongKet.tongPhatTreHan)}
                sub={`Lỗi: ${fmtVND(tongKet.tongPhatLoi)} | Trễ: ${fmtVND(tongKet.tongPhatTreHan)}`}
                color="from-rose-500 to-pink-600 shadow-rose-500/20"
              />
            </div>

            {/* Theo bộ phận */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-slate-200/50 p-5 md:p-6 border border-white">
              <h2 className="text-lg font-extrabold text-slate-800 mb-5 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600">
                  <Award className="w-4 h-4" />
                </div>
                Phân bổ theo bộ phận
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {tongKet.theoBoPhan.map(bp => (
                  <div
                    key={bp.boPhan}
                    className="relative overflow-hidden p-4 rounded-xl bg-white shadow-sm border border-slate-100 hover:shadow-md transition-shadow group"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: bp.mau }}></div>
                    <div className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">{bp.ten}</div>
                    <div className="text-xl font-black mb-1.5 transition-transform group-hover:scale-105 origin-left" style={{ color: bp.mau }}>
                      {fmtVND(bp.thucNhan)}
                    </div>
                    <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> {bp.tongNV} nhân sự
                    </div>
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
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-slate-200/50 overflow-hidden border border-white">
            <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4 bg-white/50">
              <h2 className="font-extrabold text-lg text-slate-800 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600">
                  <Users className="w-4 h-4" />
                </div>
                Bảng lương chi tiết
              </h2>
              <div className="flex gap-2 text-xs font-semibold">
                <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">{bangLuong.length} Nhân sự</span>
                <span className="px-2.5 py-1 bg-sky-50 text-sky-600 rounded-full border border-sky-100">Lương SP: {luongSP.length}</span>
                <span className="px-2.5 py-1 bg-amber-50 text-amber-600 rounded-full border border-amber-100">Lương cứng: {luongCung.length}</span>
              </div>
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
                <tfoot className="bg-emerald-50/50 font-black border-t-2 border-emerald-100">
                  <tr>
                    <td colSpan={11} className="px-3 py-4 text-right text-emerald-900">TỔNG THỰC NHẬN:</td>
                    <td className="px-3 py-4 text-right text-emerald-600 text-lg">{fmtVNDFull(tongKet.tongThucNhan)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Thanh toán */}
        {tab === "thanh-toan" && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-slate-200/50 p-5 md:p-6 border border-white">
            <h2 className="font-extrabold text-lg text-slate-800 flex items-center gap-2 mb-5">
              <div className="p-1.5 rounded-lg bg-teal-100 text-teal-600">
                <Wallet className="w-4 h-4" />
              </div>
              Kế hoạch thanh toán
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {bangLuong.map(b => (
                <div key={b.maNV} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-shadow group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 shrink-0 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                      {b.tenNV.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm">{b.tenNV}</div>
                      <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                        <span>{b.maNV}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span className="text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">{b.boPhan}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-base text-emerald-600">{fmtVNDFull(b.thucNhan)}</div>
                    <div className="text-[11px] font-semibold text-slate-400 mt-1 flex items-center justify-end gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Ngày trả: {b.ngayTra}
                    </div>
                  </div>
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
  );
}

function SummaryCard({
  icon: Icon, label, value, sub, color
}: { icon: any; label: string; value: string; sub: string; color: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-4 md:p-5 bg-gradient-to-br ${color} text-white shadow-lg hover:-translate-y-1 transition-transform duration-300`}>
      <div className="absolute top-0 right-0 p-3 opacity-20">
        <Icon className="w-20 h-20 -mr-6 -mt-6" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold tracking-wide opacity-90 uppercase">{label}</span>
        </div>
        <div className="text-2xl md:text-3xl font-black tracking-tight mt-2">{value}</div>
        <div className="text-xs font-medium opacity-90 mt-2 bg-black/10 w-fit px-2.5 py-1 rounded border border-white/10">{sub}</div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon: LucideIcon; children: ReactNode }) {
  return <button onClick={onClick} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition md:text-sm ${active ? "bg-white text-teal-700 shadow-sm dark:bg-slate-700 dark:text-teal-300" : "opacity-65 hover:opacity-100"}`}><Icon className="h-4 w-4" />{children}</button>;
}
