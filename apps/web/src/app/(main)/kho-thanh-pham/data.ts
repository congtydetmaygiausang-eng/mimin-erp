// ============ TYPES + CONSTANTS + HELPERS ============
// Tach tu page.tsx (2026-08-05 - toi uu B.2)

import { ALL_REAL_PHIEU } from "@/lib/real-workflow-data";
import type { PhieuWorkflow } from "@/lib/workflow-data";
import { MORE_LSX } from "@/lib/more-workflow-data";
import { SIZE_RATIO_PRESETS } from "@/lib/size-ratio-presets";
import type { KenhBan as KenhBanBangGia } from "@/lib/data/bang-gia-store";

// Combine tất cả phiếu workflow
export const ALL_PHIEU: PhieuWorkflow[] = [...ALL_REAL_PHIEU, ...(MORE_LSX as any)];

// Danh sách tỉ lệ size — lấy từ preset chung
export const DS_TI_LE_SIZE = SIZE_RATIO_PRESETS.map((p) => p.label);

export const DS_KHU_KE_HANG = [
  // Bộ
  "Bộ - Khu A", "Bộ - Khu B", "Bộ - Khu C", "Bộ - Khu D", "Bộ - Khu E", "Bộ - Khu F",
  // Áo
  "Áo - Khu A", "Áo - Khu B", "Áo - Khu C", "Áo - Khu D", "Áo - Khu E", "Áo - Khu F",
  // Áo Sale
  "Áo Sale - Khu A", "Áo Sale - Khu B", "Áo Sale - Khu C", "Áo Sale - Khu D", "Áo Sale - Khu E", "Áo Sale - Khu F",
];


export type KenhBan = KenhBanBangGia;

export const DS_KENH_BAN: { value: KenhBan; label: string }[] = [
  { value: "ban-le", label: "Bán lẻ" },
  { value: "ban-si", label: "Bán sỉ" },
  { value: "ban-lo", label: "Bán lô" },
  { value: "tiktok", label: "TikTok Shop" },
  { value: "shopee", label: "Shopee" },
];

// ============ TYPES ============
export interface SanPhamTP {
  id: string;
  maSP: string;
  tenSP: string;
  phanLoai: string;
  loaiSP?: string;
  mau: string;
  size: string;
  /** Mã lô tồn kho, luôn dùng prefix LTK-. Giữ tên lsx để tương thích dữ liệu cũ. */
  lsx: string;
  /** Mã lệnh cắt nguồn nếu hàng được nhập từ quy trình sản xuất. */
  maLenhCat?: string;
  ngayNhap: string;
  soLuong: number;
  donGia: number;
  giaTri: number;
  viTri: string;
  trangThai: "con" | "dat-hang" | "xuat-kho" | "khong-dat";
  khachHang?: string;
  tiLeSize?: string;
  ghiChu?: string;
  // Chi tiết theo từng màu (biến thể) - thêm 2026-08-18
  giaBanLe?: number;
  giaBanSi?: number;
  // Thêm 2026-08-24: giá vốn (nhập kho) + giá bán theo lô, phục vụ nhập lô
  // hàng tồn kho hiện tại nhiều biến thể cùng lúc.
  giaVon?: number;
  giaBanLo?: number;
  giaTikTok?: number;
  giaShopee?: number;
  kenhBan?: KenhBan[];
  hinhAnh?: string[];
  imgQuan?: string; // Ảnh thứ 2 (áo mặt sau / quần bộ) - lấy nguyên từ mau.imgQuan của lệnh cắt gốc
  video?: string;
  chiTietSize?: { size: string; sl: number }[];
  maSKU?: string; // Mã SKU phân loại (từ Danh Mục SP)
  thuongHieu?: "Man PJ" | "Polomimin" | string; // Thuong hieu
}

export const STORAGE_KEY = "mimin_kho_thanh_pham_v2";

