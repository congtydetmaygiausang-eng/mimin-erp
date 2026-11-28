"use client";

import { useState, useMemo, useEffect, type ReactNode } from "react";
import { AlertTriangle, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Flame, LogIn, LogOut, Search, TableProperties, Users, RefreshCw, type LucideIcon, Trash2 } from "lucide-react";
import { useNhanSu } from "@/lib/data/nhan-su-store";
import {
  CHUAN_NGAY_CONG_THANG,
  CHUAN_GIO_LAM_MOI_NGAY,
  GIO_KET_THUC_CA_CHUAN,
  GIO_VAO_CA_CHUAN,
  TRANG_THAI_CHAM_CONG,
  chamCongRecordKey,
  getDaysInMonth,
  isEarlyLeave,
  isLateArrival,
  tinhPhanTramNgayCong,
  toIsoDate,
  toLocalTime,
  tongHopChamCong,
  type ChamCongRecord,
  type TrangThaiChamCong,
} from "@/lib/cham-cong";
import { useChamCong } from "@/lib/use-cham-cong";
import { NhanSuTabs } from "@/components/nhan-su-tabs";
import { useSession } from "@/components/session-provider";
import { USERS } from "@/lib/users";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { AttendanceDashboard } from "./components/AttendanceDashboard";
import { TangCaModal } from "./components/TangCaModal";
import { AttendanceCellTooltip, type HoveredCellState } from "./components/AttendanceCellTooltip";

type Tab = "hang-ngay" | "tong-hop";

const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

