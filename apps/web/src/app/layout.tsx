import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "MIMIN ERP — Quản lý May mặc",
  description: "Hệ thống ERP quản lý sản xuất may mặc - Lệnh cắt, Công nợ, Kho vải, Nhân sự",
  applicationName: "MIMIN ERP",
  authors: [{ name: "MIMIN Team" }],
  keywords: ["ERP", "may mặc", "sản xuất", "quản lý", "MIMIN", "Polomimin"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MIMIN ERP",
    startupImage: [
      {
        url: "/icons/apple-touch-icon.png",
        media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)",
      },
    ],
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/icons/apple-touch-icon-152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/apple-touch-icon-167.png", sizes: "167x167", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/icons/icon-512.png", color: "#14b8a6" },
    ],
  },
  other: {
    "msapplication-TileColor": "#14b8a6",
    "msapplication-TileImage": "/icons/icon-192.png",
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "MIMIN ERP",
    "application-name": "MIMIN ERP",
    "theme-color": "#14b8a6",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#14b8a6" },
    { media: "(prefers-color-scheme: dark)", color: "#0f766e" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          // 1. Chuyển hướng tức thì tại Head (Zero-Wait Instant Redirect trước khi tải JS)
          try {
            if (typeof window !== 'undefined') {
              var p = window.location.pathname;
              if (p === '/' || p === '') {
                var s = localStorage.getItem('mimin_erp_session_ttl') || localStorage.getItem('mimin_erp_session');
                if (s) {
                  var u = JSON.parse(s);
                  var userObj = u.user || u;
                  if (userObj && userObj.role) {
                    var r = userObj.role;
                    var target = '/dashboard/';
                    if (r === 'partner') target = '/trang-chu-gia-cong/';
                    else if (r === 'cutting') target = '/to-cat-work/';
                    else if (r === 'sewing') target = '/to-may-work/';
                    else if (r === 'qc') target = '/to-qc-work/';
                    else if (r === 'finishing') target = '/to-ht-work/';
                    else if (r === 'warehouse') target = '/kho-vai-tinhmann/';
                    else if (r === 'accountant') target = '/doi-soat-tien-cong/';
                    window.location.replace(target);
                  } else {
                    window.location.replace('/login/');
                  }
                } else {
                  window.location.replace('/login/');
                }
              }
            }
          } catch (e) {}

          try {
            if (typeof window !== 'undefined' && window.localStorage) {
              var originalSetItem = window.localStorage.setItem;
              window.localStorage.setItem = function(key, value) {
                try {
                  originalSetItem.apply(this, [key, value]);
                } catch (e) {
                  console.warn('LocalStorage quota exceeded for key:', key);
                }
              };
            }
          } catch (e) {}

          try {
            window.pwaDeferredPrompt = null;
            window.addEventListener('beforeinstallprompt', function(e) {
              e.preventDefault();
              window.pwaDeferredPrompt = e;
            });
          } catch (e) {}

          // Tự động hồi phục khi phát hiện chunk load error hoặc cú pháp do service worker cũ
          window.addEventListener('error', function(e) {
            var msg = (e && e.message) ? e.message.toLowerCase() : '';
            if (msg.indexOf('chunk') !== -1 || msg.indexOf('unexpected token') !== -1 || msg.indexOf('loading script') !== -1) {
              if (!sessionStorage.getItem('mimin_auto_chunk_heal')) {
                sessionStorage.setItem('mimin_auto_chunk_heal', '1');
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(regs) {
                    for (var i = 0; i < regs.length; i++) regs[i].unregister();
                    window.location.reload();
                  });
                } else {
                  window.location.reload();
                }
              }
            }
          });
        `}} />
        {/* PWA Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MIMIN ERP" />
        <meta name="application-name" content="MIMIN ERP" />
        <meta name="theme-color" content="#14b8a6" />
        <meta name="msapplication-TileColor" content="#14b8a6" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/apple-touch-icon-152.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/apple-touch-icon-167.png" />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        {/* Instant Branded Visual Loader (Hiện ngay lập tức tại 0ms chống trắng màn hình) */}
        <div
          id="mimin-root-splash"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#0d9488",
            color: "#ffffff",
            fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            pointerEvents: "none",
            transition: "opacity 0.25s ease-out",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "14px",
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: "24px",
                letterSpacing: "-1px",
                boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                border: "1px solid rgba(255,255,255,0.3)",
              }}
            >
              M
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "18px", fontWeight: 800, letterSpacing: "0.5px" }}>MIMIN ERP</div>
              <div style={{ fontSize: "12px", opacity: 0.85, marginTop: "2px" }}>Hệ Thống Quản Lý May Mặc</div>
            </div>
            <div
              style={{
                width: "140px",
                height: "4px",
                background: "rgba(255,255,255,0.25)",
                borderRadius: "999px",
                overflow: "hidden",
                marginTop: "8px",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: "45%",
                  height: "100%",
                  background: "#ffffff",
                  borderRadius: "999px",
                  animation: "miminPulse 1.2s infinite ease-in-out",
                }}
              />
            </div>
          </div>
          <style
            dangerouslySetInnerHTML={{
              __html: `
                @keyframes miminPulse {
                  0% { transform: translateX(-100%); width: 30%; }
                  50% { width: 75%; }
                  100% { transform: translateX(260%); width: 30%; }
                }
              `,
            }}
          />
        </div>

        <Providers>
          {children}
          <ServiceWorkerRegister />
          {/* <SpeedInsights /> */}
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
