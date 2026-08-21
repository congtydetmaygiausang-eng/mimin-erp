"use client";

// ============================================
// Module Dệt Nhuộm - Sợi -> Dệt -> Nhuộm -> Nhập kho
// Thay thế toàn bộ 5 module cũ (yarn-production-chain/yarn-weaving-dyeing/
// yarn-warehouse/yarn-inventory/yarn-me-soi-engine) - dữ liệu thật qua
// Supabase (det-nhuom-store.tsx), ghi thẳng vào giao_dich_kho + cong_no
// thật thay vì localStorage giả.
// ============================================

import { useState, useMemo } from "react";
import {
  Package, Truck, Palette, Boxes, CheckCircle2, AlertTriangle,
  Plus, ArrowRight, Loader2, ClipboardList,
} from "lucide-react";
import { useDetNhuom, calcHaoHut } from "@/lib/data/det-nhuom-store";
import { useNhaCungCap } from "@/lib/data/nha-cung-cap-store";
import { useDoiTac } from "@/lib/data/doi-tac-store";
import { useNhanSu } from "@/lib/data/nhan-su-store";

type Tab = "soi" | "det" | "nhuom" | "kho";

const today = () => new Date().toISOString().slice(0, 10);

function fmt(n: number) {
  return n.toLocaleString("vi-VN");
}

