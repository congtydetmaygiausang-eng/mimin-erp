"use client";

import { MessageCircle } from "lucide-react";
import { MiminGroupTabs } from "@/components/mimin-group/MiminGroupTabs";

export default function TinNhanPage() {
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4 pb-24 md:pb-20">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-brand-500" /> Tin nhắn
        </h1>
        <p className="text-sm opacity-70 mt-1">Nhắn tin trực tiếp với đồng nghiệp trong MIMIN Group.</p>
      </div>

      <MiminGroupTabs />

      <div className="bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl p-12 flex flex-col items-center text-center gap-3">
        <div className="w-14 h-14 rounded-full bg-brand-500/10 text-brand-500 flex items-center justify-center">
          <MessageCircle className="w-7 h-7" />
        </div>
        <div className="font-semibold">Sắp ra mắt</div>
        <p className="text-sm opacity-60 max-w-sm">Tin nhắn nội bộ đang được thiết kế riêng (hộp thoại, tin nhắn real-time). Trong lúc chờ, anh có thể dùng Bảng tin để thông báo chung.</p>
      </div>
    </div>
  );
}
