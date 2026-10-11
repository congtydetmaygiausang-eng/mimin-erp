"use client";

// ============================================
// OrderFormModal - form tao/sua don hang
// Phase 2: multi-item + 2 loai ban (le/san vs si) + multi-payment + shipping
// 2026-08-06
// ============================================

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  X, Plus, Trash2, Save, ShoppingCart, User, Phone, Calendar,
  Package, Wallet, Truck, CreditCard, AlertCircle, Box, Grid3x3, ImagePlus, MapPin
} from "lucide-react";
import { toast } from "sonner";
import { useDanhMucSP, type SanPham } from "@/lib/data/danh-muc-sp-store";
import { useKhachHang } from "@/lib/data/khach-hang-store";
import {
  type Order, type OrderItem, type OrderPayment, type OrderShipping,
  type LoaiDonHang, type PhuongThucThanhToan, type PhuongThucVanChuyen, type TrangThaiVanChuyen,
  LOAI_DON_HANG_LABELS, PHUONG_THUC_THANH_TOAN_LABELS, PHUONG_THUC_VAN_CHUYEN_LABELS,
  KENH_BAN_SAN_OPTIONS, NGAN_HANG_OPTIONS,
} from "./types";
import { useDonHang } from "@/lib/data/don-hang-store";
import {
  createEmptyOrder, createOrderItemFromVariant, createEmptyPayment, generateMaDH,
  calcOrderTotal, calcPaidTotal, calcOrderRemain, calcOrderQty, recalcItem,
} from "./helpers";
import { generateVariants, mauToCode, type ProductVariant } from "@/lib/data/product-variants";
import { formatVND, formatVNDShort } from "@/lib/data/real-data";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Order để edit, undefined = tạo mới */
  initial?: Order | null;
  /**
   * true khi `initial` được truyền vào chỉ để seed sẵn items (VD: từ giỏ hàng/mua
   * nhanh 1 SP) chứ không phải sửa 1 đơn đã lưu - giữ tiêu đề "Tạo đơn hàng mới".
   */
  isNewOrder?: boolean;
  /** Callback khi save */
  onSave: (order: Order) => void;
}

