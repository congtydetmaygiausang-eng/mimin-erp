"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Clock3, X, Check, Trash2, Plus, Minus, CheckCircle2, Calendar, User, Briefcase } from "lucide-react";

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

  // Đếm ngược tự động đóng sau khi hiển thị màn hình thành công chuẩn ERP
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
    // Nếu thành công (res !== false): chuyển sang màn hình thông báo chuẩn ERP
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

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        className="relative w-full sm:max-w-md max-h-[92dvh] sm:max-h-[85vh] flex flex-col overflow-hidden rounded-t-2xl sm:rounded-xl bg-white shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom sm:zoom-in-95 duration-150 pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ============================================================== */}
        {/* 1. MÀN HÌNH THÔNG BÁO TĂNG CA THÀNH CÔNG - CHUẨN ERP TINH GỌN   */}
        {/* ============================================================== */}
        {successData ? (
          <div className="flex flex-col">
            {/* Header thanh lịch */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Xác Nhận Tăng Ca Thành Công</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition"
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Nội dung chuẩn ERP - Rõ ràng, tối giản, chuyên nghiệp */}
            <div className="p-5 space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Đã Ghi Nhận Giờ Tăng Ca
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Dữ liệu đã được lưu trữ và cập nhật vào bảng lương tháng.
                </p>
              </div>

              {/* Badge số giờ tăng ca thanh lịch */}
              <div className="inline-flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 px-4 py-2 text-amber-900 dark:text-amber-200">
                <Clock3 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span className="text-base font-bold">+{successData.hours} tiếng</span>
                <span className="text-xs text-amber-700/80 dark:text-amber-300/80">({successData.hours * 60} phút)</span>
              </div>

              {/* Bảng chi tiết ghi nhận chuẩn ERP */}
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-3 text-xs text-left space-y-2">
                <div className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" /> Nhân sự:
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {employee.hoTen} ({employee.maNV})
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5" /> Bộ phận:
                  </span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {employee.boPhan}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> Ngày tăng ca:
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formattedDate}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5" /> Giờ xác nhận:
                  </span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {successData.time}
                  </span>
                </div>
                {successData.note && (
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-500 dark:text-slate-400">Ghi chú:</span>
                    <span className="text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                      {successData.note}
                    </span>
                  </div>
                )}
              </div>

              {/* Tiến trình tự động đóng nhẹ nhàng */}
              <div className="space-y-1">
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-teal-600 h-full transition-all duration-1000 ease-linear rounded-full"
                    style={{ width: `${(countdown / 3) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Cửa sổ tự đóng sau {countdown}s...
                </p>
              </div>

              {/* Nút đóng chuẩn ERP */}
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-lg font-semibold text-white bg-teal-600 hover:bg-teal-700 transition cursor-pointer text-xs sm:text-sm shadow-xs"
              >
                Đã hiểu & Đóng
              </button>
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* 2. MÀN HÌNH CHỌN SỐ GIỜ TĂNG CA - CHUẨN ERP TRANG NHÃ           */
          /* ============================================================== */
          <>
            {/* Mobile Pull Handle */}
            <div className="flex sm:hidden justify-center pt-2 pb-1 bg-slate-50 dark:bg-slate-850">
              <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            </div>

            {/* Header chuẩn ERP */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-3.5 bg-slate-50 dark:bg-slate-850 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60 shrink-0">
                  <Clock3 className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-2 flex-wrap">
                    <span>Chấm Giờ Tăng Ca</span>
                    <span className="text-[11px] font-semibold bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 py-0.2 rounded">
                      {formattedDate}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {employee.hoTen} ({employee.maNV}) · {employee.boPhan}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition shrink-0 ml-2"
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Nội dung chính */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 overscroll-contain">
              {/* Box hiển thị số giờ chuẩn ERP */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 p-3.5 text-center">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Số giờ tăng ca hôm nay
                </div>
                <div className="flex items-center justify-center gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => handleAdjust(-0.5)}
                    disabled={hours <= 0 || submitting}
                    className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-100 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition border border-slate-300 dark:border-slate-600"
                    aria-label="Giảm 0.5 giờ"
                  >
                    <Minus className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>

                  <div className="min-w-[120px] sm:min-w-[140px] text-center">
                    <div className="flex items-baseline justify-center gap-1.5">
                      <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {hours}
                      </span>
                      <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                        giờ
                      </span>
                    </div>
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                      {hours > 0 ? `(${Math.round(hours * 60)} phút làm thêm)` : "Chưa chọn giờ"}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAdjust(0.5)}
                    disabled={hours >= 24 || submitting}
                    className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-lg bg-teal-600 text-white shadow-xs hover:bg-teal-700 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition"
                    aria-label="Tăng 0.5 giờ"
                  >
                    <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>
              </div>

              {/* Danh sách chọn nhanh số giờ */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Clock3 className="h-3.5 w-3.5 text-slate-400" />
                    <span>Chọn nhanh số giờ:</span>
                  </span>
                  {currentHours > 0 && (
                    <span className="text-[11px] text-teal-700 dark:text-teal-400 font-semibold">
                      Hiện tại: {currentHours}h
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                  {QUICK_HOURS.map((h) => {
                    const isSelected = hours === h;
                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setHours(h)}
                        disabled={submitting}
                        className={`py-2 px-1 rounded-lg text-xs font-semibold transition flex flex-col items-center justify-center gap-0.5 border active:scale-95 touch-manipulation ${
                          isSelected
                            ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                            : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-750"
                        }`}
                      >
                        <span className="font-bold">+{h}h</span>
                        <span className="text-[9px] opacity-75">{h * 60}p</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ô nhập số giờ tùy chỉnh */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400">
                    giờ
                  </span>
                </div>
              </div>

              {/* Ghi chú nội dung tăng ca */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ghi chú công việc (tùy chọn):
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="VD: May gấp đơn hàng, đóng bao bì..."
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
              <div className="flex items-center justify-between sm:justify-start">
                {currentHours > 0 ? (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void handleSubmit(0)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Xóa tăng ca (0h)</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400">
                    Chọn số giờ để lưu tăng ca
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white bg-slate-200/80 hover:bg-slate-200 dark:bg-slate-800 rounded-lg transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={submitting || hours < 0}
                  onClick={() => void handleSubmit(hours)}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>{submitting ? "Đang lưu..." : `Xác nhận (+${hours}h)`}</span>
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
