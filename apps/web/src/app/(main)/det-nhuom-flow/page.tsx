"use client";

import { useState, useEffect } from "react";
import {
  Package, Truck, Palette, Boxes, ChevronRight, Plus, Save, ArrowRight,
  TrendingDown, DollarSign, Factory, AlertCircle, CheckCircle2, Eye,
  Clock, Layers, Link2, Sparkles, BarChart3, FileText, GitBranch,
  ChevronLeft, RefreshCw, X, Search, Filter, Lock,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/components/session-provider";
import {
  nhapKhoSoi_V2, taoLenhDet, capNhatTrangThaiLenhDet, nghiemThuDet_V2,
  taoMeNhuom, nghiemThuMau_V2, nhapKhoVaiTP,
  getAllPhieuNhapSoi, getAllLenhDet, getAllMeNhuom, getAllPhieuNghiemThuMau,
  getAllLoVaiTP,
  type PhieuNhapSoi, type LenhDet, type MeNhuom, type NghiemThuMau, type LoVaiTP,
} from "@/lib/yarn-production-chain";
import {
  buildMeSoiTongQuan, getQCMeSoi,
  type MeSoiTongQuan,
} from "@/lib/yarn-me-soi-engine";
import { truyNguocLo } from "@/lib/yarn-production-chain";
import { formatVNDShort } from "@/lib/data/real-data";

type Screen =
  | "dashboard"
  | "1-nhapkho"        // Màn 1
  | "2-khosoi"          // Màn 2
  | "3-xuatdet"         // Màn 3
  | "4-theodoidet"      // Màn 4
  | "5-nghiemthumoc"    // Màn 5
  | "6-khomoc"          // Màn 6
  | "7-xuatnhuom"       // Màn 7
  | "8-theodoinhuom"    // Màn 8
  | "9-nghiemthumau"    // Màn 9
  | "10-khotp"          // Màn 10
  | "11-baocao";        // Màn 11

const SCREENS: { key: Screen; n: number; label: string; icon: any; color: string; group: string }[] = [
  { key: "dashboard", n: 0, label: "Dashboard", icon: BarChart3, color: "slate", group: "Tổng" },
  { key: "1-nhapkho", n: 1, label: "Nhập kho sợi", icon: Package, color: "blue", group: "Kho sợi" },
  { key: "2-khosoi", n: 2, label: "Kho sợi", icon: Layers, color: "blue", group: "Kho sợi" },
  { key: "3-xuatdet", n: 3, label: "Xuất sợi đi dệt", icon: Truck, color: "violet", group: "Dệt" },
  { key: "4-theodoidet", n: 4, label: "Theo dõi lệnh dệt", icon: Clock, color: "violet", group: "Dệt" },
  { key: "5-nghiemthumoc", n: 5, label: "Nghiệm thu vải mộc", icon: CheckCircle2, color: "purple", group: "Dệt" },
  { key: "6-khomoc", n: 6, label: "Kho vải mộc", icon: Layers, color: "purple", group: "Kho mộc" },
  { key: "7-xuatnhuom", n: 7, label: "Xuất vải mộc đi nhuộm", icon: Palette, color: "rose", group: "Nhuộm" },
  { key: "8-theodoinhuom", n: 8, label: "Theo dõi mẻ nhuộm", icon: Clock, color: "rose", group: "Nhuộm" },
  { key: "9-nghiemthumau", n: 9, label: "Nghiệm thu vải màu", icon: CheckCircle2, color: "pink", group: "Nhuộm" },
  { key: "10-khotp", n: 10, label: "Kho vải thành phẩm", icon: Boxes, color: "emerald", group: "Kho TP" },
  { key: "11-baocao", n: 11, label: "Báo cáo", icon: FileText, color: "amber", group: "Báo cáo" },
];

export default function DetNhuomFlowPage() {
  const { user } = useSession();
  const [screen, setScreen] = useState<Screen>("dashboard");

  // Group screens
  const groups = SCREENS.reduce((acc: Record<string, typeof SCREENS>, s) => {
    if (!acc[s.group]) acc[s.group] = [];
    acc[s.group].push(s);
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto space-y-3 animate-fade-in">
      {/* Header */}
      <div className="card p-3 bg-gradient-to-r from-blue-500/10 via-violet-500/10 via-rose-500/10 to-emerald-500/10">
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <Factory className="w-6 h-6 text-blue-500" /> DỆT - NHUỘM: Flow 11 màn ERP chuẩn
        </h1>
        <p className="opacity-70 text-xs">
          Mỗi màn 1 hành động chính · Tuân thủ quy trình · Từ Nhập sợi → Kho TP → Báo cáo
        </p>
      </div>

      {/* Tab nav theo nhóm */}
      <div className="card p-2 space-y-2">
        {Object.entries(groups).map(([gName, gScreens]) => (
          <div key={gName} className="flex flex-wrap items-center gap-1">
            <span className="text-[10px] font-bold opacity-60 w-20 shrink-0">{gName}:</span>
            {gScreens.map((s) => {
              const Icon = s.icon;
              const isActive = screen === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  className={`text-[10px] md:text-xs px-2 py-1 rounded flex items-center gap-1 ${
                    isActive ? `bg-${s.color}-500 text-white` : `bg-${s.color}-500/20 text-${s.color}-700 hover:bg-${s.color}-500/30`
                  }`}
                >
                  {s.n > 0 && <span className="font-bold">{s.n}.</span>}
                  <Icon className="w-3 h-3" /> {s.label}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Active screen */}
      <div className="card p-4">
        {screen === "dashboard" && <Dashboard user={user} goTo={setScreen} />}
        {screen === "1-nhapkho" && <Screen1_NhapKho user={user} />}
        {screen === "2-khosoi" && <Screen2_KhoSoi user={user} />}
        {screen === "3-xuatdet" && <Screen3_XuatDet user={user} />}
        {screen === "4-theodoidet" && <Screen4_TheoDoiDet user={user} />}
        {screen === "5-nghiemthumoc" && <Screen5_NghiemThuMoc user={user} />}
        {screen === "6-khomoc" && <Screen6_KhoMoc user={user} />}
        {screen === "7-xuatnhuom" && <Screen7_XuatNhuom user={user} />}
        {screen === "8-theodoinhuom" && <Screen8_TheoDoiNhuom user={user} />}
        {screen === "9-nghiemthumau" && <Screen9_NghiemThuMau user={user} />}
        {screen === "10-khotp" && <Screen10_KhoTP user={user} />}
        {screen === "11-baocao" && <Screen11_BaoCao user={user} />}
      </div>

      {/* Footer flow indicator */}
      <FlowIndicator current={screen} />
    </div>
  );
}

// ============ FLOW INDICATOR ============
function FlowIndicator({ current }: { current: Screen }) {
  const currentN = SCREENS.find((s) => s.key === current)?.n || 0;
  if (currentN === 0) return null;
  return (
    <div className="card p-2 sticky bottom-2 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur">
      <div className="flex items-center gap-0.5 text-[10px] overflow-x-auto">
        {SCREENS.filter((s) => s.n > 0).map((s, i, arr) => {
          const Icon = s.icon;
          const done = s.n < currentN;
          const active = s.n === currentN;
          return (
            <span key={s.key} className="flex items-center">
              <span
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${
                  done ? "bg-emerald-500 text-white" :
                  active ? `bg-${s.color}-500 text-white` : "bg-slate-200 dark:bg-slate-700 opacity-50"
                }`}
              >
                {done ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Icon className="w-2.5 h-2.5" />}
                <span className="hidden md:inline whitespace-nowrap">{s.n}. {s.label}</span>
                <span className="md:hidden">{s.n}</span>
              </span>
              {i < arr.length - 1 && <ChevronRight className="w-3 h-3 opacity-40" />}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ============ DASHBOARD ============
function Dashboard({ user, goTo }: any) {
  const [pnss, setPnss] = useState(getAllPhieuNhapSoi());
  const [lds, setLds] = useState(getAllLenhDet());
  const [mns, setMns] = useState(getAllMeNhuom());
  const [ltps, setLtps] = useState(getAllLoVaiTP());

  const refresh = () => {
    setPnss(getAllPhieuNhapSoi());
    setLds(getAllLenhDet());
    setMns(getAllMeNhuom());
    setLtps(getAllLoVaiTP());
  };
  useEffect(() => { refresh(); }, []);

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold flex items-center gap-2">
        <BarChart3 className="w-5 h-5" /> Dashboard - Tổng quan 11 bước
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Stat n={pnss.length} label="Phiếu nhập sợi" sub={formatVNDShort(pnss.reduce((s, p) => s + p.thanhTien, 0))} color="blue" />
        <Stat n={lds.length} label="Lệnh dệt" sub={`${lds.filter((l) => l.trangThai !== "Hoàn thành").length} đang chạy`} color="violet" />
        <Stat n={mns.length} label="Mẻ nhuộm" sub={`${mns.filter((m) => m.trangThai !== "Hoàn thành").length} đang nhuộm`} color="rose" />
        <Stat n={ltps.length} label="Lô vải TP" sub={`${ltps.reduce((s, l) => s + l.tongKg, 0).toFixed(0)}kg`} color="emerald" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {SCREENS.filter((s) => s.n > 0).map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.key}
              onClick={() => goTo(s.key)}
              className={`card p-3 text-left hover:scale-[1.02] transition bg-${s.color}-500/5 border-${s.color}-500/30`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold bg-${s.color}-500`}>
                    {s.n}
                  </span>
                  <div>
                    <div className="font-semibold text-sm">{s.label}</div>
                    <div className="text-[10px] opacity-60">{s.group}</div>
                  </div>
                </div>
                <Icon className={`w-5 h-5 text-${s.color}-500`} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ n, label, sub, color }: any) {
  const colors: Record<string, string> = {
    blue: "from-blue-500/10 to-cyan-500/10",
    violet: "from-violet-500/10 to-purple-500/10",
    rose: "from-rose-500/10 to-pink-500/10",
    emerald: "from-emerald-500/10 to-green-500/10",
  };
  return (
    <div className={`card p-2 bg-gradient-to-br ${colors[color]}`}>
      <div className="text-xs opacity-70">{label}</div>
      <div className="text-2xl font-bold">{n}</div>
      <div className="text-[10px] opacity-60">{sub}</div>
    </div>
  );
}

// ============ MÀN 1 — NHẬP KHO SỢI ============
function Screen1_NhapKho({ user }: any) {
  const [ncc, setNcc] = useState("Cty Sợi Việt Nam");
  const [loaiSoi, setLoaiSoi] = useState("Cotton 32s");
  const [maLo, setMaLo] = useState("A001");
  const [soKg, setSoKg] = useState(520);
  const [donGia, setDonGia] = useState(130000);
  const [daThanhToan, setDaThanhToan] = useState(0);
  const [ngayNhap, setNgayNhap] = useState(new Date().toISOString().slice(0, 10));
  const [list, setList] = useState<PhieuNhapSoi[]>([]);

  useEffect(() => { setList(getAllPhieuNhapSoi()); }, []);

  const thanhTien = soKg * donGia;
  const congNo = thanhTien - daThanhToan;

  const handleLuu = (xuatDiDet: boolean) => {
    const r = nhapKhoSoi_V2({
      ngayNhap, nccId: ncc, tenNCC: ncc,
      loaiSoi: `SOI-${loaiSoi.replace(/\s/g, "")}`, tenSoi: `Sợi ${loaiSoi}`,
      maLoSoi: maLo, soKg, donGia, daThanhToan,
      khoNhap: "Kho Sợi", nguoiPhuTrach: user?.name || "Kho sợi",
      ghiChu: xuatDiDet ? "Nhập + xuất đi dệt ngay" : "", khoa: false,
    } as any, user);
    if (r.ok) {
      toast.success(r.message);
      setList(getAllPhieuNhapSoi());
      if (xuatDiDet) {
        // Trigger chuyển sang Màn 3
        setTimeout(() => {
          toast.info("💡 Chuyển sang Màn 3: Xuất sợi đi dệt");
          window.location.hash = "3-xuatdet";
        }, 500);
      }
    } else toast.error(r.message);
  };

  return (
    <div className="space-y-3">
      <Header n={1} title="Nhập kho sợi" subtitle="Tăng tồn kho + Tăng công nợ NCC" color="blue" />

      <div className="card p-4 bg-blue-50 dark:bg-blue-900/20 max-w-2xl mx-auto">
        <div className="space-y-2">
          <F label="Nhà cung cấp" v={ncc} on={setNcc} />
          <F label="Loại sợi" v={loaiSoi} on={setLoaiSoi} />
          <F label="Mã lô" v={maLo} on={setMaLo} />
          <F label="Số kg" v={soKg} on={setSoKg} type="number" />
          <F label="Đơn giá (VNĐ/kg)" v={donGia} on={setDonGia} type="number" />
          <F label="Đã thanh toán" v={daThanhToan} on={setDaThanhToan} type="number" />
          <F label="Ngày nhập" v={ngayNhap} on={setNgayNhap} type="date" />
        </div>

        <div className="mt-3 p-3 rounded bg-white dark:bg-slate-800 space-y-1 text-sm">
          <FormulaBlock label="Thành tiền" formula={`${soKg} × ${donGia.toLocaleString()}`} value={thanhTien.toLocaleString() + "đ"} />
          <FormulaBlock label="Công nợ NCC" formula={`${thanhTien.toLocaleString()} - ${daThanhToan.toLocaleString()}`} value={congNo.toLocaleString() + "đ"} highlight />
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <button onClick={() => handleLuu(false)} className="btn-primary bg-blue-500">
            <Save className="w-3.5 h-3.5 inline" /> Lưu
          </button>
          <button onClick={() => handleLuu(true)} className="btn-primary bg-blue-600">
            <Save className="w-3.5 h-3.5 inline" /> Lưu & Xuất đi dệt
          </button>
        </div>
      </div>

      <div className="text-xs opacity-60 text-center">
        💡 Sau khi lưu: Kho sợi tăng {soKg}kg · Công nợ NCC tăng {congNo.toLocaleString()}đ
      </div>

      <div className="card p-3 max-w-4xl mx-auto">
        <h4 className="font-semibold text-sm mb-2">📋 Lịch sử nhập ({list.length})</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800">
              <tr>
                <th className="p-2 text-left">Mã phiếu</th>
                <th className="p-2 text-left">Lô</th>
                <th className="p-2 text-left">Sợi</th>
                <th className="p-2 text-right">Kg</th>
                <th className="p-2 text-right">Thành tiền</th>
                <th className="p-2 text-right">Còn nợ</th>
              </tr>
            </thead>
            <tbody>
              {list.slice(0, 5).map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-2 font-mono">{p.id}</td>
                  <td className="p-2 font-mono">{p.maLoSoi}</td>
                  <td className="p-2">{p.tenSoi}</td>
                  <td className="p-2 text-right">{p.soKg}kg</td>
                  <td className="p-2 text-right font-semibold">{(p.thanhTien / 1_000_000).toFixed(2)}tr</td>
                  <td className="p-2 text-right text-rose-600">{(p.conCongNo / 1_000_000).toFixed(2)}tr</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============ MÀN 2 — KHO SỢI ============
function Screen2_KhoSoi({ user }: any) {
  const [loSois, setLoSois] = useState<any[]>([]);
  useEffect(() => { setLoSois(JSON.parse(localStorage.getItem("mimin_lo_soi") || "[]")); }, []);

  return (
    <div className="space-y-3">
      <Header n={2} title="Kho sợi" subtitle="Tồn kho theo lô" color="blue" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-w-5xl mx-auto">
        {loSois.map((l) => (
          <div key={l.id} className="card p-3 bg-blue-50 dark:bg-blue-900/20">
            <div className="font-bold text-sm">{l.tenSoi}</div>
            <div className="text-3xl font-bold text-blue-600 mt-1">{l.soKgConLai} kg</div>
            <div className="text-xs opacity-70">Lot {l.maLoSoi}</div>
            <div className="mt-2 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                style={{ width: `${(l.soKgConLai / l.soKgBanDau) * 100}%` }} />
            </div>
            <div className="text-[10px] opacity-60 mt-1">NCC: {l.nhaCungCap}</div>
            <button
              onClick={() => { window.location.hash = "3-xuatdet"; }}
              className="btn-primary text-xs w-full mt-2 bg-blue-500"
            >
              <Truck className="w-3 h-3 inline" /> Cấp cho dệt →
            </button>
          </div>
        ))}
        {loSois.length === 0 && (
          <div className="col-span-3 text-center text-sm opacity-60 py-8">
            Kho sợi trống. Về Màn 1 để nhập.
          </div>
        )}
      </div>
    </div>
  );
}

// ============ MÀN 3 — XUẤT SỢI ĐI DỆT ============
function Screen3_XuatDet({ user }: any) {
  const [lds, setLds] = useState(getAllLenhDet());
  const [loSois] = useState(() => JSON.parse(localStorage.getItem("mimin_lo_soi") || "[]"));
  const [xuongDet, setXuongDet] = useState("DNT Dệt Bắc Ninh");
  const [loSoi, setLoSoi] = useState(loSois[0]?.maLoSoi || "");
  const [kgXuat, setKgXuat] = useState(500);
  const [donGiaDet, setDonGiaDet] = useState(8000);
  const [ngayGiao, setNgayGiao] = useState(new Date().toISOString().slice(0, 10));
  const [ngayNhan, setNgayNhan] = useState(new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10));

  useEffect(() => { setLds(getAllLenhDet()); }, []);

  const tienDet = kgXuat * donGiaDet;

  const handleXacNhan = () => {
    const lo = loSois.find((l: any) => l.maLoSoi === loSoi);
    const r = taoLenhDet({
      ngayGiao, ngayDuKienNhan: ngayNhan, xuongDet,
      maLoSoi: loSoi, loaiSoi: lo?.tenSoi || "",
      soKgGiao: kgXuat, donGiaDet, tienDuKien: kgXuat * donGiaDet, soMetDuKien: kgXuat * 4, nguoiPhuTrach: user?.name || "Xưởng dệt", ghiChu: "",
    }, user);
    if (r.ok) {
      toast.success(r.message);
      setLds(getAllLenhDet());
    } else toast.error(r.message);
  };

  return (
    <div className="space-y-3">
      <Header n={3} title="Xuất sợi đi dệt" subtitle="Giảm kho sợi + Sinh lệnh dệt" color="violet" />

      <div className="card p-4 bg-violet-50 dark:bg-violet-900/20 max-w-2xl mx-auto">
        <h3 className="font-bold mb-2">📋 Tạo lệnh dệt</h3>
        <div className="space-y-2">
          <div>
            <label className="text-xs font-semibold">Nhà gia công dệt</label>
            <select value={xuongDet} onChange={(e) => setXuongDet(e.target.value)} className="w-full px-3 py-2 rounded border">
              <option>DNT Dệt Bắc Ninh</option>
              <option>DNT Dệt Thái Bình</option>
              <option>DNT Dệt Hà Nội</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold">Lô sợi xuất</label>
            <select value={loSoi} onChange={(e) => setLoSoi(e.target.value)} className="w-full px-3 py-2 rounded border">
              {loSois.map((l: any) => <option key={l.maLoSoi} value={l.maLoSoi}>{l.tenSoi} - {l.maLoSoi} ({l.soKgConLai}kg)</option>)}
            </select>
          </div>
          <F label="Kg xuất" v={kgXuat} on={setKgXuat} type="number" />
          <F label="Đơn giá dệt (VNĐ/kg)" v={donGiaDet} on={setDonGiaDet} type="number" />
          <F label="Ngày giao" v={ngayGiao} on={setNgayGiao} type="date" />
          <F label="Ngày dự kiến nhận" v={ngayNhan} on={setNgayNhan} type="date" />
        </div>

        <div className="mt-3 p-3 rounded bg-white dark:bg-slate-800 text-sm">
          <strong>Phí dệt:</strong> {kgXuat}kg × {donGiaDet.toLocaleString()}đ = <strong className="text-violet-600">{tienDet.toLocaleString()}đ</strong>
        </div>

        <button onClick={handleXacNhan} className="btn-primary w-full mt-3 bg-violet-500">
          ✅ Xác nhận xuất kho
        </button>
      </div>

      <div className="text-xs opacity-60 text-center">
        💡 Sau khi xác nhận: Kho sợi giảm {kgXuat}kg · Sinh lệnh dệt mới
      </div>
    </div>
  );
}

// ============ MÀN 4 — THEO DÕI LỆNH DỆT ============
function Screen4_TheoDoiDet({ user }: any) {
  const [lds, setLds] = useState(getAllLenhDet());
  useEffect(() => { setLds(getAllLenhDet()); }, []);

  return (
    <div className="space-y-3">
      <Header n={4} title="Theo dõi lệnh dệt" subtitle="Tiến độ 7 trạng thái" color="violet" />

      <div className="space-y-2 max-w-4xl mx-auto">
        {lds.map((l) => {
          const progress = l.trangThai === "Hoàn thành" ? 100 :
            l.trangThai === "Chờ nghiệm thu" ? 90 :
            l.trangThai === "Đang dệt" ? 75 :
            l.trangThai === "Đã giao sợi" ? 25 : 0;
          return (
            <div key={l.id} className="card p-3">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <div className="font-mono font-bold text-sm">{l.id}</div>
                  <div className="text-xs opacity-70">{l.xuongDet}</div>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-violet-500 text-white">{l.trangThai}</span>
              </div>
              <div className="mt-2 bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all"
                  style={{ width: `${progress}%` }} />
              </div>
              <div className="text-xs mt-1 text-right opacity-70">{progress}%</div>
              <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                <div>Kg giao: <strong>{l.soKgGiao}</strong></div>
                <div>Ngày giao: <strong>{l.ngayGiao}</strong></div>
                <div>Ngày dự kiến: <strong>{l.ngayDuKienNhan}</strong></div>
              </div>
              <select
                value={l.trangThai}
                onChange={(e) => {
                  capNhatTrangThaiLenhDet(l.id, e.target.value as any, user);
                  setLds(getAllLenhDet());
                }}
                className="text-xs mt-2 w-full px-2 py-1 rounded border"
              >
                {["Nháp", "Đã giao sợi", "Đang dệt", "Chờ nghiệm thu", "Hoàn thành", "Hủy"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          );
        })}
        {lds.length === 0 && <div className="text-center text-sm opacity-60 py-8">Chưa có lệnh dệt nào</div>}
      </div>
    </div>
  );
}

// ============ MÀN 5 — NGHIỆM THU VẢI MỘC ============
function Screen5_NghiemThuMoc({ user }: any) {
  const [lds, setLds] = useState(getAllLenhDet().filter((l) => l.trangThai !== "Hoàn thành" && l.trangThai !== "Hủy"));
  useEffect(() => { setLds(getAllLenhDet().filter((l) => l.trangThai !== "Hoàn thành" && l.trangThai !== "Hủy")); }, []);

  return (
    <div className="space-y-3">
      <Header n={5} title="Nghiệm thu vải mộc" subtitle="Tính hao hụt + Nhập kho mộc + Tạo công nợ xưởng" color="purple" />

      <div className="space-y-2 max-w-3xl mx-auto">
        {lds.map((l) => (
          <div key={l.id} className="card p-3 bg-purple-50 dark:bg-purple-900/20">
            <div className="font-mono font-bold text-sm">{l.id} - {l.xuongDet}</div>
            <div className="text-xs opacity-80 mt-1">Đã giao {l.soKgGiao}kg sợi · Đơn giá {l.donGiaDet.toLocaleString()}đ/kg</div>
            <button
              onClick={() => {
                const kg = parseInt(prompt(`Kg vải mộc nhận cho ${l.id} (giao ${l.soKgGiao}kg):`, String(Math.floor(l.soKgGiao * 0.92))) || "0");
                if (kg > 0) {
                  const cay = parseInt(prompt("Số cây:", String(Math.floor(kg / 20))) || "0");
                  const loi = parseInt(prompt("Kg lỗi:", "0") || "0");
                  const ps = parseInt(prompt("Chi phí phát sinh:", "0") || "0");
                  const daTra = parseInt(prompt("Đã thanh toán:", "0") || "0");
                  const r = nghiemThuDet_V2(l.id, {
                    soKgMocNhan: kg, soCayMoc: cay, soKgLoi: loi,
                    chiPhiPhatSinh: ps, daThanhToan: daTra,
                    khoMocNhap: "Kho Vải Mộc", ketQuaKiemTra: "Đạt",
                  }, user);
                  if (r.ok) {
                    toast.success(`${r.message} | Hao hụt ${r.haoHutPt.toFixed(1)}%`);
                    setLds(getAllLenhDet().filter((x) => x.trangThai !== "Hoàn thành" && x.trangThai !== "Hủy"));
                  } else toast.error(r.message);
                }
              }}
              className="btn-primary w-full mt-2 bg-purple-500"
            >
              ✅ Nghiệm thu & Nhập kho
            </button>
          </div>
        ))}
        {lds.length === 0 && <div className="text-center text-sm opacity-60 py-8">Không có lệnh dệt chờ nghiệm thu</div>}
      </div>
    </div>
  );
}

// ============ MÀN 6 — KHO VẢI MỘC ============
function Screen6_KhoMoc({ user }: any) {
  const [list, setList] = useState<any[]>([]);
  useEffect(() => { setList(JSON.parse(localStorage.getItem("mimin_lo_moc") || "[]")); }, []);

  return (
    <div className="space-y-3">
      <Header n={6} title="Kho vải mộc" subtitle="Tồn kho vải mộc" color="purple" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-w-5xl mx-auto">
        {list.map((l) => (
          <div key={l.id} className="card p-3 bg-purple-50 dark:bg-purple-900/20">
            <div className="font-bold text-sm">{l.loaiVai}</div>
            <div className="text-3xl font-bold text-purple-600 mt-1">{l.soKg} kg</div>
            <div className="text-xs opacity-70">{l.soCay} cây · Lot {l.maLoMoc}</div>
            <div className="text-[10px] opacity-60 mt-1">Từ: {l.maLenhDet}</div>
            <span className="text-[10px] px-1.5 py-0.5 rounded text-white bg-blue-500 mt-1 inline-block">{l.trangThai}</span>
            <button
              onClick={() => { window.location.hash = "7-xuatnhuom"; }}
              className="btn-primary text-xs w-full mt-2 bg-rose-500"
            >
              <Palette className="w-3 h-3 inline" /> Vào nhuộm →
            </button>
          </div>
        ))}
        {list.length === 0 && <div className="col-span-3 text-center text-sm opacity-60 py-8">Kho mộc trống</div>}
      </div>
    </div>
  );
}

// ============ MÀN 7 — XUẤT VẢI MỘC ĐI NHUỘM ============
function Screen7_XuatNhuom({ user }: any) {
  const [loMocs] = useState(() => JSON.parse(localStorage.getItem("mimin_lo_moc") || "[]"));
  const [xuong, setXuong] = useState("Cty Nhuộm Hà Đông");
  const [loMoc, setLoMoc] = useState(loMocs[0]?.maLoMoc || "");
  const [danhSachMau, setDanhSachMau] = useState([
    { mau: "Đen", soKg: 200, donGiaNhuom: 15000 },
    { mau: "Trắng", soKg: 150, donGiaNhuom: 12000 },
    { mau: "Navy", soKg: 135, donGiaNhuom: 14000 },
  ]);
  const [ngayGiao, setNgayGiao] = useState(new Date().toISOString().slice(0, 10));

  const tongKg = danhSachMau.reduce((s, m) => s + m.soKg, 0);

  const handleTao = () => {
    if (!loMoc) { toast.error("Chọn lô mộc"); return; }
    const r = taoMeNhuom({
      ngayGiao, ngayDuKienNhan: new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10),
      xuongNhuom: xuong, maLoMoc: loMoc, nguoiPhuTrach: user?.name || "Xưởng nhuộm",
      ghiChu: "", danhSachMau,
    } as any, user);
    if (r.ok) toast.success(r.message);
    else toast.error(r.message);
  };

  return (
    <div className="space-y-3">
      <Header n={7} title="Xuất vải mộc đi nhuộm" subtitle="Tạo mẻ nhuộm (1 mẻ nhiều màu)" color="rose" />

      <div className="card p-4 bg-rose-50 dark:bg-rose-900/20 max-w-2xl mx-auto">
        <h3 className="font-bold mb-2">🎨 Tạo mẻ nhuộm</h3>
        <div className="space-y-2">
          <F label="Xưởng" v={xuong} on={setXuong} />
          <div>
            <label className="text-xs font-semibold">Lô vải mộc</label>
            <select value={loMoc} onChange={(e) => setLoMoc(e.target.value)} className="w-full px-3 py-2 rounded border">
              {loMocs.map((l: any) => <option key={l.maLoMoc} value={l.maLoMoc}>{l.loaiVai} - {l.maLoMoc} ({l.soKg}kg)</option>)}
            </select>
          </div>
          <F label="Ngày giao" v={ngayGiao} on={setNgayGiao} type="date" />
        </div>

        <div className="mt-3 p-3 rounded bg-white dark:bg-slate-800">
          <div className="font-semibold text-sm mb-1">Danh sách màu:</div>
          {danhSachMau.map((m, i) => (
            <div key={i} className="grid grid-cols-4 gap-1 mb-1 text-xs">
              <input value={m.mau} onChange={(e) => {
                const newM = [...danhSachMau];
                newM[i] = { ...m, mau: e.target.value };
                setDanhSachMau(newM);
              }} className="px-2 py-1 rounded border" />
              <input type="number" value={m.soKg} onChange={(e) => {
                const newM = [...danhSachMau];
                newM[i] = { ...m, soKg: Number(e.target.value) };
                setDanhSachMau(newM);
              }} className="px-2 py-1 rounded border text-right" />
              <input type="number" value={m.donGiaNhuom} onChange={(e) => {
                const newM = [...danhSachMau];
                newM[i] = { ...m, donGiaNhuom: Number(e.target.value) };
                setDanhSachMau(newM);
              }} className="px-2 py-1 rounded border text-right" />
              <div className="flex items-center justify-end opacity-70">{(m.soKg * m.donGiaNhuom).toLocaleString()}đ</div>
            </div>
          ))}
          <button onClick={() => setDanhSachMau([...danhSachMau, { mau: "Mới", soKg: 0, donGiaNhuom: 10000 }])} className="text-xs text-blue-600">+ Thêm màu</button>
        </div>

        <div className="mt-3 p-3 rounded bg-white dark:bg-slate-800 text-sm">
          <strong>Tổng:</strong> {tongKg}kg
        </div>

        <button onClick={handleTao} className="btn-primary w-full mt-3 bg-rose-500">
          🎨 Giao nhuộm
        </button>
      </div>

      <div className="text-xs opacity-60 text-center">
        💡 Sau khi giao: Kho mộc giảm {tongKg}kg · Sinh mẻ nhuộm với {danhSachMau.length} màu
      </div>
    </div>
  );
}

// ============ MÀN 8 — THEO DÕI MẺ NHUỘM ============
function Screen8_TheoDoiNhuom({ user }: any) {
  const [mns, setMns] = useState(getAllMeNhuom());
  useEffect(() => { setMns(getAllMeNhuom()); }, []);

  return (
    <div className="space-y-3">
      <Header n={8} title="Theo dõi mẻ nhuộm" subtitle="Tiến độ từng màu" color="rose" />

      <div className="space-y-2 max-w-4xl mx-auto">
        {mns.map((m) => {
          const progress = m.trangThai === "Hoàn thành" ? 100 : 65;
          return (
            <div key={m.id} className="card p-3">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <div className="font-mono font-bold text-sm">{m.id}</div>
                  <div className="text-xs opacity-70">{m.xuongNhuom} · Tổng {m.tongKgXuat}kg</div>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-rose-500 text-white">{m.trangThai}</span>
              </div>
              <div className="mt-2 bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-rose-500 to-pink-500" style={{ width: `${progress}%` }} />
              </div>
              <div className="text-xs mt-1 text-right opacity-70">{progress}%</div>

              <div className="mt-2 space-y-1">
                {m.danhSachMau.map((x) => (
                  <div key={x.mau} className="flex items-center justify-between p-1.5 rounded bg-rose-50 dark:bg-rose-900/20 text-xs">
                    <span><strong>{x.mau}</strong> - {x.soKg}kg</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded text-white ${
                      m.trangThai === "Hoàn thành" ? "bg-emerald-500" : "bg-blue-500"
                    }`}>
                      {m.trangThai === "Hoàn thành" ? "Hoàn thành" : "Đang nhuộm"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {mns.length === 0 && <div className="text-center text-sm opacity-60 py-8">Chưa có mẻ nhuộm</div>}
      </div>
    </div>
  );
}

// ============ MÀN 9 — NGHIỆM THU VẢI MÀU ============
function Screen9_NghiemThuMau({ user }: any) {
  const [mns, setMns] = useState(getAllMeNhuom().filter((m) => m.trangThai !== "Hoàn thành"));
  useEffect(() => { setMns(getAllMeNhuom().filter((m) => m.trangThai !== "Hoàn thành")); }, []);

  return (
    <div className="space-y-3">
      <Header n={9} title="Nghiệm thu vải màu" subtitle="Từng màu riêng + Tính giá vốn" color="pink" />

      <div className="space-y-3 max-w-4xl mx-auto">
        {mns.map((m) => (
          <div key={m.id} className="card p-3 bg-pink-50 dark:bg-pink-900/20">
            <div className="font-mono font-bold text-sm mb-2">{m.id} - {m.xuongNhuom}</div>
            <div className="space-y-2">
              {m.danhSachMau.map((x, i) => (
                <div key={x.mau} className="p-2 rounded bg-white dark:bg-slate-800 text-xs">
                  <div className="font-semibold text-sm mb-1">Màu {x.mau}</div>
                  <div className="grid grid-cols-2 gap-1">
                    <div>Kg giao: <strong>{x.soKg}kg</strong></div>
                    <div>Đơn giá: <strong>{x.donGiaNhuom.toLocaleString()}đ/kg</strong></div>
                  </div>
                  <button
                    onClick={() => {
                      const kgNhan = parseInt(prompt(`${x.mau}: Kg vải màu nhận:`, String(Math.floor(x.soKg * 0.95))) || "0");
                      if (kgNhan > 0) {
                        const cay = parseInt(prompt("Số cây:", String(Math.floor(kgNhan / 20))) || "0");
                        const hc = parseInt(prompt("Hóa chất:", "1200000") || "0");
                        const ds: NghiemThuMau[] = [{
                          mau: x.mau, soKgMocGiao: x.soKg, soKgMauNhan: kgNhan,
                          soCayNhan: cay, soKgLoi: 0, donGiaNhuom: x.donGiaNhuom,
                          chiPhiHoaChat: hc, chiPhiHoanThien: 0, chiPhiPhatSinh: 0, daThanhToan: 0,
                        }];
                        const r = nghiemThuMau_V2(m.id, ds, user?.name || "system", user);
                        if (r.ok) {
                          toast.success(r.message);
                          setMns(getAllMeNhuom().filter((x) => x.trangThai !== "Hoàn thành"));
                        } else toast.error(r.message);
                      }
                    }}
                    className="btn-primary text-xs w-full mt-2 bg-pink-500"
                  >
                    ✅ Nghiệm thu {x.mau}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
        {mns.length === 0 && <div className="text-center text-sm opacity-60 py-8">Không có mẻ nhuộm chờ nghiệm thu</div>}
      </div>
    </div>
  );
}

// ============ MÀN 10 — KHO VẢI THÀNH PHẨM ============
function Screen10_KhoTP({ user }: any) {
  const [ltps, setLtps] = useState<LoVaiTP[]>([]);
  const [showTrace, setShowTrace] = useState<string | null>(null);

  useEffect(() => { setLtps(getAllLoVaiTP()); }, []);

  return (
    <div className="space-y-3">
      <Header n={10} title="Kho vải thành phẩm" subtitle="Click vào lô để xem nguồn gốc" color="emerald" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-w-5xl mx-auto">
        {ltps.map((l: any) => {
          return (
          <div
            key={l.id}
            onClick={() => setShowTrace(showTrace === l.id ? null : l.id)}
            className="card p-3 bg-emerald-50 dark:bg-emerald-900/20 text-left cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="font-bold text-sm">{l.loaiVai} - {l.mau}</div>
              <Lock className="w-3 h-3 text-rose-500" />
            </div>
            <div className="text-3xl font-bold text-emerald-600 mt-1">{l.tongKg.toFixed(0)} kg</div>
            <div className="text-xs opacity-70">{l.danhSachCay.length} cây</div>
            <div className="text-sm font-bold text-emerald-600 mt-1">{l.giaVonPerKg.toFixed(0)}đ/kg</div>
            <div className="text-[10px] opacity-60 mt-1">📍 {l.khu}/{l.ke}</div>
            {showTrace === l.id && (
              <div className="mt-2 p-2 rounded bg-white dark:bg-slate-800 text-[10px] space-y-1 border-t border-emerald-300">
                {(() => {
                  const trace = truyNguocLo(l.id);
                  if (!trace) return <div>Không truy ngược được</div>;
                  return (
                    <div>
                      <div><strong>↗ Mẻ nhuộm:</strong> {trace.meNhuom?.id}</div>
                      <div><strong>↗ Vải mộc:</strong> {trace.loMoc?.maLoMoc}</div>
                      <div><strong>↗ Lệnh dệt:</strong> {trace.lenhDet?.id}</div>
                      <div><strong>↗ Lô sợi:</strong> {trace.loSoi?.maLoSoi}</div>
                      <div><strong>↗ NCC:</strong> {trace.phieuNhapSoi?.tenNCC}</div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
          );
        })}
        {ltps.length === 0 && <div className="col-span-3 text-center text-sm opacity-60 py-8">Kho TP trống</div>}
      </div>
    </div>
  );
}

// ============ MÀN 11 — BÁO CÁO ============
function Screen11_BaoCao({ user }: any) {
  const [pnss, setPnss] = useState(getAllPhieuNhapSoi());
  const [lds, setLds] = useState(getAllLenhDet());
  const [mns, setMns] = useState(getAllMeNhuom());
  const [ltps, setLtps] = useState(getAllLoVaiTP());

  const tongTienSoi = pnss.reduce((s, p) => s + p.thanhTien, 0);
  const tongCongNoNCC = pnss.reduce((s, p) => s + p.conCongNo, 0);
  const tongCongNoDet = lds.reduce((s, l) => s + (l.congNoXuong || 0), 0);
  const tongKgTP = ltps.reduce((s, l) => s + l.tongKg, 0);
  const tongGiaTriTP = ltps.reduce((s, l) => s + l.tongGiaTri, 0);
  const giaVonTB = tongKgTP > 0 ? tongGiaTriTP / tongKgTP : 0;

  const avgHaoHutDet = lds.filter((l) => l.haoHutPt !== undefined).reduce((s, l) => s + (l.haoHutPt || 0), 0) / Math.max(lds.filter((l) => l.haoHutPt !== undefined).length, 1);
  const avgHaoHutNhuom = mns.reduce((s, m) => s + 3, 0) / Math.max(mns.length, 1);

  return (
    <div className="space-y-3">
      <Header n={11} title="Báo cáo hao hụt & Giá vốn" subtitle="Tổng hợp toàn hệ thống" color="amber" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-w-5xl mx-auto">
        <KPICard icon={TrendingDown} label="Hao hụt dệt TB" value={`${avgHaoHutDet.toFixed(1)}%`} sub="Tất cả lệnh dệt" color={avgHaoHutDet <= 4 ? "emerald" : avgHaoHutDet <= 10 ? "amber" : "rose"} />
        <KPICard icon={TrendingDown} label="Hao hụt nhuộm TB" value={`${avgHaoHutNhuom.toFixed(1)}%`} sub="Tất cả mẻ nhuộm" color={avgHaoHutNhuom <= 3 ? "emerald" : avgHaoHutNhuom <= 5 ? "amber" : "rose"} />
        <KPICard icon={DollarSign} label="Giá vốn TB" value={`${giaVonTB.toFixed(0)}đ/kg`} sub="Trung bình toàn kho" color="blue" />
        <KPICard icon={DollarSign} label="Công nợ NCC sợi" value={`${(tongCongNoNCC / 1_000_000).toFixed(1)}tr`} sub={`${pnss.length} phiếu`} color="rose" />
        <KPICard icon={DollarSign} label="Công nợ xưởng dệt" value={`${(tongCongNoDet / 1_000_000).toFixed(1)}tr`} sub={`${lds.filter((l) => l.congNoXuong).length} lệnh`} color="rose" />
        <KPICard icon={Boxes} label="Tổng vải TP" value={`${tongKgTP.toFixed(0)}kg`} sub={`${(tongGiaTriTP / 1_000_000).toFixed(1)}tr`} color="emerald" />
      </div>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, sub, color }: any) {
  const colors: Record<string, string> = {
    emerald: "from-emerald-500/10 to-green-500/10 text-emerald-700",
    amber: "from-amber-500/10 to-yellow-500/10 text-amber-700",
    rose: "from-rose-500/10 to-red-500/10 text-rose-700",
    blue: "from-blue-500/10 to-cyan-500/10 text-blue-700",
  };
  return (
    <div className={`card p-3 bg-gradient-to-br ${colors[color]}`}>
      <div className="flex items-center justify-between">
        <div className="text-xs opacity-70">{label}</div>
        <Icon className="w-4 h-4 opacity-50" />
      </div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      <div className="text-[10px] opacity-60">{sub}</div>
    </div>
  );
}

// ============ HELPERS ============
function Header({ n, title, subtitle, color }: any) {
  const colors: Record<string, string> = {
    blue: "bg-blue-500", violet: "bg-violet-500", purple: "bg-purple-500",
    rose: "bg-rose-500", pink: "bg-pink-500", emerald: "bg-emerald-500", amber: "bg-amber-500",
  };
  return (
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold ${colors[color]}`}>
        {n}
      </div>
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-xs opacity-70">{subtitle}</p>
      </div>
    </div>
  );
}

function FormulaBlock({ label, formula, value, highlight }: any) {
  return (
    <div className={`p-2 rounded ${highlight ? "bg-rose-50 dark:bg-rose-900/20" : "bg-slate-50 dark:bg-slate-800/50"}`}>
      <div className="text-[10px] opacity-60">{label} = {formula}</div>
      <div className={`font-bold ${highlight ? "text-rose-600" : ""}`}>{value}</div>
    </div>
  );
}

function F({ label, v, on, type = "text" }: { label: string; v: any; on: (v: any) => void; type?: string }) {
  return (
    <div>
      <label className="text-[10px] font-semibold opacity-70">{label}</label>
      <input
        type={type}
        value={v ?? ""}
        onChange={(e) => on(type === "number" ? (e.target.value === "" ? 0 : Number(e.target.value)) : e.target.value)}
        className="w-full mt-0.5 px-3 py-2 rounded border text-sm"
      />
    </div>
  );
}
