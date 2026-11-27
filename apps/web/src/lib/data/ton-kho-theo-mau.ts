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
  hinhAnh?: string;
  mau: { ten: string; img: string; sizes: TonKhoTheoSize }[];
}

export type DanhMucKhoThanhPham = Record<string, SanPhamTuKho>;

function congDonSize(vao: TonKhoTheoSize, them: TonKhoTheoSize): TonKhoTheoSize {
  const map = new Map(vao.map((x) => [x.size, x.sl]));
  for (const x of them) map.set(x.size, (map.get(x.size) || 0) + (Number(x.sl) || 0));
  return Array.from(map.entries()).map(([size, sl]) => ({ size, sl }));
}

function damBaoChiTietSize(chiTiet: TonKhoTheoSize, soLuongThat: number, sizeDefault?: string): TonKhoTheoSize {
  if (soLuongThat <= 0) return chiTiet.map((x) => ({ size: x.size, sl: 0 }));
  const tongChiTiet = chiTiet.reduce((sum, x) => sum + (Number(x.sl) || 0), 0);
  if (tongChiTiet > 0) {
    if (tongChiTiet === soLuongThat) return chiTiet;
    let conLai = soLuongThat;
    return chiTiet.map((x, i) => {
      if (i === chiTiet.length - 1) return { size: x.size, sl: Math.max(0, conLai) };
      const slMoi = Math.round(((Number(x.sl) || 0) / tongChiTiet) * soLuongThat);
      conLai -= slMoi;
      return { size: x.size, sl: Math.max(0, slMoi) };
    });
  }
  // Nếu các size có sl = 0 mà soLuongThat > 0: Phân bổ đều vào các size
  if (chiTiet.length > 0) {
    const soSize = chiTiet.length;
    let conLai = soLuongThat;
    return chiTiet.map((x, i) => {
      if (i === soSize - 1) return { size: x.size, sl: Math.max(0, conLai) };
      const chia = Math.floor(soLuongThat / soSize);
      conLai -= chia;
      return { size: x.size, sl: Math.max(0, chia) };
    });
  }
  return [{ size: (sizeDefault && sizeDefault.trim()) || "Freesize", sl: soLuongThat }];
}

function getDeletedKhoIds(): Set<string> {
  try {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("mimin_kho_tp_deleted_ids");
      if (raw) return new Set(JSON.parse(raw));
    }
  } catch {}
  return new Set();
}

function extractImage(r: any): string {
  if (r.hinh_anh && Array.isArray(r.hinh_anh) && r.hinh_anh.length > 0) return r.hinh_anh[0];
  if (r.hinhAnh && Array.isArray(r.hinhAnh) && r.hinhAnh.length > 0) return r.hinhAnh[0];
  if (typeof r.hinh_anh === "string" && r.hinh_anh) return r.hinh_anh;
  if (typeof r.hinhAnh === "string" && r.hinhAnh) return r.hinhAnh;
  return r.img_quan || r.imgQuan || "";
}

