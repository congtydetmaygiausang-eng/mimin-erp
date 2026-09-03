// ============ DASHBOARD ============
// Tach tu page.tsx (2026-08-05 - toi uu B.4)

import { useState } from "react";
import { Package, Truck, Palette, Boxes, CreditCard, GitBranch } from "lucide-react";
import { getAllPhieuNhapSoi, getAllLenhDet, getAllMeNhuom, getAllLoVaiTP } from "@/lib/yarn-production-chain";
import { baoCaoCongNoByDoiTuong } from "@/lib/master-data";
import { formatVNDShort } from "@/lib/data/real-data";
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
        <Stat n={pnss.length} label="Phiếu nhập sợi" sub={formatVNDShort(tongNhapSoi)} color="petrol" icon={Package} />
        <Stat n={lds.length} label="Lệnh dệt" sub={`${lds.filter((l) => l.trangThai !== "Hoàn thành").length} đang chạy`} color="sage" icon={Truck} />
        <Stat n={mns.length} label="Mẻ nhuộm" sub={`${mns.filter((m) => m.trangThai !== "Hoàn thành").length} đang nhuộm`} color="orange" icon={Palette} />
        <Stat n={ltps.length} label="Lô vải TP" sub={`${ltps.reduce((s, l) => s + l.tongKg, 0).toFixed(0)}kg`} color="cream" icon={Boxes} />
      </div>

      <div className="card bg-white border border-[#E5E0D8] rounded-xl shadow-sm p-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-[#307082]">
          <CreditCard className="w-5 h-5" /> Tổng công nợ phải trả
        </h3>
        <span className="text-3xl font-black text-[#307082]">
          {(tongCongNo / 1_000_000).toFixed(1)}tr
        </span>
      </div>

      <div className="card bg-white border border-[#E5E0D8] rounded-xl shadow-sm p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#307082]">
          <GitBranch className="w-5 h-5" /> Luồng sản xuất
        </h3>
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {[
            { l: "1.Sợi", style: "bg-[#307082] text-white" },
            { l: "2.Dệt", style: "bg-[#6CA3A2] text-white" },
            { l: "3.Mộc", style: "bg-[#ECE7DC] text-[#307082] border border-[#D6CFC0]" },
            { l: "4.Nhuộm", style: "bg-[#EA990C] text-white" },
            { l: "5.Màu", style: "bg-[#307082]/85 text-white" },
            { l: "6.TP", style: "bg-[#6CA3A2]/80 text-white" },
            { l: "7.QC", style: "bg-[#EA990C]/75 text-white" },
          ].map((s, i) => (
            <div key={i} className={`rounded px-1 py-1.5 font-bold ${s.style}`}>
              {s.l}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
