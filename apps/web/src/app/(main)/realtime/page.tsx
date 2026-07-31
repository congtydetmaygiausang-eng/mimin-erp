"use client";

import { RealtimeDashboard } from "@/components/RealtimeDashboard";

export default function RealtimePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          📊 Real-time Dashboard
        </h1>
        <p className="opacity-70 mt-1 text-sm">
          Dashboard cập nhật tự động mỗi 30 giây · 7 biểu đồ tương tác · Sparkline mini-charts
        </p>
      </div>
      <RealtimeDashboard />
    </div>
  );
}
