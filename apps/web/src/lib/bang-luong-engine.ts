/**
 * Bảng lương tự động Engine (2026-08-03 - Cập nhật)
 * Tính lương cho 17 NV mới từ Excel:
 * - Lương sản phẩm: SL đạt × đơn giá (theo NV)
 * - Phạt lỗi: 30% đơn giá / sp lỗi
 * - Thưởng vượt: 20% đơn giá / sp vượt
 * - Phạt trễ hạn: 50K / task trễ
 * - Lương cứng (admin/ke toan/content): cố định theo data Excel
 */

import { REAL_NHAN_VIEN, REAL_DON_GIA } from "./real-workflow-data";
import { KH_SI_FULL } from "./master-data-full";

export interface BangLuongNV {
  maNV: string;
  tenNV: string;
  boPhan: string;          // Cắt / Gấp xếp / Ủi / Khuy nút / Content / Kho / ...
  donGia: number;          // đ/sp (0 nếu lương cứng)
  donVi: string;            // cái/sp
  luongCung: number;        // Lương cứng tháng (nếu có)
  isLuongSP: boolean;      // true = lương sản phẩm, false = lương cứng
  soLuongGiao: number;      // Tổng SL được giao
  soLuongDat: number;       // SL hoàn thành đúng
  soLuongLoi: number;       // SL bị lỗi
  soLuongVuot: number;      // SL vượt (nếu có)
  tienCong: number;         // Tiền công = slDat × donGia (cho lương SP)
  phatLoi: number;          // Phạt lỗi (30% đơn giá / sp lỗi)
  thuongVuot: number;       // Thưởng vượt (+20% đơn giá / sp vượt)
  phatTreHan: number;       // Phạt trễ hạn (nếu có)
  thucNhan: number;         // Thực nhận
  ngayTra: string;          // Ngày trả dự kiến (ngày 5 tháng sau)
  tasks: string[];          // Danh sách task IDs đã làm
  ghiChu?: string;
}

const PHAT_LOI_RATE = 0.3;       // Phạt 30% đơn giá / sp lỗi
const THUONG_VUOT_RATE = 0.2;    // Thưởng 20% đơn giá / sp vượt
const PHAT_TRE_HAN = 50000;      // Phạt trễ hạn 50K / task

// Lương cứng mặc định (theo data Excel)
const LUONG_CUNG_DEFAULT: Record<string, number> = {
  "Content - Media": 8_000_000,
  "QL Khách hàng Sỉ": 7_000_000,
  "Kế toán điều phối SX": 8_000_000,
  "Nhân viên Kho": 7_000_000,
  "Media": 10_000_000,
};

/**
 * Tính bảng lương cho tất cả NV trong 1 tháng
 * @param thang 1-12
 * @param nam yyyy
 * @param allPhieu PhieuWorkflow[] (mặc định ALL_REAL_PHIEU - có thể truyền task từ localStorage)
 * @returns BangLuongNV[] - 17 NV
 */
