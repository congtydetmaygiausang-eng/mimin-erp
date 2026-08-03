"use client";
import { useState, useMemo } from "react";
import {
  Wallet, Users, TrendingUp, Calendar, Download, FileSpreadsheet,
  ChevronRight, AlertCircle, CheckCircle2, Award, DollarSign,
  Filter, Calculator, FileText, BarChart3, Clock,
} from "lucide-react";
import { tinhBangLuongThang, tongKetBangLuong, fmtVND, type BangLuongNV } from "@/lib/bang-luong-engine";
import { REAL_NHAN_VIEN } from "@/lib/real-workflow-data";
import { CONG_NHAN_13 } from "@/lib/congnhan-13";

const BO_PHAN_INFO_LOCAL: Record<string, { name: string; icon: string; color: string }> = { cat: { name: "Cắt", icon: "X", color: "amber" }, "khuy-nut": { name: "Khuy nút", icon: "O", color: "pink" }, ui: { name: "Ủi", icon: "U", color: "cyan" }, "dong-goi": { name: "Đóng gói", icon: "D", color: "emerald" } };

export default function BangLuongAutoPage() {
  const today = new Date();
  const [thang, setThang] = useState(today.getMonth() + 1);
  const [nam, setNam] = useState(today.getFullYear());
  const [filterModule, setFilterModule] = useState<string>("");
  const [search, setSearch] = useState("");

  const bangLuong = useMemo(() => tinhBangLuongThang(thang, nam), [thang, nam]);
  const tongKet = useMemo(() => tongKetBangLuong(bangLuong), [bangLuong]);

  const filtered = useMemo(() => {
    return bangLuong.filter((bl) => {
      if (filterModule && bl.boPhan !== filterModule) return false;
      if (search && !(`${bl.maNV} ${bl.tenNV}`.toLowerCase().includes(search.toLowerCase()))) return false;
      return true;
    });
  }, [bangLuong, filterModule, search]);

  const exportCSV = () => {
    const rows = [
      ["Mã NV", "Tên NV", "Module", "Đơn giá", "SL Giao", "SL Đạt", "SL Lỗi", "SL Vượt", "Tiền công", "Phạt lỗi", "Thưởng", "Phạt trễ", "Thực nhận", "Ngày trả"],
      ...filtered.map((bl) => [
        bl.maNV, bl.tenNV, bl.boPhan, bl.donGia, bl.soLuongGiao, bl.soLuongDat, bl.soLuongLoi, bl.soLuongVuot,
        bl.tienCong, bl.phatLoi, bl.thuongVuot, bl.phatTreHan, bl.thucNhan, bl.ngayTra,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bang-luong-thang-${thang}-${nam}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-cyan-50/30 p-3 md:p-5">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white p-5 md:p-7 shadow-xl">
          <div className="text-xs font-medium opacity-90 mb-1">💰 MIMIN OS · Tính lương tự động</div>
          <h1 className="text-2xl md:text-3xl font-bold">Bảng lương tháng {thang}/{nam}</h1>
          <p className="text-sm opacity-95 mt-1 max-w-3xl">
            Tính lương tự động cho <b>13 công nhân</b> dựa trên <b>SL đạt × đơn giá</b> từ workflow thật. 
            Áp dụng: <b>Phạt lỗi 30%</b>, <b>Thưởng vượt 20%</b>, <b>Phạt trễ hạn 50K/task</b>.
          </p>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2 text-center text-xs">
            <div className="bg-white/15 backdrop-blur rounded-lg p-2"><div className="text-xl font-bold">{tongKet.tongNV}</div><div className="opacity-90">CN</div></div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-2"><div className="text-xl font-bold">{fmtVND(tongKet.tongThucNhan)}</div><div className="opacity-90">Tiền công</div></div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-2"><div className="text-xl font-bold text-rose-200">-{fmtVND(tongKet.tongPhatLoi + tongKet.tongPhatTreHan)}</div><div className="opacity-90">Phạt</div></div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-2"><div className="text-xl font-bold text-emerald-200">+{fmtVND(tongKet.tongThuongVuot)}</div><div className="opacity-90">Thưởng</div></div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-2"><div className="text-2xl font-bold text-amber-200">{fmtVND(tongKet.tongThucNhan)}</div><div className="opacity-90">Thực trả</div></div>
          </div>
        </div>

        {/* Controls */}
        <div className="card p-3 flex flex-col md:flex-row gap-2">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600">Tháng:</label>
            <select value={thang} onChange={(e) => setThang(Number(e.target.value))} className="px-2 py-1.5 text-sm border rounded">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>Tháng {m}</option>
              ))}
            </select>
            <select value={nam} onChange={(e) => setNam(Number(e.target.value))} className="px-2 py-1.5 text-sm border rounded">
              {[2024, 2025, 2026, 2027].map((y) => (<option key={y} value={y}>{y}</option>))}
            </select>
          </div>
          <input
            type="text"
            placeholder="🔍 Tìm NV..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-1.5 text-sm border rounded"
          />
          <select value={filterModule} onChange={(e) => setFilterModule(e.target.value)} className="px-2 py-1.5 text-sm border rounded">
            <option value="">-- Tất cả module --</option>
            {Object.entries(BO_PHAN_INFO_LOCAL).map(([k, v]: [string, any]) => (
              <option key={k} value={k}>{v.icon} {v.name}</option>
            ))}
          </select>
          <button onClick={exportCSV} className="text-xs px-3 py-1.5 bg-emerald-500 text-white rounded-lg flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Xuất CSV
          </button>
        </div>

        {/* Theo module */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {tongKet.theoBoPhan.map((m) => (
            <div key={m.boPhan} className="card p-3" style={{ borderLeft: `4px solid ${m.mau}` }}>
              <div className="text-[10px] text-slate-500">{m.ten}</div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold">{m.tongNV} CN</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-emerald-600">{fmtVND(m.thucNhan)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bảng lương */}
        <div className="card p-3 overflow-x-auto">
          <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            Chi tiết bảng lương {filtered.length} CN
          </h2>
          <table className="w-full text-xs">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-2 py-2 text-left">Mã NV</th>
                <th className="px-2 py-2 text-left">Tên</th>
                <th className="px-2 py-2 text-left">Module</th>
                <th className="px-2 py-2 text-right">Đơn giá</th>
                <th className="px-2 py-2 text-right">Giao</th>
                <th className="px-2 py-2 text-right">Đạt</th>
                <th className="px-2 py-2 text-right">Lỗi</th>
                <th className="px-2 py-2 text-right">Vượt</th>
                <th className="px-2 py-2 text-right">Tiền công</th>
                <th className="px-2 py-2 text-right">Phạt lỗi</th>
                <th className="px-2 py-2 text-right">Thưởng</th>
                <th className="px-2 py-2 text-right">Trễ hạn</th>
                <th className="px-2 py-2 text-right bg-amber-100">Thực nhận</th>
                <th className="px-2 py-2 text-left">Ngày trả</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((bl) => {
                const info = BO_PHAN_INFO_LOCAL[bl.boPhan];
                return (
                  <tr key={bl.maNV} className="border-b hover:bg-slate-50">
                    <td className="px-2 py-1.5 font-mono text-[10px]">{bl.maNV}</td>
                    <td className="px-2 py-1.5 font-semibold">{bl.tenNV}</td>
                    <td className="px-2 py-1.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: info?.color + "20", color: info?.color }}>
                        {info?.icon || "📦"} {info?.name || "Module"}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-right">{bl.donGia.toLocaleString("vi-VN")}đ/{bl.donVi}</td>
                    <td className="px-2 py-1.5 text-right font-semibold">{bl.soLuongGiao}</td>
                    <td className="px-2 py-1.5 text-right text-emerald-600 font-bold">{bl.soLuongDat}</td>
                    <td className="px-2 py-1.5 text-right text-rose-600">{bl.soLuongLoi > 0 ? bl.soLuongLoi : "—"}</td>
                    <td className="px-2 py-1.5 text-right text-blue-600">{bl.soLuongVuot > 0 ? `+${bl.soLuongVuot}` : "—"}</td>
                    <td className="px-2 py-1.5 text-right font-semibold">{fmtVND(bl.tienCong)}</td>
                    <td className="px-2 py-1.5 text-right text-rose-600">{bl.phatLoi > 0 ? `-${fmtVND(bl.phatLoi)}` : "—"}</td>
                    <td className="px-2 py-1.5 text-right text-emerald-600">{bl.thuongVuot > 0 ? `+${fmtVND(bl.thuongVuot)}` : "—"}</td>
                    <td className="px-2 py-1.5 text-right text-rose-600">{bl.phatTreHan > 0 ? `-${fmtVND(bl.phatTreHan)}` : "—"}</td>
                    <td className="px-2 py-1.5 text-right font-bold text-amber-700 bg-amber-50">{fmtVND(bl.thucNhan)}</td>
                    <td className="px-2 py-1.5 text-[10px] text-slate-500">{bl.ngayTra}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-200 font-bold">
              <tr>
                <td colSpan={8} className="px-2 py-2 text-right">TỔNG CỘNG ({filtered.length} CN):</td>
                <td className="px-2 py-2 text-right">{fmtVND(filtered.reduce((s, b) => s + b.tienCong, 0))}</td>
                <td className="px-2 py-2 text-right text-rose-600">-{fmtVND(filtered.reduce((s, b) => s + b.phatLoi, 0))}</td>
                <td className="px-2 py-2 text-right text-emerald-600">+{fmtVND(filtered.reduce((s, b) => s + b.thuongVuot, 0))}</td>
                <td className="px-2 py-2 text-right text-rose-600">-{fmtVND(filtered.reduce((s, b) => s + b.phatTreHan, 0))}</td>
                <td className="px-2 py-2 text-right text-amber-700 bg-amber-100">{fmtVND(filtered.reduce((s, b) => s + b.thucNhan, 0))}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Giải thích công thức */}
        <div className="card p-4 bg-amber-50 border-2 border-amber-200">
          <h3 className="font-bold text-sm text-amber-800 mb-2 flex items-center gap-2">
            <Calculator className="w-4 h-4" /> 📊 Công thức tính lương
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-slate-700">
            <div className="bg-white p-2 rounded">
              <b className="text-emerald-700">Tiền công</b> = SL Đạt × Đơn giá<br/>
              <span className="text-[10px] text-slate-500">VD: NV Ruộng đính 200 nút × 750đ = 150K</span>
            </div>
            <div className="bg-white p-2 rounded">
              <b className="text-rose-700">Phạt lỗi</b> = SL Lỗi × Đơn giá × 30%<br/>
              <span className="text-[10px] text-slate-500">VD: Lỗi 2 bộ × 1400đ × 30% = 840đ</span>
            </div>
            <div className="bg-white p-2 rounded">
              <b className="text-blue-700">Thưởng vượt</b> = SL Vượt × Đơn giá × 20%<br/>
              <span className="text-[10px] text-slate-500">VD: Vượt 5 sp × 2000đ × 20% = 2K</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
