"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { PHAN_CONG as PHAN_CONG_DEFAULT, type PhanCongCongDoan, type CongDoanKey, type NguoiPhuTrach } from "./cong-no";
import { layDanhSachNguoiPT } from "./cong-no";
import { supabaseUpsert, supabaseDelete, isSupabaseEnabled } from "@/lib/supabase/client";

// ============ STORE CONTEXT ============
type StoreContext = {
  phanCong: PhanCongCongDoan[];
  themThanhToan: (id: string, soTien: number, ghiChu?: string) => void;
  themPhanCong: (pc: Omit<PhanCongCongDoan, "id">) => void;
  capNhatPhanCong: (id: string, patch: Partial<PhanCongCongDoan>) => void;
  xoaPhanCong: (id: string) => void;
  reset: () => void;
  layTheoLenh: (lenhCatId: string) => PhanCongCongDoan[];
  isLate: (pc: PhanCongCongDoan) => boolean;
};

const Ctx = createContext<StoreContext | null>(null);

const STORAGE_KEY = "mimin_phan_cong_v1";

export function PhanCongProvider({ children }: { children: ReactNode }) {
  const [phanCong, setPhanCong] = useState<PhanCongCongDoan[]>(PHAN_CONG_DEFAULT);
  const [hydrated, setHydrated] = useState(false);

  // Load từ localStorage khi mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PhanCongCongDoan[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPhanCong(parsed);
        }
      }
    } catch (e) {
      console.warn("Failed to load phanCong from localStorage", e);
    }
    setHydrated(true);
  }, []);

  // Save khi state thay đổi
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(phanCong));
    } catch (e) {
      console.warn("Failed to save phanCong", e);
    }
  }, [phanCong, hydrated]);

  const themThanhToan = useCallback((id: string, soTien: number, ghiChu?: string) => {
    let updated: PhanCongCongDoan | null = null;
    setPhanCong((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const newDaTT = p.daThanhToan + soTien;
        const thanhTien = p.donGiaGiao * p.soLuongGiao;
        const newTrangThai = newDaTT >= thanhTien ? "Đã thanh toán" : p.trangThai;
        updated = {
          ...p,
          daThanhToan: newDaTT,
          trangThai: newTrangThai,
          ghiChu: ghiChu ? `${p.ghiChu ? p.ghiChu + " | " : ""}${new Date().toLocaleDateString("vi-VN")}: +${soTien.toLocaleString()}đ ${ghiChu}` : p.ghiChu,
        };
        return updated;
      })
    );
    if (isSupabaseEnabled && updated) {
      supabaseUpsert("phan_cong", updated as any).catch((err) =>
        console.error("[PhanCongStore] Supabase upsert error:", err)
      );
    }
  }, []);

  const themPhanCong = useCallback((pc: Omit<PhanCongCongDoan, "id">) => {
    let newRow: PhanCongCongDoan | null = null;
    setPhanCong((prev) => {
      const nextNum = prev.length + 1;
      const newId = `PC-${pc.lenhCatId.replace("LC-", "")}-${String(nextNum).padStart(2, "0")}`;
      newRow = { ...pc, id: newId };
      return [...prev, newRow];
    });
    if (isSupabaseEnabled && newRow) {
      supabaseUpsert("phan_cong", newRow as any).catch((err) =>
        console.error("[PhanCongStore] Supabase upsert error:", err)
      );
    }
  }, []);

  const capNhatPhanCong = useCallback((id: string, patch: Partial<PhanCongCongDoan>) => {
    let updated: PhanCongCongDoan | null = null;
    setPhanCong((prev) => prev.map((p) => {
      if (p.id === id) {
        updated = { ...p, ...patch };
        return updated;
      }
      return p;
    }));
    if (isSupabaseEnabled && updated) {
      supabaseUpsert("phan_cong", updated as any).catch((err) =>
        console.error("[PhanCongStore] Supabase upsert error:", err)
      );
    }
  }, []);

  const xoaPhanCong = useCallback((id: string) => {
    setPhanCong((prev) => prev.filter((p) => p.id !== id));
    if (isSupabaseEnabled) {
      supabaseDelete("phan_cong", id).catch((err) =>
        console.error("[PhanCongStore] Supabase delete error:", err)
      );
    }
  }, []);

  const reset = useCallback(() => {
    setPhanCong(PHAN_CONG_DEFAULT);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  const layTheoLenh = useCallback(
    (lenhCatId: string) => phanCong.filter((p) => p.lenhCatId === lenhCatId),
    [phanCong]
  );

  const isLate = useCallback((pc: PhanCongCongDoan) => {
    if (pc.trangThai === "Đã thanh toán" || pc.trangThai === "Hoàn thành") return false;
    const today = new Date().toISOString().split("T")[0];
    return pc.ngayXongDuKien < today;
  }, []);

  return (
    <Ctx.Provider
      value={{ phanCong, themThanhToan, themPhanCong, capNhatPhanCong, xoaPhanCong, reset, layTheoLenh, isLate }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function usePhanCong() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePhanCong must be used within PhanCongProvider");
  return ctx;
}

// ============ EXPORT EXCEL HELPER ============
// Tạo file Excel từ array of objects, dùng CSV với BOM để Excel mở đúng UTF-8
export function exportCongNoExcel(phanCong: PhanCongCongDoan[], tenFile: string = "CongNoCongDoan") {
  const header = [
    "Mã PC",
    "Lệnh cắt",
    "Công đoạn",
    "Người PT",
    "Loại",
    "SĐT",
    "Số lượng",
    "Đơn vị",
    "Đơn giá",
    "Thành tiền",
    "Đã TT",
    "Còn nợ",
    "Trạng thái",
    "Ngày giao",
    "Ngày xong DK",
    "Ghi chú",
  ];
  const rows = phanCong.map((p) => {
    const tt = p.donGiaGiao * p.soLuongGiao;
    return [
      p.id,
      p.lenhCatId,
      p.congDoan,
      p.nguoiPhuTrach.ten,
      p.nguoiPhuTrach.loai,
      p.nguoiPhuTrach.sdt || "",
      p.soLuongGiao,
      p.donVi,
      p.donGiaGiao,
      tt,
      p.daThanhToan,
      tt - p.daThanhToan,
      p.trangThai,
      p.ngayGiao,
      p.ngayXongDuKien,
      p.ghiChu || "",
    ];
  });
  const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  // BOM để Excel nhận UTF-8
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${tenFile}_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Re-export cho tiện
export { layDanhSachNguoiPT };
export type { PhanCongCongDoan, CongDoanKey, NguoiPhuTrach };
