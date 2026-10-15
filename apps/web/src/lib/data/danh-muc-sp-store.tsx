"use client";

import { createContext, useCallback, useContext, useMemo, ReactNode } from "react";
import type { SanPham, MauTieuChuan, BangSize } from "./san-pham";
export type { SanPham, MauTieuChuan, BangSize };
import { useSupabaseSync, camelToSnake } from "@/lib/supabase/sync-helper";
import { isSupabaseEnabled, supabaseDelete } from "@/lib/supabase/client";
import type { AppUser } from "@/components/session-provider";

const STORAGE_KEY = "mimin_danh_muc_v2";

type StoreContext = {
  dsSanPham: SanPham[];
  loading: boolean;
  themSP: (sp: SanPham) => void;
  suaSP: (id: string, data: Partial<SanPham>) => void;
  xoaSP: (id: string, u?: AppUser | null) => void;
  refresh: () => void;
};

const DanhMucSPContext = createContext<StoreContext | undefined>(undefined);


// Chuyển từ App lên DB (snake_case), bỏ qua các cột chưa có nếu DB cũ
function buildDBPayload(sp: SanPham) {
  const payload: any = {
    ma_sp: sp.id,
    ma_dm: `DM-${sp.loaiSP}`,
    ten_sp: sp.tenSP,
    loai_sp: sp.loaiSP,
    gia_ban_du_kien: sp.giaBanDuKien,
    gia_von_du_kien: sp.giaVonDuKien,
    gia_ban_le: sp.giaBanLe,
    gia_ban_si: sp.giaBanSi,
    gia_ban_lo: sp.giaBanLo,
    gia_tiktok: sp.giaTikTok,
    gia_shopee: sp.giaShopee,
    ti_le_size: sp.tiLeSize,
    bang_size: sp.bangSize,
    ds_mau: sp.dsMau,
    trang_thai: sp.trangThai || "con-hang",
    da_ban: sp.daBan || 0,
    ncc: sp.ncc || "",
    chat_lieu: sp.chatLieu || "",
    luot_xem: sp.luotXem || 0,
    rating: sp.rating || 0,
    hinh_anh: sp.hinhAnh || "",
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
    dsMau: (typeof (item.dsMau || item.ds_mau) === 'string' ? (function(){ try { return JSON.parse(item.dsMau || item.ds_mau); } catch(e){ return []; } })() : (item.dsMau || item.ds_mau)) || [],
    ghiChu: item.ghiChu || item.ghi_chu || "",
    ngayTao: item.createdAt || item.created_at ? (item.createdAt || item.created_at).split("T")[0] : new Date().toISOString().split("T")[0],
    hinhAnh: item.hinhAnh || item.hinh_anh || local?.hinhAnh || "",
    trangThai: item.trangThai || item.trang_thai || "con-hang",
    ncc: item.ncc || item.ncc || "",
    chatLieu: item.chatLieu || item.chat_lieu || "",
    daBan: item.daBan ?? item.da_ban ?? 0,
    rating: item.rating ?? 0,
    luotXem: item.luotXem ?? item.luot_xem ?? 0,
  };
}

