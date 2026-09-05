"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

export interface DetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
}

const WIDTH_CLASSES = {
  sm: "max-w-md",       // ~448px
  md: "max-w-xl",       // ~576px (chuẩn default)
  lg: "max-w-2xl",      // ~672px
  xl: "max-w-4xl",      // ~896px
  full: "max-w-full",
};

export function DetailDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  children,
  footer,
  width = "md",
  className = "",
}: DetailDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Nhấn ESC để đóng drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      // Khóa cuộn trang chính khi drawer mở
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
      {/* Backdrop mờ để vừa tập trung vừa quan sát được bảng phía sau */}
      <div
        className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
        <div
          ref={drawerRef}
          className={`w-screen ${WIDTH_CLASSES[width]} bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col transform transition-transform duration-300 ease-in-out ${className}`}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate tracking-tight">
                  {title}
                </h3>
                {badge && <div className="shrink-0">{badge}</div>}
              </div>
              {subtitle && (
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Đóng bảng chi tiết"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content - Scroll độc lập */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {children}
          </div>

          {/* Footer (nếu có hành động) */}
          {footer && (
            <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-end gap-2.5">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DetailDrawer;
