// Inventory Engine - Tính màn (định mức vải) + Trừ tồn kho tự động
// Phase 1: Hoàn tất logic cốt lõi

import type { PhieuWorkflow } from "./workflow-data";
import { KHO_VAI, KHO_VAT_TU, type KhoVai } from "./data/real-data";
import { logAudit } from "./audit-log";


// ============ ĐỊNH MỨC VẢI (m/cái) theo sản phẩm + size ============
export const DINH_MUC_VAI: Record<string, Record<string, number>> = {
  "Áo thun cotton": { S: 0.95, M: 1.05, L: 1.15, XL: 1.25, XXL: 1.35, "2XL": 1.35, "3XL": 1.45 },
  "Áo trụ": { S: 1.05, M: 1.15, L: 1.25, XL: 1.35, XXL: 1.45, "2XL": 1.45, "3XL": 1.55 },
  "Áo polo": { S: 1.15, M: 1.25, L: 1.35, XL: 1.45, XXL: 1.55, "2XL": 1.55 },
  "Áo sơ mi nữ": { S: 1.25, M: 1.35, L: 1.45, XL: 1.55 },
  "Áo sơ mi nam": { S: 1.35, M: 1.45, L: 1.55, XL: 1.65, XXL: 1.75 },
  "Quần": { S: 0.95, M: 1.05, L: 1.15, XL: 1.25, XXL: 1.35, "2XL": 1.35, "3XL": 1.45 },
  "Quần thể thao": { S: 1.0, M: 1.1, L: 1.2, XL: 1.3, XXL: 1.4, "2XL": 1.4 },
  "Quần kaki": { S: 1.0, M: 1.1, L: 1.2, XL: 1.3 },
  "Bộ trụ trơn": { S: 2.0, M: 2.2, L: 2.4, XL: 2.6, XXL: 2.8, "2XL": 2.8, "3XL": 3.0 },
  "Bộ thể thao nam": { S: 2.1, M: 2.3, L: 2.5, XL: 2.7, XXL: 2.9, "2XL": 2.9 },
  "Bộ thể thao": { S: 2.0, M: 2.2, L: 2.4, XL: 2.6 },
  "Bộ trắng": { S: 2.0, M: 2.2, L: 2.4, XL: 2.6, XXL: 2.8, "2XL": 2.8 },
};

export const HAO_HUT_MAC_DINH: Record<string, number> = {
  "Vải thun": 5,
  "Vải polo": 7,
  "Vải sơ mi": 8,
  "Vải quần": 6,
  "Vải bộ": 7,
  "Vải kaki": 5,
  "default": 5,
};

export interface TinhManResult {
  soMetCan: number;
  soMetGoc: number;
  soMetHaoHut: number;
  tyLeHaoHut: number;
  chiTiet: { size: string; sl: number; dinhMuc: number; tong: number }[];
  warning?: string;
}

export function tinhMan(
  phanLoai: string | undefined,
  sizeSL: Record<string, number>,
  loaiVai: string = "default",
  haoHutCustom?: number
): TinhManResult {
  const dinhMuc = phanLoai ? DINH_MUC_VAI[phanLoai] : undefined;
  if (!dinhMuc) {
    return {
      soMetCan: 0, soMetGoc: 0, soMetHaoHut: 0, tyLeHaoHut: 0,
      chiTiet: [], warning: `Chưa có định mức cho "${phanLoai}"`,
    };
  }

  const tyLeHaoHut = haoHutCustom ?? HAO_HUT_MAC_DINH[loaiVai] ?? HAO_HUT_MAC_DINH["default"];
  let soMetGoc = 0;
  const chiTiet: { size: string; sl: number; dinhMuc: number; tong: number }[] = [];
  let warning: string | undefined;

  for (const [size, sl] of Object.entries(sizeSL)) {
    const dinhMucSize = dinhMuc[size];
    if (dinhMucSize === undefined) {
      warning = (warning || "") + `Size ${size} không có định mức. `;
      continue;
    }
    const tong = sl * dinhMucSize;
    soMetGoc += tong;
    chiTiet.push({ size, sl, dinhMuc: dinhMucSize, tong });
  }

  const soMetHaoHut = soMetGoc * (tyLeHaoHut / 100);
  const soMetCan = soMetGoc + soMetHaoHut;

  return {
    soMetCan: round(soMetCan, 2),
    soMetGoc: round(soMetGoc, 2),
    soMetHaoHut: round(soMetHaoHut, 2),
    tyLeHaoHut,
    chiTiet,
    warning,
  };
}

