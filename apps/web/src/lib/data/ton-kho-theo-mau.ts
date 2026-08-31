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
  const localKho = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("mimin_kho_thanh_pham_v2") || "[]") : [];
  
  // Create a map to deduplicate by ID if needed, or just combine them. 
  // Supabase has snake_case, localStorage has camelCase. We'll handle both.
  const allRows = [...rows, ...localKho];
  // Deduplicate by id
  const uniqueRows = Array.from(new Map(allRows.map(r => [r.id, r])).values());

  const result: TonKhoTheoSanPham = {};
  for (const r of uniqueRows) {
    const isCon = r.trang_thai === "con" || r.trangThai === "con";
    if (!isCon) continue;
    const maSP = r.ma_sp || r.maSP;
    const mau = r.mau || "";
    if (!maSP) continue;
    if (!result[maSP]) result[maSP] = {};
    const ctSize = r.chi_tiet_size || r.chiTietSize;
    const size = r.size;
    const soLuong = r.so_luong || r.soLuong;
    
    const chiTiet: TonKhoTheoSize = Array.isArray(ctSize) && ctSize.length > 0
      ? ctSize.map((x: any) => ({ size: x.size, sl: Number(x.sl) || 0 }))
      : (size ? [{ size: size, sl: Number(soLuong) || 0 }] : []);
    result[maSP][mau] = congDonSize(result[maSP][mau] || [], chiTiet);
  }
  return result;
}

/** Nguồn phân phối dùng chung cho Danh mục SP: mẫu, màu, giá và kênh bán từ Kho thành phẩm. */
export async function layDanhMucKhoThanhPham(): Promise<DanhMucKhoThanhPham> {
  if (!checkSupabase()) return {};
  const rows = await supabaseFetchAllRaw<any>("kho_thanh_pham", "ngay_nhap", false);
  const localKho = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("mimin_kho_thanh_pham_v2") || "[]") : [];
  
  const allRows = [...rows, ...localKho];
  const uniqueRows = Array.from(new Map(allRows.map(r => [r.id, r])).values());

  const result: DanhMucKhoThanhPham = {};
  for (const r of uniqueRows) {
    const maSP = r.ma_sp || r.maSP;
    if (!maSP) continue;
    
    const sizes: TonKhoTheoSize = Array.isArray(r.chi_tiet_size || r.chiTietSize) && (r.chi_tiet_size || r.chiTietSize).length > 0
      ? (r.chi_tiet_size || r.chiTietSize).map((x: any) => ({ size: x.size, sl: Number(x.sl) || 0 }))
      : (r.size ? [{ size: r.size, sl: Number(r.so_luong || r.soLuong) || 0 }] : []);
    const kenhBanRaw = r.kenh_ban || r.kenhBan;
    const channels = (Array.isArray(kenhBanRaw) && kenhBanRaw.length ? kenhBanRaw : ["ban-le"]) as KenhBanKho[];

    if (!result[maSP]) {
      result[maSP] = {
        maSP,
        tenSP: r.ten_sp || r.tenSP || maSP,
        phanLoai: r.phan_loai || r.phanLoai || "",
        tiLeSize: r.ti_le_size || r.tiLeSize || "",
        giaVon: Number(r.gia_von ?? r.don_gia ?? r.giaVon ?? r.donGia) || 0,
        giaBanLe: Number(r.gia_ban_le ?? r.don_gia ?? r.giaBanLe ?? r.donGia) || 0,
        giaBanSi: Number(r.gia_ban_si ?? r.giaBanSi) || 0,
        giaBanLo: Number(r.gia_ban_lo ?? r.giaBanLo) || 0,
        giaTikTok: Number(r.gia_tiktok ?? r.giaTikTok) || 0,
        giaShopee: Number(r.gia_shopee ?? r.giaShopee) || 0,
        kenhBan: [],
        mau: [],
      };
    } else {
      const giaVon = Number(r.gia_von ?? r.don_gia ?? r.giaVon ?? r.donGia) || 0;
      if (giaVon > result[maSP].giaVon) result[maSP].giaVon = giaVon;
      
      const giaBanLe = Number(r.gia_ban_le ?? r.don_gia ?? r.giaBanLe ?? r.donGia) || 0;
      if (giaBanLe > result[maSP].giaBanLe) result[maSP].giaBanLe = giaBanLe;

      const giaBanSi = Number(r.gia_ban_si ?? r.giaBanSi) || 0;
      if (giaBanSi > result[maSP].giaBanSi) result[maSP].giaBanSi = giaBanSi;

      const giaBanLo = Number(r.gia_ban_lo ?? r.giaBanLo) || 0;
      if (giaBanLo > result[maSP].giaBanLo) result[maSP].giaBanLo = giaBanLo;

      const giaTikTok = Number(r.gia_tiktok ?? r.giaTikTok) || 0;
      if (giaTikTok > result[maSP].giaTikTok) result[maSP].giaTikTok = giaTikTok;

      const giaShopee = Number(r.gia_shopee ?? r.giaShopee) || 0;
      if (giaShopee > result[maSP].giaShopee) result[maSP].giaShopee = giaShopee;
    }
    const item = result[maSP];
    item.kenhBan = Array.from(new Set([...item.kenhBan, ...channels]));
    const color = String(r.mau || "Mặc định");
    const existing = item.mau.find((x) => x.ten === color);
    
    // Support hinhAnh array in new format
    let imgToUse = "";
    if (r.hinh_anh && Array.isArray(r.hinh_anh) && r.hinh_anh.length > 0) imgToUse = r.hinh_anh[0];
    else if (r.hinhAnh && Array.isArray(r.hinhAnh) && r.hinhAnh.length > 0) imgToUse = r.hinhAnh[0];
    else imgToUse = r.img_quan || r.imgQuan || "";

    if (existing) existing.sizes = congDonSize(existing.sizes, sizes);
    else item.mau.push({ ten: color, img: imgToUse, sizes });
  }
  return result;
}
