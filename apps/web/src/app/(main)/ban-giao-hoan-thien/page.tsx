"use client";

// ============ BÀN GIAO HOÀN THIỆN (Đợt 6) ============
// Bàn giao sản phẩm Hoàn thiện → Kho thành phẩm
// Tương tự Bộ 5 ban-giao nhưng cho khâu cuối

import { useState, useMemo, Suspense } from "react";
import {
  Send, CheckCircle2, Warehouse, Package, Calendar, User,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/components/session-provider";
import { useHoanThien, TRANG_THAI_HT_STYLE } from "@/lib/data/hoan-thien-store";
import { filterByNguoiThucHien, getHoanThienKPI } from "@/lib/hoan-thien-helper";
import { MobileCard, EmptyState, formatVNDShort, DateDisplay } from "@/components/ui";

export default function BanGiaoHoanThienPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm opacity-60">Đang tải…</div>}>
      <BanGiaoHoanThienContent />
    </Suspense>
  );
}

function BanGiaoHoanThienContent() {
  const { user } = useSession();
  const { banGhi, banGiao } = useHoanThien();

  const maNV = user?.id;
  const userData = filterByNguoiThucHien(banGhi, maNV);

  // Phiếu đã hoàn thành - chờ bàn giao kho TP
  const choBanGiao = useMemo(
    () => userData.filter((b) => b.trangThai === "Hoàn thành"),
    [userData]
  );
  const daBanGiao = useMemo(
    () => userData.filter((b) => b.trangThai === "Bàn giao kho TP"),
    [userData]
  );

  const kpiCho = getHoanThienKPI(choBanGiao);
  const kpiDa = getHoanThienKPI(daBanGiao);

  const handleBanGiao = (id: string) => {
    banGiao(id, user);
    toast.success("Đã bàn giao kho thành phẩm");
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Send className="w-7 h-7 text-teal-500" />
          Bàn giao Hoàn thiện
        </h1>
        <p className="opacity-70 mt-1 text-sm">
          {choBanGiao.length} chờ bàn giao · {daBanGiao.length} đã bàn giao kho TP
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-3 bg-gradient-to-br from-amber-500/10 to-amber-500/5 text-amber-700">
          <div className="text-xs opacity-80 mb-1">Chờ bàn giao</div>
          <div className="text-xl font-bold">{choBanGiao.length}</div>
        </div>
        <div className="card p-3 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 text-emerald-700">
          <div className="text-xs opacity-80 mb-1">Đã bàn giao</div>
          <div className="text-xl font-bold">{daBanGiao.length}</div>
        </div>
        <div className="card p-3 bg-gradient-to-br from-sky-500/10 to-sky-500/5 text-sky-700">
          <div className="text-xs opacity-80 mb-1">SL chờ BG</div>
          <div className="text-xl font-bold">{kpiCho.tongSLDat.toLocaleString()}</div>
        </div>
        <div className="card p-3 bg-gradient-to-br from-teal-500/10 to-teal-500/5 text-teal-700">
          <div className="text-xs opacity-80 mb-1">Tiền chờ BG</div>
          <div className="text-xl font-bold">{formatVNDShort(kpiCho.tongThanhTien)}</div>
        </div>
      </div>

      {/* Chờ bàn giao */}
      <div>
        <h2 className="text-sm font-bold mb-2 flex items-center gap-1.5">
          <Warehouse className="w-4 h-4 text-amber-500" />
          Chờ bàn giao kho TP ({choBanGiao.length})
        </h2>
        {choBanGiao.length === 0 ? (
          <EmptyState title="Không có phiếu chờ" description="Tất cả đã bàn giao kho TP 🎉" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {choBanGiao.map((b) => (
              <MobileCard
                key={b.id}
                title={b.id}
                subtitle={`${b.maSP} · ${b.phanLoai || ""}`}
                badge={<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-700">{b.trangThai}</span>}
                fields={[
                  { label: "NV", value: b.nguoiThucHien },
                  { label: "Công đoạn", value: b.congDoan },
                  { label: "SL đạt", value: <span className="font-mono text-emerald-600 font-semibold">{b.soLuongDat.toLocaleString()}</span>, highlight: true },
                  { label: "SL lỗi", value: <span className="font-mono text-rose-600">{b.soLuongLoi.toLocaleString()}</span> },
                  { label: "Tiền công", value: <span className="font-mono font-semibold text-emerald-600">{formatVNDShort(b.thanhTien)}</span> },
                ]}
                actions={
                  <button
                    onClick={() => handleBanGiao(b.id)}
                    className="w-full text-xs px-3 py-2 rounded bg-teal-500 text-white font-semibold flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> Bàn giao kho TP
                  </button>
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Đã bàn giao */}
      {daBanGiao.length > 0 && (
        <div>
          <h2 className="text-sm font-bold mb-2 flex items-center gap-1.5 mt-4">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Đã bàn giao ({daBanGiao.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {daBanGiao.slice(0, 6).map((b) => (
              <MobileCard
                key={b.id}
                title={b.id}
                subtitle={`${b.maSP} · ${b.congDoan}`}
                badge={<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-teal-500/15 text-teal-700">Đã BG kho TP</span>}
                fields={[
                  { label: "NV", value: b.nguoiThucHien },
                  { label: "SL đạt", value: <span className="font-mono">{b.soLuongDat.toLocaleString()}</span> },
                  { label: "Tiền công", value: <span className="font-mono text-emerald-600">{formatVNDShort(b.thanhTien)}</span> },
                  { label: "Ngày BG", value: <DateDisplay value={b.ngayBanGiao} /> },
                ]}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
