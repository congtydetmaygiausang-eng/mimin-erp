"use client";

import { Compass } from "lucide-react";
import { MiminGroupTabs } from "@/components/mimin-group/MiminGroupTabs";

export default function KhamPhaPage() {
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4 pb-24 md:pb-20">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Compass className="w-6 h-6 text-brand-500" /> Khám phá
        </h1>
        <p className="text-sm opacity-70 mt-1">Nơi khám phá nội dung nổi bật trong MIMIN Group.</p>
      </div>

      <MiminGroupTabs />

      <div className="bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl p-12 flex flex-col items-center text-center gap-3">
        <div className="w-14 h-14 rounded-full bg-brand-500/10 text-brand-500 flex items-center justify-center">
          <Compass className="w-7 h-7" />
        </div>
        <div className="font-semibold">Sắp ra mắt</div>
        <p className="text-sm opacity-60 max-w-sm">Tính năng Khám phá đang được thiết kế. Trong lúc chờ, anh có thể ghé Bảng tin hoặc Kho mẫu.</p>
      </div>
    </div>
  );
}
