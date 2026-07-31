/**
 * Bảng lương tự động Engine
 * Tính lương 13 CN dựa trên:
 * - SL đạt × đơn giá gia công
 * - Phạt lỗi (nếu slLoi > 0)
 * - Thưởng vượt tiến độ (nếu slDat > slGiao)
 * - Phạt trễ hạn (nếu ngayHoanThanh > deadline)
 */

import { CONG_NHAN_13, type ModuleSX } from "./congnhan-13";
import { ALL_REAL_PHIEU } from "./real-workflow-data";
import { KH_SI_FULL } from "./master-data-full";

export interface BangLuongNV {
  maNV: string;
  tenNV: string;
  module: ModuleSX;
  donGia: number;          // đ/sp
  donVi: string;            // cái/sp
  soLuongGiao: number;      // Tổng SL được giao
  soLuongDat: number;       // SL hoàn thành đúng
  soLuongLoi: number;       // SL bị lỗi
  soLuongVuot: number;      // SL vượt (nếu có)
  tienCong: number;         // Tiền công = slDat × donGia
  phatLoi: number;          // Phạt lỗi (30% đơn giá / sp lỗi)
  thuongVuot: number;       // Thưởng vượt (+20% đơn giá / sp vượt)
  phatTreHan: number;       // Phạt trễ hạn (nếu có)
  thucNhan: number;         // Thực nhận
  ngayTra: string;          // Ngày trả dự kiến (ngày 5 tháng sau)
  tasks: string[];          // Danh sách task IDs đã làm
}

const PHAT_LOI_RATE = 0.3;       // Phạt 30% đơn giá / sp lỗi
const THUONG_VUOT_RATE = 0.2;    // Thưởng 20% đơn giá / sp vượt
const PHAT_TRE_HAN = 50000;      // Phạt trễ hạn 50K / task

/**
 * Tính bảng lương cho 13 CN trong 1 tháng
 * @param tháng 1-12
 * @param nam yyyy
 * @returns BangLuongNV[] - 13 CN
 */
export function tinhBangLuongThang(thang: number, nam: number): BangLuongNV[] {
  // Lấy tasks trong tháng
  const startDate = new Date(nam, thang - 1, 1);
  const endDate = new Date(nam, thang, 0, 23, 59, 59);
  
  const tasksTrongThang = ALL_REAL_PHIEU.filter((p) => {
    const taskDate = p.ngayHoanThanh ? new Date(p.ngayHoanThanh) :
                     p.ngayNhan ? new Date(p.ngayNhan) :
                     p.ngayGiao ? new Date(p.ngayGiao) : null;
    return taskDate && taskDate >= startDate && taskDate <= endDate;
  });

  // Tính cho từng CN
  const result: BangLuongNV[] = [];

  for (const cn of CONG_NHAN_13) {
    // Lấy đơn giá từ NV info (NV017: 750đ/cái - Khuy nút)
    let donGia = 0;
    let donVi = "sp";
    if (cn.module === "khuy-nut") {
      donGia = 750;
      donVi = "cái";
    } else if (cn.module === "cat") {
      // Cắt: phân biệt áo trụ 1400 / áo tròn 1200 / quần 900
      donVi = "sp";
      // Lấy donGia từ task đầu tiên nếu có, fallback 1200
      // (Sẽ tinh chỉnh theo từng task bên dưới)
      donGia = 1200;
    } else if (cn.module === "ui") {
      donGia = 2000;
      donVi = "sp";
    } else if (cn.module === "dong-goi") {
      donGia = 800;
      donVi = "sp";
    } else if (cn.module === "may") {
      donGia = 2500;
      donVi = "sp";
    } else if (cn.module === "intd") {
      donGia = 2000; // 2000 thêu / 1500 in - lấy trung bình
      donVi = "sp";
    }

    // Lấy tasks của CN trong tháng
    const myTasks = tasksTrongThang.filter((t) => t.nguoiNhan === cn.maNV);
    const tasksMa = myTasks.map((t) => t.id);

    const soLuongGiao = myTasks.reduce((s, t) => s + t.soLuongGiao, 0);
    const soLuongDat = myTasks.reduce((s, t) => s + t.soLuongDat, 0);
    const soLuongLoi = myTasks.reduce((s, t) => s + t.soLuongLoi, 0);
    const soLuongVuot = Math.max(0, soLuongDat - soLuongGiao);

    // Tính tiền
    const tienCong = soLuongDat * donGia;
    const phatLoi = soLuongLoi * donGia * PHAT_LOI_RATE;
    const thuongVuot = soLuongVuot * donGia * THUONG_VUOT_RATE;
    
    // Phạt trễ hạn: task có deadline < ngayHoanThanh (nếu có)
    let phatTreHan = 0;
    for (const t of myTasks) {
      if (t.hanHoanThanh && t.ngayHoanThanh && t.ngayHoanThanh > t.hanHoanThanh) {
        phatTreHan += PHAT_TRE_HAN;
      }
    }

    const thucNhan = Math.max(0, tienCong - phatLoi - phatTreHan + thuongVuot);

    // Ngày trả: ngày 5 tháng sau
    const ngayTra = `${nam}-${String(thang + 1).padStart(2, "0")}-05`;

    result.push({
      maNV: cn.maNV,
      tenNV: cn.name,
      module: cn.module!,
      donGia,
      donVi,
      soLuongGiao,
      soLuongDat,
      soLuongLoi,
      soLuongVuot,
      tienCong,
      phatLoi: Math.round(phatLoi),
      thuongVuot: Math.round(thuongVuot),
      phatTreHan: Math.round(phatTreHan),
      thucNhan: Math.round(thucNhan),
      ngayTra,
      tasks: tasksMa,
    });
  }

  return result;
}