export function DanhMucSPProvider({ children }: { children: ReactNode }) {
  // Đọc local data một lần để merge
  const getLocalData = () => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  };

  const { data: dsSanPham, setData: setDsSanPham, loading } = useSupabaseSync<SanPham>(
    STORAGE_KEY,
    "san_pham",
    [],
    {
      mapOut: (row) => buildDBPayload(row),
      mapIn: (row) => mapSanPhamFromDB(row, getLocalData()),
      onConflict: "id"
    }
  );

  const luuSanPhamInternal = useCallback(async (id: string, data: Partial<SanPham>) => {
    const targetId = (data.id || id).trim().toUpperCase();
    if (!targetId) return;

    const existing = dsSanPham?.find((p) => (p.id || "").trim().toUpperCase() === targetId);
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

    // 1. Cập nhật state dsSanPham (Đảm bảo chỉ có DUY NHẤT 1 item cho targetId)
    setDsSanPham((prev) => {
      const filtered = prev.filter((p) => (p.id || "").trim().toUpperCase() !== targetId);
      return [fullUpdatedSP, ...filtered];
    });

    // 2. Đồng bộ localStorage của Kho Thành Phẩm (mimin_kho_thanh_pham_v2)
    try {
      const KHO_KEY = "mimin_kho_thanh_pham_v2";
      const raw = localStorage.getItem(KHO_KEY);
      const khoData = raw ? JSON.parse(raw) : [];
      // Lọc bỏ toàn bộ các dòng cũ của mã sản phẩm này (tránh tồn dư dòng rác/nhân đôi số lượng)
      const otherProductsKho = khoData.filter((x: any) => {
        const xMa = String(x.maSP || x.ma_sp || "").trim().toUpperCase();
        return xMa !== targetId;
      });

      const newProductRows: any[] = [];
      const dsMauList = data.dsMau && Array.isArray(data.dsMau) ? data.dsMau : (fullUpdatedSP?.dsMau || []);
      const bs = data.bangSize || fullUpdatedSP?.bangSize;

      for (let i = 0; i < dsMauList.length; i++) {
        const m = dsMauList[i];
        const soLuong = Math.max(0, Number(m.soLuongKho) || 0);

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
        }

        newProductRows.push({
          id: `TP${Date.now().toString().slice(-6)}${i}${Math.random().toString(36).substring(2, 5)}`,
          maSP: targetId,
          tenSP: data.tenSP || fullUpdatedSP?.tenSP || targetId,
          mau: m.ten,
          soLuong: soLuong,
          trangThai: soLuong > 0 ? "con" : "het",
          ngayNhap: new Date().toISOString().slice(0, 10),
          phanLoai: data.loaiSP || fullUpdatedSP?.loaiSP || "BoTru",
          maSKU: m.maSKU || `${targetId}-${m.ten.toUpperCase()}`,
          hinhAnh: m.img ? [m.img, ...(m.hinhAnhChiTiet || [])] : [],
          imgQuan: (m as any).imgQuan,
          video: m.video,
          viTri: "Khu A1",
          donGia: data.giaVonDuKien ?? fullUpdatedSP?.giaVonDuKien ?? 0,
          giaTri: soLuong * (data.giaVonDuKien ?? fullUpdatedSP?.giaVonDuKien ?? 0),
          giaBanLe: data.giaBanLe ?? fullUpdatedSP?.giaBanLe ?? 0,
          giaBanSi: data.giaBanSi ?? fullUpdatedSP?.giaBanSi ?? 0,
          giaBanLo: data.giaBanLo ?? fullUpdatedSP?.giaBanLo ?? 0,
          giaTikTok: data.giaTikTok ?? fullUpdatedSP?.giaTikTok ?? 0,
          giaShopee: data.giaShopee ?? fullUpdatedSP?.giaShopee ?? 0,
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

    // 3. Đồng bộ Supabase (Nếu kết nối online)
    if (isSupabaseEnabled) {
      try {
        const { supabase } = await import("@/lib/supabase/client");
        if (supabase) {
          // 3A. BẢNG SAN_PHAM: Đảm bảo duy nhất 1 dòng cho targetId
          const { data: existingSPs } = await supabase.from("san_pham").select("id").ilike("ma_sp", targetId);
          const payload = buildDBPayload(fullUpdatedSP || ({ ...data, id: targetId } as SanPham));

          if (existingSPs && existingSPs.length > 0) {
            const primaryDbId = existingSPs[0].id;
            payload.id = primaryDbId;
            await supabase.from("san_pham").update(payload).eq("id", primaryDbId);

            // Xóa các dòng trùng ma_sp nếu có
            if (existingSPs.length > 1) {
              const duplicateSpIds = existingSPs.slice(1).map(s => s.id);
              await supabase.from("san_pham").delete().in("id", duplicateSpIds);
            }
          } else {
            await supabase.from("san_pham").insert([payload]);
          }

          // 3B. BẢNG KHO_THANH_PHAM: Chính xác 1 dòng cho mỗi màu, triệt tiêu dòng trùng và xóa màu bị bỏ
          const { data: currentKhoRows } = await supabase.from("kho_thanh_pham")
            .select("id, mau, so_luong, trang_thai")
            .ilike("ma_sp", targetId);

          const dsMauList = data.dsMau && Array.isArray(data.dsMau) ? data.dsMau : (fullUpdatedSP?.dsMau || []);
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

            const rowData: any = {
              ma_sp: targetId,
              ten_sp: data.tenSP || fullUpdatedSP?.tenSP || targetId,
              mau: m.ten,
              so_luong: targetQty,
              trang_thai: targetQty > 0 ? "con" : "het",
              phan_loai: data.loaiSP || fullUpdatedSP?.loaiSP || "BoTru",
              don_gia: data.giaVonDuKien ?? fullUpdatedSP?.giaVonDuKien ?? 0,
              gia_tri: targetQty * (data.giaVonDuKien ?? fullUpdatedSP?.giaVonDuKien ?? 0),
              gia_ban_le: data.giaBanLe ?? fullUpdatedSP?.giaBanLe ?? 0,
              gia_ban_si: data.giaBanSi ?? fullUpdatedSP?.giaBanSi ?? 0,
              chi_tiet_size: calculatedSizes,
            };
            if (m.img) rowData.hinh_anh = [m.img, ...(m.hinhAnhChiTiet || [])];
            if ((m as any).imgQuan) rowData.img_quan = (m as any).imgQuan;
            if (m.video !== undefined) rowData.video = m.video;
            if (m.maSKU) rowData.ma_sku = m.maSKU;

            if (matchingRows.length > 0) {
              // Cập nhật dòng đầu tiên
              const primaryRowId = matchingRows[0].id;
              await supabase.from("kho_thanh_pham").update(rowData).eq("id", primaryRowId);

              // Xóa toàn bộ dòng trùng khác của màu này
              if (matchingRows.length > 1) {
                const duplicateIds = matchingRows.slice(1).map((r: any) => r.id);
                await supabase.from("kho_thanh_pham").delete().in("id", duplicateIds);
              }
            } else {
              // Thêm mới đúng 1 dòng
              rowData.id = `TP${Date.now().toString().slice(-6)}${Math.random().toString(36).substring(2, 5)}`;
              rowData.ngay_nhap = new Date().toISOString();
              rowData.lsx = `LTK-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${Date.now().toString().slice(-6)}`;
              rowData.vi_tri = "Khu A1";
              await supabase.from("kho_thanh_pham").insert([rowData]);
            }
          }

          // Xóa các màu đã bị gỡ bỏ khỏi sản phẩm
          if (currentKhoRows && currentKhoRows.length > 0) {
            const orphanIds = currentKhoRows
              .filter(r => !activeColorNames.includes(String(r.mau || "").trim().toLowerCase()))
              .map(r => r.id);
            if (orphanIds.length > 0) {
              await supabase.from("kho_thanh_pham").delete().in("id", orphanIds);
            }
          }

          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("mimin:kho-thanh-pham-changed"));
          }
        }
      } catch (e) {
        console.error("Lỗi đồng bộ kho_thanh_pham khi lưu sản phẩm:", e);
      }
    }
  }, [dsSanPham, setDsSanPham]);

  const themSP = useCallback(async (sp: SanPham) => {
    await luuSanPhamInternal(sp.id, sp);
  }, [luuSanPhamInternal]);

  const suaSP = useCallback(async (id: string, data: Partial<SanPham>) => {
    await luuSanPhamInternal(id, data);
  }, [luuSanPhamInternal]);

  const xoaSP = useCallback(async (id: string, u?: AppUser | null) => {
    setDsSanPham((prev) => {
      const deletedItem = prev.find((p) => p.id === id);
      if (deletedItem) {
        // Need to import logCRUD at top of file, or just use it if available
        import("../audit-log").then(({ logCRUD }) => {
          logCRUD(u || null, "danh-muc-sp" as any, "delete", deletedItem.tenSP || id, id, { oldValue: deletedItem });
        }).catch(() => {});
      }
      return prev.filter((p) => p.id !== id);
    });

    // Xóa khỏi localStorage của kho_thanh_pham
    try {
      const KHO_KEY = "mimin_kho_thanh_pham_v2";
      const raw = localStorage.getItem(KHO_KEY);
      if (raw) {
        let khoData = JSON.parse(raw);
        const filtered = khoData.filter((item: any) => item.maSP !== id);
        if (filtered.length !== khoData.length) {
          localStorage.setItem(KHO_KEY, JSON.stringify(filtered));
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("mimin:kho-thanh-pham-changed"));
          }
        }
      }
    } catch (e) {
      console.error("Lỗi xóa local kho_thanh_pham:", e);
    }

    if (isSupabaseEnabled) {
      // supabaseDelete mặc định dùng cột 'id', ta phải dùng query riêng cho ma_sp
      const { supabase } = await import("@/lib/supabase/client");
      if (supabase) {
        await supabase.from("san_pham").delete().eq("ma_sp", id);
        await supabase.from("kho_thanh_pham").delete().eq("ma_sp", id);
      }
    }
  }, [setDsSanPham]);

  // Đảm bảo dsSanPham luôn duy nhất theo ma_sp (id), ưu tiên bản ghi có dbId
  const uniqueDsSanPham = useMemo(() => {
    const map = new Map<string, SanPham>();
    for (const sp of dsSanPham || []) {
      const key = (sp.id || "").trim().toUpperCase();
      if (!key) continue;
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
  const refresh = useCallback(() => {}, []);

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
