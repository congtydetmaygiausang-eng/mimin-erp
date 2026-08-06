// ============================================
// Product Variants (biến thể sản phẩm)
// Phase 1: danh-muc-sp redesign
// 2026-08-06
// ============================================

/**
 * Mỗi variant = 1 combo màu + size của sản phẩm
 * VD: M001-DEN-L = Áo M001, màu Đen, size L
 *
 * Auto-generate từ dsMau (màu) × bangSize (size) của SanPham.
 * Không cần lưu DB riêng - tính runtime.
 */
export interface ProductVariant {
  /** ID unique trong SP, format: "{maSP}-{mauCode}-{size}" - VD: "M001-DEN-L" */
  id: string;
  /** Mã màu viết tắt không dấu, không space - VD: "DEN", "TRA", "XDEN" */
  mauCode: string;
  /** Tên hiển thị - VD: "Đen", "Trắng", "Xanh Đen" */
  mauTen: string;
  /** Size - "M", "L", "XL", "2XL", "3XL" */
  size: string;
  /** SKU đầy đủ - VD: "M001-DEN-L" */
  maSKU: string;
  /** Định mức vải cho variant này (m) */
  dinhMuc: number;
  /** URL ảnh variant (nếu có - mặc định lấy từ dsMau) */
  img: string;
  /** Số lượng tồn kho (optional - tính sau khi có module kho chi tiết) */
  soLuongTon?: number;
}

/**
 * Convert tên tiếng Việt có dấu thành code không dấu
 * VD: "Đen" -> "DEN", "Xanh Đen" -> "XANHDEN", "Trắng" -> "TRANG"
 */
export function mauToCode(tenMau: string): string {
  if (!tenMau) return "";
  return tenMau
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // bỏ dấu
    .replace(/đ/gi, (m) => (m === "đ" ? "D" : "d")) // đ -> D
    .replace(/[^a-zA-Z0-9]/g, "") // bỏ space + special
    .toUpperCase();
}

/**
 * Auto-generate variants từ SanPham
 * - Input: dsMau (mảng màu) × bangSize.sizes (mảng size)
 * - Output: ProductVariant[] (flat list)
 * - Chỉ generate cho các size có ratio > 0 (bỏ size = 0)
 */
export function generateVariants(
  maSP: string,
  dsMau: Array<{ ten: string; maSKU?: string; dinhMuc?: number; img?: string }>,
  bangSize: { sizes: string[]; ratios: number[] }
): ProductVariant[] {
  if (!dsMau || dsMau.length === 0) return [];
  if (!bangSize?.sizes || !bangSize?.ratios) return [];

  const variants: ProductVariant[] = [];
  for (const mau of dsMau) {
    const mauCode = mauToCode(mau.ten);
    for (let i = 0; i < bangSize.sizes.length; i++) {
      const size = bangSize.sizes[i];
      const ratio = bangSize.ratios[i] || 0;
      if (ratio <= 0) continue; // bỏ size ratio = 0

      variants.push({
        id: `${maSP}-${mauCode}-${size}`,
        mauCode,
        mauTen: mau.ten,
        size,
        maSKU: mau.maSKU ? `${mau.maSKU}-${size}` : `${maSP}-${mauCode}-${size}`,
        dinhMuc: mau.dinhMuc || 0.25,
        img: mau.img || "",
        soLuongTon: 0,
      });
    }
  }
  return variants;
}

/**
 * Group variants theo màu (để render grid variants theo màu trong card lớn)
 */
export function groupVariantsByMau(variants: ProductVariant[]): Array<{
  mauCode: string;
  mauTen: string;
  img: string;
  variants: ProductVariant[];
}> {
  const map = new Map<string, { mauCode: string; mauTen: string; img: string; variants: ProductVariant[] }>();
  for (const v of variants) {
    if (!map.has(v.mauCode)) {
      map.set(v.mauCode, {
        mauCode: v.mauCode,
        mauTen: v.mauTen,
        img: v.img,
        variants: [],
      });
    }
    map.get(v.mauCode)!.variants.push(v);
  }
  return Array.from(map.values());
}
