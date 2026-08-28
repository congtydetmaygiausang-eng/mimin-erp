"use client";

// @codex MIMIN GROUP - Tìm đối tác AI
// Gộp Xưởng sản xuất và Nguồn nguyên liệu vào một màn hình duy nhất sử dụng AI.

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Factory, Boxes, Sparkles } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { AiDiscoveryTab } from "@/components/sourcing/AiDiscoveryTab";
import { type ProductionPartnerRole } from "@/lib/production-network";

function TimDoiTacContent() {
  const searchParams = useSearchParams();
  const overrideRole = searchParams.get("role");
  
  const initialRole: ProductionPartnerRole = (overrideRole === "CUSTOMER" || overrideRole === "MATERIAL_SUPPLIER" || overrideRole === "PACKAGING_FINISHER") 
    ? overrideRole 
    : "SATELLITE_PROCESSOR";
    
  const [role, setRole] = useState<ProductionPartnerRole>(initialRole);

  return (
    <div className="space-y-4">
      <PageHeader
        moduleLabel="MIMIN GROUP"
        title="Tìm đối tác AI"
        subtitle="Sử dụng AI Agent để tìm kiếm xưởng gia công, nhà cung cấp nguyên phụ liệu trên khắp cả nước."
        icon={<Search className="w-5 h-5" />}
      />
      
      <div className="flex flex-wrap gap-2 mb-4 border-b pb-4" style={{ borderColor: "var(--border)" }}>
        <button 
          onClick={() => setRole("SATELLITE_PROCESSOR")} 
          className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors ${role === "SATELLITE_PROCESSOR" ? "bg-violet-500 text-white shadow-md" : "bg-white text-slate-600 border hover:bg-slate-50"}`}
        >
          <Factory className="w-4 h-4" /> Tìm Xưởng Gia Công
        </button>
        <button 
          onClick={() => setRole("MATERIAL_SUPPLIER")} 
          className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors ${role === "MATERIAL_SUPPLIER" ? "bg-amber-500 text-white shadow-md" : "bg-white text-slate-600 border hover:bg-slate-50"}`}
        >
          <Boxes className="w-4 h-4" /> Tìm Nguồn Nguyên Liệu
        </button>
        <button 
          onClick={() => setRole("PACKAGING_FINISHER")} 
          className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors ${role === "PACKAGING_FINISHER" ? "bg-cyan-500 text-white shadow-md" : "bg-white text-slate-600 border hover:bg-slate-50"}`}
        >
          <Sparkles className="w-4 h-4" /> Tìm Xưởng Đóng Gói
        </button>
      </div>

      <div className="card p-4 bg-gradient-to-br from-slate-50 to-white">
        <AiDiscoveryTab role={role} />
      </div>
    </div>
  );
}

export default function TimDoiTacPage() {
  return (
    <Suspense fallback={<div className="card p-10 text-center opacity-60">Đang tải...</div>}>
      <TimDoiTacContent />
    </Suspense>
  );
}
