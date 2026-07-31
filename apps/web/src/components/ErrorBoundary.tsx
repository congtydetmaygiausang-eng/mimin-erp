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

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log lỗi ra console để debug (có thể tích hợp Sentry sau)
    console.error("[ErrorBoundary]", error, info);
    this.props.onError?.(error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return <>{this.props.fallback}</>;
      return (
        <div className="card p-6 md:p-8 max-w-2xl mx-auto mt-8 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-rose-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">Đã xảy ra lỗi</h2>
          <p className="text-sm opacity-70 mb-1">
            {this.state.error?.message || "Lỗi không xác định"}
          </p>
          <p className="text-xs opacity-50 mb-4 font-mono">
            {this.state.error?.name}
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={this.handleReset}
              className="btn-secondary text-sm inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" /> Thử lại
            </button>
            <button
              onClick={this.handleReload}
              className="btn-primary text-sm"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
