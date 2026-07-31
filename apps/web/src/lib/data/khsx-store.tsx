"use client";

// ============ KHSX STORE (Đợt 4 - Kế hoạch sản xuất) ============
// Lưu localStorage `mimin_khsx_v1` thay const KHSX_DATA mẫu
// CRUD: themKHSX, suaKHSX, xoaKHSX, capNhatTienDo
// Workflow: Lên kế hoạch → Đang SX → Hoàn thành (auto-detect Trễ hạn từ deadline)

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { logWorkflow } from "../audit-log";
import type { AppUser } from "@/components/session-provider";

export type TrangThaiKHSX = "Lên kế hoạch" | "Đang SX" | "Hoàn thành" | "Trễ hạn";

export type KHSX = {
  id: string;
  maKHSX: string;
  tuan: string;
  tuNgay: string;
  denNgay: string;
  sanPham: string;
  loai: "Áo" | "Bộ";
  soLuong: number;
  daHoanThanh: number;
  xuongPhuTrach: string;
  trangThai: TrangThaiKHSX;
  ghiChu?: string;
  ngayTao?: string;
  nguoiTao?: string;
};

const STORAGE_KEY = "mimin_khsx_v1";

// Default data (chỉ dùng lần đầu khi localStorage rỗng)
const DEFAULT: KHSX[] = [
  { id: "KHSX-001", maKHSX: "KHSX-2026-W28", tuan: "Tuần 28 (07-13/07)", tuNgay: "2026-07-07", denNgay: "2026-07-13", sanPham: "Bộ trụ trơn M758", loai: "Bộ", soLuong: 500, daHoanThanh: 500, xuongPhuTrach: "Tổ cắt + May áo Liễu + May quần Hương", trangThai: "Hoàn thành" },
  { id: "KHSX-002", maKHSX: "KHSX-2026-W29", tuan: "Tuần 29 (14-20/07)", tuNgay: "2026-07-14", denNgay: "2026-07-20", sanPham: "Áo trụ M873", loai: "Áo", soLuong: 546, daHoanThanh: 546, xuongPhuTrach: "Tổ cắt + In Bảo Ngân + May trụ Cúc", trangThai: "Hoàn thành" },
  { id: "KHSX-003", maKHSX: "KHSX-2026-W30", tuan: "Tuần 30 (21-27/07)", tuNgay: "2026-07-21", denNgay: "2026-07-27", sanPham: "Bộ Polo cao cấp (M775)", loai: "Bộ", soLuong: 400, daHoanThanh: 180, xuongPhuTrach: "Xưởng may Hưng + Thêu Hạnh", trangThai: "Đang SX", ghiChu: "Đã hoàn thành 45% kế hoạch" },
  { id: "KHSX-004", maKHSX: "KHSX-2026-W31", tuan: "Tuần 31 (28/07-03/08)", tuNgay: "2026-07-28", denNgay: "2026-08-03", sanPham: "Áo sơ mi công sở (M790)", loai: "Áo", soLuong: 800, daHoanThanh: 0, xuongPhuTrach: "Tổ cắt + May Minh Tâm", trangThai: "Lên kế hoạch" },
  { id: "KHSX-005", maKHSX: "KHSX-2026-W32", tuan: "Tuần 32 (04-10/08)", tuNgay: "2026-08-04", denNgay: "2026-08-10", sanPham: "Bộ đồng phục HS", loai: "Bộ", soLuong: 600, daHoanThanh: 0, xuongPhuTrach: "May Hoàng Long + Thêu Hạnh", trangThai: "Lên kế hoạch" },
];

type StoreContext = {
  khsx: KHSX[];
  themKHSX: (k: Omit<KHSX, "id">, user: AppUser | null) => KHSX;
  suaKHSX: (id: string, patch: Partial<KHSX>, user: AppUser | null) => void;
  xoaKHSX: (id: string, user: AppUser | null) => void;
  capNhatTienDo: (id: string, soLuongHT: number, user: AppUser | null) => void;
  batDauSX: (id: string, user: AppUser | null) => void;
  hoanThanh: (id: string, user: AppUser | null) => void;
  reset: () => void;
};

const Ctx = createContext<StoreContext | null>(null);

function loadData(): KHSX[] {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as KHSX[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT;
}

function saveData(d: KHSX[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  } catch {}
}

export function KHSXProvider({ children }: { children: ReactNode }) {
  const [khsx, setKHSX] = useState<KHSX[]>(DEFAULT);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setKHSX(loadData());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveData(khsx);
  }, [khsx, hydrated]);

  const themKHSX = useCallback((k: Omit<KHSX, "id">, user: AppUser | null): KHSX => {
    const newKHSX: KHSX = {
      ...k,
      id: `KHSX-${Date.now().toString().slice(-6)}`,
      ngayTao: new Date().toISOString().split("T")[0],
      nguoiTao: user?.id || user?.name,
    };
    setKHSX((prev) => [newKHSX, ...prev]);
    logWorkflow(user, "create", k.maKHSX, newKHSX.id);
    return newKHSX;
  }, []);

  const suaKHSX = useCallback((id: string, patch: Partial<KHSX>, user: AppUser | null) => {
    setKHSX((prev) => prev.map((k) => (k.id === id ? { ...k, ...patch } : k)));
    logWorkflow(user, "update", `KHSX ${id}`, id, { newValue: patch });
  }, []);

  const xoaKHSX = useCallback((id: string, user: AppUser | null) => {
    setKHSX((prev) => prev.filter((k) => k.id !== id));
    logWorkflow(user, "delete", `KHSX ${id}`, id);
  }, []);

  const capNhatTienDo = useCallback((id: string, soLuongHT: number, user: AppUser | null) => {
    setKHSX((prev) =>
      prev.map((k) => {
        if (k.id !== id) return k;
        const daHT = Math.min(soLuongHT, k.soLuong);
        // Auto update trạng thái
        let trangThai: TrangThaiKHSX = k.trangThai;
        if (daHT >= k.soLuong) trangThai = "Hoàn thành";
        else if (daHT > 0 && k.trangThai === "Lên kế hoạch") trangThai = "Đang SX";
        // Auto detect trễ hạn
        if (trangThai !== "Hoàn thành") {
          const today = new Date();
          if (new Date(k.denNgay) < today) trangThai = "Trễ hạn";
        }
        return { ...k, daHoanThanh: daHT, trangThai };
      })
    );
    logWorkflow(user, "update", `KHSX ${id}`, id, { newValue: { soLuongHT } });
  }, []);

  const batDauSX = useCallback((id: string, user: AppUser | null) => {
    setKHSX((prev) => prev.map((k) => (k.id === id ? { ...k, trangThai: "Đang SX" } : k)));
    logWorkflow(user, "start", `KHSX ${id}`, id);
  }, []);

  const hoanThanh = useCallback((id: string, user: AppUser | null) => {
    setKHSX((prev) =>
      prev.map((k) => (k.id === id ? { ...k, trangThai: "Hoàn thành", daHoanThanh: k.soLuong } : k))
    );
    logWorkflow(user, "approve", `KHSX ${id}`, id);
  }, []);

  const reset = useCallback(() => {
    setKHSX(DEFAULT);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  return (
    <Ctx.Provider
      value={{ khsx, themKHSX, suaKHSX, xoaKHSX, capNhatTienDo, batDauSX, hoanThanh, reset }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useKHSX() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useKHSX must be used within KHSXProvider");
  return ctx;
}
