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

  const themSP = useCallback(async (sp: SanPham) => {
    setDsSanPham((prev) => [...prev, sp]);

    // Đồng bộ lập tức vào localStorage của Kho Thành Phẩm
    try {
      const KHO_KEY = "mimin_kho_thanh_pham_v2";
      const raw = localStorage.getItem(KHO_KEY);
      if (raw) {
        let khoData = JSON.parse(raw);
        let changed = false;
        
        if (sp.dsMau && Array.isArray(sp.dsMau)) {
           for (let i = 0; i < sp.dsMau.length; i++) {
              const m = sp.dsMau[i];
              if (m.soLuongKho !== undefined) {
                 changed = true;
                 khoData.push({
                   id: `TP${Date.now().toString().slice(-6)}${i}`,
                   maSP: sp.id,
                   tenSP: sp.tenSP || sp.id,
                   mau: m.ten,
                   soLuong: m.soLuongKho,
                   trangThai: m.soLuongKho > 0 ? "con" : "het",
                   ngayNhap: new Date().toISOString().slice(0, 10),
                   phanLoai: sp.loaiSP || "BoTru",
                   maSKU: m.maSKU,
                   hinhAnh: m.img ? [m.img, ...(m.hinhAnhChiTiet || [])] : [],
                   imgQuan: (m as any).imgQuan,
                   video: m.video,
                   viTri: "Khu A1",
                   giaTri: m.soLuongKho * (sp.giaVonDuKien || 0),
                   donGia: sp.giaVonDuKien || 0,
                   giaBanLe: sp.giaBanLe || 0,
                   giaBanSi: sp.giaBanSi || 0,
                   chiTietSize: sp.bangSize?.sizes?.map((size: string, index: number) => {
                       const tongRatio = sp.bangSize!.ratios.reduce((s: number, r: number) => s + r, 0) || 1;
                       const ratio = sp.bangSize!.ratios[index] || 0;
                       return { size, sl: Math.round((ratio / tongRatio) * m.soLuongKho!) };
                   }) || [],
                 });
              }
           }
        }
        
        if (changed) {
          localStorage.setItem(KHO_KEY, JSON.stringify(khoData));
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("mimin:kho-thanh-pham-changed"));
          }
        }
      }
    } catch (e) {
      console.error("Lỗi đồng bộ local kho_thanh_pham:", e);
    }

    if (isSupabaseEnabled && sp.dsMau && Array.isArray(sp.dsMau)) {
      try {
        const { supabase } = await import("@/lib/supabase/client");
        if (supabase) {
           for (const m of sp.dsMau) {
              if (m.soLuongKho !== undefined) {
                 const variantUpdates: any = {};
                 if (m.img) {
                    variantUpdates.hinh_anh = [m.img, ...(m.hinhAnhChiTiet || [])];
                 }
                 if ((m as any).imgQuan) {
                   variantUpdates.img_quan = (m as any).imgQuan;
                 }
                 if (m.video !== undefined) {
                   variantUpdates.video = m.video;
                 }
                 if (m.maSKU !== undefined) {
                   variantUpdates.ma_sku = m.maSKU;
                 }
                 
                 const newRow: any = {
                    id: `TP${Date.now().toString().slice(-6)}${Math.random().toString(36).substring(2,5)}`,
                    ma_sp: sp.id,
                    ten_sp: sp.tenSP || sp.id,
                    mau: m.ten,
                    so_luong: m.soLuongKho,
                    trang_thai: m.soLuongKho > 0 ? "con" : "het",
                    ngay_nhap: new Date().toISOString(),
                    phan_loai: sp.loaiSP || "AoPolo",
                    ...variantUpdates
                 };
                 if (sp.bangSize && sp.bangSize.sizes) {
                    const tongRatio = sp.bangSize.ratios.reduce((s: number, r: number) => s + r, 0) || 1;
                    let conLai = m.soLuongKho;
                    newRow.chi_tiet_size = sp.bangSize.sizes.map((size: string, index: number) => {
                       if (index === sp.bangSize.sizes.length - 1) return { size, sl: conLai };
                       const ratio = sp.bangSize.ratios[index] || 0;
                       const chia = Math.round((ratio / tongRatio) * m.soLuongKho!);
                       conLai -= chia;
                       return { size, sl: Math.max(0, chia) };
                    });
                 }
                 await supabase.from("kho_thanh_pham").insert([newRow]);
              }
           }
        }
      } catch (e) {
        console.error("Lỗi đồng bộ kho_thanh_pham khi themSP:", e);
      }
    }
  }, [setDsSanPham]);

  const suaSP = useCallback(async (id: string, data: Partial<SanPham>) => {
    setDsSanPham((prev) => {
      const exists = prev.some((p) => p.id === id);
      if (exists) {
        // Update record đã có
        return prev.map((p) => p.id === id ? { ...p, ...data, ngayCapNhat: new Date().toISOString().slice(0, 10) } : p);
      } else {
        // SP từ kho chưa có trong danh mục → thêm mới
        const newSP: SanPham = { id, tenSP: "", loaiSP: "BoTru", ...data, ngayCapNhat: new Date().toISOString().slice(0, 10) } as SanPham;
        return [...prev, newSP];
      }
    });

    // Đồng bộ lập tức vào localStorage của Kho Thành Phẩm
    let localChanged = false;
    let newKhoData: any = null;
    if (data.loaiSP || data.tenSP || data.dsMau || data.hinhAnh) {
      try {
        const KHO_KEY = "mimin_kho_thanh_pham_v2";
        const raw = localStorage.getItem(KHO_KEY);
        if (raw) {
          let khoData = JSON.parse(raw);
          let changed = false;
          khoData = khoData.map((item: any) => {
              if (item.maSP === id) {
                  let updated = { ...item };
                  if (data.tenSP) updated.tenSP = data.tenSP;
                  if (data.loaiSP) updated.phanLoai = data.loaiSP;
                  if (data.giaVonDuKien !== undefined) {
                      updated.donGia = data.giaVonDuKien;
                      updated.giaTri = (updated.soLuong || 0) * data.giaVonDuKien;
                  }
                  if (data.giaBanLe !== undefined) updated.giaBanLe = data.giaBanLe;
                  if (data.giaBanSi !== undefined) updated.giaBanSi = data.giaBanSi;
                  if (data.dsMau && Array.isArray(data.dsMau)) {
                     const matchedMau = data.dsMau.find((m: any) => m.ten === item.mau);
                     if (matchedMau) {
                        if (matchedMau.img) {
                           updated.hinhAnh = [matchedMau.img, ...(matchedMau.hinhAnhChiTiet || [])];
                        }
                        if (matchedMau.maSKU) {
                           updated.maSKU = matchedMau.maSKU;
                        }
                        if ((matchedMau as any).imgQuan) {
                           updated.imgQuan = (matchedMau as any).imgQuan;
                        }
                        if (matchedMau.video !== undefined) {
                           updated.video = matchedMau.video;
                        }
                        if (matchedMau.soLuongKho !== undefined) {
                            let newSoLuong = 0;
                            if (!(matchedMau as any)._localProcessed) {
                                newSoLuong = matchedMau.soLuongKho;
                                (matchedMau as any)._localProcessed = true;
                            } else {
                                newSoLuong = 0;
                            }
                            if (updated.soLuong !== newSoLuong) {
                                updated.soLuong = newSoLuong;
                                updated.trangThai = newSoLuong > 0 ? "con" : "het";
                                if (data.giaVonDuKien !== undefined) {
                                    updated.giaTri = newSoLuong * data.giaVonDuKien;
                                }
                                if (data.bangSize && data.bangSize.sizes) {
                                    const tongRatio = data.bangSize.ratios.reduce((s: number, r: number) => s + r, 0) || 1;
                                    let conLai = newSoLuong;
                                    updated.chiTietSize = data.bangSize.sizes.map((size: string, index: number) => {
                                        if (index === data.bangSize.sizes.length - 1) return { size, sl: conLai };
                                        const ratio = data.bangSize.ratios[index] || 0;
                                        const chia = Math.round((ratio / tongRatio) * newSoLuong);
                                        conLai -= chia;
                                        return { size, sl: Math.max(0, chia) };
                                    });
                                }
                            }
                        }
                     }
                  }
                  changed = true;
                  return updated;
              }
              return item;
          });

          // Xử lý xóa biến thể
          if (data.dsMau && Array.isArray(data.dsMau)) {
             const keepColors = data.dsMau.map(m => m.ten);
             const originalLength = khoData.length;
             khoData = khoData.filter((x: any) => !(x.maSP === id && !keepColors.includes(x.mau)));
             if (khoData.length !== originalLength) {
                 changed = true;
             }

             for (let i = 0; i < data.dsMau.length; i++) {
                const m = data.dsMau[i];
                const existingColor = khoData.find((x: any) => x.maSP === id && x.mau === m.ten);
                if (!existingColor && m.soLuongKho !== undefined) {
                   changed = true;
                   khoData.push({
                      id: `TP${Date.now().toString().slice(-6)}${i}`,
                      maSP: id,
                      tenSP: data.tenSP || id,
                      mau: m.ten,
                      soLuong: m.soLuongKho,
                      trangThai: m.soLuongKho > 0 ? "con" : "het",
                      ngayNhap: new Date().toISOString().slice(0, 10),
                      phanLoai: data.loaiSP || "BoTru",
                      maSKU: m.maSKU,
                      hinhAnh: m.img ? [m.img, ...(m.hinhAnhChiTiet || [])] : [],
                      imgQuan: (m as any).imgQuan,
                      video: m.video,
                      viTri: "Khu A1",
                      giaTri: m.soLuongKho * (data.giaVonDuKien || 0),
                      donGia: data.giaVonDuKien || 0,
                      giaBanLe: data.giaBanLe || 0,
                      giaBanSi: data.giaBanSi || 0,
                      chiTietSize: data.bangSize?.sizes?.map((size: string, index: number) => {
                          const tongRatio = data.bangSize!.ratios.reduce((s: number, r: number) => s + r, 0) || 1;
                          const ratio = data.bangSize!.ratios[index] || 0;
                          return { size, sl: Math.round((ratio / tongRatio) * m.soLuongKho!) };
                      }) || [],
                   });
                }
             }
          }

          if (changed) {
            localChanged = true;
            newKhoData = khoData;
            localStorage.setItem(KHO_KEY, JSON.stringify(khoData));
          }
        }
      } catch (e) {
        console.error("Lỗi đồng bộ local kho_thanh_pham:", e);
      }
    }

    if (isSupabaseEnabled && (data.loaiSP || data.tenSP || data.dsMau || data.hinhAnh)) {
      try {
        const { supabase } = await import("@/lib/supabase/client");
        if (supabase) {
          const updates: any = {};
          if (data.tenSP) updates.ten_sp = data.tenSP;
          if (data.loaiSP) updates.phan_loai = data.loaiSP;
          if (data.giaVonDuKien !== undefined) {
              updates.don_gia = data.giaVonDuKien;
          }
          if (data.giaBanLe !== undefined) updates.gia_ban_le = data.giaBanLe;
          if (data.giaBanSi !== undefined) updates.gia_ban_si = data.giaBanSi;

          if (Object.keys(updates).length > 0) {
            await supabase.from("kho_thanh_pham").update(updates).eq("ma_sp", id);
          }

          // 2. Specific update for variant images
          if (data.dsMau && Array.isArray(data.dsMau)) {
             for (const m of data.dsMau) {
               if (m.img || m.soLuongKho !== undefined) {
                 const variantUpdates: any = {};
                 if (m.img) {
                    variantUpdates.hinh_anh = [m.img, ...(m.hinhAnhChiTiet || [])];
                 }
                 if ((m as any).imgQuan) {
                   variantUpdates.img_quan = (m as any).imgQuan;
                 }
                 if (m.video !== undefined) {
                   variantUpdates.video = m.video;
                 }
                 
                 const { data: existingRows } = await supabase.from('kho_thanh_pham')
                    .select('id, so_luong')
                    .eq('ma_sp', id)
                    .eq('mau', m.ten)
                    .order('created_at', { ascending: false });

                 if (existingRows && existingRows.length > 0) {
                     const totalStock = existingRows.reduce((s: number, r: any) => s + (r.so_luong || 0), 0);
                     const firstRowId = existingRows[0].id;

                     if (m.soLuongKho !== undefined) {
                        // Consolidate rows: put ALL stock into the first row
                        if (m.soLuongKho !== existingRows[0].so_luong || existingRows.length > 1) {
                           variantUpdates.so_luong = m.soLuongKho;
                           if (data.bangSize && data.bangSize.sizes) {
                              const tongRatio = data.bangSize.ratios.reduce((s: number, r: number) => s + r, 0) || 1;
                              let conLai = variantUpdates.so_luong;
                              variantUpdates.chi_tiet_size = data.bangSize.sizes.map((size: string, index: number) => {
                                 if (index === data.bangSize.sizes.length - 1) return { size, sl: conLai };
                                 const ratio = data.bangSize.ratios[index] || 0;
                                 const chia = Math.round((ratio / tongRatio) * variantUpdates.so_luong);
                                 conLai -= chia;
                                 return { size, sl: Math.max(0, chia) };
                              });
                           }
                           variantUpdates.trang_thai = variantUpdates.so_luong > 0 ? "con" : "het";
                        }
                     }
                     if (Object.keys(variantUpdates).length > 0) {
                        if (variantUpdates.so_luong !== undefined) {
                            await supabase.from("kho_thanh_pham").update(variantUpdates).eq("id", firstRowId);
                            const imageUpdates = { ...variantUpdates };
                            delete imageUpdates.so_luong;
                            delete imageUpdates.chi_tiet_size;
                            delete imageUpdates.trang_thai;
                            
                            if (existingRows.length > 1) {
                               await supabase.from("kho_thanh_pham").update({...imageUpdates, so_luong: 0, trang_thai: 'het'}).eq("ma_sp", id).eq("mau", m.ten).neq("id", firstRowId);
                            }
                        } else {
                            await supabase.from("kho_thanh_pham").update(variantUpdates).eq("ma_sp", id).eq("mau", m.ten);
                        }
                     }
                     } else if (m.soLuongKho !== undefined) {
                        const newRow: any = {
                           id: `TP${Date.now().toString().slice(-6)}${Math.random().toString(36).substring(2,5)}`,
                           ma_sp: id,
                           ten_sp: data.tenSP || id,
                           mau: m.ten,
                           so_luong: m.soLuongKho,
                           trang_thai: m.soLuongKho > 0 ? "con" : "het",
                           ngay_nhap: new Date().toISOString(),
                           phan_loai: data.loaiSP || "AoPolo",
                           lsx: `LTK-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${Date.now().toString().slice(-6)}`,
                           vi_tri: "Khu A1",
                           don_gia: data.giaVonDuKien || 0,
                           gia_tri: (m.soLuongKho || 0) * (data.giaVonDuKien || 0),
                           gia_ban_le: data.giaBanLe || 0,
                           gia_ban_si: data.giaBanSi || 0,
                           ...variantUpdates
                        };
                        if (data.bangSize && data.bangSize.sizes) {
                           const tongRatio = data.bangSize.ratios.reduce((s: number, r: number) => s + r, 0) || 1;
                           let conLai = m.soLuongKho;
                           newRow.chi_tiet_size = data.bangSize.sizes.map((size: string, index: number) => {
                              if (index === data.bangSize.sizes.length - 1) return { size, sl: conLai };
                              const ratio = data.bangSize.ratios[index] || 0;
                              const chia = Math.round((ratio / tongRatio) * m.soLuongKho!);
                              conLai -= chia;
                              return { size, sl: Math.max(0, chia) };
                           });
                        }
                        const { error } = await supabase.from("kho_thanh_pham").insert([newRow]);
                        if (error) {
                            console.error("Lỗi insert kho_thanh_pham:", error);
                        }
                     }
                 }
               }
               
               // 3. Xoá các variant đã bị xoá khỏi danh mục khỏi kho_thanh_pham Supabase
               const { data: currentRows } = await supabase.from('kho_thanh_pham').select('id, mau').eq('ma_sp', id);
               if (currentRows && currentRows.length > 0) {
                   const existingColors = data.dsMau.map(m => m.ten);
                   const idsToDelete = currentRows.filter(r => !existingColors.includes(r.mau)).map(r => r.id);
                   if (idsToDelete.length > 0) {
                       await supabase.from('kho_thanh_pham').delete().in('id', idsToDelete);
                   }
               }
             }
          }
        } catch (e) {
          console.error("Lỗi đồng bộ kho_thanh_pham khi suaSP:", e);
        }
    }
  }, [setDsSanPham]);

  const xoaSP = useCallback(async (id: string, u?: AppUser | null) => {
    setDsSanPham((prev) => {
      const deletedItem = prev.find((p) => p.id === id);
      if (deletedItem) {
        // Need to import logCRUD at top of file, or just use it if available
        import("../audit-log").then(({ logCRUD }) => {
          logCRUD(u || null, "danh-muc-sp" as any, "delete", deletedItem.ten, id, { oldValue: deletedItem });
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

  // Hook này tự động sync, hàm refresh giữ lại để tương thích API cũ nhưng ko cần làm gì
  const refresh = useCallback(() => {}, []);

  return (
    <DanhMucSPContext.Provider value={{ dsSanPham, themSP, suaSP, xoaSP, loading, refresh }}>
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
