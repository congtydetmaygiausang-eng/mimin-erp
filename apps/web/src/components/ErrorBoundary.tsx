"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Trash2 } from "lucide-react";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

/**
 * ErrorBoundary - bắt lỗi React ở client component
 * Design: card glassmorphism, alert icon, nút reload & clear cache
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidMount() {
    // Clear flag auto-reload mỗi khi ứng dụng load thành công
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem("chunk_failed_reload");
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
    this.props.onError?.(error, info);

    // Auto-reload 1 lần duy nhất nếu bị lỗi thiếu file chunk hoặc service worker cũ nạp HTML
    const errorStr = error.message || "";
    const nameStr = error.name || "";
    const isChunkError =
      nameStr === "ChunkLoadError" ||
      errorStr.includes("Loading chunk") ||
      errorStr.includes("dynamically imported module") ||
      errorStr.includes("Unexpected token") ||
      errorStr.includes("is not valid JSON");

    if (isChunkError && typeof window !== "undefined" && typeof sessionStorage !== "undefined") {
      const isReloaded = sessionStorage.getItem("chunk_failed_reload");
      if (!isReloaded) {
        sessionStorage.setItem("chunk_failed_reload", "true");
        this.handleHardReload();
      }
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleHardReload = async () => {
    if (typeof window !== "undefined") {
      try {
        if ("serviceWorker" in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const reg of registrations) {
            await reg.unregister();
          }
        }
        if ("caches" in window) {
          const keys = await caches.keys();
          for (const k of keys) {
            await caches.delete(k);
          }
        }
      } catch {
        // ignore
      }
      window.location.reload();
    }
  };

  handleReload = () => {
    this.handleHardReload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return <>{this.props.fallback}</>;

      const errorStr = this.state.error?.message || "";
      const nameStr = this.state.error?.name || "";
      const isChunkError =
        nameStr === "ChunkLoadError" ||
        errorStr.includes("Loading chunk") ||
        errorStr.includes("dynamically imported module") ||
        errorStr.includes("Unexpected token") ||
        errorStr.includes("is not valid JSON");

      return (
        <div className="min-h-[50vh] flex items-center justify-center p-4">
          <div className="card p-6 md:p-8 max-w-xl mx-auto text-center animate-fade-in shadow-xl border border-rose-500/20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-rose-600 animate-bounce" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-100">
              {isChunkError ? "Hệ thống có bản cập nhật mới" : "Đã xảy ra lỗi tải dữ liệu"}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              {isChunkError
                ? "Ứng dụng vừa cập nhật phiên bản mới nhất. Vui lòng bấm 'Tải lại trang' để tiếp tục làm việc."
                : (errorStr || "Hệ thống gặp sự cố kết nối tạm thời.")}
            </p>
            {nameStr && !isChunkError && (
              <p className="text-xs opacity-50 mb-4 font-mono break-words bg-slate-100 dark:bg-slate-800 p-2 rounded">
                {nameStr}: {errorStr}
              </p>
            )}
            <div className="flex flex-wrap gap-2 justify-center">
              {!isChunkError && (
                <button
                  onClick={this.handleReset}
                  className="btn-secondary text-sm inline-flex items-center gap-1.5 px-4 py-2"
                >
                  <RefreshCw className="w-4 h-4" /> Thử lại
                </button>
              )}
              <button
                onClick={this.handleReload}
                className="btn-primary text-sm inline-flex items-center gap-1.5 px-4 py-2 font-medium"
              >
                <RefreshCw className="w-4 h-4" /> Tải lại trang
              </button>
              <button
                onClick={async () => {
                  try {
                    localStorage.removeItem("mimin_erp_session_ttl");
                    if ("caches" in window) {
                      const keys = await caches.keys();
                      for (const k of keys) await caches.delete(k);
                    }
                    if ("serviceWorker" in navigator) {
                      const regs = await navigator.serviceWorker.getRegistrations();
                      for (const r of regs) await r.unregister();
                    }
                  } catch {}
                  window.location.href = "/";
                }}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 inline-flex items-center gap-1 mt-2 w-full justify-center"
              >
                <Trash2 className="w-3.5 h-3.5" /> Xóa bộ nhớ đệm & khởi động lại
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
