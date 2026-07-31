"use client";

// ============ TRANG CHỦ HOÀN THIỆN (Đợt 6 - Bộ 6) ============
// Mobile-first dashboard cho NV Hoàn thiện (Khuy nút / Ủi / Gấp xếp / Đóng gói)
// 6 KPI + danh sách việc cần làm
// Dùng data thật từ ALL_REAL_PHIEU (KN/UI/DG)

import Link from "next/link";
import {
  Home, Briefcase, Clock, CheckCircle2, AlertTriangle, Wallet, Package,
  ChevronRight, Scissors, Wind, Box, ArrowRight, Sparkles,
} from "lucide-react";
import { useSession } from "@/components/session-provider";
import { useHoanThien, TRANG_THAI_HT_STYLE, type TrangThaiHoanThien } from "@/lib/data/hoan-thien-store";
import { getHoanThienKPI, getViecCanLam, filterByNguoiThucHien } from "@/lib/hoan-thien-helper";
import { MobileCard, EmptyState, formatVNDShort, DateDisplay } from "@/components/ui";

export default function TrangChuHoanThienPage() {
  const { user } = useSession();
  const { banGhi } = useHoanThien();

  if (!user) {
    return <EmptyState title="Chưa đăng nhập" description="Vui lòng đăng nhập để xem công việc" />;
  }

  // Lấy maNV từ user.id (NV011, NV017, etc.)
  const maNV = user.id;
  const userData = filterByNguoiThucHien(banGhi, maNV);
  const kpi = getHoanThienKPI(userData);
  const viecCanLam = getViecCanLam(userData).slice(0, 5);
  const quaHan = userData.filter((b) =>
    b.hanHoanThanh && b.hanHoanThanh < new Date().toISOString().split("T")[0]
    && b.trangThai !== "Hoàn thành" && b.trangThai !== "Bàn giao kho TP"
  );

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header xin chào */}
      <div className="card p-4 bg-gradient-to-br from-teal-500/10 to-emerald-500/5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs opacity-70 flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5" /> Trang chủ Hoàn thiện
            </div>
            <h1 className="text-xl md:text-2xl font-bold mt-1">
              Xin chào, {user.name || user.id} 👋
            </h1>
            <p className="text-xs opacity-70 mt-1">
              Bộ phận: <b>Hoàn thiện</b> · Mã: <span className="font-mono">{user.id}</span>
            </p>
          </div>
          <div className="text-3xl">🧵</div>
        </div>
      </div>

      {/* Cảnh báo quá hạn */}
      {quaHan.length > 0 && (
        <div className="card p-3 bg-rose-500/10 border border-rose-500/20">
          <div className="flex items-center gap-2 text-sm text-rose-700 font-semibold">
            <AlertTriangle className="w-4 h-4" />
            {quaHan.length} việc quá hạn cần xử lý gấp!
          </div>
        </div>
      )}

      {/* 6 KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <KPICard label="Tổng phiếu" value={kpi.tongPhieu} icon={<Briefcase className="w-4 h-4" />} color="slate" />
        <KPICard label="Cần làm" value={kpi.theoTrangThai["Chờ nhận"].count + kpi.theoTrangThai["Đã nhận"].count + kpi.theoTrangThai["Đang làm"].count} icon={<Clock className="w-4 h-4" />} color="amber" />
        <KPICard label="Chờ QC" value={kpi.theoTrangThai["Chờ QC"].count} icon={<Sparkles className="w-4 h-4" />} color="violet" />
        <KPICard label="Hoàn thành" value={kpi.theoTrangThai["Hoàn thành"].count + kpi.theoTrangThai["Bàn giao kho TP"].count} icon={<CheckCircle2 className="w-4 h-4" />} color="emerald" />
        <KPICard label="SL đạt" value={kpi.tongSLDat.toLocaleString()} icon={<Package className="w-4 h-4" />} color="sky" />
        <KPICard label="Tiền công" value={formatVNDShort(kpi.tongThanhTien)} icon={<Wallet className="w-4 h-4" />} color="emerald" />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <QuickLink href="/cong-viec-hoan-thien" label="Công việc" icon={<Briefcase className="w-4 h-4" />} color="sky" />
        <QuickLink href="/ban-giao-hoan-thien" label="Bàn giao" icon={<ArrowRight className="w-4 h-4" />} color="teal" />
        <QuickLink href="/san-luong-hoan-thien" label="Sản lượng" icon={<Package className="w-4 h-4" />} color="violet" />
        <QuickLink href="/tien-cong-hoan-thien" label="Tiền công" icon={<Wallet className="w-4 h-4" />} color="emerald" />
      </div>

      {/* Danh sách việc cần làm */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 text-amber-500" />
            Việc cần làm ({viecCanLam.length})
          </h2>
          <Link href="/cong-viec-hoan-thien" className="text-xs text-brand-600 flex items-center gap-0.5">
            Xem tất cả <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        {viecCanLam.length === 0 ? (
          <EmptyState title="Không có việc" description="Bạn đã hoàn thành hết việc được giao 🎉" />
        ) : (
          <div className="space-y-2">
            {viecCanLam.map((b) => {
              const s = TRANG_THAI_HT_STYLE[b.trangThai];
              const Icon = b.congDoan === "Khuy nút" ? Scissors : b.congDoan === "Ủi" ? Wind : Box;
              return (
                <MobileCard
                  key={b.id}
                  title={b.id}
                  subtitle={`${b.nguoiThucHien} · ${b.congDoan}`}
                  badge={<span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${s.bg} ${s.color}`}>{b.trangThai}</span>}
                  fields={[
                    { label: "Mã SP", value: b.maSP },
                    { label: "Phân loại", value: b.phanLoai || "—" },
                    { label: "SL giao", value: <span className="font-mono">{b.soLuongGiao.toLocaleString()}</span> },
                    { label: "Hạn", value: <DateDisplay value={b.hanHoanThanh} /> },
                    { label: "Đơn giá", value: <span className="font-mono">{b.donGia.toLocaleString()}đ</span> },
                  ]}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function KPICard({ label, value, icon, color }: any) {
  const colorMap: Record<string, string> = {
    slate: "from-slate-500/10 to-slate-500/5 text-slate-700",
    amber: "from-amber-500/10 to-amber-500/5 text-amber-700",
    violet: "from-violet-500/10 to-violet-500/5 text-violet-700",
    emerald: "from-emerald-500/10 to-emerald-500/5 text-emerald-700",
    sky: "from-sky-500/10 to-sky-500/5 text-sky-700",
  };
  return (
    <div className={`card p-3 bg-gradient-to-br ${colorMap[color]}`}>
      <div className="flex items-center gap-1.5 text-xs opacity-80 mb-1">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className="text-lg md:text-2xl font-bold tabular-nums truncate">{value}</div>
    </div>
  );
}

function QuickLink({ href, label, icon, color }: any) {
  const colorMap: Record<string, string> = {
    sky: "from-sky-500/10 to-sky-500/5 text-sky-700",
    teal: "from-teal-500/10 to-teal-500/5 text-teal-700",
    violet: "from-violet-500/10 to-violet-500/5 text-violet-700",
    emerald: "from-emerald-500/10 to-emerald-500/5 text-emerald-700",
  };
  return (
    <Link href={href} className={`card p-3 bg-gradient-to-br ${colorMap[color]} hover:scale-105 transition-transform`}>
      <div className="flex flex-col items-center gap-1.5">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
    </Link>
  );
}
