"use client";

// ============================================
// Danh muc san pham - POLOMIMIN
// Redesign 2026-08-07: thu vien the card (grid 4 cols)
// ============================================

import { useState, useEffect, useMemo } from "react";
import { Search, Shirt, Sparkles, TrendingUp, X, Plus, Package, Tag, ShoppingCart } from "lucide-react";
import { useDanhMucSP, type SanPham } from "@/lib/data/danh-muc-sp-store";
import { useGioHang } from "@/lib/data/gio-hang-store";
import { useDonHang } from "@/lib/data/don-hang-store";
import { toast } from "sonner";
import ProductLibraryCard from "@/components/danh-muc-sp/ProductLibraryCard";
import ProductDetailModal from "@/components/danh-muc-sp/ProductDetailModal";
import ProductFormModal from "@/components/danh-muc-sp/ProductFormModal";
import { GioHangDrawer } from "@/components/danh-muc-sp/GioHangDrawer";
import OrderFormModal from "@/components/order-detail/OrderFormModal";
import { createEmptyOrder, createOrderItemFromVariant } from "@/components/order-detail/helpers";
import { generateVariants } from "@/lib/data/product-variants";
import type { Order } from "@/components/order-detail/types";

const FILTER_TABS = [
  { id: "all", label: "Tất cả", icon: Sparkles },
  { id: "ao", label: "Áo", icon: Shirt },
  { id: "bo", label: "Bộ", icon: Shirt },
  { id: "phu-kien", label: "Phụ kiện", icon: Sparkles },
  { id: "ban-san", label: "Bán Sàn", icon: Package },
  { id: "ban-sale", label: "Bán Sale", icon: Tag },
];