export function parseSize(slGiao: number, sizeStr: string | undefined): Record<string, number> {
  const sizes = (sizeStr || "M").split(/[,/]/).map((s) => s.trim()).filter(Boolean);
  if (sizes.length === 0) return { M: slGiao };
  const slMoiSize = Math.floor(slGiao / sizes.length);
  const du = slGiao - slMoiSize * sizes.length;
  const result: Record<string, number> = {};
  sizes.forEach((s, i) => {
    result[s] = slMoiSize + (i < du ? 1 : 0);
  });
  return result;
}

export function goiYVai(phanLoai: string | undefined, mau: string | undefined): KhoVai | undefined {
  const mapping: Record<string, string> = {
    "Trắng ngà": "V-TRANG003",
    "Trắng": "V-TRANG003",
    "Đen": "V-DENNANO",
    "Xanh navy": "V-XANHDENCM",
    "Xám": "V-XAMCHI035",
    "Be": "V-COUA044",
    "Kem": "V-KEM3",
    "Hồng pastel": "V-MAU11",
    "Đỏ": "V-DO112",
  };
  const firstVT = KHO_VAI[0] || null;
  const maVT = (mau ? mapping[mau] : undefined) || (firstVT ? firstVT.maVT : "");
  return KHO_VAI.find((v: KhoVai) => v.maVT === maVT);
}

export interface TruTonKhoResult {
  ok: boolean;
  maVT?: string;
  tenVT?: string;
  soMetTru?: number;
  tonKhoTruoc?: number;
  tonKhoSau?: number;
  warning?: string;
  message: string;
}

import { supabase, isSupabaseEnabled } from "@/lib/supabase/client";

const TON_KHO_KEY = "mimin_kho_vai_inventory";

export function getInventory(): Record<string, KhoVai> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(TON_KHO_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const init: Record<string, KhoVai> = {};
  KHO_VAI.forEach((v) => {
    init[v.maVT] = { ...v, tonKho: 500 };
  });
  localStorage.setItem(TON_KHO_KEY, JSON.stringify(init));
  return init;
}

export function saveInventory(inv: Record<string, KhoVai>) {
  localStorage.setItem(TON_KHO_KEY, JSON.stringify(inv));
  
  // Async fire-and-forget sync to Supabase
  if (isSupabaseEnabled && supabase) {
    Promise.all(Object.values(inv).map(async (v) => {
      const payload = {
        sku: v.maVT,
        ten: v.tenVT,
        sl: v.tonKho,
        don_vi: v.dvt || "kg",
        don_gia: v.donGia || 0,
        loai: "vai",
      };
      await supabase!.from("kho").upsert(payload, { onConflict: "sku" });
    })).catch(console.error);
  }
}

