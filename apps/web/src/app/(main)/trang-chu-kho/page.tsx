"use client";

// ============ TRANG CHỦ KHO (Đợt 7 - Bộ 7) ============
// Mobile-first dashboard cho NV Kho (Vải / Phụ liệu / Thành phẩm)
// 6 KPI + tổng tồn + cảnh báo

import Link from "next/link";
import {
  Home, Warehouse, ArrowDownToLine, ArrowUpFromLine, ClipboardCheck,
  Package, AlertTriangle, ChevronRight, Layers, ArrowRight,
} from "lucide-react";
import { useSession } from "@/components/session-provider";
import { useKhoMobile, TRANG_THAI_PK_STYLE } from "@/lib/data/kho-mobile-store";
import { getKhoKPI, getTonKhoHienTai, getTonTheoMatHang } from "@/lib/kho-mobile-helper";
import { MobileCard, EmptyState, formatVNDShort, DateDisplay } from "@/components/ui";

export default function TrangChuKhoPage() {
  const { user } = useSession();
  const { phieu } = useKhoMobile();
  const kpi = getKhoKPI(phieu);

  // Tổng tồn 3 kho
  const tonVai = getTonKhoHienTai("vai");
  const tonPL = getTonKhoHienTai("phu-lieu");
  const tonTP = getTonKhoHienTai("thanh-pham");

  // Phiếu chờ duyệt (top 5)
  const choDuyet = phieu.filter((p) => p.trangThai === "Chờ duyệt").slice(0, 5);

  // Mặt hàng tồn thấp (< 100)
  const tonThap = [
    ...getTonTheoMatHang("vai"),
    ...getTonTheoMatHang("phu-lieu"),
  ].filter((v) => v.ton < 100).slice(0, 5);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="card p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs opacity-70 flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5" /> Trang chủ Kho
            </div>
            <h1 className="text-xl md:text-2xl font-bold mt-1">
              Xin chào, {user?.name || user?.id} 📦
            </h1>
            <p className="text-xs opacity-70 mt-1">
              Vai · Phụ liệu · Thành phẩm
            </p>
          </div>
          <div className="text-3xl">🏭</div>
        </div>
      </div>

      {/* Cảnh báo */}
      {tonThap.length > 0 && (
        <div className="card p-3 bg-rose-500/10 border border-rose-500/20">
          <div className="flex items-center gap-2 text-sm text-rose-700 font-semibold">
            <AlertTriangle className="w-4 h-4" />
            {tonThap.length} mặt hàng sắp hết (&lt; 100)
          </div>
        </div>
      )}

      {/* 6 KPI */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="card p-3 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 text-emerald-700">
          <div className="text-xs opacity-80 mb-1">Tồn vải</div>
          <div className="text-xl font-bold">{tonVai.toLocaleString()}</div>
        </div>
        <div className="card p-3 bg-gradient-to-br from-sky-500/10 to-sky-500/5 text-sky-700">
          <div className="text-xs opacity-80 mb-1">Tồn phụ liệu</div>
          <div className="text-xl font-bold">{tonPL.toLocaleString()}</div>
        </div>
        <div className="card p-3 bg-gradient-to-br from-violet-500/10 to-violet-500/5 text-violet-700">
          <div className="text-xs opacity-80 mb-1">Tồn thành phẩm</div>
          <div className="text-xl font-bold">{tonTP.toLocaleString()}</div>
        </div>
        <div className="card p-3 bg-gradient-to-br from-amber-500/10 to-amber-500/5 text-amber-700">
          <div className="text-xs opacity-80 mb-1">Chờ duyệt</div>
          <div className="text-xl font-bold">{kpi.choDuyet}</div>
        </div>
        <div className="card p-3 bg-gradient-to-br from-teal-500/10 to-teal-500/5 text-teal-700">
          <div className="text-xs opacity-80 mb-1">Nhập hôm nay</div>
          <div className="text-xl font-bold">{kpi.tongGiaTriNhap > 0 ? formatVNDShort(kpi.tongGiaTriNhap) : "0"}</div>
        </div>
        <div className="card p-3 bg-gradient-to-br from-orange-500/10 to-orange-500/5 text-orange-700">
          <div className="text-xs opacity-80 mb-1">Xuất hôm nay</div>
          <div className="text-xl font-bold">{kpi.tongGiaTriXuat > 0 ? formatVNDShort(kpi.tongGiaTriXuat) : "0"}</div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Link href="/nhap-kho-mobile" className="card p-3 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 text-emerald-700 hover:scale-105 transition-transform">
          <div className="flex flex-col items-center gap-1.5">
            <ArrowDownToLine className="w-4 h-4" />
            <span className="text-xs font-medium">Nhập kho</span>
          </div>
        </Link>
        <Link href="/xuat-kho-mobile" className="card p-3 bg-gradient-to-br from-sky-500/10 to-sky-500/5 text-sky-700 hover:scale-105 transition-transform">
          <div className="flex flex-col items-center gap-1.5">
            <ArrowUpFromLine className="w-4 h-4" />
            <span className="text-xs font-medium">Xuất kho</span>
          </div>
        </Link>
        <Link href="/kiem-ke-mobile" className="card p-3 bg-gradient-to-br from-violet-500/10 to-violet-500/5 text-violet-700 hover:scale-105 transition-transform">
          <div className="flex flex-col items-center gap-1.5">
            <ClipboardCheck className="w-4 h-4" />
            <span className="text-xs font-medium">Kiểm kê</span>
          </div>
        </Link>
        <Link href="/lo-hang-mobile" className="card p-3 bg-gradient-to-br from-amber-500/10 to-amber-500/5 text-amber-700 hover:scale-105 transition-transform">
          <div className="flex flex-col items-center gap-1.5">
            <Layers className="w-4 h-4" />
            <span className="text-xs font-medium">Lô hàng</span>
          </div>
        </Link>
      </div>

      {/* Chờ duyệt */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Phiếu chờ duyệt ({choDuyet.length})
          </h2>
        </div>
        {choDuyet.length === 0 ? (
          <EmptyState title="Không có phiếu chờ" description="Tất cả đã duyệt 🎉" />
        ) : (
          <div className="space-y-2">
            {choDuyet.map((p) => {
              const s = TRANG_THAI_PK_STYLE[p.trangThai];
              return (
                <MobileCard
                  key={p.id}
                  title={p.id}
                  subtitle={`${p.loai === "nhap" ? "Nhập" : p.loai === "xuat" ? "Xuất" : "Kiểm kê"} · ${p.loaiKho} · ${p.tenSP}`}
                  badge={<span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${s.bg} ${s.color}`}>{p.trangThai}</span>}
                  fields={[
                    { label: "SL", value: <span className="font-mono">{p.soLuong.toLocaleString()} {p.donVi}</span> },
                    { label: "Giá trị", value: <span className="font-mono font-semibold text-emerald-600">{formatVNDShort(p.thanhTien)}</span> },
                    { label: "Người tạo", value: p.nguoiTao },
                    { label: "Ngày", value: <DateDisplay value={p.ngayTao} /> },
                  ]}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
