"use client";

import { useState, useEffect, useRef } from "react";
import {
  Bell,
  X,
  Check,
  AlertTriangle,
  Calendar,
  Package,
  ShoppingCart,
  TrendingDown,
  Info,
  CheckCircle2,
  XCircle,
  BellOff,
  Settings,
  Database,
} from "lucide-react";
import { useNotification, type NotificationType, useAutoNotify } from "@/lib/notification-store";
import { SupabaseSetupWizard } from "./SupabaseSetupWizard";

const TYPE_STYLE: Record<NotificationType, { icon: any; color: string; bg: string }> = {
  late: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-500/15" },
  due_soon: { icon: Calendar, color: "text-amber-600", bg: "bg-amber-500/15" },
  new_order: { icon: ShoppingCart, color: "text-sky-600", bg: "bg-sky-500/15" },
  qc_fail: { icon: XCircle, color: "text-red-600", bg: "bg-red-500/15" },
  low_stock: { icon: Package, color: "text-amber-600", bg: "bg-amber-500/15" },
  info: { icon: Info, color: "text-blue-600", bg: "bg-blue-500/15" },
  success: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-500/15" },
  warning: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-500/15" },
  error: { icon: XCircle, color: "text-red-600", bg: "bg-red-500/15" },
};

export function NotificationBell() {
  const { notifications, unread, markAsRead, markAllAsRead, clear, permission, requestPermission } = useNotification();
  const [open, setOpen] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Auto check notifications
  useAutoNotify();

  // Click outside to close
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <>
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="relative p-2 rounded-lg hover:bg-white/40 dark:hover:bg-white/5 transition"
          aria-label="Thông báo"
        >
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 animate-pulse">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-96 max-h-[70vh] bg-white dark:bg-slate-900 card shadow-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden z-50 animate-fade-in">
            <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Bell className="w-4 h-4 text-brand-500" /> Thông báo
                {unread > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500 text-white font-bold">{unread} mới</span>}
              </h3>
              <div className="flex items-center gap-1">
                {unread > 0 && (
                  <button onClick={markAllAsRead} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 flex items-center gap-0.5">
                    <Check className="w-3 h-3" /> Đọc hết
                  </button>
                )}
                <button onClick={() => setShowWizard(true)} className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/15 text-brand-700 hover:bg-brand-500/25 flex items-center gap-0.5" title="Setup Supabase">
                  <Database className="w-3 h-3" />
                </button>
                <button onClick={clear} className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-700 hover:bg-red-500/25" title="Xoá hết">
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Permission banner */}
            {permission !== "granted" && (
              <div className="p-3 bg-amber-500/10 border-b border-amber-500/30 flex items-center gap-2">
                <BellOff className="w-4 h-4 text-amber-600 shrink-0" />
                <div className="text-xs flex-1">
                  <b className="text-amber-700">Chưa bật thông báo</b>
                  <button onClick={requestPermission} className="ml-2 underline text-amber-700 hover:text-amber-900">Bật ngay</button>
                </div>
              </div>
            )}

            <div className="overflow-y-auto max-h-96">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-sm opacity-50">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Chưa có thông báo nào
                </div>
              ) : (
                notifications.slice(0, 30).map((n) => {
                  const s = TYPE_STYLE[n.type];
                  const Icon = s.icon;
                  return (
                    <button
                      key={n.id}
                      onClick={() => {
                        markAsRead(n.id);
                        if (n.link) {
                          setOpen(false);
                          window.location.href = n.link;
                        }
                      }}
                      className={`w-full text-left p-3 border-b flex items-start gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition ${!n.read ? "bg-brand-500/5" : ""}`}
                      style={{ borderColor: "var(--border)" }}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${s.bg}`}>
                        <Icon className={`w-4 h-4 ${s.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-xs text-slate-800 dark:text-slate-100 flex-1 truncate">{n.title}</div>
                          {!n.read && <div className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 truncate">{n.body}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{new Date(n.createdAt).toLocaleString("vi-VN")}</div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {showWizard && <SupabaseSetupWizard onClose={() => setShowWizard(false)} />}
    </>
  );
}