/** Chuẩn hóa mã nguồn kho cũ: lệnh sản xuất thành phẩm phải trỏ về mã lệnh cắt LC. */
export function chuanHoaMaNguonKho(value: string): string {
  const code = value.trim().toUpperCase();
  const legacy = code.match(/^LSX-(\d{4})-(\d+)$/);
  return legacy ? `LC-${legacy[1]}-${legacy[2].padStart(4, "0")}` : code;
}

export function taoMaLoTonKhoTheoDong(id: string, ngayNhap: string): string {
  const ngay = (ngayNhap || new Date().toISOString().slice(0, 10)).replaceAll("-", "");
  const suffix = id.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(-6).padStart(6, "0");
  return `LTK-${ngay}-${suffix}`;
}

/** Chốt tại lớp hiển thị để dữ liệu/cache cũ tuyệt đối không lộ mã LC/LSX ở vị trí mã lô. */
export function layMaLoTonKho(sp: Pick<SanPhamTP, "id" | "ngayNhap" | "lsx">): string {
  return sp.lsx?.toUpperCase().startsWith("LTK-")
    ? sp.lsx.toUpperCase()
    : taoMaLoTonKhoTheoDong(sp.id, sp.ngayNhap);
}

export function hienThiDanhSachSize(
  size: string,
  chiTietSize?: Array<{ size: string; sl: number }>,
): string {
  const danhSach = (chiTietSize || []).filter((item) => item.sl > 0).map((item) => item.size).join(", ");
  if (danhSach) return danhSach;
  if (chiTietSize && chiTietSize.length > 0) {
    const tatCaSizes = chiTietSize.map((item) => item.size).filter(Boolean).join(", ");
    if (tatCaSizes) return tatCaSizes;
  }
  return size.trim().toLocaleLowerCase("vi") === "nhiều size" ? "Chưa có chi tiết size" : size;
}

export function chuanHoaSanPhamKho(sp: SanPhamTP): SanPhamTP {
  const maNguonCu = chuanHoaMaNguonKho(sp.lsx || "");
  const laMaSanXuat = maNguonCu.startsWith("LC-");
  const soLuong = isNaN(Number(sp.soLuong)) ? 0 : Math.max(0, Number(sp.soLuong));
  const donGia = isNaN(Number(sp.donGia)) ? 0 : Math.max(0, Number(sp.donGia));
  let giaTri = Number(sp.giaTri);
  if (isNaN(giaTri) || giaTri <= 0) {
    giaTri = soLuong * (donGia || Number(sp.giaVon) || 0);
  }
  return {
    ...sp,
    soLuong,
    donGia,
    giaTri,
    lsx: laMaSanXuat ? taoMaLoTonKhoTheoDong(sp.id, sp.ngayNhap) : layMaLoTonKho(sp),
    maLenhCat: sp.maLenhCat || (laMaSanXuat ? maNguonCu : undefined),
    size: hienThiDanhSachSize(sp.size || "", sp.chiTietSize),
  };
}

