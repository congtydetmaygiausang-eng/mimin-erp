"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useLenhCat } from "@/lib/data/lenh-cat-store";
import { StageTabsView } from "./StageTabsView";

export default function LenhCatDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { dsLenhCat } = useLenhCat();
  const [lc, setLc] = useState<any>(null);

  useEffect(() => {
    const found = dsLenhCat.find(x => x.id === id);
    if (found) {
      setLc(found);
    }
  }, [id, dsLenhCat]);

  if (!lc) {
    return (
      <div className="p-8 text-center animate-fade-in">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-violet-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-500 font-bold">Đang tải Lệnh cắt {id}...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <button 
          onClick={() => router.push("/lenh-cat")}
          className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-800">Lệnh Cắt: {lc.id}</h1>
          <p className="text-sm font-bold text-slate-500">Khách hàng: {lc.khachHang}</p>
        </div>
      </div>

      {/* Tabs View */}
      <StageTabsView lc={lc} />
    </div>
  );
}
