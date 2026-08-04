"use client";

// ============ ĐỐI SOÁT STORE (Đợt 5 - Bộ 3 Kế toán) ============
// Lưu localStorage `mimin_doi_soat_v1` - trạng thái đối soát tiền công
// 7 trạng thái: Chưa đối soát → Chờ NV xác nhận → Đã xác nhận → Chờ thanh toán
//              → Đã thanh toán 1 phần → Đã thanh toán → Có khiếu nại
//
// Điều kiện tính tiền công (4 bước):
// 1. NV đã bàn giao (trangThai: "Hoàn thành" trong workflow)
// 2. Công đoạn sau xác nhận SL nhận
// 3. QC/Kiểm xác nhận SL đạt
// 4. QLSX duyệt đối soát (action approve trong BangDieuHanhActions)
//
// Workflow chính:
// - NV giao → Trạng thái "Chưa đối soát"
// - KT nhận đối soát → "Chờ NV xác nhận"
// - NV xác nhận → "Đã xác nhận"
// - KT lên lịch thanh toán → "Chờ thanh toán"
// - KT thanh toán 1 phần → "Đã thanh toán 1 phần"
// - KT thanh toán đủ → "Đã thanh toán"
// - NV khiếu nại → "Có khiếu nại"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { logWorkflow } from "../audit-log";
import type { AppUser } from "@/components/session-provider";
import { ALL_REAL_PHIEU } from "../real-workflow-data";
import type { PhieuWorkflow } from "../workflow-data";
import { supabaseUpsert, supabaseDelete, isSupabaseEnabled } from "@/lib/supabase/client";

export type TrangThaiDoiSoat =
  | "Chưa đối soát"      // NV đã bàn giao, KT chưa nhận
  | "Chờ NV xác nhận"    // KT đã đối soát, gửi NV xác nhận
  | "Đã xác nhận"        // NV xác nhận OK
  | "Chờ thanh toán"     // KT lên lịch TT
  | "Đã thanh toán 1 phần" // Đã trả 1 phần
  | "Đã thanh toán"      // Thanh toán đủ
  | "Có khiếu nại";       // NV khiếu nại

export const TRANG_THAI_DOI_SOAT: TrangThaiDoiSoat[] = [
  "Chưa đối soát",
  "Chờ NV xác nhận",
  "Đã xác nhận",
  "Chờ thanh toán",
  "Đã thanh toán 1 phần",
  "Đã thanh toán",
  "Có khiếu nại",
];

export const TRANG_THAI_STYLE: Record<TrangThaiDoiSoat, { color: string; bg: string }> = {
  "Chưa đối soát": { color: "text-slate-700", bg: "bg-slate-500/15" },
  "Chờ NV xác nhận": { color: "text-sky-700", bg: "bg-sky-500/15" },
  "Đã xác nhận": { color: "text-violet-700", bg: "bg-violet-500/15" },
  "Chờ thanh toán": { color: "text-amber-700", bg: "bg-amber-500/15" },
  "Đã thanh toán 1 phần": { color: "text-orange-700", bg: "bg-orange-500/15" },
  "Đã thanh toán": { color: "text-emerald-700", bg: "bg-emerald-500/15" },
  "Có khiếu nại": { color: "text-rose-700", bg: "bg-rose-500/15" },
};

export type DieuDoan =
  | "Cắt" | "Thêu" | "In" | "May áo" | "May quần"
  | "Khuy nút" | "Ủi" | "Đóng gói";

export type LoiDoiSoat = {
  id: string;
  ngayKhiieuNai: string;
  noiDung: string;
  nguoiKhiieuNai: string;
  trangThai: "moi" | "dang-xu-ly" | "da-giai-quyet";
};

