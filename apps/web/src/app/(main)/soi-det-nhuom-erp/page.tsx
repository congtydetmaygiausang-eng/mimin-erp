"use client";

import { useState } from "react";
import { Factory } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/components/session-provider";
import { SCREENS, type Screen } from "./data";
import { Dashboard } from "./components/Dashboard";
import { NhapSoi, KhoSoi, KhoMoc, KhoTP } from "./components/NhapKhoScreens";
import { LenhDet, NghiemThuMoc, MeNhuom, NghiemThuMau } from "./components/SanXuatScreens";
import { CongNo, BaoCaoHaoHut, BaoCaoGiaVon, KhoLog, TruyNguoc } from "./components/BaoCaoScreens";

export default function SoiDetNhuomERPPage() {
  const { user } = useSession();
  const [screen, setScreen] = useState<Screen>("dashboard");

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="card p-4 mb-4 bg-gradient-to-r from-blue-500/10 via-violet-500/10 to-rose-500/10">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Factory className="w-7 h-7 text-blue-500" /> Sợi - Dệt - Nhuộm ERP Chuẩn
        </h1>
        <p className="opacity-70 text-sm">
          Quy trình 7 bước: Nhập sợi → Kho sợi → Lệnh dệt → Nghiệm thu mộc → Kho mộc → Mẻ nhuộm → Nghiệm thu màu → Kho TP
        </p>
        <div className="text-xs opacity-60 mt-1">
          ✅ Kho log bắt buộc · ✅ Giá vốn riêng từng màu · ✅ Truy ngược lô · ✅ Khóa giá vốn
        </div>
      </div>

      {/* Screen switcher */}
      <div className="card p-2 mb-4 flex flex-wrap gap-1.5">
        {SCREENS.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              className={`text-xs px-2.5 py-1.5 rounded-md flex items-center gap-1 ${
                screen === s.key ? "bg-blue-500 text-white" : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {s.label}
            </button>
          );
        })}
      </div>

      {/* Screen router */}
      {screen === "dashboard" && <Dashboard />}
      {screen === "nhapsoi" && <NhapSoi user={user} onSuccess={() => toast.success("Đã lưu")} />}
      {screen === "khosoi" && <KhoSoi />}
      {screen === "lenhdet" && <LenhDet user={user} />}
      {screen === "nghiemthumoc" && <NghiemThuMoc user={user} />}
      {screen === "khomoc" && <KhoMoc />}
      {screen === "menhuom" && <MeNhuom user={user} />}
      {screen === "nghiemthumau" && <NghiemThuMau user={user} />}
      {screen === "khotp" && <KhoTP user={user} />}
      {screen === "congno" && <CongNo />}
      {screen === "haohut" && <BaoCaoHaoHut />}
      {screen === "giavon" && <BaoCaoGiaVon />}
      {screen === "kho-log" && <KhoLog />}
      {screen === "truynguoc" && <TruyNguoc />}
    </div>
  );
}
