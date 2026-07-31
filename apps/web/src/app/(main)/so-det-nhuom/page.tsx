"use client";

import { useState, useEffect } from "react";
import {
  Factory, ArrowRight, Package, Scissors, Palette, Boxes,
  CheckCircle2, AlertCircle, TrendingUp, Plus, RefreshCw,
  FileText, BarChart3, ArrowDown
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/components/session-provider";
import {
  LOAI_SOI, LOAI_VAI_DAU_RA, DINH_MUC_CHUYEN_DOI,
  getPhieuSoi, getPhieuDet, getPhieuNhuom,
  savePhieuSoi, savePhieuDet, savePhieuNhuom,
  tinhBaoCao, tinhMetVaiTuSoi, tinhMetSauDet, tinhMetSauNhuom,
  taoPhieuDetTuSoi, taoPhieuNhuomTuDet, nhapKhoVaiTuNhuom,
  type PhieuSoi, type PhieuDet, type PhieuNhuom
} from "@/lib/yarn-weaving-dyeing";

type Tab = "soi" | "det" | "nhuom" | "baocao";

export default function SoDetNhuomPage() {
  const { user } = useSession();
  const [tab, setTab] = useState<Tab>("soi");
  const [sois, setSois] = useState<PhieuSoi[]>([]);
  const [dets, setDets] = useState<PhieuDet[]>([]);
  const [nhuoms, setNhuoms] = useState<PhieuNhuom[]>([]);

  useEffect(() => {
    setSois(getPhieuSoi());
    setDets(getPhieuDet());
    setNhuoms(getPhieuNhuom());
  }, []);

  const baoCao = tinhBaoCao();

  // === Workflow actions ===
  const handleTaoPhieuDet = (soi: PhieuSoi) => {
    if (soi.trangThai === "Đã nhập kho") {
      toast.error("Phiếu sợi đã hoàn tất");
      return;
    }
    const det = taoPhieuDetTuSoi(soi, user, "DT-DET-01", "DNT Dệt Bắc Ninh", 25000);
    const newDets = [det, ...dets];
    setDets(newDets);
    savePhieuDet(newDets);
    // Update trạng thái sợi
    const newSois = sois.map((s) => s.id === soi.id ? { ...s, trangThai: "Đang dệt" as const } : s);
    setSois(newSois);
    savePhieuSoi(newSois);
    toast.success(`✅ Tạo phiếu dệt ${det.id} từ ${soi.id}`);
  };

  const handleHoanThanhDet = (det: PhieuDet) => {
    const newDets = dets.map((d) => d.id === det.id ? {
      ...d, trangThai: "Hoàn thành" as const, ngayHoanThanh: new Date().toISOString().slice(0, 10),
    } : d);
    setDets(newDets);
    savePhieuDet(newDets);
    // Update sợi
    const newSois = sois.map((s) => s.id === det.phieuSoiId ? { ...s, trangThai: "Đã dệt" as const } : s);
    setSois(newSois);
    savePhieuSoi(newSois);
    toast.success(`✅ Hoàn thành dệt ${det.id} → ${det.soMetDat}m vải thô`);
  };

  const handleTaoPhieuNhuom = (det: PhieuDet) => {
    if (det.trangThai !== "Hoàn thành") {
      toast.error("Phiếu dệt chưa hoàn thành");
      return;
    }
    const nhuom = taoPhieuNhuomTuDet(det, user, "DT-NH-01", "Cty Nhuộm Hà Đông", 8000, "Trắng ngà", "V-TRANG003", "TRẮNG 003(1)");
    const newNhuoms = [nhuom, ...nhuoms];
    setNhuoms(newNhuoms);
    savePhieuNhuom(newNhuoms);
    toast.success(`✅ Tạo phiếu nhuộm ${nhuom.id} từ ${det.id}`);
  };

  const handleHoanThanhNhuom = (nhuom: PhieuNhuom) => {
    const newNhuoms = nhuoms.map((n) => n.id === nhuom.id ? {
      ...n, trangThai: "Hoàn thành" as const, ngayHoanThanh: new Date().toISOString().slice(0, 10),
    } : n);
    setNhuoms(newNhuoms);
    savePhieuNhuom(newNhuoms);
    // Nhập kho vải
    const r = nhapKhoVaiTuNhuom({ ...nhuom, trangThai: "Hoàn thành" as const }, user);
    if (r.ok) toast.success(`✅ Hoàn thành nhuộm → nhập kho ${r.message}`);
    else toast.error(r.message);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Factory className="w-7 h-7 text-blue-500" /> Sợi - Dệt - Nhuộm
        </h1>
        <p className="opacity-70 mt-1 text-sm">
          Quy trình sản xuất vải từ sợi: 1kg sợi = 4m vải thô · Dệt hao hụt 10% · Nhuộm hao hụt 5%
        </p>
      </div>

      {/* Stats tổng hợp */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat icon={<Package className="w-4 h-4" />} label="Tổng sợi nhập" value={`${baoCao.tongSoi.toLocaleString()} kg`} color="blue" sub={`${baoCao.phieusSoi} phiếu`} />
        <Stat icon={<Scissors className="w-4 h-4" />} label="Vải thô (sau dệt)" value={`${baoCao.tongVaiTho.toLocaleString()} m`} color="violet" sub={`${baoCao.phieusDet} phiếu dệt`} />
        <Stat icon={<Palette className="w-4 h-4" />} label="Vải thành phẩm" value={`${baoCao.tongVaiThanhPham.toLocaleString()} m`} color="emerald" sub={`${baoCao.phieusNhuom} phiếu nhuộm`} />
        <Stat icon={<TrendingUp className="w-4 h-4" />} label="Tổng chi phí" value={`${((baoCao.tongTienSoi + baoCao.tongTienDet + baoCao.tongTienNhuom) / 1_000_000).toFixed(1)}tr`} color="rose" sub="Sợi + Dệt + Nhuộm" />
      </div>

      {/* Workflow diagram */}
      <div className="card p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-500" /> Quy trình sản xuất
        </h3>
        <div className="flex items-center justify-center gap-2 text-sm overflow-x-auto pb-2">
          {[
            { key: "soi", label: "1. Nhập sợi", icon: <Package className="w-4 h-4" />, color: "from-blue-500 to-cyan-500" },
            { key: "det", label: "2. Dệt", icon: <Scissors className="w-4 h-4" />, color: "from-violet-500 to-purple-500" },
            { key: "nhuom", label: "3. Nhuộm", icon: <Palette className="w-4 h-4" />, color: "from-rose-500 to-pink-500" },
            { key: "kho", label: "4. Kho vải", icon: <Boxes className="w-4 h-4" />, color: "from-emerald-500 to-green-500" },
          ].map((s, i, arr) => (
            <div key={s.key} className="flex items-center gap-2 shrink-0">
              <div className={`px-3 py-2 rounded-lg bg-gradient-to-br ${s.color} text-white shadow-md`}>
                <div className="flex items-center gap-1.5">
                  {s.icon}
                  <span className="font-semibold">{s.label}</span>
                </div>
              </div>
              {i < arr.length - 1 && (
                <ArrowRight className="w-5 h-5 opacity-50" />
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/30">
            <div className="font-semibold">1kg sợi</div>
            <div className="text-emerald-600">= 4m vải thô</div>
          </div>
          <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/30">
            <div className="font-semibold">Dệt</div>
            <div className="text-rose-600">-10% hao hụt</div>
          </div>
          <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/30">
            <div className="font-semibold">Nhuộm</div>
            <div className="text-rose-600">-5% hao hụt</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-fit">
        {[
          { key: "soi", label: "1. Sợi", icon: <Package className="w-3.5 h-3.5" /> },
          { key: "det", label: "2. Dệt", icon: <Scissors className="w-3.5 h-3.5" /> },
          { key: "nhuom", label: "3. Nhuộm", icon: <Palette className="w-3.5 h-3.5" /> },
          { key: "baocao", label: "Báo cáo", icon: <BarChart3 className="w-3.5 h-3.5" /> },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as Tab)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 ${
              tab === t.key ? "bg-white dark:bg-slate-700 shadow" : "opacity-60 hover:opacity-100"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Sợi */}
      {tab === "soi" && (
        <div className="card overflow-x-auto">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-500" /> Phiếu nhập sợi ({sois.length})
            </h3>
            <div className="text-xs opacity-70">
              Tổng: <b>{baoCao.tongSoi.toLocaleString()} kg</b> · 
              <b>{(baoCao.tongSoi * 4).toLocaleString()} m vải dự kiến</b>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800">
              <tr>
                <th className="p-2 text-left">Mã phiếu</th>
                <th className="p-2 text-left">Loại sợi</th>
                <th className="p-2 text-left">NCC</th>
                <th className="p-2 text-right">Kg</th>
                <th className="p-2 text-right">Đơn giá</th>
                <th className="p-2 text-right">Thành tiền</th>
                <th className="p-2 text-right">M vải dự kiến</th>
                <th className="p-2 text-center">Trạng thái</th>
                <th className="p-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {sois.map((p) => (
                <tr key={p.id} className="border-t border-slate-200 dark:border-slate-700">
                  <td className="p-2 font-mono font-bold text-blue-500">{p.id}</td>
                  <td className="p-2">
                    <div className="font-semibold">{p.tenSoi}</div>
                    <div className="text-[10px] opacity-60">{p.loaiSoi}</div>
                  </td>
                  <td className="p-2 text-xs">{p.tenNCC}</td>
                  <td className="p-2 text-right font-bold">{p.soKg.toLocaleString()}</td>
                  <td className="p-2 text-right text-xs">{p.donGia.toLocaleString()}</td>
                  <td className="p-2 text-right font-semibold text-violet-600">{(p.thanhTien / 1_000_000).toFixed(1)}tr</td>
                  <td className="p-2 text-right text-emerald-600 font-semibold">{p.soMetDuKien.toLocaleString()}m</td>
                  <td className="p-2 text-center">
                    <StatusBadge status={p.trangThai} />
                  </td>
                  <td className="p-2 text-center">
                    {p.trangThai === "Chờ dệt" && (
                      <button
                        onClick={() => handleTaoPhieuDet(p)}
                        className="text-xs px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
                      >
                        → Tạo phiếu dệt
                      </button>
                    )}
                    {p.trangThai === "Đang dệt" && <span className="text-xs opacity-50">Đang xử lý</span>}
                    {p.trangThai === "Đã nhập kho" && <span className="text-xs text-emerald-500">✓ Đã xong</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Dệt */}
      {tab === "det" && (
        <div className="card overflow-x-auto">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Scissors className="w-5 h-5 text-violet-500" /> Phiếu dệt ({dets.length})
            </h3>
            <div className="text-xs opacity-70">
              Hao hụt TB: <b className="text-rose-600">{baoCao.tyLeHaoHutDet.toFixed(1)}%</b>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800">
              <tr>
                <th className="p-2 text-left">Mã phiếu</th>
                <th className="p-2 text-left">Từ phiếu sợi</th>
                <th className="p-2 text-left">Loại sợi</th>
                <th className="p-2 text-right">Kg sợi</th>
                <th className="p-2 text-right">M vải thô (dự kiến)</th>
                <th className="p-2 text-right">M đạt</th>
                <th className="p-2 text-right">M lỗi</th>
                <th className="p-2 text-left">Người dệt</th>
                <th className="p-2 text-right">Phí dệt</th>
                <th className="p-2 text-center">Trạng thái</th>
                <th className="p-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {dets.map((p) => (
                <tr key={p.id} className="border-t border-slate-200 dark:border-slate-700">
                  <td className="p-2 font-mono font-bold text-violet-500">{p.id}</td>
                  <td className="p-2 font-mono text-xs">{p.phieuSoiId}</td>
                  <td className="p-2 text-xs">{p.loaiSoi}</td>
                  <td className="p-2 text-right font-semibold">{p.soKgSoi.toLocaleString()}</td>
                  <td className="p-2 text-right text-blue-600">{p.soMetDuKien.toLocaleString()}m</td>
                  <td className="p-2 text-right font-semibold text-emerald-600">{p.soMetDat.toLocaleString()}m</td>
                  <td className="p-2 text-right text-rose-600">{p.soMetLoi}m</td>
                  <td className="p-2 text-xs">{p.tenNguoiDet}</td>
                  <td className="p-2 text-right font-semibold">{(p.thanhTien / 1_000_000).toFixed(1)}tr</td>
                  <td className="p-2 text-center">
                    <StatusBadge status={p.trangThai} />
                  </td>
                  <td className="p-2 text-center">
                    {p.trangThai === "Đang dệt" && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            const updated = { ...p, soMetDat: Math.floor(p.soMetDuKien * 0.99), soMetLoi: Math.floor(p.soMetDuKien * 0.01) };
                            const newDets = dets.map((d) => d.id === p.id ? updated : d);
                            setDets(newDets);
                            savePhieuDet(newDets);
                            handleHoanThanhDet(updated);
                          }}
                          className="text-xs px-2 py-1 rounded bg-emerald-500 text-white hover:bg-emerald-600"
                        >
                          Hoàn thành
                        </button>
                      </div>
                    )}
                    {p.trangThai === "Hoàn thành" && (
                      <button
                        onClick={() => handleTaoPhieuNhuom(p)}
                        className="text-xs px-2 py-1 rounded bg-rose-500 text-white hover:bg-rose-600"
                      >
                        → Nhuộm
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Nhuộm */}
      {tab === "nhuom" && (
        <div className="card overflow-x-auto">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Palette className="w-5 h-5 text-rose-500" /> Phiếu nhuộm ({nhuoms.length})
            </h3>
            <div className="text-xs opacity-70">
              Tổng vải thành phẩm: <b className="text-emerald-600">{baoCao.tongVaiThanhPham.toLocaleString()}m</b>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800">
              <tr>
                <th className="p-2 text-left">Mã phiếu</th>
                <th className="p-2 text-left">Từ phiếu dệt</th>
                <th className="p-2 text-left">Màu nhuộm</th>
                <th className="p-2 text-right">M vải thô</th>
                <th className="p-2 text-right">M đạt</th>
                <th className="p-2 text-right">M lỗi</th>
                <th className="p-2 text-left">Vải thành phẩm</th>
                <th className="p-2 text-left">Người nhuộm</th>
                <th className="p-2 text-right">Phí nhuộm</th>
                <th className="p-2 text-center">Trạng thái</th>
                <th className="p-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {nhuoms.map((p) => (
                <tr key={p.id} className="border-t border-slate-200 dark:border-slate-700">
                  <td className="p-2 font-mono font-bold text-rose-500">{p.id}</td>
                  <td className="p-2 font-mono text-xs">{p.phieuDetId}</td>
                  <td className="p-2">
                    <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-700 text-xs font-semibold">
                      {p.mauNhuom}
                    </span>
                  </td>
                  <td className="p-2 text-right text-blue-600">{p.soMetVaiTho.toLocaleString()}m</td>
                  <td className="p-2 text-right font-semibold text-emerald-600">{p.soMetDat.toLocaleString()}m</td>
                  <td className="p-2 text-right text-rose-600">{p.soMetLoi}m</td>
                  <td className="p-2 text-xs">
                    <div className="font-mono">{p.maVaiThanhPham}</div>
                    <div className="opacity-60">{p.tenVaiThanhPham}</div>
                  </td>
                  <td className="p-2 text-xs">{p.tenNguoiNhuom}</td>
                  <td className="p-2 text-right font-semibold">{(p.thanhTien / 1_000_000).toFixed(1)}tr</td>
                  <td className="p-2 text-center">
                    <StatusBadge status={p.trangThai} />
                  </td>
                  <td className="p-2 text-center">
                    {p.trangThai === "Đang nhuộm" && (
                      <button
                        onClick={() => {
                          const updated = { ...p, soMetDat: Math.floor(p.soMetSauHaoHut * 0.995), soMetLoi: Math.floor(p.soMetSauHaoHut * 0.005) };
                          const newNhuoms = nhuoms.map((n) => n.id === p.id ? updated : n);
                          setNhuoms(newNhuoms);
                          savePhieuNhuom(newNhuoms);
                          handleHoanThanhNhuom(updated);
                        }}
                        className="text-xs px-2 py-1 rounded bg-emerald-500 text-white hover:bg-emerald-600"
                      >
                        Hoàn thành + Nhập kho
                      </button>
                    )}
                    {p.trangThai === "Hoàn thành" && (
                      <span className="text-xs text-emerald-500">✓ Đã nhập kho</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Báo cáo */}
      {tab === "baocao" && (
        <div className="space-y-3">
          <div className="card p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" /> Tổng hợp Sợi - Dệt - Nhuộm - Kho vải
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-500/30">
                <h4 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4" /> 1. Sợi ({baoCao.phieusSoi} phiếu)
                </h4>
                <div className="text-2xl font-bold text-blue-600">{baoCao.tongSoi.toLocaleString()} kg</div>
                <div className="text-xs opacity-70 mt-1">
                  Tiền: {(baoCao.tongTienSoi / 1_000_000).toFixed(1)}tr
                </div>
                <div className="text-xs text-emerald-600 mt-1">
                  → {(baoCao.tongSoi * 4).toLocaleString()}m vải thô (dự kiến)
                </div>
              </div>

              <div className="p-4 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-500/30">
                <h4 className="font-semibold text-violet-700 mb-2 flex items-center gap-2">
                  <Scissors className="w-4 h-4" /> 2. Dệt ({baoCao.phieusDet} phiếu)
                </h4>
                <div className="text-2xl font-bold text-violet-600">{baoCao.tongVaiTho.toLocaleString()} m</div>
                <div className="text-xs opacity-70 mt-1">
                  Phí: {(baoCao.tongTienDet / 1_000_000).toFixed(1)}tr
                </div>
                <div className="text-xs text-rose-600 mt-1">
                  Hao hụt: {baoCao.tyLeHaoHutDet.toFixed(1)}%
                </div>
              </div>

              <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-500/30">
                <h4 className="font-semibold text-rose-700 mb-2 flex items-center gap-2">
                  <Palette className="w-4 h-4" /> 3. Nhuộm ({baoCao.phieusNhuom} phiếu)
                </h4>
                <div className="text-2xl font-bold text-rose-600">{baoCao.tongVaiThanhPham.toLocaleString()} m</div>
                <div className="text-xs opacity-70 mt-1">
                  Phí: {(baoCao.tongTienNhuom / 1_000_000).toFixed(1)}tr
                </div>
                <div className="text-xs text-emerald-600 mt-1">
                  → Kho vải
                </div>
              </div>
            </div>
          </div>

          {/* Định mức chuyển đổi */}
          <div className="card p-5">
            <h3 className="font-semibold mb-3">📐 Định mức chuyển đổi</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="p-3 rounded bg-slate-50 dark:bg-slate-800/30">
                <div className="font-semibold">1kg sợi = ?</div>
                <div className="text-2xl font-bold text-blue-600 mt-1">
                  {DINH_MUC_CHUYEN_DOI.SOI_TO_VAI_THO}m
                </div>
                <div className="text-xs opacity-70">vải thô (chưa dệt)</div>
              </div>
              <div className="p-3 rounded bg-slate-50 dark:bg-slate-800/30">
                <div className="font-semibold">Dệt hao hụt</div>
                <div className="text-2xl font-bold text-rose-600 mt-1">
                  {DINH_MUC_CHUYEN_DOI.HAO_HUT_DET}%
                </div>
                <div className="text-xs opacity-70">100m thô → 90m sau dệt</div>
              </div>
              <div className="p-3 rounded bg-slate-50 dark:bg-slate-800/30">
                <div className="font-semibold">Nhuộm hao hụt</div>
                <div className="text-2xl font-bold text-rose-600 mt-1">
                  {DINH_MUC_CHUYEN_DOI.HAO_HUT_NHUOM}%
                </div>
                <div className="text-xs opacity-70">100m thô → 95m sau nhuộm</div>
              </div>
            </div>
          </div>

          {/* Loại sợi */}
          <div className="card p-4">
            <h3 className="font-semibold mb-3">🧵 Loại sợi có sẵn</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {LOAI_SOI.map((s) => (
                <div key={s.ma} className="p-3 rounded bg-slate-50 dark:bg-slate-800/30 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center font-bold">
                    {s.mau.slice(0, 1)}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{s.ten}</div>
                    <div className="text-xs opacity-70">{s.ma} · {s.chatLuong}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-violet-600">{(s.donGia / 1000).toFixed(0)}K</div>
                    <div className="text-[10px] opacity-60">/{s.dvt}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value, color, sub }: { icon: React.ReactNode; label: string; value: any; color: string; sub?: string }) {
  const colors: Record<string, string> = {
    blue: "from-blue-500/10 to-cyan-500/10 text-blue-600",
    emerald: "from-emerald-500/10 to-green-500/10 text-emerald-600",
    violet: "from-violet-500/10 to-purple-500/10 text-violet-600",
    rose: "from-rose-500/10 to-red-500/10 text-rose-600",
  };
  return (
    <div className={`card p-3 bg-gradient-to-br ${colors[color]}`}>
      <div className="flex items-center gap-1.5 opacity-80 text-xs">{icon}<span>{label}</span></div>
      <div className="text-xl font-bold mt-1">{value}</div>
      {sub && <div className="text-[10px] opacity-70 mt-0.5">{sub}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Chờ dệt": "bg-amber-500/20 text-amber-700",
    "Chờ nhuộm": "bg-amber-500/20 text-amber-700",
    "Đang dệt": "bg-blue-500/20 text-blue-700",
    "Đang nhuộm": "bg-rose-500/20 text-rose-700",
    "Đã dệt": "bg-violet-500/20 text-violet-700",
    "Hoàn thành": "bg-emerald-500/20 text-emerald-700",
    "Đã nhập kho": "bg-emerald-500 text-white",
    "Hủy": "bg-rose-500 text-white",
  };
  return <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${map[status] || "bg-slate-300 text-slate-800"}`}>{status}</span>;
}
