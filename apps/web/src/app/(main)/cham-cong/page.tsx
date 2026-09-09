"use client";

import { useMemo, useState, type ReactNode } from "react";
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3, LogIn, LogOut, Search, TableProperties, Users, type LucideIcon } from "lucide-react";
import { useNhanSu } from "@/lib/data/nhan-su-store";
import { getDaysInMonth, isLateArrival, toIsoDate, toLocalTime, tongHopChamCong, TRANG_THAI_CHAM_CONG, type ChamCongRecord, type TrangThaiChamCong } from "@/lib/cham-cong";
import { useChamCong } from "@/lib/use-cham-cong";
import { NhanSuTabs } from "@/components/nhan-su-tabs";
import { useSession } from "@/components/session-provider";
import { toast } from "sonner";

type Tab = "hang-ngay" | "tong-hop";

const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

export default function ChamCongPage() {
  const { list: nhanSu, loading: loadingNhanSu } = useNhanSu();
  const { user } = useSession();
  const { records, saveRecord, loading: loadingChamCong, source } = useChamCong();
  const [tab, setTab] = useState<Tab>("hang-ngay");
  const [monthKey, setMonthKey] = useState(currentMonth);
  const [search, setSearch] = useState("");
  const [boPhan, setBoPhan] = useState("all");

  const days = useMemo(() => getDaysInMonth(monthKey), [monthKey]);
  const monthRecords = useMemo(() => records.filter((record) => record.ngay.startsWith(monthKey)), [records, monthKey]);
  const departments = useMemo(() => Array.from(new Set(nhanSu.map((item) => item.boPhan).filter(Boolean))).sort(), [nhanSu]);
  const employees = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("vi");
    return nhanSu.filter((item) => item.trangThai !== "nghi_viec")
      .filter((item) => boPhan === "all" || item.boPhan === boPhan)
      .filter((item) => !query || `${item.maNV} ${item.hoTen} ${item.boPhan}`.toLocaleLowerCase("vi").includes(query));
  }, [nhanSu, search, boPhan]);

  const recordMap = useMemo(() => new Map(monthRecords.map((record) => [`${record.maNV}|${record.ngay}`, record])), [monthRecords]);
  const summary = useMemo(() => new Map(employees.map((employee) => [employee.maNV, tongHopChamCong(monthRecords.filter((record) => record.maNV === employee.maNV))])), [employees, monthRecords]);
  const totals = useMemo(() => tongHopChamCong(monthRecords), [monthRecords]);
  const currentEmployee = useMemo(() => nhanSu.find((employee) =>
    (user?.maNV && employee.maNV.toLocaleLowerCase() === user.maNV.toLocaleLowerCase())
    || (user?.email && employee.email?.toLocaleLowerCase() === user.email.toLocaleLowerCase())
    || (user?.name && employee.hoTen.toLocaleLowerCase("vi") === user.name.toLocaleLowerCase("vi"))
  ), [nhanSu, user]);
  const today = toIsoDate(new Date());
  const todayRecord = currentEmployee ? recordMap.get(`${currentEmployee.maNV}|${today}`) : undefined;

  const moveMonth = (delta: number) => {
    const [year, month] = monthKey.split("-").map(Number);
    const next = new Date(year, month - 1 + delta, 1);
    setMonthKey(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`);
  };

  const updateStatus = async (maNV: string, ngay: string, trangThai: TrangThaiChamCong) => {
    const existing = recordMap.get(`${maNV}|${ngay}`);
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

      <SelfAttendanceCard employee={currentEmployee} userName={user?.name} record={todayRecord} onCheckIn={() => void checkIn()} onCheckOut={() => void checkOut()} />

      <section className="card p-3 md:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="inline-flex w-fit rounded-xl bg-slate-100 p-1 dark:bg-slate-800/70">
            <TabButton active={tab === "hang-ngay"} onClick={() => setTab("hang-ngay")} icon={CalendarDays}>Chấm công hằng ngày</TabButton>
            <TabButton active={tab === "tong-hop"} onClick={() => setTab("tong-hop")} icon={TableProperties}>Tổng hợp tháng</TabButton>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn-secondary h-10 w-10 p-0" onClick={() => moveMonth(-1)} aria-label="Tháng trước"><ChevronLeft className="mx-auto h-4 w-4" /></button>
            <input className="input h-10 w-40" type="month" value={monthKey} onChange={(event) => setMonthKey(event.target.value)} />
            <button className="btn-secondary h-10 w-10 p-0" onClick={() => moveMonth(1)} aria-label="Tháng sau"><ChevronRight className="mx-auto h-4 w-4" /></button>
            <select className="input h-10 min-w-36" value={boPhan} onChange={(event) => setBoPhan(event.target.value)}>
              <option value="all">Tất cả bộ phận</option>
              {departments.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <label className="relative min-w-52 flex-1 xl:flex-none">
              <Search className="absolute left-3 top-3 h-4 w-4 opacity-50" />
              <input className="input h-10 pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm mã hoặc tên NV..." />
            </label>
          </div>
        </div>
      </section>

      {tab === "hang-ngay" ? (
        <section className="card overflow-hidden">
          <div className="border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
            <h2 className="font-semibold capitalize">{monthLabel}</h2>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
              {TRANG_THAI_CHAM_CONG.map((status) => <span key={status.value} className={`rounded-md px-2 py-1 font-semibold ${status.className}`}>{status.shortLabel} · {status.label}</span>)}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-max text-xs">
              <thead className="bg-white/70 dark:bg-slate-900/80">
                <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                  <th className="sticky left-0 z-20 min-w-52 bg-inherit p-3 text-left">Nhân viên</th>
                  {days.map((day) => <th key={day.getTime()} className={`w-12 p-2 text-center ${day.getDay() === 0 ? "text-red-500" : ""}`}><span className="block">{day.getDate()}</span><span className="font-normal opacity-60">{day.getDay() === 0 ? "CN" : `T${day.getDay() + 1}`}</span></th>)}
                  <th className="w-16 p-2 text-center">Công</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.maNV} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                    <td className="sticky left-0 z-10 bg-white p-3 shadow-[3px_0_6px_-5px_rgba(0,0,0,.5)] dark:bg-slate-900">
                      <span className="block font-semibold">{employee.hoTen}</span><span className="opacity-60">{employee.maNV} · {employee.boPhan}</span>
                    </td>
                    {days.map((day) => {
                      const ngay = toIsoDate(day);
                      const record = recordMap.get(`${employee.maNV}|${ngay}`);
                      const status = TRANG_THAI_CHAM_CONG.find((item) => item.value === record?.trangThai);
                      return (
                        <td key={ngay} className={`p-1 text-center ${day.getDay() === 0 ? "bg-red-50/40 dark:bg-red-950/10" : ""}`}>
                          <select aria-label={`${employee.hoTen} ngày ${day.getDate()}`} className={`h-8 w-11 cursor-pointer appearance-none rounded-md border-0 text-center text-[11px] font-bold outline-none ring-teal-500 focus:ring-2 ${status?.className || "bg-slate-100 text-slate-400 dark:bg-slate-800"}`} value={record?.trangThai || ""} onChange={(event) => void updateStatus(employee.maNV, ngay, event.target.value as TrangThaiChamCong)}>
                            <option value="" disabled>—</option>
                            {TRANG_THAI_CHAM_CONG.map((item) => <option key={item.value} value={item.value}>{item.shortLabel}</option>)}
                          </select>
                        </td>
                      );
                    })}
                    <td className="p-2 text-center font-bold text-emerald-600">{summary.get(employee.maNV)?.ngayCong || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && employees.length === 0 && <p className="p-8 text-center text-sm opacity-60">Không tìm thấy nhân viên phù hợp.</p>}
          {loading && <p className="p-8 text-center text-sm opacity-60">Đang tải dữ liệu chấm công...</p>}
        </section>
      ) : (
        <section className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead><tr className="border-b text-left" style={{ borderColor: "var(--border)" }}><th className="p-3">Mã NV</th><th className="p-3">Họ tên</th><th className="p-3">Bộ phận</th><th className="p-3 text-center">Ngày công</th><th className="p-3 text-center">Nghỉ phép</th><th className="p-3 text-center">Không phép</th><th className="p-3 text-center">Đi trễ</th><th className="p-3 text-center">Tăng ca</th></tr></thead>
              <tbody>
                {employees.map((employee) => {
                  const total = summary.get(employee.maNV)!;
                  return <tr key={employee.maNV} className="border-b last:border-0 hover:bg-white/30 dark:hover:bg-white/5" style={{ borderColor: "var(--border)" }}><td className="p-3 font-mono text-xs opacity-70">{employee.maNV}</td><td className="p-3 font-medium">{employee.hoTen}</td><td className="p-3">{employee.boPhan}</td><td className="p-3 text-center font-bold text-emerald-600">{total.ngayCong}</td><td className="p-3 text-center text-sky-600">{total.ngayPhep}</td><td className="p-3 text-center text-red-600">{total.ngayKhongPhep}</td><td className="p-3 text-center text-orange-600">{total.soLanDiTre}</td><td className="p-3 text-center">{total.gioTangCa}h</td></tr>;
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function SelfAttendanceCard({ employee, userName, record, onCheckIn, onCheckOut }: {
  employee?: { maNV: string; hoTen: string; boPhan: string };
  userName?: string;
  record?: ChamCongRecord;
  onCheckIn: () => void;
  onCheckOut: () => void;
}) {
  const complete = Boolean(record?.gioVao && record?.gioRa);
  return (
    <section className="card overflow-hidden border border-teal-200/70 dark:border-teal-700/40">
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-4 py-3 text-white md:px-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/75">Chấm công của tôi · Hôm nay</p>
        <h2 className="mt-0.5 text-lg font-bold">{employee?.hoTen || userName || "Tài khoản chưa liên kết nhân sự"}</h2>
        <p className="text-xs text-white/80">{employee ? `${employee.maNV} · ${employee.boPhan}` : "Vui lòng liên kết mã nhân viên với tài khoản"}</p>
      </div>
      <div className="grid gap-4 p-4 md:grid-cols-[1fr_auto] md:items-center md:p-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-100 p-3 text-center dark:bg-slate-800/70"><p className="text-xs opacity-60">Giờ vào</p><p className="mt-1 text-2xl font-bold text-emerald-600">{record?.gioVao?.slice(0, 5) || "--:--"}</p></div>
          <div className="rounded-xl bg-slate-100 p-3 text-center dark:bg-slate-800/70"><p className="text-xs opacity-60">Giờ kết thúc</p><p className="mt-1 text-2xl font-bold text-cyan-600">{record?.gioRa?.slice(0, 5) || "--:--"}</p></div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:min-w-[340px]">
          <button disabled={!employee || Boolean(record?.gioVao)} onClick={onCheckIn} className="flex min-h-16 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white shadow-lg transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"><LogIn className="h-5 w-5" /> Vào làm</button>
          <button disabled={!employee || !record?.gioVao || Boolean(record?.gioRa)} onClick={onCheckOut} className="flex min-h-16 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 font-bold text-white shadow-lg transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"><LogOut className="h-5 w-5" /> Kết thúc</button>
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
