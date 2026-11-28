"use client";

import { createContext, useCallback, useContext, useMemo, ReactNode } from "react";
import type { SanPham, MauTieuChuan, BangSize } from "./san-pham";
export type { SanPham, MauTieuChuan, BangSize };
import { useSupabaseSync, camelToSnake } from "@/lib/supabase/sync-helper";
import { isSupabaseEnabled, supabaseDelete } from "@/lib/supabase/client";
import type { AppUser } from "@/components/session-provider";
import defaultOrdersData from "./cutting-orders-m01-m15.json";

export const DEFAULT_SAN_PHAM: SanPham[] = (defaultOrdersData as any[]).map(o => ({
  id: o.maSP,
  maSP: o.maSP,
  tenSP: o.tenSP,
  loaiSP: o.loaiSP,
  giaBanDuKien: 185000,
  giaVonDuKien: 85000,
  giaBanLe: 199000,
  giaBanSi: 155000,
  giaBanLo: 135000,
  giaTikTok: 179000,
  giaShopee: 179000,
  tiLeSize: o.tiLeSize || "1:1:1:1",
  bangSize: {
    sizes: ["L", "XL", "XXL", "3XL"],
    ratios: [1, 1, 1, 1],
    riSo: 4,
  },
  dsMau: (o.dsMau || []).map((m: any) => ({
    ten: m.ten,
    maSKU: m.maSKU,
    dinhMuc: m.dinhMuc || 0.26,
    img: m.img || `/product-models/${o.maSP}.png`,
    soLuongKho: m.slDuKien || 80,
  })),
  ghiChu: o.ghiChuKyThuat || o.ghiChu || "",
  ngayTao: o.ngayTao || "2026-10-18",
  trangThai: "con-hang",
  ncc: "MANPJ / POLOMIMIN",
  thuongHieu: "Polomimin",
  chatLieu: "Cotton CVC",
  daBan: 0,
  rating: 5,
  luotXem: 120,
  hinhAnh: `/product-models/${o.maSP}.png`,
}));

const STORAGE_KEY = "mimin_danh_muc_v2";

/**
 * Kiểm tra xem 2 sản phẩm (hoặc đối tượng sản phẩm và mã/tên) có cùng là một sản phẩm không.
 * Hỗ trợ đa dạng so sánh: mã SP (id/maSP), UUID (dbId), mã không dấu gạch (BPJ-251 khớp BPJ251),
 * tiền tố mã, và tên sản phẩm (bỏ dấu tiếng Việt).
 */
export function isMatchingProduct(
  a: { id?: string; maSP?: string; dbId?: string; tenSP?: string; ma_sp?: string; ten_sp?: string } | null | undefined,
  b: { id?: string; maSP?: string; dbId?: string; tenSP?: string; ma_sp?: string; ten_sp?: string } | string | null | undefined
): boolean {
  if (!a || !b) return false;

  const bObj = typeof b === "string" ? { id: b, maSP: b, tenSP: b } : b;

  const norm = (s?: string) => (s || "").trim().toUpperCase();
  const clean = (s?: string) => (s || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const stripAccents = (s?: string) =>
    (s || "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "d")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();

  const aId = norm(a.id);
  const aMa = norm(a.maSP || a.ma_sp);
  const aDbId = (a.dbId || "").trim();
  const aTen = stripAccents(a.tenSP || a.ten_sp);

  const bId = norm(bObj.id);
  const bMa = norm(bObj.maSP || bObj.ma_sp);
  const bDbId = (bObj.dbId || "").trim();
  const bTen = stripAccents(bObj.tenSP || bObj.ten_sp);

  // 1. Khớp chính xác ID, mã SP hoặc dbId
  if (aId && (aId === bId || aId === bMa || (bDbId && aId === bDbId))) return true;
  if (aMa && (aMa === bId || aMa === bMa || (bDbId && aMa === bDbId))) return true;
  if (aDbId && (aDbId === bId || aDbId === bMa || (bDbId && aDbId === bDbId))) return true;
  if (bId && (bId === aId || bId === aMa || (aDbId && bId === aDbId))) return true;
  if (bMa && (bMa === aId || bMa === aMa || (aDbId && bMa === aDbId))) return true;

  // 2. Khớp chuỗi ký tự bỏ dấu gạch/khoảng trắng (VD: BPJ-251 khớp BPJ251)
  const aCleanId = clean(a.id);
  const aCleanMa = clean(a.maSP || a.ma_sp);
  const bCleanId = clean(bObj.id);
  const bCleanMa = clean(bObj.maSP || bObj.ma_sp);

  if (aCleanId && aCleanId.length >= 3 && (aCleanId === bCleanId || aCleanId === bCleanMa)) return true;
  if (aCleanMa && aCleanMa.length >= 3 && (aCleanMa === bCleanId || aCleanMa === bCleanMa)) return true;

  // 3. Khớp tiền tố (prefix) nếu độ dài >= 4
  if (aMa && bMa && aMa.length >= 4 && bMa.length >= 4 && (aMa.startsWith(bMa) || bMa.startsWith(aMa))) return true;
  if (aId && bId && aId.length >= 4 && bId.length >= 4 && (aId.startsWith(bId) || bId.startsWith(aId))) return true;

  // 4. Khớp theo tên sản phẩm (bỏ dấu tiếng Việt, không phân biệt hoa thường)
  if (aTen && bTen) {
    if (aTen === bTen) return true;
    if (aTen.length >= 6 && bTen.length >= 6 && (aTen.includes(bTen) || bTen.includes(aTen))) return true;
  }

  return false;
}

export const DANH_MUC_DELETED_KEY = "mimin_danh_muc_deleted_ids";

export function getDeletedDanhMucSPIds(): Set<string> {
  try {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem(DANH_MUC_DELETED_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return new Set(parsed.map((x: string) => String(x || "").trim().toUpperCase()).filter(Boolean));
        }
      }
    }
  } catch {}
  return new Set();
}

