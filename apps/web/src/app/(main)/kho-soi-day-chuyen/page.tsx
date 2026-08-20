"use client";

import { useState, useEffect } from "react";
import {
  Package, Truck, Palette, Boxes, Plus, Calculator, ArrowRight,
  CheckCircle2, AlertCircle, ChevronRight, FileText
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/components/session-provider";
import {
  getNhapSoi, getGiaCongDet, getGiaCongNhuom, getNhapKhoTP,
  saveNhapSoi, saveGiaCongDet, saveGiaCongNhuom, saveNhapKhoTP,
  nhapKhoSoi, giaoSoiChoXuong, nghiemThuDet, giaoMocChoXuong, nghiemThuNhuom,
  tinhGiaVonVai, KHU_KHO,
  type NhapSoi, type GiaCongDet, type GiaCongNhuom, type NhapKhoVaiTP
} from "@/lib/yarn-warehouse";
import { formatVNDShort } from "@/lib/data/real-data";
import { useMemo } from "react";

type Tab = "nhapsoi" | "det" | "nhuom" | "nhapkho" | "tonghop";

export default function KhoSoiDayChuyenPage() {
  const { user } = useSession();
  const [tab, setTab] = useState<Tab>("tonghop");
  const [sois, setSois] = useState<NhapSoi[]>([]);
  const [dets, setDets] = useState<GiaCongDet[]>([]);
  const [nhuoms, setNhuoms] = useState<GiaCongNhuom[]>([]);
  const [nhapKhos, setNhapKhos] = useState<NhapKhoVaiTP[]>([]);

  useEffect(() => { refresh(); }, []);
  const refresh = () => {
    setSois(getNhapSoi());
    setDets(getGiaCongDet());
    setNhuoms(getGiaCongNhuom());
    setNhapKhos(getNhapKhoTP());
  };

  // ============ FORM 1: NHẬP KHO SỢI ============
  const [ncc, setNcc] = useState("Cty Sợi Việt Nam");
  const [loaiSoi, setLoaiSoi] = useState("SOI-COTTON-30");
  const [tenSoi, setTenSoi] = useState("Sợi cotton 30s");
  const [maSoi, setMaSoi] = useState("");
  const [soKg, setSoKg] = useState(0);
  const [donGia, setDonGia] = useState(0);
  const [ngayNhap, setNgayNhap] = useState(new Date().toISOString().slice(0, 10));
  const [ghiChuNS, setGhiChuNS] = useState("");

  const thanhTienNS = soKg * donGia;

  // ============ FORM 2: GIA CÔNG DỆT ============
  const [donViDet, setDonViDet] = useState("DNT Dệt Bắc Ninh");
  const [loSoiXuat, setLoSoiXuat] = useState("");
  const [soKgXuat, setSoKgXuat] = useState(0);
  const [donGiaDet, setDonGiaDet] = useState(8000);
  const [ngayGiao, setNgayGiao] = useState(new Date().toISOString().slice(0, 10));

  const tienDet = soKgXuat * donGiaDet;

  // ============ FORM 3: GIA CÔNG NHUỘM ============
  const [donViNhuom, setDonViNhuom] = useState("Cty Nhuộm Hà Đông");
  const [mau, setMau] = useState("Trắng ngà");
  const [soKgNhuom, setSoKgNhuom] = useState(0);
  const [donGiaNhuom, setDonGiaNhuom] = useState(8500);
  const [tienHoaChat, setTienHoaChat] = useState(500000);
  const [ngayGiaoMoc, setNgayGiaoMoc] = useState(new Date().toISOString().slice(0, 10));

  const tienNhuom = soKgNhuom * donGiaNhuom;
  const tongCongNhuom = tienNhuom + tienHoaChat;

  // ============ FORM 4: NHẬP KHO VẢI TP ============
  const [loaiVaiNhap, setLoaiVaiNhap] = useState("Vải thun cotton 4 chiều");
  const [mauNhap, setMauNhap] = useState("Trắng ngà");
  const [soKgNhap, setSoKgNhap] = useState(0);
  const [kgPerCay, setKgPerCay] = useState(20);
  const [kho, setKho] = useState("Kho Vải TP");
  const [khu, setKhu] = useState("Khu A");
  const [ke, setKe] = useState("A03");

  const soCay = Math.floor(soKgNhap / kgPerCay);
  const kgLe = soKgNhap % kgPerCay;

  // ============ HANDLERS ============
  const handleNhapSoi = () => {
    if (!ncc || !tenSoi || soKg <= 0 || donGia <= 0) {
      toast.error("Vui lòng điền đầy đủ");
      return;
    }
    const r = nhapKhoSoi({
      ngayNhap, nhaCungCap: ncc, tenNCC: ncc,
      loaiSoi, tenSoi, maSoi: maSoi || `MS-${Date.now().toString().slice(-6)}`,
      donVi: "Kg" as const, soKg, donGia,
      daTra: 0, trangThai: "Chưa trả" as const,
      ghiChu: ghiChuNS,
    }, user);
    if (r.ok) {
      toast.success(r.message);
      refresh();
      setSoKg(0); setDonGia(0);
    }
  };

  const handleGiaoSoi = () => {
    if (!loSoiXuat || soKgXuat <= 0) {
      toast.error("Chọn lô sợi và nhập kg");
      return;
    }
    const r = giaoSoiChoXuong({
      ngayGiao, donViDet, tenDonVi: donViDet,
      maLoSoi: loSoiXuat, loaiSoi: "",
      soKgXuat, donGiaDet, ghiChu: "",
    }, user);
    if (r.ok) {
      toast.success(r.message);
      refresh();
      setSoKgXuat(0);
    }
  };

  const handleNhuom = () => {
    if (soKgNhuom <= 0) {
      toast.error("Nhập số kg");
      return;
    }
    const r = giaoMocChoXuong({
      ngayGiao: ngayGiaoMoc, donViNhuom, tenDonVi: donViNhuom,
      maLoMoc: "", loaiVai: loaiVaiNhap, mau,
      soKgNhuom, donGiaNhuom, tienHoaChat, ghiChu: "",
    }, user);
    if (r.ok) {
      toast.success(r.message);
      refresh();
    }
  };

  // Tổng hợp
  const tongTienSoi = sois.reduce((s, n) => s + n.thanhTien, 0);
  const congNoNCC = sois.reduce((s, n) => s + (n.congNo - n.daTra), 0);
  const tongTienDet = dets.reduce((s, d) => s + d.tienDet, 0);
  const tongTienNhuom = nhuoms.reduce((s, n) => s + n.tongCong, 0);
  const tongKgVaiTP = nhapKhos.reduce((s, n) => s + n.soKg, 0);
  const tongGiaTriVaiTP = nhapKhos.reduce((s, n) => s + n.tongGiaTri, 0);
  const giaVonTB = tongKgVaiTP > 0 ? tongGiaTriVaiTP / tongKgVaiTP : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Boxes className="w-7 h-7 text-blue-500" /> Kho Sợi - Dệt - Nhuộm (Chuẩn ERP)
        </h1>
        <p className="opacity-70 text-sm">
          Quy trình: Nhập sợi → Xuất dệt → Nghiệm thu mộc → Xuất nhuộm → Nghiệm thu TP → Nhập kho vải
        </p>
      </div>

      {/* Stats tổng */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat icon={<Package className="w-4 h-4" />} label="Sợi nhập" value={formatVNDShort(tongTienSoi)} sub={`${sois.length} phiếu`} color="blue" />
        <Stat icon={<Truck className="w-4 h-4" />} label="Phí dệt" value={formatVNDShort(tongTienDet)} sub={`${dets.length} phiếu`} color="violet" />
        <Stat icon={<Palette className="w-4 h-4" />} label="Phí nhuộm" value={formatVNDShort(tongTienNhuom)} sub={`${nhuoms.length} phiếu`} color="rose" />
        <Stat icon={<Boxes className="w-4 h-4" />} label="Vải TP" value={`${tongKgVaiTP.toLocaleString()}kg`} sub={`${nhapKhos.length} phiếu`} color="emerald" />
        <Stat icon={<Calculator className="w-4 h-4" />} label="Giá vốn TB" value={`${giaVonTB.toFixed(0)}đ/kg`} sub="trung bình" color="amber" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-fit overflow-x-auto">
        {[
          { key: "tonghop", label: "Tổng hợp", icon: <FileText className="w-3.5 h-3.5" /> },
          { key: "nhapsoi", label: "1. Nhập sợi", icon: <Package className="w-3.5 h-3.5" /> },
          { key: "det", label: "2. Dệt", icon: <Truck className="w-3.5 h-3.5" /> },
          { key: "nhuom", label: "3. Nhuộm", icon: <Palette className="w-3.5 h-3.5" /> },
          { key: "nhapkho", label: "4. Nhập kho vải", icon: <Boxes className="w-3.5 h-3.5" /> },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as Tab)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 whitespace-nowrap ${
              tab === t.key ? "bg-white dark:bg-slate-700 shadow" : "opacity-60"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ===== TỔNG HỢP ===== */}
      {tab === "tonghop" && (
        <div className="card p-4 space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" /> Tổng hợp luồng dữ liệu
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded bg-blue-50 dark:bg-blue-900/20">
              <div className="font-semibold mb-1">📦 Phiếu nhập sợi ({sois.length})</div>
              {sois.slice(0, 3).map((n) => (
                <div key={n.id} className="text-xs opacity-80">
                  {n.id} - {n.tenSoi} - {n.soKg}kg - {(n.thanhTien / 1_000_000).toFixed(1)}tr
                </div>
              ))}
            </div>
            <div className="p-3 rounded bg-violet-50 dark:bg-violet-900/20">
              <div className="font-semibold mb-1">🚛 Phiếu dệt ({dets.length})</div>
              {dets.slice(0, 3).map((d) => (
                <div key={d.id} className="text-xs opacity-80">
                  {d.id} - {d.tenDonVi} - {d.soKgXuat}kg → {d.soKgMocNhan || "?"}kg ({d.haoHutPt?.toFixed(1) || "?"}%)
                </div>
              ))}
            </div>
            <div className="p-3 rounded bg-rose-50 dark:bg-rose-900/20">
              <div className="font-semibold mb-1">🎨 Phiếu nhuộm ({nhuoms.length})</div>
              {nhuoms.slice(0, 3).map((n) => (
                <div key={n.id} className="text-xs opacity-80">
                  {n.id} - {n.mau} - {n.soKgNhuom}kg → {n.soKgThanhPham || "?"}kg
                </div>
              ))}
            </div>
            <div className="p-3 rounded bg-emerald-50 dark:bg-emerald-900/20">
              <div className="font-semibold mb-1">📦 Phiếu nhập kho TP ({nhapKhos.length})</div>
              {nhapKhos.slice(0, 3).map((k) => (
                <div key={k.id} className="text-xs opacity-80">
                  {k.id} - {k.tenVai} - {k.soKg}kg - {k.giaVonPerKg.toFixed(0)}đ/kg - {k.khu}/{k.ke}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== FORM 1: NHẬP KHO SỢI ===== */}
      {tab === "nhapsoi" && (
        <div className="card p-4 space-y-3">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-500" /> 1. Nhập kho sợi
          </h3>
          <p className="text-xs opacity-70">Tăng kho sợi + Tăng công nợ NCC tự động</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="NCC" value={ncc} onChange={setNcc} />
            <Field label="Loại sợi" value={loaiSoi} onChange={setLoaiSoi} />
            <Field label="Tên sợi" value={tenSoi} onChange={setTenSoi} />
            <Field label="Mã sợi (tự tạo nếu trống)" value={maSoi} onChange={setMaSoi} />
            <Field label="Số kg" value={soKg} onChange={setSoKg} type="number" />
            <Field label="Đơn giá (VNĐ/kg)" value={donGia} onChange={setDonGia} type="number" />
            <Field label="Ngày nhập" value={ngayNhap} onChange={setNgayNhap} type="date" />
            <Field label="Ghi chú" value={ghiChuNS} onChange={setGhiChuNS} />
          </div>

          <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-500/30">
            <div className="text-xs opacity-70 mb-1">Công thức: Thành tiền = Kg × Đơn giá</div>
            <div className="flex items-center gap-2 text-lg font-bold">
              <span>{soKg.toLocaleString()} kg</span>
              <span>×</span>
              <span>{donGia.toLocaleString()}đ</span>
              <ChevronRight className="w-4 h-4" />
              <span className="text-emerald-600">{thanhTienNS.toLocaleString()}đ</span>
            </div>
          </div>

          <button onClick={handleNhapSoi} className="btn-primary w-full py-3 text-base">
            ✅ Lưu phiếu nhập + Tăng kho + Công nợ
          </button>

          {/* Bảng lịch sử */}
          <div className="mt-4">
            <h4 className="font-semibold mb-2 text-sm">📋 Phiếu nhập sợi ({sois.length})</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 dark:bg-slate-800">
                  <tr>
                    <th className="p-2 text-left">Mã phiếu</th>
                    <th className="p-2 text-left">Sợi</th>
                    <th className="p-2 text-right">Kg</th>
                    <th className="p-2 text-right">Đơn giá</th>
                    <th className="p-2 text-right">Thành tiền</th>
                    <th className="p-2 text-right">Còn nợ</th>
                  </tr>
                </thead>
                <tbody>
                  {sois.map((n) => (
                    <tr key={n.id} className="border-t border-slate-200 dark:border-slate-700">
                      <td className="p-2 font-mono text-xs">{n.id}</td>
                      <td className="p-2 text-xs">{n.tenSoi}</td>
                      <td className="p-2 text-right">{n.soKg}</td>
                      <td className="p-2 text-right text-xs">{n.donGia.toLocaleString()}</td>
                      <td className="p-2 text-right font-semibold">{(n.thanhTien / 1_000_000).toFixed(2)}tr</td>
                      <td className="p-2 text-right text-rose-600">{((n.congNo - n.daTra) / 1_000_000).toFixed(2)}tr</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===== FORM 2: GIA CÔNG DỆT ===== */}
      {tab === "det" && (
        <div className="card p-4 space-y-3">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Truck className="w-5 h-5 text-violet-500" /> 2. Gia công dệt (Xuất sợi)
          </h3>
          <p className="text-xs opacity-70">Xuất sợi cho xưởng dệt → Khi nghiệm thu nhập mộc về</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Xưởng dệt" value={donViDet} onChange={setDonViDet} />
            <Field label="Lô sợi xuất" value={loSoiXuat} onChange={setLoSoiXuat} placeholder="LSOI-001" />
            <Field label="Số kg sợi xuất" value={soKgXuat} onChange={setSoKgXuat} type="number" />
            <Field label="Đơn giá dệt (VNĐ/kg)" value={donGiaDet} onChange={setDonGiaDet} type="number" />
            <Field label="Ngày giao" value={ngayGiao} onChange={setNgayGiao} type="date" />
          </div>

          <div className="p-4 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-500/30">
            <div className="text-xs opacity-70 mb-1">Công thức: Tiền dệt = Kg × Đơn giá dệt</div>
            <div className="flex items-center gap-2 text-lg font-bold">
              <span>{soKgXuat} kg</span>
              <span>×</span>
              <span>{donGiaDet.toLocaleString()}đ</span>
              <ChevronRight className="w-4 h-4" />
              <span className="text-violet-600">{tienDet.toLocaleString()}đ</span>
            </div>
          </div>

          <button onClick={handleGiaoSoi} className="btn-primary w-full py-3 text-base bg-violet-500 hover:bg-violet-600">
            🚛 Giao sợi cho xưởng dệt
          </button>

          {/* Nghiệm thu dệt */}
          <div className="mt-4 p-3 rounded bg-slate-50 dark:bg-slate-800/30">
            <h4 className="font-semibold mb-2 text-sm">📦 Nghiệm thu vải mộc</h4>
            <div className="flex flex-wrap gap-2">
              {dets.filter((d) => d.trangThai === "Đã giao sợi" || d.trangThai === "Đang dệt").map((d) => (
                <button
                  key={d.id}
                  onClick={() => {
                    const kg = parseInt(prompt(`Nhập kg mộc thực nhận cho ${d.id} (đã giao ${d.soKgXuat}kg):`, String(Math.floor(d.soKgXuat * 0.9))) || "0");
                    if (kg > 0) {
                      const r = nghiemThuDet(d.id, kg, user);
                      if (r.ok) {
                        toast.success(r.message);
                        refresh();
                      } else toast.error(r.message);
                    }
                  }}
                  className="text-xs px-2 py-1 rounded bg-violet-500 text-white"
                >
                  Nghiệm thu {d.id}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <h4 className="font-semibold mb-2 text-sm">📋 Phiếu dệt ({dets.length})</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 dark:bg-slate-800">
                  <tr>
                    <th className="p-2 text-left">Mã</th>
                    <th className="p-2 text-left">Xưởng</th>
                    <th className="p-2 text-right">Kg sợi</th>
                    <th className="p-2 text-right">Kg mộc</th>
                    <th className="p-2 text-right">Hao hụt</th>
                    <th className="p-2 text-right">Tiền dệt</th>
                    <th className="p-2 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {dets.map((d) => (
                    <tr key={d.id} className="border-t border-slate-200 dark:border-slate-700">
                      <td className="p-2 font-mono text-xs">{d.id}</td>
                      <td className="p-2 text-xs">{d.tenDonVi}</td>
                      <td className="p-2 text-right">{d.soKgXuat}</td>
                      <td className="p-2 text-right">{d.soKgMocNhan || "-"}</td>
                      <td className="p-2 text-right text-rose-600">
                        {d.haoHutPt ? `${d.haoHutPt.toFixed(1)}%` : "-"}
                      </td>
                      <td className="p-2 text-right">{(d.tienDet / 1_000_000).toFixed(2)}tr</td>
                      <td className="p-2 text-center text-xs">
                        <span className={`px-1.5 py-0.5 rounded text-white ${d.trangThai === "Đã nghiệm thu" ? "bg-emerald-500" : "bg-blue-500"}`}>
                          {d.trangThai}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===== FORM 3: GIA CÔNG NHUỘM ===== */}
      {tab === "nhuom" && (
        <div className="card p-4 space-y-3">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Palette className="w-5 h-5 text-rose-500" /> 3. Gia công nhuộm
          </h3>
          <p className="text-xs opacity-70">Xuất mộc → Nhuộm → Nghiệm thu + Tính giá vốn vải</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Xưởng nhuộm" value={donViNhuom} onChange={setDonViNhuom} />
            <Field label="Màu nhuộm" value={mau} onChange={setMau} />
            <Field label="Số kg mộc" value={soKgNhuom} onChange={setSoKgNhuom} type="number" />
            <Field label="Đơn giá nhuộm (VNĐ/kg)" value={donGiaNhuom} onChange={setDonGiaNhuom} type="number" />
            <Field label="Tiền hóa chất" value={tienHoaChat} onChange={setTienHoaChat} type="number" />
            <Field label="Ngày giao mộc" value={ngayGiaoMoc} onChange={setNgayGiaoMoc} type="date" />
          </div>

          <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-500/30">
            <div className="text-xs opacity-70 mb-1">
              Công thức: Tiền nhuộm = {soKgNhuom} × {donGiaNhuom} = {tienNhuom.toLocaleString()}đ
            </div>
            <div className="flex items-center gap-2 text-lg font-bold">
              <span>Tổng: {tongCongNhuom.toLocaleString()}đ</span>
            </div>
          </div>

          <button onClick={handleNhuom} className="btn-primary w-full py-3 text-base bg-rose-500 hover:bg-rose-600">
            🎨 Giao mộc cho xưởng nhuộm
          </button>

          {/* Nghiệm thu nhuộm */}
          <div className="mt-4 p-3 rounded bg-slate-50 dark:bg-slate-800/30">
            <h4 className="font-semibold mb-2 text-sm">📦 Nghiệm thu nhuộm + Nhập kho vải TP</h4>
            <div className="flex flex-wrap gap-2">
              {nhuoms.filter((n) => n.trangThai === "Đã giao mộc" || n.trangThai === "Đang nhuộm").map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    const kg = parseInt(prompt(`Nhập kg vải thành phẩm cho ${n.id} (đã giao ${n.soKgNhuom}kg):`, String(Math.floor(n.soKgNhuom * 0.95))) || "0");
                    if (kg > 0) {
                      const r = nghiemThuNhuom(n.id, kg, "Kho Vải TP", "Khu A", "A03", user);
                      if (r.ok) {
                        toast.success(r.message);
                        refresh();
                      } else toast.error(r.message);
                    }
                  }}
                  className="text-xs px-2 py-1 rounded bg-rose-500 text-white"
                >
                  Nghiệm thu {n.id}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <h4 className="font-semibold mb-2 text-sm">📋 Phiếu nhuộm ({nhuoms.length})</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 dark:bg-slate-800">
                  <tr>
                    <th className="p-2 text-left">Mã</th>
                    <th className="p-2 text-left">Màu</th>
                    <th className="p-2 text-right">Kg mộc</th>
                    <th className="p-2 text-right">Kg TP</th>
                    <th className="p-2 text-right">Hao hụt</th>
                    <th className="p-2 text-right">Tổng phí</th>
                    <th className="p-2 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {nhuoms.map((n) => (
                    <tr key={n.id} className="border-t border-slate-200 dark:border-slate-700">
                      <td className="p-2 font-mono text-xs">{n.id}</td>
                      <td className="p-2"><span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-700 text-xs">{n.mau}</span></td>
                      <td className="p-2 text-right">{n.soKgNhuom}</td>
                      <td className="p-2 text-right">{n.soKgThanhPham || "-"}</td>
                      <td className="p-2 text-right text-rose-600">{n.haoHutPt ? `${n.haoHutPt.toFixed(1)}%` : "-"}</td>
                      <td className="p-2 text-right">{(n.tongCong / 1_000_000).toFixed(2)}tr</td>
                      <td className="p-2 text-center text-xs">
                        <span className={`px-1.5 py-0.5 rounded text-white ${n.trangThai === "Đã nghiệm thu" ? "bg-emerald-500" : "bg-rose-500"}`}>
                          {n.trangThai}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===== FORM 4: NHẬP KHO VẢI TP ===== */}
      {tab === "nhapkho" && (
        <div className="card p-4 space-y-3">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Boxes className="w-5 h-5 text-emerald-500" /> 4. Nhập kho vải thành phẩm
          </h3>
          <p className="text-xs opacity-70">Sau khi nghiệm thu nhuộm → Nhập kho theo Kho/Khu/Kệ</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Loại vải" value={loaiVaiNhap} onChange={setLoaiVaiNhap} />
            <Field label="Màu" value={mauNhap} onChange={setMauNhap} />
            <Field label="Số kg" value={soKgNhap} onChange={setSoKgNhap} type="number" />
            <Field label="Kg / cây" value={kgPerCay} onChange={setKgPerCay} type="number" />
          </div>

          <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-500/30">
            <div className="text-xs opacity-70 mb-1">Công thức: Số cây = INT(Kg / Kg mỗi cây)</div>
            <div className="flex items-center gap-2 text-lg font-bold">
              <span>{soKgNhap}kg</span>
              <span>÷</span>
              <span>{kgPerCay}kg/cây</span>
              <ChevronRight className="w-4 h-4" />
              <span className="text-emerald-600">{soCay} cây + {kgLe}kg lẻ</span>
            </div>
          </div>

          {/* Chọn kho/khu/kệ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold">Kho</label>
              <select value={kho} onChange={(e) => setKho(e.target.value)} className="w-full mt-1 px-3 py-2 rounded border">
                {Object.keys(KHU_KHO).map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold">Khu</label>
              <select value={khu} onChange={(e) => setKhu(e.target.value)} className="w-full mt-1 px-3 py-2 rounded border">
                {Object.keys(KHU_KHO[kho as keyof typeof KHU_KHO] || {}).map((khu) => <option key={khu} value={khu}>{khu}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold">Kệ</label>
              <input value={ke} onChange={(e) => setKe(e.target.value)} className="w-full mt-1 px-3 py-2 rounded border" placeholder="A03" />
            </div>
          </div>

          <button className="btn-primary w-full py-3 text-base bg-emerald-500 hover:bg-emerald-600">
            ✅ Nhập kho vải: {soKgNhap}kg → {kho}/{khu}/{ke}
          </button>

          <div className="mt-4">
            <h4 className="font-semibold mb-2 text-sm">📦 Phiếu nhập kho vải TP ({nhapKhos.length})</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 dark:bg-slate-800">
                  <tr>
                    <th className="p-2 text-left">Mã</th>
                    <th className="p-2 text-left">Vải</th>
                    <th className="p-2 text-right">Kg</th>
                    <th className="p-2 text-right">Cây</th>
                    <th className="p-2 text-right">Giá vốn/kg</th>
                    <th className="p-2 text-right">Tổng GT</th>
                    <th className="p-2 text-left">Vị trí</th>
                  </tr>
                </thead>
                <tbody>
                  {nhapKhos.map((k) => (
                    <tr key={k.id} className="border-t border-slate-200 dark:border-slate-700">
                      <td className="p-2 font-mono text-xs">{k.id}</td>
                      <td className="p-2 text-xs">
                        <div className="font-semibold">{k.tenVai}</div>
                        <div className="opacity-60">{k.mau}</div>
                      </td>
                      <td className="p-2 text-right">{k.soKg}</td>
                      <td className="p-2 text-right">{k.soCay} cây + {k.kgLe}kg</td>
                      <td className="p-2 text-right font-bold text-emerald-600">{k.giaVonPerKg.toFixed(0)}đ</td>
                      <td className="p-2 text-right">{(k.tongGiaTri / 1_000_000).toFixed(2)}tr</td>
                      <td className="p-2 text-xs">{k.khu}/{k.ke}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub?: string; color: string }) {
  const colors: Record<string, string> = {
    blue: "from-blue-500/10 to-cyan-500/10 text-blue-600",
    violet: "from-violet-500/10 to-purple-500/10 text-violet-600",
    rose: "from-rose-500/10 to-pink-500/10 text-rose-600",
    emerald: "from-emerald-500/10 to-green-500/10 text-emerald-600",
    amber: "from-amber-500/10 to-yellow-500/10 text-amber-600",
  };
  return (
    <div className={`card p-3 bg-gradient-to-br ${colors[color]}`}>
      <div className="flex items-center gap-1.5 opacity-80 text-xs">{icon}<span>{label}</span></div>
      <div className="text-lg font-bold mt-1">{value}</div>
      {sub && <div className="text-[10px] opacity-70">{sub}</div>}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder = "" }: { label: string; value: any; onChange: (v: any) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs font-semibold opacity-70">{label}</label>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          onChange(type === "number" ? (v === "" ? 0 : Number(v)) : v);
        }}
        placeholder={placeholder}
        className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-base"
      />
    </div>
  );
}
