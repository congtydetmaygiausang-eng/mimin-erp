"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Factory, Plus, Trash2, Save, Package, Truck, Palette, Boxes,
  ChevronRight, Bell, Check, X, AlertCircle, DollarSign, Calculator,
  FileText, Eye, Sparkles, ArrowRight, GitBranch, Users,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/components/session-provider";
import {
  taoLenhTong, getNotificationsByRole, markNotificationRead, clearAllNotifications,
  type LenhTong,
} from "@/lib/lenh-tong";

type Tab = "form" | "notifications" | "history";

export default function LenhTongPage() {
  const { user } = useSession();
  const [tab, setTab] = useState<Tab>("form");
  const [result, setResult] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<string>("Kho sợi");

  return (
    <div className="max-w-5xl mx-auto space-y-3 animate-fade-in">
      <div className="card p-4 bg-gradient-to-r from-blue-500/10 via-violet-500/10 via-rose-500/10 to-emerald-500/10">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Factory className="w-7 h-7 text-blue-500" /> Lệnh Dệt-Nhuộm TỔNG
        </h1>
        <p className="opacity-70 text-sm">
          1 form duy nhất → Tự tạo: Nhập sợi + Lệnh dệt + Mẻ nhuộm + Lô vải TP + 3 Công nợ + 5 Thông báo
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-fit">
        {[
          { key: "form", label: "📝 Tạo lệnh tổng", icon: Plus },
          { key: "notifications", label: "🔔 Thông báo", icon: Bell },
          { key: "history", label: "📜 Lịch sử", icon: FileText },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key as Tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 ${
                tab === t.key ? "bg-white dark:bg-slate-700 shadow" : "opacity-60"
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "form" && <FormLenhTong user={user} onSuccess={(r: any) => { setResult(r); setTab("form"); }} />}
      {tab === "notifications" && <NotificationsView />}
      {tab === "history" && <HistoryView />}

      {result && tab === "form" && (
        <div className="card p-4 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-emerald-700">✅ {result.message.split("\n")[0]}</h3>
            <button onClick={() => setResult(null)}><X className="w-4 h-4" /></button>
          </div>
          <pre className="text-xs whitespace-pre-wrap opacity-80">{result.message}</pre>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3 text-xs">
            <Card label="Chi phí sợi" value={(result.chiPhi.chiSoi / 1_000_000).toFixed(1) + "tr"} color="blue" />
            <Card label="Chi phí dệt" value={(result.chiPhi.chiDet / 1_000_000).toFixed(1) + "tr"} color="violet" />
            <Card label="Chi phí nhuộm" value={((result.chiPhi.chiNhuom + result.chiPhi.chiHoaChat) / 1_000_000).toFixed(1) + "tr"} color="rose" />
            <Card label="Công nợ NCC" value={(result.congNo.ncc / 1_000_000).toFixed(1) + "tr"} color="blue" />
            <Card label="Công nợ Dệt" value={(result.congNo.xuongDet / 1_000_000).toFixed(1) + "tr"} color="violet" />
            <Card label="Công nợ Nhuộm" value={(result.congNo.xuongNhuom / 1_000_000).toFixed(1) + "tr"} color="rose" />
          </div>
        </div>
      )}
    </div>
  );
}

// ============ FORM LỆNH TỔNG ============
function FormLenhTong({ user, onSuccess }: any) {
  // Bước 1: Sợi
  const [ncc, setNcc] = useState("Cty Sợi Việt Nam");
  const [loaiSoi, setLoaiSoi] = useState("Cotton 32s");
  const [maLoSoi, setMaLoSoi] = useState("LSOI-001");
  const [soKgSoi, setSoKgSoi] = useState(1000);
  const [donGiaSoi, setDonGiaSoi] = useState(130000);

  // Bước 2: Dệt
  const [xuongDet, setXuongDet] = useState("DNT Dệt Bắc Ninh");
  const [donGiaDet, setDonGiaDet] = useState(8000);

  // Bước 3: Nhuộm
  const [xuongNhuom, setXuongNhuom] = useState("Cty Nhuộm Hà Đông");
  const [danhSachMau, setDanhSachMau] = useState([
    { mau: "Đen", soKg: 200, donGiaNhuom: 15000, chiPhiHoaChat: 1200000 },
    { mau: "Trắng", soKg: 150, donGiaNhuom: 12000, chiPhiHoaChat: 1000000 },
    { mau: "Navy", soKg: 150, donGiaNhuom: 14000, chiPhiHoaChat: 1100000 },
  ]);

  // Bước 4: Kho TP
  const [kho, setKho] = useState("Kho Vải TP");
  const [khu, setKhu] = useState("Khu A");
  const [ke, setKe] = useState("A03");

  // Common
  const [ghiChu, setGhiChu] = useState("");

  // ============ TÍNH TOÁN ============
  const chiSoi = soKgSoi * donGiaSoi;
  const chiDet = soKgSoi * donGiaDet;
  const chiNhuom = danhSachMau.reduce((s, m) => s + m.soKg * m.donGiaNhuom, 0);
  const chiHoaChat = danhSachMau.reduce((s, m) => s + m.chiPhiHoaChat, 0);
  const tongKgMau = danhSachMau.reduce((s, m) => s + m.soKg, 0);
  const tongCong = chiSoi + chiDet + chiNhuom + chiHoaChat;

  // Công nợ
  const congNoNCC = chiSoi;
  const congNoDet = chiDet;
  const congNoNhuom = chiNhuom + chiHoaChat;
  const tongCongNo = congNoNCC + congNoDet + congNoNhuom;

  const handleTao = () => {
    if (!ncc || !loaiSoi || !maLoSoi || soKgSoi <= 0 || donGiaSoi <= 0) {
      toast.error("Vui lòng điền đầy đủ thông tin sợi");
      return;
    }
    if (danhSachMau.length === 0 || tongKgMau === 0) {
      toast.error("Phải có ít nhất 1 màu nhuộm");
      return;
    }

    const r = taoLenhTong({
      ncc, loaiSoi, maLoSoi, soKgSoi, donGiaSoi,
      xuongDet, donGiaDet,
      xuongNhuom, danhSachMau,
      kho, khu, ke,
      ngayTao: new Date().toISOString().slice(0, 10),
      nguoiTao: user?.name || "Admin",
      ghiChu,
    }, user);

    if (r.ok) {
      toast.success(r.message);
      onSuccess(r);
    } else {
      toast.error(r.message);
    }
  };

  const updateMau = (idx: number, field: string, val: any) => {
    const newM = [...danhSachMau];
    (newM[idx] as any)[field] = ["soKg", "donGiaNhuom", "chiPhiHoaChat"].includes(field) ? Number(val) : val;
    setDanhSachMau(newM);
  };

  return (
    <div className="space-y-3">
      <div className="card p-4 bg-white dark:bg-slate-900 space-y-4">
        {/* Header stepper */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {[
            { n: 1, label: "Sợi", color: "blue", icon: Package },
            { n: 2, label: "Dệt", color: "violet", icon: Truck },
            { n: 3, label: "Nhuộm", color: "rose", icon: Palette },
            { n: 4, label: "Kho TP", color: "emerald", icon: Boxes },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <span key={s.n} className="flex items-center">
                <span className={`px-2 py-1 rounded bg-${s.color}-500 text-white flex items-center gap-1`}>
                  <Icon className="w-3 h-3" /> <strong>{s.n}.</strong> {s.label}
                </span>
                {i < 3 && <ChevronRight className="w-3 h-3 opacity-40" />}
              </span>
            );
          })}
        </div>

        {/* BƯỚC 1: SỢI + NCC */}
        <div className="card p-3 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300">
          <h3 className="font-bold text-blue-700 flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">1</span>
            <Package className="w-4 h-4" /> SỢI + NHÀ CUNG CẤP
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <F label="Nhà cung cấp" v={ncc} on={setNcc} />
            <F label="Loại sợi" v={loaiSoi} on={setLoaiSoi} />
            <F label="Mã lô sợi" v={maLoSoi} on={setMaLoSoi} />
            <F label="Số kg" v={soKgSoi} on={setSoKgSoi} type="number" />
            <F label="Đơn giá sợi (VNĐ/kg)" v={donGiaSoi} on={setDonGiaSoi} type="number" />
            <div>
              <label className="text-xs font-semibold opacity-70">Thành tiền sợi</label>
              <div className="px-3 py-2 mt-0.5 rounded border bg-white dark:bg-slate-800 text-base font-bold text-blue-600">
                {chiSoi.toLocaleString()}đ
              </div>
            </div>
          </div>
        </div>

        {/* BƯỚC 2: DỆT */}
        <div className="card p-3 bg-violet-50 dark:bg-violet-900/20 border-2 border-violet-300">
          <h3 className="font-bold text-violet-700 flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-full bg-violet-500 text-white text-xs flex items-center justify-center">2</span>
            <Truck className="w-4 h-4" /> DỆT - GIA CÔNG
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <F label="Xưởng dệt" v={xuongDet} on={setXuongDet} />
            <F label="Đơn giá dệt (VNĐ/kg)" v={donGiaDet} on={setDonGiaDet} type="number" />
            <div>
              <label className="text-xs font-semibold opacity-70">Phí dệt dự kiến</label>
              <div className="px-3 py-2 mt-0.5 rounded border bg-white dark:bg-slate-800 text-base font-bold text-violet-600">
                {chiDet.toLocaleString()}đ
              </div>
            </div>
          </div>
        </div>

        {/* BƯỚC 3: NHUỘM - NHIỀU MÀU */}
        <div className="card p-3 bg-rose-50 dark:bg-rose-900/20 border-2 border-rose-300">
          <h3 className="font-bold text-rose-700 flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center">3</span>
            <Palette className="w-4 h-4" /> NHUỘM - CHỌN MÀU SẮC
          </h3>
          <F label="Xưởng nhuộm" v={xuongNhuom} on={setXuongNhuom} />

          <div className="mt-2 space-y-1">
            {danhSachMau.map((m, i) => (
              <div key={i} className="grid grid-cols-12 gap-1 items-center text-xs">
                <input
                  value={m.mau}
                  onChange={(e) => updateMau(i, "mau", e.target.value)}
                  className="col-span-2 px-2 py-1.5 rounded border font-semibold"
                  placeholder="Màu"
                />
                <input
                  type="number"
                  value={m.soKg}
                  onChange={(e) => updateMau(i, "soKg", e.target.value)}
                  className="col-span-2 px-2 py-1.5 rounded border text-right"
                  placeholder="Kg"
                />
                <input
                  type="number"
                  value={m.donGiaNhuom}
                  onChange={(e) => updateMau(i, "donGiaNhuom", e.target.value)}
                  className="col-span-3 px-2 py-1.5 rounded border text-right"
                  placeholder="Đơn giá/kg"
                />
                <input
                  type="number"
                  value={m.chiPhiHoaChat}
                  onChange={(e) => updateMau(i, "chiPhiHoaChat", e.target.value)}
                  className="col-span-3 px-2 py-1.5 rounded border text-right"
                  placeholder="Hóa chất"
                />
                <button
                  onClick={() => setDanhSachMau(danhSachMau.filter((_, idx) => idx !== i))}
                  className="col-span-1 text-rose-600 hover:bg-rose-100 rounded p-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
                <div className="col-span-1 text-[10px] opacity-60 text-right">
                  = {((m.soKg * m.donGiaNhuom) + m.chiPhiHoaChat).toLocaleString()}
                </div>
              </div>
            ))}
            <button
              onClick={() => setDanhSachMau([...danhSachMau, { mau: "Mới", soKg: 0, donGiaNhuom: 12000, chiPhiHoaChat: 1000000 }])}
              className="text-xs text-blue-600"
            >
              <Plus className="w-3 h-3 inline" /> Thêm màu
            </button>
          </div>

          <div className="mt-2 text-sm">
            Tổng: <strong>{tongKgMau}kg</strong> · Nhuộm: <strong className="text-rose-600">{chiNhuom.toLocaleString()}đ</strong> · Hóa chất: <strong className="text-rose-600">{chiHoaChat.toLocaleString()}đ</strong>
          </div>
        </div>

        {/* BƯỚC 4: KHO VẢI TP */}
        <div className="card p-3 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-300">
          <h3 className="font-bold text-emerald-700 flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center">4</span>
            <Boxes className="w-4 h-4" /> KHO VẢI THÀNH PHẨM (nhập sau khi nhuộm)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <F label="Kho" v={kho} on={setKho} />
            <F label="Khu" v={khu} on={setKhu} />
            <F label="Kệ" v={ke} on={setKe} />
          </div>
          <div className="mt-2 text-xs opacity-70">
            💡 Sau khi nhuộm xong, vải sẽ nhập vào: {kho} / {khu} / {ke}
          </div>
        </div>

        <F label="Ghi chú" v={ghiChu} on={setGhiChu} />
      </div>

      {/* TỔNG KẾT CHI PHÍ + CÔNG NỢ */}
      <div className="card p-4 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-2 border-amber-500">
        <h3 className="font-bold text-amber-700 mb-2 flex items-center gap-2">
          <Calculator className="w-5 h-5" /> 💰 TỔNG CHI PHÍ + CÔNG NỢ TỪNG ĐƠN VỊ
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Card label="Chi sợi" value={chiSoi.toLocaleString() + "đ"} color="blue" />
          <Card label="Chi dệt" value={chiDet.toLocaleString() + "đ"} color="violet" />
          <Card label="Chi nhuộm" value={chiNhuom.toLocaleString() + "đ"} color="rose" />
          <Card label="Chi hóa chất" value={chiHoaChat.toLocaleString() + "đ"} color="amber" />
        </div>
        <div className="mt-3 p-2 rounded bg-white dark:bg-slate-800 text-center">
          <div className="text-xs opacity-70">TỔNG CHI PHÍ</div>
          <div className="text-3xl font-bold text-amber-600">{tongCong.toLocaleString()}đ</div>
        </div>

        <div className="mt-3">
          <div className="text-xs font-semibold opacity-70 mb-1">📋 Công nợ từng đơn vị (tự động tạo):</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Card label="🏭 NCC sợi" value={congNoNCC.toLocaleString() + "đ"} color="blue" sub={ncc} />
            <Card label="🧵 Xưởng dệt" value={congNoDet.toLocaleString() + "đ"} color="violet" sub={xuongDet} />
            <Card label="🎨 Xưởng nhuộm" value={congNoNhuom.toLocaleString() + "đ"} color="rose" sub={xuongNhuom} />
          </div>
          <div className="mt-2 p-2 rounded bg-rose-50 dark:bg-rose-900/20 text-center text-sm">
            Tổng công nợ: <strong className="text-rose-600 text-lg">{tongCongNo.toLocaleString()}đ</strong>
          </div>
        </div>
      </div>

      {/* NÚT TẠO */}
      <button onClick={handleTao} className="btn-primary w-full py-4 text-base bg-gradient-to-r from-blue-500 via-violet-500 to-rose-500">
        <Sparkles className="w-4 h-4 inline" /> TẠO LỆNH DỆT-NHUỘM TỔNG
        <br />
        <span className="text-xs opacity-80">→ 1 phiếu nhập sợi + 1 lệnh dệt + 1 mẻ nhuộm + 3 công nợ + 5 thông báo</span>
      </button>
    </div>
  );
}

// ============ NOTIFICATIONS VIEW ============
function NotificationsView() {
  const ROLES = ["Kho sợi", "Xưởng dệt", "Xưởng nhuộm", "Kho TP", "Kế toán"];
  const [role, setRole] = useState("Kho sợi");
  const [notifs, setNotifs] = useState<any[]>([]);

  useEffect(() => { setNotifs(getNotificationsByRole(role)); }, [role]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        {ROLES.map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={`text-xs px-3 py-1.5 rounded ${
              role === r ? "bg-blue-500 text-white" : "bg-slate-100 dark:bg-slate-800"
            }`}
          >
            {r}
            {getNotificationsByRole(r).filter((n) => !n.daDoc).length > 0 && (
              <span className="ml-1 px-1 rounded-full bg-rose-500 text-white text-[9px]">
                {getNotificationsByRole(r).filter((n) => !n.daDoc).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex justify-end">
        <button onClick={() => { clearAllNotifications(); setNotifs([]); }} className="text-xs text-rose-600">
          Xóa tất cả
        </button>
      </div>

      <div className="space-y-2">
        {notifs.length === 0 ? (
          <div className="card p-4 text-center text-sm opacity-60">Không có thông báo nào cho {role}</div>
        ) : (
          notifs.map((n) => (
            <div
              key={n.id}
              className={`card p-3 ${n.daDoc ? "opacity-60" : "border-2 border-blue-500"}`}
              onClick={() => { markNotificationRead(n.id); setNotifs(getNotificationsByRole(role)); }}
            >
              <div className="flex items-start gap-2">
                <Bell className={`w-4 h-4 mt-0.5 ${n.daDoc ? "text-slate-400" : "text-blue-500"}`} />
                <div className="flex-1">
                  <div className="font-bold text-sm">{n.tieuDe}</div>
                  <div className="text-xs opacity-80">{n.noiDung}</div>
                  <div className="text-[10px] opacity-60 mt-1">
                    {new Date(n.thoiGian).toLocaleString("vi-VN")} · Mã: {n.maThamChieu}
                  </div>
                </div>
                {!n.daDoc && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500 text-white">MỚI</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function HistoryView() {
  const [list, setList] = useState<any[]>([]);
  useEffect(() => {
    setList(JSON.parse(localStorage.getItem("mimin_lenh_tong") || "[]"));
  }, []);
  return (
    <div className="card p-3">
      <h3 className="font-bold mb-2">📜 Lịch sử lệnh tổng ({list.length})</h3>
      <p className="text-xs opacity-60">Tính năng lưu lịch sử đang phát triển. Hiện tại kết quả hiển thị ở tab "Tạo lệnh tổng".</p>
    </div>
  );
}

// ============ HELPERS ============
function F({ label, v, on, type = "text" }: { label: string; v: any; on: (v: any) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs font-semibold opacity-70">{label}</label>
      <input
        type={type}
        value={v ?? ""}
        onChange={(e) => on(type === "number" ? (e.target.value === "" ? 0 : Number(e.target.value)) : e.target.value)}
        className="w-full mt-0.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
      />
    </div>
  );
}

function Card({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-700",
    violet: "bg-violet-100 dark:bg-violet-900/30 text-violet-700",
    rose: "bg-rose-100 dark:bg-rose-900/30 text-rose-700",
    amber: "bg-amber-100 dark:bg-amber-900/30 text-amber-700",
    emerald: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700",
  };
  return (
    <div className={`p-2 rounded-lg ${colors[color]}`}>
      <div className="text-[10px] opacity-70">{label}</div>
      <div className="text-base font-bold mt-0.5">{value}</div>
      {sub && <div className="text-[9px] opacity-60 truncate">{sub}</div>}
    </div>
  );
}
