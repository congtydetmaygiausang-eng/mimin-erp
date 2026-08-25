// ============ TYPES + CONSTANTS + HELPERS ============
// Tach tu page.tsx (2026-08-05 - toi uu B.2)

import { ALL_REAL_PHIEU } from "@/lib/real-workflow-data";
import type { PhieuWorkflow } from "@/lib/workflow-data";
import { MORE_LSX } from "@/lib/more-workflow-data";
import { SIZE_RATIO_PRESETS } from "@/lib/size-ratio-presets";

// Combine tất cả phiếu workflow
export const ALL_PHIEU: PhieuWorkflow[] = [...ALL_REAL_PHIEU, ...(MORE_LSX as any)];

// Danh sách tỉ lệ size — lấy từ preset chung
export const DS_TI_LE_SIZE = SIZE_RATIO_PRESETS.map((p) => p.label);

export const DS_KHU_KE_HANG = [
  "Khu A1", "Khu A2", "Khu A3", "Khu A4", "Khu A5", "Khu A6",
  "Khu B1", "Khu B2", "Khu B3", "Khu B4", "Khu C1"
];

// ============ TYPES ============
export interface SanPhamTP {
  id: string;
  maSP: string;
  tenSP: string;
  phanLoai: string;
  mau: string;
  size: string;
  lsx: string;
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
  hinhAnh?: string[];
  imgQuan?: string; // Ảnh thứ 2 (áo mặt sau / quần bộ) - lấy nguyên từ mau.imgQuan của lệnh cắt gốc
  video?: string;
  chiTietSize?: { size: string; sl: number }[];
}

export const STORAGE_KEY = "mimin_kho_thanh_pham_v2";

// Map 1 row Supabase (snake_case) -> SanPhamTP (camelCase app model).
// KHONG dung camelToSnake/snakeToCamel tu dong vi no bien ma_sp -> maSp
// (mat hoa "SP"), giong van de da gap voi kho-store.tsx/giao_dich_kho.
export function fromSupabaseRow(r: any): SanPhamTP {
  return {
    id: String(r.id),
    maSP: r.ma_sp ?? "",
    tenSP: r.ten_sp ?? "",
    phanLoai: r.phan_loai ?? "",
    mau: r.mau ?? "",
    size: r.size ?? "",
    lsx: r.lsx ?? "",
    ngayNhap: r.ngay_nhap ?? "",
    soLuong: Number(r.so_luong) || 0,
    donGia: Number(r.don_gia) || 0,
    giaTri: Number(r.gia_tri) || 0,
    viTri: r.vi_tri ?? "",
    trangThai: (r.trang_thai as SanPhamTP["trangThai"]) ?? "con",
    khachHang: r.khach_hang ?? undefined,
    tiLeSize: r.ti_le_size ?? undefined,
    ghiChu: r.ghi_chu ?? undefined,
    giaBanLe: r.gia_ban_le != null ? Number(r.gia_ban_le) : undefined,
    giaBanSi: r.gia_ban_si != null ? Number(r.gia_ban_si) : undefined,
    giaVon: r.gia_von != null ? Number(r.gia_von) : undefined,
    giaBanLo: r.gia_ban_lo != null ? Number(r.gia_ban_lo) : undefined,
    hinhAnh: Array.isArray(r.hinh_anh) ? r.hinh_anh : undefined,
    imgQuan: r.img_quan ?? undefined,
    video: r.video ?? undefined,
    chiTietSize: Array.isArray(r.chi_tiet_size) ? r.chi_tiet_size : undefined,
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
    hinh_anh: sp.hinhAnh ?? null,
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
      lsx: p.lenhSX,
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
