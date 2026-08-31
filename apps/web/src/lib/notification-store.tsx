"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Bell, X, AlertTriangle, Calendar, Package, TrendingUp, DollarSign, CheckCircle2, XCircle, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

export type NotificationType = "late" | "due_soon" | "new_order" | "qc_fail" | "low_stock" | "info" | "success" | "warning" | "error";

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  read: boolean;
  createdAt: string;
  data?: any;
};

type NotiContext = {
  notifications: Notification[];
  unread: number;
  addNotification: (n: Omit<Notification, "id" | "read" | "createdAt">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clear: () => void;
  permission: NotificationPermission;
  requestPermission: () => Promise<void>;
};

const Ctx = createContext<NotiContext | null>(null);
const STORAGE_KEY = "mimin_notifications_v1";

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  // Load
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Notification[];
        setNotifications(parsed);
      }
    } catch {}
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Save
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, 100)));  // Max 100
    } catch {}
  }, [notifications]);

  const addNotification = useCallback((n: Omit<Notification, "id" | "read" | "createdAt">) => {
    const noti: Notification = {
      ...n,
      id: `NOTI-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [noti, ...prev]);
    // Trigger system notification nếu có permission và đã bật thông báo
    const isEnabledLocal = localStorage.getItem("mimin_notifications_enabled") === "true";
    if (isEnabledLocal && typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(n.title, { body: n.body, icon: "/icons/icon-192.png", tag: noti.id });
      } catch {}
    }
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clear = useCallback(() => {
    setNotifications([]);
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("Trình duyệt không hỗ trợ notification");
      return;
    }
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted") {
        toast.success("Đã bật thông báo!");
        // Test notification
        setTimeout(() => {
          new Notification("MIMIN ERP", {
            body: "Thông báo đã được bật! Bạn sẽ nhận cảnh báo trễ hạn, đến hạn, tồn kho thấp…",
            icon: "/icons/icon-192.png",
          });
        }, 500);
      } else {
        toast.error("Bạn đã từ chối bật thông báo");
      }
    } catch (e) {
      toast.error("Lỗi khi bật thông báo");
    }
  }, []);

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <Ctx.Provider value={{ notifications, unread, addNotification, markAsRead, markAllAsRead, clear, permission, requestPermission }}>
      {children}
    </Ctx.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useNotification must be used within NotificationProvider");
  return ctx;
}

// Auto-trigger notifications từ data localStorage
export function useAutoNotify() {
  const { addNotification, notifications } = useNotification();
  useEffect(() => {
    if (typeof window === "undefined") return;
    const checkAndNotify = () => {
      try {
        // Check phanCong
        const pcRaw = localStorage.getItem("mimin_phanCong_v1");
        if (pcRaw) {
          const phanCong = JSON.parse(pcRaw);
          const today = new Date().toISOString().split("T")[0];
          const newLates: typeof phanCong = [];
          for (const pc of phanCong) {
            if (pc.trangThai === "Đã thanh toán" || pc.trangThai === "Hoàn thành") continue;
            if (pc.ngayXongDuKien < today) {
              const key = `late-${pc.id}`;
              const exists = notifications.find((n) => n.data?.key === key);
              if (!exists) {
                addNotification({
                  type: "late",
                  title: "⚠️ Trễ hạn deadline",
                  body: `${pc.congDoan} - ${pc.nguoiPhuTrach.ten.split(" (")[0]}`,
                  link: `/cong-no?lenh=${pc.lenhCatId}`,
                  data: { key, phanCongId: pc.id, lenhCatId: pc.lenhCatId },
                });
                newLates.push(pc);
              }
            }
          }
        }
        // Check low stock
        const khoRaw = localStorage.getItem("mimin_kho_vai_v2");
        if (khoRaw) {
          const gd = JSON.parse(khoRaw);
          const ton: Record<string, number> = {};
          for (const g of gd) {
            if (!ton[g.maVT]) ton[g.maVT] = 0;
            if (g.loai === "NHAP") ton[g.maVT] += g.soLuong;
            else ton[g.maVT] -= g.soLuong;
          }
          for (const [maVT, sl] of Object.entries(ton)) {
            if (sl < 0) {
              const key = `lowstock-${maVT}`;
              const exists = notifications.find((n) => n.data?.key === key);
              if (!exists) {
                addNotification({
                  type: "low_stock",
                  title: "📦 Tồn kho âm!",
                  body: `${maVT} đang âm: ${sl.toFixed(0)}`,
                  link: "/kho-vai-tinhmann",
                  data: { key, maVT, ton: sl },
                });
              }
            }
          }
        }
      } catch {}
    };
    checkAndNotify();
    const interval = setInterval(checkAndNotify, 60_000);  // Mỗi phút
    return () => clearInterval(interval);
  }, [addNotification, notifications]);
}
