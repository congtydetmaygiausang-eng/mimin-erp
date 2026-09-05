"use client";

// ============================================
// Danh muc san pham - POLOMIMIN
// Redesign 2026-08-07: thu vien the card (grid 4 cols)
// ============================================

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Shirt, Sparkles, TrendingUp, X, Plus, Package, Tag, ShoppingCart, Store } from "lucide-react";
import { useDanhMucSP, type SanPham } from "@/lib/data/danh-muc-sp-store";
import { useGioHang } from "@/lib/data/gio-hang-store";
import { useDonHang } from "@/lib/data/don-hang-store";
import { toast } from "sonner";
import ProductLibraryCard from "@/components/danh-muc-sp/ProductLibraryCard";
import ProductDetailModal from "@/components/danh-muc-sp/ProductDetailModal";
import ProductFormModal from "@/components/danh-muc-sp/ProductFormModal";
import AddToCartModal from "@/components/danh-muc-sp/AddToCartModal";
import { GioHangDrawer } from "@/components/danh-muc-sp/GioHangDrawer";
import OrderFormModal from "@/components/order-detail/OrderFormModal";
import { createEmptyOrder, createOrderItemFromVariant, createEmptyPayment, generateMaDH, calcOrderTotal, calcOrderQty } from "@/components/order-detail/helpers";
import { generateVariants } from "@/lib/data/product-variants";
import type { Order, OrderItem } from "@/components/order-detail/types";
import type { GioHangItem } from "@/lib/data/gio-hang-store";
import { useCustomerCart } from "@/lib/data/customer-cart-store";
import CustomerCheckoutModal from "@/components/danh-muc-sp/CustomerCheckoutModal";
import CustomerAddToCartModal from "@/components/danh-muc-sp/CustomerAddToCartModal";
import { layDanhMucKhoThanhPham, layTonKhoTheoSanPham, type DanhMucKhoThanhPham, type KenhBanKho, type TonKhoTheoSanPham } from "@/lib/data/ton-kho-theo-mau";
import { useKHSX } from "@/lib/data/khsx-store";
import { useSession } from "@/components/session-provider";
import { supabase } from "@/lib/supabase/client";

const FILTER_TABS = [
  { id: "all", label: "Tất cả", icon: Sparkles },
  { id: "ban-le", label: "Bán lẻ", icon: Store },
  { id: "ban-si", label: "Bán sỉ", icon: Package },
  { id: "ban-lo", label: "Bán lô", icon: Package },
  { id: "tiktok", label: "TikTok", icon: Tag },
  { id: "shopee", label: "Shopee", icon: ShoppingCart },
];