export type BanGhiDoiSoat = {
  id: string;              // "DS-{taskId}"
  taskId: string;          // PhieuWorkflow.id (CAT_001, MAY_001, etc.)
  ngayGiao: string;        // YYYY-MM-DD
  nguoiThucHien: string;   // Tên NV / đối tác
  nguoiThucHienMa: string; // NV001, DT-MAY-011, etc.
  congDoan: string;         // Cắt / May / Ủi / etc.
  maSP: string;
  phanLoai?: string;
  soLuongNhan: number;     // SL NV nhận về
  soLuongDat: number;      // SL đạt yêu cầu
  soLuongLoi: number;      // SL lỗi
  donGia: number;          // đ/sp
  thanhTien: number;       // = soLuongDat * donGia
  khauTru: number;         // Khấu trừ (lỗi, v.v.)
  thucNhan: number;        // = thanhTien - khauTru
  daThanhToan: number;     // Đã trả
  conNo: number;            // = thucNhan - daThanhToan
  trangThai: TrangThaiDoiSoat;
  lichSu: Array<{
    ngay: string;
    trangThaiCu: TrangThaiDoiSoat;
    trangThaiMoi: TrangThaiDoiSoat;
    nguoiThucHien: string;
    ghiChu?: string;
  }>;
  khiieuNai?: LoiDoiSoat;
  ngayTao?: string;
  nguoiTao?: string;
  locked?: boolean;         // Đã khóa - không cho sửa
};

const STORAGE_KEY = "mimin_doi_soat_v1";

/** Convert taskId → bản ghi đối soát ban đầu (status: "Chưa đối soát") */
function taskToDoiSoat(t: PhieuWorkflow): BanGhiDoiSoat {
  // FIX BUG #5: Phân biệt rõ KN_/UI_/DG_ thay vì gộp chung thành "Ủi/Đóng gói"
  //  (qc-store.tsx và hoan-thien-store.tsx đã map đúng từ trước, chỉ doi-soat bị sai)
  const congDoan = t.id.startsWith("CAT_") ? "Cắt"
    : t.id.startsWith("INTD_") ? "Thêu"
    : t.id.startsWith("MAY_") ? (t.phanLoai?.toLowerCase().includes("quần") ? "May quần" : "May áo")
    : t.id.startsWith("KN_") ? "Khuy nút"
    : t.id.startsWith("UI_") ? "Ủi"
    : t.id.startsWith("DG_") ? "Đóng gói"
    : "Cắt";
  return {
    id: `DS-${t.id}`,
    taskId: t.id,
    ngayGiao: t.ngayGiao || t.hanHoanThanh,
    nguoiThucHien: t.tenNguoiNhan,
    nguoiThucHienMa: t.nguoiNhan,
    congDoan,
    maSP: t.maSP,
    phanLoai: t.phanLoai,
    soLuongNhan: t.soLuongGiao,
    soLuongDat: t.soLuongDat,
    soLuongLoi: t.soLuongLoi,
    donGia: t.donGia,
    thanhTien: t.thanhTien,
    khauTru: 0,            // mặc định, KT có thể chỉnh
    thucNhan: t.thanhTien,
    daThanhToan: t.daThanhToan,
    conNo: Math.max(0, t.thanhTien - t.daThanhToan),
    trangThai: t.trangThai === "Hoàn thành" ? "Chưa đối soát" : "Chưa đối soát",
    lichSu: [],
    ngayTao: new Date().toISOString().split("T")[0],
  };
}

function buildDefault(): BanGhiDoiSoat[] {
  // Chỉ lấy phiếu Hoàn thành + Đang làm (có thể đối soát)
  return ALL_REAL_PHIEU.map(taskToDoiSoat);
}

type StoreContext = {
  doiSoat: BanGhiDoiSoat[];
  // Actions
  capNhatTrangThai: (id: string, trangThaiMoi: TrangThaiDoiSoat, user: AppUser | null, ghiChu?: string) => void;
  capNhatThanhToan: (id: string, soTien: number, user: AppUser | null) => void;
  capNhatKhauTru: (id: string, soTien: number, user: AppUser | null) => void;
  themKhiieuNai: (id: string, noiDung: string, user: AppUser | null) => void;
  giaiQuyetKhiieuNai: (id: string, user: AppUser | null) => void;
  khoa: (id: string, user: AppUser | null) => void;
  moKhoa: (id: string, user: AppUser | null) => void;
  reset: () => void;
};

const Ctx = createContext<StoreContext | null>(null);