export async function layTonKhoTheoSanPham(): Promise<TonKhoTheoSanPham> {
  if (!checkSupabase()) return layTonKhoTheoSanPhamSync();
  const rows = await supabaseFetchAllRaw<any>("kho_thanh_pham", "ngay_nhap", false);
  const localKho = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("mimin_kho_thanh_pham_v2") || "[]") : [];
  const deletedIds = getDeletedKhoIds();
  
  // Hợp nhất dữ liệu: Supabase là Single Source of Truth
  // Các sản phẩm đã có trên Supabase thì lấy hoàn toàn từ server, loại bỏ triệt để các dòng local cũ khác ID tránh nhân đôi số lượng
  const rowsMap = new Map<string, any>();
  const remoteProductCodes = new Set<string>();
  if (rows && rows.length > 0) {
    for (const r of rows) {
      if (r.id && (deletedIds.has(String(r.id)) || (r.lsx && deletedIds.has(String(r.lsx))))) continue;
      const rawMa = String(r.ma_sp || r.maSP || "").trim().toUpperCase();
      if (rawMa) remoteProductCodes.add(rawMa);
      if (r.id) rowsMap.set(String(r.id), r);
    }
  }
  if (localKho && localKho.length > 0) {
    for (const r of localKho) {
      if (r.id && (deletedIds.has(String(r.id)) || (r.lsx && deletedIds.has(String(r.lsx))))) continue;
      const rawMa = String(r.ma_sp || r.maSP || "").trim().toUpperCase();
      if (rawMa && remoteProductCodes.has(rawMa)) continue; // Bỏ qua cache local nếu server đã có sản phẩm này
      if (r.id && !rowsMap.has(String(r.id))) rowsMap.set(String(r.id), r);
    }
  }
  const effectiveRows = rowsMap.size > 0 ? Array.from(rowsMap.values()) : (rows && rows.length > 0 ? rows : localKho);

  // Tự động làm mới cache localStorage từ dữ liệu hợp nhất mới nhất
  if (typeof window !== "undefined" && rows && rows.length > 0) {
    try {
      localStorage.setItem("mimin_kho_thanh_pham_v2", JSON.stringify(effectiveRows));
    } catch {}
  }

  const result: TonKhoTheoSanPham = {};
  for (const r of effectiveRows) {
    if (r.id && (deletedIds.has(String(r.id)) || (r.lsx && deletedIds.has(String(r.lsx))))) continue;
    const rawMaSP = String(r.ma_sp || r.maSP || "").trim();
    if (!rawMaSP) continue;
    const maSPUpper = rawMaSP.toUpperCase();
    const mau = String(r.mau || "").trim();
    
    // Khởi tạo trước cho cả mã gốc và mã in hoa
    if (!result[rawMaSP]) result[rawMaSP] = {};
    if (!result[maSPUpper]) result[maSPUpper] = result[rawMaSP];

    const isCon = r.trang_thai === "con" || r.trangThai === "con";
    if (!isCon) continue;
    
    const ctSize = r.chi_tiet_size || r.chiTietSize;
    const size = r.size;
    const soLuong = r.so_luong || r.soLuong;
    const soLuongThat = Number(soLuong) || 0;
    if (soLuongThat <= 0) continue;
    
    let chiTiet: TonKhoTheoSize = Array.isArray(ctSize) && ctSize.length > 0
      ? ctSize.map((x: any) => ({ size: x.size, sl: Number(x.sl) || 0 }))
      : (size ? [{ size: size, sl: soLuongThat }] : []);
      
    chiTiet = damBaoChiTietSize(chiTiet, soLuongThat, size);
    
    result[rawMaSP][mau] = congDonSize(result[rawMaSP][mau] || [], chiTiet);
    if (maSPUpper !== rawMaSP) {
      result[maSPUpper][mau] = result[rawMaSP][mau];
    }
  }
  return result;
}

export function layTonKhoTheoSanPhamSync(): TonKhoTheoSanPham {
  const localKho = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("mimin_kho_thanh_pham_v2") || "[]") : [];
  const deletedIds = getDeletedKhoIds();
  const uniqueRows = (Array.from(new Map(localKho.map((r: any) => [r.id, r])).values()) as any[])
    .filter(r => !deletedIds.has(String(r.id)) && (!r.lsx || !deletedIds.has(String(r.lsx))));

  const result: TonKhoTheoSanPham = {};
  for (const r of uniqueRows) {
    const rawMaSP = String(r.ma_sp || r.maSP || "").trim();
    if (!rawMaSP) continue;
    const maSPUpper = rawMaSP.toUpperCase();
    const mau = String(r.mau || "").trim();
    
    if (!result[rawMaSP]) result[rawMaSP] = {};
    if (!result[maSPUpper]) result[maSPUpper] = result[rawMaSP];

    const isCon = r.trang_thai === "con" || r.trangThai === "con";
    if (!isCon) continue;
    
    const ctSize = r.chi_tiet_size || r.chiTietSize;
    const size = r.size;
    const soLuong = r.so_luong || r.soLuong;
    const soLuongThat = Number(soLuong) || 0;
    if (soLuongThat <= 0) continue;
    
    let chiTiet: TonKhoTheoSize = Array.isArray(ctSize) && ctSize.length > 0
      ? ctSize.map((x: any) => ({ size: x.size, sl: Number(x.sl) || 0 }))
      : (size ? [{ size: size, sl: soLuongThat }] : []);
      
    chiTiet = damBaoChiTietSize(chiTiet, soLuongThat, size);
    
    result[rawMaSP][mau] = congDonSize(result[rawMaSP][mau] || [], chiTiet);
    if (maSPUpper !== rawMaSP) {
      result[maSPUpper][mau] = result[rawMaSP][mau];
    }
  }
  return result;
}

