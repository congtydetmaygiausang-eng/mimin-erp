"use client";

// @codex MIMIN GROUP - placeholder Năng lực & Chứng nhận, sẽ triển khai đầy đủ ở Phase 3
// (bảng production_partner_capabilities / production_partner_certifications).

import { ShieldCheck } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";

export default function NangLucChungNhanPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        moduleLabel="MIMIN GROUP"
        title="Năng lực & Chứng nhận"
        subtitle="Hồ sơ năng lực chi tiết và chứng nhận (ISO, OEKO-TEX, BSCI...) kèm cảnh báo hết hạn."
        icon={<ShieldCheck className="w-5 h-5" />}
      />
      <div className="card p-10 text-center flex flex-col items-center justify-center">
        <ShieldCheck className="w-12 h-12 text-slate-300" />
        <h3 className="mt-3 font-bold">Sắp ra mắt</h3>
        <p className="mt-1 text-sm opacity-60 max-w-md">
          Tab này sẽ quản lý năng lực chi tiết (công suất, máy móc, chuyền) và chứng nhận đối tác kèm
          cảnh báo sắp hết hạn. Đang ở giai đoạn thiết kế schema — sẽ triển khai ở đợt kế tiếp.
        </p>
      </div>
    </div>
  );
}
