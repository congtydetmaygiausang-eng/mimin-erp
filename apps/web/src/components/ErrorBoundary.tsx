"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

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
 * Design: card glassmorphism, alert icon, nút reload
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

    // Auto-reload 1 lần duy nhất nếu bị lỗi thiếu file chunk (do deploy version mới)
    const isChunkError = error.name === "ChunkLoadError" || error.message?.includes("Loading chunk");
    if (isChunkError && typeof window !== "undefined" && typeof sessionStorage !== "undefined") {
      const isReloaded = sessionStorage.getItem("chunk_failed_reload");
      if (!isReloaded) {
        sessionStorage.setItem("chunk_failed_reload", "true");
        window.location.reload();
      }
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    if (typeof window !== "undefined") {
      // Bắt buộc reload lại cache bằng true nếu có thể, hoặc đơn giản gọi window.location.reload()
      window.location.href = window.location.href; 
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return <>{this.props.fallback}</>;

      const errorStr = this.state.error?.message || "";
      const nameStr = this.state.error?.name || "";
      const isChunkError = nameStr === "ChunkLoadError" || errorStr.includes("Loading chunk") || errorStr.includes("dynamically imported module");

      return (
        <div className="card p-6 md:p-8 max-w-2xl mx-auto mt-8 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-rose-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">
            {isChunkError ? "Hệ thống có bản cập nhật mới" : "Đã xảy ra lỗi"}
          </h2>
          <p className="text-sm opacity-70 mb-1">
            {isChunkError 
              ? "Phiên bản cũ đã hết hạn. Vui lòng bấm 'Tải lại trang' để đồng bộ mã nguồn mới nhất nhé." 
              : (errorStr || "Lỗi không xác định")}
          </p>
          <p className="text-xs opacity-50 mb-4 font-mono break-words">
            {isChunkError ? "" : nameStr}
          </p>
          <div className="flex gap-2 justify-center">
            {!isChunkError && (
              <button
                onClick={this.handleReset}
                className="btn-secondary text-sm inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" /> Thử lại
              </button>
            )}
            <button
              onClick={this.handleReload}
              className="btn-primary text-sm inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" /> Tải lại trang
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