/**
 * Tổng kết bảng lương tháng
 */
export interface TongKetBangLuong {
  tongCN: number;
  tongTienCong: number;
  tongPhatLoi: number;
  tongThuongVuot: number;
  tongPhatTreHan: number;
  tongThucNhan: number;
  theoModule: { module: string; ten: string; tongCN: number; thucNhan: number; mau: string }[];
}

export function tongKetBangLuong(blList: BangLuongNV[]): TongKetBangLuong {
  const MODULE_INFO: Record<string, { ten: string; mau: string }> = {
    "cat": { ten: "Cắt", mau: "#0284c7" },
    "khuy-nut": { ten: "Khuy nút", mau: "#ca8a04" },
    "ui": { ten: "Ủi", mau: "#e11d48" },
    "gap": { ten: "Đóng gói", mau: "#7c3aed" },
  };

  const byModule: Record<string, { count: number; total: number }> = {};
  for (const bl of blList) {
    if (!byModule[bl.module]) byModule[bl.module] = { count: 0, total: 0 };
    byModule[bl.module].count++;
    byModule[bl.module].total += bl.thucNhan;
  }

  return {
    tongCN: blList.length,
    tongTienCong: blList.reduce((s, b) => s + b.tienCong, 0),
    tongPhatLoi: blList.reduce((s, b) => s + b.phatLoi, 0),
    tongThuongVuot: blList.reduce((s, b) => s + b.thuongVuot, 0),
    tongPhatTreHan: blList.reduce((s, b) => s + b.phatTreHan, 0),
    tongThucNhan: blList.reduce((s, b) => s + b.thucNhan, 0),
    theoModule: Object.entries(byModule).map(([m, d]) => ({
      module: m,
      ten: MODULE_INFO[m]?.ten || m,
      mau: MODULE_INFO[m]?.mau || "#64748b",
      tongCN: d.count,
      thucNhan: d.total,
    })),
  };
}

/**
 * Format VND
 */
export function fmtVND(n: number): string {
  if (n === 0) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + " tr";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return n.toLocaleString("vi-VN");
}