export default function DanhMucSanPhamPage() {
  const { dsSanPham, loading, themSP, suaSP, xoaSP } = useDanhMucSP();
  const { items: gioHangItems, themVaoGio, capNhatSoLuong, xoaKhoiGio, xoaGio, tongSoLuong: soLuongTrongGio } = useGioHang();
  const { themOrder } = useDonHang();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedProduct, setSelectedProduct] = useState<SanPham | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [productToEdit, setProductToEdit] = useState<SanPham | null>(null);
  const [showGioHang, setShowGioHang] = useState(false);
  const [orderFormInitial, setOrderFormInitial] = useState<Order | null>(null);
  const [orderFromCart, setOrderFromCart] = useState(false);
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
        if (activeFilter === "ban-san") return sp.ghiChu?.toLowerCase().includes("sàn") || sp.tenSP.toLowerCase().includes("sàn");
        if (activeFilter === "ban-sale") return sp.ghiChu?.toLowerCase().includes("sale") || sp.tenSP.toLowerCase().includes("sale");
        return true;
      });
    }
    return result;
  }, [dsSanPham, search, activeFilter]);

  // === HANDLERS (3 CTA buttons) ===
  const handleAddToCart = (sp: SanPham) => {
    themVaoGio(sp);
    toast.success(`Đã thêm "${sp.tenSP}" vào giỏ`);
  };

  // Tạo 1 đơn hàng chỉ với đúng SP này (biến thể đầu tiên) - mở OrderFormModal
  // có sẵn để chọn thêm màu/size/khách hàng/thanh toán nếu cần.
  const openQuickOrder = (sp: SanPham) => {
    const variants = generateVariants(sp.id, sp.dsMau || [], sp.bangSize);
    const first = variants[0];
    const order = createEmptyOrder();
    order.items = [
      createOrderItemFromVariant({
        spId: sp.id,
        spTen: sp.tenSP,
        mauCode: first?.mauCode,
        mauTen: first?.mauTen || sp.dsMau?.[0]?.ten,
        size: first?.size,
        sku: first?.maSKU,
        donGia: sp.giaBanDuKien,
      }),
    ];
    setOrderFromCart(false);
    setOrderFormInitial(order);
  };
  const handleCreateOrder = (sp: SanPham) => openQuickOrder(sp);
  const handleDirectOrder = (sp: SanPham) => openQuickOrder(sp);

  const handleFavorite = (sp: any) => {
    toast.success(`Đã thêm "${sp.tenSP}" vào yêu thích`);
  };

  // Chốt giỏ hàng -> đơn hàng nháp, mở OrderFormModal để hoàn tất khách hàng/thanh toán
  const handleCheckoutGioHang = () => {
    if (gioHangItems.length === 0) return;
    const order = createEmptyOrder();
    order.items = gioHangItems.map((it) =>
      createOrderItemFromVariant({
        spId: it.spId,
        spTen: it.spTen,
        mauCode: it.mauCode,
        mauTen: it.mauTen,
        size: it.size,
        sku: it.sku,
        donGia: it.donGia,
      })
    ).map((item, idx) => ({ ...item, soLuong: gioHangItems[idx].soLuong, thanhTien: gioHangItems[idx].soLuong * gioHangItems[idx].donGia }));
    setOrderFromCart(true);
    setOrderFormInitial(order);
    setShowGioHang(false);
  };

  const handleSaveOrderForm = (order: Order) => {
    themOrder(order);
    toast.success(`Đã tạo đơn hàng: ${order.maDH}`);
    if (orderFromCart) xoaGio();
    setOrderFormInitial(null);
    setOrderFromCart(false);
  };

  const handleEditProduct = (sp: SanPham) => {
    setSelectedProduct(null);
    setProductToEdit(sp);
    setShowProductForm(true);
  };

  const handleDeleteProduct = (sp: SanPham) => {
    if (confirm(`Bạn có chắc muốn xóa sản phẩm ${sp.tenSP}?`)) {
      if (xoaSP) {
        xoaSP(sp.id);
        setSelectedProduct(null);
        toast.success("Đã xóa sản phẩm thành công!");
      }
    }
  };

  const handleSaveProduct = async (sp: Partial<SanPham>) => {
    if (productToEdit && suaSP) {
      await suaSP(productToEdit.id, sp);
      toast.success(`Đã cập nhật sản phẩm: ${sp.tenSP}`);
    } else if (themSP) {
      await themSP(sp as SanPham);
      toast.success(`Đã tạo sản phẩm mới: ${sp.tenSP}`);
    }
    setShowProductForm(false);
    setProductToEdit(null);
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

          {/* Search bar & Add Button */}
          <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
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
            <button
              onClick={() => setShowGioHang(true)}
              className="relative w-full md:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-white/20 backdrop-blur text-white font-extrabold rounded-2xl shadow-xl hover:bg-white/30 transition-colors whitespace-nowrap"
            >
              <ShoppingCart className="w-5 h-5" /> Giỏ hàng
              {soLuongTrongGio > 0 && (
                <span className="absolute -top-2 -right-2 min-w-[22px] h-[22px] px-1 rounded-full bg-rose-500 text-white text-[11px] font-black flex items-center justify-center shadow-md">
                  {soLuongTrongGio}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowProductForm(true)}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white text-cyan-700 font-extrabold rounded-2xl shadow-xl hover:bg-cyan-50 transition-colors whitespace-nowrap"
            >
              <Plus className="w-5 h-5"/> Tạo Mới
            </button>
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
        /* === GRID: thu vien the card (4 cols responsive cho the to) === */
        <div className="max-w-[1600px] mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
            {filtered.map((sp) => (
              <ProductLibraryCard
                key={sp.id}
                sp={sp}
                onAddToCart={handleAddToCart}
                onCreateOrder={handleCreateOrder}
                onDirectOrder={handleDirectOrder}
                onFavorite={handleFavorite}
                onClick={(product) => setSelectedProduct(product)}
              />
            ))}
          </div>
        </div>
      )}

      {selectedProduct && (
        <ProductDetailModal
          sp={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          onEdit={handleEditProduct}
          onDelete={handleDeleteProduct}
        />
      )}

      {showProductForm && (
        <ProductFormModal
          initialData={productToEdit || undefined}
          onClose={() => {
            setShowProductForm(false);
            setProductToEdit(null);
          }}
          onSave={handleSaveProduct}
        />
      )}

      {showGioHang && (
        <GioHangDrawer
          items={gioHangItems}
          onClose={() => setShowGioHang(false)}
          onUpdateQty={capNhatSoLuong}
          onRemove={xoaKhoiGio}
          onClearAll={xoaGio}
          onCheckout={handleCheckoutGioHang}
        />
      )}

      <OrderFormModal
        open={!!orderFormInitial}
        initial={orderFormInitial}
        isNewOrder
        onClose={() => {
          setOrderFormInitial(null);
          setOrderFromCart(false);
        }}
        onSave={handleSaveOrderForm}
      />
    </div>
  );
}
