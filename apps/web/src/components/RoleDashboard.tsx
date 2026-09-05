"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, Users, Package, ShoppingCart, Wallet, Boxes,
  CheckCircle2, AlertCircle, Clock, ArrowRight, Calendar, DollarSign,
  Scissors, BarChart3, FileText, Hammer, ShieldCheck, Shirt, ClipboardList,
  Truck, Building2, ClipboardCheck, ListChecks, Activity, Plus, Eye,
  Sparkles
} from "lucide-react";
import { useSession } from "./session-provider";
import { getPersonalTasks, getTaskStats, priorityColor, priorityLabel, type Task } from "@/lib/personal-tasks";
import { formatVNDShort } from "@/lib/data/real-data";
import { Avatar } from "./Avatar";
import { ROLE_LABELS, type Role } from "@/lib/permissions";

export function RoleDashboard() {
  const { user } = useSession();
  const [timeGreeting, setTimeGreeting] = useState("Chào bạn");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) setTimeGreeting("buổi sáng");
    else if (hour >= 11 && hour < 14) setTimeGreeting("buổi trưa");
    else if (hour >= 14 && hour < 18) setTimeGreeting("buổi chiều");
    else setTimeGreeting("buổi tối");
  }, []);

  if (!user) return null;
  const role = (user.role || "admin") as Role;
  const tasks = useMemo(() => getPersonalTasks(role, user.name), [role, user.name]);
  const stats = useMemo(() => getTaskStats(tasks), [tasks]);
  const firstName = user.name.split(" ").pop() || "bạn";

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Operations Executive Status Banner - Tinh gọn, đậm chất điều hành */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative shrink-0">
            <Avatar name={user.name} size="lg" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 shadow-xs"></div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                {firstName}
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 font-bold border border-teal-200 dark:border-teal-800 text-[11px]">
                {ROLE_LABELS[role]}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
              <span>Bàn điều hành sản xuất</span>
              <span>·</span>
              <span>Hôm nay có <b className="text-rose-600 dark:text-rose-400 font-bold">{stats.urgent} việc khẩn</b> và <b className="text-amber-600 dark:text-amber-400 font-bold">{stats.high} việc quan trọng</b></span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:self-center ml-auto">
          <Link
            href="/canh-bao"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <Activity className="w-3.5 h-3.5 text-amber-500" />
            <span>Xem cảnh báo</span>
          </Link>
          <Link
            href="/bang-dieu-hanh-sx"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs shadow-teal-600/30 transition"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Bảng điều hành SX</span>
          </Link>
        </div>
      </div>

      {/* 2 QUICK ACTION CARDS - Giảm 30% chiều cao, tập trung hành động nhanh */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Quick Action 1: Thêm Mẫu Mới */}
        <Link 
          href="/danh-muc-sp" 
          className="group relative overflow-hidden rounded-xl p-4 bg-gradient-to-r from-teal-900 to-teal-800 text-white border border-teal-700/50 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-teal-700/60 border border-teal-500/40 flex items-center justify-center text-teal-200 shadow-inner shrink-0 group-hover:scale-105 transition-transform">
              <Shirt className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-white group-hover:text-teal-200 transition-colors flex items-center gap-2">
                <span>Thêm Mẫu Mới</span>
                <ArrowRight className="w-4 h-4 text-teal-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-teal-200/80 truncate mt-0.5">
                Quản lý sản phẩm gốc, định mức và bảng size
              </p>
            </div>
          </div>
          <div className="text-[11px] font-semibold text-teal-200 shrink-0 bg-teal-800/80 px-2.5 py-1 rounded-md border border-teal-600/50">
            + Danh mục
          </div>
        </Link>

        {/* Quick Action 2: Tạo Lệnh Cắt */}
        <Link 
          href="/lenh-cat" 
          className="group relative overflow-hidden rounded-xl p-4 bg-gradient-to-r from-slate-900 to-teal-950 text-white border border-slate-700/50 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-slate-800/80 border border-slate-600/50 flex items-center justify-center text-teal-300 shadow-inner shrink-0 group-hover:scale-105 transition-transform">
              <Scissors className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors flex items-center gap-2">
                <span>Tạo Lệnh Cắt</span>
                <ArrowRight className="w-4 h-4 text-teal-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-slate-300/80 truncate mt-0.5">
                Lên lệnh cắt mới, tự động tính định mức vải và COGS
              </p>
            </div>
          </div>
          <div className="text-[11px] font-semibold text-teal-300 shrink-0 bg-slate-800/90 px-2.5 py-1 rounded-md border border-slate-600/50">
            + Lệnh cắt
          </div>
        </Link>
      </div>

      {/* Stats theo role */}
      {role === "admin" && <AdminStats />}
      {role === "planner" && <PlannerStats />}
      {role === "warehouse" && <WarehouseStats />}
      {role === "sewing" && <SewingStats />}
      {role === "qc" && <QCStats />}
      {role === "finishing" && <FinishingStats />}
      {role === "accountant" && <AccountantStats />}
      {(role === "content" || role === "partner") && <PartnerDashboard />}

      {/* My Queue */}
      <div>
        <MyQueue tasks={tasks} />
      </div>
    </div>
  );
}