// Map 1 row Supabase (snake_case) -> SanPhamTP (camelCase app model).
// KHONG dung camelToSnake/snakeToCamel tu dong vi no bien ma_sp -> maSp
// (mat hoa "SP"), giong van de da gap voi kho-store.tsx/giao_dich_kho.
export function fromSupabaseRow(r: any): SanPhamTP {
  const chiTietSize = Array.isArray(r.chi_tiet_size) ? r.chi_tiet_size : undefined;
  const maNguonCu = chuanHoaMaNguonKho(r.lsx ?? "");
  const laMaSanXuat = maNguonCu.startsWith("LC-");
  return {
    id: String(r.id),
    maSP: r.ma_sp ?? "",
    tenSP: r.ten_sp ?? "",
    phanLoai: r.phan_loai ?? "",
    mau: r.mau ?? "",
    size: hienThiDanhSachSize(r.size ?? "", chiTietSize),
    lsx: maNguonCu.startsWith("LTK-")
      ? maNguonCu
      : taoMaLoTonKhoTheoDong(String(r.id), r.ngay_nhap ?? ""),
    maLenhCat: r.ma_lenh_cat ?? (laMaSanXuat ? maNguonCu : undefined),
    ngayNhap: r.ngay_nhap ?? "",
    soLuong: isNaN(Number(r.so_luong)) ? 0 : Math.max(0, Number(r.so_luong)),
    donGia: isNaN(Number(r.don_gia)) ? 0 : Math.max(0, Number(r.don_gia)),
    giaTri: !isNaN(Number(r.gia_tri)) && Number(r.gia_tri) > 0
      ? Number(r.gia_tri)
      : (Math.max(0, Number(r.so_luong) || 0) * (Math.max(0, Number(r.don_gia) || 0))),
    viTri: r.vi_tri ?? "",
    trangThai: (r.trang_thai as SanPhamTP["trangThai"]) ?? "con",
    khachHang: r.khach_hang ?? undefined,
    tiLeSize: r.ti_le_size ?? undefined,
    ghiChu: r.ghi_chu ?? undefined,
    giaBanLe: r.gia_ban_le != null ? Number(r.gia_ban_le) : undefined,
    giaBanSi: r.gia_ban_si != null ? Number(r.gia_ban_si) : undefined,
    giaVon: r.gia_von != null ? Number(r.gia_von) : undefined,
    giaBanLo: r.gia_ban_lo != null ? Number(r.gia_ban_lo) : undefined,
    giaTikTok: r.gia_tiktok != null ? Number(r.gia_tiktok) : undefined,
    giaShopee: r.gia_shopee != null ? Number(r.gia_shopee) : undefined,
    kenhBan: Array.isArray(r.kenh_ban) ? r.kenh_ban : ["ban-le"],
    hinhAnh: r.hinh_anh ? (Array.isArray(r.hinh_anh) ? r.hinh_anh : [r.hinh_anh]) : undefined,
    imgQuan: r.img_quan ?? undefined,
    video: r.video ?? undefined,
    chiTietSize,
    maSKU: r.ma_sku ?? r.maSKU ?? undefined,
    thuongHieu: r.thuong_hieu || r.thuongHieu || (r.ncc === "Man PJ" || r.ncc === "Polomimin" ? r.ncc : undefined) || ((r.ma_sp || "").toUpperCase().includes("BPJ") || (r.ten_sp || "").toUpperCase().includes("MANPJ") ? "Man PJ" : "Polomimin"),
  };
}

export function toSupabaseRow(sp: SanPhamTP) {
  return {
    id: sp.id,
    ma_sp: sp.maSP,
    ten_sp: sp.tenSP,
    phan_loai: sp.phanLoai,
    mau: sp.mau,
    size: sp.size,
    lsx: sp.lsx,
    ngay_nhap: sp.ngayNhap,
    so_luong: sp.soLuong,
    don_gia: sp.donGia,
    gia_tri: sp.giaTri,
    vi_tri: sp.viTri,
    trang_thai: sp.trangThai,
    khach_hang: sp.khachHang ?? null,
    ti_le_size: sp.tiLeSize ?? null,
    ghi_chu: sp.ghiChu ?? null,
    gia_ban_le: sp.giaBanLe ?? null,
    gia_ban_si: sp.giaBanSi ?? null,
    gia_von: sp.giaVon ?? null,
    gia_ban_lo: sp.giaBanLo ?? null,
    gia_tiktok: sp.giaTikTok ?? null,
    gia_shopee: sp.giaShopee ?? null,
    kenh_ban: sp.kenhBan?.length ? sp.kenhBan : ["ban-le"],
    hinh_anh: sp.hinhAnh ? (Array.isArray(sp.hinhAnh) ? sp.hinhAnh : [sp.hinhAnh]) : null,
    img_quan: sp.imgQuan ?? null,
    video: sp.video ?? null,
    chi_tiet_size: sp.chiTietSize ?? null,
  };
}

