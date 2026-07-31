"use client";

import { useState, useEffect } from "react";
import {
  Package, AlertCircle, CheckCircle2, TrendingDown, TrendingUp,
  Scissors, Calculator, FileText, RefreshCw, BarChart3
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/components/session-provider";
import { logAudit } from "@/lib/audit-log";
import {
  getAllInventory, truTonKho, nhapKho, resetInventory,
  tinhMan, parseSize, goiYVai,
  baoCaoVaiTheoLSX, DINH_MUC_VAI, HAO_HUT_MAC_DINH,
  type BaoCaoVai
} from "@/lib/inventory-engine";
import { KHO_VAI, type KhoVai } from "@/lib/data/real-data";
import { ALL_REAL_PHIEU } from "@/lib/real-workflow-data";

const TINH_MAN_PHAN_LOAI = [
  "Áo thun cotton",
  "Áo trụ",
  "Áo polo",
  "Quần",
  "Bộ trụ trơn",
];

export default function KhoVaiPage() {
  const { user } = useSession();
  const [inventory, setInventory] = useState<KhoVai[]>([]);
  const [tab, setTab] = useState<"tonkho" | "tinhman" | "baocao">("tonkho");
  const [selected, setSelected] = useState<string>("Áo thun cotton");
  const [soLuong, setSoLuong] = useState(500);
  const [sizeStr, setSizeStr] = useState("M, L, XL, 2XL");
  const [baoCaoLenSX, setBaoCaoLenSX] = useState("LSX-2026-001");

  useEffect(() => {
    setInventory(getAllInventory());
  }, []);

  const refresh = () => {
    setInventory(getAllInventory());
  };

  // Tính màn
  const tinh = tinhMan(selected, parseSize(soLuong, sizeStr));
  const totalTonKho = inventory.reduce((s, v) => s + v.tonKho, 0);
  const totalDonGia = inventory.reduce((s, v) => s + v.tonKho * v.donGia, 0);
  const vaiSapHet = inventory.filter((v) => v.tonKho < 50).length;
  const vaiNhieu = inventory.filter((v) => v.tonKho > 400).length;

  const handleTruKho = (phieuId: string) => {
    const p = ALL_REAL_PHIEU.find((x) => x.id === phieuId);
    if (!p) return;
    const results = truTonKho(p, user);
    if (results[0]?.ok) {
      toast.success(results[0].message);
      refresh();
    } else {
      toast.error(results[0]?.message || "Lỗi");
    }
  };

  const handleTruAllCAT = () => {
    if (!confirm(`Trừ tồn kho cho tất cả phiếu Cắt (6 LSX)?`)) return;
    let count = 0;
    ALL_REAL_PHIEU
      .filter((p) => p.id.startsWith("CAT_"))
      .forEach((p) => {
        const r = truTonKho(p, user);
        if (r[0]?.ok) count++;
      });
    toast.success(`✅ Đã trừ kho cho ${count} phiếu cắt`);
    refresh();
  };

  const handleReset = () => {
    if (!confirm("Reset tồn kho về 500kg/mỗi loại?")) return;
    resetInventory();
    refresh();
    toast.success("Đã reset tồn kho");
  };

  const handleNhapKho = (maVT: string) => {
    const sl = parseInt(prompt("Nhập số kg:", "100") || "0");
    if (sl > 0) {
      const r = nhapKho(maVT, sl, user, "Nhập thủ công");
      if (r.ok) toast.success(r.message);
      refresh();
    }
  };

  // Báo cáo theo LSX
  const baoCao: BaoCaoVai[] = baoCaoVaiTheoLSX(ALL_REAL_PHIEU, baoCaoLenSX);
  const lenhSXVailable = Array.from(new Set(ALL_REAL_PHIEU.map((p) => p.lenhSX)));

  return (
    <div className="max-w-7xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Package className="w-7 h-7 text-blue-500" /> Kho Vải & Tính Màn
        </h1>
        <p className="opacity-70 mt-1 text-sm">
          Quản lý tồn kho 29 loại vải · Tính định mức vải theo sản phẩm + size · Trừ kho tự động khi cắt
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat icon={<Package className="w-4 h-4" />} label="Tổng tồn" value={`${(totalTonKho / 1000).toFixed(1)} tấn`} color="blue" />
        <Stat icon={<TrendingUp className="w-4 h-4" />} label="Giá trị tồn" value={`${(totalDonGia / 1_000_000).toFixed(1)}tr`} color="emerald" />
        <Stat icon={<AlertCircle className="w-4 h-4" />} label="Sắp hết (<50kg)" value={vaiSapHet} color="rose" />
        <Stat icon={<CheckCircle2 className="w-4 h-4" />} label="Nhiều (>400kg)" value={vaiNhieu} color="violet" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-fit">
        {[
          { key: "tonkho", label: "Tồn kho", icon: <Package className="w-3.5 h-3.5" /> },
          { key: "tinhman", label: "Tính màn", icon: <Calculator className="w-3.5 h-3.5" /> },
          { key: "baocao", label: "Báo cáo vải", icon: <BarChart3 className="w-3.5 h-3.5" /> },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 ${
              tab === t.key ? "bg-white dark:bg-slate-700 shadow" : "opacity-60 hover:opacity-100"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Tồn kho */}
      {tab === "tonkho" && (
        <>
          <div className="card p-4 flex flex-wrap gap-2">
            <button onClick={handleTruAllCAT} className="btn-primary text-sm flex items-center gap-1.5">
              <Scissors className="w-4 h-4" /> Trừ kho cho 6 LSX Cắt
            </button>
            <button onClick={handleReset} className="btn-secondary text-sm flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4" /> Reset tồn kho (500kg/mỗi loại)
            </button>
            <button onClick={refresh} className="btn-secondary text-sm flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800">
                <tr>
                  <th className="p-2 text-left">Mã VT</th>
                  <th className="p-2 text-left">Tên vải</th>
                  <th className="p-2 text-left">Màu</th>
                  <th className="p-2 text-right">Tồn kho (kg)</th>
                  <th className="p-2 text-right">Đơn giá</th>
                  <th className="p-2 text-right">Giá trị</th>
                  <th className="p-2 text-center">Trạng thái</th>
                  <th className="p-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {inventory.slice(0, 20).map((v) => (
                  <tr key={v.maVT} className="border-t border-slate-200 dark:border-slate-700">
                    <td className="p-2 font-mono text-xs">{v.maVT}</td>
                    <td className="p-2">{v.tenVT}</td>
                    <td className="p-2 opacity-70 text-xs">{v.mauSac}</td>
                    <td className="p-2 text-right font-bold">{v.tonKho.toFixed(0)}</td>
                    <td className="p-2 text-right">{v.donGia.toLocaleString()}</td>
                    <td className="p-2 text-right">{(v.tonKho * v.donGia / 1_000_000).toFixed(2)}tr</td>
                    <td className="p-2 text-center">
                      {v.tonKho < 50 ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-700">Sắp hết</span>
                      ) : v.tonKho > 400 ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700">Nhiều</span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700">Bình thường</span>
                      )}
                    </td>
                    <td className="p-2 text-center">
                      <button onClick={() => handleNhapKho(v.maVT)} className="text-xs text-blue-500 underline">
                        + Nhập
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-2 text-xs opacity-50 text-center">
              Hiển thị 20/{inventory.length} loại vải
            </div>
          </div>
        </>
      )}

      {/* Tab: Tính màn */}
      {tab === "tinhman" && (
        <>
          <div className="card p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Calculator className="w-5 h-5 text-violet-500" /> Tính định mức vải (m/cái)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs opacity-70">Sản phẩm</label>
                <select
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                >
                  {TINH_MAN_PHAN_LOAI.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs opacity-70">Tổng SL giao</label>
                <input
                  type="number"
                  value={soLuong}
                  onChange={(e) => setSoLuong(parseInt(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                />
              </div>
              <div>
                <label className="text-xs opacity-70">Size (phân cách bằng , hoặc /)</label>
                <input
                  type="text"
                  value={sizeStr}
                  onChange={(e) => setSizeStr(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Kết quả */}
          <div className="card p-4 space-y-3">
            <h3 className="font-semibold">📊 Kết quả tính màn</h3>
            {tinh.warning && (
              <div className="p-3 rounded bg-amber-500/10 border border-amber-500/30 text-sm">
                <AlertCircle className="w-4 h-4 inline mr-1" /> {tinh.warning}
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <div className="text-xs opacity-70">Mét gốc</div>
                <div className="text-2xl font-bold text-blue-600">{tinh.soMetGoc}m</div>
              </div>
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                <div className="text-xs opacity-70">Hao hụt ({tinh.tyLeHaoHut}%)</div>
                <div className="text-2xl font-bold text-amber-600">+{tinh.soMetHaoHut}m</div>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                <div className="text-xs opacity-70">Tổng cần</div>
                <div className="text-2xl font-bold text-emerald-600">{tinh.soMetCan}m</div>
              </div>
              <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-900/20">
                <div className="text-xs opacity-70">Quy ra kg (×0.25)</div>
                <div className="text-2xl font-bold text-violet-600">{(tinh.soMetCan * 0.25).toFixed(1)}kg</div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 dark:bg-slate-800">
                  <tr>
                    <th className="p-2 text-left">Size</th>
                    <th className="p-2 text-right">SL</th>
                    <th className="p-2 text-right">Định mức (m/cái)</th>
                    <th className="p-2 text-right">Tổng (m)</th>
                  </tr>
                </thead>
                <tbody>
                  {tinh.chiTiet.map((c) => (
                    <tr key={c.size} className="border-t border-slate-200 dark:border-slate-700">
                      <td className="p-2 font-bold">{c.size}</td>
                      <td className="p-2 text-right">{c.sl}</td>
                      <td className="p-2 text-right">{c.dinhMuc}</td>
                      <td className="p-2 text-right font-semibold text-emerald-600">{c.tong}m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Tab: Báo cáo vải */}
      {tab === "baocao" && (
        <>
          <div className="card p-4 flex items-center gap-3">
            <label className="text-sm font-semibold">Lệnh SX:</label>
            <select
              value={baoCaoLenSX}
              onChange={(e) => setBaoCaoLenSX(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
            >
              {lenhSXVailable.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800">
                <tr>
                  <th className="p-2 text-left">Phiếu</th>
                  <th className="p-2 text-left">SP</th>
                  <th className="p-2 text-left">Loại</th>
                  <th className="p-2 text-left">Màu</th>
                  <th className="p-2 text-left">Vải</th>
                  <th className="p-2 text-right">Cần (m)</th>
                  <th className="p-2 text-right">Đạt (m)</th>
                  <th className="p-2 text-right">Hao hụt (m)</th>
                  <th className="p-2 text-right">Đơn giá</th>
                  <th className="p-2 text-right">Tiền vải</th>
                </tr>
              </thead>
              <tbody>
                {baoCao.map((r) => (
                  <tr key={r.phieuId} className="border-t border-slate-200 dark:border-slate-700">
                    <td className="p-2 font-mono text-xs">{r.phieuId}</td>
                    <td className="p-2 font-mono">{r.maSP}</td>
                    <td className="p-2 text-xs">{r.phanLoai}</td>
                    <td className="p-2 text-xs">{r.mau}</td>
                    <td className="p-2 text-xs">{r.vai}</td>
                    <td className="p-2 text-right font-semibold">{r.soMetCan}m</td>
                    <td className="p-2 text-right text-emerald-600">{r.soMetDat}m</td>
                    <td className="p-2 text-right text-rose-600">{r.soMetTon}m</td>
                    <td className="p-2 text-right text-xs">{r.donGiaVai.toLocaleString()}</td>
                    <td className="p-2 text-right font-bold text-violet-600">{(r.tienVai / 1000).toFixed(0)}K</td>
                  </tr>
                ))}
                <tr className="bg-slate-50 dark:bg-slate-800/50 font-semibold">
                  <td colSpan={5} className="p-2 text-right">TỔNG</td>
                  <td className="p-2 text-right">{baoCao.reduce((s, r) => s + r.soMetCan, 0).toFixed(0)}m</td>
                  <td className="p-2 text-right text-emerald-600">{baoCao.reduce((s, r) => s + r.soMetDat, 0).toFixed(0)}m</td>
                  <td className="p-2 text-right text-rose-600">{baoCao.reduce((s, r) => s + r.soMetTon, 0).toFixed(0)}m</td>
                  <td></td>
                  <td className="p-2 text-right text-violet-600">{(baoCao.reduce((s, r) => s + r.tienVai, 0) / 1_000_000).toFixed(2)}tr</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: any; color: string }) {
  const colors: Record<string, string> = {
    blue: "from-blue-500/10 to-cyan-500/10 text-blue-600",
    emerald: "from-emerald-500/10 to-green-500/10 text-emerald-600",
    rose: "from-rose-500/10 to-red-500/10 text-rose-600",
    violet: "from-violet-500/10 to-purple-500/10 text-violet-600",
  };
  return (
    <div className={`card p-3 bg-gradient-to-br ${colors[color]}`}>
      <div className="flex items-center gap-1.5 opacity-80 text-xs">{icon}<span>{label}</span></div>
      <div className="text-xl font-bold mt-1">{value}</div>
    </div>
  );
}