// Stats cho từng role
function AdminStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPI label="Doanh thu 7T" value="887 tr" trend="+18.5%" up icon={DollarSign} color="emerald" />
      <KPI label="Lợi nhuận" value="288 tr" trend="Margin 32.4%" up icon={TrendingUp} color="emerald" />
      <KPI label="Công nợ" value="25 tr" trend="0 trễ hạn" icon={Wallet} color="amber" />
      <KPI label="Hoạt động" value="14 logs" trend="4 lỗi" icon={Activity} color="red" />
    </div>
  );
}

function PlannerStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPI label="KHSX tuần này" value="5" trend="3 chờ duyệt" icon={Calendar} color="violet" />
      <KPI label="Lệnh cắt" value="12" trend="+3 hôm nay" up icon={Scissors} color="sky" />
      <KPI label="Đơn hàng" value="8" trend="5 chờ duyệt" icon={ShoppingCart} color="amber" />
      <KPI label="KH hoạt động" value="8" trend="3 VIP" up icon={Users} color="emerald" />
    </div>
  );
}

function WarehouseStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPI label="Tồn kho vải" value="24,500 m" trend="-2% tuần" down icon={Package} color="amber" />
      <KPI label="Phụ liệu" value="58 mã" trend="5 dưới định mức" icon={Boxes} color="orange" />
      <KPI label="Nhập hôm nay" value="2,400 m" trend="Đúng hẹn" up icon={Truck} color="emerald" />
      <KPI label="Xuất hôm nay" value="2,400 m" trend="3 tổ" icon={Truck} color="sky" />
    </div>
  );
}

function SewingStats() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Tiến độ hôm nay" value="62.5%" trend="M758 Bộ trơn" up icon={Scissors} color="emerald" />
        <KPI label="Công nhân" value="11" trend="9 đi làm" icon={Users} color="sky" />
        <KPI label="SP hoàn thành" value="750" trend="/1200 target" up icon={CheckCircle2} color="emerald" />
        <KPI label="Lệnh chờ" value="1" trend="M873 Cotton" icon={Clock} color="amber" />
      </div>
      <div className="flex gap-3 flex-wrap">
        <Link href="/to-cat-work" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 text-white font-bold text-sm hover:bg-sky-600 transition-colors shadow-sm">
          <Scissors className="w-4 h-4" /> ✂️ Việc cắt của tôi
        </Link>
        <Link href="/to-may-work" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500 text-white font-bold text-sm hover:bg-violet-600 transition-colors shadow-sm">
          <Shirt className="w-4 h-4" /> 👕 Việc may của tôi
        </Link>
        <Link href="/bang-dieu-hanh-sx" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-50 text-teal-700 font-bold text-sm hover:bg-teal-100 border border-teal-200 transition-colors">
          Bảng điều hành →
        </Link>
      </div>
    </div>
  );
}

function QCStats() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="SP đã kiểm" value="4,200" trend="Tuần 30" up icon={ShieldCheck} color="emerald" />
        <KPI label="Tỷ lệ lỗi" value="1.2%" trend="-0.3% vs tuần trước" up icon={TrendingDown} color="emerald" />
        <KPI label="Cần kiểm hôm nay" value="800" trend="Lệnh M758" icon={Clock} color="amber" />
        <KPI label="Lô vải mới" value="2,400 m" trend="Chờ kiểm" icon={Package} color="sky" />
      </div>
      <div className="flex gap-3 flex-wrap">
        <Link href="/to-qc-work" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 transition-colors shadow-sm">
          <ShieldCheck className="w-4 h-4" /> 🔍 Kiểm tra chất lượng
        </Link>
        <Link href="/kiem-tra-cl" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-sm hover:bg-emerald-100 border border-emerald-200">
          Chi tiết QC →
        </Link>
      </div>
    </div>
  );
}

