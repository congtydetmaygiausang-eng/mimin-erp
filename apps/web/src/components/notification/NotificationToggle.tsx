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

    const onToggle = () => {
      if (isSubscribed) unsubscribeFromPush();
      else subscribeToPush();
    };
    window.addEventListener("mimin_trigger_push_toggle", onToggle);
    return () => window.removeEventListener("mimin_trigger_push_toggle", onToggle);
  }, [isSubscribed]);

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
      const active = !!subscription || isEnabledLocal;
      setIsSubscribed(active);
      window.dispatchEvent(new CustomEvent("mimin_push_state_changed", { detail: { isSubscribed: active } }));
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
        toast.error("Trình duyệt đang chặn thông báo!", {
          description: "Vui lòng bấm vào biểu tượng 🔒 ở góc trái thanh địa chỉ trình duyệt (URL), chọn 'Cho phép' (Allow) mục Thông báo, sau đó tải lại trang (F5)."
        });
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
          userName = s.name || s.user?.name || s.user?.email || s.user?.phone || "user";
        }
      } catch (e) {}

      if (supabase) {
        const { error } = await supabase.from('push_subscriptions').upsert({
          user_name: userName,
          endpoint: subscriptionJson.endpoint,
          auth_key: subscriptionJson.keys?.auth,
          p256dh_key: subscriptionJson.keys?.p256dh,
        }, { onConflict: 'endpoint' });

        if (error) throw error;
      }

      localStorage.setItem("mimin_notifications_enabled", "true");
      setIsSubscribed(true);
      window.dispatchEvent(new CustomEvent("mimin_push_state_changed", { detail: { isSubscribed: true } }));
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
        if (supabase) {
          const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
          if (error) console.error("Lỗi xoá trên DB:", error);
        }
        
        // 2. XOÁ ĐĂNG KÝ NGẦM CỦA TRÌNH DUYỆT
        await subscription.unsubscribe();
      }
      
      localStorage.setItem("mimin_notifications_enabled", "false");
      setIsSubscribed(false);
      window.dispatchEvent(new CustomEvent("mimin_push_state_changed", { detail: { isSubscribed: false } }));
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
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md border transition-all shadow-xs ${
        isSubscribed 
          ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/30 hover:bg-emerald-500/30" 
          : "bg-white/10 text-white/90 border-white/20 hover:bg-white/20"
      }`}
      title={isSubscribed ? "Đang bật thông báo đẩy về thiết bị" : "Bật thông báo đẩy về thiết bị"}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : isSubscribed ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          </span>
          <Bell className="w-3.5 h-3.5 text-emerald-300" />
        </>
      ) : (
        <BellOff className="w-3.5 h-3.5 text-white/70" />
      )}
      <span className="hidden sm:inline">
        {isSubscribed ? "Thông báo: Bật" : "Bật thông báo"}
      </span>
    </button>
  );
}