/** Nguồn phân phối dùng chung cho Danh mục SP: mẫu, màu, giá và kênh bán từ Kho thành phẩm. */
export async function layDanhMucKhoThanhPham(): Promise<DanhMucKhoThanhPham> {
  if (!checkSupabase()) return layDanhMucKhoThanhPhamSync();
  const rows = await supabaseFetchAllRaw<any>("kho_thanh_pham", "ngay_nhap", false);
  const localKho = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("mimin_kho_thanh_pham_v2") || "[]") : [];
  const deletedIds = getDeletedKhoIds();
  
  // Hợp nhất dữ liệu: Supabase là Single Source of Truth
  // Các sản phẩm đã có trên Supabase thì lấy hoàn toàn từ server, loại bỏ các dòng local cũ tránh nhân đôi số lượng
  const rowsMap = new Map<string, any>();
  const remoteProductCodes = new Set<string>();
  if (rows && rows.length > 0) {
    for (const r of rows) {
      if (r.id && (deletedIds.has(String(r.id)) || (r.lsx && deletedIds.has(String(r.lsx))))) continue;
      const rawMa = String(r.ma_sp || r.maSP || "").trim().toUpperCase();
      if (rawMa) remoteProductCodes.add(rawMa);
      if (r.id) rowsMap.set(String(r.id), r);
    }
  }
  if (localKho && localKho.length > 0) {
    for (const r of localKho) {
      if (r.id && (deletedIds.has(String(r.id)) || (r.lsx && deletedIds.has(String(r.lsx))))) continue;
      const rawMa = String(r.ma_sp || r.maSP || "").trim().toUpperCase();
      if (rawMa && remoteProductCodes.has(rawMa)) continue; // Bỏ qua cache local nếu server đã có sản phẩm này
      if (r.id && !rowsMap.has(String(r.id))) rowsMap.set(String(r.id), r);
    }
  }
  const effectiveRows = rowsMap.size > 0 ? Array.from(rowsMap.values()) : (rows && rows.length > 0 ? rows : localKho);

  const uniqueRows = Array.from(new Map(effectiveRows.map(r => [r.id, r])).values())
    .filter(r => !deletedIds.has(String(r.id)) && (!r.lsx || !deletedIds.has(String(r.lsx))));

  const result: DanhMucKhoThanhPham = {};
  for (const r of uniqueRows) {
    const maSP = r.ma_sp || r.maSP;
    if (!maSP) continue;
    
    const soLuongThat = Number(r.so_luong || r.soLuong) || 0;
    const isCon = r.trang_thai === "con" || r.trangThai === "con";
    let sizes: TonKhoTheoSize = [];
    if (isCon && soLuongThat > 0) {
      sizes = Array.isArray(r.chi_tiet_size || r.chiTietSize) && (r.chi_tiet_size || r.chiTietSize).length > 0
        ? (r.chi_tiet_size || r.chiTietSize).map((x: any) => ({ size: x.size, sl: Number(x.sl) || 0 }))
        : (r.size ? [{ size: r.size, sl: soLuongThat }] : []);
        
      sizes = damBaoChiTietSize(sizes, soLuongThat, r.size);
    } else {
      const rawSizes = Array.isArray(r.chi_tiet_size || r.chiTietSize) ? (r.chi_tiet_size || r.chiTietSize) : [];
      sizes = rawSizes.map((x: any) => ({ size: x.size, sl: 0 }));
    }
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
    const color = String(r.mau || "Mặc định").trim();
    const existing = item.mau.find((x) => x.ten.trim().toLowerCase() === color.toLowerCase());
    
    const imgToUse = extractImage(r);

    if (existing) {
      if (soLuongThat > 0 && isCon) {
        existing.sizes = congDonSize(existing.sizes, sizes);
      }
      if (imgToUse) {
        if (!existing.img || existing.img.startsWith("/product-models/") || !imgToUse.startsWith("/product-models/")) {
          existing.img = imgToUse;
        }
      }
    } else {
      item.mau.push({ ten: color, img: imgToUse, sizes });
    }
  }

  // Thiết lập ảnh đại diện tổng của sản phẩm từ ảnh thật trong kho
  for (const item of Object.values(result)) {
    const realStockImg = item.mau.find(m => m.img && !m.img.startsWith("/product-models/") && m.sizes.some(s => s.sl > 0))?.img;
    const realImg = item.mau.find(m => m.img && !m.img.startsWith("/product-models/"))?.img;
    item.hinhAnh = realStockImg || realImg || item.mau[0]?.img || "";
  }

  return result;
}

