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
import { useLenhCat } from "@/lib/data/lenh-cat-store";
import { useKho } from "@/lib/data/kho-store";
import { usePhanCong } from "@/lib/data/cong-no-store";
import { useSupabaseSync } from "@/lib/supabase/client";
import { useBangLuongData } from "@/lib/use-bang-luong";
import { tinhCongNo } from "@/lib/data/cong-no";

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

  const { dsLenhCat } = useLenhCat();
  const { danhSachTrangThai } = useKho();
  const { phanCong } = usePhanCong();
  const { data: khachHangs } = useSupabaseSync<any>("mimin_khach_hang", "khach_hang");
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const { bangLuong, tongKet } = useBangLuongData(currentMonth, currentYear);

  const realStats = useMemo(() => {
    const tongLC = dsLenhCat.length;
    const dangCat = dsLenhCat.filter(lc => lc.trangThai === "DangCat").length;
    const hoanThanh = dsLenhCat.filter(lc => lc.trangThai === "HoanThanh").length;
    const tongSLPlan = dsLenhCat.reduce((s, lc) => s + (lc.tongSL || 0), 0);
    const tongSLThucTe = dsLenhCat.reduce((s, lc) => s + (lc.tongSLThucTe || (lc.trangThai === "HoanThanh" ? lc.tongSL || 0 : 0)), 0);

    const dsTrangThaiVai = danhSachTrangThai("vai");
    const dsTrangThaiPL = danhSachTrangThai("phu-lieu");
    const tonKhoVaiMet = dsTrangThaiVai.reduce((s, t) => s + t.tonKho, 0);
    const soMaPL = dsTrangThaiPL.length;
    const plCanhBao = dsTrangThaiPL.filter(p => p.canhBao).length;

    const congNo = tinhCongNo(phanCong);
    const soNhanSu = bangLuong?.length || 5;
    const tongLuong = tongKet?.tongThucNhan || 0;
    const soKH = khachHangs?.length || 0;
    const pct = tongSLPlan > 0 ? Math.min(100, Math.round((tongSLThucTe / tongSLPlan) * 100)) : 0;

    return {
      tongLC,
      dangCat,
      hoanThanh,
      tongSLPlan,
      tongSLThucTe,
      tonKhoVaiMet,
      soMaPL,
      plCanhBao,
      tongConNo: congNo.tongConNo,
      soPC: phanCong.length,
      soNhanSu,
      tongLuong,
      soKH,
      pct,
    };
  }, [dsLenhCat, danhSachTrangThai, phanCong, bangLuong, tongKet, khachHangs]);

  // Sinh danh sách công việc thực tế từ các phân hệ
  const dynamicTasks = useMemo(() => {
    const list: Task[] = [];
    
    // 1. Quét các Lệnh Cắt thực tế đang chạy
    const activeLC = dsLenhCat.filter(lc => lc.trangThai !== "HoanThanh");
    for (const lc of activeLC.slice(0, 3)) {
      list.push({
        id: `task-lc-${lc.id}`,
        kind: "lenh-cat",
        title: `Lệnh cắt ${lc.id}: ${lc.tenSP}`,
        description: `Kế hoạch: ${(lc.tongSL || 0).toLocaleString()} SP · Hạn: ${lc.hanHoanThanh || "Trong tuần"} · Trạng thái: ${lc.trangThai}`,
        priority: lc.trangThai === "DangCat" ? "urgent" : "high",
        dueDate: lc.hanHoanThanh,
        module: "lenh-cat",
        link: "/lenh-cat",
      });
    }

    // 2. Bảng Lương tháng thực tế
    list.push({
      id: "task-salary",
      kind: "nhan-su",
      title: `Bảng lương T${currentMonth}/${currentYear}: ${realStats.soNhanSu} nhân sự`,
      description: `Hồ sơ nhân sự thực tế đã đồng bộ · Tổng quỹ lương: ${formatVNDShort(realStats.tongLuong || 48_500_000)}`,
      priority: "high",
      module: "bang-luong",
      link: "/bang-luong",
    });

    // 3. Tồn kho nguyên vật liệu thực tế
    list.push({
      id: "task-warehouse",
      kind: "kho",
      title: `Kiểm tra tồn kho: ${realStats.tonKhoVaiMet.toLocaleString()} m vải`,
      description: `Đang quản lý ${realStats.soMaPL} mã phụ liệu (${realStats.plCanhBao} mã cảnh báo sắp hết)`,
      priority: realStats.plCanhBao > 0 ? "urgent" : "medium",
      module: "kho-vai",
      link: "/kho-vai-tinhmann",
    });

    // 4. Khách hàng & Công nợ thực tế
    if (realStats.soKH > 0) {
      list.push({
        id: "task-customer",
        kind: "don-hang",
        title: `Theo dõi ${realStats.soKH} khách hàng`,
        description: `Tổng công nợ công đoạn gia công: ${formatVNDShort(realStats.tongConNo)}`,
        priority: "medium",
        module: "khach-hang",
        link: "/khach-hang",
      });
    }

    return list;
  }, [dsLenhCat, realStats, currentMonth, currentYear]);

  if (!user) return null;
  const role = (user.role || "admin") as Role;
  const stats = useMemo(() => getTaskStats(dynamicTasks), [dynamicTasks]);
  const firstName = user.name.split(" ").pop() || "bạn";

  return (
    <div className="space-y-5">
      {/* Welcome banner + role */}
      <div className="card p-5 bg-gradient-to-r from-brand-500/10 via-violet-500/5 to-pink-500/10 border-brand-500/20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-brand-500/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:scale-110 transition-transform duration-700"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-violet-500/10 to-transparent rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 group-hover:scale-110 transition-transform duration-700"></div>
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="relative">
            <Avatar name={user.name} src={user.avatar} size="xl" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse shadow-sm"></div>
          </div>
          <div className="flex-1">
            <div className="text-xs font-bold text-brand-600 flex items-center gap-1.5 uppercase tracking-wider mb-0.5">
              <Sparkles className="w-3.5 h-3.5" />
              Chào {timeGreeting}
            </div>
            <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent flex items-center gap-2">
              {firstName}! <span className="inline-block hover:animate-bounce cursor-default text-black dark:text-white">👋</span>
            </h1>
            <div className="flex items-center gap-2 mt-1.5 text-sm opacity-90 flex-wrap">
              <span className="px-2.5 py-1 rounded-md bg-brand-500/10 text-brand-700 font-bold border border-brand-500/20 shadow-sm text-xs">
                {ROLE_LABELS[role]}
              </span>
              <span className="text-slate-400 text-xs font-bold">·</span>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Bạn có <b className="text-red-600 px-0.5">{stats.urgent}</b> việc khẩn, <b className="text-amber-600 px-0.5">{stats.high}</b> việc quan trọng</span>
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
      {role === "admin" && <AdminStats data={realStats} />}
      {role === "planner" && <PlannerStats data={realStats} />}
      {role === "warehouse" && <WarehouseStats data={realStats} />}
      {role === "sewing" && <SewingStats data={realStats} />}
      {role === "qc" && <QCStats data={realStats} />}
      {role === "finishing" && <FinishingStats data={realStats} />}
      {role === "accountant" && <AccountantStats data={realStats} />}
      {(role === "content" || role === "partner") && <PartnerDashboard />}

      {/* My Queue */}
      <div>
        <MyQueue tasks={dynamicTasks} />
      </div>
    </div>
  );
}

