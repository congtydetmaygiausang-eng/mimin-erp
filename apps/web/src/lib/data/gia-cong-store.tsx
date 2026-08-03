"use client";

// ============ GIA CÔNG STORE (Đợt 2 - Bộ 5 Người gia công) ============
// Lưu localStorage các thao tác của người gia công:
// - Cập nhật sản lượng (soLuongDat, soLuongLoi)
// - Nhận việc / Bắt đầu làm
// - Bàn giao (ghi soLuongNhan, ngayNhan, nguoiXacNhan)
// - Báo lỗi / Yêu cầu hỗ trợ
// - Sản lượng & Tiền công snapshot

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { ALL_REAL_PHIEU } from "../real-workflow-data";
import type { PhieuWorkflow } from "../workflow-data";
import { logWorkflow } from "../audit-log";
import type { AppUser } from "@/components/session-provider";
import { supabaseUpsert, supabaseDelete, isSupabaseEnabled } from "@/lib/supabase/client";

// ============ TYPES ============

export type WorkflowStatus = PhieuWorkflow["trangThai"];

export type SanLuongUpdate = {
  id: string;            // Mã update: "SL-{taskId}-{ts}"
  taskId: string;        // PhieuWorkflow.id
  ngay: string;          // YYYY-MM-DD
  soLuongDat: number;    // SL đạt trong lần update này
  soLuongLoi: number;    // SL lỗi
  soLuongThieu: number;   // SL thiếu (nếu có)
  ghiChu?: string;
  nguoiUpdate: string;   // user.id
  ts: number;             // timestamp
};

export type BanGiaoRecord = {
  id: string;            // Mã BG
  taskId: string;        // PhieuWorkflow.id
  ngayBanGiao: string;   // YYYY-MM-DD
  soLuongBanGiao: number; // SL bàn giao
  nguoiBanGiao: string;  // user.id
  nguoiNhan?: string;    // Mã NV người nhận (optional)
  ghiChu?: string;
  ts: number;
};

export type LoiReport = {
  id: string;
  taskId: string;
  ngay: string;
  loai: "loi-san-pham" | "thieu-hang" | "hong-vai" | "khac";
  soLuong: number;
  moTa: string;
  hinhAnh?: string;     // URL (optional, chưa upload thật)
  nguoiBao: string;     // user.id
  ts: number;
};

export type RequestSupport = {
  id: string;
  taskId: string;
  ngay: string;
  loai: "ho-tro-ky-thuat" | "ho-tro-vat-tu" | "ho-tro-cong-cu" | "khac";
  moTa: string;
  nguoiYeuCau: string;  // user.id
  trangThai: "moi" | "dang-xu-ly" | "da-xong";
  ts: number;
};

// ============ STORE ============

type StoreContext = {
  // Cập nhật trạng thái phiếu
  taskStates: Record<string, Partial<PhieuWorkflow>>; // taskId → state overrides

  // Lịch sử
  sanLuongUpdates: SanLuongUpdate[];
  banGiaoRecords: BanGiaoRecord[];
  loiReports: LoiReport[];
  supportRequests: RequestSupport[];

  // Actions
  nhanViec: (taskId: string, user: AppUser | null) => void;
  batDauLam: (taskId: string, user: AppUser | null) => void;
  capNhatSanLuong: (taskId: string, data: { soLuongDat: number; soLuongLoi: number; soLuongThieu?: number; ghiChu?: string }, user: AppUser | null) => void;
  banGiao: (taskId: string, data: { soLuongBanGiao: number; nguoiNhan?: string; ghiChu?: string }, user: AppUser | null) => void;
  baoLoi: (taskId: string, data: { loai: LoiReport["loai"]; soLuong: number; moTa: string }, user: AppUser | null) => void;
  yeuCauHoTro: (taskId: string, data: { loai: RequestSupport["loai"]; moTa: string }, user: AppUser | null) => void;

  // Getters
  getTaskState: (taskId: string) => Partial<PhieuWorkflow>;
  getEffectiveTask: (taskId: string) => PhieuWorkflow | undefined;
  reset: () => void;
};

const Ctx = createContext<StoreContext | null>(null);
const STORAGE_KEY = "mimin_gia_cong_v1";

type StoredData = {
  taskStates: Record<string, Partial<PhieuWorkflow>>;
  sanLuongUpdates: SanLuongUpdate[];
  banGiaoRecords: BanGiaoRecord[];
  loiReports: LoiReport[];
  supportRequests: RequestSupport[];
};

const DEFAULT: StoredData = {
  taskStates: {},
  sanLuongUpdates: [],
  banGiaoRecords: [],
  loiReports: [],
  supportRequests: [],
};

function loadData(): StoredData {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT, ...parsed };
    }
  } catch {}
  return DEFAULT;
}

function saveData(d: StoredData) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  } catch {}
}

