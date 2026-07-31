// ============ HELPER CHO BẢNG ĐIỀU HÀNH SX (Đợt 3 - Bộ 2) ============
// Tính toán CĐ hiện tại, người giữ, số ngày giữ, trễ hạn, chi phí tạm tính
// Dùng data thật ALL_REAL_PHIEU (12+ phiếu M758/M873 từ Lark chị Giàu)

import { ALL_REAL_PHIEU } from "./real-workflow-data";
import type { PhieuWorkflow } from "./workflow-data";

// ============ TYPES ============

export type CongDoanKey = "cat" | "intd" | "may" | "khuy-nut" | "ui" | "dong-goi";

export const CONG_DOAN_LABELS: Record<CongDoanKey, string> = {
  cat: "Cắt",
  intd: "In/Thêu/Dập",
  may: "May",
  "khuy-nut": "Khuy nút",
  ui: "Ủi",
  "dong-goi": "Gấp xếp / Đóng gói",
};

export const CONG_DOAN_ORDER: CongDoanKey[] = ["cat", "intd", "may", "khuy-nut", "ui", "dong-goi"];

/** Lấy công đoạn từ prefix ID (CAT_/INTD_/MAY_/KN_/UI_/DG_) */
export function getCongDoanFromId(id: string): CongDoanKey | null {
  if (id.startsWith("CAT_")) return "cat";
  if (id.startsWith("INTD_")) return "intd";
  if (id.startsWith("MAY_")) return "may";
  if (id.startsWith("KN_")) return "khuy-nut";
  if (id.startsWith("UI_")) return "ui";
  if (id.startsWith("DG_")) return "dong-goi";
  return null;
}

/** Lấy trạng thái trễ: true nếu quá hạn mà chưa hoàn thành */
export function isQuaHan(task: PhieuWorkflow): boolean {
  if (task.trangThai === "Hoàn thành") return false;
  if (!task.hanHoanThanh) return false;
  const today = new Date().toISOString().split("T")[0];
  return task.hanHoanThanh < today;
}

/** Tính số ngày đang giữ (từ ngayGiao đến now, hoặc đến ngayHoanThanh) */
export function soNgayDangGiu(task: PhieuWorkflow): number {
  if (!task.ngayGiao) return 0;
  const start = new Date(task.ngayGiao).getTime();
  const end = task.ngayHoanThanh ? new Date(task.ngayHoanThanh).getTime() : Date.now();
  return Math.max(0, Math.floor((end - start) / (1000 * 60 * 60 * 24)));
}

/** Số ngày trễ hạn (dương = trễ, âm = còn) */
export function soNgayTreHan(task: PhieuWorkflow): number {
  if (task.trangThai === "Hoàn thành") return 0;
  if (!task.hanHoanThanh) return 0;
  const today = new Date();
  const han = new Date(task.hanHoanThanh);
  return Math.floor((today.getTime() - han.getTime()) / (1000 * 60 * 60 * 24));
}

/** Chi phí tạm tính cho 1 phiếu (SL đạt × đơn giá) */
export function chiPhiTamTinh(task: PhieuWorkflow): number {
  return task.soLuongDat * task.donGia;
}

// ============ AGGREGATE: Theo LSX ============

export type LSXSummary = {
  lenhSX: string;             // LSX-2026-001
  maSP: string;               // M758
  phanLoai?: string;          // Bộ trụ trơn
  tongPhieu: number;          // Tổng số phiếu
  phieuHoanThanh: number;     // Số phiếu hoàn thành
  phieuDangLam: number;       // Số phiếu đang làm
  phieuChoGiao: number;       // Số phiếu chờ giao
  tongSLGiao: number;         // Tổng SL giao
  tongSLDat: number;          // Tổng SL đạt
  tongSLLoi: number;          // Tổng SL lỗi
  tongChiPhi: number;         // Tổng tiền công
  tienDaThanhToan: number;    // Đã TT
  tienConNo: number;          // Còn nợ
  trangThai: "moi" | "dang-sx" | "hoan-thanh" | "tre-han";
  hanHoanThanh?: string;      // Hạn chung (sớm nhất)
  phanTramDat: number;        // % tiến độ
  congDoanHienTai: string;    // "May → Ủi" (tên các khâu còn open)
  phieu: PhieuWorkflow[];      // Raw data
};

