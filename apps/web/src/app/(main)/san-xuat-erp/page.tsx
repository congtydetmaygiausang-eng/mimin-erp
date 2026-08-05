"use client";

import { useState } from "react";
import { Factory } from "lucide-react";
import { useSession } from "@/components/session-provider";
import { TABS, type Tab } from "./data";
import { Dashboard } from "./components/Dashboard";
import { MasterData } from "./components/MasterData";
import { LenhTongForm } from "./components/LenhTongForm";
import { FlowQuick } from "./components/FlowQuick";
import { CongNoView, BaoCaoView } from "./components/Views";

export default function SanXuatERPPage() {
  const { user } = useSession();
  const [tab, setTab] = useState<Tab>("dashboard");

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-fade-in">
      {/* Mobile-first header */}
      <div className="card p-3 bg-gradient-to-r from-blue-500/10 via-violet-500/10 to-rose-500/10 sticky top-0 z-10 backdrop-blur">
        <h1 className="text-lg md:text-2xl font-bold flex items-center gap-2">
          <Factory className="w-5 h-5 md:w-7 md:h-7 text-blue-500" />
          Sản Xuất ERP - Sợi · Dệt · Nhuộm
        </h1>
        <p className="opacity-70 text-xs">Module tổng hợp · Mobile/Tablet chuẩn app</p>
      </div>

      {/* Bottom tab bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 mobile-nav-gradient-bottom shadow-[0_-4px_20px_rgba(14,165,233,0.08)] pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-6 max-w-3xl mx-auto px-1 py-1.5">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex flex-col items-center py-1.5 px-1 rounded-xl transition-all min-w-0 ${
                  isActive
                    ? `text-${t.color}-700 bg-white/60 shadow-sm scale-105`
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[2]"}`} />
                <span className={`mobile-nav-text-sm ${isActive ? "" : "text-slate-600"}`}>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active screen */}
      <div className="pt-2">
        {tab === "dashboard" && <Dashboard />}
        {tab === "master" && <MasterData />}
        {tab === "lenhtong" && <LenhTongForm user={user} />}
        {tab === "flow" && <FlowQuick user={user} />}
        {tab === "congno" && <CongNoView />}
        {tab === "baocao" && <BaoCaoView />}
      </div>
    </div>
  );
}
