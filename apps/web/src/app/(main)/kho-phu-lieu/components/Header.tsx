// ============ HEADER + 4 KPIs + TABS ============
// Tach tu page.tsx (2026-08-05 - toi uu B.8)

import { Boxes, Plus, Minus, History, Box, DollarSign, TrendingUp, AlertTriangle } from "lucide-react";
import { formatVND, formatVNDShort } from "@/lib/data/real-data";
import { Stat } from "./ui-blocks";
import type { Tab } from "../data";

interface HeaderProps {
  inventoryCount: number;
  tongGiaTri: number;
  dsCanhBao: any[];
  dsCanhBaoDetails: string;
  tongNhap: number;
  onReset: () => void;
  tab: Tab;
  setTab: (v: Tab) => void;
}

export function Header({ inventoryCount, tongGiaTri, dsCanhBao, dsCanhBaoDetails, tongNhap, onReset, tab, setTab }: HeaderProps) {
  return (
    <div className="bg-[#134e5e] p-5 md:p-6 rounded-3xl shadow-lg border border-teal-800/30 mb-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 text-white">
            <Boxes className="w-7 h-7 text-teal-300" />
            Kho Phụ Liệu
          </h1>
          <p className="opacity-90 mt-1 text-sm text-teal-100">
            {inventoryCount} mã phụ liệu · Tổng giá trị tồn <b className="text-emerald-400">{formatVNDShort(tongGiaTri)}</b>
            {dsCanhBao.length > 0 && <> · <b className="text-rose-400">⚠️ {dsCanhBao.length} mã dưới tồn tối thiểu</b></>}
          </p>
        </div>
        <button onClick={onReset} className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">Reset</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
        <Stat icon={<Box className="w-4 h-4" />} label="Tổng tồn kho" value={`${inventoryCount} mã`} subValue={`${dsCanhBao.length} cảnh báo`} color="blue" />
        <Stat icon={<DollarSign className="w-4 h-4" />} label="Giá trị tồn" value={formatVNDShort(tongGiaTri)} subValue={formatVND(tongGiaTri)} color="emerald" />
        <Stat icon={<TrendingUp className="w-4 h-4" />} label="Tổng nhập" value={formatVNDShort(tongNhap)} color="violet" />
        <Stat icon={<AlertTriangle className="w-4 h-4" />} label="Cảnh báo tồn" value={dsCanhBao.length} subValue="mã dưới tối thiểu" color={dsCanhBao.length > 0 ? "rose" : "blue"} />
      </div>

      {dsCanhBao.length > 0 && (
        <div className="mt-4 p-3 rounded-xl flex items-start gap-3 bg-red-500/20 border border-red-500/30 text-white">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <b className="text-rose-300">⚠️ Cảnh báo tồn kho thấp:</b>{" "}
            {dsCanhBaoDetails}
          </div>
        </div>
      )}

      <div className="flex gap-2 bg-black/20 rounded-xl p-1.5 w-fit mt-5">
        {([
          { id: "tongquan" as Tab, label: `Tổng quan (${inventoryCount})`, icon: <Boxes className="w-4 h-4" /> },
          { id: "nhap" as Tab, label: `Nhập kho`, icon: <Plus className="w-4 h-4" /> },
          { id: "xuat" as Tab, label: `Xuất kho`, icon: <Minus className="w-4 h-4" /> },
          { id: "lichsu" as Tab, label: "Lịch sử GD", icon: <History className="w-4 h-4" /> },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm rounded-lg flex items-center gap-2 transition-all ${
              tab === t.id
                ? "bg-teal-500 shadow-md font-bold text-white"
                : "font-medium text-teal-100 hover:bg-black/20 hover:text-white"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