export function tinhBangLuongThang(
  thang: number,
  nam: number,
  allPhieu: any[] = []
): BangLuongNV[] {
  // Lấy tasks trong tháng
  const startDate = new Date(nam, thang - 1, 1);
  const endDate = new Date(nam, thang, 0, 23, 59, 59);

  const tasksTrongThang = allPhieu.filter((p) => {
    const taskDate = p.ngayHoanThanh ? new Date(p.ngayHoanThanh) :
                     p.ngayNhan ? new Date(p.ngayNhan) :
                     p.ngayGiao ? new Date(p.ngayGiao) : null;
    return taskDate && taskDate >= startDate && taskDate <= endDate;
  });

  // Tính cho từng NV
  const result: BangLuongNV[] = [];

  for (const nv of REAL_NHAN_VIEN) {
    // Lấy đơn giá từ NV info (REAL_NHAN_VIEN.donGia)
    const donGia = nv.donGia || 0;

    // Lấy lương cứng
    const luongCung = LUONG_CUNG_DEFAULT[nv.boPhan] || 0;
    const isLuongSP = luongCung === 0;

    // Lấy tasks của NV trong tháng
    const myTasks = tasksTrongThang.filter((t) => t.nguoiNhan === nv.ma);
    const tasksMa = myTasks.map((t) => t.id);

    const soLuongGiao = myTasks.reduce((s, t) => s + (t.soLuongGiao || 0), 0);
    const soLuongDat = myTasks.reduce((s, t) => s + (t.soLuongDat || 0), 0);
    const soLuongLoi = myTasks.reduce((s, t) => s + (t.soLuongLoi || 0), 0);
    const soLuongVuot = Math.max(0, soLuongDat - soLuongGiao);

    // Tính tiền
    let tienCong = 0;
    let phatLoi = 0;
    let thuongVuot = 0;

    if (isLuongSP) {
      tienCong = soLuongDat * donGia;
      phatLoi = soLuongLoi * donGia * PHAT_LOI_RATE;
      thuongVuot = soLuongVuot * donGia * THUONG_VUOT_RATE;
    }

    // Phạt trễ hạn: task có deadline < ngayHoanThanh (nếu có)
    let phatTreHan = 0;
    for (const t of myTasks) {
      if (t.hanHoanThanh && t.ngayHoanThanh && t.ngayHoanThanh > t.hanHoanThanh) {
        phatTreHan += PHAT_TRE_HAN;
      }
    }

    // Tính thực nhận
    const thucNhanSP = Math.max(0, tienCong - phatLoi - phatTreHan + thuongVuot);
    const thucNhan = isLuongSP ? thucNhanSP : luongCung;

    // Ngày trả: ngày 5 tháng sau (handle rollover năm khi thang = 12)
    const nextThang = thang === 12 ? 1 : thang + 1;
    const nextNam = thang === 12 ? nam + 1 : nam;
    const ngayTra = `${nextNam}-${String(nextThang).padStart(2, "0")}-05`;

    result.push({
      maNV: nv.ma,
      tenNV: nv.ten,
      boPhan: nv.boPhan,
      donGia,
      donVi: donGia > 0 ? "sp" : "tháng",
      luongCung,
      isLuongSP,
      soLuongGiao,
      soLuongDat,
      soLuongLoi,
      soLuongVuot,
      tienCong: Math.round(tienCong),
      phatLoi: Math.round(phatLoi),
      thuongVuot: Math.round(thuongVuot),
      phatTreHan: Math.round(phatTreHan),
      thucNhan: Math.round(thucNhan),
      ngayTra,
      tasks: tasksMa,
      ghiChu: nv.ghiChu,
    });
  }

  return result;
}

/**
 * Tổng kết bảng lương tháng
 */
export interface TongKetBangLuong {
  tongNV: number;
  tongLuongCung: number;
  tongLuongSP: number;
  tongPhatLoi: number;
  tongThuongVuot: number;
  tongPhatTreHan: number;
  tongThucNhan: number;
  theoBoPhan: { boPhan: string; ten: string; tongNV: number; thucNhan: number; mau: string }[];
}

const BO_PHAN_INFO: Record<string, { ten: string; mau: string }> = {
  "cắt": { ten: "Cắt", mau: "#0284c7" },
  "Cắt": { ten: "Cắt", mau: "#0284c7" },
  "Gấp xếp": { ten: "Gấp xếp", mau: "#7c3aed" },
  "Ủi": { ten: "Ủi", mau: "#e11d48" },
  "Khuy nút": { ten: "Khuy nút", mau: "#ca8a04" },
  "Content - Media": { ten: "Content - Media", mau: "#db2777" },
  "QL Khách hàng Sỉ": { ten: "QL Khách hàng Sỉ", mau: "#0891b2" },
  "Kế toán điều phối SX": { ten: "Kế toán", mau: "#2563eb" },
  "Nhân viên Kho": { ten: "Kho", mau: "#ea580c" },
  "Media": { ten: "Media", mau: "#db2777" },
};

export function tongKetBangLuong(blList: BangLuongNV[]): TongKetBangLuong {
  const byBoPhan: Record<string, { count: number; total: number }> = {};
  for (const bl of blList) {
    if (!byBoPhan[bl.boPhan]) byBoPhan[bl.boPhan] = { count: 0, total: 0 };
    byBoPhan[bl.boPhan].count++;
    byBoPhan[bl.boPhan].total += bl.thucNhan;
  }

  return {
    tongNV: blList.length,
    tongLuongCung: blList.filter(b => !b.isLuongSP).reduce((s, b) => s + b.luongCung, 0),
    tongLuongSP: blList.filter(b => b.isLuongSP).reduce((s, b) => s + b.thucNhan, 0),
    tongPhatLoi: blList.reduce((s, b) => s + b.phatLoi, 0),
    tongThuongVuot: blList.reduce((s, b) => s + b.thuongVuot, 0),
    tongPhatTreHan: blList.reduce((s, b) => s + b.phatTreHan, 0),
    tongThucNhan: blList.reduce((s, b) => s + b.thucNhan, 0),
    theoBoPhan: Object.entries(byBoPhan).map(([bp, d]) => ({
      boPhan: bp,
      ten: BO_PHAN_INFO[bp]?.ten || bp,
      mau: BO_PHAN_INFO[bp]?.mau || "#64748b",
      tongNV: d.count,
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

/**
 * Format VND đầy đủ (cho chi tiết)
 */
export function fmtVNDFull(n: number): string {
  return n.toLocaleString("vi-VN") + " đ";
}
