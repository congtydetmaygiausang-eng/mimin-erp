// ============ DASHBOARD ============
// Tach tu page.tsx (2026-08-05 - toi uu B.1)

import { useMemo } from "react";
import { Package, Truck, Palette, Boxes, DollarSign, Factory, CheckCircle2, ChevronRight } from "lucide-react";
import {
  getAllPhieuNhapSoi, getAllLenhDet, getAllMeNhuom, getAllLoVaiTP,
} from "@/lib/yarn-production-chain";
import { Stat } from "./ui-blocks";

// Workflow steps (khong phu thuoc state)
const WORKFLOW_STEPS = [
  { l: "1. Nhập sợi", i: Package, c: "blue" },
  { l: "2. Kho sợi", i: Boxes, c: "indigo" },
  { l: "3. Lệnh dệt", i: Truck, c: "violet" },
  { l: "4. Nghiệm thu mộc", i: CheckCircle2, c: "purple" },
  { l: "5. Kho mộc", i: Boxes, c: "fuchsia" },
  { l: "6. Mẻ nhuộm (nhiều màu)", i: Palette, c: "rose" },
  { l: "7. Nghiệm thu màu (riêng từng màu)", i: CheckCircle2, c: "pink" },
  { l: "8. Kho vải TP (từng cây)", i: Boxes, c: "emerald" },
];

export function Dashboard() {
  const pnss = getAllPhieuNhapSoi();
  const lds = getAllLenhDet();
  const mns = getAllMeNhuom();
  const ltps = getAllLoVaiTP();

  const tongTienSoi = pnss.reduce((s, p) => s + p.thanhTien, 0);
  const tongTienDet = lds.reduce((s, l) => s + ((l.soKgGiao * l.donGiaDet) + (l.chiPhiPhatSinh || 0)), 0);
  const tongKgTP = ltps.reduce((s, l) => s + l.tongKg, 0);
  const tongGiaTriTP = ltps.reduce((s, l) => s + l.tongGiaTri, 0);

  // tongTienNhuom tam thoi = 0 (placeholder)
  const tongTienNhuom = useMemo(() => mns.reduce((s) => s + 0, 0), [mns]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat icon={<Package className="w-4 h-4" />} label="Nhập sợi" value={`${(tongTienSoi / 1_000_000).toFixed(1)}tr`} sub={`${pnss.length} phiếu`} color="blue" />
        <Stat icon={<Truck className="w-4 h-4" />} label="Chi phí dệt" value={`${(tongTienDet / 1_000_000).toFixed(1)}tr`} sub={`${lds.length} lệnh`} color="violet" />
        <Stat icon={<Palette className="w-4 h-4" />} label="Mẻ nhuộm" value={mns.length} sub="đang xử lý" color="rose" />
        <Stat icon={<Boxes className="w-4 h-4" />} label="Vải TP" value={`${tongKgTP.toLocaleString()}kg`} sub={`${ltps.length} lô`} color="emerald" />
        <Stat icon={<DollarSign className="w-4 h-4" />} label="Giá trị TP" value={`${(tongGiaTriTP / 1_000_000).toFixed(1)}tr`} sub="tổng kho" color="amber" />
      </div>

      {/* Workflow diagram */}
      <div className="card p-4">
        <h3 className="font-bold mb-3 flex items-center gap-2"><Factory className="w-5 h-5 text-blue-500" /> Luồng dữ liệu 7 bước (có kho log + truy ngược)</h3>
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {WORKFLOW_STEPS.map((s, idx, arr) => {
            const Icon = s.i;
            return (
              <span key={s.l} className="contents">
                <span className={`px-2 py-1 rounded bg-${s.c}-500/20 text-${s.c}-700 font-semibold flex items-center gap-1`}>
                  <Icon className="w-3 h-3" /> {s.l}
                </span>
                {idx < arr.length - 1 && <ChevronRight className="w-3 h-3 opacity-50" />}
              </span>
            );
          })}
        </div>
        <div className="mt-3 text-xs opacity-70 leading-relaxed">
          <strong>Quy tắc ERP:</strong> Không sửa tồn kho trực tiếp. Mọi nhập/xuất qua phiếu + kho_log.
          Không sửa giá vốn sau khi khóa. 1 mẻ nhiều màu. Mỗi màu giá/hao hụt/giá vốn riêng.
          Truy ngược: Vải TP → Mẻ nhuộm → Vải mộc → Lệnh dệt → Lô sợi → NCC.
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="card p-3">
          <h3 className="font-semibold text-sm mb-2">📦 Nhập sợi gần đây</h3>
          {pnss.slice(0, 3).map((p) => (
            <div key={p.id} className="text-xs p-2 mb-1 rounded bg-slate-50 dark:bg-slate-800/50">
              <div className="font-mono font-semibold">{p.id} - {p.maLoSoi}</div>
              <div className="opacity-80">{p.tenSoi} - {p.soKg}kg - {(p.thanhTien / 1_000_000).toFixed(1)}tr</div>
            </div>
          ))}
        </div>
        <div className="card p-3">
          <h3 className="font-semibold text-sm mb-2">🧵 Lệnh dệt gần đây</h3>
          {lds.slice(0, 3).map((l) => (
            <div key={l.id} className="text-xs p-2 mb-1 rounded bg-slate-50 dark:bg-slate-800/50">
              <div className="font-mono font-semibold">{l.id} - {l.xuongDet}</div>
              <div className="opacity-80">{l.soKgGiao}kg sợi {l.loaiSoi} → {l.soKgMocNhan || "?"}kg mộc ({l.haoHutPt?.toFixed(1) || "?"}%)</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
