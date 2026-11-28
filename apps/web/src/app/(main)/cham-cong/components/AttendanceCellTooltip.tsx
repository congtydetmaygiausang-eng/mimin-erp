"use client";

import { CalendarDays, Clock3, Flame, LogIn, LogOut } from "lucide-react";
import {
  CHUAN_GIO_LAM_MOI_NGAY,
  GIO_KET_THUC_CA_CHUAN,
  GIO_VAO_CA_CHUAN,
  isLateArrival,
  toIsoDate,
  type ChamCongRecord,
} from "@/lib/cham-cong";

export interface HoveredCellState {
  employee: {
    maNV: string;
    hoTen: string;
    boPhan: string;
    chucVu?: string;
  };
  day: Date;
  record?: ChamCongRecord;
  top: number;
  left: number;
  placement: "top" | "bottom";
}

export function AttendanceCellTooltip({ data }: { data: HoveredCellState }) {
  const { employee, day, record, top, left, placement } = data;
  const dayOfWeek = day.getDay();
  const thu = dayOfWeek === 0 ? "Chủ Nhật" : `Thứ ${dayOfWeek + 1}`;
  const d = String(day.getDate()).padStart(2, "0");
  const m = String(day.getMonth() + 1).padStart(2, "0");
  const y = day.getFullYear();
  const ngayIso = toIsoDate(day);
  const isToday = ngayIso === toIsoDate(new Date());

  const trangThai = record?.trangThai;
  const isDiLam = trangThai === "di-lam" || trangThai === "nua-cong" || trangThai === "di-tre";
  const soGioTangCa = record?.soGioTangCa || 0;

  // 1. Trạng thái công
  let statusLabel = "Chưa chấm / Ngày nghỉ";
  let statusBadgeClass = "bg-slate-800 text-slate-300 border border-slate-700";
  let statusDotClass = "bg-slate-400";

  if (trangThai === "di-lam") {
    statusLabel = "Đi làm (1 công)";
    statusBadgeClass = "bg-emerald-950/80 text-emerald-300 border border-emerald-600/50";
    statusDotClass = "bg-emerald-400";
  } else if (trangThai === "nua-cong") {
    statusLabel = "Nửa công (0.5 công)";
    statusBadgeClass = "bg-amber-950/80 text-amber-300 border border-amber-600/50";
    statusDotClass = "bg-amber-400";
  } else if (trangThai === "di-tre") {
    statusLabel = "Đi trễ";
    statusBadgeClass = "bg-orange-950/80 text-orange-300 border border-orange-600/50";
    statusDotClass = "bg-orange-400";
  } else if (trangThai === "nghi-phep") {
    statusLabel = "Nghỉ phép (0 công)";
    statusBadgeClass = "bg-sky-950/80 text-sky-300 border border-sky-600/50";
    statusDotClass = "bg-sky-400";
  } else if (trangThai === "nghi-khong-phep") {
    statusLabel = "Nghỉ không phép (KP)";
    statusBadgeClass = "bg-rose-950/80 text-rose-300 border border-rose-600/50";
    statusDotClass = "bg-rose-400";
  }

  // 2. Giờ vào làm
  let gioVaoFormatted = "—";
  let gioVaoSub = "Không có ca";
  let isLate = false;
  if (record?.gioVao) {
    gioVaoFormatted = record.gioVao.slice(0, 5);
    gioVaoSub = `Bấm lúc ${record.gioVao.length > 5 ? record.gioVao : record.gioVao + ":00"}`;
    if (isLateArrival(record.gioVao)) {
      isLate = true;
    }
  } else if (isDiLam) {
    gioVaoFormatted = GIO_VAO_CA_CHUAN.slice(0, 5); // "07:30"
    gioVaoSub = "Ca chuẩn quy định";
  }

  // 3. Giờ kết thúc
  let gioRaFormatted = "—";
  let gioRaSub = "Không có ca";
  if (record?.gioRa) {
    gioRaFormatted = record.gioRa.slice(0, 5);
    gioRaSub = `Bấm lúc ${record.gioRa.length > 5 ? record.gioRa : record.gioRa + ":00"}`;
  } else if (isDiLam) {
    if (soGioTangCa > 0) {
      const [h, min] = GIO_KET_THUC_CA_CHUAN.split(":").map(Number);
      const totalMinutes = h * 60 + min + Math.round(soGioTangCa * 60);
      const endH = Math.floor(totalMinutes / 60) % 24;
      const endM = totalMinutes % 60;
      gioRaFormatted = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
      gioRaSub = `Dự kiến (+${soGioTangCa}h OT)`;
    } else if (isToday) {
      gioRaFormatted = "Đang làm";
      gioRaSub = `Ca chuẩn đến ${GIO_KET_THUC_CA_CHUAN.slice(0, 5)}`;
    } else {
      gioRaFormatted = GIO_KET_THUC_CA_CHUAN.slice(0, 5); // "17:30"
      gioRaSub = "Ca chuẩn quy định";
    }
  }

  // 4. Số giờ tăng ca
  let tangCaDetail = "0 giờ (Không tăng ca)";
  if (soGioTangCa > 0) {
    const [h, min] = GIO_KET_THUC_CA_CHUAN.split(":").map(Number);
    const totalMinutes = h * 60 + min + Math.round(soGioTangCa * 60);
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    const endStr = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
    tangCaDetail = `+${soGioTangCa} giờ (${GIO_KET_THUC_CA_CHUAN.slice(0, 5)} – ${endStr})`;
  }

  // 5. Tổng thời gian làm việc
  let tongGioLam = "—";
  if (isDiLam) {
    if (trangThai === "nua-cong") {
      tongGioLam = `${(CHUAN_GIO_LAM_MOI_NGAY / 2).toFixed(1)} giờ`;
    } else {
      const base = CHUAN_GIO_LAM_MOI_NGAY;
      const total = base + soGioTangCa;
      tongGioLam = soGioTangCa > 0 ? `${total.toFixed(1)} giờ (8.5h ca + ${soGioTangCa}h OT)` : `${base} giờ`;
    }
  }

  return (
    <div
      className="fixed z-[9999] pointer-events-none transition-all duration-150 animate-in fade-in zoom-in-95"
      style={{
        top: `${top}px`,
        left: `${left}px`,
        width: "280px",
        transform: placement === "top" ? "translateY(-100%)" : "none",
      }}
    >
      <div className="rounded-xl border border-slate-700/80 bg-slate-900/95 text-slate-100 p-3 shadow-2xl backdrop-blur-md text-xs space-y-2.5">
        {/* Header: Tên nhân viên & Mã NV & Ngày */}
        <div className="border-b border-slate-800 pb-2">
          <div className="flex items-center justify-between gap-1.5">
            <span className="font-bold text-white text-[13px] truncate">
              {employee.hoTen}
            </span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-teal-300 font-bold border border-slate-700 shrink-0">
              {employee.maNV}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
            <div className="flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span className="font-medium text-slate-300">{thu}, {d}/{m}/{y}</span>
            </div>
            {isToday && (
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[9px] border border-emerald-500/40">
                Hôm nay
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 truncate">
            {employee.chucVu || employee.boPhan}
          </div>
        </div>

        {/* Trạng thái công */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px]">Trạng thái:</span>
          <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1.5 ${statusBadgeClass}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusDotClass}`} />
            {statusLabel}
          </span>
        </div>

        {/* Grid Giờ vào & Giờ kết thúc */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
          {/* Vào làm */}
          <div className={`rounded-lg p-2 border ${isLate ? "bg-orange-950/30 border-orange-700/50" : "bg-slate-800/70 border-slate-700/50"}`}>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium mb-1">
              <LogIn className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Giờ vào làm</span>
            </div>
            <div className="font-bold font-mono text-[14px] text-white flex items-center gap-1">
              {gioVaoFormatted}
              {isLate && (
                <span className="text-[9px] font-bold text-orange-400 px-1 py-0.2 rounded bg-orange-500/20 border border-orange-500/40">
                  Trễ
                </span>
              )}
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5 truncate">
              {gioVaoSub}
            </div>
          </div>

          {/* Kết thúc */}
          <div className="rounded-lg bg-slate-800/70 p-2 border border-slate-700/50">
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium mb-1">
              <LogOut className="w-3 h-3 text-sky-400 shrink-0" />
              <span>Giờ kết thúc</span>
            </div>
            <div className="font-bold font-mono text-[14px] text-white">
              {gioRaFormatted}
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5 truncate">
              {gioRaSub}
            </div>
          </div>
        </div>

        {/* Tăng ca (OT) */}
        <div className={`rounded-lg p-2 flex items-center justify-between border ${soGioTangCa > 0 ? "bg-amber-950/40 border-amber-600/50 text-amber-200" : "bg-slate-800/40 border-slate-700/40 text-slate-300"}`}>
          <div className="flex items-center gap-1.5 text-[11px] font-medium">
            <Flame className={`w-3.5 h-3.5 shrink-0 ${soGioTangCa > 0 ? "text-amber-400 animate-pulse" : "text-slate-500"}`} />
            <span>Tăng ca:</span>
          </div>
          <span className={`font-bold font-mono text-xs ${soGioTangCa > 0 ? "text-amber-300" : "text-slate-400"}`}>
            {tangCaDetail}
          </span>
        </div>

        {/* Tổng thời gian làm việc */}
        {isDiLam && (
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
            <div className="flex items-center gap-1">
              <Clock3 className="w-3 h-3 text-teal-400 shrink-0" />
              <span>Tổng làm việc:</span>
            </div>
            <span className="font-semibold text-slate-200">{tongGioLam}</span>
          </div>
        )}

        {/* Ghi chú */}
        {record?.ghiChu && (
          <div className="text-[10px] text-slate-400 bg-slate-800/50 rounded p-1.5 border border-slate-700/40 italic">
            Ghi chú: {record.ghiChu}
          </div>
        )}
      </div>
    </div>
  );
}