export function addDeletedDanhMucSPId(...ids: string[]) {
  try {
    if (typeof window === "undefined") return;
    const set = getDeletedDanhMucSPIds();
    ids.forEach(id => {
      const norm = String(id || "").trim().toUpperCase();
      if (norm) set.add(norm);
    });
    localStorage.setItem(DANH_MUC_DELETED_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

export function removeDeletedDanhMucSPId(id: string) {
  try {
    if (typeof window === "undefined") return;
    const norm = String(id || "").trim().toUpperCase();
    if (!norm) return;
    const set = getDeletedDanhMucSPIds();
    if (set.has(norm)) {
      set.delete(norm);
      localStorage.setItem(DANH_MUC_DELETED_KEY, JSON.stringify(Array.from(set)));
    }
  } catch {}
}

export interface LuuSanPhamOptions {
  skipKhoSync?: boolean;
}

type StoreContext = {
  dsSanPham: SanPham[];
  loading: boolean;
  themSP: (sp: SanPham, options?: LuuSanPhamOptions) => Promise<void> | void;
  suaSP: (id: string, data: Partial<SanPham>, options?: LuuSanPhamOptions) => Promise<void> | void;
  xoaSP: (id: string, u?: AppUser | null) => void;
  refresh: () => void;
};

const DanhMucSPContext = createContext<StoreContext | undefined>(undefined);


function cleanVariantKey(str: string): string {
  return (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase() || "DEFAULT";
}

// Chuyển từ App lên DB (snake_case), chỉ gửi các cột có thật trong bảng san_pham
export function buildDBPayload(sp: SanPham) {
  const loai = sp.loaiSP || "BoTru";
  const payload: any = {
    ma_sp: sp.id || (sp as any).maSP,
    ma_dm: `DM-${loai}`,
    ten_sp: sp.tenSP,
    loai_sp: loai,
    gia_ban_du_kien: sp.giaBanDuKien || sp.giaBanLe || 0,
    gia_von_du_kien: sp.giaVonDuKien || 0,
    ti_le_size: sp.tiLeSize || "1:1:1:1",
    bang_size: sp.bangSize,
    ds_mau: sp.dsMau,
    trang_thai: sp.trangThai || "con-hang",
    da_ban: sp.daBan || 0,
    ncc: sp.thuongHieu || sp.ncc || "MANPJ / POLOMIMIN",
    chat_lieu: sp.chatLieu || "Cotton CVC",
    luot_xem: sp.luotXem || 0,
    rating: sp.rating || 0,
    hinh_anh: sp.hinhAnh || "",
    dinh_muc: 0,
  };
  if (sp.dbId) {
    payload.id = sp.dbId;
  }
  return payload;
}

function mapSanPhamFromDB(item: any, localData: SanPham[]): SanPham {
  // sync-helper.ts (snakeToCamel) da convert các key từ snake_case sang camelCase
  // Nên ta cần đọc cả 2 trường hợp để đảm bảo an toàn.
  const maSp = item.maSp || item.ma_sp;
  const local = localData.find((x) => x.id === maSp);
  const tenSP = item.tenSp || item.ten_sp || "Sản phẩm mới";

  let loaiSP = (item.loaiSp || item.loai_sp) as any || "AoCoTron";
  const validKeys = ["AoTru", "AoCoTron", "BoTru", "BoCoTron", "AoPolo", "PhuKien"];
  if (!validKeys.includes(loaiSP)) {
    const checkStr = (tenSP + " " + (item.phanLoai || item.phan_loai || "")).toLowerCase();
    if (checkStr.includes("áo polo") || checkStr.includes("ao polo")) loaiSP = "AoPolo";
    else if (checkStr.includes("áo trụ") || checkStr.includes("ao tru") || checkStr.includes("cổ trụ") || checkStr.includes("co tru")) loaiSP = "AoTru";
    else if (checkStr.includes("áo tròn") || checkStr.includes("áo cổ tròn") || checkStr.includes("cổ tròn") || checkStr.includes("co tron")) loaiSP = "AoCoTron";
    else if (checkStr.includes("bộ tròn") || checkStr.includes("bộ cổ tròn") || checkStr.includes("bo tron") || checkStr.includes("bo co tron")) loaiSP = "BoCoTron";
    else if (checkStr.includes("phụ kiện") || checkStr.includes("quần") || checkStr.includes("quan")) loaiSP = "PhuKien";
    else if (checkStr.includes("áo thun") || checkStr.includes("áo") || checkStr.includes("ao")) loaiSP = "AoCoTron";
    else loaiSP = "BoTru";
  }

  return {
    id: maSp || item.id, // Application ID (ma_sp string)
    maSP: maSp || item.id,
    dbId: item.id, // UUID in database
    tenSP: tenSP,
    loaiSP: loaiSP,
    giaBanDuKien: item.giaBanDuKien ?? item.gia_ban_du_kien ?? 0,
    giaVonDuKien: item.giaVonDuKien ?? item.gia_von_du_kien ?? 0,
    giaBanLe: item.giaBanLe ?? item.gia_ban_le ?? 0,
    giaBanSi: item.giaBanSi ?? item.gia_ban_si ?? 0,
    giaBanLo: item.giaBanLo ?? item.gia_ban_lo ?? 0,
    giaTikTok: item.giaTikTok ?? item.gia_tiktok ?? 0,
    giaShopee: item.giaShopee ?? item.gia_shopee ?? 0,
    tiLeSize: item.tiLeSize || item.ti_le_size || "1:2:2:2:1",
    bangSize: item.bangSize || item.bang_size || { sizes: [], ratios: [], riSo: 1 },
    dsMau: (typeof (item.dsMau || item.ds_mau) === 'string' ? (function () { try { return JSON.parse(item.dsMau || item.ds_mau); } catch (e) { return []; } })() : (item.dsMau || item.ds_mau)) || [],
    ghiChu: item.ghiChu || item.ghi_chu || "",
    ngayTao: item.createdAt || item.created_at ? (item.createdAt || item.created_at).split("T")[0] : new Date().toISOString().split("T")[0],
    hinhAnh: item.hinhAnh || item.hinh_anh || local?.hinhAnh || (maSp && /^M\d{2}$/i.test(maSp) ? `/product-models/${maSp}.png` : ""),
    trangThai: item.trangThai || item.trang_thai || "con-hang",
    ncc: (item.ncc === "Man PJ" || item.ncc === "Polomimin" ? item.ncc : local?.thuongHieu || local?.ncc) || (((maSp || item.id || "").toUpperCase().includes("BPJ") || (tenSP || "").toUpperCase().includes("MANPJ")) ? "Man PJ" : "Polomimin"),
    thuongHieu: (item.ncc === "Man PJ" || item.ncc === "Polomimin" ? item.ncc : local?.thuongHieu || local?.ncc) || (((maSp || item.id || "").toUpperCase().includes("BPJ") || (tenSP || "").toUpperCase().includes("MANPJ")) ? "Man PJ" : "Polomimin"),
    chatLieu: item.chatLieu || item.chat_lieu || "",
    daBan: item.daBan ?? item.da_ban ?? 0,
    rating: item.rating ?? 0,
    luotXem: item.luotXem ?? item.luot_xem ?? 0,
  };
}

export function DanhMucSPProvider({ children }: { children: ReactNode }) {
  // Đọc local data một lần để merge
  const getLocalData = () => {
    const deletedSet = getDeletedDanhMucSPIds();
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((p: any) => {
            const k = String(p.id || p.maSP || "").trim().toUpperCase();
            return !deletedSet.has(k);
          });
        }
      }
    } catch { }
    return DEFAULT_SAN_PHAM.filter((p) => {
      const k = String(p.id || p.maSP || "").trim().toUpperCase();
      return !deletedSet.has(k);
    });
  };

  const { data: dsSanPham, setData: setDsSanPham, loading } = useSupabaseSync<SanPham>(
    STORAGE_KEY,
    "san_pham",
    DEFAULT_SAN_PHAM,
    {
      mapOut: (row) => buildDBPayload(row),
      mapIn: (row) => mapSanPhamFromDB(row, getLocalData()),
      onConflict: "id"
    }
  );

  const luuSanPhamInternal = useCallback(async (id: string, data: Partial<SanPham>, options?: LuuSanPhamOptions) => {
    const oldId = id.trim().toUpperCase();
    const targetId = (data.id || id).trim().toUpperCase();
    if (!targetId) return;
    const isRenaming = Boolean(oldId && targetId && oldId !== targetId);

    // Gỡ bỏ khỏi danh sách đã xóa nếu người dùng tạo lại hoặc cập nhật
    removeDeletedDanhMucSPId(targetId);
    if (isRenaming) removeDeletedDanhMucSPId(oldId);

    const existing = dsSanPham?.find((p) => {
      const pId = (p.id || "").trim().toUpperCase();
      return (isRenaming && pId === oldId) || pId === targetId;
    });

    const fullUpdatedSP: SanPham = {
      ...(existing || {
        id: targetId,
        tenSP: data.tenSP || targetId,
        loaiSP: data.loaiSP || "BoTru",
        giaBanDuKien: 0,
        giaVonDuKien: 0,
        giaBanLe: 0,
        giaBanSi: 0,
        giaBanLo: 0,
        giaTikTok: 0,
        giaShopee: 0,
        tiLeSize: "1:2:2:2:1",
        bangSize: { sizes: ["S", "M", "L", "XL", "2XL"], ratios: [1, 2, 2, 2, 1], riSo: 8 },
        dsMau: [],
        trangThai: "con-hang",
        ngayTao: new Date().toISOString().slice(0, 10),
        hinhAnh: "",
      }),
      ...data,
      id: targetId,
      dbId: data.dbId || existing?.dbId,
      ngayCapNhat: new Date().toISOString().slice(0, 10),
    } as SanPham;

    // 1. Cập nhật state dsSanPham (Đảm bảo thay thế đúng mã cũ nếu đổi mã)
    setDsSanPham((prev) => {
      const filtered = prev.filter((p) => {
        const pId = (p.id || "").trim().toUpperCase();
        return pId !== targetId && pId !== oldId;
      });
      return [fullUpdatedSP, ...filtered];
    });

    // dsMauList: danh sách màu dùng chung cho localStorage và Supabase sync
    const dsMauList = data.dsMau && Array.isArray(data.dsMau) ? data.dsMau : (fullUpdatedSP?.dsMau || []);

    // 2. Đồng bộ localStorage của Kho Thành Phẩm (chỉ thực hiện khi không bật skipKhoSync)
    if (!options?.skipKhoSync) {
      try {
        const KHO_KEY = "mimin_kho_thanh_pham_v2";
        const raw = localStorage.getItem(KHO_KEY);
        const khoData = raw ? JSON.parse(raw) : [];

        // Lọc ra các dòng thuộc mã SP này và các dòng SP khác
        const currentProductRows = khoData.filter((x: any) => {
          const xMa = String(x.maSP || x.ma_sp || "").trim().toUpperCase();
          return xMa === targetId || xMa === oldId;
        });
        const otherProductsKho = khoData.filter((x: any) => {
          const xMa = String(x.maSP || x.ma_sp || "").trim().toUpperCase();
          return xMa !== targetId && xMa !== oldId;
        });

        const newProductRows: any[] = [];
        const bs = data.bangSize || fullUpdatedSP?.bangSize;

        for (let i = 0; i < dsMauList.length; i++) {
          const m = dsMauList[i];
          const mTenNorm = String(m.ten || "").trim().toLowerCase();
          const soLuong = Math.max(0, Number(m.soLuongKho) || 0);

          const variantKey = cleanVariantKey(m.ten);
          const canonicalId = `TP-${targetId}-${variantKey}`;
          // Tìm dòng kho đã có của màu này: ưu tiên canonicalId, sau đó tìm theo tên màu
          const existingRow = currentProductRows.find((r: any) => r.id === canonicalId) ||
            currentProductRows.find((r: any) => String(r.mau || "").trim().toLowerCase() === mTenNorm);

          let chiTietSize: any[] = [];
          if (bs && bs.sizes && bs.sizes.length > 0) {
            const tongRatio = (bs.ratios || []).reduce((s: number, r: number) => s + r, 0) || 1;
            let conLai = soLuong;
            chiTietSize = bs.sizes.map((size: string, index: number) => {
              if (index === bs.sizes.length - 1) return { size, sl: conLai };
              const ratio = bs.ratios?.[index] || 0;
              const chia = Math.round((ratio / tongRatio) * soLuong);
              conLai -= chia;
              return { size, sl: Math.max(0, chia) };
            });
          } else if (existingRow?.chiTietSize && existingRow.chiTietSize.length > 0) {
            const tongCu = existingRow.chiTietSize.reduce((s: number, x: any) => s + (Number(x.sl) || 0), 0) || 1;
            let conLai = soLuong;
            chiTietSize = existingRow.chiTietSize.map((x: any, idx: number) => {
              if (idx === existingRow.chiTietSize.length - 1) return { size: x.size, sl: conLai };
              const chia = Math.round(((Number(x.sl) || 0) / tongCu) * soLuong);
              conLai -= chia;
              return { size: x.size, sl: Math.max(0, chia) };
            });
          }

          const stableId = canonicalId;
          const donGia = Number(data.giaVonDuKien ?? fullUpdatedSP?.giaVonDuKien ?? existingRow?.donGia ?? 0);

          newProductRows.push({
            ...(existingRow || {}),
            id: stableId,
            maSP: targetId,
            tenSP: data.tenSP || fullUpdatedSP?.tenSP || existingRow?.tenSP || targetId,
            mau: m.ten,
            soLuong: soLuong,
            trangThai: soLuong > 0 ? "con" : "het",
            ngayNhap: existingRow?.ngayNhap || new Date().toISOString().slice(0, 10),
            lsx: existingRow?.lsx || `LTK-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${targetId}-${variantKey}`,
            maLenhCat: existingRow?.maLenhCat,
            viTri: existingRow?.viTri || "Khu A1",
            phanLoai: data.loaiSP || fullUpdatedSP?.loaiSP || existingRow?.phanLoai || "BoTru",
            maSKU: m.maSKU || existingRow?.maSKU || `${targetId}-${m.ten.toUpperCase()}`,
            hinhAnh: m.img ? [m.img, ...(m.hinhAnhChiTiet || [])] : (existingRow?.hinhAnh || []),
            imgQuan: (m as any).imgQuan || existingRow?.imgQuan,
            video: m.video !== undefined ? m.video : existingRow?.video,
            donGia: donGia,
            giaTri: soLuong * donGia,
            giaBanLe: data.giaBanLe ?? fullUpdatedSP?.giaBanLe ?? existingRow?.giaBanLe ?? 0,
            giaBanSi: data.giaBanSi ?? fullUpdatedSP?.giaBanSi ?? existingRow?.giaBanSi ?? 0,
            giaBanLo: data.giaBanLo ?? fullUpdatedSP?.giaBanLo ?? existingRow?.giaBanLo ?? 0,
            giaTikTok: data.giaTikTok ?? fullUpdatedSP?.giaTikTok ?? existingRow?.giaTikTok ?? 0,
            giaShopee: data.giaShopee ?? fullUpdatedSP?.giaShopee ?? existingRow?.giaShopee ?? 0,
            chiTietSize: chiTietSize,
          });
        }

        localStorage.setItem(KHO_KEY, JSON.stringify([...otherProductsKho, ...newProductRows]));
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("mimin:kho-thanh-pham-changed"));
        }
      } catch (e) {
        console.error("Lỗi đồng bộ local kho_thanh_pham:", e);
      }
    }

    // 3. Đồng bộ Supabase (Nếu kết nối online)
    if (isSupabaseEnabled) {
      try {
        const { supabase } = await import("@/lib/supabase/client");
        if (supabase) {
          // 3A. BẢNG SAN_PHAM: Cập nhật sản phẩm (hỗ trợ đổi Mã SP)
          let primaryDbId = existing?.dbId;
          const { data: existingSPs } = await supabase.from("san_pham").select("id").or(`ma_sp.ilike.${targetId}${isRenaming ? `,ma_sp.ilike.${oldId}` : ""}`);
          if (existingSPs && existingSPs.length > 0) {
            primaryDbId = existingSPs[0].id;
            // Xóa các dòng trùng nếu có nhiều hơn 1 dòng cùng mã SP trong san_pham
            if (existingSPs.length > 1) {
              const dupIds = existingSPs.slice(1).map((x: any) => x.id);
              await supabase.from("san_pham").delete().in("id", dupIds);
            }
          }

          const payload = buildDBPayload(fullUpdatedSP || ({ ...data, id: targetId } as SanPham));

          if (primaryDbId) {
            payload.id = primaryDbId;
            await supabase.from("san_pham").update(payload).eq("id", primaryDbId);

            // Xóa các dòng cũ theo mã cũ nếu có
            if (isRenaming) {
              await supabase.from("san_pham").delete().ilike("ma_sp", oldId).neq("id", primaryDbId);
            }
          } else {
            const { error: insertErr } = await supabase.from("san_pham").insert([payload]);
            if (insertErr && (insertErr.code === "23505" || insertErr.message?.includes("unique"))) {
              await supabase.from("san_pham").update(payload).ilike("ma_sp", targetId);
            }
          }

          // Khi đổi mã SP: Đồng bộ đổi mã ở kho_thanh_pham
          if (isRenaming) {
            await supabase.from("kho_thanh_pham").update({ ma_sp: targetId }).ilike("ma_sp", oldId);
          }

          // 3B. BẢNG KHO_THANH_PHAM: Chính xác 1 dòng cho mỗi màu, triệt tiêu dòng trùng và xóa màu bị bỏ (chỉ chạy khi không skipKhoSync)
          // dsMauList đã được khai báo ở trên (dùng chung cho localStorage và Supabase sync)

          if (!options?.skipKhoSync) {
            const { data: currentKhoRows } = await supabase.from("kho_thanh_pham")
              .select("*")
              .ilike("ma_sp", targetId);

            const activeColorNames = dsMauList.map((m: any) => String(m.ten || "").trim().toLowerCase());
            const bs = data.bangSize || fullUpdatedSP?.bangSize;

            for (const m of dsMauList) {
              const mTenNorm = String(m.ten || "").trim().toLowerCase();
              const matchingRows = (currentKhoRows || []).filter(r => String(r.mau || "").trim().toLowerCase() === mTenNorm);

              const targetQty = Math.max(0, Number(m.soLuongKho) || 0);
              let calculatedSizes: any[] = [];
              if (bs && bs.sizes && bs.sizes.length > 0) {
                const tongRatio = (bs.ratios || []).reduce((s: number, r: number) => s + r, 0) || 1;
                let conLai = targetQty;
                calculatedSizes = bs.sizes.map((size: string, index: number) => {
                  if (index === bs.sizes.length - 1) return { size, sl: conLai };
                  const ratio = bs.ratios?.[index] || 0;
                  const chia = Math.round((ratio / tongRatio) * targetQty);
                  conLai -= chia;
                  return { size, sl: Math.max(0, chia) };
                });
              }

              const donGia = Number(data.giaVonDuKien ?? fullUpdatedSP?.giaVonDuKien ?? matchingRows[0]?.don_gia ?? 0);
              const variantKey = cleanVariantKey(m.ten);

              // CHÚ Ý: Bảng kho_thanh_pham trên Supabase KHÔNG có cột ma_sku nên tuyệt đối không đưa ma_sku vào rowData
              const rowData: any = {
                ma_sp: targetId,
                ten_sp: data.tenSP || fullUpdatedSP?.tenSP || targetId,
                mau: m.ten,
                so_luong: targetQty,
                trang_thai: targetQty > 0 ? "con" : "het",
                phan_loai: data.loaiSP || fullUpdatedSP?.loaiSP || "BoTru",
                don_gia: donGia,
                gia_tri: targetQty * donGia,
                gia_ban_le: data.giaBanLe ?? fullUpdatedSP?.giaBanLe ?? matchingRows[0]?.gia_ban_le ?? 0,
                gia_ban_si: data.giaBanSi ?? fullUpdatedSP?.giaBanSi ?? matchingRows[0]?.gia_ban_si ?? 0,
                chi_tiet_size: calculatedSizes,
              };
              if (m.img) rowData.hinh_anh = [m.img, ...(m.hinhAnhChiTiet || [])];
              if ((m as any).imgQuan) rowData.img_quan = (m as any).imgQuan;
              if (m.video !== undefined) rowData.video = m.video;

              const canonicalId = `TP-${targetId}-${variantKey}`;
              const canonicalRow = matchingRows.find(r => r.id === canonicalId);
              const duplicateRows = matchingRows.filter(r => r.id !== canonicalId);
              const duplicateIds = duplicateRows.map((r: any) => r.id);

              rowData.id = canonicalId;
              if (canonicalRow) {
                await supabase.from("kho_thanh_pham").update(rowData).eq("id", canonicalId);
              } else if (matchingRows.length > 0) {
                rowData.ngay_nhap = matchingRows[0].ngay_nhap || new Date().toISOString();
                rowData.lsx = matchingRows[0].lsx || `LTK-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${targetId}-${variantKey}`;
                rowData.vi_tri = matchingRows[0].vi_tri || "Khu A1";
                await supabase.from("kho_thanh_pham").upsert([rowData], { onConflict: "id" });
                if (matchingRows[0].id !== canonicalId && !duplicateIds.includes(matchingRows[0].id)) {
                  duplicateIds.push(matchingRows[0].id);
                }
              } else {
                rowData.ngay_nhap = new Date().toISOString();
                rowData.lsx = `LTK-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${targetId}-${variantKey}`;
                rowData.vi_tri = "Khu A1";
                await supabase.from("kho_thanh_pham").upsert([rowData], { onConflict: "id" });
              }

              // Xóa toàn bộ dòng trùng khác của màu này khỏi Supabase & ghi nhớ vào deletedIds
              if (duplicateIds.length > 0) {
                await supabase.from("kho_thanh_pham").delete().in("id", duplicateIds);
                try {
                  const rawDel = localStorage.getItem("mimin_kho_tp_deleted_ids");
                  const delSet = new Set<string>(rawDel ? JSON.parse(rawDel) : []);
                  duplicateIds.forEach(id => delSet.add(String(id)));
                  localStorage.setItem("mimin_kho_tp_deleted_ids", JSON.stringify(Array.from(delSet)));
                } catch { }
              }
            }

            // Xóa các màu đã bị gỡ bỏ khỏi sản phẩm và ghi nhớ vào deletedIds để không bị tự phục sinh
            if (currentKhoRows && currentKhoRows.length > 0) {
              const orphanIds = currentKhoRows
                .filter(r => !activeColorNames.includes(String(r.mau || "").trim().toLowerCase()))
                .map(r => r.id);
              if (orphanIds.length > 0) {
                await supabase.from("kho_thanh_pham").delete().in("id", orphanIds);
                try {
                  const rawDel = localStorage.getItem("mimin_kho_tp_deleted_ids");
                  const delSet = new Set<string>(rawDel ? JSON.parse(rawDel) : []);
                  orphanIds.forEach(id => delSet.add(String(id)));
                  localStorage.setItem("mimin_kho_tp_deleted_ids", JSON.stringify(Array.from(delSet)));
                } catch { }
              }
            }
          }

          // 3C. Tự động đồng bộ hình ảnh sang Lệnh Cắt và Kế Hoạch SX nếu có cùng mã SP
          try {
            const { data: matchedLCs } = await supabase.from("lenh_cat").select("id, ds_mau").ilike("ma_sp", targetId);
            if (matchedLCs && matchedLCs.length > 0) {
              for (const lcItem of matchedLCs) {
                const updatedDsMau = (lcItem.ds_mau || []).map((m: any, idx: number) => {
                  const mNorm = String(m.ten || "").toLowerCase().trim();
                  const matchSpColor = dsMauList.find((c: any) => String(c.ten || "").toLowerCase().trim() === mNorm) || dsMauList[idx];
                  const newImg = matchSpColor?.img || fullUpdatedSP?.hinhAnh || m.img;
                  return { ...m, img: newImg };
                });
                await supabase.from("lenh_cat").update({ ds_mau: updatedDsMau }).eq("id", lcItem.id);
              }
            }

            const { data: matchedKHSX } = await supabase.from("khsx").select("id, dsMau").ilike("maSP", targetId);
            if (matchedKHSX && matchedKHSX.length > 0) {
              for (const khItem of matchedKHSX) {
                const updatedDsMau = (khItem.dsMau || []).map((m: any, idx: number) => {
                  const mNorm = String(m.ten || "").toLowerCase().trim();
                  const matchSpColor = dsMauList.find((c: any) => String(c.ten || "").toLowerCase().trim() === mNorm) || dsMauList[idx];
                  const newImg = matchSpColor?.img || fullUpdatedSP?.hinhAnh || m.img;
                  return { ...m, img: newImg };
                });
                await supabase.from("khsx").update({ dsMau: updatedDsMau }).eq("id", khItem.id);
              }
            }
          } catch (syncImgErr) {
            console.warn("Lỗi đồng bộ ảnh sang lenh_cat/khsx:", syncImgErr);
          }

          // 3D. Khi đổi Mã Sản Phẩm: Đồng bộ đổi mã liên hoàn sang Lệnh Cắt và Kế Hoạch SX
          if (isRenaming) {
            try {
              await supabase.from("lenh_cat").update({ ma_sp: targetId, ten_sp: fullUpdatedSP.tenSP }).ilike("ma_sp", oldId);
              await supabase.from("khsx").update({ maSP: targetId, tenSP: fullUpdatedSP.tenSP }).ilike("maSP", oldId);
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("mimin:lenh-cat-changed"));
              }
            } catch (renameErr) {
              console.warn("Lỗi đồng bộ đổi mã sang lenh_cat/khsx:", renameErr);
            }
          }

          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("mimin:danh-muc-sp-changed"));
            if (!options?.skipKhoSync) {
              window.dispatchEvent(new CustomEvent("mimin:kho-thanh-pham-changed"));
            }
          }
        }
      } catch (e) {
        console.error("Lỗi đồng bộ kho_thanh_pham khi lưu sản phẩm:", e);
      }
    }
  }, [dsSanPham, setDsSanPham]);

  const themSP = useCallback(async (sp: SanPham, options?: LuuSanPhamOptions) => {
    await luuSanPhamInternal(sp.id, sp, options);
  }, [luuSanPhamInternal]);

  const suaSP = useCallback(async (id: string, data: Partial<SanPham>, options?: LuuSanPhamOptions) => {
    await luuSanPhamInternal(id, data, options);
  }, [luuSanPhamInternal]);

  const xoaSP = useCallback(async (idOrTarget: string, u?: AppUser | null) => {
    const target = (idOrTarget || "").trim();
    if (!target) return;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(target);

    let deletedItems: SanPham[] = [];

    // 1. Cập nhật React state của Danh mục SP
    setDsSanPham((prev) => {
      deletedItems = prev.filter((p) => isMatchingProduct(p, target));
      for (const d of deletedItems) {
        import("../audit-log").then(({ logCRUD }) => {
          logCRUD(u || null, "danh-muc-sp" as any, "delete", d.tenSP || target, d.id || target, { oldValue: d });
        }).catch(() => { });
      }
      return prev.filter((p) => !isMatchingProduct(p, target));
    });

    // 1B. Ghi nhận vào danh sách đã xóa để F5 tuyệt đối không bao giờ bị nạp lại từ default/cache
    const targetUpper = target.toUpperCase();
    const idsToMarkDeleted: string[] = [target, targetUpper];
    deletedItems.forEach(d => {
      if (d.id) idsToMarkDeleted.push(d.id, d.id.toUpperCase());
      if (d.dbId) idsToMarkDeleted.push(d.dbId);
      if ((d as any).maSP) idsToMarkDeleted.push((d as any).maSP, String((d as any).maSP).toUpperCase());
    });
    addDeletedDanhMucSPId(...idsToMarkDeleted);

    // 2. Xóa triệt để khỏi localStorage của mimin_danh_muc_v2
    try {
      const rawDM = localStorage.getItem(STORAGE_KEY);
      if (rawDM) {
        const parsed = JSON.parse(rawDM);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((p: any) => !isMatchingProduct(p, target));
          if (filtered.length !== parsed.length) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
          }
        }
      }
    } catch (e) {
      console.error("Lỗi xóa local danh_muc_sp:", e);
    }

    // 3. Xóa triệt để khỏi localStorage của mimin_kho_thanh_pham_v2 và ghi nhớ vào mimin_kho_tp_deleted_ids
    try {
      const KHO_KEY = "mimin_kho_thanh_pham_v2";
      const rawKho = localStorage.getItem(KHO_KEY);
      if (rawKho) {
        const khoData = JSON.parse(rawKho);
        if (Array.isArray(khoData)) {
          const filtered = khoData.filter((item: any) => !isMatchingProduct(item, target));
          if (filtered.length !== khoData.length) {
            localStorage.setItem(KHO_KEY, JSON.stringify(filtered));
          }
        }
      }
      const rawDel = localStorage.getItem("mimin_kho_tp_deleted_ids");
      const delSet = new Set<string>(rawDel ? JSON.parse(rawDel) : []);
      idsToMarkDeleted.forEach(id => delSet.add(id));
      deletedItems.forEach(d => {
        if (d.dsMau) {
          d.dsMau.forEach(m => {
            const vKey = cleanVariantKey(m.ten);
            delSet.add(`TP-${targetUpper}-${vKey}`);
            if (d.id) delSet.add(`TP-${d.id.toUpperCase()}-${vKey}`);
          });
        }
      });
      localStorage.setItem("mimin_kho_tp_deleted_ids", JSON.stringify(Array.from(delSet)));
    } catch (e) {
      console.error("Lỗi xóa local kho_thanh_pham:", e);
    }

    // 4. Phát sự kiện để tất cả các màn hình cập nhật ngay lập tức
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("mimin:danh-muc-sp-changed"));
      window.dispatchEvent(new CustomEvent("mimin:kho-thanh-pham-changed"));
    }

    // 5. Đồng bộ xóa trên Supabase (cả bảng san_pham và kho_thanh_pham)
    if (isSupabaseEnabled) {
      try {
        const { supabase } = await import("@/lib/supabase/client");
        if (supabase) {
          // Xóa san_pham theo id / ma_sp
          if (isUUID) {
            await supabase.from("san_pham").delete().eq("id", target);
          }
          await supabase.from("san_pham").delete().or(`ma_sp.eq.${target},ma_sp.ilike.${target}`);

          for (const item of deletedItems) {
            if (item.dbId && item.dbId !== target) {
              await supabase.from("san_pham").delete().eq("id", item.dbId);
            }
            if (item.id && item.id !== target) {
              await supabase.from("san_pham").delete().or(`ma_sp.eq.${item.id},ma_sp.ilike.${item.id}`);
            }
            if (item.tenSP) {
              await supabase.from("san_pham").delete().or(`ten_sp.eq.${item.tenSP},ten_sp.ilike.${item.tenSP}`);
            }
          }

          // Xóa kho_thanh_pham tương ứng
          await supabase.from("kho_thanh_pham").delete().or(`ma_sp.eq.${target},ma_sp.ilike.${target},id.eq.${target}`);
          for (const item of deletedItems) {
            if (item.id && item.id !== target) {
              await supabase.from("kho_thanh_pham").delete().or(`ma_sp.eq.${item.id},ma_sp.ilike.${item.id}`);
            }
            if (item.tenSP) {
              await supabase.from("kho_thanh_pham").delete().or(`ten_sp.eq.${item.tenSP},ten_sp.ilike.${item.tenSP}`);
            }
          }
        }
      } catch (err) {
        console.error("Lỗi xóa Supabase san_pham/kho_thanh_pham:", err);
      }
    }
  }, [setDsSanPham]);

  // Đảm bảo dsSanPham luôn duy nhất theo ma_sp (id), ưu tiên bản ghi có dbId và lọc triệt để các sản phẩm đã xóa
  const uniqueDsSanPham = useMemo(() => {
    const deletedSet = getDeletedDanhMucSPIds();
    const map = new Map<string, SanPham>();
    for (const sp of dsSanPham || []) {
      const key = (sp.id || "").trim().toUpperCase();
      if (!key) continue;
      if (deletedSet.has(key) || (sp.dbId && deletedSet.has(sp.dbId)) || ((sp as any).maSP && deletedSet.has(String((sp as any).maSP).trim().toUpperCase()))) {
        continue;
      }
      if (!map.has(key)) {
        map.set(key, sp);
      } else {
        const existing = map.get(key)!;
        if (!existing.dbId && sp.dbId) {
          map.set(key, { ...existing, dbId: sp.dbId });
        }
      }
    }
    return Array.from(map.values());
  }, [dsSanPham]);

  // Hook này tự động sync, hàm refresh giữ lại để tương thích API cũ nhưng ko cần làm gì
  const refresh = useCallback(() => { }, []);

  return (
    <DanhMucSPContext.Provider value={{ dsSanPham: uniqueDsSanPham, themSP, suaSP, xoaSP, loading, refresh }}>
      {children}
    </DanhMucSPContext.Provider>
  );
}

export function useDanhMucSP() {
  const context = useContext(DanhMucSPContext);
  if (context === undefined) {
    throw new Error("useDanhMucSP must be used within a DanhMucSPProvider");
  }
  return context;
}
