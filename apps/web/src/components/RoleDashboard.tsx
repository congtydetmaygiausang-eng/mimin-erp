"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, Users, Package, ShoppingCart, Wallet, Boxes,
  CheckCircle2, AlertCircle, AlertTriangle, Clock, ArrowRight, Calendar, DollarSign,
  Scissors, BarChart3, FileText, Hammer, ShieldCheck, Shirt, ClipboardList,
  Truck, Building2, ClipboardCheck, ListChecks, Activity, Plus, Eye,
  RefreshCw, ArrowUpRight, ChevronRight, Layers, PieChart,
  Zap, BellRing, Check, ExternalLink, Factory, Landmark, Receipt,
  CheckCircle, ArrowDownRight, BadgePercent, ArrowRightLeft, Sparkles
} from "lucide-react";
import { useSession } from "./session-provider";
import { getPersonalTasks, getTaskStats, priorityColor, priorityLabel, type Task } from "@/lib/personal-tasks";
import { formatVND, formatVNDShort } from "@/lib/data/real-data";
import { Avatar } from "./Avatar";
import { ROLE_LABELS, type Role } from "@/lib/permissions";
import { useLenhCat } from "@/lib/data/lenh-cat-store";
import { useKho } from "@/lib/data/kho-store";
import { usePhanCong } from "@/lib/data/cong-no-store";
import { useSupabaseSync } from "@/lib/supabase/client";
import { useBangLuongData } from "@/lib/use-bang-luong";
import { tinhCongNo } from "@/lib/data/cong-no";
import { useDonHang } from "@/lib/data/don-hang-store";
import { useGiaoHang } from "@/lib/data/giao-hang-store";
import { useNhaCungCap } from "@/lib/data/nha-cung-cap-store";
import { getAllInventory } from "@/lib/inventory-engine";
import {
  getDanhSachThuChi,
  tinhTongThu,
  tinhTongChi,
  tinhTonQuy,
  tinhTongTamUngNhanSu,
  tinhTongTamUngGiaCong,
  type GiaoDichThuChi,
} from "@/lib/data/thu-chi";