function FinishingStats() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="SP đã ủi" value="580" trend="/800 (72.5%)" up icon={Shirt} color="emerald" />
        <KPI label="Giao hôm nay" value="1,500" trend="Shop TT SG" icon={Truck} color="amber" />
        <KPI label="Kho thành phẩm" value="3,200" trend="Sẵn sàng" icon={Boxes} color="sky" />
        <KPI label="Đơn chờ giao" value="3" trend="2 deadline tuần này" icon={Clock} color="orange" />
      </div>
      <div className="flex gap-3 flex-wrap">
        <Link href="/to-ht-work" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 text-white font-bold text-sm hover:bg-sky-600 transition-colors shadow-sm">
          <ClipboardList className="w-4 h-4" /> 🦺 Việc hoàn thiện của tôi
        </Link>
        <Link href="/kho-thanh-pham" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-50 text-sky-700 font-bold text-sm hover:bg-sky-100 border border-sky-200">
          Kho thành phẩm →
        </Link>
      </div>
    </div>
  );
}

function AccountantStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPI label="Công nợ phải thu" value="287 tr" trend="5 đến hạn" icon={Wallet} color="amber" />
      <KPI label="Công nợ phải trả" value="189 tr" trend="89 tr đến hạn" icon={Wallet} color="red" />
      <KPI label="Quỹ lương T7" value="135 tr" trend="Chờ duyệt" icon={Users} color="sky" />
      <KPI label="DT tháng 7" value="145 tr" trend="+12% MoM" up icon={DollarSign} color="emerald" />
    </div>
  );
}

