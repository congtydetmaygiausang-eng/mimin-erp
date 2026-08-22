"use client";

// ============================================
// Gio hang (cart) - state tam thoi truoc khi chot don hang.
// Khong dong bo Supabase (chi la buoc trung gian tren may khach),
// chi luu localStorage. Khi "Tao don hang" thi chuyen thanh Order
// that qua don-hang-store.
// ============================================

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { SanPham } from "./danh-muc-sp-store";
import { generateVariants } from "./product-variants";

export interface GioHangItem {
  /** id = variant id (spId-mauCode-size) hoac spId neu SP chua co variant */
  id: string;
  spId: string;
  spTen: string;
  mauCode?: string;
  mauTen?: string;
  size?: string;
  sku?: string;
  soLuong: number;
  donGia: number;
  img?: string;
}

interface GioHangContextType {
  items: GioHangItem[];
  themVaoGio: (sp: SanPham) => void;
  themNhieuVaoGio: (items: GioHangItem[]) => void;
  capNhatSoLuong: (id: string, soLuong: number) => void;
  xoaKhoiGio: (id: string) => void;
  xoaGio: () => void;
  tongSoLuong: number;
  tongTien: number;
}

const STORAGE_KEY = "mimin_gio_hang";
const GioHangContext = createContext<GioHangContextType | undefined>(undefined);

export function GioHangProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<GioHangItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {}
  }, []);

  const persist = (next: GioHangItem[]) => {
    setItems(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  const themVaoGio = useCallback((sp: SanPham) => {
    const variants = generateVariants(sp.id, sp.dsMau || [], sp.bangSize);
    const first = variants[0];
    const firstMau = sp.dsMau?.[0];
    const id = first ? first.id : sp.id;

    setItems((prev) => {
      const existing = prev.find((it) => it.id === id);
      const next = existing
        ? prev.map((it) => (it.id === id ? { ...it, soLuong: it.soLuong + 1 } : it))
        : [
            ...prev,
            {
              id,
              spId: sp.id,
              spTen: sp.tenSP,
              mauCode: first?.mauCode,
              mauTen: first?.mauTen || firstMau?.ten,
              size: first?.size,
              sku: first?.maSKU,
              soLuong: 1,
              donGia: sp.giaBanDuKien,
              img: first?.img || firstMau?.img || sp.hinhAnh,
            } as GioHangItem,
          ];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const themNhieuVaoGio = useCallback((newItems: GioHangItem[]) => {
    setItems((prev) => {
      let next = [...prev];
      for (const item of newItems) {
        if (item.soLuong <= 0) continue;
        const existingIdx = next.findIndex((it) => it.id === item.id);
        if (existingIdx >= 0) {
          next[existingIdx] = { ...next[existingIdx], soLuong: next[existingIdx].soLuong + item.soLuong };
        } else {
          next.push(item);
        }
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const capNhatSoLuong = useCallback((id: string, soLuong: number) => {
    setItems((prev) => {
      const next =
        soLuong <= 0
          ? prev.filter((it) => it.id !== id)
          : prev.map((it) => (it.id === id ? { ...it, soLuong } : it));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const xoaKhoiGio = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((it) => it.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const xoaGio = useCallback(() => {
    persist([]);
  }, []);

  const tongSoLuong = items.reduce((s, it) => s + it.soLuong, 0);
  const tongTien = items.reduce((s, it) => s + it.soLuong * it.donGia, 0);

  return (
    <GioHangContext.Provider
      value={{
        items,
        themVaoGio,
        themNhieuVaoGio,
        capNhatSoLuong,
        xoaKhoiGio,
        xoaGio,
        tongSoLuong,
        tongTien,
      }}
    >
      {children}
    </GioHangContext.Provider>
  );
}

export function useGioHang() {
  const ctx = useContext(GioHangContext);
  if (!ctx) throw new Error("useGioHang must be used within GioHangProvider");
  return ctx;
}