export async function syncInventoryWithSupabase(): Promise<void> {
  if (!isSupabaseEnabled || !supabase) return;
  try {
    // 2026-08-08 - Fix 404: bang kho co the chua ton tai, query khong crash
    const { data, error } = await supabase!.from("kho").select("sku, ton_kho").eq("loai", "vai");
    if (error) {
      // 404 = bang chua ton tai, 400 = schema chua co loai column
      // Silent fail - van dung localStorage
      if (error.code !== "PGRST116" && error.code !== "PGRST205") {
        console.warn("[inventory] Supabase sync skipped:", error.message);
      }
      return;
    }
    if (data && data.length > 0) {
      const current = getInventory();
      let changed = false;
      data.forEach((d: any) => {
        if (current[d.sku]) {
          current[d.sku].tonKho = d.ton_kho ?? d.tonKho ?? 0;
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem(TON_KHO_KEY, JSON.stringify(current));
      }
    }
  } catch (err) {
    console.warn("[inventory] Sync error (silent):", err);
  }
}

export function getAllInventory(): KhoVai[] {
  return Object.values(getInventory());
}

export function getInventoryByMaVT(maVT: string): KhoVai | undefined {
  return getInventory()[maVT];
}

export function truTonKho(phieu: PhieuWorkflow, user: any): TruTonKhoResult[] {
  const inv = getInventory();
  const results: TruTonKhoResult[] = [];

  const vai = goiYVai(phieu.phanLoai || "", phieu.mau || "");
  if (!vai || !vai.maVT) {
    results.push({
      ok: false,
      message: `Không tìm thấy vải cho màu "${phieu.mau || "N/A"}" của "${phieu.phanLoai}"`,
    });
    return results;
  }
  const maVT: string = vai.maVT;

  const sizeSL = parseSize(phieu.soLuongGiao, phieu.size);
  const tinh = tinhMan(phieu.phanLoai, sizeSL, "default");

  if (tinh.soMetCan === 0) {
    results.push({ ok: false, message: tinh.warning || "Không tính được màn" });
    return results;
  }

  const kgPerMet = 0.25;
  const kgCan = round(tinh.soMetCan * kgPerMet, 2);

  const v = inv[maVT];
  if (!v) {
    results.push({ ok: false, message: `Vải ${maVT} không có trong kho` });
    return results;
  }

  const tonKhoTruoc = v.tonKho;
  if (tonKhoTruoc < kgCan) {
    results.push({
      ok: false,
      maVT, tenVT: vai.tenVT,
      soMetTru: kgCan, tonKhoTruoc,
      message: `⚠️ Không đủ vải ${vai.tenVT}: tồn ${tonKhoTruoc}kg, cần ${kgCan}kg (thiếu ${(kgCan - tonKhoTruoc).toFixed(2)}kg)`,
    });
    return results;
  }

  const tonKhoSau = round(tonKhoTruoc - kgCan, 2);
  inv[maVT] = { ...v, tonKho: tonKhoSau };
  saveInventory(inv);

  results.push({
    ok: true,
    maVT, tenVT: vai.tenVT,
    soMetTru: kgCan, tonKhoTruoc, tonKhoSau,
    message: `✅ Trừ kho ${vai.tenVT}: -${kgCan}kg (${tonKhoTruoc}kg → ${tonKhoSau}kg)`,
  });

  logAudit({
    user, action: "update", module: "kho-vai",
    description: `Trừ kho vải ${vai.tenVT}: -${kgCan}kg cho phiếu ${phieu.id}`,
    resourceId: phieu.id, resourceName: phieu.id, success: true,
  });

  return results;
}

export function nhapKho(
  maVT: string,
  soLuong: number,
  user: any,
  ghiChu: string = "",
  options?: {
    ngay?: string;             // YYYY-MM-DD, mặc định hôm nay
    donGia?: number;           // đ/kg, mặc định lấy từ v.donGia
    nguonNhap?: string;        // NCC, mặc định rỗng
    nguoiThucHien?: string;    // Người thực hiện, mặc định user.name
  }
): TruTonKhoResult {
  const inv = getInventory();
  const v = inv[maVT];
  if (!v) {
    return { ok: false, message: `Vải ${maVT} không có trong kho` };
  }
  const tonKhoTruoc = v.tonKho;
  const tonKhoSau = round(tonKhoTruoc + soLuong, 2);
  // Cập nhật đơn giá nếu có truyền vào (giúp đồng bộ giá mới nhất từ NCC)
  const donGiaMoi = options?.donGia ?? v.donGia;
  inv[maVT] = { ...v, tonKho: tonKhoSau, donGia: donGiaMoi };
  saveInventory(inv);

  // Build mô tả audit log đầy đủ hơn
  const nguonNhap = options?.nguonNhap ? ` NCC=${options.nguonNhap}` : "";
  const donGiaDesc = options?.donGia ? ` đơn giá=${options.donGia.toLocaleString()}đ` : "";
  const nguoiThucHien = options?.nguoiThucHien ? ` bởi ${options.nguoiThucHien}` : "";
  const ngayDesc = options?.ngay ? ` ngày ${options.ngay}` : "";

  logAudit({
    user, action: "create", module: "kho-vai",
    description: `Nhập kho ${v.tenVT}: +${soLuong}kg (${tonKhoTruoc}kg → ${tonKhoSau}kg)${donGiaDesc}${nguonNhap}${nguoiThucHien}${ngayDesc}. ${ghiChu}`,
    resourceId: maVT, success: true,
    newValue: { soLuong, donGia: donGiaMoi, nguonNhap, nguoiThucHien: options?.nguoiThucHien, ngay: options?.ngay, ghiChu },
  });

  return {
    ok: true, maVT, tenVT: v.tenVT,
    soMetTru: soLuong, tonKhoTruoc, tonKhoSau,
    message: `✅ Nhập kho ${v.tenVT}: +${soLuong}kg`,
  };
}

export function resetInventory() {
  localStorage.removeItem(TON_KHO_KEY);
}

/** Reset về 0kg (không phải 500kg) — dùng khi nhập kho thực tế từ đầu */
export function resetInventoryToZero() {
  const inv = getInventory();
  Object.keys(inv).forEach((maVT) => {
    inv[maVT] = { ...inv[maVT], tonKho: 0 };
  });
  saveInventory(inv);
}

/** Cập nhật tonKho trực tiếp cho 1 loại vải (dùng khi chỉnh sửa thủ công) */
export function updateTonKho(maVT: string, tonKhoMoi: number): boolean {
  const inv = getInventory();
  if (!inv[maVT]) return false;
  inv[maVT] = { ...inv[maVT], tonKho: Math.max(0, tonKhoMoi) };
  saveInventory(inv);
  return true;
}

/** Cập nhật thông tin chung của 1 loại vải (tên, màu, đơn giá, tồn kho) */
export function updateVaiInfo(maVT: string, update: Partial<KhoVai>): boolean {
  const inv = getInventory();
  if (!inv[maVT]) return false;
  inv[maVT] = { ...inv[maVT], ...update };
  saveInventory(inv);
  return true;
}

function round(n: number, digits: number = 2): number {
  const f = Math.pow(10, digits);
  return Math.round(n * f) / f;
}

export interface BaoCaoVai {
  phieuId: string;
  lenhSX: string;
  maSP: string;
  phanLoai?: string;
  mau?: string;
  vai: string;
  soMetCan: number;
  soMetDat: number;
  soMetTon: number;
  donGiaVai: number;
  tienVai: number;
  ngayCat?: string;
}

export function baoCaoVaiTheoLSX(phieus: PhieuWorkflow[], lenhSX: string): BaoCaoVai[] {
  const cats = phieus.filter((p) => p.lenhSX === lenhSX && p.id.startsWith("CAT_"));
  return cats.map((p) => {
    const vai = goiYVai(p.phanLoai, p.mau);
    const sizeSL = parseSize(p.soLuongGiao, p.size);
    const tinh = tinhMan(p.phanLoai, sizeSL);
    const soMetDat = tinh.soMetCan * (p.soLuongDat / Math.max(1, p.soLuongGiao));
    const donGiaVai = vai?.donGia || 0;
    return {
      phieuId: p.id,
      lenhSX: p.lenhSX,
      maSP: p.maSP,
      phanLoai: p.phanLoai,
      mau: p.mau,
      vai: vai?.tenVT || "N/A",
      soMetCan: tinh.soMetCan,
      soMetDat: round(soMetDat, 2),
      soMetTon: round(tinh.soMetCan - soMetDat, 2),
      donGiaVai,
      tienVai: round(soMetDat * donGiaVai, 0),
      ngayCat: p.ngayHoanThanh,
    };
  });
}

// ============ TỰ ĐỘNG XUẤT KHO KHI CHUYỂN TRẠNG THÁI LỆNH CẮT → ĐANG CẮT ============
// Ghi 1 phiếu XUAT vào kho-store cho mỗi loại vải và phụ liệu trong Lệnh cắt
// Hàm này ghi vào localStorage key "mimin_kho_vai_v2" (cùng storage với kho-store.tsx)

const KHO_STORE_KEY = "mimin_kho_vai_v2";

export type KetQuaXuatKho = {
  ok: boolean;
  maVT: string;
  tenVT: string;
  soLuong: number;
  donVi: string;
  message: string;
};

// Ghi 1 giao dịch XUAT vào kho-store
function ghiXuatKho(
  maVT: string,
  tenVT: string,
  soLuong: number,
  donVi: string,
  donGia: number,
  lenhCatId: string,
  nguoiThucHien: string,
  ngay: string
): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(KHO_STORE_KEY);
    const dsGD = raw ? JSON.parse(raw) : [];
    const nextNum = dsGD.length + 1;
    const newGD = {
      id: `GD-${String(nextNum).padStart(3, "0")}-${Date.now()}`,
      ngay,
      loai: "XUAT",
      maVT,
      tenVT,
      soLuong,
      donVi,
      donGia,
      thanhTien: soLuong * donGia,
      nguonNhap: lenhCatId, // dùng nguonNhap để ghi lệnh cắt nguồn
      nguoiThucHien,
      ghiChu: `Tự động xuất kho theo ${lenhCatId}`,
    };
    dsGD.push(newGD);
    localStorage.setItem(KHO_STORE_KEY, JSON.stringify(dsGD));
  } catch (e) {
    console.error("[inventory] ghiXuatKho error:", e);
  }
}