function loadData(): BanGhiDoiSoat[] {
  if (typeof window === "undefined") return buildDefault();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as BanGhiDoiSoat[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return buildDefault();
}

function saveData(d: BanGhiDoiSoat[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  } catch {}
}

export function DoiSoatProvider({ children }: { children: ReactNode }) {
  const [doiSoat, setDoiSoat] = useState<BanGhiDoiSoat[]>(buildDefault);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setDoiSoat(loadData());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveData(doiSoat);
  }, [doiSoat, hydrated]);

  const capNhatTrangThai = useCallback((id: string, trangThaiMoi: TrangThaiDoiSoat, user: AppUser | null, ghiChu?: string) => {
    let updated: BanGhiDoiSoat | null = null;
    setDoiSoat((prev) => prev.map((d) => {
      if (d.id !== id) return d;
      if (d.locked) return d;
      const lichSuMoi = [...(d.lichSu || []), {
        ngay: new Date().toISOString(),
        trangThaiCu: d.trangThai,
        trangThaiMoi,
        nguoiThucHien: user?.name || user?.id || "unknown",
        ghiChu,
      }];
      updated = { ...d, trangThai: trangThaiMoi, lichSu: lichSuMoi };
      return updated;
    }));
    const action = trangThaiMoi === "Đã thanh toán" ? "payment"
      : trangThaiMoi === "Có khiếu nại" ? "report_issue"
      : trangThaiMoi === "Đã xác nhận" || trangThaiMoi === "Chờ NV xác nhận" ? "confirm"
      : "update";
    logWorkflow(user, action as any, `Đối soát ${id}`, id, { newValue: { trangThaiMoi } });
    if (isSupabaseEnabled && updated) {
      supabaseUpsert("doi_soat", updated as any).catch((err) =>
        console.error("[DoiSoatStore] Supabase upsert error:", err)
      );
    }
  }, []);

  const capNhatThanhToan = useCallback((id: string, soTien: number, user: AppUser | null) => {
    let updated: BanGhiDoiSoat | null = null;
    setDoiSoat((prev) => prev.map((d) => {
      if (d.id !== id) return d;
      if (d.locked) return d;
      const daThanhToanMoi = Math.max(0, Math.min(d.thucNhan, d.daThanhToan + soTien));
      const conNoMoi = d.thucNhan - daThanhToanMoi;
      let trangThaiMoi = d.trangThai;
      if (conNoMoi === 0) trangThaiMoi = "Đã thanh toán";
      else if (daThanhToanMoi > 0) trangThaiMoi = "Đã thanh toán 1 phần";
      updated = { ...d, daThanhToan: daThanhToanMoi, conNo: conNoMoi, trangThai: trangThaiMoi };
      return updated;
    }));
    logWorkflow(user, "payment", `Thanh toán ${id}`, id, { newValue: { soTien } });
    if (isSupabaseEnabled && updated) {
      supabaseUpsert("doi_soat", updated as any).catch((err) =>
        console.error("[DoiSoatStore] Supabase upsert error:", err)
      );
    }
  }, []);

  const capNhatKhauTru = useCallback((id: string, soTien: number, user: AppUser | null) => {
    let updated: BanGhiDoiSoat | null = null;
    setDoiSoat((prev) => prev.map((d) => {
      if (d.id !== id) return d;
      if (d.locked) return d;
      const khauTruMoi = Math.max(0, Math.min(d.thanhTien, soTien));
      const thucNhanMoi = d.thanhTien - khauTruMoi;
      updated = { ...d, khauTru: khauTruMoi, thucNhan: thucNhanMoi, conNo: thucNhanMoi - d.daThanhToan };
      return updated;
    }));
    logWorkflow(user, "update", `Khấu trừ ${id}`, id, { newValue: { khauTru: soTien } });
    if (isSupabaseEnabled && updated) {
      supabaseUpsert("doi_soat", updated as any).catch((err) =>
        console.error("[DoiSoatStore] Supabase upsert error:", err)
      );
    }
  }, []);

  const themKhiieuNai = useCallback((id: string, noiDung: string, user: AppUser | null) => {
    let updated: BanGhiDoiSoat | null = null;
    setDoiSoat((prev) => prev.map((d) => {
      if (d.id !== id) return d;
      if (d.locked) return d;
      // FIX BUG #6: phải thêm entry lichSu để giaiQuyetKhiieuNai lấy đúng trạng thái trước
      // (trước đây thiếu → giaiQuyetKhiieuNai lấy nhầm trạng thái cũ hơn)
      const lichSuMoi = [...(d.lichSu || []), {
        ngay: new Date().toISOString(),
        trangThaiCu: d.trangThai,
        trangThaiMoi: "Có khiếu nại" as TrangThaiDoiSoat,
        nguoiThucHien: user?.name || user?.id || "unknown",
        ghiChu: `Khiếu nại: ${noiDung}`,
      }];
      updated = {
        ...d,
        trangThai: "Có khiếu nại" as TrangThaiDoiSoat,
        lichSu: lichSuMoi,
        khiieuNai: {
          id: `KN-${Date.now()}`,
          ngayKhiieuNai: new Date().toISOString().split("T")[0],
          noiDung,
          nguoiKhiieuNai: user?.name || user?.id || "unknown",
          trangThai: "moi",
        },
      };
      return updated;
    }));
    logWorkflow(user, "report_issue", `Khiếu nại ${id}`, id, { newValue: { noiDung } });
    if (isSupabaseEnabled && updated) {
      supabaseUpsert("doi_soat", updated as any).catch((err) =>
        console.error("[DoiSoatStore] Supabase upsert error:", err)
      );
    }
  }, []);

  const giaiQuyetKhiieuNai = useCallback((id: string, user: AppUser | null) => {
    let updated: BanGhiDoiSoat | null = null;
    setDoiSoat((prev) => prev.map((d) => {
      if (d.id !== id || !d.khiieuNai) return d;
      updated = {
        ...d,
        khiieuNai: { ...d.khiieuNai, trangThai: "da-giai-quyet" },
        // Quay lại trạng thái trước đó (lấy từ lichSu cuối)
        trangThai: d.lichSu?.[d.lichSu.length - 1]?.trangThaiCu || d.trangThai,
      };
      return updated;
    }));
    logWorkflow(user, "approve", `Giải quyết khiếu nại ${id}`, id);
    if (isSupabaseEnabled && updated) {
      supabaseUpsert("doi_soat", updated as any).catch((err) =>
        console.error("[DoiSoatStore] Supabase upsert error:", err)
      );
    }
  }, []);

  const khoa = useCallback((id: string, user: AppUser | null) => {
    let updated: BanGhiDoiSoat | null = null;
    setDoiSoat((prev) => prev.map((d) => {
      if (d.id !== id) return d;
      updated = { ...d, locked: true };
      return updated;
    }));
    logWorkflow(user, "lock", `Khóa đối soát ${id}`, id);
    if (isSupabaseEnabled && updated) {
      supabaseUpsert("doi_soat", updated as any).catch((err) =>
        console.error("[DoiSoatStore] Supabase upsert error:", err)
      );
    }
  }, []);

  const moKhoa = useCallback((id: string, user: AppUser | null) => {
    let updated: BanGhiDoiSoat | null = null;
    setDoiSoat((prev) => prev.map((d) => {
      if (d.id !== id) return d;
      updated = { ...d, locked: false };
      return updated;
    }));
    logWorkflow(user, "update", `Mở khóa ${id}`, id);
    if (isSupabaseEnabled && updated) {
      supabaseUpsert("doi_soat", updated as any).catch((err) =>
        console.error("[DoiSoatStore] Supabase upsert error:", err)
      );
    }
  }, []);

  const reset = useCallback(() => {
    setDoiSoat(buildDefault());
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  return (
    <Ctx.Provider
      value={{
        doiSoat, capNhatTrangThai, capNhatThanhToan, capNhatKhauTru,
        themKhiieuNai, giaiQuyetKhiieuNai, khoa, moKhoa, reset,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useDoiSoat() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDoiSoat must be used within DoiSoatProvider");
  return ctx;
}
