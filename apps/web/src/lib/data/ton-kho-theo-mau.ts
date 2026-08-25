"use client";

// Tồn kho thật theo (Mã SP -> Tên màu -> size) - đọc từ bảng kho_thanh_pham,
// dùng để hiện "Số lượng" thật trên card sản phẩm (Danh mục sản phẩm), thay
// cho số giả (random/công thức sin) trước đây. Chỉ cộng các dòng còn tồn
// (trang_thai = "con") - dòng đã xuất kho không tính vào tồn hiện tại.
import { supabaseFetchAllRaw, checkSupabase } from "@/lib/supabase/sync-helper";

export type TonKhoTheoSize = { size: string; sl: number }[];
/** Map: mã SP -> tên màu -> tồn theo từng size */
export type TonKhoTheoSanPham = Record<string, Record<string, TonKhoTheoSize>>;

export type KenhBanKho = "ban-le" | "ban-si" | "ban-lo" | "tiktok" | "shopee";

export interface SanPhamTuKho {
  maSP: string;
  tenSP: string;
  phanLoai: string;
  tiLeSize: string;
  giaVon: number;
  giaBanLe: number;
  giaBanSi: number;
  giaBanLo: number;
  giaTikTok: number;
  giaShopee: number;
  kenhBan: KenhBanKho[];
  mau: { ten: string; img: string; sizes: TonKhoTheoSize }[];
}

export type DanhMucKhoThanhPham = Record<string, SanPhamTuKho>;

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

/** Nguồn phân phối dùng chung cho Danh mục SP: mẫu, màu, giá và kênh bán từ Kho thành phẩm. */
export async function layDanhMucKhoThanhPham(): Promise<DanhMucKhoThanhPham> {
  if (!checkSupabase()) return {};
  const rows = await supabaseFetchAllRaw<any>("kho_thanh_pham", "ngay_nhap", false);
  const result: DanhMucKhoThanhPham = {};
  for (const r of rows) {
    if (r.trang_thai !== "con" || !r.ma_sp) continue;
    const maSP = String(r.ma_sp);
    const sizes: TonKhoTheoSize = Array.isArray(r.chi_tiet_size)
      ? r.chi_tiet_size.map((x: any) => ({ size: String(x.size), sl: Number(x.sl) || 0 }))
      : [];
    const channels = (Array.isArray(r.kenh_ban) && r.kenh_ban.length ? r.kenh_ban : ["ban-le"]) as KenhBanKho[];
    if (!result[maSP]) {
      result[maSP] = {
        maSP,
        tenSP: r.ten_sp || maSP,
        phanLoai: r.phan_loai || "",
        tiLeSize: r.ti_le_size || "",
        giaVon: Number(r.gia_von ?? r.don_gia) || 0,
        giaBanLe: Number(r.gia_ban_le ?? r.don_gia) || 0,
        giaBanSi: Number(r.gia_ban_si) || 0,
        giaBanLo: Number(r.gia_ban_lo) || 0,
        giaTikTok: Number(r.gia_tiktok) || 0,
        giaShopee: Number(r.gia_shopee) || 0,
        kenhBan: [],
        mau: [],
      };
    }
    const item = result[maSP];
    item.kenhBan = Array.from(new Set([...item.kenhBan, ...channels]));
    const color = String(r.mau || "Mặc định");
    const existing = item.mau.find((x) => x.ten === color);
    if (existing) existing.sizes = congDonSize(existing.sizes, sizes);
    else item.mau.push({ ten: color, img: r.hinh_anh?.[0] || r.img_quan || "", sizes });
  }
  return result;
}
