"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Clock3, X, Check, Trash2, Plus, Minus, CheckCircle2, Calendar, User, Briefcase, Flame, ShieldAlert } from "lucide-react";

interface TangCaModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (hours: number, ghiChu?: string) => Promise<boolean | void> | boolean | void;
  employee: {
    maNV: string;
    hoTen: string;
    boPhan: string;
    chucVu?: string;
  };
  currentHours?: number;
  currentNote?: string;
  todayStr: string;
  submitting?: boolean;
}

const QUICK_HOURS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4];

export function TangCaModal({
  open,
  onClose,
  onConfirm,
  employee,
  currentHours = 0,
  currentNote = "",
  todayStr,
  submitting = false,
}: TangCaModalProps) {
  const [mounted, setMounted] = useState(false);
  const [hours, setHours] = useState<number>(currentHours);
  const [note, setNote] = useState<string>(currentNote);
  const [successData, setSuccessData] = useState<{
    hours: number;
    time: string;
    note?: string;
  } | null>(null);
  const [countdown, setCountdown] = useState<number>(3);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setHours(currentHours || 0);
      setNote(currentNote || "");
      setSuccessData(null);
      setCountdown(3);
    }
  }, [open, currentHours, currentNote]);

  // Đếm ngược tự động đóng sau khi hiển thị màn hình thành công
  useEffect(() => {
    if (!successData) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [successData, onClose]);

  if (!open || !mounted) return null;

  const handleSubmit = async (targetHours: number) => {
    const cleanHours = Math.max(0, Math.round(Number(targetHours) * 100) / 100);

    // Nếu xóa về 0h thì đóng ngay
    if (cleanHours === 0) {
      await onConfirm(0, note.trim() || undefined);
      onClose();
      return;
    }

    const res = await onConfirm(cleanHours, note.trim() || undefined);
    // Nếu thành công (res !== false): chuyển sang màn hình thông báo rõ ràng
    if (res !== false) {
      const timeStr = new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setSuccessData({
        hours: cleanHours,
        time: timeStr,
        note: note.trim() || undefined,
      });
      setCountdown(3);
    }
  };

  const handleAdjust = (delta: number) => {
    setHours((prev) => Math.max(0, Math.min(24, Math.round((prev + delta) * 10) / 10)));
  };

  const formattedDate = (() => {
    try {
      const parts = todayStr.split("-");
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    } catch {}
    return todayStr;
  })();

  const chucVuDisplay = employee.chucVu || "Nhân viên";

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        className="relative w-full sm:max-w-lg max-h-[94dvh] sm:max-h-[90vh] flex flex-col overflow-hidden rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border-2 border-amber-500/30 dark:border-amber-500/20 animate-in slide-in-from-bottom sm:zoom-in-95 duration-150 pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ============================================================== */}
        {/* 1. MÀN HÌNH THÔNG BÁO TĂNG CA THÀNH CÔNG                       */}
        {/* ============================================================== */}
        {successData ? (
          <div className="flex flex-col">
            {/* Header thông báo */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-200 dark:border-emerald-800 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-xs">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-wide leading-tight">
                    Xác Nhận Tăng Ca Thành Công
                  </h3>
                  <p className="text-xs font-semibold text-emerald-100">
                    Dữ liệu đã được ghi nhận vào bảng chấm công
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-white/80 hover:text-white hover:bg-white/20 transition cursor-pointer"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nội dung kết quả to rõ, chữ đậm */}
            <div className="p-5 sm:p-6 space-y-4 text-center">
              {/* Badge số giờ tăng ca cực đậm */}
              <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700 p-4 shadow-xs">
                <div className="text-xs font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  Tổng thời gian làm thêm
                </div>
                <div className="mt-1 flex items-baseline justify-center gap-2">
                  <span className="text-4xl sm:text-5xl font-black text-amber-600 dark:text-amber-400">
                    +{successData.hours}
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-200">
                    tiếng
                  </span>
                </div>
                <div className="text-sm font-black text-amber-700 dark:text-amber-300 mt-0.5">
                  ({successData.hours * 60} phút làm việc thực tế)
                </div>
              </div>

              {/* Bảng chi tiết định danh nhân sự to rõ */}
              <div className="rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-4 text-left space-y-2.5">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <User className="h-4 w-4 text-slate-400" /> Họ và tên:
                  </span>
                  <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    {employee.hoTen}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4 text-slate-400" /> Mã nhân sự:
                  </span>
                  <span className="text-xs sm:text-sm font-black bg-slate-900 text-white dark:bg-slate-700 px-2.5 py-0.5 rounded-md">
                    {employee.maNV}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4 text-slate-400" /> Chức vụ:
                  </span>
                  <span className="text-xs sm:text-sm font-black bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 px-2.5 py-0.5 rounded-md border border-amber-300 dark:border-amber-800">
                    {chucVuDisplay}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    Bộ phận:
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                    {employee.boPhan}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-slate-400" /> Ngày tăng ca:
                  </span>
                  <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                    {formattedDate}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Clock3 className="h-4 w-4 text-slate-400" /> Thời gian xác nhận:
                  </span>
                  <span className="text-xs sm:text-sm font-mono font-black text-slate-800 dark:text-slate-200">
                    {successData.time}
                  </span>
                </div>

                {successData.note && (
                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Ghi chú:</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[220px]">
                      {successData.note}
                    </span>
                  </div>
                )}
              </div>

              {/* Tiến trình tự động đóng */}
              <div className="space-y-1.5">
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full transition-all duration-1000 ease-linear rounded-full"
                    style={{ width: `${(countdown / 3) * 100}%` }}
                  />
                </div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Cửa sổ sẽ tự đóng sau {countdown} giây...
                </p>
              </div>

              {/* Nút đóng nổi bật */}
              <button
                type="button"
                onClick={onClose}
                className="w-full h-12 py-3 px-4 rounded-xl font-black text-white bg-emerald-600 hover:bg-emerald-700 transition cursor-pointer text-sm sm:text-base shadow-md active:scale-98"
              >
                ĐÃ HIỂU & ĐÓNG NGAY
              </button>
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* 2. MÀN HÌNH CHỌN SỐ GIỜ TĂNG CA - CHỮ ĐẬM TO RÕ TRÊN MOBILE     */
          /* ============================================================== */
          <>
            {/* Mobile Pull Handle */}
            <div className="flex sm:hidden justify-center pt-2.5 pb-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600">
              <div className="w-12 h-1.5 rounded-full bg-white/40" />
            </div>

            {/* Header nổi bật với màu cam ấm áp */}
            <div className="flex items-center justify-between border-b border-amber-600/40 px-4 sm:px-5 py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xs text-white shrink-0 shadow-xs">
                  <Flame className="h-5 w-5 sm:h-6 sm:w-6 animate-pulse" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-black leading-tight flex items-center gap-2 flex-wrap">
                    <span>CHẤM GIỜ TĂNG CA</span>
                    <span className="text-xs font-extrabold bg-white/25 text-white px-2.5 py-0.5 rounded-full shadow-xs">
                      {formattedDate}
                    </span>
                  </h3>
                  <p className="text-xs font-semibold text-amber-100 mt-0.5">
                    Hệ thống ghi nhận làm thêm giờ và tính lương
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-black/15 hover:bg-black/30 text-white flex items-center justify-center transition shrink-0 ml-2 cursor-pointer"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nội dung chính cuộn mượt mà trên mobile */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 overscroll-contain">
              {/* Card Định Danh Nhân Sự: ĐẬM, TO, ĐẦY ĐỦ HỌ TÊN - MÃ NV - CHỨC VỤ */}
              <div className="rounded-2xl border-2 border-amber-300 dark:border-amber-700/70 bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-white dark:from-slate-800 dark:via-slate-850 dark:to-slate-900 p-3.5 sm:p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-1.5 mb-0.5">
                      <User className="h-3.5 w-3.5" />
                      <span>Nhân sự thực hiện tăng ca:</span>
                    </div>

                    {/* Họ và tên to đậm */}
                    <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-wide leading-tight">
                      {employee.hoTen}
                    </div>

                    {/* Hàng badge: Mã NV - Chức vụ - Bộ phận */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-900 text-white dark:bg-slate-700 dark:text-white text-xs font-black shadow-xs">
                        Mã NV: {employee.maNV}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 text-white dark:bg-amber-600 dark:text-white text-xs font-black shadow-xs">
                        <Briefcase className="h-3.5 w-3.5" />
                        Chức vụ: {chucVuDisplay}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-300 dark:border-slate-700 shadow-2xs">
                        Bộ phận: {employee.boPhan}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Box hiển thị số giờ tăng ca chính - Chữ to, nút bấm lớn cho điện thoại */}
              <div className="rounded-2xl border-2 border-amber-300/80 dark:border-amber-700/60 bg-amber-50/60 dark:bg-amber-950/20 p-4 text-center">
                <div className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-900 dark:text-amber-300 mb-2.5">
                  Số Giờ Tăng Ca Hôm Nay
                </div>
                <div className="flex items-center justify-center gap-3 sm:gap-5">
                  {/* Nút giảm 0.5h */}
                  <button
                    type="button"
                    onClick={() => handleAdjust(-0.5)}
                    disabled={hours <= 0 || submitting}
                    className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm hover:bg-slate-100 active:scale-90 disabled:opacity-30 disabled:pointer-events-none transition border-2 border-slate-300 dark:border-slate-600 cursor-pointer"
                    aria-label="Giảm 0.5 giờ"
                  >
                    <Minus className="h-5 w-5 sm:h-6 sm:w-6 stroke-[3]" />
                  </button>

                  {/* Hiển thị số giờ to đậm */}
                  <div className="min-w-[130px] sm:min-w-[150px] text-center">
                    <div className="flex items-baseline justify-center gap-1.5">
                      <span className="text-4xl sm:text-5xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
                        {hours}
                      </span>
                      <span className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-200">
                        tiếng
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm font-black text-amber-800 dark:text-amber-300 mt-1">
                      {hours > 0 ? `(${Math.round(hours * 60)} phút làm thêm)` : "Chưa chọn giờ"}
                    </div>
                  </div>

                  {/* Nút tăng 0.5h */}
                  <button
                    type="button"
                    onClick={() => handleAdjust(0.5)}
                    disabled={hours >= 24 || submitting}
                    className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-90 text-white shadow-md disabled:opacity-30 disabled:pointer-events-none transition border-2 border-amber-600 cursor-pointer"
                    aria-label="Tăng 0.5 giờ"
                  >
                    <Plus className="h-5 w-5 sm:h-6 sm:w-6 stroke-[3]" />
                  </button>
                </div>
              </div>

              {/* Danh sách 8 nút chọn nhanh số giờ - Kích thước lớn, chữ đậm, chống bấm nhầm */}
              <div>
                <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                  <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Clock3 className="h-4 w-4 text-amber-600" />
                    <span>Chọn nhanh số giờ:</span>
                  </span>
                  {currentHours > 0 && (
                    <span className="text-xs font-black text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/70 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-800">
                      Hiện tại: {currentHours}h
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
                  {QUICK_HOURS.map((h) => {
                    const isSelected = hours === h;
                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setHours(h)}
                        disabled={submitting}
                        className={`min-h-[58px] sm:min-h-[62px] p-2 rounded-xl transition-all duration-150 flex flex-col items-center justify-center gap-0.5 border-2 active:scale-95 touch-manipulation cursor-pointer ${
                          isSelected
                            ? "bg-amber-500 text-white border-amber-600 ring-4 ring-amber-400/40 shadow-md scale-[1.03]"
                            : "bg-white text-slate-900 border-slate-300 hover:border-amber-400 hover:bg-amber-50/50 dark:bg-slate-800 dark:text-white dark:border-slate-700"
                        }`}
                      >
                        <span className="text-base sm:text-lg font-black tracking-tight leading-none">
                          +{h}h
                        </span>
                        <span className={`text-[11px] font-extrabold ${isSelected ? "text-amber-100" : "text-slate-500 dark:text-slate-400"}`}>
                          {h * 60}p
                        </span>
                        {isSelected && (
                          <span className="text-[9px] font-black uppercase tracking-wider text-amber-100 bg-black/20 px-1 rounded mt-0.5">
                            Đã chọn
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ô nhập số giờ tùy chỉnh */}
              <div>
                <label className="block text-xs sm:text-sm font-black text-slate-900 dark:text-white mb-1.5">
                  Hoặc nhập số giờ tùy chỉnh:
                </label>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.25"
                    min="0"
                    max="24"
                    value={hours === 0 ? "" : hours}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setHours(isNaN(val) ? 0 : Math.max(0, Math.min(24, val)));
                    }}
                    placeholder="VD: 1.25, 2.5..."
                    className="w-full h-12 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-base sm:text-lg font-black text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                  <span className="absolute right-4 top-3 text-sm font-black text-slate-500 dark:text-slate-400">
                    giờ
                  </span>
                </div>
              </div>

              {/* Ghi chú nội dung tăng ca */}
              <div>
                <label className="block text-xs sm:text-sm font-black text-slate-900 dark:text-white mb-1.5">
                  Ghi chú công việc (tùy chọn):
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="VD: May gấp đơn hàng, đóng bao bì..."
                  className="w-full h-11 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs sm:text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>
            </div>

            {/* Footer Actions: Các nút to, rõ, dễ bấm trên điện thoại */}
            <div className="border-t-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 p-3.5 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
              <div className="flex items-center justify-between sm:justify-start">
                {currentHours > 0 ? (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void handleSubmit(0)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-black text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Xóa tăng ca (về 0h)</span>
                  </button>
                ) : (
                  <span className="text-xs font-bold text-slate-400">
                    Chạm chọn số giờ để lưu
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={onClose}
                  className="flex-1 sm:flex-none h-12 px-5 text-sm font-black text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={submitting || hours < 0}
                  onClick={() => void handleSubmit(hours)}
                  className="flex-1 sm:flex-none h-12 inline-flex items-center justify-center gap-2 px-6 text-sm sm:text-base font-black text-white bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 rounded-xl shadow-lg transition active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer tracking-wide"
                >
                  <Check className="h-5 w-5 stroke-[3]" />
                  <span>{submitting ? "Đang lưu..." : `Xác nhận tăng ca (${hours}h)`}</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