export default function OrderFormModal({ open, onClose, initial, isNewOrder, onSave }: Props) {
  const { dsSanPham } = useDanhMucSP();
  const { list: dsKhachHang } = useKhachHang();
  const { dsOrder } = useDonHang();
  // Mã đơn đang có - để sinh mã mới chạy tuần tự, không đụng mã cũ
  const dsMaDaCo = useMemo(() => dsOrder.map((o) => o.maDH), [dsOrder]);
  const [order, setOrder] = useState<Order>(() => createEmptyOrder());
  const [activeTab, setActiveTab] = useState<"info" | "items" | "payment" | "shipping">("info");
  const [showConfirm, setShowConfirm] = useState(false);

  // Track last initialId da init để tránh init lặp
  const lastInitialIdRef = useRef<string | null>(null);

  // Init khi mo modal HOẶC khi initial.id đổi (sang đơn khác)
  useEffect(() => {
    if (!open) {
      lastInitialIdRef.current = null;
      setShowConfirm(false);
      return;
    }
    const newId = initial?.id || null;
    if (lastInitialIdRef.current !== newId) {
      // Đơn seed sẵn từ giỏ hàng/mua nhanh vẫn là đơn MỚI -> cấp lại mã chạy
      // tuần tự để không trùng mã đơn đã lưu.
      const base = initial
        ? (isNewOrder ? { ...initial, maDH: generateMaDH(dsMaDaCo) } : initial)
        : createEmptyOrder(dsMaDaCo);
      setOrder(base);
      setActiveTab("info");
      setShowConfirm(false);
      lastInitialIdRef.current = newId;
    }
  }, [open, initial?.id, isNewOrder, dsMaDaCo]);

  const tongTien = calcOrderTotal(order.items);
  const tongSL = calcOrderQty(order.items);
  const daThanhToan = calcPaidTotal(order.payments);
  const phiVC = order.shipping?.phiVanChuyen || 0;
  const thueVAT = order.thueVAT || 0;
  const tienVAT = (tongTien * thueVAT) / 100;
  const tongThanhToan = tongTien + tienVAT + phiVC;
  const conLai = tongThanhToan - daThanhToan;

  // ============================================
  // HANDLERS
  // ============================================

  const updateOrder = (patch: Partial<Order>) => setOrder((o) => ({ ...o, ...patch }));
  const updateShipping = (patch: Partial<OrderShipping>) =>
    setOrder((o) => ({ ...o, shipping: { ...(o.shipping || { phuongThuc: "ghtk", phiVanChuyen: 0, trangThai: "cho-xu-ly" as TrangThaiVanChuyen }), ...patch } as OrderShipping }));

  const updateItem = (id: string, patch: Partial<OrderItem>) => {
    setOrder((o) => ({
      ...o,
      items: o.items.map((it) => (it.id === id ? recalcItem({ ...it, ...patch }) : it)),
    }));
  };

  const removeItem = (id: string) => {
    setOrder((o) => ({ ...o, items: o.items.filter((it) => it.id !== id) }));
  };

  const clearProductItems = (sp: SanPham) => {
    setOrder((o) => ({ ...o, items: o.items.filter((it) => it.spId !== sp.id) }));
  };

  /** Mở picker chọn SP + variant - flow bán lẻ */
  const addItemFromCatalog = (sp: SanPham) => {
    // Bán lẻ: thêm 1 dòng với variant mặc định (màu đầu, size đầu)
    const variants = generateVariants(sp.id, sp.dsMau, sp.bangSize);
    const firstVariant = variants[0];
    if (!firstVariant) {
      // SP chưa có variants - fallback dùng dsMau đầu
      const firstMau = sp.dsMau[0];
      const newItem: OrderItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        spId: sp.id,
        spTen: sp.tenSP,
        mauCode: firstMau ? (firstMau.ten || "").toUpperCase() : undefined,
        mauTen: firstMau?.ten,
        size: sp.bangSize?.sizes[0],
        sku: firstMau?.maSKU,
        soLuong: 1,
        donGia: sp.giaBanDuKien,
        thanhTien: sp.giaBanDuKien,
      };
      setOrder((o) => ({ ...o, items: [...o.items, newItem] }));
      return;
    }
    setOrder((o) => ({ ...o, items: [...o.items, createOrderItemFromVariant({
      spId: sp.id,
      spTen: sp.tenSP,
      mauCode: firstVariant.mauCode,
      mauTen: firstVariant.mauTen,
      size: firstVariant.size,
      sku: firstVariant.maSKU,
      donGia: sp.giaBanDuKien,
    })] }));
  };

  /** Cập nhật matrix bán sỉ (size × màu) → đồng bộ items[] */
  const updateSiMatrixCell = (sp: SanPham, rawMauCode: string, size: string, soLuong: number) => {
    const targetMauCode = mauToCode(rawMauCode);
    const targetSize = (size || "").trim().toUpperCase();
    const variantId = `${sp.id}-${targetMauCode}-${targetSize}`;

    setOrder((o) => {
      const variants = generateVariants(sp.id, sp.dsMau, sp.bangSize);
      const sp2 = variants.find(
        (v) => (v.mauCode === targetMauCode || mauToCode(v.mauTen) === targetMauCode) &&
               v.size.trim().toUpperCase() === targetSize
      );

      // Match item thuộc về đúng sản phẩm + màu + size này
      const isMatch = (it: OrderItem) => {
        if (it.spId !== sp.id) return false;
        const itSize = (it.size || "").trim().toUpperCase();
        if (itSize !== targetSize) return false;
        const itMau = mauToCode(it.mauCode || it.mauTen || "");
        return itMau === targetMauCode || it.sku === variantId || (sp2 && it.sku === sp2.maSKU);
      };

      if (soLuong <= 0) {
        // Xoá tất cả item trùng cell này
        return { ...o, items: o.items.filter((it) => !isMatch(it)) };
      }

      const existingIndex = o.items.findIndex(isMatch);
      if (existingIndex >= 0) {
        // Cập nhật số lượng của item đầu tiên, dọn sạch các item trùng lặp khác nếu có
        const updatedItems = o.items.filter((it, idx) => idx === existingIndex || !isMatch(it));
        updatedItems[existingIndex] = recalcItem({
          ...updatedItems[existingIndex],
          sku: variantId,
          mauCode: targetMauCode,
          mauTen: sp2?.mauTen || updatedItems[existingIndex].mauTen || rawMauCode,
          size: targetSize,
          soLuong,
        });
        return { ...o, items: updatedItems };
      }

      // Thêm mới
      const donGia = sp.giaBanSi || sp.giaBanDuKien || 0;
      const newItem = createOrderItemFromVariant({
        spId: sp.id,
        spTen: sp.tenSP,
        mauCode: targetMauCode,
        mauTen: sp2?.mauTen || rawMauCode,
        size: targetSize,
        sku: variantId,
        donGia,
      });
      newItem.soLuong = soLuong;
      newItem.thanhTien = soLuong * donGia;
      return { ...o, items: [...o.items, newItem] };
    });
  };

  // ============================================
  // PAYMENT HANDLERS
  // ============================================

  const addPayment = (phuongThuc: PhuongThucThanhToan = "tien-mat") => {
    setOrder((o) => ({ ...o, payments: [...o.payments, createEmptyPayment(phuongThuc)] }));
  };

  const updatePayment = (id: string, patch: Partial<OrderPayment>) => {
    setOrder((o) => ({
      ...o,
      payments: o.payments.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  };

  const removePayment = (id: string) => {
    setOrder((o) => ({ ...o, payments: o.payments.filter((p) => p.id !== id) }));
  };

  // ============================================
  // VALIDATE + SAVE
  // ============================================

  const handleSave = () => {
    if (!order.khachHang.trim()) {
      toast.error("Vui lòng nhập tên khách hàng");
      setActiveTab("info");
      return;
    }
    if (order.items.length === 0) {
      toast.error("Vui lòng thêm ít nhất 1 sản phẩm");
      setActiveTab("items");
      return;
    }
    // Show confirm dialog instead of saving immediately
    setShowConfirm(true);
  };

  const confirmSave = () => {
    const finalOrder: Order = {
      ...order,
      thanhTien: tongTien,
      soLuong: tongSL,
      trangThaiThanhToan: conLai <= 0 ? "thanh-toan-du" : daThanhToan > 0 ? "thanh-toan-mot-phan" : "chua-thanh-toan",
      tienCoc: daThanhToan, // backward compat
    };
    onSave(finalOrder);
    toast.success(`Đã lưu đơn hàng: ${finalOrder.maDH}`);
    setShowConfirm(false);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden">
        
        {/* CONFIRM OVERLAY */}
        {showConfirm && (
          <div className="absolute inset-0 z-[120] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up border border-slate-200 dark:border-slate-700">
              <div className="bg-gradient-to-r from-cyan-600 to-teal-600 px-5 py-4">
                <h3 className="text-lg font-bold text-white text-center">Tổng Hóa Đơn</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Khách hàng</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{order.khachHang}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Số lượng SP</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{tongSL} (Cái/Bộ)</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Tiền hàng</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{formatVND(tongTien)}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Phí vận chuyển</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{formatVND(phiVC)}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Đã thanh toán</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatVND(daThanhToan)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-lg font-bold text-slate-700 dark:text-slate-200">CÔNG NỢ (CẦN THU)</span>
                  <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{formatVND(conLai)}</span>
                </div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 flex items-center gap-3">
                <button onClick={() => setShowConfirm(false)} className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                  Quay lại sửa
                </button>
                <button onClick={confirmSave} className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-bold hover:from-cyan-700 hover:to-teal-700 shadow-md shadow-cyan-500/30 transition">
                  LƯU ĐƠN HÀNG
                </button>
              </div>
            </div>
          </div>
        )}

        {/* HEADER */}
        <div className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              {initial && !isNewOrder ? `Sửa đơn hàng: ${initial.maDH}` : "Tạo đơn hàng mới"}
            </h2>
            <p className="text-xs text-cyan-50 mt-0.5">
              {tongSL} sản phẩm · Tổng {formatVNDShort(tongThanhToan)} · Còn lại {formatVNDShort(conLai)}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/20 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TABS */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          {([
            { id: "info", label: "Thông tin KH", icon: User },
            { id: "items", label: `SP (${order.items.length})`, icon: Package },
            { id: "payment", label: `Thanh toán (${order.payments.length})`, icon: Wallet },
            { id: "shipping", label: "Vận chuyển", icon: Truck },
          ] as const).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition border-b-2 ${
                  active
                    ? "border-cyan-500 text-cyan-700 dark:text-cyan-300 bg-white dark:bg-slate-900"
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "info" && (
            <InfoTab order={order} onChange={updateOrder} dsKhachHang={dsKhachHang} />
          )}

          {activeTab === "items" && (
            <ItemsTab
              order={order}
              dsSanPham={dsSanPham}
              onUpdateItem={updateItem}
              onRemoveItem={removeItem}
              onAddFromCatalog={addItemFromCatalog}
              onUpdateSiCell={updateSiMatrixCell}
              onClearProduct={clearProductItems}
              onAddCustomItem={() => {
                const newItem: OrderItem = {
                  id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  spId: "CUSTOM",
                  spTen: "",
                  sku: "",
                  soLuong: 1,
                  donGia: 0,
                  thanhTien: 0,
                };
                setOrder((o) => ({ ...o, items: [...o.items, newItem] }));
              }}
              onChange={updateOrder}
            />
          )}

          {activeTab === "payment" && (
            <PaymentTab
              order={order}
              tongThanhToan={tongThanhToan}
              daThanhToan={daThanhToan}
              conLai={conLai}
              onAddPayment={addPayment}
              onUpdatePayment={updatePayment}
              onRemovePayment={removePayment}
            />
          )}

          {activeTab === "shipping" && (
            <ShippingTab
              shipping={order.shipping || { phuongThuc: "ghtk", phiVanChuyen: 0, trangThai: "cho-xu-ly" as TrangThaiVanChuyen } as OrderShipping}
              tongTien={tongTien}
              onChange={updateShipping}
            />
          )}
        </div>

        {/* FOOTER */}
        <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4 bg-slate-50 dark:bg-slate-800/50 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {tongSL} SP × {formatVNDShort(tongTien)} + VC {formatVNDShort(phiVC)} ={" "}
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base">
              {formatVNDShort(tongThanhToan)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition"
            >
              Huỷ
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/30 transition"
            >
              <Save className="w-4 h-4" />
              Lưu đơn hàng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// TAB 1: THONG TIN KHACH HANG + LOAI DON
// ============================================

function InfoTab({ order, onChange, dsKhachHang }: { order: Order; onChange: (p: Partial<Order>) => void; dsKhachHang: any[] }) {
  const orderTypes: LoaiDonHang[] = ["ban-le", "ban-si", "ban-lo", "tiktok", "shopee", "dat-may"];
  return (
    <div className="space-y-4 max-w-2xl">
      {/* Loai don hang */}
      <div>
        <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">
          Loại đơn hàng <span className="text-rose-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {orderTypes.map((k) => {
            const active = order.loaiDonHang === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => onChange({ loaiDonHang: k, kenhBan: k === "tiktok" ? "TikTok Shop" : k === "shopee" ? "Shopee" : undefined })}
                className={`px-3 py-3 rounded-xl border-2 font-semibold text-xs text-center transition ${
                  active
                    ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300"
                    : "border-slate-200 dark:border-slate-700 hover:border-cyan-300 text-slate-600 dark:text-slate-300"
                }`}
              >
                {LOAI_DON_HANG_LABELS[k]}
              </button>
            );
          })}
        </div>
        {(order.loaiDonHang === "tiktok" || order.loaiDonHang === "shopee" || order.loaiDonHang === "ban-san") && (
          <div className="mt-3">
            <label className="block text-xs font-semibold mb-1.5 text-slate-600 dark:text-slate-300">
              Kênh bán sàn
            </label>
            <select
              value={order.kenhBan || (order.loaiDonHang === "tiktok" ? "TikTok Shop" : order.loaiDonHang === "shopee" ? "Shopee" : "")}
              onChange={(e) => onChange({ kenhBan: e.target.value || undefined })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
            >
              <option value="">-- Chọn kênh --</option>
              {KENH_BAN_SAN_OPTIONS.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Khach hang + SDT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-200">
            <User className="inline w-3.5 h-3.5 mr-1" />
            Khách hàng <span className="text-rose-500">*</span>
          </label>
          <select
            value={order.khachHang || ""}
            onChange={(e) => {
              const val = e.target.value;
              const kh = dsKhachHang.find((k: any) => k.ten === val);
              onChange({ 
                khachHang: val, 
                ...(kh && kh.sdt ? { sdt: kh.sdt } : {}),
                ...(kh && kh.diaChi ? { diaChi: kh.diaChi } : {})
              });
            }}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
          >
            <option value="">-- Chọn khách hàng --</option>
            {dsKhachHang.map((kh: any) => (
              <option key={kh.id} value={kh.ten}>
                {kh.ten} {kh.sdt ? `(${kh.sdt})` : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-200">
            <Phone className="inline w-3.5 h-3.5 mr-1" />
            Số điện thoại
          </label>
          <input
            type="tel"
            value={order.sdt}
            onChange={(e) => onChange({ sdt: e.target.value })}
            placeholder="VD: 0901234567"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
          />
        </div>
      </div>

      {/* Dia chi */}
      <div>
        <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-200">
          <MapPin className="inline w-3.5 h-3.5 mr-1" />
          Địa chỉ
        </label>
        <input
          type="text"
          value={order.diaChi || ""}
          onChange={(e) => onChange({ diaChi: e.target.value })}
          placeholder="VD: 123 Nguyễn Trãi, Q1, TP.HCM"
          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
        />
      </div>

      {/* Ngay dat + Ngay giao */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-200">
            <Calendar className="inline w-3.5 h-3.5 mr-1" />
            Ngày đặt
          </label>
          <input
            type="date"
            value={order.ngayDat}
            onChange={(e) => onChange({ ngayDat: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-200">
            <Calendar className="inline w-3.5 h-3.5 mr-1" />
            Ngày giao dự kiến
          </label>
          <input
            type="date"
            value={order.ngayGiao}
            onChange={(e) => onChange({ ngayGiao: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
          />
        </div>
      </div>

      {/* Ghi chu */}
      <div>
        <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-200">
          Ghi chú
        </label>
        <textarea
          value={order.ghiChu || ""}
          onChange={(e) => onChange({ ghiChu: e.target.value })}
          rows={3}
          placeholder="Ghi chú thêm cho đơn hàng..."
          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-cyan-500 outline-none resize-y"
        />
      </div>
    </div>
  );
}

// ============================================
// TAB 2: ITEMS - ban le hoac ban si
// ============================================

interface ItemsTabProps {
  order: Order;
  dsSanPham: SanPham[];
  onUpdateItem: (id: string, p: Partial<OrderItem>) => void;
  onRemoveItem: (id: string) => void;
  onAddFromCatalog: (sp: SanPham) => void;
  onUpdateSiCell: (sp: SanPham, mauCode: string, size: string, soLuong: number) => void;
  onClearProduct?: (sp: SanPham) => void;
  onAddCustomItem: () => void;
  onChange: (p: Partial<Order>) => void;
}

function ItemsTab({ order, dsSanPham, onUpdateItem, onRemoveItem, onAddFromCatalog, onUpdateSiCell, onClearProduct, onAddCustomItem, onChange }: ItemsTabProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerSP, setPickerSP] = useState<SanPham | null>(null); // bán sỉ mode

  const isSi = order.loaiDonHang === "ban-si" || order.loaiDonHang === "ban-lo";
  const isLo = order.loaiDonHang === "ban-lo";

  return (
    <div className="space-y-4">
      <>
        {/* DANH SÁCH ITEMS CHUNG CHO MỌI LOẠI ĐƠN */}
          {order.items.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
              <Box className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 mb-3">Chưa có sản phẩm nào trong đơn</p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setShowPicker(true)}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Thêm sản phẩm
                </button>
                <button
                  onClick={onAddCustomItem}
                  className="px-4 py-2 rounded-lg border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 font-semibold text-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Thêm SP ngoài
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-700 dark:text-slate-200">Sản phẩm trong đơn ({order.items.length})</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onAddCustomItem}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    SP ngoài
                  </button>
                  <button
                    onClick={() => setShowPicker(true)}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Thêm SP
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex-1 min-w-0">
                      {item.spId === "CUSTOM" ? (
                        <div className="flex flex-col sm:flex-row gap-4 w-full bg-white dark:bg-slate-900/50 p-3 rounded-xl border border-dashed border-cyan-300 dark:border-cyan-700">
                          {/* Image Upload Area */}
                          <div className="w-full sm:w-24 h-24 shrink-0 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 transition overflow-hidden relative cursor-pointer group">
                            {item.mauImg ? (
                              <>
                                <img src={item.mauImg} alt="SP Ngoài" className="w-full h-full object-cover" />
                                <div 
                                  className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onUpdateItem(item.id, { mauImg: "" });
                                  }}
                                >
                                  <Trash2 className="w-5 h-5 text-white" />
                                </div>
                              </>
                            ) : (
                              <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-2 text-center">
                                <ImagePlus className="w-6 h-6 mb-1 text-cyan-500/70" />
                                <span className="text-[10px] font-semibold text-slate-500">Tải ảnh lên</span>
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = (ev) => onUpdateItem(item.id, { mauImg: ev.target?.result as string });
                                      reader.readAsDataURL(file);
                                    }
                                  }} 
                                />
                              </label>
                            )}
                          </div>
                          
                          {/* Info Area */}
                          <div className="flex-1 flex flex-col gap-2">
                            <input 
                              type="text" 
                              value={item.spTen || ""} 
                              onChange={(e) => onUpdateItem(item.id, { spTen: e.target.value })}
                              placeholder="Nhập tên sản phẩm"
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-bold focus:ring-2 focus:ring-cyan-500 outline-none shadow-sm transition"
                            />
                            <div className="flex gap-2">
                              <input 
                                type="text" 
                                value={item.sku || ""} 
                                onChange={(e) => onUpdateItem(item.id, { sku: e.target.value })}
                                placeholder="Mã SP (không bắt buộc)"
                                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-cyan-500 outline-none shadow-sm transition"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="font-semibold text-sm truncate">{item.spTen}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap mt-0.5">
                            {item.mauTen && <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">🎨 {item.mauTen}</span>}
                            {item.size && <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">📏 {item.size}</span>}
                            {item.sku && <span className="text-slate-400">SKU: {item.sku}</span>}
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 self-end sm:self-auto mt-2 sm:mt-0">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500">Số lượng</span>
                        <input
                          type="number"
                          min={1}
                          value={item.soLuong}
                          onChange={(e) => onUpdateItem(item.id, { soLuong: Math.max(1, +e.target.value || 1) })}
                          className="w-16 px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-center focus:ring-2 focus:ring-cyan-500 outline-none shadow-sm transition"
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500">Đơn giá</span>
                        <input
                          type="number"
                          min={0}
                          value={item.donGia}
                          onChange={(e) => onUpdateItem(item.id, { donGia: Math.max(0, +e.target.value || 0) })}
                          className="w-28 px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-right focus:ring-2 focus:ring-cyan-500 outline-none shadow-sm transition"
                        />
                      </div>
                      <div className="font-bold text-base text-emerald-600 dark:text-emerald-400 w-28 text-right bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1.5 rounded-lg">
                        {formatVND(item.thanhTien)}
                      </div>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="p-2 rounded-lg text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition shadow-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        title="Xóa sản phẩm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex flex-col gap-2 p-3 bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-slate-600 dark:text-slate-400">Tạm tính:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {formatVND(calcOrderTotal(order.items))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-600 dark:text-slate-400">Thuế VAT (%):</span>
                      <input 
                        type="number"
                        min="0"
                        max="100"
                        value={order.thueVAT || ""}
                        placeholder="0"
                        onChange={(e) => onChange({ thueVAT: Math.max(0, +e.target.value || 0) })}
                        className="w-16 px-2 py-1 rounded border border-cyan-200 dark:border-cyan-700 bg-white dark:bg-slate-800 text-sm text-center focus:ring-2 focus:ring-cyan-500 outline-none transition"
                      />
                    </div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {formatVND((calcOrderTotal(order.items) * (order.thueVAT || 0)) / 100)}
                    </span>
                  </div>
                  <div className="border-t border-cyan-200/50 dark:border-cyan-800/50 my-1"></div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-700 dark:text-slate-200">Tổng cộng:</span>
                    <span className="font-bold text-lg text-cyan-700 dark:text-cyan-300">
                      {formatVND(calcOrderTotal(order.items) * (1 + (order.thueVAT || 0) / 100))}
                    </span>
                  </div>
                  <div className="border-t border-cyan-200/50 dark:border-cyan-800/50 my-1"></div>
                  <div className="flex flex-col gap-1.5">
                    <span className="font-semibold text-xs text-slate-600 dark:text-slate-400">Ghi chú đơn hàng:</span>
                    <textarea
                      value={order.ghiChu || ""}
                      onChange={(e) => onChange({ ghiChu: e.target.value })}
                      rows={2}
                      placeholder="Nhập ghi chú dành cho đơn hàng này..."
                      className="w-full px-3 py-2 rounded-lg border border-cyan-200 dark:border-cyan-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-cyan-500 outline-none resize-y transition"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {showPicker && (
            <CatalogPicker
              dsSanPham={dsSanPham}
              search={pickerSearch}
              onSearch={setPickerSearch}
              onClose={() => setShowPicker(false)}
              orderItems={order.items}
              onUpdateCell={onUpdateSiCell}
              onClearProduct={onClearProduct}
              isSi={isSi}
              isLo={isLo}
              orderType={order.loaiDonHang}
            />
          )}
        </>
    </div>
  );
}

// Picker chọn SP đa năng (Hiển thị list, click mở rộng bảng Size x Màu)
function CatalogPicker({
  dsSanPham, search, onSearch, onClose, orderItems, onUpdateCell, onClearProduct, isSi, isLo, orderType
}: {
  dsSanPham: SanPham[];
  search: string;
  onSearch: (s: string) => void;
  onClose: () => void;
  orderItems: OrderItem[];
  onUpdateCell: (sp: SanPham, mauCode: string, size: string, soLuong: number) => void;
  onClearProduct?: (sp: SanPham) => void;
  isSi: boolean;
  isLo: boolean;
  orderType?: Order["loaiDonHang"];
}) {
  const [expandedSP, setExpandedSP] = useState<string | null>(null);

  const filtered = dsSanPham.filter((sp) => {
    const matchesSearch = sp.id.toLowerCase().includes(search.toLowerCase()) || sp.tenSP.toLowerCase().includes(search.toLowerCase());
    const channel = orderType === "ban-san" ? undefined : orderType;
    const matchesChannel = !sp.kenhBan?.length || !channel || sp.kenhBan.includes(channel as NonNullable<SanPham["kenhBan"]>[number]);
    return matchesSearch && matchesChannel;
  });
  return (
    <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col animate-slide-up">
        <div className="px-5 py-4 border-b dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-t-2xl">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-cyan-600" /> Chọn sản phẩm
          </h3>
          <button onClick={onClose} className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold transition-colors shadow-md shadow-cyan-600/20">
            Xong
          </button>
        </div>
        <div className="px-5 py-4 border-b dark:border-slate-700">
          <input
            type="text"
            placeholder="Tìm theo mã hoặc tên SP..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
            autoFocus
          />
        </div>
        <div className="flex-1 overflow-y-auto p-5 bg-slate-100 dark:bg-slate-900/50">
          <div className="flex flex-col gap-3">
            {filtered.map((sp) => {
              const isExpanded = expandedSP === sp.id;
              const tongSL = orderItems.filter(it => it.spId === sp.id).reduce((s, it) => s + it.soLuong, 0);

              return (
                <div key={sp.id} className={`flex flex-col border rounded-xl overflow-hidden bg-white dark:bg-slate-800 transition-all ${isExpanded ? 'border-cyan-500 shadow-lg ring-1 ring-cyan-500' : 'border-slate-200 dark:border-slate-700 hover:border-cyan-300'}`}>
                  <div 
                    className="p-3 cursor-pointer flex items-center gap-4 select-none"
                    onClick={() => setExpandedSP(isExpanded ? null : sp.id)}
                  >
                    <div className="w-16 h-16 shrink-0 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden relative">
                      {sp.dsMau[0]?.img ? (
                        <img src={sp.dsMau[0].img} alt={sp.tenSP} className="w-full h-full object-cover" />
                      ) : (
                        <Box className="w-8 h-8 text-slate-300 m-auto mt-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{sp.tenSP}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{sp.id}</div>
                      <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatVND(sp.giaBanDuKien)}</div>
                    </div>
                    <div className="text-right shrink-0">
                       {tongSL > 0 ? (
                         <span className="inline-flex items-center justify-center px-3 py-1 bg-cyan-100 dark:bg-cyan-900/50 text-cyan-800 dark:text-cyan-300 font-bold rounded-full text-xs shadow-sm border border-cyan-200 dark:border-cyan-800">
                           Đã chọn: {tongSL}
                         </span>
                       ) : (
                         <span className="text-slate-400 dark:text-slate-500 text-xs font-medium px-3 py-1">Chưa chọn</span>
                       )}
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-700 overflow-x-auto">
                      <ProductMatrixTable sp={sp} orderItems={orderItems} onUpdateCell={onUpdateCell} onClearProduct={onClearProduct} isSi={isSi} isLo={isLo} />
                    </div>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-center py-10 text-slate-400">Không tìm thấy SP phù hợp</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductMatrixTable({ sp, orderItems, onUpdateCell, onClearProduct, isSi, isLo }: { sp: SanPham, orderItems: OrderItem[], onUpdateCell: any, onClearProduct?: (sp: SanPham) => void, isSi?: boolean, isLo?: boolean }) {
  const mauList = sp.dsMau || [];

  // 1. Phân tích tỉ lệ size chuẩn
  // Tách tiLeSize dạng "1:2:2:2:1" hoặc "1:1:1:1"
  const tiLeParts = useMemo(() => {
    return (sp.tiLeSize || "")
      .split(":")
      .map(Number)
      .filter((n) => Number.isFinite(n) && n >= 0);
  }, [sp.tiLeSize]);

  // Ghép size với tỉ lệ tương ứng
  const sizeConfigs = useMemo(() => {
    const rawSizes = (sp.bangSize?.sizes && sp.bangSize.sizes.length > 0)
      ? sp.bangSize.sizes
      : ["M", "L", "XL", "2XL"];

    const configs = rawSizes.map((size, idx) => {
      let ratio = 1;
      if (sp.bangSize?.ratios && sp.bangSize.ratios[idx] !== undefined && sp.bangSize.ratios[idx] > 0) {
        ratio = sp.bangSize.ratios[idx];
      } else if (tiLeParts[idx] !== undefined && tiLeParts[idx] > 0) {
        ratio = tiLeParts[idx];
      }
      return { size, ratio };
    });

    const activeConfigs = configs.filter((c) => c.ratio > 0);
    return activeConfigs.length > 0 ? activeConfigs : configs;
  }, [sp.bangSize, tiLeParts]);

  // 2. Map itemsByKey: key dạng `${mauCode}-${size}`
  const itemsByKey = useMemo(() => {
    const map = new Map<string, number>();
    orderItems.forEach((it) => {
      if (it.spId === sp.id) {
        let itemMau = mauToCode(it.mauCode || it.mauTen || "");
        let itemSize = (it.size || "").trim().toUpperCase();

        // Fallback tách từ sku nếu thiếu
        if (!itemMau || !itemSize) {
          const parts = (it.sku || "").split("-");
          if (parts.length >= 2) {
            itemSize = itemSize || parts[parts.length - 1].toUpperCase();
            itemMau = itemMau || mauToCode(parts[parts.length - 2]);
          }
        }

        // Nếu vẫn không có màu, gán vào màu đầu tiên của SP
        if (!itemMau && mauList[0]) {
          itemMau = mauToCode(mauList[0].ten);
        }
        // Nếu vẫn không có size, gán vào size đầu tiên
        if (!itemSize && sizeConfigs[0]) {
          itemSize = sizeConfigs[0].size.toUpperCase();
        }

        if (itemMau && itemSize) {
          const key = `${itemMau}-${itemSize}`;
          map.set(key, (map.get(key) || 0) + (it.soLuong || 0));
        }
      }
    });
    return map;
  }, [orderItems, sp.id, mauList, sizeConfigs]);

  // 3. Tổng SL toàn bộ matrix của sản phẩm này
  const tongSL = useMemo(() => {
    return Array.from(itemsByKey.values()).reduce((s, n) => s + n, 0);
  }, [itemsByKey]);

  // Tổng tỉ lệ 1 Ri cho 1 màu
  const sumRatioPerColor = useMemo(() => {
    return sizeConfigs.reduce((s, c) => s + c.ratio, 0);
  }, [sizeConfigs]);

  // Tổng số SP của 1 Ri trên tất cả các màu
  const totalRatioAllColors = useMemo(() => {
    return sumRatioPerColor * (mauList.length || 1);
  }, [sumRatioPerColor, mauList]);

  // Tính số Ri hiện tại dựa trên tổng SL
  const currentRi = useMemo(() => {
    if (totalRatioAllColors > 0 && tongSL > 0 && tongSL % totalRatioAllColors === 0) {
      return Math.round(tongSL / totalRatioAllColors);
    }
    return 0;
  }, [totalRatioAllColors, tongSL]);

  const [slRiInput, setSlRiInput] = useState<string>("");

  // Tự động đồng bộ ô Số Ri khi tổng SL thay đổi
  useEffect(() => {
    if (currentRi > 0) {
      setSlRiInput(String(currentRi));
    } else if (tongSL === 0) {
      setSlRiInput("");
    }
  }, [currentRi, tongSL]);

  // Chia theo Ri cho TẤT CẢ các màu
  const handleRiChange = (slRi: number) => {
    setSlRiInput(slRi > 0 ? String(slRi) : "");
    mauList.forEach((mau) => {
      const mauCode = mauToCode(mau.ten);
      sizeConfigs.forEach((sc) => {
        const val = slRi * sc.ratio;
        onUpdateCell(sp, mauCode, sc.size, val);
      });
    });
  };

  // Chia theo Ri cho 1 màu cụ thể (bán lô)
  const chiaTheoRiMotMau = (mauCode: string, slRi: number) => {
    sizeConfigs.forEach((sc) => {
      onUpdateCell(sp, mauCode, sc.size, slRi * sc.ratio);
    });
  };

  // Chia theo Tổng SL của 1 màu (Tự chia theo tỉ lệ size)
  const handleTotalChange = (mauCode: string, newTotal: number) => {
    if (sumRatioPerColor === 0 || newTotal <= 0) {
      sizeConfigs.forEach((sc) => onUpdateCell(sp, mauCode, sc.size, 0));
      return;
    }

    const result = sizeConfigs.map((sc) =>
      Math.floor((newTotal * sc.ratio) / sumRatioPerColor)
    );
    let currentTotal = result.reduce((a, b) => a + b, 0);
    let remainder = newTotal - currentTotal;

    // Phân bổ phần dư vào các size có tỉ lệ lớn nhất
    const indices = sizeConfigs
      .map((_, i) => i)
      .sort((a, b) => sizeConfigs[b].ratio - sizeConfigs[a].ratio);

    let i = 0;
    while (remainder > 0 && i < indices.length) {
      result[indices[i]]++;
      remainder--;
      i++;
    }

    sizeConfigs.forEach((sc, idx) => {
      onUpdateCell(sp, mauCode, sc.size, result[idx]);
    });
  };

  // Xóa toàn bộ sản phẩm này về 0
  const handleClearAll = () => {
    setSlRiInput("");
    if (onClearProduct) {
      onClearProduct(sp);
    } else {
      mauList.forEach((mau) => {
        const mauCode = mauToCode(mau.ten);
        sizeConfigs.forEach((sc) => {
          onUpdateCell(sp, mauCode, sc.size, 0);
        });
      });
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm bg-white dark:bg-slate-900">
      {isSi && !isLo && (
        <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 border-b border-cyan-100 dark:border-cyan-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-cyan-800 dark:text-cyan-300">
              ⚡ Bán theo Ri (Áp dụng cho TẤT CẢ màu)
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-800/40 text-cyan-700 dark:text-cyan-300">
              1 Ri = {totalRatioAllColors} SP ({mauList.length} màu × {sumRatioPerColor} SP/màu)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-cyan-700 dark:text-cyan-400">Số Ri:</span>
            <input
              type="number"
              min={0}
              placeholder={currentRi > 0 ? String(currentRi) : "0"}
              value={slRiInput}
              onChange={(e) => handleRiChange(Math.max(0, +e.target.value || 0))}
              className="w-20 px-2 py-1.5 rounded-lg border border-cyan-300 dark:border-cyan-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none bg-white dark:bg-slate-800 text-center font-bold text-cyan-800 dark:text-cyan-300 shadow-inner"
            />
            {tongSL > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs px-2.5 py-1.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-semibold"
                title="Xóa tất cả số lượng của sản phẩm này"
              >
                Xóa về 0
              </button>
            )}
          </div>
        </div>
      )}
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="p-2 border-b border-r border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-left text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
              Màu \ Size <br/>
              <span className="text-[10px] text-cyan-600 font-semibold">
                Tỉ lệ: {sizeConfigs.map(c => c.ratio).join(":")}
              </span>
            </th>
            {sizeConfigs.map((sc) => (
              <th key={sc.size} className="p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-center text-xs font-bold text-slate-700 dark:text-slate-300">
                {sc.size} <br/> <span className="text-[10px] font-normal text-slate-500">({sc.ratio})</span>
              </th>
            ))}
            <th className="p-2 border-b border-l border-slate-200 dark:border-slate-700 bg-cyan-50 dark:bg-cyan-900/20 text-center text-xs font-bold text-cyan-800 dark:text-cyan-400">
              Tổng SL (Tự chia)
            </th>
          </tr>
        </thead>
        <tbody>
          {mauList.map((mau) => {
            const mauCode = mauToCode(mau.ten);
            const rowTotal = sizeConfigs.reduce(
              (sum, sc) => sum + (itemsByKey.get(`${mauCode}-${sc.size.toUpperCase()}`) || 0),
              0
            );
            const rowRi = sumRatioPerColor > 0 && rowTotal > 0 ? Math.round(rowTotal / sumRatioPerColor) : 0;

            return (
              <tr key={mau.ten} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="p-2 border-b border-r border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 whitespace-nowrap">
                  {mau.img ? (
                    <img src={mau.img} alt={mau.ten} className="w-6 h-6 rounded object-cover shadow-sm" />
                  ) : (
                    <div className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700"></div>
                  )}
                  {mau.ten}
                  {isLo && (
                    <label className="ml-1 flex flex-col items-center gap-0.5 text-[10px] font-bold text-amber-700">
                      <span>Số Ri</span>
                      <input
                        type="number"
                        min={0}
                        value={rowRi || ""}
                        placeholder="0"
                        onChange={(e) => chiaTheoRiMotMau(mauCode, Math.max(0, +e.target.value || 0))}
                        className="h-11 w-20 rounded-lg border-2 border-amber-400 bg-amber-50 px-1 text-center text-lg font-black text-amber-700 outline-none focus:ring-2 focus:ring-amber-500"
                        title="Số Ri của màu này"
                      />
                    </label>
                  )}
                </td>
                {sizeConfigs.map((sc) => {
                  const val = itemsByKey.get(`${mauCode}-${sc.size.toUpperCase()}`) || 0;
                  return (
                    <td
                      key={sc.size}
                      className={`p-1 border-b border-slate-200 dark:border-slate-700 text-center ${val > 0 ? "bg-cyan-50/50 dark:bg-cyan-900/10" : ""}`}
                    >
                      <input
                        type="number"
                        min={0}
                        value={val || ""}
                        placeholder="0"
                        onChange={(e) => onUpdateCell(sp, mauCode, sc.size, Math.max(0, +e.target.value || 0))}
                        className="h-11 w-20 rounded-lg border-2 border-slate-300 bg-white px-1 text-center text-lg font-black text-slate-800 outline-none transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      />
                    </td>
                  );
                })}
                <td className="p-1 border-b border-l border-slate-200 dark:border-slate-700 bg-cyan-50/50 dark:bg-cyan-900/10 text-center">
                  <input
                    type="number"
                    min={0}
                    value={rowTotal || ""}
                    placeholder="0"
                    onChange={(e) => handleTotalChange(mauCode, Math.max(0, +e.target.value || 0))}
                    className="h-11 w-28 rounded-lg border-2 border-cyan-400 bg-cyan-50 px-1 text-center text-lg font-black text-cyan-700 outline-none transition-all focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500 dark:border-cyan-700 dark:bg-slate-800 dark:text-cyan-300"
                  />
                </td>
              </tr>
            );
          })}
          <tr>
            <td className="p-2 border-r border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 text-right">
              Tổng cộng
            </td>
            {sizeConfigs.map((sc) => {
              const colTotal = mauList.reduce((sum, m) => {
                const mauCode = mauToCode(m.ten);
                return sum + (itemsByKey.get(`${mauCode}-${sc.size.toUpperCase()}`) || 0);
              }, 0);
              return (
                <td key={sc.size} className="p-2 bg-slate-100 dark:bg-slate-800 text-center text-xs font-bold text-slate-700 dark:text-slate-300">
                  {colTotal}
                </td>
              );
            })}
            <td className="p-2 border-l border-slate-200 dark:border-slate-700 bg-cyan-100 dark:bg-cyan-900/30 text-center text-sm font-extrabold text-cyan-700 dark:text-cyan-400">
              {tongSL}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}


// ============================================
// TAB 3: THANH TOAN - multi-method
// ============================================

interface PaymentTabProps {
  order: Order;
  tongThanhToan: number;
  daThanhToan: number;
  conLai: number;
  onAddPayment: (pt: PhuongThucThanhToan) => void;
  onUpdatePayment: (id: string, p: Partial<OrderPayment>) => void;
  onRemovePayment: (id: string) => void;
}

function PaymentTab({ order, tongThanhToan, daThanhToan, conLai, onAddPayment, onUpdatePayment, onRemovePayment }: PaymentTabProps) {
  return (
    <div className="space-y-4 max-w-3xl">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-200">
          <div className="text-xs text-cyan-700 dark:text-cyan-300 font-semibold">Tổng đơn</div>
          <div className="font-bold text-lg text-cyan-900 dark:text-cyan-200">{formatVNDShort(tongThanhToan)}</div>
        </div>
        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200">
          <div className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">Đã trả</div>
          <div className="font-bold text-lg text-emerald-900 dark:text-emerald-200">{formatVNDShort(daThanhToan)}</div>
        </div>
        <div className={`p-3 rounded-lg border ${conLai > 0 ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200" : "bg-slate-50 dark:bg-slate-800 border-slate-200"}`}>
          <div className={`text-xs font-semibold ${conLai > 0 ? "text-amber-700 dark:text-amber-300" : "text-slate-500"}`}>
            Còn lại
          </div>
          <div className={`font-bold text-lg ${conLai > 0 ? "text-amber-900 dark:text-amber-200" : "text-emerald-600"}`}>
            {formatVNDShort(conLai)}
          </div>
        </div>
      </div>

      {/* List payments */}
      {order.payments.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
          <Wallet className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-slate-500 mb-3 text-sm">Chưa có thanh toán nào</p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {(Object.keys(PHUONG_THUC_THANH_TOAN_LABELS) as PhuongThucThanhToan[]).map((pt) => (
              <button
                key={pt}
                onClick={() => onAddPayment(pt)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:border-cyan-500 text-sm font-semibold"
              >
                + {PHUONG_THUC_THANH_TOAN_LABELS[pt]}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-700 dark:text-slate-200">Lịch sử thanh toán ({order.payments.length})</h3>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(Object.keys(PHUONG_THUC_THANH_TOAN_LABELS) as PhuongThucThanhToan[]).map((pt) => (
                <button
                  key={pt}
                  onClick={() => onAddPayment(pt)}
                  className="px-2.5 py-1 rounded bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> {PHUONG_THUC_THANH_TOAN_LABELS[pt]}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {order.payments.map((p) => (
              <div key={p.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 flex gap-3">
                {/* Cột ảnh chứng từ */}
                <div className="w-20 h-20 shrink-0 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center text-slate-400 bg-white dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition overflow-hidden relative cursor-pointer group">
                  {p.hinhAnh ? (
                    <>
                      <img src={p.hinhAnh} alt="Chứng từ" className="w-full h-full object-cover" />
                      <div 
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onUpdatePayment(p.id, { hinhAnh: "" });
                        }}
                      >
                        <Trash2 className="w-5 h-5 text-white" />
                      </div>
                    </>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-1 text-center">
                      <ImagePlus className="w-5 h-5 mb-0.5 text-cyan-500/70" />
                      <span className="text-[9px] font-semibold text-slate-500 leading-tight">Biên lai /<br/>Chứng từ</span>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => onUpdatePayment(p.id, { hinhAnh: ev.target?.result as string });
                            reader.readAsDataURL(file);
                          }
                        }} 
                      />
                    </label>
                  )}
                </div>

                {/* Cột thông tin */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={p.phuongThuc}
                      onChange={(e) => onUpdatePayment(p.id, { phuongThuc: e.target.value as PhuongThucThanhToan })}
                      className="px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
                    >
                      {(Object.keys(PHUONG_THUC_THANH_TOAN_LABELS) as PhuongThucThanhToan[]).map((pt) => (
                        <option key={pt} value={pt}>{PHUONG_THUC_THANH_TOAN_LABELS[pt]}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={0}
                      value={p.soTien || ""}
                      placeholder="Số tiền"
                      onChange={(e) => onUpdatePayment(p.id, { soTien: Math.max(0, +e.target.value || 0) })}
                      className="flex-1 min-w-[120px] px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-right font-semibold"
                    />
                    <span className="text-xs text-slate-500">đ</span>
                    <input
                      type="date"
                      value={p.ngayThanhToan}
                      onChange={(e) => onUpdatePayment(p.id, { ngayThanhToan: e.target.value })}
                      className="px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
                    />
                    <button
                      onClick={() => onRemovePayment(p.id)}
                      className="p-1.5 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {/* Fields riêng cho NH */}
                  {p.phuongThuc === "ngan-hang" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select
                        value={p.nganHang || ""}
                        onChange={(e) => onUpdatePayment(p.id, { nganHang: e.target.value || undefined })}
                        className="px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
                      >
                        <option value="">-- Ngân hàng --</option>
                        {NGAN_HANG_OPTIONS.map((nh) => (
                          <option key={nh.code} value={nh.code}>{nh.ten}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={p.maGiaoDich || ""}
                        placeholder="Mã giao dịch (VD: FT24081...)"
                        onChange={(e) => onUpdatePayment(p.id, { maGiaoDich: e.target.value || undefined })}
                        className="px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
                      />
                    </div>
                  )}
                  {/* Ghi chu cho cong no */}
                  {p.phuongThuc === "cong-no" && (
                    <input
                      type="text"
                      value={p.ghiChu || ""}
                      placeholder="VD: Công nợ 30 ngày, thanh toán cuối tháng..."
                      onChange={(e) => onUpdatePayment(p.id, { ghiChu: e.target.value || undefined })}
                      className="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {conLai > 0 && order.payments.length > 0 && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div className="text-xs text-amber-700 dark:text-amber-300">
            Còn thiếu <b>{formatVND(conLai)}</b>. Có thể thêm 1 lần thanh toán nữa (multi-method).
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// TAB 4: VAN CHUYEN
// ============================================

function ShippingTab({ shipping, tongTien, onChange }: { shipping: OrderShipping; tongTien: number; onChange: (p: Partial<OrderShipping>) => void }) {
  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-200">
          <Truck className="inline w-3.5 h-3.5 mr-1" />
          Phương thức vận chuyển
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(Object.keys(PHUONG_THUC_VAN_CHUYEN_LABELS) as PhuongThucVanChuyen[]).map((k) => {
            const active = shipping.phuongThuc === k;
            return (
              <button
                key={k}
                onClick={() => onChange({ phuongThuc: k })}
                className={`px-3 py-2.5 rounded-lg border-2 font-semibold text-sm text-left transition ${
                  active
                    ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300"
                    : "border-slate-200 dark:border-slate-700 hover:border-cyan-300 text-slate-600 dark:text-slate-300"
                }`}
              >
                {PHUONG_THUC_VAN_CHUYEN_LABELS[k]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-200">Phí vận chuyển (VND)</label>
          <input
            type="number"
            min={0}
            value={shipping.phiVanChuyen || ""}
            onChange={(e) => onChange({ phiVanChuyen: Math.max(0, +e.target.value || 0) })}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
            placeholder="0"
          />
          {tongTien >= 500000 && shipping.phuongThuc !== "khach-den-lay" && (
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
              💡 Đơn ≥ 500k thường được freeship (tùy chính sách)
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-200">Mã vận đơn (tracking)</label>
          <input
            type="text"
            value={shipping.maVanDon || ""}
            onChange={(e) => onChange({ maVanDon: e.target.value || undefined })}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
            placeholder="VD: GHTK123456789"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-200">Địa chỉ giao</label>
        <textarea
          value={shipping.diaChiGiao || ""}
          onChange={(e) => onChange({ diaChiGiao: e.target.value || undefined })}
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm resize-y"
          placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố..."
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-200">Ghi chú vận chuyển</label>
        <textarea
          value={shipping.ghiChu || ""}
          onChange={(e) => onChange({ ghiChu: e.target.value || undefined })}
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm resize-y"
          placeholder="VD: Giao giờ hành chính, gọi trước 30 phút..."
        />
      </div>
    </div>
  );
}
