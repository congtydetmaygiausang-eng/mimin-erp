"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const clearStaleServiceWorkers = async () => {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map((registration) => registration.unregister())
      );
    };

    if (process.env.NODE_ENV !== "production") {
      clearStaleServiceWorkers().catch(() => undefined);
      return;
    }

    // Khi có bản Service Worker mới giành quyền điều khiển (deploy mới lên
    // main), tự reload 1 lần để lấy đúng bản JS mới nhất. Không có đoạn này
    // thì app đã cài vào màn hình chính (mở lại từ icon, ít khi đóng hẳn) sẽ
    // kẹt mãi ở bản JS cũ nạp từ lần mở trước, trong khi vào bằng trình duyệt
    // (luôn tải trang mới hoàn toàn) thì thấy tính năng mới nhất - đây chính
    // là nguyên nhân "vào app thấy thiếu tính năng so với vào trình duyệt".
    let reloadedForUpdate = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloadedForUpdate) return;
      reloadedForUpdate = true;
      window.location.reload();
    });

    const onLoad = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          console.log("✓ MIMIN ERP Service Worker registered:", reg.scope);

          // Mỗi lần mở lại app (quay lại từ nền / mở lại tab) thì hỏi máy chủ
          // xem có bản mới không, không đợi tới lần cài đặt trình duyệt tự
          // kiểm tra định kỳ (có thể rất lâu với app mở từ màn hình chính).
          document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") {
              reg.update().catch(() => undefined);
              checkVersion(); // Cập nhật cả qua version.json
            }
          });
        })
        .catch((err) => {
          console.warn("Service Worker registration failed:", err);
        });
    };

    // PWA Force Update qua file version.json
    let currentVersion: string | null = null;
    const checkVersion = async () => {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`);
        if (!res.ok) return;
        const data = await res.json();
        const latestVersion = data.version?.toString();
        
        if (latestVersion) {
          if (!currentVersion) {
            // Lần check đầu tiên (khi mở app)
            currentVersion = latestVersion;
          } else if (currentVersion !== latestVersion) {
            console.log(`[PWA] Phiên bản mới được phát hiện: ${latestVersion} (hiện tại: ${currentVersion}). Tải lại trang...`);
            window.location.reload();
          }
        }
      } catch (err) {
        // Bỏ qua nếu lỗi mạng (offline)
      }
    };

    // Định kỳ kiểm tra mỗi 10 phút để tránh bị kẹt bản cũ
    const versionInterval = setInterval(checkVersion, 10 * 60 * 1000);
    checkVersion();

    if (document.readyState === "complete") {
      onLoad();
    } else {
      window.addEventListener("load", onLoad);
    }
    
    return () => {
      window.removeEventListener("load", onLoad);
      clearInterval(versionInterval);
    };
  }, []);
  return null;
}