export default function DetNhuomFlowPage() {
  const { soi, det, nhuom, loading, themNhapSoi, themGiaoDet, themGiaoNhuom, xacNhanNhapKho } = useDetNhuom();
  const { list: nccList } = useNhaCungCap();
  const { list: doiTacList } = useDoiTac();
  const { list: nhanSuList } = useNhanSu();
  const [tab, setTab] = useState<Tab>("soi");

  const tonSoi = useMemo(() => soi.reduce((s, r) => s + r.kg, 0) - det.reduce((s, r) => s + r.kgVao, 0), [soi, det]);
  const tonMoc = useMemo(() => det.reduce((s, r) => s + r.kgRa, 0) - nhuom.reduce((s, r) => s + r.kgGui, 0), [det, nhuom]);
  const tpChuaNhap = useMemo(() => nhuom.filter((n) => !n.daNhapKho).reduce((s, r) => s + r.kgTp, 0), [nhuom]);
  const daNhapKhoTong = useMemo(() => nhuom.filter((n) => n.daNhapKho).reduce((s, r) => s + r.kgTp, 0), [nhuom]);

  const TABS: { key: Tab; label: string; icon: any; n: number }[] = [
    { key: "soi", label: "Nhập sợi", icon: Package, n: 1 },
    { key: "det", label: "Giao dệt", icon: Truck, n: 2 },
    { key: "nhuom", label: "Giao nhuộm", icon: Palette, n: 3 },
    { key: "kho", label: "Nhập kho & Lịch sử", icon: Boxes, n: 4 },
  ];

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Dệt Nhuộm</h1>
        <p className="text-sm text-slate-500 mt-1">Theo dõi trọn chuỗi Sợi → Dệt → Nhuộm → Nhập kho, có kiểm soát định mức hao hụt.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Tồn sợi (chưa giao dệt)" value={`${fmt(Math.max(0, tonSoi))} kg`} color="from-blue-500 to-blue-600" icon={Package} />
        <SummaryCard label="Tồn vải mộc (chưa giao nhuộm)" value={`${fmt(Math.max(0, tonMoc))} kg`} color="from-violet-500 to-violet-600" icon={Truck} />
        <SummaryCard label="TP chờ nhập kho" value={`${fmt(tpChuaNhap)} kg`} color="from-rose-500 to-rose-600" icon={Palette} />
        <SummaryCard label="Đã nhập kho" value={`${fmt(daNhapKhoTong)} kg`} color="from-emerald-500 to-emerald-600" icon={Boxes} />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 dark:border-slate-700 pb-px">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = t.key === tab;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-bold whitespace-nowrap transition border-b-2 ${
                active
                  ? "border-cyan-500 text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/30"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <span className={`w-5 h-5 rounded-full text-[11px] flex items-center justify-center font-black ${active ? "bg-cyan-500 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500"}`}>
                {t.n}
              </span>
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Đang tải dữ liệu...
        </div>
      ) : (
        <>
          {tab === "soi" && <NhapSoiTab nccList={nccList} soi={soi} themNhapSoi={themNhapSoi} />}
          {tab === "det" && <GiaoDetTab soi={soi} det={det} doiTacList={doiTacList} nhanSuList={nhanSuList} themGiaoDet={themGiaoDet} />}
          {tab === "nhuom" && <GiaoNhuomTab det={det} nhuom={nhuom} doiTacList={doiTacList} nhanSuList={nhanSuList} themGiaoNhuom={themGiaoNhuom} />}
          {tab === "kho" && <NhapKhoTab nhuom={nhuom} det={det} xacNhanNhapKho={xacNhanNhapKho} />}
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color, icon: Icon }: { label: string; value: string; color: string; icon: any }) {
  return (
    <div className={`rounded-2xl p-4 text-white bg-gradient-to-br ${color} shadow-md`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold opacity-90">{label}</span>
        <Icon className="w-4 h-4 opacity-80" />
      </div>
      <div className="text-xl font-extrabold mt-2 tabular-nums">{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-semibold text-slate-600 dark:text-slate-300">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500";

// ============ TAB 1: NHẬP SỢI ============
function NhapSoiTab({ nccList, soi, themNhapSoi }: { nccList: any[]; soi: any[]; themNhapSoi: any }) {
  const [nccId, setNccId] = useState("");
  const [loaiSoi, setLoaiSoi] = useState("");
  const [kg, setKg] = useState("");
  const [gia, setGia] = useState("");
  const [maPhieu, setMaPhieu] = useState("");
  const [ghiChu, setGhiChu] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const kgN = parseFloat(kg), giaN = parseFloat(gia);
    if (!loaiSoi || !kgN || !giaN) return;
    setBusy(true);
    const ncc = nccList.find((n) => n.id === nccId);
    await themNhapSoi({
      nccId: nccId || undefined,
      nccTen: ncc?.ten_ncc || "Khác",
      loaiSoi, kg: kgN, gia: giaN,
      maPhieu: maPhieu || undefined,
      ngay: today(),
      ghiChu: ghiChu || undefined,
    });
    setBusy(false);
    setLoaiSoi(""); setKg(""); setGia(""); setMaPhieu(""); setGhiChu("");
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-3 bg-white dark:bg-slate-900">
        <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2"><Package className="w-4 h-4" /> Nhập lô sợi mới</h3>
        <Field label="Nhà cung cấp sợi">
          <select className={inputCls} value={nccId} onChange={(e) => setNccId(e.target.value)}>
            <option value="">-- Khác / không chọn --</option>
            {nccList.map((n) => <option key={n.id} value={n.id}>{n.ten_ncc}</option>)}
          </select>
        </Field>
        <Field label="Loại sợi">
          <input className={inputCls} value={loaiSoi} onChange={(e) => setLoaiSoi(e.target.value)} placeholder="VD: Cotton 100%, Poly 100%" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Trọng lượng (kg)">
            <input type="number" className={inputCls} value={kg} onChange={(e) => setKg(e.target.value)} />
          </Field>
          <Field label="Đơn giá (đ/kg)">
            <input type="number" className={inputCls} value={gia} onChange={(e) => setGia(e.target.value)} />
          </Field>
        </div>
        {kg && gia && (
          <div className="text-sm text-slate-500">Thành tiền: <b className="text-slate-800 dark:text-slate-100">{fmt(Math.round(parseFloat(kg) * parseFloat(gia)))}đ</b></div>
        )}
        <Field label="Mã phiếu (tuỳ chọn)">
          <input className={inputCls} value={maPhieu} onChange={(e) => setMaPhieu(e.target.value)} />
        </Field>
        <Field label="Ghi chú">
          <input className={inputCls} value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} />
        </Field>
        <button
          disabled={busy || !loaiSoi || !kg || !gia}
          onClick={submit}
          className="w-full mt-2 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 text-white font-bold text-sm flex items-center justify-center gap-2"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Lưu lô sợi
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-200">Các lô sợi đã nhập ({soi.length})</div>
        <div className="max-h-[480px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {soi.length === 0 && <div className="p-6 text-center text-sm text-slate-400">Chưa có lô sợi nào</div>}
          {soi.map((s) => (
            <div key={s.id} className="p-3 text-sm flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-700 dark:text-slate-200">{s.loaiSoi} · {s.kg}kg</div>
                <div className="text-xs text-slate-400">{s.nccTen} · {s.ngay}</div>
              </div>
              <div className="text-right font-bold text-slate-600 dark:text-slate-300">{fmt(s.thanhTien)}đ</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ TAB 2: GIAO DỆT ============
function GiaoDetTab({ soi, det, doiTacList, nhanSuList, themGiaoDet }: any) {
  const [nhapSoiId, setNhapSoiId] = useState("");
  const [xuongId, setXuongId] = useState("");
  const [kgVao, setKgVao] = useState("");
  const [kgRa, setKgRa] = useState("");
  const [cay, setCay] = useState("");
  const [giaDet, setGiaDet] = useState("");
  const [dinhMuc, setDinhMuc] = useState("2");
  const [nguoiPhuTrach, setNguoiPhuTrach] = useState("");
  const [busy, setBusy] = useState(false);

  const preview = useMemo(() => {
    if (!kgVao || !kgRa) return null;
    return calcHaoHut(parseFloat(kgVao), parseFloat(kgRa), parseFloat(dinhMuc) || 0);
  }, [kgVao, kgRa, dinhMuc]);

  const submit = async () => {
    const kgVaoN = parseFloat(kgVao), kgRaN = parseFloat(kgRa), giaN = parseFloat(giaDet);
    if (!kgVaoN || !kgRaN || !giaN || !xuongId) return;
    setBusy(true);
    const xuong = doiTacList.find((d: any) => d.ma === xuongId);
    await themGiaoDet({
      nhapSoiId: nhapSoiId || undefined,
      xuongId: xuong?.ma, xuongTen: xuong?.tenDonVi || "",
      kgVao: kgVaoN, kgRa: kgRaN, cay: parseFloat(cay) || 0,
      giaDet: giaN, dinhMucHaoHut: parseFloat(dinhMuc) || 0,
      nguoiPhuTrach: nguoiPhuTrach || undefined,
      ngay: today(),
    });
    setBusy(false);
    setKgVao(""); setKgRa(""); setCay(""); setGiaDet("");
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-3 bg-white dark:bg-slate-900">
        <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2"><Truck className="w-4 h-4" /> Giao sợi đi dệt</h3>
        <Field label="Lô sợi nguồn (tuỳ chọn)">
          <select className={inputCls} value={nhapSoiId} onChange={(e) => setNhapSoiId(e.target.value)}>
            <option value="">-- Không gắn lô cụ thể --</option>
            {soi.map((s: any) => <option key={s.id} value={s.id}>{s.loaiSoi} · {s.kg}kg · {s.nccTen}</option>)}
          </select>
        </Field>
        <Field label="Xưởng dệt gia công">
          <select className={inputCls} value={xuongId} onChange={(e) => setXuongId(e.target.value)}>
            <option value="">-- Chọn xưởng --</option>
            {doiTacList.map((d: any) => <option key={d.ma} value={d.ma}>{d.tenDonVi}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Sợi vào (kg)"><input type="number" className={inputCls} value={kgVao} onChange={(e) => setKgVao(e.target.value)} /></Field>
          <Field label="Mộc ra (kg)"><input type="number" className={inputCls} value={kgRa} onChange={(e) => setKgRa(e.target.value)} /></Field>
          <Field label="Số cây"><input type="number" className={inputCls} value={cay} onChange={(e) => setCay(e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Đơn giá dệt (đ/kg)"><input type="number" className={inputCls} value={giaDet} onChange={(e) => setGiaDet(e.target.value)} /></Field>
          <Field label="Định mức hao hụt (%)"><input type="number" className={inputCls} value={dinhMuc} onChange={(e) => setDinhMuc(e.target.value)} /></Field>
        </div>
        {preview && (
          <div className={`text-sm rounded-lg p-2.5 flex items-center gap-2 ${preview.vuotDinhMuc ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300" : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"}`}>
            {preview.vuotDinhMuc ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            Hao hụt thực tế <b>{preview.haoHutThucTe}%</b> {preview.vuotDinhMuc ? `- VƯỢT định mức ${dinhMuc}%, sẽ bị trừ phạt` : "- trong định mức"}
          </div>
        )}
        <Field label="Người phụ trách">
          <select className={inputCls} value={nguoiPhuTrach} onChange={(e) => setNguoiPhuTrach(e.target.value)}>
            <option value="">-- Chọn nhân sự --</option>
            {nhanSuList.map((n: any) => <option key={n.maNV} value={n.maNV}>{n.hoTen}</option>)}
          </select>
        </Field>
        <button
          disabled={busy || !kgVao || !kgRa || !giaDet || !xuongId}
          onClick={submit}
          className="w-full mt-2 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-bold text-sm flex items-center justify-center gap-2"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />} Lưu lô dệt
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-200">Các lô đã dệt ({det.length})</div>
        <div className="max-h-[480px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {det.length === 0 && <div className="p-6 text-center text-sm text-slate-400">Chưa có lô dệt nào</div>}
          {det.map((d: any) => (
            <div key={d.id} className="p-3 text-sm">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-slate-700 dark:text-slate-200">{d.xuongTen} · {d.kgVao}→{d.kgRa}kg</div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${d.vuotDinhMuc ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                  Hao hụt {d.haoHutThucTe}%
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">{d.cay} cây · {d.ngay}{d.tienPhatHaoHut > 0 && ` · Phạt ${fmt(d.tienPhatHaoHut)}đ`}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ TAB 3: GIAO NHUỘM ============
function GiaoNhuomTab({ det, nhuom, doiTacList, nhanSuList, themGiaoNhuom }: any) {
  const [giaoDetId, setGiaoDetId] = useState("");
  const [xuongId, setXuongId] = useState("");
  const [mau, setMau] = useState("");
  const [cay, setCay] = useState("");
  const [kgGui, setKgGui] = useState("");
  const [kgTp, setKgTp] = useState("");
  const [gia, setGia] = useState("");
  const [dinhMuc, setDinhMuc] = useState("5");
  const [nguoiPhuTrach, setNguoiPhuTrach] = useState("");
  const [busy, setBusy] = useState(false);

  const preview = useMemo(() => {
    if (!kgGui || !kgTp) return null;
    return calcHaoHut(parseFloat(kgGui), parseFloat(kgTp), parseFloat(dinhMuc) || 0);
  }, [kgGui, kgTp, dinhMuc]);

  const submit = async () => {
    const kgGuiN = parseFloat(kgGui), kgTpN = parseFloat(kgTp), giaN = parseFloat(gia);
    if (!kgGuiN || !kgTpN || !giaN || !xuongId || !mau) return;
    setBusy(true);
    const xuong = doiTacList.find((d: any) => d.ma === xuongId);
    await themGiaoNhuom({
      giaoDetId: giaoDetId || undefined,
      xuongId: xuong?.ma, xuongTen: xuong?.tenDonVi || "",
      mau, cay: parseFloat(cay) || 0,
      kgGui: kgGuiN, kgTp: kgTpN, gia: giaN,
      kho: "vai",
      dinhMucHaoHut: parseFloat(dinhMuc) || 0,
      nguoiPhuTrach: nguoiPhuTrach || undefined,
      ngay: today(),
    });
    setBusy(false);
    setMau(""); setCay(""); setKgGui(""); setKgTp(""); setGia("");
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-3 bg-white dark:bg-slate-900">
        <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2"><Palette className="w-4 h-4" /> Giao mộc đi nhuộm</h3>
        <Field label="Lô vải mộc nguồn (tuỳ chọn)">
          <select className={inputCls} value={giaoDetId} onChange={(e) => setGiaoDetId(e.target.value)}>
            <option value="">-- Không gắn lô cụ thể --</option>
            {det.map((d: any) => <option key={d.id} value={d.id}>{d.xuongTen} · {d.kgRa}kg mộc</option>)}
          </select>
        </Field>
        <Field label="Xưởng nhuộm gia công">
          <select className={inputCls} value={xuongId} onChange={(e) => setXuongId(e.target.value)}>
            <option value="">-- Chọn xưởng --</option>
            {doiTacList.map((d: any) => <option key={d.ma} value={d.ma}>{d.tenDonVi}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Màu"><input className={inputCls} value={mau} onChange={(e) => setMau(e.target.value)} placeholder="VD: Xanh Navy" /></Field>
          <Field label="Số cây"><input type="number" className={inputCls} value={cay} onChange={(e) => setCay(e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Gửi (kg)"><input type="number" className={inputCls} value={kgGui} onChange={(e) => setKgGui(e.target.value)} /></Field>
          <Field label="TP về (kg)"><input type="number" className={inputCls} value={kgTp} onChange={(e) => setKgTp(e.target.value)} /></Field>
          <Field label="Đơn giá (đ/kg)"><input type="number" className={inputCls} value={gia} onChange={(e) => setGia(e.target.value)} /></Field>
        </div>
        <Field label="Định mức hao hụt (%)"><input type="number" className={inputCls} value={dinhMuc} onChange={(e) => setDinhMuc(e.target.value)} /></Field>
        {preview && (
          <div className={`text-sm rounded-lg p-2.5 flex items-center gap-2 ${preview.vuotDinhMuc ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300" : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"}`}>
            {preview.vuotDinhMuc ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            Hao hụt thực tế <b>{preview.haoHutThucTe}%</b> {preview.vuotDinhMuc ? `- VƯỢT định mức ${dinhMuc}%, sẽ bị trừ phạt` : "- trong định mức"}
          </div>
        )}
        <Field label="Người phụ trách">
          <select className={inputCls} value={nguoiPhuTrach} onChange={(e) => setNguoiPhuTrach(e.target.value)}>
            <option value="">-- Chọn nhân sự --</option>
            {nhanSuList.map((n: any) => <option key={n.maNV} value={n.maNV}>{n.hoTen}</option>)}
          </select>
        </Field>
        <button
          disabled={busy || !kgGui || !kgTp || !gia || !xuongId || !mau}
          onClick={submit}
          className="w-full mt-2 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-bold text-sm flex items-center justify-center gap-2"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />} Lưu lô nhuộm
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-200">Các lô đã nhuộm ({nhuom.length})</div>
        <div className="max-h-[480px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {nhuom.length === 0 && <div className="p-6 text-center text-sm text-slate-400">Chưa có lô nhuộm nào</div>}
          {nhuom.map((n: any) => (
            <div key={n.id} className="p-3 text-sm">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-slate-700 dark:text-slate-200">{n.mau} · {n.xuongTen}</div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${n.daNhapKho ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {n.daNhapKho ? "Đã nhập kho" : "Chờ nhập kho"}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">{n.kgGui}→{n.kgTp}kg · hao hụt {n.haoHutThucTe}% · {n.ngay}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ TAB 4: NHẬP KHO & LỊCH SỬ ============
function NhapKhoTab({ nhuom, det, xacNhanNhapKho }: any) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const cho = nhuom.filter((n: any) => !n.daNhapKho);
  const xong = nhuom.filter((n: any) => n.daNhapKho);

  const confirm = async (id: string) => {
    setBusyId(id);
    await xacNhanNhapKho(id);
    setBusyId(null);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
          <ClipboardList className="w-4 h-4" /> Chờ xác nhận nhập kho ({cho.length})
        </div>
        {cho.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-400">Không có lô nào đang chờ</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {cho.map((n: any) => (
              <div key={n.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="font-bold text-slate-700 dark:text-slate-200">{n.mau} · {n.kgTp}kg · {n.cay} cây</div>
                  <div className="text-xs text-slate-400">Xưởng nhuộm: {n.xuongTen} · {n.ngay}
                    {n.vuotDinhMuc && <span className="text-amber-600 font-semibold"> · Vượt định mức hao hụt {n.haoHutThucTe}%</span>}
                  </div>
                </div>
                <button
                  disabled={busyId === n.id}
                  onClick={() => confirm(n.id)}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-sm flex items-center gap-2"
                >
                  {busyId === n.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Boxes className="w-4 h-4" />}
                  Xác nhận nhập kho
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-200">Đã nhập kho ({xong.length})</div>
        <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {xong.length === 0 && <div className="p-6 text-center text-sm text-slate-400">Chưa có lô nào nhập kho</div>}
          {xong.map((n: any) => (
            <div key={n.id} className="p-3 text-sm flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-700 dark:text-slate-200">{n.mau} · {n.kgTp}kg · Mã VT: {n.maVtKho}</div>
                <div className="text-xs text-slate-400">{n.xuongTen} · {n.ngay}</div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
