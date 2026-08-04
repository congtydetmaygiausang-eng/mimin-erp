"use client";

import { useState, useMemo } from "react";
import { BarChart3, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Users, Calendar, Download, Briefcase, Building2, Award, AlertCircle, Wallet, FileText } from "lucide-react";
import { toast } from "sonner";
import { KHO_VAI, KHO_VAT_TU, NHAN_SU, formatVND, formatVNDShort } from "@/lib/data/real-data";
import { useSupabaseSync } from "@/lib/supabase/client";
import { tinhCongNo } from "@/lib/data/cong-no";
import { usePhanCong } from "@/lib/data/cong-no-store";
import { useKho } from "@/lib/data/kho-store";
import { DoanhThuChart, LoiNhuanChart, TopSanPhamChart, CongNoPieChart, TienDoChart } from "@/components/charts/Charts";

const DON_HANG_DATA = [
  { id: "DH-001", maDH: "DH-2026-001", ngayDat: "2026-07-10", khachHang: "Cty May Hà Nội", sanPham: "Bộ trụ trơn", soLuong: 500, donGia: 145000, thanhTien: 72500000, trangThai: "Đang SX" },
  { id: "DH-002", maDH: "DH-2026-002", ngayDat: "2026-07-12", khachHang: "Shop Thời Trang Sài Gòn", sanPham: "Áo Polo cao cấp", soLuong: 300, donGia: 95000, thanhTien: 28500000, trangThai: "Đang SX" },
  { id: "DH-003", maDH: "DH-2026-003", ngayDat: "2026-07-15", khachHang: "Xưởng may Minh Tâm", sanPham: "Bộ thể thao", soLuong: 200, donGia: 165000, thanhTien: 33000000, trangThai: "Đã duyệt" },
  { id: "DH-004", maDH: "DH-2026-004", ngayDat: "2026-07-18", khachHang: "Cty Dệt Phong Phú", sanPham: "Áo thun cotton", soLuong: 1000, donGia: 65000, thanhTien: 65000000, trangThai: "Mới" },
  { id: "DH-005", maDH: "DH-2026-005", ngayDat: "2026-06-15", khachHang: "Shop Thời Trang Sài Gòn", sanPham: "Bộ vest công sở", soLuong: 100, donGia: 285000, thanhTien: 28500000, trangThai: "Đã giao" },
  { id: "DH-006", maDH: "DH-2026-006", ngayDat: "2026-06-20", khachHang: "Cty May Hà Nội", sanPham: "Áo sơ mi", soLuong: 500, donGia: 85000, thanhTien: 42500000, trangThai: "Hoàn thành" },
  { id: "DH-007", maDH: "DH-2026-007", ngayDat: "2026-06-25", khachHang: "Xưởng may Hoàng Long", sanPham: "Bộ đồng phục", soLuong: 300, donGia: 155000, thanhTien: 46500000, trangThai: "Đã giao" },
  { id: "DH-008", maDH: "DH-2026-008", ngayDat: "2026-05-15", khachHang: "Cty May Việt Hưng", sanPham: "Áo khoác", soLuong: 200, donGia: 145000, thanhTien: 29000000, trangThai: "Hủy" },
];

