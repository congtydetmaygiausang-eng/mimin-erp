"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Clock3, Flame, X, Check, Trash2, Plus, Minus, CheckCircle2, ShieldCheck, Calendar, User, Briefcase } from "lucide-react";

interface TangCaModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (hours: number, ghiChu?: string) => Promise<boolean | void> | boolean | void;
  employee: {
    maNV: string;
    hoTen: string;
    boPhan: string;
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
  const [countdown, setCountdown] = useState<number>(4);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setHours(currentHours || 0);
      setNote(currentNote || "");
      setSuccessData(null);
      setCountdown(4);
    }
  }, [open, currentHours, currentNote]);

  // Đếm ngược tự động đóng sau khi hiển thị màn hình thành công rõ ràng
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
    // Nếu thành công (res !== false): chuyển sang màn hình thông báo thành công rực rỡ
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
      setCountdown(4);
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

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        className="relative w-full sm:max-w-md max-h-[92dvh] sm:max-h-[85vh] flex flex-col overflow-hidden rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ============================================================== */}
        {/* 1. MÀN HÌNH THÔNG BÁO TĂNG CA THÀNH CÔNG RÕ RÀNG, CHUYÊN NGHIỆP */}
        {/* ============================================================== */}
        {successData ? (
          <div className="flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header Xanh Ngọc Thành Công */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-5 py-4 text-white shrink-0 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-200" />
                <span className="text-sm font-bold tracking-wide uppercase">Xác Nhận Thành Công</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-1 text-white/80 hover:bg-white/20 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nội dung thông báo lớn rõ ràng */}
            <div className="p-5 sm:p-6 space-y-4 text-center">
              {/* Icon Checkmark lớn có hiệu ứng phát sáng */}
              <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/70 shadow-inner">
                <div className="absolute inset-0 rounded-full bg-emerald-400/25 animate-ping" />
                <CheckCircle2 className="relative h-12 w-12 text-emerald-600 dark:text-emerald-400" />
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  ĐÃ GHI NHẬN TĂNG CA THÀNH CÔNG!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Dữ liệu chấm công đã được hệ thống lưu trữ và đồng bộ vào bảng lương.
                </p>
              </div>

              {/* Badge số giờ tăng ca to rõ ràng */}
              <div className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-white shadow-lg shadow-orange-500/20">
                <Flame className="h-6 w-6 text-amber-100 animate-pulse" />
                <div className="text-left">
                  <div className="text-2xl sm:text-3xl font-black tracking-wide leading-none">
                    +{successData.hours} TIẾNG
                  </div>
                  <div className="text-[11px] font-semibold text-amber-100/90 mt-0.5">
                    ({successData.hours * 60} phút làm thêm)
                  </div>
                </div>
              </div>

              {/* Bảng chi tiết ghi nhận */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 p-3.5 text-xs text-left space-y-2">
                <div className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" /> Nhân sự:
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {employee.hoTen} ({employee.maNV})
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5" /> Bộ phận:
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {employee.boPhan}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> Ngày tăng ca:
                  </span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    {formattedDate}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5" /> Giờ xác nhận:
                  </span>
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {successData.time}
                  </span>
                </div>
                {successData.note && (
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-500 dark:text-slate-400">Ghi chú:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                      {successData.note}
                    </span>
                  </div>
                )}
              </div>

              {/* Thanh tiến trình tự động đóng */}
              <div className="space-y-1 pt-1">
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-1000 ease-linear rounded-full"
                    style={{ width: `${(countdown / 4) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Cửa sổ sẽ tự đóng sau {countdown} giây...
                </p>
              </div>

              {/* Nút Hoàn Tất To Rõ */}
              <button
                type="button"
                onClick={onClose}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-600/20 active:scale-98 transition cursor-pointer text-sm"
              >
                <Check className="h-4 w-4" />
                <span>ĐÃ HIỂU & ĐÓNG NGAY</span>
              </button>
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* 2. MÀN HÌNH CHỌN SỐ GIỜ TĂNG CA                                 */
          /* ============================================================== */
          <>
            {/* Mobile Pull Handle */}
            <div className="flex sm:hidden justify-center pt-2.5 pb-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600">
              <div className="w-10 h-1 rounded-full bg-white/40" />
            </div>

            {/* Header gradient cam năng động */}
            <div className="relative overflow-hidden bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-4 sm:px-5 py-3.5 text-white shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xs shadow-inner shrink-0">
                    <Flame className="h-5 w-5 text-white animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-bold leading-tight flex items-center gap-2 flex-wrap">
                      <span>Chấm Giờ Tăng Ca</span>
                      <span className="text-[11px] font-semibold bg-white/25 px-2 py-0.5 rounded-full">
                        {formattedDate}
                      </span>
                    </h3>
                    <p className="text-xs text-white/90 mt-0.5 truncate">
                      {employee.hoTen} ({employee.maNV}) · {employee.boPhan}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="rounded-xl p-1.5 text-white/80 transition hover:bg-white/20 hover:text-white shrink-0 ml-2"
                  aria-label="Đóng"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Nội dung chính - Tối ưu cho PWA di động */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 overscroll-contain">
              {/* Box hiển thị số giờ to rõ + nút tăng giảm nhanh */}
              <div className="rounded-2xl border-2 border-amber-400/80 bg-gradient-to-b from-amber-50/90 to-orange-50/50 p-4 dark:border-amber-600/60 dark:from-amber-950/40 dark:to-slate-900 shadow-xs">
                <div className="text-center text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-2">
                  Số giờ tăng ca hôm nay
                </div>
                <div className="flex items-center justify-center gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => handleAdjust(-0.5)}
                    disabled={hours <= 0 || submitting}
                    className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-white text-amber-700 shadow-md hover:bg-amber-100 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition dark:bg-slate-800 dark:text-amber-400 border border-amber-200 dark:border-amber-700"
                    aria-label="Giảm 0.5 giờ"
                  >
                    <Minus className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>

                  <div className="min-w-[130px] sm:min-w-[150px] text-center">
                    <div className="flex items-baseline justify-center gap-1.5">
                      <span className="text-3xl sm:text-4xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
                        {hours}
                      </span>
                      <span className="text-sm sm:text-base font-bold text-amber-800/80 dark:text-amber-300">
                        tiếng
                      </span>
                    </div>
                    <div className="text-[11px] font-medium text-amber-700/70 dark:text-amber-400/70 mt-0.5">
                      {hours > 0 ? `(${Math.round(hours * 60)} phút)` : "Chưa chọn giờ"}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAdjust(0.5)}
                    disabled={hours >= 24 || submitting}
                    className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md hover:bg-amber-600 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition"
                    aria-label="Tăng 0.5 giờ"
                  >
                    <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                </div>
              </div>

              {/* Danh sách chọn nhanh số giờ */}
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Clock3 className="h-3.5 w-3.5 text-amber-500" />
                    <span>Chọn nhanh số giờ:</span>
                  </span>
                  {currentHours > 0 && (
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                      Chạm đã chọn: {currentHours}h
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {QUICK_HOURS.map((h) => {
                    const isSelected = hours === h;
                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setHours(h)}
                        disabled={submitting}
                        className={`py-2 px-1 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 border active:scale-95 touch-manipulation ${
                          isSelected
                            ? "bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-400/30"
                            : "bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700"
                        }`}
                      >
                        <span>+{h}h</span>
                        <span className="text-[9px] font-normal opacity-75">{h * 60}p</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ô nhập số giờ tùy biến nếu muốn nhập số lẻ */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
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
                    placeholder="Nhập số giờ (VD: 1.25, 2.5...)"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 px-3.5 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-semibold text-slate-400">
                    giờ
                  </span>
                </div>
              </div>

              {/* Ghi chú nội dung tăng ca */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Ghi chú công việc (tùy chọn):
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="VD: May gấp đơn hàng, đóng bao bì..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-3.5 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
              <div className="flex items-center justify-between sm:justify-start">
                {currentHours > 0 ? (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void handleSubmit(0)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Xóa tăng ca (về 0h)</span>
                  </button>
                ) : (
                  <span className="text-xs text-slate-400">
                    Chạm chọn số giờ để ghi nhận
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white bg-slate-200/70 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={submitting || hours < 0}
                  onClick={() => void handleSubmit(hours)}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl shadow-md transition active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  <span>{submitting ? "Đang ghi nhận..." : `Xác nhận tăng ca (${hours}h)`}</span>
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
