/**
 * Danh sách tỉ lệ size chuẩn POLOMIMIN
 * Cập nhật 2026-08-03 theo yêu cầu sếp Sang
 *
 * Quy ước value: "M:L:XL:2XL:3XL" — tỉ số từng size
 * 0 = không lấy size đó trong ri này
 *
 * Ri = Tổng số lượng trong 1 ri (ví dụ Ri5 = 5 sản phẩm / bộ)
 */

export type SizeRatioPreset = {
  id: string;         // key duy nhất
  label: string;      // Hiển thị trong dropdown
  value: string;      // Lưu vào DB: "1:1:1:1:1"
  sizes: string[];    // Tên từng size: ["M","L","XL","2XL","3XL"]
  ratios: number[];   // Tỉ số tương ứng: [1,1,1,1,1]
  riSo: number;       // Tổng 1 ri: sum(ratios)
  ghiChu?: string;
};

export const SIZE_RATIO_PRESETS: SizeRatioPreset[] = [
  // ── Nhóm M → 3XL (5 size) ──────────────────────────────
  {
    id: "m5s-ri5",
    label: "M:L:XL:2XL:3XL = 1:1:1:1:1 (Ri5)",
    value: "1:1:1:1:1",
    sizes: ["M", "L", "XL", "2XL", "3XL"],
    ratios: [1, 1, 1, 1, 1],
    riSo: 5,
    ghiChu: "Phân bổ đều 5 size",
  },
  {
    id: "m5s-ri8",
    label: "M:L:XL:2XL:3XL = 1:2:2:2:1 (Ri8)",
    value: "1:2:2:2:1",
    sizes: ["M", "L", "XL", "2XL", "3XL"],
    ratios: [1, 2, 2, 2, 1],
    riSo: 8,
    ghiChu: "Tập trung size giữa L/XL/2XL",
  },

  // ── Nhóm L → 3XL (4 size, bỏ M) ────────────────────────
  {
    id: "l4s-ri5",
    label: "L:XL:2XL:3XL = 1:2:1:1 (Ri5)",
    value: "0:1:2:1:1",
    sizes: ["M", "L", "XL", "2XL", "3XL"],
    ratios: [0, 1, 2, 1, 1],
    riSo: 5,
    ghiChu: "Không lấy M, tập trung XL",
  },
  {
    id: "l4s-ri6",
    label: "L:XL:2XL:3XL = 1:2:2:1 (Ri6)",
    value: "0:1:2:2:1",
    sizes: ["M", "L", "XL", "2XL", "3XL"],
    ratios: [0, 1, 2, 2, 1],
    riSo: 6,
    ghiChu: "Không lấy M, tập trung XL/2XL",
  },
  {
    id: "l4s-ri4",
    label: "L:XL:2XL:3XL = 1:1:1:1 (Ri4)",
    value: "0:1:1:1:1",
    sizes: ["M", "L", "XL", "2XL", "3XL"],
    ratios: [0, 1, 1, 1, 1],
    riSo: 4,
    ghiChu: "Phân bổ đều 4 size L→3XL",
  },
  {
    id: "l4s-ri8",
    label: "L:XL:2XL:3XL = 2:2:2:2 (Ri8)",
    value: "0:2:2:2:2",
    sizes: ["M", "L", "XL", "2XL", "3XL"],
    ratios: [0, 2, 2, 2, 2],
    riSo: 8,
    ghiChu: "Phân bổ đều 4 size, mỗi size 2 cái",
  },
];

/**
 * Chỉ trả về sizes thực tế (ratio > 0)
 * VD: preset "0:1:2:1:1" → ["L","XL","2XL","3XL"]
 */
export function getActiveSizes(preset: SizeRatioPreset): string[] {
  return preset.sizes.filter((_, i) => preset.ratios[i] > 0);
}

/**
 * Tính số lượng từng size từ tổng SL và 1 preset
 * VD: tongSL=160, preset Ri8 → mỗi ri 8 sp → 20 ri
 *     → L:20, XL:40, 2XL:40, 3XL:20 (... M:0)
 */
export function phanBoSizeTheoPreset(
  preset: SizeRatioPreset,
  tongSL: number
): { size: string; ratio: number; soLuong: number }[] {
  const soRi = Math.floor(tongSL / preset.riSo);
  const du = tongSL % preset.riSo;

  return preset.sizes.map((size, i) => {
    const ratio = preset.ratios[i];
    // Phân phần dư vào size có ratio cao nhất
    let soLuong = soRi * ratio;
    return { size, ratio, soLuong };
  });
}

/** Tra cứu preset theo value string (dùng khi load từ DB) */
export function findPresetByValue(value: string): SizeRatioPreset | undefined {
  return SIZE_RATIO_PRESETS.find((p) => p.value === value);
}
