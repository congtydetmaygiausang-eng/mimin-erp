// Data phân công công đoạn & công nợ
// Người phụ trách chọn từ: 35 đối tác gia công (DOI_TAC) + 17 nhân viên sản xuất (NHAN_SU)

import type { DoiTac } from "./real-data";
import type { NhanSu } from "./real-data";

// Lấy danh sách từ real-data
import { DOI_TAC, NHAN_SU } from "./real-data";

export type LoaiNguoiPT = "Đối tác gia công" | "Nhân viên nội bộ";

export type NguoiPhuTrach = {
  loai: LoaiNguoiPT;
  ma: string;       // NCC_15, GS002, etc.
  ten: string;      // Tên đối tác / tên NV
  sdt?: string;     // Optional, dùng cho liên hệ
};

export type CongDoanKey = "Cắt" | "Thêu" | "In" | "May áo" | "May quần" | "Ủi/Đóng gói";

export type PhanCongCongDoan = {
  id: string;
  lenhCatId: string;       // Liên kết với lệnh cắt (LC-M758, LC-M873)
  congDoan: CongDoanKey;
  nguoiPhuTrach: NguoiPhuTrach;
  donGiaGiao: number;       // đơn giá giao (đ/sp hoặc đ/bộ)
  soLuongGiao: number;      // SL giao (sản phẩm)
  donVi: string;            // "cái", "bộ"
  ngayGiao: string;         // YYYY-MM-DD
  ngayXongDuKien: string;
  trangThai: "Chờ giao" | "Đang làm" | "Hoàn thành" | "Đã thanh toán";
  daThanhToan: number;      // đã trả
  ghiChu?: string;
};

// ========== Tạo data mẫu cho M758 + M873 ==========
// Mapping chuẩn từ file Excel của a:
// - Thêu Chị Hạnh → GC-IN-002
// - May áo Chị Liễu → GC-TRU-001 (NGUYỄN THỊ NGỌC LIỄU)
// - May quần Chị Hương → GC-QUAN-004 (LÊ THỊ HOÀI HƯƠNG)
// - In Bảo Ngân → GC-IN-001
// - May áo Chị Cúc → GC-TRU-006
// - Cắt xưởng nhà → GS002 (NGUYỄN THỊ MỸ NHI)
// - Ủi xưởng nhà → GS010 (TRƯƠNG MINH TÂM)

