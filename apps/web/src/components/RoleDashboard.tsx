"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, Users, Package, ShoppingCart, Wallet, Boxes,
  CheckCircle2, AlertCircle, Clock, ArrowRight, Calendar, DollarSign,
  Scissors, BarChart3, FileText, Hammer, ShieldCheck, Shirt, ClipboardList,
  Truck, Building2, ClipboardCheck, ListChecks, Activity, Plus, Eye
} from "lucide-react";
import { useSession } from "./session-provider";
import { getPersonalTasks, getTaskStats, priorityColor, priorityLabel, type Task } from "@/lib/personal-tasks";
import { formatVNDShort } from "@/lib/data/real-data";
import { Avatar } from "./Avatar";
import { ROLE_LABELS, type Role } from "@/lib/permissions";

export function RoleDashboard() {
  const { user } = useSession();
  if (!user) return null;
  const role = (user.role || "admin") as Role;
  const tasks = useMemo(() => getPersonalTasks(role, user.name), [role, user.name]);
  const stats = useMemo(() => getTaskStats(tasks), [tasks]);

  return (
    <div className="space-y-5">
      {/* Welcome banner + role */}
      <div className="card p-5 bg-gradient-to-r from-brand-500/10 via-violet-500/5 to-pink-500/10 border-brand-500/20">
        <div className="flex items-center gap-3">
          <Avatar name={user.name} size="xl" />
          <div className="flex-1">
            <div className="text-xs opacity-70">Chào buổi tối, {user.name.split(" ").slice(-1)[0]} 👋</div>
            <h1 className="text-xl font-bold mt-0.5">{getGreeting(role)}</h1>
            <div className="flex items-center gap-2 mt-1 text-sm opacity-80">
              <span className="px-2 py-0.5 rounded bg-brand-500/20 text-brand-700 text-xs font-medium">
                {ROLE_LABELS[role]}
              </span>
              <span className="text-xs">·</span>
              <span className="text-xs">Bạn có <b className="text-red-600">{stats.urgent}</b> việc khẩn, <b className="text-amber-600">{stats.high}</b> việc quan trọng</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats theo role */}
      {role === "admin" && <AdminStats />}
      {role === "planner" && <PlannerStats />}
      {role === "warehouse" && <WarehouseStats />}
      {role === "sewing" && <SewingStats />}
      {role === "qc" && <QCStats />}
      {role === "finishing" && <FinishingStats />}
      {role === "accountant" && <AccountantStats />}

      {/* My Queue + Quick actions */}
      <div className="grid md:grid-cols-3 gap-5">
        <div className="md:col-span-2">
          <MyQueue tasks={tasks} />
        </div>
        <div>
          <QuickActions role={role} />
        </div>
      </div>
    </div>
  );
}

function getGreeting(role: Role): string {
  const hour = new Date().getHours();
  const time = hour < 12 ? "buổi sáng" : hour < 18 ? "buổi chiều" : "buổi tối";
  const lastName = { admin: "An", planner: "Bình", warehouse: "Cường", sewing: "Dung", qc: "Đức", finishing: "Hương", accountant: "Hùng" }[role];
  return `Chào ${time}, ${lastName}!`;
}

// Stats cho từng role
function AdminStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KPI label="Doanh thu 7T" value="887 tr" trend="+18.5%" up icon={DollarSign} color="emerald" />
      <KPI label="Lợi nhuận" value="288 tr" trend="Margin 32.4%" up icon={TrendingUp} color="emerald" />
      <KPI label="Công nợ" value="25 tr" trend="0 trễ hạn" icon={Wallet} color="amber" />
      <KPI label="Hoạt động" value="14 logs" trend="4 lỗi" icon={Activity} color="red" />
    </div>
  );
}

function PlannerStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KPI label="KHSX tuần này" value="5" trend="3 chờ duyệt" icon={Calendar} color="violet" />
      <KPI label="Lệnh cắt" value="12" trend="+3 hôm nay" up icon={Scissors} color="sky" />
      <KPI label="Đơn hàng" value="8" trend="5 chờ duyệt" icon={ShoppingCart} color="amber" />
      <KPI label="KH hoạt động" value="8" trend="3 VIP" up icon={Users} color="emerald" />
    </div>
  );
}

function WarehouseStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KPI label="Tồn kho vải" value="24,500 m" trend="-2% tuần" down icon={Package} color="amber" />
      <KPI label="Phụ liệu" value="58 mã" trend="5 dưới định mức" icon={Boxes} color="orange" />
      <KPI label="Nhập hôm nay" value="2,400 m" trend="Đúng hẹn" up icon={Truck} color="emerald" />
      <KPI label="Xuất hôm nay" value="2,400 m" trend="3 tổ" icon={Truck} color="sky" />
    </div>
  );
}

function SewingStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KPI label="Tiến độ hôm nay" value="62.5%" trend="M758 Bộ trơn" up icon={Scissors} color="emerald" />
      <KPI label="Công nhân" value="11" trend="9 đi làm" icon={Users} color="sky" />
      <KPI label="SP hoàn thành" value="750" trend="/1200 target" up icon={CheckCircle2} color="emerald" />
      <KPI label="Lệnh chờ" value="1" trend="M873 Cotton" icon={Clock} color="amber" />
    </div>
  );
}

function QCStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KPI label="SP đã kiểm" value="4,200" trend="Tuần 30" up icon={ShieldCheck} color="emerald" />
      <KPI label="Tỷ lệ lỗi" value="1.2%" trend="-0.3% vs tuần trước" up icon={TrendingDown} color="emerald" />
      <KPI label="Cần kiểm hôm nay" value="800" trend="Lệnh M758" icon={Clock} color="amber" />
      <KPI label="Lô vải mới" value="2,400 m" trend="Chờ kiểm" icon={Package} color="sky" />
    </div>
  );
}

function FinishingStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KPI label="SP đã ủi" value="580" trend="/800 (72.5%)" up icon={Shirt} color="emerald" />
      <KPI label="Giao hôm nay" value="1,500" trend="Shop TT SG" icon={Truck} color="amber" />
      <KPI label="Kho thành phẩm" value="3,200" trend="Sẵn sàng" icon={Boxes} color="sky" />
      <KPI label="Đơn chờ giao" value="3" trend="2 deadline tuần này" icon={Clock} color="orange" />
    </div>
  );
}

function AccountantStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
  const colorMap: Record<string, string> = {
    emerald: "from-emerald-500/20 to-emerald-500/5 text-emerald-700",
    red: "from-red-500/20 to-red-500/5 text-red-700",
    amber: "from-amber-500/20 to-amber-500/5 text-amber-700",
    orange: "from-orange-500/20 to-orange-500/5 text-orange-700",
    sky: "from-sky-500/20 to-sky-500/5 text-sky-700",
    violet: "from-violet-500/20 to-violet-500/5 text-violet-700",
  };
  return (
    <div className={`card p-4 bg-gradient-to-br ${colorMap[color] || colorMap.sky}`}>
      <div className="text-xs opacity-70 flex items-center gap-1">
        <Icon className="w-3 h-3" /> {label}
      </div>
      <div className="text-2xl md:text-3xl font-bold mt-1 text-current">{value}</div>
      <div className="text-xs mt-1 flex items-center gap-1 opacity-80">
        {up ? <TrendingUp className="w-3 h-3" /> : down ? <TrendingDown className="w-3 h-3" /> : null}
        {trend}
      </div>
    </div>
  );
}

