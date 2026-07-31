"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Factory, Package, Truck, Palette, Boxes, ChevronRight, Plus, FileText,
  Calculator, AlertTriangle, TrendingUp, History, Search, Link2, Lock, Eye,
  CheckCircle2, XCircle, ArrowRight, BarChart3, DollarSign, Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/components/session-provider";
import {
  nhapKhoSoi_V2, taoLenhDet, capNhatTrangThaiLenhDet, nghiemThuDet_V2,
  taoMeNhuom, nghiemThuMau_V2, nhapKhoVaiTP, tinhGiaVonTungMau, truyNguocLo,
  baoCaoCongNoGiaCong, baoCaoHaoHut,
  getAllPhieuNhapSoi, getAllLenhDet, getAllMeNhuom, getAllPhieuNghiemThuMau,
  getAllLoVaiTP, getAllKhoLog, KHU_KHO_TP,
  type PhieuNhapSoi, type LenhDet, type MeNhuom, type PhieuNghiemThuMau,
  type LoVaiTP, type NghiemThuMau, type MauNhuom,
} from "@/lib/yarn-production-chain";

type Screen =
  | "dashboard" | "nhapsoi" | "khosoi" | "lenhdet" | "nghiemthumoc"
  | "khomoc" | "menhuom" | "nghiemthumau" | "khotp"
  | "congno" | "haohut" | "giavon" | "kho-log" | "truynguoc";

const SCREENS: { key: Screen; label: string; icon: any; nhom: number }[] = [
  { key: "dashboard", label: "1. Dashboard", icon: BarChart3, nhom: 1 },
  { key: "nhapsoi", label: "2. Nhập kho sợi", icon: Plus, nhom: 1 },
  { key: "khosoi", label: "3. Kho sợi", icon: Package, nhom: 1 },
  { key: "lenhdet", label: "4. Lệnh dệt", icon: Truck, nhom: 2 },
  { key: "nghiemthumoc", label: "5. Nghiệm thu mộc", icon: CheckCircle2, nhom: 2 },
  { key: "khomoc", label: "6. Kho vải mộc", icon: Boxes, nhom: 2 },
  { key: "menhuom", label: "7. Mẻ nhuộm", icon: Palette, nhom: 3 },
  { key: "nghiemthumau", label: "8. Nghiệm thu vải màu", icon: CheckCircle2, nhom: 3 },
  { key: "khotp", label: "9. Kho vải TP", icon: Boxes, nhom: 3 },
  { key: "congno", label: "10. Công nợ gia công", icon: DollarSign, nhom: 4 },
  { key: "haohut", label: "11. Báo cáo hao hụt", icon: AlertTriangle, nhom: 4 },
  { key: "giavon", label: "12. Báo cáo giá vốn", icon: Calculator, nhom: 4 },
  { key: "kho-log", label: "📜 Kho Log", icon: History, nhom: 5 },
  { key: "truynguoc", label: "🔍 Truy ngược lô", icon: Link2, nhom: 5 },
];

