"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { SessionProvider } from "@/components/session-provider";
import { PhanCongProvider } from "@/lib/data/cong-no-store";
import { KhoProvider } from "@/lib/data/kho-store";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { NotificationProvider } from "@/lib/notification-store";
import { GiaCongProvider } from "@/lib/data/gia-cong-store";
import { KHSXProvider } from "@/lib/data/khsx-store";
import { GiaoHangProvider } from "@/lib/data/giao-hang-store";
import { DoiSoatProvider } from "@/lib/data/doi-soat-store";
import { HoanThienProvider } from "@/lib/data/hoan-thien-store";
import { KhoMobileProvider } from "@/lib/data/kho-mobile-store";
import { QCProvider } from "@/lib/data/qc-store";
import { LenhCatProvider } from "@/lib/data/lenh-cat-store";
import { DanhMucSPProvider } from "@/lib/data/danh-muc-sp-store";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <PhanCongProvider>
            <KhoProvider>
              <GiaCongProvider>
                <KHSXProvider>
                  <GiaoHangProvider>
                    <DoiSoatProvider>
                      <HoanThienProvider>
                        <KhoMobileProvider>
                          <QCProvider>
                            <LenhCatProvider>
                              <DanhMucSPProvider>
                                <NotificationProvider>
                                  <ErrorBoundary>
                                {children}
                              </ErrorBoundary>
                              <PWAInstallPrompt />
                              <Toaster
                                position="top-right"
                                richColors
                                closeButton
                                toastOptions={{
                                  duration: 3000,
                                }}
                              />
                                </NotificationProvider>
                              </DanhMucSPProvider>
                            </LenhCatProvider>
                          </QCProvider>
                      </KhoMobileProvider>
                    </HoanThienProvider>
                  </DoiSoatProvider>
                </GiaoHangProvider>
              </KHSXProvider>
            </GiaCongProvider>
          </KhoProvider>
        </PhanCongProvider>
      </SessionProvider>
    </QueryClientProvider>
  </ThemeProvider>
  );
}
