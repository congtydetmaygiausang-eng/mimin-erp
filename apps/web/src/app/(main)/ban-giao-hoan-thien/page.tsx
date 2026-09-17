"use client";

// ============ BÀN GIAO HOÀN THIỆN (Đợt 6) ============
// Bàn giao sản phẩm Hoàn thiện → Kho thành phẩm
// Tương tự Bộ 5 ban-giao nhưng cho khâu cuối

import { useState, useMemo, Suspense } from "react";
import {
  Send, CheckCircle2, Warehouse, Package, Calendar, User, Scissors, AlertTriangle
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
  const [activeTab, setActiveTab] = useState<"ca-nhan" | "tong-hop">("ca-nhan");

  const maNV = user?.id;
  const userData = filterByNguoiThucHien(banGhi, maNV);

  // --- Logic Cá Nhân (Tab 1) ---
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

  const handleBanGiaoCaNhan = (id: string) => {
    banGiao(id, user);
    toast.success("Đã bàn giao kho thành phẩm");
  };

  // --- Logic Tổng Hợp (Tab 2) ---
  const tongHopLenh = useMemo(() => {
    const map = new Map<string, { lenhSX: string, maSP: string, slDat: number, slLoi: number }>();
    banGhi.forEach(b => {
      // Chỉ tổng hợp những phiếu đã Xong (Hoàn thành / Bàn giao)
      if (b.trangThai !== "Hoàn thành" && b.trangThai !== "Bàn giao kho TP") return;
      
      const key = b.lenhSX;
      if (!map.has(key)) {
        map.set(key, { lenhSX: key, maSP: b.maSP, slDat: 0, slLoi: 0 });
      }
      const entry = map.get(key)!;
      entry.slDat += b.soLuongDat || 0;
      entry.slLoi += b.soLuongLoi || 0;
    });
    return Array.from(map.values()).sort((a, b) => b.lenhSX.localeCompare(a.lenhSX));
  }, [banGhi]);

  const handleBanGiaoGiaCong = (lenhSX: string, slLoi: number) => {
    if (confirm(`Tạo lệnh bàn giao Gia Công Ngoài cho Lệnh cắt ${lenhSX} (Số lượng: ${slLoi} SP lỗi)?\n\n* Dữ liệu sẽ được chuyển sang module Gia công.`)) {
      toast.success(`Đã tạo phiếu bàn giao Gia công sửa lỗi cho ${lenhSX}`);
      // Todo: Link với gia-cong-store ở bước sau
    }
  };

  const handleNhapKhoTong = (lenhSX: string, slDat: number) => {
    if (confirm(`Nhập kho thành phẩm cho Lệnh cắt ${lenhSX} (Số lượng: ${slDat} SP đạt)?\n\n* Sẽ cập nhật toàn bộ phiếu Hoàn thành -> Bàn giao.`)) {
      banGhi.filter(b => b.lenhSX === lenhSX && b.trangThai === "Hoàn thành").forEach(b => {
        banGiao(b.id, user);
      });
      toast.success(`Đã nhập ${slDat} SP đạt của ${lenhSX} vào kho thành phẩm`);
    }
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
          Phân hệ đối soát và bàn giao kho thành phẩm / gia công ngoài
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab("ca-nhan")}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === "ca-nhan" ? "bg-white dark:bg-slate-700 shadow text-teal-600" : "text-slate-500 hover:text-slate-700"}`}
        >
          Phiếu Cá Nhân
        </button>
        <button
          onClick={() => setActiveTab("tong-hop")}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === "tong-hop" ? "bg-white dark:bg-slate-700 shadow text-teal-600" : "text-slate-500 hover:text-slate-700"}`}
        >
          Tổng Hợp & Đối Soát
        </button>
      </div>

      {activeTab === "ca-nhan" ? (
        <div className="space-y-4 animate-fade-in">
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
                        onClick={() => handleBanGiaoCaNhan(b.id)}
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
      ) : (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-sky-50 dark:bg-sky-900/20 text-sky-700 p-3 rounded-xl text-sm mb-4">
            <b>Đối soát Lệnh Cắt:</b> Hệ thống tự động gom nhóm các phiếu đã Hoàn thành theo Lệnh Cắt. Dựa vào tỉ lệ lỗi, bạn có thể quyết định Nhập Kho thành phẩm hoặc tạo Bàn giao gia công lỗi ngoài.
          </div>
          
          {tongHopLenh.length === 0 ? (
            <EmptyState title="Chưa có dữ liệu tổng hợp" description="Cần có phiếu hoàn thiện đã xong để đối soát." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tongHopLenh.map((t) => (
                <div key={t.lenhSX} className="card p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-black text-slate-800 text-lg">{t.lenhSX}</h3>
                      <p className="text-sm text-slate-500 font-medium">Sản phẩm: {t.maSP}</p>
                    </div>
                    <div className="bg-slate-100 px-2 py-1 rounded text-xs font-bold text-slate-600">
                      Tổng hợp
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 p-2 rounded-lg">
                      <p className="text-[11px] text-emerald-700 font-bold mb-1 uppercase tracking-wide">Đạt chuẩn (Nhập Kho)</p>
                      <p className="text-2xl font-black text-emerald-600 font-mono">{t.slDat.toLocaleString()}</p>
                    </div>
                    <div className={`p-2 rounded-lg ${t.slLoi > 0 ? "bg-rose-50 dark:bg-rose-900/10" : "bg-slate-50 dark:bg-slate-900/10"}`}>
                      <p className={`text-[11px] font-bold mb-1 uppercase tracking-wide ${t.slLoi > 0 ? "text-rose-700" : "text-slate-500"}`}>Hàng lỗi (Gia công)</p>
                      <p className={`text-2xl font-black font-mono ${t.slLoi > 0 ? "text-rose-600" : "text-slate-400"}`}>{t.slLoi.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="mt-2 space-y-2">
                    <button
                      onClick={() => handleNhapKhoTong(t.lenhSX, t.slDat)}
                      disabled={t.slDat === 0}
                      className="w-full py-2.5 rounded-lg bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Warehouse className="w-4 h-4" />
                      Nhập {t.slDat} SP vào Kho TP
                    </button>
                    <button
                      onClick={() => handleBanGiaoGiaCong(t.lenhSX, t.slLoi)}
                      disabled={t.slLoi === 0}
                      className="w-full py-2.5 rounded-lg bg-rose-100 text-rose-700 font-bold text-sm flex items-center justify-center gap-2 hover:bg-rose-200 disabled:opacity-50 disabled:cursor-not-allowed border border-rose-200"
                    >
                      <Scissors className="w-4 h-4" />
                      Bàn giao Gia công lỗi ({t.slLoi} SP)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
