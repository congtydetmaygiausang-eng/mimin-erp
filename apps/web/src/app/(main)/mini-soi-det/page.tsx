"use client";

import { useState, useEffect } from "react";
import {
  Package, Truck, BarChart3, ScanLine, CheckCircle2, AlertCircle,
  Loader2, ArrowRight, RefreshCw, QrCode, ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/components/session-provider";
import {
  getLoSoi, saveLoSoi, getXuatSoi, saveXuatSoi, getNhapMoc, saveNhapMoc,
  xuatSoiChoXuong, nhapMoc, tinhThongKeHaoHut, tinhBaoCaoKhoSoi,
  type LoSoi, type XuatSoi, type NhapMoc, type ThongKeHaoHut
} from "@/lib/yarn-inventory";
import { getPhieuDet } from "@/lib/yarn-weaving-dyeing";
import { logAudit } from "@/lib/audit-log";

type Screen = "xuat" | "nhap" | "dashboard";

export default function MiniSoiDetPage() {
  const { user } = useSession();
  const [screen, setScreen] = useState<Screen>("xuat");
  const [loSois, setLoSois] = useState<LoSoi[]>([]);
  const [xuats, setXuats] = useState<XuatSoi[]>([]);
  const [mocs, setMocs] = useState<NhapMoc[]>([]);

  // Form Xuất sợi
  const [maLenhDet, setMaLenhDet] = useState("");
  const [loSoiId, setLoSoiId] = useState("");
  const [soKgXuat, setSoKgXuat] = useState(0);

  // Form Nhập mộc
  const [maLenhDetMoc, setMaLenhDetMoc] = useState("");
  const [soCuon, setSoCuon] = useState(0);
  const [tongKgMoc, setTongKgMoc] = useState(0);
  const [khoVai, setKhoVai] = useState(1.5);
  const [gsm, setGsm] = useState(180);

  useEffect(() => {
    refresh();
  }, []);

  const refresh = () => {
    setLoSois(getLoSoi());
    setXuats(getXuatSoi());
    setMocs(getNhapMoc());
  };

  const thongKe = tinhThongKeHaoHut();
  const baoCaoKho = tinhBaoCaoKhoSoi();
  const dsLenhDet = Array.from(new Set([
    ...xuats.map((x) => x.maLenhDet),
    ...mocs.map((m) => m.maLenhDet),
  ]));

  // ============ XUẤT SỢI ============
  const handleXuatSoi = () => {
    if (!loSoiId || !maLenhDet || soKgXuat <= 0) {
      toast.error("Vui lòng điền đầy đủ");
      return;
    }
    const r = xuatSoiChoXuong(loSoiId, maLenhDet, soKgXuat, "NV005", user);
    if (r.ok) {
      toast.success(r.message);
      refresh();
      setSoKgXuat(0);
    } else {
      toast.error(r.message);
    }
  };

  // ============ NHẬP MỘC ============
  const handleNhapMoc = () => {
    if (!maLenhDetMoc || soCuon <= 0 || tongKgMoc <= 0) {
      toast.error("Vui lòng điền đầy đủ");
      return;
    }
    const r = nhapMoc(maLenhDetMoc, soCuon, tongKgMoc, khoVai, gsm, "NV006", user);
    if (r.ok) {
      toast.success(r.message);
      if (r.tyLeHaoHut > 4) {
        toast.warning(`⚠️ Hao hụt ${r.tyLeHaoHut.toFixed(1)}% vượt định mức 4%`);
      }
      refresh();
      setSoCuon(0);
      setTongKgMoc(0);
    } else {
      toast.error(r.message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-fade-in pb-20">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Package className="w-7 h-7 text-blue-500" /> Sợi & Dệt - Mini
        </h1>
        <p className="opacity-70 text-sm">Thao tác nhanh tại xưởng · Mobile/Tablet first</p>
      </div>

      {/* Tabs - 3 màn hình */}
      <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
        <button
          onClick={() => setScreen("xuat")}
          className={`px-3 py-2.5 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 ${
            screen === "xuat" ? "bg-white dark:bg-slate-700 shadow" : "opacity-60"
          }`}
        >
          <Truck className="w-3.5 h-3.5" /> 1. Xuất sợi
        </button>
        <button
          onClick={() => setScreen("nhap")}
          className={`px-3 py-2.5 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 ${
            screen === "nhap" ? "bg-white dark:bg-slate-700 shadow" : "opacity-60"
          }`}
        >
          <Package className="w-3.5 h-3.5" /> 2. Nhập mộc
        </button>
        <button
          onClick={() => setScreen("dashboard")}
          className={`px-3 py-2.5 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 ${
            screen === "dashboard" ? "bg-white dark:bg-slate-700 shadow" : "opacity-60"
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" /> 3. Dashboard
        </button>
      </div>

      {/* ============ MÀN HÌNH 1: XUẤT SỢI ============ */}
      {screen === "xuat" && (
        <div className="space-y-3">
          <div className="card p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-500" /> Xuất sợi cho xưởng dệt
            </h2>
            <p className="text-xs opacity-70">Nhập liệu dưới 10 giây</p>
          </div>

          <div className="card p-4 space-y-3">
            <div>
              <label className="text-xs font-semibold opacity-70">1. Mã lệnh dệt</label>
              <select
                value={maLenhDet}
                onChange={(e) => setMaLenhDet(e.target.value)}
                className="w-full mt-1 px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-base"
              >
                <option value="">-- Chọn lệnh dệt --</option>
                {Array.from(new Set(getPhieuDet().map((p) => p.id))).map((id) => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold opacity-70">2. Lô sợi xuất (Quét QR hoặc chọn)</label>
              <div className="flex gap-2 mt-1">
                <select
                  value={loSoiId}
                  onChange={(e) => setLoSoiId(e.target.value)}
                  className="flex-1 px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-base"
                >
                  <option value="">-- Chọn lô sợi --</option>
                  {loSois.filter((l) => l.soKgConLai > 0).map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.id} - {l.tenSoi} (còn {l.soKgConLai}kg)
                    </option>
                  ))}
                </select>
                <button
                  className="px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  title="Quét QR"
                  onClick={() => toast.info("Tính năng QR sẽ tích hợp camera sau")}
                >
                  <QrCode className="w-5 h-5" />
                </button>
              </div>
              {loSoiId && (
                <div className="mt-2 p-2 rounded bg-blue-50 dark:bg-blue-900/20 text-xs">
                  <span className="font-mono opacity-60">{loSoiId}</span> ·{" "}
                  <span className="font-semibold">{loSois.find((l) => l.id === loSoiId)?.tenSoi}</span> ·{" "}
                  <span className="text-blue-600">Còn {loSois.find((l) => l.id === loSoiId)?.soKgConLai}kg</span>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold opacity-70">3. Số kg xuất</label>
              <input
                type="number"
                value={soKgXuat || ""}
                onChange={(e) => setSoKgXuat(parseFloat(e.target.value) || 0)}
                className="w-full mt-1 px-3 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-2xl font-bold text-center"
                placeholder="0"
                inputMode="decimal"
              />
            </div>

            <button
              onClick={handleXuatSoi}
              disabled={!loSoiId || !maLenhDet || soKgXuat <= 0}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Truck className="w-5 h-5" />
              XUẤT {soKgXuat}KG SỢI
            </button>
          </div>

          {/* Lịch sử xuất gần đây */}
          <div className="card p-4">
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> Xuất gần đây ({xuats.length})
            </h3>
            {xuats.slice(0, 3).map((x) => (
              <div key={x.id} className="p-2 rounded bg-slate-50 dark:bg-slate-800/30 text-xs mb-1">
                <div className="flex justify-between">
                  <span className="font-mono">{x.id}</span>
                  <span className="font-bold text-blue-600">{x.soKgXuat}kg</span>
                </div>
                <div className="opacity-60">{x.maLenhDet} · {x.loSoiId} · {x.ngayXuat}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============ MÀN HÌNH 2: NHẬP MỘC ============ */}
      {screen === "nhap" && (
        <div className="space-y-3">
          <div className="card p-4 bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/30">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-500" /> Nhập vải mộc (thu hồi)
            </h2>
            <p className="text-xs opacity-70">Báo cáo nhanh khối lượng vải mộc thu về</p>
          </div>

          <div className="card p-4 space-y-3">
            <div>
              <label className="text-xs font-semibold opacity-70">1. Mã lệnh dệt</label>
              <select
                value={maLenhDetMoc}
                onChange={(e) => setMaLenhDetMoc(e.target.value)}
                className="w-full mt-1 px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-base"
              >
                <option value="">-- Chọn lệnh --</option>
                {dsLenhDet.map((id) => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold opacity-70">2. Số cuộn/cây</label>
                <input
                  type="number"
                  value={soCuon || ""}
                  onChange={(e) => setSoCuon(parseInt(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xl font-bold text-center"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs font-semibold opacity-70">3. Tổng kg mộc</label>
                <input
                  type="number"
                  value={tongKgMoc || ""}
                  onChange={(e) => setTongKgMoc(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xl font-bold text-center"
                  placeholder="0"
                  inputMode="decimal"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold opacity-70">4. Khổ vải (m)</label>
                <input
                  type="number"
                  value={khoVai}
                  step="0.1"
                  onChange={(e) => setKhoVai(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-base"
                />
              </div>
              <div>
                <label className="text-xs font-semibold opacity-70">5. GSM (g/m²)</label>
                <input
                  type="number"
                  value={gsm}
                  onChange={(e) => setGsm(parseInt(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-base"
                />
              </div>
            </div>

            <button
              onClick={handleNhapMoc}
              disabled={!maLenhDetMoc || soCuon <= 0 || tongKgMoc <= 0}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-5 h-5" />
              NHẬP {tongKgMoc}KG MỘC
            </button>
          </div>

          <div className="card p-4">
            <h3 className="font-semibold text-sm mb-2">Nhập gần đây ({mocs.length})</h3>
            {mocs.slice(0, 3).map((m) => (
              <div key={m.id} className="p-2 rounded bg-slate-50 dark:bg-slate-800/30 text-xs mb-1">
                <div className="flex justify-between">
                  <span className="font-mono">{m.id}</span>
                  <span className="font-bold text-emerald-600">{m.tongKgMoc}kg</span>
                </div>
                <div className="opacity-60">{m.maLenhDet} · {m.soCuon} cuộn · {m.khoVai}m × {m.gsm} GSM</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============ MÀN HÌNH 3: DASHBOARD HAO HỤT ============ */}
      {screen === "dashboard" && (
        <div className="space-y-3">
          <div className="card p-4 bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/30">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-violet-500" /> Dashboard Hao Hụt
            </h2>
            <p className="text-xs opacity-70">Định mức: ≤ 4% · Vàng: 4-10% · Đỏ: &gt; 10%</p>
          </div>

          {/* Stats kho sợi */}
          <div className="grid grid-cols-3 gap-2">
            <div className="card p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{baoCaoKho.tongLo}</div>
              <div className="text-[10px] opacity-70">Lô sợi</div>
            </div>
            <div className="card p-3 text-center">
              <div className="text-2xl font-bold text-emerald-600">
                {baoCaoKho.tongKgConLai.toLocaleString()}
              </div>
              <div className="text-[10px] opacity-70">kg còn lại</div>
            </div>
            <div className="card p-3 text-center">
              <div className="text-2xl font-bold text-rose-600">
                {baoCaoKho.tongKgDaDung.toLocaleString()}
              </div>
              <div className="text-[10px] opacity-70">kg đã dùng</div>
            </div>
          </div>

          {/* Thẻ lệnh dệt */}
          <div>
            <h3 className="font-semibold text-sm mb-2">📊 Hao hụt theo lệnh dệt ({thongKe.length})</h3>
            <div className="space-y-2">
              {thongKe.length === 0 ? (
                <div className="card p-6 text-center text-sm opacity-60">
                  Chưa có dữ liệu
                </div>
              ) : (
                thongKe.map((t) => <HaoHutCard key={t.maLenhDet} data={t} />)
              )}
            </div>
          </div>

          {/* Kho sợi */}
          <div>
            <h3 className="font-semibold text-sm mb-2">📦 Kho sợi ({loSois.length} lô)</h3>
            <div className="space-y-2">
              {loSois.map((l) => {
                const pct = l.soKgBanDau > 0 ? (l.soKgConLai / l.soKgBanDau) * 100 : 0;
                return (
                  <div key={l.id} className="card p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-mono text-xs font-bold text-blue-500">{l.id}</div>
                        <div className="text-sm font-semibold">{l.tenSoi}</div>
                        <div className="text-[10px] opacity-60">{l.nhaCungCap} · {l.ngayNhap}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-emerald-600">
                          {l.soKgConLai}/{l.soKgBanDau} kg
                        </div>
                        <StatusBadge status={l.trangThai} />
                      </div>
                    </div>
                    <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full ${
                          pct === 0 ? "bg-rose-500" : pct < 50 ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${100 - pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HaoHutCard({ data }: { data: ThongKeHaoHut }) {
  const colors = {
    xanh: { bg: "bg-emerald-500", light: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-600", icon: "🟢" },
    vang: { bg: "bg-amber-500", light: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-600", icon: "🟡" },
    do: { bg: "bg-rose-500", light: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-600", icon: "🔴" },
  };
  const c = colors[data.canhBao];

  return (
    <div className={`card p-4 ${c.light} border ${c.border}`}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="font-bold text-base">{c.icon} {data.maLenhDet}</div>
          {data.tenXuongDet && <div className="text-xs opacity-70">{data.tenXuongDet}</div>}
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${c.text}`}>
            {data.tyLeHaoHut.toFixed(1)}%
          </div>
          <div className="text-[10px] opacity-60">định mức ≤{data.dinhMuc}%</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="p-1.5 rounded bg-white/50">
          <div className="opacity-60">Sợi xuất</div>
          <div className="font-bold text-sm">{data.tongKgXuat} kg</div>
        </div>
        <div className="p-1.5 rounded bg-white/50">
          <div className="opacity-60">Mộc về</div>
          <div className="font-bold text-sm">{data.tongKgMoc} kg</div>
        </div>
        <div className="p-1.5 rounded bg-white/50">
          <div className="opacity-60">Cuộn</div>
          <div className="font-bold text-sm">{data.soCuon}</div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Tồn kho": "bg-emerald-500 text-white",
    "Đang dệt": "bg-blue-500 text-white",
    "Hết": "bg-rose-500 text-white",
    "Hủy": "bg-slate-500 text-white",
  };
  return <span className={`text-[10px] px-1.5 py-0.5 rounded ${map[status] || "bg-slate-300"}`}>{status}</span>;
}
