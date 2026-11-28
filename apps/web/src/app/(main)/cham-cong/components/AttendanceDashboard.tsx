"use client";

import { useMemo, useState } from "react";
import {
  Users,
  CheckCircle2,
  Clock3,
  CalendarDays,
  TrendingUp,
  AlertTriangle,
  Zap,
  ChevronLeft,
  ChevronRight,
  Calendar,
  History,
  Clock,
  Eye,
  Check,
  X,
  FileSpreadsheet,
  BarChart3,
  UserCheck,
  Building2,
  Filter,
  Award,
  Sparkles,
} from "lucide-react";
import {
  CHUAN_NGAY_CONG_THANG,
  GIO_VAO_CA_CHUAN,
  GIO_KET_THUC_CA_CHUAN,
  type ChamCongRecord,
  type TrangThaiChamCong,
  toIsoDate,
} from "@/lib/cham-cong";

export interface AttendanceDashboardProps {
  monthKey: string;
  setMonthKey: (month: string) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  employees: Array<{
    maNV: string;
    hoTen: string;
    boPhan: string;
    trangThai?: string;
  }>;
  monthRecords: ChamCongRecord[];
  allRecords: ChamCongRecord[];
  availableMonths: string[];
  activeTab?: "hang-ngay" | "tong-hop";
  isAdmin?: boolean;
  currentEmployee?: {
    maNV: string;
    hoTen: string;
    boPhan: string;
    email?: string;
  };
  selectedEmployeeMaNV?: string;
  setSelectedEmployeeMaNV?: (maNV: string) => void;
}

