// ============ DASHBOARD ============
// Tach tu page.tsx (2026-08-05 - toi uu B.4)

import { useState } from "react";
import { Package, Truck, Palette, Boxes, CreditCard, GitBranch } from "lucide-react";
import { getAllPhieuNhapSoi, getAllLenhDet, getAllMeNhuom, getAllLoVaiTP } from "@/lib/yarn-production-chain";
import { baoCaoCongNoByDoiTuong } from "@/lib/master-data";
import { Stat } from "./ui-blocks";

export function Dashboard() {
  const [pnss, setPnss] = useState(getAllPhieuNhapSoi());
  const [lds, setLds] = useState(getAllLenhDet());
  const [mns, setMns] = useState(getAllMeNhuom());
  const [ltps, setLtps] = useState(getAllLoVaiTP());
  const [congNos, setCongNos] = useState(baoCaoCongNoByDoiTuong());

  const tongNhapSoi = pnss.reduce((s, p) => s + p.thanhTien, 0);
  const tongCongNo = congNos.reduce((s, c) => s + c.tongConNo, 0);

  return (
    <div className="space-y-3 p-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Stat n={pnss.length} label="Phiếu nhập sợi" sub={`${(tongNhapSoi / 1_000_000).toFixed(0)}tr`} color="blue" icon={Package} />
        <Stat n={lds.length} label="Lệnh dệt" sub={`${lds.filter((l) => l.trangThai !== "Hoàn thành").length} đang chạy`} color="violet" icon={Truck} />
        <Stat n={mns.length} label="Mẻ nhuộm" sub={`${mns.filter((m) => m.trangThai !== "Hoàn thành").length} đang nhuộm`} color="rose" icon={Palette} />
        <Stat n={ltps.length} label="Lô vải TP" sub={`${ltps.reduce((s, l) => s + l.tongKg, 0).toFixed(0)}kg`} color="emerald" icon={Boxes} />
      </div>

      <div className="card p-3 bg-gradient-to-r from-rose-500/10 to-pink-500/10 border-2 border-rose-300">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-rose-600" /> Tổng công nợ phải trả
          </h3>
          <span className="text-2xl font-bold text-rose-600">
            {(tongCongNo / 1_000_000).toFixed(1)}tr
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          {congNos.slice(0, 3).map((c) => (
            <div key={c.doiTuongId} className="p-2 rounded bg-white dark:bg-slate-800">
              <div className="opacity-60 truncate">{c.tenDoiTuong}</div>
              <div className="font-bold text-rose-600">{(c.tongConNo / 1_000_000).toFixed(1)}tr</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-3">
        <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-blue-500" /> Luồng sản xuất
        </h3>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
          {[
            { l: "1.Sợi", c: "blue" },
            { l: "2.Dệt", c: "violet" },
            { l: "3.Mộc", c: "purple" },
            { l: "4.Nhuộm", c: "rose" },
            { l: "5.Màu", c: "pink" },
            { l: "6.TP", c: "emerald" },
            { l: "7.QC", c: "amber" },
          ].map((s, i) => (
            <div key={i} className={`p-1 rounded bg-${s.c}-500/20 text-${s.c}-700 font-semibold`}>
              {s.l}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
