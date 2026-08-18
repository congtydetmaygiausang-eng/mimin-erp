"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { KHO_VAI as KHO_VAI_DEFAULT, KHO_VAT_TU as KHO_VAT_TU_DEFAULT, type KhoVai } from "./real-data";
import { supabase, supabaseUpsert, supabaseDelete, isSupabaseEnabled } from "@/lib/supabase/client";

// ============ TYPES ============
export type LoaiKho = "vai" | "phu-lieu";

export type GiaoDichKho = {
  id: string;
  ngay: string;              // YYYY-MM-DD
  loai: "NHAP" | "XUAT";
  maVT: string;              // Mã vải/VT
  tenVT: string;
  soLuong: number;           // Số lượng giao dịch
  donVi: string;             // kg, m, cái, cuộn...
  donGia: number;            // đơn giá (cho nhập)
  thanhTien: number;         // Tổng tiền
  nguonNhap?: string;        // NCC cho nhập, lệnh cắt cho xuất
  nguoiThucHien: string;     // Người thực hiện
  ghiChu?: string;
};

export type TrangThaiKho = {
  maVT: string;
  tonKho: number;            // Tồn hiện tại
  tonToiThieu: number;       // Tồn tối thiểu
  canhBao: boolean;          // Tồn < tối thiểu
  giaTriTon: number;         // Giá trị tồn kho
  lanNhapGanNhat?: string;
  lanXuatGanNhat?: string;
  tongNhap: number;
  tongXuat: number;
};

type StoreContext = {
  giaoDich: GiaoDichKho[];
  themGiaoDich: (gd: Omit<GiaoDichKho, "id">) => void;
  xoaGiaoDich: (id: string) => void;
  tinhTonKho: (maVT: string, loaiKho: LoaiKho) => number;
  trangThaiKho: (maVT: string, loaiKho: LoaiKho) => TrangThaiKho;
  danhSachTrangThai: (loaiKho: LoaiKho) => TrangThaiKho[];
  giaoDichTheoVT: (maVT: string) => GiaoDichKho[];
  reset: () => void;
};

const Ctx = createContext<StoreContext | null>(null);

const STORAGE_KEY = "mimin_kho_vai_v2";

// Map 1 row Supabase (snake_case) -> GiaoDichKho (camelCase app model).
// Không dùng supabaseFetchAll vì nó biến ma_vt -> maVt (sai hoa/thường so với maVT).
function fromSupabaseRow(r: any): GiaoDichKho {
  return {
    id: String(r.id),
    ngay: String(r.ngay || r.created_at || "").slice(0, 10),
    loai: r.loai === "XUAT" ? "XUAT" : "NHAP",
    maVT: r.ma_vt ?? r.maVT ?? "",
    tenVT: r.ten_vt ?? r.tenVT ?? "",
    soLuong: Number(r.so_luong ?? r.soLuong) || 0,
    donVi: r.don_vi ?? r.donVi ?? "",
    donGia: Number(r.don_gia ?? r.donGia) || 0,
    thanhTien: Number(r.thanh_tien ?? r.thanhTien) || 0,
    nguonNhap: r.nguon_nhap ?? r.nguonNhap ?? undefined,
    nguoiThucHien: r.nguoi_thuc_hien ?? r.nguoiThucHien ?? "",
    ghiChu: r.ghi_chu ?? r.ghiChu ?? undefined,
  };
}

// Đã xoá GIAO_DICH_DEFAULT ngày 2026-08-03 (sep Sang muon bat dau nhap moi tu dau)



