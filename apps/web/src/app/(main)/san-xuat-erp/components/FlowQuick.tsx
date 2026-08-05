// ============ FLOW QUICK (6 STEP) ============
// Tach tu page.tsx (2026-08-05 - toi uu B.4)

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  getAllLenhDet, getAllMeNhuom, getAllLoVaiTP,
  nghiemThuDet_V2, nghiemThuMau_V2,
  type LoVaiTP,
} from "@/lib/yarn-production-chain";
import { FLOW_STEPS, type FlowStep } from "../data";

export function FlowQuick({ user }: { user: any }) {
  const [step, setStep] = useState<FlowStep>("khosoi");

  return (
    <div className="space-y-3 p-3">
      <div className="card p-3">
        <h3 className="font-bold text-sm mb-2">⚡ Truy cập nhanh theo vai</h3>
        <div className="grid grid-cols-2 gap-2">
          {FLOW_STEPS.map((s) => {
            const Icon = s.i;
            return (
              <button
                key={s.k}
                onClick={() => setStep(s.k)}
                className={`p-3 rounded-lg border-2 ${
                  step === s.k ? `border-${s.c}-500 bg-${s.c}-500/10` : "border-slate-200 dark:border-slate-700"
                }`}
              >
                <Icon className={`w-5 h-5 text-${s.c}-600 mx-auto mb-1`} />
                <div className="text-sm font-semibold">{s.l}</div>
                <div className="text-[10px] opacity-60">{s.sub}</div>
              </button>
            );
          })}
        </div>
      </div>

      {step === "khosoi" && <KhoSoiStep />}
      {step === "lenhdet" && <LenhDetStep />}
      {step === "nghiemthumoc" && <NghiemThuMocStep user={user} />}
      {step === "menhuom" && <MeNhuomStep />}
      {step === "nghiemthumau" && <NghiemThuMauStep user={user} />}
      {step === "khotp" && <KhoTPStep />}
    </div>
  );
}

function KhoSoiStep() {
  const [list, setList] = useState<any[]>([]);
  useEffect(() => { setList(JSON.parse(localStorage.getItem("mimin_lo_soi") || "[]")); }, []);
  return (
    <div className="card p-3 bg-blue-50 dark:bg-blue-900/20">
      <h3 className="font-bold text-blue-700 mb-2">📦 Kho sợi ({list.length} lô)</h3>
      {list.length === 0 ? (
        <p className="text-xs opacity-60 text-center py-4">Chưa có lô sợi nào. Tạo lệnh tổng trước.</p>
      ) : (
        list.map((l) => (
          <div key={l.id} className="p-2 mb-1 rounded bg-white dark:bg-slate-800 text-xs">
            <div className="flex justify-between">
              <span className="font-mono font-bold">{l.maLoSoi}</span>
              <span>{l.soKgConLai}/{l.soKgBanDau}kg</span>
            </div>
            <div className="opacity-70">{l.tenSoi}</div>
          </div>
        ))
      )}
    </div>
  );
}

function LenhDetStep() {
  const [lds, setLds] = useState(getAllLenhDet());
  return (
    <div className="card p-3 bg-violet-50 dark:bg-violet-900/20">
      <h3 className="font-bold text-violet-700 mb-2">🚛 Lệnh dệt ({lds.length})</h3>
      {lds.map((l) => (
        <div key={l.id} className="p-2 mb-1 rounded bg-white dark:bg-slate-800 text-xs">
          <div className="flex justify-between">
            <span className="font-mono font-bold">{l.id}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500 text-white">{l.trangThai}</span>
          </div>
          <div className="opacity-70">{l.xuongDet} - {l.soKgGiao}kg</div>
        </div>
      ))}
    </div>
  );
}

