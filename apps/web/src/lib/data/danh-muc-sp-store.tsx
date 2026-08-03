"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { type LoaiSP, type MauVai } from "./lenh-cat-store";

export interface MauTieuChuan {
  ten: string;
  maSKU: string;
  dinhMuc: number;
  img: string;
}

export interface SanPham {
  id: string; // e.g. M001
  tenSP: string;
  loaiSP: LoaiSP;
  giaBanDuKien: number;
  giaVonDuKien: number;
  tiLeSize: string; // e.g. "1:2:2:1"
  dsMau: MauTieuChuan[];
  ghiChu: string;
  ngayTao: string;
}

const MOCK_DANH_MUC: SanPham[] = [
  {
    id: "M001",
    tenSP: "Bộ Thể Thao Nam Cao Cấp",
    loaiSP: "BoTru",
    giaBanDuKien: 250000,
    giaVonDuKien: 110000,
    tiLeSize: "1:2:2:1",
    dsMau: [
      { ten: "Đen", maSKU: "M001-DEN", dinhMuc: 0.25, img: "" },
      { ten: "Trắng", maSKU: "M001-TRA", dinhMuc: 0.25, img: "" }
    ],
    ghiChu: "Vải thể thao co giãn 4 chiều",
    ngayTao: "2026-08-01",
  },
  {
    id: "A001",
    tenSP: "Áo Polo Basic",
    loaiSP: "AoTru",
    giaBanDuKien: 120000,
    giaVonDuKien: 65000,
    tiLeSize: "0:1:2:2:1",
    dsMau: [
      { ten: "Xanh Đen", maSKU: "A001-XDEN", dinhMuc: 0.15, img: "" },
      { ten: "Rêu", maSKU: "A001-REU", dinhMuc: 0.15, img: "" }
    ],
    ghiChu: "Vải cá sấu poly",
    ngayTao: "2026-08-02",
  }
];

interface DanhMucSPContextType {
  dsSanPham: SanPham[];
  themSP: (sp: SanPham) => void;
  suaSP: (id: string, data: Partial<SanPham>) => void;
  xoaSP: (id: string) => void;
}

const DanhMucSPContext = createContext<DanhMucSPContextType | undefined>(undefined);

export function DanhMucSPProvider({ children }: { children: ReactNode }) {
  const [dsSanPham, setDsSanPham] = useState<SanPham[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("mimin_danh_muc_sp");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setDsSanPham(parsed);
        } else {
          setDsSanPham(MOCK_DANH_MUC);
        }
      } else {
        setDsSanPham(MOCK_DANH_MUC);
        localStorage.setItem("mimin_danh_muc_sp", JSON.stringify(MOCK_DANH_MUC));
      }
    } catch (e) {
      setDsSanPham(MOCK_DANH_MUC);
    }
  }, []);

  const themSP = useCallback((sp: SanPham) => {
    setDsSanPham(prev => {
      const next = [...prev, sp];
      localStorage.setItem("mimin_danh_muc_sp", JSON.stringify(next));
      return next;
    });
  }, []);

  const suaSP = useCallback((id: string, data: Partial<SanPham>) => {
    setDsSanPham(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...data } : p);
      localStorage.setItem("mimin_danh_muc_sp", JSON.stringify(next));
      return next;
    });
  }, []);

  const xoaSP = useCallback((id: string) => {
    setDsSanPham(prev => {
      const next = prev.filter(p => p.id !== id);
      localStorage.setItem("mimin_danh_muc_sp", JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <DanhMucSPContext.Provider value={{ dsSanPham, themSP, suaSP, xoaSP }}>
      {children}
    </DanhMucSPContext.Provider>
  );
}

export function useDanhMucSP() {
  const context = useContext(DanhMucSPContext);
  if (context === undefined) {
    throw new Error("useDanhMucSP must be used within a DanhMucSPProvider");
  }
  return context;
}
