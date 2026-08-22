"use client";

// @codex MIMIN GROUP - placeholder Cơ hội hợp tác, sẽ triển khai ở Phase 5
// (bảng opportunities / opportunity_partners / opportunity_status_history, Kanban pipeline).

import { Link2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";

export default function CoHoiHopTacPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        moduleLabel="MIMIN GROUP"
        title="Cơ hội hợp tác"
        subtitle="Tạo nhu cầu sản xuất, hệ thống đề xuất đối tác phù hợp, theo dõi pipeline Mới → Hợp tác."
        icon={<Link2 className="w-5 h-5" />}
      />
      <div className="card p-10 text-center flex flex-col items-center justify-center">
        <Link2 className="w-12 h-12 text-slate-300" />
        <h3 className="mt-3 font-bold">Sắp ra mắt</h3>
        <p className="mt-1 text-sm opacity-60 max-w-md">
          Tab này sẽ quản lý pipeline cơ hội hợp tác (Mới → Đã liên hệ → Đang trao đổi → Báo giá →
          Đánh mẫu → Đàm phán → Hợp tác) với lịch sử thay đổi trạng thái. Đang ở giai đoạn thiết kế schema.
        </p>
      </div>
    </div>
  );
}
