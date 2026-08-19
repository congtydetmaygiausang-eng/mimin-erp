"use client";

// ============================================
// DON HANG STORE - Context + localStorage persistence
// Quản lý toàn bộ đơn hàng: CRUD, thanh toán, vận chuyển
// ============================================

import {
  createContext, useCallback, useContext,
  useEffect, useState, type ReactNode,
} from "react";
import type { Order, OrderItem, OrderPayment, OrderShipping, TrangThaiVanChuyen } from "@/components/order-detail/types";

const STORAGE_KEY = "mimin_don_hang_v3";

// ─── Seed data demo ───────────────────────────────────────────────────────────
const SEED_ORDERS: Order[] = [
  {
    id: "DH001",
    maDH: "DH-2026-001",
    ngayDat: "2026-08-01",
    ngayGiao: "2026-08-05",
    khachHang: "Shop Thời Trang SG",
    sdt: "0901234567",
    diaChi: "123 Nguyễn Trãi, Q1, TP.HCM",
    email: "shop.sg@gmail.com",
    loaiDon: "ban-si",
    trangThai: "Đã giao",
    items: [
      { id: "i1", spId: "M001", spTen: "Bộ trụ trơn M758", mauTen: "Đen", mauCode: "DEN", size: "L", sku: "M758-DEN-L", soLuong: 120, donGia: 78000, thanhTien: 9360000 },
      { id: "i2", spId: "A002", spTen: "Áo thun form rộng", mauTen: "Trắng", mauCode: "TRA", size: "XL", sku: "A002-TRA-XL", soLuong: 80, donGia: 38000, thanhTien: 3040000 },
    ],
    payments: [
      { id: "p1", phuongThuc: "ngan-hang", soTien: 7000000, ngayThanhToan: "2026-08-01", maGiaoDich: "FT2608010001", nganHang: "MB", ghiChu: "Cọc 55%" },
      { id: "p2", phuongThuc: "ngan-hang", soTien: 5400000, ngayThanhToan: "2026-08-05", maGiaoDich: "FT2608050088", nganHang: "MB", ghiChu: "Thanh toán phần còn lại" },
    ],
    shipping: {
      phuongThuc: "ghn",
      phiVanChuyen: 35000,
      maVanDon: "GHN123456789",
      diaChiGiao: "123 Nguyễn Trãi, Q1, TP.HCM",
      trangThai: "da-giao",
      ngayGiaoDuKien: "2026-08-05",
    },
    ghiChu: "Khách quen - ưu tiên giao sớm",
    giamGia: 0,
    loHang: "LH-2026-08",
    sanPham: "M758+A002",
    soLuong: 200,
    donGia: 0,
    tienCoc: 7000000,
    thanhTien: 12400000,
    tongTien: 12400000,
    tienCuoiKy: 5400000,
  },
  {
    id: "DH002",
    maDH: "DH-2026-002",
    ngayDat: "2026-08-03",
    ngayGiao: "2026-08-10",
    khachHang: "Thanh Huyền Boutique",
    sdt: "0912345678",
    diaChi: "45 Lê Lợi, Đà Nẵng",
    email: "",
    loaiDon: "ban-si",
    trangThai: "Đang SX",
    items: [
      { id: "i3", spId: "A001", spTen: "Áo Polo Basic", mauTen: "Xanh Đen", mauCode: "XDEN", size: "L", sku: "A001-XDEN-L", soLuong: 60, donGia: 52000, thanhTien: 3120000 },
    ],
    payments: [
      { id: "p3", phuongThuc: "ngan-hang", soTien: 1500000, ngayThanhToan: "2026-08-03", maGiaoDich: "VCB123", nganHang: "VCB", ghiChu: "Cọc 50%" },
    ],
    shipping: {
      phuongThuc: "ghtk",
      phiVanChuyen: 45000,
      maVanDon: "",
      diaChiGiao: "45 Lê Lợi, Đà Nẵng",
      trangThai: "cho-xu-ly",
      ngayGiaoDuKien: "2026-08-10",
    },
    ghiChu: "",
    giamGia: 0,
    loHang: "",
    sanPham: "A001",
    soLuong: 60,
    donGia: 52000,
    tienCoc: 1500000,
    thanhTien: 3120000,
    tongTien: 3120000,
    tienCuoiKy: 1620000,
  },
  {
    id: "DH003",
    maDH: "DH-2026-003",
    ngayDat: "2026-08-07",
    ngayGiao: "2026-08-12",
    khachHang: "Minh Anh Store",
    sdt: "0987654321",
    diaChi: "78 Trần Hưng Đạo, Hà Nội",
    email: "minhanh@gmail.com",
    loaiDon: "ban-le",
    trangThai: "Mới",
    items: [
      { id: "i4", spId: "B001", spTen: "Bộ gia đình in họa tiết", mauTen: "Hồng Pastel", mauCode: "HONG", size: "M", sku: "B001-HONG-M", soLuong: 5, donGia: 245000, thanhTien: 1225000 },
      { id: "i5", spId: "P001", spTen: "Mũ lưỡi trai POLOMIMIN", mauTen: "Đen", mauCode: "DEN", size: "Free", sku: "P001-DEN-FREE", soLuong: 5, donGia: 85000, thanhTien: 425000 },
    ],
    payments: [],
    shipping: {
      phuongThuc: "ghn",
      phiVanChuyen: 30000,
      maVanDon: "",
      diaChiGiao: "78 Trần Hưng Đạo, Hà Nội",
      trangThai: "cho-xu-ly",
      ngayGiaoDuKien: "2026-08-12",
    },
    ghiChu: "Giao trước 12h",
    giamGia: 50000,
    loHang: "",
    sanPham: "B001+P001",
    soLuong: 10,
    donGia: 0,
    tienCoc: 0,
    thanhTien: 1650000,
    tongTien: 1650000,
    tienCuoiKy: 1650000,
  },
];

