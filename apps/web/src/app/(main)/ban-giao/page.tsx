"use client";

// ============ TRANG BÀN GIAO (Đợt 2 - Bộ 5) ============
// Xem lịch sử bàn giao + bàn giao nhanh từ danh sách
// Dùng ALL_REAL_PHIEU + GiaCongStore.banGiaoRecords

import { useState, Suspense } from "react";
import Link from "next/link";
import { Send, Package, Calendar, ChevronRight, ArrowLeft } from "lucide-react";
import { useSession } from "@/components/session-provider";
import { useGiaCong } from "@/lib/data/gia-cong-store";
import { getWorkflowForUser, getStatusStyle } from "@/lib/workflow-filter";
import { MobileCard, EmptyState, DateDisplay } from "@/components/ui";
import { formatVNDShort } from "@/lib/data/real-data";

export default function BanGiaoPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm opacity-60">Đang tải…</div>}>
      <BanGiaoContent />
    </Suspense>
  );
}

function BanGiaoContent() {
  const { user } = useSession();
  const { getEffectiveTask, banGiaoRecords } = useGiaCong();

  if (!user) {
    return <EmptyState title="Chưa đăng nhập" description="Vui lòng đăng nhập" />;
  }

  const myTasks = getWorkflowForUser(user).map((p) => getEffectiveTask(p.id) || p);
  const canHandover = myTasks.filter((p) => p.soLuongDat > 0 && p.trangThai !== "Hoàn thành");
  const myRecords = banGiaoRecords
    .filter((r) => myTasks.some((t) => t.id === r.taskId))
    .sort((a, b) => b.ts - a.ts);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Link href="/cong-viec" className="text-xs text-brand-600 hover:underline inline-flex items-center gap-1 mb-1">
            <ArrowLeft className="w-3 h-3" /> Quay lại
          </Link>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Send className="w-6 h-6 text-emerald-500" />
            Bàn giao
          </h1>
          <p className="text-xs opacity-70 mt-1">Theo dõi lịch sử bàn giao & bàn giao nhanh</p>
        </div>
      </div>

      {/* Có thể bàn giao */}
      {canHandover.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-bold flex items-center gap-1.5">
            <Package className="w-4 h-4 text-emerald-500" />
            Sẵn sàng bàn giao ({canHandover.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {canHandover.map((p) => (
              <Link key={p.id} href={`/cong-viec?taskId=${p.id}`}>
                <MobileCard
                  title={`${p.id} · ${p.lenhCat || p.lenhSX}`}
                  subtitle={p.phanLoai || p.maSP}
                  badge={<span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-700">Đã đạt {p.soLuongDat.toLocaleString()}</span>}
                  fields={[
                    { label: "Mã SP", value: p.maSP },
                    { label: "SL đạt", value: <span className="text-emerald-600 font-bold">{p.soLuongDat.toLocaleString()}</span>, highlight: true },
                    { label: "Còn lại", value: Math.max(0, p.soLuongGiao - p.soLuongDat - p.soLuongLoi - p.soLuongThieu).toLocaleString() },
                  ]}
                  actions={<span className="text-xs text-brand-600">Mở để bàn giao →</span>}
                />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Lịch sử bàn giao */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-brand-500" />
          Lịch sử ({myRecords.length})
        </h2>
        {myRecords.length === 0 ? (
          <EmptyState
            icon={<Send className="w-7 h-7 text-slate-500 opacity-60" />}
            title="Chưa có bàn giao"
            description="Khi hoàn thành SL, bấm 'Bàn giao' trong chi tiết công việc"
          />
        ) : (
          <div className="space-y-2">
            {myRecords.map((r) => {
              const task = myTasks.find((t) => t.id === r.taskId);
              return (
                <div key={r.id} className="card p-3 border-l-4 border-emerald-500/40">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-mono font-semibold">{r.taskId}</span>
                    <span className="text-[10px] opacity-60">
                      <DateDisplay value={r.ngayBanGiao} showRelative />
                    </span>
                  </div>
                  <div className="text-sm">
                    Bàn giao <b className="text-emerald-600">{r.soLuongBanGiao.toLocaleString()} sp</b>
                    {r.nguoiNhan && <> → <span className="font-mono text-xs">{r.nguoiNhan}</span></>}
                  </div>
                  {task && (
                    <div className="text-[10px] opacity-60 mt-1">
                      {task.phanLoai || task.maSP} · SL giao {task.soLuongGiao.toLocaleString()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
