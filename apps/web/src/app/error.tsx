"use client";

// ============================================
// MIMIN ERP - Error Boundary
// Hien thi khi co error runtime (client-side)
// ============================================

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console (se hook vao Sentry sau)
    console.error("[MIMIN Error]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-rose-50/30 to-amber-50/30">
      <div className="max-w-lg w-full text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-rose-500 to-amber-600 mb-6 shadow-lg">
          <AlertTriangle className="w-12 h-12 text-white" />
        </div>

        {/* Error code */}
        <div className="text-3xl font-black bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent mb-3">
          Đã xảy ra lỗi
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold text-slate-800 mb-2">
          Hệ thống gặp sự cố
        </h1>

        {/* Description */}
        <p className="text-slate-500 mb-6">
          MIMIN ERP không thể xử lý yêu cầu này. Lỗi đã được ghi nhận. Vui lòng thử lại hoặc liên hệ admin.
        </p>

        {/* Error details (dev) */}
        {error.message && (
          <details className="text-left bg-rose-50 border border-rose-200 rounded-lg p-3 mb-6 text-xs">
            <summary className="font-medium text-rose-700 cursor-pointer">
              <Bug className="w-3 h-3 inline mr-1" />
              Chi tiết lỗi (dành cho dev)
            </summary>
            <div className="mt-2 text-rose-900 font-mono whitespace-pre-wrap break-all">
              {error.message}
              {error.digest && (
                <div className="mt-1 text-rose-500">ID: {error.digest}</div>
              )}
            </div>
          </details>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-amber-600 text-white rounded-lg font-medium hover:shadow-lg transition"
          >
            <RefreshCw className="w-4 h-4" />
            Thử lại
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition"
          >
            <Home className="w-4 h-4" />
            Về Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