export default function SoiDetNhuomERPPage() {
  const { user } = useSession();
  const [screen, setScreen] = useState<Screen>("dashboard");

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="card p-4 mb-4 bg-gradient-to-r from-blue-500/10 via-violet-500/10 to-rose-500/10">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Factory className="w-7 h-7 text-blue-500" /> Sợi - Dệt - Nhuộm ERP Chuẩn
        </h1>
        <p className="opacity-70 text-sm">
          Quy trình 7 bước: Nhập sợi → Kho sợi → Lệnh dệt → Nghiệm thu mộc → Kho mộc → Mẻ nhuộm → Nghiệm thu màu → Kho TP
        </p>
        <div className="text-xs opacity-60 mt-1">
          ✅ Kho log bắt buộc · ✅ Giá vốn riêng từng màu · ✅ Truy ngược lô · ✅ Khóa giá vốn
        </div>
      </div>

      {/* Screen switcher */}
      <div className="card p-2 mb-4 flex flex-wrap gap-1.5">
        {SCREENS.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              className={`text-xs px-2.5 py-1.5 rounded-md flex items-center gap-1 ${
                screen === s.key ? "bg-blue-500 text-white" : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {s.label}
            </button>
          );
        })}
      </div>

      {screen === "dashboard" && <Dashboard />}
      {screen === "nhapsoi" && <NhapSoi user={user} onSuccess={() => toast.success("Đã lưu")} />}
      {screen === "khosoi" && <KhoSoi />}
      {screen === "lenhdet" && <LenhDet user={user} />}
      {screen === "nghiemthumoc" && <NghiemThuMoc user={user} />}
      {screen === "khomoc" && <KhoMoc />}
      {screen === "menhuom" && <MeNhuom user={user} />}
      {screen === "nghiemthumau" && <NghiemThuMau user={user} />}
      {screen === "khotp" && <KhoTP user={user} />}
      {screen === "congno" && <CongNo />}
      {screen === "haohut" && <BaoCaoHaoHut />}
      {screen === "giavon" && <BaoCaoGiaVon />}
      {screen === "kho-log" && <KhoLog />}
      {screen === "truynguoc" && <TruyNguoc />}
    </div>
  );
}

// ============ DASHBOARD ============
function Dashboard() {
  const pnss = getAllPhieuNhapSoi();
  const lds = getAllLenhDet();
  const mns = getAllMeNhuom();
  const ltps = getAllLoVaiTP();

  const tongTienSoi = pnss.reduce((s, p) => s + p.thanhTien, 0);
  const tongTienDet = lds.reduce((s, l) => s + ((l.soKgGiao * l.donGiaDet) + (l.chiPhiPhatSinh || 0)), 0);
  const tongTienNhuom = useMemo(() => {
    return mns.reduce((s, m) => {
      // Giả sử mỗi mẻ có chi phí nhuộm = tổng kg × đơn giá trung bình
      return s + 0;
    }, 0);
  }, [mns]);
  const tongKgTP = ltps.reduce((s, l) => s + l.tongKg, 0);
  const tongGiaTriTP = ltps.reduce((s, l) => s + l.tongGiaTri, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat icon={<Package className="w-4 h-4" />} label="Nhập sợi" value={`${(tongTienSoi / 1_000_000).toFixed(1)}tr`} sub={`${pnss.length} phiếu`} color="blue" />
        <Stat icon={<Truck className="w-4 h-4" />} label="Chi phí dệt" value={`${(tongTienDet / 1_000_000).toFixed(1)}tr`} sub={`${lds.length} lệnh`} color="violet" />
        <Stat icon={<Palette className="w-4 h-4" />} label="Mẻ nhuộm" value={mns.length} sub="đang xử lý" color="rose" />
        <Stat icon={<Boxes className="w-4 h-4" />} label="Vải TP" value={`${tongKgTP.toLocaleString()}kg`} sub={`${ltps.length} lô`} color="emerald" />
        <Stat icon={<DollarSign className="w-4 h-4" />} label="Giá trị TP" value={`${(tongGiaTriTP / 1_000_000).toFixed(1)}tr`} sub="tổng kho" color="amber" />
      </div>

      {/* Workflow diagram */}
      <div className="card p-4">
        <h3 className="font-bold mb-3 flex items-center gap-2"><Factory className="w-5 h-5 text-blue-500" /> Luồng dữ liệu 7 bước (có kho log + truy ngược)</h3>
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {[
            { l: "1. Nhập sợi", i: Package, c: "blue" },
            { l: "2. Kho sợi", i: Boxes, c: "indigo" },
            { l: "3. Lệnh dệt", i: Truck, c: "violet" },
            { l: "4. Nghiệm thu mộc", i: CheckCircle2, c: "purple" },
            { l: "5. Kho mộc", i: Boxes, c: "fuchsia" },
            { l: "6. Mẻ nhuộm (nhiều màu)", i: Palette, c: "rose" },
            { l: "7. Nghiệm thu màu (riêng từng màu)", i: CheckCircle2, c: "pink" },
            { l: "8. Kho vải TP (từng cây)", i: Boxes, c: "emerald" },
          ].map((s, idx, arr) => {
            const Icon = s.i;
            return (
              <span key={s.l} className="contents">
                <span className={`px-2 py-1 rounded bg-${s.c}-500/20 text-${s.c}-700 font-semibold flex items-center gap-1`}>
                  <Icon className="w-3 h-3" /> {s.l}
                </span>
                {idx < arr.length - 1 && <ChevronRight className="w-3 h-3 opacity-50" />}
              </span>
            );
          })}
        </div>
        <div className="mt-3 text-xs opacity-70 leading-relaxed">
          <strong>Quy tắc ERP:</strong> Không sửa tồn kho trực tiếp. Mọi nhập/xuất qua phiếu + kho_log.
          Không sửa giá vốn sau khi khóa. 1 mẻ nhiều màu. Mỗi màu giá/hao hụt/giá vốn riêng.
          Truy ngược: Vải TP → Mẻ nhuộm → Vải mộc → Lệnh dệt → Lô sợi → NCC.
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="card p-3">
          <h3 className="font-semibold text-sm mb-2">📦 Nhập sợi gần đây</h3>
          {pnss.slice(0, 3).map((p) => (
            <div key={p.id} className="text-xs p-2 mb-1 rounded bg-slate-50 dark:bg-slate-800/50">
              <div className="font-mono font-semibold">{p.id} - {p.maLoSoi}</div>
              <div className="opacity-80">{p.tenSoi} - {p.soKg}kg - {(p.thanhTien / 1_000_000).toFixed(1)}tr</div>
            </div>
          ))}
        </div>
        <div className="card p-3">
          <h3 className="font-semibold text-sm mb-2">🧵 Lệnh dệt gần đây</h3>
          {lds.slice(0, 3).map((l) => (
            <div key={l.id} className="text-xs p-2 mb-1 rounded bg-slate-50 dark:bg-slate-800/50">
              <div className="font-mono font-semibold">{l.id} - {l.xuongDet}</div>
              <div className="opacity-80">{l.soKgGiao}kg sợi {l.loaiSoi} → {l.soKgMocNhan || "?"}kg mộc ({l.haoHutPt?.toFixed(1) || "?"}%)</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, sub, color }: any) {
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

// ============ 2. NHẬP KHO SỢI ============
function NhapSoi({ user, onSuccess }: any) {
  const [ncc, setNcc] = useState("Cty Sợi Việt Nam");
  const [loaiSoi, setLoaiSoi] = useState("SOI-COTTON-30");
  const [tenSoi, setTenSoi] = useState("Sợi cotton 30s");
  const [maLoSoi, setMaLoSoi] = useState("LSOI-001");
  const [soKg, setSoKg] = useState(1000);
  const [donGia, setDonGia] = useState(145000);
  const [daThanhToan, setDaThanhToan] = useState(0);
  const [khoNhap, setKhoNhap] = useState("Kho Sợi");
  const [nguoiPhuTrach, setNguoiPhuTrach] = useState("");
  const [ngayNhap, setNgayNhap] = useState(new Date().toISOString().slice(0, 10));
  const [ghiChu, setGhiChu] = useState("");
  const [list, setList] = useState<PhieuNhapSoi[]>([]);

  useEffect(() => { setList(getAllPhieuNhapSoi()); }, []);

  const thanhTien = soKg * donGia;
  const conNo = thanhTien - daThanhToan;

  const handleSave = () => {
    const r = nhapKhoSoi_V2({
      ngayNhap, nccId: ncc, tenNCC: ncc,
      loaiSoi, tenSoi, maLoSoi, soKg, donGia,
      daThanhToan, khoNhap, nguoiPhuTrach, ghiChu, khoa: false,
    } as any, user);
    if (r.ok) {
      toast.success(r.message);
      setList(getAllPhieuNhapSoi());
      onSuccess?.();
      setSoKg(0); setDonGia(0); setDaThanhToan(0);
    } else toast.error(r.message);
  };

  return (
    <div className="card p-4 space-y-3">
      <h3 className="font-bold text-lg flex items-center gap-2">
        <Plus className="w-5 h-5 text-blue-500" /> 2. Nhập kho sợi
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="NCC" value={ncc} onChange={setNcc} />
        <Field label="Loại sợi" value={loaiSoi} onChange={setLoaiSoi} />
        <Field label="Tên sợi" value={tenSoi} onChange={setTenSoi} />
        <Field label="Mã lô sợi" value={maLoSoi} onChange={setMaLoSoi} />
        <Field label="Số kg" value={soKg} onChange={(v: any) => setSoKg(Number(v))} type="number" />
        <Field label="Đơn giá (VNĐ/kg)" value={donGia} onChange={(v: any) => setDonGia(Number(v))} type="number" />
        <Field label="Đã thanh toán" value={daThanhToan} onChange={(v: any) => setDaThanhToan(Number(v))} type="number" />
        <Field label="Kho nhập" value={khoNhap} onChange={setKhoNhap} />
        <Field label="Người phụ trách" value={nguoiPhuTrach} onChange={setNguoiPhuTrach} />
        <Field label="Ngày nhập" value={ngayNhap} onChange={setNgayNhap} type="date" />
      </div>
      <Field label="Ghi chú" value={ghiChu} onChange={setGhiChu} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-500/30">
        <FormulaBlock label="Thành tiền" formula={`${soKg} × ${donGia.toLocaleString()}`} value={thanhTien.toLocaleString() + "đ"} color="blue" />
        <FormulaBlock label="Đã thanh toán" formula="nhập" value={daThanhToan.toLocaleString() + "đ"} color="emerald" />
        <FormulaBlock label="Còn công nợ" formula={`${thanhTien.toLocaleString()} - ${daThanhToan.toLocaleString()}`} value={conNo.toLocaleString() + "đ"} color="rose" />
      </div>

      <button onClick={handleSave} className="btn-primary w-full py-3 bg-blue-500 hover:bg-blue-600 text-base">
        ✅ Lưu phiếu nhập + Tăng kho sợi + Tạo công nợ NCC
      </button>

      <div className="overflow-x-auto">
        <h4 className="font-semibold mb-2 text-sm">📋 Phiếu nhập ({list.length})</h4>
        <table className="w-full text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800">
            <tr>
              <th className="p-2 text-left">Mã phiếu</th>
              <th className="p-2 text-left">Lô</th>
              <th className="p-2 text-left">Sợi</th>
              <th className="p-2 text-right">Kg</th>
              <th className="p-2 text-right">Thành tiền</th>
              <th className="p-2 text-right">Đã TT</th>
              <th className="p-2 text-right">Còn nợ</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-2 font-mono">{p.id}</td>
                <td className="p-2 font-mono">{p.maLoSoi}</td>
                <td className="p-2">{p.tenSoi}</td>
                <td className="p-2 text-right">{p.soKg}</td>
                <td className="p-2 text-right font-semibold">{(p.thanhTien / 1_000_000).toFixed(2)}tr</td>
                <td className="p-2 text-right text-emerald-600">{(p.daThanhToan / 1_000_000).toFixed(2)}tr</td>
                <td className="p-2 text-right text-rose-600">{(p.conCongNo / 1_000_000).toFixed(2)}tr</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ 3. KHO SỢI ============
function KhoSoi() {
  const [loSois, setLoSois] = useState<any[]>([]);
  useEffect(() => {
    setLoSois(JSON.parse(localStorage.getItem("mimin_lo_soi") || "[]"));
  }, []);

  return (
    <div className="card p-4 space-y-3">
      <h3 className="font-bold text-lg flex items-center gap-2">
        <Boxes className="w-5 h-5 text-indigo-500" /> 3. Kho sợi ({loSois.length} lô)
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 dark:bg-slate-800">
            <tr>
              <th className="p-2 text-left">Mã lô</th>
              <th className="p-2 text-left">Loại sợi</th>
              <th className="p-2 text-left">NCC</th>
              <th className="p-2 text-right">Ban đầu</th>
              <th className="p-2 text-right">Còn lại</th>
              <th className="p-2 text-left">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {loSois.map((l: any) => (
              <tr key={l.id} className="border-t">
                <td className="p-2 font-mono text-xs">{l.maLoSoi}</td>
                <td className="p-2 text-xs">{l.tenSoi}</td>
                <td className="p-2 text-xs">{l.nhaCungCap}</td>
                <td className="p-2 text-right">{l.soKgBanDau}kg</td>
                <td className="p-2 text-right font-semibold">{l.soKgConLai}kg</td>
                <td className="p-2 text-xs">
                  <span className={`px-1.5 py-0.5 rounded text-white ${l.trangThai === "Tồn kho" ? "bg-emerald-500" : "bg-slate-500"}`}>
                    {l.trangThai}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ 4. LỆNH DỆT ============
function LenhDet({ user }: any) {
  const [list, setList] = useState<LenhDet[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    ngayGiao: new Date().toISOString().slice(0, 10),
    ngayDuKienNhan: new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10),
    xuongDet: "DNT Dệt Bắc Ninh",
    maLoSoi: "LSOI-001",
    loaiSoi: "SOI-COTTON-30",
    soKgGiao: 1000,
    donGiaDet: 8000,
    nguoiPhuTrach: "",
    ghiChu: "",
  });

  useEffect(() => { setList(getAllLenhDet()); }, []);

  const handleTao = () => {
    const r = taoLenhDet({ ...form, tienDuKien: form.soKgGiao * form.donGiaDet, soMetDuKien: form.soKgGiao * 4 }, user);
    if (r.ok) {
      toast.success(r.message);
      setList(getAllLenhDet());
      setShowForm(false);
    } else toast.error(r.message);
  };

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Truck className="w-5 h-5 text-violet-500" /> 4. Lệnh dệt ({list.length})
        </h3>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-xs bg-violet-500 hover:bg-violet-600">
          <Plus className="w-3.5 h-3.5 inline" /> Tạo lệnh dệt
        </button>
      </div>

      {showForm && (
        <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-900/20 space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Field label="Ngày giao" value={form.ngayGiao} onChange={(v: any) => setForm({ ...form, ngayGiao: v })} type="date" />
            <Field label="Ngày dự kiến nhận" value={form.ngayDuKienNhan} onChange={(v: any) => setForm({ ...form, ngayDuKienNhan: v })} type="date" />
            <Field label="Xưởng dệt" value={form.xuongDet} onChange={(v: any) => setForm({ ...form, xuongDet: v })} />
            <Field label="Lô sợi" value={form.maLoSoi} onChange={(v: any) => setForm({ ...form, maLoSoi: v })} />
            <Field label="Kg giao" value={form.soKgGiao} onChange={(v: any) => setForm({ ...form, soKgGiao: Number(v) })} type="number" />
            <Field label="Đơn giá dệt/kg" value={form.donGiaDet} onChange={(v: any) => setForm({ ...form, donGiaDet: Number(v) })} type="number" />
            <Field label="Người phụ trách" value={form.nguoiPhuTrach} onChange={(v: any) => setForm({ ...form, nguoiPhuTrach: v })} />
          </div>
          <div className="text-sm p-2 rounded bg-white dark:bg-slate-800">
            Tiền dệt dự kiến: <strong>{(form.soKgGiao * form.donGiaDet).toLocaleString()}đ</strong>
          </div>
          <button onClick={handleTao} className="btn-primary w-full bg-violet-500">✅ Tạo lệnh dệt + Giảm kho sợi</button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800">
            <tr>
              <th className="p-2 text-left">Mã LD</th>
              <th className="p-2 text-left">Xưởng</th>
              <th className="p-2 text-right">Kg sợi</th>
              <th className="p-2 text-right">Kg mộc</th>
              <th className="p-2 text-right">Hao hụt</th>
              <th className="p-2 text-right">Tiền dệt</th>
              <th className="p-2 text-center">Trạng thái</th>
              <th className="p-2 text-center">Cập nhật</th>
            </tr>
          </thead>
          <tbody>
            {list.map((l) => (
              <tr key={l.id} className="border-t">
                <td className="p-2 font-mono">{l.id}</td>
                <td className="p-2">{l.xuongDet}</td>
                <td className="p-2 text-right">{l.soKgGiao}</td>
                <td className="p-2 text-right">{l.soKgMocNhan || "-"}</td>
                <td className="p-2 text-right text-rose-600">{l.haoHutPt ? `${l.haoHutPt.toFixed(1)}%` : "-"}</td>
                <td className="p-2 text-right">{(l.soKgGiao * l.donGiaDet / 1_000_000).toFixed(2)}tr</td>
                <td className="p-2 text-center">
                  <span className="px-1.5 py-0.5 rounded text-white bg-blue-500 text-[10px]">{l.trangThai}</span>
                </td>
                <td className="p-2 text-center">
                  <select
                    value={l.trangThai}
                    onChange={(e) => {
                      capNhatTrangThaiLenhDet(l.id, e.target.value as any, user);
                      setList(getAllLenhDet());
                      toast.success("Đã cập nhật");
                    }}
                    className="text-[10px] px-1 py-0.5 rounded border"
                  >
                    {["Nháp", "Đã giao sợi", "Đang dệt", "Chờ nghiệm thu", "Hoàn thành", "Hủy"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ 5. NGHIỆM THU VẢI MỘC ============
function NghiemThuMoc({ user }: any) {
  const [list, setList] = useState<LenhDet[]>([]);
  useEffect(() => { setList(getAllLenhDet().filter((l) => l.trangThai !== "Hoàn thành" && l.trangThai !== "Hủy")); }, []);

  return (
    <div className="card p-4 space-y-3">
      <h3 className="font-bold text-lg flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-emerald-500" /> 5. Nghiệm thu vải mộc
      </h3>
      <p className="text-xs opacity-70">Chọn lệnh dệt → Nhập số liệu nghiệm thu → Tự động tính hao hụt + công nợ xưởng</p>

      <div className="space-y-2">
        {list.map((l) => (
          <div key={l.id} className="p-3 rounded border border-slate-200 dark:border-slate-700">
            <div className="font-mono text-sm font-bold">{l.id} - {l.xuongDet}</div>
            <div className="text-xs opacity-80">Giao: {l.soKgGiao}kg sợi {l.loaiSoi} · Đơn giá: {l.donGiaDet.toLocaleString()}đ/kg</div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-2">
              <button
                onClick={() => {
                  const kg = parseInt(prompt(`Số kg vải mộc nhận cho ${l.id} (đã giao ${l.soKgGiao}kg):`, String(Math.floor(l.soKgGiao * 0.92))) || "0");
                  if (kg > 0) {
                    const cay = parseInt(prompt(`Số cây vải mộc:`, String(Math.floor(kg / 20))) || "0");
                    const loi = parseInt(prompt(`Kg lỗi:`, "0") || "0");
                    const phatSinh = parseInt(prompt(`Chi phí phát sinh (VNĐ):`, "0") || "0");
                    const daTra = parseInt(prompt(`Đã thanh toán (VNĐ):`, "0") || "0");
                    const r = nghiemThuDet_V2(l.id, {
                      soKgMocNhan: kg, soCayMoc: cay, soKgLoi: loi,
                      chiPhiPhatSinh: phatSinh, daThanhToan: daTra,
                      khoMocNhap: "Kho Vải Mộc", ketQuaKiemTra: "Đạt",
                    }, user);
                    if (r.ok) {
                      toast.success(r.message);
                      setList(getAllLenhDet().filter((x) => x.trangThai !== "Hoàn thành" && x.trangThai !== "Hủy"));
                    } else toast.error(r.message);
                  }
                }}
                className="text-xs py-1.5 rounded bg-emerald-500 text-white"
              >
                ✅ Nghiệm thu
              </button>
              <div className="text-xs flex items-center">Đơn giá: {l.donGiaDet.toLocaleString()}đ</div>
              <div className="text-xs flex items-center">Phí DT: {(l.soKgGiao * l.donGiaDet).toLocaleString()}đ</div>
            </div>
          </div>
        ))}
        {list.length === 0 && <div className="text-center text-sm opacity-60 py-4">Không có lệnh dệt chờ nghiệm thu</div>}
      </div>
    </div>
  );
}

// ============ 6. KHO VẢI MỘC ============
function KhoMoc() {
  const [list, setList] = useState<any[]>([]);
  useEffect(() => { setList(JSON.parse(localStorage.getItem("mimin_lo_moc") || "[]")); }, []);

  return (
    <div className="card p-4 space-y-3">
      <h3 className="font-bold text-lg flex items-center gap-2">
        <Boxes className="w-5 h-5 text-fuchsia-500" /> 6. Kho vải mộc ({list.length} lô)
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800">
            <tr>
              <th className="p-2 text-left">Mã lô mộc</th>
              <th className="p-2 text-left">Lệnh dệt</th>
              <th className="p-2 text-left">Loại vải</th>
              <th className="p-2 text-right">Kg</th>
              <th className="p-2 text-right">Cây</th>
              <th className="p-2 text-right">Kg lỗi</th>
              <th className="p-2 text-left">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {list.map((l) => (
              <tr key={l.id} className="border-t">
                <td className="p-2 font-mono">{l.maLoMoc}</td>
                <td className="p-2 font-mono text-blue-600">{l.maLenhDet}</td>
                <td className="p-2">{l.loaiVai}</td>
                <td className="p-2 text-right">{l.soKg}kg</td>
                <td className="p-2 text-right">{l.soCay}</td>
                <td className="p-2 text-right text-rose-600">{l.soKgLoi}kg</td>
                <td className="p-2 text-xs">
                  <span className={`px-1.5 py-0.5 rounded text-white ${l.trangThai === "Chờ nhuộm" ? "bg-blue-500" : "bg-rose-500"}`}>
                    {l.trangThai}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ 7. MẺ NHUỘM (NHIỀU MÀU) ============
function MeNhuom({ user }: any) {
  const [list, setList] = useState<MeNhuom[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    ngayGiao: new Date().toISOString().slice(0, 10),
    ngayDuKienNhan: new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10),
    xuongNhuom: "Cty Nhuộm Hà Đông",
    maLoMoc: "LM-LD_001",
    nguoiPhuTrach: "",
    ghiChu: "",
    danhSachMau: [
      { mau: "Đen", soKg: 200, donGiaNhuom: 15000 },
      { mau: "Trắng", soKg: 150, donGiaNhuom: 12000 },
      { mau: "Navy", soKg: 100, donGiaNhuom: 14000 },
    ] as MauNhuom[],
  });

  useEffect(() => { setList(getAllMeNhuom()); }, []);

  const tongKg = form.danhSachMau.reduce((s, m) => s + m.soKg, 0);
  const tongTienDuKien = form.danhSachMau.reduce((s, m) => s + m.soKg * m.donGiaNhuom, 0);

  const handleTao = () => {
    const r = taoMeNhuom(form, user);
    if (r.ok) {
      toast.success(r.message);
      setList(getAllMeNhuom());
      setShowForm(false);
    } else toast.error(r.message);
  };

  const updateMau = (idx: number, field: keyof MauNhuom, val: any) => {
    const newMau = [...form.danhSachMau];
    newMau[idx] = { ...newMau[idx], [field]: field === "soKg" || field === "donGiaNhuom" ? Number(val) : val };
    setForm({ ...form, danhSachMau: newMau });
  };

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Palette className="w-5 h-5 text-rose-500" /> 7. Mẻ nhuộm ({list.length})
        </h3>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-xs bg-rose-500 hover:bg-rose-600">
          <Plus className="w-3.5 h-3.5 inline" /> Tạo mẻ nhuộm
        </button>
      </div>

      {showForm && (
        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Field label="Xưởng nhuộm" value={form.xuongNhuom} onChange={(v: any) => setForm({ ...form, xuongNhuom: v })} />
            <Field label="Lô mộc" value={form.maLoMoc} onChange={(v: any) => setForm({ ...form, maLoMoc: v })} />
            <Field label="Ngày giao" value={form.ngayGiao} onChange={(v: any) => setForm({ ...form, ngayGiao: v })} type="date" />
            <Field label="Người phụ trách" value={form.nguoiPhuTrach} onChange={(v: any) => setForm({ ...form, nguoiPhuTrach: v })} />
          </div>

          <div className="p-2 rounded bg-white dark:bg-slate-800">
            <div className="font-semibold text-sm mb-2">🎨 Danh sách màu (1 mẻ có thể nhiều màu):</div>
            {form.danhSachMau.map((m, idx) => (
              <div key={idx} className="grid grid-cols-4 gap-1.5 mb-1.5 text-xs">
                <input value={m.mau} onChange={(e) => updateMau(idx, "mau", e.target.value)} className="px-2 py-1 rounded border" placeholder="Màu" />
                <input type="number" value={m.soKg} onChange={(e) => updateMau(idx, "soKg", e.target.value)} className="px-2 py-1 rounded border text-right" placeholder="Kg" />
                <input type="number" value={m.donGiaNhuom} onChange={(e) => updateMau(idx, "donGiaNhuom", e.target.value)} className="px-2 py-1 rounded border text-right" placeholder="đ/kg" />
                <div className="flex items-center justify-end text-xs opacity-70">
                  = {(m.soKg * m.donGiaNhuom).toLocaleString()}đ
                </div>
              </div>
            ))}
            <button onClick={() => setForm({ ...form, danhSachMau: [...form.danhSachMau, { mau: "Mới", soKg: 0, donGiaNhuom: 0 }] })} className="text-xs text-blue-600">+ Thêm màu</button>
          </div>

          <div className="text-sm p-2 rounded bg-white dark:bg-slate-800">
            Tổng: <strong>{tongKg}kg</strong> · Phí dự kiến: <strong>{tongTienDuKien.toLocaleString()}đ</strong>
          </div>

          <button onClick={handleTao} className="btn-primary w-full bg-rose-500">✅ Tạo mẻ nhuộm (nhiều màu)</button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800">
            <tr>
              <th className="p-2 text-left">Mã MN</th>
              <th className="p-2 text-left">Xưởng</th>
              <th className="p-2 text-left">Lô mộc</th>
              <th className="p-2 text-right">Kg</th>
              <th className="p-2 text-left">Danh sách màu</th>
              <th className="p-2 text-center">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {list.map((m) => (
              <tr key={m.id} className="border-t">
                <td className="p-2 font-mono">{m.id}</td>
                <td className="p-2">{m.xuongNhuom}</td>
                <td className="p-2 font-mono text-blue-600">{m.maLoMoc}</td>
                <td className="p-2 text-right">{m.tongKgXuat}</td>
                <td className="p-2 text-xs">
                  {m.danhSachMau.map((x) => (
                    <span key={x.mau} className="inline-block px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-700 mr-1 mb-1">
                      {x.mau}: {x.soKg}kg
                    </span>
                  ))}
                </td>
                <td className="p-2 text-center text-xs">
                  <span className="px-1.5 py-0.5 rounded text-white bg-rose-500">{m.trangThai}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ 8. NGHIỆM THU VẢI MÀU (TỪNG MÀU RIÊNG) ============
function NghiemThuMau({ user }: any) {
  const [list, setList] = useState<MeNhuom[]>([]);
  useEffect(() => { setList(getAllMeNhuom().filter((m) => m.trangThai !== "Hoàn thành")); }, []);

  return (
    <div className="card p-4 space-y-3">
      <h3 className="font-bold text-lg flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-pink-500" /> 8. Nghiệm thu vải màu (từng màu riêng)
      </h3>
      <p className="text-xs opacity-70">Mỗi màu có đơn giá, sản lượng, hao hụt, giá vốn riêng</p>

      {list.map((m) => (
        <div key={m.id} className="p-3 rounded border border-slate-200 dark:border-slate-700">
          <div className="font-mono text-sm font-bold mb-1">{m.id} - {m.xuongNhuom}</div>
          <div className="text-xs opacity-80">Mẻ {m.tongKgXuat}kg mộc, {m.danhSachMau.length} màu</div>
          <div className="mt-2">
            {m.danhSachMau.map((x) => (
              <div key={x.mau} className="text-xs p-1.5 rounded bg-slate-50 dark:bg-slate-800/50 mb-1 flex items-center justify-between">
                <span><strong>{x.mau}</strong> - {x.soKg}kg × {x.donGiaNhuom.toLocaleString()}đ/kg</span>
                <button
                  onClick={() => {
                    const kgNhan = parseInt(prompt(`${x.mau}: Kg vải màu nhận (đã giao ${x.soKg}kg):`, String(Math.floor(x.soKg * 0.95))) || "0");
                    if (kgNhan > 0) {
                      const cay = parseInt(prompt("Số cây:", String(Math.floor(kgNhan / 20))) || "0");
                      const loi = parseInt(prompt("Kg lỗi:", "0") || "0");
                      const hc = parseInt(prompt("Chi phí hóa chất:", "200000") || "0");
                      const ht = parseInt(prompt("Chi phí hoàn thiện:", "100000") || "0");
                      const ps = parseInt(prompt("Chi phí phát sinh:", "0") || "0");
                      const daTra = parseInt(prompt("Đã thanh toán:", "0") || "0");
                      const ds: NghiemThuMau[] = [{
                        mau: x.mau, soKgMocGiao: x.soKg, soKgMauNhan: kgNhan,
                        soCayNhan: cay, soKgLoi: loi, donGiaNhuom: x.donGiaNhuom,
                        chiPhiHoaChat: hc, chiPhiHoanThien: ht, chiPhiPhatSinh: ps, daThanhToan: daTra,
                      }];
                      const r = nghiemThuMau_V2(m.id, ds, m.nguoiPhuTrach || user?.name || "system", user);
                      if (r.ok) {
                        toast.success(r.message);
                        setList(getAllMeNhuom().filter((x) => x.trangThai !== "Hoàn thành"));
                      } else toast.error(r.message);
                    }
                  }}
                  className="text-xs px-2 py-1 rounded bg-pink-500 text-white"
                >
                  Nghiệm thu {x.mau}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
      {list.length === 0 && <div className="text-center text-sm opacity-60 py-4">Không có mẻ nhuộm chờ nghiệm thu</div>}
    </div>
  );
}

// ============ 9. KHO VẢI TP (TỪNG CÂY + KHU/KỆ/TẦNG) ============
function KhoTP({ user }: any) {
  const [list, setList] = useState<LoVaiTP[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    ngayNhap: new Date().toISOString().slice(0, 10),
    meNhuomId: "MN_001",
    nghiemThuMauId: "NTM_001",
    loaiVai: "Vải thun cotton 4 chiều",
    mau: "Trắng",
    maMau: "M-TRANG-001",
    maLo: "LTP-001-TRANG",
    kho: "Kho Vải TP",
    khu: "Khu A",
    ke: "A03",
    tang: "Tầng 2",
    viTri: "Vị trí 1",
    trangThaiChatLuong: "Đạt" as const,
    nguoiPhuTrach: "",
    ghiChu: "",
    giaVonPerKg: 200000,
    // Mẫu danh sách cây
    danhSachCay: [
      { stt: 1, kg: 19.6 }, { stt: 2, kg: 20.3 }, { stt: 3, kg: 18.9 },
    ] as { stt: number; kg: number }[],
  });

  useEffect(() => { setList(getAllLoVaiTP()); }, []);

  const tongKg = form.danhSachCay.reduce((s, c) => s + c.kg, 0);

  const handleSave = () => {
    const r = nhapKhoVaiTP(form, user);
    if (r.ok) {
      toast.success(r.message);
      setList(getAllLoVaiTP());
      setShowForm(false);
    } else toast.error(r.message);
  };

  const updateCay = (idx: number, kg: number) => {
    const newCay = [...form.danhSachCay];
    newCay[idx] = { ...newCay[idx], kg };
    setForm({ ...form, danhSachCay: newCay });
  };

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Boxes className="w-5 h-5 text-emerald-500" /> 9. Kho vải TP ({list.length} lô)
        </h3>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-xs bg-emerald-500 hover:bg-emerald-600">
          <Plus className="w-3.5 h-3.5 inline" /> Nhập lô vải
        </button>
      </div>

      {showForm && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Field label="Mã lô vải TP" value={form.maLo} onChange={(v: any) => setForm({ ...form, maLo: v })} />
            <Field label="Loại vải" value={form.loaiVai} onChange={(v: any) => setForm({ ...form, loaiVai: v })} />
            <Field label="Màu" value={form.mau} onChange={(v: any) => setForm({ ...form, mau: v })} />
            <Field label="Mã màu" value={form.maMau} onChange={(v: any) => setForm({ ...form, maMau: v })} />
            <Field label="Giá vốn/kg" value={form.giaVonPerKg} onChange={(v: any) => setForm({ ...form, giaVonPerKg: Number(v) })} type="number" />
            <div>
              <label className="text-xs font-semibold">Kho</label>
              <select value={form.kho} onChange={(e) => setForm({ ...form, kho: e.target.value })} className="w-full mt-1 px-3 py-2 rounded border">
                {Object.keys(KHU_KHO_TP).map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold">Khu (theo trạng thái)</label>
              <select value={form.khu} onChange={(e) => setForm({ ...form, khu: e.target.value })} className="w-full mt-1 px-3 py-2 rounded border">
                {Object.keys(KHU_KHO_TP[form.kho as keyof typeof KHU_KHO_TP] || {}).map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <Field label="Kệ" value={form.ke} onChange={(v: any) => setForm({ ...form, ke: v })} />
            <Field label="Tầng" value={form.tang} onChange={(v: any) => setForm({ ...form, tang: v })} />
          </div>

          <div className="p-2 rounded bg-white dark:bg-slate-800">
            <div className="font-semibold text-sm mb-2">📦 Quản lý từng cây (không chỉ chia INT):</div>
            {form.danhSachCay.map((c, idx) => (
              <div key={c.stt} className="grid grid-cols-3 gap-1.5 mb-1.5 text-xs">
                <div className="flex items-center">Cây {String(c.stt).padStart(2, "0")}</div>
                <input type="number" step="0.1" value={c.kg} onChange={(e) => updateCay(idx, parseFloat(e.target.value))} className="px-2 py-1 rounded border text-right" />
                <div className="opacity-70 flex items-center">kg</div>
              </div>
            ))}
            <button onClick={() => setForm({ ...form, danhSachCay: [...form.danhSachCay, { stt: form.danhSachCay.length + 1, kg: 20 }] })} className="text-xs text-blue-600">+ Thêm cây</button>
            <div className="mt-2 text-sm">Tổng: <strong>{tongKg.toFixed(1)}kg</strong> · {(tongKg * form.giaVonPerKg).toLocaleString()}đ</div>
          </div>

          <button onClick={handleSave} className="btn-primary w-full bg-emerald-500">✅ Nhập kho + Khóa giá vốn</button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800">
            <tr>
              <th className="p-2 text-left">Mã lô</th>
              <th className="p-2 text-left">Màu</th>
              <th className="p-2 text-right">Kg</th>
              <th className="p-2 text-right">Cây</th>
              <th className="p-2 text-right">Giá vốn/kg</th>
              <th className="p-2 text-right">Tổng GT</th>
              <th className="p-2 text-left">Vị trí</th>
              <th className="p-2 text-center">Khóa</th>
            </tr>
          </thead>
          <tbody>
            {list.map((l) => (
              <tr key={l.id} className="border-t">
                <td className="p-2 font-mono">{l.maLo}</td>
                <td className="p-2"><span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700">{l.mau}</span></td>
                <td className="p-2 text-right">{l.tongKg.toFixed(1)}</td>
                <td className="p-2 text-right">{l.danhSachCay.length}</td>
                <td className="p-2 text-right font-bold text-emerald-600">{l.giaVonPerKg.toFixed(0)}đ</td>
                <td className="p-2 text-right">{(l.tongGiaTri / 1_000_000).toFixed(2)}tr</td>
                <td className="p-2 text-xs">{l.khu}/{l.ke}/{l.tang}</td>
                <td className="p-2 text-center">
                  {l.khoa ? <Lock className="w-3 h-3 text-rose-500 inline" /> : <span className="text-amber-500">⚠</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ 10. CÔNG NỢ GIA CÔNG ============
function CongNo() {
  const [list, setList] = useState<any[]>([]);
  useEffect(() => { setList(baoCaoCongNoGiaCong()); }, []);

  return (
    <div className="card p-4 space-y-3">
      <h3 className="font-bold text-lg flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-amber-500" /> 10. Công nợ gia công
      </h3>
      <p className="text-xs opacity-70">Liên kết NCC sợi / Xưởng dệt / Xưởng nhuộm</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 dark:bg-slate-800">
            <tr>
              <th className="p-2 text-left">Đối tượng</th>
              <th className="p-2 text-left">Loại</th>
              <th className="p-2 text-right">Tổng PS</th>
              <th className="p-2 text-right">Đã TT</th>
              <th className="p-2 text-right">Còn nợ</th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.doiTuong} className="border-t">
                <td className="p-2 font-semibold">{c.doiTuong}</td>
                <td className="p-2 text-xs">
                  <span className={`px-1.5 py-0.5 rounded text-white ${c.loai === "NCC sợi" ? "bg-blue-500" : c.loai === "Xưởng dệt" ? "bg-violet-500" : "bg-rose-500"}`}>
                    {c.loai}
                  </span>
                </td>
                <td className="p-2 text-right">{(c.tongPhatSinh / 1_000_000).toFixed(2)}tr</td>
                <td className="p-2 text-right text-emerald-600">{(c.daThanhToan / 1_000_000).toFixed(2)}tr</td>
                <td className="p-2 text-right font-bold text-rose-600">{(c.conNo / 1_000_000).toFixed(2)}tr</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ 11. BÁO CÁO HAO HỤT ============
function BaoCaoHaoHut() {
  const [list, setList] = useState<any[]>([]);
  useEffect(() => { setList(baoCaoHaoHut()); }, []);

  return (
    <div className="card p-4 space-y-3">
      <h3 className="font-bold text-lg flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-amber-500" /> 11. Báo cáo hao hụt
      </h3>
      <div className="text-xs opacity-70">
        <strong>Quy ước ERP:</strong> Hao hụt dệt ≤ 4% (Xanh) · 4-10% (Vàng) · &gt; 10% (Đỏ)
        <br />Hao hụt nhuộm: ≤ 2% (Xanh) · 2-5% (Vàng) · &gt; 5% (Đỏ)
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 dark:bg-slate-800">
            <tr>
              <th className="p-2 text-left">Loại</th>
              <th className="p-2 text-left">Mã phiếu</th>
              <th className="p-2 text-left">Ngày</th>
              <th className="p-2 text-right">Đầu vào</th>
              <th className="p-2 text-right">Đầu ra</th>
              <th className="p-2 text-right">Hao hụt kg</th>
              <th className="p-2 text-right">Hao hụt %</th>
              <th className="p-2 text-center">Cảnh báo</th>
            </tr>
          </thead>
          <tbody>
            {list.map((h, i) => (
              <tr key={i} className="border-t">
                <td className="p-2">
                  <span className={`px-1.5 py-0.5 rounded text-white text-xs ${h.loai === "Dệt" ? "bg-violet-500" : "bg-rose-500"}`}>
                    {h.loai}
                  </span>
                </td>
                <td className="p-2 font-mono text-xs">{h.maPhieu}</td>
                <td className="p-2 text-xs">{h.ngay}</td>
                <td className="p-2 text-right">{h.dauVao}kg</td>
                <td className="p-2 text-right">{h.dauRa}kg</td>
                <td className="p-2 text-right">{h.haoHutKg}kg</td>
                <td className="p-2 text-right font-semibold">{h.haoHutPt.toFixed(1)}%</td>
                <td className="p-2 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-white text-xs ${
                    h.canhBao === "Xanh" ? "bg-emerald-500" : h.canhBao === "Vàng" ? "bg-amber-500" : "bg-rose-500"
                  }`}>
                    {h.canhBao === "Xanh" ? "🟢 Đạt" : h.canhBao === "Vàng" ? "🟡 Cảnh báo" : "🔴 Vượt"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ 12. BÁO CÁO GIÁ VỐN ============
function BaoCaoGiaVon() {
  const [ltps, setLtps] = useState<LoVaiTP[]>([]);
  const [ntms, setNtms] = useState<PhieuNghiemThuMau[]>([]);
  const [lds, setLds] = useState<LenhDet[]>([]);
  const [pnss, setPnss] = useState<PhieuNhapSoi[]>([]);

  useEffect(() => {
    setLtps(getAllLoVaiTP());
    setNtms(getAllPhieuNghiemThuMau());
    setLds(getAllLenhDet());
    setPnss(getAllPhieuNhapSoi());
  }, []);

  return (
    <div className="card p-4 space-y-3">
      <h3 className="font-bold text-lg flex items-center gap-2">
        <Calculator className="w-5 h-5 text-amber-500" /> 12. Báo cáo giá vốn vải (riêng từng màu)
      </h3>
      <div className="text-xs opacity-70 p-2 rounded bg-amber-50 dark:bg-amber-900/20">
        <strong>Quy tắc:</strong> Không dùng giá trung bình toàn mẻ. Tính riêng từng màu.
        Sau khi nhập kho, giá vốn được <strong>khóa</strong>. Muốn sửa phải tạo phiếu điều chỉnh.
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 dark:bg-slate-800">
            <tr>
              <th className="p-2 text-left">Lô vải TP</th>
              <th className="p-2 text-left">Màu</th>
              <th className="p-2 text-right">Sợi</th>
              <th className="p-2 text-right">Dệt</th>
              <th className="p-2 text-right">Nhuộm</th>
              <th className="p-2 text-right">Hóa chất</th>
              <th className="p-2 text-right">Hoàn thiện</th>
              <th className="p-2 text-right">Tổng/kg</th>
              <th className="p-2 text-center">Khóa</th>
            </tr>
          </thead>
          <tbody>
            {ltps.map((l) => {
              const chiSoi = l.tongGiaTri * 0.55; // Mock phân bổ
              const chiDet = l.tongGiaTri * 0.20;
              const chiNhuom = l.tongGiaTri * 0.15;
              const chiHC = l.tongGiaTri * 0.05;
              const chiHT = l.tongGiaTri * 0.05;
              return (
                <tr key={l.id} className="border-t">
                  <td className="p-2 font-mono text-xs">{l.maLo}</td>
                  <td className="p-2"><span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700">{l.mau}</span></td>
                  <td className="p-2 text-right">{(chiSoi / 1_000_000).toFixed(2)}tr</td>
                  <td className="p-2 text-right">{(chiDet / 1_000_000).toFixed(2)}tr</td>
                  <td className="p-2 text-right">{(chiNhuom / 1_000_000).toFixed(2)}tr</td>
                  <td className="p-2 text-right">{(chiHC / 1_000_000).toFixed(2)}tr</td>
                  <td className="p-2 text-right">{(chiHT / 1_000_000).toFixed(2)}tr</td>
                  <td className="p-2 text-right font-bold text-emerald-600">{l.giaVonPerKg.toFixed(0)}đ</td>
                  <td className="p-2 text-center">{l.khoa ? <Lock className="w-3 h-3 text-rose-500 inline" /> : "🔓"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ KHO LOG ============
function KhoLog() {
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(() => { setLogs(getAllKhoLog().slice(0, 100)); }, []);

  return (
    <div className="card p-4 space-y-3">
      <h3 className="font-bold text-lg flex items-center gap-2">
        <History className="w-5 h-5 text-slate-500" /> 📜 Kho Log (bắt buộc)
      </h3>
      <p className="text-xs opacity-70">Mọi nhập/xuất phải tạo kho_log. Không sửa tồn kho trực tiếp.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800">
            <tr>
              <th className="p-2 text-left">Thời gian</th>
              <th className="p-2 text-left">Loại phiếu</th>
              <th className="p-2 text-left">Kho</th>
              <th className="p-2 text-center">Action</th>
              <th className="p-2 text-left">Mã lô</th>
              <th className="p-2 text-right">Kg</th>
              <th className="p-2 text-right">Trước</th>
              <th className="p-2 text-right">Sau</th>
              <th className="p-2 text-left">Người</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-t">
                <td className="p-2 text-xs">{new Date(l.thoiGian).toLocaleString("vi-VN")}</td>
                <td className="p-2"><span className="px-1.5 py-0.5 rounded bg-slate-500 text-white text-[10px]">{l.loaiPhieu}</span></td>
                <td className="p-2 text-xs">{l.loaiKho}</td>
                <td className="p-2 text-center">
                  <span className={`px-1.5 py-0.5 rounded text-white text-[10px] ${l.loaiAction === "NHAP" ? "bg-emerald-500" : l.loaiAction === "XUAT" ? "bg-rose-500" : "bg-amber-500"}`}>
                    {l.loaiAction}
                  </span>
                </td>
                <td className="p-2 font-mono">{l.maLo}</td>
                <td className="p-2 text-right">{l.soKg}</td>
                <td className="p-2 text-right opacity-60">{l.truocKg}</td>
                <td className="p-2 text-right opacity-60">{l.sauKg}</td>
                <td className="p-2 text-xs">{l.nguoiThucHien}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ TRUY NGƯỢC LÔ ============
function TruyNguoc() {
  const [ltps, setLtps] = useState<LoVaiTP[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [trace, setTrace] = useState<any>(null);

  useEffect(() => { setLtps(getAllLoVaiTP()); }, []);

  const handleTruyNguoc = () => {
    if (!selected) return;
    const r = truyNguocLo(selected);
    setTrace(r);
  };

  return (
    <div className="card p-4 space-y-3">
      <h3 className="font-bold text-lg flex items-center gap-2">
        <Link2 className="w-5 h-5 text-blue-500" /> 🔍 Truy ngược lô (Traceability)
      </h3>
      <p className="text-xs opacity-70">Vải TP → Mẻ nhuộm → Vải mộc → Lệnh dệt → Lô sợi → NCC</p>

      <div className="flex gap-2">
        <select value={selected} onChange={(e) => setSelected(e.target.value)} className="flex-1 px-3 py-2 rounded border">
          <option value="">-- Chọn lô vải TP --</option>
          {ltps.map((l) => <option key={l.id} value={l.id}>{l.maLo} - {l.mau} ({l.tongKg}kg)</option>)}
        </select>
        <button onClick={handleTruyNguoc} className="btn-primary bg-blue-500">
          <Search className="w-3.5 h-3.5 inline" /> Truy ngược
        </button>
      </div>

      {trace && (
        <div className="space-y-2 mt-3">
          {[
            { l: "1. Lô vải TP", data: trace.loVaiTP, color: "emerald" },
            { l: "2. Phiếu nghiệm thu vải màu", data: trace.phieuNghiemThuMau, color: "pink" },
            { l: "3. Mẻ nhuộm", data: trace.meNhuom, color: "rose" },
            { l: "4. Lô vải mộc", data: trace.loMoc, color: "fuchsia" },
            { l: "5. Lệnh dệt", data: trace.lenhDet, color: "violet" },
            { l: "6. Lô sợi", data: trace.loSoi, color: "indigo" },
            { l: "7. Phiếu nhập sợi", data: trace.phieuNhapSoi, color: "blue" },
          ].map((step, i) => (
            <div key={i} className={`p-3 rounded border border-${step.color}-500/30 bg-${step.color}-500/5`}>
              <div className={`text-xs font-semibold mb-1 text-${step.color}-700`}>{step.l}</div>
              <pre className="text-[10px] overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(step.data, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FormulaBlock({ label, formula, value, color }: any) {
  const colors: Record<string, string> = {
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-700",
    emerald: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700",
    rose: "bg-rose-100 dark:bg-rose-900/30 text-rose-700",
  };
  return (
    <div className={`p-2 rounded ${colors[color]}`}>
      <div className="text-[10px] opacity-70">{label}</div>
      <div className="text-[10px] opacity-60 mb-1">{formula}</div>
      <div className="text-base font-bold">{value}</div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: any; onChange: (v: any) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs font-semibold opacity-70">{label}</label>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(type === "number" ? (e.target.value === "" ? 0 : Number(e.target.value)) : e.target.value)}
        className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
      />
    </div>
  );
}