export default function BaoCaoPage() {
  const { data: khachHangs } = useSupabaseSync<any>("mimin_khach_hang", "khach_hang");
  const { phanCong } = usePhanCong();
  const { giaoDich, danhSachTrangThai } = useKho();
  const [kyBaoCao, setKyBaoCao] = useState("Tháng này");
  const [tab, setTab] = useState<"tongquan" | "doanhthu" | "chiphi" | "loinhuan" | "thang">("tongquan");

  // ===== Tính toán KPIs =====
  // Doanh thu: tổng tiền đơn hàng (trừ đơn hủy)
  const tongDoanhThu = DON_HANG_DATA.filter((d) => d.trangThai !== "Hủy").reduce((s, d) => s + d.thanhTien, 0);
  const doanhThuThangNay = DON_HANG_DATA.filter((d) => d.ngayDat.startsWith("2026-07") && d.trangThai !== "Hủy").reduce((s, d) => s + d.thanhTien, 0);

  // Chi phí:
  // - NV: lương cứng tháng
  // - Gia công: PHAN_CONG đã trả
  // - Nguyên vật liệu: giao dịch NHAP
  const luongNV = NHAN_SU.reduce((s, n) => s + 8500000, 0);  // Ước tính
  const cpGiaCong = phanCong.reduce((s: number, p: any) => s + p.daThanhToan, 0);
  const cpNVL = giaoDich.filter((g) => g.loai === "NHAP").reduce((s, g) => s + g.thanhTien, 0);
  const tongChiPhi = luongNV + cpGiaCong + cpNVL;
  const loiNhuan = tongDoanhThu - tongChiPhi;
  const margin = tongDoanhThu > 0 ? (loiNhuan / tongDoanhThu) * 100 : 0;

  // Tồn kho
  const tonKhoVai = danhSachTrangThai("vai").reduce((s, t) => s + t.giaTriTon, 0);
  const tonKhoPL = danhSachTrangThai("phu-lieu").reduce((s, t) => s + t.giaTriTon, 0);
  const tongTonKho = tonKhoVai + tonKhoPL;

  // Công nợ
  const congNo = tinhCongNo(phanCong);

  // Top KH
  const topKH = useMemo(() => {
    const map: Record<string, { ten: string; doanhThu: number; soDon: number }> = {};
    for (const d of DON_HANG_DATA) {
      if (d.trangThai === "Hủy") continue;
      if (!map[d.khachHang]) map[d.khachHang] = { ten: d.khachHang, doanhThu: 0, soDon: 0 };
      map[d.khachHang].doanhThu += d.thanhTien;
      map[d.khachHang].soDon += 1;
    }
    return Object.values(map).sort((a, b) => b.doanhThu - a.doanhThu);
  }, []);

  // Top sản phẩm
  const topSP = useMemo(() => {
    const map: Record<string, { ten: string; doanhThu: number; soLuong: number }> = {};
    for (const d of DON_HANG_DATA) {
      if (d.trangThai === "Hủy") continue;
      if (!map[d.sanPham]) map[d.sanPham] = { ten: d.sanPham, doanhThu: 0, soLuong: 0 };
      map[d.sanPham].doanhThu += d.thanhTien;
      map[d.sanPham].soLuong += d.soLuong;
    }
    return Object.values(map).sort((a, b) => b.doanhThu - a.doanhThu);
  }, []);

  // Công nợ theo người
  const congNoData = useMemo(() => {
    const map: Record<string, { name: string; value: number }> = {};
    for (const pc of phanCong) {
      const conNo = pc.donGiaGiao * pc.soLuongGiao - pc.daThanhToan;
      if (conNo <= 0) continue;
      const key = pc.nguoiPhuTrach.ma;
      if (!map[key]) map[key] = { name: pc.nguoiPhuTrach.ten.split(" (")[0].split(" - ")[0], value: 0 };
      map[key].value += conNo;
    }
    return Object.values(map).sort((a, b) => b.value - a.value);
  }, []);

  // Doanh thu theo tháng (6 tháng gần nhất)
  const doanhThuThang = [
    { thang: "T2/2026", dt: 120000000, cp: 85000000 },
    { thang: "T3/2026", dt: 145000000, cp: 95000000 },
    { thang: "T4/2026", dt: 98000000, cp: 72000000 },
    { thang: "T5/2026", dt: 178000000, cp: 115000000 },
    { thang: "T6/2026", dt: 146500000, cp: 102000000 },
    { thang: "T7/2026", dt: doanhThuThangNay, cp: Math.round(tongChiPhi * 0.3) },
  ];
  const maxDT = Math.max(...doanhThuThang.map((d) => d.dt));

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-brand-500" />
            Báo cáo & Thống kê
          </h1>
          <p className="opacity-70 mt-1 text-sm">Dashboard tổng hợp doanh thu, chi phí, lợi nhuận xưởng</p>
        </div>
        <button
          onClick={() => toast.info("Tính năng xuất báo cáo Excel đang phát triển")}
          className="btn-secondary flex items-center gap-2"
        >
          <Download className="w-4 h-4" /> Xuất Excel
        </button>
      </div>

      {/* KPI tổng */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="text-xs opacity-70 flex items-center gap-1"><DollarSign className="w-3 h-3 text-emerald-600" /> Tổng doanh thu</div>
          <div className="text-xl md:text-2xl font-bold mt-1 text-emerald-600">{formatVNDShort(tongDoanhThu)}</div>
          <div className="text-xs opacity-60 mt-1">{formatVND(tongDoanhThu)}</div>
        </div>
        <div className="card p-5">
          <div className="text-xs opacity-70 flex items-center gap-1"><TrendingDown className="w-3 h-3 text-red-600" /> Tổng chi phí</div>
          <div className="text-xl md:text-2xl font-bold mt-1 text-red-600">{formatVNDShort(tongChiPhi)}</div>
          <div className="text-xs opacity-60 mt-1">{formatVND(tongChiPhi)}</div>
        </div>
        <div className={`card p-5 ${loiNhuan > 0 ? "bg-emerald-500/10 border-emerald-500/30" : "bg-red-500/10 border-red-500/30"}`}>
          <div className="text-xs opacity-70 flex items-center gap-1">
            {loiNhuan > 0 ? <TrendingUp className="w-3 h-3 text-emerald-600" /> : <TrendingDown className="w-3 h-3 text-red-600" />}
            Lợi nhuận gộp
          </div>
          <div className={`text-xl md:text-2xl font-bold mt-1 ${loiNhuan > 0 ? "text-emerald-600" : "text-red-600"}`}>
            {formatVNDShort(loiNhuan)}
          </div>
          <div className="text-xs opacity-60 mt-1">Margin: {margin.toFixed(1)}%</div>
        </div>
        <div className="card p-5">
          <div className="text-xs opacity-70 flex items-center gap-1"><Users className="w-3 h-3 text-blue-600" /> Khách hàng</div>
          <div className="text-xl md:text-2xl font-bold mt-1 text-blue-600">{khachHangs?.length || 0}</div>
          <div className="text-xs opacity-60 mt-1">Đã đồng bộ</div>
        </div>
        <div className="card p-5">
          <div className="text-xs opacity-70 flex items-center gap-1"><Package className="w-3 h-3 text-violet-600" /> Tồn kho</div>
          <div className="text-xl md:text-2xl font-bold mt-1 text-violet-600">{formatVNDShort(tongTonKho)}</div>
          <div className="text-xs opacity-60 mt-1">{KHO_VAI.length + KHO_VAT_TU.length} mã</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card p-1.5 inline-flex flex-wrap">
        {([
          { id: "tongquan" as const, label: "Tổng quan" },
          { id: "doanhthu" as const, label: "Doanh thu" },
          { id: "chiphi" as const, label: "Chi phí" },
          { id: "loinhuan" as const, label: "Lợi nhuận" },
          { id: "thang" as const, label: "Theo tháng" },
        ]).map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t.id ? "bg-brand-500 text-white shadow" : "hover:bg-white/40 dark:hover:bg-white/5"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "tongquan" && (
        <>
          {/* Biểu đồ doanh thu 6 tháng */}
          <div className="card p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Doanh thu & Chi phí 6 tháng
            </h3>
            <DoanhThuChart data={doanhThuThang.map(d => ({ thang: d.thang, doanhThu: d.dt, chiPhi: d.cp }))} />
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="card p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Xu hướng lợi nhuận
              </h3>
              <LoiNhuanChart data={doanhThuThang.map(d => ({ thang: d.thang, loiNhuan: d.dt - d.cp, doanhThu: d.dt }))} />
            </div>
            <div className="card p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-violet-600" />
                Phân bổ công nợ theo người
              </h3>
              <CongNoPieChart data={congNoData.slice(0, 5)} />
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* Top KH */}
            <div className="card p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                Top khách hàng
              </h3>
              <div className="space-y-2">
                {topKH.slice(0, 5).map((k, i) => (
                  <div key={k.ten} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${i === 0 ? "bg-amber-500" : i === 1 ? "bg-slate-400" : i === 2 ? "bg-amber-700" : "bg-slate-300"}`}>{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{k.ten}</div>
                      <div className="text-[10px] opacity-60">{k.soDon} đơn</div>
                    </div>
                    <div className="text-sm font-semibold text-emerald-600">{formatVNDShort(k.doanhThu)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top SP chart */}
            <div className="card p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-sky-600" />
                Top sản phẩm theo doanh thu
              </h3>
              <TopSanPhamChart data={topSP.map(s => ({ ten: s.ten, doanhThu: s.doanhThu, soLuong: s.soLuong }))} />
            </div>
          </div>
        </>
      )}

      {tab === "doanhthu" && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
            <h3 className="font-semibold flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-600" /> Doanh thu từ đơn hàng ({DON_HANG_DATA.filter(d => d.trangThai !== "Hủy").length} đơn)</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b" style={{ borderColor: "var(--border)" }}>
                <th className="p-3">Mã ĐH</th>
                <th className="p-3">Ngày</th>
                <th className="p-3">Khách hàng</th>
                <th className="p-3">Sản phẩm</th>
                <th className="p-3 text-right">SL</th>
                <th className="p-3 text-right">Đơn giá</th>
                <th className="p-3 text-right">Doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {DON_HANG_DATA.filter(d => d.trangThai !== "Hủy").map((d) => (
                <tr key={d.id} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                  <td className="p-3 font-mono text-xs">{d.maDH}</td>
                  <td className="p-3 text-xs">{d.ngayDat}</td>
                  <td className="p-3">{d.khachHang}</td>
                  <td className="p-3">{d.sanPham}</td>
                  <td className="p-3 text-right font-mono">{d.soLuong}</td>
                  <td className="p-3 text-right font-mono">{d.donGia.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono font-semibold text-emerald-600">{formatVNDShort(d.thanhTien)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-emerald-500/10 font-bold text-xs">
                <td colSpan={6} className="p-3 text-right">TỔNG DOANH THU</td>
                <td className="p-3 text-right text-emerald-600">{formatVNDShort(tongDoanhThu)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {tab === "chiphi" && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="card p-5">
            <div className="text-xs opacity-70 flex items-center gap-1"><Users className="w-3 h-3" /> Lương nhân viên</div>
            <div className="text-2xl font-bold mt-1">{formatVNDShort(luongNV)}</div>
            <div className="text-xs opacity-60 mt-1">{NHAN_SU.length} NV × ~8.5tr/tháng</div>
          </div>
          <div className="card p-5">
            <div className="text-xs opacity-70 flex items-center gap-1"><Briefcase className="w-3 h-3" /> Gia công ngoài</div>
            <div className="text-2xl font-bold mt-1">{formatVNDShort(cpGiaCong)}</div>
            <div className="text-xs opacity-60 mt-1">{congNo.tongDaThanhToan.toLocaleString()}đ đã trả</div>
          </div>
          <div className="card p-5">
            <div className="text-xs opacity-70 flex items-center gap-1"><Package className="w-3 h-3" /> Nguyên vật liệu</div>
            <div className="text-2xl font-bold mt-1">{formatVNDShort(cpNVL)}</div>
            <div className="text-xs opacity-60 mt-1">{giaoDich.filter((g) => g.loai === "NHAP").length} lần nhập</div>
          </div>
          <div className="md:col-span-3 card p-5 bg-red-500/5 border-red-500/30">
            <div className="text-sm font-semibold mb-2 text-red-700 dark:text-red-400">Tổng chi phí ước tính</div>
            <div className="text-3xl font-bold text-red-600">{formatVND(tongChiPhi)}</div>
            <div className="text-xs opacity-60 mt-1">Bao gồm: Lương NV + Gia công + NVL</div>
          </div>
        </div>
      )}

      {tab === "loinhuan" && (
        <div className="card p-5 space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <div className="text-xs opacity-70">Doanh thu</div>
              <div className="text-2xl font-bold text-emerald-600">{formatVNDShort(tongDoanhThu)}</div>
            </div>
            <div>
              <div className="text-xs opacity-70">Chi phí</div>
              <div className="text-2xl font-bold text-red-600">-{formatVNDShort(tongChiPhi)}</div>
            </div>
            <div>
              <div className="text-xs opacity-70">Lợi nhuận</div>
              <div className={`text-2xl font-bold ${loiNhuan > 0 ? "text-emerald-600" : "text-red-600"}`}>{formatVNDShort(loiNhuan)}</div>
            </div>
          </div>
          <div className="bg-emerald-500/10 rounded p-3 text-sm">
            <div className="font-semibold mb-1">📊 Phân tích:</div>
            <ul className="text-xs space-y-1 opacity-90">
              <li>• Margin lợi nhuận: <b className={margin > 20 ? "text-emerald-600" : margin > 10 ? "text-amber-600" : "text-red-600"}>{margin.toFixed(1)}%</b> {margin > 20 ? "(Tốt)" : margin > 10 ? "(Trung bình)" : "(Cần cải thiện)"}</li>
              <li>• Chi phí lương chiếm: <b>{((luongNV / tongChiPhi) * 100).toFixed(1)}%</b> tổng CP</li>
              <li>• Chi phí NVL chiếm: <b>{((cpNVL / tongChiPhi) * 100).toFixed(1)}%</b> tổng CP</li>
              <li>• Chi phí gia công chiếm: <b>{((cpGiaCong / tongChiPhi) * 100).toFixed(1)}%</b> tổng CP</li>
            </ul>
          </div>
        </div>
      )}

      {tab === "thang" && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
            <h3 className="font-semibold flex items-center gap-2"><Calendar className="w-4 h-4 text-brand-500" /> Doanh thu & Chi phí 6 tháng gần nhất</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b" style={{ borderColor: "var(--border)" }}>
                <th className="p-3">Tháng</th>
                <th className="p-3 text-right">Doanh thu</th>
                <th className="p-3 text-right">Chi phí</th>
                <th className="p-3 text-right">Lợi nhuận</th>
                <th className="p-3 text-right">Margin</th>
                <th className="p-3">Visual</th>
              </tr>
            </thead>
            <tbody>
              {doanhThuThang.map((d) => {
                const ln = d.dt - d.cp;
                const m = d.dt > 0 ? (ln / d.dt) * 100 : 0;
                return (
                  <tr key={d.thang} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                    <td className="p-3 font-semibold">{d.thang}</td>
                    <td className="p-3 text-right font-mono text-emerald-600">{formatVNDShort(d.dt)}</td>
                    <td className="p-3 text-right font-mono text-red-600">{formatVNDShort(d.cp)}</td>
                    <td className={`p-3 text-right font-mono font-bold ${ln > 0 ? "text-emerald-600" : "text-red-600"}`}>{formatVNDShort(ln)}</td>
                    <td className={`p-3 text-right font-bold ${m > 20 ? "text-emerald-600" : m > 10 ? "text-amber-600" : "text-red-600"}`}>{m.toFixed(1)}%</td>
                    <td className="p-3 w-32">
                      <div className="h-2 bg-slate-200/40 dark:bg-slate-700/40 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${Math.max(0, Math.min(100, m))}%` }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
