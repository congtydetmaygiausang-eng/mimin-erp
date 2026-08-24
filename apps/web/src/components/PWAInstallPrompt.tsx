"use client";

import { useEffect, useState } from "react";
import { Download, X, Smartphone, Zap, Wifi, Bell, Info } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (typeof window === "undefined") return;
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed recently (within 3 days)
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      const dismissedAt = Number(dismissed);
      const threeDays = 3 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedAt < threeDays) {
        return;
      }
    }

    const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
    const isAndroidDevice = /android/i.test(ua);
    
    // Detect in-app browsers (Zalo, Messenger, Facebook)
    const inAppBrowser = /FBAN|FBAV|Zalo|Instagram/i.test(ua);
    
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);
    setIsInAppBrowser(inAppBrowser);

    // Listen for beforeinstallprompt (Android/Chrome/Edge)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show after 3 seconds
      setTimeout(() => setShowPrompt(true), 3000);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // For mobile devices, if beforeinstallprompt doesn't fire, we still want to show a manual guide
    if (isIOSDevice || isAndroidDevice || inAppBrowser) {
      setTimeout(() => setShowPrompt(true), 3000);
    } else {
       // Desktop fallback
       setTimeout(() => setShowPrompt(true), 5000);
    }

    // Detect app installed
    const installedHandler = () => {
      setIsInstalled(true);
      setShowPrompt(false);
    };
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-install-dismissed", String(Date.now()));
  };

  if (!showPrompt || isInstalled) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[9999] animate-slide-up">
      <div className="card p-4 shadow-2xl border-2 border-brand-500/30 bg-gradient-to-br from-white via-white to-brand-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-brand-950/30">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1.5 rounded-lg hover:bg-white/40 text-slate-400 hover:text-slate-700"
          aria-label="Đóng"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shrink-0 shadow-lg">
            <Smartphone className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm">Cài đặt App MIMIN ERP</h3>
            <p className="text-xs opacity-70 mt-0.5">
              Thêm vào màn hình chính để dùng như app thật
            </p>
            
            {isInAppBrowser && (
              <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 rounded text-[10px] text-amber-700 dark:text-amber-400 flex gap-1.5 items-start">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <p>Bạn đang dùng trình duyệt Zalo/Facebook. Vui lòng mở bằng <b>Chrome/Safari</b> để cài đặt!</p>
              </div>
            )}

            {!isInAppBrowser && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Nhanh hơn
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-700 flex items-center gap-1">
                  <Wifi className="w-3 h-3" /> Offline
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-700 flex items-center gap-1">
                  <Bell className="w-3 h-3" /> Thông báo
                </span>
              </div>
            )}
            
            <div className="flex gap-2 mt-3">
              {deferredPrompt ? (
                <button
                  onClick={handleInstall}
                  className="flex-1 bg-gradient-to-r from-brand-500 to-brand-600 text-white text-xs font-medium px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  Cài đặt ngay
                </button>
              ) : (
                 <button
                  onClick={handleDismiss}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium px-3 py-2 rounded-lg flex items-center justify-center gap-1.5"
                >
                  Đã hiểu
                </button>
              )}
            </div>
            
            {!deferredPrompt && isIOS && !isInAppBrowser && (
              <p className="text-[10px] opacity-70 mt-2 italic text-center">
                📱 Bấm nút <b>Chia sẻ</b> ⬆️ ở dưới cùng Safari <br/> → chọn <b>"Thêm vào MH chính"</b>
              </p>
            )}
            
            {!deferredPrompt && isAndroid && !isInAppBrowser && (
              <p className="text-[10px] opacity-70 mt-2 italic text-center">
                📱 Bấm nút <b>3 chấm</b> ⋮ góc trên Chrome <br/> → chọn <b>"Thêm vào MH chính"</b>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