export function GiaCongProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<StoredData>(DEFAULT);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setData(loadData());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveData(data);
  }, [data, hydrated]);

  const nhanViec = useCallback((taskId: string, user: AppUser | null) => {
    setData((d) => ({
      ...d,
      taskStates: {
        ...d.taskStates,
        [taskId]: { ...d.taskStates[taskId], trangThai: "Đang làm", ngayNhan: new Date().toISOString().split("T")[0] },
      },
    }));
    logWorkflow(user, "receive", taskId, taskId);
  }, []);

  const batDauLam = useCallback((taskId: string, user: AppUser | null) => {
    setData((d) => ({
      ...d,
      taskStates: {
        ...d.taskStates,
        [taskId]: { ...d.taskStates[taskId], trangThai: "Đang làm" },
      },
    }));
    logWorkflow(user, "start", taskId, taskId);
  }, []);

  const capNhatSanLuong = useCallback(
    (taskId: string, sl: { soLuongDat: number; soLuongLoi: number; soLuongThieu?: number; ghiChu?: string }, user: AppUser | null) => {
      const ts = Date.now();
      const id = `SL-${taskId}-${ts}`;
      setData((d) => {
        // Tính tổng SL đạt/lỗi từ các update trước
        const oldUpdates = d.sanLuongUpdates.filter((u) => u.taskId === taskId);
        const totalDat = oldUpdates.reduce((s, u) => s + u.soLuongDat, 0) + sl.soLuongDat;
        const totalLoi = oldUpdates.reduce((s, u) => s + u.soLuongLoi, 0) + sl.soLuongLoi;
        const totalThieu = oldUpdates.reduce((s, u) => s + u.soLuongThieu, 0) + (sl.soLuongThieu || 0);
        return {
          ...d,
          sanLuongUpdates: [
            ...d.sanLuongUpdates,
            {
              id, taskId,
              ngay: new Date().toISOString().split("T")[0],
              soLuongDat: sl.soLuongDat,
              soLuongLoi: sl.soLuongLoi,
              soLuongThieu: sl.soLuongThieu || 0,
              ghiChu: sl.ghiChu,
              nguoiUpdate: user?.id || "unknown",
              ts,
            },
          ],
          taskStates: {
            ...d.taskStates,
            [taskId]: {
              ...d.taskStates[taskId],
              soLuongDat: totalDat,
              soLuongLoi: totalLoi,
              soLuongThieu: totalThieu,
            },
          },
        };
      });
      logWorkflow(user, "report_progress", taskId, taskId, {
        newValue: { soLuongDat: sl.soLuongDat, soLuongLoi: sl.soLuongLoi },
      });
    },
    []
  );

  const banGiao = useCallback(
    (taskId: string, bg: { soLuongBanGiao: number; nguoiNhan?: string; ghiChu?: string }, user: AppUser | null) => {
      const ts = Date.now();
      const id = `BG-${taskId}-${ts}`;
      const ngayBanGiao = new Date().toISOString().split("T")[0];
      setData((d) => ({
        ...d,
        banGiaoRecords: [
          ...d.banGiaoRecords,
          {
            id, taskId, ngayBanGiao,
            soLuongBanGiao: bg.soLuongBanGiao,
            nguoiBanGiao: user?.id || "unknown",
            nguoiNhan: bg.nguoiNhan,
            ghiChu: bg.ghiChu,
            ts,
          },
        ],
        taskStates: {
          ...d.taskStates,
          [taskId]: {
            ...d.taskStates[taskId],
            trangThai: "Hoàn thành",
            ngayHoanThanh: ngayBanGiao,
            nguoiXacNhan: bg.nguoiNhan || user?.name,
            soLuongNhan: bg.soLuongBanGiao,
          },
        },
      }));
      logWorkflow(user, "handover", taskId, taskId, {
        newValue: { soLuongBanGiao: bg.soLuongBanGiao, nguoiNhan: bg.nguoiNhan },
      });
    },
    []
  );

  const baoLoi = useCallback(
    (taskId: string, data: { loai: LoiReport["loai"]; soLuong: number; moTa: string }, user: AppUser | null) => {
      const ts = Date.now();
      const id = `LOI-${taskId}-${ts}`;
      setData((d) => ({
        ...d,
        loiReports: [
          ...d.loiReports,
          {
            id, taskId,
            ngay: new Date().toISOString().split("T")[0],
            loai: data.loai,
            soLuong: data.soLuong,
            moTa: data.moTa,
            nguoiBao: user?.id || "unknown",
            ts,
          },
        ],
      }));
      logWorkflow(user, "report_issue", taskId, taskId, {
        newValue: { loai: data.loai, soLuong: data.soLuong, moTa: data.moTa },
      });
    },
    []
  );

  const yeuCauHoTro = useCallback(
    (taskId: string, yc: { loai: RequestSupport["loai"]; moTa: string }, user: AppUser | null) => {
      const ts = Date.now();
      const id = `YC-${taskId}-${ts}`;
      setData((d) => ({
        ...d,
        supportRequests: [
          ...d.supportRequests,
          {
            id, taskId,
            ngay: new Date().toISOString().split("T")[0],
            loai: yc.loai,
            moTa: yc.moTa,
            nguoiYeuCau: user?.id || "unknown",
            trangThai: "moi",
            ts,
          },
        ],
      }));
      logWorkflow(user, "request_support", taskId, taskId, {
        newValue: { loai: yc.loai, moTa: yc.moTa },
      });
    },
    []
  );

  const getTaskState = useCallback(
    (taskId: string) => data.taskStates[taskId] || {},
    [data.taskStates]
  );

  const getEffectiveTask = useCallback(
    (taskId: string): PhieuWorkflow | undefined => {
      const original = ALL_REAL_PHIEU.find((p) => p.id === taskId);
      if (!original) return undefined;
      return { ...original, ...data.taskStates[taskId] };
    },
    [data.taskStates]
  );

  const reset = useCallback(() => {
    setData(DEFAULT);
  }, []);

  return (
    <Ctx.Provider
      value={{
        taskStates: data.taskStates,
        sanLuongUpdates: data.sanLuongUpdates,
        banGiaoRecords: data.banGiaoRecords,
        loiReports: data.loiReports,
        supportRequests: data.supportRequests,
        nhanViec, batDauLam, capNhatSanLuong, banGiao, baoLoi, yeuCauHoTro,
        getTaskState, getEffectiveTask, reset,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useGiaCong() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGiaCong must be used within GiaCongProvider");
  return ctx;
}
