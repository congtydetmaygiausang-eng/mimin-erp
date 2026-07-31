"use client";

// ============ CÔNG VIỆC HOÀN THIỆN (Đợt 6) ============
// Danh sách phiếu KN/UI/DG với filter 6 trạng thái + search
// Mobile-first với MobileCard + filter chip ngang

import { useState, useMemo, Suspense } from "react";
import {
  Briefcase, Search, Scissors, Wind, Box, CheckCircle2, Play, Send,
  AlertTriangle, Filter,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/components/session-provider";
import { useHoanThien, TRANG_THAI_HOAN_THIEN, TRANG_THAI_HT_STYLE } from "@/lib/data/hoan-thien-store";
import { filterByNguoiThucHien } from "@/lib/hoan-thien-helper";
import { MobileCard, EmptyState, formatVNDShort, DateDisplay } from "@/components/ui";

type FilterTrangThai = "all" | ReturnType<typeof TRANG_THAI_HOAN_THIEN[number] extends infer T ? () => T : never> | (typeof TRANG_THAI_HOAN_THIEN)[number];

export default function CongViecHoanThienPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm opacity-60">Đang tải…</div>}>
      <CongViecHoanThienContent />
    </Suspense>
  );
}

function CongViecHoanThienContent() {
  const { user } = useSession();
  const { banGhi, nhanViec, batDauLam, hoanThanh, banGiao, baoLoi } = useHoanThien();
  const [filter, setFilter] = useState<"all" | (typeof TRANG_THAI_HOAN_THIEN)[number]>("all");
  const [search, setSearch] = useState("");
  const [showBaoLoi, setShowBaoLoi] = useState<string | null>(null);
  const [baoLoiContent, setBaoLoiContent] = useState("");

  const maNV = user?.id;
  const userData = filterByNguoiThucHien(banGhi, maNV);

  const filtered = useMemo(() => {
    return userData.filter((b) => {
      if (filter !== "all" && b.trangThai !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!b.id.toLowerCase().includes(q) &&
            !b.maSP.toLowerCase().includes(q) &&
            !b.congDoan.toLowerCase().includes(q) &&
            !(b.phanLoai || "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [userData, filter, search]);

  const handleAction = (id: string, action: "nhan" | "batDau" | "hoanThanh" | "banGiao", label: string) => {
    if (action === "nhan") nhanViec(id, user);
    if (action === "batDau") batDauLam(id, user);
    if (action === "hoanThanh") hoanThanh(id, user);
    if (action === "banGiao") banGiao(id, user);
    toast.success(`Đã ${label}`);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Briefcase className="w-7 h-7 text-amber-500" />
          Công việc Hoàn thiện
        </h1>
        <p className="opacity-70 mt-1 text-sm">
          {filtered.length} phiếu · {userData.length} tổng
        </p>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-1.5 overflow-x-auto">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
            filter === "all" ? "bg-brand-500 text-white" : "bg-white/40 dark:bg-white/5 hover:bg-white/60"
          }`}
        >
          Tất cả ({userData.length})
        </button>
        {TRANG_THAI_HOAN_THIEN.map((t) => {
          const count = userData.filter((b) => b.trangThai === t).length;
          const s = TRANG_THAI_HT_STYLE[t];
          return (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                filter === t ? `${s.bg} ${s.color} ring-2 ring-current` : `${s.bg} ${s.color} opacity-60 hover:opacity-100`
              }`}
            >
              {t} ({count})
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="card p-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
          <input
            className="input pl-9"
            placeholder="Tìm theo mã, SP, công đoạn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Danh sách */}
      {filtered.length === 0 ? (
        <EmptyState title="Không có việc" description="Thử đổi filter hoặc từ khoá" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((b) => {
            const s = TRANG_THAI_HT_STYLE[b.trangThai];
            const Icon = b.congDoan === "Khuy nút" ? Scissors : b.congDoan === "Ủi" ? Wind : Box;
            return (
              <MobileCard
                key={b.id}
                title={b.id}
                subtitle={`${b.congDoan} · ${b.maSP} · ${b.phanLoai || ""}`}
                badge={
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${s.bg} ${s.color}`}>
                    {b.trangThai}
                  </span>
                }
                fields={[
                  { label: "NV", value: b.nguoiThucHien, highlight: false },
                  { label: "SL giao", value: <span className="font-mono">{b.soLuongGiao.toLocaleString()}</span> },
                  { label: "SL đạt", value: <span className="font-mono text-emerald-600 font-semibold">{b.soLuongDat.toLocaleString()}</span> },
                  { label: "Đơn giá", value: <span className="font-mono">{b.donGia.toLocaleString()}đ</span> },
                  { label: "Tiền công", value: <span className="font-mono font-semibold text-emerald-600">{formatVNDShort(b.thanhTien)}</span>, highlight: true },
                  { label: "Hạn", value: <DateDisplay value={b.hanHoanThanh} /> },
                ]}
                actions={
                  <div className="flex flex-wrap gap-1 w-full">
                    {b.trangThai === "Chờ nhận" && (
                      <button onClick={() => handleAction(b.id, "nhan", "nhận việc")} className="text-[10px] px-2 py-1 rounded bg-sky-500/15 text-sky-700 font-medium">
                        <CheckCircle2 className="w-3 h-3 inline mr-0.5" /> Nhận
                      </button>
                    )}
                    {b.trangThai === "Đã nhận" && (
                      <button onClick={() => handleAction(b.id, "batDau", "bắt đầu")} className="text-[10px] px-2 py-1 rounded bg-amber-500/15 text-amber-700 font-medium">
                        <Play className="w-3 h-3 inline mr-0.5" /> Bắt đầu
                      </button>
                    )}
                    {(b.trangThai === "Đang làm" || b.trangThai === "Đã nhận") && (
                      <button onClick={() => handleAction(b.id, "hoanThanh", "hoàn thành")} className="text-[10px] px-2 py-1 rounded bg-violet-500/15 text-violet-700 font-medium">
                        <CheckCircle2 className="w-3 h-3 inline mr-0.5" /> Hoàn thành
                      </button>
                    )}
                    {b.trangThai === "Hoàn thành" && (
                      <button onClick={() => handleAction(b.id, "banGiao", "bàn giao kho TP")} className="text-[10px] px-2 py-1 rounded bg-teal-500/15 text-teal-700 font-medium">
                        <Send className="w-3 h-3 inline mr-0.5" /> Bàn giao kho TP
                      </button>
                    )}
                    <div className="flex-1" />
                    <button onClick={() => setShowBaoLoi(b.id)} className="text-[10px] px-2 py-1 rounded bg-rose-500/10 text-rose-700">
                      <AlertTriangle className="w-3 h-3 inline" /> Lỗi
                    </button>
                  </div>
                }
              />
            );
          })}
        </div>
      )}

      {/* Modal báo lỗi */}
      {showBaoLoi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowBaoLoi(null)} />
          <div className="relative card max-w-md w-full p-5 animate-slide-up">
            <h3 className="text-base font-bold mb-2 flex items-center gap-2 text-rose-700">
              <AlertTriangle className="w-5 h-5" />
              Báo lỗi
            </h3>
            <textarea
              value={baoLoiContent}
              onChange={(e) => setBaoLoiContent(e.target.value)}
              className="input w-full min-h-[100px] mb-3"
              placeholder="Mô tả lỗi: thiếu nút, vải bẩn, ủi cháy..."
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowBaoLoi(null)} className="btn-secondary text-sm">Huỷ</button>
              <button
                onClick={() => {
                  if (baoLoiContent.trim() && showBaoLoi) {
                    baoLoi(showBaoLoi, baoLoiContent, user);
                    toast.success("Đã ghi nhận báo lỗi");
                    setBaoLoiContent("");
                    setShowBaoLoi(null);
                  }
                }}
                disabled={!baoLoiContent.trim()}
                className="btn-primary text-sm bg-rose-500 hover:bg-rose-600 disabled:opacity-50"
              >
                Gửi báo lỗi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