// ============ TRỪ TỒN KHO KHI GIAO HÀNG ============
// Sự kiện phát ra sau khi trừ kho, để trang Kho thành phẩm đang mở tự nạp lại.
export const KHO_TP_CHANGED_EVENT = "mimin:kho-thanh-pham-changed";

export interface DongTruKho {
  /** maSP của sản phẩm (OrderItem.spId) */
  spId: string;
  /** Tên màu (OrderItem.mauTen) - bỏ trống thì trừ trên mọi màu của mã SP */
  mauTen?: string;
  soLuong: number;
  /** Tên hiển thị dùng cho thông báo thiếu hàng */
  tenHienThi?: string;
}

/**
 * Trừ tồn kho thành phẩm theo các dòng của 1 đơn hàng.
 *
 * Đọc lại danh sách MỚI NHẤT từ Supabase trước khi trừ (không tin bản cache trong
 * máy) để 2 đơn giao gần nhau không cùng đọc một số tồn cũ rồi ghi đè nhau.
 *
 * Không chặn giao hàng khi thiếu tồn - hàng có thể đã xuất đi thật; trả về danh
 * sách thiếu để bên gọi cảnh báo cho người dùng biết mà đối chiếu lại.
 */
export async function truTonKhoThanhPham(
  dsTru: DongTruKho[],
  ghiChu: string
): Promise<{ daTru: number; thieu: string[] }> {
  if (typeof window === "undefined" || dsTru.length === 0) return { daTru: 0, thieu: [] };

  const { supabaseFetchAllRaw, supabaseUpsertRaw, checkSupabase } = await import("@/lib/supabase/sync-helper");

  // 1. Lấy danh sách mới nhất
  let ds: SanPhamTP[] = fromStorage<SanPhamTP[]>(STORAGE_KEY, []);
  if (checkSupabase()) {
    try {
      const rows = await supabaseFetchAllRaw<any>("kho_thanh_pham");
      ds = rows.map(fromSupabaseRow);
    } catch (e) {
      console.error("[KhoTP] Không đọc được tồn kho mới nhất, dùng bản trong máy:", e);
    }
  }

  // 2. Trừ dần
  const thieu: string[] = [];
  const daSua = new Map<string, SanPhamTP>();
  let daTru = 0;

  for (const dong of dsTru) {
    if (!dong.soLuong || dong.soLuong <= 0) continue;
    let conCanTru = dong.soLuong;

    const ungVien = ds
      .filter((sp) => sp.maSP === dong.spId && sp.soLuong > 0)
      .filter((sp) => (dong.mauTen ? sp.mau === dong.mauTen : true))
      // Trừ ở dòng nhập kho sớm nhất trước (nhập trước xuất trước)
      .sort((a, b) => (a.ngayNhap || "").localeCompare(b.ngayNhap || ""));

    for (const sp of ungVien) {
      if (conCanTru <= 0) break;
      const hienTai = daSua.get(sp.id) ?? sp;
      const truODay = Math.min(hienTai.soLuong, conCanTru);
      if (truODay <= 0) continue;
      const slMoi = hienTai.soLuong - truODay;
      daSua.set(sp.id, {
        ...hienTai,
        soLuong: slMoi,
        giaTri: slMoi * (hienTai.donGia || 0),
        trangThai: slMoi === 0 ? "xuat-kho" : hienTai.trangThai,
        ghiChu: [hienTai.ghiChu, ghiChu].filter(Boolean).join(" · "),
      });
      conCanTru -= truODay;
      daTru += truODay;
    }

    if (conCanTru > 0) {
      const ten = dong.tenHienThi || dong.spId;
      thieu.push(`${ten}${dong.mauTen ? ` (${dong.mauTen})` : ""}: thiếu ${conCanTru}`);
    }
  }

  if (daSua.size === 0) return { daTru, thieu };

  // 3. Ghi lại
  const dsMoi = ds.map((sp) => daSua.get(sp.id) ?? sp);
  saveStorage(STORAGE_KEY, dsMoi);

  if (checkSupabase()) {
    await Promise.all(
      Array.from(daSua.values()).map((sp) =>
        supabaseUpsertRaw("kho_thanh_pham", toSupabaseRow(sp)).catch((e) =>
          console.error("[KhoTP] Lỗi đồng bộ trừ kho:", e)
        )
      )
    );
  }

  window.dispatchEvent(new CustomEvent(KHO_TP_CHANGED_EVENT));
  return { daTru, thieu };
}