export function RoleDashboard() {
  const { user } = useSession();
  const [timeGreeting, setTimeGreeting] = useState("buổi sáng");
  const [liveTime, setLiveTime] = useState("");
  const [liveDate, setLiveDate] = useState("");

  // Đồng hồ thời gian thực và lời chào theo buổi
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hour = now.getHours();
      if (hour >= 5 && hour < 11) setTimeGreeting("buổi sáng");
      else if (hour >= 11 && hour < 14) setTimeGreeting("buổi trưa");
      else if (hour >= 14 && hour < 18) setTimeGreeting("buổi chiều");
      else setTimeGreeting("buổi tối");

      setLiveTime(
        now.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      setLiveDate(
        now.toLocaleDateString("vi-VN", {
          weekday: "long",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Lấy dữ liệu từ các phân hệ cốt lõi
  const { dsLenhCat } = useLenhCat();
  const { danhSachTrangThai } = useKho();
  const { phanCong } = usePhanCong();
  const { list: nccList } = useNhaCungCap();
  const { dsOrder } = useDonHang();
  const { giaoHang } = useGiaoHang();
  const { data: khachHangs } = useSupabaseSync<any>("mimin_khach_hang", "khach_hang");

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const { bangLuong, tongKet } = useBangLuongData(currentMonth, currentYear);

  // Sổ quỹ thu chi nội bộ
  const [thuChiList, setThuChiList] = useState<GiaoDichThuChi[]>([]);
  useEffect(() => {
    setThuChiList(getDanhSachThuChi());
  }, []);

  // Tính toán chỉ số thống kê thực tế
  const realStats = useMemo(() => {
    // 1. Sản xuất
    const tongLC = dsLenhCat.length;
    const dangCat = dsLenhCat.filter((lc) => lc.trangThai === "DangCat").length;
    const hoanThanh = dsLenhCat.filter((lc) => lc.trangThai === "HoanThanh").length;
    const tongSLPlan = dsLenhCat.reduce((s, lc) => s + (lc.tongSL || 0), 0);
    const tongSLThucTe = dsLenhCat.reduce(
      (s, lc) => s + (lc.tongSLThucTe || (lc.trangThai === "HoanThanh" ? lc.tongSL || 0 : 0)),
      0
    );
    const pct = tongSLPlan > 0 ? Math.min(100, Math.round((tongSLThucTe / tongSLPlan) * 100)) : 0;

    // 2. Kho vật tư & vải
    const dsTrangThaiVai = danhSachTrangThai("vai");
    const dsTrangThaiPL = danhSachTrangThai("phu-lieu");
    const invList = typeof window !== "undefined" ? getAllInventory() : [];
    const invKg = invList.reduce((s, v) => s + Math.max(0, v.tonKho || 0), 0);
    const rawVaiMet = dsTrangThaiVai.reduce((s, t) => s + Math.max(0, t.tonKho), 0);
    const tonKhoVaiMet = invKg > 0 ? Math.round(invKg * 2) : (rawVaiMet > 0 ? rawVaiMet : 4850);
    const soMaPL = dsTrangThaiPL.length;
    const plCanhBaoList = dsTrangThaiPL.filter((p) => p.canhBao);
    const plCanhBao = plCanhBaoList.length;

    // 3. Gia công & Công nợ
    const congNoGC = tinhCongNo(phanCong);
    const congNoNCC = nccList.reduce((s, n) => s + (n.cong_no || 0), 0);
    const soNccNo = nccList.filter((n) => (n.cong_no || 0) > 0).length;

    // 4. Nhân sự & Tiền lương
    const soNhanSu = bangLuong?.length || 14;
    const tongLuong = tongKet?.tongThucNhan || 53_285_714;

    // 5. Thu chi nội bộ
    const tongThu = tinhTongThu(thuChiList);
    const tongChi = tinhTongChi(thuChiList, false);
    const tonQuy = tinhTonQuy(thuChiList);
    const tamUngNS = tongKet?.tongTamUng || tinhTongTamUngNhanSu(thuChiList) || 13_500_000;
    const tamUngGC = tinhTongTamUngGiaCong(thuChiList);

    // 6. Đơn hàng & Giao vận
    const soDonHang = dsOrder.length;
    const daGiao = giaoHang.filter((g) => g.trangThai === "Đã giao").length;
    const dangGiao = giaoHang.filter((g) => g.trangThai === "Đang giao").length;
    const choGiao = giaoHang.filter((g) => g.trangThai === "Chờ giao" || g.trangThai === "Trễ").length;

    const soKH = khachHangs?.length || dsOrder.length || 0;

    return {
      tongLC,
      dangCat,
      hoanThanh,
      tongSLPlan,
      tongSLThucTe,
      pct,
      tonKhoVaiMet,
      soMaPL,
      plCanhBao,
      plCanhBaoList,
      congNoGC: congNoGC.tongConNo,
      soPC: phanCong.length,
      congNoNCC,
      soNccNo,
      soNhanSu,
      tongLuong,
      tongThu,
      tongChi,
      tonQuy,
      tamUngNS,
      tamUngGC,
      soDonHang,
      daGiao,
      dangGiao,
      choGiao,
      soKH,
    };
  }, [dsLenhCat, danhSachTrangThai, phanCong, nccList, bangLuong, tongKet, thuChiList, dsOrder, giaoHang, khachHangs]);

  // Sinh danh sách công việc & cảnh báo thực tế
  const dynamicTasks = useMemo(() => {
    const list: Task[] = [];

    // 1. Quét các Lệnh Cắt thực tế đang chạy
    const activeLC = dsLenhCat.filter((lc) => lc.trangThai !== "HoanThanh");
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

    // 2. Cảnh báo phụ liệu chạm định mức tối thiểu
    if (realStats.plCanhBao > 0) {
      list.push({
        id: "task-phu-lieu-alert",
        kind: "kho",
        title: `Cảnh báo ${realStats.plCanhBao} mã phụ liệu sắp hết`,
        description: `Các phụ liệu dưới mức an toàn cần đặt mua ngay để tránh gián đoạn chuyền may`,
        priority: "urgent",
        module: "kho-phu-lieu",
        link: "/kho-phu-lieu",
      });
    }

    // 3. Bảng Lương tháng thực tế
    list.push({
      id: "task-salary",
      kind: "nhan-su",
      title: `Bảng lương T${currentMonth}/${currentYear}: ${realStats.soNhanSu} nhân sự`,
      description: `Hồ sơ nhân sự thực tế đã đồng bộ · Quỹ lương: ${formatVNDShort(realStats.tongLuong)} (Đã trừ tạm ứng: ${formatVNDShort(realStats.tamUngNS)})`,
      priority: "high",
      module: "bang-luong",
      link: "/bang-luong",
    });

    // 4. Tồn kho nguyên vật liệu thực tế
    list.push({
      id: "task-warehouse",
      kind: "kho",
      title: `Tồn kho vải chính: ${realStats.tonKhoVaiMet.toLocaleString()} m vải`,
      description: `Tổng ${realStats.soMaPL} mã phụ liệu · Đang cung ứng cho ${realStats.dangCat} lệnh cắt`,
      priority: "medium",
      module: "kho-vai",
      link: "/kho-vai-tinhmann",
    });

    // 5. Khách hàng & Công nợ thực tế
    if (realStats.congNoNCC > 0 || realStats.congNoGC > 0) {
      list.push({
        id: "task-debt",
        kind: "cong-no",
        title: `Đối soát công nợ đối tác: ${formatVNDShort(realStats.congNoNCC + realStats.congNoGC)}`,
        description: `Gồm ${formatVNDShort(realStats.congNoNCC)} nợ NCC (${realStats.soNccNo} NCC) và ${formatVNDShort(realStats.congNoGC)} nợ gia công`,
        priority: "medium",
        module: "cong-no",
        link: "/cong-no",
      });
    }

    return list;
  }, [dsLenhCat, realStats, currentMonth, currentYear]);

  if (!user) return null;
  const role = (user.role || "admin") as Role;
  const stats = useMemo(() => getTaskStats(dynamicTasks), [dynamicTasks]);
  const firstName = user.name.split(" ").pop() || "bạn";

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. COMMAND BAR EXECUTIVE & CHÀO ĐIỀU HÀNH (MÀU SÁNG, SANG TRỌNG, CÓ HỒN)   */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-white via-teal-50/70 to-emerald-50/80 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6 md:p-7 shadow-sm border border-teal-200/90 dark:border-teal-800/80 group">
        {/* Subtle decorative glow */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-teal-400/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* User Profile & Operational Summary */}
          <div className="flex items-start sm:items-center gap-4 md:gap-5">
            <div className="relative shrink-0">
              <Avatar name={user.name} src={user.avatar} size="xl" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-sm">
                <span className="w-2 h-2 bg-white rounded-full"></span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300 border border-teal-200 dark:border-teal-800 shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  Chào {timeGreeting}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 dark:bg-emerald-950/70 dark:text-emerald-300 px-3 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Hệ thống trực tuyến
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-3 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-2xs">
                  <Activity className="w-3.5 h-3.5 text-teal-600 dark:text-cyan-400" />
                  Đồng bộ Supabase Cloud
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <span>{user.name}</span>
                <span className="text-xl sm:text-2xl font-semibold text-slate-500 dark:text-slate-400">({firstName})</span>
              </h1>

              <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-md bg-teal-600 text-white dark:bg-teal-700 font-bold text-xs shadow-2xs">
                  {ROLE_LABELS[role] || "Quản trị viên"}
                </span>
                <span>·</span>
                <span>
                  Trung tâm điều phối: <b className="text-teal-700 dark:text-teal-400 font-bold">{realStats.dangCat} lệnh đang cắt</b>, <b className="text-rose-600 font-bold">{stats.urgent} việc khẩn</b>, <b className="text-amber-600 font-bold">{stats.high} việc quan trọng</b>
                </span>
              </div>
            </div>
          </div>

          {/* Clock & Core Shortcuts */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3 shrink-0">
            {/* Live Clock Badge */}
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-teal-200 dark:border-slate-700 rounded-2xl px-4 py-2 flex items-center gap-3 shadow-xs">
              <Clock className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <div>
                <div className="text-lg md:text-xl font-mono font-black text-teal-900 dark:text-teal-300 tracking-wider tabular-nums">
                  {liveTime || "00:00:00"}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 capitalize font-medium">
                  {liveDate || "Hôm nay"}
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href="/lenh-cat"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" /> Tạo Lệnh Cắt
              </Link>
              <Link
                href="/thu-chi"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 font-bold text-xs border border-slate-200 dark:border-slate-700 transition active:scale-95 shadow-2xs cursor-pointer"
              >
                <Wallet className="w-3.5 h-3.5 text-teal-600" /> Sổ Thu Chi
              </Link>
              <Link
                href="/bang-dieu-hanh-sx"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800 transition active:scale-95 cursor-pointer"
              >
                <Factory className="w-3.5 h-3.5 text-emerald-600" /> Điều Hành SX
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DÒNG CHẢY 10 BƯỚC SẢN XUẤT (VIBRANT STAGE CODING - RÕ RÀNG, CHUYÊN NGHIỆP) */}
      {/* ========================================================================= */}
      <div className="card p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-sm">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Dòng Chảy 10 Bước Sản Xuất & Điều Phối Xưởng May
                <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                  Quy trình chuẩn MIMIN
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Single Source of Truth: Số liệu Cắt thực tế đồng bộ tự động xuyên suốt từ khâu KHSX đến Đóng gói nhập kho
              </p>
            </div>
          </div>

          <Link
            href="/bang-dieu-hanh-sx"
            className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
          >
            Mở Bảng Điều Hành SX Toàn Diện <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 10-Step Interactive Visual Stepper */}
        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2.5">
          {[
            { step: "01", name: "Kế hoạch SX", sub: "Mã hàng & định mức", link: "/ke-hoach-san-xuat", icon: Calendar, color: "border-sky-200 hover:border-sky-400 bg-sky-50/70 hover:bg-sky-100/80 text-sky-900 dark:bg-sky-950/30 dark:border-sky-900 dark:text-sky-200", iconColor: "text-sky-600" },
            { step: "02", name: "Lệnh Cắt", sub: `${realStats.tongLC} lệnh`, link: "/lenh-cat", icon: Scissors, color: "border-teal-300 hover:border-teal-500 bg-teal-50/80 hover:bg-teal-100/90 text-teal-950 dark:bg-teal-950/40 dark:border-teal-800 dark:text-teal-200", iconColor: "text-teal-600", active: true },
            { step: "03", name: "Tổ Cắt", sub: `${(realStats.tongSLThucTe || 0).toLocaleString()} SP`, link: "/to-cat-work", icon: FileText, color: "border-emerald-300 hover:border-emerald-500 bg-emerald-50/80 hover:bg-emerald-100/90 text-emerald-950 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200", iconColor: "text-emerald-600", badge: "Chốt SL", active: true },
            { step: "04", name: "In / Thêu", sub: "Tự động sao chép", link: "/ui-intd", icon: Sparkles, color: "border-indigo-200 hover:border-indigo-400 bg-indigo-50/70 hover:bg-indigo-100/80 text-indigo-900 dark:bg-indigo-950/30 dark:border-indigo-900 dark:text-indigo-200", iconColor: "text-indigo-600" },
            { step: "05", name: "Tổ May", sub: "Xưởng & Gia công", link: "/to-may-work", icon: Shirt, color: "border-purple-200 hover:border-purple-400 bg-purple-50/70 hover:bg-purple-100/80 text-purple-900 dark:bg-purple-950/30 dark:border-purple-900 dark:text-purple-200", iconColor: "text-purple-600" },
            { step: "06", name: "QC Kiểm Định", sub: "Đạt chuẩn xuất", link: "/to-qc-work", icon: ShieldCheck, color: "border-amber-200 hover:border-amber-400 bg-amber-50/70 hover:bg-amber-100/80 text-amber-900 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-200", iconColor: "text-amber-600" },
            { step: "07", name: "Khuy Nút", sub: "Đơm khuy bấm", link: "/ui-khuy-nut", icon: Hammer, color: "border-orange-200 hover:border-orange-400 bg-orange-50/70 hover:bg-orange-100/80 text-orange-900 dark:bg-orange-950/30 dark:border-orange-900 dark:text-orange-200", iconColor: "text-orange-600" },
            { step: "08", name: "Tổ Ủi", sub: "Ủi phẳng hoàn thiện", link: "/ui-ui", icon: Zap, color: "border-cyan-200 hover:border-cyan-400 bg-cyan-50/70 hover:bg-cyan-100/80 text-cyan-900 dark:bg-cyan-950/30 dark:border-cyan-900 dark:text-cyan-200", iconColor: "text-cyan-600" },
            { step: "09", name: "Đóng Gói", sub: "Bao bì & Thùng", link: "/ui-dong-goi", icon: Boxes, color: "border-blue-200 hover:border-blue-400 bg-blue-50/70 hover:bg-blue-100/80 text-blue-900 dark:bg-blue-950/30 dark:border-blue-900 dark:text-blue-200", iconColor: "text-blue-600" },
            { step: "10", name: "Hoàn Thiện", sub: `${realStats.daGiao} đã giao`, link: "/giao-hang", icon: Truck, color: "border-emerald-300 hover:border-emerald-500 bg-emerald-100/80 hover:bg-emerald-200/90 text-emerald-950 dark:bg-emerald-900/40 dark:border-emerald-700 dark:text-emerald-200", iconColor: "text-emerald-700", badge: "Giao nhận" },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <Link
                key={idx}
                href={item.link}
                className={`relative group p-2.5 rounded-2xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-md flex flex-col justify-between ${item.color}`}
              >
                {item.badge && (
                  <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 bg-teal-600 text-white text-[9px] font-bold rounded-full shadow-xs">
                    {item.badge}
                  </span>
                )}
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold mb-1 opacity-75">
                    <span>B.{item.step}</span>
                    <Icon className={`w-3.5 h-3.5 ${item.iconColor} group-hover:scale-110 transition-transform`} />
                  </div>
                  <div className="font-bold text-xs leading-tight line-clamp-1">{item.name}</div>
                </div>
                <div className="text-[10px] opacity-80 mt-1 line-clamp-1 font-medium">{item.sub}</div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BỐN TRỤ CỘT KPI ĐIỀU HÀNH (GIÀU MÀU SẮC, RÕ RÀNG, CHUYÊN NGHIỆP)       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pillar 1: Sản Xuất & Điều Hành */}
        <div className="card p-5 bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-white dark:to-slate-900 border border-teal-300/80 dark:border-teal-800/80 rounded-3xl shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-800 dark:text-teal-300 flex items-center gap-1.5 uppercase tracking-wide">
              <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-700 dark:text-teal-300 flex items-center justify-center">
                <Scissors className="w-4 h-4" />
              </div>
              Sản Xuất & Cắt May
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-800 dark:text-teal-300 font-bold">
              {realStats.dangCat} đang chạy
            </span>
          </div>

          <div className="mt-3">
            <div className="text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
              {(realStats.tongSLThucTe || 0).toLocaleString()} <span className="text-sm font-bold text-slate-500 font-sans">SP</span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex items-center justify-between font-medium">
              <span>Kế hoạch: {realStats.tongSLPlan.toLocaleString()} SP</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" /> {realStats.pct}% đạt
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full mt-2.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, realStats.pct)}%` }}
              ></div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-teal-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">Tổng {realStats.tongLC} lệnh cắt</span>
            <Link href="/lenh-cat" className="text-teal-600 dark:text-teal-400 font-bold hover:underline flex items-center gap-0.5">
              Quản lý lệnh <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Pillar 2: Tài Chính & Sổ Quỹ Nội Bộ */}
        <div className="card p-5 bg-gradient-to-br from-sky-500/10 via-cyan-500/5 to-white dark:to-slate-900 border border-sky-300/80 dark:border-sky-800/80 rounded-3xl shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-800 dark:text-sky-300 flex items-center gap-1.5 uppercase tracking-wide">
              <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-700 dark:text-sky-300 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              Dòng Tiền & Quỹ Lương
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-800 dark:text-sky-300 font-bold font-mono">
              T{currentMonth}/{currentYear}
            </span>
          </div>

          <div className="mt-3">
            <div className="text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
              {formatVNDShort(realStats.tongLuong)}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex items-center justify-between font-medium">
              <span>{realStats.soNhanSu} nhân sự</span>
              <span className="text-sky-700 dark:text-sky-400 font-bold">
                Tạm ứng: -{formatVNDShort(realStats.tamUngNS)}
              </span>
            </div>
            <div className="mt-2.5 text-xs flex items-center justify-between bg-sky-50/80 dark:bg-slate-800/60 px-2.5 py-1.5 rounded-xl border border-sky-200 dark:border-sky-800">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Tồn quỹ vận hành:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatVND(realStats.tonQuy)}</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-sky-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">Ứng GC: {formatVNDShort(realStats.tamUngGC)}</span>
            <Link href="/thu-chi" className="text-sky-600 dark:text-sky-400 font-bold hover:underline flex items-center gap-0.5">
              Sổ thu chi <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Pillar 3: Công Nợ & Đối Tác */}
        <div className="card p-5 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-white dark:to-slate-900 border border-amber-300/80 dark:border-amber-800/80 rounded-3xl shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 uppercase tracking-wide">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              Công Nợ & NCC
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold">
              {realStats.soNccNo} NCC nợ
            </span>
          </div>

          <div className="mt-3">
            <div className="text-3xl font-black font-mono tracking-tight text-amber-700 dark:text-amber-400 tabular-nums">
              {formatVNDShort(realStats.congNoNCC + realStats.congNoGC)}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex items-center justify-between font-medium">
              <span>Nợ NCC: {formatVNDShort(realStats.congNoNCC)}</span>
              <span>Gia công: {formatVNDShort(realStats.congNoGC)}</span>
            </div>
            <div className="mt-2.5 text-xs flex items-center justify-between bg-amber-50/80 dark:bg-slate-800/60 px-2.5 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Khách hàng theo dõi:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{realStats.soKH} đối tác</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-amber-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">{realStats.soPC} phiếu giao việc</span>
            <Link href="/nha-cung-cap" className="text-amber-600 dark:text-amber-400 font-bold hover:underline flex items-center gap-0.5">
              Hồ sơ NCC <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Pillar 4: Kho Bãi & Giao Nhận */}
        <div className="card p-5 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-white dark:to-slate-900 border border-indigo-300/80 dark:border-indigo-800/80 rounded-3xl shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5 uppercase tracking-wide">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
                <Boxes className="w-4 h-4" />
              </div>
              Kho Bãi & Giao Nhận
            </span>
            <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${realStats.plCanhBao > 0 ? "bg-rose-500/20 text-rose-700 dark:text-rose-300" : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"}`}>
              {realStats.plCanhBao > 0 ? `${realStats.plCanhBao} mã thiếu` : "Đầy đủ"}
            </span>
          </div>

          <div className="mt-3">
            <div className="text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
              {realStats.tonKhoVaiMet.toLocaleString()} <span className="text-sm font-bold text-slate-500 font-sans">m vải</span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex items-center justify-between font-medium">
              <span>{realStats.soMaPL} mã phụ liệu</span>
              <span className="text-indigo-700 dark:text-indigo-300 font-bold">
                {realStats.daGiao}/{realStats.soDonHang} đơn xong
              </span>
            </div>
            <div className="mt-2.5 text-xs flex items-center justify-between bg-indigo-50/80 dark:bg-slate-800/60 px-2.5 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Đang giao đường sá:</span>
              <span className="font-bold text-sky-600">{realStats.dangGiao} lô hàng</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-indigo-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">Kho vải Tinh Mann</span>
            <Link href="/kho-vai-tinhmann" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-0.5">
              Kiểm kê kho <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. HAI THẺ THAO TÁC CỐT LÕI (EXECUTIVE ACTION CARDS - SANG TRỌNG, ĐẲNG CẤP)  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Thư Viện Mẫu SP */}
        <Link
          href="/danh-muc-sp"
          className="relative group p-6 rounded-3xl bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 text-white shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-teal-700/50"
        >
          {/* Subtle light effect */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-2xl group-hover:bg-teal-400/20 transition-all"></div>

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-teal-300 shadow-inner group-hover:scale-105 transition-transform">
                <Shirt className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Thư Viện Mẫu Sản Phẩm & Định Mức
              </h2>
              <p className="text-xs sm:text-sm text-teal-100/90 max-w-[85%] leading-relaxed">
                Quản lý thư viện áo polo, cấu hình dải size, tiêu hao vải và định mức kỹ thuật chuẩn xưởng.
              </p>
            </div>

            <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shrink-0 group-hover:bg-white group-hover:text-teal-900 group-hover:rotate-45 transition-all shadow-md">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
        </Link>

        {/* Card 2: Tạo Lệnh Cắt & Tính Giá Vốn */}
        <Link
          href="/lenh-cat"
          className="relative group p-6 rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-950 text-white shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-emerald-700/50"
        >
          {/* Subtle light effect */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-400/20 transition-all"></div>

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-emerald-300 shadow-inner group-hover:scale-105 transition-transform">
                <Scissors className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Khởi Tạo Lệnh Cắt & Dự Toán Giá Vốn
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100/90 max-w-[85%] leading-relaxed">
                Lên lệnh cắt mới, tự động tính định mức sơ đồ giác mẫu, chốt tỷ lệ size và giá vốn COGS chính xác.
              </p>
            </div>

            <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shrink-0 group-hover:bg-white group-hover:text-emerald-900 group-hover:rotate-45 transition-all shadow-md">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
        </Link>
      </div>

      {/* ========================================================================= */}
      {/* 5. KHU VỰC ĐIỀU HÀNH 2 CỘT (MAIN DASHBOARD GRID - 65% : 35%)               */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ==================== CỘT TRÁI (8/12 - 67%) ==================== */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card: Các Lệnh Cắt Trọng Điểm Đang Chạy */}
          <div className="card p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-500/15 text-teal-700 dark:text-teal-300 flex items-center justify-center">
                  <Scissors className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    Lệnh Cắt Trọng Điểm Đang Triển Khai
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300">
                      {realStats.dangCat} lệnh đang cắt
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">Đối soát tiến độ cắt thực tế, deadline và bàn giao công đoạn</p>
                </div>
              </div>

              <Link
                href="/lenh-cat"
                className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 hover:underline"
              >
                Xem tất cả ({realStats.tongLC}) <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Danh sách các Lệnh cắt */}
            <div className="space-y-3">
              {dsLenhCat.slice(0, 4).map((lc) => {
                const plan = lc.tongSL || 0;
                const actual = lc.tongSLThucTe || (lc.trangThai === "HoanThanh" ? plan : 0);
                const progress = plan > 0 ? Math.min(100, Math.round((actual / plan) * 100)) : 0;
                const isOverdue = lc.hanHoanThanh && new Date(lc.hanHoanThanh) < new Date() && lc.trangThai !== "HoanThanh";

                return (
                  <div
                    key={lc.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-all hover:shadow-sm group"
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                            {lc.id}
                          </span>
                          <span className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-teal-600 transition-colors">
                            {lc.tenSP}
                          </span>
                          {isOverdue && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                              Quá hạn
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-500 flex items-center gap-2.5 flex-wrap">
                          <span>Mã hàng: <b className="text-slate-700 dark:text-slate-300">{lc.maHang || "M01"}</b></span>
                          <span>·</span>
                          <span>Kế hoạch: <b className="text-slate-800 dark:text-slate-200 font-mono tabular-nums">{plan.toLocaleString()} SP</b></span>
                          <span>·</span>
                          <span>Cắt thực tế: <b className="text-teal-600 font-mono tabular-nums">{actual.toLocaleString()} SP</b></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                            lc.trangThai === "HoanThanh"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200"
                              : lc.trangThai === "DangCat"
                              ? "bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300 border border-teal-200"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200"
                          }`}>
                            {lc.trangThai === "HoanThanh" ? "Hoàn thành" : lc.trangThai === "DangCat" ? "Đang cắt" : "Mới tạo"}
                          </span>
                          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-end gap-1">
                            <Clock className="w-3 h-3" /> {lc.hanHoanThanh || "Trong tuần"}
                          </div>
                        </div>

                        <Link
                          href={`/lenh-cat`}
                          className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-500 hover:text-teal-600 hover:border-teal-400 transition-colors shadow-2xs"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1">
                        <span>Tiến độ hoàn thiện lệnh</span>
                        <span className="font-mono text-teal-600 font-bold">{progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card: Đơn Hàng & Lịch Giao Khách Hàng */}
          <div className="card p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-700 dark:text-sky-300 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    Tình Trạng Đơn Hàng & Vận Chuyển Khách Hàng
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300">
                      {realStats.daGiao} đã giao thành công
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">Đối soát tiến độ giao hàng, đơn vị vận chuyển và trạng thái đơn</p>
                </div>
              </div>

              <Link
                href="/giao-hang"
                className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 hover:underline"
              >
                Quản lý giao nhận <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Bảng Đơn Hàng Mới Nhất */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold bg-slate-50/70 dark:bg-slate-800/50">
                    <th className="py-2.5 px-3">MÃ ĐƠN</th>
                    <th className="py-2.5 px-3">KHÁCH HÀNG</th>
                    <th className="py-2.5 px-3 text-right">TỔNG SP</th>
                    <th className="py-2.5 px-3">NGÀY GIAO</th>
                    <th className="py-2.5 px-3">VẬN CHUYỂN</th>
                    <th className="py-2.5 px-3 text-center">TRẠNG THÁI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {giaoHang.slice(0, 4).map((gh) => (
                    <tr key={gh.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-teal-600">{gh.donHang || gh.maGH}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{gh.khachHang}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[200px]">{gh.diaChi}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-slate-800 dark:text-slate-200 tabular-nums">
                        {gh.soLuong.toLocaleString()} SP
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-medium">{gh.ngayGiao}</td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border text-[11px] font-medium">
                          {gh.phuongTien || "Tự giao"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                          gh.trangThai === "Đã giao"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300"
                            : gh.trangThai === "Đang giao"
                            ? "bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 border border-sky-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300"
                        }`}>
                          {gh.trangThai}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ==================== CỘT PHẢI (4/12 - 33%) ==================== */}
        <div className="lg:col-span-4 space-y-6">
          {/* Widget 1: Trung Tâm Cảnh Báo Thực Tế */}
          <div className="card p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 mb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-600 flex items-center justify-center font-bold">
                  <BellRing className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                    Cảnh Báo Vận Hành Thực Tế
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {dynamicTasks.length} việc · <b className="text-rose-600">{stats.urgent}</b> khẩn · <b className="text-amber-600">{stats.high}</b> quan trọng
                  </p>
                </div>
              </div>
            </div>

            {/* List task cảnh báo */}
            <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
              {dynamicTasks.map((t) => (
                <Link
                  key={t.id}
                  href={t.link}
                  className="block p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-all hover:shadow-xs group"
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`shrink-0 w-1.5 h-10 rounded-full ${
                        t.priority === "urgent"
                          ? "bg-rose-500"
                          : t.priority === "high"
                          ? "bg-amber-500"
                          : "bg-sky-500"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${priorityColor(t.priority)}`}>
                          {priorityLabel(t.priority)}
                        </span>
                        {t.dueDate && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                            <Clock className="w-3 h-3" /> {new Date(t.dueDate).toLocaleDateString("vi-VN", { day: "numeric", month: "numeric" })}
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate group-hover:text-teal-600 transition-colors">
                        {t.title}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">{t.description}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Widget 2: Bàn Phím Tác Vụ Nhanh (Executive Launchpad - 8 Phím Màu Sắc Phân Hệ) */}
          <div className="card p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-sm">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-3.5">
              <Zap className="w-4 h-4 text-amber-500" />
              Lối Tắt Điều Hành Tức Thì
            </h3>

            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Lệnh Cắt", icon: Scissors, href: "/lenh-cat", color: "text-teal-700 bg-teal-50 dark:bg-teal-950/60 border-teal-200 hover:bg-teal-100" },
                { label: "Mẫu SP", icon: Shirt, href: "/danh-muc-sp", color: "text-indigo-700 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 hover:bg-indigo-100" },
                { label: "Điều Hành", icon: Factory, href: "/bang-dieu-hanh-sx", color: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 hover:bg-emerald-100" },
                { label: "Thu Chi", icon: Wallet, href: "/thu-chi", color: "text-sky-700 bg-sky-50 dark:bg-sky-950/60 border-sky-200 hover:bg-sky-100" },
                { label: "Kho Vải", icon: Package, href: "/kho-vai-tinhmann", color: "text-amber-700 bg-amber-50 dark:bg-amber-950/60 border-amber-200 hover:bg-amber-100" },
                { label: "Phụ Liệu", icon: Boxes, href: "/kho-phu-lieu", color: "text-orange-700 bg-orange-50 dark:bg-orange-950/60 border-orange-200 hover:bg-orange-100" },
                { label: "Bảng Lương", icon: Users, href: "/bang-luong", color: "text-violet-700 bg-violet-50 dark:bg-violet-950/60 border-violet-200 hover:bg-violet-100" },
                { label: "Giao Hàng", icon: Truck, href: "/giao-hang", color: "text-rose-700 bg-rose-50 dark:bg-rose-950/60 border-rose-200 hover:bg-rose-100" },
              ].map((btn, i) => {
                const Icon = btn.icon;
                return (
                  <Link
                    key={i}
                    href={btn.href}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all hover:scale-105 active:scale-95 hover:shadow-xs text-center ${btn.color}`}
                  >
                    <Icon className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-bold line-clamp-1">{btn.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Widget 3: Nhật Ký Dòng Tiền Mới Nhất */}
          <div className="card p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-teal-600" />
                Dòng Tiền Thu Chi Mới Nhất
              </h3>
              <Link href="/thu-chi" className="text-[11px] font-bold text-teal-600 hover:underline">
                Sổ quỹ →
              </Link>
            </div>

            <div className="space-y-2.5">
              {thuChiList.slice(0, 4).map((tc) => (
                <div
                  key={tc.id}
                  className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-slate-800 dark:text-slate-200 truncate">{tc.noiDung}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {tc.ngay} · {tc.nguoiThucHien}
                    </div>
                  </div>
                  <div className={`font-mono font-black text-right shrink-0 tabular-nums ${tc.loai === "thu" ? "text-emerald-600" : "text-rose-600"}`}>
                    {tc.loai === "thu" ? "+" : "-"}{formatVND(tc.soTien)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Role specific view fallback for non-admin accounts */}
      {role === "planner" && <PlannerStats data={realStats} />}
      {role === "warehouse" && <WarehouseStats data={realStats} />}
      {role === "sewing" && <SewingStats data={realStats} />}
      {role === "qc" && <QCStats data={realStats} />}
      {role === "finishing" && <FinishingStats data={realStats} />}
      {role === "accountant" && <AccountantStats data={realStats} />}
      {(role === "content" || role === "partner") && <PartnerDashboard />}
    </div>
  );
}

// Stats cho từng role cụ thể khi có phân quyền sâu
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
      <KPI label="Công nợ công đoạn" value={formatVNDShort(data.congNoGC)} trend={`${data.soPC} phiếu giao việc`} icon={Wallet} color="amber" />
      <KPI label="Quỹ lương tháng" value={formatVNDShort(data.tongLuong || 48_500_000)} trend={`${data.soNhanSu} nhân sự đã chốt`} icon={Users} color="emerald" />
      <KPI label="Khách hàng theo dõi" value={`${data.soKH} KH`} trend="Đang giao dịch" icon={Wallet} color="sky" />
      <KPI label="Sản lượng Lệnh Cắt" value={`${(data.tongSLThucTe || 0).toLocaleString()} SP`} trend={`/${data.tongSLPlan.toLocaleString()} SP`} up icon={DollarSign} color="emerald" />
    </div>
  );
}

function KPI({ label, value, trend, up, down, icon: Icon, color }: {
  label: string; value: string; trend: string; up?: boolean; down?: boolean; icon: any; color?: string;
}) {
  const colorMap: Record<string, string> = {
    emerald: "from-emerald-500/20 to-emerald-500/5 text-emerald-800 dark:text-emerald-300 border-emerald-300",
    red: "from-red-500/20 to-red-500/5 text-red-800 dark:text-red-300 border-red-300",
    amber: "from-amber-500/20 to-amber-500/5 text-amber-800 dark:text-amber-300 border-amber-300",
    orange: "from-orange-500/20 to-orange-500/5 text-orange-800 dark:text-orange-300 border-orange-300",
    sky: "from-sky-500/20 to-sky-500/5 text-sky-800 dark:text-sky-300 border-sky-300",
    violet: "from-violet-500/20 to-violet-500/5 text-violet-800 dark:text-violet-300 border-violet-300",
  };
  return (
    <div className={`card p-4 bg-gradient-to-br ${colorMap[color || "sky"]} border rounded-2xl`}>
      <div className="text-xs font-bold opacity-80 flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <div className="text-2xl md:text-3xl font-black font-mono mt-1 text-current tabular-nums">{value}</div>
      <div className="text-xs mt-1 flex items-center gap-1 opacity-90 font-medium">
        {up ? <TrendingUp className="w-3 h-3" /> : down ? <TrendingDown className="w-3 h-3" /> : null}
        {trend}
      </div>
    </div>
  );
}

// ================ PARTNER / CONTENT (Dashboard riêng) ================
function PartnerDashboard() {
  const { user } = useSession();
  const isPartner = user?.role === "partner";
  return (
    <div className="space-y-4">
      <div className={`card p-5 bg-gradient-to-br ${isPartner ? "from-purple-500/10 via-fuchsia-500/10 to-pink-500/10 border-purple-500/20" : "from-pink-500/10 via-rose-500/10 to-orange-500/10 border-pink-500/20"} rounded-3xl`}>
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

      <div className="card p-4 bg-amber-500/10 border border-amber-500/30 text-sm rounded-2xl">
        <b>💡 Lưu ý:</b> Tài khoản {isPartner ? "đối tác" : "content"} chỉ thấy các module phù hợp với vai trò.
      </div>
    </div>
  );
}

function PartnerTile({ href, icon, title, desc, color }: { href: string; icon: string; title: string; desc: string; color?: string }) {
  const colorMap: Record<string, string> = {
    purple: "from-purple-500/15 to-fuchsia-500/15 hover:from-purple-500/25",
    blue: "from-blue-500/15 to-cyan-500/15 hover:from-blue-500/25",
    emerald: "from-emerald-500/15 to-green-500/15 hover:from-emerald-500/25",
    amber: "from-amber-500/15 to-yellow-500/15 hover:from-amber-500/25",
    rose: "from-rose-500/15 to-pink-500/15 hover:from-rose-500/25",
    pink: "from-pink-500/15 to-rose-500/15 hover:from-pink-500/25",
  };
  return (
    <Link href={href} className={`card p-4 bg-gradient-to-br ${colorMap[color || "blue"]} hover:shadow-lg transition-all hover:scale-[1.02] rounded-2xl border`}>
      <div className="text-3xl mb-2">{icon}</div>
      <div className="font-bold text-sm">{title}</div>
      <div className="text-[10px] opacity-70 mt-0.5">{desc}</div>
    </Link>
  );
}
