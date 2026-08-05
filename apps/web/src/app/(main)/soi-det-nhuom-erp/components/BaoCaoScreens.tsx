// ============ BAO CAO SCREENS ============
// Tach tu page.tsx (2026-08-05 - toi uu B.1)
// 10. Cong no gia cong, 11. Bao cao hao hut, 12. Bao cao gia von, 13. Kho Log, 14. Truy nguoc lo

import { useState, useEffect } from "react";
import { DollarSign, AlertTriangle, Calculator, History, Search, Link2, Lock } from "lucide-react";
import {
  baoCaoCongNoGiaCong, baoCaoHaoHut,
  getAllLoVaiTP, getAllKhoLog, getAllPhieuNghiemThuMau, getAllLenhDet, getAllPhieuNhapSoi, truyNguocLo,
  type LoVaiTP, type PhieuNghiemThuMau, type LenhDet, type PhieuNhapSoi,
} from "@/lib/yarn-production-chain";

// ============ 10. CONG NO GIA CONG ============
export function CongNo() {
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

// ============ 11. BAO CAO HAO HUT ============
export function BaoCaoHaoHut() {
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

// ============ 12. BAO CAO GIA VON ============
export function BaoCaoGiaVon() {
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
              const chiSoi = l.tongGiaTri * 0.55;
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

// ============ 13. KHO LOG ============
export function KhoLog() {
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

// ============ 14. TRUY NGUOC LO ============
export function TruyNguoc() {
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
