import React from "react";
import { type LenhCat } from "@/lib/data/lenh-cat-store";
import { MauCardStage } from "./MauCardStage";

export function StageTabsView({ lc }: { lc: LenhCat }) {
  const isBo = lc.loaiSP?.toLowerCase().includes("bo");

  return (
    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
      <h2 className="text-xl font-black text-slate-800 mb-6">Tỉ lệ size theo màu</h2>
      
      <div className="flex flex-col gap-8">
        {lc.dsMau?.map((mau, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <div className="mb-4">
              <h3 className="text-lg font-black text-slate-800">Màu {idx + 1}: {mau.ten || "Chưa đặt tên"}</h3>
              <p className="text-sm font-bold text-slate-500">Mã vải: {mau.maVai || "Chưa có"}</p>
            </div>
            
            <div className={`grid grid-cols-1 ${isBo ? "md:grid-cols-2" : ""} gap-6`}>
              {/* Cột Trái: Áo */}
              <MauCardStage 
                title={isBo ? "THÔNG TIN ÁO" : "THÔNG TIN MÀU VÀ SIZE"} 
                mau={mau} 
                lc={lc} 
                type="ao"
              />

              {/* Cột Phải: Quần (chỉ hiện nếu là Bộ) */}
              {isBo && (
                <MauCardStage 
                  title="THÔNG TIN QUẦN" 
                  mau={mau} 
                  lc={lc} 
                  type="quan"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
