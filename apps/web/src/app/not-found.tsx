// ============================================
// MIMIN ERP - 404 Not Found page
// Hien thi khi user go URL khong co
// ============================================

import Link from "next/link";
import { Home, Search, ArrowLeft, AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50/30">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 mb-6 shadow-lg">
          <AlertCircle className="w-12 h-12 text-white" />
        </div>

        {/* Error code */}
        <div className="text-6xl font-black bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-3">
          404
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          Không tìm thấy trang
        </h1>

        {/* Description */}
        <p className="text-slate-500 mb-6">
          Trang bạn đang tìm không tồn tại hoặc đã được di chuyển. Vui lòng kiểm tra lại đường dẫn.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition"
          >
            <Home className="w-4 h-4" />
            Về Dashboard
          </Link>
          <Link
            href="/agents"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition"
          >
            <Search className="w-4 h-4" />
            Xem 6 Agents
          </Link>
        </div>

        {/* Help text */}
        <div className="mt-8 text-xs text-slate-400">
          Nếu bạn nghĩ đây là lỗi, vui lòng liên hệ admin MIMIN ERP.
        </div>

        {/* Back link */}
        <button
          onClick={() => {
            if (typeof window !== "undefined") {
              window.history.length > 1 ? window.history.back() : (window.location.href = "/dashboard");
            }
          }}
          className="mt-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-cyan-600"
        >
          <ArrowLeft className="w-3 h-3" />
          Quay lại trang trước
        </button>
      </div>
    </div>
  );
}
