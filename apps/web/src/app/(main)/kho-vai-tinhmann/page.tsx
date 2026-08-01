"use client";

import { useState, useEffect, useRef } from "react";
import {
  Package, AlertCircle, CheckCircle2, TrendingDown, TrendingUp,
  Scissors, Calculator, FileText, RefreshCw, BarChart3, Plus, X
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
import { KHO_VAI, NHA_CUNG_CAP, formatVNDShort, type KhoVai } from "@/lib/data/real-data";
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
  const [showNhap, setShowNhap] = useState<string | null>(null);
  const [uploadingVT, setUploadingVT] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadingVT) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const url = ev.target?.result as string;
        setInventory(prev => prev.map(v => v.maVT === uploadingVT ? { ...v, imageUrl: url } as any : v));
        // Mock save to KHO_VAI
        const idx = KHO_VAI.findIndex(x => x.maVT === uploadingVT);
        if (idx !== -1) (KHO_VAI as any)[idx].imageUrl = url;
        toast.success("Đã tải ảnh lên thành công!");
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    setUploadingVT(null);
  };

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
    // Mở Modal thay vì dùng prompt() (chuẩn hoá form nhập liệu)
    setShowNhap(maVT);
  };

  // Báo cáo theo LSX
  const baoCao: BaoCaoVai[] = baoCaoVaiTheoLSX(ALL_REAL_PHIEU, baoCaoLenSX);
  const lenhSXVailable = Array.from(new Set(ALL_REAL_PHIEU.map((p) => p.lenhSX)));

  return (
    <div className="min-h-[calc(100vh-64px)] -m-4 md:-m-6 p-4 md:p-6 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-400/20 via-teal-200/10 to-transparent dark:from-teal-900/30 dark:via-slate-900 dark:to-slate-900">
      <div className="max-w-7xl mx-auto space-y-5 animate-fade-in relative z-10">
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
      <div className="flex gap-2 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl p-1.5 w-fit">
        {[
          { key: "tonkho", label: "Tồn kho", icon: <Package className="w-4 h-4" /> },
          { key: "tinhman", label: "Tính màn", icon: <Calculator className="w-4 h-4" /> },
          { key: "baocao", label: "Báo cáo vải", icon: <BarChart3 className="w-4 h-4" /> },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 text-sm rounded-lg flex items-center gap-2 transition-all ${
              tab === t.key 
                ? "bg-white dark:bg-slate-700 shadow-md font-bold text-blue-600 dark:text-blue-400" 
                : "font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Tồn kho */}
      {tab === "tonkho" && (
        <>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
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
          <div className="card overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="p-3 text-left font-semibold">Mã VT</th>
                  <th className="p-3 text-left font-semibold">Tên vải</th>
                  <th className="p-3 text-left font-semibold">Màu</th>
                  <th className="p-3 text-right font-semibold">Tồn kho (kg)</th>
                  <th className="p-3 text-right font-semibold">Đơn giá</th>
                  <th className="p-3 text-right font-semibold">Giá trị</th>
                  <th className="p-3 text-center font-semibold">Trạng thái</th>
                  <th className="p-3 text-center font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {inventory.slice(0, 20).map((v, index) => (
                  <tr key={v.maVT} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">
                      {`VAI-${(index + 1).toString().padStart(2, "0")}`}
                    </td>
                    <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{v.tenVT}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-md border border-slate-300/50 shadow-sm overflow-hidden flex-shrink-0 cursor-pointer relative group flex items-center justify-center bg-slate-100"
                          style={{ backgroundColor: (v as any).imageUrl ? 'transparent' : getColorHex(v.mauSac) }}
                          onClick={() => { setUploadingVT(v.maVT); fileInputRef.current?.click(); }}
                          title="Bấm để tải ảnh lên"
                        >
                          {(v as any).imageUrl ? (
                            <img src={(v as any).imageUrl} alt={v.mauSac} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] text-white/80 font-bold opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md">+Ảnh</span>
                          )}
                        </div>
                        <span className="font-medium">{v.mauSac}</span>
                      </div>
                    </td>
                    <td className="p-3 text-right font-bold text-sky-600 dark:text-sky-400">{v.tonKho.toFixed(0)}</td>
                    <td className="p-3 text-right text-slate-600 dark:text-slate-400">{v.donGia.toLocaleString()}</td>
                    <td className="p-3 text-right font-medium">{(v.tonKho * v.donGia / 1_000_000).toFixed(2)}tr</td>
                    <td className="p-3 text-center">
                      {v.tonKho < 50 ? (
                        <span className="inline-flex px-2 py-1 rounded-md bg-rose-50 dark:bg-rose-500/10 text-rose-600 font-medium text-xs">Sắp hết</span>
                      ) : v.tonKho > 400 ? (
                        <span className="inline-flex px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 font-medium text-xs">Nhiều</span>
                      ) : (
                        <span className="inline-flex px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium text-xs">Bình thường</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <button onClick={() => handleNhapKho(v.maVT)} className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline">
                        + Nhập
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-3 text-sm text-slate-500 text-center bg-slate-50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800">
              Đang hiển thị 20/{inventory.length} loại vải
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

      {/* Modal Nhập kho vải (chuẩn hoá theo form Kho Phụ liệu) */}
      {showNhap && (
        <VaiNhapKho
          maVT={showNhap}
          user={user}
          onClose={() => setShowNhap(null)}
          onSuccess={() => refresh()}
        />
      )}
      </div>
    </div>
  );
}

// ============ HELPER COLOR SWATCH ============
function getColorHex(mau: string) {
  if (!mau) return "#ccc";
  const m = mau.toLowerCase();
  if (m.includes("trắng")) return "#f1f2f6";
  if (m.includes("đen")) return "#2f3542";
  if (m.includes("xám chì")) return "#57606f";
  if (m.includes("xám")) return "#a4b0be";
  if (m.includes("rêu")) return "#4b6584"; // Hoặc rêu lá: #3e5128
  if (m.includes("nâu")) return "#8b5a2b";
  if (m.includes("xanh đen")) return "#0c2461";
  if (m.includes("đỏ")) return "#ff4757";
  if (m.includes("vàng")) return "#eccc68";
  if (m.includes("xanh chuối")) return "#7bed9f";
  if (m.includes("tím")) return "#9b59b6";
  if (m.includes("hồng")) return "#ff9ff3";
  if (m.includes("xanh dương") || m.includes("xanh bích")) return "#1e90ff";
  if (m.includes("cam")) return "#ffa502";
  return "#dfe4ea"; // default
}

// ============ MODAL NHẬP KHO VẢI (chuẩn hoá theo form Kho Phụ liệu) ============
function VaiNhapKho({
  maVT,
  user,
  onClose,
  onSuccess,
}: {
  maVT: string;
  user: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const vt = KHO_VAI.find((v) => v.maVT === maVT);
  const nccList = NHA_CUNG_CAP;
  const [form, setForm] = useState({
    ngay: new Date().toISOString().split("T")[0],
    soLuong: 0,
    donGia: vt?.donGia ?? 0,
    nguonNhap: nccList[0]?.tenDonVi || "",
    nguoiThucHien: user?.name || user?.id || "NV kho",
    ghiChu: "",
  });

  if (!vt) return null;

  const thanhTien = form.soLuong * form.donGia;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.soLuong <= 0) {
      toast.error("Số lượng phải > 0");
      return;
    }
    if (!form.nguonNhap) {
      toast.error("Vui lòng chọn nguồn nhập (NCC)");
      return;
    }
    const r = nhapKho(maVT, form.soLuong, user, form.ghiChu, {
      ngay: form.ngay,
      donGia: form.donGia,
      nguonNhap: form.nguonNhap,
      nguoiThucHien: form.nguoiThucHien,
    });
    if (r.ok) {
      toast.success(`✅ Nhập kho ${vt.tenVT}: +${form.soLuong.toLocaleString()}kg (${formatVNDShort(thanhTien)})`);
      onSuccess();
      onClose();
    } else {
      toast.error(r.message);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="card max-w-md w-full p-6 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Plus className="w-5 h-5 text-sky-600" />
            Nhập kho vải: {vt.tenVT}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/40 dark:hover:bg-white/5 rounded"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thông tin VT (read-only) */}
        <div className="bg-sky-500/10 dark:bg-sky-500/20 rounded p-2 mb-3 text-xs flex flex-wrap items-center gap-x-3 gap-y-1">
          <span><span className="opacity-70">Mã:</span> <b className="font-mono">{vt.maVT}</b></span>
          <span><span className="opacity-70">ĐVT:</span> <b>kg</b></span>
          <span><span className="opacity-70">Loại:</span> <b>{vt.loai || "—"}</b></span>
          <span><span className="opacity-70">Màu:</span> <b>{vt.mauSac || "—"}</b></span>
          <span><span className="opacity-70">Tồn hiện tại:</span> <b className="text-sky-700">{vt.tonKho.toFixed(0)} kg</b></span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1">Ngày nhập *</label>
              <input
                type="date"
                required
                className="input w-full"
                value={form.ngay}
                onChange={(e) => setForm({ ...form, ngay: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Số lượng (kg) *</label>
              <input
                type="number"
                required
                min={1}
                step="0.1"
                className="input w-full"
                value={form.soLuong || ""}
                onChange={(e) => setForm({ ...form, soLuong: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1">Đơn giá (đ/kg) *</label>
              <input
                type="number"
                required
                min={0}
                className="input w-full"
                value={form.donGia}
                onChange={(e) => setForm({ ...form, donGia: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Thành tiền</label>
              <div className="input w-full bg-emerald-500/10 text-emerald-700 font-bold flex items-center">
                {formatVNDShort(thanhTien)}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium block mb-1">
              Nguồn nhập (NCC) *{" "}
              {nccList.length === 0 && (
                <span className="text-rose-600 font-normal">— chưa có NCC "Đang hợp tác"</span>
              )}
            </label>
            <select
              required
              className="input w-full"
              value={form.nguonNhap}
              onChange={(e) => setForm({ ...form, nguonNhap: e.target.value })}
            >
              <option value="">-- Chọn NCC --</option>
              {nccList.map((n) => (
                <option key={n.maNCC} value={n.tenDonVi}>
                  {n.tenDonVi}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium block mb-1">Người thực hiện</label>
            <input
              className="input w-full"
              value={form.nguoiThucHien}
              onChange={(e) => setForm({ ...form, nguoiThucHien: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs font-medium block mb-1">Ghi chú</label>
            <textarea
              className="input w-full min-h-[60px]"
              value={form.ghiChu}
              onChange={(e) => setForm({ ...form, ghiChu: e.target.value })}
              placeholder="VD: Nhập lô đầu tháng 8, chất lượng OK, đã kiểm tra mẫu..."
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 bg-sky-500 hover:bg-sky-600"
            >
              Xác nhận nhập kho
            </button>
          </div>
        </form>
      </div>
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
