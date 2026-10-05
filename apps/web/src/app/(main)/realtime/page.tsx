"use client";

import { RealtimeDashboard } from "@/components/RealtimeDashboard";

export default function RealtimePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2 text-slate-800 dark:text-white">
          📊 Báo cáo tổng hợp (BI) Real-time
        </h1>
        <p className="opacity-80 mt-1 text-sm text-slate-600 dark:text-slate-300">
          Trung tâm phân tích tài chính & vận hành nhà máy · Tự động cập nhật mỗi 30 giây · 7 biểu đồ tương tác
        </p>
      </div>
      <RealtimeDashboard />
    </div>
  );
}
