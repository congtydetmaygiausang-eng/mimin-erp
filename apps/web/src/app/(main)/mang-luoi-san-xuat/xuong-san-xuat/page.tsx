"use client";

// @codex MIMIN GROUP - tab Xưởng sản xuất (vai trò SATELLITE_PROCESSOR).
// Hỗ trợ ?role=CUSTOMER để Tổng quan có thể deep-link sang danh mục Khách hàng
// mà không cần thêm 1 tab chính riêng (CUSTOMER không nằm trong 7 tab spec).
// Tab "Tìm nâng cao (AI)" và "Trò chuyện AI" đã gộp làm 1 (AiDiscoveryTab tự chứa
// cả form nâng cao lẫn khung chat AI Agent) theo yêu cầu gộp về 1 khung duy nhất.

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Factory, Sparkles } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import PartnerDataTable from "@/components/production-network/PartnerDataTable";
import { AiDiscoveryTab } from "@/components/sourcing/AiDiscoveryTab";
import { ROLE_LABELS, type ProductionPartnerRole } from "@/lib/production-network";

function XuongSanXuatContent() {
  const searchParams = useSearchParams();
  const overrideRole = searchParams.get("role");
  const role: ProductionPartnerRole = overrideRole === "CUSTOMER" ? "CUSTOMER" : "SATELLITE_PROCESSOR";
  const [tab, setTab] = useState<"LOCAL" | "AI">("LOCAL");

  return (
    <div className="space-y-4">
      <PageHeader
        moduleLabel="MIMIN GROUP"
        title={role === "CUSTOMER" ? "Khách hàng" : "Xưởng sản xuất"}
        subtitle={role === "CUSTOMER"
          ? "Đầu ra sản xuất: local brand, đại lý phân phối, công ty đồng phục..."
          : "Danh mục xưởng gia công vệ tinh: cắt, may, in, thêu, giặt, nhuộm..."}
        icon={<Factory className="w-5 h-5" />}
      />
      <div className="flex gap-4 border-b" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={() => setTab("LOCAL")}
          className={`pb-2 px-2 text-sm font-semibold transition-colors ${tab === "LOCAL" ? "border-b-2 border-brand-500 text-brand-700" : "text-slate-500 hover:text-slate-800"}`}
        >
          Danh sách {role === "CUSTOMER" ? "khách hàng" : "xưởng"}
        </button>
        <button
          onClick={() => setTab("AI")}
          className={`pb-2 px-2 text-sm font-semibold inline-flex items-center gap-1.5 transition-colors ${tab === "AI" ? "border-b-2 border-brand-500 text-brand-700" : "text-slate-500 hover:text-slate-800"}`}
        >
          <Sparkles className="w-3.5 h-3.5" /> Tìm nâng cao (AI)
        </button>
      </div>
      {tab === "LOCAL" ? (
        <PartnerDataTable
          roles={[role]}
          primaryRole={role}
          emptyHint={`Chưa có ${ROLE_LABELS[role].toLowerCase()} nào — dùng tab Tìm nâng cao (AI) để tìm nguồn mới.`}
        />
      ) : (
        <AiDiscoveryTab role={role} />
      )}
    </div>
  );
}

export default function XuongSanXuatPage() {
  return (
    <Suspense fallback={<div className="card p-10 text-center opacity-60">Đang tải...</div>}>
      <XuongSanXuatContent />
    </Suspense>
  );
}
