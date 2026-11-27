"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Clock3, Flame, X, Check, Trash2, Plus, Minus } from "lucide-react";

interface TangCaModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (hours: number, ghiChu?: string) => Promise<void> | void;
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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setHours(currentHours || 0);
      setNote(currentNote || "");
    }
  }, [open, currentHours, currentNote]);

  if (!open || !mounted) return null;

  const handleSubmit = async (targetHours: number) => {
    await onConfirm(Math.max(0, targetHours), note.trim() || undefined);
    onClose();
  };

  const handleAdjust = (delta: number) => {
    setHours((prev) => Math.max(0, Math.min(24, Math.round((prev + delta) * 10) / 10)));
  };

  const formattedDate = (() => {
    try {
      const parts = todayStr.split("-");
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    } catch {
      // fallback
    }
    return todayStr;
  })();

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        className="relative w-full sm:max-w-md max-h-[92dvh] sm:max-h-[85vh] flex flex-col overflow-hidden rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
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
                disabled={submitting || hours <= 0}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shadow-sm active:scale-90 transition disabled:opacity-40 disabled:pointer-events-none hover:bg-amber-100/50"
                title="Giảm 0.5 giờ"
              >
                <Minus className="h-5 w-5" />
              </button>

              <div className="min-w-[120px] text-center">
                <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-amber-600 dark:text-amber-400">
                  {hours}
                </span>
                <span className="ml-1 text-sm sm:text-base font-bold text-amber-700/80 dark:text-amber-300">
                  tiếng
                </span>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  ({Math.round(hours * 60)} phút)
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleAdjust(0.5)}
                disabled={submitting || hours >= 24}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm active:scale-90 transition disabled:opacity-40 disabled:pointer-events-none hover:bg-amber-600"
                title="Tăng 0.5 giờ"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Chọn nhanh số giờ */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5 text-amber-600" />
                <span>Chọn nhanh số giờ:</span>
              </span>
              <span className="text-[11px] font-normal text-slate-500">Chạm để chọn</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {QUICK_HOURS.map((h) => {
                const isSelected = hours === h;
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHours(h)}
                    className={`py-2.5 px-1 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 border active:scale-95 touch-manipulation ${
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
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition"
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
              className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white bg-slate-200/70 hover:bg-slate-200 rounded-xl transition"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={submitting || hours < 0}
              onClick={() => void handleSubmit(hours)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl shadow-md transition active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              <Check className="h-4 w-4" />
              <span>{submitting ? "Đang lưu..." : `Xác nhận tăng ca (${hours}h)`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
