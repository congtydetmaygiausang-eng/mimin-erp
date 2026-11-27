"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { KHO_VAI, KHO_VAT_TU, DOI_TAC, type KhoVai, type KhoVatTu, type DoiTac } from "./real-data";
import type { LenhCat } from "./lenh-cat-store";

export type TrangThaiVatTu = "du_vai" | "thieu_vai" | "cho_nhap";
export type TrangThaiBo = "du_bo" | "thieu_bo" | "cho_det";
export type BuocTienTrinh = "chuan_bi" | "cat" | "in_theu" | "may" | "qc_hoan_thien" | "hoan_thanh";

export interface ThongTinDieuPhoi {
  lenhCatId: string;
  // Vải
  maVai?: string;
  tenVai?: string;
  mauVai?: string;
  trangThaiVai: TrangThaiVatTu;
  soKgVaiCan?: number;
  soKgVaiCo?: number;
  ghiChuVai?: string;
  // Bo
  maBo?: string;
  tenBo?: string;
  mauBo?: string;
  trangThaiBo: TrangThaiBo;
  soBoCan?: number;
  soBoCo?: number;
  ghiChuBo?: string;
  // Gia công
  maXuongMay?: string;
  tenXuongMay?: string;
  sdtXuongMay?: string;
  maXuongInTheu?: string;
  tenXuongInTheu?: string;
  sdtXuongInTheu?: string;
  // Tiến trình
  buocHienTai: BuocTienTrinh;
  ghiChuDieuPhoi?: string;
  ngayGiaoXuong?: string;
  hanHoanThanh?: string;
  capNhatLuc?: string;
  nguoiCapNhat?: string;
}

const STORAGE_KEY = "mimin_dieu_phoi_khsx_v1";

