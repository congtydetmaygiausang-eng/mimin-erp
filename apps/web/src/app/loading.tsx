// ============================================
// MIMIN ERP - Loading state
// Hien thi khi Next.js dang fetch data
// ============================================

import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <div className="text-center">
        {/* Spinner */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 mb-4 shadow-lg">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>

        {/* Text */}
        <div className="text-sm font-medium text-slate-700 mb-1">
          Đang tải dữ liệu...
        </div>
        <div className="text-xs text-slate-400">
          MIMIN ERP
        </div>

        {/* Skeleton hint */}
        <div className="mt-4 flex gap-2 justify-center">
          <div className="h-2 w-16 bg-slate-200 rounded animate-pulse" />
          <div className="h-2 w-12 bg-slate-200 rounded animate-pulse" />
          <div className="h-2 w-20 bg-slate-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
