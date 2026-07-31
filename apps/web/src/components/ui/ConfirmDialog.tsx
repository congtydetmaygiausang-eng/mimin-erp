"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";

export type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary" | "warning";
  loading?: boolean;
};

/**
 * Modal xác nhận dùng chung - thay thế window.confirm()
 * Dùng design system: glassmorphism, btn-primary gradient, sky/teal
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Xác nhận",
  cancelLabel = "Huỷ",
  variant = "primary",
  loading = false,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
      if (e.key === "Enter" && !loading) onConfirm();
    };
    document.addEventListener("keydown", onKey);
    // Focus dialog when open (a11y)
    setTimeout(() => dialogRef.current?.focus(), 50);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, onConfirm, loading]);

  if (!open) return null;

  const variantStyle = {
    danger: { icon: "text-rose-600", iconBg: "bg-rose-500/10", btn: "bg-rose-500 hover:bg-rose-600" },
    warning: { icon: "text-amber-600", iconBg: "bg-amber-500/10", btn: "bg-amber-500 hover:bg-amber-600" },
    primary: { icon: "text-brand-500", iconBg: "bg-brand-500/10", btn: "btn-primary" },
  }[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !loading && onClose()} />
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="relative card max-w-md w-full p-6 animate-slide-up focus:outline-none"
      >
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full ${variantStyle.iconBg} flex items-center justify-center shrink-0`}>
            <AlertTriangle className={`w-5 h-5 ${variantStyle.icon}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="confirm-title" className="text-base font-bold mb-1">
              {title}
            </h3>
            {description && (
              <p className="text-sm opacity-70 mb-4 whitespace-pre-line">
                {description}
              </p>
            )}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="btn-secondary text-sm disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className={`${variantStyle.btn} text-sm text-white font-semibold px-4 py-2 rounded-xl inline-flex items-center gap-1.5 disabled:opacity-50`}
              >
                {loading && (
                  <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {confirmLabel}
              </button>
            </div>
          </div>
          <button
            onClick={() => !loading && onClose()}
            disabled={loading}
            aria-label="Đóng"
            className="p-1 rounded hover:bg-white/30 disabled:opacity-30"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
