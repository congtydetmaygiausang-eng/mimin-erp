// ============ CONG NO VIEW + BAO CAO VIEW ============
// Tach tu page.tsx (2026-08-05 - toi uu B.4)

import { useState } from "react";
import { CreditCard, FileText, TrendingDown, DollarSign, Boxes, Calculator } from "lucide-react";
import { toast } from "sonner";
import { baoCaoCongNoByDoiTuong, thanhToanCongNo, type BaoCaoCongNo } from "@/lib/master-data";
import { getAllPhieuNhapSoi, getAllLenhDet, getAllMeNhuom, getAllLoVaiTP } from "@/lib/yarn-production-chain";
import { formatVNDShort } from "@/lib/data/real-data";
import { Card, KPICard, Row } from "./ui-blocks";

// ============ CONG NO VIEW ============
export function CongNoView() {
  const [list, setList] = useState(baoCaoCongNoByDoiTuong());
  const [selected, setSelected] = useState<BaoCaoCongNo | null>(null);

  const refresh = () => setList(baoCaoCongNoByDoiTuong());

  return (
    <div className="space-y-3 p-3">
      <h2 className="text-lg font-bold flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-rose-500" /> Công nợ gia công
      </h2>

      {selected ? (
        <div className="space-y-2">
          <button onClick={() => setSelected(null)} className="text-sm text-blue-600">← Quay lại</button>
          <div className="card p-3 bg-rose-50 dark:bg-rose-900/20">
            <div className="font-bold">{selected.tenDoiTuong}</div>
            <div className="text-[10px] opacity-60">{selected.doiTuongId} · {selected.loai}</div>
            <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
              <Card label="Phát sinh" v={selected.tongPhatSinh} c="blue" />
              <Card label="Đã trả" v={selected.tongThanhToan} c="emerald" />
              <Card label="Còn nợ" v={selected.tongConNo} c="rose" />
            </div>
          </div>
          <h3 className="font-semibold text-sm mt-3">📋 Chi tiết phiếu ({selected.chiTiet.length})</h3>
          {selected.chiTiet.map((c) => (
            <div key={c.id} className="card p-2 text-xs">
              <div className="flex justify-between">
                <span className="font-mono font-bold">{c.maPhieuGoc}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded text-white ${
                  c.trangThai === "Đã trả" ? "bg-emerald-500" :
                  c.trangThai === "Đã trả một phần" ? "bg-amber-500" : "bg-rose-500"
                }`}>
                  {c.trangThai}
                </span>
              </div>
              <div className="opacity-70 text-[10px]">{c.moTa}</div>
              <div className="mt-1 grid grid-cols-3 gap-1 text-[10px]">
                <div>PS: <strong>{c.phatSinh.toLocaleString()}</strong></div>
                <div>TT: <strong>{c.thanhToan.toLocaleString()}</strong></div>
                <div>Nợ: <strong className="text-rose-600">{c.conNo.toLocaleString()}</strong></div>
              </div>
              {c.conNo > 0 && (
                <button
                  onClick={() => {
                    const tien = parseInt(prompt(`Thanh toán cho ${c.maPhieuGoc} (còn nợ ${c.conNo.toLocaleString()}đ):`, String(c.conNo)) || "0");
                    if (tien > 0) {
                      const r = thanhToanCongNo(c.id, tien);
                      if (r.ok) { toast.success(r.message); refresh(); setSelected(baoCaoCongNoByDoiTuong().find((x) => x.doiTuongId === selected.doiTuongId) || null); }
                      else toast.error(r.message);
                    }
                  }}
                  className="btn-primary text-xs w-full mt-2 bg-emerald-500"
                >
                  💰 Thanh toán
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {list.length === 0 ? (
            <p className="text-center text-sm opacity-60 py-8">Chưa có công nợ. Tạo lệnh tổng trước.</p>
          ) : list.map((c) => (
            <div key={c.doiTuongId} onClick={() => setSelected(c)} className="card p-3 cursor-pointer hover:scale-[1.02] transition">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <div className="font-bold text-sm">{c.tenDoiTuong}</div>
                  <div className="text-[10px] opacity-60">{c.loai} · {c.soPhieu} phiếu</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-rose-600">{(c.tongConNo / 1_000_000).toFixed(1)}tr</div>
                  <div className="text-[10px] opacity-60">còn nợ</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[10px] mt-2">
                <div>PS: {(c.tongPhatSinh / 1_000_000).toFixed(1)}tr</div>
                <div>TT: {(c.tongThanhToan / 1_000_000).toFixed(1)}tr</div>
                <div className="text-rose-600">Nợ: {(c.tongConNo / 1_000_000).toFixed(1)}tr</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ BAO CAO VIEW ============
export function BaoCaoView() {
  const [pnss, setPnss] = useState(getAllPhieuNhapSoi());
  const [lds, setLds] = useState(getAllLenhDet());
  const [mns, setMns] = useState(getAllMeNhuom());
  const [ltps, setLtps] = useState(getAllLoVaiTP());

  const tongSoi = pnss.reduce((s, p) => s + p.thanhTien, 0);
  const tongKgTP = ltps.reduce((s, l) => s + l.tongKg, 0);
  const tongGiaTriTP = ltps.reduce((s, l) => s + l.tongGiaTri, 0);
  const giaVonTB = tongKgTP > 0 ? tongGiaTriTP / tongKgTP : 0;

  const avgHaoHutDet = lds.filter((l) => l.haoHutPt !== undefined).reduce((s, l) => s + (l.haoHutPt || 0), 0) / Math.max(lds.filter((l) => l.haoHutPt !== undefined).length, 1);

  return (
    <div className="space-y-3 p-3">
      <h2 className="text-lg font-bold flex items-center gap-2">
        <FileText className="w-5 h-5 text-amber-500" /> Báo cáo tổng hợp
      </h2>

      <div className="grid grid-cols-2 gap-2">
        <KPICard label="Hao hụt dệt" value={`${avgHaoHutDet.toFixed(1)}%`} color={avgHaoHutDet <= 4 ? "emerald" : avgHaoHutDet <= 10 ? "amber" : "rose"} icon={TrendingDown} />
        <KPICard label="Giá vốn TB" value={`${giaVonTB.toFixed(0)}đ`} color="blue" icon={DollarSign} />
        <KPICard label="Tổng vải TP" value={`${tongKgTP.toFixed(0)}kg`} color="emerald" icon={Boxes} />
        <KPICard label="Giá trị TP" value={`${(tongGiaTriTP / 1_000_000).toFixed(1)}tr`} color="amber" icon={Calculator} />
      </div>

      <div className="card p-3">
        <h3 className="font-semibold text-sm mb-2">📊 Thống kê</h3>
        <div className="space-y-1 text-xs">
          <Row label="Phiếu nhập sợi" value={`${pnss.length} phiếu`} sub={formatVNDShort(tongSoi)} />
          <Row label="Lệnh dệt" value={`${lds.length} lệnh`} sub={`${lds.filter((l) => l.trangThai === "Hoàn thành").length} hoàn thành`} />
          <Row label="Mẻ nhuộm" value={`${mns.length} mẻ`} sub={`${mns.reduce((s, m) => s + m.danhSachMau.length, 0)} màu`} />
          <Row label="Lô vải TP" value={`${ltps.length} lô`} sub={`${(tongGiaTriTP / 1_000_000).toFixed(1)}tr`} />
        </div>
      </div>
    </div>
  );
}
