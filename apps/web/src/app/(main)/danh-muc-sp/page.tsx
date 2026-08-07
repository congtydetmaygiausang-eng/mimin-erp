"use client";

// ============================================
// Danh muc san pham - POLOMIMIN
// Redesign 2026-08-07: thu vien the card (grid 4 cols)
// ============================================

import { useState, useEffect, useMemo } from "react";
import { Search, Shirt, Sparkles, TrendingUp, X, Plus } from "lucide-react";
import { useDanhMucSP } from "@/lib/data/danh-muc-sp-store";
import { toast } from "sonner";
import ProductLibraryCard from "@/components/danh-muc-sp/ProductLibraryCard";

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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
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
        if (activeFilter === "ao") return sp.loaiSP === "AoTru" || sp.loaiSP === "AoCoTron" || sp.loaiSP === "AoPolo";
        if (activeFilter === "bo") return sp.loaiSP === "BoTru" || sp.loaiSP === "BoCoTron";
        if (activeFilter === "phu-kien") return sp.loaiSP === "PhuKien";
        return true;
      });
    }
    return result;
  }, [dsSanPham, search, activeFilter]);

  // === HANDLERS (3 CTA buttons) ===
  const handleAddToCart = (sp: any) => {
    toast.success(`Đã thêm "${sp.tenSP}" vào giỏ`);
  };
  const handleCreateOrder = (sp: any) => {
    toast.success(`Đang tạo đơn hàng từ "${sp.tenSP}"...`);
    // TODO: Open OrderFormModal
  };
  const handleDirectOrder = (sp: any) => {
    toast.success(`Đặt hàng nhanh "${sp.tenSP}"`);
    // TODO: Open DirectOrderModal
  };
  const handleFavorite = (sp: any) => {
    toast.success(`Đã thêm "${sp.tenSP}" vào yêu thích`);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-600 via-cyan-700 to-cyan-800 -m-4 md:-m-6 p-4 md:p-6">
      {/* === HEADER === */}
      <div className="max-w-[1600px] mx-auto mb-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow-lg flex items-center gap-3">
              <Shirt className="w-9 h-9" />
              Danh mục Sản phẩm
              <span className="text-cyan-200 text-base font-normal">
                ({filtered.length} sản phẩm)
              </span>
            </h1>
            <p className="text-cyan-50 mt-2 text-sm md:text-base font-medium flex flex-wrap items-center gap-2">
              <Sparkles className="w-4 h-4 inline" />
              POLOMIMIN - Hơn 10.000+ khách hàng đã tin dùng
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/90 text-white text-[10px] font-bold rounded-md uppercase tracking-wider shadow">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                Live data từ Supabase
              </span>
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

        {/* Filter tabs + view toggle */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 flex-1">
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

          {/* Stats badge */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-cyan-100 text-xs font-semibold whitespace-nowrap">
              {filtered.length} sản phẩm
            </span>
          </div>
        </div>
      </div>

      {/* === LOADING / EMPTY === */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/10 backdrop-blur rounded-3xl max-w-[1600px] mx-auto">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4"></div>
          <div className="text-white font-semibold">Đang đồng bộ dữ liệu từ Supabase...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white/10 backdrop-blur rounded-3xl max-w-[1600px] mx-auto">
          <Shirt className="w-16 h-16 mx-auto text-white/40 mb-4" />
          <p className="text-white font-semibold text-lg">Không tìm thấy sản phẩm nào trong database</p>
          <p className="text-cyan-100 text-sm mt-2">Vào Supabase Dashboard → SQL Editor → chạy file <code className="bg-white/20 px-2 py-0.5 rounded">fix-rls-and-add-columns.sql</code></p>
        </div>
      ) : (
        /* === GRID: thu vien the card (2/3/4/5 cols responsive) === */
        <div className="max-w-[1600px] mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4">
            {filtered.map((sp) => (
              <ProductLibraryCard
                key={sp.id}
                sp={sp}
                onAddToCart={handleAddToCart}
                onCreateOrder={handleCreateOrder}
                onDirectOrder={handleDirectOrder}
                onFavorite={handleFavorite}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