export const PHAN_CONG: PhanCongCongDoan[] = [
  // ======= M758 - BỘ TRỤ TRƠN (500 bộ) =======
  {
    id: "PC-M758-01",
    lenhCatId: "LC-M758",
    congDoan: "Cắt",
    nguoiPhuTrach: {
      loai: "Nhân viên nội bộ",
      ma: "GS002",
      ten: "NGUYỄN THỊ MỸ NHI (Tổ cắt xưởng nhà)",
      sdt: "901207771",
    },
    donGiaGiao: 3500,
    soLuongGiao: 500,
    donVi: "bộ",
    ngayGiao: "2026-07-20",
    ngayXongDuKien: "2026-07-25",
    trangThai: "Hoàn thành",
    daThanhToan: 1750000,  // 3500 × 500
    ghiChu: "Tổ cắt xưởng nhà, đã hoàn thành và thanh toán",
  },
  {
    id: "PC-M758-02",
    lenhCatId: "LC-M758",
    congDoan: "Thêu",
    nguoiPhuTrach: {
      loai: "Đối tác gia công",
      ma: "GC-IN-002",
      ten: "Xưởng in/thêu/dập Hạnh",
      sdt: "374592478",
    },
    donGiaGiao: 4500,
    soLuongGiao: 500,
    donVi: "bộ",
    ngayGiao: "2026-07-22",
    ngayXongDuKien: "2026-08-05",
    trangThai: "Đang làm",
    daThanhToan: 0,
    ghiChu: "Thêu logo trước ngực - đang chờ Hạnh báo xong",
  },
  {
    id: "PC-M758-03",
    lenhCatId: "LC-M758",
    congDoan: "May áo",
    nguoiPhuTrach: {
      loai: "Đối tác gia công",
      ma: "GC-TRU-001",
      ten: "NGUYỄN THỊ NGỌC LIỄU (Chị Liễu)",
      sdt: "933305465",
    },
    donGiaGiao: 22000,
    soLuongGiao: 500,
    donVi: "áo",
    ngayGiao: "2026-07-25",
    ngayXongDuKien: "2026-08-10",
    trangThai: "Đang làm",
    daThanhToan: 5500000,  // Tạm ứng 50%
    ghiChu: "Đã tạm ứng 50% = 5.5tr. Còn nợ 5.5tr khi giao đủ",
  },
  {
    id: "PC-M758-04",
    lenhCatId: "LC-M758",
    congDoan: "May quần",
    nguoiPhuTrach: {
      loai: "Đối tác gia công",
      ma: "GC-QUAN-004",
      ten: "LÊ THỊ HOÀI HƯƠNG (Chị Hương)",
      sdt: "941104007",
    },
    donGiaGiao: 18000,
    soLuongGiao: 500,
    donVi: "quần",
    ngayGiao: "2026-07-25",
    ngayXongDuKien: "2026-08-10",
    trangThai: "Chờ giao",
    daThanhToan: 0,
    ghiChu: "Chờ Chị Liễu may áo xong rồi chuyển quần cho Chị Hương",
  },
  {
    id: "PC-M758-05",
    lenhCatId: "LC-M758",
    congDoan: "Ủi/Đóng gói",
    nguoiPhuTrach: {
      loai: "Nhân viên nội bộ",
      ma: "GS010",
      ten: "TRƯƠNG MINH TÂM (Tổ Ủi xưởng nhà)",
      sdt: "343513417",
    },
    donGiaGiao: 3000,
    soLuongGiao: 500,
    donVi: "bộ",
    ngayGiao: "2026-08-10",
    ngayXongDuKien: "2026-08-15",
    trangThai: "Chờ giao",
    daThanhToan: 0,
    ghiChu: "Chờ áo + quần về mới ủi đóng gói",
  },

  // ======= M873 - ÁO TRỤ (546 áo) =======
  {
    id: "PC-M873-01",
    lenhCatId: "LC-M873",
    congDoan: "Cắt",
    nguoiPhuTrach: {
      loai: "Nhân viên nội bộ",
      ma: "GS002",
      ten: "NGUYỄN THỊ MỸ NHI (Tổ cắt xưởng nhà)",
      sdt: "901207771",
    },
    donGiaGiao: 2000,
    soLuongGiao: 546,
    donVi: "áo",
    ngayGiao: "2026-07-18",
    ngayXongDuKien: "2026-07-22",
    trangThai: "Hoàn thành",
    daThanhToan: 1092000,  // 2000 × 546
    ghiChu: "Tổ cắt xưởng nhà, hoàn thành đúng hạn",
  },
  {
    id: "PC-M873-02",
    lenhCatId: "LC-M873",
    congDoan: "In",
    nguoiPhuTrach: {
      loai: "Đối tác gia công",
      ma: "GC-IN-001",
      ten: "Xưởng in/thêu/dập Bảo Ngân",
      sdt: "978417243",
    },
    donGiaGiao: 5000,
    soLuongGiao: 546,
    donVi: "áo",
    ngayGiao: "2026-07-20",
    ngayXongDuKien: "2026-07-30",
    trangThai: "Đang làm",
    daThanhToan: 1000000,  // Tạm ứng
    ghiChu: "In thân trước + in tay. Tạm ứng 1tr",
  },
  {
    id: "PC-M873-03",
    lenhCatId: "LC-M873",
    congDoan: "May áo",
    nguoiPhuTrach: {
      loai: "Đối tác gia công",
      ma: "GC-TRU-006",
      ten: "Xưởng may trụ cô Cúc",
      sdt: "907869422",
    },
    donGiaGiao: 14000,
    soLuongGiao: 546,
    donVi: "áo",
    ngayGiao: "2026-07-25",
    ngayXongDuKien: "2026-08-05",
    trangThai: "Đang làm",
    daThanhToan: 3822000,  // Tạm ứng 50%
    ghiChu: "Tạm ứng 50% = 3.822tr",
  },
  {
    id: "PC-M873-04",
    lenhCatId: "LC-M873",
    congDoan: "Ủi/Đóng gói",
    nguoiPhuTrach: {
      loai: "Nhân viên nội bộ",
      ma: "GS010",
      ten: "TRƯƠNG MINH TÂM (Tổ Ủi xưởng nhà)",
      sdt: "343513417",
    },
    donGiaGiao: 2000,
    soLuongGiao: 546,
    donVi: "áo",
    ngayGiao: "2026-08-05",
    ngayXongDuKien: "2026-08-10",
    trangThai: "Chờ giao",
    daThanhToan: 0,
    ghiChu: "Chờ Cúc giao áo về mới ủi đóng gói",
  },
];

