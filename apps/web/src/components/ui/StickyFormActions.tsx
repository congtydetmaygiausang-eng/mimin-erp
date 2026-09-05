"use client";

import React from "react";
import { Check, X, Loader2 } from "lucide-react";

export interface StickyFormActionsProps {
  onSave?: () => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  disabled?: boolean;
  saveText?: string;
  cancelText?: string;
  extra?: React.ReactNode;
  infoMessage?: string;
  className?: string;
}

export function StickyFormActions({
  onSave,
  onCancel,
  isSubmitting = false,
  disabled = false,
  saveText = "Lưu thay đổi",
  cancelText = "Hủy",
  extra,
  infoMessage,
  className = "",
}: StickyFormActionsProps) {
  return (
    <div
      className={`sticky bottom-0 z-30 -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 py-3.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-lg flex items-center justify-between gap-3 mt-8 transition-all ${className}`}
    >
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        {infoMessage ? (
          <span>{infoMessage}</span>
        ) : (
          <span className="hidden sm:inline">Hãy kiểm tra kỹ các thông tin trước khi nhấn lưu.</span>
        )}
      </div>

      <div className="flex items-center gap-2.5 ml-auto">
        {extra}
        
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
        )}

        {onSave && (
          <button
            type="button"
            onClick={onSave}
            disabled={disabled || isSubmitting}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-sm shadow-teal-600/30 transition-all active:scale-95 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>{saveText}</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default StickyFormActions;