// ─── Context types ─────────────────────────────────────────────────────────────
interface DonHangContextType {
  dsOrder: Order[];
  loading: boolean;
  themOrder: (order: Order) => void;
  suaOrder: (id: string, data: Partial<Order>) => void;
  xoaOrder: (id: string) => void;
  themThanhToan: (orderId: string, payment: OrderPayment) => void;
  capNhatVanChuyen: (orderId: string, shipping: Partial<OrderShipping>) => void;
  doiTrangThai: (orderId: string, trangThai: Order["trangThai"]) => void;
}

const DonHangContext = createContext<DonHangContextType | undefined>(undefined);

// ─── Provider ──────────────────────────────────────────────────────────────────
import { useSupabaseSync } from "@/lib/supabase/client";
import { useKhachHang } from "./khach-hang-store";
import { toast } from "sonner";

// ... [The context and interfaces remain unchanged above this block]

export function DonHangProvider({ children }: { children: ReactNode }) {
  // Replace useState & localStorage with useSupabaseSync
  const { data: dsOrder, setData: setDsOrder, loading } = useSupabaseSync<Order>(STORAGE_KEY, "don_hang", SEED_ORDERS);
  
  // Lấy dữ liệu khách hàng để đồng bộ công nợ
  const { list: khList, congTruCongNo } = useKhachHang();

  // Đồng bộ công nợ. Đơn hàng chỉ lưu TÊN khách (Order.khachHang) nên vẫn phải
  // tra ngược ra mã, nhưng so khớp đã nới (bỏ khoảng trắng thừa, không phân biệt
  // hoa/thường) và có cảnh báo khi không khớp - trước đây so khớp tuyệt đối từng
  // ký tự, lệch 1 dấu cách là bỏ qua âm thầm, đơn vẫn lưu mà công nợ không cộng.
  const syncCongNoKhachHang = useCallback((khTen: string, diff: number) => {
    if (diff === 0) return;
    const chuanHoa = (s: string) => (s || "").trim().toLowerCase().replace(/\s+/g, " ");
    const dich = chuanHoa(khTen);
    const kh = khList.find(x => chuanHoa(x.ten) === dich);
    if (kh) {
      congTruCongNo(kh.maKH, diff);
    } else if (khTen) {
      toast.warning(
        `Không tìm thấy khách hàng "${khTen}" trong danh mục nên CHƯA cộng công nợ. Vui lòng kiểm tra lại tên khách hoặc thêm khách vào Danh mục khách hàng.`,
        { duration: 10000 }
      );
    }
  }, [khList, congTruCongNo]);

  // Trừ tồn kho thành phẩm khi đơn được giao. Trước đây bán hàng KHÔNG hề trừ kho -
  // phải bấm tay nút "Xuất kho" trên từng màu, nên tồn kho hiển thị lệch dần so với
  // thực tế. Chỉ trừ đúng 1 lần (cờ daTruKho) và chỉ khi đơn thật sự đã giao.
  const truKhoChoDon = useCallback(async (order: Order) => {
    if (order.daTruKho) return;
    const items = (order.items || []).filter(it => it.soLuong > 0);
    if (items.length === 0) return;

    try {
      const { truTonKhoThanhPham } = await import("@/app/(main)/kho-thanh-pham/data");
      const { thieu } = await truTonKhoThanhPham(
        items.map(it => ({
          spId: it.spId,
          mauTen: it.mauTen,
          soLuong: it.soLuong,
          tenHienThi: it.spTen,
        })),
        `Xuất theo đơn ${order.maDH}`
      );

      setDsOrder(prev => prev.map(o => o.id === order.id ? { ...o, daTruKho: true } : o));

      if (thieu.length > 0) {
        toast.warning(
          `Đã giao ${order.maDH} nhưng kho không đủ hàng để trừ:\n• ${thieu.join("\n• ")}`,
          { duration: 10000 }
        );
      }
    } catch (e) {
      console.error("[DonHang] Lỗi trừ tồn kho thành phẩm:", e);
      toast.error(`Chưa trừ được tồn kho cho đơn ${order.maDH}. Vui lòng kiểm tra Kho thành phẩm.`);
    }
  }, [setDsOrder]);

  const themOrder = useCallback((order: Order) => {
    setDsOrder(prev => [order, ...prev]);
    const conNo = calcConLai(order);
    syncCongNoKhachHang(order.khachHang, conNo);
  }, [setDsOrder, syncCongNoKhachHang]);

  const suaOrder = useCallback((id: string, data: Partial<Order>) => {
    let danGiao: Order | undefined;
    setDsOrder(prev => {
      const oldOrder = prev.find(o => o.id === id);
      if (!oldOrder) return prev;

      const newOrder = { ...oldOrder, ...data };
      const diff = calcConLai(newOrder) - calcConLai(oldOrder);

      syncCongNoKhachHang(newOrder.khachHang, diff);
      if (newOrder.trangThai === "Đã giao" && !oldOrder.daTruKho) danGiao = newOrder;

      return prev.map(o => o.id === id ? newOrder : o);
    });
    if (danGiao) truKhoChoDon(danGiao);
  }, [setDsOrder, syncCongNoKhachHang, truKhoChoDon]);

  const xoaOrder = useCallback((id: string) => {
    setDsOrder(prev => {
      const oldOrder = prev.find(o => o.id === id);
      if (oldOrder) {
         syncCongNoKhachHang(oldOrder.khachHang, -calcConLai(oldOrder));
      }
      return prev.filter(o => o.id !== id);
    });
  }, [setDsOrder, syncCongNoKhachHang]);

  const themThanhToan = useCallback((orderId: string, payment: OrderPayment) => {
    setDsOrder(prev => {
      let updatedKhachHang = "";
      const newList = prev.map(o => {
        if (o.id !== orderId) return o;
        const payments = [...(o.payments || []), payment];
        const totalPaid = payments.reduce((s, p) => s + p.soTien, 0);
        const tongTien = (o.tongTien || 0);
        const newTrangThai: Order["trangThai"] =
          totalPaid >= tongTien ? "Hoàn thành" :
          totalPaid > 0 ? o.trangThai :
          o.trangThai;
        
        updatedKhachHang = o.khachHang;
        return { ...o, payments, tienCuoiKy: tongTien - totalPaid, trangThai: newTrangThai };
      });
      
      // Giảm công nợ của khách hàng bằng số tiền vừa thanh toán
      if (updatedKhachHang) {
        syncCongNoKhachHang(updatedKhachHang, -payment.soTien);
      }
      return newList;
    });
  }, [setDsOrder, syncCongNoKhachHang]);

  const capNhatVanChuyen = useCallback((orderId: string, shipping: Partial<OrderShipping>) => {
    let danGiao: Order | undefined;
    setDsOrder(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const newShipping = {
        ...(o.shipping || { phuongThuc: "ghtk", phiVanChuyen: 0, trangThai: "cho-xu-ly" as TrangThaiVanChuyen }),
        ...shipping
      } as OrderShipping;
      const trangThai: Order["trangThai"] = shipping.trangThai === "da-giao" ? "Đã giao" : o.trangThai;
      const next = { ...o, shipping: newShipping, trangThai };
      if (trangThai === "Đã giao" && !o.daTruKho) danGiao = next;
      return next;
    }));
    if (danGiao) truKhoChoDon(danGiao);
  }, [setDsOrder, truKhoChoDon]);

  const doiTrangThai = useCallback((orderId: string, trangThai: Order["trangThai"]) => {
    let danGiao: Order | undefined;
    setDsOrder(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const next = { ...o, trangThai };
      if (trangThai === "Đã giao" && !o.daTruKho) danGiao = next;
      return next;
    }));
    if (danGiao) truKhoChoDon(danGiao);
  }, [setDsOrder, truKhoChoDon]);

  return (
    <DonHangContext.Provider value={{
      dsOrder, loading,
      themOrder, suaOrder, xoaOrder,
      themThanhToan, capNhatVanChuyen, doiTrangThai,
    }}>
      {children}
    </DonHangContext.Provider>
  );
}

