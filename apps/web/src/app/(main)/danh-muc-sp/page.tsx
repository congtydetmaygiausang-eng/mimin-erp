"use client";

// ============================================
// Danh muc san pham - POLOMIMIN
// Redesign 2026-08-06: layout card NGANG + nen CYAN
// ============================================

import { useState, useEffect, useMemo } from "react";
import { Search, Shirt, Sparkles, TrendingUp, X } from "lucide-react";
import { useDanhMucSP } from "@/lib/data/danh-muc-sp-store";
import HorizontalProductCard from "@/components/danh-muc-sp/HorizontalProductCard";

const FILTER_TABS = [
  { id: "all", label: "Tất cả", icon: Sparkles },
  { id: "ao", label: "Áo", icon: Shirt },
  { id: "bo", label: "Bộ", icon: Shirt },
  { id: "phu-kien", label: "Phụ kiện", icon: Sparkles },
];

export default function DanhMucSanPhamPage() {
  const { dsSanPham, loading } = useDanhMucSP();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filtered = useMemo(() => {
    let result = dsSanPham || [];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (sp) =>
          (sp.id || "").toLowerCase().includes(q) ||
          (sp.tenSP || "").toLowerCase().includes(q)
      );
    }
    if (activeFilter !== "all") {
      result = result.filter((sp) => {
        if (activeFilter === "ao") return sp.loaiSP === "AoTru" || sp.loaiSP === "AoPolo";
        if (activeFilter === "bo") return sp.loaiSP === "BoTru";
        if (activeFilter === "phu-kien") return sp.loaiSP === "PhuKien";
        return true;
      });
    }
    return result;
  }, [dsSanPham, search, activeFilter]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-600 via-cyan-700 to-cyan-800 -m-4 md:-m-6 p-4 md:p-6">
      {/* === HEADER: Trắng trên CYAN === */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow-lg flex items-center gap-3">
              <Shirt className="w-9 h-9" />
              Danh mục Sản phẩm
              <span className="text-cyan-200 text-base font-normal">
                ({filtered.length} sản phẩm)
              </span>
            </h1>
            <p className="text-cyan-50 mt-2 text-sm md:text-base font-medium">
              <Sparkles className="w-4 h-4 inline mr-1" />
              POLOMIMIN - Hơn 10.000+ khách hàng đã tin dùng
            </p>
          </div>

          {/* Search bar - glassmorphism */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-600" />
            <input
              type="text"
              placeholder="Tìm theo mã hoặc tên sản phẩm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-white/30 bg-white/95 backdrop-blur-md text-sm focus:ring-2 focus:ring-white focus:border-white outline-none shadow-xl"
            />
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {FILTER_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition whitespace-nowrap shadow-md ${
                  active
                    ? "bg-white text-cyan-700"
                    : "bg-white/20 backdrop-blur text-white hover:bg-white/30"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* === GRID CARDS (horizontal layout) === */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/10 backdrop-blur rounded-3xl max-w-7xl mx-auto">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4"></div>
          <div className="text-white font-semibold">Đang đồng bộ dữ liệu từ Supabase...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white/10 backdrop-blur rounded-3xl max-w-7xl mx-auto">
          <Shirt className="w-16 h-16 mx-auto text-white/40 mb-4" />
          <p className="text-white font-semibold">Không tìm thấy sản phẩm nào</p>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto space-y-4">
          {filtered.map((sp) => (
            <HorizontalProductCard key={sp.id} sp={sp} />
          ))}
        </div>
      )}
    </div>
  );
}
