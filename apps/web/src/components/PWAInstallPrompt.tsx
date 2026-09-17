"use client";

import { useEffect, useState } from "react";
import { Download, X, Smartphone, Zap, Wifi, Bell, Info, ArrowDown, ArrowUp } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    pwaDeferredPrompt: BeforeInstallPromptEvent | null;
  }
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Luôn luôn đăng ký sự kiện manual trigger
    const forceShowHandler = () => {
      setShowPrompt(true);
      localStorage.removeItem("pwa-install-dismissed");
    };
    window.addEventListener("force-show-pwa-prompt", forceShowHandler);

    const installedHandler = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      window.pwaDeferredPrompt = null;
    };
    window.addEventListener("appinstalled", installedHandler);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return () => {
        window.removeEventListener("force-show-pwa-prompt", forceShowHandler);
        window.removeEventListener("appinstalled", installedHandler);
      };
    }

    // Check if dismissed recently (within 3 days)
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    let isDismissed = false;
    if (dismissed) {
      const dismissedAt = Number(dismissed);
      const threeDays = 3 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedAt < threeDays) {
        isDismissed = true;
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

    // Read the prompt that might have fired before React hydrated
    if (window.pwaDeferredPrompt) {
      setDeferredPrompt(window.pwaDeferredPrompt);
    }

    // Listen for beforeinstallprompt in case it fires late
    const handler = (e: Event) => {
      e.preventDefault();
      window.pwaDeferredPrompt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Show prompt after a delay if not dismissed
    if (!isDismissed) {
      if (isIOSDevice || isAndroidDevice || inAppBrowser) {
        setTimeout(() => setShowPrompt(true), 2000);
      } else {
         // Desktop fallback
         setTimeout(() => setShowPrompt(true), 4000);
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
      window.removeEventListener("force-show-pwa-prompt", forceShowHandler);
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
      window.pwaDeferredPrompt = null;
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
              <div className="flex flex-wrap gap-1.5 mt-2 mb-3">
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
            
            <div className="flex gap-2 mt-2">
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
              <div className="mt-3 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 flex flex-col items-center justify-center animate-pulse relative">
                <p className="text-[11px] text-blue-700 dark:text-blue-300 text-center font-medium">
                  Bấm nút <b>Chia sẻ</b> dưới Safari <br/> sau đó chọn <b>"Thêm vào MH chính"</b>
                </p>
                <ArrowDown className="w-5 h-5 text-blue-600 dark:text-blue-400 absolute -bottom-5" />
              </div>
            )}
            
            {!deferredPrompt && isAndroid && !isInAppBrowser && (
              <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 flex flex-col items-center justify-center animate-pulse relative">
                <ArrowUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400 absolute -top-5 right-2" />
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 text-center font-medium">
                  Bấm nút <b>3 chấm ⋮</b> góc trên Chrome <br/> sau đó chọn <b>"Thêm vào MH chính"</b>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

