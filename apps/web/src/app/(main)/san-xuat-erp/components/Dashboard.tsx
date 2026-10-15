// ============ DASHBOARD ============
// Tach tu page.tsx (2026-08-05 - toi uu B.4)

import { useState } from "react";
import { Package, Truck, Palette, Boxes, CreditCard, GitBranch, LayoutList, Plus } from "lucide-react";
import { getAllPhieuNhapSoi, getAllLenhDet, getAllMeNhuom, getAllLoVaiTP } from "@/lib/yarn-production-chain";
import { baoCaoCongNoByDoiTuong } from "@/lib/master-data";
import { formatVNDShort } from "@/lib/data/real-data";
import { Stat } from "./ui-blocks";
import { DanhSachLenhTong } from "./DanhSachLenhTong";

interface DashboardProps {
  onChuyenSangLenhTong?: () => void;
}

export function Dashboard({ onChuyenSangLenhTong }: DashboardProps) {
  const [pnss, setPnss] = useState(getAllPhieuNhapSoi());
  const [lds, setLds] = useState(getAllLenhDet());
  const [mns, setMns] = useState(getAllMeNhuom());
  const [ltps, setLtps] = useState(getAllLoVaiTP());
  const [congNos, setCongNos] = useState(baoCaoCongNoByDoiTuong());

  const tongNhapSoi = pnss.reduce((s, p) => s + p.thanhTien, 0);
  const tongCongNo = congNos.reduce((s, c) => s + c.tongConNo, 0);

  return (
    <div className="space-y-4 p-3">
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
            { l: "3.Mộc", style: "bg-slate-100 text-slate-800 border border-slate-300" },
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

      {/* Danh sách Lệnh SX vải & Theo dõi quy trình chi tiết các bước */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div>
            <h2 className="flex items-center gap-2 text-base font-black text-slate-900">
              <LayoutList className="h-5 w-5 text-orange-600" /> Danh Sách Lệnh SX & Quy Trình Các Bước
            </h2>
            <p className="text-xs text-slate-500">
              Theo dõi chi tiết 7 bước sau khi bấm "Lưu & tạo lệnh": Kho Sợi ➔ Xưởng Dệt ➔ Nghiệm thu Mộc ➔ Xưởng Nhuộm ➔ Nghiệm thu Màu ➔ Kho Vải TP ➔ Giá Vốn & Công Nợ
            </p>
          </div>
          {onChuyenSangLenhTong && (
            <button
              type="button"
              onClick={onChuyenSangLenhTong}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-sm transition active:scale-95 shrink-0"
            >
              <Plus className="h-4 w-4" /> Tạo Lệnh SX Mới
            </button>
          )}
        </div>

        <DanhSachLenhTong onTaoLenhMoi={onChuyenSangLenhTong} />
      </div>
    </div>
  );
}