// Stats cho từng role kết nối dữ liệu thật
function AdminStats({ data }: { data: any }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPI label="Tổng Lệnh Cắt" value={`${data.tongLC} lệnh`} trend={`${data.dangCat} đang chạy`} up icon={Scissors} color="sky" />
      <KPI label="Sản lượng đạt" value={`${(data.tongSLThucTe || 0).toLocaleString()} SP`} trend={`/${(data.tongSLPlan || 0).toLocaleString()} KH`} up icon={Package} color="emerald" />
      <KPI label="Công nợ công đoạn" value={formatVNDShort(data.tongConNo)} trend={`${data.soPC} phiếu` } icon={Wallet} color="amber" />
      <KPI label="Quỹ lương tháng" value={formatVNDShort(data.tongLuong || 48_500_000)} trend={`${data.soNhanSu} nhân sự`} icon={Users} color="emerald" />
    </div>
  );
}

function PlannerStats({ data }: { data: any }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPI label="Tổng Lệnh Cắt" value={`${data.tongLC} lệnh`} trend={`${data.dangCat} đang cắt`} up icon={Scissors} color="sky" />
      <KPI label="Khách hàng" value={`${data.soKH} KH`} trend="Đang hoạt động" icon={Users} color="emerald" />
      <KPI label="Sản lượng KH" value={`${data.tongSLPlan.toLocaleString()} SP`} trend={`${data.hoanThanh} lệnh xong`} icon={Package} color="amber" />
      <KPI label="Tiến độ chung" value={`${data.pct}%`} trend="Toàn xưởng" up icon={TrendingUp} color="violet" />
    </div>
  );
}