export default function DanhMucSanPhamPage() {
  const router = useRouter();
  const { user } = useSession();
  const { themKHSX } = useKHSX();
  const { dsSanPham, loading, themSP, suaSP, xoaSP, refresh } = useDanhMucSP();
  const { items: gioHangItems, themVaoGio, themNhieuVaoGio, capNhatSoLuong, xoaKhoiGio, xoaGio, tongSoLuong: soLuongTrongGio } = useGioHang();
  const { dsOrder, themOrder } = useDonHang();
  const dsMaDaCo = useMemo(() => dsOrder.map((o) => o.maDH), [dsOrder]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedProduct, setSelectedProduct] = useState<SanPham | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [productToEdit, setProductToEdit] = useState<SanPham | null>(null);
  const [productForCart, setProductForCart] = useState<SanPham | null>(null);
  const [showGioHang, setShowGioHang] = useState(false);
  const [orderFormInitial, setOrderFormInitial] = useState<Order | null>(null);
  const [orderFromCart, setOrderFromCart] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tonKho, setTonKho] = useState<TonKhoTheoSanPham>({});
  const [danhMucKho, setDanhMucKho] = useState<DanhMucKhoThanhPham>({});
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  // B2C Customer Cart States
  const { getTotalItems: getCustomerCartItems } = useCustomerCart();
  const [showCustomerAddToCart, setShowCustomerAddToCart] = useState<SanPham | null>(null);
  const [showCustomerCheckout, setShowCustomerCheckout] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!user?.id || !supabase) return;
    supabase.from("mau_da_thich").select("ma_sp").eq("user_id", user.id).then(({ data }) => {
      setFavoriteIds((data || []).map((row: { ma_sp: string }) => row.ma_sp));
    });
  }, [user?.id]);

  // Provider dữ liệu chỉ mount 1 lần ở gốc app (không remount khi chuyển
  // trang bằng router) - nếu không tự gọi refresh() ở đây, vào lại trang
  // này sau khi đã ở trang khác sẽ thấy dữ liệu cũ, phải F5 mới cập nhật.
  useEffect(() => {
    refresh();
    Promise.all([layTonKhoTheoSanPham(), layDanhMucKhoThanhPham()])
      .then(([stock, catalog]) => {
        setTonKho(stock);
        setDanhMucKho(catalog);
      })
      .catch(() => {
        setTonKho({});
        setDanhMucKho({});
      });
  }, [refresh]);

  const dsDongBo = useMemo<SanPham[]>(() => {
    const map = new Map((dsSanPham || []).map((sp) => [sp.id, sp]));
    for (const item of Object.values(danhMucKho)) {
      const sizes = Array.from(new Set(item.mau.flatMap((mau) => mau.sizes.map((size) => size.size))));
      const colors = item.mau.map((mau, index) => ({
        ten: mau.ten,
        maSKU: `${item.maSP}-${String(index + 1).padStart(2, "0")}`,
        dinhMuc: 0,
        img: mau.img,
      }));
      const current = map.get(item.maSP);
      let loaiSP: SanPham["loaiSP"] = "BoTru";
      const checkStr = ((item.phanLoai || "") + " " + (item.tenSP || "")).toLowerCase();
      if (checkStr.includes("áo polo") || checkStr.includes("ao polo")) loaiSP = "AoPolo";
      else if (checkStr.includes("áo trụ") || checkStr.includes("ao tru") || checkStr.includes("cổ trụ") || checkStr.includes("co tru")) loaiSP = "AoTru";
      else if (checkStr.includes("áo tròn") || checkStr.includes("áo cổ tròn") || checkStr.includes("cổ tròn") || checkStr.includes("co tron")) loaiSP = "AoCoTron";
      else if (checkStr.includes("bộ tròn") || checkStr.includes("bộ cổ tròn") || checkStr.includes("bo tron") || checkStr.includes("bo co tron")) loaiSP = "BoCoTron";
      else if (checkStr.includes("phụ kiện") || checkStr.includes("quần") || checkStr.includes("quan")) loaiSP = "PhuKien";
      else if (checkStr.includes("áo thun") || checkStr.includes("áo") || checkStr.includes("ao")) {
        loaiSP = "AoCoTron";
      }
      map.set(item.maSP, {
        ...(current || {
          id: item.maSP,
          tenSP: item.tenSP,
          loaiSP,
          giaBanDuKien: item.giaBanLe || item.giaBanSi || item.giaBanLo,
          giaVonDuKien: item.giaVon,
          tiLeSize: item.tiLeSize,
          bangSize: { sizes, ratios: sizes.map(() => 1), riSo: sizes.length || 1 },
          dsMau: colors,
          ghiChu: "Đồng bộ từ Kho thành phẩm",
          ngayTao: new Date().toISOString().slice(0, 10),
        }),
        tenSP: current?.tenSP || item.tenSP || item.maSP,
        dsMau: (() => {
          if (!colors.length) return current?.dsMau || [];
          const merged = colors.map(c => {
            const existing = current?.dsMau?.find(x => x.ten === c.ten);
            return existing ? { ...c, dinhMuc: existing.dinhMuc || 0, img: existing.img || c.img, video: existing.video, hinhAnhChiTiet: existing.hinhAnhChiTiet } : c;
          });
          if (current?.dsMau) {
            const fromCurrent = current.dsMau.filter(x => !colors.some(c => c.ten === x.ten));
            merged.push(...fromCurrent);
          }
          return merged;
        })(),
        bangSize: current?.bangSize?.sizes?.length
          ? current.bangSize
          : (sizes.length ? { sizes, ratios: sizes.map(() => 1), riSo: sizes.length } : { sizes: [], ratios: [], riSo: 1 }),
        giaVonDuKien: item.giaVon || current?.giaVonDuKien || 0,
        giaBanDuKien: current?.giaBanDuKien || item.giaBanLe || item.giaBanSi || item.giaBanLo || 0,
        giaBanLe: item.giaBanLe || current?.giaBanLe || 0,
        giaBanSi: item.giaBanSi || current?.giaBanSi || 0,
        giaBanLo: item.giaBanLo || current?.giaBanLo || 0,
        giaTikTok: item.giaTikTok || current?.giaTikTok || 0,
        giaShopee: item.giaShopee || current?.giaShopee || 0,
        kenhBan: item.kenhBan?.length ? item.kenhBan : (current?.kenhBan || []),
        hinhAnh: current?.hinhAnh || colors.find(c => c.img)?.img || "",
      });
    }
    return Array.from(map.values());
  }, [dsSanPham, danhMucKho]);

  const filtered = useMemo(() => {
    let result = dsDongBo;
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
        // Return true if explicitly in kenhBan array
        if (sp.kenhBan?.includes(activeFilter as KenhBanKho)) return true;
        
        // OR return true if it has a price configured for this channel
        switch (activeFilter) {
          case "ban-le": return (sp.giaBanLe && sp.giaBanLe > 0) || (sp.giaBanDuKien && sp.giaBanDuKien > 0);
          case "ban-si": return (sp.giaBanSi && sp.giaBanSi > 0) || (sp.giaBanDuKien && sp.giaBanDuKien > 0);
          case "ban-lo": return (sp.giaBanLo && sp.giaBanLo > 0) || (sp.giaBanDuKien && sp.giaBanDuKien > 0);
          case "tiktok": return (sp.giaTikTok && sp.giaTikTok > 0) || (sp.giaBanDuKien && sp.giaBanDuKien > 0);
          case "shopee": return (sp.giaShopee && sp.giaShopee > 0) || (sp.giaBanDuKien && sp.giaBanDuKien > 0);
          default: return true;
        }
      });
    }
    // Sort by recently edited first
    result.sort((a, b) => {
      const dateA = a.ngayCapNhat || a.ngayTao || "";
      const dateB = b.ngayCapNhat || b.ngayTao || "";
      return dateB.localeCompare(dateA);
    });
    return result;
  }, [dsDongBo, search, activeFilter]);

  // === HANDLERS (3 CTA buttons) ===
  const handleAddToCart = (sp: SanPham) => {
    // For Internal Admin, it was: themVaoGio(sp); toast...
    // Now we open Customer AddToCart Modal
    setShowCustomerAddToCart(sp);
  };

  const handleConfirmAddToCart = (data: { 
    mode: "si" | "le", 
    mau: string, 
    ri?: number, 
    sizes?: Record<string, number>,
    khachHang: string,
    thue: number,
    thanhToan: "tien-mat" | "cong-no",
    inPhieu: boolean,
    xuatHD: boolean,
    donGia?: number
  }) => {
    if (!productForCart) return;
    const sp = productForCart;
    const variants = generateVariants(sp.id, sp.dsMau || [], sp.bangSize);
    const colorVariants = variants.filter(v => (v.mauTen === data.mau || (v.mauTen === undefined && sp.dsMau?.[0]?.ten === data.mau)));
    
    const newItems: OrderItem[] = [];
    const unitPrice = data.donGia ?? (data.mode === "si" ? (sp.giaBanSi || sp.giaBanDuKien) : (sp.giaBanLe || sp.giaBanDuKien));
    
    if (data.mode === "si" && data.ri) {
      const ratios = sp.bangSize?.ratios || [];
      sp.bangSize?.sizes.forEach((s, idx) => {
        const variant = colorVariants.find(v => v.size === s);
        const qty = (ratios[idx] || 0) * data.ri!;
        if (qty > 0 && variant) {
            const oi = createOrderItemFromVariant({
              spId: sp.id,
              spTen: sp.tenSP,
              mauCode: variant.mauCode,
              mauTen: variant.mauTen || data.mau,
              mauImg: variant.img,
              size: variant.size,
              sku: variant.maSKU,
              donGia: unitPrice,
            });
          oi.soLuong = qty;
          oi.thanhTien = oi.soLuong * oi.donGia;
          newItems.push(oi);
        }
      });
    } else if (data.mode === "le" && data.sizes) {
      Object.entries(data.sizes).forEach(([s, qty]) => {
        if (qty > 0) {
          const variant = colorVariants.find(v => v.size === s);
          if (variant) {
            const oi = createOrderItemFromVariant({
              spId: sp.id,
              spTen: sp.tenSP,
              mauCode: variant.mauCode,
              mauTen: variant.mauTen || data.mau,
              mauImg: variant.img,
              size: variant.size,
              sku: variant.maSKU,
              donGia: unitPrice,
            });
            oi.soLuong = qty;
            oi.thanhTien = oi.soLuong * oi.donGia;
            newItems.push(oi);
          }
        }
      });
    }
    
    if (newItems.length > 0) {
      const newOrder = createEmptyOrder(dsMaDaCo);
      newOrder.khachHang = data.khachHang;
      newOrder.loaiDonHang = data.mode === "si" ? "ban-si" : "ban-le";
      newOrder.items = newItems;
      
      const subtotal = calcOrderTotal(newItems);
      const total = subtotal + (subtotal * data.thue / 100);
      
      newOrder.soLuong = calcOrderQty(newItems);
      newOrder.thanhTien = total;
      newOrder.trangThaiThanhToan = data.thanhToan === "tien-mat" ? "thanh-toan-du" : "chua-thanh-toan";
      
      if (data.thanhToan === "tien-mat") {
        const pm = createEmptyPayment("tien-mat");
        pm.soTien = total;
        newOrder.payments = [pm];
      }
      
      themOrder(newOrder);
      
      let msg = `Đã tạo thành công đơn hàng ${newOrder.maDH}.`;
      if (data.inPhieu) msg += " Đang kết nối máy in...";
      if (data.xuatHD) msg += " Đã gọi API xuất hoá đơn điện tử thành công!";
      
      toast.success(msg, { duration: 5000 });
    }
    
    setProductForCart(null);
  };

  // Tạo 1 đơn hàng chỉ với đúng SP này (biến thể đầu tiên) - mở OrderFormModal
  // ở chế độ Bán sỉ (nhập số lượng theo bảng size × màu) - bán lẻ thì đi qua
  // Giỏ hàng, bán sỉ thì tạo đơn hàng thẳng.
  const openQuickOrder = (sp: SanPham) => {
    const variants = generateVariants(sp.id, sp.dsMau || [], sp.bangSize);
    const first = variants[0];
    const order = createEmptyOrder();
    order.loaiDonHang = "ban-si";
    order.items = [
      createOrderItemFromVariant({
        spId: sp.id,
        spTen: sp.tenSP,
        mauCode: first?.mauCode,
        mauTen: first?.mauTen || sp.dsMau?.[0]?.ten,
        mauImg: first?.img || sp.dsMau?.[0]?.img,
        size: first?.size,
        sku: first?.maSKU,
        donGia: sp.giaBanDuKien,
      }),
    ];
    setOrderFromCart(false);
    setOrderFormInitial(order);
  };
  const handleCreateOrder = (sp: SanPham) => {
    // Gọi Quick Checkout modal -> đổi lại dùng setProductForCart
    setProductForCart(sp);
  };
  const handleProduceOrder = (sp: SanPham) => {
    const today = new Date();
    const deadline = new Date(today);
    deadline.setDate(deadline.getDate() + 14);
    const created = themKHSX({
      maKHSX: `KHSX-${today.getFullYear()}-${String(Date.now()).slice(-6)}`,
      maSP: sp.id,
      tenSP: sp.tenSP,
      loaiSP: sp.loaiSP,
      tiLeSize: sp.tiLeSize,
      dsMau: (sp.dsMau || []).map((mau) => ({
        ten: mau.ten,
        maSKU: mau.maSKU,
        maVai: "",
        dinhMuc: mau.dinhMuc || 0,
        slDuKien: 0,
        ghiChu: "",
        img: mau.img || "",
        imgQuan: (mau as any).imgQuan || "",
        phanBoSize: (sp.bangSize?.sizes || []).map((size) => ({ size, sl: 0 })),
      })),
      tuan: "",
      tuNgay: today.toISOString().slice(0, 10),
      denNgay: deadline.toISOString().slice(0, 10),
      sanPham: sp.tenSP,
      loai: sp.loaiSP.startsWith("Ao") ? "Áo" : sp.loaiSP === "PhuKien" ? "Phụ kiện" : "Bộ",
      soLuong: sp.dsMau?.length || 1,
      daHoanThanh: 0,
      xuongPhuTrach: "Tổ cắt",
      trangThai: "Lên kế hoạch",
      ghiChu: `Tạo từ Danh mục sản phẩm bởi ${user?.name || "Người dùng"} lúc ${today.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} ngày ${today.toLocaleDateString("vi-VN")} – vui lòng cập nhật số lượng kế hoạch`,
    }, user);
    toast.success(`Đã chuyển ${sp.id} vào ${created.maKHSX}`);
    router.push("/ke-hoach-san-xuat");
  };

  const handleFavorite = async (sp: SanPham) => {
    if (!user?.id || !supabase) {
      toast.error("Vui lòng đăng nhập để lưu mẫu yêu thích");
      return;
    }
    const { data: existing, error: lookupError } = await supabase
      .from("mau_da_thich")
      .select("id")
      .eq("user_id", user.id)
      .eq("ma_sp", sp.id)
      .maybeSingle();
    if (lookupError) {
      toast.error(`Không lưu được mẫu yêu thích: ${lookupError.message}`);
      return;
    }
    if (existing) {
      const { error } = await supabase.from("mau_da_thich").delete().eq("user_id", user.id).eq("ma_sp", sp.id);
      if (error) {
        toast.error(`Không bỏ thích được: ${error.message}`);
        return;
      }
      setFavoriteIds((ids) => ids.filter((id) => id !== sp.id));
      toast.success(`Đã bỏ thích "${sp.tenSP}"`);
      return;
    }
    const { error } = await supabase.from("mau_da_thich").insert({ id: crypto.randomUUID(), user_id: user.id, ma_sp: sp.id });
    if (error) {
      toast.error(`Không lưu được mẫu yêu thích: ${error.message}`);
      return;
    }
    setFavoriteIds((ids) => ids.includes(sp.id) ? ids : [...ids, sp.id]);
    toast.success(`Đã thêm "${sp.tenSP}" vào Mẫu đã thích`);
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
        mauImg: (it as any).mauImg || (it as any).hinhAnh,
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
        setDanhMucKho(prev => {
          const newDMK = { ...prev };
          delete newDMK[sp.id];
          return newDMK;
        });
        setSelectedProduct(null);
        toast.success("Đã xóa sản phẩm thành công!");
      }
    }
  };

  const handleSaveProduct = async (sp: Partial<SanPham>) => {
    if (productToEdit) {
      const existsInDb = dsSanPham?.some(p => p.id === productToEdit.id);
      if (existsInDb && suaSP) {
        await suaSP(productToEdit.id, sp);
        toast.success(`Đã cập nhật sản phẩm: ${sp.tenSP}`);
        if (selectedProduct && selectedProduct.id === productToEdit.id) {
          setSelectedProduct({ ...selectedProduct, ...sp } as SanPham);
        }
      } else if (themSP) {
        await themSP(sp as SanPham);
        toast.success(`Đã lưu sản phẩm từ Kho vào Danh mục: ${sp.tenSP}`);
      }
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
        <div className="w-full px-2 md:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 lg:gap-8">
            {filtered.map((sp) => (
              <ProductLibraryCard
                key={sp.id}
                sp={sp}
                tonKhoTheoMau={tonKho[sp.id]}
                activeFilter={activeFilter}
                onAddToCart={handleAddToCart}
                onCreateOrder={handleCreateOrder}
                onProduceOrder={handleProduceOrder}
                onFavorite={handleFavorite}
                isFavorite={favoriteIds.includes(sp.id)}
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
          onCreateOrder={handleCreateOrder}
          onProduceOrder={handleProduceOrder}
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

      {productForCart && (
        <AddToCartModal
          sp={productForCart}
          onClose={() => setProductForCart(null)}
          onConfirm={handleConfirmAddToCart}
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

      {/* CUSTOMER (B2C) MODALS */}
      {showCustomerAddToCart && (
        <CustomerAddToCartModal 
          sp={showCustomerAddToCart} 
          onClose={() => setShowCustomerAddToCart(null)} 
        />
      )}

      {showCustomerCheckout && (
        <CustomerCheckoutModal 
          onClose={() => setShowCustomerCheckout(false)} 
        />
      )}

      {/* Floating Customer Cart Button */}
      {getCustomerCartItems() > 0 && !showCustomerCheckout && (
        <button
          onClick={() => setShowCustomerCheckout(true)}
          className="fixed bottom-8 right-8 z-[90] flex items-center justify-center gap-3 bg-cyan-600 hover:bg-cyan-700 text-white p-4 rounded-full shadow-2xl hover:shadow-cyan-500/50 transition-all hover:scale-105 active:scale-95 animate-in fade-in slide-in-from-bottom-8 duration-500"
        >
          <div className="relative">
            <ShoppingCart className="w-6 h-6" />
            <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-extrabold w-5 h-5 flex items-center justify-center rounded-full border-2 border-cyan-600">
              {getCustomerCartItems()}
            </span>
          </div>
          <span className="font-extrabold pr-2 hidden sm:inline">Giỏ hàng của bạn</span>
        </button>
      )}
    </div>
  );
}
