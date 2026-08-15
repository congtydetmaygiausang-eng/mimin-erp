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

      {/* 2 PREMIUM CARDS (THÊM MẪU MỚI & TẠO LỆNH CẮT) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Thêm Mẫu Mới */}
        <Link href="/danh-muc-sp" className="block relative w-full h-40 rounded-3xl overflow-hidden shadow-xl border border-white/20 group hover:shadow-2xl transition-all duration-300">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat group-hover:scale-105 transition-transform duration-700" 
            style={{ backgroundImage: "url('/bg/sky-soft.jpg')" }}
          ></div>
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-teal-900/80 via-teal-800/40 to-transparent"></div>
          
          <div className="relative z-10 p-6 flex flex-col h-full justify-center">
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-3 drop-shadow-md">
              <Shirt className="w-7 h-7 text-cyan-300" />
              Thêm Mẫu Mới
            </h2>
            <p className="mt-2 text-cyan-50 opacity-90 text-sm max-w-[80%] line-clamp-2">
              Quản lý sản phẩm gốc, cấu hình bảng size và định mức màu sắc.
            </p>
            <div className="absolute right-6 bottom-6 flex items-center justify-center w-12 h-12 rounded-full bg-white/20 border border-white/40 backdrop-blur-md shadow-[0_0_15px_rgba(34,211,238,0.3)] group-hover:shadow-[0_0_25px_rgba(34,211,238,0.6)] group-hover:bg-white/30 transition-all">
               <ArrowRight className="w-5 h-5 text-white group-hover:-rotate-45 transition-transform" />
            </div>
          </div>
        </Link>

        {/* Card 2: Tạo Lệnh Cắt */}
        <Link href="/lenh-cat" className="block relative w-full h-40 rounded-3xl overflow-hidden shadow-xl border border-white/20 group hover:shadow-2xl transition-all duration-300">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat group-hover:scale-105 transition-transform duration-700" 
            style={{ backgroundImage: "url('/bg/sky-soft.jpg')" }}
          ></div>
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-teal-900/80 via-teal-800/40 to-transparent"></div>
          
          <div className="relative z-10 p-6 flex flex-col h-full justify-center">
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-3 drop-shadow-md">
              <Scissors className="w-7 h-7 text-cyan-300" />
              Tạo Lệnh Cắt
            </h2>
            <p className="mt-2 text-cyan-50 opacity-90 text-sm max-w-[80%] line-clamp-2">
              Lên lệnh cắt mới, tự động tính toán định mức vải và giá vốn (COGS).
            </p>
            <div className="absolute right-6 bottom-6 flex items-center justify-center w-12 h-12 rounded-full bg-white/20 border border-white/40 backdrop-blur-md shadow-[0_0_15px_rgba(34,211,238,0.3)] group-hover:shadow-[0_0_25px_rgba(34,211,238,0.6)] group-hover:bg-white/30 transition-all">
               <ArrowRight className="w-5 h-5 text-white group-hover:-rotate-45 transition-transform" />
            </div>
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

function getGreeting(role: Role): string {
  const hour = new Date().getHours();
  const time = hour < 12 ? "buổi sáng" : hour < 18 ? "buổi chiều" : "buổi tối";
  const lastName = ({ admin: "An", planner: "Bình", warehouse: "Cường", sewing: "Dung", qc: "Đức", finishing: "Hương", accountant: "Hùng", content: "Vy", partner: "đối tác" } as Partial<Record<Role, string>>)[role] || "bạn";
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
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
            🔔 Trung tâm cảnh báo báo cáo thực tế
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