/** Gom tất cả phiếu theo lenhSX → 1 LSX summary */
export function groupByLSX(phieus: PhieuWorkflow[] = ALL_REAL_PHIEU): LSXSummary[] {
  const groups: Record<string, PhieuWorkflow[]> = {};
  for (const p of phieus) {
    if (!groups[p.lenhSX]) groups[p.lenhSX] = [];
    groups[p.lenhSX].push(p);
  }

  const summaries: LSXSummary[] = [];
  for (const [lenhSX, list] of Object.entries(groups)) {
    const first = list[0];
    const hoanThanh = list.filter((p) => p.trangThai === "Hoàn thành");
    const dangLam = list.filter((p) => p.trangThai === "Đang làm" || p.trangThai === "Đang may");
    const choGiao = list.filter((p) => p.trangThai === "Chờ giao" || p.trangThai === "Chờ gấp");

    const tongSLGiao = list.reduce((s, p) => s + p.soLuongGiao, 0);
    const tongSLDat = list.reduce((s, p) => s + p.soLuongDat, 0);
    const tongSLLoi = list.reduce((s, p) => s + p.soLuongLoi, 0);
    const tongChiPhi = list.reduce((s, p) => s + p.thanhTien, 0);
    const tienDaTT = list.reduce((s, p) => s + p.daThanhToan, 0);
    const phanTramDat = tongSLGiao > 0 ? Math.min(100, (tongSLDat / tongSLGiao) * 100) : 0;

    // Hạn chung: lấy sớm nhất trong các phiếu
    const hanList = list.map((p) => p.hanHoanThanh).filter(Boolean).sort();
    const hanChung = hanList[0];

    // Trạng thái: ưu tiên trễ hạn > đang SX > hoàn thành > mới
    let trangThai: LSXSummary["trangThai"] = "moi";
    if (list.every((p) => p.trangThai === "Hoàn thành")) trangThai = "hoan-thanh";
    else if (list.some((p) => isQuaHan(p))) trangThai = "tre-han";
    else if (list.some((p) => p.trangThai !== "Chờ giao" && p.trangThai !== "Chờ gấp")) trangThai = "dang-sx";

    // Công đoạn hiện tại: các khâu còn open
    const openKhau = list
      .filter((p) => p.trangThai !== "Hoàn thành")
      .map((p) => {
        const k = getCongDoanFromId(p.id);
        return k ? CONG_DOAN_LABELS[k] : null;
      })
      .filter(Boolean);
    const congDoanHienTai = openKhau.length > 0
      ? `${openKhau[0]}${openKhau.length > 1 ? ` (+${openKhau.length - 1})` : ""}`
      : "Hoàn thành";

    summaries.push({
      lenhSX,
      maSP: first.maSP,
      phanLoai: first.phanLoai,
      tongPhieu: list.length,
      phieuHoanThanh: hoanThanh.length,
      phieuDangLam: dangLam.length,
      phieuChoGiao: choGiao.length,
      tongSLGiao,
      tongSLDat,
      tongSLLoi: tongSLLoi,
      tongChiPhi,
      tienDaThanhToan: tienDaTT,
      tienConNo: Math.max(0, tongChiPhi - tienDaTT),
      trangThai,
      hanHoanThanh: hanChung,
      phanTramDat,
      congDoanHienTai,
      phieu: list,
    });
  }

  // Sort: trễ hạn lên đầu, sau đó theo hạn
  return summaries.sort((a, b) => {
    if (a.trangThai === "tre-han" && b.trangThai !== "tre-han") return -1;
    if (b.trangThai === "tre-han" && a.trangThai !== "tre-han") return 1;
    if (a.trangThai === "dang-sx" && b.trangThai === "moi") return -1;
    if (b.trangThai === "dang-sx" && a.trangThai === "moi") return 1;
    return (a.hanHoanThanh || "").localeCompare(b.hanHoanThanh || "");
  });
}

// ============ AGGREGATE: Theo phiếu (detail) ============

export type PhieuRow = PhieuWorkflow & {
  congDoan: CongDoanKey | null;
  quaHan: boolean;
  soNgayDangGiu: number;
  soNgayTreHan: number;
  chiPhiTamTinh: number;
};

/** Flatten tất cả phiếu + thêm computed fields */
export function flattenPhieu(phieus: PhieuWorkflow[] = ALL_REAL_PHIEU): PhieuRow[] {
  return phieus.map((p) => ({
    ...p,
    congDoan: getCongDoanFromId(p.id),
    quaHan: isQuaHan(p),
    soNgayDangGiu: soNgayDangGiu(p),
    soNgayTreHan: soNgayTreHan(p),
    chiPhiTamTinh: chiPhiTamTinh(p),
  }));
}

// ============ Tổng hợp cho dashboard QLSX ============

export type BDHKPI = {
  tongLSX: number;
  lsxDangSX: number;
  lsxHoanThanh: number;
  lsxTreHan: number;
  tongPhieu: number;
  phieuDangLam: number;
  phieuChoGiao: number;
  phieuQuaHan: number;
  tongSLGiao: number;
  tongSLDat: number;
  tongSLLoi: number;
  tongChiPhi: number;
  tienConNo: number;
};

export function getBDHKPI(): BDHKPI {
  const lsxList = groupByLSX();
  const phieuList = flattenPhieu();
  return {
    tongLSX: lsxList.length,
    lsxDangSX: lsxList.filter((l) => l.trangThai === "dang-sx").length,
    lsxHoanThanh: lsxList.filter((l) => l.trangThai === "hoan-thanh").length,
    lsxTreHan: lsxList.filter((l) => l.trangThai === "tre-han").length,
    tongPhieu: phieuList.length,
    phieuDangLam: phieuList.filter((p) => p.trangThai === "Đang làm" || p.trangThai === "Đang may").length,
    phieuChoGiao: phieuList.filter((p) => p.trangThai === "Chờ giao" || p.trangThai === "Chờ gấp").length,
    phieuQuaHan: phieuList.filter((p) => p.quaHan).length,
    tongSLGiao: phieuList.reduce((s, p) => s + p.soLuongGiao, 0),
    tongSLDat: phieuList.reduce((s, p) => s + p.soLuongDat, 0),
    tongSLLoi: phieuList.reduce((s, p) => s + p.soLuongLoi, 0),
    tongChiPhi: phieuList.reduce((s, p) => s + p.chiPhiTamTinh, 0),
    tienConNo: lsxList.reduce((s, l) => s + l.tienConNo, 0),
  };
}
