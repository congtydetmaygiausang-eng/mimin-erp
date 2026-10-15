"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Factory } from "lucide-react";
import { useSession } from "@/components/session-provider";
import { TABS, type Tab } from "./data";
import { Dashboard } from "./components/Dashboard";
import { MasterData } from "./components/MasterData";
import { LenhTongForm } from "./components/LenhTongForm";
import { FlowQuick } from "./components/FlowQuick";
import { CongNoView, BaoCaoView } from "./components/Views";
import {
  syncYarnProductionFromSupabase,
  subscribeYarnProductionChanges,
} from "@/lib/yarn-production-chain";

function SanXuatERPContent() {
  const { user } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get("tab") as Tab | null;
  const validTabs: Tab[] = ["dashboard", "master", "lenhtong", "flow", "congno", "baocao"];
  const initialTab = tabParam && validTabs.includes(tabParam) ? tabParam : "dashboard";

  const [tab, setTab] = useState<Tab>(initialTab);

  useEffect(() => {
    // Tự động kéo dữ liệu Sợi - Dệt - Nhuộm và ảnh chứng từ từ Supabase về
    void syncYarnProductionFromSupabase();
    const unsubscribe = subscribeYarnProductionChanges(() => {
      // Callback khi có thay đổi realtime
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (tabParam && validTabs.includes(tabParam)) {
      setTab(tabParam);
    }
  }, [tabParam]);

  const handleSelectTab = (selectedTab: Tab) => {
    setTab(selectedTab);
    router.replace(`/san-xuat-erp?tab=${selectedTab}`);
  };

  return (
    <div className="min-h-screen pb-12 animate-fade-in text-slate-800">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Modern App Header & Segmented Tabs Bar */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur-xl md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Module Brand & Title */}
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/25">
                <Factory className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-black tracking-tight text-slate-900 md:text-xl">
                    Sản Xuất Sợi · Dệt · Nhuộm
                  </h1>
                  <span className="hidden rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-[11px] font-bold text-orange-700 sm:inline-block">
                    Chuỗi Vải
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-500">
                  Quản lý định mức sợi, lệnh dệt vải mộc và mẻ nhuộm thành phẩm
                </p>
              </div>
            </div>

            {/* Segmented Control Tabs (Kiểu iOS/macOS App) */}
            <div className="flex items-center gap-1 overflow-x-auto rounded-2xl border border-slate-200/90 bg-slate-100/90 p-1.5 scrollbar-none">
              {TABS.map((t) => {
                const Icon = t.icon;
                const isActive = tab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => handleSelectTab(t.key)}
                    className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                      isActive
                        ? "bg-white text-orange-600 shadow-sm ring-1 ring-black/5 scale-[1.02]"
                        : "text-slate-600 hover:bg-white/60 hover:text-slate-900"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? "text-orange-600" : "text-slate-400"}`} />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Active Screen Content */}
        <div>
          {tab === "dashboard" && <Dashboard />}
          {tab === "master" && <MasterData />}
          {tab === "lenhtong" && <LenhTongForm user={user} onChuyenTiep={() => handleSelectTab("flow")} />}
          {tab === "flow" && <FlowQuick user={user} />}
          {tab === "congno" && <CongNoView />}
          {tab === "baocao" && <BaoCaoView />}
        </div>
      </div>
    </div>
  );
}

export default function SanXuatERPPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Đang tải phân hệ Sợi - Dệt - Nhuộm...</div>}>
      <SanXuatERPContent />
    </Suspense>
  );
}