// My Queue
function MyQueue({ tasks }: { tasks: Task[] }) {
  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-brand-500" /> Việc của tôi
          </h3>
          <p className="text-xs opacity-60 mt-0.5">
            {tasks.length} công việc · {tasks.filter((t) => t.priority === "urgent").length} khẩn · {tasks.filter((t) => t.priority === "high").length} quan trọng
          </p>
        </div>
      </div>
      <div className="divide-y max-h-[500px] overflow-y-auto" style={{ borderColor: "var(--border)" }}>
        {tasks.length === 0 ? (
          <div className="p-8 text-center opacity-60 text-sm">Không có công việc nào 🎉</div>
        ) : (
          tasks.map((t) => (
            <Link
              key={t.id}
              href={t.link}
              className="p-3 flex items-start gap-3 hover:bg-white/30 dark:hover:bg-white/5 transition"
            >
              <div className={`shrink-0 w-1.5 h-12 rounded-full ${t.priority === "urgent" ? "bg-red-500" : t.priority === "high" ? "bg-amber-500" : t.priority === "medium" ? "bg-sky-500" : "bg-slate-400"}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${priorityColor(t.priority)}`}>
                    {priorityLabel(t.priority)}
                  </span>
                  <span className="text-[10px] opacity-60">{t.kind}</span>
                  {t.dueDate && (
                    <span className="text-[10px] opacity-60 ml-auto">
                      <Clock className="w-3 h-3 inline" /> {new Date(t.dueDate).toLocaleDateString("vi-VN", { day: "numeric", month: "numeric" })}
                    </span>
                  )}
                </div>
                <div className="font-medium text-sm">{t.title}</div>
                <div className="text-xs opacity-70 mt-0.5">{t.description}</div>
              </div>
              <ArrowRight className="w-4 h-4 opacity-30 mt-3 shrink-0" />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

// Quick Actions
function QuickActions({ role }: { role: Role }) {
  const actions = {
    admin: [
      { icon: Activity, label: "Xem Audit Log", href: "/audit-log", color: "violet" },
      { icon: Users, label: "Quản lý User", href: "/cai-dat", color: "sky" },
      { icon: Settings, label: "Phân quyền", href: "/cai-dat", color: "amber" },
      { icon: BarChart3, label: "Real-time", href: "/realtime", color: "emerald" },
    ],
    planner: [
      { icon: Plus, label: "Tạo KHSX", href: "/ke-hoach-san-xuat", color: "emerald" },
      { icon: Plus, label: "Tạo lệnh cắt", href: "/lenh-cat", color: "sky" },
      { icon: ShoppingCart, label: "Tạo đơn hàng", href: "/don-hang", color: "violet" },
      { icon: FileText, label: "Báo cáo SX", href: "/bao-cao", color: "amber" },
    ],
    warehouse: [
      { icon: Plus, label: "Nhập kho vải", href: "/kho-vai-tinhmann", color: "emerald" },
      { icon: Truck, label: "Xuất kho", href: "/kho-vai-tinhmann", color: "sky" },
      { icon: Plus, label: "Nhập phụ liệu", href: "/kho-phu-lieu", color: "violet" },
      { icon: Building2, label: "Đặt hàng NCC", href: "/nha-cung-cap", color: "amber" },
    ],
    sewing: [
      { icon: Scissors, label: "Bắt đầu cắt", href: "/lenh-cat", color: "emerald" },
      { icon: ListChecks, label: "Chấm công tổ", href: "/cham-cong", color: "sky" },
      { icon: Hammer, label: "Bàn giao tổ", href: "/may", color: "violet" },
      { icon: FileText, label: "Báo cáo tổ", href: "/bao-cao", color: "amber" },
    ],
    qc: [
      { icon: ShieldCheck, label: "Kiểm SP", href: "/qc", color: "emerald" },
      { icon: Eye, label: "Kiểm vải", href: "/qc", color: "sky" },
      { icon: FileText, label: "Báo cáo QC", href: "/bao-cao", color: "violet" },
      { icon: AlertCircle, label: "SP lỗi", href: "/qc", color: "red" },
    ],
    finishing: [
      { icon: Shirt, label: "Ủi SP", href: "/hoan-thien", color: "emerald" },
      { icon: Truck, label: "Giao hàng", href: "/giao-hang", color: "sky" },
      { icon: Boxes, label: "Kho thành phẩm", href: "/kho-thanh-pham", color: "violet" },
      { icon: CheckCircle2, label: "Xác nhận HT", href: "/hoan-thien", color: "amber" },
    ],
    accountant: [
      { icon: DollarSign, label: "Duyệt chi", href: "/cong-no", color: "emerald" },
      { icon: Users, label: "Tính lương", href: "/bang-luong", color: "sky" },
      { icon: FileText, label: "Báo cáo TC", href: "/bao-cao", color: "violet" },
      { icon: Wallet, label: "Công nợ NCC", href: "/nha-cung-cap", color: "amber" },
    ],
  }[role] || [];

  return (
    <div className="card p-4">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <Plus className="w-4 h-4 text-brand-500" /> Thao tác nhanh
      </h3>
      <div className="space-y-2">
        {actions.map((a, i) => {
          const colorMap: Record<string, string> = {
            emerald: "bg-emerald-500/15 text-emerald-700",
            sky: "bg-sky-500/15 text-sky-700",
            violet: "bg-violet-500/15 text-violet-700",
            amber: "bg-amber-500/15 text-amber-700",
            red: "bg-red-500/15 text-red-700",
          };
          return (
            <Link
              key={i}
              href={a.href}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/40 dark:hover:bg-white/5 transition"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorMap[a.color] || colorMap.sky}`}>
                <a.icon className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">{a.label}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-30" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// Helper import for Settings (used in admin actions)
import { Settings } from "lucide-react";
