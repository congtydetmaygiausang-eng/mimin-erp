"use client";

// ============ LÔ HÀNG MOBILE (Đợt 7) ============
// Quản lý lô hàng + hạn sử dụng (mobile-first)

import { useState, useMemo, Suspense } from "react";
import { Layers, Calendar, AlertTriangle, Package } from "lucide-react";
import { getTonTheoMatHang } from "@/lib/kho-mobile-helper";
import { MobileCard, formatVNDShort } from "@/components/ui";
import type { LoaiKho } from "@/lib/data/kho-mobile-store";

export default function LoHangMobilePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm opacity-60">Đang tải…</div>}>
      <LoHangMobileContent />
    </Suspense>
  );
}

function LoHangMobileContent() {
  const [loaiKho, setLoaiKho] = useState<LoaiKho>("vai");
  const ds = useMemo(() => getTonTheoMatHang(loaiKho), [loaiKho]);

  // Tính giá trị tồn
  const tongGiaTri = ds.reduce((sum, v) => sum + v.ton * v.gia, 0);
  const sapHet = ds.filter((v) => v.ton < 100);
  const binhThuong = ds.filter((v) => v.ton >= 100);

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Layers className="w-7 h-7 text-amber-500" />
          Quản lý lô hàng
        </h1>
        <p className="opacity-70 mt-1 text-sm">
          {ds.length} mặt hàng · Tổng giá trị tồn: <b className="text-emerald-600">{formatVNDShort(tongGiaTri)}</b>
        </p>
      </div>

      <div className="flex gap-1.5">
        {(["vai", "phu-lieu"] as LoaiKho[]).map((k) => (
          <button
            key={k}
            onClick={() => setLoaiKho(k)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${
              loaiKho === k ? "bg-brand-500 text-white" : "bg-white/40 dark:bg-white/5"
            }`}
          >
            {k === "vai" ? "Vải" : "Phụ liệu"}
          </button>
        ))}
      </div>

      {/* Cảnh báo sắp hết */}
      {sapHet.length > 0 && (
        <div className="card p-3 bg-rose-500/10 border border-rose-500/20">
          <div className="flex items-center gap-2 text-sm text-rose-700 font-semibold">
            <AlertTriangle className="w-4 h-4" />
            {sapHet.length} mặt hàng sắp hết (&lt; 100 {loaiKho === "vai" ? "m" : "cái"})
          </div>
        </div>
      )}

      {/* Grid 2 cột: sắp hết + bình thường */}
      {sapHet.length > 0 && (
        <div>
          <h2 className="text-sm font-bold mb-2 flex items-center gap-1.5 text-rose-700">
            <AlertTriangle className="w-4 h-4" /> Sắp hết ({sapHet.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sapHet.map((v) => (
              <MobileCard
                key={v.ma}
                title={v.ma}
                subtitle={v.ten}
                badge={<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/15 text-rose-700">Sắp hết</span>}
                fields={[
                  { label: "Tồn", value: <span className="font-mono font-semibold text-rose-600">{v.ton.toLocaleString()} {v.donVi}</span>, highlight: true },
                  { label: "Đơn giá", value: <span className="font-mono">{v.gia.toLocaleString()}</span> },
                  { label: "Giá trị", value: <span className="font-mono text-emerald-600">{formatVNDShort(v.ton * v.gia)}</span> },
                ]}
              />
            ))}
          </div>
        </div>
      )}

      {binhThuong.length > 0 && (
        <div>
          <h2 className="text-sm font-bold mb-2 flex items-center gap-1.5 mt-4">
            <Package className="w-4 h-4 text-emerald-500" /> Bình thường ({binhThuong.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {binhThuong.map((v) => (
              <MobileCard
                key={v.ma}
                title={v.ma}
                subtitle={v.ten}
                badge={<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-700">OK</span>}
                fields={[
                  { label: "Tồn", value: <span className="font-mono">{v.ton.toLocaleString()} {v.donVi}</span> },
                  { label: "Đơn giá", value: <span className="font-mono">{v.gia.toLocaleString()}</span> },
                  { label: "Giá trị", value: <span className="font-mono text-emerald-600">{formatVNDShort(v.ton * v.gia)}</span> },
                ]}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