// ============ HELPERS ============
export function fromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const r = localStorage.getItem(key);
    if (r) return JSON.parse(r);
  } catch {}
  return defaultValue;
}

export function saveStorage<T>(key: string, v: T) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
}

/**
 * Sinh danh sách sản phẩm kho thành phẩm chuẩn xác từ 1 Lệnh Cắt (Single Source of Truth).
 * Tự động trích xuất các biến thể màu, size, số lượng, hình ảnh, đơn giá vốn, giá bán.
 */
export function taoSanPhamKhoTuLenhCat(
  lc: any,
  options?: {
    kenhBan?: KenhBan[];
    viTri?: string;
    ngayNhap?: string;
    giaVon1SP?: number;
    layGiaFn?: (kenh: KenhBan, maSP: string, sku?: string, sl?: number) => number | undefined;
  }
): SanPhamTP[] {
  if (!lc) return [];
  const dongGoiPCs = lc.phanCong?.filter(
    (pc: any) =>
      pc.id === "dongGoi" ||
      pc.id === "dong_goi" ||
      pc.tenCongDoan?.toLowerCase().includes("đóng gói")
  ) || [];
  const chiTietMauAll: any[] = dongGoiPCs.flatMap((pc: any) => pc.chiTietMau || []);
  const dsMauLC = lc.dsMau && lc.dsMau.length > 0 ? lc.dsMau : [{ ten: "Mặc định", img: "" }];
  const maSPChuan = lc.maSP || lc.id;
  const phanLoaiChuan =
    lc.loaiSP === "BoTru"
      ? "Bộ Trụ"
      : lc.loaiSP === "AoTru"
      ? "Áo Trụ"
      : lc.loaiSP === "AoCoTron"
      ? "Áo Cổ Tròn"
      : lc.loaiSP === "BoCoTron"
      ? "Bộ Cổ Tròn"
      : lc.loaiSP === "AoPolo"
      ? "Áo Polo"
      : lc.loaiSP === "PhuKien"
      ? "Phụ Kiện"
      : lc.loaiSP || "Bộ Trụ";

  const anhDaiDien =
    lc.hinhAnh ||
    (maSPChuan && /^M\d{2}$/i.test(maSPChuan) ? `/product-models/${maSPChuan}.png` : "") ||
    lc.hinhMauInTheu ||
    "";

  const ngayNhap = options?.ngayNhap || lc.hanHoanThanh || new Date().toISOString().slice(0, 10);
  const giaVon1SP =
    options?.giaVon1SP ||
    Math.round(
      lc.bangCOGS?.giaVonBinhQuan ||
        lc.bangCOGS?.giaVon1SP ||
        (lc as any).giaVonDuKien ||
        (lc as any).donGia ||
        32250
    );
  const kenhBan = options?.kenhBan || ["ban-le", "ban-si"];
  const viTri = options?.viTri || "Khu A1";

  return dsMauLC.map((m: any, idx: number) => {
    const ct = chiTietMauAll.find((c: any) => c.mau === m.ten);
    const rawSl = ct?.soLuongDat ?? m.slThucTe ?? m.slDuKien ?? Math.round((Number(lc.tongSL) || 0) / (dsMauLC.length || 1));
    const sl = isNaN(Number(rawSl)) ? 0 : Math.max(0, Number(rawSl));
    const chiTietSize = (ct?.sizes || m.phanBoSize || []) as Array<{ size: string; sl: number }>;
    const strTiLeSize = chiTietSize
      .filter((item) => item.sl > 0)
      .map((item) => `${item.size}:${item.sl}`)
      .join(", ");
    const variantKey = String(m.maSKU || m.ten || idx)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .toUpperCase();
    const anhMau = m.img || anhDaiDien;

    const giaVonNum = isNaN(Number(giaVon1SP)) ? 32250 : Number(giaVon1SP);
    const giaBanSi = options?.layGiaFn?.("ban-si", lc.maSP, m.maSKU, Math.max(1, sl)) || Math.round(giaVonNum * 1.5);
    const giaBanLe = options?.layGiaFn?.("ban-le", lc.maSP, m.maSKU, Math.max(1, sl)) || Math.round(giaVonNum * 2);
    const giaBanLo = options?.layGiaFn?.("ban-lo", lc.maSP, m.maSKU, Math.max(1, sl)) || Math.round(giaVonNum * 1.3);
    const giaTikTok = options?.layGiaFn?.("tiktok", lc.maSP, m.maSKU, Math.max(1, sl)) || Math.round(giaVonNum * 1.8);
    const giaShopee = options?.layGiaFn?.("shopee", lc.maSP, m.maSKU, Math.max(1, sl)) || Math.round(giaVonNum * 1.8);

    return {
      id: `TP-${lc.id}-${variantKey}`,
      maSP: maSPChuan,
      tenSP: lc.tenSP || `Sản phẩm từ ${lc.id}`,
      phanLoai: phanLoaiChuan,
      mau: m.ten,
      size: chiTietSize.filter((item) => item.sl > 0).map((item) => item.size).join(", ") || "Chưa có size",
      lsx: taoMaLoTonKhoTheoDong(`TP-${lc.id}-${variantKey}`, ngayNhap),
      maLenhCat: lc.id,
      ngayNhap,
      soLuong: sl,
      donGia: giaVonNum,
      giaTri: sl * giaVonNum,
      giaVon: giaVonNum,
      giaBanSi: kenhBan.includes("ban-si") ? giaBanSi : 0,
      giaBanLe: kenhBan.includes("ban-le") ? giaBanLe : 0,
      giaBanLo: kenhBan.includes("ban-lo") ? giaBanLo : 0,
      giaTikTok: kenhBan.includes("tiktok") ? giaTikTok : 0,
      giaShopee: kenhBan.includes("shopee") ? giaShopee : 0,
      kenhBan,
      viTri,
      trangThai: "con",
      hinhAnh: anhMau ? [anhMau] : [],
      imgQuan: m.imgQuan || undefined,
      chiTietSize,
      tiLeSize: strTiLeSize,
    } as SanPhamTP;
  }).filter((sp: SanPhamTP) => sp.soLuong > 0);
}