// ========== Tính toán logic ==========
export function tinhCongNo(p: PhanCongCongDoan[]) {
  const tongThanhTien = p.reduce((s, x) => s + x.donGiaGiao * x.soLuongGiao, 0);
  const tongDaThanhToan = p.reduce((s, x) => s + x.daThanhToan, 0);
  const tongConNo = tongThanhTien - tongDaThanhToan;
  return { tongThanhTien, tongDaThanhToan, tongConNo };
}

// Gom công nợ theo người phụ trách
export function congNoTheoNguoi(p: PhanCongCongDoan[]) {
  const grouped: Record<string, { nguoi: NguoiPhuTrach; thanhTien: number; daThanhToan: number; conNo: number; soPC: number }> = {};
  for (const pc of p) {
    const key = pc.nguoiPhuTrach.ma;
    if (!grouped[key]) {
      grouped[key] = {
        nguoi: pc.nguoiPhuTrach,
        thanhTien: 0,
        daThanhToan: 0,
        conNo: 0,
        soPC: 0,
      };
    }
    grouped[key].thanhTien += pc.donGiaGiao * pc.soLuongGiao;
    grouped[key].daThanhToan += pc.daThanhToan;
    grouped[key].soPC += 1;
    grouped[key].conNo = grouped[key].thanhTien - grouped[key].daThanhToan;
  }
  return Object.values(grouped).sort((a, b) => b.conNo - a.conNo);
}

// Công nợ theo công đoạn
export function congNoTheoCongDoan(p: PhanCongCongDoan[]) {
  const grouped: Record<string, { congDoan: CongDoanKey; thanhTien: number; daThanhToan: number; conNo: number; soLuong: number }> = {};
  for (const pc of p) {
    if (!grouped[pc.congDoan]) {
      grouped[pc.congDoan] = { congDoan: pc.congDoan, thanhTien: 0, daThanhToan: 0, conNo: 0, soLuong: 0 };
    }
    grouped[pc.congDoan].thanhTien += pc.donGiaGiao * pc.soLuongGiao;
    grouped[pc.congDoan].daThanhToan += pc.daThanhToan;
    grouped[pc.congDoan].soLuong += pc.soLuongGiao;
    grouped[pc.congDoan].conNo = grouped[pc.congDoan].thanhTien - grouped[pc.congDoan].daThanhToan;
  }
  return Object.values(grouped);
}

// Phân công theo lệnh cắt
export function phanCongTheoLenhCat(p: PhanCongCongDoan[], lenhCatId: string) {
  return p.filter((x) => x.lenhCatId === lenhCatId);
}

// Lấy option cho dropdown chọn người phụ trách (gộp NV + ĐT)
export function layDanhSachNguoiPT(): NguoiPhuTrach[] {
  const list: NguoiPhuTrach[] = [];
  // Nhân viên nội bộ - lọc theo bộ phận Sản xuất + Tổ trưởng
  for (const nv of NHAN_SU) {
    if (nv.boPhan === "Sản xuất" || nv.boPhan === "Kho vận" || nv.chucVu === "Tổ trưởng") {
      list.push({
        loai: "Nhân viên nội bộ",
        ma: nv.maNV,
        ten: `${nv.hoTen}${nv.chucVu ? ` (${nv.chucVu})` : ""}`,
        sdt: nv.sdt,
      });
    }
  }
  // Đối tác gia công - lọc đang hợp tác
  for (const dt of DOI_TAC) {
    if (dt.trangThai === "Đang hợp tác") {
      list.push({
        loai: "Đối tác gia công",
        ma: dt.maDT,
        ten: `${dt.tenDonVi} - ${dt.congDoan}`,
        sdt: dt.sdt,
      });
    }
  }
  return list;
}
