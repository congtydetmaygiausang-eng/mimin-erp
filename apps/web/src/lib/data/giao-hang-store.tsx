"use client";

// ============ GIAO HÀNG STORE (Đợt 4) ============
// Lưu localStorage `mimin_giao_hang_v1` thay const GH_DATA mẫu
// CRUD: themLoGiao, suaLoGiao, xoaLoGiao, capNhatTrangThai
// Workflow: Chờ giao → Đang giao → Đã giao / Trễ

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { logWorkflow } from "../audit-log";
import type { AppUser } from "@/components/session-provider";

export type TrangThaiGH = "Chờ giao" | "Đang giao" | "Đã giao" | "Trễ";

export type GiaoHang = {
  id: string;
  maGH: string;
  ngayGiao: string;
  donHang: string;        // Mã DH liên kết
  khachHang: string;
  sdt: string;
  diaChi: string;
  soLuong: number;
  trangThai: TrangThaiGH;
  phuongTien: string;     // "Xe tải 1.5T"
  nguoiVanChuyen?: string;
  ghiChu?: string;
  ngayTao?: string;
  nguoiTao?: string;
};

const STORAGE_KEY = "mimin_giao_hang_v1";

const DEFAULT: GiaoHang[] = [
  { id: "GH-001", maGH: "GH-2026-001", ngayGiao: "2026-07-10", donHang: "DH-2026-005", khachHang: "Shop Thời Trang Sài Gòn", sdt: "0987654321", diaChi: "Quận 1, TP.HCM", soLuong: 100, trangThai: "Đã giao", phuongTien: "Xe tải 1.5T", nguoiVanChuyen: "Nguyễn Văn Tài" },
  { id: "GH-002", maGH: "GH-2026-002", ngayGiao: "2026-07-15", donHang: "DH-2026-006", khachHang: "Cty May Hà Nội", sdt: "0912345678", diaChi: "Hà Nội", soLuong: 500, trangThai: "Đã giao", phuongTien: "Xe tải 5T", nguoiVanChuyen: "Trần Văn Bình" },
  { id: "GH-003", maGH: "GH-2026-003", ngayGiao: "2026-07-20", donHang: "DH-2026-007", khachHang: "Xưởng may Hoàng Long", sdt: "0945678901", diaChi: "Long An", soLuong: 300, trangThai: "Đã giao", phuongTien: "Xe tải 3T", nguoiVanChuyen: "Lê Văn Cường" },
  { id: "GH-004", maGH: "GH-2026-004", ngayGiao: "2026-08-05", donHang: "DH-2026-001", khachHang: "Cty May Hà Nội", sdt: "0912345678", diaChi: "Hà Nội", soLuong: 500, trangThai: "Đang giao", phuongTien: "Xe tải 5T", nguoiVanChuyen: "Trần Văn Bình" },
  { id: "GH-005", maGH: "GH-2026-005", ngayGiao: "2026-08-10", donHang: "DH-2026-002", khachHang: "Shop Thời Trang Sài Gòn", sdt: "0987654321", diaChi: "Quận 1, TP.HCM", soLuong: 300, trangThai: "Chờ giao", phuongTien: "Xe tải 1.5T" },
];

type StoreContext = {
  giaoHang: GiaoHang[];
  themLoGiao: (g: Omit<GiaoHang, "id">, user: AppUser | null) => GiaoHang;
  suaLoGiao: (id: string, patch: Partial<GiaoHang>, user: AppUser | null) => void;
  xoaLoGiao: (id: string, user: AppUser | null) => void;
  capNhatTrangThai: (id: string, status: TrangThaiGH, user: AppUser | null) => void;
  reset: () => void;
};

const Ctx = createContext<StoreContext | null>(null);

function loadData(): GiaoHang[] {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as GiaoHang[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT;
}

function saveData(d: GiaoHang[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  } catch {}
}

export function GiaoHangProvider({ children }: { children: ReactNode }) {
  const [giaoHang, setGiaoHang] = useState<GiaoHang[]>(DEFAULT);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setGiaoHang(loadData());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveData(giaoHang);
  }, [giaoHang, hydrated]);

  const themLoGiao = useCallback((g: Omit<GiaoHang, "id">, user: AppUser | null): GiaoHang => {
    const newGH: GiaoHang = {
      ...g,
      id: `GH-${Date.now().toString().slice(-6)}`,
      ngayTao: new Date().toISOString().split("T")[0],
      nguoiTao: user?.id || user?.name,
    };
    setGiaoHang((prev) => [newGH, ...prev]);
    logWorkflow(user, "create", g.maGH, newGH.id);
    return newGH;
  }, []);

  const suaLoGiao = useCallback((id: string, patch: Partial<GiaoHang>, user: AppUser | null) => {
    setGiaoHang((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
    logWorkflow(user, "update", `Giao hàng ${id}`, id, { newValue: patch });
  }, []);

  const xoaLoGiao = useCallback((id: string, user: AppUser | null) => {
    setGiaoHang((prev) => prev.filter((g) => g.id !== id));
    logWorkflow(user, "delete", `Giao hàng ${id}`, id);
  }, []);

  const capNhatTrangThai = useCallback((id: string, status: TrangThaiGH, user: AppUser | null) => {
    setGiaoHang((prev) => prev.map((g) => (g.id === id ? { ...g, trangThai: status } : g)));
    const action = status === "Đã giao" ? "approve" : status === "Trễ" ? "report_issue" : "update";
    logWorkflow(user, action, `Giao hàng ${id}`, id, { newValue: { trangThai: status } });
  }, []);

  const reset = useCallback(() => {
    setGiaoHang(DEFAULT);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  return (
    <Ctx.Provider
      value={{ giaoHang, themLoGiao, suaLoGiao, xoaLoGiao, capNhatTrangThai, reset }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useGiaoHang() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGiaoHang must be used within GiaoHangProvider");
  return ctx;
}