// Tự động generate danh sách SP thành phẩm từ các phiếu DG_ (Đóng gói) hoàn thành
export function generateSanPhamFromWorkflow(): SanPhamTP[] {
  const ds = ALL_PHIEU.filter((p: any) => (p.id || "").startsWith("DG_") && p.trangThai === "Hoàn thành");
  return ds.map((p: any, i) => {
    const sl = p.soLuongDat || 0;
    const dg = p.donGia || 0;
    return {
      id: p.id,
      maSP: p.maSP,
      tenSP: p.phanLoai,
      phanLoai: p.phanLoai,
      mau: p.mau || "Trắng",
      size: p.size || "M",
      lsx: taoMaLoTonKhoTheoDong(String(p.id), p.ngayHoanThanh || ""),
      maLenhCat: chuanHoaMaNguonKho(p.lenhSX || ""),
      ngayNhap: p.ngayHoanThanh || new Date().toISOString().slice(0, 10),
      soLuong: sl,
      donGia: dg * 5, // Đơn giá bán = 5x công may
      giaTri: sl * dg * 5,
      viTri: `Kệ ${String.fromCharCode(65 + Math.floor(i / 5))}${(i % 5) + 1}-${(i % 5) + 2}`,
      trangThai: "con",
      ghiChu: p.ghiChu,
    } as SanPhamTP;
  });
}