export function useDonHang() {
  const ctx = useContext(DonHangContext);
  if (!ctx) throw new Error("useDonHang must be used within DonHangProvider");
  return ctx;
}

// ─── Helpers xuất ra ngoài ──────────────────────────────────────────────────────
export function calcTongTien(order: Order): number {
  const subtotal = (order.items || []).reduce((s, i) => s + i.thanhTien, 0);
  const ship = order.shipping?.phiVanChuyen || 0;
  const giam = order.giamGia || 0;
  return subtotal + ship - giam;
}

export function calcDaThanhToan(order: Order): number {
  return (order.payments || []).reduce((s, p) => s + p.soTien, 0);
}

export function calcConLai(order: Order): number {
  return calcTongTien(order) - calcDaThanhToan(order);
}

export function genOrderId(dsOrder: Order[]): string {
  const maxNum = dsOrder.reduce((max, o) => {
    const n = parseInt(o.id.replace(/\D/g, "")) || 0;
    return Math.max(max, n);
  }, 0);
  return `DH${String(maxNum + 1).padStart(3, "0")}`;
}

export function genMaDH(dsOrder: Order[]): string {
  const now = new Date();
  const yy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const seq = dsOrder.filter(o => o.maDH.startsWith(`DH-${yy}`)).length + 1;
  return `DH-${yy}-${mm}-${String(seq).padStart(3, "0")}`;
}
