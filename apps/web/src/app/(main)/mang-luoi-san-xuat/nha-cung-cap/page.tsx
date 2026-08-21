"use client";

// @codex MIMIN GROUP - tab Nhà cung cấp (gộp MATERIAL_SUPPLIER + PACKAGING_FINISHER).

import { useState } from "react";
import { Boxes, Sparkles } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import PartnerDataTable from "@/components/production-network/PartnerDataTable";
import { AiDiscoveryTab } from "@/components/sourcing/AiDiscoveryTab";
import { ROLE_LABELS, type ProductionPartnerRole } from "@/lib/production-network";

const SUPPLIER_ROLES: ProductionPartnerRole[] = ["MATERIAL_SUPPLIER", "PACKAGING_FINISHER"];

export default function NhaCungCapPage() {
  const [tab, setTab] = useState<"LOCAL" | "AI">("LOCAL");
  const [aiRole, setAiRole] = useState<ProductionPartnerRole>("MATERIAL_SUPPLIER");

  return (
    <div className="space-y-4">
      <PageHeader
        moduleLabel="MIMIN GROUP"
        title="Nhà cung cấp"
        subtitle="Nguyên phụ liệu (vải, bo cổ, chỉ, khóa kéo...) và dịch vụ đóng gói & hoàn thiện."
        icon={<Boxes className="w-5 h-5" />}
      />
      <div className="flex gap-4 border-b" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={() => setTab("LOCAL")}
          className={`pb-2 px-2 text-sm font-semibold transition-colors ${tab === "LOCAL" ? "border-b-2 border-brand-500 text-brand-700" : "text-slate-500 hover:text-slate-800"}`}
        >
          Danh sách nhà cung cấp
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
          roles={SUPPLIER_ROLES}
          primaryRole="MATERIAL_SUPPLIER"
          emptyHint="Chưa có nhà cung cấp nào — dùng tab Tìm nâng cao (AI) để tìm nguồn mới."
        />
      ) : (
        <div className="space-y-3">
          <div className="inline-flex rounded-xl border p-1 gap-1" style={{ borderColor: "var(--border)" }}>
            {SUPPLIER_ROLES.map((role) => (
              <button
                key={role}
                onClick={() => setAiRole(role)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${aiRole === role ? "bg-brand-500 text-white" : "text-slate-600 hover:bg-slate-100"}`}
              >
                {ROLE_LABELS[role]}
              </button>
            ))}
          </div>
          <AiDiscoveryTab role={aiRole} />
        </div>
      )}
    </div>
  );
}
