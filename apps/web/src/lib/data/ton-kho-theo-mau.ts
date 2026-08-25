"use client";

// Tồn kho thật theo (Mã SP -> Tên màu -> size) - đọc từ bảng kho_thanh_pham,
// dùng để hiện "Số lượng" thật trên card sản phẩm (Danh mục sản phẩm), thay
// cho số giả (random/công thức sin) trước đây. Chỉ cộng các dòng còn tồn
// (trang_thai = "con") - dòng đã xuất kho không tính vào tồn hiện tại.
import { supabaseFetchAllRaw, checkSupabase } from "@/lib/supabase/sync-helper";

export type TonKhoTheoSize = { size: string; sl: number }[];
/** Map: mã SP -> tên màu -> tồn theo từng size */
export type TonKhoTheoSanPham = Record<string, Record<string, TonKhoTheoSize>>;

function congDonSize(vao: TonKhoTheoSize, them: TonKhoTheoSize): TonKhoTheoSize {
  const map = new Map(vao.map((x) => [x.size, x.sl]));
  for (const x of them) map.set(x.size, (map.get(x.size) || 0) + (Number(x.sl) || 0));
  return Array.from(map.entries()).map(([size, sl]) => ({ size, sl }));
}

export async function layTonKhoTheoSanPham(): Promise<TonKhoTheoSanPham> {
  if (!checkSupabase()) return {};
  const rows = await supabaseFetchAllRaw<any>("kho_thanh_pham", "ngay_nhap", false);
  const result: TonKhoTheoSanPham = {};
  for (const r of rows) {
    if (r.trang_thai !== "con") continue;
    const maSP = r.ma_sp;
    const mau = r.mau || "";
    if (!maSP) continue;
    if (!result[maSP]) result[maSP] = {};
    const chiTiet: TonKhoTheoSize = Array.isArray(r.chi_tiet_size) && r.chi_tiet_size.length > 0
      ? r.chi_tiet_size.map((x: any) => ({ size: x.size, sl: Number(x.sl) || 0 }))
      : (r.size ? [{ size: r.size, sl: Number(r.so_luong) || 0 }] : []);
    result[maSP][mau] = congDonSize(result[maSP][mau] || [], chiTiet);
  }
  return result;
}