export function useDieuPhoiKHSX() {
  const [dieuPhoiMap, setDieuPhoiMap] = useState<Record<string, ThongTinDieuPhoi>>({});
  const [mounted, setMounted] = useState(false);

  // Khởi tạo từ localStorage
  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          setDieuPhoiMap(parsed);
        }
      }
    } catch {
      // Bỏ qua lỗi parse
    }
  }, []);

  // Lưu vào localStorage
  const saveMap = useCallback((newMap: Record<string, ThongTinDieuPhoi>) => {
    setDieuPhoiMap(newMap);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newMap));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("mimin_dieu_phoi_updated"));
      }
    } catch {}
  }, []);

  // Lấy hoặc tạo thông tin điều phối mặc định cho 1 lệnh cắt
  const getDieuPhoi = useCallback(
    (lc: LenhCat): ThongTinDieuPhoi => {
      const existing = dieuPhoiMap[lc.id];
      if (existing) return existing;

      // Trích xuất mặc định từ thông tin có sẵn trong lệnh cắt
      const firstMau = lc.dsMau?.[0];
      const defaultMaVai = firstMau?.maVai || "";
      const defaultVai = KHO_VAI.find((v) => v.maVT === defaultMaVai || v.tenVT.includes(firstMau?.ten || ""));
      const defaultBo = KHO_VAT_TU.find((b) => b.loai === "Bo cổ" && (b.mauSac?.includes(firstMau?.ten || "") || b.tenVT.includes(firstMau?.ten || "")));

      // Tìm xưởng may đã gán trong công đoạn phanCong nếu có
      const mayStage = (lc.phanCong || []).find((cd) => cd.id.toLowerCase().includes("may") || cd.tenCongDoan.toLowerCase().includes("may"));
      const inStage = (lc.phanCong || []).find((cd) => cd.id.toLowerCase().includes("in") || cd.tenCongDoan.toLowerCase().includes("in") || cd.tenCongDoan.toLowerCase().includes("thêu"));

      const defaultItem: ThongTinDieuPhoi = {
        lenhCatId: lc.id,
        maVai: defaultMaVai || defaultVai?.maVT || "",
        tenVai: defaultVai?.tenVT || (firstMau ? `Vải ${firstMau.ten}` : ""),
        mauVai: firstMau?.ten || "",
        trangThaiVai: defaultVai ? "du_vai" : "thieu_vai",
        maBo: defaultBo?.maVT || "",
        tenBo: defaultBo?.tenVT || (firstMau ? `Bo cổ ${firstMau.ten}` : ""),
        mauBo: firstMau?.ten || "",
        trangThaiBo: defaultBo && defaultBo.tonKho > 0 ? "du_bo" : "thieu_bo",
        maXuongMay: mayStage?.nguoiMa || "",
        tenXuongMay: mayStage?.nguoiTen || "",
        maXuongInTheu: inStage?.nguoiMa || "",
        tenXuongInTheu: inStage?.nguoiTen || "",
        buocHienTai: lc.trangThai === "HoanThanh" ? "hoan_thanh" : lc.trangThai === "DangCat" ? "cat" : "chuan_bi",
        hanHoanThanh: lc.hanHoanThanh,
        capNhatLuc: new Date().toISOString(),
      };

      return defaultItem;
    },
    [dieuPhoiMap]
  );

  // Cập nhật điều phối cho 1 lệnh cắt
  const capNhatDieuPhoi = useCallback(
    (lenhCatId: string, patch: Partial<ThongTinDieuPhoi>, nguoiThucHien?: string) => {
      setDieuPhoiMap((prev) => {
        const current = prev[lenhCatId] || {
          lenhCatId,
          trangThaiVai: "thieu_vai",
          trangThaiBo: "thieu_bo",
          buocHienTai: "chuan_bi",
        };
        const updated: ThongTinDieuPhoi = {
          ...current,
          ...patch,
          capNhatLuc: new Date().toISOString(),
          nguoiCapNhat: nguoiThucHien || "Hồ Minh Sang",
        };
        const nextMap = { ...prev, [lenhCatId]: updated };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(nextMap));
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("mimin_dieu_phoi_updated"));
          }
        } catch {}
        return nextMap;
      });
    },
    []
  );

  // 1-Click Toggle: Đã đủ bo / Thiếu bo
  const toggleDuBo = useCallback(
    (lenhCatId: string, currentStatus?: TrangThaiBo) => {
      const isCurrentlyDu = currentStatus === "du_bo" || dieuPhoiMap[lenhCatId]?.trangThaiBo === "du_bo";
      const nextStatus: TrangThaiBo = isCurrentlyDu ? "thieu_bo" : "du_bo";
      capNhatDieuPhoi(lenhCatId, { trangThaiBo: nextStatus });
      if (nextStatus === "du_bo") {
        toast.success(`Đã cập nhật lệnh ${lenhCatId}: ĐÃ ĐỦ BO CỔ SẴN SÀNG!`);
      } else {
        toast.info(`Đã chuyển lệnh ${lenhCatId} sang trạng thái: THIẾU BO`);
      }
    },
    [capNhatDieuPhoi, dieuPhoiMap]
  );

  // 1-Click Toggle: Đã đủ vải / Thiếu vải
  const toggleDuVai = useCallback(
    (lenhCatId: string, currentStatus?: TrangThaiVatTu) => {
      const isCurrentlyDu = currentStatus === "du_vai" || dieuPhoiMap[lenhCatId]?.trangThaiVai === "du_vai";
      const nextStatus: TrangThaiVatTu = isCurrentlyDu ? "thieu_vai" : "du_vai";
      capNhatDieuPhoi(lenhCatId, { trangThaiVai: nextStatus });
      if (nextStatus === "du_vai") {
        toast.success(`Đã cập nhật lệnh ${lenhCatId}: ĐÃ ĐỦ VẢI TỪ KHO!`);
      } else {
        toast.info(`Đã chuyển lệnh ${lenhCatId} sang trạng thái: THIẾU VẢI`);
      }
    },
    [capNhatDieuPhoi, dieuPhoiMap]
  );

  return {
    dieuPhoiMap,
    mounted,
    getDieuPhoi,
    capNhatDieuPhoi,
    toggleDuBo,
    toggleDuVai,
  };
}
