"use client";

import { useEffect, useState } from "react";
import { Download, X, Smartphone, Zap, Wifi, Bell } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

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

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
    setIsIOS(isIOSDevice);

    // Listen for beforeinstallprompt (Android/Chrome/Edge)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show after 5 seconds
      setTimeout(() => setShowPrompt(true), 5000);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // For iOS, show after 3 seconds
    if (isIOSDevice) {
      setTimeout(() => setShowPrompt(true), 3000);
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
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
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
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleInstall}
                className="flex-1 bg-gradient-to-r from-brand-500 to-brand-600 text-white text-xs font-medium px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition"
              >
                <Download className="w-3.5 h-3.5" />
                {isIOS ? "Hướng dẫn" : "Cài đặt ngay"}
              </button>
              <button
                onClick={handleDismiss}
                className="text-xs px-3 py-2 rounded-lg text-slate-600 hover:bg-white/40"
              >
                Để sau
              </button>
            </div>
            {isIOS && (
              <p className="text-[10px] opacity-60 mt-2 italic">
                📱 Bấm nút <b>Chia sẻ</b> ⬆️ → chọn <b>"Thêm vào MH chính"</b>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
