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

function SanXuatERPContent() {
  const { user } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get("tab") as Tab | null;
  const validTabs: Tab[] = ["dashboard", "master", "lenhtong", "flow", "congno", "baocao"];
  const initialTab = tabParam && validTabs.includes(tabParam) ? tabParam : "dashboard";

  const [tab, setTab] = useState<Tab>(initialTab);

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
    <div className="min-h-screen bg-[#ECE7DC] pb-20 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        {/* Mobile-first header */}
        <div className="sticky top-0 z-10 rounded-xl border border-[#D98200] bg-[#EA990C] p-4 shadow-md shadow-[#307082]/15">
          <div className="inline-flex max-w-full items-center gap-2 rounded-xl border border-white/20 bg-[#307082] px-4 py-2.5 text-white shadow-md transition hover:bg-[#286575] hover:shadow-lg hover:shadow-[#307082]/25">
            <Factory className="h-4 w-4 shrink-0" />
            <div className="min-w-0 leading-tight">
              <h1 className="truncate text-base font-bold md:text-lg">
                Sản Xuất ERP - Sợi · Dệt · Nhuộm
              </h1>
              <p className="truncate text-xs font-medium text-white/85 md:text-sm">
                Module tổng hợp · Mobile/Tablet chuẩn app
              </p>
            </div>
          </div>
        </div>

        {/* Bottom tab bar */}
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/15 bg-[#307082]/95 shadow-[0_-4px_20px_rgba(48,112,130,0.28)] backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
          <div className="grid grid-cols-6 max-w-3xl mx-auto px-1 py-1.5">
            {TABS.map((t) => {
              const Icon = t.icon;
              const isActive = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => handleSelectTab(t.key)}
                  className={`flex flex-col items-center py-1.5 px-1 rounded-xl transition-all min-w-0 ${
                    isActive
                    ? "bg-[#EA990C] text-white shadow-sm scale-105 ring-1 ring-white/30"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[2]"}`} />
                  <span className={`mobile-nav-text-sm ${isActive ? "" : "text-white/75"}`}>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active screen */}
        <div className="pt-2 text-[#173F49]">
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