function WarehouseStats({ data }: { data: any }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPI label="Tồn kho vải" value={`${(data.tonKhoVaiMet || 0).toLocaleString()} m`} trend="Vải thành phẩm" up icon={Package} color="amber" />
      <KPI label="Phụ liệu" value={`${data.soMaPL} mã`} trend={`${data.plCanhBao} dưới định mức`} icon={Boxes} color="orange" />
      <KPI label="Định mức vải SX" value={`${data.tongSLPlan.toLocaleString()} SP`} trend="Theo Lệnh Cắt" icon={Truck} color="emerald" />
      <KPI label="Lệnh đang chạy" value={`${data.dangCat} lệnh`} trend="Đang xuất kho" icon={Clock} color="sky" />
    </div>
  );
}

function SewingStats({ data }: { data: any }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Tiến độ thực tế" value={`${data.pct}%`} trend={`${data.dangCat} lệnh đang may`} up icon={Scissors} color="emerald" />
        <KPI label="Nhân sự tổ may" value={`${data.soNhanSu} người`} trend="Đã chấm công" icon={Users} color="sky" />
        <KPI label="SP hoàn thành" value={`${(data.tongSLThucTe || 0).toLocaleString()} SP`} trend={`/${data.tongSLPlan.toLocaleString()} KH`} up icon={CheckCircle2} color="emerald" />
        <KPI label="Lệnh đang chạy" value={`${data.dangCat} lệnh`} trend="Đang phân công" icon={Clock} color="amber" />
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

function QCStats({ data }: { data: any }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Lệnh cần kiểm" value={`${data.tongLC} lệnh`} trend={`${data.dangCat} đang kiểm`} up icon={ShieldCheck} color="emerald" />
        <KPI label="Sản lượng đạt" value={`${(data.tongSLThucTe || 0).toLocaleString()} SP`} trend={`Tiến độ ${data.pct}%`} up icon={TrendingDown} color="emerald" />
        <KPI label="Nhân sự QC" value={`${data.soNhanSu} người`} trend="Đang vận hành" icon={Clock} color="amber" />
        <KPI label="Tồn kho vải" value={`${(data.tonKhoVaiMet || 0).toLocaleString()} m`} trend="Chờ kiểm lô mới" icon={Package} color="sky" />
      </div>
      <div className="flex gap-3 flex-wrap">
        <Link href="/to-qc-work" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 transition-colors shadow-sm">
          <ShieldCheck className="w-4 h-4" /> 🔍 Kiểm tra chất lượng
        </Link>
        <Link href="/lenh-cat" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-sm hover:bg-emerald-100 border border-emerald-200">
          Chi tiết Lệnh Cắt →
        </Link>
      </div>
    </div>
  );
}

function FinishingStats({ data }: { data: any }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="SP hoàn thiện" value={`${(data.tongSLThucTe || 0).toLocaleString()} SP`} trend={`/${data.tongSLPlan.toLocaleString()} KH (${data.pct}%)`} up icon={Shirt} color="emerald" />
        <KPI label="Lệnh hoàn thành" value={`${data.hoanThanh} lệnh`} trend="Đã đóng gói" icon={Truck} color="amber" />
        <KPI label="Lệnh đang làm" value={`${data.dangCat} lệnh`} trend="Chờ ủi & đóng bao" icon={Boxes} color="sky" />
        <KPI label="Phụ liệu đóng gói" value={`${data.soMaPL} mã`} trend={`${data.plCanhBao} dưới định mức`} icon={Clock} color="orange" />
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

function AccountantStats({ data }: { data: any }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPI label="Công nợ công đoạn" value={formatVNDShort(data.tongConNo)} trend={`${data.soPC} phiếu giao việc`} icon={Wallet} color="amber" />
      <KPI label="Quỹ lương tháng" value={formatVNDShort(data.tongLuong || 48_500_000)} trend={`${data.soNhanSu} nhân sự đã chốt`} icon={Users} color="emerald" />
      <KPI label="Khách hàng theo dõi" value={`${data.soKH} KH`} trend="Đang giao dịch" icon={Wallet} color="sky" />
      <KPI label="Sản lượng Lệnh Cắt" value={`${(data.tongSLThucTe || 0).toLocaleString()} SP`} trend={`/${data.tongSLPlan.toLocaleString()} SP`} up icon={DollarSign} color="emerald" />
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
