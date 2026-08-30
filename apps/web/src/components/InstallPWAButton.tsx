"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";

export function InstallPWAButton() {
  const [isInstalled, setIsInstalled] = useState(true); // Default true to prevent flicker

  useEffect(() => {
    // Check if running in browser
    if (typeof window !== "undefined") {
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
      
      // Also check iOS navigator.standalone fallback
      const isIosStandalone = (window.navigator as any).standalone === true;
      
      setIsInstalled(isStandalone || isIosStandalone);

      // Listen for appinstalled event to hide button instantly when installed
      const handleAppInstalled = () => setIsInstalled(true);
      window.addEventListener("appinstalled", handleAppInstalled);

      return () => {
        window.removeEventListener("appinstalled", handleAppInstalled);
      };
    }
  }, []);

  if (isInstalled) return null;

  return (
    <button
      onClick={() => {
        // Dispatch custom event to wake up PWAInstallPrompt
        window.dispatchEvent(new CustomEvent("force-show-pwa-prompt"));
      }}
      className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 transition-colors shadow-inner"
      aria-label="Tải App"
      title="Cài đặt ứng dụng ra màn hình chính"
    >
      <Download className="w-5 h-5 sm:w-4 sm:h-4 animate-bounce" />
      <span className="hidden sm:inline text-sm font-bold tracking-wide">Tải App</span>
    </button>
  );
}
