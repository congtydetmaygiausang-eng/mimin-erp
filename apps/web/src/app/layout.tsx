import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          const originalSetItem = window.localStorage.setItem;
          window.localStorage.setItem = function(key, value) {
            try {
              originalSetItem.apply(this, [key, value]);
            } catch (e) {
              console.warn('LocalStorage quota exceeded for key:', key);
            }
          };

          window.pwaDeferredPrompt = null;
          window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            window.pwaDeferredPrompt = e;
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
        <Providers>
          {children}
          <ServiceWorkerRegister />
          <SpeedInsights />
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