function NghiemThuMocStep({ user }: { user: any }) {
  const [lds, setLds] = useState(getAllLenhDet().filter((l) => l.trangThai !== "Hoàn thành" && l.trangThai !== "Hủy"));
  return (
    <div className="card p-3 bg-purple-50 dark:bg-purple-900/20">
      <h3 className="font-bold text-purple-700 mb-2">✅ NT mộc ({lds.length})</h3>
      {lds.map((l) => (
        <div key={l.id} className="p-2 mb-1 rounded bg-white dark:bg-slate-800 text-xs">
          <div className="font-mono font-bold">{l.id}</div>
          <div className="opacity-70">Giao {l.soKgGiao}kg - {l.xuongDet}</div>
          <button
            onClick={() => {
              const kg = parseInt(prompt(`Kg mộc nhận cho ${l.id}:`, String(Math.floor(l.soKgGiao * 0.92))) || "0");
              if (kg > 0) {
                const r = nghiemThuDet_V2(l.id, {
                  soKgMocNhan: kg, soCayMoc: Math.floor(kg / 20), soKgLoi: 0,
                  chiPhiPhatSinh: 0, daThanhToan: 0,
                  khoMocNhap: "Kho Vải Mộc", ketQuaKiemTra: "Đạt",
                }, user);
                if (r.ok) { toast.success(r.message); setLds(getAllLenhDet().filter((x) => x.trangThai !== "Hoàn thành" && x.trangThai !== "Hủy")); }
              }
            }}
            className="text-xs w-full mt-1 py-1 rounded bg-purple-500 text-white"
          >
            ✅ NT mộc
          </button>
        </div>
      ))}
    </div>
  );
}

function MeNhuomStep() {
  const [mns, setMns] = useState(getAllMeNhuom());
  return (
    <div className="card p-3 bg-rose-50 dark:bg-rose-900/20">
      <h3 className="font-bold text-rose-700 mb-2">🎨 Mẻ nhuộm ({mns.length})</h3>
      {mns.map((m) => (
        <div key={m.id} className="p-2 mb-1 rounded bg-white dark:bg-slate-800 text-xs">
          <div className="flex justify-between">
            <span className="font-mono font-bold">{m.id}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500 text-white">{m.trangThai}</span>
          </div>
          <div className="opacity-70">{m.xuongNhuom} - {m.tongKgXuat}kg - {m.danhSachMau.length} màu</div>
        </div>
      ))}
    </div>
  );
}

function NghiemThuMauStep({ user }: { user: any }) {
  const [mns, setMns] = useState(getAllMeNhuom().filter((m) => m.trangThai !== "Hoàn thành"));
  return (
    <div className="card p-3 bg-pink-50 dark:bg-pink-900/20">
      <h3 className="font-bold text-pink-700 mb-2">🎨 NT màu ({mns.length})</h3>
      {mns.map((m) => (
        <div key={m.id} className="p-2 mb-1 rounded bg-white dark:bg-slate-800 text-xs">
          <div className="font-mono font-bold">{m.id}</div>
          {m.danhSachMau.map((x) => (
            <div key={x.mau} className="mt-1 flex items-center justify-between">
              <span><strong>{x.mau}</strong> - {x.soKg}kg</span>
              <button
                onClick={() => {
                  const kg = parseInt(prompt(`Kg màu nhận cho ${x.mau}:`, String(Math.floor(x.soKg * 0.95))) || "0");
                  if (kg > 0) {
                    const r = nghiemThuMau_V2(m.id, [{
                      mau: x.mau, soKgMocGiao: x.soKg, soKgMauNhan: kg,
                      soCayNhan: Math.floor(kg / 20), soKgLoi: 0, donGiaNhuom: x.donGiaNhuom,
                      chiPhiHoaChat: 200000, chiPhiHoanThien: 100000, chiPhiPhatSinh: 0, daThanhToan: 0,
                    }], user?.name || "system", user);
                    if (r.ok) { toast.success(r.message); setMns(getAllMeNhuom().filter((x) => x.trangThai !== "Hoàn thành")); }
                  }
                }}
                className="text-[10px] px-2 py-0.5 rounded bg-pink-500 text-white"
              >
                NT {x.mau}
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function KhoTPStep() {
  const [ltps, setLtps] = useState<LoVaiTP[]>([]);
  useEffect(() => { setLtps(getAllLoVaiTP()); }, []);
  return (
    <div className="card p-3 bg-emerald-50 dark:bg-emerald-900/20">
      <h3 className="font-bold text-emerald-700 mb-2">📦 Kho vải TP ({ltps.length})</h3>
      {ltps.length === 0 ? (
        <p className="text-xs opacity-60 text-center py-4">Chưa có lô vải TP</p>
      ) : (
        ltps.map((l) => (
          <div key={l.id} className="p-2 mb-1 rounded bg-white dark:bg-slate-800 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold">{l.maLo}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded text-white bg-emerald-500">{l.mau}</span>
            </div>
            <div className="opacity-70">{l.tongKg.toFixed(0)}kg · {l.giaVonPerKg.toFixed(0)}đ/kg · {l.khu}/{l.ke}</div>
          </div>
        ))
      )}
    </div>
  );
}
