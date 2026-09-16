"use client";

import { useState, useMemo, type ReactNode } from "react";
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3, LogIn, LogOut, Search, TableProperties, Users, RefreshCw, type LucideIcon, Trash2 } from "lucide-react";
import { useNhanSu } from "@/lib/data/nhan-su-store";
import { getDaysInMonth, isLateArrival, toIsoDate, toLocalTime, tongHopChamCong, TRANG_THAI_CHAM_CONG, type ChamCongRecord, type TrangThaiChamCong } from "@/lib/cham-cong";
import { useChamCong } from "@/lib/use-cham-cong";
import { NhanSuTabs } from "@/components/nhan-su-tabs";
import { useSession } from "@/components/session-provider";
import { USERS } from "@/lib/users";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

type Tab = "hang-ngay" | "tong-hop";

const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

export default function ChamCongPage() {
  const { list: nhanSu, loading: loadingNhanSu } = useNhanSu();
  const { user } = useSession();
  const { records, saveRecord, deleteRecord, clearRecords, loading: loadingChamCong, source } = useChamCong();
  const [tab, setTab] = useState<Tab>("hang-ngay");
  const [monthKey, setMonthKey] = useState(currentMonth);
  const [search, setSearch] = useState("");
  const [boPhan, setBoPhan] = useState("all");
  
  const isAdmin = user?.role === "admin" || user?.role === "quan_tri";

  const days = useMemo(() => getDaysInMonth(monthKey), [monthKey]);
  const monthRecords = useMemo(() => records.filter((record) => record.ngay.startsWith(monthKey)), [records, monthKey]);
  const departments = useMemo(() => Array.from(new Set(nhanSu.map((item) => item.boPhan).filter(Boolean))).sort(), [nhanSu]);
  // Tìm trong bảng nhân sự Supabase trước, ưu tiên nhân sự đang làm việc
  const currentEmployeeFromDB = useMemo(() => {
    const activeNhanSu = nhanSu.filter((e) => e.trangThai !== "nghi_viec");
    
    // Hàm loại bỏ dấu tiếng Việt để tìm kiếm chính xác hơn
    const removeAccents = (str: string) => {
      return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
    };

    // Hàm tìm kiếm trong 1 list
    const findInList = (list: typeof nhanSu) => {
      return list.find((employee) => {
        if (user?.maNV && employee.maNV.toLocaleLowerCase() === user.maNV.toLocaleLowerCase()) return true;
        if (user?.email && employee.email?.toLocaleLowerCase() === user.email.toLocaleLowerCase()) return true;
        if (user?.name && employee.hoTen.toLocaleLowerCase("vi") === user.name.toLocaleLowerCase("vi")) return true;
        
        if (user?.email) {
          const emailPrefix = user.email.split('@')[0].toLocaleLowerCase();
          if (employee.taiKhoan?.toLocaleLowerCase() === emailPrefix) return true;
          if (employee.email?.toLocaleLowerCase().startsWith(emailPrefix + "@")) return true;
          
          const normalizedName = removeAccents(employee.hoTen.toLocaleLowerCase("vi"));
          const normalizedPrefix = removeAccents(emailPrefix);
          
          if (normalizedPrefix.length >= 3 && normalizedName.includes(normalizedPrefix)) {
            return true;
          }
        }
        return false;
      });
    };

    // Tìm trong danh sách active trước, nếu không có mới tìm trong tất cả
    return findInList(activeNhanSu) || findInList(nhanSu);
  }, [nhanSu, user]);

  // Fallback: tìm trong danh sách USERS tĩnh nếu chưa có trong Supabase
  const currentEmployee = useMemo(() => {
    if (currentEmployeeFromDB) return currentEmployeeFromDB;
    if (!user) return undefined;
    
    const staticUser = USERS.find((u) =>
      (user.email && u.email.toLocaleLowerCase() === user.email.toLocaleLowerCase())
      || (user.maNV && u.maNV.toLocaleLowerCase() === user.maNV.toLocaleLowerCase())
    );
    
    if (staticUser) {
      // Tạo profile tạm từ USERS để hiển thị card chấm công
      return {
        maNV: staticUser.maNV,
        hoTen: staticUser.name,
        boPhan: staticUser.phongBan,
        email: staticUser.email,
      } as { maNV: string; hoTen: string; boPhan: string; email?: string };
    }
    
    // Nếu vẫn không tìm thấy, tạo profile tạm từ thông tin user đăng nhập 
    // để đảm bảo 100% user đều thấy nút chấm công
    const prefix = user.email ? user.email.split('@')[0] : "user";
    return {
      maNV: user.maNV || prefix.toUpperCase(),
      hoTen: user.name || prefix,
      boPhan: "Hành chính",
      email: user.email,
    } as { maNV: string; hoTen: string; boPhan: string; email?: string };
  }, [currentEmployeeFromDB, user]);

  const employees = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("vi");
    
    return nhanSu.filter((item) => item.trangThai !== "nghi_viec")
      .filter((item) => boPhan === "all" || item.boPhan === boPhan)
      .filter((item) => !query || `${item.maNV} ${item.hoTen} ${item.boPhan}`.toLocaleLowerCase("vi").includes(query));
  }, [nhanSu, search, boPhan]);

  const recordMap = useMemo(() => new Map(monthRecords.map((record) => [`${record.maNV}|${record.ngay}`, record])), [monthRecords]);
  const summary = useMemo(() => new Map(employees.map((employee) => [employee.maNV, tongHopChamCong(monthRecords.filter((record) => record.maNV === employee.maNV))])), [employees, monthRecords]);
  const totals = useMemo(() => tongHopChamCong(monthRecords), [monthRecords]);

  const today = toIsoDate(new Date());
  const todayRecord = currentEmployee ? recordMap.get(`${currentEmployee.maNV}|${today}`) : undefined;

  const canEdit = (employeeMaNV: string, dateIso: string) => {
    // Theo logic mới: Không được chấm công tương lai (trước) và không được sửa quá khứ (trước đó).
    // => Chỉ cho phép thao tác trên ngày hôm nay.
    if (dateIso !== today) return false;

    // Trong ngày hôm nay, Admin được sửa cho tất cả
    if (isAdmin) return true;
    
    // Nhân viên chỉ được sửa cho chính mình
    if (currentEmployee?.maNV === employeeMaNV) return true;

    return false;
  };

  const moveMonth = (delta: number) => {
    const [year, month] = monthKey.split("-").map(Number);
    const next = new Date(year, month - 1 + delta, 1);
    setMonthKey(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`);
  };

  const updateStatus = async (maNV: string, ngay: string, trangThai: TrangThaiChamCong | "") => {
    const existing = recordMap.get(`${maNV}|${ngay}`);
    if (trangThai === "") {
      if (existing) {
        await deleteRecord(existing, user);
      }
      return;
    }

    const now = new Date().toISOString();
    const record: ChamCongRecord = {
      id: existing?.id || `CC-${maNV}-${ngay}`,
      maNV,
      authUserId: existing?.authUserId || user?.id,
      boPhan: existing?.boPhan || nhanSu.find((employee) => employee.maNV === maNV)?.boPhan,
      ngay,
      trangThai,
      soGioTangCa: existing?.soGioTangCa || 0,
      gioVao: existing?.gioVao,
      gioRa: existing?.gioRa,
      ghiChu: existing?.ghiChu,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    await saveRecord(record);
  };

  const checkIn = async () => {
    if (!currentEmployee || !user) return;
    if (todayRecord?.gioVao) {
      toast.info("Anh/chị đã chấm giờ vào hôm nay rồi.");
      return;
    }
    const now = new Date();
    const time = toLocalTime(now);
    const timestamp = now.toISOString();
    await saveRecord({
      id: `CC-${currentEmployee.maNV}-${today}`,
      maNV: currentEmployee.maNV,
      authUserId: user.id,
      boPhan: currentEmployee.boPhan,
      ngay: today,
      trangThai: isLateArrival(time) ? "di-tre" : "di-lam",
      gioVao: time,
      soGioTangCa: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    toast.success(`Đã ghi nhận vào làm lúc ${time.slice(0, 5)}`);
  };

  const checkOut = async () => {
    if (!todayRecord?.gioVao) {
      toast.error("Cần chấm Vào làm trước.");
      return;
    }
    if (todayRecord.gioRa) {
      toast.info("Anh/chị đã kết thúc ca hôm nay rồi.");
      return;
    }
    const now = new Date();
    const time = toLocalTime(now);
    await saveRecord({ ...todayRecord, gioRa: time, updatedAt: now.toISOString() });
    toast.success(`Đã ghi nhận kết thúc lúc ${time.slice(0, 5)}`);
  };

  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const resetAllAttendance = async () => {
    toast.loading("Đang xóa toàn bộ dữ liệu chấm công...", { id: "reset-cham-cong" });
    try {
      if (typeof clearRecords === "function") {
        await clearRecords();
      }
      toast.success("Đã xóa toàn bộ dữ liệu chấm công", { id: "reset-cham-cong" });
      setShowConfirmReset(false);
    } catch (error) {
      toast.error("Có lỗi xảy ra khi xóa dữ liệu", { id: "reset-cham-cong" });
    }
  };

  const loading = loadingNhanSu || loadingChamCong;
  const monthLabel = new Intl.DateTimeFormat("vi-VN", { month: "long", year: "numeric" }).format(new Date(`${monthKey}-01T00:00:00`));

  return (
    <div className="space-y-5 animate-fade-in">
      <NhanSuTabs />
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-500 p-5 text-white shadow-xl md:p-7">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium opacity-90"><CalendarDays className="h-3.5 w-3.5" /> MIMIN ERP · Nhân sự</p>
            <h1 className="flex items-center gap-2.5 text-3xl font-extrabold md:text-4xl"><CalendarDays className="h-7 w-7" /> Chấm công</h1>
            <p className="mt-1.5 text-sm opacity-90">Theo dõi công hằng ngày và tổng hợp tự động theo tháng.</p>
          </div>
          <span className="w-fit rounded-full bg-white/15 px-3 py-1.5 text-xs backdrop-blur">Nguồn dữ liệu: {source === "supabase" ? "Supabase" : "Thiết bị này"}</span>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={Users} label="Nhân viên" value={employees.length} />
        <Kpi icon={CheckCircle2} label="Tổng ngày công" value={totals.ngayCong} tone="text-emerald-600" />
        <Kpi icon={Clock3} label="Lượt đi trễ" value={totals.soLanDiTre} tone="text-orange-600" />
        <Kpi icon={CalendarDays} label="Nghỉ không phép" value={totals.ngayKhongPhep} tone="text-red-600" />
      </section>

      {/* Card chấm công cá nhân: chỉ hiện khi user có profile nhân sự liên kết */}
      {currentEmployee && (
        <SelfAttendanceCard employee={currentEmployee} record={todayRecord} onCheckIn={() => void checkIn()} onCheckOut={() => void checkOut()} />
      )}

      <section className="card p-3 md:p-4">
        <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
          {/* Tabs */}
          <div className="inline-flex h-11 w-fit items-center justify-center rounded-xl bg-slate-100 p-1 text-slate-500 dark:bg-slate-800/70">
            <TabButton active={tab === "hang-ngay"} onClick={() => setTab("hang-ngay")} icon={CalendarDays}>Chấm công hằng ngày</TabButton>
            <TabButton active={tab === "tong-hop"} onClick={() => setTab("tong-hop")} icon={TableProperties}>Tổng hợp tháng</TabButton>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            {isAdmin && (
              <>
                <button 
                  onClick={() => setShowConfirmReset(true)}
                  className="flex h-10 items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-600 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-900/40"
                >
                  <Trash2 className="h-4 w-4" /> Reset toàn bộ
                </button>
                <ConfirmDialog 
                  open={showConfirmReset}
                  onClose={() => setShowConfirmReset(false)}
                  onConfirm={resetAllAttendance}
                  title="Reset toàn bộ dữ liệu chấm công?"
                  description="Hành động này sẽ xóa vĩnh viễn toàn bộ dữ liệu chấm công của tất cả nhân viên. Bạn có chắc chắn muốn tiếp tục không?"
                  variant="danger"
                  confirmLabel="Xóa dữ liệu"
                />
              </>
            )}

            {/* Month Picker Group */}
            <div className="flex h-10 items-center rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <button 
                className="flex h-full w-10 items-center justify-center rounded-l-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200" 
                onClick={() => moveMonth(-1)}
                title="Tháng trước"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="relative flex h-full min-w-[140px] items-center justify-center border-l border-r border-slate-200 px-3 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50">
                <input 
                  type="month" 
                  value={monthKey} 
                  onChange={(event) => setMonthKey(event.target.value)} 
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  title="Chọn tháng"
                />
                <span className="pointer-events-none text-sm font-bold text-slate-700 dark:text-slate-200">
                  {(() => {
                    const [y, m] = monthKey.split("-");
                    return `Tháng ${m}, ${y}`;
                  })()}
                </span>
              </div>
              <button 
                className="flex h-full w-10 items-center justify-center rounded-r-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200" 
                onClick={() => moveMonth(1)}
                title="Tháng sau"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Department Select */}
            <select 
              className="h-10 min-w-[180px] cursor-pointer rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition-colors focus:border-teal-500 focus:ring-1 focus:ring-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" 
              value={boPhan} 
              onChange={(event) => setBoPhan(event.target.value)}
            >
              <option value="all">Tất cả bộ phận</option>
              {departments.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>

            {/* Search */}
            <label className="relative flex h-10 w-full items-center sm:w-64">
              <Search className="absolute left-3 h-4 w-4 text-slate-400" />
              <input 
                className="h-full w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm font-medium shadow-sm outline-none transition-colors placeholder:font-normal placeholder:text-slate-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:placeholder:text-slate-500" 
                value={search} 
                onChange={(event) => setSearch(event.target.value)} 
                placeholder="Tìm mã hoặc tên NV..." 
              />
            </label>
          </div>
        </div>
      </section>

      {tab === "hang-ngay" ? (
        <section className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <h2 className="text-lg font-bold capitalize text-slate-800 dark:text-slate-100">{monthLabel}</h2>
            <div className="flex flex-wrap gap-2 text-[11px]">
              {TRANG_THAI_CHAM_CONG.map((status) => <span key={status.value} className={`rounded-md px-2 py-1 font-bold shadow-sm ring-1 ring-inset ring-black/5 dark:ring-white/10 ${status.className}`}>{status.shortLabel} · {status.label}</span>)}
            </div>
          </div>
          
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full min-w-max text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
                <tr>
                  <th className="sticky left-0 z-20 w-56 bg-slate-50 px-4 py-3 text-left font-bold text-slate-700 shadow-[1px_0_0_0_#e2e8f0] dark:bg-slate-950 dark:text-slate-200 dark:shadow-[1px_0_0_0_#1e293b]">
                    Nhân viên
                  </th>
                  {days.map((day) => {
                    const ngay = toIsoDate(day);
                    const isToday = ngay === today;
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                    return (
                      <th key={day.getTime()} className={`w-12 border-l border-slate-200/60 p-2 text-center transition-colors dark:border-slate-800/60 ${isToday ? "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400" : isWeekend ? "bg-slate-100/50 text-slate-500 dark:bg-slate-900/50" : "text-slate-600 dark:text-slate-400"}`}>
                        <div className="flex flex-col items-center justify-center">
                          <span className={`text-[13px] font-bold ${isToday ? "text-teal-600 dark:text-teal-400" : day.getDay() === 0 ? "text-rose-600 dark:text-rose-500" : ""}`}>
                            {day.getDate()}
                          </span>
                          <span className={`text-[10px] font-semibold uppercase tracking-wider ${isToday ? "text-teal-600/80 dark:text-teal-400/80" : ""}`}>
                            {isToday ? "Hôm nay" : day.getDay() === 0 ? "CN" : `T${day.getDay() + 1}`}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                  <th className="w-16 border-l border-slate-200 bg-slate-50 px-2 py-3 text-center font-bold text-slate-700 shadow-[-1px_0_0_0_#e2e8f0] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:shadow-[-1px_0_0_0_#1e293b]">
                    Công
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {employees.map((employee) => (
                  <tr key={employee.maNV} className="group/row bg-white transition-colors hover:bg-slate-50/80 dark:bg-slate-900 dark:hover:bg-slate-800/50">
                    <td className="sticky left-0 z-10 bg-white px-4 py-2.5 shadow-[1px_0_0_0_#e2e8f0] transition-colors group-hover/row:bg-slate-50/80 dark:bg-slate-900 dark:shadow-[1px_0_0_0_#1e293b] dark:group-hover/row:bg-slate-800/50">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 dark:text-slate-100">{employee.hoTen}</span>
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{employee.maNV} • {employee.boPhan}</span>
                      </div>
                    </td>
                    {days.map((day) => {
                      const ngay = toIsoDate(day);
                      const isToday = ngay === today;
                      const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                      const record = recordMap.get(`${employee.maNV}|${ngay}`);
                      const status = TRANG_THAI_CHAM_CONG.find((item) => item.value === record?.trangThai);
                      
                      const selectStyle = status?.className 
                        ? `${status.className} shadow-sm ring-1 ring-inset ring-black/5 dark:ring-white/10` 
                        : "bg-slate-50 text-slate-300 hover:bg-slate-200 hover:text-slate-500 dark:bg-slate-800/40 dark:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300";

                      return (
                        <td 
                          key={ngay} 
                          className={`group relative border-l border-slate-100 p-1 text-center transition-colors dark:border-slate-800/40 ${isToday ? "bg-teal-50/40 dark:bg-teal-500/5" : isWeekend ? "bg-slate-50/40 dark:bg-slate-900/40" : ""}`}
                        >
                          <div className={`relative h-8 w-[42px] mx-auto flex items-center justify-center rounded text-xs font-bold transition-all focus-within:ring-2 focus-within:ring-teal-500 ${!canEdit(employee.maNV, ngay) ? "opacity-30 cursor-not-allowed" : ""} ${selectStyle}`}>
                            <span className="pointer-events-none">{status?.shortLabel || "—"}</span>
                            <select 
                              aria-label={`${employee.hoTen} ngày ${day.getDate()}`} 
                              disabled={!canEdit(employee.maNV, ngay)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                              value={record?.trangThai || ""} 
                              onChange={(event) => void updateStatus(employee.maNV, ngay, event.target.value as TrangThaiChamCong | "")}
                            >
                              <option value="">—</option>
                              {TRANG_THAI_CHAM_CONG.map((item) => <option key={item.value} value={item.value}>{item.shortLabel}: {item.label.toLowerCase()}</option>)}
                            </select>
                          </div>

                          {/* Custom Tooltip Premium */}
                          {record && (
                            <div className="pointer-events-none absolute bottom-full left-1/2 z-[100] mb-2 hidden -translate-x-1/2 flex-col whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-xs shadow-xl ring-1 ring-white/10 transition-all group-hover:flex group-hover:opacity-100 dark:bg-slate-800">
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Vào</span>
                                <span className="font-bold text-emerald-400">{record.gioVao?.slice(0, 5) || "--:--"}</span>
                              </div>
                              <div className="mt-1 flex items-center justify-between gap-4 border-t border-slate-700 pt-1">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Ra</span>
                                <span className="font-bold text-cyan-400">{record.gioRa?.slice(0, 5) || "--:--"}</span>
                              </div>
                              <div className="absolute top-full left-1/2 -mt-px -ml-1.5 border-[6px] border-transparent border-t-slate-900 dark:border-t-slate-800"></div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="border-l border-slate-200 bg-white p-2 text-center text-sm font-black text-teal-600 shadow-[-1px_0_0_0_#e2e8f0] transition-colors group-hover/row:bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900 dark:text-teal-400 dark:shadow-[-1px_0_0_0_#1e293b] dark:group-hover/row:bg-slate-800/50">
                      {summary.get(employee.maNV)?.ngayCong || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && employees.length === 0 && <div className="flex flex-col items-center justify-center p-12 text-slate-400"><Users className="mb-3 h-10 w-10 opacity-20" /><p className="text-sm font-medium">Không tìm thấy nhân viên phù hợp.</p></div>}
            {loading && <div className="flex flex-col items-center justify-center p-12 text-teal-500"><RefreshCw className="mb-3 h-8 w-8 animate-spin" /><p className="text-sm font-medium text-slate-500">Đang tải dữ liệu chấm công...</p></div>}
          </div>
        </section>
      ) : (
        <section className="flex flex-col gap-4">
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full min-w-[800px] text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
                <tr className="text-left font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  <th className="px-5 py-3.5">Mã NV</th>
                  <th className="px-5 py-3.5">Họ tên</th>
                  <th className="px-5 py-3.5">Bộ phận</th>
                  <th className="px-5 py-3.5 text-center text-teal-600 dark:text-teal-500">Ngày công</th>
                  <th className="px-5 py-3.5 text-center text-sky-600 dark:text-sky-500">Nghỉ phép</th>
                  <th className="px-5 py-3.5 text-center text-rose-600 dark:text-rose-500">Không phép</th>
                  <th className="px-5 py-3.5 text-center text-orange-600 dark:text-orange-500">Đi trễ</th>
                  <th className="px-5 py-3.5 text-center text-indigo-600 dark:text-indigo-500">Tăng ca</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {employees.map((employee) => {
                  const total = summary.get(employee.maNV)!;
                  return (
                    <tr key={employee.maNV} className="bg-white transition-colors hover:bg-slate-50/80 dark:bg-slate-900 dark:hover:bg-slate-800/50">
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">{employee.maNV}</td>
                      <td className="px-5 py-3 font-bold text-slate-800 dark:text-slate-100">{employee.hoTen}</td>
                      <td className="px-5 py-3 font-medium text-slate-600 dark:text-slate-300">{employee.boPhan}</td>
                      <td className="px-5 py-3 text-center text-[15px] font-black text-teal-600 dark:text-teal-400">{total.ngayCong}</td>
                      <td className="px-5 py-3 text-center font-bold text-sky-600 dark:text-sky-400">{total.ngayPhep}</td>
                      <td className="px-5 py-3 text-center font-bold text-rose-600 dark:text-rose-400">{total.ngayKhongPhep}</td>
                      <td className="px-5 py-3 text-center font-bold text-orange-600 dark:text-orange-400">{total.soLanDiTre}</td>
                      <td className="px-5 py-3 text-center font-bold text-indigo-600 dark:text-indigo-400">{total.gioTangCa}h</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!loading && employees.length === 0 && <div className="p-10 text-center text-sm font-medium text-slate-400">Không tìm thấy dữ liệu.</div>}
          </div>
        </section>
      )}
    </div>
  );
}

function SelfAttendanceCard({ employee, record, onCheckIn, onCheckOut }: {
  employee: { maNV: string; hoTen: string; boPhan: string };
  record?: ChamCongRecord;
  onCheckIn: () => void;
  onCheckOut: () => void;
}) {
  const complete = Boolean(record?.gioVao && record?.gioRa);
  return (
    <section className="card overflow-hidden border border-teal-200/70 dark:border-teal-700/40">
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-4 py-3 text-white md:px-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/75">Chấm công của tôi · Hôm nay</p>
        <h2 className="mt-0.5 text-lg font-bold">{employee.hoTen}</h2>
        <p className="text-xs text-white/80">{employee.maNV} · {employee.boPhan}</p>
      </div>
      <div className="grid gap-4 p-4 md:grid-cols-[1fr_auto] md:items-center md:p-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-100 p-3 text-center dark:bg-slate-800/70"><p className="text-xs opacity-60">Giờ vào</p><p className="mt-1 text-2xl font-bold text-emerald-600">{record?.gioVao?.slice(0, 5) || "--:--"}</p></div>
          <div className="rounded-xl bg-slate-100 p-3 text-center dark:bg-slate-800/70"><p className="text-xs opacity-60">Giờ kết thúc</p><p className="mt-1 text-2xl font-bold text-cyan-600">{record?.gioRa?.slice(0, 5) || "--:--"}</p></div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:min-w-[340px]">
          <button disabled={Boolean(record?.gioVao)} onClick={onCheckIn} className="flex min-h-16 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white shadow-lg transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"><LogIn className="h-5 w-5" /> Vào làm</button>
          <button disabled={!record?.gioVao || Boolean(record?.gioRa)} onClick={onCheckOut} className="flex min-h-16 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 font-bold text-white shadow-lg transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"><LogOut className="h-5 w-5" /> Kết thúc</button>
        </div>
      </div>
      {complete && <p className="border-t border-emerald-200 bg-emerald-50 px-4 py-2 text-center text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300">Đã hoàn tất chấm công hôm nay</p>}
    </section>
  );
}

function Kpi({ icon: Icon, label, value, tone = "" }: { icon: LucideIcon; label: string; value: number; tone?: string }) {
  return <div className="card p-4 md:p-5"><div className="flex items-center gap-1.5 text-xs opacity-70"><Icon className="h-3.5 w-3.5" /> {label}</div><div className={`mt-1 text-2xl font-bold md:text-3xl ${tone}`}>{value.toLocaleString("vi-VN")}</div></div>;
}

function TabButton({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon: LucideIcon; children: ReactNode }) {
  return <button onClick={onClick} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition md:text-sm ${active ? "bg-white text-teal-700 shadow-sm dark:bg-slate-700 dark:text-teal-300" : "opacity-65 hover:opacity-100"}`}><Icon className="h-4 w-4" />{children}</button>;
}