function KPI({ label, value, trend, up, down, icon: Icon, color }: {
  label: string; value: string; trend: string; up?: boolean; down?: boolean; icon: any; color: string;
}) {
  const accentBorder: Record<string, string> = {
    emerald: "border-l-emerald-500",
    red: "border-l-rose-500",
    amber: "border-l-amber-500",
    orange: "border-l-orange-500",
    sky: "border-l-sky-500",
    violet: "border-l-teal-500",
  };

  const badgeBg: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
    red: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
    orange: "bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300",
    sky: "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300",
    violet: "bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300",
  };

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800 border-l-4 ${accentBorder[color] || "border-l-teal-500"} shadow-xs hover:shadow-md transition-all flex flex-col justify-between`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
          {label}
        </span>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${badgeBg[color] || "bg-teal-50 text-teal-700"}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
        {value}
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-xs font-medium">
        {up && <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
        {down && <TrendingDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />}
        <span className={up ? "text-emerald-700 dark:text-emerald-400 font-semibold" : down ? "text-rose-700 dark:text-rose-400 font-semibold" : "text-slate-500 dark:text-slate-400"}>
          {trend}
        </span>
      </div>
    </div>
  );
}

// My Queue - Trung tâm cảnh báo điều hành thực tế
function MyQueue({ tasks }: { tasks: Task[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">
            Trung tâm cảnh báo & Công việc vận hành
          </h3>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3">
          <span>Tổng: <b className="text-slate-800 dark:text-slate-200">{tasks.length}</b></span>
          <span>·</span>
          <span className="text-rose-600 dark:text-rose-400 font-bold">{tasks.filter((t) => t.priority === "urgent").length} việc khẩn</span>
          <span>·</span>
          <span className="text-amber-600 dark:text-amber-400 font-bold">{tasks.filter((t) => t.priority === "high").length} quan trọng</span>
        </div>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">Không có công việc nào cần xử lý lúc này 🎉</div>
        ) : (
          tasks.map((t) => {
            const isUrgent = t.priority === "urgent";
            const isHigh = t.priority === "high";

            return (
              <Link
                key={t.id}
                href={t.link}
                className="p-3.5 sm:px-5 flex items-start gap-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group"
              >
                <div 
                  className={`shrink-0 w-1.5 self-stretch rounded-full my-0.5 ${
                    isUrgent ? "bg-rose-500" : isHigh ? "bg-amber-500" : "bg-teal-500"
                  }`} 
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span 
                      className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${
                        isUrgent
                          ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900"
                          : isHigh
                          ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900"
                          : "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-900"
                      }`}
                    >
                      {priorityLabel(t.priority)}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t.kind}</span>
                    {t.dueDate && (
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 ml-auto flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 inline text-slate-400" /> 
                        Hạn: {new Date(t.dueDate).toLocaleDateString("vi-VN", { day: "numeric", month: "numeric" })}
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    {t.title}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    {t.description}
                  </div>
                </div>
                <div className="shrink-0 self-center text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}



// Helper import for Settings (used in admin actions)
import { Settings } from "lucide-react";

// ================ PARTNER / CONTENT (Dashboard riêng) ================
function PartnerDashboard() {
  const { user } = useSession();
  const isPartner = user?.role === "partner";
  return (
    <div className="space-y-4">
      <div className={`card p-5 bg-gradient-to-br ${isPartner ? "from-purple-500/10 via-fuchsia-500/10 to-pink-500/10 border-purple-500/20" : "from-pink-500/10 via-rose-500/10 to-orange-500/10 border-pink-500/20"}`}>
        <h2 className="font-bold text-lg mb-1">
          {isPartner ? "🤝 Trang đối tác gia công" : "🎨 Trang Content / Media"}
        </h2>
        <p className="text-sm opacity-70">
          {isPartner
            ? "Xem công việc được giao, báo cáo sản lượng, đối soát tiền công."
            : "Quản lý danh mục sản phẩm + xem đơn hàng để chụp ảnh marketing."}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {isPartner ? (
          <>
            <PartnerTile href="/trang-chu-gia-cong" icon="🏠" title="Trang chủ gia công" desc="Tổng quan" color="purple" />
            <PartnerTile href="/cong-viec" icon="📋" title="Công việc của tôi" desc="Phiếu được giao" color="blue" />
            <PartnerTile href="/ban-giao" icon="🤝" title="Bàn giao" desc="Nhận hàng" color="emerald" />
            <PartnerTile href="/san-luong" icon="📊" title="Sản lượng" desc="Báo cáo SL" color="amber" />
            <PartnerTile href="/tien-cong" icon="💵" title="Tiền công" desc="Đối soát" color="rose" />
          </>
        ) : (
          <>
            <PartnerTile href="/danh-muc-sp" icon="👕" title="Danh mục SP" desc="CRUD sản phẩm" color="pink" />
            <PartnerTile href="/don-hang" icon="🛒" title="Đơn hàng" desc="Xem để chụp ảnh" color="blue" />
            <PartnerTile href="/ke-hoach-san-xuat" icon="📅" title="Kế hoạch SX" desc="Xem sản xuất" color="emerald" />
            <PartnerTile href="/bao-cao" icon="📈" title="Báo cáo" desc="Marketing" color="amber" />
          </>
        )}
      </div>

      <div className="card p-4 bg-amber-500/5 border-amber-500/20 text-sm">
        <b>💡 Lưu ý:</b> Tài khoản {isPartner ? "đối tác" : "content"} chỉ thấy các module phù hợp với vai trò.
        Liên hệ admin nếu cần thêm quyền.
      </div>
    </div>
  );
}

function PartnerTile({ href, icon, title, desc, color }: { href: string; icon: string; title: string; desc: string; color: string }) {
  const colorMap: Record<string, string> = {
    purple: "from-purple-500/15 to-fuchsia-500/15 hover:from-purple-500/25",
    blue: "from-blue-500/15 to-cyan-500/15 hover:from-blue-500/25",
    emerald: "from-emerald-500/15 to-green-500/15 hover:from-emerald-500/25",
    amber: "from-amber-500/15 to-yellow-500/15 hover:from-amber-500/25",
    rose: "from-rose-500/15 to-pink-500/15 hover:from-rose-500/25",
    pink: "from-pink-500/15 to-rose-500/15 hover:from-pink-500/25",
  };
  return (
    <Link href={href} className={`card p-4 bg-gradient-to-br ${colorMap[color] || colorMap.blue} hover:shadow-lg transition-all hover:scale-[1.02]`}>
      <div className="text-3xl mb-2">{icon}</div>
      <div className="font-bold text-sm">{title}</div>
      <div className="text-[10px] opacity-60 mt-0.5">{desc}</div>
    </Link>
  );
}