export function layDanhMucKhoThanhPhamSync(): DanhMucKhoThanhPham {
  const localKho = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("mimin_kho_thanh_pham_v2") || "[]") : [];
  const deletedIds = getDeletedKhoIds();
  const uniqueRows = (Array.from(new Map(localKho.map((r: any) => [r.id, r])).values()) as any[])
    .filter(r => !deletedIds.has(String(r.id)) && (!r.lsx || !deletedIds.has(String(r.lsx))));

  const result: DanhMucKhoThanhPham = {};
  for (const r of uniqueRows) {
    const maSP = r.ma_sp || r.maSP;
    if (!maSP) continue;
    
    const soLuongThat = Number(r.so_luong || r.soLuong) || 0;
    const isCon = r.trang_thai === "con" || r.trangThai === "con";
    let sizes: TonKhoTheoSize = [];
    if (isCon && soLuongThat > 0) {
      sizes = Array.isArray(r.chi_tiet_size || r.chiTietSize) && (r.chi_tiet_size || r.chiTietSize).length > 0
        ? (r.chi_tiet_size || r.chiTietSize).map((x: any) => ({ size: x.size, sl: Number(x.sl) || 0 }))
        : (r.size ? [{ size: r.size, sl: soLuongThat }] : []);
        
      sizes = damBaoChiTietSize(sizes, soLuongThat, r.size);
    } else {
      const rawSizes = Array.isArray(r.chi_tiet_size || r.chiTietSize) ? (r.chi_tiet_size || r.chiTietSize) : [];
      sizes = rawSizes.map((x: any) => ({ size: x.size, sl: 0 }));
    }
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
    const color = String(r.mau || "Mặc định").trim();
    const existing = item.mau.find((x) => x.ten.trim().toLowerCase() === color.toLowerCase());
    
    const imgToUse = extractImage(r);

    if (existing) {
      if (soLuongThat > 0 && isCon) {
        existing.sizes = congDonSize(existing.sizes, sizes);
      }
      if (imgToUse) {
        if (!existing.img || existing.img.startsWith("/product-models/") || !imgToUse.startsWith("/product-models/")) {
          existing.img = imgToUse;
        }
      }
    } else {
      item.mau.push({ ten: color, img: imgToUse, sizes });
    }
  }

  // Thiết lập ảnh đại diện tổng của sản phẩm từ ảnh thật trong kho
  for (const item of Object.values(result)) {
    const realStockImg = item.mau.find(m => m.img && !m.img.startsWith("/product-models/") && m.sizes.some(s => s.sl > 0))?.img;
    const realImg = item.mau.find(m => m.img && !m.img.startsWith("/product-models/"))?.img;
    item.hinhAnh = realStockImg || realImg || item.mau[0]?.img || "";
  }

  return result;
}