export function AttendanceDashboard({
  monthKey,
  setMonthKey,
  selectedDate,
  setSelectedDate,
  employees,
  monthRecords,
  allRecords,
  availableMonths,
  isAdmin = false,
  currentEmployee,
  selectedEmployeeMaNV,
  setSelectedEmployeeMaNV,
}: AttendanceDashboardProps) {
  // Chế độ xem thời gian: "month" (thống kê tháng) | "day" (thống kê theo ngày)
  const [scope, setScope] = useState<"month" | "day">("month");
  const [showDayDetail, setShowDayDetail] = useState(false);

  // Phân quyền phạm vi dữ liệu:
  // - Nếu KHÔNG PHẢI ADMIN: Bắt buộc chỉ xem cá nhân của chính mình ("personal")
  // - Nếu LÀ ADMIN: Có thể xem "all" (toàn công ty) hoặc chọn xem riêng 1 nhân sự ("personal")
  const [adminScopeChoice, setAdminScopeChoice] = useState<string>("all");

  const effectiveScope = isAdmin ? (selectedEmployeeMaNV || adminScopeChoice) : (currentEmployee?.maNV || "personal");
  const isPersonalView = !isAdmin || (effectiveScope !== "all");

  const activeEmpMaNV = isPersonalView
    ? (isAdmin ? (selectedEmployeeMaNV || (adminScopeChoice !== "all" ? adminScopeChoice : currentEmployee?.maNV)) : currentEmployee?.maNV)
    : "";

  const activeTargetEmployee = useMemo(() => {
    if (!isPersonalView) return null;
    return (
      employees.find((e) => e.maNV.trim().toUpperCase() === (activeEmpMaNV || "").trim().toUpperCase()) ||
      currentEmployee ||
      null
    );
  }, [isPersonalView, employees, activeEmpMaNV, currentEmployee]);

  // Phân tích tháng/năm hiện tại của monthKey (YYYY-MM)
  const [yearNum, monthNum] = useMemo(() => {
    const parts = monthKey.split("-").map(Number);
    const now = new Date();
    return [parts[0] || now.getFullYear(), parts[1] || now.getMonth() + 1];
  }, [monthKey]);

  // Phân tích ngày/tháng/năm của selectedDate (YYYY-MM-DD)
  const [selYear, selMonth, selDay] = useMemo(() => {
    const parts = selectedDate.split("-").map(Number);
    const now = new Date();
    return [parts[0] || now.getFullYear(), parts[1] || now.getMonth() + 1, parts[2] || now.getDate()];
  }, [selectedDate]);

  // Số ngày tối đa trong tháng đang chọn
  const daysInCurrentMonth = useMemo(() => {
    return new Date(yearNum, monthNum, 0).getDate();
  }, [yearNum, monthNum]);

  // Đổi tháng bằng nút Trước/Sau
  const handleShiftMonth = (delta: number) => {
    const d = new Date(yearNum, monthNum - 1 + delta, 1);
    const nextY = d.getFullYear();
    const nextM = String(d.getMonth() + 1).padStart(2, "0");
    const nextKey = `${nextY}-${nextM}`;
    setMonthKey(nextKey);

    if (scope === "day") {
      const maxD = new Date(nextY, d.getMonth() + 1, 0).getDate();
      const nextDay = Math.min(selDay, maxD);
      setSelectedDate(`${nextKey}-${String(nextDay).padStart(2, "0")}`);
    }
  };

  // Đổi ngày bằng nút Trước/Sau
  const handleShiftDay = (delta: number) => {
    const d = new Date(selYear, selMonth - 1, selDay + delta);
    const nextY = d.getFullYear();
    const nextM = String(d.getMonth() + 1).padStart(2, "0");
    const nextD = String(d.getDate()).padStart(2, "0");
    const nextIso = `${nextY}-${nextM}-${nextD}`;
    setSelectedDate(nextIso);
    if (`${nextY}-${nextM}` !== monthKey) {
      setMonthKey(`${nextY}-${nextM}`);
    }
  };

  // Về hôm nay
  const handleGoToday = () => {
    const now = new Date();
    const todayIso = toIsoDate(now);
    setSelectedDate(todayIso);
    setMonthKey(todayIso.slice(0, 7));
  };

  // Đổi năm trực tiếp
  const handleChangeYear = (newYear: number) => {
    const nextKey = `${newYear}-${String(monthNum).padStart(2, "0")}`;
    setMonthKey(nextKey);
    if (scope === "day") {
      const maxD = new Date(newYear, monthNum, 0).getDate();
      const nextDay = Math.min(selDay, maxD);
      setSelectedDate(`${nextKey}-${String(nextDay).padStart(2, "0")}`);
    }
  };

  // Đổi tháng trực tiếp
  const handleChangeMonth = (newMonth: number) => {
    const nextKey = `${yearNum}-${String(newMonth).padStart(2, "0")}`;
    setMonthKey(nextKey);
    if (scope === "day") {
      const maxD = new Date(yearNum, newMonth, 0).getDate();
      const nextDay = Math.min(selDay, maxD);
      setSelectedDate(`${nextKey}-${String(nextDay).padStart(2, "0")}`);
    }
  };

  // Đổi ngày trực tiếp
  const handleChangeDay = (newDay: number) => {
    const nextIso = `${monthKey}-${String(newDay).padStart(2, "0")}`;
    setSelectedDate(nextIso);
  };

  // Lọc tập nhân sự
  const activeEmployees = useMemo(() => employees.filter((e) => e.trangThai !== "nghi_viec"), [employees]);
  const resignedEmployees = useMemo(() => employees.filter((e) => e.trangThai === "nghi_viec"), [employees]);
  const empIdSet = useMemo(() => new Set(employees.map((e) => e.maNV.trim().toUpperCase())), [employees]);

  // Bộ lọc records theo phạm vi hiển thị (Toàn cty vs Cá nhân)
  const scopedMonthRecords = useMemo(() => {
    if (!isPersonalView) {
      return monthRecords.filter((r) => empIdSet.has(r.maNV.trim().toUpperCase()));
    }
    const target = (activeEmpMaNV || "").trim().toUpperCase();
    return monthRecords.filter((r) => r.maNV.trim().toUpperCase() === target);
  }, [monthRecords, isPersonalView, empIdSet, activeEmpMaNV]);

  // ==========================================
  // 1. TÍNH TOÁN THỐNG KÊ THÁNG (scope === "month")
  // ==========================================
  const monthStats = useMemo(() => {
    let ngayCong = 0;
    let diLamDungGio = 0;
    let diTre = 0;
    let nuaCong = 0;
    let nghiPhep = 0;
    let nghiKhongPhep = 0;
    let gioTangCa = 0;

    for (const r of scopedMonthRecords) {
      if (r.trangThai === "di-lam") {
        ngayCong += 1;
        diLamDungGio += 1;
      } else if (r.trangThai === "di-tre") {
        ngayCong += 1;
        diTre += 1;
      } else if (r.trangThai === "nua-cong") {
        ngayCong += 0.5;
        nuaCong += 1;
      } else if (r.trangThai === "nghi-phep") {
        nghiPhep += 1;
      } else if (r.trangThai === "nghi-khong-phep") {
        nghiKhongPhep += 1;
      }
      gioTangCa += r.soGioTangCa || 0;
    }

    const tongLuot = diLamDungGio + diTre + nuaCong + nghiPhep + nghiKhongPhep;
    const tongDiLam = diLamDungGio + diTre;
    const tyLeDungGio = tongDiLam > 0 ? Math.round((diLamDungGio / tongDiLam) * 100) : 100;

    // Chuẩn công tính toán:
    // Nếu cá nhân: 28 công chuẩn
    // Nếu toàn cty: (activeEmployees.length * 28)
    const chuanCongTong = isPersonalView ? CHUAN_NGAY_CONG_THANG : (activeEmployees.length || 1) * CHUAN_NGAY_CONG_THANG;
    const tyLeChuyenCan = Math.round((ngayCong / (chuanCongTong || 1)) * 100);
    const congTrungBinh = !isPersonalView && activeEmployees.length > 0 ? (ngayCong / activeEmployees.length).toFixed(1) : String(ngayCong);

    return {
      ngayCong,
      diLamDungGio,
      diTre,
      nuaCong,
      nghiPhep,
      nghiKhongPhep,
      gioTangCa,
      tongLuot,
      tongDiLam,
      tyLeDungGio,
      tyLeChuyenCan,
      congTrungBinh,
      chuanCongTong,
    };
  }, [scopedMonthRecords, isPersonalView, activeEmployees.length]);

  // ==========================================
  // 2. BIỂU ĐỒ CỘT: XU HƯỚNG NGÀY CÔNG THEO 5 TUẦN TRONG THÁNG
  // ==========================================
  const weeklyStats = useMemo(() => {
    // 5 tuần chuẩn: Tuần 1 (1-7), Tuần 2 (8-14), Tuần 3 (15-21), Tuần 4 (22-28), Tuần 5 (29-end)
    const weekDefs = [
      { label: "Tuần 1", start: 1, end: 7, daysCount: 7 },
      { label: "Tuần 2", start: 8, end: 14, daysCount: 7 },
      { label: "Tuần 3", start: 15, end: 21, daysCount: 7 },
      { label: "Tuần 4", start: 22, end: 28, daysCount: 7 },
      { label: "Tuần 5", start: 29, end: daysInCurrentMonth, daysCount: Math.max(0, daysInCurrentMonth - 28) },
    ];

    const targetPerPersonPerWeek = 6.0; // 6 ngày công/tuần chuẩn
    const baseTarget = isPersonalView ? targetPerPersonPerWeek : activeEmployees.length * targetPerPersonPerWeek;

    const weeks = weekDefs.map((w, idx) => {
      let weekCong = 0;
      let weekDungGio = 0;
      let weekDiTre = 0;
      let weekNuaCong = 0;
      let weekNghi = 0;

      for (const r of scopedMonthRecords) {
        if (!r.ngay) continue;
        const dNum = Number(r.ngay.slice(8, 10));
        if (dNum >= w.start && dNum <= w.end) {
          if (r.trangThai === "di-lam") {
            weekCong += 1;
            weekDungGio += 1;
          } else if (r.trangThai === "di-tre") {
            weekCong += 1;
            weekDiTre += 1;
          } else if (r.trangThai === "nua-cong") {
            weekCong += 0.5;
            weekNuaCong += 1;
          } else if (r.trangThai === "nghi-phep" || r.trangThai === "nghi-khong-phep") {
            weekNghi += 1;
          }
        }
      }

      const target = idx === 4 ? Math.round(baseTarget * (w.daysCount / 7)) : baseTarget;
      const rate = target > 0 ? Math.round((weekCong / target) * 100) : 0;

      return {
        label: w.label,
        dateRange: `${w.start}/${monthNum} - ${w.end}/${monthNum}`,
        ngayCong: weekCong,
        target,
        rate,
        weekDungGio,
        weekDiTre,
        weekNuaCong,
        weekNghi,
      };
    });

    const maxCong = Math.max(...weeks.map((w) => w.ngayCong), baseTarget, 1);

    return weeks.map((w) => ({
      ...w,
      heightPercent: Math.max(12, Math.min(100, Math.round((w.ngayCong / maxCong) * 100))),
    }));
  }, [daysInCurrentMonth, monthNum, scopedMonthRecords, isPersonalView, activeEmployees.length]);

  // ==========================================
  // 3. LỊCH CHẤM CÔNG CÁ NHÂN DẠNG Ô VUÔNG TRỰC QUAN (Personal Calendar Grid)
  // ==========================================
  const personalCalendarDays = useMemo(() => {
    if (!isPersonalView) return [];

    const recordMap = new Map<number, ChamCongRecord>();
    for (const r of scopedMonthRecords) {
      if (r.ngay) {
        const dNum = Number(r.ngay.slice(8, 10));
        recordMap.set(dNum, r);
      }
    }

    const days = [];
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateObj = new Date(yearNum, monthNum - 1, d);
      const isSunday = dateObj.getDay() === 0;
      const isToday = toIsoDate(dateObj) === toIsoDate(new Date());
      const rec = recordMap.get(d);

      let statusBadge = "—";
      let statusColor = "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400";
      let statusLabel = "Chưa chấm";

      if (rec?.trangThai === "di-lam") {
        statusBadge = "X";
        statusColor = "bg-emerald-500 text-white font-black shadow-xs";
        statusLabel = "Đúng giờ";
      } else if (rec?.trangThai === "di-tre") {
        statusBadge = "L";
        statusColor = "bg-orange-500 text-white font-black shadow-xs";
        statusLabel = "Đi trễ";
      } else if (rec?.trangThai === "nua-cong") {
        statusBadge = "0.5";
        statusColor = "bg-amber-400 text-slate-900 font-black shadow-xs";
        statusLabel = "Nửa công";
      } else if (rec?.trangThai === "nghi-phep") {
        statusBadge = "P";
        statusColor = "bg-sky-500 text-white font-black shadow-xs";
        statusLabel = "Nghỉ phép";
      } else if (rec?.trangThai === "nghi-khong-phep") {
        statusBadge = "KP";
        statusColor = "bg-rose-500 text-white font-black shadow-xs";
        statusLabel = "Không phép";
      } else if (isSunday) {
        statusBadge = "CN";
        statusColor = "bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/30 dark:text-red-400";
        statusLabel = "Chủ nhật";
      }

      days.push({
        dayNumber: d,
        dateIso: `${monthKey}-${String(d).padStart(2, "0")}`,
        isSunday,
        isToday,
        rec,
        statusBadge,
        statusColor,
        statusLabel,
        timeIn: rec?.gioVao?.slice(0, 5) || "",
        timeOut: rec?.gioRa?.slice(0, 5) || "",
      });
    }

    return days;
  }, [isPersonalView, scopedMonthRecords, daysInCurrentMonth, yearNum, monthNum, monthKey]);

  // ==========================================
  // 4. PHÂN BỔ BỘ PHẬN (Department Breakdown - Dành cho Admin xem toàn cty)
  // ==========================================
  const departmentBreakdown = useMemo(() => {
    if (isPersonalView) return [];

    const map = new Map<string, { totalStaff: number; totalCong: number; onTime: number; late: number }>();

    for (const emp of activeEmployees) {
      const dept = emp.boPhan || "Chưa phân ban";
      if (!map.has(dept)) {
        map.set(dept, { totalStaff: 0, totalCong: 0, onTime: 0, late: 0 });
      }
      const item = map.get(dept)!;
      item.totalStaff += 1;
    }

    for (const r of scopedMonthRecords) {
      const emp = activeEmployees.find((e) => e.maNV.trim().toUpperCase() === r.maNV.trim().toUpperCase());
      const dept = emp?.boPhan || "Chưa phân ban";
      if (map.has(dept)) {
        const item = map.get(dept)!;
        if (r.trangThai === "di-lam") {
          item.totalCong += 1;
          item.onTime += 1;
        } else if (r.trangThai === "di-tre") {
          item.totalCong += 1;
          item.late += 1;
        } else if (r.trangThai === "nua-cong") {
          item.totalCong += 0.5;
        }
      }
    }

    return Array.from(map.entries()).map(([dept, data]) => {
      const chuanDept = data.totalStaff * CHUAN_NGAY_CONG_THANG;
      const rate = chuanDept > 0 ? Math.round((data.totalCong / chuanDept) * 100) : 0;
      const avg = data.totalStaff > 0 ? (data.totalCong / data.totalStaff).toFixed(1) : "0";
      return {
        department: dept,
        ...data,
        rate,
        avg,
      };
    });
  }, [isPersonalView, activeEmployees, scopedMonthRecords]);

  // ==========================================
  // 5. TÍNH TOÁN THỐNG KÊ NGÀY (scope === "day")
  // ==========================================
  const dayStats = useMemo(() => {
    const dayRecords = allRecords.filter(
      (r) => r.ngay === selectedDate && (!isPersonalView || r.maNV.trim().toUpperCase() === (activeEmpMaNV || "").trim().toUpperCase())
    );
    const recordMap = new Map(dayRecords.map((r) => [r.maNV.trim().toUpperCase(), r]));

    const targetList = isPersonalView && activeTargetEmployee ? [activeTargetEmployee] : activeEmployees;

    const listDungGio: Array<{ emp: (typeof employees)[0]; record: ChamCongRecord }> = [];
    const listDiTre: Array<{ emp: (typeof employees)[0]; record: ChamCongRecord }> = [];
    const listNuaCong: Array<{ emp: (typeof employees)[0]; record: ChamCongRecord }> = [];
    const listNghiPhep: Array<{ emp: (typeof employees)[0]; record: ChamCongRecord }> = [];
    const listKhongPhep: Array<{ emp: (typeof employees)[0]; record: ChamCongRecord }> = [];
    const listChuaCham: Array<(typeof employees)[0]> = [];

    for (const emp of targetList) {
      const rec = recordMap.get(emp.maNV.trim().toUpperCase());
      if (!rec) {
        listChuaCham.push(emp);
      } else if (rec.trangThai === "di-lam") {
        listDungGio.push({ emp, record: rec });
      } else if (rec.trangThai === "di-tre") {
        listDiTre.push({ emp, record: rec });
      } else if (rec.trangThai === "nua-cong") {
        listNuaCong.push({ emp, record: rec });
      } else if (rec.trangThai === "nghi-phep") {
        listNghiPhep.push({ emp, record: rec });
      } else if (rec.trangThai === "nghi-khong-phep") {
        listKhongPhep.push({ emp, record: rec });
      }
    }

    const coMatCount = listDungGio.length + listDiTre.length + listNuaCong.length;
    const tyLeCoMat = targetList.length > 0 ? Math.round((coMatCount / targetList.length) * 100) : 0;

    return {
      dayRecords,
      listDungGio,
      listDiTre,
      listNuaCong,
      listNghiPhep,
      listKhongPhep,
      listChuaCham,
      coMatCount,
      tyLeCoMat,
      targetCount: targetList.length,
    };
  }, [allRecords, selectedDate, isPersonalView, activeEmpMaNV, activeTargetEmployee, activeEmployees, employees]);

  const monthDisplayLabel = useMemo(() => {
    return `Tháng ${monthNum} Năm ${yearNum}`;
  }, [monthNum, yearNum]);

  const dateDisplayLabel = useMemo(() => {
    try {
      const d = new Date(selYear, selMonth - 1, selDay);
      const weekday = new Intl.DateTimeFormat("vi-VN", { weekday: "long" }).format(d);
      return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${String(selDay).padStart(2, "0")}/${String(selMonth).padStart(2, "0")}/${selYear}`;
    } catch {
      return selectedDate;
    }
  }, [selYear, selMonth, selDay, selectedDate]);

  return (
    <div className="space-y-4">
      {/* ============================================================== */}
      {/* THANH ĐIỀU KHIỂN: PHÂN QUYỀN DASHBOARD (ADMIN VS NHÂN SỰ) & THỜI GIAN */}
      {/* ============================================================== */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          
          {/* Cụm 1: Nút Scope Tháng vs Ngày + Badge Định Danh Phạm Vi Quyền */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setScope("month")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition md:text-sm ${
                  scope === "month"
                    ? "bg-teal-600 text-white shadow"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                <CalendarDays className="h-4 w-4" /> Thống kê Tháng
              </button>
              <button
                type="button"
                onClick={() => setScope("day")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition md:text-sm ${
                  scope === "day"
                    ? "bg-teal-600 text-white shadow"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                <Calendar className="h-4 w-4" /> Theo Ngày Cụ Thể
              </button>
            </div>

            {/* Hiển thị Nhãn Định Danh Phạm Vi Dashboard */}
            <div className="flex items-center gap-1.5">
              {isAdmin ? (
                <div className="flex items-center gap-1.5 bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/80 px-2.5 py-1 rounded-lg text-xs font-bold">
                  <Building2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  <span>{isPersonalView ? `Xem riêng: ${activeTargetEmployee?.hoTen} (${activeTargetEmployee?.maNV})` : `Toàn công ty (${employees.length} nhân sự)`}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/80 px-2.5 py-1 rounded-lg text-xs font-bold">
                  <UserCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Cá nhân tôi: {currentEmployee?.hoTen || "Nhân sự"} ({currentEmployee?.maNV || "NV"})</span>
                </div>
              )}
            </div>
          </div>

          {/* Cụm 2: Bộ chọn Năm, Tháng, Ngày & Nút Điều hướng Lịch Sử */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Nếu là Admin: Cho phép chọn nhanh xem Toàn Công Ty hoặc xem riêng 1 Nhân Sự */}
            {isAdmin && (
              <div className="flex items-center gap-1.5 mr-1">
                <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Phạm vi:</span>
                <select
                  value={adminScopeChoice}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAdminScopeChoice(val);
                    if (setSelectedEmployeeMaNV) {
                      setSelectedEmployeeMaNV(val === "all" ? "" : val);
                    }
                  }}
                  className="h-9 rounded-lg border border-blue-200 bg-blue-50/60 px-2.5 text-xs font-bold text-blue-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200"
                >
                  <option value="all">🏢 Toàn công ty (Tất cả)</option>
                  {currentEmployee && (
                    <option value={currentEmployee.maNV}>👤 Cá nhân tôi ({currentEmployee.hoTen})</option>
                  )}
                  <optgroup label="Từng nhân sự cụ thể">
                    {activeEmployees.map((emp) => (
                      <option key={emp.maNV} value={emp.maNV}>
                        {emp.maNV} - {emp.hoTen} ({emp.boPhan})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            )}

            {/* Nút lùi */}
            <button
              type="button"
              onClick={() => (scope === "month" ? handleShiftMonth(-1) : handleShiftDay(-1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              title={scope === "month" ? "Tháng trước" : "Ngày trước"}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Chọn Ngày (khi scope === 'day') */}
            {scope === "day" && (
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-slate-500">Ngày</span>
                <select
                  value={selDay}
                  onChange={(e) => handleChangeDay(Number(e.target.value))}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold text-slate-800 shadow-sm focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  {Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      {String(d).padStart(2, "0")}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Chọn Tháng */}
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-slate-500">Tháng</span>
              <select
                value={monthNum}
                onChange={(e) => handleChangeMonth(Number(e.target.value))}
                className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-800 shadow-sm focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    Tháng {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Chọn Năm */}
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-slate-500">Năm</span>
              <select
                value={yearNum}
                onChange={(e) => handleChangeYear(Number(e.target.value))}
                className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-800 shadow-sm focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {[2024, 2025, 2026, 2027, 2028].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Nút tiến */}
            <button
              type="button"
              onClick={() => (scope === "month" ? handleShiftMonth(1) : handleShiftDay(1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              title={scope === "month" ? "Tháng sau" : "Ngày sau"}
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Nút về Hôm nay */}
            <button
              type="button"
              onClick={handleGoToday}
              className="h-9 rounded-lg border border-teal-200 bg-teal-50 px-3 text-xs font-bold text-teal-700 transition hover:bg-teal-100 active:scale-95 dark:border-teal-800/60 dark:bg-teal-950/30 dark:text-teal-300"
            >
              Hôm nay
            </button>
          </div>
        </div>

        {/* Lịch sử tháng nhanh (Quick Chips) */}
        {availableMonths.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-2.5 dark:border-slate-800/80">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              <History className="h-3 w-3" /> Lịch sử nhanh:
            </span>
            {availableMonths.map((m) => {
              const isCurrent = m === monthKey;
              const [y, mo] = m.split("-");
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMonthKey(m);
                    if (scope === "day") {
                      setSelectedDate(`${m}-01`);
                    }
                  }}
                  className={`rounded-md px-2 py-0.5 text-[11px] font-semibold transition ${
                    isCurrent
                      ? "bg-teal-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                  }`}
                >
                  T{mo}/{y}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 1. VIEW THỐNG KÊ THÁNG (scope === "month")                      */}
      {/* ============================================================== */}
      {scope === "month" && (
        <div className="space-y-4">
          {/* Lưới 4 Thẻ KPI Phân Quyền (Tự động thích ứng Toàn cty vs Cá nhân) */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            
            {/* Card 1: Nhân viên / Đối tượng xem */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900 md:p-5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  {isPersonalView ? <UserCheck className="h-4 w-4 text-teal-600" /> : <Users className="h-4 w-4 text-blue-600" />}
                  {isPersonalView ? "Nhân sự" : "Nhân viên"}
                </span>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                  {monthDisplayLabel}
                </span>
              </div>
              <div className="mt-2 text-xl sm:text-2xl font-black text-slate-900 dark:text-white truncate">
                {isPersonalView ? (activeTargetEmployee?.hoTen || currentEmployee?.hoTen || "Nhân sự") : `${employees.length} Nhân sự`}
              </div>
              <div className="mt-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                {isPersonalView 
                  ? `${activeTargetEmployee?.maNV || currentEmployee?.maNV} · ${activeTargetEmployee?.boPhan || currentEmployee?.boPhan || "Sản xuất"}`
                  : `${activeEmployees.length} đang làm · ${resignedEmployees.length} đã nghỉ`}
              </div>
            </div>

            {/* Card 2: Ngày công thực tế (Chuẩn 28 ngày công) */}
            <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-emerald-950/40 dark:bg-slate-900 md:p-5">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  {isPersonalView ? "Ngày công của tôi" : "Tổng ngày công"}
                </span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  Chuẩn 28 công
                </span>
              </div>
              <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400 md:text-3xl">
                {monthStats.ngayCong.toLocaleString("vi-VN")}
                <span className="text-xs font-normal text-slate-400 ml-1">/ 28 công</span>
              </div>
              <div className="mt-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {isPersonalView 
                  ? `Đạt ${monthStats.tyLeChuyenCan}% mục tiêu tháng · ${Math.max(0, 28 - monthStats.ngayCong)} công còn lại`
                  : `TB: ${monthStats.congTrungBinh} công/người · Đạt ${monthStats.tyLeChuyenCan}% chuẩn`}
              </div>
            </div>

            {/* Card 3: Đúng giờ & Đi trễ */}
            <div className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-orange-950/40 dark:bg-slate-900 md:p-5">
              <div className="flex items-center justify-between text-xs font-semibold text-orange-700 dark:text-orange-400">
                <span className="flex items-center gap-1.5">
                  <Clock3 className="h-4 w-4 text-orange-600" /> Đi làm đúng giờ
                </span>
                <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
                  Ca 07:30
                </span>
              </div>
              <div className="mt-2 text-2xl font-black text-orange-600 dark:text-orange-400 md:text-3xl">
                {monthStats.diLamDungGio.toLocaleString("vi-VN")}
                <span className="text-xs font-normal text-slate-400 ml-1">lượt</span>
              </div>
              <div className="mt-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {monthStats.diTre > 0 ? `${monthStats.diTre} lượt đi trễ · Tỷ lệ ${monthStats.tyLeDungGio}%` : `100% đúng giờ (0 lượt đi trễ)`}
              </div>
            </div>

            {/* Card 4: Nghỉ phép & Nửa công */}
            <div
              className={`rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md dark:bg-slate-900 md:p-5 ${
                monthStats.nghiKhongPhep > 0
                  ? "border-rose-300 bg-rose-50/20 dark:border-rose-900/50"
                  : "border-slate-200/80 dark:border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle
                    className={`h-4 w-4 ${monthStats.nghiKhongPhep > 0 ? "text-rose-600" : "text-slate-400"}`}
                  />
                  Nghỉ phép / Nửa công
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    monthStats.nghiKhongPhep > 0
                      ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  {monthStats.nghiKhongPhep > 0 ? "Có KP" : "Tốt"}
                </span>
              </div>
              <div
                className={`mt-2 text-2xl font-black md:text-3xl ${
                  monthStats.nghiKhongPhep > 0 ? "text-rose-600" : "text-slate-800 dark:text-slate-200"
                }`}
              >
                {monthStats.nuaCong + monthStats.nghiPhep}
                <span className="text-xs font-normal text-slate-400 ml-1">buổi</span>
              </div>
              <div className="mt-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {monthStats.nuaCong} nửa công · {monthStats.nghiPhep} phép (P) · {monthStats.nghiKhongPhep} không phép (KP)
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* BIỂU ĐỒ 1: BIỂU ĐỒ CỘT XU HƯỚNG NGÀY CÔNG THEO 5 TUẦN     */}
          {/* ========================================================= */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4 border-b pb-3 border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-teal-600" />
                  {isPersonalView 
                    ? `Biểu đồ ngày công theo tuần của ${activeTargetEmployee?.hoTen || "Nhân sự"} (${monthDisplayLabel})`
                    : `Biểu đồ xu hướng ngày công toàn công ty qua 5 tuần (${monthDisplayLabel})`}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isPersonalView 
                    ? "Theo dõi tiến độ tích lũy ngày công cá nhân qua từng tuần so với mục tiêu chuẩn"
                    : `Tổng hợp tích lũy ngày công của toàn bộ ${activeEmployees.length} nhân sự theo từng tuần trong tháng`}
                </p>
              </div>
              <span className="w-fit text-xs font-bold px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800">
                Mục tiêu tuần: {isPersonalView ? "6 công/tuần" : `${Math.round(activeEmployees.length * 6)} công/tuần`}
              </span>
            </div>

            {/* Khung Biểu Đồ Cột 5 Tuần */}
            <div className="grid grid-cols-5 gap-2 sm:gap-6 items-end h-52 sm:h-56 pt-6 pb-2 px-1 sm:px-4 border-b border-slate-100 dark:border-slate-800">
              {weeklyStats.map((week, idx) => (
                <div key={idx} className="flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip nổi khi hover */}
                  <div className="absolute -top-12 z-30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-slate-900 text-white text-[10px] rounded-lg p-2 shadow-lg whitespace-nowrap">
                    <div className="font-bold">{week.label} ({week.dateRange})</div>
                    <div>Thực tế: <strong>{week.ngayCong}</strong> công (Đạt {week.rate}%)</div>
                    <div>Đúng giờ: {week.weekDungGio} · Trễ: {week.weekDiTre} · Nửa công: {week.weekNuaCong}</div>
                  </div>

                  {/* Số liệu ngày công trên đỉnh cột */}
                  <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 mb-1.5 transition-transform group-hover:scale-110">
                    {week.ngayCong.toLocaleString("vi-VN")}
                  </span>

                  {/* Thanh Cột (Bar) với gradient Teal sang Emerald */}
                  <div className="w-full max-w-[52px] bg-slate-100 dark:bg-slate-800 rounded-t-xl overflow-hidden flex flex-col justify-end transition-all duration-300 group-hover:bg-slate-200 dark:group-hover:bg-slate-700" style={{ height: "100%" }}>
                    <div
                      className="w-full rounded-t-xl bg-gradient-to-t from-teal-600 via-teal-500 to-emerald-400 transition-all duration-500 shadow-sm group-hover:brightness-110"
                      style={{ height: `${week.heightPercent}%` }}
                    />
                  </div>

                  {/* Nhãn Tuần */}
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2">
                    {week.label}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    {week.dateRange}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded mt-1 ${week.rate >= 90 ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300" : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"}`}>
                    {week.rate}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ========================================================= */}
          {/* BIỂU ĐỒ 2: NẾU XEM CÁ NHÂN -> LỊCH CHẤM CÔNG CÁ NHÂN (GRID)*/}
          {/* NẾU XEM TOÀN CTY -> BIỂU ĐỒ BỘ PHẬN & TIẾN ĐỘ CHUYÊN CẦN */}
          {/* ========================================================= */}
          {isPersonalView ? (
            /* LỊCH CHẤM CÔNG CÁ NHÂN TRONG THÁNG (Hiển thị 28-31 ngày) */
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-teal-600" />
                    Lịch chi tiết chấm công cá nhân: {activeTargetEmployee?.hoTen} ({activeTargetEmployee?.maNV})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Bảng đối soát trực quan từng ngày trong {monthDisplayLabel}
                  </p>
                </div>
                {/* Chú giải trạng thái */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500 text-white">X: Đi làm</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-orange-500 text-white">L: Đi trễ</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-400 text-slate-900">0.5: Nửa công</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-500 text-white">P: Nghỉ phép</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500 text-white">KP: Không phép</span>
                </div>
              </div>

              {/* Lưới lịch 7 cột (Thứ 2 đến Chủ nhật) */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"].map((d, i) => (
                  <div key={i} className="text-center font-bold text-[11px] text-slate-400 py-1 uppercase">
                    {d}
                  </div>
                ))}
                {personalCalendarDays.map((cd, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xl border p-2 flex flex-col justify-between min-h-[58px] sm:min-h-[64px] transition ${
                      cd.isToday
                        ? "border-teal-500 bg-teal-50/40 ring-1 ring-teal-500 dark:bg-teal-950/20"
                        : "border-slate-200/80 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${cd.isSunday ? "text-rose-500" : "text-slate-700 dark:text-slate-200"}`}>
                        {cd.dayNumber}
                      </span>
                      <span className={`w-6 h-5 rounded flex items-center justify-center text-[10px] font-black ${cd.statusColor}`}>
                        {cd.statusBadge}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1 flex justify-between">
                      <span>{cd.timeIn ? cd.timeIn : ""}</span>
                      <span>{cd.timeOut ? cd.timeOut : ""}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* BẢNG THỐNG KÊ NGÀY CÔNG THEO BỘ PHẬN (DÀNH CHO ADMIN XEM TOÀN CÔNG TY) */
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-5">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-4 border-b pb-3 border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    Thống kê tỷ lệ ngày công theo bộ phận ({monthDisplayLabel})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    So sánh mức độ chuyên cần và hiệu suất giữa các tổ may, tổ cắt, QC và văn phòng
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {departmentBreakdown.map((dept, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">{dept.department}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                        {dept.totalStaff} nhân sự
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-xl font-black text-slate-900 dark:text-white">{dept.totalCong} công</span>
                      <span className="text-xs font-semibold text-slate-500">TB: {dept.avg} công/người</span>
                    </div>
                    {/* Progress bar của bộ phận */}
                    <div className="mt-2 h-2 w-full rounded-full bg-slate-200 overflow-hidden dark:bg-slate-700">
                      <div
                        className="h-full rounded-full bg-teal-600 transition-all duration-300"
                        style={{ width: `${Math.min(100, dept.rate)}%` }}
                      />
                    </div>
                    <div className="mt-1.5 flex justify-between text-[10px] text-slate-500 font-medium">
                      <span>Đạt {dept.rate}% mục tiêu</span>
                      <span>{dept.onTime} đúng giờ · {dept.late} trễ</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* PHÂN BỔ TỶ LỆ CHUYÊN CẦN THEO 5 MÀU CHUẨN                */}
          {/* ========================================================= */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-teal-600" /> Phân bổ tỷ lệ chuyên cần ({isPersonalView ? activeTargetEmployee?.hoTen : "Toàn công ty"})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tổng {monthStats.tongLuot.toLocaleString("vi-VN")} lượt ghi nhận trạng thái chấm công trong {monthDisplayLabel}
                </p>
              </div>

              {monthStats.gioTangCa > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60">
                  <Zap className="h-3.5 w-3.5 text-purple-600" /> Tăng ca: {monthStats.gioTangCa} giờ
                </span>
              )}
            </div>

            {monthStats.tongLuot > 0 ? (
              <div className="mt-3">
                <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  {monthStats.diLamDungGio > 0 && (
                    <div
                      style={{ width: `${(monthStats.diLamDungGio / monthStats.tongLuot) * 100}%` }}
                      className="bg-emerald-500 transition-all duration-300"
                      title={`Đúng giờ: ${monthStats.diLamDungGio} (${Math.round((monthStats.diLamDungGio / monthStats.tongLuot) * 100)}%)`}
                    />
                  )}
                  {monthStats.diTre > 0 && (
                    <div
                      style={{ width: `${(monthStats.diTre / monthStats.tongLuot) * 100}%` }}
                      className="bg-orange-500 transition-all duration-300"
                      title={`Đi trễ: ${monthStats.diTre} (${Math.round((monthStats.diTre / monthStats.tongLuot) * 100)}%)`}
                    />
                  )}
                  {monthStats.nuaCong > 0 && (
                    <div
                      style={{ width: `${(monthStats.nuaCong / monthStats.tongLuot) * 100}%` }}
                      className="bg-amber-400 transition-all duration-300"
                      title={`Nửa công: ${monthStats.nuaCong} (${Math.round((monthStats.nuaCong / monthStats.tongLuot) * 100)}%)`}
                    />
                  )}
                  {monthStats.nghiPhep > 0 && (
                    <div
                      style={{ width: `${(monthStats.nghiPhep / monthStats.tongLuot) * 100}%` }}
                      className="bg-sky-400 transition-all duration-300"
                      title={`Nghỉ phép: ${monthStats.nghiPhep} (${Math.round((monthStats.nghiPhep / monthStats.tongLuot) * 100)}%)`}
                    />
                  )}
                  {monthStats.nghiKhongPhep > 0 && (
                    <div
                      style={{ width: `${(monthStats.nghiKhongPhep / monthStats.tongLuot) * 100}%` }}
                      className="bg-rose-500 transition-all duration-300"
                      title={`Không phép: ${monthStats.nghiKhongPhep} (${Math.round((monthStats.nghiKhongPhep / monthStats.tongLuot) * 100)}%)`}
                    />
                  )}
                </div>

                {/* Chú giải chi tiết */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-slate-600 dark:text-slate-300">
                      Đúng giờ: <strong>{monthStats.diLamDungGio}</strong> (
                      {Math.round((monthStats.diLamDungGio / monthStats.tongLuot) * 100)}%)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-orange-500 shrink-0" />
                    <span className="text-slate-600 dark:text-slate-300">
                      Đi trễ: <strong>{monthStats.diTre}</strong> (
                      {Math.round((monthStats.diTre / monthStats.tongLuot) * 100)}%)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shrink-0" />
                    <span className="text-slate-600 dark:text-slate-300">
                      Nửa công: <strong>{monthStats.nuaCong}</strong> (
                      {Math.round((monthStats.nuaCong / monthStats.tongLuot) * 100)}%)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-sky-400 shrink-0" />
                    <span className="text-slate-600 dark:text-slate-300">
                      Nghỉ phép: <strong>{monthStats.nghiPhep}</strong> (
                      {Math.round((monthStats.nghiPhep / monthStats.tongLuot) * 100)}%)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shrink-0" />
                    <span className="text-slate-600 dark:text-slate-300">
                      Không phép: <strong>{monthStats.nghiKhongPhep}</strong> (
                      {Math.round((monthStats.nghiKhongPhep / monthStats.tongLuot) * 100)}%)
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-3 rounded-xl bg-slate-50 p-4 text-center text-xs text-slate-500 dark:bg-slate-800/40">
                Tháng {monthNum}/{yearNum} chưa có dữ liệu chấm công được ghi nhận.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. VIEW THỐNG KÊ THEO NGÀY CỤ THỂ (scope === "day")            */}
      {/* ============================================================== */}
      {scope === "day" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {/* Card Ngày 1: Hiện diện có mặt */}
            <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-emerald-950/40 dark:bg-slate-900 md:p-5">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Có mặt đi làm
                </span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {dayStats.tyLeCoMat}%
                </span>
              </div>
              <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400 md:text-3xl">
                {dayStats.coMatCount} <span className="text-sm font-normal text-slate-500">/ {dayStats.targetCount}</span>
              </div>
              <div className="mt-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {dayStats.listDungGio.length} đúng giờ · {dayStats.listDiTre.length} đi trễ
              </div>
            </div>

            {/* Card Ngày 2: Đi làm đúng giờ */}
            <div className="rounded-2xl border border-teal-100 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-teal-950/40 dark:bg-slate-900 md:p-5">
              <div className="flex items-center justify-between text-xs font-semibold text-teal-700 dark:text-teal-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-teal-600" /> Đúng giờ
                </span>
                <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
                  ≤ {GIO_VAO_CA_CHUAN.slice(0, 5)}
                </span>
              </div>
              <div className="mt-2 text-2xl font-black text-teal-600 dark:text-teal-400 md:text-3xl">
                {dayStats.listDungGio.length}
              </div>
              <div className="mt-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Vào làm trước giờ quy định
              </div>
            </div>

            {/* Card Ngày 3: Đi trễ trong ngày */}
            <div className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-orange-950/40 dark:bg-slate-900 md:p-5">
              <div className="flex items-center justify-between text-xs font-semibold text-orange-700 dark:text-orange-400">
                <span className="flex items-center gap-1.5">
                  <Clock3 className="h-4 w-4 text-orange-600" /> Đi trễ
                </span>
                <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
                  Lượt L
                </span>
              </div>
              <div className="mt-2 text-2xl font-black text-orange-600 dark:text-orange-400 md:text-3xl">
                {dayStats.listDiTre.length}
              </div>
              <div className="mt-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Sau {GIO_VAO_CA_CHUAN.slice(0, 5)}
              </div>
            </div>

            {/* Card Ngày 4: Vắng mặt / Nghỉ / Chưa chấm */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900 md:p-5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-slate-500" /> Vắng / Nghỉ phép
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {dayStats.listNghiPhep.length + dayStats.listKhongPhep.length + dayStats.listChuaCham.length} người
                </span>
              </div>
              <div className="mt-2 text-2xl font-black text-slate-800 dark:text-slate-200 md:text-3xl">
                {dayStats.listNghiPhep.length + dayStats.listKhongPhep.length}
              </div>
              <div className="mt-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {dayStats.listNghiPhep.length} có phép · {dayStats.listKhongPhep.length} không phép · {dayStats.listChuaCham.length} chưa chấm
              </div>
            </div>
          </div>

          {/* Nút bấm xem danh sách chi tiết ngày */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-teal-600" /> Điểm danh chi tiết ngày: {dateDisplayLabel}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isPersonalView ? `Chi tiết điểm danh của ${activeTargetEmployee?.hoTen}` : "Danh sách trạng thái vào/ra của từng nhân sự trong ngày được chọn"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDayDetail(!showDayDetail)}
                className="flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-700 transition hover:bg-teal-100 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-300"
              >
                <Eye className="h-3.5 w-3.5" />
                {showDayDetail ? "Thu gọn bảng" : "Xem chi tiết từng người"}
              </button>
            </div>

            {showDayDetail && (
              <div className="mt-4 overflow-x-auto tab-scroll-mobile no-scrollbar border-t border-slate-100 pt-3 dark:border-slate-800">
                <table className="w-full min-w-[600px] text-xs">
                  <thead>
                    <tr className="border-b text-left text-slate-500 dark:border-slate-800">
                      <th className="py-2 px-3">Mã NV</th>
                      <th className="py-2 px-3">Họ và tên</th>
                      <th className="py-2 px-3">Bộ phận</th>
                      <th className="py-2 px-3 text-center">Trạng thái</th>
                      <th className="py-2 px-3 text-center">Giờ vào</th>
                      <th className="py-2 px-3 text-center">Giờ ra</th>
                      <th className="py-2 px-3">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(isPersonalView && activeTargetEmployee ? [activeTargetEmployee] : activeEmployees).map((emp) => {
                      const rec = dayStats.dayRecords.find(
                        (r) => r.maNV.trim().toUpperCase() === emp.maNV.trim().toUpperCase()
                      );
                      const status = rec?.trangThai;
                      let badgeColor = "bg-slate-100 text-slate-600";
                      let statusText = "Chưa chấm";

                      if (status === "di-lam") {
                        badgeColor = "bg-emerald-100 text-emerald-700 font-bold";
                        statusText = "Đi làm đúng giờ";
                      } else if (status === "di-tre") {
                        badgeColor = "bg-orange-100 text-orange-700 font-bold";
                        statusText = "Đi trễ";
                      } else if (status === "nua-cong") {
                        badgeColor = "bg-amber-100 text-amber-700 font-bold";
                        statusText = "Nửa công (0.5)";
                      } else if (status === "nghi-phep") {
                        badgeColor = "bg-sky-100 text-sky-700 font-bold";
                        statusText = "Nghỉ phép";
                      } else if (status === "nghi-khong-phep") {
                        badgeColor = "bg-rose-100 text-rose-700 font-bold";
                        statusText = "Nghỉ không phép";
                      }

                      return (
                        <tr
                          key={emp.maNV}
                          className="border-b last:border-0 hover:bg-slate-50/60 dark:border-slate-800 dark:hover:bg-slate-800/40"
                        >
                          <td className="py-2 px-3 font-mono opacity-80">{emp.maNV}</td>
                          <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">{emp.hoTen}</td>
                          <td className="py-2 px-3 text-slate-500">{emp.boPhan}</td>
                          <td className="py-2 px-3 text-center">
                            <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] ${badgeColor}`}>
                              {statusText}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center font-mono font-semibold text-emerald-600">
                            {rec?.gioVao?.slice(0, 5) || "--:--"}
                          </td>
                          <td className="py-2 px-3 text-center font-mono font-semibold text-cyan-600">
                            {rec?.gioRa?.slice(0, 5) || "--:--"}
                          </td>
                          <td className="py-2 px-3 text-slate-400 italic text-[11px]">{rec?.ghiChu || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