export default function ChamCongPage() {
  const { list: nhanSu, loading: loadingNhanSu } = useNhanSu();
  const { user } = useSession();
  const { records, saveRecord, deleteRecord, clearRecords, flushPending, pendingCount, loading: loadingChamCong, source } = useChamCong();
  const [tab, setTab] = useState<Tab>("hang-ngay");
  const [monthKey, setMonthKey] = useState(currentMonth);
  const [selectedDate, setSelectedDate] = useState(() => toIsoDate(new Date()));
  const [search, setSearch] = useState("");
  const [boPhan, setBoPhan] = useState("all");
  const [filterTrangThai, setFilterTrangThai] = useState<"all" | "dang_lam" | "nghi_viec">("all");
  const [submittingPunch, setSubmittingPunch] = useState(false);
  const [tangCaTarget, setTangCaTarget] = useState<{
    employee: { maNV: string; hoTen: string; boPhan: string; chucVu?: string };
    date: string;
    hours: number;
    note: string;
  } | null>(null);
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState<string>("");
  const [hoveredCell, setHoveredCell] = useState<HoveredCellState | null>(null);

  // Tự động đóng tooltip khi người dùng cuộn trang hoặc thay đổi kích thước
  useEffect(() => {
    const handleScrollOrResize = () => setHoveredCell(null);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, []);

  const handleCellMouseEnter = (
    e: React.MouseEvent<HTMLTableCellElement>,
    employee: (typeof nhanSu)[number],
    day: Date,
    record?: ChamCongRecord
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const tooltipWidth = 280;
    const tooltipHeight = 240;

    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    if (left < 12) left = 12;
    if (typeof window !== "undefined" && left + tooltipWidth > window.innerWidth - 12) {
      left = window.innerWidth - tooltipWidth - 12;
    }

    let top = rect.top - 8;
    let placement: "top" | "bottom" = "top";
    if (rect.top < tooltipHeight + 10) {
      top = rect.bottom + 8;
      placement = "bottom";
    }

    setHoveredCell({
      employee,
      day,
      record,
      top,
      left,
      placement,
    });
  };

  const handleCellMouseLeave = () => {
    setHoveredCell(null);
  };

  const isAdmin = Boolean(
    user?.role === "admin" ||
    user?.role === "quan_tri" ||
    user?.role === "giam_doc" ||
    user?.roles?.includes("admin") ||
    user?.roles?.includes("quan_tri") ||
    user?.roles?.includes("giam_doc")
  );

  const days = useMemo(() => getDaysInMonth(monthKey), [monthKey]);
  const monthRecords = useMemo(() => records.filter((record) => record.ngay.startsWith(monthKey)), [records, monthKey]);
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    set.add(currentMonth());
    records.forEach((r) => {
      if (r.ngay && r.ngay.length >= 7) {
        set.add(r.ngay.slice(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [records]);
  const departments = useMemo(() => Array.from(new Set(nhanSu.map((item) => item.boPhan).filter(Boolean))).sort(), [nhanSu]);

  // Helper chuẩn hóa mã nhân viên (bỏ dấu gạch ngang, khoảng trắng để NV-016, NV016, NV16 luôn khớp)
  const normalizeCode = (s?: string) => (s || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  // Tìm trong bảng nhân sự Supabase trước, ưu tiên nhân sự đang làm việc
  const currentEmployeeFromDB = useMemo(() => {
    const activeNhanSu = nhanSu.filter((e) => e.trangThai !== "nghi_viec");

    // Hàm loại bỏ dấu tiếng Việt để tìm kiếm chính xác hơn
    const removeAccents = (str: string) => {
      return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
    };

    // Hàm tìm kiếm trong 1 list (chỉ khớp định danh chính xác, không khớp chuỗi con tên gây nhầm nhân sự)
    const findInList = (list: typeof nhanSu) => {
      const staticMatch = user?.email
        ? USERS.find((u) => u.email.toLocaleLowerCase() === user.email.toLocaleLowerCase())
        : undefined;
      const targetMaNV = (user?.maNV || staticMatch?.maNV || "").trim().toLocaleLowerCase();

      return list.find((employee) => {
        if (targetMaNV) {
          if (employee.maNV.trim().toLocaleLowerCase() === targetMaNV) return true;
          if (normalizeCode(employee.maNV) === normalizeCode(targetMaNV)) return true;
        }
        if (user?.email && employee.email?.trim().toLocaleLowerCase() === user.email.trim().toLocaleLowerCase()) return true;

        if (user?.email) {
          const emailPrefix = user.email.split("@")[0].trim().toLocaleLowerCase();
          if (employee.taiKhoan?.trim().toLocaleLowerCase() === emailPrefix) return true;
          if (employee.email?.trim().toLocaleLowerCase().startsWith(`${emailPrefix}@`)) return true;
        }

        if (user?.name) {
          const normalizedEmpName = removeAccents(employee.hoTen.trim().toLocaleLowerCase("vi"));
          const normalizedUserName = removeAccents(user.name.trim().toLocaleLowerCase("vi"));
          if (normalizedEmpName && normalizedEmpName === normalizedUserName) return true;
        }
        return false;
      });
    };

    // Tìm trong danh sách active trước, nếu không có mới tìm trong tất cả
    return findInList(activeNhanSu) || findInList(nhanSu);
  }, [nhanSu, user]);

  // Fallback: tìm trong danh sách USERS tĩnh nếu chưa có trong Supabase
  const currentEmployee = useMemo(() => {
    if (currentEmployeeFromDB) {
      return {
        maNV: currentEmployeeFromDB.maNV,
        hoTen: currentEmployeeFromDB.hoTen,
        boPhan: currentEmployeeFromDB.boPhan,
        chucVu: currentEmployeeFromDB.chucVu || (currentEmployeeFromDB as any).viTri || "Nhân viên",
        email: currentEmployeeFromDB.email,
      };
    }
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
        chucVu: staticUser.chucVu || (staticUser as any).role || "Nhân viên",
        email: staticUser.email,
      };
    }

    // Nếu vẫn không tìm thấy, tạo profile tạm từ thông tin user đăng nhập 
    // để đảm bảo 100% user đều thấy nút chấm công
    const prefix = user.email ? user.email.split('@')[0] : "user";
    return {
      maNV: user.maNV || prefix.toUpperCase(),
      hoTen: user.name || prefix,
      boPhan: user.phongBan || "Hành chính",
      chucVu: (user as any).role || (user as any).chucVu || "Nhân viên",
      email: user.email,
    };
  }, [currentEmployeeFromDB, user]);

  const activeEmployeesCount = useMemo(() => nhanSu.filter((item) => item.trangThai !== "nghi_viec").length, [nhanSu]);
  const resignedEmployeesCount = useMemo(() => nhanSu.filter((item) => item.trangThai === "nghi_viec").length, [nhanSu]);

  const employees = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("vi");

    return nhanSu
      .filter((item) => {
        const isNghi = item.trangThai === "nghi_viec";
        if (filterTrangThai === "dang_lam") return !isNghi;
        if (filterTrangThai === "nghi_viec") return isNghi;
        return true;
      })
      .filter((item) => boPhan === "all" || item.boPhan === boPhan)
      .filter((item) => !query || `${item.maNV} ${item.hoTen} ${item.boPhan}`.toLocaleLowerCase("vi").includes(query));
  }, [nhanSu, search, boPhan, filterTrangThai]);

  // Phân quyền dữ liệu hiển thị (RBAC):
  // - Nếu không phải Admin: Chỉ hiển thị duy nhất dữ liệu của nhân sự đó
  // - Nếu là Admin: Hiển thị toàn bộ nhân sự (hoặc lọc theo nhân sự cụ thể được chọn trên Dashboard)
  const visibleEmployees = useMemo(() => {
    if (!isAdmin) {
      if (!currentEmployee) return [];
      const userMaNV = currentEmployee.maNV.trim().toUpperCase();
      const matched = employees.filter((e) =>
        e.maNV.trim().toUpperCase() === userMaNV ||
        normalizeCode(e.maNV) === normalizeCode(userMaNV)
      );
      return matched.length > 0 ? matched : [currentEmployee as (typeof nhanSu)[number]];
    }
    if (selectedEmployeeFilter && selectedEmployeeFilter !== "all") {
      const target = selectedEmployeeFilter.trim().toUpperCase();
      return employees.filter((e) =>
        e.maNV.trim().toUpperCase() === target ||
        normalizeCode(e.maNV) === normalizeCode(target)
      );
    }
    return employees;
  }, [isAdmin, currentEmployee, employees, selectedEmployeeFilter]);

  const recordMap = useMemo(() => {
    const map = new Map<string, ChamCongRecord>();
    for (const record of monthRecords) {
      map.set(chamCongRecordKey(record.maNV, record.ngay), record);
      // Index thêm bằng mã chuẩn hóa để NV-016 và NV16 luôn tìm thấy nhau
      const normKey = `${normalizeCode(record.maNV)}__${record.ngay}`;
      if (!map.has(normKey)) {
        map.set(normKey, record);
      }
    }
    return map;
  }, [monthRecords]);

  const summary = useMemo(
    () =>
      new Map(
        employees.map((employee) => [
          employee.maNV,
          tongHopChamCong(
            monthRecords.filter((record) =>
              record.maNV.trim().toUpperCase() === employee.maNV.trim().toUpperCase() ||
              normalizeCode(record.maNV) === normalizeCode(employee.maNV)
            )
          ),
        ])
      ),
    [employees, monthRecords]
  );
  const totals = useMemo(() => tongHopChamCong(monthRecords), [monthRecords]);

  const today = toIsoDate(new Date());
  const todayRecord = useMemo(() => {
    if (!currentEmployee) return undefined;
    const targetKey = chamCongRecordKey(currentEmployee.maNV, today);
    const normKey = `${normalizeCode(currentEmployee.maNV)}__${today}`;
    return records.find(
      (record) =>
        chamCongRecordKey(record.maNV, record.ngay) === targetKey ||
        `${normalizeCode(record.maNV)}__${record.ngay}` === normKey
    );
  }, [currentEmployee, records, today]);

  // Chỉ Admin mới được sửa tay bảng lưới; toàn bộ nhân viên chỉ dùng Vào làm & Kết thúc
  const canEditGrid = isAdmin;

  const moveMonth = (delta: number) => {
    const [year, month] = monthKey.split("-").map(Number);
    const next = new Date(year, month - 1 + delta, 1);
    setMonthKey(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`);
  };

  const updateStatus = async (maNV: string, ngay: string, trangThai: TrangThaiChamCong | "") => {
    if (!isAdmin) {
      toast.error("Chỉ Admin mới được chỉnh sửa trực tiếp bảng chấm công.");
      return;
    }

    const existing = recordMap.get(chamCongRecordKey(maNV, ngay));
    if (trangThai === "") {
      if (existing) {
        const res = await deleteRecord(existing, user);
        if (!res.ok) {
          toast.error(res.error || "Không thể xóa dữ liệu chấm công.");
        }
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
    const res = await saveRecord(record);
    if (!res.ok) {
      toast.error(res.error || "Không thể lưu dữ liệu chấm công.");
    } else if (!res.synced) {
      toast.warning("Đã lưu tạm trên thiết bị, hệ thống sẽ tự đồng bộ khi có kết nối.");
    }
  };

  const handleOpenTangCaModal = (emp: { maNV: string; hoTen: string; boPhan: string; chucVu?: string; viTri?: string }, dateStr: string) => {
    const chucVuFound =
      emp.chucVu ||
      emp.viTri ||
      nhanSu.find((n) => n.maNV.trim().toUpperCase() === emp.maNV.trim().toUpperCase())?.chucVu ||
      USERS.find((u) => u.maNV.trim().toUpperCase() === emp.maNV.trim().toUpperCase())?.chucVu ||
      "Nhân viên";

    const rec = recordMap.get(chamCongRecordKey(emp.maNV, dateStr));
    setTangCaTarget({
      employee: {
        maNV: emp.maNV,
        hoTen: emp.hoTen,
        boPhan: emp.boPhan,
        chucVu: chucVuFound,
      },
      date: dateStr,
      hours: rec?.soGioTangCa || 0,
      note: rec?.ghiChu || "",
    });
  };

  const checkIn = async () => {
    if (!currentEmployee || !user || submittingPunch) return;
    if (todayRecord?.gioVao) {
      toast.info("Anh/chị đã chấm giờ vào hôm nay rồi.");
      return;
    }
    setSubmittingPunch(true);
    try {
      const now = new Date();
      const time = toLocalTime(now);
      const timestamp = now.toISOString();
      const late = isLateArrival(time, GIO_VAO_CA_CHUAN);
      // Nếu vào làm từ 12:30 trở đi: nhận diện ca chiều (tính nửa công 0.5)
      const isAfternoon = time >= "12:30:00" || time >= "12:30";
      const trangThai: TrangThaiChamCong = isAfternoon ? "nua-cong" : late ? "di-tre" : "di-lam";

      const res = await saveRecord({
        id: todayRecord?.id || `CC-${currentEmployee.maNV}-${today}`,
        maNV: currentEmployee.maNV,
        authUserId: todayRecord?.authUserId || user.id,
        boPhan: todayRecord?.boPhan || currentEmployee.boPhan,
        ngay: today,
        trangThai,
        gioVao: time,
        gioRa: todayRecord?.gioRa,
        soGioTangCa: todayRecord?.soGioTangCa || 0,
        ghiChu: todayRecord?.ghiChu,
        createdAt: todayRecord?.createdAt || timestamp,
        updatedAt: timestamp,
      });

      if (!res.ok) {
        toast.error(res.error || "Không thể lưu giờ vào làm.");
        return;
      }
      if (!res.synced) {
        toast.warning(`Đã lưu tạm giờ vào ${time.slice(0, 5)} trên máy. Hệ thống sẽ tự đồng bộ lên máy chủ khi ổn định.`);
        return;
      }
      if (isAfternoon) {
        toast.info(`Đã ghi nhận vào làm ca chiều lúc ${time.slice(0, 5)} (tính nửa công - 0.5 công).`);
      } else if (late) {
        toast.warning(`Đã ghi nhận vào làm lúc ${time.slice(0, 5)} (đi trễ sau ${GIO_VAO_CA_CHUAN.slice(0, 5)}).`);
      } else {
        toast.success(`Đã ghi nhận vào làm lúc ${time.slice(0, 5)}.`);
      }
    } finally {
      setSubmittingPunch(false);
    }
  };

  const checkOut = async () => {
    if (submittingPunch) return;
    if (!todayRecord?.gioVao) {
      toast.error("Cần chấm Vào làm trước.");
      return;
    }
    if (todayRecord.gioRa) {
      toast.info("Anh/chị đã kết thúc ca hôm nay rồi.");
      return;
    }
    setSubmittingPunch(true);
    try {
      const now = new Date();
      const time = toLocalTime(now);
      const clockAnomaly = Boolean(todayRecord.gioVao && time < todayRecord.gioVao);
      const early = !clockAnomaly && isEarlyLeave(time, GIO_KET_THUC_CA_CHUAN);
      const note = clockAnomaly
        ? [todayRecord.ghiChu, `Giờ kết thúc (${time.slice(0, 5)}) nhỏ hơn giờ vào (${todayRecord.gioVao.slice(0, 5)})`]
          .filter(Boolean)
          .join(" | ")
        : todayRecord.ghiChu;

      // Tính tổng thời gian làm việc để nhận diện nửa công (nếu làm dưới 5 giờ hoặc về trước 12:30)
      const [inH, inM] = (todayRecord.gioVao || "07:30").split(":").map(Number);
      const [outH, outM] = time.split(":").map(Number);
      const durationHours = !clockAnomaly ? (outH * 60 + outM - (inH * 60 + inM)) / 60 : 8;
      const isHalfDay = !clockAnomaly && (durationHours < 5.0 || time < "12:30");

      const finalTrangThai: TrangThaiChamCong =
        isHalfDay && (todayRecord.trangThai === "di-lam" || todayRecord.trangThai === "di-tre")
          ? "nua-cong"
          : todayRecord.trangThai;

      const res = await saveRecord({
        ...todayRecord,
        gioRa: time,
        trangThai: finalTrangThai,
        ghiChu: note,
        updatedAt: now.toISOString(),
      });

      if (!res.ok) {
        toast.error(res.error || "Không thể lưu giờ kết thúc.");
        return;
      }
      if (!res.synced) {
        toast.warning(`Đã lưu tạm giờ kết thúc ${time.slice(0, 5)} trên máy. Hệ thống sẽ tự đồng bộ lại.`);
        return;
      }
      if (clockAnomaly) {
        toast.warning(`Đã ghi nhận kết thúc lúc ${time.slice(0, 5)} (giờ nhỏ hơn giờ vào — vui lòng kiểm tra lại giờ thiết bị).`);
      } else if (isHalfDay) {
        toast.info(`Đã ghi nhận kết thúc lúc ${time.slice(0, 5)} (làm ${durationHours.toFixed(1)}h - tính nửa công).`);
      } else if (early) {
        toast.info(`Đã ghi nhận kết thúc lúc ${time.slice(0, 5)} (về sớm trước ${GIO_KET_THUC_CA_CHUAN.slice(0, 5)}).`);
      } else {
        toast.success(`Đã ghi nhận kết thúc lúc ${time.slice(0, 5)}.`);
      }
    } finally {
      setSubmittingPunch(false);
    }
  };

    const handleSaveOvertime = async (hours: number, ghiChu?: string): Promise<boolean> => {
    if (!tangCaTarget || !user || submittingPunch) return false;
    setSubmittingPunch(true);
    try {
      const { employee, date } = tangCaTarget;
      const now = new Date();
      const timestamp = now.toISOString();
      const normEmpCode = normalizeCode(employee.maNV);
      const existing = recordMap.get(chamCongRecordKey(employee.maNV, date))
                    || recordMap.get(`${normEmpCode}__${date}`);
      
      const targetHours = Math.max(0, Math.round((Number(hours) || 0) * 100) / 100);
      
      // Đảm bảo dữ liệu chính xác:
      // Nếu nhân sự tăng ca nhưng chưa có giờ vào/ra, tự động gán ca chuẩn để không bị tính là nghỉ
      const gioVao = existing?.gioVao || (targetHours > 0 ? GIO_VAO_CA_CHUAN : undefined);
      const gioRa = existing?.gioRa || (targetHours > 0 ? GIO_KET_THUC_CA_CHUAN : undefined);
      const trangThai: TrangThaiChamCong = existing?.trangThai || "di-lam";

      const res = await saveRecord({
        id: existing?.id || `CC-${employee.maNV}-${date}`,
        maNV: employee.maNV,
        authUserId: existing?.authUserId || user.id,
        boPhan: existing?.boPhan || employee.boPhan,
        ngay: date,
        trangThai,
        gioVao,
        gioRa,
        soGioTangCa: targetHours,
        ghiChu: ghiChu !== undefined ? ghiChu : existing?.ghiChu,
        createdAt: existing?.createdAt || timestamp,
        updatedAt: timestamp,
      });

      if (!res.ok) {
        toast.error(res.error || "Không thể lưu giờ tăng ca.", { duration: 5000 });
        return false;
      }

      // Phát event để các tab khác (Bảng Lương, Thống Kê) tự động đồng bộ ngay lập tức
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("mimin_cham_cong_updated"));
      }

      if (targetHours > 0) {
        toast.success(`Đã ghi nhận tăng ca: +${targetHours}h (${employee.hoTen})`, {
          description: `Ngày ${date}`,
          duration: 3500,
        });
      } else {
        toast.info(`Đã xóa giờ tăng ca ngày ${date} của ${employee.hoTen}.`, { duration: 3000 });
      }
      return true;
    } catch (err) {
      console.error("[cham-cong] Lỗi ghi nhận tăng ca:", err);
      toast.error("Có lỗi xảy ra khi lưu tăng ca. Vui lòng thử lại!");
      return false;
    } finally {
      setSubmittingPunch(false);
    }
  };

  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const resetAllAttendance = async () => {
    if (!isAdmin) return;
    toast.loading("Đang xóa toàn bộ dữ liệu chấm công...", { id: "reset-cham-cong" });
    try {
      const res = await clearRecords();
      if (!res.ok) {
        toast.error(res.error || "Không thể xóa dữ liệu chấm công trên máy chủ.", { id: "reset-cham-cong" });
        return;
      }
      toast.success("Đã xóa toàn bộ dữ liệu chấm công", { id: "reset-cham-cong" });
      setShowConfirmReset(false);
    } catch {
      toast.error("Có lỗi xảy ra khi xóa dữ liệu", { id: "reset-cham-cong" });
    }
  };

  const loading = loadingNhanSu || loadingChamCong;
  const monthLabel = new Intl.DateTimeFormat("vi-VN", { month: "long", year: "numeric" }).format(new Date(`${monthKey}-01T00:00:00`));

  return (
    <div className="space-y-5 animate-fade-in w-full max-w-full overflow-x-hidden">
      <NhanSuTabs />
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-500 p-5 text-white shadow-xl md:p-7">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium opacity-90"><CalendarDays className="h-3.5 w-3.5" /> MIMIN ERP · Nhân sự</p>
            <h1 className="flex items-center gap-2.5 text-3xl font-extrabold md:text-4xl"><CalendarDays className="h-7 w-7" /> Chấm công</h1>
            <p className="mt-1.5 text-sm opacity-90">
              Ca chuẩn {GIO_VAO_CA_CHUAN.slice(0, 5)} – {GIO_KET_THUC_CA_CHUAN.slice(0, 5)} · Chuẩn {CHUAN_NGAY_CONG_THANG} ngày công/tháng (tính theo ngày công thực tế, nghỉ phép 0 công).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {pendingCount > 0 && (
              <button
                type="button"
                onClick={() => void flushPending()}
                className="flex items-center gap-1.5 rounded-full bg-amber-400/95 px-3 py-1.5 text-xs font-semibold text-amber-950 shadow transition hover:bg-amber-300"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Chờ đồng bộ ({pendingCount})
              </button>
            )}
            <span className="w-fit rounded-full bg-white/15 px-3 py-1.5 text-xs backdrop-blur">Nguồn dữ liệu: {source === "supabase" ? "Supabase" : "Thiết bị này"}</span>
          </div>
        </div>
      </section>

      {pendingCount > 0 && (
        <section className="flex flex-col gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-200 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              Có <strong>{pendingCount}</strong> lượt chấm công đang được giữ an toàn trên thiết bị và chờ đồng bộ lên máy chủ (không bị mất khi tải lại trang).
            </span>
          </div>
          <button
            type="button"
            onClick={() => void flushPending()}
            className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 font-semibold text-white transition hover:bg-amber-700"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Đồng bộ ngay
          </button>
        </section>
      )}

      {/* Dashboard Thống kê Chuẩn Chấm Công (Hỗ trợ Tháng / Ngày & Lịch sử) */}
      <AttendanceDashboard
        monthKey={monthKey}
        setMonthKey={setMonthKey}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        employees={nhanSu}
        monthRecords={monthRecords}
        allRecords={records}
        availableMonths={availableMonths}
        activeTab={tab}
        isAdmin={isAdmin}
        currentEmployee={currentEmployee}
        selectedEmployeeMaNV={selectedEmployeeFilter}
        setSelectedEmployeeMaNV={setSelectedEmployeeFilter}
      />

      {/* Card chấm công cá nhân: chỉ hiện khi user có profile nhân sự liên kết */}
      {currentEmployee && (
        <SelfAttendanceCard
          employee={currentEmployee}
          record={todayRecord}
          submitting={submittingPunch}
          onCheckIn={() => void checkIn()}
          onCheckOut={() => void checkOut()}
          onOvertime={() => {
            if (currentEmployee) {
              const chucVuFound =
                (currentEmployee as any).chucVu ||
                nhanSu.find((n) => n.maNV.trim().toUpperCase() === currentEmployee.maNV.trim().toUpperCase())?.chucVu ||
                USERS.find((u) => u.maNV.trim().toUpperCase() === currentEmployee.maNV.trim().toUpperCase())?.chucVu ||
                "Nhân viên";

              setTangCaTarget({
                employee: {
                  maNV: currentEmployee.maNV,
                  hoTen: currentEmployee.hoTen,
                  boPhan: currentEmployee.boPhan,
                  chucVu: chucVuFound,
                },
                date: today,
                hours: todayRecord?.soGioTangCa || 0,
                note: todayRecord?.ghiChu || "",
              });
            }
          }}
        />
      )}

      {/* Modal Chấm Tăng Ca: Dùng chung cho cả tự chấm và Admin click vào bất kỳ ô ngày/nhân sự nào */}
      {tangCaTarget && (
        <TangCaModal
          open={Boolean(tangCaTarget)}
          onClose={() => setTangCaTarget(null)}
          onConfirm={handleSaveOvertime}
          employee={tangCaTarget.employee}
          currentHours={tangCaTarget.hours}
          currentNote={tangCaTarget.note}
          todayStr={tangCaTarget.date}
          submitting={submittingPunch}
        />
      )}

      <section className="card p-3 md:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex w-full sm:w-fit rounded-xl bg-slate-100 p-1 dark:bg-slate-800/70">
            <TabButton active={tab === "hang-ngay"} onClick={() => setTab("hang-ngay")} icon={CalendarDays}>Chấm công hằng ngày</TabButton>
            <TabButton active={tab === "tong-hop"} onClick={() => setTab("tong-hop")} icon={TableProperties}>Tổng hợp tháng</TabButton>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full xl:w-auto">
            {/* Row 1 on mobile: Month navigator + Reset button */}
            <div className="flex items-center justify-between gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 flex-1 sm:flex-none">
                <button className="btn-secondary h-10 w-10 p-0 shrink-0" onClick={() => moveMonth(-1)} aria-label="Tháng trước">
                  <ChevronLeft className="mx-auto h-4 w-4" />
                </button>
                <input className="input h-10 flex-1 sm:w-40 text-center font-bold text-xs sm:text-sm" type="month" value={monthKey} onChange={(event) => setMonthKey(event.target.value)} />
                <button className="btn-secondary h-10 w-10 p-0 shrink-0" onClick={() => moveMonth(1)} aria-label="Tháng sau">
                  <ChevronRight className="mx-auto h-4 w-4" />
                </button>
              </div>

              {isAdmin && (
                <>
                  <button
                    onClick={() => setShowConfirmReset(true)}
                    className="flex h-10 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 sm:px-3 text-xs sm:text-sm font-medium text-red-600 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-900/40 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" /> <span className="hidden sm:inline">Reset toàn bộ</span><span className="sm:hidden">Reset</span>
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
            </div>

            {/* Row 2 on mobile: 2 dropdown selects side-by-side */}
            <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center">
              <select className="input h-10 w-full sm:w-36 text-xs sm:text-sm" value={boPhan} onChange={(event) => setBoPhan(event.target.value)}>
                <option value="all">Tất cả bộ phận</option>
                {departments.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <select className="input h-10 w-full sm:w-36 text-xs sm:text-sm" value={filterTrangThai} onChange={(event) => setFilterTrangThai(event.target.value as "all" | "dang_lam" | "nghi_viec")}>
                <option value="all">Tất cả ({nhanSu.length})</option>
                <option value="dang_lam">Đang làm ({activeEmployeesCount})</option>
                <option value="nghi_viec">Đã nghỉ ({resignedEmployeesCount})</option>
              </select>
            </div>

            {/* Row 3 on mobile: Full-width search bar */}
            <label className="relative w-full sm:w-52 xl:flex-none">
              <Search className="absolute left-3 top-3 h-4 w-4 opacity-50" />
              <input className="input h-10 pl-9 w-full text-xs sm:text-sm" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm mã hoặc tên NV..." />
            </label>
          </div>
        </div>
      </section>

      {tab === "hang-ngay" ? (
        <section className="card overflow-hidden">
          <div className="border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-semibold capitalize">{monthLabel}</h2>
              <span className="text-xs opacity-70">
                {isAdmin
                  ? "Admin có thể chỉnh trực tiếp ô trạng thái bên dưới."
                  : "Bảng xem chung — nhân viên chấm công bằng nút Vào làm & Kết thúc phía trên."}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
              {TRANG_THAI_CHAM_CONG.map((status) => <span key={status.value} className={`rounded-md px-2 py-1 font-semibold ${status.className}`}>{status.shortLabel} · {status.label}</span>)}
            </div>
          </div>
          <div className="overflow-x-auto no-scrollbar">
            <table className="min-w-max text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-850">
                <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                  <th className="sticky left-0 z-30 min-w-44 sm:min-w-52 bg-slate-50 dark:bg-slate-900 p-3 text-left border-r border-slate-200 dark:border-slate-800 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.08)]">Nhân viên</th>
                  {days.map((day) => {
                    const ngay = toIsoDate(day);
                    const isToday = ngay === today;
                    const isSelected = ngay === selectedDate;
                    return (
                      <th
                        key={day.getTime()}
                        onClick={() => setSelectedDate(ngay)}
                        title={`Bấm để xem thống kê ngày ${ngay}`}
                        className={`w-12 p-2 text-center cursor-pointer transition select-none ${isSelected
                            ? "bg-teal-600 text-white font-bold shadow-xs"
                            : isToday
                              ? "bg-emerald-100/60 text-emerald-800 ring-1 ring-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : day.getDay() === 0
                                ? "text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                : "hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                      >
                        <span className="block">{day.getDate()}</span>
                        <span className="font-normal opacity-70 text-[10px]">{isToday ? "Hôm nay" : day.getDay() === 0 ? "CN" : `T${day.getDay() + 1}`}</span>
                      </th>
                    );
                  })}
                  <th className="w-20 p-2 text-center">Công/{CHUAN_NGAY_CONG_THANG}</th>
                </tr>
              </thead>
              <tbody>
                {visibleEmployees.map((employee) => {
                  const empSummary = summary.get(employee.maNV);
                  const ngayCong = empSummary?.ngayCong || 0;
                  const tyLe = tinhPhanTramNgayCong(ngayCong, CHUAN_NGAY_CONG_THANG);
                  const isNghiViec = employee.trangThai === "nghi_viec";
                  return (
                    <tr
                      key={employee.maNV}
                      className={`border-b last:border-0 ${isNghiViec
                          ? "bg-rose-50/25 dark:bg-rose-950/15 hover:bg-rose-50/40 opacity-85"
                          : "hover:bg-white/40 dark:hover:bg-white/5"
                        }`}
                      style={{ borderColor: "var(--border)" }}
                    >
                      <td
                        className={`sticky left-0 z-20 p-2.5 sm:p-3 border-r border-slate-200 dark:border-slate-800 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.08)] ${isNghiViec ? "bg-rose-50 dark:bg-slate-900" : "bg-white dark:bg-slate-900"}`}
                      >
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="block font-bold text-slate-900 dark:text-white">{employee.hoTen}</span>
                          {isNghiViec && (
                            <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-800 shrink-0">
                              Đã nghỉ việc
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 flex-wrap mt-0.5">
                          <span className="font-bold text-slate-700 dark:text-slate-300">{employee.maNV}</span>
                          <span>·</span>
                          <span>{employee.chucVu || employee.boPhan}</span>
                        </div>
                      </td>
                      {days.map((day) => {
                        const ngay = toIsoDate(day);
                        const isToday = ngay === today;
                        const isSelected = ngay === selectedDate;
                        const record = recordMap.get(chamCongRecordKey(employee.maNV, ngay)) || recordMap.get(`${normalizeCode(employee.maNV)}__${ngay}`);
                        const status = TRANG_THAI_CHAM_CONG.find((item) => item.value === record?.trangThai);
                        return (
                          <td
                            key={ngay}
                            onMouseEnter={(e) => handleCellMouseEnter(e, employee, day, record)}
                            onMouseLeave={handleCellMouseLeave}
                            className={`p-1 text-center transition-colors relative group ${isSelected
                                ? "bg-teal-50/70 dark:bg-teal-950/30"
                                : isToday
                                  ? "bg-emerald-50/50 dark:bg-emerald-900/10"
                                  : day.getDay() === 0
                                    ? "bg-red-50/40 dark:bg-red-950/10"
                                    : ""
                              }`}
                          >
                            <div className="relative inline-flex items-center justify-center">
                              <select
                                aria-label={`${employee.hoTen} ngày ${day.getDate()}`}
                                disabled={!canEditGrid}
                                className={`h-8 w-11 appearance-none rounded-md border-0 text-center text-[11px] font-bold outline-none ring-teal-500 focus:ring-2 ${canEditGrid ? "cursor-pointer" : "cursor-default"} disabled:cursor-not-allowed disabled:opacity-75 ${status?.className || "bg-slate-100 text-slate-400 dark:bg-slate-800"}`}
                                value={record?.trangThai || ""}
                                onChange={(event) => void updateStatus(employee.maNV, ngay, event.target.value as TrangThaiChamCong | "")}
                              >
                                <option value="">—</option>
                                {TRANG_THAI_CHAM_CONG.map((item) => <option key={item.value} value={item.value}>{item.shortLabel}</option>)}
                              </select>

                              {/* Huy hiệu tăng ca hiển thị số giờ (+...h) - Click để xem/sửa */}
                              {record && record.soGioTangCa > 0 ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenTangCaModal(employee, ngay);
                                  }}
                                  className="absolute -top-1 -right-1 px-1 py-0.2 rounded bg-amber-500 hover:bg-amber-600 text-white text-[9px] font-bold leading-tight shadow-2xs cursor-pointer active:scale-90 transition z-[1]"
                                  title={`Tăng ca ${record.soGioTangCa}h. Bấm để sửa.`}
                                >
                                  +{record.soGioTangCa}h
                                </button>
                              ) : canEditGrid ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenTangCaModal(employee, ngay);
                                  }}
                                  className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 p-0.5 rounded bg-slate-200 dark:bg-slate-700 hover:bg-amber-500 text-slate-600 hover:text-white transition z-[1] cursor-pointer shadow-2xs"
                                  title={`Chấm tăng ca ngày ${day.getDate()}/${day.getMonth() + 1}`}
                                >
                                  <Flame className="w-2.5 h-2.5" />
                                </button>
                              ) : null}
                            </div>
                          </td>
                        );
                      })}
                      <td className="p-2 text-center">
                        <span className="block font-bold text-emerald-600">{ngayCong}</span>
                        <span className="text-[10px] opacity-65">{tyLe}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!loading && visibleEmployees.length === 0 && <p className="p-8 text-center text-sm opacity-60">Không tìm thấy nhân viên phù hợp.</p>}
          {loading && <p className="p-8 text-center text-sm opacity-60">Đang tải dữ liệu chấm công...</p>}
        </section>
      ) : (
        <section className="card overflow-hidden">
          <div className="border-b px-4 py-2.5 text-xs opacity-75" style={{ borderColor: "var(--border)" }}>
            Chuẩn ngày công tháng: <strong>{CHUAN_NGAY_CONG_THANG} ngày</strong> (không giới hạn trần — tháng có 29–31 ngày sẽ tính đúng theo số ngày công thực tế) · Nghỉ phép tính <strong>0 công</strong> · Ca chuẩn {GIO_VAO_CA_CHUAN.slice(0, 5)} – {GIO_KET_THUC_CA_CHUAN.slice(0, 5)}.
          </div>
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full min-w-[840px] text-sm">
              <thead><tr className="border-b text-left" style={{ borderColor: "var(--border)" }}><th className="p-3">Mã NV</th><th className="p-3">Họ tên</th><th className="p-3">Bộ phận</th><th className="p-3 text-center">Ngày công / {CHUAN_NGAY_CONG_THANG}</th><th className="p-3 text-center">Tỷ lệ</th><th className="p-3 text-center">Nghỉ phép (0 công)</th><th className="p-3 text-center">Không phép</th><th className="p-3 text-center">Đi trễ</th><th className="p-3 text-center">Tăng ca</th></tr></thead>
              <tbody>
                {visibleEmployees.map((employee) => {
                  const total = summary.get(employee.maNV);
                  const ngayCong = total?.ngayCong || 0;
                  const tyLe = tinhPhanTramNgayCong(ngayCong, CHUAN_NGAY_CONG_THANG);
                  const isNghiViec = employee.trangThai === "nghi_viec";
                  return (
                    <tr
                      key={employee.maNV}
                      className={`border-b last:border-0 ${isNghiViec
                          ? "bg-rose-50/25 dark:bg-rose-950/15 hover:bg-rose-50/40 opacity-85"
                          : "hover:bg-white/30 dark:hover:bg-white/5"
                        }`}
                      style={{ borderColor: "var(--border)" }}
                    >
                      <td className="p-3 font-mono text-xs opacity-70">{employee.maNV}</td>
                      <td className="p-3 font-medium">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{employee.hoTen}</span>
                          {isNghiViec && (
                            <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-800 shrink-0">
                              Đã nghỉ việc
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">{employee.boPhan}</td>
                      <td className="p-3 text-center font-bold text-emerald-600">{ngayCong} / {CHUAN_NGAY_CONG_THANG}</td>
                      <td className="p-3 text-center font-semibold text-teal-600">{tyLe}%</td>
                      <td className="p-3 text-center text-sky-600">{total?.ngayPhep || 0}</td>
                      <td className="p-3 text-center text-red-600">{total?.ngayKhongPhep || 0}</td>
                      <td className="p-3 text-center text-orange-600">{total?.soLanDiTre || 0}</td>
                      <td className="p-3 text-center">{total?.gioTangCa || 0}h</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Tooltip hiển thị chi tiết khi di chuột vào ô chấm công */}
      {hoveredCell && <AttendanceCellTooltip data={hoveredCell} />}
    </div>
  );
}

function SelfAttendanceCard({ employee, record, submitting, onCheckIn, onCheckOut, onOvertime }: {
  employee: { maNV: string; hoTen: string; boPhan: string; chucVu?: string };
  record?: ChamCongRecord;
  submitting?: boolean;
  onCheckIn: () => void;
  onCheckOut: () => void;
  onOvertime: () => void;
}) {
  const complete = Boolean(record?.gioVao && record?.gioRa);
  const soGioTangCa = record?.soGioTangCa || 0;
  return (
    <section className="card overflow-hidden border border-teal-200/70 dark:border-teal-700/40">
      <div className="flex flex-col gap-1.5 bg-gradient-to-r from-teal-600 via-teal-700 to-cyan-700 px-4 py-3 text-white sm:flex-row sm:items-center sm:justify-between md:px-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-teal-100">Chấm công của tôi · Hôm nay</p>
          <h2 className="mt-0.5 text-lg sm:text-xl font-black tracking-wide text-white">{employee.hoTen}</h2>
          <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-white/95">
            <span className="font-black bg-white/20 px-2 py-0.5 rounded shadow-xs">Mã: {employee.maNV}</span>
            <span className="font-black bg-amber-400/30 text-amber-100 px-2 py-0.5 rounded border border-amber-300/40 shadow-xs">
              Chức vụ: {employee.chucVu || "Nhân viên"}
            </span>
            <span className="text-white/85 font-semibold">Bộ phận: {employee.boPhan}</span>
          </div>
        </div>
        <span className="w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white/95">
          Ca chuẩn: {GIO_VAO_CA_CHUAN.slice(0, 5)} – {GIO_KET_THUC_CA_CHUAN.slice(0, 5)} ({CHUAN_GIO_LAM_MOI_NGAY}h/ngày)
        </span>
      </div>
      <div className="grid gap-4 p-4 md:grid-cols-[1fr_auto] md:items-center md:p-5">
        <div className="grid grid-cols-3 gap-2.5">
          <div className="rounded-xl bg-slate-100 p-3 text-center dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/50">
            <p className="text-[11px] font-semibold text-slate-500 uppercase">Giờ vào</p>
            <p className="mt-1 text-xl sm:text-2xl font-bold text-emerald-600">{record?.gioVao?.slice(0, 5) || "--:--"}</p>
          </div>
          <div className="rounded-xl bg-slate-100 p-3 text-center dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/50">
            <p className="text-[11px] font-semibold text-slate-500 uppercase">Giờ kết thúc</p>
            <p className="mt-1 text-xl sm:text-2xl font-bold text-cyan-600">{record?.gioRa?.slice(0, 5) || "--:--"}</p>
          </div>
          <div className="rounded-xl bg-amber-50/80 p-3 text-center dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/60">
            <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase flex items-center justify-center gap-1">
              <Flame className="h-3 w-3 text-amber-600 animate-pulse" />
              <span>Tăng ca</span>
            </p>
            <p className="mt-1 text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400">
              {soGioTangCa > 0 ? `${soGioTangCa}h` : "0h"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 md:min-w-[460px]">
          <button
            type="button"
            disabled={submitting || Boolean(record?.gioVao)}
            onClick={onCheckIn}
            className="flex min-h-16 items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-3 font-bold text-white shadow-md transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <LogIn className="h-5 w-5" />
            <span>Vào làm</span>
          </button>
          <button
            type="button"
            disabled={submitting || !record?.gioVao || Boolean(record?.gioRa)}
            onClick={onCheckOut}
            className="flex min-h-16 items-center justify-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-3 py-3 font-bold text-white shadow-md transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <LogOut className="h-5 w-5" />
            <span>Kết thúc</span>
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={onOvertime}
            className="flex min-h-16 items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 px-3 py-3 font-bold text-white shadow-xs transition active:scale-95 cursor-pointer relative"
            title="Bấm để ghi nhận hoặc điều chỉnh giờ làm tăng ca hôm nay"
          >
            <Flame className="h-5 w-5 text-amber-100 animate-pulse shrink-0" />
            <div className="flex flex-col items-start leading-tight">
              <span>Tăng Ca</span>
              {soGioTangCa > 0 ? (
                <span className="text-[10px] font-semibold text-amber-100 bg-black/20 px-1.5 py-0.2 rounded-full">
                  +{soGioTangCa}h đã ghi
                </span>
              ) : (
                <span className="text-[10px] font-normal text-amber-100/80">
                  Ghi nhận
                </span>
              )}
            </div>
          </button>
        </div>
      </div>
      {complete && (
        <div className="border-t border-emerald-200 bg-emerald-50 px-4 py-2 flex items-center justify-between text-xs font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300">
          <span>Đã hoàn tất chấm công vào / kết thúc hôm nay</span>
          {soGioTangCa > 0 ? (
            <span className="text-amber-800 dark:text-amber-300 font-bold bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-full">
              Tăng ca hôm nay: +{soGioTangCa} giờ
            </span>
          ) : null}
        </div>
      )}
    </section>
  );
}

function Kpi({ icon: Icon, label, value, tone = "", subtext }: { icon: LucideIcon; label: string; value: number; tone?: string; subtext?: string }) {
  return (
    <div className="card p-4 md:p-5">
      <div className="flex items-center gap-1.5 text-xs opacity-70"><Icon className="h-3.5 w-3.5" /> {label}</div>
      <div className={`mt-1 text-2xl font-bold md:text-3xl ${tone}`}>{value.toLocaleString("vi-VN")}</div>
      {subtext && <div className="text-[11px] opacity-70 mt-1">{subtext}</div>}
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon: LucideIcon; children: ReactNode }) {
  return <button onClick={onClick} className={`flex flex-1 sm:flex-none justify-center items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition md:text-sm whitespace-nowrap ${active ? "bg-white text-teal-700 shadow-sm dark:bg-slate-700 dark:text-teal-300" : "opacity-65 hover:opacity-100"}`}><Icon className="h-4 w-4" />{children}</button>;
}
