"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

// Use the VAPID_PUBLIC_KEY we generated
const VAPID_PUBLIC_KEY = "BLxrje5fHlOUOWYTQTlsEZbQvr1unmu86pJu522Xr0lyUrhECLFe4KXuz7PszOphkF8ODQ9iklk58SyrJYWHnKg";

export function NotificationToggle() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setIsSupported(false);
        setIsLoading(false);
        return;
      }
      setIsSupported(true);
      
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      const isEnabledLocal = localStorage.getItem("mimin_notifications_enabled") === "true";
      setIsSubscribed(!!subscription || isEnabledLocal);
    } catch (err) {
      console.error("Lỗi khi kiểm tra thông báo:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeToPush = async () => {
    try {
      setIsLoading(true);
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Bạn đã từ chối nhận thông báo.");
        setIsLoading(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      
      // Clear old subscription if it exists to avoid VAPID key conflict
      const existingSub = await registration.pushManager.getSubscription();
      if (existingSub) {
        await existingSub.unsubscribe();
      }

      const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      };

      const pushSubscription = await registration.pushManager.subscribe(subscribeOptions);
      
      // Save subscription to Supabase
      const subscriptionJson = pushSubscription.toJSON();
      
      // Lấy username hiện tại
      let userName = "guest";
      try {
        const session = localStorage.getItem('session');
        if (session) {
          const s = JSON.parse(session);
          userName = s.user?.email || s.user?.phone || s.user?.name || s.name || "user";
        }
      } catch (e) {}

      const { error } = await supabase.from('push_subscriptions').upsert({
        user_name: userName,
        endpoint: subscriptionJson.endpoint,
        auth_key: subscriptionJson.keys?.auth,
        p256dh_key: subscriptionJson.keys?.p256dh,
      }, { onConflict: 'endpoint' });

      if (error) throw error;

      localStorage.setItem("mimin_notifications_enabled", "true");
      setIsSubscribed(true);
      toast.success("Đã bật thông báo thành công!");
    } catch (err: any) {
      console.error("Lỗi đăng ký:", err);
      toast.error(`Không thể bật thông báo: ${err?.message || JSON.stringify(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribeFromPush = async () => {
    try {
      setIsLoading(true);
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        // 1. XOÁ TRÊN SUPABASE ĐỂ SERVER QUÊN MÁY NÀY
        const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
        if (error) console.error("Lỗi xoá trên DB:", error);
        
        // 2. XOÁ ĐĂNG KÝ NGẦM CỦA TRÌNH DUYỆT
        await subscription.unsubscribe();
      }
      
      localStorage.setItem("mimin_notifications_enabled", "false");
      setIsSubscribed(false);
      toast.success("Đã tắt thông báo.");
    } catch (err) {
      console.error("Lỗi huỷ đăng ký:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) return null;

  return (
    <button
      onClick={isSubscribed ? unsubscribeFromPush : subscribeToPush}
      disabled={isLoading}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
        isSubscribed 
          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" 
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
      title={isSubscribed ? "Đang bật thông báo công việc" : "Bật thông báo công việc"}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isSubscribed ? (
        <Bell className="w-4 h-4" />
      ) : (
        <BellOff className="w-4 h-4" />
      )}
      <span className="hidden md:inline">
        {isSubscribed ? "Đã bật thông báo" : "Bật thông báo"}
      </span>
    </button>
  );
}
