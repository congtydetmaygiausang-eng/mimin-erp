"use client";

// @codex MIMIN GROUP - Tổng quan: KPI toàn mạng lưới + AI Search Agent hội thoại.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Building2, Factory, Boxes, Sparkles, Star, TrendingUp, Calendar, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/ui/PageHeader";
import AgentSearchBox from "@/components/sourcing/AgentSearchBox";
import {
  PARTNER_ROLES,
  ROLE_LABELS,
  calculatePartnerScore,
  loadProductionPartners,
  type ProductionPartner,
  type ProductionPartnerRole,
} from "@/lib/production-network";

function isThisMonth(iso: string): boolean {
  const date = new Date(iso);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

export default function MiminGroupOverviewPage() {
  const [partners, setPartners] = useState<ProductionPartner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    loadProductionPartners()
      .then((data) => { if (active) setPartners(data); })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Không tải được dữ liệu tổng quan"))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const stats = useMemo(() => {
    const total = partners.length;
    const factories = partners.filter((p) => p.roles.includes("SATELLITE_PROCESSOR")).length;
    const suppliers = partners.filter((p) => p.roles.includes("MATERIAL_SUPPLIER") || p.roles.includes("PACKAGING_FINISHER")).length;
    const cooperating = partners.filter((p) => p.status === "ACTIVE" && p.verificationStatus === "VERIFIED").length;
    const potential = partners.filter((p) => p.verificationStatus === "DISCOVERED").length;
    const scores = partners.map((p) => calculatePartnerScore(p)).filter((s): s is number => s !== null);
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    const newThisMonth = partners.filter((p) => isThisMonth(p.createdAt)).length;
    return { total, factories, suppliers, cooperating, potential, avgScore, newThisMonth };
  }, [partners]);

  const roleCounts = useMemo(() => {
    return PARTNER_ROLES.reduce<Record<ProductionPartnerRole, number>>((acc, role) => {
      acc[role] = partners.filter((p) => p.roles.includes(role)).length;
      return acc;
    }, { CUSTOMER: 0, SATELLITE_PROCESSOR: 0, MATERIAL_SUPPLIER: 0, PACKAGING_FINISHER: 0 });
  }, [partners]);

  return (
    <div className="space-y-5">
      <PageHeader
        moduleLabel="MIMIN ERP — MIMIN GROUP"
        title="Tổng quan mạng lưới đối tác"
        subtitle="Quản lý xưởng sản xuất & nhà cung cấp toàn diện — tìm kiếm bằng AI, chấm điểm và theo dõi hợp tác."
        icon={<Building2 className="w-5 h-5" />}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-black">{loading ? "…" : stats.total}</div>
            <Building2 className="w-5 h-5 text-brand-500" />
          </div>
          <div className="text-xs opacity-60 mt-1">Tổng số đối tác</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-black">{loading ? "…" : stats.factories}</div>
            <Factory className="w-5 h-5 text-violet-500" />
          </div>
          <div className="text-xs opacity-60 mt-1">Xưởng sản xuất</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-black">{loading ? "…" : stats.suppliers}</div>
            <Boxes className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-xs opacity-60 mt-1">Nhà cung cấp</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-black">{loading ? "…" : stats.cooperating}</div>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-xs opacity-60 mt-1">Đang hợp tác</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-black">{loading ? "…" : stats.potential}</div>
            <Sparkles className="w-5 h-5 text-violet-500" />
          </div>
          <div className="text-xs opacity-60 mt-1">Đối tác tiềm năng</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-black">{loading ? "…" : stats.avgScore !== null ? `${stats.avgScore}/100` : "—"}</div>
            <Star className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-xs opacity-60 mt-1">Đánh giá trung bình</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-black opacity-40">—</div>
            <ShoppingCart className="w-5 h-5 text-slate-400" />
          </div>
          <div className="text-xs opacity-60 mt-1">Đơn hàng đang thực hiện</div>
          <div className="text-[10px] opacity-40 mt-0.5">Chưa liên kết dữ liệu đơn hàng</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-black">{loading ? "…" : stats.newThisMonth}</div>
            <Calendar className="w-5 h-5 text-cyan-500" />
          </div>
          <div className="text-xs opacity-60 mt-1">Đối tác mới trong tháng</div>
        </div>
      </div>

      <AgentSearchBox />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/mang-luoi-san-xuat/xuong-san-xuat" className="card p-5 flex items-center justify-between hover:shadow-md transition">
          <div>
            <h3 className="font-bold">Xưởng sản xuất</h3>
            <p className="text-xs opacity-60 mt-1">{roleCounts.SATELLITE_PROCESSOR} xưởng — cắt, may, in, thêu, giặt, nhuộm...</p>
          </div>
          <Factory className="w-8 h-8 text-violet-400" />
        </Link>
        <Link href="/mang-luoi-san-xuat/nha-cung-cap" className="card p-5 flex items-center justify-between hover:shadow-md transition">
          <div>
            <h3 className="font-bold">Nhà cung cấp</h3>
            <p className="text-xs opacity-60 mt-1">{roleCounts.MATERIAL_SUPPLIER + roleCounts.PACKAGING_FINISHER} NCC — vải, phụ liệu, bao bì, đóng gói...</p>
          </div>
          <Boxes className="w-8 h-8 text-amber-400" />
        </Link>
        <Link href="/mang-luoi-san-xuat/xuong-san-xuat?role=CUSTOMER" className="card p-5 flex items-center justify-between hover:shadow-md transition">
          <div>
            <h3 className="font-bold">Khách hàng</h3>
            <p className="text-xs opacity-60 mt-1">{roleCounts.CUSTOMER} đầu ra sản xuất — brand, đại lý, đồng phục...</p>
          </div>
          <span className="text-xs rounded-full bg-emerald-100 text-emerald-700 px-2 py-1 font-semibold">{ROLE_LABELS.CUSTOMER}</span>
        </Link>
        <Link href="/mang-luoi-san-xuat/lich-su-tim-kiem" className="card p-5 flex items-center justify-between hover:shadow-md transition">
          <div>
            <h3 className="font-bold">Lịch sử tìm kiếm AI</h3>
            <p className="text-xs opacity-60 mt-1">Xem lại các lượt tìm kiếm và kết quả đã lưu</p>
          </div>
          <Sparkles className="w-8 h-8 text-cyan-400" />
        </Link>
      </div>
    </div>
  );
}