export function xuatKhoChoLenhCat(
  lenhCat: {
    id: string;
    tongSL: number;
    dsMau: Array<{ maVai: string; dinhMuc: number; slDuKien: number; haoHut?: number; maVaiQuan?: string; dinhMucQuan?: number }>;
    dsPhuLieu: Array<{ maPL: string; tenPL: string; soLuong: number; donGia: number; dvt: string }>;
  },
  user: any
): KetQuaXuatKho[] {
  const results: KetQuaXuatKho[] = [];
  const ngay = new Date().toISOString().slice(0, 10);
  const nguoiThucHien = user?.name || user?.email || "Hệ thống";

  // ---- 1. Xuất kho VẢI ----
  for (const mau of lenhCat.dsMau) {
    if (!mau.maVai || !mau.dinhMuc || !mau.slDuKien) continue;

    const haoHut = mau.haoHut ?? 5; // % hao hụt mặc định 5%
    const soMetGoc = mau.dinhMuc * mau.slDuKien;
    const soMetCan = round(soMetGoc * (1 + haoHut / 100), 2);

    const vai = KHO_VAI.find((v) => v.maVT === mau.maVai);
    const tenVai = vai?.tenVT || mau.maVai;
    const donGia = vai?.donGia || 0;
    const dvt = vai?.dvt || "kg";

    ghiXuatKho(mau.maVai, tenVai, soMetCan, dvt, donGia, lenhCat.id, nguoiThucHien, ngay);

    results.push({
      ok: true,
      maVT: mau.maVai,
      tenVT: tenVai,
      soLuong: soMetCan,
      donVi: dvt,
      message: `✅ Xuất vải ${tenVai}: -${soMetCan}${dvt} (${mau.slDuKien} SP × ${mau.dinhMuc}${dvt} + ${haoHut}% hao hụt)`,
    });

    // Nếu là bộ (áo + quần) → xuất thêm vải quần
    if (mau.maVaiQuan && mau.dinhMucQuan) {
      const soMetQuan = round(mau.dinhMucQuan * mau.slDuKien * (1 + haoHut / 100), 2);
      const vaiQuan = KHO_VAI.find((v) => v.maVT === mau.maVaiQuan);
      const tenVaiQuan = vaiQuan?.tenVT || mau.maVaiQuan;
      const donGiaQuan = vaiQuan?.donGia || 0;
      const dvtQuan = vaiQuan?.dvt || "kg";

      ghiXuatKho(mau.maVaiQuan, tenVaiQuan, soMetQuan, dvtQuan, donGiaQuan, lenhCat.id, nguoiThucHien, ngay);

      results.push({
        ok: true,
        maVT: mau.maVaiQuan,
        tenVT: tenVaiQuan,
        soLuong: soMetQuan,
        donVi: dvtQuan,
        message: `✅ Xuất vải quần ${tenVaiQuan}: -${soMetQuan}${dvtQuan}`,
      });
    }
  }

  // ---- 2. Xuất kho PHỤ LIỆU (bo cổ, chỉ, cúc...) ----
  for (const pl of lenhCat.dsPhuLieu) {
    if (!pl.maPL || !pl.soLuong) continue;

    const vatTu = KHO_VAT_TU.find((v) => v.maVT === pl.maPL);
    const donGia = vatTu?.donGia || pl.donGia || 0;
    const dvt = vatTu?.dvt || pl.dvt || "cái";

    ghiXuatKho(pl.maPL, pl.tenPL, pl.soLuong, dvt, donGia, lenhCat.id, nguoiThucHien, ngay);

    results.push({
      ok: true,
      maVT: pl.maPL,
      tenVT: pl.tenPL,
      soLuong: pl.soLuong,
      donVi: dvt,
      message: `✅ Xuất phụ liệu ${pl.tenPL}: -${pl.soLuong} ${dvt}`,
    });
  }

  // Ghi audit log tổng hợp
  logAudit({
    user,
    action: "update",
    module: "kho-vai",
    description: `Tự động xuất kho theo ${lenhCat.id}: ${results.length} loại vật tư`,
    resourceId: lenhCat.id,
    resourceName: lenhCat.id,
    success: true,
  });

  return results;
}