export function KhoProvider({ children }: { children: ReactNode }) {
  const [giaoDich, setGiaoDich] = useState<GiaoDichKho[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load từ localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as GiaoDichKho[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setGiaoDich(parsed);
        }
      }
    } catch {}
    setHydrated(true);
  }, []);

  // Đọc lại 2 chiều từ Supabase (nguồn chính). Merge: ưu tiên bản ghi Supabase,
  // giữ thêm các giao dịch chỉ có ở local (tạo offline, chưa đồng bộ).
  useEffect(() => {
    if (!isSupabaseEnabled || !supabase) return;
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("giao_dich_kho")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) {
          console.warn("[KhoStore] Supabase fetch error:", error.message);
          return;
        }
        if (!mounted || !data) return;
        const remote = data.map(fromSupabaseRow);
        const remoteIds = new Set(remote.map((g) => g.id));
        setGiaoDich((prev) => {
          const localOnly = prev.filter((g) => !remoteIds.has(g.id));
          const merged = [...remote, ...localOnly];
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          } catch {}
          return merged;
        });
      } catch (err) {
        console.error("[KhoStore] Supabase fetch exception:", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Save
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(giaoDich));
    } catch {}
  }, [giaoDich, hydrated]);

  const themGiaoDich = useCallback((gd: Omit<GiaoDichKho, "id">) => {
    // Sinh id duy nhất KHÔNG dựa vào prev.length: đếm theo length sẽ tạo mã trùng
    // ngay khi có 1 giao dịch bị xoá, hoặc khi 2 giao dịch được ghi liên tiếp
    // trong cùng 1 lần render (VD xuất kho nhiều màu 1 lượt) - upsert theo id
    // sẽ GHI ĐÈ mất giao dịch trước đó.
    const newRow: GiaoDichKho = {
      ...gd,
      id: `GD-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    };
    setGiaoDich((prev) => [...prev, newRow]);
    if (isSupabaseEnabled) {
      supabaseUpsert("giao_dich_kho", newRow).catch((err) =>
        console.error("[KhoStore] Supabase upsert error:", err)
      );
    }
  }, []);

  const xoaGiaoDich = useCallback((id: string) => {
    setGiaoDich((prev) => prev.filter((g) => g.id !== id));
    if (isSupabaseEnabled) {
      supabaseDelete("giao_dich_kho", id).catch((err) =>
        console.error("[KhoStore] Supabase delete error:", err)
      );
    }
  }, []);

  const tinhTonKho = useCallback(
    (maVT: string, loaiKho: LoaiKho): number => {
      const dsVT = loaiKho === "vai" ? KHO_VAI_DEFAULT : KHO_VAT_TU_DEFAULT;
      const baseTon = dsVT.find((v) => v.maVT === maVT)?.tonKho || 0;
      const gdNhap = giaoDich.filter((g) => g.maVT === maVT && g.loai === "NHAP").reduce((s, g) => s + g.soLuong, 0);
      const gdXuat = giaoDich.filter((g) => g.maVT === maVT && g.loai === "XUAT").reduce((s, g) => s + g.soLuong, 0);
      return baseTon + gdNhap - gdXuat;
    },
    [giaoDich]
  );

  const trangThaiKho = useCallback(
    (maVT: string, loaiKho: LoaiKho): TrangThaiKho => {
      const dsVT = loaiKho === "vai" ? KHO_VAI_DEFAULT : KHO_VAT_TU_DEFAULT;
      const vt = dsVT.find((v) => v.maVT === maVT);
      if (!vt) return { maVT, tonKho: 0, tonToiThieu: 0, canhBao: false, giaTriTon: 0, tongNhap: 0, tongXuat: 0 };
      const tonKho = tinhTonKho(maVT, loaiKho);
      const gd = giaoDich.filter((g) => g.maVT === maVT);
      const tongNhap = gd.filter((g) => g.loai === "NHAP").reduce((s, g) => s + g.soLuong, 0);
      const tongXuat = gd.filter((g) => g.loai === "XUAT").reduce((s, g) => s + g.soLuong, 0);
      const lanNhapGanNhat = gd.filter((g) => g.loai === "NHAP").sort((a, b) => b.ngay.localeCompare(a.ngay))[0]?.ngay;
      const lanXuatGanNhat = gd.filter((g) => g.loai === "XUAT").sort((a, b) => b.ngay.localeCompare(a.ngay))[0]?.ngay;
      return {
        maVT,
        tonKho,
        tonToiThieu: vt.tonToiThieu || 0,
        canhBao: tonKho < (vt.tonToiThieu || 0),
        giaTriTon: tonKho * vt.donGia,
        lanNhapGanNhat,
        lanXuatGanNhat,
        tongNhap,
        tongXuat,
      };
    },
    [giaoDich, tinhTonKho]
  );

  const danhSachTrangThai = useCallback(
    (loaiKho: LoaiKho): TrangThaiKho[] => {
      const dsVT = loaiKho === "vai" ? KHO_VAI_DEFAULT : KHO_VAT_TU_DEFAULT;
      return dsVT.map((v) => trangThaiKho(v.maVT, loaiKho));
    },
    [trangThaiKho]
  );

  const giaoDichTheoVT = useCallback(
    (maVT: string): GiaoDichKho[] => {
      return giaoDich.filter((g) => g.maVT === maVT).sort((a, b) => b.ngay.localeCompare(a.ngay));
    },
    [giaoDich]
  );

  const reset = useCallback(() => {
    setGiaoDich([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  return (
    <Ctx.Provider
      value={{ giaoDich, themGiaoDich, xoaGiaoDich, tinhTonKho, trangThaiKho, danhSachTrangThai, giaoDichTheoVT, reset }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useKho() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useKho must be used within KhoProvider");
  return ctx;
}
