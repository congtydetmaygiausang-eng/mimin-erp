"use client";

// @codex MIMIN GROUP - placeholder Đánh giá & Xếp hạng, sẽ triển khai ở Phase 4
// (bảng partner_ratings: 11 tiêu chí, sao 5, AI Score kèm breakdown).

import { Sparkles } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";

export default function DanhGiaXepHangPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        moduleLabel="MIMIN GROUP"
        title="Đánh giá & Xếp hạng"
        subtitle="Chấm điểm đối tác theo 11 tiêu chí, sao 5 và AI Score 0-100 kèm giải thích."
        icon={<Sparkles className="w-5 h-5" />}
      />
      <div className="card p-10 text-center flex flex-col items-center justify-center">
        <Sparkles className="w-12 h-12 text-slate-300" />
        <h3 className="mt-3 font-bold">Sắp ra mắt</h3>
        <p className="mt-1 text-sm opacity-60 max-w-md">
          Tab này sẽ chấm điểm hiệu suất hợp tác của đối tác (chất lượng, giá, tiến độ, tỷ lệ giao đúng hạn...),
          tách biệt với điểm uy tín dữ liệu đã có ở hồ sơ công ty. Đang ở giai đoạn thiết kế schema.
        </p>
      </div>
    </div>
  );
}
