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
    <div className="rounded-3xl overflow-hidden shadow-xl mb-6" style={{ background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 35%, #0891b2 75%, #06b6d4 100%)" }}>
      <div className="p-5 md:p-6 text-white">
        <div className="text-xs font-medium opacity-90 mb-1.5 flex items-center gap-1.5">
          <Boxes className="w-3.5 h-3.5" /> MIMIN ERP · Kho & Giao hàng
        </div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold flex items-center gap-2.5">
              <Boxes className="w-7 h-7" />
              Kho Phụ Liệu
            </h1>
            <p className="text-sm opacity-95 mt-1.5">
              {inventoryCount} mã phụ liệu · Tổng giá trị tồn <b className="text-white">{formatVNDShort(tongGiaTri)}</b>
              {dsCanhBao.length > 0 && <> · <b className="text-rose-200">⚠️ {dsCanhBao.length} mã dưới tồn tối thiểu</b></>}
            </p>
          </div>
          <button onClick={onReset} className="bg-white/15 hover:bg-white/25 text-white text-xs px-3 py-1.5 rounded-lg border border-white/20 transition-colors">Reset</button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/20">
            <div className="text-xs opacity-90 flex items-center gap-1.5"><Box className="w-3.5 h-3.5" /> Tổng tồn kho</div>
            <div className="text-xl md:text-2xl font-bold mt-1">{inventoryCount} mã</div>
            <div className="text-[10px] opacity-80 mt-0.5">{dsCanhBao.length} cảnh báo</div>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/20">
            <div className="text-xs opacity-90 flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Giá trị tồn</div>
            <div className="text-xl md:text-2xl font-bold mt-1">{formatVNDShort(tongGiaTri)}</div>
            <div className="text-[10px] opacity-80 mt-0.5">{formatVND(tongGiaTri)}</div>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/20">
            <div className="text-xs opacity-90 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> Tổng nhập</div>
            <div className="text-xl md:text-2xl font-bold mt-1">{formatVNDShort(tongNhap)}</div>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/20">
            <div className="text-xs opacity-90 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Cảnh báo tồn</div>
            <div className="text-xl md:text-2xl font-bold mt-1">{dsCanhBao.length}</div>
            <div className="text-[10px] opacity-80 mt-0.5">mã dưới tối thiểu</div>
          </div>
        </div>

        {dsCanhBao.length > 0 && (
          <div className="mt-4 p-3 rounded-xl flex items-start gap-3 bg-red-500/30 border border-red-300/40 text-white backdrop-blur-sm">
            <AlertTriangle className="w-5 h-5 text-rose-100 shrink-0 mt-0.5" />
            <div className="text-sm">
              <b className="text-rose-50">⚠️ Cảnh báo tồn kho thấp:</b>{" "}
              {dsCanhBaoDetails}
            </div>
          </div>
        )}

        <div className="flex gap-2 bg-white/15 backdrop-blur-sm rounded-xl p-1.5 w-fit mt-5 border border-white/20">
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
                  ? "bg-white text-teal-700 shadow-md font-bold"
                  : "font-medium text-white/85 hover:bg-white/15 hover:text-white"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
