/**
 * Danh sách tỉ lệ size chuẩn POLOMIMIN
 * Cập nhật 2026-08-04 theo yêu cầu sếp Sang (2 bảng)
 *
 * Quy ước value: "M:L:XL:2XL:3XL" — tỉ số từng size
 * 0 = không lấy size đó trong ri này
 *
 * Ri = Tổng số lượng trong 1 ri (ví dụ Ri5 = 5 sản phẩm / bộ)
 *
 * 2 BẢNG:
 *  1. Có 3XL (M, L, XL, 2XL, 3XL) - 5 size
 *  2. Bỏ 3XL (M, L, XL, 2XL)    - 4 size
 */

export type SizeRatioPreset = {
  id: string;         // key duy nhất
  label: string;      // Hiển thị trong dropdown
  value: string;      // Lưu vào DB: "1:2:2:2:1"
  sizes: string[];    // Tên từng size: ["M","L","XL","2XL","3XL"]
  ratios: number[];   // Tỉ số tương ứng: [1,2,2,2,1]
  riSo: number;       // Tổng 1 ri: sum(ratios)
  ghiChu?: string;
};

/**
 * BẢNG 1: CÓ 3XL (5 size: M, L, XL, 2XL, 3XL)
 * 4 tỷ lệ phổ biến
 */
export const SIZE_RATIO_5SIZE: SizeRatioPreset[] = [
  {
    id: "5s-1-2-2-2-1",
    label: "M:L:XL:2XL:3XL = 1:2:2:2:1 (Ri8)",
    value: "1:2:2:2:1",
    sizes: ["M", "L", "XL", "2XL", "3XL"],
    ratios: [1, 2, 2, 2, 1],
    riSo: 8,
    ghiChu: "Tập trung size giữa L/XL/2XL (phổ biến nhất)",
  },
  {
    id: "5s-2-2-2-2-2",
    label: "M:L:XL:2XL:3XL = 2:2:2:2:2 (Ri10)",
    value: "2:2:2:2:2",
    sizes: ["M", "L", "XL", "2XL", "3XL"],
    ratios: [2, 2, 2, 2, 2],
    riSo: 10,
    ghiChu: "Phân bổ đều nhưng tăng SL lớn",
  },
  {
    id: "5s-1-1-1-1-1",
    label: "M:L:XL:2XL:3XL = 1:1:1:1:1 (Ri5)",
    value: "1:1:1:1:1",
    sizes: ["M", "L", "XL", "2XL", "3XL"],
    ratios: [1, 1, 1, 1, 1],
    riSo: 5,
    ghiChu: "Phân bổ đều 5 size",
  },
  {
    id: "5s-2-2-2-2-2-b",
    label: "M:L:XL:2XL:3XL = 2:2:2:2:2 (Ri10 - ưu tiên SL lớn)",
    value: "2:2:2:2:2",
    sizes: ["M", "L", "XL", "2XL", "3XL"],
    ratios: [2, 2, 2, 2, 2],
    riSo: 10,
    ghiChu: "Ưu tiên số lượng size lớn (2XL/3XL)",
  },
];

/**
 * BẢNG 2: BỎ 3XL (4 size: M, L, XL, 2XL)
 * 4 tỷ lệ phổ biến
 */
export const SIZE_RATIO_4SIZE: SizeRatioPreset[] = [
  {
    id: "4s-1-2-2-1",
    label: "M:L:XL:2XL = 1:2:2:1 (Ri6)",
    value: "1:2:2:1",
    sizes: ["M", "L", "XL", "2XL"],
    ratios: [1, 2, 2, 1],
    riSo: 6,
    ghiChu: "Tập trung size giữa L/XL",
  },
  {
    id: "4s-1-2-2-2",
    label: "M:L:XL:2XL = 1:2:2:2 (Ri7)",
    value: "1:2:2:2",
    sizes: ["M", "L", "XL", "2XL"],
    ratios: [1, 2, 2, 2],
    riSo: 7,
    ghiChu: "Tăng size 2XL, giảm M",
  },
  {
    id: "4s-1-1-1-1",
    label: "M:L:XL:2XL = 1:1:1:1 (Ri4)",
    value: "1:1:1:1",
    sizes: ["M", "L", "XL", "2XL"],
    ratios: [1, 1, 1, 1],
    riSo: 4,
    ghiChu: "Phân bổ đều 4 size",
  },
  {
    id: "4s-2-2-2-2",
    label: "M:L:XL:2XL = 2:2:2:2 (Ri8)",
    value: "2:2:2:2",
    sizes: ["M", "L", "XL", "2XL"],
    ratios: [2, 2, 2, 2],
    riSo: 8,
    ghiChu: "Phân bổ đều nhưng tăng SL lớn",
  },
];

/**
 * Tổng hợp cả 2 bảng (giữ tương thích với code cũ)
 * Dùng khi cần list tất cả size ratio
 */
export const SIZE_RATIO_PRESETS: SizeRatioPreset[] = [
  ...SIZE_RATIO_5SIZE,
  ...SIZE_RATIO_4SIZE,
];
